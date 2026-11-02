import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { performance } from 'node:perf_hooks';
const context = vm.createContext({});
vm.runInContext(readFileSync(new URL('../viewer/markdown-search.js', import.meta.url), 'utf8'), context);
vm.runInContext(readFileSync(new URL('../viewer/sample-documents.js', import.meta.url), 'utf8'), context);
const { buildMarkdownSearchIndex: build, createMarkdownSearcher: create, searchHighlightRanges: ranges } = context.pFlow;
const doc = (markdown, path = 'execution.md', bundleId = 'sample') => ({ markdown, path, bundleId });
const search = markdown => create(build([doc(markdown)]));
const plain = value => JSON.parse(JSON.stringify(value));

test('actual Markdown body is searchable across every embedded bundle and index document', () => {
  const payload = Object.entries(context.pFlowDocuments).flatMap(([bundleId, docs]) => Object.entries(docs).map(([path, markdown]) => doc(markdown, path, bundleId)));
  const engine = create(build(payload));
  assert.equal(engine.documentCount, 6);
  for (const [bundleId, docs] of Object.entries(context.pFlowDocuments)) {
    for (const [path, markdown] of Object.entries(docs)) {
      const title = markdown.match(/^# (.+)$/m)[1];
      assert.ok(engine.search(title, 100).results.some(item => item.bundleId === bundleId && item.path === path));
    }
  }
  assert.ok(engine.search('acknowledg', 100).results.some(item => item.bundleId === 'b-async'));
});

test('exact document title outranks heading, which outranks body, with stable document order', () => {
  const payload = [doc('# Other\n## Payment\nHeading prose', 'b.md'), doc('# Body\nPayment processing details', 'a.md'), doc('# Payment\nOverview', 'z.md')];
  const engine = create(build(payload));
  assert.deepEqual(plain(engine.search('PAYMENT').results.map(item => [item.path, item.category])), [['z.md', 'title'], ['b.md', 'heading'], ['a.md', 'body']]);
  assert.deepEqual(plain(build(payload)), plain(build([...payload].reverse())));
});

test('Unicode, normalization, case folding, partial words, and multiple AND terms', () => {
  const engine = search('# Pipeline\n<a id="node_unicode"></a>\n## Straße\nCAFÉ Ελληνικά 日本語 Привет 상태 처리');
  for (const query of ['STRASSE', 'cafe\u0301', 'ΕΛΛΗΝΙΚΆ', '本語', 'ПРИВ', '상태 처', 'ＰＩＰＥＬＩＮＥ café']) assert.equal(engine.search(query).total, 1, query);
  assert.equal(engine.search('café nonexistent').total, 0);
  assert.equal(engine.search('?! <>').total, 0);
  assert.equal(engine.search('CAF café').total, 1);
});

test('literal sections own prose once; title-only matches and repeated terms do not multiply results', () => {
  const engine = search('# Shared title\nIntro.\n<a id="flow_root"></a>\n## Execution\nShared action\nShared action\n<a id="node_child"></a>\n### Condition\nShared branch\n#### Outcome\nShared return');
  const found = engine.search('shared shared');
  assert.equal(found.total, 3);
  assert.equal(new Set(found.results.map(item => item.sectionId)).size, 3);
  assert.equal(engine.search('title').total, 1);
  assert.equal(engine.search('branch return').results[0].sectionId, 'node_child');
  assert.equal(engine.search('action branch').total, 0);
  assert.equal(engine.search('action').results[0].preview, 'Shared action');
});

test('Markdown syntax, anchor IDs, source IDs, destinations and fenced examples are excluded', () => {
  const engine = search('# **Runtime**\n<a id="flow_secretanchor"></a>\n## _Execution_\nUse `input_rules` with [connector](https://secreturl.invalid). Evidence [src_secretid].\n[src_secretid]: secretpath#L1\n```txt\nsecretexample\n```\n<!-- secretcomment -->\n<script>secretscript</script>');
  for (const query of ['Runtime', 'Execution', 'input_rules', 'connector', 'Evidence']) assert.equal(engine.search(query).total, 1, query);
  for (const query of ['secretanchor', 'secreturl', 'secretid', 'secretpath', 'secretexample', 'secretcomment', 'secretscript']) assert.equal(engine.search(query).total, 0, query);
});

test('missing, empty and non-Markdown documents are skipped; duplicate identities are explicit', () => {
  const item = doc('# Only title');
  const index = build([null, {}, doc(''), doc('   '), doc(undefined), doc('data', 'data.json'), item, item]);
  assert.equal(index.documents.length, 1);
  assert.equal(create(index).search('only title').total, 1);
  assert.throws(() => build([item, doc('Different')]), /Conflicting Markdown/);
  assert.equal(create(build([])).search('anything').total, 0);
  assert.equal(create(build([item, doc(item.markdown, 'execution.md', 'other')])).search('title').total, 2);
});

test('precomputed indexes survive JSON round trips and queries leave them unchanged', () => {
  const index = plain(build([doc('# Test\nBody text')]));
  const before = JSON.stringify(index), engine = create(index);
  for (let i = 0; i < 20; i++) assert.equal(engine.search('body').total, 1);
  assert.equal(JSON.stringify(index), before);
  assert.throws(() => create({ ...index, version: 2 }), /Unsupported/);
  assert.throws(() => create({ ...index, sections: [{ ...index.sections[0], document: 99 }] }), /metadata/);
  assert.throws(() => create({ ...index, postings: { bad: { title: [9], heading: [], body: [] } } }), /postings/);
});

test('highlight offsets preserve original Unicode graphemes and merge overlapping hits', () => {
  for (const [text, term, expected] of [['Straße', 'ss', 'ß'], ['Cafe\u0301', 'é', 'e\u0301'], ['oﬃce', 'ffi', 'ﬃ'], ['日本語', '本', '本']]) {
    const found = ranges(text, [term]); assert.equal(found.length, 1); assert.equal(text.slice(found[0].start, found[0].end), expected);
  }
  assert.deepEqual(plain(ranges('transfer', ['trans', 'ansfer'])), [{ start: 0, end: 8 }]);
});

test('previews reveal late matches, preserve source text and limit result count', () => {
  const engine = search('# Long\n' + 'Routine context. '.repeat(100) + 'Critical acknowledgement arrives. ' + 'Afterwards. '.repeat(30));
  const found = engine.search('acknowledg').results[0];
  assert.match(found.preview, /acknowledgement/); assert.ok(found.preview.length <= 205); assert.ok(found.preview.startsWith('…'));
  assert.equal(found.preview.slice(found.highlights.preview[0].start, found.highlights.preview[0].end), 'acknowledg');
  const many = create(build(Array.from({ length: 30 }, (_, i) => doc('# Shared\nContent', `${i}.md`))));
  assert.equal(many.search('content').total, 30); assert.equal(many.search('content').results.length, 20);
});

test('representative corpus builds once and supports repeated deterministic queries', t => {
  const payload = Array.from({ length: 500 }, (_, i) => doc(`# Document ${i}\n<a id="flow_item${i}"></a>\n## Execution ${i}\nProducer publishes message ${i} after validation.\n<a id="node_item${i}"></a>\n### Outcome\nConsumer acknowledges message ${i}.`, `${i}.md`));
  const started = performance.now(), index = build(payload), built = performance.now(), engine = create(index);
  for (let i = 0; i < 25; i++) { const found = engine.search('consumer acknowledges'); assert.equal(found.total, 500); assert.equal(found.results.length, 20); }
  t.diagnostic(`500 documents, 1500 sections: build ${(built - started).toFixed(1)} ms; 25 queries ${(performance.now() - built).toFixed(1)} ms`);
});
