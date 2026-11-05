import { revealExplanation } from './support/explanation.mjs';
import assert from 'node:assert/strict';
import {test,before,after} from 'node:test';
import {existsSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright-core';
import {prepareBuild} from '../builder/pipeline.mjs';
import {writeStandaloneHTML} from '../builder/html.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));let browser,folder,file;
before(async()=>{
 const executablePath=[process.env.PFLOW_BROWSER_PATH,'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome'].filter(Boolean).find(existsSync);
 browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
 folder=mkdtempSync(path.join(tmpdir(),'pflow-shell-'));file=path.join(folder,'architecture.html');
 writeStandaloneHTML(prepareBuild({input:path.join(root,'examples'),repositoryRoot:root,output:file}));
});
after(async()=>{await browser?.close();if(folder)rmSync(folder,{recursive:true,force:true});});
async function open(t,width=1536){
 const context=await browser.newContext({offline:true,viewport:{width,height:1024}});t.after(()=>context.close());const page=await context.newPage();page.setDefaultTimeout(5000);
 const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));await page.goto(pathToFileURL(file).href);
 t.after(()=>{assert.deepEqual(errors,[]);assert.ok(requests.length>0 && requests.every(url=>url===pathToFileURL(file).href));});return page;
}
const box=(page,id)=>page.locator(id).boundingBox();
test('standalone pFlow header and full-height three-column shell use only supported controls',async t=>{
 const page=await open(t);assert.equal((await page.locator('.brand').textContent()).trim(),'pFlow');
 assert.equal(await page.getByRole('button',{name:'Docs',exact:true}).isVisible(),true);assert.equal(await page.getByRole('button',{name:'Use dark theme'}).isVisible(),true);
 assert.equal(await page.locator('.app-header').locator('#sample-picker,.project-picker,[id*="settings"],[id*="branch"]').count(),0);
 assert.equal(await page.locator('.app-layout > .panel').count(),3);
 const panels=await page.locator('.app-layout > .panel').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right};}));
 for(const p of panels){assert.equal(p.top,panels[0].top);assert.equal(p.bottom,panels[0].bottom);assert.ok(p.bottom>1000);}
 assert.ok(panels[0].right<panels[1].left&&panels[1].right<panels[2].left);
 assert.equal(await page.locator('#view-documentation').isVisible(),true);assert.equal(await page.locator('#view-details').isVisible(),false);
});
test('both panels collapse independently, expand the graph, and restore keyboard access',async t=>{
 const page=await open(t),before=await box(page,'#diagram-container');
 await page.getByRole('button',{name:'Collapse process explorer'}).focus();await page.keyboard.press('Enter');
 assert.equal(await page.locator('#explorer-content').isVisible(),false);assert.equal(await page.getByRole('button',{name:'Restore process explorer'}).evaluate(el=>el===document.activeElement),true);
 await page.getByRole('button',{name:'Collapse process documentation'}).click();assert.equal(await page.locator('#documentation-content').isVisible(),false);
 assert.ok((await box(page,'#diagram-container')).width>before.width+500);
 await page.getByRole('button',{name:'Restore process explorer'}).focus();await page.keyboard.press('Space');assert.equal(await page.locator('#entry-groups').isVisible(),true);
 await page.getByRole('button',{name:'Restore process documentation'}).click();assert.equal(await page.locator('#view-documentation').isVisible(),true);
 await page.getByRole('button',{name:'Zoom in',exact:true}).click();assert.ok(parseInt(await page.locator('#zoom-level').textContent())>0);
});
test('pointer and keyboard resizing clamp widths and resize the existing SVG',async t=>{
 const page=await open(t);const left=page.getByRole('separator',{name:'Resize process explorer'}),right=page.getByRole('separator',{name:'Resize process documentation'});
 const initial=await box(page,'#diagram-container'),handle=await left.boundingBox();await page.mouse.move(handle.x+4,handle.y+200);await page.mouse.down();await page.mouse.move(handle.x+100,handle.y+200);await page.mouse.up();
 assert.ok((await box(page,'#process-explorer')).width>300);assert.ok((await box(page,'#diagram-container')).width<initial.width);
 await left.focus();await page.keyboard.press('Home');assert.equal(Math.round((await box(page,'#process-explorer')).width),180);await page.keyboard.press('ArrowRight');assert.equal(Math.round((await box(page,'#process-explorer')).width),200);
 await right.focus();await page.keyboard.press('Home');assert.equal(Math.round((await box(page,'#process-documentation')).width),280);await page.keyboard.press('ArrowLeft');assert.equal(Math.round((await box(page,'#process-documentation')).width),300);
 await page.keyboard.press('End');assert.ok((await box(page,'#diagram-container')).width>=318);
 const container=await box(page,'#diagram-container'),svg=await box(page,'.diagram-svg');assert.equal(svg.width,container.width);assert.equal(svg.height,container.height);
 const transform=await page.locator('.diagram-scene').getAttribute('transform');await page.getByRole('button',{name:'Zoom in',exact:true}).click();assert.notEqual(await page.locator('.diagram-scene').getAttribute('transform'),transform);await page.getByRole('button',{name:'Fit view',exact:true}).click();
});
test('pointer cancellation releases resize state and keeps dividers usable',async t=>{
 const page=await open(t),handle=page.locator('#resize-left'),rect=await handle.boundingBox(),before=(await box(page,'#process-explorer')).width;
 await page.mouse.move(rect.x+4,rect.y+200);await page.mouse.down();await page.mouse.move(rect.x+50,rect.y+200);
 await handle.dispatchEvent('pointercancel',{pointerId:1});await page.mouse.up();assert.equal(await page.locator('.is-resizing').count(),0);assert.equal((await box(page,'#process-explorer')).width,before);
 await handle.focus();await page.keyboard.press('Home');assert.equal(Math.round((await box(page,'#process-explorer')).width),180);
});
test('Docs restores the right column and opens the active flow without losing selection',async t=>{
 const page=await open(t);await page.getByRole('button',{name:/^Select node Invoke refresh component\./}).click();const selection=await page.locator('.diagram-node.is-selected').getAttribute('data-node-id');
 assert.equal(await page.locator('#view-documentation').evaluate(el=>String(!el.hidden)),'true');await page.getByRole('button',{name:'Collapse process documentation'}).click();await page.getByRole('button',{name:'Docs',exact:true}).click();
 assert.equal(await page.locator('#view-documentation').isVisible(),true);assert.match(await page.locator('#document-reference').textContent(),/#flow_/);assert.equal(await page.locator('.diagram-node.is-selected').getAttribute('data-node-id'),selection);assert.equal(await page.locator('#document-article').evaluate(el=>el===document.activeElement),true);
});
test('global search is the only search and process starts remain navigable',async t=>{
 const page=await open(t);assert.equal(await page.locator('#process-explorer input,#process-explorer select').count(),0);
 await page.locator('.entry-button').last().click();assert.equal(await page.locator('#workspace-title').textContent(),'Custom scheduled dispatch');
 assert.equal(await page.locator('#global-search').isVisible(),true);
});
test('search shortcuts preserve the query and reveal collapsed documentation across artifacts',async t=>{
 const page=await open(t);await page.getByRole('button',{name:'Collapse process documentation'}).click();await page.keyboard.press('Meta+k');assert.equal(await page.locator('#global-search').evaluate(el=>el===document.activeElement),true);await page.locator('#global-search').fill('archive service performs');await page.keyboard.press('Enter');assert.equal(await page.locator('#view-documentation').isVisible(),true);assert.ok(await page.locator('mark.search-match').count()>0);
 await page.keyboard.press('Control+k');assert.equal(await page.locator('#global-search').inputValue(),'archive service performs');await page.keyboard.press('Escape');assert.equal(await page.locator('#search-popup').isVisible(),false);
});
test('navigator exposes described detail flows using their actual calling context',async t=>{
 const page=await open(t);const branch=page.locator('.entry-group').first().locator('.navigator-branch').first();
 await branch.locator('summary').first().click();const detail=branch.locator('.detail-flow-button').first();
 assert.equal(await detail.innerText(),'Invoke refresh component');await detail.click();
 assert.equal(await page.locator('#workspace-title').textContent(),'Refresh component');
 assert.equal(await detail.getAttribute('aria-pressed'),'true');await page.locator('#navigation-back').click();
 assert.equal(await detail.getAttribute('aria-pressed'),'false');
});
test('automatic collapse returns focus from hidden explorer content to its restore button',async t=>{
 const page=await open(t);await page.locator('.entry-button').first().focus();await page.setViewportSize({width:640,height:1024});
 await page.waitForFunction(()=>document.querySelector('#explorer-content').hidden);
 assert.equal(await page.getByRole('button',{name:'Restore process explorer'}).evaluate(el=>el===document.activeElement),true);
 await page.keyboard.press('Enter');assert.equal(await page.locator('#entry-groups').isVisible(),true);
});
test('dark theme covers surfaces, SVG, search and evidence without graph changes',async t=>{
 const page=await open(t);const get=()=>page.evaluate(()=>({surface:getComputedStyle(document.querySelector('#process-documentation')).backgroundColor,canvas:getComputedStyle(document.body).backgroundColor,text:getComputedStyle(document.querySelector('.diagram-node-name')).fill,node:getComputedStyle(document.querySelector('.diagram-node-shape')).fill,search:getComputedStyle(document.querySelector('.search-control')).backgroundColor,transform:document.querySelector('.diagram-scene').getAttribute('transform')}));
 const light=await get();await page.getByRole('button',{name:'Use dark theme'}).click();const dark=await get();for(const key of ['surface','canvas','text','node','search'])assert.notEqual(dark[key],light[key]);assert.equal(dark.transform,light.transform);
 await page.getByRole('button',{name:/^Select node Receive command\./}).click();await revealExplanation(page,'details');await page.locator('#source-references button').first().click();assert.equal(await page.locator('#source-snippet').isVisible(),true);
 await page.getByRole('button',{name:'Use light theme'}).click();assert.equal((await get()).surface,light.surface);
});
for(const width of [1100,900,720,640,420])test(`narrow ${width}px shell keeps restore, Docs, search and viewport controls reachable`,async t=>{
 const page=await open(t,width);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.getByRole('button',{name:'Docs',exact:true}).click();assert.equal(await page.locator('#document-article').isVisible(),true);
 for(const id of ['#toggle-left','#toggle-right','#open-docs','#theme-toggle','#zoom-fit']){const r=await box(page,id);assert.ok(r.x>=0&&r.x+r.width<=width);}
 await page.locator('#toggle-left').click();await page.locator('#toggle-right').click();assert.ok((await box(page,'#diagram-container')).width>0);
 await page.keyboard.press('Control+k');assert.equal(await page.locator('#global-search').evaluate(el=>el===document.activeElement),true);
});

for (const tabName of ['Evidence references','Process summary','Details']) test(`${tabName} stays open through selection, drill-down, Back and entry changes`,async t=>{
 const page=await open(t);await page.locator({'Evidence references':'#tab-source','Process summary':'#tab-summary','Details':'#tab-details'}[tabName]).click();
 const stays=async()=>assert.equal(await page.locator({'Evidence references':'#tab-source','Process summary':'#tab-summary','Details':'#tab-details'}[tabName]).evaluate(el=>String(el.parentElement.open)),'true');
 await page.getByRole('button',{name:/^Select node Invoke refresh component\./}).click();await stays();
 if(tabName==='Evidence references')assert.ok(await page.locator('#source-picker option').count()>0);
 await page.locator('.diagram-expand-control').first().click();await stays();await page.getByRole('button',{name:'Back',exact:true}).click();await stays();
 await page.locator('.entry-button').last().click();await stays();
 if(tabName==='Evidence references')assert.ok(await page.locator('#source-picker option').count()>0);
 await page.getByRole('button',{name:'Docs',exact:true}).click();assert.equal(await page.locator('#view-documentation').evaluate(el=>String(!el.hidden)),'true');assert.match(await page.locator('#document-reference').textContent(),/#flow_/);
});
test('components in one flow expose distinct cited text and canonical references without replacing the mounted document',async t=>{
 const page=await open(t);await page.evaluate(()=>{globalThis.keptDocument=document.querySelector('#document-body').firstElementChild;});
 const descriptions=[],references=[];
 for(const label of ['Receive command','Invoke refresh component']){
  await page.getByRole('button',{name:new RegExp('^Select node '+label+'\\.')}).click();
  descriptions.push(await page.locator('.doc-target > p').first().textContent());references.push(await page.locator('#document-reference').textContent());
  assert.ok(await page.locator('.doc-target .source-link').count()>0);assert.match(await page.locator('#document-context').textContent(),new RegExp(label));
 }
 assert.notEqual(descriptions[0],descriptions[1]);assert.notEqual(references[0],references[1]);assert.equal(await page.evaluate(()=>keptDocument===document.querySelector('#document-body').firstElementChild),true);
});

test('Documentation reveals each component after restoring a collapsed panel and with disclosures open',async t=>{
 const page=await open(t);await page.locator('#flow-picker').selectOption('flow_844c0963da42');
 const movesTo=async id=>{
  await page.waitForFunction(id=>{const target=document.querySelector('.doc-target'),article=document.querySelector('#document-article');if(target?.id!==id)return false;const y=target.getBoundingClientRect().top-article.getBoundingClientRect().top;return y>=0&&y<22;},id);
  assert.equal(await page.locator('#view-documentation').evaluate(el=>String(!el.hidden)),'true');assert.match(await page.locator('#document-reference').textContent(),new RegExp('#'+id+'$'));
 };
 const select=id=>page.locator(`[data-node-id="${id}"] .diagram-node-select`).click();
 await select('node_d1e0f061c044');await movesTo('node_d1e0f061c044');
 await page.getByRole('button',{name:'Collapse process documentation'}).click();await select('node_687dd127f403');await movesTo('node_687dd127f403');
 await select('node_b5b0dd797025');await movesTo('node_b5b0dd797025');
 await revealExplanation(page,'source');await page.locator('#view-source').evaluate(el=>el.scrollTop=500);
 await select('node_d1e0f061c044');assert.equal(await page.locator('#tab-source').evaluate(el=>String(el.parentElement.open)),'true');
 assert.match(await page.locator('#source-fields').textContent(),/state.py.txt/);assert.ok(await page.locator('#source-snippet').textContent().then(text=>text.includes('http.get')));
 await page.locator('#view-documentation').scrollIntoViewIfNeeded();await movesTo('node_d1e0f061c044');
});

test('node and edge selections emphasize immediate relationships without changing graph geometry',async t=>{
 const page=await open(t);const selected='node_352296cd82d5';
 const before=await page.locator('.diagram-scene').getAttribute('transform');
 await page.locator(`[data-node-id="${selected}"] .diagram-node-select`).click();
 const state=await page.evaluate(id=>{
  const edges=[...document.querySelectorAll('.diagram-edge')];
  return {related:edges.filter(e=>e.dataset.from===id||e.dataset.to===id).map(e=>e.classList.contains('is-related')),
   unrelated:edges.filter(e=>e.dataset.from!==id&&e.dataset.to!==id).map(e=>getComputedStyle(e).opacity),
   mutedNodes:document.querySelectorAll('.diagram-node.is-muted').length};
 },selected);
 assert.ok(state.related.length);assert.ok(state.related.every(Boolean));assert.ok(state.unrelated.every(v=>Number(v)<1));assert.ok(state.mutedNodes>0);
 assert.equal(await page.locator('.diagram-scene').getAttribute('transform'),before);
 await page.locator('.diagram-edge').last().focus();await page.keyboard.press('Enter');
 assert.equal(await page.locator('.diagram-edge.is-selected.is-related').count(),1);
 assert.equal(await page.locator('.diagram-node:not(.is-muted)').count(),2);
 await page.locator('#clear-selection').click();assert.equal(await page.locator('.is-muted,.is-related').count(),0);
});

test('exception visibility preserves shared outcomes, viewport and canonical documentation navigation',async t=>{
 const page=await open(t);const before=await page.locator('.diagram-scene').getAttribute('transform');
 const target=await page.locator('.diagram-edge.edge-exception').first().getAttribute('data-to');
 await page.locator('#show-exceptions').uncheck();
 assert.equal(await page.locator('.diagram-edge.edge-exception').isVisible(),false);
 assert.equal(await page.locator(`.diagram-node[data-node-id="${target}"]`).isVisible(),false);
 assert.equal(await page.locator('.diagram-scene').getAttribute('transform'),before);
 // Explicitly locating the hidden outcome makes its evidence-backed exception visible again.
 await page.locator(`#${target} .section-locate`).click();
 assert.equal(await page.locator('#show-exceptions').isChecked(),true);
 assert.equal(await page.locator(`.diagram-node[data-node-id="${target}"].is-selected`).isVisible(),true);
 await page.evaluate(()=>{
  const sample=structuredClone(pFlowSamples[0]),flow=sample.architecture.flows[0],edge=flow.edges.find(e=>e.kind==='exception');
  flow.edges.push({...edge,id:'edge_shared_outcome_test',kind:'call',from:flow.startNodeId});pFlow.initializeSample(sample);
 });
 await page.locator('#show-exceptions').uncheck();assert.equal(await page.locator(`.diagram-node[data-node-id="${target}"]`).isVisible(),true);
 assert.equal(await page.locator('[data-edge-id="edge_shared_outcome_test"]').isVisible(),true);
});

test('only theme, panel width and explicit collapse preferences survive reload',async t=>{
 const page=await open(t);const left=page.locator('#resize-left'),right=page.locator('#resize-right');
 await left.focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowRight');
 await right.focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowLeft');
 await page.locator('.entry-button').nth(1).click();await page.locator('.diagram-node-select').first().click();
 await page.locator('#theme-toggle').click();await page.locator('#toggle-left').click();await page.locator('#toggle-right').click();
 await page.locator('#zoom-in').click();await page.locator('#zoom-in').click();const zoom=await page.locator('#zoom-level').textContent();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('pflow.presentation.v1')));
 assert.deepEqual(Object.keys(saved).sort(),['left','right','theme']);assert.equal(saved.left.width,200);assert.equal(saved.right.width,300);
 await page.reload();
 assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
 assert.equal(await page.locator('#toggle-left').getAttribute('aria-expanded'),'false');assert.equal(await page.locator('#toggle-right').getAttribute('aria-expanded'),'false');
 assert.equal(await page.locator('.diagram-node.is-selected').count(),0);assert.notEqual(await page.locator('#zoom-level').textContent(),zoom);
 await page.locator('#toggle-left').click();await page.locator('#toggle-right').click();
 assert.equal(Math.round((await box(page,'#process-explorer')).width),200);assert.equal(Math.round((await box(page,'#process-documentation')).width),300);
 assert.equal(await page.locator('.entry-button[aria-pressed="true"]').getAttribute('data-entry-id'),'entry_b285ac74eb27');
});

