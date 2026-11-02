import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { schema, repositoryRoot, validateArtifact, validateStructure } from './support/validate-artifact.mjs';

const samples = ['a-sync', 'b-async', 'c-custom'];
const load = name => JSON.parse(readFileSync(path.join(repositoryRoot, 'examples', name, 'architecture.json'), 'utf8'));
const options = name => ({ docsRoot: path.join(repositoryRoot, 'examples', name, 'docs') });
const check = (data, name = 'a-sync') => validateArtifact(data, options(name));
const reject = (data, phase, message, name = 'a-sync', at) => {
  const errors = check(data, name);
  assert.ok(errors.some(error => error.phase === phase && message.test(error.message)
    && (!at || error.path.startsWith(at))), JSON.stringify(errors, null, 2));
};
const node = (data, label) => data.flows.flatMap(flow => flow.nodes).find(item => item.label === label);

test('schema declares Draft 2020-12 and version 1.0.0', () => {
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.equal(schema.properties.modelVersion.const, '1.0.0');
});
for (const name of samples) {
  test(`${name}: structure, graph references, source fixtures, and Markdown links validate`, () => {
    assert.deepEqual(check(load(name), name), []);
  });
}

const required = [
  ['envelope', data => data, ['modelVersion', 'entryPoints', 'flows', 'sources']],
  ['entry', data => data.entryPoints[0], ['id', 'label', 'flowId', 'sourceIds']],
  ['flow', data => data.flows[0], ['id', 'label', 'startNodeId', 'nodes', 'edges']],
  ['node', data => data.flows[0].nodes[0], ['id', 'label', 'kind', 'sourceIds']],
  ['edge', data => data.flows[0].edges[0], ['id', 'from', 'to', 'kind', 'mode', 'sourceIds']],
  ['source', data => data.sources[0], ['id', 'path']],
  ['document', data => data.flows[0].docs[0], ['path']],
  ['external', data => node(data, 'Fetch state').external, ['kind']],
];
for (const [name, select, fields] of required) {
  for (const field of fields) test(`${name} requires ${field}`, () => {
    const data = load('a-sync'); delete select(data)[field];
    reject(data, 'schema', new RegExp(`required property '${field}'`));
  });
}

for (const [name, mutate, message] of [
  ['node enum', d => { d.flows[0].nodes[0].kind = 'controller'; }, /allowed values/],
  ['edge enum', d => { d.flows[0].edges[0].kind = 'await'; }, /allowed values/],
  ['mode enum', d => { d.flows[0].edges[0].mode = 'thread'; }, /allowed values/],
  ['external enum', d => { node(d, 'Fetch state').external.kind = 'spring'; }, /allowed values/],
  ['required type', d => { d.flows = {}; }, /array/],
  ['optional type', d => { d.revision = 42; }, /string/],
  ['empty nodes', d => { d.flows[0].nodes = []; }, /fewer than 1/],
  ['empty evidence', d => { d.flows[0].edges[0].sourceIds = []; }, /fewer than 1/],
  ['blank label', d => { d.flows[0].label = '  '; }, /pattern/],
  ['unknown field', d => { d.flows[0].framework = 'custom'; }, /additional properties/],
  ['wrong ID type prefix', d => { d.flows[0].id = 'node_abcdef'; }, /pattern/],
  ['missing branch label', d => { delete d.flows[2].edges.find(e => e.kind === 'branch').label; }, /required property 'label'/],
  ['external metadata on operation', d => { d.flows[0].nodes[0].external = { kind: 'library' }; }, /constant/],
  ['unnamespaced attribute', d => { node(d, 'Fetch state').external.attributes = { method: 'GET' }; }, /pattern/],
  ['nested external metadata', d => { node(d, 'Fetch state').external.attributes = { 'http.options': { retry: 2 } }; }, /match a schema/],
  ['unpaired source range', d => { delete d.sources[0].endLine; }, /endLine/],
  ['zero line number', d => { d.sources[0].startLine = 0; }, />= 1/],
  ['fractional line number', d => { d.sources[0].startLine = 1.5; }, /integer/],
  ['anchor includes hash', d => { d.flows[0].docs[0].anchor = '#command'; }, /pattern/],
]) test(`schema rejects ${name}`, () => {
  const data = load('a-sync'); mutate(data); reject(data, 'schema', message);
});

for (const version of ['draft', '0.9.0', '1.0.1', '2.0.0', 1]) {
  test(`schema rejects unsupported version ${version}`, () => {
    const data = load('a-sync'); data.modelVersion = version;
    reject(data, 'schema', /constant/, 'a-sync', '/modelVersion');
  });
}

