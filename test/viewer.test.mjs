import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { cpSync, existsSync, readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';
import { chromium } from 'playwright-core';
import { processMarkdown } from '../builder/markdown.mjs';
import { prepareBuild } from '../builder/pipeline.mjs';
import { writeStandaloneHTML } from '../builder/html.mjs';
import { repositoryRoot } from './support/validate-artifact.mjs';

const viewer = path.join(repositoryRoot, 'viewer');
const context = vm.createContext({});
vm.runInContext(readFileSync(path.join(viewer, 'sample-data.js'), 'utf8'), context);
vm.runInContext(readFileSync(path.join(viewer, 'sample-adapter.js'), 'utf8'), context);
vm.runInContext(readFileSync(path.join(viewer, 'sample-documents.js'), 'utf8'), context);
const runtimeFiles = ['sample-data.js', 'sample-documents.js', 'sample-adapter.js', 'graph-layout.js', 'diagram-viewport.js', 'diagram.js', 'flow-navigation.js', 'details-inspector.js', 'markdown.js', 'documentation-panel.js', 'search-navigation.js', 'layout.js', 'viewer.js', 'markdown-search.js', 'search.js'];
const samples = JSON.parse(JSON.stringify(context.pFlowSamples));
let browser;
before(async () => {
  const candidates = [process.env.PFLOW_BROWSER_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'].filter(Boolean);
  const executablePath = candidates.find(candidate => existsSync(candidate));
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
});
after(async () => { await browser?.close(); });

async function open(t, width = 1440, file = path.join(viewer, 'index.html')) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  page.setDefaultTimeout(5000);
  const errors = []; const remoteRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => { if (/^https?:/.test(request.url())) remoteRequests.push(request.url()); });
  await page.route(/^https?:/, route => route.abort());
  t.after(async () => {
    assert.deepEqual(remoteRequests, [], 'Viewer must not request network resources');
    assert.deepEqual(errors, [], 'Viewer must initialize without browser errors');
    await page.close();
  });
  await page.goto(pathToFileURL(file).href);
  return page;
}

async function selectBundle(page, key) {
  await page.locator(`.entry-button[data-bundle-key="${key}"]`).first().click();
}
async function inspectorEmpty(page) {
  const previous = await page.evaluateHandle(() => document.activeElement);
  await page.getByRole('tab', { name: 'Details', exact: true }).click();
  const visible = await page.locator('#inspector-empty').isVisible();
  await page.getByRole('tab', { name: 'Documentation', exact: true }).click();
  await previous.evaluate(el => el?.focus({preventScroll:true}));
  return visible;
}

test('offline diagram and Markdown snapshots match the approved M1 artifacts', () => {
  for (const sample of samples) {
    const actual = JSON.parse(readFileSync(path.join(repositoryRoot, 'examples', sample.key, 'architecture.json'), 'utf8'));
    assert.deepEqual(sample.architecture, actual);
    for (const name of ['index.md', 'execution.md']) assert.equal(context.pFlowDocuments[sample.key][name], readFileSync(path.join(repositoryRoot, 'examples', sample.key, 'docs', name), 'utf8'));
    assert.equal(sample.preview, undefined, 'Curated descriptions/snippets are not graph evidence');
  }
});

