import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { parseHTML } from 'linkedom';
import { chromium } from 'playwright-core';
import { validateDocumentation } from '../validation/validate-documentation.mjs';
import { prepareBuild } from '../builder/pipeline.mjs';
const base=fileURLToPath(new URL('./fixtures/documentation-generation/',import.meta.url));
const tool=fileURLToPath(new URL('../',import.meta.url));
const graph=JSON.parse(readFileSync(path.join(base,'generated/graph.json'),'utf8'));
const roles=JSON.parse(readFileSync(path.join(base,'generated/expectations.json'),'utf8'));
const nodes=graph.flows.flatMap(f=>f.nodes),edges=graph.flows.flatMap(f=>f.edges);
const node=role=>nodes.find(n=>n.id===roles.nodes[role]);
function tree(root,prefix=''){return readdirSync(path.join(root,prefix),{withFileTypes:true}).flatMap(e=>e.isDirectory()?tree(root,path.join(prefix,e.name)):[path.join(prefix,e.name)]).sort();}
function digestSource(root){return tree(root).filter(p=>!p.startsWith(path.join('docs','architecture')+path.sep)).map(p=>[p,createHash('sha256').update(readFileSync(path.join(root,p))).digest('hex')]);}
function fixture(t){const parent=mkdtempSync(path.join(tmpdir(),'pflow-generation-')),root=path.join(parent,'target with spaces');cpSync(path.join(base,'repository'),root,{recursive:true});const bundle=path.join(root,'docs/architecture');mkdirSync(bundle,{recursive:true});cpSync(path.join(base,'generated/docs'),path.join(bundle,'docs'),{recursive:true});writeFileSync(path.join(bundle,'architecture.json'),JSON.stringify(graph,null,2)+'\n');t.after(()=>rmSync(parent,{recursive:true,force:true}));return {root,bundle,output:path.join(bundle,'architecture.html')};}
function cli(f){return spawnSync(process.execPath,[path.join(tool,'builder/cli.mjs'),'build','--input',f.bundle,'--repository-root',f.root,'--output',f.output],{encoding:'utf8',cwd:tool});}
function requireWitness(entity,file,line){assert.ok(entity.sourceIds.some(id=>graph.sources.some(s=>s.id===id&&s.path===file&&s.startLine<=line&&s.endLine>=line)),`Missing ${file}:${line} evidence for ${entity.id}`);}

