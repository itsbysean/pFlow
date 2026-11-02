import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, renameSync, rmSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectGitChanges } from '../skills/pflow-impact/scripts/git-changes.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'pflow-git-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
  git('init', '-q'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid');
  const put = (path, value) => writeFileSync(join(root, path), value);
  const commit = () => { git('add', '-A'); git('commit', '-qm', 'fixture'); return git('rev-parse', 'HEAD'); };
  return { root, git, put, commit, collect: (baseline, more = {}) => collectGitChanges({ repositoryRoot: root, baseline, scope: 'working-tree', ...more }) };
}

test('reads final tracked and untracked contents, with old-side zero-context hunks', t => {
  const f = fixture(t);
  f.put('modified', 'one\ntwo\nthree\nfour\n'); f.put('deleted', 'old\n');
  f.put('rename', 'unchanged\n'); f.put('rename-edit', 'a\nb\nc\nd\ne\nf\n');
  f.put('.gitignore', 'ignored\n'); const base = f.commit();
  f.put('modified', 'inserted\none\ntwo\nthree\nfour\n'); f.git('add', 'modified');
  f.put('modified', 'inserted\none\ntwo\nchanged\nfour\n');
  rmSync(join(f.root, 'deleted')); renameSync(join(f.root, 'rename'), join(f.root, 'renamed'));
  renameSync(join(f.root, 'rename-edit'), join(f.root, 'renamed-edit'));
  f.put('renamed-edit', 'a\nb\nc\nd\ne\nchanged\n'); f.git('add', '-A');
  f.put('new space\n: name', 'new\n'); f.put('ignored', 'ignored\n');
  const indexBefore = readFileSync(join(f.root, '.git/index'));
  const workBefore = readFileSync(join(f.root, 'modified'));
  const result = f.collect(base);
  const byPath = Object.fromEntries(result.changes.map(c => [c.path, c]));
  assert.equal(byPath.deleted.status, 'D');
  assert.deepEqual(byPath.modified.hunks, [
    { oldStart: 0, oldLines: 0, newStart: 1, newLines: 1 },
    { oldStart: 3, oldLines: 1, newStart: 4, newLines: 1 },
  ]);
  assert.equal(byPath.renamed.oldPath, 'rename'); assert.equal(byPath.renamed.wholeFile, true);
  assert.equal(byPath['renamed-edit'].oldPath, 'rename-edit'); assert.equal(byPath['renamed-edit'].wholeFile, true);
  assert.equal(byPath['new space\n: name'].status, '?'); assert.equal(byPath['new space\n: name'].wholeFile, true);
  assert.equal(byPath.ignored, undefined);
  assert.deepEqual(readFileSync(join(f.root, '.git/index')), indexBefore);
  assert.deepEqual(readFileSync(join(f.root, 'modified')), workBefore);
});

test('commit scope excludes later working changes and requires explicit references', t => {
  const f = fixture(t); f.put('a', 'a\n'); const base = f.commit();
  f.put('a', 'b\n'); f.put('added', 'added\n'); const target = f.commit();
  f.put('a', 'c\n'); f.put('later', 'later\n');
  const result = f.collect(base, { scope: 'commit', target });
  assert.equal(result.baselineCommit, base); assert.equal(result.targetCommit, target);
  assert.deepEqual(result.changes.map(c => c.path), ['a', 'added']);
  assert.equal(result.changes[1].status, 'A'); assert.equal(result.changes[1].wholeFile, true);
  assert.equal(f.collect(base).changes.length, 3);
  assert.throws(() => f.collect('missing-commit'), /baseline.*not an available commit/);
  assert.throws(() => f.collect(base, { scope: undefined }), /explicit baseline.*scope/);
  assert.throws(() => f.collect(base, { scope: 'commit' }), /explicit target/);
});

test('unstaged rename destination is reported as untracked until staged', t => {
  const f = fixture(t); f.put('before', 'same content\n'); const base = f.commit();
  renameSync(join(f.root, 'before'), join(f.root, 'after'));
  assert.deepEqual(f.collect(base).changes.map(({ path, status }) => ({ path, status })), [
    { path: 'after', status: '?' }, { path: 'before', status: 'D' },
  ]);
  f.git('add', '-A');
  const changes = f.collect(base).changes;
  assert.equal(changes.length, 1); assert.equal(changes[0].status, 'R');
  assert.equal(changes[0].oldPath, 'before'); assert.equal(changes[0].path, 'after');
});