test('blocked and malformed storage do not prevent offline navigation',async t=>{
 const page=await open(t);await page.evaluate(()=>localStorage.setItem('pflow.presentation.v1','{invalid'));await page.reload();
 assert.equal(await page.locator('.diagram-node').count(),4);
 await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage denied');}});});await page.reload();
 await page.locator('#theme-toggle').click();await page.locator('#resize-left').focus();await page.keyboard.press('Home');await page.locator('#toggle-left').click();
 assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');assert.equal(await page.locator('#toggle-left').getAttribute('aria-expanded'),'false');
});

test('contents, technical details and evidence are independent disclosures around a persistent narrative',async t=>{
 const page=await open(t);assert.equal(await page.locator('[role="tab"]').count(),0);
 assert.equal(await page.locator('#document-contents').evaluate(el=>el.open),false);
 await page.locator('#document-contents > summary').focus();await page.keyboard.press('Enter');assert.ok(await page.locator('#document-outline button:visible').count()>0);
 await page.evaluate(()=>globalThis.narrativeRoot=document.querySelector('#document-body').firstElementChild);
 await revealExplanation(page,'source');await revealExplanation(page,'details');
 await page.locator('.diagram-node-select').first().click();
 assert.equal(await page.evaluate(()=>narrativeRoot===document.querySelector('#document-body').firstElementChild),true);
 assert.equal(await page.locator('#evidence-disclosure').evaluate(el=>el.open),true);assert.equal(await page.locator('#technical-disclosure').evaluate(el=>el.open),true);
 assert.equal(await page.locator('#view-documentation').isVisible(),true);
});

