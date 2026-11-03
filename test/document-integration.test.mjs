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
before(async()=>{const executablePath=[process.env.PFLOW_BROWSER_PATH,'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome'].filter(Boolean).find(existsSync);browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});});
after(async()=>browser?.close());
function fixture(t,{kind='prompt',mutate}={}){
 const parent=realpathSync(mkdtempSync(path.join(tmpdir(),'pflow-doc-sync-'))),root=path.join(parent,'input');mkdirSync(root);t.after(()=>rmSync(parent,{recursive:true,force:true}));
 const bundle=kind==='code'?path.join(root,'examples/a-sync'):path.join(root,'architecture');
 if(kind==='shared'){
  cpSync(path.join(tool,'test/fixtures/impact/repository'),root,{recursive:true});mkdirSync(bundle);
  cpSync(path.join(tool,'test/fixtures/regeneration/baseline/docs'),path.join(bundle,'docs'),{recursive:true});
  cpSync(path.join(tool,'test/fixtures/regeneration/baseline/graph.json'),path.join(bundle,'architecture.json'));
 }else cpSync(path.join(tool,kind==='prompt'?'test/fixtures/prompt-mode/onboarding/bundle':'examples/a-sync'),bundle,{recursive:true});
 const graphPath=path.join(bundle,'architecture.json'),graph=JSON.parse(readFileSync(graphPath));
 const docPath=graph.flows[0].docs.find(ref=>ref.anchor===graph.flows[0].id).path,doc=path.join(bundle,'docs',docPath);
 // Extra copies of already evidenced prose make scrolling meaningful without new steps.
 if(kind==='prompt')writeFileSync(doc,readFileSync(doc,'utf8').replace('After an offer is accepted, collect the employee details, including names such as José and 민지. The next step checks whether those details are complete. Evidence:',('Collect employee details. '.repeat(180))+'Evidence:'));
 mutate?.({graph,doc,bundle});writeFileSync(graphPath,JSON.stringify(graph));
 const file=path.join(parent,'architecture.html');writeStandaloneHTML(prepareBuild({input:bundle,repositoryRoot:root,output:file}));return {parent,root,bundle,graph,file,docPath};
}
async function open(t,f,width=1536){const context=await browser.newContext({offline:true,viewport:{width,height:1000}});t.after(()=>context.close());const page=await context.newPage();page.setDefaultTimeout(5000);const requests=[],errors=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(f.file).href);t.after(()=>{assert.deepEqual(errors,[]);assert.deepEqual(requests,[pathToFileURL(f.file).href]);});return page;}
const node=(page,id)=>page.locator(`.diagram-node[data-node-id="${id}"] .diagram-node-select`);
const section=(page,id)=>page.locator(`#document-body section[id="${id}"]`);
const locationButton=(page,id)=>section(page,id).locator(':scope > .section-actions .section-locate');
const activeNode=page=>page.locator('.diagram-node.is-selected').getAttribute('data-node-id');
async function centered(page,id){const n=await node(page,id).boundingBox(),v=await page.locator('#diagram-container').boundingBox();assert.ok(Math.abs(n.x+n.width/2-v.x-v.width/2)<2);assert.ok(Math.abs(n.y+n.height/2-v.y-v.height/2)<2);}
test('node selection retains complete process text and mounted Markdown while locating its section',async t=>{
 const f=fixture(t),page=await open(t,f);await page.evaluate(()=>{globalThis.originalMarkdown=document.querySelector('#document-body > div');globalThis.originalSVG=document.querySelector('.diagram-svg');});
 const before=await page.locator('#document-body').textContent(),title=await page.locator('#workspace-title').textContent(),transform=await page.locator('.diagram-scene').getAttribute('transform');
 await node(page,'node_p05').click();assert.equal(await page.locator('#view-documentation').isVisible(),true);assert.equal(await page.locator('#view-details').isVisible(),false);
 assert.equal(await page.locator('#document-body').textContent(),before);assert.equal(await page.evaluate(()=>originalMarkdown===document.querySelector('#document-body > div')&&originalSVG===document.querySelector('.diagram-svg')),true);
 assert.equal(await page.locator('#workspace-title').textContent(),title);assert.equal(await page.locator('.diagram-scene').getAttribute('transform'),transform);assert.equal(await page.locator('.doc-target').getAttribute('id'),'node_p05');
 const target=await section(page,'node_p05').boundingBox(),article=await page.locator('#document-article').boundingBox();assert.ok(Math.abs(target.y-article.y)<20);assert.ok(await page.locator('#document-article').evaluate(el=>el.scrollTop>100));
 assert.ok((await page.locator('#document-body').textContent()).includes('incomplete submission'));assert.ok((await page.locator('#document-body').textContent()).includes('Finish onboarding'));
});
test('document text and keyboard locate controls select and center without rebuilding or changing readable zoom',async t=>{
 const f=fixture(t),page=await open(t,f);await page.getByRole('button',{name:'Reset zoom',exact:true}).click();const zoom=await page.locator('#zoom-level').textContent();
 await page.evaluate(()=>{globalThis.originalSVG=document.querySelector('.diagram-svg');});await section(page,'node_p05').locator(':scope > p').click();await centered(page,'node_p05');assert.equal(await activeNode(page),'node_p05');
 await locationButton(page,'node_p02').focus();await page.keyboard.press('Space');await centered(page,'node_p02');assert.equal(await activeNode(page),'node_p02');assert.equal(await page.locator('#zoom-level').textContent(),zoom);assert.equal(await page.evaluate(()=>originalSVG===document.querySelector('.diagram-svg')),true);
});
test('duplicate display labels retain distinct canonical associations',async t=>{
 const f=fixture(t,{mutate:({graph,doc})=>{for(const id of ['node_p02','node_p05'])graph.flows[0].nodes.find(n=>n.id===id).label='Same label';writeFileSync(doc,readFileSync(doc,'utf8').replace('### Details complete?','### Same label').replace('### Request missing details','### Same label'));}}),page=await open(t,f);
 for(const id of ['node_p02','node_p05']){await locationButton(page,id).click();assert.equal(await activeNode(page),id);await centered(page,id);assert.equal(await page.locator('.doc-target').getAttribute('id'),id);}
});
test('selection and explicit document subflow entry stay separate, with back/forward/root context',async t=>{
 const f=fixture(t),page=await open(t,f),root=f.graph.flows[0],detail=f.graph.flows[1];await node(page,'node_p03').click();assert.equal(await page.locator('#workspace-title').textContent(),root.label);
 assert.equal(await page.locator('#navigation-back').isDisabled(),true);await section(page,'node_p03').getByRole('button',{name:'Open detail for Prepare access',exact:true}).click();assert.equal(await page.locator('#workspace-title').textContent(),detail.label);assert.equal(await page.locator('#document-reference').textContent(),f.docPath+'#'+detail.id);assert.equal(await page.locator('.diagram-node.is-selected').count(),0);
 await page.getByRole('button',{name:'Back',exact:true}).click();assert.equal(await page.locator('#workspace-title').textContent(),root.label);await page.getByRole('button',{name:'Forward',exact:true}).click();await page.getByRole('button',{name:'Top level: return to first flow in this path'}).click();assert.equal(await page.locator('#workspace-title').textContent(),root.label);
});
test('a section in a nested Flow navigates through its actual expansion path before selecting',async t=>{
 const f=fixture(t),page=await open(t,f);await locationButton(page,'node_p07').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#workspace-title').textContent(),f.graph.flows[1].label);assert.equal(await activeNode(page),'node_p07');await centered(page,'node_p07');assert.equal(await page.locator('#breadcrumb-list li').count(),2);assert.equal(await page.locator('#view-documentation').isVisible(),true);
});
test('a node without documentation never borrows a similarly named section',async t=>{
 const f=fixture(t,{mutate:({graph,doc})=>{const n=graph.flows[0].nodes.find(n=>n.id==='node_p05');delete n.docs;n.label='Details complete?';writeFileSync(doc,readFileSync(doc,'utf8').replace(/<a id="node_p05"><\/a>[\s\S]*?(?=<a id="node_p06")/,''));}}),page=await open(t,f);
 await node(page,'node_p05').click();assert.equal(await activeNode(page),'node_p05');assert.equal(await page.locator('.doc-target').getAttribute('id'),f.graph.flows[0].id);assert.match(await page.locator('#document-status').textContent(),/No element documentation link/);assert.equal(await locationButton(page,'node_p05').count(),0);
});
for(const fault of ['missing','wrong-owner','backlink'])test(`unreliable ${fault} mapping remains documentation-only with no guessed selection`,async t=>{
 const f=fixture(t),page=await open(t,f);await page.evaluate(({fault,path})=>{
  const sample=pFlowSamples[0],content=pFlowContent[sample.key].documents[path];const holder=document.createElement('div');holder.innerHTML=content.html;
  const target=holder.querySelector('#node_p05');if(fault==='missing')target.remove();if(fault==='wrong-owner')holder.querySelector('#flow_p02').append(target);if(fault==='backlink')delete sample.architecture.flows[0].nodes.find(n=>n.id==='node_p05').docs;
  content.html=holder.innerHTML;pFlow.initializeSample(sample);
 },{fault,path:f.docPath});
 assert.equal(await locationButton(page,'node_p05').count(),0);await node(page,'node_p05').click();assert.equal(await activeNode(page),'node_p05');assert.equal(await page.locator('.doc-target').getAttribute('id'),f.graph.flows[0].id);assert.ok((await page.locator('#document-status').textContent()).length>0);assert.equal(await page.locator('#view-documentation').isVisible(),true);
});
test('repeated node selection relocates after manual scrolling and restarts a bounded highlight',async t=>{
 const f=fixture(t),page=await open(t,f);await node(page,'node_p05').click();assert.equal(await section(page,'node_p05').evaluate(el=>el.classList.contains('doc-flash')),true);
 await page.waitForFunction(()=>!document.querySelector('#node_p05').classList.contains('doc-flash'));await page.locator('#document-article').evaluate(el=>el.scrollTop=0);await node(page,'node_p05').focus();await page.keyboard.press('Enter');assert.equal(await section(page,'node_p05').evaluate(el=>el.classList.contains('doc-flash')),true);assert.ok(await page.locator('#document-article').evaluate(el=>el.scrollTop>100));
});
test('manual document scrolling and selection preserve scroll while evidence clicks do not select parent nodes',async t=>{
 const f=fixture(t),page=await open(t,f);await locationButton(page,'node_p02').scrollIntoViewIfNeeded();const before=await page.locator('#document-article').evaluate(el=>el.scrollTop);await locationButton(page,'node_p02').click();assert.equal(await page.locator('#document-article').evaluate(el=>el.scrollTop),before);
 await section(page,'node_p05').locator('.source-link').first().click();assert.equal(await activeNode(page),'node_p02');assert.equal(await page.locator('#view-source').isVisible(),true);assert.equal(await page.locator('#source-snippet').isVisible(),true);
 await page.getByRole('tab',{name:'Documentation',exact:true}).click();assert.equal(await page.locator('#view-documentation').isVisible(),true);
});
test('collapse/restore, resize and themes retain the process, canonical selection and usable locate controls',async t=>{
 const f=fixture(t),page=await open(t,f);await node(page,'node_p05').click();const title=await page.locator('#workspace-title').textContent();await page.getByRole('button',{name:'Collapse process documentation'}).click();await page.getByRole('button',{name:'Restore process documentation'}).click();assert.equal(await activeNode(page),'node_p05');
 await page.getByRole('separator',{name:'Resize process documentation'}).focus();await page.keyboard.press('Home');await locationButton(page,'node_p02').click();await centered(page,'node_p02');assert.equal(await page.locator('#workspace-title').textContent(),title);
 await node(page,'node_p05').click();const light=await section(page,'node_p05').evaluate(el=>getComputedStyle(el).outlineColor);await page.getByRole('button',{name:'Use dark theme'}).click();const dark=await section(page,'node_p05').evaluate(el=>getComputedStyle(el).outlineColor);assert.notEqual(light,dark);assert.notEqual(await section(page,'node_p05').evaluate(el=>getComputedStyle(el).outlineStyle),'none');
  await page.setViewportSize({width:420,height:1000});await page.getByRole('button',{name:'Docs',exact:true}).click();const toggle=await page.locator('#toggle-right').boundingBox();assert.ok(toggle.x>=0&&toggle.x+toggle.width<=420);
  await page.getByRole('button',{name:'Collapse process documentation'}).click();await page.getByRole('button',{name:'Restore process documentation'}).click();assert.equal(await activeNode(page),'node_p05');
});
test('search and document selection share state without losing complete process content',async t=>{
 const f=fixture(t),page=await open(t,f);await page.keyboard.press('Control+k');await page.locator('#global-search').fill('assignee');await page.keyboard.press('Enter');assert.equal(await page.locator('#workspace-title').textContent(),f.graph.flows[1].label);assert.ok(await page.locator('mark.search-match').count()>0);
 await locationButton(page,'node_p08').click();assert.equal(await activeNode(page),'node_p08');await centered(page,'node_p08');await page.keyboard.press('Control+k');assert.equal(await page.locator('#global-search').inputValue(),'assignee');await page.keyboard.press('Escape');
});
test('repository-derived decisions use the same canonical mapping, centering and exact evidence',async t=>{
 const f=fixture(t,{kind:'code'}),page=await open(t,f),flow=f.graph.flows[2],decision=flow.nodes.find(n=>n.kind==='decision');await page.getByLabel('Displayed flow').selectOption(flow.id);
 await node(page,decision.id).click();assert.equal(await page.locator('.doc-target').getAttribute('id'),decision.id);await locationButton(page,decision.id).focus();await page.keyboard.press('Enter');await centered(page,decision.id);
 await section(page,decision.id).locator('.source-link').first().click();assert.equal(await page.locator('#source-snippet').isVisible(),true);assert.match(await page.locator('#source-fields').textContent(),/examples\/a-sync\/sources/);assert.equal(await page.locator('#workspace-title').textContent(),flow.label);
});
test('locating a shared detail node preserves each real caller trail without duplicated flows',async t=>{
 const roles=JSON.parse(readFileSync(path.join(tool,'test/fixtures/regeneration/baseline/roles.json')));
 const f=fixture(t,{kind:'shared',mutate:({graph,bundle})=>{
  const flow=graph.flows.find(item=>item.id===roles.flows.shared),n=flow.nodes.find(item=>item.id===roles.nodes.sharedAction),ref=flow.docs.find(ref=>ref.anchor===flow.id);
  n.docs=[{path:ref.path,anchor:n.id}];const doc=path.join(bundle,'docs',ref.path);writeFileSync(doc,readFileSync(doc,'utf8').replace('## Source evidence',`<a id="${n.id}"></a>\n### Await jobs publication\n\nAwait jobs publication, then return input. Evidence: ${n.sourceIds.map(id=>'['+id+']').join(', ')}.\n\n## Source evidence`));
 }}),page=await open(t,f);
 for(const name of ['beta','alpha']){
  const entry=f.graph.entryPoints.find(e=>e.id===roles.entries[name]);await page.getByRole('navigation',{name:'Process starts'}).getByRole('button',{name:entry.label,exact:true}).click();
  await page.locator(`.diagram-node[data-node-id="${roles.nodes[name+'Action']}"] .diagram-expand-control`).click();
  await locationButton(page,roles.nodes.sharedAction).click();assert.equal(await activeNode(page),roles.nodes.sharedAction);await centered(page,roles.nodes.sharedAction);
  assert.equal(await page.locator('#breadcrumb-list button').first().textContent(),entry.label);await page.getByRole('button',{name:'Back',exact:true}).click();assert.equal(await page.locator('#workspace-title').textContent(),f.graph.flows.find(item=>item.id===entry.flowId).label);
 }
 assert.equal(f.graph.flows.filter(flow=>flow.id===roles.flows.shared).length,1);
});