test('three layout columns initialize locally without runtime dependencies', async t => {
  const page = await open(t);
  for (const region of [page.getByRole('banner'), page.getByRole('navigation', { name: 'Process starts' }), page.getByRole('region', { name: 'Refresh command' }), page.getByRole('region', { name: 'Documentation and evidence' })]) {
    assert.equal(await region.isVisible(), true);
  }
  assert.equal(await page.title(), 'pFlow — Synchronous refresh');
  assert.equal(await inspectorEmpty(page), true);
  assert.equal(await page.locator('.doc-target').getAttribute('id'), samples[0].architecture.flows[0].id);
  assert.equal(await page.locator('#diagram-container svg').count(), 1);
  assert.equal(await page.locator('#diagram-container canvas').count(), 0);
  assert.equal(await page.getByRole('combobox', { name: 'Search documentation' }).isVisible(), true);
  assert.deepEqual(await page.locator('script[src]').evaluateAll(items => items.map(item => item.getAttribute('src'))), runtimeFiles);
  const pkg = JSON.parse(readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8'));
  assert.deepEqual(pkg.dependencies || {}, {});
  assert.match(await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content'), /connect-src 'none'/);
});

test('process starts populate each artifact from actual M1 data', async t => {
  const page = await open(t);
  for (const sample of samples) {
    await selectBundle(page, sample.key);
    assert.equal(await page.locator(`.entry-group[data-bundle-key="${sample.key}"] .entry-button`).count(), sample.architecture.entryPoints.length);
    assert.deepEqual(await page.locator(`.entry-group[data-bundle-key="${sample.key}"] .group-heading > span:nth-child(2)`).allTextContents(), [...new Set(sample.architecture.entryPoints.map(entry => entry.trigger))]);
    assert.equal(await inspectorEmpty(page), true);
    assert.equal(await page.locator('.doc-target').getAttribute('id'), sample.architecture.entryPoints[0].flowId);
    assert.equal(await page.locator('#document-status').textContent(), '');
  }
});

test('the same assets also initialize when inlined into one offline HTML file', async t => {
  // Fixed-asset compatibility check, not an architecture Builder or export tool.
  const temp = mkdtempSync(path.join(tmpdir(), 'pflow-single-file-'));
  t.after(() => rmSync(temp, { recursive: true, force: true }));
  let html = readFileSync(path.join(viewer, 'index.html'), 'utf8');
  const css = readFileSync(path.join(viewer, 'viewer.css'), 'utf8');
  const hash = text => `'sha256-${createHash('sha256').update(text).digest('base64')}'`;
  html = html.replace('<link rel="stylesheet" href="viewer.css">', () => `<style>${css}</style>`);
  const scriptHashes = [];
  for (const file of runtimeFiles) {
    const script = readFileSync(path.join(viewer, file), 'utf8');
    scriptHashes.push(hash(script));
    html = html.replace(`<script src="${file}" defer></script>`, '');
    // Run after the layout exists, matching the source preview's deferred scripts.
    html = html.replace('</body>', () => `<script>${script}</script>\n</body>`);
  }
  html = html.replace("script-src 'self'", `script-src ${scriptHashes.join(' ')}`)
    .replace("style-src 'self'", `style-src ${hash(css)}`);
  const file = path.join(temp, 'preview.html'); writeFileSync(file, html);
  const page = await open(t, 1440, file);
  assert.equal(await page.locator('script[src], link[rel="stylesheet"]').count(), 0);
  assert.equal(await page.locator('.doc-target').getAttribute('id'), samples[0].architecture.flows[0].id);
  assert.equal(await page.locator('#workspace').evaluate(el => getComputedStyle(el).display), 'flex');
});

test('group labels are data-derived and repeated custom triggers share a group', async t => {
  const page = await open(t);
  await page.evaluate(() => {
    const sample = structuredClone(pFlowSamples[1]);
    sample.architecture.entryPoints[0].trigger = 'Legacy lookup table / replay';
    sample.architecture.entryPoints[1].trigger = 'Legacy lookup table / replay';
    sample.architecture.entryPoints.push({ ...sample.architecture.entryPoints[0], id: 'entry_b0d72', label: 'Another executable boundary', trigger: '' });
    pFlow.initializeSample(sample);
  });
  assert.deepEqual(await page.locator('.entry-group[data-bundle-key="b-async"] .group-heading > span:nth-child(2)').allTextContents(), ['Legacy lookup table / replay', 'Trigger not recorded']);
  assert.deepEqual(await page.locator('.entry-group[data-bundle-key="b-async"] .group-heading .count').allTextContents(), ['2', '1']);
});

test('entry selection displays its root and clears the inspector', async t => {
  const page = await open(t);
  await selectBundle(page, 'b-async');
  const node = await page.locator('#node-name').textContent();
  const buttons = page.locator('.entry-button[data-bundle-key="b-async"]');
  await buttons.nth(1).focus(); await page.keyboard.press('Enter');
  assert.deepEqual(await buttons.evaluateAll(items => items.map(item => item.getAttribute('aria-pressed'))), ['false', 'true']);
  assert.equal(await page.locator('#workspace-title').textContent(), 'Process job');
  assert.equal(await page.locator('.diagram-node').count(), 3);
  assert.equal(await page.locator('#node-name').textContent(), node);
});

test('documentation tabs support pointer and keyboard selection', async t => {
  const page = await open(t);
  await page.getByRole('tab', { name: 'Documentation', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.getByRole('tab', { name: 'Evidence references', exact: true }).getAttribute('aria-selected'), 'true');
  assert.equal(await page.locator('#view-documentation').isVisible(), false);
  assert.match(await page.locator('#source-unavailable').textContent(), /Evidence text is not embedded/);
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.getByRole('tab', { name: 'Process summary' }).getAttribute('aria-selected'), 'true');
  await page.getByRole('tab', { name: 'Documentation', exact: true }).click();
  assert.equal(await page.locator('[role="tabpanel"]:visible').count(), 1);
});

test('empty and loading states replace the sample presentation', async t => {
  const page = await open(t);
  await page.evaluate(() => pFlow.initializeSample({ title: 'Empty architecture', architecture: { modelVersion: '1.0.0', entryPoints: [], flows: [], sources: [] } }));
  assert.equal(await page.locator('.entry-button').count(), 0);
  assert.equal(await page.locator('#workspace-state-title').textContent(), 'No process flows documented');
  assert.equal(await page.locator('#inspector-content').isVisible(), false);
  assert.equal(await inspectorEmpty(page), true);
  await page.getByRole('tab', { name: 'Evidence references', exact: true }).click();
  assert.match(await page.locator('#source-unavailable').textContent(), /No evidence reference/);
  await page.evaluate(() => pFlow.setWorkspaceState('loading'));
  assert.equal(await page.locator('#diagram-container').getAttribute('aria-busy'), 'true');
  assert.equal(await page.locator('#workspace-state-title').textContent(), 'Preparing the workspace');
  await page.evaluate(() => pFlow.initializeSample(pFlowSamples[0]));
  assert.equal(await page.locator('#diagram-container').getAttribute('aria-busy'), 'false');
});

for (const width of [1440, 1100, 900, 640]) {
  test(`layout stays within a ${width}px viewport with no overlapping panels`, async t => {
    const page = await open(t, width);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const boxes = await page.locator('.app-layout > .panel').evaluateAll(items => items.map(item => {
      const box = item.getBoundingClientRect(); return { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height };
    }));
    for (const box of boxes) { assert.ok(box.width > 0 && box.height > 0); assert.ok(box.left >= 0 && box.right <= width); }
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      assert.equal(a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top, false);
    }
  });
}

test('sample content is rendered as text rather than interpreted markup', async t => {
  const page = await open(t);
  await page.evaluate(() => {
    const sample = structuredClone(pFlowSamples[0]);
    sample.architecture.entryPoints[0].label = '<img src="https://example.invalid/tracker">';
    sample.architecture.flows[0].nodes[0].label = '<script>throw new Error("executed")</script>';
    pFlow.initializeSample(sample);
  });
  assert.equal(await page.locator('.entry-button img, #node-description script').count(), 0);
  assert.match(await page.locator('.entry-button[data-bundle-key="a-sync"]').textContent(), /<img/);
});

test('SVG categories and directed edges remain intact during conditional-node selection', async t => {
  const page = await open(t);
  await page.getByLabel('Displayed flow').selectOption({ label: 'Read state' });
  assert.equal(await page.locator('.diagram-node').count(), 6);
  assert.equal(await page.locator('.diagram-edge').count(), 5);
  assert.equal(await page.locator('.node-condition polygon').count(), 1);
  const fills = await page.locator('.diagram-node-shape').evaluateAll(items => items.map(item => getComputedStyle(item).fill));
  assert.equal(new Set(fills).size, 4);
  assert.equal(await page.locator('.node-system path.diagram-node-shape').count(), 1);
  assert.equal(await page.locator('.node-terminal rect.diagram-node-shape').count(), 2);
  assert.match((await page.locator('.node-library').getAttribute('aria-label')), /input_rules/);
  assert.match((await page.locator('.node-system').getAttribute('aria-label')), /state.py.txt:6/);
  assert.deepEqual((await page.locator('.diagram-edge-label.edge-branch text').allTextContents()).sort(), ['invalid', 'valid']);
  const edges = await page.locator('.diagram-edge-path').evaluateAll(items => items.map(item => ({ arrow: item.getAttribute('marker-end'), dash: getComputedStyle(item).strokeDasharray, stroke: getComputedStyle(item).stroke })));
  assert.ok(edges.every(item => item.arrow?.startsWith('url(#pflow-diagram-')));
  assert.ok(new Set(edges.map(item => item.dash)).size >= 3);
  await page.locator('.node-condition .diagram-node-select').click();
  assert.equal(await page.locator('#node-name').textContent(), 'Input valid?');
  assert.equal(await page.locator('.diagram-node[tabindex], .diagram-node a').count(), 0);
});

test('async SVG uses a dashed transfer and the verified cross-flow target only', async t => {
  const page = await open(t);
  await selectBundle(page, 'b-async');
  assert.equal(await page.locator('.diagram-node').count(), 4);
  const stub = page.locator('.diagram-node[data-boundary="true"]');
  assert.equal(await stub.count(), 1);
  assert.match(await stub.getAttribute('aria-label'), /Target Flow: Process job/);
  assert.match(await stub.locator('.diagram-node-type').textContent(), /Cross-flow/);
  const async = page.locator('.diagram-edge.mode-async');
  const end = await async.getAttribute('data-to');
  assert.equal(end, await stub.getAttribute('data-node-id'));
  assert.notEqual(await async.locator('.diagram-edge-path').evaluate(item => getComputedStyle(item).strokeDasharray), 'none');
  assert.match(await page.locator('.diagram-edge-label.mode-async title').textContent(), /async/);
  assert.equal(await page.locator('.diagram-node').filter({ hasText: 'Write message' }).count(), 0);
  await page.getByLabel('Displayed flow').selectOption({ label: 'Process job' });
  assert.equal(await page.locator('.diagram-node[data-boundary="true"]').count(), 0);
  assert.equal(await page.locator('.diagram-node').count(), 3);
});

test('zoom buttons, 100% reset, pointer pan, keyboard pan, and fit affect the SVG viewport', async t => {
  const page = await open(t);
  const transform = () => page.locator('.diagram-scene').getAttribute('transform');
  const percent = async () => Number((await page.locator('#zoom-level').textContent()).replace('%', ''));
  const initial = await percent();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  assert.ok(await percent() > initial);
  await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  assert.ok(Math.abs(await percent() - initial) <= 1);
  await page.getByRole('button', { name: 'Reset zoom', exact: true }).click();
  assert.equal(await percent(), 100);
  const before = await transform();
  const box = await page.locator('.diagram-svg').boundingBox();
  await page.mouse.move(box.x + 30, box.y + 30); await page.mouse.down();
  await page.mouse.move(box.x + 90, box.y + 70); await page.mouse.up();
  const panned = await transform(); assert.notEqual(panned, before);
  await page.locator('.diagram-svg').focus(); await page.keyboard.press('ArrowLeft');
  assert.notEqual(await transform(), panned);
  await page.getByRole('button', { name: 'Fit view', exact: true }).click();
  const fitted = await page.locator('.diagram-scene').boundingBox();
  assert.ok(fitted.x >= box.x - .5 && fitted.y >= box.y - .5);
  assert.ok(fitted.x + fitted.width <= box.x + box.width + .5);
  assert.ok(fitted.y + fitted.height <= box.y + box.height + .5);
  await page.setViewportSize({ width: 900, height: 900 });
  await page.waitForFunction(() => {
    const root = document.querySelector('.diagram-svg'), scene = document.querySelector('.diagram-scene');
    const a = root.getBoundingClientRect(), b = scene.getBoundingClientRect();
    return b.left >= a.left - 1 && b.right <= a.right + 1 && b.top >= a.top - 1 && b.bottom <= a.bottom + 1;
  });
});

test('invalid endpoints remove the previous SVG and present a recoverable error', async t => {
  const page = await open(t);
  await page.evaluate(() => {
    const sample = structuredClone(pFlowSamples[0]); sample.architecture.flows[0].edges[0].to = 'node_absent';
    pFlow.initializeSample(sample);
  });
  assert.equal(await page.locator('.diagram-svg').count(), 0);
  assert.equal(await page.locator('#workspace-state-title').textContent(), 'Cannot render this flow');
  assert.match(await page.locator('#workspace-state-message').textContent(), /Unknown edge endpoint/);
  assert.equal(await page.getByRole('button', { name: 'Zoom in', exact: true }).isDisabled(), true);
  await selectBundle(page, 'c-custom');
  assert.equal(await page.locator('.diagram-svg').count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Zoom in', exact: true }).isEnabled(), true);
});

test('cyclic and unresolved SVG nodes render safely with full accessible labels', async t => {
  const page = await open(t);
  await page.evaluate(() => {
    const sample = structuredClone(pFlowSamples[0]);
    const flow = sample.architecture.flows[0];
    flow.nodes = flow.nodes.slice(0, 2);
    flow.nodes[1].kind = 'unresolved'; delete flow.nodes[1].expandFlowId;
    flow.nodes[1].label = 'Runtime target unavailable / ' + '状態処理'.repeat(30);
    flow.edges = [flow.edges[0], { ...flow.edges[0], id: 'edge_feedback', from: flow.nodes[1].id, to: flow.nodes[0].id, kind: 'next' }];
    // The synthetic case has a proven local continuation; it does not name a dynamic target.
    pFlow.initializeSample(sample);
  });
  assert.equal(await page.locator('.diagram-node').count(), 2);
  assert.equal(await page.locator('.diagram-edge').count(), 2);
  const unknown = page.locator('.node-unresolved');
  assert.match(await unknown.getAttribute('aria-label'), /状態処理/);
  assert.match(await unknown.locator('.diagram-node-name').textContent(), /…/);
  assert.ok((await unknown.locator('.diagram-node-name tspan').evaluateAll(items => items.map(item => item.getComputedTextLength()))).every(length => length <= 196));
  assert.notEqual(await unknown.locator('.diagram-node-shape').evaluate(item => getComputedStyle(item).strokeDasharray), 'none');
});

test('a 300-node cyclic diagram produces all SVG elements and a finite fitted viewport', async t => {
  const page = await open(t);
  await page.evaluate(() => {
    const sample = structuredClone(pFlowSamples[0]);
    const sourceIds = [sample.architecture.sources[0].id];
    const nodes = Array.from({ length: 300 }, (_, i) => ({ id: `node_render${i}`, kind: 'operation', label: `Step ${i}`, sourceIds }));
    const edges = nodes.slice(1).map((node, i) => ({ id: `edge_render${i}`, from: nodes[i].id, to: node.id, kind: 'next', mode: 'sync', sourceIds }));
    edges.push({ ...edges[0], id: 'edge_renderback', from: nodes[299].id, to: nodes[100].id });
    sample.architecture.entryPoints = [];
    sample.architecture.flows = [{ id: 'flow_render', label: 'Large synthetic execution', startNodeId: nodes[0].id, nodes, edges }];
    pFlow.initializeSample(sample);
  });
  assert.equal(await page.locator('.diagram-node').count(), 300);
  assert.equal(await page.locator('.diagram-edge').count(), 300);
  assert.doesNotMatch(await page.locator('.diagram-scene').getAttribute('transform'), /NaN|Infinity/);
  const root = await page.locator('.diagram-svg').boundingBox(), scene = await page.locator('.diagram-scene').boundingBox();
  assert.ok(scene.x >= root.x - 1 && scene.y >= root.y - 1 && scene.x + scene.width <= root.x + root.width + 1 && scene.y + scene.height <= root.y + root.height + 1);
});

const detailButton = (page, label) => page.getByRole('button', { name: new RegExp(`^Open detail for ${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:`) });
const crumbs = page => page.getByRole('navigation', { name: 'Flow breadcrumbs' }).getByRole('button');

test('detail clicks traverse actual levels and Back/Forward/Root preserve the caller trail', async t => {
  const page = await open(t);
  const inspector = await page.locator('#node-name').textContent();
  await detailButton(page, 'Invoke refresh component').click();
  assert.equal(await page.locator('#workspace-title').textContent(), 'Refresh component');
  assert.deepEqual(await crumbs(page).allTextContents(), ['Refresh command', 'Refresh component']);
  assert.match(await page.locator('#workspace-description').textContent(), /via Invoke refresh component/);
  assert.equal(await page.locator('.diagram-node').count(), 4);
  await detailButton(page, 'Invoke read_state').click();
  assert.equal(await page.locator('#workspace-title').textContent(), 'Read state');
  assert.deepEqual(await crumbs(page).allTextContents(), ['Refresh command', 'Refresh component', 'Read state']);
  assert.equal(await page.locator('.diagram-node').count(), 6);
  assert.equal(await page.locator('#node-name').textContent(), inspector);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  assert.equal(await page.locator('#workspace-title').textContent(), 'Refresh component');
  await page.getByRole('button', { name: 'Forward', exact: true }).click();
  assert.equal(await page.locator('#workspace-title').textContent(), 'Read state');
  await page.getByRole('button', { name: 'Top level: return to first flow in this path' }).click();
  assert.equal(await page.locator('#workspace-title').textContent(), 'Refresh command');
  assert.equal(await page.getByRole('button', { name: 'Back', exact: true }).isDisabled(), true);
  await page.getByRole('button', { name: 'Forward', exact: true }).click();
  assert.equal(await page.locator('#workspace-title').textContent(), 'Refresh component');
  await page.getByRole('navigation', { name: 'Process starts' }).getByRole('button', { name: 'Refresh command', exact: true }).click();
  assert.deepEqual(await crumbs(page).allTextContents(), ['Refresh command']);
  assert.equal(await page.getByRole('button', { name: 'Forward', exact: true }).isDisabled(), true);
});

test('breadcrumbs are actionable and retain Forward navigation to the visited descendant', async t => {
  const page = await open(t);
  await detailButton(page, 'Invoke refresh component').click(); await detailButton(page, 'Invoke read_state').click();
  await crumbs(page).nth(1).click();
  assert.equal(await page.locator('#workspace-title').textContent(), 'Refresh component');
  assert.equal(await crumbs(page).count(), 2);
  assert.equal(await crumbs(page).last().getAttribute('aria-current'), 'page');
  assert.match(await crumbs(page).last().getAttribute('title'), /via Invoke refresh component/);
  await crumbs(page).first().click();
  assert.deepEqual(await crumbs(page).allTextContents(), ['Refresh command']);
  await page.getByRole('button', { name: 'Forward', exact: true }).click();
  await page.getByRole('button', { name: 'Forward', exact: true }).click();
  assert.equal(await page.locator('#workspace-title').textContent(), 'Read state');
  await crumbs(page).last().click();
  assert.equal(await page.locator('#workspace-title').textContent(), 'Read state');
});

test('switching entries clears detail history even when the new root is the current callee', async t => {
  const page = await open(t);
  await page.evaluate(() => {
    const sample = structuredClone(pFlowSamples[2]);
    sample.architecture.entryPoints.push({ ...sample.architecture.entryPoints[0], id: 'entry_other', label: 'Another activation', flowId: sample.architecture.flows[1].id, trigger: 'Configured recovery callback' });
    pFlow.initializeSample(sample);
  });
  await detailButton(page, 'Invoke rollup').click();
  assert.equal(await crumbs(page).count(), 2);
  await page.getByRole('button', { name: 'Another activation', exact: true }).click();
  assert.equal(await page.locator('#workspace-title').textContent(), 'Rollup handler');
  assert.deepEqual(await crumbs(page).allTextContents(), ['Another activation']);
  assert.match(await page.locator('#workspace-description').textContent(), /Start: Another activation/);
  assert.equal(await page.locator('.entry-button[aria-pressed="true"]').textContent(), 'Another activation');
  assert.equal(await page.getByRole('button', { name: 'Back', exact: true }).isDisabled(), true);
  assert.equal(await page.getByRole('button', { name: 'Forward', exact: true }).isDisabled(), true);
  await page.getByRole('button', { name: 'Nightly rollup task', exact: true }).click();
  assert.equal(await page.locator('#workspace-title').textContent(), 'Custom scheduled dispatch');
  assert.deepEqual(await crumbs(page).allTextContents(), ['Nightly rollup task']);
});

test('reused detail graphs display the actual calling node and replace the previous forward branch', async t => {
  const page = await open(t);
  await page.evaluate(() => {
    const sample = structuredClone(pFlowSamples[0]);
    const flow = sample.architecture.flows[0];
    const first = flow.nodes.find(node => node.expandFlowId);
    const second = { ...first, id: 'node_shared_second', label: 'Invoke alternate refresh' };
    flow.nodes.push(second);
    flow.edges.push({ ...flow.edges[0], id: 'edge_shared_second', to: second.id });
    globalThis.testNavigationArtifact = sample.architecture;
    globalThis.testNavigationBefore = JSON.stringify(sample.architecture);
    pFlow.initializeSample(sample);
  });
  await detailButton(page, 'Invoke refresh component').click();
  await detailButton(page, 'Invoke read_state').click();
  await page.getByRole('button', { name: 'Top level: return to first flow in this path' }).click();
  await detailButton(page, 'Invoke alternate refresh').click();
  assert.equal(await page.locator('#workspace-title').textContent(), 'Refresh component');
  assert.match(await page.locator('#workspace-description').textContent(), /via Invoke alternate refresh/);
  assert.equal(await page.locator('.diagram-node').count(), 4);
  assert.equal(await page.getByRole('button', { name: 'Forward', exact: true }).isDisabled(), true);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: 'Forward', exact: true }).click();
  assert.match(await page.locator('#workspace-description').textContent(), /via Invoke alternate refresh/);
  assert.equal(await page.evaluate(() => JSON.stringify(testNavigationArtifact) === testNavigationBefore), true);
});

