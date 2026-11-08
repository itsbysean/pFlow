import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { mergeDocument, fingerprintBundle, applyBundle } from '../src/skills/pflow-regenerate/scripts/safe-update.mjs';

const baseline = '# Generated\n\nOld description\n\n## Details\n\nStable text\n\n## Notes\n\nGenerated note\n';

test('document merge preserves disjoint manual notes', async () => {
  const current = baseline.replace('Generated note', 'Manual note: retain this');
  const candidate = baseline.replace('Old description', 'New description');
  assert.equal(await mergeDocument({ baseline, current, candidate }), candidate.replace('Generated note', 'Manual note: retain this'));
});

test('document conflicts and edited deletions fail without changing inputs', async () => {
  const current = baseline.replace('Old description', 'Manual description');
  await assert.rejects(mergeDocument({ baseline, current, candidate: baseline.replace('Old description', 'New description') }), /conflicting/);
  await assert.rejects(mergeDocument({ baseline, current, candidate: null }), /manual edits/);
  assert.equal(current, baseline.replace('Old description', 'Manual description'));
  assert.equal(await mergeDocument({ baseline, current: baseline, candidate: null }), null);
});

test('manual deletion and unknown existing documents are protected', async () => {
  assert.equal(await mergeDocument({ baseline, current: undefined, candidate: baseline }), undefined);
  await assert.rejects(mergeDocument({ baseline, current: undefined, candidate: 'Changed' }), /manually deleted/);
  await assert.rejects(mergeDocument({ current: 'Existing manual text', candidate: 'New text' }), /trusted baseline/);
  await assert.rejects(mergeDocument({ current: 'Same', candidate: 'Same' }), /trusted baseline/);
  assert.equal(await mergeDocument({ candidate: 'New file' }), 'New file');
});

test('unchanged and omitted candidates retain exact current bytes', async () => {
  const current = '\ufeffManual\r\nnotes\r\nwithout final newline';
  assert.equal(await mergeDocument({ baseline, current, candidate: baseline }), current);
  assert.equal(await mergeDocument({ baseline, current }), current);
});

async function fixture(t) {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'pflow-safe-test-')));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const bundleRoot = path.join(root, 'bundle');
  const stagedRoot = path.join(root, 'staged');
  await fs.mkdir(bundleRoot);
  await fs.mkdir(path.join(bundleRoot, 'docs'));
  await fs.writeFile(path.join(bundleRoot, 'docs', 'overview.md'), 'Original generated text\n');
  await fs.writeFile(path.join(bundleRoot, 'index.html'), Buffer.from([0, 13, 10, 255]));
  await fs.writeFile(path.join(bundleRoot, 'manual.md'), 'Keep my manual notes\r\n');
  await fs.chmod(path.join(bundleRoot, 'manual.md'), 0o640);
  await fs.cp(bundleRoot, stagedRoot, { recursive: true, preserveTimestamps: true });
  await fs.writeFile(path.join(stagedRoot, 'docs', 'overview.md'), 'Updated generated text\n');
  return { root, bundleRoot, stagedRoot, expectedFingerprint: await fingerprintBundle(bundleRoot), expectedStageFingerprint: await fingerprintBundle(stagedRoot) };
}

test('fingerprint is deterministic and detects bytes, modes, and empty directories', async t => {
  const item = await fixture(t);
  assert.equal(await fingerprintBundle(item.bundleRoot), item.expectedFingerprint);
  await fs.chmod(path.join(item.bundleRoot, 'manual.md'), 0o600);
  assert.notEqual(await fingerprintBundle(item.bundleRoot), item.expectedFingerprint);
  await fs.chmod(path.join(item.bundleRoot, 'manual.md'), 0o640);
  assert.equal(await fingerprintBundle(item.bundleRoot), item.expectedFingerprint);
  await fs.mkdir(path.join(item.bundleRoot, 'empty'));
  assert.notEqual(await fingerprintBundle(item.bundleRoot), item.expectedFingerprint);
});

