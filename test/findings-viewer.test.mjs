import assert from 'node:assert/strict';
import {test,before,after} from 'node:test';
import {mkdtempSync,realpathSync,rmSync,readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {chromium} from 'playwright-core';
import {findingsFixture,fixedCode} from './support/findings-fixture.mjs';
import {prepareBuild} from '../builder/pipeline.mjs';
import {writeStandaloneHTML} from '../builder/html.mjs';
import {buildSkill} from '../packaging/build-skill.mjs';
let browser;
before(async()=>{const executablePath=[process.env.PFLOW_BROWSER_PATH,'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/chromium','/usr/bin/google-chrome'].filter(Boolean).find(existsSync);browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});});
after(async()=>browser?.close());
function fixture(t,{state='current',decision=false,untrusted=false,nodeKind}={}) {
 const root=realpathSync(mkdtempSync(path.join(tmpdir(),'pflow-findings-ui-')));t.after(()=>rmSync(root,{recursive:true,force:true}));const f=findingsFixture(root);
 if(decision||nodeKind){f.graph.flows[1].nodes[0].kind=nodeKind||'decision';writeFileSync(path.join(f.bundle,'architecture.json'),JSON.stringify(f.graph));}
 const doc=f.candidate(),row=doc.findings[0];row.targets.push({flowId:'flow_order',nodeId:'node_receive'},{flowId:'flow_order',edgeId:'edge_failure'});
 if(untrusted){row.title='Possible <img src=x onerror="globalThis.injected=1"> failure';row.description+=' Literal </script><script>globalThis.injected=1</script> José 민지.';row.reviews[0].rationale+=' <svg onload="globalThis.injected=1">';}
 if(state==='dismissed'||state==='resolved')row.reviews.push({status:state,rationale:'Explicit retained decision.'});f.writeCandidate(doc);if(state==='stale')writeFileSync(f.source,fixedCode);
 f.output=path.join(root,'architecture.html');writeStandaloneHTML(prepareBuild({input:f.bundle,repositoryRoot:root,output:f.output}));return f;
}
async function open(t,f,width=1440) {
 const context=await browser.newContext({offline:true,viewport:{width,height:900}});t.after(()=>context.close());const page=await context.newPage();page.setDefaultTimeout(7000);const requests=[],errors=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(f.output).href);await page.waitForSelector('.diagram-node');t.after(()=>{assert.deepEqual(errors,[]);assert.deepEqual(requests,[pathToFileURL(f.output).href]);});return page;
}
async function detail(page){await page.locator('.diagram-expand-control').first().focus();await page.keyboard.press('Enter');}
async function focusNode(page){await page.locator('.diagram-node-select').first().focus();}
function overlap(a,b){return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;}
test('full node label appears on keyboard focus, stays at readable zoom-independent size and escapes HTML',async t=>{
 const f=fixture(t),page=await open(t,f);await detail(page);await focusNode(page);const label=f.graph.flows[1].nodes[0].label;
 await page.locator('#document-article').dispatchEvent('scroll');
 assert.equal(await page.locator('.diagram-tooltip').innerText(),label);assert.equal(await page.locator('.diagram-tooltip script').count(),0);assert.equal(await page.locator('.diagram-tooltip').evaluate(e=>getComputedStyle(e).fontSize),'13px');
 await page.waitForTimeout(100);
 const node=page.locator('.diagram-node-select'),description=await node.getAttribute('aria-describedby');assert.ok(description);assert.equal(await page.locator('#'+description).getAttribute('role'),'tooltip');
 await page.keyboard.press('Escape');assert.equal(await page.locator('.diagram-tooltip').isVisible(),false);
 await page.locator('#zoom-in').click();await focusNode(page);assert.equal(await page.locator('.diagram-tooltip').evaluate(e=>getComputedStyle(e).fontSize),'13px');assert.equal(await page.locator('.diagram-tooltip').innerText(),label);
});
test('pointer hover is hoverable, dismissible and remains visible while its anchor has keyboard focus',async t=>{
 const f=fixture(t),page=await open(t,f);await detail(page);await page.locator('.diagram-node-select').first().hover();await page.waitForTimeout(300);assert.equal(await page.locator('.diagram-tooltip').isVisible(),true);
 await page.locator('.diagram-tooltip').hover();await page.waitForTimeout(150);assert.equal(await page.locator('.diagram-tooltip').isVisible(),true);
 await focusNode(page);await page.locator('.diagram-tooltip').hover();await page.mouse.move(10,10);await page.waitForTimeout(150);assert.equal(await page.locator('.diagram-tooltip').isVisible(),true);
 await page.locator('#global-search').focus();await page.waitForTimeout(150);assert.equal(await page.locator('.diagram-tooltip').isVisible(),false);
});
test('tooltip stays inside the viewport at narrow sizes and under dark theme',async t=>{
 const f=fixture(t),page=await open(t,f,640);await detail(page);await page.locator('#theme-toggle').click();await focusNode(page);
 const box=await page.locator('.diagram-tooltip').boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=640&&box.y+box.height<=900);assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
});
test('node warning opens its Findings disclosure without expansion or viewport changes',async t=>{
 const f=fixture(t),page=await open(t,f),before=await page.locator('.diagram-scene').getAttribute('transform');
 await page.locator('.diagram-warning-control').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#workspace-title').innerText(),'Receive order');assert.equal(await page.locator('.diagram-scene').getAttribute('transform'),before);assert.equal(await page.locator('#findings-disclosure').evaluate(el=>String(el.open)),'true');
 assert.equal(await page.locator('.finding-item').count(),1);assert.match(await page.locator('.finding-item').innerText(),/medium severity.*high confidence.*unreviewed/);
 await page.locator('.finding-item summary').filter({hasText:'Code evidence'}).click();assert.match(await page.locator('.finding-item code').last().textContent(),/}/);assert.match(await page.locator('.finding-item details').first().innerText(),/return items\[0\]\.sku/);
 assert.equal(await page.locator('#findings-report input,#findings-report select,#findings-report textarea').count(),0);
 assert.equal(await page.locator('.diagram-edge-label.has-finding').count(),1);await page.locator('.diagram-edge[data-edge-id="edge_failure"]').focus();await page.keyboard.press('Enter');await page.locator('#tab-details').click();assert.equal(await page.locator('#node-kind').innerText(),'exception · sync');assert.equal(await page.locator('.finding-item').count(),1);
});
test('warning report locates an explicit detail target through the existing hierarchy',async t=>{
 const f=fixture(t),page=await open(t,f);await page.locator('#open-findings').click();await page.locator('.finding-item button').filter({hasText:'Read the first requested'}).click();assert.equal(await page.locator('#flow-level').innerText(),'Detail');assert.match(await page.locator('#breadcrumb-list').innerText(),/Receive order.*Read the first SKU/s);assert.equal(await page.locator('.diagram-node.is-selected').getAttribute('data-node-id'),'node_lookup');
 await page.locator('#navigation-back').click();assert.equal(await page.locator('#workspace-title').innerText(),'Receive order');
});
for(const state of ['stale','dismissed','resolved'])test(`${state} findings retain report/history but never create warning badges`,async t=>{
 const f=fixture(t,{state}),page=await open(t,f);assert.equal(await page.locator('.diagram-warning-control').count(),0);await page.locator('#open-findings').click();assert.match(await page.locator('#findings-report').innerText(),new RegExp(state==='stale'?'Needs revalidation':state));await page.locator('.finding-item summary').filter({hasText:'Review history'}).click();assert.match(await page.locator('#findings-report').innerText(),/Candidate from source inspection/);
});
test('finding report preserves untrusted strings as text and survives removing all input files',async t=>{
 const f=fixture(t,{untrusted:true});rmSync(f.bundle,{recursive:true});rmSync(path.join(f.root,'src'),{recursive:true});const page=await open(t,f);await page.locator('#open-findings').click();assert.equal(await page.locator('#findings-report img,#findings-report script,#findings-report svg').count(),0);assert.equal(await page.evaluate(()=>globalThis.injected),undefined);assert.match(await page.locator('#findings-report').innerText(),/José 민지/);
});
test('warning indicators fit within actual decision geometry and do not intersect displayed text',async t=>{
 const f=fixture(t,{decision:true}),page=await open(t,f);await detail(page);
 const boxes=await page.locator('.diagram-node').evaluate(node=>{const box=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};};return {warning:box(node.querySelector('.diagram-warning-control circle')),shape:box(node.querySelector('.diagram-node-shape')),text:[...node.querySelectorAll('.diagram-node-name tspan,.diagram-node-type,.diagram-node-source')].map(box)};});
 assert.ok(boxes.warning.left>=boxes.shape.left&&boxes.warning.right<=boxes.shape.right&&boxes.warning.top>=boxes.shape.top&&boxes.warning.bottom<=boxes.shape.bottom);
 for(const text of boxes.text)assert.equal(overlap(boxes.warning,text),false);
 const vertices=await page.locator('.diagram-warning-control circle').evaluate(c=>{const n=c.closest('.diagram-node'),p=n.querySelector('.diagram-node-shape');return {cx:+c.getAttribute('cx'),cy:+c.getAttribute('cy'),r:+c.getAttribute('r'),w:p.getBBox().width,h:p.getBBox().height};});
 for(let i=0;i<360;i+=10){const x=vertices.cx+vertices.r*Math.cos(i*Math.PI/180),y=vertices.cy+vertices.r*Math.sin(i*Math.PI/180);assert.ok(Math.abs(x-vertices.w/2)/(vertices.w/2)+Math.abs(y-vertices.h/2)/(vertices.h/2)<=1.001);}
});
test('packaged Skill bundle includes findings tools and produces an offline report without development dependencies',async t=>{
 const f=fixture(t),installation=path.join(f.root,'installation');await buildSkill({output:installation});const runtime=path.join(installation,'scripts/pflow.mjs'),request=path.join(f.root,'request.json');
 writeFileSync(request,JSON.stringify({bundleRoot:f.bundle,repositoryRoot:f.root}));const result=spawnSync(process.execPath,[runtime,'findings-inspect','--request',request],{cwd:f.root,encoding:'utf8',env:{...process.env,PATH:'',NODE_PATH:''}});assert.equal(result.status,0,result.stderr);const prior=JSON.parse(result.stdout);assert.equal(prior.rows[0].active,true);
 writeFileSync(request,JSON.stringify({bundleRoot:f.bundle,repositoryRoot:f.root,candidate:prior.document,previousDigest:prior.digest,reviewChanges:{finding_empty_sku:{status:'supported',rationale:'Reviewed the receiver and unguarded list access.'}}}));const published=spawnSync(process.execPath,[runtime,'findings-publish','--request',request,'--apply'],{cwd:f.root,encoding:'utf8',env:{...process.env,PATH:'',NODE_PATH:''}});assert.equal(published.status,0,published.stderr);assert.equal(f.readDocument().findings[0].reviews.at(-1).status,'supported');
 f.output=path.join(f.root,'standalone-installed.html');writeFileSync(f.output,readFileSync(path.join(f.bundle,'architecture.html')));rmSync(installation,{recursive:true});rmSync(f.bundle,{recursive:true});const page=await open(t,f);await page.locator('#open-findings').click();assert.match(await page.locator('#findings-report').innerText(),/supported/);
});

