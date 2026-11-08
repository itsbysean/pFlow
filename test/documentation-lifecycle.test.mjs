import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync, cpSync, symlinkSync, statSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright-core';
import { detectDocumentation, planLifecycle, prepareLifecycle } from '../lifecycle/documentation.mjs';
import { selectOutput } from '../builder/output-policy.mjs';
import { prepareBuild } from '../builder/pipeline.mjs';
import { fingerprintBundle } from '../src/skills/pflow-regenerate/scripts/safe-update.mjs';
import { buildSkill } from '../packaging/build-skill.mjs';
const project=fileURLToPath(new URL('../',import.meta.url));
const json=x=>JSON.stringify(x,null,2)+'\n';
const put=(file,text)=>{mkdirSync(path.dirname(file),{recursive:true});writeFileSync(file,text);};
function fixture(t,{prompt=false,mixed=false}={}) {
 const directory=realpathSync(mkdtempSync(path.join(tmpdir(),'pflow-lifecycle-test-'))), evidence=path.join(directory,'workspace'), bundle=path.join(evidence,'architecture');mkdirSync(evidence);
 t.after(()=>rmSync(directory,{recursive:true,force:true}));
 const graph={modelVersion:'1.0.0',entryPoints:[],flows:[],sources:[]},scopes=[],evidenceUpdates={};
 for(const key of ['one','two','shared']) {
  const natural=prompt || mixed&&key==='one', sourcePath=natural?`architecture/evidence/${key}.md`:`source/${key}.txt`;
  if(natural)evidenceUpdates[`evidence/${key}.md`]=`${key}: Request → Review → Completion. 담당자 unspecified.\n`;
  else put(path.join(evidence,sourcePath),`${key}: invoke shared operation\n`);
  scopes.push({path:natural?'architecture/evidence':sourcePath,kind:natural?'natural-language':'code',flowIds:natural?['flow_one','flow_two','flow_shared']:[]});
  graph.sources.push({id:`src_${key}`,path:sourcePath,startLine:1,endLine:1});
  graph.flows.push({id:`flow_${key}`,label:key,startNodeId:`node_${key}`,nodes:[{id:`node_${key}`,label:`${key} step`,kind:'operation',sourceIds:[`src_${key}`],...(['one','two'].includes(key)?{expandFlowId:'flow_shared'}:{})}],edges:[],docs:[{path:`flows/${key}.md`,anchor:`flow_${key}`}]});
  if(key!=='shared')graph.entryPoints.push({id:`entry_${key}`,label:`Start ${key}`,flowId:`flow_${key}`,trigger:'Confirmed process starts',sourceIds:[`src_${key}`],docs:[{path:`flows/${key}.md`,anchor:`entry_${key}`}]});
 }
 const f={directory,evidence,bundle,graph,scopes:[...new Map(scopes.map(s=>[s.path,s])).values()],evidenceUpdates};
 return f;
}
function documents(f,g=f.graph) {
 const docs={'index.md':'# Process guide\n\nPurpose: explain the confirmed request process.\n\n'+g.flows.map(x=>`- [${x.label}](flows/${x.label}.md#${x.id})`).join('\n')+'\n'};
 for(const flow of g.flows) {
  const file=`flows/${flow.label}.md`,sections=[...g.entryPoints.filter(e=>e.flowId===flow.id),flow,...flow.nodes.filter(n=>n.docs?.length)],defs=new Set();
  docs[file]=`# ${flow.label} process\n\n`+sections.map(e=>{
   const ids=e.sourceIds||[...new Set([...flow.nodes,...flow.edges].flatMap(x=>x.sourceIds))];ids.forEach(id=>defs.add(id));
   return `<a id="${e.id}"></a>\n${e.id.startsWith('node_')?'###':'##'} ${e.label}\n\n${e.label}: perform only the supported steps. Evidence: ${ids.map(id=>`[${id}]`).join(', ')}.\n\n`;
  }).join('')+'## Evidence\n\n'+[...defs].map(id=>{
   const s=g.sources.find(x=>x.id===id),relative=path.relative(path.join(f.bundle,'flows'),path.join(f.evidence,s.path)).split(path.sep).join('/');
   return `[${id}]: ${relative}${s.startLine?`#L${s.startLine}${s.startLine!==s.endLine?`-L${s.endLine}`:''}`:''}`;
  }).join('\n')+'\n';
 }
 return docs;
}
const coverage=g=>g.flows.flatMap(f=>f.nodes.map(n=>({flowId:f.id,nodeId:n.id,state:n.kind==='external'?'external-boundary':n.kind==='unresolved'?'insufficient-evidence':'analyzed',reason:'Explicit fixture review of the cited process; no further described calls.'})));
async function create(f,options={}) {
 const stage=await prepareLifecycle({bundleRoot:f.bundle,evidenceRoot:f.evidence,operation:'create',documentationId:'doc_fixture',scopes:f.scopes,coverage:coverage(f.graph),candidateGraph:f.graph,candidateDocuments:documents(f),evidenceUpdates:f.evidenceUpdates,reviewedFlowIds:f.graph.flows.map(x=>x.id),...options});
 try{return await stage.apply();}finally{stage.dispose();}
}
async function update(f,{graph=f.graph,docs={},updates={},...rest}={}) {
 const plan=await planLifecycle({bundleRoot:f.bundle,evidenceRoot:f.evidence,evidenceUpdates:updates});
 return prepareLifecycle({bundleRoot:f.bundle,evidenceRoot:f.evidence,planToken:plan.token,candidateGraph:graph,candidateDocuments:docs,evidenceUpdates:updates,coverage:coverage(graph),reviewedFlowIds:plan.affectedFlows,...rest});
}
for(const options of [{},{prompt:true},{mixed:true}])test(`initial generation persists portable coverage and builds offline HTML ${JSON.stringify(options)}`,async t=>{
 const f=fixture(t,options);await create(f);
 const prepared=prepareBuild({input:f.bundle,repositoryRoot:f.evidence,output:path.join(f.bundle,'architecture.html')});assert.equal(prepared.artifacts[0].architecture.flows.length,3);
 const s=JSON.parse(readFileSync(path.join(f.bundle,'snapshot.json')));assert.equal(s.documentationId,'doc_fixture');assert.equal(s.coverage.length,3);assert.equal(s.sourceKind,options.mixed?'mixed':options.prompt?'natural-language':'code');assert.equal(json(s).includes(f.directory),false);
 assert.equal((await planLifecycle({bundleRoot:f.bundle,evidenceRoot:f.evidence})).mode,'unchanged');assert.ok(readFileSync(path.join(f.bundle,'architecture.html'),'utf8').includes('pflow-data'));
});
test('selected-workspace detection distinguishes create, update, ambiguity and multiple candidates',async t=>{
 const f=fixture(t);assert.equal(detectDocumentation({workspace:f.evidence}).action,'create');await create(f);
 assert.equal(detectDocumentation({workspace:f.evidence,intent:'update'}).target,f.bundle);
 assert.equal(detectDocumentation({workspace:f.evidence}).action,'clarify');assert.equal(detectDocumentation({workspace:f.evidence,intent:'create'}).requiresFreshDestination,true);
 cpSync(f.bundle,path.join(f.evidence,'second'),{recursive:true});assert.equal(detectDocumentation({workspace:f.evidence,intent:'update'}).action,'clarify');assert.equal(detectDocumentation({workspace:f.evidence,intent:'update',target:'architecture'}).target,f.bundle);
 await assert.rejects(()=>create(f),/fresh empty destination/);assert.throws(()=>detectDocumentation({workspace:f.evidence,target:'../escape'}),/unsafe/);
});
for(const vcs of ['none','git','svn'])test(`current bytes drive impact in ${vcs} environment without revision assumptions`,async t=>{
 const f=fixture(t);if(vcs==='git'){assert.equal(spawnSync('git',['init',f.evidence]).status,0);}if(vcs==='svn')mkdirSync(path.join(f.evidence,'.svn'));
 await create(f);put(path.join(f.evidence,'source/shared.txt'),'shared: changed call and branch\n');
 const plan=await planLifecycle({bundleRoot:f.bundle,evidenceRoot:f.evidence});assert.equal(plan.mode,'targeted');assert.deepEqual(plan.directlyAffectedFlows,['flow_shared']);assert.deepEqual(plan.affectedFlows,['flow_one','flow_shared','flow_two']);assert.deepEqual(plan.entryPoints,['entry_one','entry_two']);
});
test('added and removed calls are reanalyzed candidates, preserve IDs and unrelated Markdown',async t=>{
 const f=fixture(t);await create(f);const untouched=readFileSync(path.join(f.bundle,'flows/two.md'));put(path.join(f.evidence,'source/one.txt'),'one: call the new operation\n');
 const g=structuredClone(f.graph);g.flows[0].nodes.push({id:'node_added',label:'New supported call',kind:'operation',sourceIds:['src_one']});g.flows[0].edges.push({id:'edge_added',from:'node_one',to:'node_added',kind:'call',mode:'sync',sourceIds:['src_one']});
 let stage=await update(f,{graph:g});await stage.apply();stage.dispose();assert.deepEqual(readFileSync(path.join(f.bundle,'flows/two.md')),untouched);assert.equal(JSON.parse(readFileSync(path.join(f.bundle,'diagrams/architecture.json'))).flows[0].edges.length,1);
 f.graph=g;put(path.join(f.evidence,'source/one.txt'),'one: no longer calls that operation\n');const removed=structuredClone(g);removed.flows[0].nodes.pop();removed.flows[0].edges=[];
 stage=await update(f,{graph:removed});await stage.apply();stage.dispose();assert.equal(JSON.parse(readFileSync(path.join(f.bundle,'diagrams/architecture.json'))).flows[0].nodes.length,1);
});
test('unaffected graphs and prose cannot be changed by targeted regeneration',async t=>{
 const f=fixture(t);await create(f);put(path.join(f.evidence,'source/one.txt'),'new\n');const changed=structuredClone(f.graph);changed.flows[1].label='invented';await assert.rejects(()=>update(f,{graph:changed}),/unaffected Flow changed/);
 const docs=documents(f);docs['flows/two.md']=docs['flows/two.md'].replace('two:','fabricated:');await assert.rejects(()=>update(f,{docs}),/unaffected Markdown/);
});
test('line shifts, deletions and renames invalidate stored evidence; new unmapped scope files fall back',async t=>{
 const f=fixture(t);f.scopes.push({path:'source',kind:'code',flowIds:[]});await create(f);
 put(path.join(f.evidence,'source/one.txt'),'\noriginal content moved\n');let p=await planLifecycle({bundleRoot:f.bundle,evidenceRoot:f.evidence});assert.ok(p.affectedFlows.includes('flow_one'));
 rmSync(path.join(f.evidence,'source/two.txt'));put(path.join(f.evidence,'source/moved.txt'),'two\n');p=await planLifecycle({bundleRoot:f.bundle,evidenceRoot:f.evidence});assert.equal(p.mode,'full');assert.ok(p.changes.some(c=>c.status==='deleted'));assert.ok(p.changes.some(c=>c.status==='added'));
});
test('unchanged sources skip analysis/publication and retain artifact mtimes',async t=>{
 const f=fixture(t);await create(f);const file=path.join(f.bundle,'architecture.html'),before=statSync(file).mtimeMs,fp=await fingerprintBundle(f.bundle);
 const stage=await update(f);assert.equal(stage.unchanged,true);assert.deepEqual(await stage.apply(),{unchanged:true});assert.equal(await fingerprintBundle(f.bundle),fp);assert.equal(statSync(file).mtimeMs,before);
});
test('Snapshot absence/incompatibility and manual edits require ownership review, not blind overwrite',async t=>{
 const f=fixture(t);await create(f);const p=path.join(f.bundle,'snapshot.json'),original=readFileSync(p);rmSync(p);
 assert.equal((await planLifecycle({bundleRoot:f.bundle,evidenceRoot:f.evidence})).requiresOwnershipReview,true);
 await assert.rejects(()=>update(f),/full reanalysis/);put(p,json({...JSON.parse(original),snapshotVersion:'99'}));assert.equal((await planLifecycle({bundleRoot:f.bundle,evidenceRoot:f.evidence})).mode,'full');
 put(p,original);put(path.join(f.bundle,'flows/one.md'),readFileSync(path.join(f.bundle,'flows/one.md'),'utf8')+'\nManual note.\n');assert.equal((await planLifecycle({bundleRoot:f.bundle,evidenceRoot:f.evidence})).requiresOwnershipReview,true);
});
test('prompt amendments insert supported steps without overwriting the confirmed definition',async t=>{
 const f=fixture(t,{prompt:true});await create(f);const original=readFileSync(path.join(f.bundle,'evidence/one.md'));
 const updates={'evidence/amendment-001.md':'Developer update: After review, notify the requester before completion.\n'};
 const g=structuredClone(f.graph);g.sources.push({id:'src_amend',path:'architecture/evidence/amendment-001.md',startLine:1,endLine:1});g.flows[0].nodes.push({id:'node_notify',label:'Notify requester',kind:'operation',sourceIds:['src_amend']});g.flows[0].edges.push({id:'edge_notify',from:'node_one',to:'node_notify',kind:'next',mode:'unknown',sourceIds:['src_amend']});
 const stage=await update(f,{graph:g,updates});await stage.apply();stage.dispose();assert.deepEqual(readFileSync(path.join(f.bundle,'evidence/one.md')),original);assert.equal(readFileSync(path.join(f.bundle,'evidence/amendment-001.md'),'utf8'),updates['evidence/amendment-001.md']);assert.equal((await planLifecycle({bundleRoot:f.bundle,evidenceRoot:f.evidence})).mode,'unchanged');
 await assert.rejects(()=>update(f,{updates:{'evidence/one.md':'rewritten original'}}),/full reanalysis/);
});
test('prompt branch modification uses a new evidenced edge without invented outcomes',async t=>{
 const f=fixture(t,{prompt:true});await create(f);const updates={'evidence/branch.md':'Developer: If the request exceeds $10,000, require manager approval. The existing completion step remains.\n'};
 const g=structuredClone(f.graph),flow=g.flows[0];g.sources.push({id:'src_branch',path:'architecture/evidence/branch.md',startLine:1,endLine:1});flow.nodes.push({id:'node_amount',kind:'decision',label:'Above $10,000?',sourceIds:['src_branch']},{id:'node_manager',kind:'operation',label:'Manager approval',sourceIds:['src_branch']});flow.edges.push({id:'edge_check',from:'node_one',to:'node_amount',kind:'next',mode:'unknown',sourceIds:['src_branch']},{id:'edge_high',from:'node_amount',to:'node_manager',kind:'branch',label:'above $10,000',mode:'unknown',sourceIds:['src_branch']});
 const stage=await update(f,{graph:g,updates});await stage.apply();stage.dispose();const actual=JSON.parse(readFileSync(path.join(f.bundle,'diagrams/architecture.json')));assert.equal(actual.flows[0].edges.filter(e=>e.kind==='branch').length,1);assert.equal(actual.flows[0].edges[1].label,'above $10,000');assert.equal(actual.flows[1].nodes.length,1);
});
test('missing critical prompt decisions block publication until affected flows were reanalyzed',async t=>{
 const f=fixture(t,{prompt:true});await create(f);const before=await fingerprintBundle(f.bundle),updates={'evidence/question.md':'Developer: Requests now need extra approval.\n'};
 // An unresolved approval threshold/position is a clarification, not a generated edge.
 await assert.rejects(()=>update(f,{updates,reviewedFlowIds:[]}),/reanalyze and review every affected Flow/);assert.equal(await fingerprintBundle(f.bundle),before);
});
test('mixed-source updates retain unrelated natural-language provenance and manual files',async t=>{
 const f=fixture(t,{mixed:true});await create(f,{limitations:['Unspecified delivery behavior remains unknown.']});put(path.join(f.bundle,'team-notes.txt'),'Manually maintained information.\n');const evidenceBefore=readFileSync(path.join(f.bundle,'evidence/one.md'));put(path.join(f.evidence,'source/two.txt'),'two: changed current code\n');
 const stage=await update(f);await stage.apply();stage.dispose();const s=JSON.parse(readFileSync(path.join(f.bundle,'snapshot.json')));assert.equal(s.sourceOrigins.src_one,'natural-language');assert.equal(s.sourceOrigins.src_two,'code');assert.deepEqual(s.limitations,['Unspecified delivery behavior remains unknown.']);assert.deepEqual(readFileSync(path.join(f.bundle,'evidence/one.md')),evidenceBefore);assert.equal(readFileSync(path.join(f.bundle,'team-notes.txt'),'utf8'),'Manually maintained information.\n');
});
test('failed Markdown validation leaves every original artifact recoverable',async t=>{
 const f=fixture(t);await create(f);put(path.join(f.evidence,'source/one.txt'),'changed\n');const before=await fingerprintBundle(f.bundle);
 await assert.rejects(()=>update(f,{docs:{'flows/one.md':'# Broken\n\nNo canonical sections.\n'}}));assert.equal(await fingerprintBundle(f.bundle),before);
});
test('publication failure rolls back HTML, graph, Markdown and Snapshot together',async t=>{
 const f=fixture(t);await create(f);put(path.join(f.evidence,'source/one.txt'),'changed\n');const before=await fingerprintBundle(f.bundle),stage=await update(f);let count=0;
 await assert.rejects(()=>stage.apply({rename:async(a,b)=>{if(++count===2)throw new Error('Injected disk failure');const fs=await import('node:fs/promises');await fs.rename(a,b);}}),/original bundle was restored/);stage.dispose();assert.equal(await fingerprintBundle(f.bundle),before);
});
test('concurrent evidence or documentation edits cannot publish a stale stage',async t=>{
 const f=fixture(t);await create(f);put(path.join(f.evidence,'source/one.txt'),'changed\n');const stage=await update(f);put(path.join(f.evidence,'source/one.txt'),'changed again\n');await assert.rejects(()=>stage.apply(),/evidence changed/);stage.dispose();
 const second=await update(f);put(path.join(f.bundle,'manual.txt'),'do not lose this');await assert.rejects(()=>second.apply(),/documentation changed/);second.dispose();assert.equal(readFileSync(path.join(f.bundle,'manual.txt'),'utf8'),'do not lose this');
});
test('unsafe source traversal, symlink escapes and generated-document self-evidence are rejected',async t=>{
 const f=fixture(t);const g=structuredClone(f.graph);g.sources[0].path='../outside';await assert.rejects(()=>create(f,{candidateGraph:g}),/unsafe|provenance/);
 symlinkSync(f.directory,path.join(f.evidence,'source/escape'));f.scopes.push({path:'source',kind:'code',flowIds:[]});await assert.rejects(()=>create(f),/symlink/);
});
test('explicit coverage distinguishes analyzed leaves, unexplored bodies, external boundaries and insufficient evidence',async t=>{
 const f=fixture(t);f.graph.flows[0].nodes[0].kind='external';f.graph.flows[0].nodes[0].external={kind:'other',name:'Verified boundary'};f.graph.flows[1].nodes[0].kind='unresolved';
 const c=coverage(f.graph);c[2].state='not-analyzed';c[2].reason='Body intentionally outside selected scope.';await create(f,{coverage:c});const s=JSON.parse(readFileSync(path.join(f.bundle,'snapshot.json')));assert.deepEqual(new Set(s.coverage.map(x=>x.state)),new Set(['external-boundary','insufficient-evidence','not-analyzed']));
});
test('packaged runtime works in isolation without development dependencies or VCS; generated file works offline',async t=>{
 const f=fixture(t,{prompt:true}),install=path.join(f.directory,'installation');await buildSkill({output:install});
 const runtime=path.join(install,'scripts/pflow.mjs'),request=path.join(f.directory,'request.json');
 const run=(command,options,...args)=>{put(request,json(options));const result=spawnSync(process.execPath,[runtime,command,'--request',request,...args],{cwd:f.directory,encoding:'utf8',env:{...process.env,PATH:''}});assert.equal(result.status,0,result.stderr);return JSON.parse(result.stdout);};
 assert.equal(run('lifecycle-detect',{workspace:f.evidence,intent:'update'}).action,'create');
 run('lifecycle-publish',{bundleRoot:f.bundle,evidenceRoot:f.evidence,operation:'create',documentationId:'doc_isolated',scopes:f.scopes,coverage:coverage(f.graph),candidateGraph:f.graph,candidateDocuments:documents(f),evidenceUpdates:f.evidenceUpdates,reviewedFlowIds:f.graph.flows.map(x=>x.id)},'--apply');
 assert.equal(run('lifecycle-plan',{bundleRoot:f.bundle,evidenceRoot:f.evidence}).mode,'unchanged');
 const updates={'evidence/amendment.md':'Developer update: Review the request before completion.\n'};
 const plan=run('lifecycle-plan',{bundleRoot:f.bundle,evidenceRoot:f.evidence,evidenceUpdates:updates});assert.equal(plan.mode,'targeted');
 run('lifecycle-publish',{bundleRoot:f.bundle,evidenceRoot:f.evidence,planToken:plan.token,candidateGraph:f.graph,coverage:coverage(f.graph),reviewedFlowIds:plan.affectedFlows,evidenceUpdates:updates},'--apply');
 assert.equal(run('lifecycle-plan',{bundleRoot:f.bundle,evidenceRoot:f.evidence}).mode,'unchanged');
 assert.equal(readFileSync(path.join(f.bundle,'evidence/amendment.md'),'utf8'),updates['evidence/amendment.md']);
 const chrome=[process.env.PFLOW_BROWSER_PATH,'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/chromium','/usr/bin/google-chrome'].filter(Boolean).find(existsSync);if(!chrome){t.diagnostic('Browser unavailable; packaged runtime checks completed.');return;}
 const html=path.join(f.directory,'standalone.html');cpSync(path.join(f.bundle,'architecture.html'),html);rmSync(f.evidence,{recursive:true});rmSync(install,{recursive:true});
 const browser=await chromium.launch({executablePath:chrome,headless:true});t.after(()=>browser.close());const page=await browser.newPage(),requests=[],errors=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(html).href);await page.waitForSelector('svg .diagram-node');assert.ok(await page.locator('.diagram-node').count()>0);assert.deepEqual(errors,[]);assert.deepEqual(requests,[pathToFileURL(html).href]);
});