test('self-recursive detail is blocked visibly without growing the navigation path', async t => {
  const page = await open(t);
  await page.evaluate(() => {
    const sample = structuredClone(pFlowSamples[0]);
    sample.architecture.flows[0].nodes.find(node => node.expandFlowId).expandFlowId = sample.architecture.flows[0].id;
    pFlow.initializeSample(sample);
  });
  const recursive = detailButton(page, 'Invoke refresh component');
  assert.match(await recursive.getAttribute('aria-label'), /already in this path/i);
  assert.equal(await recursive.locator('.diagram-expand-hint').textContent(), '↻');
  await recursive.click(); await recursive.click();
  assert.match(await page.locator('#navigation-notice').textContent(), /already in this path/i);
  assert.deepEqual(await crumbs(page).allTextContents(), ['Refresh command']);
  assert.equal(await page.locator('#workspace-title').textContent(), 'Refresh command');
  assert.equal(await page.getByRole('button', { name: 'Back', exact: true }).isDisabled(), true);
  assert.equal(await page.getByRole('button', { name: 'Forward', exact: true }).isDisabled(), true);
});

test('mutual recursion blocks the repeated ancestor but Back remains usable', async t => {
  const page = await open(t);
  await page.evaluate(() => {
    const sample = structuredClone(pFlowSamples[0]);
    sample.architecture.flows[1].nodes.find(node => node.expandFlowId).expandFlowId = sample.architecture.flows[0].id;
    pFlow.initializeSample(sample);
  });
  await detailButton(page, 'Invoke refresh component').click();
  await detailButton(page, 'Invoke read_state').focus(); await page.keyboard.press('Space');
  assert.equal(await page.locator('#workspace-title').textContent(), 'Refresh component');
  assert.equal(await crumbs(page).count(), 2);
  assert.match(await page.locator('#navigation-notice').textContent(), /already in this path/i);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  assert.equal(await page.locator('#workspace-title').textContent(), 'Refresh command');
  assert.equal(await page.locator('#navigation-notice').textContent(), '');
});

test('detail buttons support Enter, Tab, and Space with focus moved to the new diagram', async t => {
  const page = await open(t);
  await detailButton(page, 'Invoke refresh component').focus(); await page.keyboard.press('Enter');
  assert.equal(await page.locator('#workspace-title').textContent(), 'Refresh component');
  assert.equal(await page.locator('.diagram-svg').evaluate(el => el === document.activeElement), true);
  await page.getByRole('button', { name: /^Select node Invoke read_state\./ }).focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#workspace-title').textContent(), 'Refresh component');
  await detailButton(page, 'Invoke read_state').focus();
  const scroll = await page.evaluate(() => scrollY);
  await page.keyboard.press('Space');
  assert.equal(await page.locator('#workspace-title').textContent(), 'Read state');
  assert.equal(await page.evaluate(() => scrollY), scroll);
  assert.equal(await page.locator('.diagram-expand-control').count(), 0);
});

test('dragging an expandable node pans instead of opening its detail', async t => {
  const page = await open(t);
  const target = detailButton(page, 'Invoke refresh component');
  const before = await page.locator('.diagram-scene').getAttribute('transform');
  const box = await target.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2 + 20); await page.mouse.up();
  assert.equal(await page.locator('#workspace-title').textContent(), 'Refresh command');
  assert.equal(await crumbs(page).count(), 1);
  assert.notEqual(await page.locator('.diagram-scene').getAttribute('transform'), before);
  await target.click();
  assert.equal(await page.locator('#workspace-title').textContent(), 'Refresh component');
});

test('async stubs never become hierarchical controls even if their original node has detail', async t => {
  const page = await open(t);
  await page.evaluate(() => {
    const sample = structuredClone(pFlowSamples[1]);
    sample.architecture.flows[1].nodes[0].expandFlowId = sample.architecture.flows[1].id;
    pFlow.initializeSample(sample);
  });
  const remote = page.locator('.diagram-node[data-boundary="true"]');
  assert.equal(await remote.getAttribute('role'), 'group');
  assert.equal(await remote.getAttribute('tabindex'), null);
  assert.equal(await remote.locator('.diagram-expand-hint').count(), 0);
  await remote.click();
  assert.equal(await page.locator('#workspace-title').textContent(), 'Publish job');
  assert.equal(await page.locator('#node-name').textContent(), 'Receive jobs message');
  assert.match(await page.locator('#selection-facts').textContent(), /FlowProcess job/);
  assert.match(await page.locator('#selection-facts').textContent(), /Cross-flow target/);
  assert.equal(await page.locator('.doc-target').getAttribute('id'), samples[1].architecture.flows[0].id);
  assert.match(await page.locator('#document-status').textContent(), /another Flow/);
  assert.deepEqual(await crumbs(page).allTextContents(), ['Submit command']);
  await page.getByRole('button', { name: 'Indexer worker', exact: true }).click();
  assert.equal(await page.locator('#workspace-title').textContent(), 'Process job');
  assert.deepEqual(await crumbs(page).allTextContents(), ['Indexer worker']);
});

test('missing detail references show a recoverable error without a fabricated breadcrumb', async t => {
  const page = await open(t);
  await page.evaluate(() => {
    const sample = structuredClone(pFlowSamples[0]);
    sample.architecture.flows[0].nodes.find(node => node.expandFlowId).expandFlowId = 'flow_absent';
    pFlow.initializeSample(sample);
  });
  assert.equal(await page.locator('.diagram-svg').count(), 0);
  assert.match(await page.locator('#workspace-state-message').textContent(), /Unknown detail Flow/);
  assert.deepEqual(await crumbs(page).allTextContents(), ['Refresh command']);
  assert.equal(await page.getByRole('button', { name: 'Forward', exact: true }).isDisabled(), true);
  await selectBundle(page, 'c-custom');
  assert.equal(await page.locator('.diagram-svg').count(), 1);
  assert.deepEqual(await crumbs(page).allTextContents(), ['Nightly rollup task']);
});

test('flow transitions refit the new diagram instead of retaining zoom or pan', async t => {
  const page = await open(t);
  const fitted = async () => {
    const root = await page.locator('.diagram-svg').boundingBox(), scene = await page.locator('.diagram-scene').boundingBox();
    assert.ok(scene.x >= root.x - 1 && scene.y >= root.y - 1 && scene.x + scene.width <= root.x + root.width + 1 && scene.y + scene.height <= root.y + root.height + 1);
  };
  await page.getByRole('button', { name: 'Reset zoom', exact: true }).click();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  assert.equal(await page.locator('#zoom-level').textContent(), '125%');
  await page.locator('.diagram-svg').focus(); await page.keyboard.press('ArrowLeft');
  await detailButton(page, 'Invoke refresh component').click();
  assert.notEqual(await page.locator('#zoom-level').textContent(), '125%'); await fitted();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await page.getByRole('button', { name: 'Back', exact: true }).click(); await fitted();
  assert.equal(await crumbs(page).count(), 1);
});

test('direct Flow browsing clears entry context and never invents intermediate hierarchy', async t => {
  const page = await open(t);
  await detailButton(page, 'Invoke refresh component').click();
  await page.getByLabel('Displayed flow').selectOption({ label: 'Read state' });
  assert.deepEqual(await crumbs(page).allTextContents(), ['Read state']);
  assert.match(await page.locator('#workspace-description').textContent(), /Direct flow/);
  assert.equal(await page.locator('.entry-button[aria-pressed="true"]').count(), 0);
  assert.equal(await page.getByRole('button', { name: 'Back', exact: true }).isDisabled(), true);
  assert.equal(await page.getByRole('button', { name: 'Forward', exact: true }).isDisabled(), true);
  await page.getByRole('navigation', { name: 'Process starts' }).getByRole('button', { name: 'Refresh command', exact: true }).click();
  assert.deepEqual(await crumbs(page).allTextContents(), ['Refresh command']);
  assert.equal(await page.locator('.entry-button[aria-pressed="true"]').count(), 1);
});

const selectNode = (page, label) => page.getByRole('button', { name: new RegExp(`^Select node ${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.`) });

