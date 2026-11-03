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
 t.after(()=>{assert.deepEqual(errors,[]);assert.deepEqual(requests,[pathToFileURL(file).href]);});return page;
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
 await page.getByRole('button',{name:'Restore process explorer'}).focus();await page.keyboard.press('Space');assert.equal(await page.getByLabel('Filter processes').isVisible(),true);
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
 assert.equal(await page.getByRole('tab',{name:'Documentation',exact:true}).getAttribute('aria-selected'),'true');await page.getByRole('button',{name:'Collapse process documentation'}).click();await page.getByRole('button',{name:'Docs',exact:true}).click();
 assert.equal(await page.locator('#view-documentation').isVisible(),true);assert.match(await page.locator('#document-reference').textContent(),/#flow_/);assert.equal(await page.locator('.diagram-node.is-selected').getAttribute('data-node-id'),selection);assert.equal(await page.locator('#document-article').evaluate(el=>el===document.activeElement),true);
});
test('all artifacts are navigable and filters use recorded trigger data',async t=>{
 const page=await open(t);const options=await page.locator('#category-filter option').allTextContents();await page.getByLabel('Starting condition').selectOption({label:options.at(-1)});
 assert.ok(await page.locator('.entry-group:visible').count()>0);await page.getByLabel('Starting condition').selectOption('');await page.getByLabel('Filter processes').fill('Rollup');await page.locator('.entry-button:visible').first().click();assert.equal(await page.locator('#workspace-title').textContent(),'Custom scheduled dispatch');
 await page.getByLabel('Filter processes').fill('nothing matches');assert.equal(await page.locator('#filter-empty').isVisible(),true);assert.equal(await page.locator('#workspace-title').textContent(),'Custom scheduled dispatch');
});
test('search shortcuts preserve the query and reveal collapsed documentation across artifacts',async t=>{
 const page=await open(t);await page.getByRole('button',{name:'Collapse process documentation'}).click();await page.keyboard.press('Meta+k');assert.equal(await page.locator('#global-search').evaluate(el=>el===document.activeElement),true);await page.locator('#global-search').fill('archive service performs');await page.keyboard.press('Enter');assert.equal(await page.locator('#view-documentation').isVisible(),true);assert.ok(await page.locator('mark.search-match').count()>0);
 await page.keyboard.press('Control+k');assert.equal(await page.locator('#global-search').inputValue(),'archive service performs');await page.keyboard.press('Escape');assert.equal(await page.locator('#search-popup').isVisible(),false);
});
test('category filtering uses the same normalized labels for missing and padded triggers',async t=>{
 const page=await open(t);await page.evaluate(()=>{
  const sample=structuredClone(pFlowSamples[0]);sample.architecture.entryPoints[0].trigger='  Custom registration  ';
  const extra=structuredClone(sample.architecture.entryPoints[0]);extra.id='entry_filter_missing';extra.label='Unrecorded start';delete extra.trigger;sample.architecture.entryPoints.push(extra);pFlow.initializeSample(sample);
 });
 assert.equal(await page.locator('#category-filter option').filter({hasText:/^All starts$/}).count(),1);
 for(const label of ['Custom registration','Trigger not recorded']){await page.getByLabel('Starting condition').selectOption({label});assert.equal(await page.locator('.entry-group:visible .entry-button').count(),1);}
 assert.equal(await page.getByRole('button',{name:'Unrecorded start',exact:true}).isVisible(),true);
});
test('automatic collapse returns focus from hidden explorer content to its restore button',async t=>{
 const page=await open(t);await page.getByLabel('Filter processes').focus();await page.setViewportSize({width:640,height:1024});
 await page.waitForFunction(()=>document.querySelector('#explorer-content').hidden);
 assert.equal(await page.getByRole('button',{name:'Restore process explorer'}).evaluate(el=>el===document.activeElement),true);
 await page.keyboard.press('Enter');assert.equal(await page.getByLabel('Filter processes').isVisible(),true);
});
test('dark theme covers surfaces, SVG, search and evidence without graph changes',async t=>{
 const page=await open(t);const get=()=>page.evaluate(()=>({surface:getComputedStyle(document.querySelector('#process-documentation')).backgroundColor,canvas:getComputedStyle(document.body).backgroundColor,text:getComputedStyle(document.querySelector('.diagram-node-name')).fill,node:getComputedStyle(document.querySelector('.diagram-node-shape')).fill,search:getComputedStyle(document.querySelector('.search-control')).backgroundColor,transform:document.querySelector('.diagram-scene').getAttribute('transform')}));
 const light=await get();await page.getByRole('button',{name:'Use dark theme'}).click();const dark=await get();for(const key of ['surface','canvas','text','node','search'])assert.notEqual(dark[key],light[key]);assert.equal(dark.transform,light.transform);
 await page.getByRole('button',{name:/^Select node Receive command\./}).click();await page.getByRole('tab',{name:'Details',exact:true}).click();await page.locator('#source-references button').first().click();assert.equal(await page.locator('#source-snippet').isVisible(),true);
 await page.getByRole('button',{name:'Use light theme'}).click();assert.equal((await get()).surface,light.surface);
});
for(const width of [1100,900,720,640,420])test(`narrow ${width}px shell keeps restore, Docs, search and viewport controls reachable`,async t=>{
 const page=await open(t,width);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.getByRole('button',{name:'Docs',exact:true}).click();assert.equal(await page.locator('#document-article').isVisible(),true);
 for(const id of ['#toggle-left','#toggle-right','#open-docs','#theme-toggle','#zoom-fit']){const r=await box(page,id);assert.ok(r.x>=0&&r.x+r.width<=width);}
 await page.locator('#toggle-left').click();await page.locator('#toggle-right').click();assert.ok((await box(page,'#diagram-container')).width>0);
 await page.keyboard.press('Control+k');assert.equal(await page.locator('#global-search').evaluate(el=>el===document.activeElement),true);
});

