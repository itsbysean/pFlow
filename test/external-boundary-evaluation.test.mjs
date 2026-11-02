import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateArtifact } from '../validation/validate-artifact.mjs';
import { validateDocumentation } from '../validation/validate-documentation.mjs';
import { ship, drain } from './fixtures/boundaries/repository/app/handlers.mjs';
import { loadSettings } from './fixtures/boundaries/repository/settings.mjs';
const base=fileURLToPath(new URL('./fixtures/boundaries/',import.meta.url));
const load=p=>JSON.parse(readFileSync(path.join(base,p),'utf8'));
const graph=load('expected/javascript/boundaries.json'), roles=load('expected/javascript/expectations.json');
const nodes=g=>g.flows.flatMap(f=>f.nodes), node=role=>nodes(graph).find(n=>n.id===roles.nodes[role]);
const attrs=role=>node(role).external.attributes;
const options=(lang,repo,stage='expected')=>({docsRoot:path.join(base,stage,lang,'docs'),sourceRoot:path.join(base,repo)});
function config(){return loadSettings(readFileSync(path.join(base,'repository/config/settings.json'),'utf8'),readFileSync(path.join(base,'repository/config/transport.xml'),'utf8'),{PEER_URL:'https://test-peer.invalid'});}
// Recording ports exercise owned callers only. They establish supplied arguments,
// not external library implementation, connectivity or delivery guarantees.
function recording({status=200,failSql}={}){
 const calls=[];const record=(kind,value)=>calls.push({kind,value});
 const ports={http:{async request(value){record('http',value);return {status};}},db:{async exec(sql,params){record('db',{sql,params});if(sql.startsWith(failSql??'\0'))throw new Error('database rejected');}},bus:{async publish(value){record('publish',value);return 'ack';},async receive(value){record('receive',value);return 'message';}},objects:{async putObject(value){record('storage',value);}},signer:{sign(value,options){record('sign',{value,options});return 'signature';}}};
 return {calls,ports};
}
function requireWitness(g,n,p,line){assert.ok(n.sourceIds.some(id=>g.sources.some(s=>s.id===id&&s.path===p&&s.startLine<=line&&s.endLine>=line)),`Missing metadata witness ${p}:${line}`);}
for(const [lang,repo] of [['javascript','repository'],['python','python-repository']])test(`${lang}: boundary enrichment validates and preserves the complete M5-02 graph identity`,()=>{
 const seed=load(`seeds/${lang}/analyzed.json`), enriched=load(`expected/${lang}/boundaries.json`);
 assert.deepEqual(validateDocumentation(seed,options(lang,repo,'seeds')),[]);
 assert.deepEqual(validateDocumentation(enriched,options(lang,repo)),[]);
 assert.deepEqual(enriched.entryPoints,seed.entryPoints);
 assert.equal(enriched.flows.length,seed.flows.length);
 for(const f of seed.flows){const actual=enriched.flows.find(x=>x.id===f.id);assert.deepEqual(actual.edges,f.edges);assert.equal(actual.startNodeId,f.startNodeId);assert.equal(actual.nodes.length,f.nodes.length);
 for(const n of f.nodes){const actualNode=actual.nodes.find(x=>x.id===n.id);const {external,sourceIds,docs,...core}=actualNode;const {sourceIds:oldSources,...oldCore}=n;assert.deepEqual(core,oldCore);for(const id of oldSources)assert.ok(sourceIds.includes(id));if(n.kind!=='external')assert.equal(external,undefined);}}
 for(const s of seed.sources)assert.deepEqual(enriched.sources.find(x=>x.id===s.id),s);
});
test('configured HTTP metadata agrees with actual invocation options and response guard',async()=>{
 const r=recording();assert.equal(await ship({id:'42',endpoint:'https://input.invalid'},r.ports,config()),'signature');
 assert.deepEqual(r.calls.map(c=>c.kind),['http','http','db','db','db','publish','storage','sign','http']);
 const first=r.calls[0].value,a=attrs('static');assert.equal(a['http.url'],first.url);assert.equal(a['http.baseUrl']+a['http.path'],first.url);assert.equal(a['http.method'],first.method);assert.equal(a['http.timeoutMs'],first.timeoutMs);assert.equal(a['http.retries'],first.retries);assert.equal(node('static').external.name,first.tag);
 const failed=recording({status:400});await assert.rejects(ship({},failed.ports,config()),/billing rejected/);assert.equal(failed.calls.length,1);requireWitness(graph,node('static'),'app/handlers.mjs',5);
});
test('environment and request-dependent HTTP destinations retain expressions without invented resolved URLs',async()=>{
 const r=recording();await ship({id:'x',endpoint:'https://caller.invalid/custom'},r.ports,config());
 assert.equal(attrs('peer')['http.baseUrlEnv'],'PEER_URL');assert.equal(r.calls[1].value.url,'https://test-peer.invalid/status');assert.equal(attrs('peer')['http.url'],undefined);
 assert.equal(attrs('runtime')['http.urlExpression'],'input.endpoint');assert.equal(r.calls.at(-1).value.url,'https://caller.invalid/custom');assert.equal(attrs('runtime')['http.url'],undefined);
 requireWitness(graph,node('peer'),'settings.mjs',5);
});
test('database table mapping and explicit transaction calls match executed owned SQL',async()=>{
 const r=recording();await ship({id:'x'},r.ports,config());const sql=r.calls.filter(c=>c.kind==='db').map(c=>c.value.sql);
 assert.deepEqual(sql,['BEGIN','INSERT INTO acct_items (id) VALUES (?)','COMMIT']);assert.equal(attrs('insert')['database.table'],'acct_items');assert.equal(attrs('insert')['database.driver'],'sqlite');
 for(const role of ['begin','insert','commit','rollback'])requireWitness(graph,node(role),'config/settings.json',3);
 requireWitness(graph,node('insert'),'config/settings.json',4);
 const failed=recording({failSql:'INSERT'});await assert.rejects(ship({id:'x'},failed.ports,config()),/database rejected/);assert.deepEqual(failed.calls.filter(c=>c.kind==='db').map(c=>c.value.sql),['BEGIN','INSERT INTO acct_items (id) VALUES (?)','ROLLBACK']);
 assert.equal(attrs('rollback')['database.operation'],'ROLLBACK');
});
test('XML-selected messaging operations remain independent awaited boundaries without a flow link',async()=>{
 const cfg=config(),r=recording();await ship({id:'x'},r.ports,cfg);assert.equal(await drain(r.ports,cfg),'message');
 const publication=r.calls.find(c=>c.kind==='publish').value,receipt=r.calls.find(c=>c.kind==='receive').value;
 assert.equal(publication.topic,attrs('publish')['messaging.channel']);assert.equal(receipt.topic,attrs('receive')['messaging.channel']);assert.equal(publication.messageType,attrs('publish')['messaging.messageType']);assert.equal(publication.routingKey,attrs('publish')['messaging.routingKey']);assert.equal(cfg.protocol,attrs('publish')['messaging.protocol']);assert.equal(attrs('publish')['messaging.brokerUrlEnv'],'BROKER_URL');
 for(const role of ['publish','receive'])requireWitness(graph,node(role),'config/transport.xml',2);
 for(const f of graph.flows)for(const e of f.edges){assert.ok(f.nodes.some(n=>n.id===e.from));assert.ok(f.nodes.some(n=>n.id===e.to));assert.equal(e.mode,'sync');}
 assert.equal(node('publish').expandFlowId,undefined);assert.equal(node('receive').expandFlowId,undefined);
});
test('significant SDK and library-only calls retain caller options without traversing vendor code',async()=>{
 const r=recording();await ship({id:'obj'},r.ports,config());const storage=r.calls.find(c=>c.kind==='storage').value,sign=r.calls.find(c=>c.kind==='sign').value;
 assert.equal(node('storage').external.kind,'other');assert.equal(attrs('storage')['storage.bucket'],storage.bucket);assert.equal(attrs('storage')['storage.region'],config().storage.region);assert.equal(attrs('storage')['storage.keyExpression'],'input.id');assert.equal(storage.key,'obj');
 assert.equal(node('sign').external.kind,'library');assert.equal(node('sign').external.name,'seal-kit');assert.equal(attrs('sign')['library.format'],sign.options.format);
 assert.ok(!graph.sources.some(s=>s.path.startsWith('third_party/')));assert.ok(!JSON.stringify(graph).includes('sdk-internal.example.invalid'));assert.ok(!Object.keys(attrs('sign')).some(k=>k.startsWith('http.')));
});
test('unused imports and inactive configuration do not create boundaries or destination claims',()=>{
 assert.equal(nodes(graph).filter(n=>n.kind==='external').length,11);
 for(const n of nodes(graph).filter(n=>n.external))requireWitness(graph,n,'boot.mjs',2);
 const metadata=JSON.stringify(nodes(graph).map(n=>n.external));for(const value of ['unused-mail','unused.example.invalid','InvoiceRecord','not-used','RabbitMQ','Amazon'])assert.ok(!metadata.includes(value),value);
 assert.equal(node('persistCall').kind,'operation');assert.equal(node('persistCall').external,undefined);assert.equal(node('persistCall').expandFlowId,roles.flows.persist);
});
test('active configuration counterfactual changes observed arguments including literal double slash',async()=>{
 const cfg=config();cfg.billing.origin='https://billing-next.example.invalid/';cfg.tables.invoice='invoice_audit';cfg.topic='ledger.revised';const r=recording();await ship({id:'x'},r.ports,cfg);
 assert.equal(r.calls[0].value.url,'https://billing-next.example.invalid//v1/items');assert.notEqual(r.calls[0].value.url,attrs('static')['http.url']);assert.equal(r.calls.find(c=>c.kind==='db'&&c.value.sql.startsWith('INSERT')).value.sql,'INSERT INTO invoice_audit (id) VALUES (?)');assert.equal(r.calls.find(c=>c.kind==='publish').value.topic,'ledger.revised');
});
test('fixture evidence checks catch unsupported metadata beyond schema/reference validation',()=>{
 const changed=structuredClone(graph), n=nodes(changed).find(x=>x.id===roles.nodes.insert);n.sourceIds=n.sourceIds.filter(id=>id!==roles.sources.tableConfig);
 assert.deepEqual(validateArtifact(changed,options('javascript','repository')),[],'Structural validity does not prove metadata evidence');assert.throws(()=>requireWitness(changed,n,'config/settings.json',4),/Missing metadata witness/);
 const invalid=structuredClone(graph);nodes(invalid).find(x=>x.id===roles.nodes.static).external.kind='http-client';assert.ok(validateDocumentation(invalid,options('javascript','repository')).length>0);
});
test('Python filesystem boundary preserves environment key and source evidence without resolving host files',()=>{
 const py=load('expected/python/boundaries.json'), boundary=nodes(py).find(n=>n.external);assert.equal(boundary.external.kind,'other');assert.equal(boundary.external.attributes['filesystem.pathEnv'],'REPORT_PATH');assert.equal(boundary.external.attributes['filesystem.encoding'],'utf-8');requireWitness(py,boundary,'entry.py',5);requireWitness(py,boundary,'entry.py',6);assert.equal(boundary.external.attributes['filesystem.path'],undefined);
});
