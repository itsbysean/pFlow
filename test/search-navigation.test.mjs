import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const context = vm.createContext({});
for (const file of ['markdown.js', 'search-navigation.js', 'flow-navigation.js', 'sample-data.js']) vm.runInContext(readFileSync(new URL(`../viewer/${file}`, import.meta.url), 'utf8'), context);
const { resolveSearchAssociation: resolve, planSearchFlow: plan, createFlowNavigation: navigate } = context.pFlow;
const plain = value => JSON.parse(JSON.stringify(value));
const architecture = () => ({ entryPoints: [{ id: 'entry_a', flowId: 'flow_a' }, { id: 'entry_b', flowId: 'flow_b' }], flows: [
  { id: 'flow_a', nodes: [{ id: 'node_first', expandFlowId: 'flow_c' }, { id: 'node_second', expandFlowId: 'flow_c' }], edges: [] },
  { id: 'flow_b', nodes: [{ id: 'node_other', expandFlowId: 'flow_c' }], edges: [] },
  { id: 'flow_c', nodes: [{ id: 'node_cycle', expandFlowId: 'flow_a' }], edges: [] },
  { id: 'flow_orphan', nodes: [], edges: [] },
] });

test('canonical document path and ID backlink are required, independent of labels', () => {
  const graph = plain(context.pFlowSamples[0].architecture), flow = graph.flows[2], node = flow.nodes.find(item => item.docs?.length);
  const ref = { path: node.docs[0].path, anchor: node.id };
  assert.equal(resolve(graph, ref).association.entity.id, node.id);
  node.label = 'Completely renamed'; assert.equal(resolve(graph, ref).association.entity.id, node.id);
  assert.equal(resolve(graph, { ...ref, path: 'different.md' }).association, undefined);
  assert.match(resolve(graph, { ...ref, anchor: 'node_stale' }).notice, /no unique/);
  assert.equal(resolve(graph, { path: ref.path }).association, undefined);
  node.docs = [{ path: ref.path, anchor: flow.id }]; assert.match(resolve(graph, ref).notice, /backlink/);
});

test('all four canonical entity kinds resolve without choosing a start node implicitly', () => {
  const graph = architecture();
  graph.flows[0].edges.push({ id: 'edge_a', from: 'node_first', to: 'node_second' });
  for (const [type, entity, flowId] of [['entry', graph.entryPoints[0], 'flow_a'], ['flow', graph.flows[0], 'flow_a'], ['node', graph.flows[0].nodes[0], 'flow_a'], ['edge', graph.flows[0].edges[0], 'flow_a']]) {
    entity.docs = [{ path: 'execution.md', anchor: entity.id }];
    const found = resolve(graph, { path: 'execution.md', anchor: entity.id }).association;
    assert.equal(found.type, type); assert.equal(found.flowId, flowId);
  }
});

test('current context is retained; reusable flows prefer current entry then artifact node order', () => {
  const graph = architecture();
  assert.deepEqual(plain(plan(graph, 'flow_c', { flowId: 'flow_c', entryId: 'entry_b' })), { keep: true });
  assert.deepEqual(plain(plan(graph, 'flow_c', { entryId: 'entry_b' })), { entryId: 'entry_b', via: ['node_other'] });
  assert.deepEqual(plain(plan(graph, 'flow_c')), { entryId: 'entry_a', via: ['node_first'] });
  const nav = navigate(graph), selected = plan(graph, 'flow_c');
  nav.selectEntry(selected.entryId); selected.via.forEach(id => nav.openDetail(id));
  assert.deepEqual(plain(nav.getState().path), [{ flowId: 'flow_a' }, { flowId: 'flow_c', viaNodeId: 'node_first' }]);
});

test('breadth-first planning chooses shortest valid expansion path and terminates on cycles', () => {
  const graph = architecture();
  graph.flows[0].nodes.unshift({ id: 'node_long', expandFlowId: 'flow_b' });
  assert.deepEqual(plain(plan(graph, 'flow_c')), { entryId: 'entry_a', via: ['node_first'] });
  assert.deepEqual(plain(plan(graph, 'flow_orphan')), { direct: true, flowId: 'flow_orphan' });
  graph.flows[0].nodes.unshift({ id: 'node_missing', expandFlowId: 'flow_missing' });
  assert.equal(plan(graph, 'flow_orphan').direct, true);
  assert.throws(() => plan(graph, 'flow_missing'), /unavailable/);
});

test('async edges do not establish hierarchical paths and entry sections keep their own entry', () => {
  const graph = architecture(); graph.flows[0].edges.push({ from: 'node_first', to: 'node_cycle', mode: 'async' });
  graph.flows[0].nodes = []; graph.flows[1].nodes = [];
  assert.equal(plan(graph, 'flow_c').direct, true);
  assert.deepEqual(plain(plan(graph, 'flow_b', { flowId: 'flow_b', entryId: 'entry_a' }, 'entry_b')), { entryId: 'entry_b', via: [] });
});

test('duplicate entity IDs and removed owner Flows do not produce guessed associations', () => {
  const graph = architecture(), entity = graph.flows[0].nodes[0]; entity.docs = [{ path: 'execution.md', anchor: entity.id }];
  graph.flows[1].nodes.push({ ...entity });
  assert.equal(resolve(graph, { path: 'execution.md', anchor: entity.id }).association, undefined);
  const entry = graph.entryPoints[0]; entry.flowId = 'flow_removed'; entry.docs = [{ path: 'execution.md', anchor: entry.id }];
  assert.match(resolve(graph, { path: 'execution.md', anchor: entry.id }).notice, /no longer available/);
});
