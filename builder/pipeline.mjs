import { constants, accessSync, lstatSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { validateStructure } from '../validation/validate-artifact.mjs';
import { validateDocumentation } from '../validation/validate-documentation.mjs';
import { processMarkdown } from './markdown.mjs';
import { createSourceProcessor, sourceLimits } from './sources.mjs';
import { resolveBundleLayout } from './bundle-layout.mjs';

const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const portable = name => name.split(path.sep).join('/');
const within = (root, target) => { const rel = path.relative(root, target); return rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel); };
export class BuildError extends Error {
  constructor(diagnostics) { super('Build input preparation failed.'); this.diagnostics = diagnostics; }
}
const diagnostic = (artifact, phase, at, message) => ({ artifact, phase, path: at, message });
const ordered = diagnostics => diagnostics.sort((a, b) => compare(a.artifact, b.artifact) || compare(a.phase, b.phase) || compare(a.path, b.path) || compare(a.message, b.message));
function rootDirectory(input, label = 'Input') {
  try { const root = realpathSync(input); if (!statSync(root).isDirectory()) throw new Error(); return root; }
  catch { throw new BuildError([diagnostic(typeof input === 'string' ? input : '.', 'discovery', '/', `${label} directory is missing or unreadable.`)]); }
}
function containedFile(root, target) {
  const canonical = realpathSync(target);
  if (!within(root, canonical)) throw new Error('Path escapes input root.');
  if (!statSync(canonical).isFile()) throw new Error('Expected a regular file.');
  return canonical;
}
export function discoverArtifacts(input) {
  const root = rootDirectory(input), artifacts = [], errors = [];
  function walk(directory) {
    const relative = portable(path.relative(root, directory)) || '.';
    let entries;
    try { entries = readdirSync(directory, { withFileTypes: true }).sort((a, b) => compare(a.name, b.name)); }
    catch { errors.push(diagnostic(relative, 'discovery', '/', 'Directory is unreadable.')); return; }
    for (const entry of entries) {
      const target = path.join(directory, entry.name), at = portable(path.relative(root, target));
      // VCS metadata is not documentation. Directory symlinks are not traversed.
      if (entry.name === 'architecture.json') {
        try { containedFile(root, target); artifacts.push(at); }
        catch (error) { errors.push(diagnostic(at, 'discovery', '/', error.message)); }
      } else if (entry.isDirectory() && entry.name !== '.git') walk(target);
    }
  }
  walk(root);
  if (!artifacts.length) errors.push(diagnostic('.', 'discovery', '/', 'No architecture.json artifacts were found.'));
  if (errors.length) throw new BuildError(ordered(errors));
  return { root, artifacts: artifacts.sort(compare) };
}
export function validateOutput(output, protectedPaths = []) {
  let destination;
  try {
    if (typeof output !== 'string' || !output.trim() || output.includes('\0')) throw new Error('Output path must be a nonempty file path.');
    destination = path.resolve(output);
    if (!destination.toLowerCase().endsWith('.html')) throw new Error('Output path must end in .html.');
    const parent = realpathSync(path.dirname(destination));
    if (!statSync(parent).isDirectory()) throw new Error('Output parent must be a directory.');
    accessSync(parent, constants.W_OK);
    try {
      const existing = lstatSync(destination);
      if (existing.isSymbolicLink() || !existing.isFile()) throw new Error('Output must be a regular file, not a directory or symbolic link.');
      accessSync(destination, constants.W_OK);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    destination = path.join(parent, path.basename(destination));
    const existing = statIfPresent(destination);
    if (protectedPaths.some(target => {
      const source = statIfPresent(target);
      return path.resolve(target) === destination || (existing && source && existing.ino === source.ino && existing.dev === source.dev);
    })) throw new Error('Output would overwrite an input artifact or evidence file.');
  } catch (error) {
    throw new BuildError([diagnostic(typeof output === 'string' ? output : '.', 'output', '/', error.code ? 'Output directory/file is missing, unreadable, or not writable.' : error.message)]);
  }
  return destination;
}
function statIfPresent(file) { try { return statSync(file); } catch { return undefined; } }

export function prepareBuild({ input, output, repositoryRoot, limits }) {
  const discovered = discoverArtifacts(input), artifacts = [], errors = [], diagnostics = [], protectedPaths = [];
  const sourceRoot = repositoryRoot === undefined ? discovered.root : rootDirectory(repositoryRoot, 'Repository root');
  try { limits = sourceLimits(limits); } catch (error) { throw new BuildError([diagnostic('.', 'source', '/', error.message)]); }
  // Validate the explicit destination before reporting preparation success. Never write it.
  let outputPath;
  try { outputPath = validateOutput(output); } catch (error) { errors.push(...error.diagnostics); }
  for (const file of discovered.artifacts) {
    const absolute = path.join(discovered.root, file);
    let resolved, docsRoot;
    let architecture;
    try { architecture = JSON.parse(readFileSync(containedFile(discovered.root, absolute), 'utf8')); }
    catch (error) { errors.push(diagnostic(file, 'load', '/', error instanceof SyntaxError ? `Invalid JSON: ${error.message}` : error.message)); continue; }
    if (!validateStructure(architecture)) {
      errors.push(...validateStructure.errors.map(error => {
        const expected = error.keyword === 'const' ? `: ${JSON.stringify(error.params.allowedValue)}` : error.keyword === 'enum' ? `: ${error.params.allowedValues.join(', ')}` : '';
        return diagnostic(file, 'schema', error.instancePath || '/', error.message + expected);
      })); continue;
    }
    try {
      resolved = resolveBundleLayout(absolute, { inputRoot: discovered.root });
      docsRoot = resolved.docsRoot;
    } catch (error) { errors.push(diagnostic(file, 'discovery', 'docs/', error.code ? 'Missing or unreadable sibling docs directory.' : error.message)); continue; }
    const processor = createSourceProcessor({ repositoryRoot: sourceRoot, limits });
    const validation = validateDocumentation(architecture, { docsRoot, sourceRoot, readSourceText: processor.readText });
    if (validation.length) { errors.push(...validation.map(error => diagnostic(file, error.phase, error.path, error.message))); continue; }
    const names = new Set(['index.md']);
    const entities = [...architecture.entryPoints, ...architecture.flows.flatMap(flow => [flow, ...flow.nodes, ...flow.edges])];
    for (const entity of entities) for (const reference of entity.docs || []) names.add(path.posix.normalize(reference.path));
    const documents = [];
    try {
      for (const name of [...names].sort(compare)) {
        const target = containedFile(discovered.root, path.join(docsRoot, name));
        const markdown = readFileSync(target, 'utf8');
        documents.push({ path: name, markdown, ...processMarkdown(markdown, { path: name, sources: architecture.sources }) }); protectedPaths.push(target);
      }
      protectedPaths.push(absolute, ...architecture.sources.map(source => realpathSync(path.join(sourceRoot, source.path))));
      const processed = processor.extract(architecture.sources, new Set(entities.flatMap(entity => entity.sourceIds || [])));
      const issues = processed.diagnostics.map(issue => ({ artifact: file, ...issue }));
      errors.push(...issues.filter(issue => issue.severity === 'error'));
      diagnostics.push(...issues.filter(issue => issue.severity === 'warning'));
      artifacts.push({ path: file, architecture, documents, snippets: processed.snippets, ...resolved });
    } catch (error) { errors.push(diagnostic(file, 'load', '/', error.message)); }
  }
  if (outputPath) {
    try { validateOutput(outputPath, protectedPaths); } catch (error) { errors.push(...error.diagnostics); }
  }
  if (errors.length) throw new BuildError(ordered(errors));
  return { inputRoot: discovered.root, repositoryRoot: sourceRoot, outputPath, artifacts, diagnostics: ordered(diagnostics) };
}
