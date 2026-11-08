// Read-only draft impact closure. Output is transient planning data, not an artifact schema.
import { realpathSync } from 'node:fs';
import path from 'node:path';
import { validateDocumentation } from '../../../../validation/validate-documentation.mjs';
const sorted = values => [...new Set(values)].sort();
export function planImpact({ architecture, docsRoot, baselineSourceRoot, snapshotCommit, changeSet }) {
  const flows = Array.isArray(architecture?.flows) ? architecture.flows : [];
  const entries = Array.isArray(architecture?.entryPoints) ? architecture.entryPoints : [];
  const fallback = reason => ({ mode: 'full', baselineCommit: changeSet?.baselineCommit, scope: changeSet?.scope,
    directlyAffectedFlows: [], transitivelyAffectedFlows: [], affectedEntries: [], rediscoverEntries: [], relationships: [], unmappedPaths: [],
    unresolved: [reason], recommendation: 'Full analysis is required before precise incremental planning; do not regenerate documentation.' });
  if (!changeSet?.baselineCommit || !['commit', 'working-tree'].includes(changeSet.scope) || !Array.isArray(changeSet.changes)) return fallback('Missing reliable Git comparison scope.');
  if (!snapshotCommit || snapshotCommit !== changeSet.baselineCommit) return fallback('Baseline artifact provenance is missing or conflicts with the selected commit. An opaque revision is not Git provenance.');
  if (!baselineSourceRoot || !docsRoot) return fallback('Missing retained baseline source/document snapshot. Do not validate old evidence against the changed checkout.');
  let errors;
  try { errors = validateDocumentation(architecture, { docsRoot, sourceRoot: baselineSourceRoot }); }
  catch (error) { return fallback(`Baseline validation failed: ${error.message}`); }
  if (errors.length) return fallback(`Invalid baseline artifacts: ${errors.map(e => `${e.phase}:${e.path}: ${e.message}`).join('; ')}`);
  const canonicalRoot = realpathSync(baselineSourceRoot);
  const pathKeys = value => {
    const keys = new Set([path.posix.normalize(value)]);
    try {
      const relative = path.relative(canonicalRoot, realpathSync(path.resolve(canonicalRoot, value)));
      if (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)) keys.add(relative.split(path.sep).join('/'));
    } catch { /* An added path may not exist in the baseline. */ }
    return keys;
  };
  const keysBySource = new Map(architecture.sources.map(s => [s.id, pathKeys(s.path)]));
  const matches = (s, change) => [change.path, ...(change.oldPath ? [change.oldPath] : [])].some(p => [...pathKeys(p)].some(key => keysBySource.get(s.id).has(key)));
  const owners = new Map(flows.flatMap(f => f.nodes.map(n => [n.id, f.id])));
  const direct = new Map(), transitive = new Map(), affectedSources = new Set(), rediscover = new Map(), dependencies = new Map(), relationshipEdges = [];
  const add = (map, key, reason) => { const reasons = map.get(key) ?? new Set(); reasons.add(reason); map.set(key, reasons); };
  const depend = (from, to, reason) => { const list = dependencies.get(from) ?? []; list.push({ to, reason }); dependencies.set(from, list); };
  for (const f of flows) {
    for (const n of f.nodes) if (n.expandFlowId) depend(n.expandFlowId, f.id, `Hierarchical parent context through ${n.id}; expansion is navigation, not a new execution edge.`);
    for (const e of f.edges) {
      const target = owners.get(e.to);
      if (target !== f.id) {
        relationshipEdges.push({ flowId: f.id, targetFlowId: target, edge: e });
        depend(f.id, target, `Cross-flow relationship ${e.id} requires both contexts to be reviewed.`);
        depend(target, f.id, `Incoming cross-flow relationship ${e.id} requires source context review.`);
      }
    }
  }
  const evidence = new Map();
  for (const change of changeSet.changes) {
    for (const s of architecture.sources.filter(s => matches(s, change))) {
      affectedSources.add(s.id);
      let reason = `${change.status} ${s.path}: whole-file/context evidence review`;
      if (change.status === 'R' || change.status === 'D') reason = `${change.status} ${s.path}: stored path must be revalidated; rename detection does not establish identity`;
      else if (s.startLine !== undefined && change.hunks?.length) {
        const touches = change.hunks.some(h => h.oldLines > 0 ? h.oldStart <= s.endLine && h.oldStart + h.oldLines - 1 >= s.startLine : h.oldStart >= s.startLine - 1 && h.oldStart < s.endLine);
        const shifts = change.hunks.some(h => (h.oldLines === 0 ? h.oldStart < s.endLine : h.oldStart <= s.endLine) && h.oldLines !== h.newLines);
        reason = `${change.status} ${s.path}: ${touches ? 'baseline range changed' : shifts ? 'stored range may shift' : 'file context changed outside the cited range; inspect before excluding'}`;
      }
      evidence.set(s.id, reason);
    }
  }
  for (const entry of entries) for (const id of entry.sourceIds) if (affectedSources.has(id)) {
    add(direct, entry.flowId, `${id}: ${evidence.get(id)}; activation evidence for ${entry.id}`);
    add(rediscover, entry.id, `${id}: activation/registration evidence changed; inspect repository-specific mechanism.`);
  }
  for (const f of flows) for (const entity of [...f.nodes, ...f.edges]) for (const id of entity.sourceIds) if (affectedSources.has(id)) add(direct, f.id, `${id}: ${evidence.get(id)}; cited by ${entity.id}`);
  const queue = [...direct.keys()], visited = new Set(queue);
  for (let i = 0; i < queue.length; i++) for (const dep of dependencies.get(queue[i]) ?? []) {
    if (!direct.has(dep.to)) add(transitive, dep.to, `${queue[i]}: ${dep.reason}`);
    if (!visited.has(dep.to)) { visited.add(dep.to); queue.push(dep.to); }
  }
  const rows = map => [...map].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([id, reasons]) => ({ id, reasons: sorted(reasons) }));
  const unmapped = changeSet.changes.filter(c => !architecture.sources.some(s => matches(s, c))).map(c => ({ path: c.path, status: c.status, reason: 'No baseline evidence maps this change. Inspect ownership, registration, loaders and dispatch; do not assume no impact.' }));
  const relationships = relationshipEdges.filter(r => visited.has(r.flowId) || visited.has(r.targetFlowId)).map(r => ({ id: r.edge.id, sourceFlowId: r.flowId, targetFlowId: r.targetFlowId, kind: r.edge.kind, mode: r.edge.mode, reason: 'Revalidate invocation, binding and both endpoint contexts; impact is not proof of runtime delivery.' })).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const moved = new Set(changeSet.changes.filter(c => ['R','D'].includes(c.status)).flatMap(c => [...pathKeys(c.oldPath ?? c.path)]));
  const sourcePaths = sorted(architecture.sources.map(s => s.path));
  const major = sourcePaths.length > 1 && architecture.sources.every(s => [...keysBySource.get(s.id)].some(key => moved.has(key)));
  return {
    mode: major ? 'full' : unmapped.length ? 'review' : 'targeted', baselineCommit: changeSet.baselineCommit, targetCommit: changeSet.targetCommit, scope: changeSet.scope,
    changes: changeSet.changes, affectedSources: sorted(affectedSources), directlyAffectedFlows: rows(direct), transitivelyAffectedFlows: rows(transitive),
    affectedEntries: entries.filter(e => visited.has(e.flowId)).map(e => ({ id: e.id, flowId: e.flowId, reason: 'Root execution context is in the impact closure.' })).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0),
    rediscoverEntries: rows(rediscover), relationships, unmappedPaths: unmapped,
    unresolved: [...(major ? ['All documented source paths were moved/deleted; broader rediscovery is required.'] : []), ...unmapped.map(c => `${c.path}: ${c.reason}`)],
    recommendation: major ? 'Full rediscovery before incremental analysis.' : 'Inspect changed context and unmapped paths, confirm registration/configuration scope, then report the targeted analysis plan. Do not regenerate.'
  };
}
