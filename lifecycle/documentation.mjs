// VCS-independent lifecycle mechanics. Analysis remains in the AI Skill.
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { containsPath, resolveBundleRoot } from '../builder/bundle-layout.mjs';
import { prepareBuild } from '../builder/pipeline.mjs';
import { writeStandaloneHTML } from '../builder/html.mjs';
import { validateStructure } from '../validation/validate-artifact.mjs';
import { applyBundle, fingerprintBundle } from '../skills/pflow-regenerate/scripts/safe-update.mjs';
import { flowBlocks } from '../skills/pflow-regenerate/scripts/regenerate.mjs';

export const snapshotVersion = '1.0.0';
const snapshotName = 'snapshot.json';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const portable = value => value.split(path.sep).join('/');
const sorted = values => [...new Set(values)].sort();
const fail = message => { throw new Error(`Documentation lifecycle: ${message}`); };
const states = ['analyzed', 'not-analyzed', 'external-boundary', 'insufficient-evidence'];
const kinds = ['code', 'natural-language'];
function relative(value) {
  if (typeof value !== 'string' || !value || value.includes('\\') || value.includes('\0') || path.posix.isAbsolute(value) || /^[A-Za-z]:/.test(value) || value.split('/').includes('..')) fail(`unsafe relative path ${JSON.stringify(value)}`);
  return path.posix.normalize(value);
}
function checkedPath(value) {
  if (typeof value !== 'string' || !path.isAbsolute(value) || value.split(path.sep).includes('..')) fail('use an absolute path without traversal');
  const absolute = path.resolve(value); let cursor = path.parse(absolute).root;
  for (const part of absolute.slice(cursor.length).split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, part);
    try { if (lstatSync(cursor).isSymbolicLink()) fail(`symlink path is not allowed: ${cursor}`); } catch(error) { if(error.code!=='ENOENT') throw error; }
  }
  return absolute;
}
function root(value) {
  const absolute = checkedPath(value);
  if (!lstatSync(absolute).isDirectory()) fail('expected a directory');
  return realpathSync(absolute);
}
function bytesAt(directory, name) {
  const file = checkedPath(path.join(directory, relative(name)));
  if (!containsPath(directory, file) || !lstatSync(file).isFile()) fail(`not a contained regular file: ${name}`);
  return readFileSync(file);
}
const entities = graph => [...graph.entryPoints, ...graph.flows.flatMap(f => [f, ...f.nodes, ...f.edges])];
function graphAt(bundle) {
  const layout = resolveBundleRoot(bundle), graph = JSON.parse(bytesAt(bundle, portable(layout.graphRelative)));
  if (!validateStructure(graph)) fail('graph schema is invalid; run validate for diagnostics');
  return { layout, graph };
}
function artifactHashes(bundle, graph, layout) {
  const names = [portable(layout.graphRelative), ...sorted(['index.md', ...entities(graph).flatMap(e => (e.docs || []).map(d => d.path))]).map(p => portable(path.join(layout.docsRelative, p)))];
  // HTML is derived, not a source or manual-document baseline.
  return Object.fromEntries(names.sort().map(name => [name, hash(bytesAt(bundle, name))]));
}
function checkCoverage(graph, coverage) {
  if (!Array.isArray(coverage)) fail('coverage must explicitly classify every node');
  const expected = new Map(graph.flows.flatMap(f => f.nodes.map(n => [`${f.id}/${n.id}`, n]))), seen = new Set();
  for (const item of coverage) {
    const key = `${item.flowId}/${item.nodeId}`, node = expected.get(key);
    if (!node || seen.has(key) || !states.includes(item.state) || typeof item.reason !== 'string' || !item.reason.trim() || Object.keys(item).some(k => !['flowId','nodeId','state','reason'].includes(k))) fail(`invalid or duplicate coverage: ${key}`);
    if (node.kind === 'external' && item.state !== 'external-boundary' || node.kind === 'unresolved' && item.state !== 'insufficient-evidence') fail(`coverage contradicts boundary ${node.id}`);
    seen.add(key);
  }
  if (seen.size !== expected.size) fail('coverage is incomplete; an undocumented implementation is not an analyzed leaf');
  return [...coverage].sort((a,b) => `${a.flowId}/${a.nodeId}` < `${b.flowId}/${b.nodeId}` ? -1 : `${a.flowId}/${a.nodeId}` > `${b.flowId}/${b.nodeId}` ? 1 : 0);
}
function checkScopes(scopes, graph) {
  if (!Array.isArray(scopes) || !scopes.length) fail('explicit source scopes are required');
  const ids = new Set(graph.flows.map(f => f.id));
  return scopes.map(s => {
    if (!kinds.includes(s.kind) || !Array.isArray(s.flowIds) || s.flowIds.some(id => !ids.has(id)) || Object.keys(s).some(k => !['path','kind','flowIds'].includes(k))) fail('invalid source scope');
    const name=relative(s.path);
    if(name.split('/').some(p=>['.git','.svn','node_modules'].includes(p))) fail('source scopes must exclude VCS metadata and installed dependency trees');
    return { path: name, kind: s.kind, flowIds: sorted(s.flowIds) };
  }).sort((a,b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
}
const covers = (scope, name) => scope.path === '.' || name === scope.path || name.startsWith(scope.path + '/');
// Hash each scoped file once. Bounds avoid accidental whole-machine inventories.
// VCS/dependency directories are never traversed. Scope omissions are explicit.
function inventory(evidenceRoot, bundle, scopes, evidenceUpdates = {}) {
  const files = new Map(); let total = 0;
  function add(name, bytes) {
    if (bytes.length > 8 * 1024 * 1024 || (total += bytes.length) > 128 * 1024 * 1024 || files.size >= 10000) fail('source inventory exceeds 8 MiB/file, 128 MiB/run or 10000 files; narrow the scopes');
    files.set(name, hash(bytes));
  }
  function walk(name) {
    const absolute = checkedPath(path.join(evidenceRoot, name));
    // Only captured evidence may be tracked inside generated output.
    if (containsPath(bundle, absolute) && !containsPath(path.join(bundle, 'evidence'), absolute)) return;
    if (!existsSync(absolute)) return;
    const stat = lstatSync(absolute);
    if (stat.isDirectory()) {
      for (const child of readdirSync(absolute).sort()) if (!['.git','.svn','node_modules'].includes(child)) walk(path.posix.join(name, child));
    } else if (stat.isFile()) {
      if (!files.has(name)) add(name, readFileSync(absolute));
    } else fail(`special source file: ${name}`);
  }
  for (const scope of scopes) {
    // The evidence root/bundle may coincide. Visit evidence explicitly then.
    if (path.resolve(evidenceRoot, scope.path) === bundle) walk(path.posix.join(scope.path, 'evidence'));
    else walk(scope.path);
  }
  for (const [bundlePath, text] of Object.entries(evidenceUpdates)) {
    const name = path.relative(evidenceRoot, path.join(bundle, relative(bundlePath))).split(path.sep).join('/');
    if (!scopes.some(s => s.kind === 'natural-language' && covers(s, name))) fail(`amendment is outside natural-language scopes: ${name}`);
    add(name, Buffer.from(text));
  }
  return Object.fromEntries([...files].sort(([a],[b]) => a < b ? -1 : a > b ? 1 : 0));
}
function sourceOrigins(graph, scopes, files) {
  return Object.fromEntries(graph.sources.map(source => {
    const name = relative(source.path), matches = scopes.filter(s => covers(s,name));
    if (!Object.hasOwn(files,name) || !matches.length || new Set(matches.map(s=>s.kind)).size !== 1) fail(`source lacks unambiguous tracked provenance: ${source.id} (${name})`);
    return [source.id, matches[0].kind];
  }));
}
function amendments(bundle, updates = {}) {
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) fail('evidenceUpdates must be an object');
  for (const [name, text] of Object.entries(updates)) {
    if (!/^evidence\/[^/]+\.md$/.test(relative(name)) || typeof text !== 'string' || !text.isWellFormed()) fail('capture amendments as exact UTF-8 evidence/*.md files');
    if (existsSync(path.join(bundle,name))) fail(`confirmed evidence is immutable; capture a new amendment instead: ${name}`);
  }
  return updates;
}
function verifySnapshot(bundle, snapshot, graph, layout) {
  if (snapshot.snapshotVersion !== snapshotVersion) fail('missing or incompatible Snapshot; full reanalysis and ownership review required');
  if (typeof snapshot.documentationId !== 'string' || !/^doc_[A-Za-z0-9_-]+$/.test(snapshot.documentationId)) fail('invalid documentation identity');
  checkCoverage(graph, snapshot.coverage); checkScopes(snapshot.scopes,graph);
  if (!isDeepStrictEqual(artifactHashes(bundle,graph,layout),snapshot.artifacts)) fail('generated artifacts differ from Snapshot; preserve manual changes and review before full reanalysis');
  if (!snapshot.files || Object.values(snapshot.files).some(v=>! /^[a-f0-9]{64}$/.test(v)) || !Array.isArray(snapshot.limitations)) fail('invalid Snapshot inventory');
  if (!isDeepStrictEqual(sourceOrigins(graph,snapshot.scopes,snapshot.files),snapshot.sourceOrigins)) fail('invalid Snapshot provenance');
  const origins=sorted(Object.values(snapshot.sourceOrigins));
  if(snapshot.sourceKind!==(origins.length===2?'mixed':origins[0]) || snapshot.limitations.some(v=>typeof v!=='string'||!v.trim())) fail('invalid Snapshot evidence kind or limitations');
}

/** Only search the selected workspace. Never pick one of several bundles by title. */
export function detectDocumentation({workspace, intent = 'ambiguous', target} = {}) {
  const boundary = root(workspace);
  if (!['create','update','ambiguous'].includes(intent)) fail('intent must be create, update or ambiguous');
  const bundles = [];
  function visit(directory) {
    if (existsSync(path.join(directory,'architecture.json')) || existsSync(path.join(directory,'diagrams/architecture.json'))) {
      resolveBundleRoot(directory); bundles.push(directory); return;
    }
    for (const name of readdirSync(directory).sort()) {
      if (['.git','.svn','node_modules'].includes(name)) continue;
      const p = path.join(directory,name), stat = lstatSync(p);
      if (stat.isDirectory() && !stat.isSymbolicLink()) visit(p);
    }
  }
  visit(boundary);
  let selected;
  if (target !== undefined) {
    selected = checkedPath(path.resolve(boundary,relative(target)));
    if (!containsPath(boundary,selected)) fail('target escapes document workspace');
  }
  const matches = selected ? bundles.filter(p=>p===selected) : bundles;
  if (intent === 'create') return {action:'create',bundles, ...(selected?{target:selected}:{}),requiresFreshDestination:matches.length>0};
  if (matches.length > 1) return {action:'clarify',bundles:matches,reason:'Select the documentation bundle to update or create a new one.'};
  if (matches.length === 1) return {action:intent==='update'?'update':'clarify',bundles:matches,target:matches[0], ...(intent==='ambiguous'?{reason:'Update this documentation or create a new bundle?'}:{})};
  return {action:'create',bundles:[],...(selected?{target:selected}:{})};
}

/** Missing/corrupt baselines return full-analysis guidance, never silent overwrite. */
export async function planLifecycle({bundleRoot, evidenceRoot, evidenceUpdates = {}} = {}) {
  const bundle = root(bundleRoot), evidence = root(evidenceRoot);
  const bundleFingerprint = await fingerprintBundle(bundle);
  try {
    const {graph,layout} = graphAt(bundle), snapshot = JSON.parse(bytesAt(bundle,snapshotName));
    verifySnapshot(bundle,snapshot,graph,layout);
    const updates = amendments(bundle,evidenceUpdates), files = inventory(evidence,bundle,snapshot.scopes,updates);
    // Original prompt evidence must remain available byte-for-byte. Amend, never erase.
    const alteredDefinition = Object.keys(snapshot.files).filter(p=>snapshot.scopes.some(s=>s.kind==='natural-language'&&covers(s,p)) && snapshot.files[p]!==files[p]);
    if (alteredDefinition.length) fail(`confirmed natural-language evidence was modified/deleted: ${alteredDefinition.join(', ')}; restore it and add a separately attributed amendment`);
    const changes = sorted([...Object.keys(snapshot.files),...Object.keys(files)]).filter(p=>snapshot.files[p]!==files[p]).map(p=>({path:p,status:!snapshot.files[p]?'added':!files[p]?'deleted':'modified'}));
    const direct = new Map(), reasons = new Map(), nodeOwner = new Map(graph.flows.flatMap(f=>f.nodes.map(n=>[n.id,f.id]))), deps = new Map();
    const mark = (id,reason) => { direct.set(id,true); reasons.set(id,sorted([...(reasons.get(id)||[]),reason])); };
    const depend = (a,b) => deps.set(a,new Set([...(deps.get(a)||[]),b]));
    for (const f of graph.flows) {
      for (const n of f.nodes) if(n.expandFlowId) depend(n.expandFlowId,f.id);
      for (const e of f.edges) if(nodeOwner.get(e.to)!==f.id) {depend(f.id,nodeOwner.get(e.to));depend(nodeOwner.get(e.to),f.id);}
    }
    const unresolved = [];
    for (const change of changes) {
      const sources = new Set(graph.sources.filter(s=>relative(s.path)===change.path).map(s=>s.id));
      const scopes = snapshot.scopes.filter(s=>covers(s,change.path));
      let mapped = false;
      for (const f of graph.flows) if([...f.nodes,...f.edges,...graph.entryPoints.filter(e=>e.flowId===f.id)].some(e=>e.sourceIds.some(id=>sources.has(id)))) {mark(f.id,`${change.status} evidence ${change.path}; recheck calls, conditions, registration and ranges`);mapped=true;}
      for(const scope of scopes) for(const id of scope.flowIds) {mark(id,`${change.status} tracked scope ${scope.path}: ${change.path}`);mapped=true;}
      if(!mapped) unresolved.push(`${change.path}: no reliable coverage mapping; broader discovery is required`);
    }
    const affected = new Set(direct.keys()), queue = [...affected];
    for(let i=0;i<queue.length;i++) for(const id of deps.get(queue[i])||[]) if(!affected.has(id)) {affected.add(id);queue.push(id);reasons.set(id,[`Dependent context of ${queue[i]}; revalidate shared detail or cross-flow binding`]);}
    const affectedFlows = sorted(affected), mode = unresolved.length?'full':changes.length?'targeted':'unchanged';
    const plan = {mode,documentationId:snapshot.documentationId,bundleFingerprint,changes,directlyAffectedFlows:sorted(direct.keys()),affectedFlows,reasons:Object.fromEntries([...reasons].sort()),entryPoints:graph.entryPoints.filter(e=>affected.has(e.flowId)).map(e=>e.id).sort(),relationships:graph.flows.flatMap(f=>f.edges.filter(e=>e.mode==='async'&&(affected.has(f.id)||affected.has(nodeOwner.get(e.to)))).map(e=>e.id)).sort(),unresolved};
    return {...plan,token:hash(json({plan,files,evidenceUpdates:updates}))};
  } catch(error) {
    return {mode:'full',bundleFingerprint,affectedFlows:[],unresolved:[error.message],requiresOwnershipReview:true};
  }
}

function preserveUnaffected(before, after, affected, beforeCoverage, afterCoverage, oldDocs, newDocs) {
  for(const f of before.flows) if(!affected.has(f.id)) {
    if(!isDeepStrictEqual(f,after.flows.find(x=>x.id===f.id))) fail(`unaffected Flow changed: ${f.id}`);
    if(!isDeepStrictEqual(beforeCoverage.filter(c=>c.flowId===f.id),afterCoverage.filter(c=>c.flowId===f.id))) fail(`unaffected coverage changed: ${f.id}`);
    for(const d of f.docs||[]) if(flowBlocks(oldDocs[d.path]).get(f.id)!==undefined && !isDeepStrictEqual(flowBlocks(oldDocs[d.path]).get(f.id),flowBlocks(newDocs[d.path]).get(f.id))) fail(`unaffected Markdown Flow changed: ${f.id}`);
  }
  for(const entry of before.entryPoints) if(!affected.has(entry.flowId) && !isDeepStrictEqual(entry,after.entryPoints.find(e=>e.id===entry.id))) fail(`unaffected Entry Point changed: ${entry.id}`);
  for(const entry of before.entryPoints) if(!affected.has(entry.flowId)) for(const d of entry.docs||[]) {
    if(!isDeepStrictEqual(flowBlocks(oldDocs[d.path],'entry_').get(entry.id),flowBlocks(newDocs[d.path],'entry_').get(entry.id))) fail(`unaffected Markdown Entry Point changed: ${entry.id}`);
  }
  const unchangedSourceIds = new Set(before.flows.filter(f=>!affected.has(f.id)).flatMap(f=>[...f.nodes,...f.edges]).flatMap(e=>e.sourceIds));
  for(const s of before.sources) if(unchangedSourceIds.has(s.id) && !isDeepStrictEqual(s,after.sources.find(x=>x.id===s.id))) fail(`unaffected source changed: ${s.id}`);
}

/** Candidate graph/prose come from reviewed AI analysis, never text replacement. */
export async function prepareLifecycle({bundleRoot,evidenceRoot,operation='update',planToken,candidateGraph,candidateDocuments={},evidenceUpdates={},documentationId,scopes,coverage,limitations,reviewedFlowIds=[],fullReplacementApproved=false} = {}) {
  const bundle = checkedPath(bundleRoot), evidence = root(evidenceRoot);
  if(!['create','update','full'].includes(operation)) fail('invalid operation');
  const exists = existsSync(bundle);
  if(operation==='create' && exists && readdirSync(bundle).some(name => !['flows','diagrams','evidence'].includes(name) || !lstatSync(path.join(bundle,name)).isDirectory() || lstatSync(path.join(bundle,name)).isSymbolicLink() || readdirSync(path.join(bundle,name)).length)) fail('new documentation needs a fresh empty destination; never overwrite an existing bundle');
  if(operation!=='create' && !exists) fail('existing bundle not found');
  const originalFingerprint = exists ? await fingerprintBundle(bundle) : undefined;
  let before, baseline, plan, currentLayout;
  if(operation!=='create') {
    plan = await planLifecycle({bundleRoot:bundle,evidenceRoot:evidence,evidenceUpdates});
    if(operation==='update' && (plan.mode==='full' || !planToken || plan.token!==planToken)) fail('incremental plan is missing, stale or unsafe; full reanalysis/ownership review required');
    if(operation==='full' && fullReplacementApproved!==true) fail('full replacement requires explicit ownership/scope approval; preserve unrelated documents');
    try { ({graph:before,layout:currentLayout}=graphAt(bundle)); }
    catch(error) {
      if(operation!=='full') throw error;
      // Recover an explicitly approved damaged bundle without inventing old graph facts.
      if(existsSync(path.join(bundle,'architecture.json')) || existsSync(path.join(bundle,'diagrams/architecture.json'))) currentLayout=resolveBundleRoot(bundle);
      else {
        const legacy=existsSync(path.join(bundle,'docs/index.md')),flat=existsSync(path.join(bundle,'index.md'));
        if(legacy===flat) fail('cannot resolve damaged bundle layout; select/reconcile its Markdown root first');
        currentLayout={graphRelative:legacy?'architecture.json':'diagrams/architecture.json',docsRelative:legacy?'docs':''};
      }
    }
    try { baseline=JSON.parse(bytesAt(bundle,snapshotName)); } catch { /* Explicit full recovery only. */ }
    if(operation==='update' && plan.mode==='unchanged') return {unchanged:true,async apply(){
      const fresh=await planLifecycle({bundleRoot:bundle,evidenceRoot:evidence,evidenceUpdates});
      if(fresh.token!==planToken) fail('unchanged plan became stale; replan current evidence');
      return {unchanged:true};
    },dispose(){}};
  }
  if(!candidateGraph || !validateStructure(candidateGraph)) fail('candidateGraph must conform to the existing graph schema');
  const nextCoverage = checkCoverage(candidateGraph,coverage), nextScopes = checkScopes(scopes||(baseline?.snapshotVersion===snapshotVersion?baseline.scopes:undefined),candidateGraph);
  limitations ??= baseline?.limitations || [];
  if(!Array.isArray(limitations)||limitations.some(v=>typeof v!=='string'||!v.trim())) fail('limitations must be concise text');
  const reviewed = new Set(reviewedFlowIds), required = operation==='update'?plan.affectedFlows:sorted([...candidateGraph.flows.map(f=>f.id),...(before?.flows||[]).map(f=>f.id)]);
  if(required.some(id=>!reviewed.has(id))) fail('reanalyze and review every affected Flow, including removed contexts, before publication');
  if(operation==='update') for(const f of candidateGraph.flows) if(!before.flows.some(b=>b.id===f.id)&&!reviewed.has(f.id)) fail(`new Flow has not been reviewed: ${f.id}`);
  const updates = amendments(bundle,evidenceUpdates);
  // Existing prompt statements are immutable, including explicitly approved full reruns.
  if(exists && baseline?.snapshotVersion===snapshotVersion) {
    const current = inventory(evidence,bundle,baseline.scopes);
    for(const p of Object.keys(baseline.files)) if(baseline.scopes.some(s=>s.kind==='natural-language'&&covers(s,p)) && current[p]!==baseline.files[p]) fail(`confirmed evidence changed: ${p}`);
  }
  // Preserve physical relative citation topology, including external document workspaces.
  let common = path.dirname(bundle);
  while(!containsPath(common,evidence)) common=path.dirname(common);
  const scratch = mkdtempSync(path.join(realpathSync(tmpdir()),'pflow-lifecycle-'));
  const staged = path.join(scratch,'tree',path.relative(common,bundle)), shadowEvidence = path.join(scratch,'tree',path.relative(common,evidence));
  mkdirSync(staged,{recursive:true});mkdirSync(shadowEvidence,{recursive:true});
  try {
    if(exists) cpSync(bundle,staged,{recursive:true});
    const layout = currentLayout || {graphRelative:'diagrams/architecture.json',docsRelative:''};
    const docsRoot = path.join(staged,layout.docsRelative), oldDocs = {}, newDocs = {};
    if(before) for(const p of sorted(['index.md',...entities(before).flatMap(e=>(e.docs||[]).map(d=>d.path))])) oldDocs[p]=bytesAt(path.join(bundle,layout.docsRelative),p).toString('utf8');
    else if(baseline?.snapshotVersion===snapshotVersion && baseline.artifacts) for(const name of Object.keys(baseline.artifacts)) {
      const p=path.relative(layout.docsRelative||'.',relative(name));
      if(p.endsWith('.md') && !p.startsWith('..') && existsSync(path.join(docsRoot,p))) oldDocs[p]=bytesAt(path.join(bundle,layout.docsRelative),p).toString('utf8');
    }
    const candidateDocNames=new Set(['index.md',...entities(candidateGraph).flatMap(e=>(e.docs||[]).map(d=>d.path))]);
    for(const [name,text] of Object.entries(candidateDocuments)) {
      const p=relative(name);if(!p.endsWith('.md') || (!candidateDocNames.has(p)&&!Object.hasOwn(oldDocs,p))) fail('candidate documents must be canonical Markdown or previously owned documents');
      const dest=path.join(docsRoot,p);
      if(text===null) { if(!Object.hasOwn(oldDocs,p)) fail(`cannot delete an unowned document: ${p}`); rmSync(dest); }
      else {if(typeof text!=='string') fail('candidate Markdown must be text or null'); if(existsSync(dest)&&!Object.hasOwn(oldDocs,p)&&operation!=='full') fail(`cannot overwrite an unowned document: ${p}`);mkdirSync(path.dirname(dest),{recursive:true});writeFileSync(dest,text);}
    }
    if(Object.keys(oldDocs).length) {
      const retainedDocs=new Set(['index.md',...entities(candidateGraph).flatMap(e=>(e.docs||[]).map(d=>d.path))]);
      for(const old of Object.keys(oldDocs)) if(!retainedDocs.has(old) && candidateDocuments[old]!==null) fail(`removed owned document needs explicit deletion review: ${old}`);
    }
    for(const [name,text] of Object.entries(updates)) {const p=path.join(staged,name);mkdirSync(path.dirname(p),{recursive:true});writeFileSync(p,text);}
    const graphPath=path.join(staged,layout.graphRelative);mkdirSync(path.dirname(graphPath),{recursive:true});
    // Retain existing graph bytes on a semantic no-op.
    if(!before||!isDeepStrictEqual(before,candidateGraph)) writeFileSync(graphPath,json(candidateGraph));
    for(const p of sorted(['index.md',...entities(candidateGraph).flatMap(e=>(e.docs||[]).map(d=>d.path))])) newDocs[p]=bytesAt(docsRoot,p).toString('utf8');
    if(operation==='update') {
      preserveUnaffected(before,candidateGraph,new Set(plan.affectedFlows),baseline.coverage,nextCoverage,oldDocs,newDocs);
      for(const f of before.flows) for(const edge of f.edges) {const found=candidateGraph.flows.flatMap(f=>f.edges).find(e=>e.id===edge.id);if(found&&['from','to','kind','mode'].some(k=>found[k]!==edge[k])) fail(`changed relationship identity requires a new edge ID: ${edge.id}`);}
      if(!isDeepStrictEqual(nextScopes,baseline.scopes)) fail('scope changes require full reanalysis');
    }
    const files=inventory(evidence,bundle,nextScopes,updates), origins=sourceOrigins(candidateGraph,nextScopes,files);
    const sourceKind=sorted(Object.values(origins));
    if(!sourceKind.length) fail('documentation needs evidence-backed coverage');
    const id=/^doc_[A-Za-z0-9_-]+$/.test(baseline?.documentationId||'')?baseline.documentationId:documentationId;
    if(typeof id!=='string'||!/^doc_[A-Za-z0-9_-]+$/.test(id)) fail('supply a retained opaque doc_ identity');
    // Only copy actual cited evidence. No target scripts, VCS commands or evaluation.
    for(const source of candidateGraph.sources) {
      const absolute=path.join(evidence,relative(source.path)), destination=path.join(shadowEvidence,source.path);
      if(containsPath(bundle,absolute)) {
        if(!containsPath(path.join(bundle,'evidence'),absolute)) fail('generated documentation cannot be evidence for itself');
        if(!existsSync(destination)) fail(`missing captured evidence ${source.path}`);
      } else {const bytes=bytesAt(evidence,source.path);mkdirSync(path.dirname(destination),{recursive:true});writeFileSync(destination,bytes);}
    }
    const prepared=prepareBuild({input:staged,repositoryRoot:shadowEvidence,output:path.join(staged,'architecture.html')});
    if(prepared.artifacts.length!==1) fail('one lifecycle bundle must contain one connected graph envelope');
    writeStandaloneHTML(prepared);
    const nextSnapshot={snapshotVersion,documentationId:id,sourceKind:sourceKind.length===2?'mixed':sourceKind[0],scopes:nextScopes,files,sourceOrigins:origins,coverage:nextCoverage,limitations,artifacts:artifactHashes(staged,candidateGraph,resolveBundleRoot(staged))};
    writeFileSync(path.join(staged,snapshotName),json(nextSnapshot));
    const stagedFingerprint=await fingerprintBundle(staged);
    // Detect evidence/bundle edits during staging and again immediately before apply.
    const sourceFingerprint=hash(json(inventory(evidence,bundle,nextScopes,updates)));
    if(!isDeepStrictEqual(files,inventory(evidence,bundle,nextScopes,updates))) fail('sources changed during processing');
    if(operation==='update' && (await planLifecycle({bundleRoot:bundle,evidenceRoot:evidence,evidenceUpdates})).token!==planToken) fail('update plan changed during staging');
    let disposed=false;
    return {stagedRoot:staged,snapshot:nextSnapshot,diagnostics:prepared.diagnostics,async apply({rename}={}) {
      if(disposed) fail('stage is already used/disposed');
      if(hash(json(inventory(evidence,bundle,nextScopes,updates)))!==sourceFingerprint) fail('evidence changed after validation');
      if(await fingerprintBundle(staged)!==stagedFingerprint) fail('stage changed after validation');
      if(exists && await fingerprintBundle(bundle)!==originalFingerprint) fail('documentation changed after validation');
      disposed=true;
      try {
        if(originalFingerprint===stagedFingerprint) return {unchanged:true};
        if(exists) return await applyBundle({bundleRoot:bundle,stagedRoot:staged,expectedFingerprint:originalFingerprint,expectedStageFingerprint:stagedFingerprint,...(rename?{rename}:{})});
        // Initial publication is a same-filesystem rename into a previously absent path.
        // A concurrent destination is never replaced.
        const parent=root(path.dirname(bundle)), temporary=mkdtempSync(path.join(parent,'.pflow-create-'));
        try {cpSync(staged,temporary,{recursive:true});if(existsSync(bundle)) fail('destination appeared before publication');renameSync(temporary,bundle);return {created:true};} finally {rmSync(temporary,{recursive:true,force:true});}
      } finally {rmSync(scratch,{recursive:true,force:true});}
    },dispose(){disposed=true;rmSync(scratch,{recursive:true,force:true});}};
  } catch(error) {rmSync(scratch,{recursive:true,force:true});throw error;}
}
