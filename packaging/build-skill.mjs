import { readFileSync, readdirSync, mkdirSync, writeFileSync, rmSync, renameSync, mkdtempSync, chmodSync, lstatSync, existsSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { build } from 'esbuild';
import { parseHTML } from 'linkedom';
const root=fileURLToPath(new URL('../',import.meta.url));
const stageNames=['pflow','pflow-discovery','pflow-execution-flow','pflow-external-boundaries','pflow-async-linking','pflow-impact','pflow-regenerate','pflow-rebuild'];
const runtimeRef='references/runtime.md';
function dependencyNotices(inputs) {
 const packages=new Map(),modules=path.join(root,'node_modules')+path.sep;
 for(const input of Object.keys(inputs)) {
  let directory=path.dirname(path.resolve(root,input));
  while(directory.startsWith(modules)) {
   const metadata=path.join(directory,'package.json');
   if(existsSync(metadata)) {
    const info=JSON.parse(readFileSync(metadata,'utf8'));
    if(info.name) { packages.set(info.name,{directory,info}); break; }
   }
   directory=path.dirname(directory);
  }
 }
 return '/*! Bundled dependency notices\n'+[...packages].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([name,{directory,info}])=>{
  const licenses=readdirSync(directory).filter(name=>/^licen[sc]e(?:\.|$)/i.test(name)).sort();
  if(!licenses.length)throw new Error(`Missing bundled dependency license: ${name}`);
  return `${name} ${info.version}\n`+licenses.map(file=>readFileSync(path.join(directory,file),'utf8')).join('\n');
 }).join('\n\n').replace(/\*\//g,'* /')+'\n*/\n';
}
function mapping(){
 const map=new Map();
 for(const name of stageNames){map.set(`skills/${name}/SKILL.md`,name==='pflow'?'SKILL.md':`references/${name.slice('pflow-'.length)}-workflow.md`);
  for(const f of readdirSync(path.join(root,'skills',name,'references')).sort())if(f.endsWith('.md'))map.set(`skills/${name}/references/${f}`,name==='pflow'?`references/${f}`:`references/${name.slice('pflow-'.length)}/${f}`);
 }
 map.set('docs/design/m1-01-common-architecture-data-model.md','references/contracts/model.md');map.set('docs/markdown-contract.md','references/contracts/markdown.md');map.set('schema/architecture-1.0.0.schema.json','references/contracts/schema.md');map.set('schema/findings-1.0.0.schema.json','references/contracts/findings-schema.md');
 for(const name of ['architecture-index.md','execution-flow.md'])map.set(`docs/templates/${name}`,`references/templates/${name}`);
 return map;
}
const sourceRuntime=/\b(?:builder\/[\w-]+\.mjs|validation\/[\w-]+\.mjs|skills\/[\w-]+\/scripts\/[\w-]+\.mjs)\b/g;
function rewrite(source,destination,map){
 let text=readFileSync(path.join(root,source),'utf8');
 if(source.endsWith('.json'))return '# '+(source.includes('/findings-')?'Optional code findings JSON Schema':'Approved architecture JSON Schema')+'\n\nVersion 1.0.0; also embedded in the executable. Findings reuse the architecture SourceReference definition in schema.md.\n\n```json\n'+text.trimEnd()+'\n```\n';
 if(source.endsWith('/SKILL.md')&&destination!=='SKILL.md')text=text.replace(/^---\n[\s\S]*?\n---\n\n/,'');
 let fence;
 text=text.split('\n').map(line=>{
  const marker=line.match(/^\s*(`{3,}|~{3,})/);if(marker){if(!fence)fence=marker[1];else if(marker[1][0]===fence[0]&&marker[1].length>=fence.length)fence=undefined;return line;}
  if(fence)return line;
  return line.split(/(`+[^`]*`+)/g).map((part,i)=>i%2?part:part.replace(/\[([^\]]+)\]\(([^)]+)\)/g,(whole,label,href)=>{
   if(/^(?:https?:|#)/.test(href)||href.includes('{{'))return whole;
   const [file,anchor]=href.split('#'),resolved=path.posix.normalize(path.posix.join(path.posix.dirname(source),file));
   const target=map.get(resolved)||(/\.mjs$/.test(resolved)||resolved==='builder/README.md'?runtimeRef:undefined);
   if(!target)throw new Error(`Unmapped Skill reference ${source}: ${href}`);
   return `[${label}](${path.posix.relative(path.posix.dirname(destination),target)}${anchor?'#'+anchor:''})`;
  })).join('');
 }).join('\n');
 // Source module names in prose become API references; fenced examples are authored
 // with the installed executable already. No unavailable module is distributed.
 text=text.replace(sourceRuntime,'scripts/pflow.mjs');
 if(source==='docs/markdown-contract.md')text=text.replace('Run `npm test`.','For installed validation, use [the packaged runtime](../runtime.md) validate command; source-checkout test commands do not apply to installations.').replace('M7 findings','M9 findings (historically M7)');
 if(destination!=='SKILL.md'&&source.endsWith('/SKILL.md'))text+='\nRuntime functions and commands are available through [the packaged runtime]('+path.posix.relative(path.posix.dirname(destination),runtimeRef)+'). No sibling Skill installation is required.\n';
 return text;
}
export function validateDistribution(directory){
 const files=[];
 function walk(relative=''){for(const name of readdirSync(path.join(directory,relative)).sort()){const next=path.join(relative,name),portable=next.split(path.sep).join('/'),stat=lstatSync(path.join(directory,next));if(stat.isSymbolicLink())throw new Error('Distribution cannot contain symlinks.');if(stat.isDirectory()){if(portable!=='scripts'&&portable!=='references'&&!portable.startsWith('references/'))throw new Error(`Unexpected distribution directory: ${portable}`);walk(next);}else if(stat.isFile())files.push(portable);else throw new Error('Unsupported distribution file.');}}
 walk();
 if(!files.includes('SKILL.md')||!files.includes('scripts/pflow.mjs'))throw new Error('Missing Skill entry point or executable.');
 for(const file of files)if(file!=='SKILL.md'&&file!=='scripts/pflow.mjs'&&!/^references\/.+\.md$/.test(file))throw new Error(`Unexpected distribution file: ${file}`);
 for(const file of files.filter(f=>f.endsWith('.md'))){let fence;for(const line of readFileSync(path.join(directory,file),'utf8').split('\n')){
  const marker=line.match(/^\s*(`{3,}|~{3,})/);if(marker){if(!fence)fence=marker[1];else if(marker[1][0]===fence[0]&&marker[1].length>=fence.length)fence=undefined;continue;}if(fence)continue;
  for(const match of line.replace(/`+[^`]*`+/g,'').matchAll(/\[[^\]]+\]\(([^)]+)\)/g)){const href=match[1];if(/^(?:https?:|#)/.test(href)||href.includes('{{'))continue;const target=path.posix.normalize(path.posix.join(path.posix.dirname(file),href.split('#')[0]));if(!files.includes(target))throw new Error(`Broken distributed link ${file}: ${href}`);}
 }}
 return files;
}
export async function buildSkill({output=path.join(root,'dist/pflow')}={}){
 // Output is a development build destination, never an analyzed target path.
 const final=path.resolve(output);if(final===root||root.startsWith(final+path.sep)||!path.basename(final))throw new Error('Unsafe distribution build destination.');
 if(existsSync(final)&&lstatSync(final).isSymbolicLink())throw new Error('Distribution destination cannot be a symlink.');
 if(existsSync(final)&&readdirSync(final).length)validateDistribution(final);
 const template=readFileSync(path.join(root,'viewer/index.html'),'utf8'),document=parseHTML(template).document;
 const names=['index.html',...document.querySelectorAll('script[src],link[rel="stylesheet"]')].map(n=>typeof n==='string'?n:n.getAttribute('src')||n.getAttribute('href')).filter(n=>!['sample-data.js','sample-documents.js'].includes(n));
 const assets=Object.fromEntries(names.map(name=>{if(!/^[a-z][a-z0-9-]*\.(html|js|css)$/.test(name))throw new Error('Unsafe Viewer asset.');return [name,readFileSync(path.join(root,'viewer',name),'utf8')];}));
 mkdirSync(path.dirname(final),{recursive:true});const temporary=mkdtempSync(path.join(path.dirname(final),'.pflow-build-'));
 try{
  mkdirSync(path.join(temporary,'scripts'));
  const result=await build({absWorkingDir:root,entryPoints:['packaging/cli.mjs'],outfile:'pflow.mjs',bundle:true,platform:'node',format:'esm',target:'node24',packages:'bundle',write:false,metafile:true,legalComments:'inline',charset:'utf8',
   define:{__PFLOW_VIEWER_ASSETS__:JSON.stringify(assets)},
   alias:{canvas:path.join(root,'node_modules/linkedom/commonjs/canvas-shim.cjs')},
   // Match the source checkout without optional CSSOM native/ambient add-ons.
   // CSSOM catches this absence and uses its bundled implementation.
   plugins:[{name:'optional-cssstyle',setup(api){api.onResolve({filter:/^cssstyle$/},()=>({path:'cssstyle',namespace:'pflow-optional'}));api.onLoad({filter:/.*/,namespace:'pflow-optional'},()=>({contents:"throw new Error('Optional cssstyle is not installed in pFlow.');",loader:'js'}));}}],
   banner:{js:"import { createRequire as pflowCreateRequire } from 'node:module'; const require = pflowCreateRequire(import.meta.url);"}});
  const builtins=new Set(builtinModules.flatMap(n=>[n,n.startsWith('node:')?n:'node:'+n]));
  for(const item of Object.values(result.metafile.outputs))for(const imp of item.imports)if(imp.external&&!builtins.has(imp.path))throw new Error(`Unbundled runtime dependency: ${imp.path}`);
  if(result.outputFiles.length!==1)throw new Error('Expected one JavaScript output.');
  const executable=Buffer.concat([result.outputFiles[0].contents,Buffer.from('\n'+dependencyNotices(result.metafile.inputs))]);
  writeFileSync(path.join(temporary,'scripts/pflow.mjs'),executable);chmodSync(path.join(temporary,'scripts/pflow.mjs'),0o755);
  const map=mapping();for(const [source,destination] of map){const to=path.join(temporary,destination);mkdirSync(path.dirname(to),{recursive:true});writeFileSync(to,rewrite(source,destination,map));}
  const files=validateDistribution(temporary);
  // Only replace this dedicated generated directory after successful validation.
  if(existsSync(final))rmSync(final,{recursive:true});renameSync(temporary,final);
  return {directory:final,files,runtimeBytes:executable.length};
 }finally{rmSync(temporary,{recursive:true,force:true});}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const result=await buildSkill();process.stdout.write(`Built ${result.directory}: ${result.files.length} files; one runtime (${result.runtimeBytes} bytes).\n`);}catch(error){process.stderr.write(`Skill build: ${error.message}\n`);process.exitCode=1;}
}