test('node selection updates real metadata and its Markdown section without replacing or moving the diagram', async t => {
  const page = await open(t); await page.getByLabel('Displayed flow').selectOption({ label: 'Read state' });
  const node = samples[0].architecture.flows[2].nodes.find(node => node.label === 'Fetch state');
  await page.evaluate(() => { globalThis.selectedDiagramBefore = document.querySelector('.diagram-svg'); });
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  const transform = await page.locator('.diagram-scene').getAttribute('transform');
  await selectNode(page, 'Fetch state').click();
  assert.equal(await page.locator('#workspace-title').textContent(), 'Read state');
  assert.equal(await page.locator('.diagram-scene').getAttribute('transform'), transform);
  assert.equal(await page.evaluate(() => document.querySelector('.diagram-svg') === selectedDiagramBefore), true);
  assert.equal(await selectNode(page, 'Fetch state').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('.diagram-node.is-selected').count(), 1);
  assert.equal(await page.locator('#node-name').textContent(), node.label);
  assert.match(await page.locator('#external-metadata').textContent(), /http.methodGET/);
  assert.match(await page.locator('#external-metadata').textContent(), /\$\{STATE_URL\}\/state/);
  assert.match(await page.locator('#node-conditions').textContent(), /Input valid\? → valid/);
  assert.match(await page.locator('#node-calls').textContent(), /exception · sync/);
  await page.getByRole('tab',{name:'Details',exact:true}).click();
  assert.equal(await page.locator('#node-description').isVisible(), false);
  assert.equal(await page.locator('.doc-target').getAttribute('id'), node.id);
  assert.match(await page.locator('.doc-target').textContent(), /Send a synchronous GET/);
});

test('selection and explicit expansion are separate actions in both the SVG and inspector', async t => {
  const page = await open(t);
  await selectNode(page, 'Invoke refresh component').click();
  assert.equal(await page.locator('#workspace-title').textContent(), 'Refresh command');
  assert.equal(await page.locator('#node-name').textContent(), 'Invoke refresh component');
  assert.match(await page.locator('#document-context').textContent(), /No element documentation link/);
  assert.equal(await page.locator('.doc-target').getAttribute('id'), samples[0].architecture.flows[0].id);
  await page.getByRole('tab',{name:'Details',exact:true}).click();
  await page.getByRole('button', { name: 'Open detail: Refresh component', exact: true }).click();
  assert.equal(await page.locator('#workspace-title').textContent(), 'Refresh component');
  assert.equal(await inspectorEmpty(page), true);
  assert.equal(await page.locator('.diagram-node.is-selected').count(), 0);
  assert.equal(await page.locator('.doc-target').getAttribute('id'), samples[0].architecture.flows[1].id);
});

test('clicking an edge path selects its actual relationship, endpoints, label, and evidence', async t => {
  const page = await open(t); await page.getByLabel('Displayed flow').selectOption({ label: 'Read state' });
  const edge = samples[0].architecture.flows[2].edges.find(edge => edge.kind === 'branch' && edge.label === 'valid');
  const target = page.locator(`.diagram-edge[data-edge-id="${edge.id}"]`);
  const transform = await page.locator('.diagram-scene').getAttribute('transform');
  const point = await target.locator('.diagram-edge-path').evaluate(path => { const p = path.getPointAtLength(path.getTotalLength() * .2).matrixTransform(path.getScreenCTM()); return { x: p.x, y: p.y }; });
  await page.mouse.click(point.x, point.y);
  assert.equal(await target.getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('#inspector-title').textContent(), 'Relationship details');
  const facts = await page.locator('#selection-facts').textContent();
  assert.match(facts, /FromInput valid\?/); assert.match(facts, /ToFetch state/); assert.match(facts, /Relationshipbranch/); assert.match(facts, /Modesync/); assert.match(facts, /Labelvalid/);
  assert.equal(await page.locator('#source-references button').count(), edge.sourceIds.length);
  assert.match(await page.locator('#external-metadata').textContent(), /State service/);
  assert.equal(await page.locator('.diagram-scene').getAttribute('transform'), transform);
  assert.equal(await page.locator('#workspace-title').textContent(), 'Read state');
  await selectNode(page, 'Return state').click();
  assert.equal(await page.locator('.diagram-edge.is-selected').count(), 0);
});

test('async edge selection shows only recorded messaging metadata and opens its evidence section', async t => {
  const page = await open(t); await selectBundle(page, 'b-async');
  const edge = samples[1].architecture.flows[0].edges.find(edge => edge.kind === 'receive');
  await page.locator(`.diagram-edge-label[data-edge-label="${edge.id}"]`).click();
  assert.equal(await page.locator('#node-name').textContent(), 'Configured jobs subscription');
  assert.match(await page.locator('#selection-facts').textContent(), /Modeasync/);
  assert.match(await page.locator('#external-metadata').textContent(), /messaging.channeljobs/);
  assert.doesNotMatch(await page.locator('#external-metadata').textContent(), /http.method/);
  assert.equal(await page.locator('#source-references button').count(), 3);
  assert.equal(await page.locator('.doc-target').getAttribute('id'), edge.id);
  await page.getByRole('tab',{name:'Documentation',exact:true}).click();
  await page.locator('.doc-target').getByRole('button', { name: 'consumer', exact: true }).click();
  assert.equal(await page.locator('.doc-target').getAttribute('id'), samples[1].architecture.flows[1].id);
  assert.equal(await page.locator('#workspace-title').textContent(), 'Publish job');
  assert.equal(await page.locator(`.diagram-edge[data-edge-id="${edge.id}"]`).getAttribute('aria-pressed'), 'true');
});

test('source reference actions show exact paths, line ranges, and symbols with unavailable text', async t => {
  const page = await open(t); await page.getByLabel('Displayed flow').selectOption({ label: 'Refresh component' });
  await selectNode(page, 'Invoke read_state').click();
  await page.getByRole('tab',{name:'Details',exact:true}).click(); await page.locator('#source-references button').first().click();
  assert.equal(await page.getByRole('tab', { name: 'Evidence references', exact: true }).getAttribute('aria-selected'), 'true');
  const fields = await page.locator('#source-fields').textContent();
  assert.match(fields, /Pathexamples\/a-sync\/sources\/component.py.txt/); assert.match(fields, /Lines2–3/); assert.match(fields, /Symbolexecute/);
  assert.match(await page.locator('#source-unavailable').textContent(), /Evidence text is not embedded/);
  assert.equal(await page.locator('#view-source pre, #view-source code').count(), 0);
  assert.equal(await page.locator('#workspace-title').textContent(), 'Refresh component');
  assert.equal(await selectNode(page, 'Invoke read_state').getAttribute('aria-pressed'), 'true');
});

test('Markdown citations open source references without fetching definition targets', async t => {
  const page = await open(t);
  await page.locator('.doc-target .source-link').first().click();
  assert.equal(await page.locator('#view-source').isVisible(), true);
  assert.match(await page.locator('#source-fields').textContent(), /command.py.txt/);
  assert.match(await page.locator('#source-unavailable').textContent(), /Only the recorded location/);
  assert.equal(await page.locator('#workspace-title').textContent(), 'Refresh command');
});

test('missing Markdown sections show an explicit error without using a generated heading slug', async t => {
  const page = await open(t);
  const id = samples[0].architecture.flows[2].nodes.find(node => node.label === 'Fetch state').id;
  await page.evaluate(id => { pFlowDocuments['a-sync']['execution.md'] = pFlowDocuments['a-sync']['execution.md'].replace(`<a id="${id}"></a>`, ''); }, id);
  await page.getByLabel('Displayed flow').selectOption({ label: 'Read state' }); await selectNode(page, 'Fetch state').click();
  assert.match(await page.locator('#document-status').textContent(), /Markdown section .* was not found/);
  assert.equal(await page.locator('.doc-target').getAttribute('id'), samples[0].architecture.flows[2].id);
  assert.equal(await page.locator('#node-name').textContent(), 'Fetch state');
  assert.equal(await page.locator('.diagram-node.is-selected').count(), 1);
});

test('a missing embedded document clears stale content and leaves metadata inspection usable', async t => {
  const page = await open(t);
  await page.evaluate(() => { delete pFlowDocuments['a-sync']['execution.md']; });
  await selectNode(page, 'Receive command').click();
  assert.match(await page.locator('#document-status').textContent(), /Markdown document is not embedded/);
  assert.equal(await page.locator('#document-body').textContent(), '');
  assert.equal(await page.locator('#node-name').textContent(), 'Receive command');
  assert.equal(await page.locator('#source-references button').count(), 1);
});

test('literal Markdown IDs survive renamed headings and document links do not navigate the graph', async t => {
  const page = await open(t);
  await page.evaluate(() => { pFlowDocuments['a-sync']['execution.md'] = pFlowDocuments['a-sync']['execution.md'].replace('### State service', '### Renamed boundary'); });
  await page.getByLabel('Displayed flow').selectOption({ label: 'Read state' }); await selectNode(page, 'Fetch state').click();
  assert.match(await page.locator('.doc-target').textContent(), /Renamed boundary/);
  assert.equal(await page.locator('#document-status').textContent(), '');
  await page.getByRole('tab',{name:'Documentation',exact:true}).click();
  await page.getByRole('navigation', { name: 'Document sections' }).getByRole('button', { name: 'Refresh component', exact: true }).click();
  assert.equal(await page.locator('.doc-target').getAttribute('id'), samples[0].architecture.flows[1].id);
  assert.equal(await page.locator('#workspace-title').textContent(), 'Read state');
});

test('navigation clears selected entities and loads the parent or new entry documentation', async t => {
  const page = await open(t);
  await detailButton(page, 'Invoke refresh component').click(); await selectNode(page, 'Invoke read_state').click();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  assert.equal(await page.locator('.diagram-node.is-selected, .diagram-edge.is-selected').count(), 0);
  assert.equal(await inspectorEmpty(page), true);
  assert.equal(await page.locator('.doc-target').getAttribute('id'), samples[0].architecture.flows[0].id);
  await selectBundle(page, 'b-async');
  await selectNode(page, 'Publish to jobs').click();
  await page.getByRole('navigation', { name: 'Process starts' }).getByRole('button', { name: 'Indexer worker', exact: true }).click();
  assert.equal(await inspectorEmpty(page), true);
  assert.equal(await page.locator('.doc-target').getAttribute('id'), samples[1].architecture.flows[1].id);
  await selectNode(page, 'Write message').click();
  await page.evaluate(() => pFlow.setWorkspaceState('loading'));
  assert.equal(await inspectorEmpty(page), true);
  assert.equal(await page.locator('#clear-selection').isVisible(), false);
  assert.equal(await page.getByLabel('Recorded evidence').isDisabled(), true);
});