for (const tabName of ['Evidence references','Process summary','Details']) test(`${tabName} stays selected through selection, drill-down, Back and entry changes`,async t=>{
 const page=await open(t);await page.getByRole('tab',{name:tabName,exact:true}).click();
 const stays=async()=>assert.equal(await page.getByRole('tab',{name:tabName,exact:true}).getAttribute('aria-selected'),'true');
 await page.getByRole('button',{name:/^Select node Invoke refresh component\./}).click();await stays();
 if(tabName==='Evidence references')assert.ok(await page.locator('#source-picker option').count()>0);
 await page.locator('.diagram-expand-control').first().click();await stays();await page.getByRole('button',{name:'Back',exact:true}).click();await stays();
 await page.locator('.entry-button').last().click();await stays();
 if(tabName==='Evidence references')assert.ok(await page.locator('#source-picker option').count()>0);
 await page.getByRole('button',{name:'Docs',exact:true}).click();assert.equal(await page.getByRole('tab',{name:'Documentation',exact:true}).getAttribute('aria-selected'),'true');assert.match(await page.locator('#document-reference').textContent(),/#flow_/);
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

test('Documentation reveals each component after restoring a collapsed panel and after tab changes',async t=>{
 const page=await open(t);await page.locator('#flow-picker').selectOption('flow_844c0963da42');
 const movesTo=async id=>{
  await page.waitForFunction(id=>{const target=document.querySelector('.doc-target'),article=document.querySelector('#document-article');if(target?.id!==id)return false;const y=target.getBoundingClientRect().top-article.getBoundingClientRect().top;return y>=0&&y<22;},id);
  assert.equal(await page.getByRole('tab',{name:'Documentation',exact:true}).getAttribute('aria-selected'),'true');assert.match(await page.locator('#document-reference').textContent(),new RegExp('#'+id+'$'));
 };
 const select=id=>page.locator(`[data-node-id="${id}"] .diagram-node-select`).click();
 await select('node_d1e0f061c044');await movesTo('node_d1e0f061c044');
 await page.getByRole('button',{name:'Collapse process documentation'}).click();await select('node_687dd127f403');await movesTo('node_687dd127f403');
 await select('node_b5b0dd797025');await movesTo('node_b5b0dd797025');
 await page.getByRole('tab',{name:'Evidence references',exact:true}).click();await page.locator('#view-source').evaluate(el=>el.scrollTop=500);
 await select('node_d1e0f061c044');assert.equal(await page.getByRole('tab',{name:'Evidence references',exact:true}).getAttribute('aria-selected'),'true');
 assert.match(await page.locator('#source-fields').textContent(),/state.py.txt/);assert.ok(await page.locator('#source-snippet').textContent().then(text=>text.includes('http.get')));
 await page.getByRole('tab',{name:'Documentation',exact:true}).click();await movesTo('node_d1e0f061c044');
});
