import {cpSync,existsSync,lstatSync,mkdirSync,mkdtempSync,readFileSync,realpathSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {containsPath,resolveBundleRoot} from '../builder/bundle-layout.mjs';
import {prepareBuild} from '../builder/pipeline.mjs';
import {writeStandaloneHTML} from '../builder/html.mjs';
import {resolveSourceFile} from '../builder/sources.mjs';
import {applyBundle,fingerprintBundle} from '../src/skills/pflow-regenerate/scripts/safe-update.mjs';
import {inspectFindings,loadFindings,reconcileFindings,sha256} from './validate.mjs';
const fail=message=>{throw new Error(`Findings publication: ${message}`);};
const json=value=>JSON.stringify(value,null,2)+'\n';
export function inspectFindingBundle({bundleRoot,repositoryRoot}) {
  const layout=resolveBundleRoot(bundleRoot),architecture=JSON.parse(readFileSync(layout.graphPath,'utf8'));
  const prepared=prepareBuild({input:layout.bundleRoot,repositoryRoot,output:path.join(layout.bundleRoot,'architecture.html')});
  if(prepared.artifacts.length!==1)fail('select one connected architecture bundle');
  const findings=loadFindings(layout.bundleRoot,{architecture,repositoryRoot});
  return {digest:findings?.digest??null,document:findings?.document??{findingsVersion:'1.0.0',findings:[]},rows:findings?.rows??[],diagnostics:findings?.diagnostics??[]};
}
export async function prepareFindingsPublication({bundleRoot,repositoryRoot,candidate,previousDigest,reviewChanges={}}) {
  const bundle=realpathSync(bundleRoot),root=realpathSync(repositoryRoot),layout=resolveBundleRoot(bundle),architecture=JSON.parse(readFileSync(layout.graphPath,'utf8'));
  const originalFingerprint=await fingerprintBundle(bundle),previous=loadFindings(bundle,{architecture,repositoryRoot:root});
  if(previousDigest!==(previous?.digest??null))fail('findings changed or no explicit baseline was supplied; inspect again before publication');
  const current=inspectFindings(candidate,{architecture,repositoryRoot:root,strict:true,bundleRoot:bundle});
  const document=reconcileFindings(previous?.document,candidate,reviewChanges);
  // Capture all relevant bytes, including missing stale evidence, for freshness checks.
  const sourcePaths=[...new Set([...architecture.sources,...document.findings.flatMap(f=>f.evidence.map(e=>e.source))].map(s=>s.path))].sort();
  function sourceState() {return sha256(json(sourcePaths.map(name=>{try{return [name,sha256(readFileSync(resolveSourceFile(root,name)))];}catch(error){return [name,'unavailable:'+error.code+':'+(error.code?'':error.message)];}})));}
  const evidenceFingerprint=sourceState();
  let common=path.dirname(bundle);while(!containsPath(common,root))common=path.dirname(common);
  const scratch=mkdtempSync(path.join(realpathSync(tmpdir()),'pflow-findings-')),staged=path.join(scratch,'tree',path.relative(common,bundle)),shadowRoot=path.join(scratch,'tree',path.relative(common,root));
  mkdirSync(staged,{recursive:true});mkdirSync(shadowRoot,{recursive:true});
  try {
    cpSync(bundle,staged,{recursive:true});
    writeFileSync(path.join(staged,'findings.json'),json(document));
    for(const name of sourcePaths) {
      const physical=path.resolve(root,name);
      if(containsPath(bundle,physical)) {if(!containsPath(path.join(bundle,'evidence'),physical))fail('generated documents cannot serve as code evidence');continue;}
      try {const bytes=readFileSync(resolveSourceFile(root,name)),dest=path.join(shadowRoot,name);mkdirSync(path.dirname(dest),{recursive:true});writeFileSync(dest,bytes);}
      catch(error) {if(architecture.sources.some(s=>s.path===name))throw error;/* Retain stale findings, never invent missing source. */}
    }
    const prepared=prepareBuild({input:staged,repositoryRoot:shadowRoot,output:path.join(staged,'architecture.html')});
    if(prepared.artifacts.length!==1)fail('select one connected architecture bundle');
    inspectFindings(candidate,{architecture:prepared.artifacts[0].architecture,repositoryRoot:shadowRoot,strict:true,bundleRoot:staged});
    writeStandaloneHTML(prepared);
    const stageFingerprint=await fingerprintBundle(staged);
    if(sourceState()!==evidenceFingerprint || await fingerprintBundle(bundle)!==originalFingerprint)fail('inputs changed during findings staging');
    let used=false;
    return {stagedRoot:staged,document,diagnostics:prepared.diagnostics,async apply({rename}={}) {
      if(used)fail('stage already used or disposed');
      if(sourceState()!==evidenceFingerprint)fail('source evidence changed after validation');
      used=true;
      try {
        if(stageFingerprint===originalFingerprint)return {unchanged:true};
        return await applyBundle({bundleRoot:bundle,stagedRoot:staged,expectedFingerprint:originalFingerprint,expectedStageFingerprint:stageFingerprint,...(rename?{rename}:{})});
      }finally{rmSync(scratch,{recursive:true,force:true});}
    },dispose(){used=true;rmSync(scratch,{recursive:true,force:true});}};
  }catch(error){rmSync(scratch,{recursive:true,force:true});throw error;}
}