for (const flag of ['--assume-unchanged', '--skip-worktree']) {
  test(`working-tree scope refuses ${flag} without changing the index`, t => {
    const f = fixture(t); f.put('hidden', 'before\n'); const base = f.commit();
    f.git('update-index', flag, 'hidden'); f.put('hidden', 'edited\n');
    const index = readFileSync(join(f.root, '.git/index'));
    assert.throws(() => f.collect(base), /unsupported working-tree scope.*assume-unchanged or skip-worktree.*Use commit scope/);
    assert.deepEqual(readFileSync(join(f.root, '.git/index')), index);
    assert.deepEqual(f.collect(base, { scope: 'commit', target: base }).changes, []);
    assert.deepEqual(readFileSync(join(f.root, '.git/index')), index);
    assert.equal(readFileSync(join(f.root, 'hidden'), 'utf8'), 'edited\n');
  });
}

test('refuses untracked special files before reading their contents', t => {
  const f = fixture(t); f.put('a', 'a\n'); const base = f.commit();
  try { execFileSync('mkfifo', [join(f.root, 'pipe')]); }
  catch (error) {
    if (error.code === 'ENOENT') { t.skip('mkfifo is unavailable'); return; }
    throw error;
  }
  // Some Git versions omit FIFOs. Supply this real FIFO in the enumeration so
  // the collector's guard is exercised on those versions too.
  const wrappers = mkdtempSync(join(tmpdir(), 'pflow-special-wrapper-'));
  t.after(() => rmSync(wrappers, { recursive: true, force: true }));
  const realGit = execFileSync('which', ['git'], { encoding: 'utf8' }).trim();
  const wrapper = join(wrappers, 'git');
  writeFileSync(wrapper, `#!${process.execPath}\n` +
    `const {execFileSync}=require('node:child_process');\n` +
    `const args=process.argv.slice(2);\n` +
    `process.stdout.write(execFileSync(${JSON.stringify(realGit)},args));\n` +
    `if(args.includes('ls-files'))process.stdout.write('pipe\\0');\n`);
  chmodSync(wrapper, 0o755);
  const oldPath = process.env.PATH;
  try {
    process.env.PATH = `${wrappers}:${oldPath}`;
    assert.throws(() => f.collect(base), /untracked path "pipe" is not a regular file or symbolic link.*Move or exclude/);
  } finally { process.env.PATH = oldPath; }
});

test('literal pathspecs, binary files, and type changes use safe evidence', t => {
  const f = fixture(t);
  f.put(':leading', 'before\n'); f.put('line\nbreak', 'before\n'); f.put('binary', Buffer.from([0, 1, 2]));
  const base = f.commit(); f.put(':leading', 'after\n'); f.put('line\nbreak', 'after\n');
  f.put('binary', Buffer.from([0, 3, 4]));
  const result = f.collect(base);
  assert.equal(result.changes.find(c => c.path === ':leading').hunks[0].oldLines, 1);
  assert.equal(result.changes.find(c => c.path === 'line\nbreak').hunks[0].oldLines, 1);
  assert.equal(result.changes.find(c => c.path === 'binary').wholeFile, true);
  f.git('update-index', '--chmod=+x', ':leading');
  // Final working-tree mode is authoritative; commit scope can still inspect a mode change.
  f.git('commit', '-qm', 'mode fixture');
  assert.equal(f.collect(base, { scope: 'commit', target: 'HEAD' }).changes.find(c => c.path === ':leading').wholeFile, true);
});