test('shared output selection scaffolding integrates with initial default docs/architecture publication',async t=>{
 const f=fixture(t),selection=selectOutput({mode:'repository',repositoryRoot:f.evidence,create:true});f.bundle=selection.bundleRoot;
 await create(f);assert.ok(existsSync(selection.outputPath));assert.equal((await planLifecycle({bundleRoot:f.bundle,evidenceRoot:f.evidence})).mode,'unchanged');
});
for(const damage of ['missing','json','version'])test(`approved full recovery of ${damage} graph preserves unrelated files`,async t=>{
 const f=fixture(t);await create(f);put(path.join(f.bundle,'notes.txt'),'Human-maintained note');const file=path.join(f.bundle,'diagrams/architecture.json');
 if(damage==='missing')rmSync(file);else put(file,damage==='json'?'{bad':json({...f.graph,modelVersion:'99'}));
 assert.equal((await planLifecycle({bundleRoot:f.bundle,evidenceRoot:f.evidence})).mode,'full');
 const args={bundleRoot:f.bundle,evidenceRoot:f.evidence,operation:'full',candidateGraph:f.graph,candidateDocuments:documents(f),documentationId:'doc_fixture',scopes:f.scopes,coverage:coverage(f.graph),reviewedFlowIds:f.graph.flows.map(x=>x.id)};
 await assert.rejects(()=>prepareLifecycle(args),/approval/);
 const stage=await prepareLifecycle({...args,fullReplacementApproved:true});await stage.apply();stage.dispose();assert.equal(readFileSync(path.join(f.bundle,'notes.txt'),'utf8'),'Human-maintained note');assert.equal((await planLifecycle({bundleRoot:f.bundle,evidenceRoot:f.evidence})).mode,'unchanged');
});
test('removed Flow documents require explicit deletion and cannot escape Snapshot ownership',async t=>{
 const f=fixture(t);await create(f);put(path.join(f.evidence,'source/one.txt'),'one process removed\n');const g=structuredClone(f.graph);g.flows=g.flows.filter(x=>x.id!=='flow_one');g.entryPoints=g.entryPoints.filter(e=>e.flowId!=='flow_one');g.sources=g.sources.filter(s=>s.id!=='src_one');const docs=documents(f,g);
 await assert.rejects(()=>update(f,{graph:g,docs}),/explicit deletion review/);
 const stage=await update(f,{graph:g,docs:{...docs,'flows/one.md':null}});await stage.apply();stage.dispose();assert.equal(existsSync(path.join(f.bundle,'flows/one.md')),false);assert.equal(JSON.parse(readFileSync(path.join(f.bundle,'diagrams/architecture.json'))).flows.length,2);
});
test('an unchanged stage rechecks current source bytes before reporting no-op success',async t=>{
 const f=fixture(t);await create(f);const stage=await update(f);put(path.join(f.evidence,'source/one.txt'),'a late uncommitted change\n');await assert.rejects(()=>stage.apply(),/stale/);stage.dispose();
});

