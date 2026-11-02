import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { repositoryRoot, validateStructure } from './support/validate-artifact.mjs';

const runtime = vm.createContext({});
for (const file of ['graph-layout.js', 'diagram-viewport.js']) vm.runInContext(readFileSync(path.join(repositoryRoot, 'viewer', file), 'utf8'), runtime);
const { prepareDiagram, layoutDiagram, wrapLabel, fitDiagram, zoomDiagram } = runtime.pFlow;
const plain = value => JSON.parse(JSON.stringify(value));
const sample = name => JSON.parse(readFileSync(path.join(repositoryRoot, 'examples', name, 'architecture.json'), 'utf8'));
const node = (id, kind = 'operation', extra = {}) => ({ id: `node_${id}`, kind, label: `Execution ${id}`, sourceIds: ['src_evidence'], ...extra });
const edge = (from, to, kind = 'next', extra = {}) => ({ id: `edge_${from}_${to}`, from: `node_${from}`, to: `node_${to}`, kind, mode: 'sync', sourceIds: ['src_evidence'], ...extra });
function fixture(nodes, edges) {
  const data = { modelVersion: '1.0.0', entryPoints: [], sources: [{ id: 'src_evidence', path: 'synthetic-evidence.txt' }], flows: [{ id: 'flow_test', label: 'Synthetic execution', startNodeId: nodes[0].id, nodes, edges }] };
  assert.equal(validateStructure(data), true, JSON.stringify(validateStructure.errors));
  return data;
}
const layout = data => layoutDiagram(prepareDiagram(data));
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
function noNodeOverlap(result) {
  for (let i = 0; i < result.nodes.length; i++) for (let j = i + 1; j < result.nodes.length; j++) {
    const a = result.nodes[i], b = result.nodes[j];
    assert.equal(a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y, false);
  }
}

test('every M1 Flow lays out its own nodes, edges, and known nonlocal targets', () => {
  for (const name of ['a-sync', 'b-async', 'c-custom']) {
    const data = sample(name);
    for (const flow of data.flows) {
      const graph = prepareDiagram(data, flow.id), result = layoutDiagram(graph);
      assert.deepEqual(plain(result.nodes.filter(item => !item.remoteFlow).map(item => item.id).sort()), flow.nodes.map(item => item.id).sort());
      assert.deepEqual(plain(result.edges.map(item => item.edge.id).sort()), flow.edges.map(item => item.id).sort());
      noNodeOverlap(result);
      assert.deepEqual(plain(result), plain(layoutDiagram(prepareDiagram(data, flow.id))));
    }
  }
});

test('conditional outcomes occupy separate columns and converge below both branches', () => {
  const data = fixture([node('a', 'decision'), node('b'), node('c'), node('d'), node('e', 'terminal')], [edge('a', 'b', 'branch', { label: 'valid' }), edge('a', 'c', 'branch', { label: 'invalid' }), edge('b', 'd'), edge('c', 'd'), edge('d', 'e', 'return')]);
  const result = layout(data), nodes = new Map(result.nodes.map(item => [item.id, item]));
  assert.equal(nodes.get('node_b').y, nodes.get('node_c').y);
  assert.notEqual(nodes.get('node_b').x, nodes.get('node_c').x);
  assert.ok(nodes.get('node_d').y > nodes.get('node_b').y);
  assert.equal(result.edges.filter(item => item.edge.to === 'node_d').length, 2);
  for (const route of result.edges) {
    const from = nodes.get(route.edge.from), to = nodes.get(route.edge.to);
    const inset = (n, x) => n.node.kind === 'decision' ? Math.abs(x - n.x - n.width / 2) * n.height / n.width : 0;
    close(route.points[0][1], from.y + from.height - inset(from, route.points[0][0]));
    close(route.points.at(-1)[1], to.y + inset(to, route.points.at(-1)[0]));
    assert.ok(route.points.at(-1)[0] >= to.x && route.points.at(-1)[0] <= to.x + to.width);
  }
  noNodeOverlap(result);
});

test('layout is stable when node and edge array order changes', () => {
  const data = sample('a-sync');
  for (const flow of data.flows) {
    const before = plain(layoutDiagram(prepareDiagram(data, flow.id)));
    flow.nodes.reverse(); flow.edges.reverse();
    assert.deepEqual(plain(layoutDiagram(prepareDiagram(data, flow.id))), before);
  }
});

