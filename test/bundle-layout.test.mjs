import assert from 'node:assert/strict';
import {test} from 'node:test';
import {cpSync,existsSync,linkSync,mkdirSync,mkdtempSync,readFileSync,realpathSync,rmSync,symlinkSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {parseHTML} from 'linkedom';
import {chromium} from 'playwright-core';
import {selectOutput} from '../builder/output-policy.mjs';
import {resolveBundleRoot} from '../builder/bundle-layout.mjs';
import {prepareBuild} from '../builder/pipeline.mjs';
import {inspectArchitectureSet,rebuildArchitectureSet} from '../skills/pflow-rebuild/scripts/rebuild.mjs';
import {writeStandaloneHTML} from '../builder/html.mjs';
const tool=fileURLToPath(new URL('../',import.meta.url)),sample=path.join(tool,'test/fixtures/prompt-mode/onboarding/bundle');
function setup(t,layout='flat'){
 const root=realpathSync(mkdtempSync(path.join(tmpdir(),'pflow-layout-')));t.after(()=>rmSync(root,{recursive:true,force:true}));const bundle=path.join(root,'architecture');mkdirSync(bundle);cpSync(sample,bundle,{recursive:true});
 if(layout==='flat'){cpSync(path.join(bundle,'docs'),bundle,{recursive:true});mkdirSync(path.join(bundle,'diagrams'));writeFileSync(path.join(bundle,'diagrams/architecture.json'),readFileSync(path.join(bundle,'architecture.json')));rmSync(path.join(bundle,'architecture.json'));rmSync(path.join(bundle,'docs'),{recursive:true});const file=path.join(bundle,'flows/process.md');writeFileSync(file,readFileSync(file,'utf8').replaceAll(']: ../../evidence/',']: ../evidence/'));}
 const output=path.join(bundle,'architecture.html');return {root,bundle,output,options:{input:bundle,repositoryRoot:root,output}};
}
const cli=f=>spawnSync(process.execPath,[path.join(tool,'builder/cli.mjs'),'build','--input',f.bundle,'--repository-root',f.root,'--output',f.output],{encoding:'utf8'});
for(const layout of ['legacy','flat'])test(`${layout} bundle uses identical contracts, canonical docs and exact evidence in standalone output`,t=>{
 const f=setup(t,layout),resolved=resolveBundleRoot(f.bundle);assert.equal(resolved.layout,layout);const prepared=prepareBuild(f.options);assert.equal(prepared.artifacts[0].docsRoot,resolved.docsRoot);assert.deepEqual(prepared.artifacts[0].documents.map(d=>d.path),['flows/process.md','index.md']);assert.equal(cli(f).status,0);
 const document=parseHTML(readFileSync(f.output,'utf8')).document,payload=JSON.parse(document.getElementById('pflow-data').textContent)[0];assert.deepEqual(payload.architecture,prepared.artifacts[0].architecture);assert.ok(payload.documents.some(d=>d.sections.some(s=>s.id==='flow_p02')));assert.ok(payload.snippets.some(s=>s.lines.some(l=>l.number===5&&l.text.includes('stop this attempt'))));assert.equal(document.querySelectorAll('script[src],link,[src],[srcset]').length,0);assert.ok(!readFileSync(f.output,'utf8').includes(f.root));const bytes=readFileSync(f.output);assert.equal(cli(f).status,0);assert.deepEqual(readFileSync(f.output),bytes);
 if(layout==='legacy')assert.equal(existsSync(path.join(f.bundle,'diagrams')),false);else assert.equal(existsSync(path.join(f.bundle,'docs')),false);
});
for(const kind of ['graphs','corpora','diagram-docs'])test(`competing ${kind} fail clearly and preserve prior HTML`,t=>{
 const f=setup(t);assert.equal(cli(f).status,0);const bytes=readFileSync(f.output);
 if(kind==='graphs')writeFileSync(path.join(f.bundle,'architecture.json'),readFileSync(path.join(f.bundle,'diagrams/architecture.json')));
 if(kind==='corpora'){mkdirSync(path.join(f.bundle,'docs'));writeFileSync(path.join(f.bundle,'docs/index.md'),'# Competing corpus\n');}
 if(kind==='diagram-docs'){mkdirSync(path.join(f.bundle,'diagrams/docs'));writeFileSync(path.join(f.bundle,'diagrams/docs/index.md'),'# Competing corpus\n');}
 const result=cli(f);assert.equal(result.status,1);assert.match(result.stderr,/Ambiguous/);assert.deepEqual(readFileSync(f.output),bytes);
});
test('a legacy bundle named diagrams stays legacy; flat input cannot read above its selected root',t=>{
 const f=setup(t,'legacy'),nested=path.join(f.root,'diagrams');cpSync(f.bundle,nested,{recursive:true});assert.equal(resolveBundleRoot(nested).layout,'legacy');const flat=setup(t);assert.throws(()=>prepareBuild({...flat.options,input:path.join(flat.bundle,'diagrams')}),e=>e.diagnostics.some(d=>/escapes input root/.test(d.message)));
});
for(const kind of ['source-traversal','source-symlink','document-symlink','line-range','anchor'])test(`flat ${kind} violation blocks publication`,t=>{
 const f=setup(t);assert.equal(cli(f).status,0);const before=readFileSync(f.output),resolved=resolveBundleRoot(f.bundle),g=JSON.parse(readFileSync(resolved.graphPath));
 if(kind==='source-traversal')g.sources[0].path='../outside.md';
 if(kind==='source-symlink'){const p=path.join(f.bundle,'evidence/request.md');rmSync(p);symlinkSync(path.join(tool,'README.md'),p);}
 if(kind==='document-symlink'){const p=path.join(f.bundle,'flows/process.md');rmSync(p);symlinkSync(path.join(tool,'README.md'),p);}
 if(kind==='line-range')g.sources[0].endLine=999;
 if(kind==='anchor')g.flows[0].docs[0].anchor='flow_missing';
 writeFileSync(resolved.graphPath,JSON.stringify(g));const result=cli(f);assert.equal(result.status,1);assert.match(result.stderr,/semantic|markdown/);assert.deepEqual(readFileSync(f.output),before);
});
test('flat Markdown roots participate in writer hardlink collision protection',t=>{
 const f=setup(t),prepared=prepareBuild(f.options),target=path.join(f.bundle,'index.html'),index=path.join(f.bundle,'index.md');linkSync(index,target);const bytes=readFileSync(index);assert.throws(()=>writeStandaloneHTML({...prepared,outputPath:target}),e=>e.diagnostics.some(d=>/overwrite an input/.test(d.message)));assert.deepEqual(readFileSync(index),bytes);
});
test('default prompt output integrates selection and flat generation in the same workspace',t=>{
 const f=setup(t),choice=selectOutput({mode:'prompt',cwd:f.root,create:true});cpSync(sample,choice.bundleRoot,{recursive:true});cpSync(path.join(choice.bundleRoot,'docs'),choice.bundleRoot,{recursive:true});rmSync(path.join(choice.bundleRoot,'docs'),{recursive:true});const g=JSON.parse(readFileSync(path.join(choice.bundleRoot,'architecture.json')));for(const s of g.sources)s.path=s.path.replace(/^architecture\//,'docs/architecture/');writeFileSync(choice.graphPath,JSON.stringify(g));rmSync(path.join(choice.bundleRoot,'architecture.json'));const md=path.join(choice.bundleRoot,'flows/process.md');writeFileSync(md,readFileSync(md,'utf8').replaceAll(']: ../../evidence/',']: ../evidence/'));const prepared=prepareBuild({input:choice.bundleRoot,repositoryRoot:choice.evidenceRoot,output:choice.outputPath});writeStandaloneHTML(prepared);assert.equal(prepared.artifacts[0].layout,'flat');assert.equal(existsSync(path.join(choice.bundleRoot,'evidence/request.md')),true);assert.equal(existsSync(path.join(choice.bundleRoot,'architecture/architecture.html')),false);
});
test('flat standalone HTML retains offline hierarchy, snippets and search after input removal',async t=>{
 const f=setup(t);assert.equal(cli(f).status,0);const moved=path.join(f.root,'standalone.html');writeFileSync(moved,readFileSync(f.output));rmSync(f.bundle,{recursive:true});const candidates=[process.env.PFLOW_BROWSER_PATH,'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome'].filter(Boolean),executablePath=candidates.find(p=>existsSync(p));const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});t.after(()=>browser.close());const context=await browser.newContext({offline:true,viewport:{width:1440,height:1000}}),page=await context.newPage();page.setDefaultTimeout(5000);const requests=[],errors=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(moved).href);await page.locator('.diagram-node[data-node-id="node_p03"] .diagram-expand-control').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#workspace-title').textContent(),'Prepare access');await page.getByRole('button',{name:'Back',exact:true}).click();await page.locator('.diagram-node[data-node-id="node_p06"] .diagram-node-select').focus();await page.keyboard.press('Enter');await page.getByRole('tab',{name:'Details',exact:true}).click();await page.locator('#source-references button').first().click();assert.match(await page.locator('#source-snippet li[value="5"] code').textContent(),/stop this attempt/);await page.keyboard.press('Control+k');await page.locator('#global-search').fill('sign-in');await page.waitForFunction(()=>document.querySelectorAll('.search-result').length>0);await page.keyboard.press('Enter');assert.ok(await page.locator('mark.search-match').count()>0);assert.deepEqual(requests,[pathToFileURL(moved).href]);assert.deepEqual(errors,[]);
});

