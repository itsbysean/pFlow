import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtempSync,readFileSync,writeFileSync,realpathSync,rmSync,symlinkSync,mkdirSync,renameSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {findingsFixture,fixedCode} from './support/findings-fixture.mjs';
import {architectureHash,captureFindingEvidence,inspectFindings,reconcileFindings,validateFindingDocument} from '../findings/validate.mjs';
import {inspectFindingBundle,prepareFindingsPublication} from '../findings/publish.mjs';
import {prepareBuild} from '../builder/pipeline.mjs';
import {writeStandaloneHTML} from '../builder/html.mjs';
import {prepareLifecycle} from '../lifecycle/documentation.mjs';
import {fingerprintBundle} from '../skills/pflow-regenerate/scripts/safe-update.mjs';
import {inspectArchitectureSet,rebuildArchitectureSet} from '../skills/pflow-rebuild/scripts/rebuild.mjs';
const fixture=t=>{const root=realpathSync(mkdtempSync(path.join(tmpdir(),'pflow-findings-')));t.after(()=>rmSync(root,{recursive:true,force:true}));return findingsFixture(root);};
const options=f=>({architecture:f.graph,repositoryRoot:f.root});
const publish=(f,candidate=f.candidate(),extra={})=>prepareFindingsPublication({bundleRoot:f.bundle,repositoryRoot:f.root,candidate,previousDigest:inspectFindingBundle({bundleRoot:f.bundle,repositoryRoot:f.root}).digest,...extra});
test('code evidence, graph references and bounded excerpts validate without public graph changes',t=>{
 const f=fixture(t),doc=f.candidate();validateFindingDocument(doc);const result=inspectFindings(doc,{...options(f),strict:true});assert.equal(result.rows[0].active,true);assert.equal(result.rows[0].snippets[1].lines[1].text,'  return items[0].sku;');assert.equal(Object.hasOwn(f.graph,'findings'),false);
 const reordered=Object.fromEntries(Object.entries(f.graph).reverse());assert.equal(architectureHash(reordered),architectureHash(f.graph));
});
for(const kind of ['version','severity','confidence','review','duplicate','range','traversal','target-both'])test(`invalid findings reject ${kind}`,t=>{
 const f=fixture(t),doc=f.candidate(),row=doc.findings[0];
 if(kind==='version')doc.findingsVersion='2';if(kind==='severity')row.severity='certain';if(kind==='confidence')row.confidence='guaranteed';if(kind==='review')row.reviews[0].rationale='';if(kind==='duplicate')doc.findings.push(structuredClone(row));if(kind==='range')row.evidence[0].source.endLine=999;if(kind==='traversal')row.evidence[0].source.path='../outside';if(kind==='target-both')row.targets[0].edgeId='edge_failure';
 assert.throws(()=>inspectFindings(doc,{...options(f),strict:true}));
});
test('missing/moved targets and changed code are stale and never receive active warnings',t=>{
 const f=fixture(t),doc=f.candidate();writeFileSync(f.source,fixedCode);let result=inspectFindings(doc,options(f));assert.equal(result.rows[0].active,false);assert.equal(result.rows[0].state,'stale');assert.ok(result.rows[0].reviews[0].rationale);
 const changed=structuredClone(f.graph);changed.flows[1].nodes[0].id='node_replacement';result=inspectFindings(doc,{...options(f),architecture:changed});assert.match(result.rows[0].reasons.join(' '),/target|Diagram changed/);
});
test('source escapes, missing files and oversized references cannot produce confirmed evidence',t=>{
 const f=fixture(t),doc=f.candidate();symlinkSync(f.root,path.join(f.root,'safe-alias'));symlinkSync(path.dirname(f.root),path.join(f.root,'outside'));
 doc.findings[0].evidence[0].source.path='outside/not-owned.mjs';assert.throws(()=>inspectFindings(doc,{...options(f),strict:true}));writeFileSync(path.join(f.root,'large.txt'),'x'.repeat(1024*1024+1));assert.throws(()=>captureFindingEvidence({repositoryRoot:f.root,sources:[{id:'src_large',path:'large.txt',startLine:1,endLine:1}]}),/exceeds/);rmSync(f.source);assert.throws(()=>captureFindingEvidence({repositoryRoot:f.root,sources:f.graph.sources}));
});
test('reruns preserve reviewed decisions, rationale and omitted findings; updates append history',t=>{
 const f=fixture(t),initial=f.candidate();let previous=reconcileFindings(undefined,initial,{finding_empty_sku:{status:'dismissed',rationale:'Caller contract was reviewed separately.'}});
 const rerun=reconcileFindings(previous,initial);assert.equal(rerun.findings[0].reviews.at(-1).status,'dismissed');assert.equal(rerun.findings[0].reviews.length,2);
 assert.deepEqual(reconcileFindings(previous,{findingsVersion:'1.0.0',findings:[]}),previous);
 previous=reconcileFindings(previous,initial,{finding_empty_sku:{status:'supported',rationale:'The receiving path permits an empty list.'}});assert.equal(previous.findings[0].reviews.length,3);assert.match(previous.findings[0].reviews[1].rationale,/Caller contract/);
 const duplicate=f.candidate();duplicate.findings[0].id='finding_another';assert.throws(()=>reconcileFindings(previous,duplicate),/reuse/);
 const rewritten=f.candidate();rewritten.findings[0].description='An unrelated new defect';assert.throws(()=>reconcileFindings(previous,rewritten),/identity changed/);
 assert.throws(()=>reconcileFindings(previous,{findingsVersion:'1.0.0',findings:[]},{finding_empty_sku:{status:'resolved',rationale:'Assumed fixed'}}),/current reanalysis/);
});
test('dismissed and resolved diagnoses are readable but do not create warnings',t=>{
 const f=fixture(t);for(const status of ['dismissed','resolved']){const doc=reconcileFindings(undefined,f.candidate(),{finding_empty_sku:{status,rationale:'Explicit fixture review decision.'}});assert.equal(inspectFindings(doc,options(f)).rows[0].active,false);}
});
test('findings publisher validates and replaces report plus HTML without changing architecture or Markdown',async t=>{
 const f=fixture(t),graph=readFileSync(path.join(f.bundle,'architecture.json')),md=readFileSync(path.join(f.bundle,'docs/flows/lookup.md'));
 const stage=await publish(f);await stage.apply();stage.dispose();assert.deepEqual(readFileSync(path.join(f.bundle,'architecture.json')),graph);assert.deepEqual(readFileSync(path.join(f.bundle,'docs/flows/lookup.md')),md);assert.match(readFileSync(path.join(f.bundle,'architecture.html'),'utf8'),/An empty order can fail/);
 const current=inspectFindingBundle({bundleRoot:f.bundle,repositoryRoot:f.root});assert.equal(current.rows[0].active,true);
 const again=await publish(f);assert.equal((await again.apply()).unchanged,true);again.dispose();
});
test('invalid candidates and concurrent changes preserve all prior documentation',async t=>{
 const f=fixture(t);writeStandaloneHTML(prepareBuild({input:f.bundle,repositoryRoot:f.root,output:path.join(f.bundle,'architecture.html')}));const before=await fingerprintBundle(f.bundle),bad=f.candidate();bad.findings[0].targets[0].nodeId='node_missing';await assert.rejects(()=>publish(f,bad));assert.equal(await fingerprintBundle(f.bundle),before);
 const stage=await publish(f);writeFileSync(f.source,fixedCode);await assert.rejects(()=>stage.apply(),/evidence changed/);stage.dispose();assert.equal(await fingerprintBundle(f.bundle),before);
});
test('failed publication rolls back findings and HTML together',async t=>{
 const f=fixture(t),before=await fingerprintBundle(f.bundle),stage=await publish(f);let n=0;await assert.rejects(()=>stage.apply({rename:async(a,b)=>{if(++n===2)throw new Error('disk failure');await(await import('node:fs/promises')).rename(a,b);}}),/restored/);stage.dispose();assert.equal(await fingerprintBundle(f.bundle),before);
});
test('optional findings load through Builder; stale evidence warns without breaking base documentation',t=>{
 const f=fixture(t);f.writeCandidate();let prepared=prepareBuild({input:f.bundle,repositoryRoot:f.root,output:path.join(f.bundle,'architecture.html')});assert.equal(prepared.artifacts[0].findings.rows[0].active,true);
 writeFileSync(f.source,fixedCode);prepared=prepareBuild({input:f.bundle,repositoryRoot:f.root,output:path.join(f.bundle,'architecture.html')});assert.equal(prepared.artifacts[0].findings.rows[0].state,'stale');assert.ok(prepared.diagnostics.some(d=>d.phase==='findings'));
 writeFileSync(path.join(f.bundle,'findings.json'),'{invalid');assert.throws(()=>prepareBuild({input:f.bundle,repositoryRoot:f.root,output:path.join(f.bundle,'architecture.html')}));
});
test('safe rebuild fingerprints findings changes before replacing HTML',async t=>{
 const f=fixture(t);f.writeCandidate();const opts={input:f.bundle,repositoryRoot:f.root,output:path.join(f.bundle,'architecture.html')};writeStandaloneHTML(prepareBuild(opts));const old=readFileSync(opts.output),inspection=await inspectArchitectureSet(opts);
 await assert.rejects(()=>rebuildArchitectureSet({...opts,indexReview:{digest:inspection.digest,outcome:'pass',findings:[]},beforeCommit(){const doc=f.readDocument();doc.findings[0].reviews.push({status:'dismissed',rationale:'Changed during rebuild.'});f.writeCandidate(doc);}}),error=>error.diagnostics?.some(d=>d.phase==='freshness'&&d.message.includes('changed')));assert.deepEqual(readFileSync(opts.output),old);
});
test('generated Markdown and prompt-only lifecycle provenance cannot establish a code diagnosis',async t=>{
 const f=fixture(t),doc=f.candidate();doc.findings[0].evidence=captureFindingEvidence({repositoryRoot:f.root,sources:[{id:'src_self',path:'architecture/docs/flows/lookup.md',startLine:1,endLine:1}]});await assert.rejects(()=>publish(f,doc),/Generated documentation/);
 writeFileSync(path.join(f.bundle,'snapshot.json'),JSON.stringify({scopes:[{path:'src',kind:'natural-language'}]}));await assert.rejects(()=>publish(f),/Snapshot code provenance/);
});

