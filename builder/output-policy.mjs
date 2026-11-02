import { accessSync, constants, lstatSync, mkdirSync, readdirSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { containsPath, resolveBundleRoot } from './bundle-layout.mjs';

const present = file => { try { return lstatSync(file); } catch(error) { if(error.code==='ENOENT')return;throw error; } };
const fail = message => { throw new Error(`Output selection: ${message}`); };
function checkedText(value) {
  if(typeof value!=='string'||!value.trim()||value.includes('\0')||value.includes('\\')||value.split('/').includes('..'))fail('unsafe path; use a directory without traversal.');
  return value;
}
function rootDirectory(value) {
  const absolute=path.resolve(checkedText(value)),stat=lstatSync(absolute);
  if(stat.isSymbolicLink()||!stat.isDirectory())fail(`selected root must be a directory, not a symlink: ${absolute}`);
  let cursor=path.parse(absolute).root;
  for(const component of absolute.slice(cursor.length).split(path.sep).filter(Boolean)){cursor=path.join(cursor,component);if(lstatSync(cursor).isSymbolicLink())fail(`selected path contains a symlink; use its canonical directory: ${cursor}`);}
  return realpathSync(absolute);
}
function writable(directory) {
  if(!(statSync(directory).mode&0o222))fail(`directory is not writable: ${directory}`);
  accessSync(directory,constants.W_OK|constants.X_OK);
}
function checkDirectories(boundary,target) {
  if(!containsPath(boundary,target))fail('bundle escapes the selected document workspace.');
  let cursor=boundary,nearest=boundary;
  for(const component of path.relative(boundary,target).split(path.sep).filter(Boolean)){
    cursor=path.join(cursor,component);const stat=present(cursor);
    if(stat){if(stat.isSymbolicLink()||!stat.isDirectory())fail(`output path is a symlink or file collision: ${cursor}`);nearest=cursor;}
  }
  writable(nearest);
}
// Return a canonical ancestor and lexical missing suffix for explicitly authorized
// destinations outside the selection root. No root widening for source evidence.
function externalTarget(target) {
  let ancestor=path.dirname(target);const suffix=[path.basename(target)];
  while(!present(ancestor)){suffix.unshift(path.basename(ancestor));ancestor=path.dirname(ancestor);}
  const boundary=rootDirectory(ancestor);
  return {boundary,target:path.join(boundary,...suffix)};
}

/** Trusted orchestration helper; this selects/creates directories, never content. */
export function selectOutput({mode,repositoryRoot,cwd=process.cwd(),documentWorkspace,outputDirectory,protectedPaths=[],create=false}={}) {
  if(!['repository','prompt'].includes(mode))fail('mode must be repository or prompt.');
  const selectionRoot=rootDirectory(mode==='repository'?repositoryRoot:cwd);
  let boundary=documentWorkspace?rootDirectory(path.resolve(selectionRoot,checkedText(documentWorkspace))):selectionRoot;
  let bundle;
  if(outputDirectory!==undefined){
    bundle=path.resolve(boundary,checkedText(outputDirectory));
    if(!containsPath(boundary,bundle)){
      if(documentWorkspace)fail('explicit output escapes the selected document workspace.');
      const external=externalTarget(bundle);boundary=external.boundary;bundle=external.target;
    }
  }else if(documentWorkspace)bundle=boundary;
  else{
    const docs=path.join(selectionRoot,'docs'),doc=path.join(selectionRoot,'doc');
    const selected=present(docs)?docs:present(doc)?doc:docs;
    checkDirectories(selectionRoot,selected);bundle=path.join(selected,'architecture');
  }
  checkDirectories(boundary,bundle);
  let layout='flat',docsRoot=bundle,graphPath=path.join(bundle,'diagrams','architecture.json');
  const legacy=path.join(bundle,'architecture.json');
  if(present(legacy)||present(graphPath)){
    const resolved=resolveBundleRoot(bundle);
    ({layout,docsRoot,graphPath}=resolved);
  }else{
    for(const name of ['index.md','architecture.html','docs'])if(present(path.join(bundle,name)))fail(`existing unowned bundle content requires review: ${name}`);
    for(const name of ['flows','diagrams']){const dir=path.join(bundle,name),stat=present(dir);if(stat&&(!stat.isDirectory()||stat.isSymbolicLink()||readdirSync(dir).length))fail(`existing unowned bundle content requires review: ${name}`);}
  }
  const directories=[bundle,docsRoot,path.join(docsRoot,'flows'),path.dirname(graphPath),...(mode==='prompt'?[path.join(bundle,'evidence')]:[])];
  for(const directory of directories)checkDirectories(boundary,directory);
  const files=[graphPath,path.join(docsRoot,'index.md'),path.join(bundle,'architecture.html'),...(mode==='prompt'?[path.join(bundle,'evidence/request.md')]:[])];
  for(const file of files){
    const stat=present(file);if(stat&&(stat.isSymbolicLink()||!stat.isFile()))fail(`output file collision: ${file}`);
    if(stat)accessSync(file,constants.W_OK);
    for(const protectedFile of protectedPaths){const protectedStat=present(protectedFile)?statSync(protectedFile):undefined;if(path.resolve(protectedFile)===file||(stat&&protectedStat&&stat.dev===protectedStat.dev&&stat.ino===protectedStat.ino))fail(`output would overwrite source/evidence: ${file}`);}
  }
  if(create){for(const directory of directories)mkdirSync(directory,{recursive:true});for(const directory of directories)checkDirectories(boundary,directory);}
  return {mode,selectionRoot,containmentRoot:documentWorkspace?boundary:outputDirectory!==undefined?bundle:selectionRoot,evidenceRoot:mode==='repository'?selectionRoot:documentWorkspace?boundary:outputDirectory!==undefined?bundle:selectionRoot,bundleRoot:bundle,layout,docsRoot,graphPath,outputPath:path.join(bundle,'architecture.html')};
}