test('raw-input generated graph and canonical documentation pass unchanged M1 validation',t=>{
 const f=fixture(t);assert.deepEqual(validateDocumentation(graph,{docsRoot:path.join(f.bundle,'docs'),sourceRoot:f.root}),[]);
 assert.ok(graph.entryPoints.length>=2);assert.ok(graph.flows.length>=3);assert.ok(nodes.some(n=>n.expandFlowId));assert.ok(nodes.some(n=>n.kind==='decision'));assert.ok(edges.some(e=>e.kind==='exception'));
 for(const flow of graph.flows){assert.ok(flow.docs.some(d=>d.anchor===flow.id&&d.path.startsWith('flows/')));const document=readFileSync(path.join(f.bundle,'docs',flow.docs.find(d=>d.anchor===flow.id).path),'utf8');assert.ok(document.includes(`<a id="${flow.id}"></a>`));}
 for(const role of ['billing','publication','plugin'])assert.ok(node(role).docs.some(d=>d.anchor===node(role).id),'Meaningful node sections permit explicit Viewer/search mapping');
});
test('generated execution relationships retain actual boundaries, conditional exits and unresolved targets',()=>{
 for(const[kind,role]of [['http','billing'],['database','insert'],['messaging','publication']])assert.equal(node(role).external.kind,kind);
 requireWitness(node('billing'),'app/handlers.mjs',4);requireWitness(node('insert'),'app/persist.mjs',4);requireWitness(node('publication'),'app/handlers.mjs',8);
 for(const n of nodes.filter(n=>n.external?.attributes?.['library.name']))requireWitness(n,'boot.mjs',({ 'wire-http':2,'ledger-store':3,'parcel-bus':4,'cloud-objects':5,'seal-kit':6 })[n.external.attributes['library.name']]);
 requireWitness(node('billing'),'boot.mjs',12);requireWitness(node('billing'),'settings.mjs',5);
 assert.equal(node('plugin').kind,'unresolved');assert.equal(node('plugin').external,undefined);assert.ok(!edges.some(e=>e.from===node('plugin').id&&e.kind==='call'),'Unknown plugin must not acquire a guessed handler');
 assert.ok(edges.some(e=>e.kind==='branch'));assert.ok(edges.some(e=>e.kind==='exception'));
 const transfer=edges.find(e=>e.id===roles.asyncEdge);assert.equal(transfer.from,node('publication').id);assert.equal(transfer.to,node('consumer').id);assert.equal(transfer.kind,'receive');assert.equal(transfer.mode,'async');requireWitness(transfer,'app/subscription.mjs',7);requireWitness(transfer,'message-port.md',7);
 assert.equal(edges.filter(e=>e.kind==='receive'&&e.mode==='async').length,1,'Pull receive supplies no proven registered destination');
 assert.ok(!JSON.stringify(nodes.map(n=>n.external)).includes('unused.example.invalid'));
});
test('actual CLI embeds generated graph, searchable Markdown and exact snippets without changing source',t=>{
 const f=fixture(t),before=digestSource(f.root),result=cli(f);assert.equal(result.status,0,result.stderr);assert.equal(result.stderr,'');
 const prepared=prepareBuild({input:f.bundle,repositoryRoot:f.root,output:f.output});assert.equal(prepared.artifacts.length,1);assert.deepEqual(prepared.artifacts[0].architecture,graph);
 const html=readFileSync(f.output,'utf8'),document=parseHTML(html).document,payload=JSON.parse(document.getElementById('pflow-data').textContent)[0];assert.deepEqual(payload.architecture,graph);assert.deepEqual(payload.documents.map(d=>[d.path,d.markdown]),prepared.artifacts[0].documents.map(d=>[d.path,d.markdown]));
 assert.ok(payload.snippets.some(s=>s.lines.some(l=>l.text.includes("method: 'POST'"))));assert.equal(document.querySelectorAll('script[src],link,[src],[srcset]').length,0);assert.ok(!html.includes(f.root));assert.deepEqual(digestSource(f.root),before);assert.equal(existsSync(path.join(f.root,'outside-output.txt')),false);
 const bytes=readFileSync(f.output);assert.equal(cli(f).status,0);assert.deepEqual(readFileSync(f.output),bytes);
});
test('broken generated associations fail clearly and preserve an existing successful HTML',t=>{
 const f=fixture(t);assert.equal(cli(f).status,0);const before=readFileSync(f.output),invalid=structuredClone(graph);invalid.flows[0].docs[0].anchor='flow_missing';writeFileSync(path.join(f.bundle,'architecture.json'),JSON.stringify(invalid));const bad=cli(f);assert.equal(bad.status,1);assert.match(bad.stderr,/section|canonical|anchor/i);assert.deepEqual(readFileSync(f.output),before);
});
test('generated HTML preserves core exploration and Markdown search after inputs are removed, fully offline',async t=>{
 const f=fixture(t);assert.equal(cli(f).status,0);const moved=path.join(path.dirname(f.root),'architecture.html');writeFileSync(moved,readFileSync(f.output));rmSync(f.root,{recursive:true});
 const candidates=[process.env.PFLOW_BROWSER_PATH,'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome'].filter(Boolean);const executablePath=candidates.find(p=>existsSync(p));const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});t.after(()=>browser.close());
 const context=await browser.newContext({offline:true,viewport:{width:1440,height:1000}}),page=await context.newPage();page.setDefaultTimeout(5000);const requests=[],errors=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(moved).href);
 const select=n=>page.locator(`.diagram-node[data-node-id="${n.id}"] .diagram-node-select`);
 const flow=id=>graph.flows.find(f=>f.id===id);
 await page.getByLabel('Displayed flow').selectOption(roles.shipFlow);await select(node('billing')).click();assert.equal(await page.locator('#node-name').textContent(),node('billing').label);assert.match(await page.locator('#external-metadata').textContent(),/POST/);assert.equal(await page.locator('.doc-target').getAttribute('id'),node('billing').id);
 await page.getByRole('tab',{name:'Details',exact:true}).click(); await page.locator('#source-references button').filter({hasText:'app/handlers.mjs'}).first().click();assert.equal(await page.locator('#source-snippet').isVisible(),true);assert.match(await page.locator('#source-snippet li[value="4"] code').textContent(),/http\.request/);
 await page.getByLabel('Displayed flow').selectOption(roles.shipFlow);await page.locator(`.diagram-node[data-node-id="${roles.nodes.persistCall}"] .diagram-expand-control`).click();assert.equal(await page.locator('#workspace-title').textContent(),flow(node('persistCall').expandFlowId).label);await page.getByRole('button',{name:'Back',exact:true}).click();assert.equal(await page.locator('#workspace-title').textContent(),flow(roles.shipFlow).label);
 const transfer=page.locator(`.diagram-edge[data-edge-id="${roles.asyncEdge}"]`);await transfer.focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#node-kind').textContent(),'receive · async');assert.match(await page.locator('#document-status').textContent(),/No element documentation link/);assert.equal(await page.locator('.doc-target').getAttribute('id'),roles.shipFlow);
 await page.getByRole('navigation',{name:'Process starts'}).getByRole('button',{name:roles.consumerEntryLabel,exact:true}).click();assert.equal(await page.locator('#workspace-title').textContent(),flow(roles.consumerFlow).label);
 await page.keyboard.press('Control+k');await page.locator('#global-search').fill(roles.searchQuery);await page.waitForFunction(()=>document.querySelectorAll('.search-result').length>0);await page.keyboard.press('Enter');assert.equal(await page.locator('#search-popup').isVisible(),false);assert.ok(await page.locator('mark.search-match').count()>0);assert.equal(await page.locator('#node-name').textContent(),node('plugin').label);assert.equal(await page.locator('.doc-target').getAttribute('id'),node('plugin').id);assert.equal(await page.locator('#document-status').textContent(),'');
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[pathToFileURL(moved).href]);
});