test('Enter selects, Tab reaches the explicit expansion control, and Space expands', async t => {
  const page = await open(t);
  await selectNode(page, 'Invoke refresh component').focus(); await page.keyboard.press('Enter');
  assert.equal(await page.locator('#workspace-title').textContent(), 'Refresh command');
  assert.equal(await page.locator('#node-name').textContent(), 'Invoke refresh component');
  await page.keyboard.press('Tab');
  assert.equal(await detailButton(page, 'Invoke refresh component').evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('Space');
  assert.equal(await page.locator('#workspace-title').textContent(), 'Refresh component');
  const edge = page.locator('.diagram-edge').first(); await edge.focus(); await page.keyboard.press('Enter');
  assert.equal(await edge.getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('#inspector-title').textContent(), 'Relationship details');
});

test('irrelevant inspector sections disappear when changing from a boundary to a normal terminal', async t => {
  const page = await open(t); await page.getByLabel('Displayed flow').selectOption({ label: 'Read state' });
  await selectNode(page, 'Fetch state').click();
  await page.getByRole('tab',{name:'Details',exact:true}).click();
  assert.equal(await page.locator('#external-metadata').isVisible(), true);
  await selectNode(page, 'Return state').click();
  await page.getByRole('tab',{name:'Details',exact:true}).click();
  assert.equal(await page.locator('#external-metadata').isVisible(), false);
  assert.equal(await page.locator('#node-conditions').isVisible(), false);
  assert.equal(await page.locator('#detail-flow').isVisible(), false);
  await page.getByRole('tab',{name:'Details',exact:true}).click();
  assert.equal(await page.locator('#node-description').isVisible(), false);
  assert.match(await page.locator('#node-calls').textContent(), /return · sync/);
});

test('clear selection preserves the diagram viewport and returns to Flow documentation', async t => {
  const page = await open(t); await selectNode(page, 'Invoke refresh component').click();
  const transform = await page.locator('.diagram-scene').getAttribute('transform');
  await page.getByRole('button', { name: 'Clear selection', exact: true }).click();
  assert.equal(await page.locator('.diagram-node.is-selected').count(), 0);
  assert.equal(await inspectorEmpty(page), true);
  assert.equal(await page.locator('.diagram-scene').getAttribute('transform'), transform);
  assert.equal(await page.locator('.doc-target').getAttribute('id'), samples[0].architecture.flows[0].id);
  assert.equal(await page.locator('.diagram-svg').evaluate(el => el === document.activeElement), true);
});

test('unresolved nodes and unknown relationship modes display their actual uncertainty', async t => {
  const page = await open(t);
  await page.evaluate(() => {
    const sample = structuredClone(pFlowSamples[0]); const flow = sample.architecture.flows[0];
    flow.nodes[1].kind = 'unresolved'; delete flow.nodes[1].expandFlowId; flow.edges[0].mode = 'unknown';
    pFlow.initializeSample(sample);
  });
  await selectNode(page, 'Invoke refresh component').click();
  assert.match(await page.locator('#node-description').textContent(), /boundary is unresolved/);
  assert.equal(await page.locator('#detail-flow').isVisible(), false);
  await page.locator('.diagram-edge').first().focus(); await page.keyboard.press('Enter');
  assert.match(await page.locator('#selection-facts').textContent(), /Modeunknown/);
  assert.match(await page.locator('#node-description').textContent(), /not recorded/);
});

test('raw Markdown HTML and external link destinations are never interpreted or fetched', async t => {
  const page = await open(t);
  await page.evaluate(() => {
    pFlowDocuments['a-sync']['execution.md'] += '\n<img src="https://example.invalid/image">\n\n<script>window.markdownExecuted = true</script>\n\n[External](https://example.invalid/page)\n';
  });
  await selectNode(page, 'Receive command').click();
  assert.equal(await page.locator('#document-body img, #document-body script, #document-body a[href]').count(), 0);
  assert.equal(await page.evaluate(() => globalThis.markdownExecuted), undefined);
  assert.match(await page.locator('#document-body').textContent(), /<img src=/);
});

test('duplicate literal sections fail explicitly rather than resolving an ambiguous owner', async t => {
  const page = await open(t);
  await page.evaluate(() => { const id = pFlowSamples[0].architecture.flows[0].id; pFlowDocuments['a-sync']['execution.md'] += `\n<a id="${id}"></a>\n## Duplicate\n`; });
  await selectNode(page, 'Receive command').click();
  assert.match(await page.locator('#document-status').textContent(), /Ambiguous duplicate Markdown section/);
  assert.equal(await page.locator('.doc-target').count(), 0);
});

test('supporting architecture-index Markdown renders its table and links offline', async t => {
  const page = await open(t);
  await page.evaluate(() => { const sample = structuredClone(pFlowSamples[0]); sample.architecture.flows[0].docs.push({ path: 'index.md' }); pFlow.initializeSample(sample); });
  await page.getByLabel('Documentation reference').selectOption({ label: 'index.md' });
  assert.equal(await page.locator('#document-body table').count(), 1);
  assert.deepEqual(await page.locator('#document-body th').allTextContents(), ['Entry point', 'Trigger', 'Execution']);
  await page.locator('#document-body table').getByRole('button', { name: 'Refresh command', exact: true }).click();
  assert.equal(await page.locator('.doc-target').getAttribute('id'), samples[0].architecture.flows[0].id);
  assert.equal(await page.locator('#workspace-title').textContent(), 'Refresh command');
});

test('file-level evidence without a symbol does not invent line or symbol fields', async t => {
  const page = await open(t);
  await page.evaluate(() => { const sample = structuredClone(pFlowSamples[0]); const id = sample.architecture.flows[0].nodes[0].sourceIds[0]; const source = sample.architecture.sources.find(item => item.id === id); delete source.symbol; delete source.startLine; delete source.endLine; pFlow.initializeSample(sample); });
  await selectNode(page, 'Receive command').click(); await page.getByRole('tab',{name:'Details',exact:true}).click(); await page.locator('#source-references button').first().click();
  assert.deepEqual(await page.locator('#source-fields dt').allTextContents(), ['Path']);
  assert.match(await page.locator('#source-unavailable').textContent(), /not embedded/);
});

test('long paths and external metadata wrap without widening the narrow Viewer', async t => {
  const page = await open(t, 900);
  await page.evaluate(() => {
    const sample = structuredClone(pFlowSamples[0]), node = sample.architecture.flows[2].nodes.find(item => item.label === 'Fetch state');
    node.external.attributes['http.urlTemplate'] = 'https://example.invalid/' + 'long-part/'.repeat(80);
    sample.architecture.sources.find(source => source.id === node.sourceIds[0]).path = 'examples/a-sync/sources/' + 'long-segment/'.repeat(20) + 'state.ext';
    pFlow.initializeSample(sample);
  });
  await page.getByLabel('Displayed flow').selectOption({ label: 'Read state' }); await selectNode(page, 'Fetch state').click();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.match(await page.locator('#source-references').textContent(), /long-segment\/long-segment/);
  assert.match(await page.locator('#external-metadata').textContent(), /long-part\/long-part/);
  await page.getByRole('tab',{name:'Documentation',exact:true}).click();
  assert.ok(await page.locator('#document-article').evaluate(el => el.scrollHeight > el.clientHeight));
  assert.ok(await page.locator('.documentation').evaluate(el => { const r=el.getBoundingClientRect(); return r.top >= document.querySelector('.app-header').getBoundingClientRect().bottom && r.bottom <= innerHeight; }));
});

test('dragging a node body pans without selecting or expanding it', async t => {
  const page = await open(t), target = selectNode(page, 'Invoke refresh component');
  const box = await target.boundingBox(), before = await page.locator('.diagram-scene').getAttribute('transform');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 25, box.y + box.height / 2 + 25); await page.mouse.up();
  assert.equal(await inspectorEmpty(page), true);
  assert.equal(await page.locator('.diagram-node.is-selected').count(), 0);
  assert.equal(await page.locator('#workspace-title').textContent(), 'Refresh command');
  assert.notEqual(await page.locator('.diagram-scene').getAttribute('transform'), before);
});

test('library, database, and custom external boundaries retain only their recorded metadata', async t => {
  const page = await open(t);
  for (const [sample, flow, node, expected] of [['a-sync', 'Read state', 'Validate with input_rules', /library.symbolcheck/], ['b-async', 'Process job', 'Write message', /database.operationwrite/], ['c-custom', 'Rollup handler', 'Compact archive', /Kindother/]]) {
    await selectBundle(page, sample); await page.getByLabel('Displayed flow').selectOption({ label: flow }); await selectNode(page, node).click();
    assert.match(await page.locator('#external-metadata').textContent(), expected);
    assert.doesNotMatch(await page.locator('#external-metadata').textContent(), /http.method|http.urlTemplate/);
    await page.getByRole('tab',{name:'Details',exact:true}).click();
  assert.equal(await page.locator('#node-description').isVisible(), false);
  }
});

async function searchFor(page, query) {
  const input = page.getByRole('combobox', { name: 'Search documentation' });
  await input.fill(query);
  await page.waitForFunction(value => document.querySelector('#search-clear').hidden === !value && (document.querySelectorAll('.search-result').length > 0 || document.querySelector('#search-empty').textContent === 'No matching sections.'), query);
  // Wait on rendered content rather than time; each caller asserts its expected result.
  return input;
}

