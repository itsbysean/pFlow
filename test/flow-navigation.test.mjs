import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { repositoryRoot } from './support/validate-artifact.mjs';

const runtime = vm.createContext({});
vm.runInContext(readFileSync(path.join(repositoryRoot, 'viewer/flow-navigation.js'), 'utf8'), runtime);
const create = runtime.pFlow.createFlowNavigation;
const sample = name => JSON.parse(readFileSync(path.join(repositoryRoot, 'examples', name, 'architecture.json'), 'utf8'));
const plain = value => JSON.parse(JSON.stringify(value));
const caller = flow => flow.nodes.find(node => node.expandFlowId);

test('entry IDs resolve their root and data labels do not determine navigation', () => {
  const data = sample('a-sync'), nav = create(data);
  data.entryPoints[0].label = 'Custom callback boundary'; data.flows[0].label = '任意の実行';
  const state = nav.selectEntry(data.entryPoints[0].id);
  assert.equal(state.flowId, data.entryPoints[0].flowId);
  assert.equal(state.entryId, data.entryPoints[0].id);
  assert.equal(state.path.length, 1); assert.equal(state.canBack, false);
});

test('detail navigation stores call-site context and follows only explicit detail IDs', () => {
  const data = sample('a-sync'), nav = create(data);
  nav.selectEntry(data.entryPoints[0].id);
  nav.openDetail(caller(data.flows[0]).id);
  const state = nav.openDetail(caller(data.flows[1]).id);
  assert.deepEqual(plain(state.path), [
    { flowId: data.flows[0].id },
    { flowId: data.flows[1].id, viaNodeId: caller(data.flows[0]).id },
    { flowId: data.flows[2].id, viaNodeId: caller(data.flows[1]).id },
  ]);
});

test('Back, Forward, breadcrumbs, and Root retain the traversed descendant trail', () => {
  const data = sample('a-sync'), nav = create(data);
  nav.selectEntry(data.entryPoints[0].id);
  nav.openDetail(caller(data.flows[0]).id); nav.openDetail(caller(data.flows[1]).id);
  assert.equal(nav.back().flowId, data.flows[1].id);
  assert.equal(nav.forward().flowId, data.flows[2].id);
  assert.equal(nav.breadcrumb(0).flowId, data.flows[0].id);
  assert.equal(nav.getState().canBack, false); assert.equal(nav.getState().canForward, true);
  assert.equal(nav.forward().flowId, data.flows[1].id);
  assert.equal(nav.root().path.length, 1);
  assert.throws(() => nav.breadcrumb(2), /Unknown breadcrumb/);
});

test('reused detail Flow retains the node through which it was opened and discards the other branch', () => {
  const data = sample('a-sync');
  const first = caller(data.flows[0]);
  const second = { ...first, id: 'node_reuse', label: 'Another invocation' };
  data.flows[0].nodes.push(second);
  const before = JSON.stringify(data), nav = create(data);
  nav.selectEntry(data.entryPoints[0].id); nav.openDetail(first.id);
  const firstPath = nav.getState(); nav.back();
  const secondPath = nav.openDetail(second.id);
  assert.equal(firstPath.flowId, secondPath.flowId);
  assert.notEqual(firstPath.path[1].viaNodeId, secondPath.path[1].viaNodeId);
  assert.equal(secondPath.canForward, false);
  assert.equal(JSON.stringify(data), before, 'Navigation must not mutate or duplicate graph data');
});

test('switching entry points, including two roots that share a Flow, clears the trail', () => {
  const data = sample('a-sync');
  const second = { ...data.entryPoints[0], id: 'entry_another', label: 'Second trigger' };
  data.entryPoints.push(second);
  const nav = create(data); nav.selectEntry(data.entryPoints[0].id); nav.openDetail(caller(data.flows[0]).id);
  const state = nav.selectEntry(second.id);
  assert.equal(state.entryId, second.id); assert.equal(state.path.length, 1);
  assert.equal(state.canForward, false); assert.equal(state.canBack, false);
});

test('self-recursive and mutually recursive targets are blocked only in the active path', () => {
  const data = sample('a-sync'), rootNode = caller(data.flows[0]);
  rootNode.expandFlowId = data.flows[0].id;
  let nav = create(data); nav.selectEntry(data.entryPoints[0].id);
  const state = plain(nav.getState());
  assert.throws(() => nav.openDetail(rootNode.id), /already in this path/);
  assert.deepEqual(plain(nav.getState()), state);
  rootNode.expandFlowId = data.flows[1].id;
  caller(data.flows[1]).expandFlowId = data.flows[0].id;
  nav = create(data); nav.selectEntry(data.entryPoints[0].id); nav.openDetail(rootNode.id);
  assert.throws(() => nav.openDetail(caller(data.flows[1]).id), /already in this path/);
  nav.back();
  assert.equal(nav.openDetail(rootNode.id).flowId, data.flows[1].id, 'Forward-only references are not recursive ancestors');
});

test('missing detail references and non-owned nodes fail without changing the active path', () => {
  const data = sample('a-sync'), nav = create(data);
  nav.selectEntry(data.entryPoints[0].id);
  const state = plain(nav.getState());
  caller(data.flows[0]).expandFlowId = 'flow_absent';
  assert.throws(() => nav.openDetail(caller(data.flows[0]).id), /Unknown navigation Flow/);
  assert.throws(() => nav.openDetail(data.flows[1].nodes[0].id), /owned by the displayed Flow/);
  assert.throws(() => nav.openDetail(data.flows[0].nodes[0].id), /No detail Flow/);
  assert.deepEqual(plain(nav.getState()), state);
});

test('async destination nodes are not a hierarchical child of their producer', () => {
  const data = sample('b-async'), nav = create(data);
  nav.selectEntry(data.entryPoints[0].id);
  const target = data.flows[0].edges.find(edge => edge.kind === 'receive').to;
  assert.throws(() => nav.openDetail(target), /owned by the displayed Flow/);
  assert.equal(nav.getState().flowId, data.flows[0].id);
});

test('direct Flow browsing has no invented entry or caller and clears navigation history', () => {
  const data = sample('a-sync'), nav = create(data);
  nav.selectEntry(data.entryPoints[0].id); nav.openDetail(caller(data.flows[0]).id);
  const state = nav.selectFlow(data.flows[2].id);
  assert.equal(state.entryId, undefined); assert.deepEqual(plain(state.path), [{ flowId: data.flows[2].id }]);
  assert.equal(state.canBack, false); assert.equal(state.canForward, false);
});

test('state snapshots cannot corrupt the retained trail', () => {
  const data = sample('a-sync'), nav = create(data);
  nav.selectEntry(data.entryPoints[0].id);
  const snapshot = nav.getState(); snapshot.path[0].flowId = 'flow_changed'; snapshot.path.push({ flowId: 'flow_invented' });
  assert.equal(nav.getState().flowId, data.flows[0].id); assert.equal(nav.getState().path.length, 1);
});

test('empty navigation and unknown roots fail predictably', () => {
  const nav = create({ flows: [], entryPoints: [] });
  assert.equal(nav.getState().path.length, 0);
  assert.equal(nav.back().canBack, false); assert.equal(nav.forward().canForward, false);
  assert.throws(() => nav.selectFlow('flow_absent'), /Unknown navigation Flow/);
  assert.throws(() => nav.selectEntry('entry_absent'), /Unknown entry point/);
});