for (const [name, mutate, message, at] of [
  ['missing source ID', d => { d.entryPoints[0].sourceIds = ['src_absent']; }, /Unknown source/, '/entryPoints/0/sourceIds'],
  ['missing entry flow', d => { d.entryPoints[0].flowId = 'flow_absent'; }, /Unknown flow/, '/entryPoints/0/flowId'],
  ['missing expansion flow', d => { d.flows[0].nodes[1].expandFlowId = 'flow_absent'; }, /Unknown expansion flow/, '/flows/0/nodes/1'],
  ['missing flow start', d => { d.flows[0].startNodeId = 'node_absent'; }, /local node/, '/flows/0/startNodeId'],
  ['nonlocal flow start', d => { d.flows[0].startNodeId = d.flows[1].startNodeId; }, /local node/, '/flows/0/startNodeId'],
  ['missing edge source', d => { d.flows[0].edges[0].from = 'node_absent'; }, /Unknown node/, '/flows/0/edges/0/from'],
  ['missing edge target', d => { d.flows[0].edges[0].to = 'node_absent'; }, /Unknown node/, '/flows/0/edges/0/to'],
  ['edge in wrong flow', d => { d.flows[0].edges[0].from = d.flows[1].startNodeId; }, /owned by its source flow/, '/flows/0/edges/0'],
  ['duplicate node ID', d => { d.flows[1].nodes[0].id = d.flows[0].nodes[0].id; }, /Duplicate ID/, '/flows/1/nodes/0'],
  ['duplicate flow ID', d => { d.flows[1].id = d.flows[0].id; }, /Duplicate ID/, '/flows/1'],
  ['duplicate edge ID', d => { d.flows[1].edges[0].id = d.flows[0].edges[0].id; }, /Duplicate ID/, '/flows/1/edges/0'],
  ['duplicate source ID', d => { d.sources[1].id = d.sources[0].id; }, /Duplicate ID/, '/sources/1'],
  ['duplicate entry ID', d => { d.entryPoints.push(structuredClone(d.entryPoints[0])); }, /Duplicate ID/, '/entryPoints/1'],
  ['reversed source range', d => { d.sources[0].startLine = 3; d.sources[0].endLine = 2; }, /starts after/, '/sources/0'],
  ['range past file end', d => { d.sources[0].endLine = 999; }, /exceeds/, '/sources/0'],
  ['missing source file', d => { d.sources[0].path = 'examples/missing.txt'; }, /missing or unreadable/, '/sources/0/path'],
  ['source traversal', d => { d.sources[0].path = '../outside.txt'; }, /inside its root/, '/sources/0/path'],
  ['absolute source', d => { d.sources[0].path = '/tmp/outside.txt'; }, /inside its root/, '/sources/0/path'],
  ['Windows drive source', d => { d.sources[0].path = 'C:/outside.txt'; }, /inside its root/, '/sources/0/path'],
  ['Windows separators', d => { d.sources[0].path = 'folder\\file.txt'; }, /inside its root/, '/sources/0/path'],
  ['missing Markdown', d => { d.flows[0].docs[0].path = 'missing.md'; }, /missing or unreadable/, '/flows/0/docs/0/path'],
  ['missing Markdown anchor', d => { d.flows[0].docs[0].anchor = 'absent'; }, /Missing document anchor/, '/flows/0/docs/0/anchor'],
  ['document traversal', d => { d.flows[0].docs[0].path = '../outside.md'; }, /inside its root/, '/flows/0/docs/0/path'],
  ['non-Markdown target', d => { d.flows[0].docs[0].path = 'file.json'; }, /reference Markdown/, '/flows/0/docs/0/path'],
  ['terminal continuation', d => { d.flows[0].edges[0].from = d.flows[0].nodes[2].id; }, /Terminal node/, '/flows/0/edges/0'],
  ['nonlocal next', d => { d.flows[0].edges[0].kind = 'next'; d.flows[0].edges[0].to = d.flows[1].startNodeId; }, /local continuation/, '/flows/0/edges/0'],
  ['duplicate branch label', d => { const b = d.flows[2].edges.filter(e => e.kind === 'branch'); b[1].label = b[0].label; }, /must be distinct/, '/flows/2/edges'],
  ['branch from operation', d => { d.flows[0].edges[0].kind = 'branch'; d.flows[0].edges[0].label = 'yes'; }, /originate at a decision/, '/flows/0/edges/0'],
  ['unreachable local node', d => { d.flows[0].edges.splice(1, 1); }, /unreachable/, '/flows/0/nodes/2'],
]) test(`semantic checks reject ${name}`, () => {
  const data = load('a-sync'); mutate(data);
  assert.equal(validateStructure(data), true, JSON.stringify(validateStructure.errors));
  reject(data, 'semantic', message, 'a-sync', at);
});