test('transaction retains HTML, manual files, and source Git bytes', async t => {
  const item = await fixture(t);
  const source = path.join(item.root, 'source');
  await fs.mkdir(source);
  execFileSync('git', ['init', '--quiet', source]);
  await fs.writeFile(path.join(source, 'source.txt'), 'Untouched source\n');
  const sourceBefore = await fingerprintBundle(source);
  const html = await fs.readFile(path.join(item.bundleRoot, 'index.html'));
  const manual = await fs.readFile(path.join(item.bundleRoot, 'manual.md'));
  assert.deepEqual(await applyBundle(item), { fingerprint: item.expectedStageFingerprint });
  assert.equal(await fingerprintBundle(item.bundleRoot), item.expectedStageFingerprint);
  assert.deepEqual(await fs.readFile(path.join(item.bundleRoot, 'index.html')), html);
  assert.deepEqual(await fs.readFile(path.join(item.bundleRoot, 'manual.md')), manual);
  assert.equal((await fs.stat(path.join(item.bundleRoot, 'manual.md'))).mode & 0o777, 0o640);
  assert.equal(await fingerprintBundle(source), sourceBefore);
  assert.equal(await fingerprintBundle(item.stagedRoot), item.expectedStageFingerprint);
  assert.deepEqual((await fs.readdir(item.root)).sort(), ['bundle', 'source', 'staged']);
});

for (const failAt of [1, 2]) {
  test(`rename ${failAt} failure leaves the original bundle intact`, async t => {
    const item = await fixture(t);
    let calls = 0;
    await assert.rejects(applyBundle({ ...item, rename: async (from, to) => {
      if (++calls === failAt) throw new Error('Controlled rename failure');
      await fs.rename(from, to);
    } }), /Controlled rename failure|original bundle was restored/);
    assert.equal(await fingerprintBundle(item.bundleRoot), item.expectedFingerprint);
    assert.equal(await fingerprintBundle(item.stagedRoot), item.expectedStageFingerprint);
    assert.deepEqual((await fs.readdir(item.root)).sort(), ['bundle', 'staged']);
  });
}

test('rollback failure reports and preserves the recoverable original', async t => {
  const item = await fixture(t);
  let calls = 0;
  let failure;
  try {
    await applyBundle({ ...item, rename: async (from, to) => {
      if (++calls > 1) throw new Error('Controlled failure');
      await fs.rename(from, to);
    } });
    assert.fail('Expected a rollback failure');
  } catch (error) {
    failure = error;
  }
  assert.match(failure.message, /rollback failed/);
  assert.equal(await fingerprintBundle(failure.backupPath), item.expectedFingerprint);
  assert.equal(await fingerprintBundle(item.stagedRoot), item.expectedStageFingerprint);
  assert.ok(failure.rollbackCause);
});

test('stale current or validated stage fingerprints reject before renaming', async t => {
  const item = await fixture(t);
  let calls = 0;
  const rename = async () => { calls++; throw new Error('Must not rename'); };
  await fs.writeFile(path.join(item.bundleRoot, 'manual.md'), 'Concurrent manual edit');
  await assert.rejects(applyBundle({ ...item, rename }), /Bundle fingerprint changed/);
  const expectedFingerprint = await fingerprintBundle(item.bundleRoot);
  await fs.writeFile(path.join(item.stagedRoot, 'docs', 'overview.md'), 'Changed after validation');
  await assert.rejects(applyBundle({ ...item, expectedFingerprint, rename }), /Staged bundle fingerprint changed/);
  assert.equal(calls, 0);
});

test('symlink files, directories, parents, special files, and overlapping paths reject', async t => {
  const item = await fixture(t);
  const link = path.join(item.bundleRoot, 'link');
  await fs.symlink(item.stagedRoot, link);
  await assert.rejects(fingerprintBundle(item.bundleRoot), /Symlinks/);
  await fs.unlink(link);
  await fs.symlink(path.join(item.stagedRoot, 'manual.md'), link);
  await assert.rejects(fingerprintBundle(item.bundleRoot), /Symlinks/);
  await fs.unlink(link);
  const alias = path.join(item.root, 'alias');
  await fs.symlink(item.root, alias);
  await assert.rejects(fingerprintBundle(path.join(alias, 'bundle')), /Unsafe directory/);
  execFileSync('mkfifo', [link]);
  await assert.rejects(fingerprintBundle(item.bundleRoot), /Special files/);
  await fs.unlink(link);
  await assert.rejects(applyBundle({ ...item, stagedRoot: item.bundleRoot }), /must not overlap/);
  const nested = path.join(item.bundleRoot, 'nested');
  await fs.mkdir(nested);
  await assert.rejects(applyBundle({ ...item, stagedRoot: nested }), /must not overlap/);
  await assert.rejects(applyBundle({ ...item, bundleRoot: process.cwd() }), /working directory/);
});
