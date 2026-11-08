import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, lstatSync, readlinkSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';

const hash = value => createHash('sha256').update(value).digest('hex');
const fail = message => new Error(`Read-only Git evidence: ${message}`);

/**
 * Collect ephemeral Git evidence. Two matching reads detect instability, not atomicity.
 * An unstaged rename to an untracked path is reported as deletion plus untracked;
 * Git rename matching includes that destination after it is staged.
 */
export function collectGitChanges({ repositoryRoot, baseline, scope, target } = {}) {
  if (!repositoryRoot || !baseline || !['commit', 'working-tree'].includes(scope)) {
    throw fail('supply repositoryRoot, an explicit baseline, and scope "commit" or "working-tree".');
  }
  if (scope === 'commit' && !target) throw fail('commit scope requires an explicit target commit.');
  if (scope === 'working-tree' && target !== undefined) throw fail('working-tree scope does not accept target.');
  const root = realpathSync(resolve(repositoryRoot));
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));
  Object.assign(env, { GIT_OPTIONAL_LOCKS: '0', GIT_TERMINAL_PROMPT: '0', GIT_PAGER: 'cat', GIT_NO_LAZY_FETCH: '1' });
  const options = ['-c', 'core.fsmonitor=false', '-c', 'core.hooksPath=/dev/null', '-c', 'core.pager=cat'];
  const run = args => {
    try {
      return execFileSync('git', ['-C', root, ...options, ...args], {
        env, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (error) {
      throw fail(`Git could not read ${args[0]}. Check the repository and explicit commit references. ${String(error.stderr || '').trim()}`);
    }
  };
  // Enumerate names only: never evaluate configured filter commands.
  for (const entry of run(['config', '--null', '--list']).split('\0')) {
    const key = entry.split('\n', 1)[0];
    const value = entry.slice(key.length + 1);
    if (/^extensions\.partialclone$/i.test(key) ||
        (/^remote\..*\.promisor$/i.test(key) && !/^(?:false|no|off|0)$/i.test(value))) {
      throw fail('unsupported partial clone or promisor repository. Supply a complete local repository; this analysis does not access remotes or fetch missing objects.');
    }
    if (/^filter\..*\.(clean|smudge|process|required)$/i.test(key)) {
      options.push('-c', `${key}=${/\.required$/i.test(key) ? 'false' : ''}`);
    }
  }
  const actualRoot = realpathSync(run(['rev-parse', '--show-toplevel']).trimEnd());
  if (actualRoot !== root) throw fail('repositoryRoot must be the Git worktree root.');
  const commit = (value, label) => {
    try { return run(['rev-parse', '--verify', '--end-of-options', `${value}^{commit}`]).trim(); }
    catch { throw fail(`${label} "${value}" is not an available commit. Supply an explicit local commit reference.`); }
  };
  const baselineCommit = commit(baseline, 'baseline');
  const targetCommit = scope === 'commit' ? commit(target, 'target') : undefined;
  const gitlink = run(['ls-files', '--stage', '-z']).split('\0').find(entry => entry.startsWith('160000 '));
  if (gitlink) {
    throw fail(`unsupported repository: submodule ${JSON.stringify(gitlink.slice(gitlink.indexOf('\t') + 1))} is present in the index. Use a repository without submodules for this analysis. No status or diff was run.`);
  }
  const revisions = targetCommit ? [baselineCommit, targetCommit] : [baselineCommit];
  const diff = ['diff', '--no-ext-diff', '--no-textconv', '--ignore-submodules=none', '--find-renames', ...revisions];
  const read = () => {
    if (scope === 'working-tree') {
      const hidden = run(['ls-files', '-v', '-z']).split('\0').find(entry => /^[a-zS] /.test(entry));
      if (hidden) {
        throw fail(`unsupported working-tree scope: ${JSON.stringify(hidden.slice(2))} has assume-unchanged or skip-worktree set. Use commit scope, or explicitly resolve these index flags before retrying. The index was not changed.`);
      }
    }
    const status = scope === 'working-tree' ? run(['status', '--porcelain=v1', '-z', '--untracked-files=all', '--ignore-submodules=none']) : '';
    const names = run([...diff, '--name-status', '-z', '--']).split('\0');
    const changes = [];
    const evidence = [status, run([...diff, '--binary', '--full-index', '--no-color', '--'])];
    for (let i = 0; i < names.length && names[i];) {
      const rawStatus = names[i++];
      const firstPath = names[i++];
      const renamed = /^[RC]/.test(rawStatus);
      const path = renamed ? names[i++] : firstPath;
      const change = { status: rawStatus[0], path, hunks: [] };
      if (renamed) change.oldPath = firstPath;
      const patch = run([...diff, '--no-color', '--unified=0', '--', `:(literal)${path}`]);
      evidence.push(patch);
      if (renamed || !['M', 'D'].includes(change.status) || /^(?:Binary files |GIT binary patch|(?:old|new) mode )/m.test(patch)) {
        change.wholeFile = true;
      } else {
        for (const match of patch.matchAll(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/gm)) {
          change.hunks.push({ oldStart: +match[1], oldLines: +(match[2] ?? 1), newStart: +match[3], newLines: +(match[4] ?? 1) });
        }
      }
      changes.push(change);
    }
    if (scope === 'working-tree') {
      for (const path of run(['ls-files', '--others', '--exclude-standard', '-z']).split('\0').filter(Boolean)) {
        const absolute = resolve(root, path);
        const stat = lstatSync(absolute);
        if (!stat.isFile() && !stat.isSymbolicLink()) {
          throw fail(`untracked path ${JSON.stringify(path)} is not a regular file or symbolic link. Move or exclude this special file, then retry.`);
        }
        const content = stat.isSymbolicLink() ? Buffer.from(readlinkSync(absolute)) : readFileSync(absolute);
        evidence.push(path, String(stat.mode), hash(content));
        const existing = changes.find(change => change.path === path);
        if (existing) { existing.status = 'M'; existing.wholeFile = true; existing.hunks = []; }
        else changes.push({ status: '?', path, hunks: [], wholeFile: true });
      }
    }
    changes.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
    return { changes, fingerprint: hash(JSON.stringify(evidence)) };
  };
  let first, second;
  try { first = read(); second = read(); }
  catch (error) { throw fail(`collection failed or files changed during collection. Retry after edits stop. ${error.message}`); }
  if (first.fingerprint !== second.fingerprint) throw fail('files changed during collection. Retry after edits stop.');
  return { repositoryRoot: root, baselineCommit, ...(targetCommit ? { targetCommit } : {}), scope,
    changes: second.changes, fingerprint: second.fingerprint, consistency: 'two matching reads; not an atomic snapshot' };
}
