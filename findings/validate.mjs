import { createHash } from 'node:crypto';
import { readFileSync, lstatSync, realpathSync } from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import architectureSchema from '../schema/architecture-1.0.0.schema.json' with {type:'json'};
import findingsSchema from '../schema/findings-1.0.0.schema.json' with {type:'json'};
import { createSourceProcessor, resolveSourceFile } from '../builder/sources.mjs';
export { findingsSchema };
const ajv = new Ajv2020({allErrors:true,strict:true});ajv.addSchema(architectureSchema);
export const validateFindingsStructure = ajv.compile(findingsSchema);
const validateSource=ajv.compile({$ref:architectureSchema.$id+'#/$defs/sourceReference'});
export const sha256 = value => createHash('sha256').update(value).digest('hex');
function canonical(value) {
  if(Array.isArray(value))return value.map(canonical);
  if(value && typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));
  return value;
}
export const architectureHash = graph => sha256(JSON.stringify(canonical(graph)));
const fail = message => {throw new Error(`Findings: ${message}`);};
const diagnosisKey = f => JSON.stringify(canonical([f.targets.map(t=>canonical(t)).sort((a,b)=>JSON.stringify(a)<JSON.stringify(b)?-1:JSON.stringify(a)>JSON.stringify(b)?1:0),f.title,f.description]));
const safePath = name => typeof name==='string' && name && !name.includes('\\') && !name.includes('\0') && !path.posix.isAbsolute(name) && !/^[A-Za-z]:/.test(name) && !name.split('/').includes('..');
export function validateFindingDocument(document) {
  if(!validateFindingsStructure(document)) fail(validateFindingsStructure.errors.map(e=>`${e.instancePath||'/'} ${e.message}`).join('; '));
  const ids = new Set(), diagnoses=new Set();
  for(const finding of document.findings) {
    if(ids.has(finding.id))fail(`duplicate ID ${finding.id}`);ids.add(finding.id);
    const key=diagnosisKey(finding);if(diagnoses.has(key))fail(`duplicate diagnosis ${finding.id}; retain one opaque identity`);diagnoses.add(key);
    const sources=new Map();
    for(const evidence of finding.evidence) {
      if(!safePath(evidence.source.path))fail(`unsafe evidence path for ${finding.id}: ${evidence.source.path}`);
      if(!evidence.source.startLine || evidence.source.endLine<evidence.source.startLine)fail(`bounded source lines are required for ${finding.id}`);
      const previous = sources.get(evidence.source.id);
      if(previous && JSON.stringify(canonical(previous))!==JSON.stringify(canonical(evidence)))fail(`conflicting evidence ID ${evidence.source.id}`);
      sources.set(evidence.source.id,evidence);
    }
  }
}
export function captureFindingEvidence({repositoryRoot,sources}) {
  if(!Array.isArray(sources) || !sources.length)fail('supply bounded SourceReferences');
  const processor=createSourceProcessor({repositoryRoot});
  const evidence=sources.map(source=>{
    if(!validateSource(source) || !source.startLine)fail('invalid or unbounded SourceReference');
    const file=resolveSourceFile(repositoryRoot,source.path),text=processor.readText(file);
    if(typeof text!=='string')fail(`evidence is unreadable, invalid UTF-8 or exceeds 1 MiB: ${source.path}`);
    return {source:structuredClone(source),sha256:sha256(text)};
  });
  const checked=processor.extract(sources);
  if(checked.diagnostics.length)fail(checked.diagnostics.map(d=>d.message).join('; '));
  return evidence;
}
export function inspectFindings(document,{architecture,repositoryRoot,strict=false,bundleRoot}={}) {
  validateFindingDocument(document);
  const digest=architectureHash(architecture),rows=[],diagnostics=[],protectedPaths=[],sources=[],records=new Map();
  const processor=createSourceProcessor({repositoryRoot}),hashes=new Map(),sourceErrors=new Map();
  let profile,profileError;
  if(bundleRoot) {
    const file=path.join(bundleRoot,'snapshot.json');
    try {
      const stat=lstatSync(file);if(stat.isSymbolicLink()||!stat.isFile()||stat.size>4*1024*1024)throw new Error('Unsafe Snapshot file.');
      protectedPaths.push(file);profile=JSON.parse(readFileSync(file,'utf8'));
      if(profile.snapshotVersion!=='1.0.0'||!Array.isArray(profile.scopes)||!profile.files||typeof profile.files!=='object'||Array.isArray(profile.files)||profile.scopes.some(s=>!s||typeof s!=='object'||!safePath(s.path)||!['code','natural-language'].includes(s.kind))||Object.entries(profile.files).some(([p,h])=>!safePath(p)||typeof h!=='string'||!/^[a-f0-9]{64}$/.test(h)))throw new Error('Incompatible Snapshot.');
    } catch(error) {if(error.code!=='ENOENT'){profile=undefined;profileError='Snapshot code provenance is invalid; review the documentation baseline.';}}
  }
  document.findings.forEach((finding,i)=>finding.evidence.forEach((evidence,j)=>{
    const alias=`src_finding_${i}_${j}`;sources.push({...evidence.source,id:alias});records.set(alias,{finding,evidence});
    try {
      const file=resolveSourceFile(repositoryRoot,evidence.source.path);
      if(bundleRoot) {const rel=path.relative(realpathSync(bundleRoot),file);if(rel!== '..'&&!rel.startsWith('..'+path.sep)&&!path.isAbsolute(rel))throw new Error('Generated documentation and captured statements cannot establish code evidence.');}
      protectedPaths.push(file);
      if(!hashes.has(file)) {const text=processor.readText(file);if(typeof text!=='string')throw new Error('Evidence is invalid UTF-8 or exceeds the file size limit.');hashes.set(file,sha256(text));}
      hashes.set(alias,hashes.get(file));
    }catch(error){sourceErrors.set(alias,error.code?`Evidence is missing or unreadable: ${evidence.source.path}`:error.message);}
  }));
  const extracted=processor.extract(sources),snippets=new Map();
  for(const snippet of extracted.snippets)for(const id of snippet.sourceIds)snippets.set(id,snippet.lines);
  for(const issue of extracted.diagnostics)sourceErrors.set(issue.path,issue.message);
  document.findings.forEach((finding,i)=>{
    const reasons=[],excerpts=[];
    if(profileError)reasons.push(profileError);
    if(profile)for(const {source} of finding.evidence) {
      const name=path.posix.normalize(source.path),scopes=profile.scopes.filter(s=>s.path==='.'||name===s.path||name.startsWith(s.path+'/'));
      if(!Object.hasOwn(profile.files,name)||!scopes.length||scopes.some(s=>s.kind!=='code'))reasons.push(`Snapshot code provenance is missing or ambiguous, including natural-language evidence: ${source.path}`);
    }
    if(finding.architectureHash!==digest)reasons.push('Diagram changed since analysis.');
    for(const target of finding.targets) {
      const flow=architecture.flows.find(f=>f.id===target.flowId);
      if(!flow || target.nodeId&&!flow.nodes.some(n=>n.id===target.nodeId) || target.edgeId&&!flow.edges.some(e=>e.id===target.edgeId))reasons.push('A recorded target is missing or belongs to another flow.');
    }
    finding.evidence.forEach((evidence,j)=>{
      const alias=`src_finding_${i}_${j}`;
      if(sourceErrors.has(alias))reasons.push(sourceErrors.get(alias));
      else if(hashes.get(alias)!==evidence.sha256)reasons.push(`Evidence changed: ${evidence.source.path}`);
      else if(snippets.has(alias))excerpts.push({source:evidence.source,lines:snippets.get(alias)});
    });
    const stale=Boolean(reasons.length),review=finding.reviews.at(-1);
    if(stale && strict)fail(`${finding.id}: ${[...new Set(reasons)].join(' ')}`);
    if(stale)diagnostics.push({severity:'warning',phase:'findings',path:finding.id,message:`Needs revalidation. ${[...new Set(reasons)].join(' ')}`});
    rows.push({...finding,state:stale?'stale':'current',status:review.status,active:!stale&&['unreviewed','supported'].includes(review.status),reasons:[...new Set(reasons)],snippets:excerpts});
  });
  return {document,rows,diagnostics,protectedPaths:[...new Set(protectedPaths)]};
}
export function loadFindings(bundleRoot,options) {
  const file=path.join(bundleRoot,'findings.json');let stat;
  try {stat=lstatSync(file);} catch(error) {if(error.code==='ENOENT')return;throw error;}
  if(stat.isSymbolicLink() || !stat.isFile() || stat.size>4*1024*1024)fail('findings.json must be a contained regular file no larger than 4 MiB');
  const canonical=realpathSync(file),rel=path.relative(realpathSync(bundleRoot),canonical);
  if(rel.startsWith('..')||path.isAbsolute(rel))fail('findings.json escapes its bundle');
  const bytes=readFileSync(canonical),document=JSON.parse(bytes);
  return {...inspectFindings(document,{...options,bundleRoot}),path:canonical,digest:sha256(bytes)};
}
// New diagnoses start unreviewed. Existing diagnoses and all decisions survive reruns.
export function reconcileFindings(previous,candidate,reviewChanges={}) {
  validateFindingDocument(candidate);if(previous)validateFindingDocument(previous);
  const result=new Map((previous?.findings||[]).map(f=>[f.id,structuredClone(f)]));
  for(const item of candidate.findings) {
    const prior=result.get(item.id);
    if(prior) {
      if(diagnosisKey(prior)!==diagnosisKey(item))fail(`identity changed for ${item.id}; allocate a new ID and retain the old diagnosis`);
      result.set(item.id,{...structuredClone(item),reviews:structuredClone(prior.reviews)});
    } else {
      const duplicate=[...result.values()].find(f=>diagnosisKey(f)===diagnosisKey(item));if(duplicate)fail(`duplicate diagnosis; reuse ${duplicate.id} and preserve its decisions`);
      if(item.reviews.length!==1 || item.reviews[0].status!=='unreviewed')fail(`new finding ${item.id} must start unreviewed`);
      result.set(item.id,structuredClone(item));
    }
  }
  for(const [id,review] of Object.entries(reviewChanges)) {
    const item=result.get(id);
    if(!item || !candidate.findings.some(f=>f.id===id))fail(`review requires current reanalysis of ${id}`);
    const check={findingsVersion:'1.0.0',findings:[{...item,reviews:[review]}]};validateFindingDocument(check);
    if(JSON.stringify(item.reviews.at(-1))!==JSON.stringify(review))item.reviews.push(structuredClone(review));
  }
  const document={findingsVersion:'1.0.0',findings:[...result.values()].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0)};
  validateFindingDocument(document);return document;
}