test('a Flow-only finding does not leave an unrelated node selected',async t=>{
 const f=fixture(t),doc=f.readDocument();doc.findings[0].targets=[{flowId:'flow_order'}];f.writeCandidate(doc);writeStandaloneHTML(prepareBuild({input:f.bundle,repositoryRoot:f.root,output:f.output}));
 const page=await open(t,f);await page.locator('.diagram-node-select').first().focus();await page.keyboard.press('Enter');assert.equal(await page.locator('.diagram-node.is-selected').count(),1);
 await page.locator('#open-findings').click();await page.getByRole('button',{name:'Locate: Receive order',exact:true}).click();assert.equal(await page.locator('.diagram-node.is-selected').count(),0);assert.equal(await page.locator('#workspace-title').innerText(),'Receive order');assert.equal(await page.locator('.diagram-warning-control').count(),0);
});

test('terminal warnings stay inside the actual rounded shape including stroke clearance',async t=>{
 const f=fixture(t,{nodeKind:'terminal'}),page=await open(t,f);await detail(page);
 const inside=await page.locator('.diagram-node').evaluate(node=>{const c=node.querySelector('.diagram-warning-control circle'),shape=node.querySelector('.diagram-node-shape'),cx=+c.getAttribute('cx'),cy=+c.getAttribute('cy'),radius=+c.getAttribute('r')+1;return Array.from({length:36},(_,i)=>shape.isPointInFill(new DOMPoint(cx+radius*Math.cos(i*Math.PI/18),cy+radius*Math.sin(i*Math.PI/18))));});
 assert.equal(inside.every(Boolean),true);
});