test('navigator keeps shared detail calling paths and bounds recursive expansion',async t=>{
 const page=await open(t);await page.evaluate(()=>{
  const sample=structuredClone(pFlowSamples[0]),root=sample.architecture.flows[0],detailId=root.nodes.find(n=>n.expandFlowId).expandFlowId;
  root.nodes[0].expandFlowId=detailId;
  const detail=sample.architecture.flows.find(f=>f.id===detailId);detail.nodes[0].expandFlowId=root.id;
  pFlow.initializeSample(sample);
 });
 const branch=page.locator('.entry-group').first().locator('.navigator-branch').first();await branch.locator(':scope > summary').click();
 const callers=branch.locator(':scope > ul > li > .detail-flow-button');await callers.first().waitFor({state:'visible'});assert.equal(await callers.count(),2);
 for(let i=0;i<2;i++){
  await callers.nth(i).click();assert.equal(await page.locator('#workspace-title').textContent(),'Refresh component');
  assert.equal(await callers.nth(i).getAttribute('aria-pressed'),'true');
  const recursive=branch.locator(':scope > ul > li').nth(i).locator('.navigator-branch');await recursive.locator('summary').click();
  assert.equal(await recursive.locator('button').first().isDisabled(),true);assert.match(await recursive.locator('button').first().textContent(),/already in this path/);
  assert.equal(await page.locator('.diagram-svg').count(),1);await page.locator('#navigation-back').click();
 }
});


test('node selection reveals its narrative even after scrolling down to expanded evidence',async t=>{
 const page=await open(t);await revealExplanation(page,'source');await revealExplanation(page,'details');
 await page.locator('#documentation-content').evaluate(el=>el.scrollTop=el.scrollHeight);
 await page.locator('.diagram-node-select').first().click();
 await page.waitForFunction(()=>{const target=document.querySelector('.doc-target').getBoundingClientRect(),reader=document.querySelector('#documentation-content').getBoundingClientRect();return target.top>=reader.top&&target.top<reader.bottom-24;});
 assert.equal(await page.locator('#evidence-disclosure').evaluate(el=>el.open),true);
 assert.equal(await page.locator('#technical-disclosure').evaluate(el=>el.open),true);
});