test('Snapshot evidence must be tracked with unambiguous code provenance',async t=>{
 const f=fixture(t),files=Object.fromEntries(f.candidate().findings[0].evidence.map(e=>[e.source.path,e.sha256]));
 for(const scopes of [[],[{path:'src',kind:'code'},{path:'src',kind:'natural-language'}]]) {
  writeFileSync(path.join(f.bundle,'snapshot.json'),JSON.stringify({snapshotVersion:'1.0.0',scopes,files}));await assert.rejects(()=>publish(f),/provenance/);
 }
 writeFileSync(path.join(f.bundle,'snapshot.json'),JSON.stringify({snapshotVersion:'1.0.0',scopes:[{path:'src',kind:'code'}],files:{}}));await assert.rejects(()=>publish(f),/provenance/);
 writeFileSync(path.join(f.bundle,'snapshot.json'),JSON.stringify({snapshotVersion:'1.0.0',scopes:[{path:'src',kind:'code'}],files}));const stage=await publish(f);await stage.apply();stage.dispose();assert.equal(inspectFindingBundle({bundleRoot:f.bundle,repositoryRoot:f.root}).rows[0].active,true);
});

test('architecture lifecycle retains stale findings after a proven file move with stable source IDs',async t=>{
 const f=fixture(t),coverage=f.graph.flows.flatMap(flow=>flow.nodes.map(node=>({flowId:flow.id,nodeId:node.id,state:'analyzed',reason:'Inspected fixture source.'}))),scopes=[{path:'src',kind:'code',flowIds:[]}];
 const base={bundleRoot:f.bundle,evidenceRoot:f.root,operation:'full',fullReplacementApproved:true,documentationId:'doc_orders',scopes,coverage,reviewedFlowIds:f.graph.flows.map(flow=>flow.id)};
 let stage=await prepareLifecycle({...base,candidateGraph:f.graph});await stage.apply();stage.dispose();stage=await publish(f);await stage.apply();stage.dispose();
 const original=f.readDocument(),graph=structuredClone(f.graph);for(const source of graph.sources)source.path='src/moved.mjs';renameSync(f.source,path.join(f.root,'src/moved.mjs'));
 const candidateDocuments={};for(const flow of graph.flows){const file=flow.docs[0].path;candidateDocuments[file]=readFileSync(path.join(f.bundle,'docs',file),'utf8').replaceAll('src/orders.mjs','src/moved.mjs');}
 stage=await prepareLifecycle({...base,candidateGraph:graph,candidateDocuments});await stage.apply();stage.dispose();assert.deepEqual(f.readDocument(),original);
 const inspected=inspectFindingBundle({bundleRoot:f.bundle,repositoryRoot:f.root});assert.equal(inspected.rows[0].state,'stale');assert.equal(inspected.rows[0].active,false);
});

test('malformed Snapshot scope entries mark results stale without breaking base documentation',t=>{
 const f=fixture(t);f.writeCandidate();writeFileSync(path.join(f.bundle,'snapshot.json'),JSON.stringify({snapshotVersion:'1.0.0',scopes:[null],files:{'src/orders.mjs':'unused'}}));
 const prepared=prepareBuild({input:f.bundle,repositoryRoot:f.root,output:path.join(f.bundle,'architecture.html')});assert.equal(prepared.artifacts[0].findings.rows[0].state,'stale');assert.match(prepared.artifacts[0].findings.rows[0].reasons.join(' '),/provenance is invalid/);
});
