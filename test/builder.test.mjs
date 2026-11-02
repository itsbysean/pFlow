import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cpSync, existsSync, linkSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArguments } from '../builder/arguments.mjs';
import { BuildError, discoverArtifacts, prepareBuild } from '../builder/pipeline.mjs';
import { validateArtifact as sharedArtifact } from '../validation/validate-artifact.mjs';
import { validateDocumentation as sharedDocumentation } from '../validation/validate-documentation.mjs';
import { repositoryRoot, validateArtifact } from './support/validate-artifact.mjs';
import { validateDocumentation } from './support/validate-documentation.mjs';

const packageVersion = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
const cli = fileURLToPath(new URL('../builder/cli.mjs', import.meta.url));
function fixture(t, names = ['a-sync']) {
  const root = mkdtempSync(path.join(tmpdir(), 'pflow-builder-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const name of names) cpSync(path.join(repositoryRoot, 'examples', name), path.join(root, 'examples', name), { recursive: true });
  const json = path.join(root, 'examples', names[0], 'architecture.json');
  return { root, json, docs: path.join(path.dirname(json), 'docs'), output: path.join(root, 'architecture.html'),
    mutate(action) { const data = JSON.parse(readFileSync(json, 'utf8')); action(data); writeFileSync(json, JSON.stringify(data)); },
    edit(action, file = 'execution.md') { const target = path.join(path.dirname(json), 'docs', file); writeFileSync(target, action(readFileSync(target, 'utf8'))); },
  };
}
const run = (args, cwd = repositoryRoot) => spawnSync(process.execPath, [cli, ...args], { cwd, encoding: 'utf8' });
function rejects(f, pattern, phase) {
  assert.throws(() => prepareBuild({ input: f.root, output: f.output }), error => error instanceof BuildError && error.diagnostics.some(item => pattern.test(item.message) && (!phase || item.phase === phase)), 'Must return a matching actionable diagnostic');
  assert.equal(existsSync(f.output), false, 'Failure must not leave output');
}

test('CLI argument parsing supports explicit paths, help and version', () => {
  assert.deepEqual(parseArguments(['build', '--output', 'folder name/view.html', '--input', 'project']), { command: 'build', output: 'folder name/view.html', input: 'project' });
  for (const args of [['--help'], ['-h'], ['build', '--help']]) assert.equal(parseArguments(args).command, 'help');
  for (const args of [['--version'], ['-v']]) assert.equal(parseArguments(args).command, 'version');
});
for (const args of [[], ['serve'], ['build'], ['build', '--input', 'x'], ['build', '--output'], ['build', '--input', '--output', 'x.html'], ['build', '--input', 'x', '--input', 'y', '--output', 'z.html'], ['build', '--input', 'x', '--output', 'x.html', '--wat'], ['--help', '--wat'], ['build', '--input', 'x\0y', '--output', 'x.html']]) {
  test(`CLI rejects incomplete or ambiguous arguments: ${JSON.stringify(args)}`, () => assert.throws(() => parseArguments(args)));
}

test('help/version work without target artifacts and bad arguments use stderr and nonzero exits', t => {
  const f = fixture(t);
  for (const option of ['--help', '--version']) {
    const result = run([option], f.root); assert.equal(result.status, 0); assert.equal(result.stderr, '');
    if(option==='--help')assert.match(result.stdout,/file:\/\//i);else assert.equal(result.stdout,`pFlow ${packageVersion}\n`);
  }
  const result = run(['build', '--wat'], f.root); assert.equal(result.status, 1); assert.equal(result.stdout, ''); assert.match(result.stderr, /Unknown option.*--wat/);
});

test('all real bundles prepare unchanged graph data and raw Markdown in stable order', t => {
  const f = fixture(t, ['c-custom', 'a-sync', 'b-async']);
  const first = prepareBuild({ input: f.root, output: f.output }), second = prepareBuild({ input: f.root, output: f.output });
  assert.deepEqual(first, second);
  assert.deepEqual(first.artifacts.map(item => item.path), ['examples/a-sync/architecture.json', 'examples/b-async/architecture.json', 'examples/c-custom/architecture.json']);
  for (const artifact of first.artifacts) {
    assert.deepEqual(artifact.architecture, JSON.parse(readFileSync(path.join(f.root, artifact.path), 'utf8')));
    assert.deepEqual(artifact.documents.map(item => item.path), ['execution.md', 'index.md']);
    for (const document of artifact.documents) assert.equal(document.markdown, readFileSync(path.join(f.root, path.dirname(artifact.path), 'docs', document.path), 'utf8'));
  }
  assert.equal(existsSync(f.output), false);
});

test('discovery recognizes the actual M1 filename, excludes metadata and does not treat other JSON as architecture', t => {
  const f = fixture(t);
  writeFileSync(path.join(f.root, 'unrelated.json'), '{not architecture');
  mkdirSync(path.join(f.root, '.git')); writeFileSync(path.join(f.root, '.git', 'architecture.json'), '{metadata');
  assert.deepEqual(discoverArtifacts(f.root).artifacts, ['examples/a-sync/architecture.json']);
  f.edit(text => text + '\nUnchanged trailing prose.\n');
  assert.ok(prepareBuild({ input: f.root, output: f.output }).artifacts[0].documents[0].markdown.endsWith('Unchanged trailing prose.\n'));
});

test('an invalid nested architecture artifact is not silently ignored and diagnostics sort by artifact', t => {
  const f = fixture(t, ['c-custom', 'a-sync']);
  writeFileSync(path.join(f.root, 'examples', 'a-sync', 'architecture.json'), 'bad JSON');
  writeFileSync(path.join(f.root, 'examples', 'c-custom', 'architecture.json'), JSON.stringify({ modelVersion: 'future' }));
  let first;
  try { prepareBuild({ input: f.root, output: f.output }); } catch (error) { first = error.diagnostics; }
  assert.ok(first.length > 1); assert.equal(first[0].artifact, 'examples/a-sync/architecture.json');
  assert.ok(first.slice(1).every(item => item.artifact === 'examples/c-custom/architecture.json'));
  assert.throws(() => prepareBuild({ input: f.root, output: f.output }), error => assert.deepEqual(error.diagnostics, first) === undefined);
});

test('CLI builds offline HTML from a target checkout without node_modules', t => {
  const f = fixture(t);
  assert.equal(existsSync(path.join(f.root, 'node_modules')), false);
  const args = ['build', '--input', '.', '--output', 'architecture.html'];
  const first = run(args, f.root), second = run(args, f.root);
  assert.equal(first.status, 0); assert.equal(first.stderr, ''); assert.equal(first.stdout, second.stdout);
  assert.match(first.stdout, /prepared 1 architecture artifacts and 2 Markdown documents/);
  assert.match(first.stdout, /Wrote \d+ bytes/); assert.match(readFileSync(f.output, 'utf8'), /<!doctype html>/i);
});

test('preparation preserves existing output and successful CLI replaces it with complete HTML', t => {
  const f = fixture(t); writeFileSync(f.output, 'Existing artifact');
  prepareBuild({ input: f.root, output: f.output });
  assert.equal(readFileSync(f.output, 'utf8'), 'Existing artifact');
  assert.equal(run(['build', '--input', f.root, '--output', f.output]).status, 0);
  assert.match(readFileSync(f.output, 'utf8'), /<!doctype html>/i);
});

test('shared validators retain the exact test-wrapper behavior', t => {
  const f = fixture(t), data = JSON.parse(readFileSync(f.json, 'utf8'));
  const options = { docsRoot: f.docs, sourceRoot: f.root };
  data.flows[0].edges[0].to = 'node_absent'; writeFileSync(f.json, JSON.stringify(data));
  assert.deepEqual(sharedArtifact(data, options), validateArtifact(data, options));
  assert.deepEqual(sharedDocumentation(data, options), validateDocumentation(data, options));
  const result = run(['build', '--input', f.root, '--output', f.output]);
  assert.equal(result.status, 1); assert.equal(result.stdout, ''); assert.match(result.stderr, /examples\/a-sync\/architecture\.json \[semantic\].*\/to: Unknown node reference node_absent/);
});

for (const [name, mutate, message, phase] of [
  ['unsupported version', data => { data.modelVersion = '2.0.0'; }, /constant/, 'schema'],
  ['required field', data => { delete data.flows; }, /required property 'flows'/, 'schema'],
  ['node vocabulary', data => { data.flows[0].nodes[0].kind = 'controller'; }, /allowed values/, 'schema'],
  ['source structure', data => { delete data.sources[0].endLine; }, /endLine/, 'schema'],
  ['dangling edge', data => { data.flows[0].edges[0].to = 'node_absent'; }, /Unknown node/, 'semantic'],
  ['dangling detail', data => { data.flows[0].nodes[1].expandFlowId = 'flow_absent'; }, /Unknown expansion flow/, 'semantic'],
  ['dangling root', data => { data.entryPoints[0].flowId = 'flow_absent'; }, /Unknown flow/, 'semantic'],
  ['duplicate ID', data => { data.flows[1].nodes[0].id = data.flows[0].nodes[0].id; }, /Duplicate ID/, 'semantic'],
  ['source traversal', data => { data.sources[0].path = '../outside.txt'; }, /inside its root/, 'semantic'],
  ['doc traversal', data => { data.flows[0].docs[0].path = '../outside.md'; }, /inside its root/, 'semantic'],
  ['missing document', data => { data.flows[0].docs[0].path = 'missing.md'; }, /missing or unreadable/, 'semantic'],
  ['missing section', data => { data.flows[0].docs[0].anchor = 'flow_absent'; }, /Missing document anchor/, 'semantic'],
]) test(`build rejects ${name}`, t => { const f = fixture(t); f.mutate(mutate); rejects(f, message, phase); });

test('Markdown profile and async cross-flow validation remain in the pipeline', t => {
  const f = fixture(t, ['b-async']);
  f.mutate(data => { data.flows[0].edges.find(edge => edge.kind === 'receive').mode = 'sync'; });
  rejects(f, /must be asynchronous/, 'semantic');
  const a = fixture(t); a.edit(text => text.replace('### State service', '## State service'));
  rejects(a, /nested under its owning Flow/, 'markdown');
});

test('missing directories, required index, artifact and malformed JSON produce failures', t => {
  const f = fixture(t);
  assert.throws(() => prepareBuild({ input: path.join(f.root, 'absent'), output: f.output }), /Build input/);
  mkdirSync(path.join(f.root, 'empty'));
  const absent = run(['build', '--input', 'empty', '--output', f.output], f.root);
  assert.equal(absent.status, 1); assert.match(absent.stderr, /No architecture.json/);
  rmSync(path.join(f.docs, 'index.md')); rejects(f, /Missing Markdown document/, 'markdown');
  writeFileSync(f.json, '{ broken'); rejects(f, /Invalid JSON/, 'load');
  const bad = run(['build', '--input', f.root, '--output', f.output]); assert.equal(bad.status, 1); assert.equal(bad.stdout, ''); assert.match(bad.stderr, /Invalid JSON/);
});

test('artifact, document-root, document-file and source symlink escapes are rejected', t => {
  const outside = mkdtempSync(path.join(tmpdir(), 'pflow-outside-')); t.after(() => rmSync(outside, { recursive: true, force: true }));
  writeFileSync(path.join(outside, 'file'), 'outside');
  const f = fixture(t); rmSync(f.json); symlinkSync(path.join(outside, 'file'), f.json); rejects(f, /escapes input root/, 'discovery');
  const d = fixture(t); rmSync(d.docs, { recursive: true }); symlinkSync(outside, d.docs); rejects(d, /inside input root/, 'discovery');
  const m = fixture(t); rmSync(path.join(m.docs, 'execution.md')); symlinkSync(path.join(outside, 'file'), path.join(m.docs, 'execution.md')); rejects(m, /escapes its root/, 'semantic');
  const s = fixture(t); const source = JSON.parse(readFileSync(s.json, 'utf8')).sources[0].path; rmSync(path.join(s.root, source)); symlinkSync(path.join(outside, 'file'), path.join(s.root, source)); rejects(s, /escapes its root/, 'semantic');
});

test('discovery never traverses directory links or loops into out-of-root content', t => {
  const f = fixture(t); symlinkSync(f.root, path.join(f.root, 'recursive'));
  assert.equal(discoverArtifacts(f.root).artifacts.length, 1);
});

test('invalid output paths, output links and hard links to evidence fail without writes', t => {
  for (const name of ['result.txt', 'missing/output.html', 'folder.html']) {
    const f = fixture(t); if (name === 'folder.html') mkdirSync(path.join(f.root, name));
    const result = run(['build', '--input', f.root, '--output', path.join(f.root, name)]);
    assert.equal(result.status, 1); assert.equal(result.stdout, ''); assert.match(result.stderr, /\[output\]/);
  }
  const s = fixture(t); symlinkSync(path.join(s.docs, 'index.md'), s.output); assert.throws(() => prepareBuild({ input: s.root, output: s.output }), error => error.diagnostics.some(item => /symbolic link/.test(item.message)));
  const h = fixture(t), source = JSON.parse(readFileSync(h.json, 'utf8')).sources[0].path;
  linkSync(path.join(h.root, source), h.output);
  assert.throws(() => prepareBuild({ input: h.root, output: h.output }), error => error.diagnostics.some(item => /overwrite an input/.test(item.message)));
});

test('untrusted source and fenced Markdown are read as data and never executed', t => {
  const f = fixture(t), marker = path.join(f.root, 'executed');
  f.edit(text => text + `\n\`\`\`js\nrequire('node:fs').writeFileSync(${JSON.stringify(marker)}, 'bad');\n\`\`\`\n`);
  const prepared = prepareBuild({ input: f.root, output: f.output });
  assert.match(prepared.artifacts[0].documents[0].markdown, /writeFileSync/); assert.equal(existsSync(marker), false);
});

test('an artifact filename naming a directory fails even when other valid bundles exist', t => {
  const f = fixture(t); mkdirSync(path.join(f.root, 'architecture.json'));
  rejects(f, /regular file/, 'discovery');
});

test('a required index must be a regular file', t => {
  const f = fixture(t); rmSync(path.join(f.docs, 'index.md')); mkdirSync(path.join(f.docs, 'index.md'));
  rejects(f, /Missing Markdown document/, 'markdown');
});

test('schema version diagnostics name the supported value and terminal controls are escaped', t => {
  const f = fixture(t); f.mutate(data => { data.modelVersion = 'future'; });
  mkdirSync(path.join(f.root, 'bad\u001b[31m'));
  writeFileSync(path.join(f.root, 'bad\u001b[31m', 'architecture.json'), 'invalid');
  const result = run(['build', '--input', f.root, '--output', f.output]);
  assert.equal(result.status, 1); assert.equal(result.stdout, '');
  assert.match(result.stderr, /\/modelVersion:.*1\.0\.0/);
  assert.equal(result.stderr.includes('\u001b'), false); assert.ok(result.stderr.includes('\\u001b'));
});
