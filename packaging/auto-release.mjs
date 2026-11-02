import {readFileSync,writeFileSync,appendFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const git=(root,...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim();
const stable=/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
export function nextPatch(version,tags=[]) {
 if(!stable.test(version))throw new Error('Package version must be stable X.Y.Z.');
 const values=[version,...tags.filter(t=>t.startsWith('v')&&stable.test(t.slice(1))).map(t=>t.slice(1))];
 values.sort((a,b)=>{const x=a.split('.').map(BigInt),y=b.split('.').map(BigInt);for(let i=0;i<3;i++)if(x[i]!==y[i])return x[i]<y[i]?-1:1;return 0;});
 const [major,minor,patch]=values.at(-1).split('.');return `${major}.${minor}.${BigInt(patch)+1n}`;
}
const metadata=root=>['package.json','package-lock.json'].map(file=>JSON.parse(readFileSync(path.join(root,file),'utf8')));
const statePath=root=>path.resolve(root,git(root,'rev-parse','--git-path','pflow-release.json'));
function tags(root) {
 return git(root,'for-each-ref','--format=%(refname:short)%00%(*objectname)%00%(objectname)%00%(contents:subject)','refs/tags').split('\n').filter(Boolean).map(line=>{const [name,peeled,object,subject]=line.split('\0');return {name,target:peeled||object,subject};});
}
function updateVersion(root,version) {
 const [pkg,lock]=metadata(root);if(!lock.packages?.[''])throw new Error('Expected a root package-lock entry.');
 pkg.version=version;lock.version=version;lock.packages[''].version=version;
 for(const [file,data] of [['package.json',pkg],['package-lock.json',lock]])writeFileSync(path.join(root,file),JSON.stringify(data,null,2)+'\n');
}
export function prepareAutoRelease(root=process.cwd(),source=git(root,'rev-parse','HEAD')) {
 if(!/^[0-9a-f]{40}$/.test(source)||git(root,'rev-parse','HEAD')!==source)throw new Error('Release source must be the checked-out commit.');
 const [pkg,lock]=metadata(root);if(pkg.version!==lock.version||pkg.version!==lock.packages?.['']?.version)throw new Error('Package and lock versions differ.');
 const saved=existsSync(statePath(root))?JSON.parse(readFileSync(statePath(root),'utf8')):undefined;
 const dirty=git(root,'status','--porcelain','--untracked-files=no');
 const edits=git(root,'diff','HEAD','--name-only').split('\n').filter(Boolean);
 if(dirty&&!(saved?.source===source&&pkg.version===saved.version&&edits.every(f=>['package.json','package-lock.json'].includes(f))))throw new Error('Release preparation requires a clean tracked worktree.');
 const known=tags(root),matches=known.filter(t=>/^v\d+\.\d+\.\d+$/.test(t.name)&&(t.subject===`pflow-source:${source}`||t.target===source));
 if(matches.length>1)throw new Error('Multiple release tags identify this source.');
 let state;
 if(matches.length) {
  const tag=matches[0];const tagged=JSON.parse(git(root,'show',`${tag.name}:package.json`));
  if(tagged.version!==tag.name.slice(1))throw new Error('Existing release tag has inconsistent package metadata.');
  state={source,tag:tag.name,version:tagged.version,reuse:true};
 }else if(saved?.source===source) {
  state=saved;
 }else {
  if(git(root,'status','--porcelain','--untracked-files=no'))throw new Error('Release preparation requires a clean tracked worktree.');
  const version=nextPatch(pkg.version,known.map(t=>t.name));state={source,version,tag:`v${version}`,reuse:false};
 }
 updateVersion(root,state.version);writeFileSync(statePath(root),JSON.stringify(state)+'\n');return state;
}
export function publishReleaseGit(root=process.cwd()) {
 const state=JSON.parse(readFileSync(statePath(root),'utf8'));
 if(metadata(root).some(p=>p.version!==state.version)||metadata(root)[1].packages[''].version!==state.version)throw new Error('Prepared version changed before publication.');
 const edits=git(root,'diff','HEAD','--name-only').split('\n').filter(Boolean);
 if(edits.some(file=>!['package.json','package-lock.json'].includes(file)))throw new Error('Unrelated tracked changes prevent publication.');
 if(state.reuse) {
  const tagged=tags(root).find(t=>t.name===state.tag&&(t.subject===`pflow-source:${state.source}`||t.target===state.source));
  if(!tagged)throw new Error('Prepared release tag is missing or changed.');
  if(git(root,'ls-remote','origin','refs/heads/main').split(/\s+/)[0]!==tagged.target)throw new Error('Main advanced after this release; do not republish obsolete source.');
  return state;
 }
 if(git(root,'rev-parse','HEAD')!==state.source)throw new Error('Release source changed before publication.');
 const changed=git(root,'diff','HEAD','--name-only').split('\n').filter(Boolean).sort();
 if(JSON.stringify(changed)!==JSON.stringify(['package-lock.json','package.json']))throw new Error('Only prepared version files may change.');
 const remote=git(root,'ls-remote','origin','refs/heads/main').split(/\s+/)[0];
 if(remote!==state.source)throw new Error('Main advanced during verification; publish from the newer main run instead.');
 git(root,'add','--','package.json','package-lock.json');
 git(root,'-c','user.name=github-actions[bot]','-c','user.email=41898282+github-actions[bot]@users.noreply.github.com','commit','-m',`chore: release ${state.tag}`);
 git(root,'-c','user.name=github-actions[bot]','-c','user.email=41898282+github-actions[bot]@users.noreply.github.com','tag','-a',state.tag,'-m',`pflow-source:${state.source}`);
 // No force push: concurrent main changes or protected branches must fail.
 git(root,'push','--atomic','origin','HEAD:refs/heads/main',`refs/tags/${state.tag}`);return state;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 try {
  const command=process.argv[2];if(process.argv.length!==3||!['prepare','publish-git'].includes(command))throw new Error('Usage: node packaging/auto-release.mjs prepare|publish-git');
  const result=command==='prepare'?prepareAutoRelease(process.cwd(),process.env.GITHUB_SHA):publishReleaseGit();
  if(process.env.GITHUB_ENV)appendFileSync(process.env.GITHUB_ENV,`RELEASE_TAG=${result.tag}\n`);
  process.stdout.write(JSON.stringify(result)+'\n');
 }catch(error){process.stderr.write(`pFlow automatic release: ${error.message}\n`);process.exitCode=1;}
}
