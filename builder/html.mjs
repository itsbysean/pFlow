import { mkdtempSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { parseHTML } from 'linkedom';
import { BuildError, validateOutput } from './pipeline.mjs';
import { defaultViewerRoot, readViewerAsset, viewerAssetFiles } from './viewer-assets.mjs';

const fail = (artifact, phase, message) => new BuildError([{ artifact, phase, path: '/', message }]);
export function serializeEmbeddedData(value) {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, char => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`);
}
const hash = content => `'sha256-${createHash('sha256').update(content).digest('base64')}'`;
function readAsset(root, name) {
  if (!/^[a-z][a-z0-9-]*\.(html|js|css)$/.test(name)) throw fail(name, 'packaging', 'Unsupported Viewer asset path.');
  try { return readViewerAsset(root, name); }
  catch { throw fail(name, 'packaging', 'Required Viewer asset is missing or unreadable.'); }
}
const bootstrap = `const embedded = JSON.parse(document.getElementById('pflow-data').textContent);
globalThis.pFlowSamples = embedded.map(item => ({ key: item.key, title: item.title, architecture: item.architecture }));
globalThis.pFlowDocuments = Object.fromEntries(embedded.map(item => [item.key, Object.fromEntries(item.documents.map(doc => [doc.path, doc.markdown]))]));
globalThis.pFlowContent = Object.fromEntries(embedded.map(item => [item.key, { documents: Object.fromEntries(item.documents.map(doc => [doc.path, { html: doc.html, sections: doc.sections }])), snippets: item.snippets, diagnostics: item.diagnostics, findings: item.findings }]));
`;
export function generateHTML(prepared, { viewerRoot = defaultViewerRoot } = {}) {
  if (!prepared.artifacts?.length) throw fail('.', 'packaging', 'No prepared architecture artifacts are available.');
  const { document } = parseHTML(readAsset(viewerRoot, 'index.html'));
  const scripts = [...document.querySelectorAll('script[src]')], styles = [...document.querySelectorAll('link[rel="stylesheet"]')];
  if (!scripts.length || styles.length !== 1 || document.querySelectorAll('script:not([src])').length) throw fail('index.html', 'packaging', 'Viewer template must declare its runtime scripts and one stylesheet.');
  const runtime = [];
  for (const script of scripts) {
    const name = script.getAttribute('src');
    if (!['sample-data.js', 'sample-documents.js'].includes(name)) runtime.push(readAsset(viewerRoot, name));
    script.remove();
  }
  const css = readAsset(viewerRoot, styles[0].getAttribute('href'));
  if (/<\/style|@import|url\(/i.test(css)) throw fail('viewer.css', 'packaging', 'Viewer CSS contains an unsupported resource or raw-text boundary.');
  const style = document.createElement('style'); style.textContent = css; styles[0].replaceWith(style);
  const payload = prepared.artifacts.map(artifact => ({
    key: artifact.path,
    title: parseHTML(artifact.documents.find(doc => doc.path === 'index.md').html).document.querySelector('h1')?.textContent || artifact.path,
    architecture: artifact.architecture,
    documents: artifact.documents.map(({ path, markdown, html, sections }) => ({ path, markdown, html, sections })),
    snippets: artifact.snippets,
    findings: artifact.findings?.rows || [],
    diagnostics: prepared.diagnostics.filter(issue => issue.artifact === artifact.path).map(({ path, message }) => ({ path, message })),
  }));
  const data = document.createElement('script'); data.id = 'pflow-data'; data.type = 'application/json'; data.textContent = serializeEmbeddedData(payload);
  // Escape raw-text closing boundaries in trusted JS literals/comments, not user data.
  const js = (bootstrap + runtime.join('\n;\n')).replace(/<\/script/gi, match => match.replace('/', '\\/'));
  const executable = document.createElement('script'); executable.textContent = js;
  const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (!csp) throw fail('index.html', 'packaging', 'Viewer template has no content security policy.');
  csp.content = `default-src 'none'; script-src ${hash(js)}; style-src ${hash(css)}; img-src data:; connect-src 'none'; font-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`;
  document.querySelector('noscript').textContent = 'Enable JavaScript to explore the embedded architecture documentation.';
  for (const node of document.querySelectorAll('[src],[srcset],[href],[poster],link')) {
    if (node.hasAttribute('href') && node.getAttribute('href').startsWith('#') && !node.hasAttribute('src') && node.tagName !== 'LINK') continue;
    throw fail('index.html', 'packaging', 'Viewer template contains an unsupported external resource.');
  }
  document.body.append(data, executable);
  return document.toString();
}
export function writeStandaloneHTML(prepared, options = {}) {
  const viewerRoot = options.viewerRoot || defaultViewerRoot;
  let protectedPaths;
  try { protectedPaths = viewerAssetFiles(viewerRoot); }
  catch { throw fail('index.html', 'packaging', 'Required Viewer assets are missing or unreadable.'); }
  for (const artifact of prepared.artifacts) {
    const json = path.join(prepared.inputRoot, artifact.path); protectedPaths.push(json);
    protectedPaths.push(...artifact.documents.map(doc => path.join(artifact.docsRoot, doc.path)));
    if(artifact.findings)protectedPaths.push(artifact.findings.path,...artifact.findings.protectedPaths);
    protectedPaths.push(...artifact.architecture.sources.map(source => path.join(prepared.repositoryRoot, source.path)));
  }
  const destination = validateOutput(prepared.outputPath, protectedPaths);
  const html = generateHTML(prepared, options);
  let temporary;
  try {
    temporary = mkdtempSync(path.join(path.dirname(destination), '.pflow-'));
    const file = path.join(temporary, 'architecture.html');
    writeFileSync(file, html, { encoding: 'utf8', flag: 'wx' });
    validateOutput(destination, protectedPaths);
    renameSync(file, destination);
  } catch (error) {
    if (error instanceof BuildError) throw error;
    throw fail(destination, 'output', `Could not write standalone HTML (${error.code || error.message}).`);
  } finally { if (temporary) rmSync(temporary, { recursive: true, force: true }); }
  return { outputPath: destination, bytes: Buffer.byteLength(html) };
}
