# Incremental change and impact evaluation

Use [pflow-impact](../skills/pflow-impact/SKILL.md) for change detection and impact planning only. The main generation Skill routes these requests without starting its generation or HTML sequence. No M1 fields, dependency or persistent impact format are added.

## Evidence and algorithm

The Git helper accepts an explicit source root, baseline and scope: commit → explicit commit, or baseline → final working tree including staged/unstaged and nonignored untracked files. It resolves refs to commit IDs, retains old rename paths and old-side zero-context hunks, uses NUL records/literal pathspecs and sorts paths. Git built-in normalization is not semantic equality. An unstaged move may appear as deletion plus untracked addition; rename similarity is never identity proof.

Target scripts, hooks, fsmonitor, external diff/textconv, custom clean/process filters and lazy remote object fetch are not analysis tools. The collector disables external execution and rejects indexed submodules, partial/promisor clones, suppressed index entries in working-tree scope and unsupported special-file reads. These are explicit conservative limits, not silent exclusions. Two repeated fingerprints detect some concurrent edits; they are not atomic snapshots. Ignored files and separate nested repositories need explicit coverage review.

The draft helper requires independently established bundle/source provenance equal to the resolved baseline. revision stays opaque and is not used as a commit. It calls the shared schema/semantic/Markdown validator against actual retained baseline files. It must not validate old references against a deleted/shifted current tree. Missing/conflicting provenance, missing snapshot or invalid artifacts recommends full analysis.

Changed normalized/contained source identities map through EntryPoint, Node and Edge sourceIds. Nodes/edges imply owning Flows; entries imply root/activation scope. Every reference in a changed file is reviewed: hunks distinguish edited ranges, possible shifts and outside-range context, without assuming unchanged text is safe. Detail Flows link back to hierarchical parents; cross-flow relationships connect both endpoint contexts for revalidation. A visited set terminates cycles. No execution meaning, IDs, source paths or documents are rewritten.

This is a conservative draft. The Skill inspects actual changed context, M5 mechanism/coverage notes and precise binding/registration chains before issuing its final plan. Unmapped changes require triage rather than no-impact claims. Source review can establish an unrelated exclusion, or require scoped/broader discovery of new registration, runtime loaders and import dependents absent from the old graph. No static closed framework taxonomy is used.

## Deterministic fixtures and checks

[test/fixtures/impact](../test/fixtures/impact/) contains inert owned source/configuration and an M1 baseline graph/docs. alpha and beta open shared detail; shared and consumer form an evidence-backed event cycle; unrelated is independent at the execution-body level. Temporary real Git repositories retain physical baseline source/docs before each mutation. Fixture setup authors commits only in those disposable repositories. Production helpers never commit, checkout, reset, stash, stage, modify index flags or write target files.

Run `node --test test/git-changes.test.mjs test/impact-planning.test.mjs` (25 tests). Coverage includes:

- Final staged plus unstaged changes, added/untracked/ignored files, deletion, staged pure/edited rename and unstaged delete/add representation.
- Explicit committed comparison independent of dirty content, unknown/missing baselines, binary/type evidence, spaces/newlines/leading-colon paths and old-side hunks.
- Single shared-method change reaching two entry roots and the async component while excluding the independent root; whole-file context and pre-reference line shifts.
- Stored paths after move/delete, config-driven entry rediscovery, producer destination and both asynchronous relationships; finite cycles and no speculative recipient creation.
- Unmapped new registration and unrelated notes requiring source review without blanket graph invalidation.
- Missing/conflicting provenance, invalid artifacts, wrong current-source validation and broad source restructuring fallback.
- Valid ./path and contained symlink source aliases, preserving original graph/reference values.
- Read-only source/artifact/index/HEAD checks; hostile parent filters/diff/textconv/fsmonitor traps, child-only submodule filter traps, partial-clone remote traps, special-file refusal, suppressed index flags and concurrent-edit rejection.

Controlled Git wrappers in the instability/FIFO tests make specific failure conditions repeatable; ordinary change cases use native Git directly. No target code or infrastructure is required. The existing M1 validator proves references/structure, not Git provenance or semantic independence.

## Blind plan evaluation

A fresh agent received the Skill, helpers, raw target changes and baseline bundles with trusted scope/provenance statements. It could not read tests, expected outcomes, generator scripts or prior review answers. Four disposable cases produced a separate human-readable report:

1. Shared service plus reviewer-note changes: direct shared scope, transitive alpha/beta/consumer and both async relationships; excluded independent body and notes after inspection.
2. Subscription change plus appended runtime loader: known destination mismatch requires link revalidation; the unresolved environment-selected module requires broader discovery of all common-startup entries, including possible new entries outside the graph.
3. Pure move: the graph closure is bounded, but unchanged imports still target the deleted old path. Common-startup activation also needs review, including the otherwise independent entry. No identity/path repair was performed.
4. No reliable baseline/provenance: incremental planning unavailable; no guessed HEAD or revision baseline and no automatic full analysis.

The blind report explicitly distinguishes helper closure from final source-refined scope. Independent review checked those conclusions. Its initial limit wording about submodules was superseded by the collector's final fail-closed policy. The evaluator did not independently capture full before/after hashes; automated tests provide that preservation check. The only evaluation write was its separate plan/report, with no regeneration.

## Review and limits

Review exposed and fixed hidden Git index edits, child-submodule filter execution, valid path-alias mapping and a boundary condition in insertion-location reasons. Missing remote objects now cannot trigger lazy fetch; special files cannot block untracked fingerprint reads. See [completion/review record](design/m6-01-review.md).

The helper has no parser or full repository dependency graph. It can overinclude methods sharing a file or async component. It cannot independently establish provenance, discover dynamic registration, prove unchanged behavior or find every import dependency. Source refinement and explicit unresolved areas are required, as the runtime-loader and stale-import cases show. Unsupported clone/index/submodule scopes recommend a complete safe baseline or broader analysis; no automatic repository repair is performed. M6-02 regeneration is not started.