test('configured clean/process, external diff, textconv, and fsmonitor commands do not run', t => {
  const f = fixture(t); f.put('a', 'before\n'); const base = f.commit();
  const marker = join(f.root, 'TRAP'); const command = `touch '${marker}'`;
  f.put('.gitattributes', '* filter=hostile diff=hostile\n');
  f.git('config', 'filter.hostile.clean', command); f.git('config', 'filter.hostile.smudge', command);
  f.git('config', 'filter.hostile.process', command); f.git('config', 'filter.hostile.required', 'true');
  f.git('config', 'diff.external', command); f.git('config', 'diff.hostile.command', command);
  f.git('config', 'diff.hostile.textconv', command); f.git('config', 'core.fsmonitor', command);
  f.put('a', 'after\n'); const index = readFileSync(join(f.root, '.git/index'));
  assert.equal(f.collect(base).changes.find(c => c.path === 'a').status, 'M');
  assert.equal(existsSync(marker), false); assert.deepEqual(readFileSync(join(f.root, '.git/index')), index);
});

test('rejects initialized submodules before child-only filters can execute', t => {
  const f = fixture(t); f.put('a', 'before\n'); f.commit();
  const source = fixture(t); source.put('child', 'before\n'); source.commit();
  f.git('-c', 'protocol.file.allow=always', 'submodule', 'add', '-q', source.root, 'module');
  const base = f.commit();
  const marker = join(f.root, 'TRAP');
  const childGit = (...args) => execFileSync('git', ['-C', join(f.root, 'module'), ...args], { encoding: 'utf8' });
  writeFileSync(join(f.root, 'module', '.gitattributes'), '* filter=hostile\n');
  childGit('config', 'filter.hostile.clean', `touch '${marker}'`);
  writeFileSync(join(f.root, 'module', 'child'), 'after\n');
  const index = readFileSync(join(f.root, '.git/index'));
  assert.throws(() => f.collect(base), /unsupported repository: submodule "module".*No status or diff was run/);
  assert.throws(() => f.collect(base, { scope: 'commit', target: base }), /unsupported repository: submodule/);
  assert.equal(existsSync(marker), false);
  assert.deepEqual(readFileSync(join(f.root, '.git/index')), index);
});

for (const [key, value] of [['extensions.partialClone', 'trap'], ['remote.trap.promisor', 'true']]) {
  test(`rejects ${key} without contacting its remote helper`, t => {
    const f = fixture(t); f.put('a', 'a\n'); const base = f.commit();
    const marker = join(f.root, 'TRAP');
    f.git('config', 'remote.trap.url', `ext::touch ${marker}`);
    f.git('config', 'protocol.ext.allow', 'always');
    f.git('config', key, value);
    const index = readFileSync(join(f.root, '.git/index'));
    assert.throws(() => f.collect(base), /unsupported partial clone or promisor repository.*does not access remotes/);
    assert.throws(() => f.collect(base, { scope: 'commit', target: base }), /unsupported partial clone or promisor repository/);
    assert.equal(existsSync(marker), false);
    assert.deepEqual(readFileSync(join(f.root, '.git/index')), index);
  });
}

test('rejects files changed between evidence reads', t => {
  const f = fixture(t); f.put('a', 'before\n'); const base = f.commit(); f.put('a', 'first edit\n');
  const wrappers = mkdtempSync(join(tmpdir(), 'pflow-git-wrapper-'));
  t.after(() => rmSync(wrappers, { recursive: true, force: true }));
  const realGit = execFileSync('which', ['git'], { encoding: 'utf8' }).trim();
  const wrapper = join(wrappers, 'git');
  writeFileSync(wrapper, `#!${process.execPath}\n` +
    `const {execFileSync}=require('node:child_process');\n` +
    `const {existsSync,writeFileSync}=require('node:fs');\n` +
    `const args=process.argv.slice(2);\n` +
    `process.stdout.write(execFileSync(${JSON.stringify(realGit)},args));\n` +
    `if(args.includes('--binary')&&!existsSync(${JSON.stringify(join(wrappers, 'once'))})){` +
    `writeFileSync(${JSON.stringify(join(wrappers, 'once'))},'yes');` +
    `writeFileSync(${JSON.stringify(join(f.root, 'a'))},'second edit\\n');}\n`);
  chmodSync(wrapper, 0o755);
  const oldPath = process.env.PATH;
  try {
    process.env.PATH = `${wrappers}:${oldPath}`;
    assert.throws(() => f.collect(base), /files changed during collection/);
  } finally { process.env.PATH = oldPath; }
});
