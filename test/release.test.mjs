import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {mkdtempSync,readFileSync,writeFileSync,cpSync,rmSync,existsSync,realpathSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {chromium} from 'playwright-core';
import {parseHTML} from 'linkedom';
import {buildRelease} from '../packaging/release.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));let temporary,result;
before(async()=>{temporary=realpathSync(mkdtempSync(path.join(tmpdir(),'pflow-release-')));result=await buildRelease({output:path.join(temporary,'first')});});
after(()=>rmSync(temporary,{recursive:true,force:true}));
test('ZIP has the complete validated package, fixed metadata and a matching checksum',()=>{
 const entries=JSON.parse(execFileSync('python3',['-c',`import zipfile,json,sys
with zipfile.ZipFile(sys.argv[1]) as z:
 print(json.dumps([{'path':i.filename,'date':i.date_time,'mode':i.external_attr>>16} for i in z.infolist()]))`,result.zip],{encoding:'utf8'}));
 assert.deepEqual(entries.map(e=>e.path),result.files.map(f=>'pflow/'+f).sort());
 assert.deepEqual(entries.filter(e=>/\.(mjs|js|cjs)$/.test(e.path)).map(e=>e.path),['pflow/scripts/pflow.mjs']);
 for(const e of entries) {assert.deepEqual(e.date,[1980,1,1,0,0,0]);assert.equal(e.mode,e.path.endsWith('.mjs')?0o100755:0o100644);}
 assert.equal(readFileSync(path.join(temporary,'first/pflow.zip.sha256'),'utf8'),`${createHash('sha256').update(readFileSync(result.zip)).digest('hex')}  pflow.zip\n`);
});
test('repeated release builds produce byte-identical ZIP and checksum files',async()=>{
 const other=await buildRelease({output:path.join(temporary,'second')});
 assert.deepEqual(readFileSync(result.zip),readFileSync(other.zip));assert.equal(result.sha256,other.sha256);
});
test('wrong or prerelease tags fail before creating or replacing output',async()=>{
 const output=path.join(temporary,'invalid');
 for(const tag of ['v0.0.0','v1.0.0-rc.1','../../bad'])await assert.rejects(buildRelease({tag,output}),/Release tag must be/);
 assert.equal(existsSync(output),false);
 const sentinel=readFileSync(result.zip);await assert.rejects(buildRelease({tag:'wrong',output:path.dirname(result.zip)}));assert.deepEqual(readFileSync(result.zip),sentinel);
});
test('extracted ZIP builds standalone HTML without development dependencies and works offline',async t=>{
 const isolated=path.join(temporary,'isolated');
 execFileSync('python3',['-m','zipfile','-e',result.zip,isolated]);
 const cli=path.join(isolated,'pflow/scripts/pflow.mjs'),input=path.join(isolated,'architecture');
 cpSync(path.join(root,'test/fixtures/prompt-mode/deployment/bundle'),input,{recursive:true});
 const output=path.join(isolated,'architecture.html');
 const run=(args)=>spawnSync(process.execPath,['--permission',`--allow-fs-read=${isolated}`,`--allow-fs-write=${isolated}`,cli,...args],{cwd:isolated,encoding:'utf8',env:{...process.env,NODE_PATH:'',NODE_OPTIONS:''}});
 const version=run(['--version']);assert.equal(version.status,0,version.stderr);assert.equal(version.stdout,`pFlow ${result.version}\n`);
 const build=run(['build','--input',input,'--repository-root',isolated,'--output',output]);assert.equal(build.status,0,build.stderr);
 rmSync(input,{recursive:true});rmSync(path.join(isolated,'pflow'),{recursive:true});
 const executablePath=[process.env.PFLOW_BROWSER_PATH,'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/chromium','/usr/bin/google-chrome'].filter(Boolean).find(existsSync);
 const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});t.after(()=>browser.close());
 const context=await browser.newContext({offline:true}),page=await context.newPage(),requests=[],errors=[];page.setDefaultTimeout(5000);page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(output).href);assert.ok(await page.locator('.diagram-node').count()>0);assert.ok((await page.locator('#document-body').textContent()).length>0);
 await page.locator('.diagram-node-select').first().focus();await page.keyboard.press('Enter');assert.equal(await page.locator('.diagram-node.is-selected').count(),1);
 await page.keyboard.press('Control+k');await page.locator('#global-search').fill('verification');await page.waitForFunction(()=>document.querySelectorAll('.search-result').length>0);await page.keyboard.press('Enter');assert.ok(await page.locator('mark.search-match').count()>0);
 assert.deepEqual(requests,[pathToFileURL(output).href]);assert.deepEqual(errors,[]);
});
test('website download points to the packaged release and works in both languages',async t=>{
 const file=path.join(root,'website/index.html'),url='https://github.com/itsbysean/pFlow/releases/latest/download/pflow.zip';
 const document=parseHTML(readFileSync(file,'utf8')).document;
 assert.ok(document.querySelectorAll(`a[href="${url}"]`).length>=3);
 for(const a of document.querySelectorAll('a[href]'))assert.ok(!a.getAttribute('href').includes('/tree/main/skill'));
 const executablePath=[process.env.PFLOW_BROWSER_PATH,'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/chromium','/usr/bin/google-chrome'].filter(Boolean).find(existsSync);
 const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});t.after(()=>browser.close());const page=await browser.newPage();await page.goto(pathToFileURL(file).href);
 assert.ok(await page.getByRole('link',{name:'Download Skill ZIP',exact:true}).isVisible());await page.getByRole('button',{name:'한국어',exact:true}).click();assert.ok(await page.getByRole('link',{name:'Skill ZIP 다운로드',exact:true}).isVisible());assert.equal(await page.locator('html').getAttribute('lang'),'ko');
});
