// Shared M1-03 profile checks, not a general Markdown parser.
import { readFileSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { validateArtifact } from './validate-artifact.mjs';

export function validateDocumentation(data, { docsRoot, sourceRoot, readSourceText }) {
  const errors = validateArtifact(data, { docsRoot, sourceRoot, readSourceText });
  if (errors.length) return errors;
  const fail = (at, message) => errors.push({ phase: 'markdown', path: at, message });
  const entities = new Map();
  const owners = new Map();
  for (const entry of data.entryPoints) entities.set(entry.id, entry);
  for (const flow of data.flows) {
    entities.set(flow.id, flow);
    for (const item of [...flow.nodes, ...flow.edges]) {
      entities.set(item.id, item);
      owners.set(item.id, flow.id);
    }
  }
  const sources = new Map(data.sources.map(source => [source.id, source]));
  const allowedSources = entity => {
    if (entity.nodes) return new Set([...entity.nodes, ...entity.edges].flatMap(item => item.sourceIds));
    return new Set(entity.sourceIds);
  };
  const files = new Set(['index.md']);
  for (const entity of entities.values()) {
    for (const doc of entity.docs ?? []) files.add(path.posix.normalize(doc.path));
  }
  const documents = new Map();
  const sections = new Map();
  const links = [];
  const canonicalRoot = realpathSync(docsRoot);
  for (const file of [...files].sort()) {
    let text;
    try {
      const target = realpathSync(path.resolve(canonicalRoot, file));
      const relative = path.relative(canonicalRoot, target);
      if (relative.startsWith(`..${path.sep}`) || relative === '..' || path.isAbsolute(relative)) {
        fail(file, 'Document escapes bundle root'); continue;
      }
      if (!statSync(target).isFile()) throw new Error('not a file');
      text = readFileSync(target, 'utf8');
    } catch { fail(file, 'Missing Markdown document'); continue; }

    const document = { definitions: new Map(), labels: new Set(), citations: new Set() };
    documents.set(file, document);
    const lines = text.split(/\r?\n/);
    const stack = [];
    let fence;
    let pending;
    let titleCount = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]; const at = `${file}:${i + 1}`;
      const fenceLine = line.match(/^\s{0,3}(`{3,}|~{3,})(.*)$/);
      if (fence) {
        if (fenceLine && fenceLine[1][0] === fence[0] && fenceLine[1].length >= fence.length
            && !fenceLine[2].trim()) fence = undefined;
        continue;
      }
      if (fenceLine) {
        if (pending) { fail(at, 'Section anchor must be followed by a heading'); pending = undefined; }
        fence = fenceLine[1]; continue;
      }
      if (!line.trim()) continue;
      const anchor = line.match(/^<a id="((?:entry|flow|node|edge)_[A-Za-z0-9_-]+)"><\/a>$/);
      const heading = line.match(/^(#{1,6})\s+\S.*$/);
      if (pending && !heading) { fail(at, 'Section anchor must be followed by a heading'); pending = undefined; }
      if (anchor) { pending = { id: anchor[1], at }; continue; }
      if (/<a\b|<[^>]*\bid\s*=/.test(line)) fail(at, 'Invalid section identifier or anchor syntax');
      if (heading) {
        const level = heading[1].length;
        if (level === 1) titleCount++;
        while (stack.length && stack.at(-1).level >= level) stack.pop();
        if (pending) {
          const section = { ...pending, file, level, citations: new Set() };
          pending = undefined;
          if (level === 1) fail(at, 'Entity section cannot be the document title');
          const entity = entities.get(section.id);
          if (!entity) fail(section.at, `Unknown section entity ${section.id}`);
          if (sections.has(section.id)) fail(section.at, `Ambiguous duplicate section identifier ${section.id}`);
          else sections.set(section.id, section);
          if (owners.has(section.id)) {
            const flowSection = stack.findLast(item => item.id.startsWith('flow_'));
            if (flowSection?.id !== owners.get(section.id)) fail(at, 'Node or Edge section must be nested under its owning Flow');
          }
          stack.push(section);
        }
      }
      const definition = line.match(/^\[(src_[A-Za-z0-9_-]+)\]:\s+(\S+)\s*$/);
      if (definition) {
        const [, id, target] = definition;
        if (document.definitions.has(id)) fail(at, `Duplicate source definition ${id}`);
        else if (document.labels.has(id.toLowerCase())) fail(at, `Ambiguous source label after case folding: ${id}`);
        document.labels.add(id.toLowerCase());
        document.definitions.set(id, { target, at });
        continue;
      }
      if (/^\[src_[^\]]*\]:/.test(line)) fail(at, 'Invalid source definition syntax');
      for (const match of line.matchAll(/\[(src_[A-Za-z0-9_-]+)\](?![\[(])/g)) {
        const id = match[1]; document.citations.add(id);
        if (!sources.has(id)) fail(at, `Unknown source citation ${id}`);
        const section = stack.at(-1);
        if (section) {
          section.citations.add(id);
          const entity = entities.get(section.id);
          if (entity && !allowedSources(entity).has(id)) fail(at, `Source ${id} is not associated with section ${section.id}`);
        }
      }
      const inlineLink = /\[[^\]\n]+\]\(([^)\s]+)\)/g;
      for (const match of line.matchAll(inlineLink)) links.push({ file, at, target: match[1] });
      if (line.replace(inlineLink, '').includes('](')) fail(at, 'Unsupported navigation link syntax');
    }
    if (pending) fail(pending.at, 'Section anchor must be followed by a heading');
    if (fence) fail(file, 'Unclosed fenced example');
    if (titleCount !== 1) fail(file, 'Document must have exactly one ATX level-1 title');
  }

  for (const entity of entities.values()) {
    const ownLinks = (entity.docs ?? []).filter(doc => doc.anchor === entity.id);
    if ((entity.nodes || entity.docs?.length) && !ownLinks.length) {
      fail(entity.id, 'Missing canonical entity-to-section docs relationship');
    }
    const section = sections.get(entity.id);
    for (const doc of ownLinks) {
      if (!section || section.file !== path.posix.normalize(doc.path)) fail(entity.id, 'Canonical docs target does not match its section');
    }
  }
  for (const section of sections.values()) {
    const entity = entities.get(section.id);
    if (!entity) continue;
    if (!(entity.docs ?? []).some(doc => doc.anchor === section.id && path.posix.normalize(doc.path) === section.file)) {
      fail(section.at, 'Section has no matching entity docs backlink');
    }
    if (!section.citations.size) fail(section.at, 'Entity section must cite associated source evidence');
  }
  const indexFlows = new Set();
  for (const link of links) {
    const match = link.target.match(/^([^#%\s]*\.md)(?:#((?:entry|flow|node|edge)_[A-Za-z0-9_-]+))?$/);
    if (!match || /^[A-Za-z][A-Za-z0-9+.-]*:/.test(link.target) || link.target.includes('\\')) {
      fail(link.at, `Invalid navigation target ${link.target}`); continue;
    }
    const file = path.posix.normalize(path.posix.join(path.posix.dirname(link.file), match[1]));
    if (path.posix.isAbsolute(match[1]) || file === '..' || file.startsWith('../') || !documents.has(file)) {
      fail(link.at, `Navigation target is outside the documented bundle: ${link.target}`); continue;
    }
    const id = match[2];
    if (id && sections.get(id)?.file !== file) fail(link.at, `Missing navigation section ${link.target}`);
    else if (link.file === 'index.md' && id?.startsWith('flow_')) indexFlows.add(id);
  }
  for (const flow of data.flows) {
    if (!indexFlows.has(flow.id)) fail('index.md', `Index must link to Flow ${flow.id}`);
  }
  for (const [file, document] of documents) {
    for (const id of document.citations) {
      if (!document.definitions.has(id)) fail(file, `Missing source definition ${id}`);
    }
    for (const [id, { target, at }] of document.definitions) {
      const source = sources.get(id);
      if (!source) { fail(at, `Unknown source definition ${id}`); continue; }
      if (!document.citations.has(id)) fail(at, `Unused source definition ${id}`);
      const match = target.match(/^([^#%\s]+)(?:#(L[0-9]+(?:-L[0-9]+)?))?$/);
      if (!match || path.posix.isAbsolute(match[1]) || /^[A-Za-z][A-Za-z0-9+.-]*:/.test(target) || target.includes('\\')) {
        fail(at, 'Invalid relative source target'); continue;
      }
      let expected = '';
      if (source.startLine !== undefined) {
        expected = `L${source.startLine}`;
        if (source.startLine !== source.endLine) expected += `-L${source.endLine}`;
      }
      if ((match[2] ?? '') !== expected) fail(at, `Source range does not match ${id}`);
      try {
        const actual = realpathSync(path.resolve(docsRoot, path.posix.dirname(file), match[1]));
        const wanted = realpathSync(path.resolve(sourceRoot, source.path));
        if (actual !== wanted) fail(at, `Source path does not match ${id}`);
      } catch { fail(at, `Missing source target ${target}`); }
    }
  }
  return errors;
}