test('global search finds actual body text in an inactive bundle and highlights the preview', async t => {
  const page = await open(t);
  await searchFor(page, 'acknowledg');
  await page.waitForFunction(() => document.querySelector('#search-results').textContent.includes('acknowledg'));
  assert.match(await page.locator('#search-results').textContent(), /Asynchronous jobs/);
  assert.match(await page.locator('.search-result-preview mark').first().textContent(), /acknowledg/i);
  assert.match(await page.locator('#search-results').textContent(), /execution\.md #/);
  assert.equal(await page.locator('#app-layout').getAttribute('data-bundle-id'), 'a-sync');
  assert.equal(await page.locator('#workspace-title').textContent(), 'Refresh command');
});

test('search ranking, Unicode and unsafe Markdown previews use native text nodes', async t => {
  const page = await open(t);
  await page.evaluate(() => {
    pFlow.search.setIndex(pFlow.buildMarkdownSearchIndex([
      { bundleId: 'one', path: 'body.md', markdown: '# Other\nStraße CAFÉ 日本語\n`<img src=x onerror="globalThis.pwned=1">`' },
      { bundleId: 'two', path: 'heading.md', markdown: '# Details\n## Straße\nHeading explanation' },
      { bundleId: 'three', path: 'title.md', markdown: '# Straße\nTitle explanation' },
    ]));
  });
  await searchFor(page, 'STRASSE');
  await page.waitForFunction(() => document.querySelectorAll('.search-result').length === 3);
  assert.deepEqual(await page.locator('.search-result h3').allTextContents(), ['Straße', 'Details', 'Other']);
  assert.equal(await page.locator('.search-result h3 mark').first().textContent(), 'Straße');
  await page.locator('#global-search').fill('cafe\u0301 日本');
  await page.waitForFunction(() => document.querySelectorAll('.search-result').length === 1);
  assert.match(await page.locator('.search-result-preview').textContent(), /CAFÉ 日本語/);
  await page.locator('#global-search').fill('onerror');
  await page.waitForFunction(() => !!document.querySelector('.search-result-preview mark')?.textContent.includes('onerror'));
  assert.match(await page.locator('.search-result-preview').textContent(), /<img src=x/);
  assert.equal(await page.locator('#search-popup img, #search-popup script').count(), 0);
  assert.equal(await page.evaluate(() => globalThis.pwned), undefined);
});

test('keyboard shortcuts, result review, Escape and clear preserve search query', async t => {
  const page = await open(t), input = page.locator('#global-search');
  const invoker = page.getByRole('button', { name: 'Zoom in', exact: true }); await invoker.focus();
  await page.keyboard.press('Control+k'); assert.equal(await input.evaluate(el => el === document.activeElement), true);
  await input.fill('execution');
  await page.keyboard.press('ArrowDown');
  assert.equal(await input.getAttribute('aria-activedescendant'), 'search-result-0');
  assert.equal(await page.locator('#search-result-0').getAttribute('aria-selected'), 'true');
  await page.keyboard.press('ArrowDown'); assert.equal(await input.getAttribute('aria-activedescendant'), 'search-result-1');
  await page.keyboard.press('ArrowUp'); assert.equal(await input.getAttribute('aria-activedescendant'), 'search-result-0');
  await page.keyboard.press('Escape'); assert.equal(await page.locator('#search-popup').isVisible(), false);
  assert.equal(await invoker.evaluate(el => el === document.activeElement), true); assert.equal(await input.inputValue(), 'execution');
  await page.keyboard.press('Meta+k'); assert.equal(await input.evaluate(el => el === document.activeElement), true);
  await page.getByRole('button', { name: 'Clear search' }).click(); assert.equal(await input.inputValue(), '');
  assert.match(await page.locator('#search-empty').textContent(), /across all samples/);
  assert.equal(await page.locator('#search-results [role=option]').count(), 0);
  const prevented = await page.evaluate(() => ['f', 'k'].map(key => { const event = new KeyboardEvent('keydown', { key, ctrlKey: true, shiftKey: key === 'k', bubbles: true, cancelable: true }); document.dispatchEvent(event); return event.defaultPrevented; }));
  assert.deepEqual(prevented, [false, false]);
});

test('search previews leave graph, selection, viewport and reading context unchanged', async t => {
  const page = await open(t);
  await detailButton(page, 'Invoke refresh component').click();
  await selectNode(page, 'Invoke read_state').click();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  const snapshot = () => page.evaluate(() => ({ title: document.querySelector('#workspace-title').textContent, entry: document.querySelector('.entry-button[aria-pressed=true]')?.textContent, crumbs: document.querySelector('#breadcrumb-list').textContent, transform: document.querySelector('.diagram-scene').getAttribute('transform'), selection: document.querySelector('.diagram-node.is-selected')?.getAttribute('data-node-id'), inspector: document.querySelector('#node-name').textContent, document: document.querySelector('#document-article').textContent, target: document.querySelector('.doc-target')?.id }));
  const before = await snapshot();
  await page.evaluate(() => { globalThis.searchGraph = document.querySelector('#diagram-container svg'); });
  await page.keyboard.press('Control+k'); await page.locator('#global-search').fill('dispatch'); await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('Escape');
  assert.deepEqual(await snapshot(), before);
  assert.equal(await page.evaluate(() => searchGraph === document.querySelector('#diagram-container svg')), true);
});

test('search empty states, bounded results and narrow overlay stay usable offline', async t => {
  const page = await open(t, 640);
  await page.locator('#global-search').fill('zzmissingqueryzz');
  await page.waitForFunction(() => document.querySelector('#search-empty').textContent === 'No matching sections.');
  await page.evaluate(() => pFlow.search.setIndex(pFlow.buildMarkdownSearchIndex([])));
  assert.equal(await page.locator('#search-empty').textContent(), 'No Markdown documents are available.');
  await page.evaluate(() => pFlow.search.setIndex(pFlow.buildMarkdownSearchIndex(Array.from({ length: 40 }, (_, i) => ({ bundleId: 'many', path: `${i}.md`, markdown: '# Shared\nRepeated searchable text' })))));
  await page.locator('#global-search').fill('searchable'); await page.keyboard.press('ArrowDown');
  assert.equal(await page.locator('.search-result').count(), 20);
  assert.match(await page.locator('#search-status').textContent(), /40 matching sections.*Showing 20/);
  assert.ok(await page.locator('#search-popup').evaluate(el => { const box = el.getBoundingClientRect(); return box.left >= 0 && box.right <= innerWidth && box.bottom <= innerHeight; }));
  for (let i = 0; i < 19; i++) await page.keyboard.press('ArrowDown');
  assert.equal(await page.locator('#global-search').getAttribute('aria-activedescendant'), 'search-result-19');
  assert.ok(await page.locator('#search-results').evaluate(el => el.scrollTop > 0));
});

test('serialized precomputed index initializes without parsing Markdown at runtime', async t => {
  const page = await open(t);
  await page.addInitScript(() => {
    globalThis.pFlowSearchIndex = { version: 1, documents: [{ bundleId: 'precomputed', path: 'offline.md', title: 'Embedded' }], sections: [{ document: 0, sectionId: 'flow_embedded', headings: ['Embedded'], text: 'Precomputed searchable content', ordinal: 0 }], postings: { embedded: { title: [0], heading: [0], body: [] }, precomputed: { title: [], heading: [], body: [0] }, searchable: { title: [], heading: [], body: [0] }, content: { title: [], heading: [], body: [0] } } };
  });
  await page.reload();
  await page.locator('#global-search').fill('precomputed'); await page.keyboard.press('ArrowDown');
  assert.match(await page.locator('#search-results').textContent(), /offline\.md #flow_embedded/);
  assert.equal(await page.locator('.search-result h3').textContent(), 'Embedded');
  assert.equal(await page.locator('#workspace-title').textContent(), 'Refresh command');
});

test('search keeps composition keys available and Escape works from the clear button', async t => {
  const page = await open(t);
  await page.locator('#global-search').fill('execution'); await page.keyboard.press('ArrowDown');
  const prevented = await page.locator('#global-search').evaluate(input => ['Enter', 'ArrowDown', 'Escape'].map(key => { const event = new KeyboardEvent('keydown', { key, isComposing: true, bubbles: true, cancelable: true }); input.dispatchEvent(event); return event.defaultPrevented; }));
  assert.deepEqual(prevented, [false, false, false]);
  assert.equal(await page.locator('#search-popup').isVisible(), true);
  await page.getByRole('button', { name: 'Clear search' }).focus(); await page.keyboard.press('Escape');
  assert.equal(await page.locator('#search-popup').isVisible(), false);
});

async function openSearchHit(page, query, contains) {
  await page.keyboard.press('Control+k');
  await page.locator('#global-search').fill(query);
  // Flush the debounce and review the first result before choosing a specific literal section.
  await page.keyboard.press('ArrowDown');
  const result = contains ? page.locator('.search-result').filter({ hasText: contains }).first() : page.locator('.search-result').first();
  await result.click();
}

test('search click selects the canonical node through its real detail path and opens highlighted prose', async t => {
  const page = await open(t);
  await openSearchHit(page, 'host unresolved', '#node_d1e0f061c044');
  assert.equal(await page.locator('#workspace-title').textContent(), 'Read state');
  assert.deepEqual(await crumbs(page).allTextContents(), ['Refresh command', 'Refresh component', 'Read state']);
  assert.equal(await page.locator('#node-name').textContent(), 'Fetch state');
  assert.equal(await page.locator('.diagram-node.is-selected').getAttribute('data-node-id'), 'node_d1e0f061c044');
  assert.equal(await page.locator('#document-reference').textContent(), 'execution.md#node_d1e0f061c044');
  assert.deepEqual(await page.locator('mark.search-match').allTextContents(), ['host', 'unresolved']);
  assert.equal(await page.locator('#search-popup').isVisible(), false);
  assert.equal(await page.locator('#global-search').inputValue(), 'host unresolved');
  assert.equal(await page.locator('mark.search-match').first().evaluate(el => el === document.activeElement), true);
  assert.ok(await page.locator('mark.search-match').first().evaluate(el => { const hit = el.getBoundingClientRect(), box = document.querySelector('#document-article').getBoundingClientRect(); return hit.top >= box.top && hit.bottom <= box.bottom; }));
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  assert.equal(await page.locator('#workspace-title').textContent(), 'Refresh component');
  assert.equal(await page.locator('mark.search-match').count(), 0);
  assert.equal(await page.locator('.diagram-node.is-selected').count(), 0);
});

test('Enter activates first result, changes bundles, and search reopening retains the query', async t => {
  const page = await open(t);
  await page.keyboard.press('Control+k'); await page.locator('#global-search').fill('acknowledg');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#search-popup').isVisible(), false);
  assert.equal(await page.locator('#app-layout').getAttribute('data-bundle-id'), 'b-async');
  assert.equal(await page.locator('#workspace-title').textContent(), 'Publish job');
  assert.match(await page.locator('#document-body mark.search-match').first().textContent(), /acknowledg/);
  await page.keyboard.press('Meta+k');
  assert.equal(await page.locator('#global-search').inputValue(), 'acknowledg');
  assert.equal(await page.locator('#global-search').evaluate(el => el === document.activeElement), true);
  assert.equal(await page.locator('#search-popup').isVisible(), true);
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
  assert.equal(await page.locator('#search-popup').isVisible(), false);
  assert.equal(await page.locator('#workspace-title').textContent(), 'Publish job');
});

test('unmapped index documentation opens without selecting an unrelated graph element', async t => {
  const page = await open(t);
  await selectNode(page, 'Invoke refresh component').click();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  const before = await page.locator('.diagram-scene').getAttribute('transform');
  await openSearchHit(page, 'custom-task architecture');
  assert.equal(await page.locator('#workspace-title').textContent(), 'Refresh command');
  assert.equal(await page.locator('#app-layout').getAttribute('data-bundle-id'), 'a-sync');
  assert.equal(await page.locator('.diagram-scene').getAttribute('transform'), before);
  assert.equal(await page.locator('.diagram-node.is-selected').count(), 0);
  assert.equal(await inspectorEmpty(page), true);
  assert.equal(await page.locator('#document-reference').textContent(), 'index.md');
  assert.match(await page.locator('#document-context').textContent(), /Custom task dispatch/);
  assert.ok(await page.locator('mark.search-match').count() > 0);
  await page.getByRole('button',{name:'Docs',exact:true}).click();
  assert.equal(await page.locator('#document-reference').textContent(),'execution.md#'+samples[0].architecture.flows[0].id);
  assert.equal(await page.locator('.doc-target').getAttribute('id'),samples[0].architecture.flows[0].id);
  assert.equal(await page.locator('#document-status').textContent(),'');
  assert.equal(await page.locator('.diagram-scene').getAttribute('transform'),before);
});

test('long body matches scroll to the first passage, preserve inline formatting and allow normal scrolling', async t => {
  const page = await open(t);
  await page.evaluate(() => {
    const sample = pFlowSamples[0], id = sample.architecture.flows[2].nodes.find(node => node.label === 'Fetch state').id;
    const markdown = `# Search fixture\n<a id="${sample.architecture.flows[2].id}"></a>\n## Read state\n<a id="${id}"></a>\n### State service\n` + Array.from({ length: 45 }, (_, i) => `Ordinary paragraph ${i}.\n\n`).join('') + 'First **CAFÉ** `Straße` passage with [related detail](execution.md#flow_844c0963da42).\n\n' + 'Repeated CAFÉ Straße passage.\n\n' + Array.from({ length: 20 }, (_, i) => `Following paragraph ${i}.\n\n`).join('');
    pFlowDocuments['a-sync']['execution.md'] = markdown;
    pFlow.search.setIndex(pFlow.buildMarkdownSearchIndex([{ bundleId: 'a-sync', path: 'execution.md', markdown }]));
  });
  await openSearchHit(page, 'cafe\u0301 STRASSE');
  assert.equal(await page.locator('strong mark.search-match').textContent(), 'CAFÉ');
  assert.equal(await page.locator('code mark.search-match').textContent(), 'Straße');
  assert.equal(await page.locator('mark.search-match').count(), 4);
  assert.equal(await page.locator('mark.search-match').first().evaluate(el => el === document.activeElement), true);
  assert.ok(await page.locator('#document-article').evaluate(el => el.scrollTop > 800));
  assert.ok(await page.locator('mark.search-match').first().evaluate(el => { const mark = el.getBoundingClientRect(), article = document.querySelector('#document-article').getBoundingClientRect(); return mark.top >= article.top && mark.bottom <= article.bottom; }));
  await page.locator('#document-article').evaluate(el => { el.scrollTop = 0; });
  assert.equal(await page.locator('#document-article').evaluate(el => el.scrollTop), 0);
  assert.match(await page.evaluate(() => pFlowDocuments['a-sync']['execution.md']), /\*\*CAFÉ\*\*/);
  await page.locator('#document-outline button').first().click();
  assert.equal(await page.locator('mark.search-match').count(), 0);
});

test('invalid result identifiers and missing documents or sections fail before diagram changes', async t => {
  const page = await open(t);
  await selectNode(page, 'Invoke refresh component').click();
  for (const [reference, expected] of [[null, /Invalid/], [{ bundleId: 'missing', path: 'execution.md', sectionId: null }, /bundle is unavailable/], [{ bundleId: 'a-sync', path: '../escape.md', sectionId: null }, /escapes/], [{ bundleId: 'a-sync', path: 'missing.md', sectionId: null }, /not embedded/], [{ bundleId: 'a-sync', path: 'execution.md', sectionId: 'node_missing' }, /was not found/], [{ bundleId: 'a-sync', path: 'execution.md', sectionId: 'generated-slug' }, /Invalid/]]) {
    const result = await page.evaluate(ref => pFlow.activateSearchResult(ref, 'query'), reference);
    assert.equal(result.ok, false); assert.match(await page.locator('#navigation-notice').textContent(), expected);
    assert.equal(await page.locator('#node-name').textContent(), 'Invoke refresh component');
    assert.equal(await page.locator('#workspace-title').textContent(), 'Refresh command');
  }
});

test('stale entity IDs and absent backlinks show documentation only with feedback', async t => {
  const page = await open(t);
  await page.evaluate(() => {
    pFlowDocuments['a-sync']['stale.md'] = '# Stale\n<a id="node_gone"></a>\n## Archived passage\nSearchable stale content.';
    pFlow.search.setIndex(pFlow.buildMarkdownSearchIndex([{ bundleId: 'a-sync', path: 'stale.md', markdown: pFlowDocuments['a-sync']['stale.md'] }]));
  });
  await openSearchHit(page, 'stale content');
  assert.equal(await page.locator('#workspace-title').textContent(), 'Refresh command');
  assert.equal(await inspectorEmpty(page), true);
  assert.match(await page.locator('#navigation-notice').textContent(), /no unique current diagram entity/);
  assert.match(await page.locator('#document-body').textContent(), /Searchable stale content/);
  await page.evaluate(() => {
    const sample = structuredClone(pFlowSamples[0]); delete sample.architecture.flows[2].nodes.find(node => node.label === 'Fetch state').docs; pFlow.initializeSample(sample);
    const payload = Object.entries(pFlowDocuments['a-sync']).map(([path, markdown]) => ({ bundleId: 'a-sync', path, markdown })); pFlow.search.setIndex(pFlow.buildMarkdownSearchIndex(payload));
  });
  await openSearchHit(page, 'host unresolved');
  assert.match(await page.locator('#navigation-notice').textContent(), /backlink/);
  assert.equal(await page.locator('.diagram-node.is-selected').count(), 0);
});

test('async edge search selects its owning relationship; consumer search uses its separate entry', async t => {
  const page = await open(t);
  await openSearchHit(page, 'matching labels alone');
  assert.equal(await page.locator('#workspace-title').textContent(), 'Publish job');
  assert.equal(await page.locator('.diagram-edge.is-selected').getAttribute('data-edge-id'), 'edge_3656a413844b');
  assert.equal(await page.locator('#node-kind').textContent(), 'receive · async');
  assert.deepEqual(await crumbs(page).allTextContents(), ['Submit command']);
  await openSearchHit(page, 'database product');
  assert.equal(await page.locator('#workspace-title').textContent(), 'Process job');
  assert.equal(await page.locator('#node-name').textContent(), 'Write message');
  assert.deepEqual(await crumbs(page).allTextContents(), ['Indexer worker']);
  assert.equal(await page.locator('#navigation-back').isEnabled(), false);
});

test('unreachable detail Flow opens directly with an explicit notice and no invented path', async t => {
  const page = await open(t);
  await page.evaluate(() => { const sample = structuredClone(pFlowSamples[0]); delete sample.architecture.flows[1].nodes.find(node => node.expandFlowId).expandFlowId; pFlow.initializeSample(sample); });
  await openSearchHit(page, 'host unresolved');
  assert.deepEqual(await crumbs(page).allTextContents(), ['Read state']);
  assert.equal(await page.locator('#node-name').textContent(), 'Fetch state');
  assert.equal(await page.locator('.entry-button[aria-pressed=true]').count(), 0);
  assert.equal(await page.locator('#navigation-back').isEnabled(), false);
  assert.match(await page.locator('#navigation-notice').textContent(), /No entry-point expansion path.*Opened directly/);
  assert.ok(await page.locator('mark.search-match').count() > 0);
});

test('search reuses the selected entry path to a reusable Flow and preserves its caller context', async t => {
  const page = await open(t);
  await page.evaluate(() => {
    const sample = structuredClone(pFlowSamples[0]), parent = sample.architecture.flows[1];
    sample.architecture.flows.push({ id: 'flow_alternate', label: 'Alternate activation', startNodeId: 'node_alternate', nodes: [{ id: 'node_alternate', label: 'Alternate caller', kind: 'operation', sourceIds: parent.nodes[0].sourceIds, expandFlowId: parent.id }], edges: [] });
    sample.architecture.entryPoints.push({ id: 'entry_alternate', label: 'Alternate entry', trigger: 'Custom activation', flowId: 'flow_alternate', sourceIds: parent.nodes[0].sourceIds });
    pFlow.initializeSample(sample);
  });
  await page.getByRole('button', { name: 'Alternate entry', exact: true }).click();
  await openSearchHit(page, 'host unresolved');
  assert.deepEqual(await crumbs(page).allTextContents(), ['Alternate entry', 'Refresh component', 'Read state']);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  assert.match(await page.locator('#workspace-description').textContent(), /via Alternate caller/);
  await page.getByRole('button', { name: 'Top level: return to first flow in this path', exact: true }).click();
  assert.equal(await page.locator('#workspace-title').textContent(), 'Alternate activation');
});

test('search reveals a selected node in a panned current Flow without replacing the SVG or trail', async t => {
  const page = await open(t);
  await page.getByLabel('Displayed flow').selectOption({ label: 'Read state' });
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await page.locator('.diagram-svg').focus();
  await page.locator('.diagram-svg').evaluate(svg => { globalThis.originalSearchSvg = svg; for (let i = 0; i < 30; i++) svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })); });
  const before = await page.locator('.diagram-scene').getAttribute('transform');
  await openSearchHit(page, 'host unresolved');
  assert.equal(await page.evaluate(() => originalSearchSvg === document.querySelector('.diagram-svg')), true);
  assert.notEqual(await page.locator('.diagram-scene').getAttribute('transform'), before);
  assert.deepEqual(await crumbs(page).allTextContents(), ['Read state']);
  assert.ok(await page.locator('.diagram-node.is-selected').evaluate(el => { const node = el.getBoundingClientRect(), box = document.querySelector('#diagram-container').getBoundingClientRect(); return node.left >= box.left && node.right <= box.right && node.top >= box.top && node.bottom <= box.bottom; }));
});

