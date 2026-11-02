import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateDocumentation } from '../validation/validate-documentation.mjs';
import { createRouter, installRoutes, status, AdminController_handleRequest } from './fixtures/discovery/repository/web/routes.mjs';
import { configureJobs, configureDispatcher } from './fixtures/discovery/repository/engine/runtime.mjs';
import { compactLedger, flushBuffer, onScheduledTask } from './fixtures/discovery/repository/engine/handlers.mjs';

const base = fileURLToPath(new URL('./fixtures/discovery/', import.meta.url));
const load = (name, file) => JSON.parse(readFileSync(path.join(base, 'expected', name, file), 'utf8'));
const js = load('javascript', 'discovery.json'), expected = load('javascript', 'expectations.json');
const xml = readFileSync(path.join(base, 'repository/config/tasks.xml'), 'utf8');
// These checks audit authored fixture oracles, not arbitrary repository discovery.
function requireWitnesses(architecture, entry, requiredSources) {
  const actual = entry.sourceIds.map(id => architecture.sources.find(source => source.id === id));
  for (const witness of requiredSources) assert.ok(actual.some(source => source.path === witness.path && source.startLine <= witness.startLine && source.endLine >= witness.endLine), `Missing activation/selection witness ${witness.path}:${witness.startLine}-${witness.endLine}`);
}
for (const [name, repo] of [['javascript', 'repository'], ['python', 'python-repository']]) {
  test(`${name}: discovery oracle obeys M1, canonical Markdown and evidence paths without full tracing`, () => {
    const architecture = load(name, 'discovery.json'), oracle = load(name, 'expectations.json');
    assert.deepEqual(validateDocumentation(architecture, { docsRoot: path.join(base, 'expected', name, 'docs'), sourceRoot: path.join(base, repo) }), []);
    assert.deepEqual(architecture.entryPoints.map(entry => entry.id), oracle.confirmed.map(item => item.entryId));
    for (const entry of architecture.entryPoints) {
      const flow = architecture.flows.find(flow => flow.id === entry.flowId), node = flow.nodes.find(node => node.id === flow.startNodeId);
      assert.equal(flow.nodes.length, 1); assert.equal(node.kind, 'operation'); assert.deepEqual(flow.edges, []); assert.equal(node.expandFlowId, undefined);
      const claim = oracle.confirmed.find(item => item.entryId === entry.id);
      requireWitnesses(architecture, entry, claim.sourceIds.map(id => architecture.sources.find(source => source.id === id)));
      assert.ok(node.sourceIds.some(id => architecture.sources.find(source => source.id === id).symbol === claim.handler), 'Root node must identify the actual receiving handler');
    }
    for (const rejected of oracle.rejected) assert.ok(architecture.entryPoints.every(entry => !entry.sourceIds.some(id => architecture.sources.find(source => source.id === id).symbol === rejected.symbol)), 'Excluded declarations must not become confirmed entries');
  });
}

test('HTTP oracle binds a real request selector to the actual handler, not an annotation/name', () => {
  const router = createRouter(); installRoutes(router);
  assert.equal(router.routes.get('GET /status'), status);
  let body; router.dispatch({ method: 'GET', url: '/status' }, { end(value) { body = value; } }); assert.equal(body, 'alive');
  assert.ok(![...router.routes.values()].includes(AdminController_handleRequest));
  const entry = js.entryPoints.find(entry => entry.id === expected.confirmed.find(item => item.name === 'http').entryId);
  const witnesses = entry.sourceIds.map(id => js.sources.find(source => source.id === id));
  assert.ok(witnesses.some(source => source.path === 'boot.mjs' && source.startLine <= 8 && source.endLine >= 8));
  assert.ok(witnesses.some(source => source.path === 'web/routes.mjs' && source.startLine <= 18 && source.endLine >= 18));
});

test('configuration-driven task uses the loaded record, registry binding and concrete receiver', () => {
  const task = configureJobs(xml, {}).find(task => task.name === 'ledger-compaction');
  assert.equal(task.everyMs, 60000); assert.equal(task.resolve(), compactLedger);
  const log = []; task.invoke(log); assert.deepEqual(log, ['ledger compacted']);
  const entry = js.entryPoints.find(entry => entry.id === expected.confirmed.find(item => item.name === 'scheduled').entryId);
  assert.ok(entry.sourceIds.some(id => js.sources.find(source => source.id === id).path === 'config/tasks.xml'));
  assert.ok(!configureJobs(xml, {}).some(task => task.resolve() === onScheduledTask));
});

test('custom stdin token selects the installed function through the project registry', () => {
  const dispatcher = configureDispatcher(); assert.equal(dispatcher.verbs.get('drain/9'), flushBuffer);
  const log = []; dispatcher.dispatch('drain/9', log); assert.deepEqual(log, ['buffer flushed']);
  assert.throws(() => dispatcher.dispatch('flushBuffer', []), /Unknown activation token/, 'Function name alone is not the activation token');
});

test('runtime-selected task has no confirmed receiver without environment binding', () => {
  const task = configureJobs(xml, {}).find(task => task.name === 'runtime-site-task');
  assert.equal(task.resolve(), undefined); assert.throws(() => task.invoke([]), /no resolved handler/);
  // A value supplied by a test is not evidence that a deployment supplies that value.
  assert.equal(configureJobs(xml, { TASK_TARGET: 'fold-v2' }).find(task => task.name === 'runtime-site-task').resolve(), compactLedger);
  const unresolved = expected.unresolved.find(item => item.name === 'runtime-site-task');
  assert.ok(unresolved.sourceIds.length >= 2);
  assert.ok(js.entryPoints.every(entry => !entry.sourceIds.includes(unresolved.sourceIds[0])));
});

test('fixture counterexamples invalidate prior activation claims when registrations change', () => {
  const router = createRouter(); installRoutes(router); router.routes.delete('GET /status');
  assert.notEqual(router.routes.get('GET /status'), status);
  const response = { statusCode: 200, end() {} }; router.dispatch({ method: 'GET', url: '/status' }, response); assert.equal(response.statusCode, 404);
  router.routes.set('GET /status', AdminController_handleRequest);
  assert.equal(router.routes.get('GET /status'), AdminController_handleRequest, 'An excluded-looking name becomes valid when actually bound');
  assert.notEqual(router.routes.get('GET /status'), status);
  const missing = configureJobs(xml.replace('handler="fold-v2"', 'handler="site-handler"'), {}).find(task => task.name === 'ledger-compaction');
  assert.equal(missing.resolve(), undefined); assert.throws(() => missing.invoke([]), /no resolved handler/);
});

test('evidence checks reject a handler-only oracle even when the graph remains structurally valid', () => {
  const architecture = structuredClone(js), claim = expected.confirmed.find(item => item.name === 'http');
  const entry = architecture.entryPoints.find(entry => entry.id === claim.entryId);
  const needed = entry.sourceIds.map(id => architecture.sources.find(source => source.id === id));
  entry.sourceIds = entry.sourceIds.filter(id => architecture.sources.find(source => source.id === id).symbol === 'status');
  assert.deepEqual(validateDocumentation(architecture, { docsRoot: path.join(base, 'expected/javascript/docs'), sourceRoot: path.join(base, 'repository') }), [], 'Reference conformance does not prove activation semantics');
  assert.throws(() => requireWitnesses(architecture, entry, needed), /Missing activation\/selection witness/);
});
