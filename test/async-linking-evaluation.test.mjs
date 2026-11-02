import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { validateDocumentation } from '../validation/validate-documentation.mjs';
import { register } from './fixtures/async-linking/repository/app/register.mjs';
import * as handlers from './fixtures/async-linking/repository/app/handlers.mjs';
const base=fileURLToPath(new URL('./fixtures/async-linking/',import.meta.url));
const load=p=>JSON.parse(readFileSync(path.join(base,p),'utf8'));
const seed=load('seeds/boundaries.json'),graph=load('expected/linked.json'),roles=load('expected/expectations.json');
const validationOptions=stage=>({docsRoot:path.join(base,stage,'docs'),sourceRoot:path.join(base,'repository')});
const allNodes=g=>g.flows.flatMap(f=>f.nodes), deliveries=g=>g.flows.flatMap(f=>f.edges.filter(e=>e.mode==='async'));
const receivingRole=n=>Object.entries(roles.receivers).find(([,id])=>id===n)?.[0];
// Fixture-only recorder for the declared message-port contract. No broker emulation
// is installed in the Skill, and caller probes do not establish live delivery.
function recording(cfg=load('repository/config/routes.json')){
 const subscriptions=[],publications=[];const clients=Object.fromEntries(Object.entries(cfg.brokers).map(([key,binding])=>[key,{async publish(envelope){publications.push({broker:key,binding,envelope});},subscribe(options,callback){subscriptions.push({broker:key,binding,options,callback});}}]));
 register(clients,cfg);return {cfg,clients,subscriptions,publications};
}
function eligible(publication,subscription){
 const a=publication.binding,b=subscription.binding;
 return typeof a.endpoint==='string'&&typeof b.endpoint==='string'&&a.endpoint===b.endpoint&&typeof a.namespace==='string'&&typeof b.namespace==='string'&&a.namespace===b.namespace&&['destination','route','type'].every(k=>typeof publication.envelope[k]==='string'&&typeof subscription.options[k]==='string'&&publication.envelope[k]===subscription.options[k]);
}
// Config order labels captured subscriptions. Chain callback behavior is probed below;
// pass-through handler identity also requires source review.
function namedSubscriptions(r){const active=r.cfg.subscriptions.filter(row=>row.enabled);return r.subscriptions.map((s,i)=>({...s,handler:active[i].handler}));}
function possible(r,p){return namedSubscriptions(r).filter(s=>eligible(p,s)).map(s=>s.handler).sort();}
function linkedRecipients(role,g=graph){return deliveries(g).filter(e=>e.from===roles.publications[role].nodeId).map(e=>receivingRole(e.to)).sort();}
function requireEvidence(g,edge,required){for(const role of required)assert.ok(edge.sourceIds.includes(roles.sources[role]),`Missing link evidence ${role}`);}
async function invoke(role,r,input={audit:true,replay:true}){const p=roles.publications[role];await handlers[p.handler](r.clients[p.runtime?'runtimeProducer':'primary'],r.cfg,input);return r.publications.find(item=>item.envelope.destination===r.cfg.destinations[p.destinationKey]);}