test('independent nested legacy envelope named diagrams stays distinct from parent legacy bundle',t=>{const f=setup(t,'legacy'),child=path.join(f.bundle,'diagrams');cpSync(sample,child,{recursive:true});const childGraph=JSON.parse(readFileSync(path.join(child,'architecture.json')));for(const s of childGraph.sources)s.path=s.path.replace('architecture/evidence/','architecture/diagrams/evidence/');writeFileSync(path.join(child,'architecture.json'),JSON.stringify(childGraph));const prepared=prepareBuild(f.options);assert.equal(prepared.artifacts.length,2);assert.ok(prepared.artifacts.every(a=>a.layout==='legacy'));assert.deepEqual(prepared.artifacts.map(a=>a.path),['architecture.json','diagrams/architecture.json']);});

test('flat prompt evidence participates in rebuild freshness without requiring Git',async t=>{const f=setup(t);assert.equal(cli(f).status,0);const before=readFileSync(f.output),inspection=await inspectArchitectureSet(f.options),evidence=path.join(f.bundle,'evidence/request.md');await assert.rejects(rebuildArchitectureSet({...f.options,indexReview:{digest:inspection.digest,outcome:'pass',findings:[]},beforeCommit:()=>writeFileSync(evidence,readFileSync(evidence,'utf8')+'\nA concurrent clarification.\n')}),e=>e.diagnostics?.some(d=>d.phase==='freshness'));assert.deepEqual(readFileSync(f.output),before);});
