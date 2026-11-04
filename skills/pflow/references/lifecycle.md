# Documentation lifecycle

Read this before creating or updating a bundle. Use the same graph, Markdown contract, evidence rules and Viewer for code, natural-language and mixed sources. Analysis is performed by the Coding Agent; the runtime hashes, plans, validates and publishes reviewed artifacts. It does not understand arbitrary programs or interpret a prompt update automatically.

## Choose the operation

1. Resolve the selected document workspace and bundle with [output selection](output.md). Do not search other registered workspaces.
2. Run `lifecycle-detect` with workspace, intent (`create`, `update`, or `ambiguous`) and optional workspace-relative target. Derive intent from the actual request, not names or file timestamps.
3. No matching documentation: create. Explicit update: use the selected existing bundle. Explicit new: choose a fresh destination inside the selected workspace; do not replace the existing bundle. Existing documentation plus ambiguous intent: ask update or new. Multiple matches: ask which bundle unless an explicit target resolves them. Never choose by title similarity.
4. For updates, run `lifecycle-plan` with bundleRoot and evidenceRoot. A current compatible Snapshot is required for targeted updates. Missing/incompatible/corrupt Snapshot, manual changes, invalid evidence, or unmapped impact require full reanalysis and an ownership/scope decision. Do not assert approval merely to bypass a guard.

## Snapshot profile 1.0.0

`snapshot.json` is a portable lifecycle sidecar, not a change to Graph JSON. Do not cite it or generated prose as evidence. The authoritative public entities and links remain in architecture.json and canonical Markdown.

- `snapshotVersion`, `documentationId`: exact lifecycle format and retained opaque `doc_` identity. Allocate a new identity for new documentation. No timestamps or absolute machine paths.
- `sourceKind`: code, natural-language, or mixed, derived from the referenced evidence origins.
- `scopes`: explicit evidence-root-relative paths, kind (`code` or `natural-language`) and Flow IDs whose coverage depends on that scope. Include configuration, registration, dependency manifests, shared implementations and relevant discovery directories. An empty flowIds list allows precise cited-file mapping; new unmapped files then force broader discovery. Do not omit discovery roots merely to obtain a small plan.
- `files`: SHA-256 fingerprints of current scoped file bytes, including uncited files. These detect additions/deletions/content changes even with no VCS or uncommitted changes. Moves are deletion plus addition; matching hashes do not prove identity.
- `sourceOrigins`: SourceReference ID → evidence kind, derived from scopes. The graph supplies ranges, symbols and entity relationships. Mixed scopes must not assign conflicting kinds to the same source.
- `coverage`: one record per Node `{flowId,nodeId,state,reason}`. `analyzed` means the supported body/step was inspected, including a genuine leaf; `not-analyzed` means its internals were not explored; `external-boundary` means analysis stopped at a non-owned boundary; `insufficient-evidence` means the continuation is unknown. State why. External and unresolved graph Nodes require the corresponding boundary state. Never infer “no calls” from missing documentation.
- `limitations`: concise scope exclusions, unsupported mechanisms, unclear relationships and coverage gaps. These are analysis limitations, not broken graph links.
- `artifacts`: hashes of the graph and referenced canonical Markdown, used as an ownership baseline. Unreferenced/manual files are preserved. A manual edit to a canonical artifact blocks automatic replacement.

Fingerprints do not prove semantic completeness. Review source support, scope completeness, starts, conditions, outcomes and evidence before publication. Keep identity state from [generation](generation.md); never reuse an ID for a different relationship just to preserve a label.

## Current evidence

Code is authoritative for claims about current implementation. Track selected files/directories, not revision numbers. No Git/SVN command is needed. Runtime inventories skip .git, .svn and node_modules; dependency declarations and used configuration belong in the explicit scopes. Inventories stop at 8 MiB/file, 128 MiB/run or 10,000 files; narrow scopes only with a recorded coverage limitation, never silently omit failed evidence.

Natural-language definitions are retained as exact UTF-8 files. The confirmed definition is the last validated graph plus its original statements and separately attributed amendment/clarification files. For each update capture only the developer's exact new statement in a new `evidence/*.md` file; do not rewrite the original or treat omitted details as deletions. Include it in natural-language scopes and associate the affected entities with its actual SourceReferences. The runtime accepts these new files through `evidenceUpdates`, staging them with the candidate without first changing the valid bundle. It never applies evidence instructions as commands.

