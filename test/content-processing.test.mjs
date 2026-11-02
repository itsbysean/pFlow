import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { parseHTML } from 'linkedom';
import { processMarkdown } from '../builder/markdown.mjs';
import { createSourceProcessor, sourceLimits } from '../builder/sources.mjs';
import { prepareBuild, BuildError } from '../builder/pipeline.mjs';
import { parseArguments } from '../builder/arguments.mjs';
import { repositoryRoot } from './support/validate-artifact.mjs';

const dom = html => parseHTML(`<html><body>${html}</body></html>`).document;
const render = markdown => processMarkdown(markdown, { path: 'execution.md', sources: [{ id: 'src_test', path: 'config/tasks.xml', startLine: 2, endLine: 4, symbol: 'task' }] });
function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), 'pflow-content-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  cpSync(path.join(repositoryRoot, 'examples/a-sync'), path.join(root, 'examples/a-sync'), { recursive: true });
  const input = path.join(root, 'examples/a-sync'), json = path.join(input, 'architecture.json');
  return { root, input, output: path.join(root, 'architecture.html'), json,
    mutate(action) { const data = JSON.parse(readFileSync(json, 'utf8')); action(data); writeFileSync(json, JSON.stringify(data)); },
  };
}
const source = (id, startLine = 2, endLine = 3) => ({ id, path: 'sample.txt', ...(startLine === undefined ? {} : { startLine, endLine }), symbol: 'configured step' });
function sourceFixture(t, content, limits) {
  const root = mkdtempSync(path.join(tmpdir(), 'pflow-source-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(path.join(root, 'sample.txt'), content);
  return { root, processor: createSourceProcessor({ repositoryRoot: root, limits }) };
}

test('shared Markdown renderer supports contract blocks, emphasis, code and literal sections', () => {
  const processed = render('# Overview\n\n<a id="flow_test"></a>\n## Execution\n\nA **strong** and *emphasized* paragraph with `code`.\n\n- First\n- Second\n\n1. Start\n2. Finish\n\n```config\n  enabled: true\n```\n\n| Key | Value |\n| --- | --- |\n| task | run |');
  const document = dom(processed.html);
  assert.equal(document.querySelector('#flow_test h2').textContent, 'Execution');
  assert.equal(document.querySelector('strong').textContent, 'strong'); assert.equal(document.querySelector('em').textContent, 'emphasized');
  assert.equal(document.querySelectorAll('ul li').length, 2); assert.equal(document.querySelectorAll('ol li').length, 2);
  assert.equal(document.querySelector('pre code').textContent, '  enabled: true'); assert.equal(document.querySelectorAll('td').length, 2);
  assert.deepEqual(processed.sections, [{ id: 'flow_test', label: 'Execution' }]);
  assert.equal(document.querySelector('h1').id, '');
});

test('document and evidence links retain exact navigation associations without executable URLs', () => {
  const document = dom(render('# Index\n[Detail](execution.md#node_test) and [src_test].\n\n[src_test]: ../config/tasks.xml#L2-L4').html);
  const link = document.querySelector('[data-document-path]');
  assert.equal(link.dataset.documentPath, 'execution.md'); assert.equal(link.dataset.documentSection, 'node_test');
  assert.equal(document.querySelectorAll('[data-source-id="src_test"]').length, 2);
  assert.match(document.querySelector('.source-link').title, /config\/tasks.xml:2–4.*task/);
  assert.equal(document.querySelectorAll('[href],[src],[onclick]').length, 0);
});

for (const url of ['javascript:alert(1)', 'data:text/html,bad', 'vbscript:bad', '//example.invalid/file.md', '/escape.md', '../../escape.md', 'file:///etc/passwd']) {
  test(`unsafe Markdown destination is inert: ${url}`, () => {
    const document = dom(render(`# Title\n[Unsafe](${url})`).html);
    assert.equal(document.querySelector('[data-document-path]'), null); assert.equal(document.querySelector('[href]'), null);
    assert.match(document.body.textContent, /Unsafe/);
  });
}

test('malicious HTML, attributes and code serialize as text, never executable markup', () => {
  const markdown = '# Unsafe\n\n<script>globalThis.injected=1</script>\n\n<img src=x onerror="alert(1)">\n\n**<svg onload=bad>** and `</code><iframe src=x>`\n\n```html\n</script><script>alert(1)</script>\n```';
  const processed = render(markdown), document = dom(processed.html);
  assert.equal(document.querySelectorAll('script,img,svg,iframe,[onerror],[onload]').length, 0);
  assert.match(document.querySelector('pre code').textContent, /<script>alert/);
  assert.match(document.body.textContent, /<img src=x/);
  assert.match(processed.html, /&lt;script&gt;/);
});

test('duplicate anchors fail rather than create ambiguous section navigation', () => {
  assert.throws(() => render('# Title\n<a id="flow_a"></a>\n## One\n<a id="flow_a"></a>\n## Two'), /Ambiguous duplicate/);
});

for (const ending of ['\n', '\r\n', '\r']) test(`source extraction preserves text and original line numbering with ${JSON.stringify(ending)}`, t => {
  const f = sourceFixture(t, ['header', '\t  日本語 café', '  <config enabled="true">', 'tail'].join(ending) + ending);
  const result = f.processor.extract([source('src_first'), source('src_second')]);
  assert.deepEqual(result.diagnostics, []); assert.equal(result.snippets.length, 1);
  assert.deepEqual(result.snippets[0], { sourceIds: ['src_first', 'src_second'], lines: [{ number: 2, text: '\t  日本語 café' }, { number: 3, text: '  <config enabled="true">' }] });
});

test('multiple evidence ranges are extracted independently and file-level evidence stays location-only', t => {
  const f = sourceFixture(t, 'one\ntwo\nthree\nfour');
  const result = f.processor.extract([source('src_one', 1, 1), source('src_four', 4, 4), { id: 'src_file', path: 'sample.txt', symbol: 'file' }]);
  assert.deepEqual(result.snippets.map(item => item.lines[0]), [{ number: 1, text: 'one' }, { number: 4, text: 'four' }]);
  assert.equal(result.diagnostics[0].severity, 'warning'); assert.match(result.diagnostics[0].message, /no explicit line range/);
});

test('missing files, stale and invalid ranges are errors without fabricated content', t => {
  const f = sourceFixture(t, 'one\ntwo\n');
  const result = f.processor.extract([source('src_past', 3, 4), source('src_reverse', 2, 1), source('src_zero', 0, 1), { id: 'src_missing', path: 'moved.txt', startLine: 1, endLine: 1 }]);
  assert.equal(result.snippets.length, 0); assert.equal(result.diagnostics.length, 4); assert.ok(result.diagnostics.every(item => item.severity === 'error'));
  assert.match(result.diagnostics.at(-1).message, /missing or unreadable/);
});

test('empty files have no fabricated first line and file-level emptiness warns', t => {
  const f = sourceFixture(t, '');
  const result = f.processor.extract([{ id: 'src_empty', path: 'sample.txt' }, source('src_range', 1, 1)]);
  assert.equal(result.snippets.length, 0); assert.equal(result.diagnostics[0].severity, 'warning'); assert.match(result.diagnostics[0].message, /empty/);
  assert.equal(result.diagnostics[1].severity, 'error'); assert.match(result.diagnostics[1].message, /0 lines/);
});

for (const limits of [{ sourceBytes: 3 }, { snippetLines: 1 }, { snippetBytes: 2 }, { totalSnippetBytes: 2 }]) test(`safety limits omit whole snippets with explicit warnings: ${JSON.stringify(limits)}`, t => {
  const f = sourceFixture(t, 'header\nsecond\nthird\n', limits), result = f.processor.extract([source('src_big')]);
  assert.equal(result.snippets.length, 0); assert.equal(result.diagnostics[0].severity, 'warning'); assert.match(result.diagnostics[0].message, /no snippet was embedded/);
});

test('source limits reject invalid configuration and invalid UTF-8 is an error', t => {
  for (const options of [{ snippetLines: 0 }, { sourceBytes: -1 }, { snippetBytes: 1.5 }, { unknown: 1 }]) assert.throws(() => sourceLimits(options));
  const f = sourceFixture(t, Buffer.from([0xff, 0xfe]));
  const result = f.processor.extract([source('src_bytes', 1, 1)]);
  assert.equal(result.snippets.length, 0); assert.equal(result.diagnostics[0].severity, 'error'); assert.match(result.diagnostics[0].message, /UTF-8/);
});

for (const relative of ['../outside.txt', '/etc/passwd', 'C:/secrets', 'folder\\file', 'missing.txt']) test(`source path remains inside repository: ${relative}`, t => {
  const f = sourceFixture(t, 'one'); const result = f.processor.extract([{ id: 'src_escape', path: relative, startLine: 1, endLine: 1 }]);
  assert.equal(result.snippets.length, 0); assert.equal(result.diagnostics[0].severity, 'error');
});

test('symbolic links cannot escape source root; direct cached reader is bounded too', t => {
  const f = sourceFixture(t, 'inside'), other = sourceFixture(t, 'outside');
  symlinkSync(path.join(other.root, 'sample.txt'), path.join(f.root, 'escape.txt'));
  const result = f.processor.extract([{ id: 'src_link', path: 'escape.txt', startLine: 1, endLine: 1 }]);
  assert.match(result.diagnostics[0].message, /escapes repository root/); assert.equal(result.snippets.length, 0);
  assert.throws(() => f.processor.readText(path.join(other.root, 'sample.txt')), /escapes repository root/);
});

test('pipeline processes separate artifact/repository roots with exact raw Markdown and unchanged model', t => {
  const f = fixture(t), options = { input: f.input, repositoryRoot: f.root, output: f.output };
  const prepared = prepareBuild(options), again = prepareBuild(options), artifact = prepared.artifacts[0];
  assert.deepEqual(prepared, again); assert.deepEqual(prepared.diagnostics, []);
  assert.equal(artifact.path, 'architecture.json'); assert.equal(prepared.repositoryRoot, realpathSync(f.root));
  assert.deepEqual(artifact.architecture, JSON.parse(readFileSync(f.json, 'utf8')));
  for (const document of artifact.documents) {
    assert.equal(document.markdown, readFileSync(path.join(f.input, 'docs', document.path), 'utf8'));
    for (const section of document.sections) assert.ok(dom(document.html).getElementById(section.id));
  }
  const evidence = artifact.architecture.sources[0], snippet = artifact.snippets.find(item => item.sourceIds.includes(evidence.id));
  assert.equal(snippet.lines[0].number, evidence.startLine);
  assert.equal(snippet.lines[0].text, readFileSync(path.join(f.root, evidence.path), 'utf8').split('\n')[evidence.startLine - 1]);
  assert.equal(existsSync(f.output), false);
});

test('CLI repository-root option is backward compatible and validates roots', t => {
  const f = fixture(t), options = parseArguments(['build', '--input', f.input, '--repository-root', f.root, '--output', f.output]);
  assert.equal(options.repositoryRoot, f.root);
  const cli = path.join(repositoryRoot, 'builder/cli.mjs');
  const result = spawnSync(process.execPath, [cli, 'build', '--input', f.input, '--repository-root', f.root, '--output', f.output], { encoding: 'utf8' });
  assert.equal(result.status, 0); assert.match(result.stdout, /Wrote \d+ bytes/); assert.equal(result.stderr, '');
  assert.throws(() => prepareBuild({ ...options, repositoryRoot: path.join(f.root, 'missing') }), BuildError);
  assert.equal(prepareBuild({ input: f.root, output: f.output }).repositoryRoot, realpathSync(f.root));
});

test('pipeline safety-limit warnings are stable, retain source locations and do not fail documentation', t => {
  const f = fixture(t), prepared = prepareBuild({ input: f.input, repositoryRoot: f.root, output: f.output, limits: { snippetLines: 1 } });
  assert.ok(prepared.artifacts[0].documents[0].html);
  assert.ok(prepared.diagnostics.length > 0); assert.ok(prepared.diagnostics.every(item => item.severity === 'warning'));
  assert.deepEqual(prepared.artifacts[0].architecture.sources, JSON.parse(readFileSync(f.json, 'utf8')).sources);
  for (const issue of prepared.diagnostics) assert.ok(prepared.artifacts[0].architecture.sources.some(source => source.id === issue.path));
});

test('unassociated SourceReference records never embed unrelated file contents', t => {
  const f = fixture(t); writeFileSync(path.join(f.root, 'unrelated.txt'), 'NOT ARCHITECTURE CONTENT');
  f.mutate(data => data.sources.push({ id: 'src_unused', path: 'unrelated.txt', startLine: 1, endLine: 1 }));
  const prepared = prepareBuild({ input: f.input, repositoryRoot: f.root, output: f.output });
  assert.ok(prepared.artifacts[0].architecture.sources.some(source => source.id === 'src_unused'));
  assert.ok(prepared.artifacts[0].snippets.every(snippet => !snippet.sourceIds.includes('src_unused')));
  assert.equal(JSON.stringify(prepared.artifacts[0].snippets).includes('NOT ARCHITECTURE CONTENT'), false);
});

test('pipeline reports file-level evidence warnings and fatal stale bounds or malformed UTF-8', t => {
  const f = fixture(t), relative = 'examples/a-sync/sources/command.py.txt';
  f.mutate(data => { const source = data.sources[0]; delete source.startLine; delete source.endLine; });
  const docs = path.join(f.input, 'docs/execution.md'); writeFileSync(docs, readFileSync(docs, 'utf8').replace('../sources/command.py.txt#L2', '../sources/command.py.txt'));
  const options = { input: f.input, repositoryRoot: f.root, output: f.output };
  const prepared = prepareBuild(options); assert.match(prepared.diagnostics[0].message, /File-level evidence/);
  const cli = spawnSync(process.execPath, [path.join(repositoryRoot, 'builder/cli.mjs'), 'build', '--input', f.input, '--repository-root', f.root, '--output', f.output], { encoding: 'utf8' });
  assert.equal(cli.status, 0); assert.match(cli.stderr, /warning:source/); assert.equal(existsSync(f.output), true);
  writeFileSync(path.join(f.root, relative), Buffer.from([0xff]));
  assert.throws(() => prepareBuild(options), error => error.diagnostics.some(issue => /UTF-8/.test(issue.message)));
});

test('simple underscore emphasis does not change plain source symbols', () => {
  const document = dom(render('# Text\nrun_refresh and read_state stay plain. _emphasis_ and __strong__.').html);
  assert.match(document.querySelector('p').textContent, /run_refresh and read_state/);
  assert.equal(document.querySelector('em').textContent, 'emphasis'); assert.equal(document.querySelector('strong').textContent, 'strong');
});

test('unreadable source produces an error without embedding content', { skip: process.getuid?.() === 0 || process.platform === 'win32' }, t => {
  const f = sourceFixture(t, 'private content'), file = path.join(f.root, 'sample.txt');
  chmodSync(file, 0);
  try {
    const result = f.processor.extract([source('src_unreadable', 1, 1)]);
    assert.equal(result.snippets.length, 0); assert.equal(result.diagnostics[0].severity, 'error'); assert.match(result.diagnostics[0].message, /unreadable/);
  } finally { chmodSync(file, 0o600); }
});
