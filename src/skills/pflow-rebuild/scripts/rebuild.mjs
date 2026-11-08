import { constants, openSync, closeSync, fstatSync, readSync, realpathSync, lstatSync, readFileSync, writeFileSync, unlinkSync, chmodSync } from 'node:fs';
import { rename as renameFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import { BuildError, prepareBuild, discoverArtifacts, validateOutput } from '../../../../builder/pipeline.mjs';
import { writeStandaloneHTML } from '../../../../builder/html.mjs';
import { defaultViewerRoot, viewerAssetFiles } from '../../../../builder/viewer-assets.mjs';

const fail = (phase, message, artifact = '.', at = '/', suggestion) => new BuildError([{ artifact, phase, path: at, message, ...(suggestion ? { suggestion } : {}) }]);
const hash = value => createHash('sha256').update(value).digest('hex');
function fingerprint(file) {
  const canonical = realpathSync(file), fd = openSync(canonical, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const before = fstatSync(fd, { bigint: true });
    if (!before.isFile()) throw fail('freshness', 'Expected a regular input file.', file);
    const digest = createHash('sha256'), buffer = Buffer.alloc(64 * 1024);
    let count;
    while ((count = readSync(fd, buffer, 0, buffer.length, null))) digest.update(buffer.subarray(0, count));
    const after = fstatSync(fd, { bigint: true });
    if (before.size !== after.size || before.mtimeNs !== after.mtimeNs || before.ctimeNs !== after.ctimeNs || realpathSync(file) !== canonical) throw fail('freshness', 'Input changed while it was read.', file);
    return { path: path.resolve(file), canonical, digest: digest.digest('hex') };
  } finally { closeSync(fd); }
}
function viewerPaths(viewerRoot) {
  try {
    return viewerAssetFiles(viewerRoot);
  } catch (error) { throw fail('packaging', `Cannot inspect Viewer assets: ${error.message}`, 'index.html'); }
}
function snapshot(prepared, viewerRoot) {
  const inventory = discoverArtifacts(prepared.inputRoot).artifacts;
  const files = [...viewerPaths(viewerRoot)];
  for (const artifact of prepared.artifacts) {
    const json = path.join(prepared.inputRoot, artifact.path);
    if(artifact.findings)files.push(artifact.findings.path,...artifact.findings.protectedPaths);
    files.push(json, ...artifact.documents.map(doc => path.join(artifact.docsRoot, doc.path)), ...artifact.architecture.sources.map(source => path.join(prepared.repositoryRoot, source.path)));
  }
  const paths = [...new Set(files.map(file => path.resolve(file)))].sort();
  let records;
  try { records = paths.map(fingerprint); }
  catch (error) { if (error instanceof BuildError) throw error; throw fail('freshness', `Cannot read an input or Viewer file (${error.code || error.message}).`); }
  return { digest: hash(JSON.stringify({ input: prepared.inputRoot, repositoryRoot: prepared.repositoryRoot, inventory, records })), protectedPaths: paths };
}
export async function inspectArchitectureSet({ input, repositoryRoot, output, limits, viewerRoot = defaultViewerRoot }) {
  const options = { input, repositoryRoot, output, limits };
  const first = prepareBuild(options), before = snapshot(first, viewerRoot);
  const prepared = prepareBuild(options), after = snapshot(prepared, viewerRoot);
  if (before.digest !== after.digest) throw fail('freshness', 'Architecture inputs or Viewer assets changed during inspection.', '.', '/', 'Inspect the complete set again and repeat index review.');
  validateOutput(prepared.outputPath, after.protectedPaths);
  return { prepared, digest: after.digest, protectedPaths: after.protectedPaths,
    indexInventory: prepared.artifacts.map(artifact => ({ artifact: artifact.path, indexPath: path.relative(prepared.inputRoot,path.join(artifact.docsRoot,'index.md')).split(path.sep).join('/'), entries: artifact.architecture.entryPoints.map(({ id, label, trigger, flowId }) => ({ id, label, trigger, flowId })), index: artifact.documents.find(doc => doc.path === 'index.md').markdown })) };
}
function reviewRequired(review, inspection) {
  const indexPath=inspection.indexInventory.length===1?inspection.indexInventory[0].indexPath:'/';
  if (!review || review.digest !== inspection.digest || !['pass', 'fail'].includes(review.outcome) || !Array.isArray(review.findings)) throw fail('review', 'A matching completed index and trigger review is required.', '.', indexPath, 'Review every current index against indexInventory and supply its exact inspection digest.');
  if (review.outcome !== 'pass' || review.findings.length) {
    const diagnostics = review.findings.map(finding => ({ ...finding, artifact: finding.artifact || '.', phase: 'review', path: finding.path || inspection.indexInventory.find(item=>item.artifact===finding.artifact)?.indexPath || indexPath, message: finding.message || 'Index review found an unresolved issue.' }));
    throw diagnostics.length ? new BuildError(diagnostics) : fail('review', 'Index review did not pass.', '.', indexPath, 'Resolve the findings and repeat the complete review.');
  }
}
function outputState(file) {
  try {
    const info = lstatSync(file, { bigint: true });
    if (!info.isFile() || info.isSymbolicLink()) throw fail('output', 'Output must remain a regular file.', file);
    return { fingerprint: fingerprint(file), dev: String(info.dev), ino: String(info.ino), size: String(info.size), mtime: String(info.mtimeNs), ctime: String(info.ctimeNs), mode: Number(info.mode) };
  } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
export async function rebuildArchitectureSet({ input, repositoryRoot, output, limits, viewerRoot = defaultViewerRoot, indexReview, rename = renameFile, beforeCommit }) {
  const options = { input, repositoryRoot, output, limits, viewerRoot };
  const inspection = await inspectArchitectureSet(options);
  reviewRequired(indexReview, inspection);
  const destination = validateOutput(inspection.prepared.outputPath, inspection.protectedPaths), prior = outputState(destination);
  const temporary = path.join(path.dirname(destination), `.pflow-rebuild-${randomUUID()}.html`);
  let owned = false;
  try {
    writeFileSync(temporary, '', { flag: 'wx' }); owned = true;
    writeStandaloneHTML({ ...inspection.prepared, outputPath: temporary }, { viewerRoot });
    const staged = fingerprint(temporary);
    if (beforeCommit) await beforeCommit({ temporary, output: destination });
    const current = await inspectArchitectureSet(options);
    if (current.digest !== inspection.digest) throw fail('freshness', 'Architecture inputs, discovery inventory, or Viewer assets changed before publication.', '.', '/', 'Inspect and review the current complete set again.');
    validateOutput(destination, current.protectedPaths);
    if (JSON.stringify(outputState(destination)) !== JSON.stringify(prior)) throw fail('freshness', 'The existing HTML changed before publication.', destination);
    if (JSON.stringify(fingerprint(temporary)) !== JSON.stringify(staged)) throw fail('freshness', 'Staged HTML changed before publication.', temporary);
    if (prior?.fingerprint.digest === staged.digest) return { outputPath: destination, bytes: lstatSync(temporary).size, unchanged: true, digest: inspection.digest };
    if (prior) chmodSync(temporary, prior.mode & 0o777);
    await rename(temporary, destination);
    owned = false;
    return { outputPath: destination, bytes: lstatSync(destination).size, unchanged: false, digest: inspection.digest };
  } catch (error) {
    if (error instanceof BuildError) throw error;
    throw fail('output', `Could not publish standalone HTML (${error.code || error.message}).`, destination);
  } finally { if (owned) { try { unlinkSync(temporary); } catch (error) { if (error.code !== 'ENOENT') throw error; } } }
}