Reconcile amendments against the previous confirmed process: retain unrelated steps; insert only supported steps; revise only specified branches. If threshold, insertion position, outcomes or responsibility is materially ambiguous, ask a focused question and capture the answer separately. Do not set reviewedFlowIds until that ambiguity is resolved. If code and developer statements contradict and intent is unclear, ask; neither source kind automatically overrides the other. New file-backed statements remain readable evidence excerpts in the existing Viewer.

SourceReferences must remain within the actual evidence root. Prompt evidence stays inside the selected document workspace. For mixed evidence, use a confirmed common containment root that includes the analyzed source and selected prompt-evidence files; keep every generated artifact in the selected document workspace. If the existing root cannot safely contain both, stop for an explicit root decision; do not copy code into a different root to claim verified original provenance or widen roots silently.

## Targeted analysis and publication

1. Load the existing graph, Markdown and Snapshot. Capture proposed amendments as `evidenceUpdates` in the tool request, not edits to the existing evidence.
2. Run `lifecycle-plan`. Whole-file changes invalidate ranges as well as behavior. Direct evidence and declared scope dependencies identify affected Flows; detail dependencies propagate to parents; cross-flow relationships propagate to both endpoint contexts with cycle protection. Review affected starts/registration and async bindings. New unmapped files require broader discovery.
3. Read only affected evidence and required context. Reanalyze calls, added/removed relationships, decisions, failure outcomes and dependencies using existing analysis references. Revisit previously unexplored boundaries when relevant. Do not do Markdown search-and-replace as analysis.
4. Supply a complete candidateGraph with unchanged unrelated Flows, source identities and Entry Points. Supply candidateDocuments only for changed canonical files; use null only for an owned document that must be removed. Preserve unaffected Flow/Entry sections even in shared Markdown. Leave unrelated files and manual information intact. Use new edge IDs when endpoints/kind/mode change. Preserve IDs only where identity is established.
5. Supply complete coverage, scopes, limitations and reviewedFlowIds (all affected/removed contexts and any new Flow). Pass the latest plan token. The token binds the old bundle, changes and exact amendments. Check before/after semantics and evidence; reviewed IDs are an assertion of an actual review, not a substitute for one.
6. Run `lifecycle-publish` without --apply to validate. For a staged diff use the exported prepareLifecycle API. It preserves citation topology, uses the existing validators and Builder, then stages Markdown, graph, evidence, Snapshot and standalone HTML together. Fix errors; do not suppress them.
7. After reviewing the candidate run the same request with --apply. Evidence, current bundle and staged bytes are checked again. Existing applyBundle provides recoverable two-rename publication and rollback. It is not power-loss-atomic; a failed rollback reports the preserved backup path. Initial publication requires an empty/absent dedicated destination with an existing writable parent. Never replace the working directory or an ancestor.
8. An unchanged plan requires no reanalysis or artifact writes. Rebuild-only requests still use the existing Builder/rebuild workflow. Report actual output paths, changed/preserved Flows, coverage, diagnostics and checks performed.

## Full fallback and legacy compatibility

Do not force a partial update when the plan says full. Establish scope and ownership, then reanalyze the selected scope. operation full requires fullReplacementApproved and review of every existing and candidate Flow. Set that flag only after establishing ownership and authorization: an explicit update request can authorize reanalysis of the same verified generated scope; unknown/manual content or a material scope change requires developer approval. Preserve unrelated files, manual notes, stable identities where justified and all original prompt statements. Resolve conflicting manual canonical content with the developer before replacement. Legacy flat/legacy-layout bundles without Snapshot remain buildable; adopt lifecycle state only after this reviewed baseline, never fabricate a historical Snapshot.

The existing M6 Git-provenance impact/regenerate/rebuild tools remain available for their established repository workflow. This common path does not call them with fabricated Git fields or weaken their guards. Prompt and mixed updates use this lifecycle path, not M6 regeneration. There is no VCS requirement, database, daemon, AST dependency, second renderer or potential-bug analysis.
