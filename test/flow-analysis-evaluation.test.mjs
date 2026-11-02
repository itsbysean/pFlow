import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { validateDocumentation } from '../validation/validate-documentation.mjs';
import { createEntry } from './fixtures/flow-analysis/repository/app/entry.mjs';
import { ProcessService } from './fixtures/flow-analysis/repository/domain/service.mjs';
import { MemoryRepository } from './fixtures/flow-analysis/repository/data/repository.mjs';
import { policyFor, standardPolicy, strictPolicy, unusedPolicy } from './fixtures/flow-analysis/repository/domain/policies.mjs';
import { InvalidRecord, StorageFault } from './fixtures/flow-analysis/repository/domain/errors.mjs';
import { recordSaved, records, reset } from './fixtures/flow-analysis/repository/domain/audit.mjs';
const base = fileURLToPath(new URL('./fixtures/flow-analysis/', import.meta.url));
const load = relative => JSON.parse(readFileSync(path.join(base, relative), 'utf8'));
const js = load('expected/javascript/analysis.json'), roles = load('expected/javascript/expectations.json');
const options = (name, repo) => ({ docsRoot: path.join(base, 'expected', name, 'docs'), sourceRoot: path.join(base, repo) });
// Fixture-specific witness checks supplement, rather than replace, semantic source review.
function requireCallWitnesses(graph, edge, required) {
  const supplied = edge.sourceIds.map(id => graph.sources.find(source => source.id === id));
  for (const witness of required) assert.ok(supplied.some(source => source.path === witness.path && source.startLine <= witness.startLine && source.endLine >= witness.endLine), `Missing call witness ${witness.path}:${witness.startLine}-${witness.endLine}`);
}
const context = vm.createContext({}); vm.runInContext(readFileSync(new URL('../viewer/flow-navigation.js', import.meta.url), 'utf8'), context);
for (const [name, repo] of [['javascript', 'repository'], ['python', 'python-repository']]) {
  test(`${name}: analysis preserves confirmed handoff identities and passes the existing M1 contract`, () => {
    const seed = load(`seeds/${name}/discovery.json`), graph = load(`expected/${name}/analysis.json`);
    assert.deepEqual(validateDocumentation(seed, { docsRoot: path.join(base, 'seeds', name, 'docs'), sourceRoot: path.join(base, repo) }), []);
    assert.deepEqual(validateDocumentation(graph, options(name, repo)), []);
    assert.deepEqual(graph.entryPoints, seed.entryPoints);
    for (const flow of seed.flows) {
      const retained = graph.flows.find(item => item.id === flow.id);
      assert.equal(retained.startNodeId, flow.startNodeId); assert.deepEqual(retained.nodes[0], flow.nodes[0]);
    }
    for (const source of seed.sources) assert.deepEqual(graph.sources.find(item => item.id === source.id), source);
    for (const flow of graph.flows) {
      const local = new Set(flow.nodes.map(node => node.id));
      for (const edge of flow.edges) { assert.ok(local.has(edge.from)); assert.ok(local.has(edge.to), 'Internal analysis must not splice another Flow into its caller'); }
    }
    assert.ok(graph.flows.flatMap(flow => flow.nodes).every(node => node.external === undefined));
  });
}

function application({ callback = recordSaved, plugins = {}, repository = new MemoryRepository(), selector = policyFor } = {}) {
  return createEntry(new ProcessService(repository, selector, callback, plugins));
}
test('actual cross-module entry/service/repository/callback order agrees with significant oracle calls', () => {
  reset(); const events = [], repository = new MemoryRepository();
  const run = application({ repository: { save(value) { events.push('save'); return repository.save(value); } }, selector(mode) { events.push('select'); const policy = policyFor(mode); return { transform(value) { events.push('transform'); return policy.transform(value); } }; }, callback(value) { events.push('notify'); recordSaved(value); } });
  assert.deepEqual(run({ authorized: true, mode: 'normal', value: ' value ' }), { status: 'ok', value: 'value' });
  assert.deepEqual(events, ['select', 'transform', 'save', 'notify']); assert.deepEqual(records(), ['value']);
  const root = js.flows.find(flow => flow.id === roles.flows.root), service = js.flows.find(flow => flow.id === roles.flows.service);
  assert.equal(root.nodes.find(node => node.id === roles.nodes.serviceCall).expandFlowId, service.id);
  assert.equal(service.nodes.find(node => node.id === roles.nodes.save).expandFlowId, roles.flows.repository);
  assert.equal(service.nodes.find(node => node.id === roles.nodes.notify).expandFlowId, roles.flows.callback);
  for (const id of ['invokeService', 'strictSave', 'normalSave', 'invokeCallback']) assert.equal(js.flows.flatMap(flow => flow.edges).find(edge => edge.id === roles.edges[id]).kind, 'call');
});

test('authorization early return prevents downstream selection/save/notification', () => {
  const events = [], run = application({ selector() { events.push('select'); return standardPolicy; }, callback() { events.push('notify'); } });
  assert.deepEqual(run({ authorized: false, value: 'broken' }), { status: 'denied' }); assert.deepEqual(events, []);
  const service = js.flows.find(flow => flow.id === roles.flows.service), denied = service.nodes.find(node => node.id === roles.nodes.denied);
  assert.equal(denied.kind, 'terminal'); assert.ok(!service.edges.some(edge => edge.from === denied.id));
});