test('asynchronous receive requires evidence references and async mode', () => {
  const data = load('b-async');
  const delivery = data.flows[0].edges.find(edge => edge.kind === 'receive');
  const paths = delivery.sourceIds.map(id => data.sources.find(source => source.id === id).path);
  assert.deepEqual(paths.map(p => path.basename(p)).sort(), ['bindings.xml', 'publisher.js.txt', 'worker.js.txt']);
  delivery.mode = 'sync'; reject(data, 'semantic', /must be asynchronous/, 'b-async');
  delivery.mode = 'async'; delivery.sourceIds = [];
  reject(data, 'schema', /fewer than 1/, 'b-async');
});

test('custom activation evidence combines configuration, binding, registration, and dispatch', () => {
  const data = load('c-custom');
  const evidence = data.entryPoints[0].sourceIds.map(id => data.sources.find(source => source.id === id));
  assert.equal(evidence.length, 4);
  assert.ok(evidence.some(source => source.path.endsWith('tasks.xml') && !source.symbol));
  assert.ok(evidence.some(source => source.symbol === 'dispatch'));
});

test('reusable detail flows, recursive expansion, execution cycles, and unknown modes are valid', () => {
  const data = load('a-sync');
  const flow = data.flows[0];
  flow.nodes[0].expandFlowId = flow.nodes[1].expandFlowId; // Two sites, one body.
  data.flows[1].nodes[0].expandFlowId = data.flows[1].id; // Recursive navigation.
  flow.edges.push({ ...flow.edges[0], id: 'edge_ee781fa9', from: flow.nodes[1].id, to: flow.nodes[0].id, kind: 'next', mode: 'unknown' });
  assert.deepEqual(check(data), []);
});

test('unresolved dispatch and file-level evidence do not require invented targets or symbols', () => {
  const data = load('a-sync'); const flow = data.flows[0];
  flow.nodes = [{ ...flow.nodes[0], kind: 'unresolved', label: 'Runtime target unavailable' }];
  flow.edges = [];
  for (const source of data.sources) { delete source.symbol; delete source.startLine; delete source.endLine; }
  assert.deepEqual(check(data), []);
});

test('cross-flow entry can reach a node outside the target flow normal start path', () => {
  const data = load('b-async');
  const consumer = data.flows[1];
  const alternate = { ...consumer.nodes[0], id: 'node_82ee991a' };
  consumer.nodes.push(alternate);
  data.flows[0].edges.find(edge => edge.kind === 'receive').to = alternate.id;
  assert.deepEqual(check(data, 'b-async'), []);
});

test('all approved optional value forms validate without adding graph fields', () => {
  const data = load('a-sync'); data.revision = 'fixture-revision';
  const external = node(data, 'Fetch state').external;
  external.attributes = { 'http.codes': [200, 304], 'http.secure': true, 'http.timeout': null };
  data.flows[0].docs = [{ path: 'execution.md' }]; // Whole document link.
  delete node(data, 'Validate with input_rules').external; // Metadata is optional.
  assert.deepEqual(check(data), []);
});

test('documentation checks apply to entries, nodes, and edges as well as flows', () => {
  for (const select of [d => d.entryPoints[0], d => d.flows[0].nodes[0], d => d.flows[0].edges[0]]) {
    const data = load('a-sync'); select(data).docs = [{ path: 'execution.md', anchor: 'absent' }];
    reject(data, 'semantic', /Missing document anchor/);
  }
});

test('file resolution rejects symlinks outside the documentation bundle', () => {
  const temp = mkdtempSync(path.join(tmpdir(), 'pflow-contract-'));
  try {
    const docsRoot = path.join(temp, 'docs'); mkdirSync(docsRoot);
    const outside = path.join(temp, 'outside.md'); writeFileSync(outside, '<a id="command"></a>');
    symlinkSync(outside, path.join(docsRoot, 'execution.md'));
    const errors = validateArtifact(load('a-sync'), { docsRoot });
    assert.ok(errors.some(error => error.phase === 'semantic' && /escapes its root/.test(error.message)));
  } finally { rmSync(temp, { recursive: true, force: true }); }
});
