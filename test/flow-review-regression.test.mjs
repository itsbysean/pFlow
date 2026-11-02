import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateArtifact } from '../validation/validate-artifact.mjs';
import { validateDocumentation } from '../validation/validate-documentation.mjs';
import { transaction, renew, providerFailure, captureDefaults, writeDefaults, decode, guestResponse, SessionValidationError } from './fixtures/flow-review/repository/operations.mjs';

// Controlled witnesses for source-review defects and a caller-summary draft risk. These
// checks are fixture-specific review oracles, not a source-analysis engine.
const base = fileURLToPath(new URL('./fixtures/flow-review/', import.meta.url));
const read = relative => readFileSync(path.join(base, relative), 'utf8');
const graph = JSON.parse(read('expected/graph.json'));
const roles = JSON.parse(read('expected/roles.json'));
const options = { sourceRoot: path.join(base, 'repository'), docsRoot: path.join(base, 'expected/docs') };
const nodes = g => g.flows.flatMap(f => f.nodes);
const edges = g => g.flows.flatMap(f => f.edges);
const edge = (g, role) => edges(g).find(e => e.id === roles.edges[role]);
const flow = (g, role) => g.flows.find(f => f.id === roles.flows[role]);
const structurallyValid = g => assert.deepEqual(validateArtifact(g, options), []);

function transactionOrder(g, matches) {
  const f = flow(g, 'transaction'), result = [];
  const actions = new Map(['begin', 'validate', 'switch', 'renewCall'].map(role => [roles.nodes[role], role === 'renewCall' ? 'renew' : role]));
  let current = f.startNodeId;
  for (let step = 0; step < f.nodes.length; step++) {
    if (actions.has(current)) result.push(actions.get(current));
    const next = f.edges.find(e => e.from === current && (e.kind !== 'branch' || e.label === (matches ? 'match' : 'mismatch')));
    if (!next) return result;
    current = next.to;
  }
  assert.fail('Controlled transaction path did not terminate');
}

function sectionClaim(markdown, role, label) {
  const section = markdown.split(`<a id="${roles.flows[role]}"></a>`)[1].split('<a id=')[0];
  return JSON.parse(section.split(label + ': `')[1].split('`')[0]);
}

function validateChangedMarkdown(t, markdown) {
  const copyRoot = mkdtempSync(path.join(tmpdir(), 'pflow-prose-review-'));
  t.after(() => rmSync(copyRoot, { recursive: true, force: true }));
  cpSync(base, copyRoot, { recursive: true });
  const docsRoot = path.join(copyRoot, 'expected/docs');
  writeFileSync(path.join(docsRoot, 'execution.md'), markdown);
  assert.deepEqual(validateDocumentation(graph, { sourceRoot: path.join(copyRoot, 'repository'), docsRoot }), []);
}

function requireDecodeWitnesses(g) {
  const n = nodes(g).find(n => n.id === roles.nodes.decode);
  for (const line of [1, 3, 40]) {
    assert.ok(n.sourceIds.some(id => g.sources.some(s => s.id === id && s.path === 'operations.mjs' && s.startLine <= line && s.endLine >= line)), `Missing decode import/binding/invocation witness at line ${line}`);
  }
}

test('portable source-review fixture passes the existing graph and Markdown contracts', () => {
  assert.deepEqual(validateDocumentation(graph, options), []);
});

test('correlation validation precedes account switching on both actual and documented paths', async () => {
  for (const matches of [true, false]) {
    const trace = [], ports = { async begin() {}, async switchAccount() {}, async renew() { return 'ok'; } };
    const run = transaction({ correlation: matches ? 'a' : 'b', expected: 'a' }, ports, trace);
    if (matches) assert.equal(await run, 'ok');
    else await assert.rejects(run, /correlation mismatch/);
    assert.deepEqual(transactionOrder(graph, matches), trace);
    const changed = structuredClone(graph);
    edge(changed, 'beforeValidation').to = roles.nodes.switch;
    edge(changed, 'afterSwitch').to = roles.nodes.validate;
    edge(changed, 'afterSwitch').kind = 'next';
    edge(changed, 'match').to = roles.nodes.renewCall;
    structurallyValid(changed);
    assert.notDeepEqual(transactionOrder(changed, matches), trace, 'Valid references must not hide a side effect moved before its guard');
  }
});