test('search highlights stay in the indexed section and update or clear with ordinary navigation', async t => {
  const page = await open(t);
  await openSearchHit(page, 'validate input', '#flow_844c0963da42');
  assert.equal(await page.locator('.doc-target > p mark.search-match').count(), 3);
  assert.equal(await page.locator('.doc-target .markdown-section mark.search-match').count(), 0);
  await openSearchHit(page, 'host unresolved');
  assert.deepEqual(await page.locator('mark.search-match').allTextContents(), ['host', 'unresolved']);
  await page.getByRole('tab', { name: 'Evidence references', exact: true }).click();
  await page.getByRole('tab', { name: 'Documentation', exact: true }).click();
  assert.equal(await page.locator('mark.search-match').count(), 2);
  await selectNode(page, 'Validate with input_rules').click();
  assert.equal(await page.locator('mark.search-match').count(), 0);
  assert.equal(await page.locator('#node-name').textContent(), 'Validate with input_rules');
});

test('stale search payload activation closes safely, reports missing content and preserves the query', async t => {
  const page = await open(t);
  await page.evaluate(() => { delete pFlowDocuments['a-sync']['execution.md']; });
  await openSearchHit(page, 'host unresolved');
  assert.equal(await page.locator('#search-popup').isVisible(), false);
  assert.match(await page.locator('#navigation-notice').textContent(), /not embedded/);
  assert.equal(await page.locator('#navigation-notice').evaluate(el => el === document.activeElement), true);
  assert.equal(await page.locator('#workspace-title').textContent(), 'Refresh command');
  await page.keyboard.press('Control+k');
  assert.equal(await page.locator('#global-search').inputValue(), 'host unresolved');
  await page.locator('#global-search').fill('zznoresults'); await page.keyboard.press('Enter');
  assert.equal(await page.locator('#search-popup').isVisible(), true);
  assert.equal(await page.locator('#search-empty').textContent(), 'No matching sections.');
});

test('untrusted matched prose is highlighted as text and missing owning sections prevent synchronization', async t => {
  const page = await open(t);
  await page.evaluate(() => {
    const sample = pFlowSamples[0], id = sample.architecture.flows[2].nodes.find(node => node.label === 'Fetch state').id;
    const markdown = `# Fixture\n<a id="${id}"></a>\n## Unnested node\nUnsafe text <img src=x onerror="globalThis.searchInjected=1"> remains literal.`;
    pFlowDocuments['a-sync']['execution.md'] = markdown;
    pFlow.search.setIndex(pFlow.buildMarkdownSearchIndex([{ bundleId: 'a-sync', path: 'execution.md', markdown }]));
  });
  await openSearchHit(page, 'unsafe remains');
  assert.match(await page.locator('#navigation-notice').textContent(), /not nested in its owning Flow/);
  assert.equal(await page.locator('.diagram-node.is-selected').count(), 0);
  assert.equal(await page.locator('#document-body img, #document-body script').count(), 0);
  assert.match(await page.locator('#document-body').textContent(), /<img src=x/);
  assert.equal(await page.evaluate(() => globalThis.searchInjected), undefined);
  assert.equal(await page.locator('mark.search-match').count(), 2);
});

test('clicking a row from a pending previous query refreshes results without opening a different hit', async t => {
  const page = await open(t);
  await page.locator('#global-search').fill('host unresolved'); await page.keyboard.press('ArrowDown');
  await page.locator('#global-search').evaluate(input => { input.value = 'database product'; input.dispatchEvent(new Event('input', { bubbles: true })); document.querySelector('.search-result').click(); });
  assert.equal(await page.locator('#workspace-title').textContent(), 'Refresh command');
  assert.equal(await page.locator('#search-popup').isVisible(), true);
  assert.match(await page.locator('#search-results').textContent(), /Job store/);
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#workspace-title').textContent(), 'Process job');
  assert.equal(await page.locator('#node-name').textContent(), 'Write message');
});

