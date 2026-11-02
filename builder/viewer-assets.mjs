// File-backed in development; replaced with immutable data by the Skill build.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseHTML } from 'linkedom';
const embedded = typeof __PFLOW_VIEWER_ASSETS__ === 'undefined' ? undefined : __PFLOW_VIEWER_ASSETS__;
export const defaultViewerRoot = embedded ? undefined : fileURLToPath(new URL('../viewer/', import.meta.url));
export function readViewerAsset(root, name) {
  if (!/^[a-z][a-z0-9-]*\.(html|js|css)$/.test(name)) throw new Error('Unsupported Viewer asset path.');
  if (embedded && root === undefined) {
    if (!Object.hasOwn(embedded, name)) throw new Error('Required embedded Viewer asset is missing.');
    return embedded[name];
  }
  return readFileSync(path.join(root, name), 'utf8');
}
export function viewerAssetFiles(root = defaultViewerRoot) {
  // Protect/fingerprint the whole executable, including all immutable Viewer data.
  if (embedded && root === undefined) return [fileURLToPath(import.meta.url)];
  const { document } = parseHTML(readViewerAsset(root, 'index.html'));
  const names = [...document.querySelectorAll('script[src],link[rel="stylesheet"]')].map(node => node.getAttribute('src') || node.getAttribute('href'));
  if (names.some(name => !/^[a-z][a-z0-9-]*\.(html|js|css)$/.test(name))) throw new Error('Unsupported Viewer asset path.');
  return ['index.html', ...names].map(name => path.join(root, name));
}
