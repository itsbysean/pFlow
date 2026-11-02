import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { parseHTML } from 'linkedom';
import { prepareBuild, BuildError } from '../builder/pipeline.mjs';
import { generateHTML, serializeEmbeddedData, writeStandaloneHTML } from '../builder/html.mjs';
import { repositoryRoot } from './support/validate-artifact.mjs';
function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), 'pflow-html-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  cpSync(path.join(repositoryRoot, 'examples/a-sync'), path.join(root, 'examples/a-sync'), { recursive: true });
  return { root, output: path.join(root, 'architecture.html'), prepare() { return prepareBuild({ input: root, output: this.output }); } };
}
const payload = html => JSON.parse(parseHTML(html).document.getElementById('pflow-data').textContent);

test('all Viewer resources and processed content are embedded with restrictive hashes', t => {
  const f = fixture(t), prepared = f.prepare(), html = generateHTML(prepared), document = parseHTML(html).document;
  assert.equal(document.querySelectorAll('script[src],link,[src],[srcset]').length, 0);
  assert.equal(document.querySelectorAll('style').length, 1); assert.equal(document.querySelectorAll('script').length, 2);
  assert.match(document.querySelector('meta[http-equiv="Content-Security-Policy"]').content, /script-src 'sha256-/);
  assert.doesNotMatch(document.querySelector('meta[http-equiv="Content-Security-Policy"]').content, /unsafe-inline|unsafe-eval|\bself\b/);
  assert.equal(html.includes(prepared.inputRoot), false); assert.equal(html.includes(prepared.repositoryRoot), false); assert.equal(html.includes(prepared.outputPath), false);
  const embedded = payload(html)[0];
  assert.deepEqual(embedded.architecture, prepared.artifacts[0].architecture);
  assert.deepEqual(embedded.snippets, prepared.artifacts[0].snippets);
  assert.deepEqual(embedded.documents, prepared.artifacts[0].documents);
  assert.equal(embedded.title, 'Refresh architecture');
  assert.equal(embedded.key, 'examples/a-sync/architecture.json');
});

test('data serialization round-trips closing tags, HTML comments, quotes and Unicode', () => {
  const value = { special: '</script><script>alert("X")</script><!-- & > café 日本語 \u2028\u2029', nested: ['</StYlE>', '\\', '"'] };
  const serialized = serializeEmbeddedData(value);
  assert.doesNotMatch(serialized, /[<>&\u2028\u2029]/); assert.deepEqual(JSON.parse(serialized), value);
});

test('HTML is byte-identical across repeated builds, output names and relocated repositories', t => {
  const first = fixture(t), second = fixture(t);
  const html = generateHTML(first.prepare()); assert.equal(generateHTML(first.prepare()), html);
  assert.equal(generateHTML(second.prepare()), html);
  writeStandaloneHTML(first.prepare()); const bytes = readFileSync(first.output);
  writeStandaloneHTML(first.prepare()); assert.deepEqual(readFileSync(first.output), bytes);
  assert.deepEqual(readdirSync(first.root).sort(), ['architecture.html', 'examples']);
});

test('missing Viewer assets and invalid inputs do not replace an existing output or leave partial state', t => {
  const f = fixture(t), assets = path.join(f.root, 'tool-assets');
  cpSync(path.join(repositoryRoot, 'viewer'), assets, { recursive: true }); rmSync(path.join(assets, 'diagram.js'));
  writeFileSync(f.output, 'previous output');
  assert.throws(() => writeStandaloneHTML(f.prepare(), { viewerRoot: assets }), error => error instanceof BuildError && error.diagnostics.some(item => item.artifact === 'diagram.js' && /missing/.test(item.message)));
  assert.equal(readFileSync(f.output, 'utf8'), 'previous output');
  assert.ok(!readdirSync(f.root).some(name => name.startsWith('.pflow-')));
  writeFileSync(path.join(f.root, 'examples/a-sync/architecture.json'), '{ invalid');
  const result = spawnSync(process.execPath, [path.join(repositoryRoot, 'builder/cli.mjs'), 'build', '--input', f.root, '--output', f.output], { encoding: 'utf8' });
  assert.equal(result.status, 1); assert.equal(result.stdout, ''); assert.match(result.stderr, /Invalid JSON/);
  assert.equal(readFileSync(f.output, 'utf8'), 'previous output');
});

test('trusted template cannot introduce external assets and cannot be overwritten as output', t => {
  const f = fixture(t), assets = path.join(f.root, 'tool-assets'); cpSync(path.join(repositoryRoot, 'viewer'), assets, { recursive: true });
  const template = path.join(assets, 'index.html');
  writeFileSync(template, readFileSync(template, 'utf8').replace('</body>', '<img src="https://example.invalid/image.png"></body>'));
  assert.throws(() => generateHTML(f.prepare(), { viewerRoot: assets }), /Build input preparation failed/);
  const prepared = f.prepare(); prepared.outputPath = template;
  assert.throws(() => writeStandaloneHTML(prepared, { viewerRoot: assets }), error => error.diagnostics.some(item => /overwrite an input/.test(item.message)));
});

test('failed output commit cleans temporary state and leaves the prior directory intact', t => {
  const f = fixture(t), prepared = f.prepare();
  rmSync(f.root, { recursive: true });
  assert.throws(() => writeStandaloneHTML(prepared), BuildError);
  assert.equal(existsSync(f.output), false);
});
