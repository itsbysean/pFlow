import assert from 'node:assert/strict';
import {test} from 'node:test';
import {chmodSync,cpSync,existsSync,linkSync,mkdirSync,mkdtempSync,readFileSync,realpathSync,readdirSync,rmSync,symlinkSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {selectOutput} from '../builder/output-policy.mjs';
const rootOf=t=>{const p=realpathSync(mkdtempSync(path.join(tmpdir(),'pflow-output-')));t.after(()=>{chmodSync(p,0o700);rmSync(p,{recursive:true,force:true});});return p;};
for(const mode of ['repository','prompt'])for(const shape of ['docs','doc','neither','both'])test(`${mode} output policy: ${shape}`,t=>{
 const root=rootOf(t);if(['docs','both'].includes(shape))mkdirSync(path.join(root,'docs'));if(['doc','both'].includes(shape))mkdirSync(path.join(root,'doc'));
 const options={mode,repositoryRoot:root,cwd:root},chosen=selectOutput(options),folder=shape==='doc'?'doc':'docs';assert.equal(chosen.bundleRoot,path.join(root,folder,'architecture'));assert.equal(existsSync(chosen.bundleRoot),false,'Planning must not create output');
 const made=selectOutput({...options,create:true});assert.equal(made.docsRoot,made.bundleRoot);assert.equal(made.graphPath,path.join(made.bundleRoot,'diagrams/architecture.json'));assert.equal(made.evidenceRoot,root);assert.equal(existsSync(path.join(made.bundleRoot,'evidence')),mode==='prompt');assert.equal(existsSync(made.outputPath),false,'Selector does not write or overwrite HTML');
});
test('repository default uses analyzed root instead of unrelated cwd',t=>{const cwd=rootOf(t),project=path.join(cwd,'project');mkdirSync(project);assert.equal(selectOutput({mode:'repository',repositoryRoot:project,cwd}).bundleRoot,path.join(project,'docs/architecture'));});
test('explicit workspace is final destination; a relative explicit bundle stays inside it',t=>{
 const application=rootOf(t),documents=rootOf(t);writeFileSync(path.join(application,'sentinel'),'keep');const one=selectOutput({mode:'prompt',cwd:application,documentWorkspace:documents,create:true});assert.equal(one.bundleRoot,documents);assert.equal(one.evidenceRoot,documents);assert.equal(existsSync(path.join(documents,'architecture')),false);
 const two=selectOutput({mode:'prompt',cwd:application,documentWorkspace:documents,outputDirectory:'nested/process',create:true});assert.equal(two.bundleRoot,path.join(documents,'nested/process'));assert.equal(two.evidenceRoot,documents);assert.deepEqual(readdirSync(application),['sentinel']);
});
test('explicit output may be outside the project, without changing repository evidence root',t=>{const project=rootOf(t),documents=rootOf(t),bundle=path.join(documents,'chosen');const plan=selectOutput({mode:'repository',repositoryRoot:project,outputDirectory:bundle,create:true});assert.equal(plan.bundleRoot,bundle);assert.equal(plan.evidenceRoot,project);assert.equal(existsSync(path.join(bundle,'architecture')),false);});
for(const kind of ['traversal','escape','symlink','file','unwritable','unowned','protected'])test(`unsafe output (${kind}) rejects without fallback or source replacement`,t=>{
 const root=rootOf(t),outside=rootOf(t),options={mode:'prompt',cwd:root,create:true};mkdirSync(path.join(root,'doc'));
 if(kind==='traversal')options.outputDirectory='../escape';
 if(kind==='escape'){options.documentWorkspace=root;options.outputDirectory=outside;}
 if(kind==='symlink')symlinkSync(outside,path.join(root,'docs'));
 if(kind==='file')writeFileSync(path.join(root,'docs'),'source content');
 if(kind==='unwritable'){mkdirSync(path.join(root,'docs'));chmodSync(path.join(root,'docs'),0o500);t.after(()=>{if(existsSync(path.join(root,'docs')))chmodSync(path.join(root,'docs'),0o700);});}
 if(kind==='unowned'){options.outputDirectory='output';mkdirSync(path.join(root,'output'));writeFileSync(path.join(root,'output/index.md'),'Manual content');}
 if(kind==='protected'){options.outputDirectory='output';mkdirSync(path.join(root,'output'));writeFileSync(path.join(root,'protected'),'source');linkSync(path.join(root,'protected'),path.join(root,'output/architecture.html'));options.protectedPaths=[path.join(root,'protected')];}
 assert.throws(()=>selectOutput(options));assert.deepEqual(readdirSync(path.join(root,'doc')),[]);assert.deepEqual(readdirSync(outside),[]);if(kind==='file')assert.equal(readFileSync(path.join(root,'docs'),'utf8'),'source content');if(kind==='protected')assert.equal(readFileSync(path.join(root,'protected'),'utf8'),'source');
});
test('valid preferred docs ignores an unselected doc symlink',t=>{const root=rootOf(t),outside=rootOf(t);mkdirSync(path.join(root,'docs'));symlinkSync(outside,path.join(root,'doc'));assert.equal(selectOutput({mode:'prompt',cwd:root}).bundleRoot,path.join(root,'docs/architecture'));});
test('existing legacy bundle retains its layout and exact bytes',t=>{
 const root=rootOf(t),bundle=path.join(root,'chosen'),fixture=fileURLToPath(new URL('./fixtures/prompt-mode/onboarding/bundle/',import.meta.url));cpSync(fixture,bundle,{recursive:true});const bytes=readFileSync(path.join(bundle,'architecture.json'));const plan=selectOutput({mode:'prompt',cwd:root,outputDirectory:bundle,create:true});assert.equal(plan.layout,'legacy');assert.equal(plan.docsRoot,path.join(bundle,'docs'));assert.deepEqual(readFileSync(plan.graphPath),bytes);assert.equal(existsSync(path.join(bundle,'diagrams')),false);
});

test('output-only external destinations reject a symlink hidden in an earlier ancestor',t=>{const project=rootOf(t),outside=rootOf(t),real=rootOf(t);mkdirSync(path.join(real,'existing'));symlinkSync(real,path.join(outside,'alias'));assert.throws(()=>selectOutput({mode:'prompt',cwd:project,outputDirectory:path.join(outside,'alias/existing/chosen'),create:true}),/symlink/);assert.deepEqual(readdirSync(path.join(real,'existing')),[]);});

test('protected source aliases cannot hide an output hardlink collision',t=>{const root=rootOf(t),bundle=path.join(root,'output');mkdirSync(path.join(bundle,'diagrams'),{recursive:true});writeFileSync(path.join(bundle,'diagrams/architecture.json'),'{}');writeFileSync(path.join(root,'source.md'),'source');symlinkSync(path.join(root,'source.md'),path.join(root,'source-alias.md'));linkSync(path.join(root,'source.md'),path.join(bundle,'index.md'));assert.throws(()=>selectOutput({mode:'repository',repositoryRoot:root,outputDirectory:bundle,protectedPaths:[path.join(root,'source-alias.md')],create:true}),/overwrite source/);assert.equal(readFileSync(path.join(root,'source.md'),'utf8'),'source');});
