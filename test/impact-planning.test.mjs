import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectGitChanges } from '../src/skills/pflow-impact/scripts/git-changes.mjs';
import { planImpact } from '../src/skills/pflow-impact/scripts/impact.mjs';
const base=fileURLToPath(new URL('./fixtures/impact/',import.meta.url));
const graph=JSON.parse(readFileSync(path.join(base,'baseline/graph.json'))),roles=JSON.parse(readFileSync(path.join(base,'baseline/roles.json')));
function fixture(t,{alias=false}={}){const parent=mkdtempSync(path.join(tmpdir(),'pflow-impact-')),root=path.join(parent,'target'),snapshot=path.join(parent,'baseline');cpSync(path.join(base,'repository'),root,{recursive:true});mkdirSync(path.join(root,'architecture'));cpSync(path.join(base,'baseline/docs'),path.join(root,'architecture/docs'),{recursive:true});writeFileSync(path.join(root,'architecture/architecture.json'),JSON.stringify(graph));
 if(alias)symlinkSync('shared.mjs',path.join(root,'alias.mjs'));
 const git=(...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim();git('init','-q');git('config','user.name','Fixture');git('config','user.email','fixture@example.invalid');git('add','.');git('commit','-qm','inert baseline');const commit=git('rev-parse','HEAD');cpSync(path.join(base,'repository'),snapshot,{recursive:true});cpSync(path.join(root,'architecture'),path.join(snapshot,'architecture'),{recursive:true});if(alias)symlinkSync('shared.mjs',path.join(snapshot,'alias.mjs'));t.after(()=>rmSync(parent,{recursive:true,force:true}));
 const put=(p,s)=>writeFileSync(path.join(root,p),s);const edit=(p,a,b)=>put(p,readFileSync(path.join(root,p),'utf8').replace(a,b));const changes=()=>collectGitChanges({repositoryRoot:root,baseline:commit,scope:'working-tree'});const plan=(extra={})=>planImpact({architecture:graph,docsRoot:path.join(snapshot,'architecture/docs'),baselineSourceRoot:snapshot,snapshotCommit:commit,changeSet:changes(),...extra});return {root,snapshot,commit,git,put,edit,changes,plan};}
const ids=rows=>rows.map(r=>r.id).sort();
const flowIds=(...names)=>names.map(n=>roles.flows[n]).sort();
function digest(root){function walk(dir){return readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0).flatMap(e=>e.isDirectory()&&e.name!=='.git'?walk(path.join(dir,e.name)):e.isFile()?[[path.relative(root,path.join(dir,e.name)),createHash('sha256').update(readFileSync(path.join(dir,e.name))).digest('hex')]]:[]);}return walk(root);}

