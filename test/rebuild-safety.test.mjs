import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, statSync, unlinkSync, linkSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';
import { inspectArchitectureSet, rebuildArchitectureSet } from '../skills/pflow-rebuild/scripts/rebuild.mjs';
import { prepareBuild } from '../builder/pipeline.mjs';
const project = fileURLToPath(new URL('../', import.meta.url));
function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), 'pflow-rebuild-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  cpSync(path.join(project, 'test/fixtures/impact/repository'), root, { recursive: true });
  const input = path.join(root, 'architecture'); mkdirSync(input);
  const base = path.join(project, 'test/fixtures/regeneration/baseline');
  cpSync(path.join(base, 'docs'), path.join(input, 'docs'), { recursive: true });
  cpSync(path.join(base, 'graph.json'), path.join(input, 'architecture.json'));
  const output = path.join(input, 'architecture.html'), viewerRoot = path.join(root, 'viewer');
  cpSync(path.join(project, 'viewer'), viewerRoot, { recursive: true });
  writeFileSync(output, 'previous HTML\n');
  const options = { input, output, repositoryRoot: root, viewerRoot };
  return { root, input, output, viewerRoot, options, async review() { const inspection = await inspectArchitectureSet(options); return { digest: inspection.digest, outcome: 'pass', findings: [] }; } };
}
const phase = expected => error => error.diagnostics?.some(item => item.phase === expected);
const oldHTML = f => assert.equal(readFileSync(f.output, 'utf8'), 'previous HTML\n');
test('whole-set rebuild embeds every envelope, permits scoped IDs, and is byte/inode/time idempotent', async t => {
  const f = fixture(t), second = path.join(f.input, 'nested'); mkdirSync(second);
  cpSync(path.join(f.input, 'docs'), path.join(second, 'docs'), { recursive: true });
  // Evidence definitions use paths relative to each sibling docs root.
  for (const name of readdirSync(path.join(second, 'docs/flows'))) {
    const file = path.join(second, 'docs/flows', name);
    writeFileSync(file, readFileSync(file, 'utf8').replaceAll('../../../', '../../../../'));
  }
  cpSync(path.join(f.input, 'architecture.json'), path.join(second, 'architecture.json'));
  writeFileSync(path.join(f.input, 'manual.md'), '[broken](does-not-exist.md)');
  const review = await f.review();
  chmodSync(f.output, 0o640);
  const result = await rebuildArchitectureSet({ ...f.options, indexReview: review });
  assert.equal(result.unchanged, false);
  assert.equal(statSync(f.output).mode & 0o777, 0o640);
  const html = readFileSync(f.output), before = statSync(f.output, { bigint: true });
  const document = parseHTML(html.toString()).document;
  assert.equal(JSON.parse(document.getElementById('pflow-data').textContent).length, 2);
  assert.equal(document.querySelectorAll('script[src],link').length, 0);
  assert.equal((await rebuildArchitectureSet({ ...f.options, indexReview: review })).unchanged, true);
  assert.deepEqual(readFileSync(f.output), html);
  const after = statSync(f.output, { bigint: true });
  assert.equal(after.ino, before.ino); assert.equal(after.mtimeNs, before.mtimeNs);
});
test('a malformed untouched envelope blocks the whole set without replacing HTML', async t => {
  const f = fixture(t), dir = path.join(f.input, 'untouched'); mkdirSync(dir);
  writeFileSync(path.join(dir, 'architecture.json'), '{broken');
  await assert.rejects(rebuildArchitectureSet(f.options), phase('load')); oldHTML(f);
});
test('missing, stale, rejected, and explicit stale-entry review findings block publication', async t => {
  const f = fixture(t);
  await assert.rejects(rebuildArchitectureSet(f.options), phase('review'));
  const stale = await f.review();
  const json = path.join(f.input, 'architecture.json'), graph = JSON.parse(readFileSync(json));
  const retired = graph.entryPoints.find(entry => entry.label === 'beta');
  assert.ok(retired);
  graph.entryPoints = graph.entryPoints.filter(entry => entry.id !== retired.id);
  writeFileSync(json, JSON.stringify(graph));
  assert.ok(graph.flows.some(flow => flow.id === retired.flowId));
  assert.match(readFileSync(path.join(f.input, 'docs/index.md'), 'utf8'), /\[beta\]\(flows\/beta\.md#/);
  // M1 structural validation cannot associate plaintext names with Entry IDs.
  assert.ok(prepareBuild(f.options));
  await assert.rejects(rebuildArchitectureSet({ ...f.options, indexReview: stale }), phase('review'));
  const reviewed = await f.review();
  const finding = { artifact: 'architecture.json', path: 'docs/index.md', entityId: retired.id, message: 'The index still names the removed beta entry.', suggestion: 'Remove the obsolete beta entry line while keeping the surviving Flow link.' };
  await assert.rejects(rebuildArchitectureSet({ ...f.options, indexReview: { ...reviewed, outcome: 'fail', findings: [finding] } }), error => error.diagnostics.some(item => item.entityId === finding.entityId && item.suggestion === finding.suggestion));
  oldHTML(f);
});
test('a real missing Viewer asset and invalid Markdown preserve the previous HTML', async t => {
  const f = fixture(t), review = await f.review();
  unlinkSync(path.join(f.viewerRoot, 'viewer.css'));
  await assert.rejects(rebuildArchitectureSet({ ...f.options, indexReview: review })); oldHTML(f);
  cpSync(path.join(project, 'viewer/viewer.css'), path.join(f.viewerRoot, 'viewer.css'));
  writeFileSync(path.join(f.input, 'docs/index.md'), '# Broken\n\n[missing](missing.md)\n');
  await assert.rejects(rebuildArchitectureSet({ ...f.options, indexReview: review })); oldHTML(f);
});
test('real M4 packaging rejection preserves prior HTML and documents and removes its stage', async t => {
  const f = fixture(t), css = path.join(f.viewerRoot, 'viewer.css');
  const json = readFileSync(path.join(f.input, 'architecture.json'));
  const index = readFileSync(path.join(f.input, 'docs/index.md'));
  writeFileSync(css, readFileSync(css, 'utf8') + '\n@import url("https://example.invalid/unsupported.css");\n');
  const indexReview = await f.review();
  await assert.rejects(rebuildArchitectureSet({ ...f.options, indexReview }), phase('packaging'));
  oldHTML(f);
  assert.deepEqual(readFileSync(path.join(f.input, 'architecture.json')), json);
  assert.deepEqual(readFileSync(path.join(f.input, 'docs/index.md')), index);
  assert.equal(readdirSync(f.input).some(name => name.startsWith('.pflow-rebuild-') || name.startsWith('.pflow-')), false);
});
for (const change of ['source', 'asset', 'inventory', 'staged', 'output']) test(`concurrent ${change} change blocks publication`, async t => {
  const f = fixture(t), indexReview = await f.review();
  await assert.rejects(rebuildArchitectureSet({ ...f.options, indexReview, beforeCommit({ temporary }) {
    if (change === 'source') writeFileSync(path.join(f.root, 'shared.mjs'), readFileSync(path.join(f.root, 'shared.mjs'), 'utf8') + '\n// concurrent edit\n');
    if (change === 'asset') writeFileSync(path.join(f.viewerRoot, 'viewer.css'), readFileSync(path.join(f.viewerRoot, 'viewer.css'), 'utf8') + '\n/* edit */\n');
    if (change === 'inventory') { const dir = path.join(f.input, 'new'); mkdirSync(dir); writeFileSync(path.join(dir, 'architecture.json'), '{}'); }
    if (change === 'staged') writeFileSync(temporary, 'modified staged bytes');
    if (change === 'output') writeFileSync(f.output, 'concurrent output');
  } }));
  if (change === 'output') assert.equal(readFileSync(f.output, 'utf8'), 'concurrent output'); else oldHTML(f);
  assert.equal(readdirSync(f.input).some(name => name.startsWith('.pflow-rebuild-')), false);
});
test('failed atomic rename preserves prior bytes and cleans only its owned stage', async t => {
  const f = fixture(t), indexReview = await f.review(), note = path.join(f.input, '.pflow-rebuild-user.html'); writeFileSync(note, 'keep');
  await assert.rejects(rebuildArchitectureSet({ ...f.options, indexReview, rename: async () => { throw new Error('controlled rename failure'); } }), phase('output'));
  oldHTML(f); assert.equal(readFileSync(note, 'utf8'), 'keep');
  assert.deepEqual(readdirSync(f.input).filter(name => name.startsWith('.pflow-rebuild-')), ['.pflow-rebuild-user.html']);
});
test('final output cannot hardlink a protected Viewer asset', async t => {
  const f = fixture(t); unlinkSync(f.output); linkSync(path.join(f.viewerRoot, 'viewer.css'), f.output);
  await assert.rejects(inspectArchitectureSet(f.options), phase('output'));
  assert.deepEqual(readFileSync(f.output), readFileSync(path.join(f.viewerRoot, 'viewer.css')));
});
test('fingerprints cover unused file-level source evidence but ignore unrelated repository files', async t => {
  const f = fixture(t), json = path.join(f.input, 'architecture.json'), graph = JSON.parse(readFileSync(json));
  writeFileSync(path.join(f.root, 'unused-evidence.txt'), 'file-level evidence');
  graph.sources.push({ id: 'src_unusedEvidence', path: 'unused-evidence.txt' });
  writeFileSync(json, JSON.stringify(graph));
  const before = await inspectArchitectureSet(f.options);
  writeFileSync(path.join(f.root, 'manual-unrelated.md'), '[broken](nowhere.md)');
  assert.equal((await inspectArchitectureSet(f.options)).digest, before.digest);
  writeFileSync(path.join(f.root, 'unused-evidence.txt'), 'changed file-level evidence');
  assert.notEqual((await inspectArchitectureSet(f.options)).digest, before.digest);
});
