import assert from 'node:assert/strict';
import {test,before,after} from 'node:test';
import {cpSync,existsSync,mkdirSync,mkdtempSync,readFileSync,realpathSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright-core';
import {prepareBuild} from '../builder/pipeline.mjs';
import {writeStandaloneHTML} from '../builder/html.mjs';
const tool=fileURLToPath(new URL('../',import.meta.url));let browser;
before(async()=>{const executablePath=[process.env.PFLOW_BROWSER_PATH,'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/chromium','/usr/bin/google-chrome'].filter(Boolean).find(existsSync);browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});});
after(async()=>browser?.close());
function fixture(t,name='deployment',mutate){
 const parent=realpathSync(mkdtempSync(path.join(tmpdir(),'pflow-polish-'))),root=path.join(parent,'input');mkdirSync(root);t.after(()=>rmSync(parent,{recursive:true,force:true}));
 const bundle=path.join(root,name==='code'?'examples/a-sync':'architecture');cpSync(path.join(tool,name==='code'?'examples/a-sync':`test/fixtures/prompt-mode/${name}/bundle`),bundle,{recursive:true});
 const graphPath=path.join(bundle,'architecture.json'),graph=JSON.parse(readFileSync(graphPath)),doc=path.join(bundle,'docs',graph.flows[0].docs[0].path);mutate?.({graph,doc});writeFileSync(graphPath,JSON.stringify(graph));
 const file=path.join(parent,'architecture.html'),prepared=prepareBuild({input:bundle,repositoryRoot:root,output:file});writeStandaloneHTML(prepared);rmSync(root,{recursive:true});return {file,graph,prepared};
}
async function open(t,f,{width=1536,height=1024}={}){const context=await browser.newContext({offline:true,viewport:{width,height},reducedMotion:'reduce'});t.after(()=>context.close());const page=await context.newPage();page.setDefaultTimeout(5000);const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});page.on('request',r=>requests.push(r.url()));await page.goto(pathToFileURL(f.file).href);t.after(()=>{assert.deepEqual(errors,[]);assert.deepEqual(requests,[pathToFileURL(f.file).href]);});return page;}
const locate=(page,id)=>page.locator(`#document-body section[id="${id}"] > .section-actions .section-locate`);
const select=(page,id)=>page.locator(`.diagram-node[data-node-id="${id}"] .diagram-node-select`);
for(const label of ['Unbroken'.repeat(150),'長いプロセス名 '.repeat(150)])test('long title retains full accessible text without consuming diagram: '+label.slice(0,12),async t=>{
 const f=fixture(t,'deployment',({graph})=>{graph.flows[0].label=label;}),page=await open(t,f,{width:1024,height:600});
 assert.equal(await page.locator('#workspace-title').textContent(),label);assert.equal(await page.locator('#workspace-title').getAttribute('title'),label);assert.equal(await page.getByRole('heading',{name:label,exact:true}).count(),1);
 const title=await page.locator('#workspace-title').boundingBox(),workspace=await page.locator('#workspace').boundingBox(),diagram=await page.locator('#diagram-container').boundingBox();assert.ok(title.x+title.width<=workspace.x+workspace.width);assert.ok(title.height<=100);assert.ok(diagram.height>=80);await page.locator('#zoom-fit').click();
});
test('short-window search keeps result list and keyboard help within the viewport',async t=>{
 const page=await open(t,fixture(t),{width:420,height:350});await page.keyboard.press('Control+k');await page.locator('#global-search').fill('process');await page.waitForFunction(()=>document.querySelectorAll('.search-result').length>0);
 const popup=await page.locator('#search-popup').boundingBox();assert.ok(popup.y+popup.height<=350);assert.ok((await page.locator('#search-results').boundingBox()).height>=40);await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');assert.equal(await page.locator('#search-popup').isVisible(),false);
});
function contrast(a,b){const lum=c=>c.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0);const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
test('theme tokens keep normal text readable on selected and category surfaces',async t=>{
 const page=await open(t,fixture(t));for(const theme of ['light','dark']){
  if(theme==='dark')await page.getByRole('button',{name:'Use dark theme'}).click();
  const pairs=await page.evaluate(()=>{const host=document.createElement('div');document.body.append(host);const result=[];for(const [fg,bg] of [['text','surface'],['muted','surface-soft'],['muted','blue-soft'],['blue','blue-soft'],['purple','purple-soft'],['orange','orange-soft'],['red','red-soft']]){host.style.color=`var(--${fg})`;host.style.backgroundColor=`var(--${bg})`;const s=getComputedStyle(host);result.push([fg,bg,s.color,s.backgroundColor]);}host.remove();return result;});
  for(const [fg,bg,a,b] of pairs)assert.ok(contrast(a,b)>=4.5,`${theme} ${fg}/${bg}: ${contrast(a,b)}`);
 }
});
for(const name of ['code','onboarding','deployment'])test(`${name}: real validated output works after source removal with keyboard, search, evidence and both themes`,async t=>{
 const f=fixture(t,name),page=await open(t,f);assert.equal(existsSync(path.join(path.dirname(f.file),'input')),false);const flow=f.graph.flows.find(f=>f.nodes.some(n=>n.docs?.some(ref=>ref.anchor===n.id))),node=flow.nodes.find(n=>n.docs?.some(ref=>ref.anchor===n.id));
 await page.locator('.entry-button').first().focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#workspace-title').textContent(),f.graph.flows[0].label);await page.getByLabel('Displayed flow').selectOption(flow.id);
 await select(page,node.id).focus();await page.keyboard.press('Enter');assert.equal(await page.locator('.doc-target').getAttribute('id'),node.id);assert.equal(await page.locator('#tab-documentation').getAttribute('aria-selected'),'true');
 await locate(page,node.id).focus();await page.keyboard.press('Space');assert.equal(await select(page,node.id).getAttribute('aria-pressed'),'true');
 await page.locator('#tab-documentation').focus();await page.keyboard.press('End');assert.equal(await page.locator('#tab-details').evaluate(el=>el===document.activeElement),true);await page.locator('#source-references button').first().click();assert.equal(await page.locator('#source-snippet').isVisible(),true);assert.ok((await page.locator('#source-snippet').textContent()).length>0);
 await page.keyboard.press('Control+k');await page.locator('#global-search').fill(name==='code'?'Validation library':node.label);await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');assert.equal(await page.locator('#search-popup').isVisible(),false);assert.ok(await page.locator('mark.search-match').count()>0);
 for(const theme of ['dark','light']){await page.getByRole('button',{name:`Use ${theme} theme`}).click();assert.equal(await page.locator('html').getAttribute('data-theme'),theme);}
 if(name==='deployment'){assert.equal(await page.locator('.diagram-node.node-condition').count(),1);assert.deepEqual(await page.locator('.diagram-edge-label.edge-branch text').allTextContents(),['passes · unknown','fails · unknown']);assert.match(await page.locator('#document-body').textContent(),/Publish only on pass; abort on failure/);}
 const expandable=flow.nodes.find(n=>n.expandFlowId);if(expandable){await page.locator('#open-docs').click();await locate(page,expandable.id).click();assert.equal(await page.locator('#workspace-title').textContent(),flow.label);await page.locator(`#document-body section[id="${expandable.id}"] > .section-actions .section-expand`).click();assert.equal(await page.locator('#workspace-title').textContent(),f.graph.flows.find(f=>f.id===expandable.expandFlowId).label);await page.locator('#navigation-back').click();await page.locator('#navigation-forward').click();await page.locator('#navigation-root').click();assert.equal(await page.locator('#workspace-title').textContent(),flow.label);}
});
test('large graph and long Markdown reuse mounted content through repeated selection, resize and theme',async t=>{
 const count=120,f=fixture(t,'deployment',({graph,doc})=>{const flow=graph.flows[0];flow.nodes=Array.from({length:count},(_,i)=>({id:`node_load_${i}`,label:`Step ${i} Unicode 민지`,kind:'operation',sourceIds:['src_p01'],docs:[{path:'flows/process.md',anchor:`node_load_${i}`}]}));flow.startNodeId=flow.nodes[0].id;flow.edges=flow.nodes.slice(1).map((n,i)=>({id:`edge_load_${i}`,from:flow.nodes[i].id,to:n.id,kind:'next',mode:'unknown',sourceIds:['src_p01']}));writeFileSync(doc,'# Synthetic load fixture\n\n<a id="flow_p01"></a>\n## Load measurement\n\nEvidence: [src_p01].\n\n'+flow.nodes.map(n=>`<a id="${n.id}"></a>\n### ${n.label}\n\n${'Bounded synthetic text for selection measurement. '.repeat(100)}Evidence: [src_p01].\n`).join('\n')+'\n[src_p01]: ../../evidence/request.md#L1\n');}),page=await open(t,f);
 assert.equal(await page.locator('.diagram-node').count(),count);const stats=await page.evaluate(()=>{const svg=document.querySelector('.diagram-svg'),body=document.querySelector('#document-body').firstElementChild,times=[];let rebuilds=0;const observer=new MutationObserver(records=>{for(const r of records)for(const n of r.removedNodes)if(n===svg||n===body)rebuilds++;});observer.observe(document.querySelector('#workspace'),{subtree:true,childList:true});observer.observe(document.querySelector('#document-body'),{childList:true});for(let i=0;i<30;i++){const start=performance.now();document.querySelector(`.diagram-node[data-node-id="node_load_${i*3}"] .diagram-node-select`).dispatchEvent(new MouseEvent('click',{bubbles:true}));times.push(performance.now()-start);}return new Promise(resolve=>requestAnimationFrame(()=>{observer.disconnect();globalThis.loadSVG=svg;globalThis.loadBody=body;resolve({times,rebuilds,sameSVG:svg===document.querySelector('.diagram-svg'),sameBody:body===document.querySelector('#document-body').firstElementChild});}));});
 assert.equal(stats.rebuilds,0);assert.equal(stats.sameSVG,true);assert.equal(stats.sameBody,true);assert.ok(Math.max(...stats.times)<3000);t.diagnostic(JSON.stringify({nodes:count,markdownBytes:f.prepared.artifacts[0].documents.reduce((n,d)=>n+Buffer.byteLength(d.markdown),0),selections:stats.times.length,maxMs:Math.max(...stats.times),totalMs:stats.times.reduce((a,b)=>a+b,0)}));
 await page.locator('#resize-right').focus();await page.keyboard.press('Home');await page.getByRole('button',{name:'Use dark theme'}).click();assert.equal(await page.evaluate(()=>loadSVG===document.querySelector('.diagram-svg')&&loadBody===document.querySelector('#document-body').firstElementChild),true);assert.equal(await page.locator('.diagram-node.is-selected').getAttribute('data-node-id'),'node_load_87');
 assert.equal(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true);assert.equal(await page.evaluate(()=>document.getAnimations().length),0);
});
test('keyboard focus remains visible in both themes and short workspace controls remain reachable',async t=>{
 const page=await open(t,fixture(t));for(const theme of ['light','dark']){
  if(theme==='dark')await page.getByRole('button',{name:'Use dark theme'}).click();await page.keyboard.press('Tab');
  for(const selector of ['#resize-right','#zoom-fit','.diagram-node-select']){await page.locator(selector).first().focus();assert.equal(await page.locator(selector).first().evaluate(el=>{const s=getComputedStyle(el);return el.matches(':focus-visible')&&s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>=2;}),true);}
 }
 await page.setViewportSize({width:800,height:300});await page.locator('#zoom-fit').focus();await page.keyboard.press('Enter');const fit=await page.locator('#zoom-fit').boundingBox();assert.ok(fit.y>=0&&fit.y+fit.height<=300);await page.locator('.diagram-svg').focus();await page.keyboard.press('ArrowDown');assert.ok((await page.locator('#diagram-container').boundingBox()).height>=80);
});
