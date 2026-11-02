import { constants } from 'node:fs';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

// undefined means an absent file (or an omitted candidate); null requests deletion.
export async function mergeDocument({ baseline, current, candidate }) {
  for (const [name, value] of Object.entries({ baseline, current })) {
    if (value !== undefined && typeof value !== 'string') throw new TypeError(`${name} must be text or undefined`);
  }
  if (candidate !== undefined && candidate !== null && typeof candidate !== 'string') throw new TypeError('candidate must be text, null, or undefined');
  if (candidate === undefined) return current;
  if (baseline === undefined) {
    if (current !== undefined) throw new Error('Cannot replace an existing document without a trusted baseline');
    return candidate;
  }
  if (candidate === baseline) return current;
  if (candidate === null) {
    if (current === undefined || current === baseline) return null;
    throw new Error('Cannot delete a document with manual edits');
  }
  if (current === undefined) throw new Error('Cannot replace a manually deleted document');
  if (current === baseline || current === candidate) return candidate;

  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'pflow-merge-'));
  try {
    const files = ['current', 'baseline', 'candidate'].map(name => path.join(temporary, name));
    await Promise.all(files.map((file, index) => fs.writeFile(file, [current, baseline, candidate][index], { mode: 0o600 })));
    try {
      const { stdout } = await run('git', ['merge-file', '--stdout', '--diff3', ...files], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
      return stdout;
    } catch (cause) {
      throw new Error('Document merge failed or has conflicting manual edits', { cause });
    }
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
}

async function checkedDirectory(input) {
  if (typeof input !== 'string' || !path.isAbsolute(input)) throw new Error('Bundle paths must be absolute');
  const absolute = path.resolve(input);
  let cursor = path.parse(absolute).root;
  for (const component of absolute.slice(cursor.length).split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, component);
    const stat = await fs.lstat(cursor);
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`Unsafe directory path: ${cursor}`);
  }
  return absolute;
}

async function regularBytes(file, observed) {
  const handle = await fs.open(file, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.ino !== observed.ino || stat.dev !== observed.dev) throw new Error(`File changed during inspection: ${file}`);
    return { bytes: await handle.readFile(), mode: stat.mode & 0o7777 };
  } finally {
    await handle.close();
  }
}

async function entries(root) {
  const result = [];
  async function visit(relative) {
    const absolute = path.join(root, relative);
    const stat = await fs.lstat(absolute);
    if (stat.isSymbolicLink()) throw new Error(`Symlinks are not allowed in a bundle: ${absolute}`);
    if (stat.isDirectory()) {
      result.push({ relative, directory: true, mode: stat.mode & 0o7777 });
      const names = (await fs.readdir(absolute)).sort();
      for (const name of names) await visit(path.join(relative, name));
    } else if (stat.isFile()) {
      result.push({ relative, directory: false, ...await regularBytes(absolute, stat) });
    } else {
      throw new Error(`Special files are not allowed in a bundle: ${absolute}`);
    }
  }
  await visit('');
  return result;
}

function digest(items) {
  const hash = createHash('sha256');
  for (const item of items) {
    hash.update(JSON.stringify([item.relative, item.directory ? 'directory' : 'file', item.mode, item.bytes?.length ?? 0]) + '\n');
    if (item.bytes) hash.update(item.bytes);
  }
  return hash.digest('hex');
}

export async function fingerprintBundle(root) {
  return digest(await entries(await checkedDirectory(root)));
}

function contains(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

async function copyEntries(items, destination) {
  for (const item of items) {
    const target = path.join(destination, item.relative);
    if (item.directory) {
      if (item.relative) await fs.mkdir(target, { mode: 0o700 });
    } else {
      await fs.writeFile(target, item.bytes, { flag: 'wx', mode: 0o600 });
      await fs.chmod(target, item.mode);
    }
  }
  // Set restrictive directory modes only after their children exist.
  for (const item of [...items].reverse()) {
    if (item.directory) await fs.chmod(path.join(destination, item.relative), item.mode);
  }
}

async function removeOwnedTree(root) {
  // Copied bundles can contain read-only directories. Restore owner access only
  // inside our private transaction directory before removing it.
  async function writable(directory) {
    const handle = await fs.open(directory, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
    try {
      const stat = await handle.stat();
      await handle.chmod((stat.mode & 0o7777) | 0o700);
    } finally {
      await handle.close();
    }
    for (const name of await fs.readdir(directory)) {
      const child = path.join(directory, name);
      if ((await fs.lstat(child)).isDirectory()) await writable(child);
    }
  }
  await writable(root);
  await fs.rm(root, { recursive: true, force: true });
}

// This is a recoverable two-rename transaction, not a crash-atomic operation.
// rename is a trusted test seam. Callers must validate the exact staged fingerprint.
export async function applyBundle({ bundleRoot, stagedRoot, expectedFingerprint, expectedStageFingerprint, rename = fs.rename }) {
  if (typeof expectedFingerprint !== 'string' || typeof expectedStageFingerprint !== 'string') throw new Error('Both expected fingerprints are required');
  if (typeof rename !== 'function') throw new TypeError('rename must be a function');
  const original = await checkedDirectory(bundleRoot);
  const staged = await checkedDirectory(stagedRoot);
  if (contains(original, process.cwd()) || original === path.parse(original).root) throw new Error('Cannot replace the working directory or its ancestors');
  if (contains(original, staged) || contains(staged, original)) throw new Error('Original and staged bundles must not overlap');
  if (await fingerprintBundle(original) !== expectedFingerprint) throw new Error('Bundle fingerprint changed before update');
  const stagedEntries = await entries(staged);
  if (digest(stagedEntries) !== expectedStageFingerprint) throw new Error('Staged bundle fingerprint changed after validation');

  const parent = path.dirname(original);
  const prefix = path.join(parent, `.${path.basename(original)}.pflow-`);
  let temporary;
  let backupDirectory;
  let moved = false;
  let committed = false;
  let preserveBackup = false;
  try {
    temporary = await fs.mkdtemp(`${prefix}stage-`);
    await copyEntries(stagedEntries, temporary);
    if (await fingerprintBundle(temporary) !== expectedStageFingerprint) throw new Error('Copied stage fingerprint does not match validated bundle');
    backupDirectory = await fs.mkdtemp(`${prefix}backup-`);
    const backup = path.join(backupDirectory, 'bundle');
    await checkedDirectory(original);
    if (await fingerprintBundle(original) !== expectedFingerprint) throw new Error('Bundle fingerprint changed before commit');
    if (await fingerprintBundle(staged) !== expectedStageFingerprint) throw new Error('Staged bundle fingerprint changed before commit');
    await rename(original, backup);
    moved = true;
    try {
      await rename(temporary, original);
      committed = true;
    } catch (cause) {
      try {
        await rename(backup, original);
        moved = false;
      } catch (rollbackCause) {
        preserveBackup = true;
        const error = new Error(`Bundle update and rollback failed; original bundle is preserved at ${backup}`, { cause });
        error.backupPath = backup;
        error.rollbackCause = rollbackCause;
        throw error;
      }
      throw new Error('Bundle update failed; original bundle was restored', { cause });
    }
    return { fingerprint: expectedStageFingerprint };
  } finally {
    if (temporary && !committed) await removeOwnedTree(temporary);
    if (backupDirectory && !preserveBackup && (!moved || committed)) await removeOwnedTree(backupDirectory);
  }
}
