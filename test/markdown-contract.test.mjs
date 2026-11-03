import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, renameSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { repositoryRoot } from './support/validate-artifact.mjs';
import { validateDocumentation } from './support/validate-documentation.mjs';

const names = ['a-sync', 'b-async', 'c-custom'];
const load = name => JSON.parse(readFileSync(path.join(repositoryRoot, 'examples', name, 'architecture.json'), 'utf8'));
for (const name of names) {
  test(`${name}: Markdown profile, index, entity sections, and evidence links validate`, () => {
    assert.deepEqual(validateDocumentation(load(name), { docsRoot: path.join(repositoryRoot, 'examples', name, 'docs') }), []);
  });
}

function fixture(t, name = 'a-sync') {
  const sourceRoot = mkdtempSync(path.join(tmpdir(), 'pflow-markdown-'));
  const bundle = path.join(sourceRoot, 'examples', name);
  cpSync(path.join(repositoryRoot, 'examples', name), bundle, { recursive: true });
  t.after(() => rmSync(sourceRoot, { recursive: true, force: true }));
  const data = load(name);
  const docsRoot = path.join(bundle, 'docs');
  const file = path.join(docsRoot, 'execution.md');
  return {
    data, docsRoot, sourceRoot, file,
    text: () => readFileSync(file, 'utf8'),
    edit: change => writeFileSync(file, change(readFileSync(file, 'utf8'))),
    index: change => {
      const target = path.join(docsRoot, 'index.md');
      writeFileSync(target, change(readFileSync(target, 'utf8')));
    },
    check: () => validateDocumentation(data, { docsRoot, sourceRoot }),
  };
}
const reject = (f, pattern) => {
  const errors = f.check();
  assert.ok(errors.some(error => pattern.test(error.message)), JSON.stringify(errors, null, 2));
};
const documentedNode = f => f.data.flows.flatMap(flow => flow.nodes).find(node => node.docs?.length);

