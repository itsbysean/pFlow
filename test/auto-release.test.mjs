import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtempSync,writeFileSync,readFileSync,rmSync,realpathSync,chmodSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {nextPatch,prepareAutoRelease,publishReleaseGit} from '../packaging/auto-release.mjs';
function fixture(t) {
 const root=realpathSync(mkdtempSync(path.join(tmpdir(),'pflow-auto-'))),repo=path.join(root,'repo'),remote=path.join(root,'remote.git');t.after(()=>rmSync(root,{recursive:true,force:true}));
 const run=(...args)=>execFileSync('git',['-C',repo,...args],{encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
 execFileSync('git',['init','--bare','-q',remote]);execFileSync('git',['init','-q','-b','main',repo]);run('config','user.name','Fixture');run('config','user.email','fixture@example.invalid');
 const pkg={name:'fixture',version:'1.0.0'},lock={name:'fixture',version:'1.0.0',lockfileVersion:3,packages:{'':{name:'fixture',version:'1.0.0'}}};
 for(const [file,data] of [['package.json',pkg],['package-lock.json',lock]])writeFileSync(path.join(repo,file),JSON.stringify(data,null,2)+'\n');
 writeFileSync(path.join(repo,'source.txt'),'source');run('add','.');run('commit','-qm','source');run('remote','add','origin',remote);run('push','-q','origin','main');
 return {repo,remote,run,source:run('rev-parse','HEAD'),version:()=>JSON.parse(readFileSync(path.join(repo,'package.json'),'utf8')).version};
}
test('patch calculation uses numeric ordering and ignores prerelease/unrelated tags',()=>{
 assert.equal(nextPatch('1.0.0'), '1.0.1');assert.equal(nextPatch('1.0.0',['v1.0.9','v1.0.10','v1.1.0-rc.1','other']), '1.0.11');
 assert.equal(nextPatch('2.1.0',['v1.9.99']), '2.1.1');assert.throws(()=>nextPatch('1.0.0-beta'),/stable/);
});
test('preparation updates package and both lock versions once without changing Git or remote',t=>{
 const f=fixture(t),first=prepareAutoRelease(f.repo);assert.equal(first.version,'1.0.1');assert.deepEqual(prepareAutoRelease(f.repo),first);
 const lock=JSON.parse(readFileSync(path.join(f.repo,'package-lock.json'),'utf8'));assert.equal(f.version(),'1.0.1');assert.equal(lock.version,'1.0.1');assert.equal(lock.packages[''].version,'1.0.1');
 assert.equal(f.run('rev-parse','HEAD'),f.source);assert.equal(f.run('ls-remote','origin','refs/heads/main').split(/\s/)[0],f.source);assert.equal(f.run('tag'), '');
});
test('publication commits only version metadata and atomically pushes main with the tagged tested version',t=>{
 const f=fixture(t),plan=prepareAutoRelease(f.repo);publishReleaseGit(f.repo);assert.equal(f.run('rev-parse',`${plan.tag}^{}`),f.run('rev-parse','HEAD'));
 assert.deepEqual(f.run('diff-tree','--no-commit-id','--name-only','-r','HEAD').split('\n'),['package-lock.json','package.json']);
 assert.match(f.run('ls-remote','origin',`refs/tags/${plan.tag}`),new RegExp(plan.tag));assert.equal(f.run('log','-1','--format=%s'),`chore: release ${plan.tag}`);
});
test('rerun after tag push reuses the same version without another commit, tag or bump',t=>{
 const f=fixture(t);prepareAutoRelease(f.repo);publishReleaseGit(f.repo);const released=f.run('rev-parse','HEAD');
 f.run('checkout','--detach',f.source);f.run('clean','-fd');const retried=prepareAutoRelease(f.repo);assert.equal(retried.tag,'v1.0.1');assert.equal(retried.reuse,true);publishReleaseGit(f.repo);
 assert.equal(f.run('rev-parse','HEAD'),f.source);assert.equal(f.run('ls-remote','origin','refs/heads/main').split(/\s/)[0],released);assert.equal(f.run('tag').split('\n').length,1);
});
test('next source change increments the previous released patch',t=>{
 const f=fixture(t);prepareAutoRelease(f.repo);publishReleaseGit(f.repo);writeFileSync(path.join(f.repo,'source.txt'),'next');f.run('add','source.txt');f.run('commit','-qm','next source');
 f.run('push','-q','origin','HEAD:main');const next=prepareAutoRelease(f.repo);assert.equal(next.version,'1.0.2');
});
test('dirty source or mismatched package/lock versions fail before preparation',t=>{
 const f=fixture(t);writeFileSync(path.join(f.repo,'source.txt'),'dirty');assert.throws(()=>prepareAutoRelease(f.repo),/clean/);assert.equal(f.version(),'1.0.0');
 f.run('checkout','--','source.txt');const file=path.join(f.repo,'package-lock.json'),lock=JSON.parse(readFileSync(file,'utf8'));lock.version='9.0.0';writeFileSync(file,JSON.stringify(lock));assert.throws(()=>prepareAutoRelease(f.repo),/versions differ/);
});
test('advanced remote main fails without replacing it or pushing a tag',t=>{
 const f=fixture(t);prepareAutoRelease(f.repo);const advance=f.run('commit-tree',`${f.source}^{tree}`,'-p',f.source,'-m','new main');
 f.run('push','-q','origin',`${advance}:refs/heads/main`);assert.throws(()=>publishReleaseGit(f.repo),/Main advanced/);
 assert.equal(f.run('ls-remote','origin','refs/heads/main').split(/\s/)[0],advance);assert.equal(f.run('tag'),'');
});
test('changed version or unrelated source after verification blocks publication',t=>{
 const f=fixture(t);prepareAutoRelease(f.repo);writeFileSync(path.join(f.repo,'source.txt'),'changed');assert.throws(()=>publishReleaseGit(f.repo),/Unrelated/);assert.equal(f.run('tag'),'');
});

test('remote branch protection rejection preserves remote main and prevents a partial tag push',t=>{
 const f=fixture(t);prepareAutoRelease(f.repo);
 const hook=path.join(f.remote,'hooks/pre-receive');writeFileSync(hook,'#!/bin/sh\necho "branch protected" >&2\nexit 1\n');chmodSync(hook,0o755);
 assert.throws(()=>publishReleaseGit(f.repo),/Command failed/);
 assert.equal(f.run('ls-remote','origin','refs/heads/main').split(/\s/)[0],f.source);assert.equal(f.run('ls-remote','origin','refs/tags/v1.0.1'),'');
});

test('retry of an older released source cannot publish over a newer main',t=>{
 const f=fixture(t);prepareAutoRelease(f.repo);publishReleaseGit(f.repo);const released=f.run('rev-parse','HEAD');
 const next=f.run('commit-tree',`${released}^{tree}`,'-p',released,'-m','new source');f.run('push','-q','origin',`${next}:refs/heads/main`);
 f.run('checkout','--detach',f.source);prepareAutoRelease(f.repo);assert.throws(()=>publishReleaseGit(f.repo),/Main advanced after/);
 assert.equal(f.run('ls-remote','origin','refs/heads/main').split(/\s/)[0],next);assert.equal(f.run('tag'),'v1.0.1');
});
