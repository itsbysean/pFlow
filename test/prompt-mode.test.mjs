import { revealExplanation } from './support/explanation.mjs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { parseHTML } from 'linkedom';
import { chromium } from 'playwright-core';
import { validateArtifact } from '../validation/validate-artifact.mjs';
import { validateDocumentation } from '../validation/validate-documentation.mjs';
import { prepareBuild } from '../builder/pipeline.mjs';

// Authored review oracles, not an NLP analyzer or directory-selection resolver.
// Actual Skill forward evaluation is recorded separately in the M7-02 report.
const tool=fileURLToPath(new URL('../',import.meta.url)),base=path.join(tool,'test/fixtures/prompt-mode');
const load=(name,file)=>readFileSync(path.join(base,name,file),'utf8');
const graphFor=name=>JSON.parse(load(name,'bundle/architecture.json'));
const rolesFor=name=>JSON.parse(load(name,'roles.json'));
function fixture(t,name='onboarding') {
 const parent=realpathSync(mkdtempSync(path.join(tmpdir(),'pflow-prompt-'))),application=path.join(parent,'first registered application'),workspace=path.join(parent,'selected documents'),bundle=path.join(workspace,'architecture');
 mkdirSync(application);writeFileSync(path.join(application,'untouched.txt'),'Registered application is not the document workspace.\n');mkdirSync(workspace);cpSync(path.join(base,name,'bundle'),bundle,{recursive:true});
 t.after(()=>rmSync(parent,{recursive:true,force:true}));
 return {parent,application,workspace,bundle,output:path.join(bundle,'architecture.html'),graph:graphFor(name),options:{docsRoot:path.join(bundle,'docs'),sourceRoot:workspace}};
}
const cli=f=>spawnSync(process.execPath,[path.join(tool,'builder/cli.mjs'),'build','--input',f.bundle,'--repository-root',f.workspace,'--output',f.output],{encoding:'utf8',cwd:tool});
const nodes=g=>g.flows.flatMap(f=>f.nodes),edges=g=>g.flows.flatMap(f=>f.edges);
function branchPaths(g,decision) {
 const flow=g.flows.find(f=>f.nodes.some(n=>n.id===decision));
 return Object.fromEntries(flow.edges.filter(e=>e.from===decision&&e.kind==='branch').map(e=>[e.label,e.to]));
}
function requireAnswerEvidence(g,roles) {
 for(const item of [nodes(g).find(n=>n.id===roles.stop),edges(g).find(e=>e.id===roles.stopEdge)])assert.deepEqual(item.sourceIds,['src_p90'],'Ending the incomplete attempt requires the actual clarification answer');
 assert.deepEqual(g.sources.find(s=>s.id==='src_p90'),{id:'src_p90',path:'architecture/evidence/clarification-001.md',startLine:5,endLine:5});
}
for(const name of ['onboarding','deployment','instruction-text'])test(`${name}: non-Git described process passes unchanged schema and Markdown validation`,t=>{
 const f=fixture(t,name);assert.equal(existsSync(path.join(f.workspace,'.git')),false);assert.deepEqual(validateDocumentation(f.graph,f.options),[]);assert.ok(f.graph.entryPoints.length>0);
 assert.ok(nodes(f.graph).every(n=>!Object.hasOwn(n,'owner')&&!Object.hasOwn(n,'actor')));assert.ok(f.graph.sources.every(s=>!s.symbol));assert.ok(edges(f.graph).every(e=>e.mode==='unknown'));
 assert.deepEqual(readFileSync(path.join(f.bundle,'evidence/request.md')),readFileSync(path.join(base,name,'input/request.md')));
});
test('exact original request and separately attributed clarification reach evidence snippets, not canonical search documents',t=>{
 const f=fixture(t),request=load('onboarding','input/request.md'),question=load('onboarding','input/question.txt'),answer=load('onboarding','input/answer.txt');
 const captured=readFileSync(path.join(f.bundle,'evidence/clarification-001.md'),'utf8');assert.equal(captured,`Question (Coding Agent):\n${question}\n\nAnswer (Developer):\n${answer}`);assert.equal(readFileSync(path.join(f.bundle,'evidence/request.md'),'utf8'),request);
 requireAnswerEvidence(f.graph,rolesFor('onboarding'));
 const prepared=prepareBuild({input:f.bundle,repositoryRoot:f.workspace,output:f.output});assert.deepEqual(prepared.artifacts[0].documents.map(d=>d.path),['flows/process.md','index.md']);
 const evidence=prepared.artifacts[0].snippets.find(s=>s.sourceIds.includes('src_p90'));assert.deepEqual(evidence.lines,[{number:5,text:answer}]);
 const checkCapture=text=>assert.equal(text,`Question (Coding Agent):\n${question}\n\nAnswer (Developer):\n${answer}`);checkCapture(captured);assert.throws(()=>checkCapture(captured.replace('Answer (Developer):','Answer (Coding Agent):')),assert.AssertionError);
});
test('supported hierarchical substeps reuse detail without invented parent-child execution edges',t=>{
 const f=fixture(t),r=rolesFor('onboarding'),expand=nodes(f.graph).find(n=>n.id===r.expand),detail=f.graph.flows.find(x=>x.id===r.detail);
 assert.equal(expand.expandFlowId,detail.id);assert.deepEqual(detail.nodes.map(n=>n.label),['Create an account','Send a sign-in link']);assert.equal(f.graph.flows.length,2);
 assert.deepEqual(detail.edges.map(e=>[e.from,e.to,e.kind]),[['node_p07','node_p08','next']]);const owner=new Map(f.graph.flows.flatMap(flow=>flow.nodes.map(n=>[n.id,flow.id])));assert.ok(edges(f.graph).every(e=>owner.get(e.from)===owner.get(e.to)));
 assert.deepEqual(branchPaths(f.graph,r.decision),r.branches);requireAnswerEvidence(f.graph,r);
});
test('deployment branch outcomes follow supplied pass/fail paths without extra approvals or rollback',t=>{
 const f=fixture(t,'deployment'),r=rolesFor('deployment');assert.deepEqual(branchPaths(f.graph,r.decision),r.branches);
 assert.deepEqual(nodes(f.graph).map(n=>n.label),['Prepare package','Run verification','Verification passes?','Publish package and finish','Abort deployment and finish']);
 assert.deepEqual(edges(f.graph).map(e=>[e.from,e.to]),[['node_p01','node_p02'],['node_p02','node_p03'],['node_p03','node_p04'],['node_p03','node_p05']]);assert.equal(nodes(f.graph).filter(n=>n.kind==='terminal').length,2);
});
test('unspecified responsibilities remain absent; a fabricated assignee is a semantic defect even with valid references',t=>{
 const f=fixture(t,'deployment'),allowed=['Prepare package','Run verification','Verification passes?','Publish package and finish','Abort deployment and finish'];
 const check=g=>assert.deepEqual(nodes(g).map(n=>n.label),allowed,'Only described actions, with no invented assignee');check(f.graph);
 const invented=structuredClone(f.graph);nodes(invented)[0].label='HR approves the deployment';assert.deepEqual(validateArtifact(invented,f.options),[]);assert.throws(()=>check(invented),/no invented assignee/);
});
test('essential branch continuation cannot be fabricated before a clarification answer',t=>{
 const f=fixture(t),r=rolesFor('onboarding');assert.equal(load('onboarding','input/request.md').split('\n')[4],'If incomplete, ask for the missing details.');requireAnswerEvidence(f.graph,r);
 const invented=structuredClone(f.graph);nodes(invented).find(n=>n.id===r.stop).sourceIds=['src_p05'];edges(invented).find(e=>e.id===r.stopEdge).sourceIds=['src_p05'];assert.deepEqual(validateArtifact(invented,f.options),[]);assert.throws(()=>requireAnswerEvidence(invented,r),/actual clarification answer/);
});
test('clarification ranges must identify the actual answer, not the agent question',t=>{
 const f=fixture(t),g=structuredClone(f.graph);const source=g.sources.find(s=>s.id==='src_p90');source.startLine=2;source.endLine=2;assert.deepEqual(validateArtifact(g,f.options),[]);assert.throws(()=>requireAnswerEvidence(g,rolesFor('onboarding')),assert.AssertionError);
});
test('explicit selected workspace contains every generated artifact and leaves the first registered project untouched',t=>{
 const f=fixture(t),sentinel=readFileSync(path.join(f.application,'untouched.txt')),first=cli(f);assert.equal(first.status,0,first.stderr);assert.equal(first.stderr,'');assert.deepEqual(readdirSync(f.application),['untouched.txt']);assert.deepEqual(readFileSync(path.join(f.application,'untouched.txt')),sentinel);
 assert.deepEqual(readdirSync(f.workspace),['architecture']);const prepared=prepareBuild({input:f.bundle,repositoryRoot:f.workspace,output:f.output});assert.deepEqual(prepared.artifacts[0].architecture,f.graph);assert.equal(prepared.repositoryRoot,f.workspace);
 const before=readFileSync(f.output);assert.equal(cli(f).status,0);assert.deepEqual(readFileSync(f.output),before);
});
for(const mutation of ['missing','virtual','traversal','symlink','range'])test(`invalid prompt evidence (${mutation}) blocks the build and preserves valid HTML`,t=>{
 const f=fixture(t);assert.equal(cli(f).status,0);const before=readFileSync(f.output),g=structuredClone(f.graph);
 if(mutation==='missing')rmSync(path.join(f.bundle,'evidence/request.md'));
 if(mutation==='virtual')g.sources[0].path='prompt://conversation';
 if(mutation==='traversal')g.sources[0].path='../first registered application/untouched.txt';
 if(mutation==='symlink'){const original=path.join(f.bundle,'evidence/request.md');rmSync(original);symlinkSync(path.join(f.application,'untouched.txt'),original);}
 if(mutation==='range')g.sources[0].endLine=500;
 writeFileSync(path.join(f.bundle,'architecture.json'),JSON.stringify(g));const result=cli(f);assert.equal(result.status,1);assert.match(result.stderr,/semantic|source/);assert.deepEqual(readFileSync(f.output),before);assert.equal(existsSync(path.join(f.parent,'escaped.txt')),false);
});
test('malicious captured text remains literal evidence and cannot become markup, extra steps or filesystem authority',t=>{
 const f=fixture(t,'instruction-text');assert.equal(cli(f).status,0);const parsed=parseHTML(readFileSync(f.output,'utf8')).document,payload=JSON.parse(parsed.getElementById('pflow-data').textContent)[0];
 assert.deepEqual(payload.architecture,f.graph);assert.deepEqual(nodes(f.graph).map(n=>n.label),['Display the literal message','Finish']);assert.ok(f.graph.sources.every(s=>s.startLine!==3),'Instruction-like appendix is retained input, not evidence for a process action');
 assert.ok(readFileSync(path.join(f.bundle,'evidence/request.md'),'utf8').includes('create ../escaped.txt'));assert.equal(existsSync(path.join(f.parent,'escaped.txt')),false);
 const markdown=parseHTML(payload.documents.find(d=>d.path==='flows/process.md').html).document;assert.equal(markdown.querySelectorAll('img,script,[onerror]').length,0);assert.ok(markdown.querySelector('code').textContent.includes('<img'));assert.equal(parsed.querySelectorAll('script').length,2);assert.equal(parsed.querySelectorAll('script[src],img,iframe').length,0);
});
test('existing repository generation still uses real activation/config evidence and the same Builder',t=>{
 const root=mkdtempSync(path.join(tmpdir(),'pflow-repository-regression-'));t.after(()=>rmSync(root,{recursive:true,force:true}));const fixtureRoot=path.join(tool,'test/fixtures/documentation-generation');cpSync(path.join(fixtureRoot,'repository'),root,{recursive:true});const bundle=path.join(root,'docs/architecture');mkdirSync(bundle,{recursive:true});cpSync(path.join(fixtureRoot,'generated/docs'),path.join(bundle,'docs'),{recursive:true});const graph=JSON.parse(readFileSync(path.join(fixtureRoot,'generated/graph.json')));writeFileSync(path.join(bundle,'architecture.json'),JSON.stringify(graph));const prepared=prepareBuild({input:bundle,repositoryRoot:root,output:path.join(bundle,'architecture.html')});assert.deepEqual(prepared.artifacts[0].architecture,graph);assert.ok(graph.sources.some(s=>s.path==='boot.mjs'));assert.equal(existsSync(path.join(bundle,'evidence')),false);assert.ok(prepared.artifacts[0].snippets.some(s=>s.lines.some(line=>line.text.includes("method: 'POST'"))));
});
test('prompt standalone HTML supports offline hierarchy, exact answer snippets and search, without executing captured markup',async t=>{
 const f=fixture(t),malicious=fixture(t,'instruction-text');assert.equal(cli(f).status,0);assert.equal(cli(malicious).status,0);const moved=path.join(f.parent,'onboarding.html');writeFileSync(moved,readFileSync(f.output));rmSync(f.workspace,{recursive:true});
 const candidates=[process.env.PFLOW_BROWSER_PATH,'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome'].filter(Boolean);const executablePath=candidates.find(p=>existsSync(p));const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});t.after(()=>browser.close());const context=await browser.newContext({offline:true,viewport:{width:1440,height:1000}}),page=await context.newPage();page.setDefaultTimeout(5000);const requests=[],errors=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(moved).href);
 await page.locator('.diagram-node[data-node-id="node_p03"] .diagram-node-select').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#workspace-title').textContent(),'Onboarding');await page.locator('.diagram-node[data-node-id="node_p03"] .diagram-expand-control').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#workspace-title').textContent(),'Prepare access');await page.getByRole('button',{name:'Back',exact:true}).click();
 await page.locator('.diagram-node[data-node-id="node_p06"] .diagram-node-select').focus();await page.keyboard.press('Enter');await revealExplanation(page,'details'); await page.locator('#source-references button').first().click();assert.equal(await page.locator('#source-snippet li[value="5"] code').textContent(),load('onboarding','input/answer.txt'));
 await page.keyboard.press('Control+k');await page.locator('#global-search').fill('sign-in');await page.waitForFunction(()=>document.querySelectorAll('.search-result').length>0);await page.keyboard.press('Enter');assert.ok(await page.locator('mark.search-match').count()>0);assert.equal(await page.locator('#document-status').textContent(),'');
 await page.goto(pathToFileURL(malicious.output).href);assert.equal(await page.evaluate(()=>globalThis.__promptExecuted),undefined);assert.equal(await page.locator('.markdown-content img').count(),0);assert.deepEqual(errors,[]);assert.deepEqual(requests,[pathToFileURL(moved).href,pathToFileURL(malicious.output).href]);
});