test('typed catch handles session errors and propagates the same unrelated error', async () => {
  const session = new SessionValidationError('expired'), unrelated = new Error('storage failed');
  async function check(g) {
    for (const error of [session, unrelated]) {
      const trace = [];
      let result, thrown;
      try { result = await renew({ async renew() { throw error; } }, trace); }
      catch (caught) { thrown = caught; }
      assert.deepEqual(trace, ['renew', 'classify']);
      const branch = edge(g, error instanceof SessionValidationError ? 'session' : 'other');
      if (thrown) {
        assert.equal(thrown, error, 'Propagation must preserve the original error');
        assert.equal(branch.to, roles.nodes.propagated, 'Unrelated errors must not enter the handled outcome');
      } else {
        assert.equal(result, 'authentication_required');
        assert.equal(branch.to, roles.nodes.handled);
      }
    }
    assert.equal(await renew({ async renew() { return 'ok'; } }, []), 'ok');
    assert.equal(edge(g, 'renewed').to, roles.nodes.renewed);
  }
  await check(graph);
  const changed = structuredClone(graph);
  edge(changed, 'other').to = roles.nodes.handled;
  flow(changed, 'renew').nodes = flow(changed, 'renew').nodes.filter(n => n.id !== roles.nodes.propagated);
  structurallyValid(changed);
  await assert.rejects(check(changed), /Unrelated errors must not enter the handled outcome/);
});

test('normal error-parser completion reaches the explicit throw by next, then propagates', async () => {
  const error = new Error('provider denied'), trace = [];
  await assert.rejects(providerFailure(async () => ({ error }), trace), caught => caught === error);
  assert.deepEqual(trace, ['parsed', 'throw']);
  function check(g) {
    assert.equal(edge(g, 'parsed').to, roles.nodes.throw);
    assert.equal(edge(g, 'parsed').kind, 'next', 'Successful parsing completes normally before the owned throw');
    assert.equal(edge(g, 'thrown').kind, 'exception');
    assert.equal(edge(g, 'thrown').from, roles.nodes.throw);
  }
  check(graph);
  const changed = structuredClone(graph); edge(changed, 'parsed').kind = 'exception';
  structurallyValid(changed);
  assert.throws(() => check(changed), /Successful parsing completes normally/);
});

test('each canonical default claim matches its own executed mapper, including absent fields', t => {
  const markdown = read('expected/docs/execution.md');
  const check = text => {
    assert.deepEqual(sectionClaim(text, 'capture', 'Defaults'), captureDefaults());
    assert.deepEqual(sectionClaim(text, 'write', 'Defaults'), writeDefaults());
  };
  check(markdown);
  assert.deepEqual(writeDefaults({ board: 'b', post: 8, subject: 's' }), { board: 'b', post: 8, subject: 's' });
  assert.deepEqual(captureDefaults({ board: 'b', post: 8, key: 'k' }), { board: 'b', post: 8, key: 'k' });
  const changed = markdown.replace('Defaults: `{"board":"","post":0,"subject":""}`', 'Defaults: `{"board":"","post":0,"subject":"","key":"CAPTURE"}`');
  validateChangedMarkdown(t, changed);
  assert.throws(() => check(changed), assert.AssertionError, 'A sibling-only field/default is a semantic prose defect');
});

test('library boundary needs import and selected static binding as well as invocation evidence', () => {
  assert.equal(decode('b2s=').toString('utf8'), 'ok');
  requireDecodeWitnesses(graph);
  const changed = structuredClone(graph), n = nodes(changed).find(n => n.id === roles.nodes.decode);
  n.sourceIds = n.sourceIds.filter(id => id !== roles.sources.binding);
  structurallyValid(changed);
  assert.throws(() => requireDecodeWitnesses(changed), /Missing decode import\/binding\/invocation witness/);
});

test('changed child predicate keeps the parent created/status summary correct for all identity cases', t => {
  const cases = { existingGuest: { providers: ['guest'] }, existingNonGuest: { providers: ['google'] }, missing: null };
  const actual = Object.fromEntries(Object.entries(cases).map(([name, existing]) => [name, guestResponse(existing)]));
  assert.deepEqual(actual, {
    existingGuest: { created: false, status: 200 },
    existingNonGuest: { created: true, status: 201 },
    missing: { created: true, status: 201 },
  });
  assert.equal(nodes(graph).find(n => n.id === roles.nodes.guestCall).expandFlowId, roles.flows.guestDetail);
  for (const result of Object.values(actual)) {
    const route = edge(graph, result.created ? 'statusCreated' : 'statusReused');
    assert.equal(route.to, result.status === 201 ? roles.nodes.createdStatus : roles.nodes.reusedStatus);
  }
  const markdown = read('expected/docs/execution.md');
  const check = text => assert.deepEqual(sectionClaim(text, 'guestParent', 'Results'), actual, 'Parent result/status claims must follow the child guest-provider predicate');
  check(markdown);
  // The child and graph remain correct; only the caller retains the old claim
  // that every existing identity is reused and receives status 200.
  const changed = markdown.replace('"existingNonGuest":{"created":true,"status":201}', '"existingNonGuest":{"created":false,"status":200}');
  validateChangedMarkdown(t, changed);
  assert.throws(() => check(changed), /Parent result\/status claims must follow/);
});