test('one shared method edit reaches both callers and async cycle without invalidating independent entry',t=>{
 const f=fixture(t);f.edit('shared.mjs','return input','return { input }');const plan=f.plan();assert.equal(plan.mode,'targeted');assert.deepEqual(ids(plan.directlyAffectedFlows),flowIds('shared'));assert.deepEqual(ids(plan.transitivelyAffectedFlows),flowIds('alpha','beta','consumer'));assert.ok(!plan.affectedEntries.some(e=>e.id===roles.entries.unrelated));assert.equal(plan.relationships.length,2);assert.ok(plan.directlyAffectedFlows[0].reasons.some(r=>r.includes('baseline range changed')));
 assert.deepEqual(ids(plan.affectedEntries),['alpha','beta','shared','consumer'].map(n=>roles.entries[n]).sort());
});
test('line shifts and unchanged cited text still require bounded evidence-location review',t=>{
 const f=fixture(t);f.put('shared.mjs','\n'+readFileSync(path.join(f.root,'shared.mjs'),'utf8'));const p=f.plan();assert.deepEqual(ids(p.directlyAffectedFlows),flowIds('shared'));assert.ok(p.directlyAffectedFlows[0].reasons.some(r=>r.includes('stored range may shift')));assert.equal(p.mode,'targeted');
});
test('context edits after a cited range are conservative, not silently excluded by line equality',t=>{
 const f=fixture(t);f.put('shared.mjs',readFileSync(path.join(f.root,'shared.mjs'),'utf8')+'// context changed\n');const p=f.plan();assert.deepEqual(ids(p.directlyAffectedFlows),flowIds('shared'));assert.ok(p.directlyAffectedFlows[0].reasons.some(r=>r.includes('context changed outside')));
});
test('rename/move maps old evidence and never rewrites retained source IDs or paths',t=>{
 const f=fixture(t);renameSync(path.join(f.root,'shared.mjs'),path.join(f.root,'moved shared.mjs'));f.git('add','-A');const before=JSON.stringify(graph),p=f.plan();const rename=p.changes.find(c=>c.status==='R');assert.equal(rename.oldPath,'shared.mjs');assert.deepEqual(ids(p.directlyAffectedFlows),flowIds('shared'));assert.ok(p.directlyAffectedFlows[0].reasons.some(r=>r.includes('identity')));assert.equal(JSON.stringify(graph),before);
});
test('deleted evidence validates against retained baseline and invalid current-source validation falls back',t=>{
 const f=fixture(t);rmSync(path.join(f.root,'shared.mjs'));const p=f.plan();assert.equal(p.mode,'targeted');assert.deepEqual(ids(p.directlyAffectedFlows),flowIds('shared'));
 const wrong=f.plan({baselineSourceRoot:f.root,docsRoot:path.join(f.root,'architecture/docs')});assert.equal(wrong.mode,'full');assert.match(wrong.unresolved.join(' '),/Invalid baseline/);
});
test('changed subscription configuration requires registered entry rediscovery and both async relationships',t=>{
 const f=fixture(t);f.edit('config/subscriptions.json','jobs.v1','jobs.v2');const p=f.plan();assert.deepEqual(ids(p.rediscoverEntries),[roles.entries.shared,roles.entries.consumer].sort());assert.deepEqual(p.relationships.map(r=>r.id).sort(),[roles.edges.sharedDelivery,roles.edges.consumerDelivery].sort());assert.ok(!ids(p.affectedEntries).includes(roles.entries.unrelated));
});
test('producer destination changes review existing endpoints without creating speculative recipients',t=>{
 const f=fixture(t);f.edit('config/publish.json','jobs.v1','new.jobs');const before=JSON.stringify(graph),p=f.plan();assert.equal(p.relationships.length,2);assert.deepEqual(ids(p.directlyAffectedFlows),flowIds('consumer','shared'));assert.equal(JSON.stringify(graph),before);assert.ok(p.relationships.every(r=>r.kind==='receive'&&r.mode==='async'));
});
test('new or unmapped files require discovery review without inventing impact in independent components',t=>{
 const f=fixture(t);f.put('new-registration.mjs','register(dynamicKey, unknownHandler);\n');const p=f.plan();assert.equal(p.mode,'review');assert.equal(p.directlyAffectedFlows.length,0);assert.equal(p.transitivelyAffectedFlows.length,0);assert.deepEqual(p.unmappedPaths.map(p=>p.path),['new-registration.mjs']);assert.match(p.unresolved[0],/registration/);
});
test('unrelated notes do not invalidate flows but exclusion needs explicit source review',t=>{
 const f=fixture(t);f.edit('notes.md','Reviewer','Updated reviewer');const p=f.plan();assert.equal(p.directlyAffectedFlows.length,0);assert.equal(p.transitivelyAffectedFlows.length,0);assert.equal(p.unmappedPaths[0].path,'notes.md');assert.equal(p.mode,'review','The Skill, not a file extension rule, establishes this exclusion');
});
test('missing/conflicting provenance, invalid artifact or missing snapshot recommends full analysis',t=>{
 const f=fixture(t);for(const extra of [{snapshotCommit:undefined},{snapshotCommit:'unrelated-commit'},{baselineSourceRoot:undefined},{architecture:{...graph,modelVersion:'unsupported'}}]){const p=f.plan(extra);assert.equal(p.mode,'full');assert.ok(p.unresolved.length);assert.match(p.recommendation,/Full analysis/);}
 assert.equal(f.plan().mode,'targeted','Opaque revision text is valid when independently established provenance exists');assert.throws(()=>collectGitChanges({repositoryRoot:f.root,scope:'working-tree'}),/explicit baseline/);
});
test('planning is read-only across source, artifacts, index and Git HEAD',t=>{
 const f=fixture(t);f.edit('shared.mjs','return input','return { input }');const before=digest(f.root),index=readFileSync(path.join(f.root,'.git/index')),head=f.git('rev-parse','HEAD'),original=JSON.stringify(graph);f.plan();assert.deepEqual(digest(f.root),before);assert.deepEqual(readFileSync(path.join(f.root,'.git/index')),index);assert.equal(f.git('rev-parse','HEAD'),head);assert.equal(JSON.stringify(graph),original);
});

test('valid normalized and in-root symlink source aliases map to the same changed baseline file',t=>{
 const f=fixture(t,{alias:true});f.edit('shared.mjs','return input','return { input }');
 for(const sourcePath of ['./shared.mjs','alias.mjs']){const changed=structuredClone(graph);changed.sources.find(s=>s.id===roles.sources.shared).path=sourcePath;const p=f.plan({architecture:changed});assert.equal(p.mode,'targeted');assert.deepEqual(ids(p.directlyAffectedFlows),flowIds('shared'));assert.deepEqual(ids(p.transitivelyAffectedFlows),flowIds('alpha','beta','consumer'));assert.equal(changed.sources.find(s=>s.id===roles.sources.shared).path,sourcePath);}
});

test('moving every documented source path recommends full rediscovery instead of precise reuse',t=>{
 const f=fixture(t);mkdirSync(path.join(f.root,'relocated'));const paths=[...new Set(graph.sources.map(s=>s.path))];
 for(const file of paths){const dest=path.join(f.root,'relocated',file);mkdirSync(path.dirname(dest),{recursive:true});renameSync(path.join(f.root,file),dest);}f.git('add','-A');const p=f.plan();assert.equal(p.mode,'full');assert.match(p.unresolved.join(' '),/All documented source paths/);assert.match(p.recommendation,/Full rediscovery/);
});