test('seed and linked artifact pass unchanged M1 schema, semantic and documentation checks',()=>{
 assert.deepEqual(validateDocumentation(seed,validationOptions('seeds')),[]);assert.deepEqual(validateDocumentation(graph,validationOptions('expected')),[]);
 assert.deepEqual(graph.entryPoints,seed.entryPoints);assert.deepEqual(graph.sources,seed.sources);assert.equal(graph.flows.length,seed.flows.length);
 for(const before of seed.flows){const after=graph.flows.find(f=>f.id===before.id);assert.deepEqual(after.nodes,before.nodes);assert.equal(after.startNodeId,before.startNodeId);assert.deepEqual(after.edges.filter(e=>e.mode!=='async'),before.edges);}
 assert.equal(deliveries(graph).length,11);
});
test('confirmed links agree with actual publication and enabled registration arguments',async()=>{
 for(const role of Object.keys(roles.publications)){const r=recording(),p=await invoke(role,r);assert.ok(p);assert.deepEqual(linkedRecipients(role),possible(r,p),role);}
 assert.deepEqual(linkedRecipients('emitOrders'),['auditTap','workerOne','workerTwo']);assert.deepEqual(linkedRecipients('emitAudit'),['receipt']);
});
test('same destination on a different broker or namespace does not establish reachability',async()=>{
 const r=recording(),p=await invoke('emitOrders',r);const wrong=namedSubscriptions(r).find(s=>s.handler==='wrongBroker');assert.equal(wrong.options.destination,p.envelope.destination);assert.equal(eligible(p,wrong),false);assert.ok(!linkedRecipients('emitOrders').includes('wrongBroker'));
 assert.equal(eligible(p,{...wrong,binding:{...p.binding,namespace:'another-tenant'}}),false);
 assert.equal(eligible(p,{...wrong,binding:{...p.binding}}),true,'An explicitly equal routing domain can match across local aliases');
});
test('configuration destination resolution survives renaming without relying on familiar labels',async()=>{
 const r=recording();r.cfg.destinations.orders='opaque-destination-91';
 // Registration uses the selected configuration at registration time.
 const changed=recording(r.cfg),p=await invoke('retryOrders',changed);assert.equal(p.envelope.destination,'opaque-destination-91');assert.deepEqual(possible(changed,p),linkedRecipients('retryOrders'));
 assert.equal(graph.flows.flatMap(f=>f.nodes).find(n=>n.id===roles.publications.retryOrders.nodeId).external.attributes['messaging.destination'],'orders.v1');
});
test('independent environment placeholders remain unresolved even when their key names match',async()=>{
 const r=recording(),p=await invoke('runtimeOrders',r);const consumer=namedSubscriptions(r).find(s=>s.handler==='runtimeConsumer');assert.equal(p.binding.endpointEnv,consumer.binding.endpointEnv);assert.equal(eligible(p,consumer),false);assert.deepEqual(linkedRecipients('runtimeOrders'),[]);assert.ok(deliveries(graph).every(e=>e.to!==roles.receivers.runtimeConsumer));
});
test('routing, payload type and competing groups restrict possible recipients',async()=>{
 const r=recording(),p=await invoke('emitOrders',r),eligibleRows=namedSubscriptions(r).filter(s=>eligible(p,s));assert.deepEqual(eligibleRows.map(s=>s.options.group),['workers','workers','audit']);
 const rejected=namedSubscriptions(r).find(s=>s.handler==='rejectedOnly');assert.equal(eligible(p,rejected),false);assert.equal(eligible(p,{...rejected,options:{...rejected.options,route:'ready',type:'AnotherEnvelope'}}),false);
 assert.equal(eligible({...p,envelope:{...p.envelope,route:undefined}},{...rejected,options:{...rejected.options,route:undefined}}),false,'Missing routing data is not a wildcard or equality proof');
 for(const edge of deliveries(graph).filter(e=>e.from===roles.publications.emitOrders.nodeId&&['workerOne','workerTwo'].includes(receivingRole(e.to))))assert.match(edge.label,/competing member/);
 assert.ok(deliveries(graph).every(e=>e.to!==roles.receivers.rejectedOnly));
});
test('one producer retains conditional destinations and awaited local continuations',async()=>{
 const no=recording();await handlers.emit(no.clients.primary,no.cfg,{audit:false});assert.equal(no.publications.length,1);
 const yes=recording();await handlers.emit(yes.clients.primary,yes.cfg,{audit:true});assert.deepEqual(yes.publications.map(p=>p.envelope.destination),['orders.v1','receipts.v1']);
 const flow=graph.flows.find(f=>f.id===roles.flows.emit);assert.ok(flow.edges.some(e=>e.kind==='branch'&&e.to===roles.publications.emitAudit.nodeId&&e.label==='input.audit'));assert.match(deliveries(graph).find(e=>e.from===roles.publications.emitAudit.nodeId).label,/input.audit/);
 assert.ok(flow.edges.some(e=>e.from===roles.publications.emitOrders.nodeId&&e.kind==='next'&&e.mode==='sync'));assert.ok(flow.edges.some(e=>e.to===roles.publications.emitOrders.nodeId&&e.kind==='send'&&e.mode==='sync'));
});
test('registered callbacks form a conditional event chain and finite cyclic graph without copies',async()=>{
 const r=recording();await handlers.emit(r.clients.primary,r.cfg,{replay:true});
 const first=r.publications[0];await namedSubscriptions(r).find(s=>s.handler==='workerOne'&&eligible(first,s)).callback(first.envelope.payload);
 const second=r.publications[1];assert.equal(second.envelope.destination,'receipts.v1');await namedSubscriptions(r).find(s=>s.handler==='receipt'&&eligible(second,s)).callback(second.envelope.payload);
 assert.equal(r.publications[2].envelope.destination,'orders.v1');assert.deepEqual(linkedRecipients('forwardReceipt'),['receipt']);assert.deepEqual(linkedRecipients('cycleOrders'),['auditTap','workerOne','workerTwo']);
 const flowQueue=[roles.flows.workerOne],visited=new Set();while(flowQueue.length){const id=flowQueue.shift();if(visited.has(id))continue;visited.add(id);for(const e of deliveries(graph).filter(e=>graph.flows.find(f=>f.id===id).nodes.some(n=>n.id===e.from)))flowQueue.push(graph.flows.find(f=>f.nodes.some(n=>n.id===e.to)).id);}
 assert.ok(visited.has(roles.flows.receipt));assert.equal(allNodes(graph).length,allNodes(seed).length);assert.match(deliveries(graph).find(e=>e.from===roles.publications.cycleOrders.nodeId).label,/message.replay/);
 const no=recording();await handlers.receipt(no.clients.primary,no.cfg,{replay:false});assert.equal(no.publications.length,0);
});
test('misleading handler name and disabled subscription are not registered consumer entries',()=>{
 assert.equal(typeof handlers.OrdersReadyConsumer,'function');assert.equal(typeof handlers.disabled,'function');const active=recording();assert.equal(active.subscriptions.length,7);assert.ok(!graph.entryPoints.some(e=>['disabled','OrdersReadyConsumer'].includes(e.label)));assert.ok(!Object.keys(roles.receivers).includes('disabled'));
});
test('new cross-flow edges retain broker nodes, receiving identities and full relationship evidence',()=>{
 for(const {publication,consumer,edgeId}of roles.links){const p=roles.publications[publication],flow=graph.flows.find(f=>f.id===p.flowId),edge=flow.edges.find(e=>e.id===edgeId),boundary=flow.nodes.find(n=>n.id===edge.from);assert.equal(boundary.kind,'external');assert.equal(boundary.external.kind,'messaging');assert.equal(edge.kind,'receive');assert.equal(edge.mode,'async');assert.equal(edge.to,roles.receivers[consumer]);assert.equal(boundary.expandFlowId,undefined);requireEvidence(graph,edge,[publication,'boot','primary','destinations','register',consumer+'Subscription',consumer,'contract']);}
});
test('counterfactual routing and broker changes alter eligibility instead of copying old links',async()=>{
 const cfg=load('repository/config/routes.json');cfg.subscriptions.find(s=>s.handler==='workerTwo').route='rejected';cfg.subscriptions.find(s=>s.handler==='wrongBroker').broker='primary';const r=recording(cfg),p=await invoke('emitOrders',r);assert.deepEqual(possible(r,p),['auditTap','workerOne','wrongBroker']);assert.notDeepEqual(possible(r,p),linkedRecipients('emitOrders'));
});
test('structural validators reject broken endpoint/mode but evidence review catches plausible false links',async()=>{
 const invalid=structuredClone(graph),e=deliveries(invalid)[0];e.mode='sync';assert.ok(validateDocumentation(invalid,validationOptions('expected')).some(error=>error.message.includes('asynchronous')));
 e.mode='async';e.to='node_missingReceiver';assert.ok(validateDocumentation(invalid,validationOptions('expected')).some(error=>error.message.includes('Unknown node')));
 const weak=structuredClone(graph),w=deliveries(weak)[0];w.sourceIds=w.sourceIds.filter(id=>id!==roles.sources.register);assert.deepEqual(validateDocumentation(weak,validationOptions('expected')),[]);assert.throws(()=>requireEvidence(weak,w,['register']),/Missing link evidence register/);
 const falseLink=structuredClone(graph),bad=deliveries(falseLink)[0];bad.to=roles.receivers.wrongBroker;assert.deepEqual(validateDocumentation(falseLink,validationOptions('expected')),[]);const r=recording(),p=await invoke('emitOrders',r);assert.ok(!possible(r,p).includes(receivingRole(bad.to)),'Schema success does not establish actual broker matching');
});
test('existing Viewer projects async remote nodes without importing or expanding consumer graphs',()=>{
 const context=vm.createContext({});vm.runInContext(readFileSync(new URL('../viewer/graph-layout.js',import.meta.url),'utf8'),context);
 const api=context.pFlow;assert.ok(api);
 const flow=graph.flows.find(f=>f.id===roles.flows.emit);const projection=api.prepareDiagram(graph,flow.id);
 assert.ok(projection.nodes.some(n=>n.node.id===roles.receivers.workerOne));assert.ok(!projection.nodes.some(n=>n.node.id===roles.publications.forwardReceipt.nodeId));
 for(const f of graph.flows){const layout=api.layoutDiagram(api.prepareDiagram(graph,f.id));assert.ok(Number.isFinite(layout.bounds.width)&&layout.bounds.width>0);assert.ok(Number.isFinite(layout.bounds.height)&&layout.bounds.height>0);}
});
