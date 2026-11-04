// Applies reviewed M5 candidates, not source analysis. No public artifact/impact schema.
import { cpSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { validateStructure } from '../../../validation/validate-artifact.mjs';
import { validateDocumentation } from '../../../validation/validate-documentation.mjs';
import { collectGitChanges } from '../../pflow-impact/scripts/git-changes.mjs';
import { mergeDocument, fingerprintBundle, applyBundle } from './safe-update.mjs';
import { resolveBundleRoot } from '../../../builder/bundle-layout.mjs';
const fail = message => { throw new Error(`Targeted regeneration: ${message}`); };
const inside = (root, target) => { const p = path.relative(root, target); return p !== '..' && !p.startsWith(`..${path.sep}`) && !path.isAbsolute(p); };
const refs = graph => [...graph.entryPoints, ...graph.flows.flatMap(f => [f,...f.nodes,...f.edges])].flatMap(e=>e.docs??[]);
const text = file => { try { return readFileSync(file,'utf8'); } catch(e) { if(e.code==='ENOENT')return undefined;throw e; } };
const relative = p => { if(typeof p!=='string'||!p||path.posix.isAbsolute(p)||p.includes('\\')||p.split('/').includes('..')||/^[A-Za-z]:/.test(p))fail(`unsafe relative path ${JSON.stringify(p)}`);return path.posix.normalize(p); };
// Literal M1 Flow block boundaries only, fence aware; not a Markdown renderer.
export function flowBlocks(markdown='',prefix='flow_') {
  const lines=markdown.match(/[^\n]*\n|[^\n]+$/g)??[],blocks=new Map(),stack=[];let fence,pending;
  const append=items=>{if(stack.length)blocks.get(stack.at(-1).id).push(...items);};
  for(const raw of lines){
    const line=raw.replace(/\r?\n$/,''),f=line.match(/^\s{0,3}(`{3,}|~{3,})(.*)$/);
    if(fence){append([raw]);if(f&&f[1][0]===fence[0]&&f[1].length>=fence.length&&!f[2].trim())fence=undefined;continue;}
    if(f){append([raw]);fence=f[1];continue;}
    const a=line.match(/^<a id="((?:flow|node|edge|entry)_[A-Za-z0-9_-]+)"><\/a>$/);
    if(a){pending={id:a[1],lines:[raw]};continue;}
    if(pending&&!line.trim()){pending.lines.push(raw);continue;}
    const h=line.match(/^(#{1,6})\s+\S/);
    if(h){const level=h[1].length;while(stack.length&&stack.at(-1).level>=level)stack.pop();if(pending?.id.startsWith(prefix)){blocks.set(pending.id,[]);stack.push({id:pending.id,level});}}
    if(pending){append(pending.lines);pending=undefined;}append([raw]);
  }
  if(pending)append(pending.lines);return new Map([...blocks].map(([id,lines])=>[id,lines.join('')]));
}
export async function prepareRegeneration({repositoryRoot,bundleRoot,baselineSourceRoot,baselineBundleRoot,snapshotCommit,generatedBaselineConfirmed,impactPlan,changeSet,candidateGraph,candidateDocuments={}}) {
  if(!generatedBaselineConfirmed)fail('generated-text ownership is not established; preserve originals and request a reviewed ownership decision.');
  if(impactPlan?.mode!=='targeted'||impactPlan.unresolved?.length)fail('broader reanalysis is required; unresolved/full impact plans cannot be silently applied.');
  if(!changeSet?.fingerprint||snapshotCommit!==changeSet.baselineCommit||impactPlan.baselineCommit!==snapshotCommit||impactPlan.scope!==changeSet.scope||impactPlan.targetCommit!==changeSet.targetCommit)fail('missing/conflicting baseline provenance or comparison scope.');
  changeSet=structuredClone(changeSet);impactPlan=structuredClone(impactPlan);candidateGraph=structuredClone(candidateGraph);
  const repo=realpathSync(repositoryRoot),bundle=realpathSync(bundleRoot),baseBundle=realpathSync(baselineBundleRoot);
  if(!inside(repo,bundle)||repo===bundle)fail('bundle must be a contained documentation directory, separate from the source root.');
  const baseLayout=resolveBundleRoot(baseBundle),currentLayout=resolveBundleRoot(bundle);
  if(baseLayout.layout!==currentLayout.layout)fail('baseline and current bundle layouts differ; migration is not a targeted update.');
  const baseGraphText=text(baseLayout.graphPath),currentGraphText=text(currentLayout.graphPath);
  const baseGraph=JSON.parse(baseGraphText),currentGraph=JSON.parse(currentGraphText);
  if(!isDeepStrictEqual(baseGraph,currentGraph))fail('current Diagram JSON differs from the trusted generated baseline; reconcile manual/parallel graph edits before replacement.');
  const baselineErrors=validateDocumentation(baseGraph,{docsRoot:baseLayout.docsRoot,sourceRoot:baselineSourceRoot});
  if(baselineErrors.length)fail(`baseline validation failed: ${JSON.stringify(baselineErrors)}`);
  if(!validateStructure(candidateGraph))fail(`candidate schema failed: ${JSON.stringify(validateStructure.errors)}`);
  const fresh=()=>{const collected=collectGitChanges({repositoryRoot:repo,baseline:changeSet.baselineCommit,scope:changeSet.scope,...(changeSet.scope==='commit'?{target:changeSet.targetCommit}:{})});if(collected.fingerprint!==changeSet.fingerprint)fail('source/index comparison changed after the impact plan; recollect and review impact.');};
  fresh();
  const currentScope=()=>collectGitChanges({repositoryRoot:repo,baseline:changeSet.scope==='commit'?changeSet.targetCommit:changeSet.baselineCommit,scope:'working-tree'});
  const currentEvidence=currentScope();
  if(changeSet.scope==='commit'&&currentEvidence.changes.some(c=>[c.path,...(c.oldPath?[c.oldPath]:[])].some(p=>!inside(bundle,path.resolve(repo,p)))))fail('current source differs from selected target commit; use a matching source tree or a reviewed working-tree plan.');
  const sourceEvidence=()=>JSON.stringify(candidateGraph.sources.map(s=>{
    const physical=realpathSync(path.join(repo,relative(s.path)));if(!inside(repo,physical)||!lstatSync(physical).isFile())fail(`source ${s.path} is not a contained regular file.`);
    return [s.id,s.path,path.relative(repo,physical),createHash('sha256').update(readFileSync(physical)).digest('hex')];
  }));
  const expectedSourceEvidence=sourceEvidence();
  const checkCurrent=()=>{if(currentScope().fingerprint!==currentEvidence.fingerprint||sourceEvidence()!==expectedSourceEvidence)fail('current source inputs changed after validation; replan and reanalyze.');};
  const allowed=new Set([...(impactPlan.directlyAffectedFlows??[]),...(impactPlan.transitivelyAffectedFlows??[])].map(r=>r.id));
  const rediscover=new Set((impactPlan.rediscoverEntries??[]).map(r=>r.id));
  if(!allowed.size&&!rediscover.size&&!isDeepStrictEqual(candidateGraph,currentGraph))fail('no affected scope authorizes Diagram JSON changes.');
  const oldFlows=new Map(baseGraph.flows.map(f=>[f.id,f])),newFlows=new Map(candidateGraph.flows.map(f=>[f.id,f]));
  const sources=new Map(baseGraph.sources.map(s=>[s.id,s])),nextSources=new Map(candidateGraph.sources.map(s=>[s.id,s]));
  for(const f of baseGraph.flows)if(!allowed.has(f.id)){
    if(!isDeepStrictEqual(f,newFlows.get(f.id)))fail(`unaffected Flow ${f.id} changed or disappeared.`);
    for(const id of [...f.nodes,...f.edges].flatMap(e=>e.sourceIds))if(!isDeepStrictEqual(sources.get(id),nextSources.get(id))||!readFileSync(path.join(baselineSourceRoot,sources.get(id).path)).equals(readFileSync(path.join(repo,nextSources.get(id).path))))fail(`unaffected Flow ${f.id} has changed evidence ${id}; broaden the impact plan.`);
  }
  for(const f of candidateGraph.flows)if(!oldFlows.has(f.id)&&!rediscover.size)fail(`new Flow ${f.id} requires planned entry/registration rediscovery.`);
  for(const e of baseGraph.entryPoints){const next=candidateGraph.entryPoints.find(n=>n.id===e.id);if(!rediscover.has(e.id)&&!allowed.has(e.flowId)){if(!isDeepStrictEqual(e,next))fail(`unplanned entry change ${e.id}`);for(const id of e.sourceIds)if(!isDeepStrictEqual(sources.get(id),nextSources.get(id))||!readFileSync(path.join(baselineSourceRoot,sources.get(id).path)).equals(readFileSync(path.join(repo,nextSources.get(id).path))))fail(`unplanned entry evidence change ${e.id}/${id}`);}}
  for(const e of candidateGraph.entryPoints)if(!baseGraph.entryPoints.some(o=>o.id===e.id)&&!rediscover.size)fail(`new entry ${e.id} requires planned rediscovery.`);
  const kinds=new Map([...baseGraph.entryPoints,...baseGraph.flows.flatMap(f=>[f,...f.nodes,...f.edges]),...baseGraph.sources].map(e=>[e.id,e]));
  for(const f of candidateGraph.flows)for(const e of f.edges){const old=kinds.get(e.id);if(old&&('from'in old)&&(old.from!==e.from||old.to!==e.to||old.kind!==e.kind||old.mode!==e.mode))fail(`edge ${e.id} changed endpoints or execution semantics; establish a fresh relationship ID.`);}
  const allDocPaths=new Set(['index.md',...refs(baseGraph).map(d=>relative(d.path)),...refs(candidateGraph).map(d=>relative(d.path))]);
  const scopedDocs=new Set(['index.md']);for(const g of [baseGraph,candidateGraph])for(const f of g.flows)if(allowed.has(f.id)||!oldFlows.has(f.id))for(const e of [f,...f.nodes,...f.edges])for(const d of e.docs??[])scopedDocs.add(relative(d.path));
  for(const e of [...baseGraph.entryPoints,...candidateGraph.entryPoints])if(rediscover.has(e.id)||allowed.has(e.flowId)||!baseGraph.entryPoints.some(b=>b.id===e.id))for(const d of e.docs??[])scopedDocs.add(relative(d.path));
  const expectedFingerprint=await fingerprintBundle(bundle);
  const scratch=realpathSync(mkdtempSync(path.join(tmpdir(),'pflow-regeneration-'))),shadow=path.join(scratch,'source'),staged=path.join(shadow,path.relative(repo,bundle));
  try{
    if(inside(repo,scratch))fail('temporary staging would fall inside the analyzed repository.');
    mkdirSync(path.dirname(staged),{recursive:true});cpSync(bundle,staged,{recursive:true,preserveTimestamps:true});
    const documentPaths=new Set();
    for(const [name,desired]of Object.entries(candidateDocuments)){
      const p=relative(name);if(documentPaths.has(p))fail(`ambiguous duplicate document ${p}`);documentPaths.add(p);if(!p.endsWith('.md')||!allDocPaths.has(p)||!scopedDocs.has(p))fail(`unplanned or unrelated document change ${p}`);
      const baseline=text(path.join(baseLayout.docsRoot,p)),current=text(path.join(currentLayout.docsRoot,p));
      if(!allowed.size&&!rediscover.size&&desired!==baseline)fail('no affected scope authorizes generated document changes.');
      const generated=desired===null?undefined:desired;
      const beforeBlocks=flowBlocks(baseline),currentBlocks=flowBlocks(current),afterBlocks=flowBlocks(generated);
      for(const [id,body]of beforeBlocks)if(!allowed.has(id)&&afterBlocks.get(id)!==body&&afterBlocks.get(id)!==currentBlocks.get(id))fail(`unaffected section ${id} changed in shared document ${p}`);
      const merged=await mergeDocument({baseline,current,candidate:desired});const target=path.join(staged,currentLayout.docsRelative,p);
      if(merged===null)rmSync(target);else if(merged!==current){mkdirSync(path.dirname(target),{recursive:true});writeFileSync(target,merged);}
    }
    if(!isDeepStrictEqual(candidateGraph,currentGraph))writeFileSync(path.join(staged,currentLayout.graphRelative),JSON.stringify(candidateGraph,null,2)+'\n');
    // Materialize only referenced current source blobs in original relative layout.
    // Keep contained aliases as aliases so M1's realpath evidence checks still hold.
    for(const s of candidateGraph.sources){
      const p=relative(s.path),physical=realpathSync(path.join(repo,p));if(!inside(repo,physical)||!lstatSync(physical).isFile())fail(`source ${p} is not a contained regular file.`);
      if(inside(bundle,physical))fail(`source evidence ${p} overlaps generated output.`);
      const canonical=path.relative(repo,physical),dest=path.join(shadow,canonical);mkdirSync(path.dirname(dest),{recursive:true});writeFileSync(dest,readFileSync(physical));
      const alias=path.join(shadow,p);if(path.resolve(alias)!==path.resolve(dest)){mkdirSync(path.dirname(alias),{recursive:true});try{lstatSync(alias);}catch(e){if(e.code==='ENOENT')symlinkSync(path.relative(path.dirname(alias),dest),alias);else throw e;}}
    }
    const errors=validateDocumentation(candidateGraph,{docsRoot:path.join(staged,currentLayout.docsRelative),sourceRoot:shadow});if(errors.length)fail(`candidate validation failed: ${JSON.stringify(errors)}`);
    fresh();checkCurrent();if(await fingerprintBundle(bundle)!==expectedFingerprint)fail('documentation changed during staging; preserve the concurrent edits and retry.');
    const expectedStageFingerprint=await fingerprintBundle(staged);
    let used=false;return {stagedRoot:staged,expectedFingerprint,expectedStageFingerprint,async apply({rename}={}){if(used)fail('staged update is already used/disposed.');fresh();checkCurrent();if(await fingerprintBundle(bundle)!==expectedFingerprint||await fingerprintBundle(staged)!==expectedStageFingerprint)fail('bundle or stage changed after validation.');used=true;try{if(expectedFingerprint===expectedStageFingerprint)return {fingerprint:expectedFingerprint,unchanged:true};return await applyBundle({bundleRoot:bundle,stagedRoot:staged,expectedFingerprint,expectedStageFingerprint,...(rename?{rename}:{})});}finally{rmSync(scratch,{recursive:true,force:true});}},dispose(){used=true;rmSync(scratch,{recursive:true,force:true});}};
  }catch(error){rmSync(scratch,{recursive:true,force:true});throw error;}
}
