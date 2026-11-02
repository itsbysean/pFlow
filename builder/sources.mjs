import { openSync, closeSync, fstatSync, readSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';

export const defaultLimits = Object.freeze({ sourceBytes: 1024 * 1024, snippetLines: 200, snippetBytes: 64 * 1024, totalSnippetBytes: 1024 * 1024 });
export function sourceLimits(options = {}) {
  for (const key of Object.keys(options)) if (!Object.hasOwn(defaultLimits, key)) throw new Error(`Unknown source limit: ${key}.`);
  const limits = { ...defaultLimits, ...options };
  for (const [key, value] of Object.entries(limits)) if (!Number.isSafeInteger(value) || value < 1) throw new Error(`Source limit ${key} must be a positive safe integer.`);
  return limits;
}
function within(root, target) { const rel = path.relative(root, target); return rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel); }
export function resolveSourceFile(root, relative) {
  if (typeof relative !== 'string' || !relative || relative.includes('\\') || relative.includes('\0') || path.posix.isAbsolute(relative) || /^[A-Za-z]:/.test(relative) || relative.split('/').includes('..')) throw new Error('Source path must remain relative and inside its root.');
  const target = realpathSync(path.resolve(root, relative));
  if (!within(realpathSync(root), target)) throw new Error('Source path escapes repository root.');
  if (!statSync(target).isFile()) throw new Error('Source must be a regular file.');
  return target;
}
export function createSourceProcessor({ repositoryRoot, limits: options }) {
  const limits = sourceLimits(options), cache = new Map(), root = realpathSync(repositoryRoot);
  // Shared validation calls this only after its own canonical containment/file checks.
  function readText(target) {
    target = realpathSync(target);
    if (!within(root, target)) throw new Error('Source path escapes repository root.');
    if (cache.has(target)) return cache.get(target).text;
    const fd = openSync(target, 'r');
    try {
      const info = fstatSync(fd);
      if (!info.isFile()) throw new Error('Source must be a regular file.');
      if (info.size > limits.sourceBytes) { cache.set(target, { reason: `File exceeds ${limits.sourceBytes} bytes; line bounds were not verified and no snippet was embedded.` }); return; }
      const buffer = Buffer.alloc(limits.sourceBytes + 1); let count = 0, size;
      while (count < buffer.length && (size = readSync(fd, buffer, count, buffer.length - count, null))) count += size;
      if (count > limits.sourceBytes) { cache.set(target, { reason: `File exceeds ${limits.sourceBytes} bytes; line bounds were not verified and no snippet was embedded.` }); return; }
      let text;
      try { text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(buffer.subarray(0, count)); }
      catch { cache.set(target, { error: 'Source content is not valid UTF-8.' }); return; }
      cache.set(target, { text }); return text;
    } finally { closeSync(fd); }
  }
  function extract(sources, includedIds = new Set(sources.map(source => source.id))) {
    const snippets = [], diagnostics = [], ranges = new Map(); let total = 0;
    const issue = (source, severity, message) => diagnostics.push({ severity, phase: 'source', path: source.id, message: `${source.path}: ${message}` });
    for (const source of sources) {
      try {
        const target = resolveSourceFile(repositoryRoot, source.path); readText(target);
        const loaded = cache.get(target);
        if (loaded.error) { issue(source, 'error', loaded.error); continue; }
        if (loaded.reason) { issue(source, 'warning', loaded.reason); continue; }
        if (!includedIds.has(source.id)) continue;
        if (source.startLine === undefined) { issue(source, 'warning', loaded.text ? 'File-level evidence has no explicit line range; location retained without a snippet.' : 'Source file is empty; location retained without a snippet.'); continue; }
        const lines = loaded.lines ||= loaded.text ? loaded.text.replace(/(?:\r\n|\r|\n)$/, '').split(/\r\n|\r|\n/) : [];
        if (!Number.isSafeInteger(source.startLine) || !Number.isSafeInteger(source.endLine) || source.startLine < 1 || source.endLine < source.startLine || source.endLine > lines.length) { issue(source, 'error', `Invalid source range ${source.startLine}–${source.endLine}; file has ${lines.length} lines.`); continue; }
        const key = JSON.stringify([target, source.startLine, source.endLine]);
        if (ranges.has(key)) { ranges.get(key).sourceIds.push(source.id); continue; }
        if (source.endLine - source.startLine + 1 > limits.snippetLines) { issue(source, 'warning', `Range exceeds ${limits.snippetLines} lines; no snippet was embedded.`); continue; }
        const selected = lines.slice(source.startLine - 1, source.endLine), bytes = Buffer.byteLength(selected.join('\n'));
        if (bytes > limits.snippetBytes || total + bytes > limits.totalSnippetBytes) { issue(source, 'warning', 'Snippet byte budget exceeded; no snippet was embedded.'); continue; }
        const snippet = { sourceIds: [source.id], lines: selected.map((text, index) => ({ number: source.startLine + index, text })) };
        total += bytes; snippets.push(snippet); ranges.set(key, snippet);
      } catch (error) { issue(source, 'error', error.code ? `Source file is missing or unreadable (${error.code}).` : error.message); }
    }
    cache.clear(); return { snippets, diagnostics };
  }
  return { readText, extract };
}