test('hierarchical recursion terminates and cross-flow async dependencies revalidate both contexts',async t=>{
 const f=fixture(t);f.graph.flows[2].nodes[0].expandFlowId='flow_one';
 f.graph.flows[0].edges.push({id:'edge_deliver',from:'node_one',to:'node_two',kind:'receive',mode:'async',sourceIds:['src_one','src_two']});await create(f);
 put(path.join(f.evidence,'source/two.txt'),'two subscription changed\n');const plan=await planLifecycle({bundleRoot:f.bundle,evidenceRoot:f.evidence});assert.deepEqual(plan.affectedFlows,['flow_one','flow_shared','flow_two']);assert.deepEqual(plan.relationships,['edge_deliver']);assert.deepEqual(plan,await planLifecycle({bundleRoot:f.bundle,evidenceRoot:f.evidence}));
});
test('existing legacy bundles can establish an approved lifecycle baseline and update without migration',async t=>{
 const f=fixture(t);await create(f);const fs=await import('node:fs');mkdirSync(path.join(f.bundle,'docs'));fs.renameSync(path.join(f.bundle,'index.md'),path.join(f.bundle,'docs/index.md'));fs.renameSync(path.join(f.bundle,'flows'),path.join(f.bundle,'docs/flows'));fs.renameSync(path.join(f.bundle,'diagrams/architecture.json'),path.join(f.bundle,'architecture.json'));rmSync(path.join(f.bundle,'diagrams'),{recursive:true});rmSync(path.join(f.bundle,'snapshot.json'));
 const docs=documents(f);for(const k of Object.keys(docs))docs[k]=docs[k].replaceAll('../../source/','../../../source/');
 const stage=await prepareLifecycle({bundleRoot:f.bundle,evidenceRoot:f.evidence,operation:'full',fullReplacementApproved:true,documentationId:'doc_fixture',candidateGraph:f.graph,candidateDocuments:docs,scopes:f.scopes,coverage:coverage(f.graph),reviewedFlowIds:f.graph.flows.map(x=>x.id)});await stage.apply();stage.dispose();put(path.join(f.evidence,'source/one.txt'),'legacy updated\n');const change=await update(f);await change.apply();change.dispose();assert.ok(existsSync(path.join(f.bundle,'architecture.json')));assert.equal(existsSync(path.join(f.bundle,'diagrams/architecture.json')),false);assert.equal((await planLifecycle({bundleRoot:f.bundle,evidenceRoot:f.evidence})).mode,'unchanged');
});