for (const [name, mutate, message] of [
  ['missing index', f => rmSync(path.join(f.docsRoot, 'index.md')), /Missing Markdown document/],
  ['missing Flow document', f => { f.data.flows[0].docs[0].path = 'missing.md'; }, /missing or unreadable/],
  ['missing Flow section', f => f.edit(text => text.replace(`<a id="${f.data.flows[0].id}"></a>`, '')), /Missing document anchor/],
  ['missing Node section', f => f.edit(text => text.replace(`<a id="${documentedNode(f).id}"></a>`, '')), /Missing document anchor/],
  ['invalid section ID', f => f.edit(text => text + '\n<a id="bad id"></a>\n## Invalid\n'), /Invalid section identifier/],
  ['duplicate section ID in one file', f => f.edit(text => text + `\n<a id="${f.data.flows[0].id}"></a>\n## Duplicate\n`), /duplicate section identifier/],
  ['duplicate section ID across files', f => f.index(text => text + `\n<a id="${f.data.flows[0].id}"></a>\n## Duplicate\n`), /duplicate section identifier/],
  ['unknown entity section', f => f.edit(text => text + '\n<a id="node_deadbeef"></a>\n## Unknown\n'), /Unknown section entity/],
  ['nonliteral anchor syntax', f => f.edit(text => text.replace('<a id="', "<a id='")), /Invalid section identifier/],
  ['anchor without heading', f => f.edit(text => text.replace('## Refresh command', 'Refresh command')), /followed by a heading/],
  ['entity anchor on document title', f => f.edit(text => text.replace('## Refresh command', '# Refresh command')), /cannot be the document title/],
  ['missing title', f => f.edit(text => text.replace('# Synchronous refresh', 'Synchronous refresh')), /exactly one ATX/],
  ['multiple titles', f => f.edit(text => text + '\n# Another title\n'), /exactly one ATX/],
  ['Flow missing docs', f => { delete f.data.flows[0].docs; }, /canonical entity-to-section/],
  ['Flow points to another Flow section', f => { f.data.flows[0].docs = structuredClone(f.data.flows[1].docs); }, /canonical entity-to-section/],
  ['Flow has only a whole-document link', f => { delete f.data.flows[0].docs[0].anchor; }, /canonical entity-to-section/],
  ['Node points to another Node section', f => { documentedNode(f).docs[0].anchor = f.data.flows[2].nodes[1].id; }, /canonical entity-to-section/],
  ['Node points to Flow instead of its own section', f => { documentedNode(f).docs[0].anchor = f.data.flows[2].id; }, /canonical entity-to-section/],
  ['orphan Node section', f => { delete documentedNode(f).docs; }, /no matching entity docs backlink/],
  ['Node section outside its owning Flow', f => f.edit(text => text.replace('### Validation library', '## Validation library')), /nested under its owning Flow/],
  ['Node section under a different Flow', f => {
    const n = documentedNode(f);
    const re = new RegExp(`<a id="${n.id}"></a>\\n### [^\\n]+\\n\\n[^\\n]+\\n`);
    const section = f.text().match(re)[0];
    const other = f.data.flows.find(flow => !flow.nodes.includes(n));
    const heading = `<a id="${other.id}"></a>\n## ${other.label}\n`;
    f.edit(text => text.replace(section, '').replace(heading, heading + '\n' + section));
  }, /nested under its owning Flow/],
  ['index omits a detail Flow', f => f.index(text => text.split('\n').filter(line => !line.includes(f.data.flows[2].id)).join('\n')), /Index must link to Flow/],
  ['index links to the wrong document', f => f.index(text => text.replace('execution.md#', 'index.md#')), /Missing navigation section/],
  ['index uses a generated heading slug', f => f.index(text => text.replace(f.data.flows[0].id, 'refresh-command')), /Invalid navigation target/],
  ['navigation escapes bundle', f => f.index(text => text.replace('execution.md#', '../outside.md#')), /outside the documented bundle/],
  ['navigation targets missing file', f => f.index(text => text.replace('execution.md#', 'absent.md#')), /outside the documented bundle/],
  ['navigation uses a URL', f => f.index(text => text.replace('execution.md#', 'https://example.test/execution.md#')), /Invalid navigation target/],
  ['navigation has unsupported title syntax', f => f.index(text => text.replace('execution.md#'+f.data.flows[0].id+')', 'execution.md#'+f.data.flows[0].id+' "title")')), /Unsupported navigation link syntax/],
  ['missing source definition', f => f.edit(text => text.split('\n').filter(line => !line.startsWith(`[${f.data.sources[0].id}]:`)).join('\n')), /Missing source definition/],
  ['duplicate source definition', f => f.edit(text => text + text.split('\n').find(line => line.startsWith('[src_')) + '\n'), /Duplicate source definition/],
  ['source definition path differs from JSON', f => f.edit(text => text.replace('../sources/command.py.txt#L2', '../sources/component.py.txt#L2')), /Source path does not match/],
  ['source definition range differs from JSON', f => f.edit(text => text.replace('../sources/command.py.txt#L2', '../sources/command.py.txt#L3')), /Source range does not match/],
  ['unknown source citation', f => f.edit(text => text.replace('Evidence:', 'Evidence: [src_deadbeef],')), /Unknown source citation/],
  ['unknown source definition', f => f.edit(text => text + '\n[src_deadbeef]: ../sources/command.py.txt#L2\n'), /Unknown source definition/],
  ['unused source definition', f => {
    const id = f.data.sources[0].id;
    f.edit(text => text.replace(`[${id}], `, ''));
  }, /Unused source definition/],
  ['source citation outside entity association', f => {
    const allowed = f.data.sources.find(source => !f.data.entryPoints[0].sourceIds.includes(source.id));
    f.edit(text => text.replace('Evidence:', `Evidence: [${allowed.id}],`));
  }, /not associated with section/],
  ['section has no evidence citation', f => f.edit(text => text.replace(/Evidence: \[src_[^\n]+\./, '')), /must cite associated source evidence/],
  ['source URL replaces repository evidence', f => f.edit(text => text.replace('../sources/command.py.txt#L2', 'https://example.test/source#L2')), /Invalid relative source target/],
  ['unclosed fenced example', f => f.edit(text => text + '\n```\n'), /Unclosed fenced example/],
]) test(`Markdown contract rejects ${name}`, t => {
  const f = fixture(t); mutate(f); reject(f, message);
});

test('Node documentation can be omitted without inventing a Node-owned section', t => {
  const f = fixture(t); const item = documentedNode(f);
  delete item.docs;
  const re = new RegExp(`<a id="${item.id}"></a>\\n### [^\\n]+\\n\\n[^\\n]+\\n`);
  // Keep prose/evidence as part of its enclosing Flow, but remove the owned section.
  f.edit(text => text.replace(re, match => match.replace(`<a id="${item.id}"></a>\n`, '')));
  assert.deepEqual(f.check(), []);
});

test('supporting whole-document links do not change canonical ownership', t => {
  const f = fixture(t);
  f.data.flows[0].docs.push({ path: 'index.md' });
  documentedNode(f).docs.push({ path: 'execution.md', anchor: f.data.flows[2].id });
  assert.deepEqual(f.check(), []);
});

test('renaming display titles does not affect navigation', t => {
  const f = fixture(t);
  f.edit(text => text.replace('## Read state', '## Entirely different title'));
  f.data.flows[2].label = 'Renamed display label';
  assert.deepEqual(f.check(), []);
});

test('file-level evidence has no invented source line fragment', t => {
  const f = fixture(t); const source = f.data.sources[0];
  delete source.startLine; delete source.endLine;
  f.edit(text => text.replace('../sources/command.py.txt#L2', '../sources/command.py.txt'));
  assert.deepEqual(f.check(), []);
});

test('fenced fake IDs, source citations, and links cannot create sections or definitions', t => {
  const f = fixture(t);
  f.edit(text => text + '\n~~~text\n<a id="node_fake"></a>\n## Fake\n[src_fake]\n[src_fake]: ../missing\n[Fake](missing.md#node_fake)\n~~~\n');
  assert.deepEqual(f.check(), []);
  // A fenced anchor cannot satisfy a real canonical relationship.
  const id = documentedNode(f).id;
  f.edit(text => text.replace(`<a id="${id}"></a>`, `\x60\x60\x60\n<a id="${id}"></a>\n\x60\x60\x60`));
  reject(f, /Canonical docs target does not match/);
});

test('single-line source definitions require the exact JSON range', t => {
  const f = fixture(t);
  f.edit(text => text.replace('../sources/command.py.txt#L2', '../sources/command.py.txt#L2-L2'));
  reject(f, /Source range does not match/);
});

test('a standalone evidence citation is still a citation', t => {
  const f = fixture(t);
  f.edit(text => text.replace('Evidence: ', '\n\n'));
  assert.deepEqual(f.check(), []);
});

test('source labels that differ only by case are ambiguous in Markdown', t => {
  const f = fixture(t);
  const source = f.data.sources[0];
  const duplicate = { ...source, id: `src_${source.id.slice(4).toUpperCase()}` };
  assert.notEqual(duplicate.id, source.id);
  f.data.sources.push(duplicate);
  f.data.entryPoints[0].sourceIds.push(duplicate.id);
  f.edit(text => text.replace('Evidence:', `Evidence: [${duplicate.id}],`)
    + `\n[${duplicate.id}]: ../sources/command.py.txt#L2\n`);
  reject(f, /Ambiguous source label after case folding/);
});

test('Markdown filename changes are valid when JSON and index links move together', t => {
  const f = fixture(t);
  renameSync(f.file, path.join(f.docsRoot, 'renamed.md'));
  const entities = [...f.data.entryPoints, ...f.data.flows, ...f.data.flows.flatMap(flow => [...flow.nodes, ...flow.edges])];
  for (const entity of entities) for (const doc of entity.docs ?? []) doc.path = 'renamed.md';
  const file = path.join(f.docsRoot, 'renamed.md');
  writeFileSync(file, readFileSync(file, 'utf8').replaceAll('execution.md#', 'renamed.md#'));
  f.index(text => text.replaceAll('execution.md#', 'renamed.md#'));
  assert.deepEqual(f.check(), []);
});
