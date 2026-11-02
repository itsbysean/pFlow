import {readFileSync,mkdirSync,mkdtempSync,renameSync,rmSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {buildSkill} from './build-skill.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const metadata=JSON.parse(readFileSync(path.join(root,'package.json'),'utf8'));
export async function buildRelease({tag,output=path.join(root,'dist')}={}) {
 if(!/^\d+\.\d+\.\d+$/.test(metadata.version))throw new Error('Only stable package versions can be released.');
 if(tag!==undefined&&tag!==`v${metadata.version}`)throw new Error(`Release tag must be v${metadata.version}; received ${tag}.`);
 const directory=path.resolve(output),bundle=await buildSkill({output:path.join(directory,'pflow')});
 mkdirSync(directory,{recursive:true});const temporary=mkdtempSync(path.join(directory,'.release-'));
 try {
  const zip=path.join(temporary,'pflow.zip');
  execFileSync('python3',[path.join(root,'packaging/archive-skill.py'),bundle.directory,zip],{input:JSON.stringify(bundle.files)});
  const digest=createHash('sha256').update(readFileSync(zip)).digest('hex');
  writeFileSync(path.join(temporary,'pflow.zip.sha256'),`${digest}  pflow.zip\n`);
  for(const name of ['pflow.zip','pflow.zip.sha256'])renameSync(path.join(temporary,name),path.join(directory,name));
  return {version:metadata.version,zip:path.join(directory,'pflow.zip'),sha256:digest,files:bundle.files};
 }finally {rmSync(temporary,{recursive:true,force:true});}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 try {
  const args=process.argv.slice(2);
  if(args.length&&!(args.length===2&&args[0]==='--tag'&&args[1]))throw new Error('Usage: npm run build:release [-- --tag vX.Y.Z]');
  const result=await buildRelease({tag:args[1]});process.stdout.write(`Built pFlow ${result.version}: ${result.zip}\nSHA-256: ${result.sha256}\n`);
 }catch(error){process.stderr.write(`pFlow release: ${error.message}\n`);process.exitCode=1;}
}
