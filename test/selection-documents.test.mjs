import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { repositoryRoot } from './support/validate-artifact.mjs';

const runtime = vm.createContext({});
for (const file of ['details-inspector.js', 'markdown.js']) vm.runInContext(readFileSync(path.join(repositoryRoot, 'viewer', file), 'utf8'), runtime);
const { resolveSelection, sourceLocation, evidenceIds, resolveDocumentTarget } = runtime.pFlow;
const sample = name => JSON.parse(readFileSync(path.join(repositoryRoot, 'examples', name, 'architecture.json'), 'utf8'));
const plain = value => JSON.parse(JSON.stringify(value));

test('node inspection resolves canonical objects and only recorded relationships', () => {
  const data = sample('a-sync'), flow = data.flows[2], node = flow.nodes.find(item => item.kind === 'decision');
  const before = JSON.stringify(data), detail = resolveSelection(data, flow.id, { type: 'node', id: node.id });
  assert.equal(detail.entity, node); assert.equal(detail.ownerFlow, flow);
  assert.ok(detail.related.every(edge => edge.from === node.id || edge.to === node.id));
  assert.equal(detail.related.filter(edge => edge.kind === 'branch').length, 2);
  assert.equal(JSON.stringify(data), before);
});

test('edge inspection preserves endpoints, async mode, boundary metadata, and its own evidence', () => {
  const data = sample('b-async'), flow = data.flows[0], edge = flow.edges.find(item => item.kind === 'receive');
  const detail = resolveSelection(data, flow.id, { type: 'edge', id: edge.id });
  assert.equal(detail.entity, edge); assert.equal(detail.from.id, edge.from); assert.equal(detail.to.id, edge.to);
  assert.equal(detail.entity.mode, 'async'); assert.equal(detail.boundaries[0].external.attributes['messaging.channel'], 'jobs');
  assert.deepEqual(plain(evidenceIds(detail.entity)), edge.sourceIds);
});

test('verified boundary stubs can be inspected without changing their owner', () => {
  const data = sample('b-async'), flow = data.flows[0], edge = flow.edges.find(item => item.kind === 'receive');
  const detail = resolveSelection(data, flow.id, { type: 'node', id: edge.to });
  assert.equal(detail.remote, true); assert.equal(detail.ownerFlow, data.flows[1]);
  assert.equal(detail.entity, data.flows[1].nodes[0]); assert.ok(detail.related.includes(edge));
});

test('hidden nodes, foreign edges, stale IDs, and unsupported selection types cannot be inspected', () => {
  const data = sample('a-sync'), root = data.flows[0];
  assert.equal(resolveSelection(data, root.id, { type: 'node', id: data.flows[2].nodes[0].id }), undefined);
  assert.equal(resolveSelection(data, root.id, { type: 'edge', id: data.flows[2].edges[0].id }), undefined);
  assert.equal(resolveSelection(data, root.id, { type: 'node', id: 'node_absent' }), undefined);
  assert.equal(resolveSelection(data, root.id, { type: 'flow', id: root.id }), undefined);
});

test('source locations preserve symbols, inclusive ranges, and file-level evidence', () => {
  assert.equal(sourceLocation({ path: 'config/tasks.xml' }), 'config/tasks.xml');
  assert.equal(sourceLocation({ path: 'src/action.ext', startLine: 4, endLine: 4 }), 'src/action.ext:4');
  assert.equal(sourceLocation({ path: 'src/action.ext', startLine: 4, endLine: 8, symbol: 'custom.dispatch' }), 'src/action.ext:4–8 · custom.dispatch');
  const flow = sample('a-sync').flows[0];
  assert.equal(evidenceIds(flow).length, new Set([...flow.nodes, ...flow.edges].flatMap(item => item.sourceIds)).size);
});

test('document paths resolve from their Markdown file and literal IDs retain exact case', () => {
  assert.deepEqual(plain(resolveDocumentTarget('nested/detail.md', '../execution.md#node_Ab12')), { path: 'execution.md', anchor: 'node_Ab12' });
  assert.deepEqual(plain(resolveDocumentTarget('nested/detail.md', '#flow_a12')), { path: 'nested/detail.md', anchor: 'flow_a12' });
  assert.deepEqual(plain(resolveDocumentTarget('', 'index.md')), { path: 'index.md' });
});

for (const target of ['../outside.md', '/absolute.md', 'https://example.test/doc.md', 'javascript:alert(1)', 'doc.md#generated-title', 'doc.md#node_a#node_b', 'doc%20name.md', 'folder\\doc.md']) {
  test(`unsupported document target is rejected: ${target}`, () => assert.throws(() => resolveDocumentTarget('', target)));
}
