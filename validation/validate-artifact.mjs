// Shared structural and semantic checks for the approved M1 contract.
import { readFileSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import schema from '../schema/architecture-1.0.0.schema.json' with { type: 'json' };
import Ajv2020 from 'ajv/dist/2020.js';

export { schema };
const ajv = new Ajv2020({ allErrors: true, strict: true });
export const validateStructure = ajv.compile(schema);

export function validateArtifact(data, { docsRoot, sourceRoot, readSourceText }) {
  if (!validateStructure(data)) {
    return validateStructure.errors.map(error => ({
      phase: 'schema', path: error.instancePath || '/', message: error.message,
    }));
  }

  const errors = [];
  const fail = (at, message) => errors.push({ phase: 'semantic', path: at, message });
  const entries = new Map();
  const flows = new Map();
  const nodes = new Map();
  const sources = new Map();
  const owner = new Map();
  const all = [];
  const register = (entity, at, collection) => {
    if (entries.has(entity.id)) fail(`${at}/id`, `Duplicate ID ${entity.id}`);
    entries.set(entity.id, entity);
    collection?.set(entity.id, entity);
    all.push([entity, at]);
  };
  data.entryPoints.forEach((entry, i) => register(entry, `/entryPoints/${i}`));
  data.sources.forEach((source, i) => register(source, `/sources/${i}`, sources));
  data.flows.forEach((flow, i) => {
    const at = `/flows/${i}`;
    register(flow, at, flows);
    flow.nodes.forEach((node, j) => {
      register(node, `${at}/nodes/${j}`, nodes);
      owner.set(node.id, flow.id);
    });
    flow.edges.forEach((edge, j) => register(edge, `${at}/edges/${j}`));
  });
  // Duplicate identity makes subsequent reference resolution ambiguous.
  if (errors.length) return errors;

  const requireRef = (collection, id, at, type) => {
    if (!collection.has(id)) fail(at, `Unknown ${type} reference ${id}`);
  };
  // Resolve actual fixture files, including symlinks, inside the selected root.
  const readInside = (root, relative, at, reader = readFileSync) => {
    if (path.posix.isAbsolute(relative) || /^[A-Za-z]:/.test(relative)
        || relative.includes('\\') || relative.split('/').includes('..')) {
      fail(at, `Path must remain relative and inside its root: ${relative}`);
      return;
    }
    try {
      const canonicalRoot = realpathSync(root);
      const target = realpathSync(path.resolve(canonicalRoot, relative));
      const rel = path.relative(canonicalRoot, target);
      if (rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
        fail(at, `Path escapes its root: ${relative}`);
        return;
      }
      if (!statSync(target).isFile()) throw new Error('not a file');
      return reader(target, 'utf8');
    } catch {
      fail(at, `Referenced file is missing or unreadable: ${relative}`);
    }
  };

  for (const [entity, at] of all) {
    entity.sourceIds?.forEach((id, i) => requireRef(sources, id, `${at}/sourceIds/${i}`, 'source'));
    entity.docs?.forEach((doc, i) => {
      const location = `${at}/docs/${i}`;
      if (!doc.path.endsWith('.md')) fail(`${location}/path`, 'Documentation must reference Markdown');
      const markdown = readInside(docsRoot, doc.path, `${location}/path`);
      if (markdown !== undefined && doc.anchor) {
        // Samples use explicit HTML section anchors; no renderer-specific slug rules.
        const anchors = [...markdown.matchAll(/<a\s+id=["']([^"']+)["']\s*><\/a>/g)].map(match => match[1]);
        if (!anchors.includes(doc.anchor)) fail(`${location}/anchor`, `Missing document anchor ${doc.anchor}`);
      }
    });
  }
  data.sources.forEach((source, i) => {
    const at = `/sources/${i}`;
    const text = readInside(sourceRoot, source.path, `${at}/path`, readSourceText);
    if (source.startLine !== undefined) {
      if (source.startLine > source.endLine) fail(at, 'Source range starts after its end');
      if (text !== undefined) {
        const lineCount = text ? text.replace(/(?:\r\n|\r|\n)$/, '').split(/\r\n|\r|\n/).length : 0;
        if (source.endLine > lineCount) fail(at, `Source range exceeds ${lineCount} lines`);
      }
    }
  });
  data.entryPoints.forEach((entry, i) => requireRef(flows, entry.flowId, `/entryPoints/${i}/flowId`, 'flow'));
  data.flows.forEach((flow, i) => {
    const at = `/flows/${i}`;
    if (owner.get(flow.startNodeId) !== flow.id) fail(`${at}/startNodeId`, 'Flow start must be a local node');
    const branchLabels = new Map();
    flow.nodes.forEach((node, j) => {
      if (node.expandFlowId !== undefined) requireRef(flows, node.expandFlowId, `${at}/nodes/${j}/expandFlowId`, 'expansion flow');
    });
    flow.edges.forEach((edge, j) => {
      const location = `${at}/edges/${j}`;
      requireRef(nodes, edge.from, `${location}/from`, 'node');
      requireRef(nodes, edge.to, `${location}/to`, 'node');
      if (owner.get(edge.from) !== flow.id) fail(`${location}/from`, 'Edge must be owned by its source flow');
      if (nodes.get(edge.from)?.kind === 'terminal') fail(location, 'Terminal node cannot have outgoing execution edges');
      const crossFlow = nodes.has(edge.to) && owner.get(edge.to) !== flow.id;
      if (crossFlow && edge.kind === 'next') fail(location, 'next describes local continuation');
      if (crossFlow && edge.kind === 'receive' && edge.mode !== 'async') {
        fail(location, 'Cross-flow receive must be asynchronous');
      }
      if (edge.kind === 'branch') {
        if (nodes.get(edge.from)?.kind !== 'decision') fail(location, 'Branch must originate at a decision');
        const labels = branchLabels.get(edge.from) ?? new Set();
        if (labels.has(edge.label)) fail(`${location}/label`, 'Branch outcome labels must be distinct');
        labels.add(edge.label);
        branchLabels.set(edge.from, labels);
      }
    });
    // A proven transfer can enter a flow at a node other than its normal start.
    const reachable = new Set([flow.startNodeId]);
    for (const other of data.flows) {
      if (other.id === flow.id) continue;
      for (const edge of other.edges) if (owner.get(edge.to) === flow.id) reachable.add(edge.to);
    }
    const adjacency = new Map();
    for (const edge of flow.edges) {
      if (owner.get(edge.to) !== flow.id) continue;
      const targets = adjacency.get(edge.from) ?? [];
      targets.push(edge.to);
      adjacency.set(edge.from, targets);
    }
    const queue = [...reachable];
    for (let cursor = 0; cursor < queue.length; cursor++) {
      for (const target of adjacency.get(queue[cursor]) ?? []) {
        if (!reachable.has(target)) { reachable.add(target); queue.push(target); }
      }
    }
    flow.nodes.forEach((node, j) => {
      if (!reachable.has(node.id)) fail(`${at}/nodes/${j}`, 'Node is unreachable from the flow start or a cross-flow entry');
    });
  });
  return errors;
}