test('EntryPoint result activates its explicit root and highlighted source citations remain usable', async t => {
  const page = await open(t);
  await openSearchHit(page, 'scheduler registration', '#entry_614ac3cd60a1');
  assert.equal(await page.locator('#app-layout').getAttribute('data-bundle-id'), 'c-custom');
  assert.equal(await page.locator('.entry-button[aria-pressed=true]').getAttribute('data-entry-id'), 'entry_614ac3cd60a1');
  assert.deepEqual(await crumbs(page).allTextContents(), [samples[2].architecture.entryPoints[0].label]);
  assert.equal(await page.locator('.diagram-node.is-selected').count(), 0);
  await page.locator('.doc-target .source-link').first().click();
  assert.equal(await page.getByRole('tab', { name: 'Evidence references', exact: true }).getAttribute('aria-selected'), 'true');
  assert.match(await page.locator('#source-fields').textContent(), /tasks\.xml/);
  assert.match(await page.locator('#source-unavailable').textContent(), /not embedded/);
});

test('Builder HTML retains the Viewer section/format/link structure and raw Markdown search behavior', async t => {
  const page = await open(t);
  const markdown = '# Contract\n<a id="flow_sample"></a>\n## Flow\n**Strong** and *emphasis* with `code` and [detail](execution.md#node_sample).\n<a id="node_sample"></a>\n### Node\nA searchable passage.';
  const processed = processMarkdown(markdown, { path: 'execution.md', sources: [] });
  const result = await page.evaluate(({ markdown, html }) => {
    const native = pFlow.renderContractMarkdown(markdown, { path: 'execution.md', sources: [] }).root;
    const parsed = new DOMParser().parseFromString(html, 'text/html').body.firstElementChild;
    const summarize = root => ({ ids: [...root.querySelectorAll('[id]')].map(node => node.id), text: root.textContent, strong: root.querySelector('strong').textContent, emphasis: root.querySelector('em').textContent, link: root.querySelector('[data-document-path]').dataset.documentSection });
    return { native: summarize(native), processed: summarize(parsed), hits: pFlow.createMarkdownSearcher(pFlow.buildMarkdownSearchIndex([{ bundleId: 'test', path: 'execution.md', markdown }])).search('searchable passage').results.map(item => item.sectionId) };
  }, { markdown, html: processed.html });
  assert.deepEqual(result.native, result.processed); assert.deepEqual(result.hits, ['node_sample']);
});

function generatedFixture(t, { mutate, limits } = {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'pflow-generated-input-'));
  const moved = mkdtempSync(path.join(tmpdir(), 'pflow-generated-output-'));
  t.after(() => { rmSync(root, { recursive: true, force: true }); rmSync(moved, { recursive: true, force: true }); });
  cpSync(path.join(repositoryRoot, 'examples'), path.join(root, 'examples'), { recursive: true });
  if (mutate) mutate(root);
  const output = path.join(root, 'architecture.html');
  writeStandaloneHTML(prepareBuild({ input: root, output, limits }));
  const standalone = path.join(moved, 'architecture.html'); writeFileSync(standalone, readFileSync(output));
  rmSync(root, { recursive: true, force: true });
  return standalone;
}
async function openGenerated(t, file, width = 1440) {
  const page = await open(t, width, file);
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  await page.context().setOffline(true); await page.reload();
  t.after(() => assert.deepEqual(requests, [pathToFileURL(file).href], 'Standalone reload and interactions must load only the generated HTML'));
  return page;
}

test('relocated standalone HTML preserves diagrams, navigation, inspector, processed documents, snippets and search offline', async t => {
  const file = generatedFixture(t), page = await openGenerated(t, file);
  assert.equal(await page.locator('#entry-groups .entry-button').count(), samples.reduce((n,s)=>n+s.architecture.entryPoints.length,0));
  assert.equal(await page.locator('script[src],link,[src]').count(), 0);
  assert.equal(await page.locator('.diagram-node').count(), samples[0].architecture.flows[0].nodes.length);
  // Demonstrate that generated documents use prepared fragments, not a second Markdown parse.
  await page.evaluate(() => { pFlow.renderContractMarkdown = () => { throw new Error('Unexpected raw Markdown fallback in generated output'); }; });
  await detailButton(page, 'Invoke refresh component').click();
  assert.equal(await page.locator('#workspace-title').textContent(), 'Refresh component');
  await page.locator('#document-body').getByRole('button', { name: 'function detail', exact: true }).click();
  assert.equal(await page.locator('#document-reference').textContent(), 'execution.md#flow_844c0963da42');
  assert.equal(await page.locator('#workspace-title').textContent(), 'Refresh component');
  await detailButton(page, 'Invoke read_state').click();
  await selectNode(page, 'Fetch state').click();
  assert.equal(await page.locator('#node-name').textContent(), 'Fetch state');
  const before = await page.locator('.diagram-scene').getAttribute('transform');
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  assert.notEqual(await page.locator('.diagram-scene').getAttribute('transform'), before);
  await page.getByRole('button', { name: 'Fit view', exact: true }).click();
  await page.getByRole('tab',{name:'Details',exact:true}).click(); await page.locator('#source-references button').first().click();
  assert.equal(await page.locator('#source-snippet').isVisible(), true);
  assert.equal(await page.locator('#source-snippet li').first().getAttribute('value'), '6');
  assert.match(await page.locator('#source-snippet code').textContent(), /http\.get\(STATE_URL/);
  assert.equal(await page.locator('#source-unavailable').isVisible(), false);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.keyboard.press('Control+k'); await page.locator('#global-search').fill('host unresolved'); await page.keyboard.press('Enter');
  assert.equal(await page.locator('#node-name').textContent(), 'Fetch state');
  assert.deepEqual(await page.locator('mark.search-match').allTextContents(), ['host', 'unresolved']);
  assert.equal(await page.locator('#document-status').textContent(), '');
  await selectBundle(page, 'examples/b-async/architecture.json');
  const edge = page.locator('.diagram-edge[data-edge-id="edge_3656a413844b"]'); await edge.focus(); await page.keyboard.press('Enter');
  assert.equal(await page.locator('#node-kind').textContent(), 'receive · async');
  await page.getByRole('tab',{name:'Details',exact:true}).click(); await page.locator('#source-references button').filter({ hasText: 'bindings.xml' }).click();
  assert.match(await page.locator('#source-snippet').textContent(), /<subscription channel="jobs"/);
  await selectBundle(page, 'examples/c-custom/architecture.json');
  await page.keyboard.press('Control+k'); await page.locator('#global-search').fill('archive service performs'); await page.keyboard.press('Enter');
  assert.equal(await page.locator('#node-name').textContent(), 'Compact archive');
  assert.equal(await page.locator('#workspace-title').textContent(), 'Rollup handler');
  assert.equal(await page.locator('#document-status').textContent(), '');
});

test('standalone data preserves closing sequences and Unicode as inert graph, Markdown and source text', async t => {
  const attack = '</script><script>globalThis.generatedInjected=1</script><!-- & café 日本語 \u2028\u2029';
  const file = generatedFixture(t, { mutate(root) {
    const json = path.join(root, 'examples/a-sync/architecture.json'), data = JSON.parse(readFileSync(json, 'utf8'));
    data.flows[2].nodes.find(node => node.id === 'node_d1e0f061c044').label = attack; writeFileSync(json, JSON.stringify(data));
    const markdown = path.join(root, 'examples/a-sync/docs/execution.md');
    writeFileSync(markdown, readFileSync(markdown, 'utf8').replace('## Source evidence', 'Malicious prose <img src=x onerror="globalThis.generatedInjected=1"> & café 日本語.\n\n## Source evidence'));
    const source = path.join(root, 'examples/a-sync/sources/state.py.txt'), lines = readFileSync(source, 'utf8').split('\n'); lines[5] = `    value = ${JSON.stringify(attack)}`; writeFileSync(source, lines.join('\n'));
  } });
  const page = await openGenerated(t, file);
  await page.keyboard.press('Control+k'); await page.locator('#global-search').fill('malicious prose'); await page.keyboard.press('Enter');
  assert.equal(await page.locator('#node-name').textContent(), attack);
  assert.equal(await page.locator('#document-body img, #document-body script').count(), 0);
  assert.match(await page.locator('#document-body').textContent(), /<img src=x onerror=/);
  await page.getByRole('tab',{name:'Details',exact:true}).click(); await page.locator('#source-references button').first().click();
  assert.match(await page.locator('#source-snippet').textContent(), /<\/script><script>globalThis.generatedInjected/);
  assert.equal(await page.locator('#source-snippet script, #source-snippet img').count(), 0);
  assert.equal(await page.evaluate(() => globalThis.generatedInjected), undefined);
  assert.equal(await page.locator('script').count(), 2);
  assert.equal(await page.locator('#pflow-data').evaluate(node => /[<>\u2028\u2029]/.test(node.textContent)), false);
});

test('embedded warning states clear stale snippets while retaining accurate source metadata', async t => {
  const page = await openGenerated(t, generatedFixture(t, { limits: { snippetLines: 1 } }));
  await page.keyboard.press('Control+k'); await page.locator('#global-search').fill('host unresolved'); await page.keyboard.press('Enter');
  await page.getByRole('tab',{name:'Details',exact:true}).click(); await page.locator('#source-references button').first().click(); assert.equal(await page.locator('#source-snippet').isVisible(), true);
  await page.getByRole('button', { name: 'Top level: return to first flow in this path', exact: true }).click();
  await selectNode(page, 'Invoke refresh component').click(); await page.getByRole('tab',{name:'Details',exact:true}).click(); await page.locator('#source-references button').first().click();
  assert.equal(await page.locator('#source-snippet').isVisible(), false); assert.equal(await page.locator('#source-snippet li').count(), 0);
  assert.match(await page.locator('#source-unavailable').textContent(), /Range exceeds 1 lines/);
  assert.match(await page.locator('#source-fields').textContent(), /command.py.txt/);
});

test('fragment hydration rejects active markup and unsafe control targets before insertion', async t => {
  const page = await open(t);
  const result = await page.evaluate(() => [
    '<div class="markdown-body"><img src="https://example.invalid/x" onerror="bad()"></div>',
    '<div class="markdown-body"><script>bad()</script></div>',
    '<div class="markdown-body"><button data-document-path="javascript:bad()">Open</button></div>',
    '<div class="markdown-body"><section id="bad-id">Bad</section></div>',
  ].map(html => { try { pFlow.hydrateContractMarkdown(html, { sources: [] }); return false; } catch { return true; } }));
  assert.deepEqual(result, [true, true, true, true]);
  assert.equal(await page.locator('#workspace-title').textContent(), 'Refresh command');
});

test('generated evidence controls and snippet remain visible in the right documentation column', async t => {
  const page = await openGenerated(t, generatedFixture(t), 900);
  await page.keyboard.press('Control+k'); await page.locator('#global-search').fill('host unresolved'); await page.keyboard.press('Enter');
  await page.getByRole('tab',{name:'Details',exact:true}).click(); await page.locator('#source-references button').first().click();
  assert.equal(await page.locator('#source-picker').evaluate(el => el === document.activeElement), true);
  assert.ok(await page.locator('#source-picker').evaluate(el => { const box = el.getBoundingClientRect(), header = document.querySelector('.app-header').getBoundingClientRect(); return box.top >= header.bottom && box.bottom < innerHeight; }));
  assert.ok(await page.locator('#source-snippet').evaluate(el => { const box = el.getBoundingClientRect(); return box.top >= 0 && box.bottom < innerHeight; }));
});