test('factory selects only justified alternatives and strict rejection is explicitly guarded', () => {
  assert.equal(policyFor('strict'), strictPolicy); assert.equal(policyFor('anything-else'), standardPolicy);
  assert.ok(!['strict', 'normal', undefined].map(policyFor).includes(unusedPolicy));
  const run = application(); assert.deepEqual(run({ authorized: true, mode: 'strict', value: ' x ' }), { status: 'ok', value: 'X' });
  assert.throws(() => strictPolicy.transform('!'), InvalidRecord);
  const detail = js.flows.find(flow => flow.id === roles.flows.strict), guard = detail.nodes.find(node => node.id === roles.nodes.strictGuard);
  assert.equal(guard.kind, 'decision');
  const outcomes = detail.edges.filter(edge => edge.from === guard.id).map(edge => edge.to);
  assert.deepEqual(outcomes, [roles.nodes.strictFailure, roles.nodes.strictReturn]);
  assert.ok(detail.edges.every(edge => edge.sourceIds.includes(roles.sourceRoles.policyThrow)));
});

test('handled policy error and unhandled storage failure have different caller outcomes', () => {
  reset(); const run = application();
  assert.deepEqual(run({ authorized: true, mode: 'strict', value: '!' }), { status: 'invalid' });
  assert.throws(() => run({ authorized: true, mode: 'normal', value: 'broken' }), StorageFault);
  assert.deepEqual(records(), [], 'Failed writes/transforms must not notify');
  const root = js.flows.find(flow => flow.id === roles.flows.root);
  assert.equal(root.edges.find(edge => edge.id === roles.edges.catchError).kind, 'exception');
  assert.notEqual(roles.nodes.handled, roles.nodes.propagated);
  assert.ok(root.nodes.filter(node => [roles.nodes.handled, roles.nodes.propagated].includes(node.id)).every(node => node.kind === 'terminal'));
});

test('bound internal callback runs, whereas runtime plugin receiver remains unclaimed', () => {
  const called = [], run = application({ callback(value) { called.push(value); } });
  assert.deepEqual(run({ authorized: true, value: 'x' }), { status: 'ok', value: 'x' }); assert.deepEqual(called, ['x']);
  assert.throws(() => run({ authorized: true, value: 'x', plugin: 'site' }), TypeError);
  const graph = js.flows.find(flow => flow.id === roles.flows.service), unknown = graph.nodes.find(node => node.id === roles.nodes.unknown);
  assert.equal(unknown.kind, 'unresolved'); assert.equal(graph.edges.filter(edge => edge.from === unknown.id).length, 0);
  assert.equal(graph.edges.find(edge => edge.id === roles.edges.unknownDispatch).mode, 'unknown');
  // A test-supplied target is not evidence that the inspected launch supplies it.
  assert.equal(application({ plugins: { site: () => 'injected by test' } })({ authorized: true, value: 'x', plugin: 'site' }), 'injected by test');
});

test('changing the supplied policy factory changes actual target selection', () => {
  assert.equal(application({ selector: () => standardPolicy })({ authorized: true, value: '!', mode: 'strict' }).status, 'ok');
  assert.equal(application()({ authorized: true, value: '!', mode: 'strict' }).status, 'invalid');
});

test('hierarchical exploration and recursive detail remain finite with existing navigation rules', () => {
  const nav = context.pFlow.createFlowNavigation(js); nav.selectEntry(js.entryPoints[0].id); nav.openDetail(roles.nodes.serviceCall); nav.openDetail(roles.nodes.save);
  assert.equal(nav.getState().flowId, roles.flows.repository); nav.back(); nav.openDetail(roles.nodes.strict); assert.equal(nav.getState().flowId, roles.flows.strict);
  const graph = load('expected/python/analysis.json'), p = load('expected/python/expectations.json'), recursive = graph.flows.find(flow => flow.id === p.flows.recursive);
  const walk = context.pFlow.createFlowNavigation(graph); walk.selectEntry(graph.entryPoints[0].id); walk.openDetail(p.nodes.invoke);
  assert.equal(recursive.nodes.find(node => node.id === p.nodes.recursiveCall).expandFlowId, recursive.id);
  assert.throws(() => walk.openDetail(p.nodes.recursiveCall), /already in this path/);
  assert.equal(walk.getState().path.length, 2); assert.equal(graph.flows.length, 2);
});

test('fixture-specific evidence review rejects missing bindings even when validation still passes', () => {
  const graph = structuredClone(js), root = graph.flows.find(flow => flow.id === roles.flows.root), edge = root.edges.find(edge => edge.id === roles.edges.invokeService);
  const required = edge.sourceIds.map(id => graph.sources.find(source => source.id === id));
  requireCallWitnesses(graph, edge, required);
  edge.sourceIds = [roles.sourceRoles.callService];
  assert.deepEqual(validateDocumentation(graph, options('javascript', 'repository')), []);
  assert.throws(() => requireCallWitnesses(graph, edge, required), /Missing call witness/, 'A valid local edge alone does not establish its binding/target');
});