test('cycles and self-loops keep all relationships without recursive layout traversal', () => {
  const data = fixture([node('a'), node('b'), node('c')], [edge('a', 'b'), edge('b', 'c'), edge('c', 'a'), edge('b', 'b')]);
  const result = layout(data);
  assert.equal(result.edges.length, 4);
  assert.equal(result.edges.filter(item => item.backward).length, 2);
  assert.ok(result.edges.filter(item => item.backward).every(item => item.points.some(([x]) => x > result.nodes[0].width)));
  assert.ok(Object.values(result.bounds).every(Number.isFinite));
  noNodeOverlap(result);
});

test('long edges use outside lanes and do not cut through intermediate nodes', () => {
  const result = layout(fixture([node('a'), node('b'), node('c'), node('d')], [edge('a', 'b'), edge('b', 'c'), edge('c', 'd'), edge('a', 'd')]));
  const route = result.edges.find(item => item.edge.id === 'edge_a_d');
  assert.ok(route.points.some(([x]) => x < Math.min(...result.nodes.map(item => item.x))));
  for (let i = 1; i < route.points.length; i++) {
    const [ax, ay] = route.points[i - 1], [bx, by] = route.points[i];
    for (const n of result.nodes.filter(item => !['node_a', 'node_d'].includes(item.id))) {
      assert.equal(ax === bx ? ax > n.x && ax < n.x + n.width && Math.max(ay, by) > n.y && Math.min(ay, by) < n.y + n.height
        : ay > n.y && ay < n.y + n.height && Math.max(ax, bx) > n.x && Math.min(ax, bx) < n.x + n.width, false);
    }
  }
});

test('many outgoing branches have distinct nodes, labeled paths, and finite geometry', () => {
  const children = Array.from({ length: 7 }, (_, i) => node(`b${i}`, 'terminal'));
  const result = layout(fixture([node('a', 'decision'), ...children], children.map((child, i) => edge('a', `b${i}`, 'branch', { label: `Outcome ${i}` }))));
  assert.equal(new Set(result.nodes.filter(item => item.id !== 'node_a').map(item => item.x)).size, 7);
  assert.equal(new Set(result.edges.map(item => item.label)).size, 7);
  noNodeOverlap(result);
});

test('node categories distinguish boundaries, decisions, unresolved nodes, and exits', () => {
  const data = fixture([node('a'), node('b', 'decision'), node('c', 'external', { external: { kind: 'library' } }), node('d', 'external', { external: { kind: 'database' } }), node('e', 'unresolved'), node('f', 'terminal'), node('g', 'terminal')], [edge('a', 'b'), edge('b', 'c', 'branch', { label: 'continue' }), edge('c', 'd', 'call'), edge('d', 'e', 'call'), edge('d', 'f', 'return'), edge('d', 'g', 'exception')]);
  assert.deepEqual(plain(layout(data).nodes.map(item => item.category).sort()), ['condition', 'failure', 'internal', 'library', 'system', 'terminal', 'unresolved'].sort());
});

test('a terminal with a normal incoming path is not presented as exception-only', () => {
  const result = layout(fixture([node('a'), node('b', 'terminal')], [edge('a', 'b', 'return'), edge('a', 'b', 'exception', { id: 'edge_failure' })]));
  assert.equal(result.nodes.find(item => item.id === 'node_b').category, 'terminal');
});

test('cross-flow async projection uses the real target once without importing its Flow', () => {
  const data = sample('b-async'), producer = data.flows[0], consumer = data.flows[1];
  const graph = prepareDiagram(data, producer.id), delivery = producer.edges.find(item => item.kind === 'receive');
  assert.equal(graph.nodes.length, producer.nodes.length + 1);
  const stub = graph.nodes.find(item => item.node.id === delivery.to);
  assert.equal(stub.remoteFlow.id, consumer.id);
  assert.equal(stub.node.label, consumer.nodes[0].label);
  assert.equal(graph.edges.length, producer.edges.length);
  assert.ok(layoutDiagram(graph).edges.find(item => item.edge.id === delivery.id).fullLabel.endsWith('async'));
});

