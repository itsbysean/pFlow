import { parseHTML } from 'linkedom';
import '../viewer/details-inspector.js';
import '../viewer/markdown.js';

// Use the same allowlisted native-DOM renderer as the Viewer. Parse only a fixed shell.
export function processMarkdown(markdown, { path, sources }) {
  const { document } = parseHTML('<!doctype html><html><body></body></html>');
  const rendered = globalThis.pFlow.renderContractMarkdown(markdown, { path, sources, document });
  return { html: rendered.root.outerHTML, sections: rendered.headings.map(({ id, label }) => ({ id, label })) };
}
