import { lstatSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';

export const containsPath = (root, target) => { const p=path.relative(root,target);return p!=='..'&&!p.startsWith(`..${path.sep}`)&&!path.isAbsolute(p); };
const present = file => { try { lstatSync(file);return true; } catch(error) { if(error.code==='ENOENT')return false;throw error; } };

// Resolve filesystem locations only. Schema and evidence validation stay shared.
export function resolveBundleLayout(graphPath, { inputRoot } = {}) {
  const graph=path.resolve(graphPath),directory=path.dirname(graph);
  if(path.basename(graph)!=='architecture.json')throw new Error('Expected architecture.json.');
  const flat=path.basename(directory)==='diagrams',parent=path.dirname(directory);
  let bundleRoot=directory,docsRoot=path.join(directory,'docs'),layout='legacy';
  if(flat&&(present(path.join(parent,'index.md'))||!present(path.join(directory,'docs')))) {
    bundleRoot=parent;docsRoot=parent;layout='flat';
    if(present(path.join(parent,'architecture.json'))||present(path.join(parent,'docs','index.md'))||present(path.join(directory,'docs')))throw new Error('Ambiguous bundle layouts or competing Markdown roots. Preserve both sets and select one explicitly.');
  }else if(present(path.join(directory,'index.md'))||(present(path.join(directory,'diagrams','architecture.json'))&&!present(path.join(directory,'diagrams','docs','index.md')))) {
    throw new Error('Ambiguous bundle layouts or competing Markdown roots. Preserve both sets and select one explicitly.');
  }
  const boundary=realpathSync(inputRoot??bundleRoot);
  if(!containsPath(boundary,realpathSync(bundleRoot))||!containsPath(boundary,realpathSync(graph)))throw new Error('Bundle or architecture artifact escapes input root.');
  const canonicalDocs=realpathSync(docsRoot);
  if(!containsPath(boundary,canonicalDocs)||!containsPath(realpathSync(bundleRoot),canonicalDocs)||!statSync(canonicalDocs).isDirectory())throw new Error('Markdown docs directory must remain inside input root and bundle.');
  return {layout,bundleRoot,docsRoot:canonicalDocs,graphPath:graph,graphRelative:path.relative(bundleRoot,graph),docsRelative:path.relative(bundleRoot,docsRoot)};
}

export function resolveBundleRoot(bundleRoot, options={}) {
  const root=path.resolve(bundleRoot),legacy=path.join(root,'architecture.json');
  return resolveBundleLayout(present(legacy)?legacy:path.join(root,'diagrams','architecture.json'),options);
}