for (const [name, mutate, message] of [
  ['edge target', d => { d.flows[0].edges[0].to = 'node_absent'; }, /Unknown edge endpoint/],
  ['edge source', d => { d.flows[0].edges[0].from = 'node_absent'; }, /Unknown edge endpoint/],
  ['source reference', d => { d.flows[0].nodes[0].sourceIds = ['src_absent']; }, /Invalid source references/],
  ['duplicate identity', d => { d.flows[0].nodes[1].id = d.flows[0].nodes[0].id; }, /duplicate ID/],
  ['ownership', d => { d.flows[0].edges[0].from = d.flows[1].nodes[0].id; }, /not owned/],
  ['start', d => { d.flows[0].startNodeId = 'node_absent'; }, /Invalid start/],
  ['expansion reference', d => { d.flows[0].nodes[0].expandFlowId = 'flow_absent'; }, /Unknown detail Flow/],
  ['version', d => { d.modelVersion = '2.0.0'; }, /Unsupported/],
  ['edge kind', d => { d.flows[0].edges[0].kind = 'await'; }, /Invalid edge/],
]) test(`invalid ${name} fails before diagram geometry is produced`, () => {
  const data = sample('a-sync'); mutate(data); assert.throws(() => prepareDiagram(data), message);
});

test('empty architecture produces an empty diagram; unknown displayed Flows fail', () => {
  const data = { modelVersion: '1.0.0', entryPoints: [], flows: [], sources: [] };
  assert.equal(layout(data).nodes.length, 0);
  assert.equal(layout(data).edges.length, 0);
  assert.throws(() => prepareDiagram(sample('a-sync'), 'flow_absent'), /Unknown displayed Flow/);
});

test('fit contains all geometry, including negative routing lanes, inside the viewport padding', () => {
  const bounds = { x: -120, y: -30, width: 1000, height: 1400 };
  const view = fitDiagram(bounds, 800, 500);
  assert.ok(bounds.x * view.scale + view.x >= 24 - 1e-8);
  assert.ok(bounds.y * view.scale + view.y >= 24 - 1e-8);
  assert.ok((bounds.x + bounds.width) * view.scale + view.x <= 800 - 24 + 1e-8);
  assert.ok((bounds.y + bounds.height) * view.scale + view.y <= 500 - 24 + 1e-8);
  assert.equal(fitDiagram({ x: 0, y: 0, width: 10, height: 10 }, 800, 500).scale, 1);
  assert.throws(() => fitDiagram(bounds, 0, 500), /Invalid viewport/);
});

test('zoom retains the anchor world point, reverses cleanly, and clamps at its limits', () => {
  const view = { x: 23, y: -90, scale: .6 }, anchor = { x: 400, y: 250 };
  const zoomed = zoomDiagram(view, 1.25, anchor);
  close((anchor.x - zoomed.x) / zoomed.scale, (anchor.x - view.x) / view.scale);
  close((anchor.y - zoomed.y) / zoomed.scale, (anchor.y - view.y) / view.scale);
  const reversed = zoomDiagram(zoomed, .8, anchor);
  for (const key of ['x', 'y', 'scale']) close(reversed[key], view[key]);
  assert.equal(zoomDiagram(view, 100, anchor).scale, 3);
  assert.equal(zoomDiagram(view, .001, anchor).scale, .05);
  assert.throws(() => zoomDiagram(view, NaN, anchor), /Invalid zoom/);
});

test('long Unicode labels wrap within limits without losing the original graph value', () => {
  const label = '状態処理'.repeat(30);
  const wrapped = wrapLabel(label, 21, 2);
  assert.equal(wrapped.length, 2);
  assert.ok(wrapped.every(line => Array.from(line).length <= 21));
  assert.ok(wrapped[1].endsWith('…'));
});

test('a reasonable 300-node cyclic Flow finishes with finite, deterministic geometry', () => {
  const nodes = Array.from({ length: 300 }, (_, i) => node(`n${String(i).padStart(3, '0')}`));
  const edges = nodes.slice(1).map((n, i) => edge(nodes[i].id.slice(5), n.id.slice(5)));
  edges.push(edge('n299', 'n100'));
  const data = fixture(nodes, edges), result = layout(data);
  assert.equal(result.nodes.length, 300); assert.equal(result.edges.length, 300);
  assert.ok(Object.values(result.bounds).every(Number.isFinite));
  assert.deepEqual(plain(layout(data)), plain(result));
});
