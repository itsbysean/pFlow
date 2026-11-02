# M6-01 completion and review

Started on local main afdb8f2. Implemented change evidence collection and impact planning only. No schema, execution vocabulary, Builder, Viewer, dependency or persistent architecture/impact contract changed. No M6-02 regeneration was introduced. Project Git history is unchanged; implementation changes remain uncommitted under this task's no-history-change constraint.

## Files created or modified

- skills/pflow-impact/SKILL.md: separate impact-only workflow.
- skills/pflow-impact/references/{baseline,impact,review}.md: explicit provenance/scope, baseline validation, source/refinement rules, graph closure and review.
- skills/pflow-impact/scripts/git-changes.mjs: small read-only native-Git collector.
- skills/pflow-impact/scripts/impact.mjs: conservative validated graph/evidence impact draft.
- skills/pflow/SKILL.md and references/workflow.md: narrow routing for impact requests, without activating generation/build.
- test/git-changes.test.mjs and test/impact-planning.test.mjs: twenty-five real-Git, graph, safety, fallback and preservation tests.
- test/fixtures/impact/repository/: inert owned bootstrap, entries, shared service, consumer, selected adapter contract, source configuration and unrelated notes.
- test/fixtures/impact/baseline/{graph.json,roles.json,docs/}: M1 baseline and test-only identity roles. Non-build filenames preserve default artifact discovery.
- README.md, docs/impact-planning-evaluation.md, docs/design/m6-01-plan.md and this file: usage, evidence/evaluation method, plan and findings.

## Change detection

Requires a trusted baseline bundle/source association and explicit commit or working-tree comparison. revision remains opaque. Commit refs resolve to object IDs; HEAD~1 and current-HEAD provenance are not assumed. Working-tree comparison includes final tracked content and nonignored untracked files, including staged plus unstaged state. Added, modified, deleted, type and rename records retain old paths and old-side hunks. An unstaged move can remain delete/add until staged; no identity continuity is inferred.

The collector uses argument arrays, NUL records, literal pathspecs, no optional index locks, and disabled hooks/fsmonitor/external diff/textconv/custom filters. Partial/promisor clones fail before object reads and lazy fetch is disabled. Indexed submodules fail before status/diff can inspect child configuration. Suppressed index flags fail in working-tree mode instead of hiding edits. Unsupported special reads fail. Repeated fingerprints detect some unstable inputs, without claiming an atomic snapshot. No source, index or history write operation exists in the production helpers.

## Impact algorithm

The draft calls existing schema/semantic/Markdown validation against the actual retained baseline source/docs. Current-source validation is insufficient for old deletions/renames/shifted ranges. Missing/conflicting provenance, missing snapshot or invalid artifacts recommends full analysis.

Changed normalized/contained source identities map through entry, node and edge evidence. Every reference in a changed file receives a conservative review reason: baseline text edit, potential location shift, outside-range context or path/identity review. Stored references are not rewritten. Direct Flow scopes are closed over reverse hierarchical parents and both endpoints of cross-flow relationships. A visited set handles shared detail and async cycles; IDs and runtime meaning remain unchanged. Associated entry roots and cross-flow Edge IDs are reported.

The Skill then refines this draft through changed context and relevant registration/binding/configuration inspection. Added/unmapped files need triage; unchanged files can depend on changed loaders or moved modules. Exclusions need evidence. New runtime registration, inconsistent provenance/references and broad restructuring require broader discovery, not silent minimization. The output is a transient human-readable plan or an explicitly requested report, never extra Diagram JSON fields.

## Evaluation and verification

- Focused suites: 25/25 passed (12 Git collector, 13 impact tests), no skips on this host.
- Full npm test suite: 439/439 passed, no skips. Existing HTML/Viewer regressions run only against their isolated test fixtures; M6 adds no target rebuilding path.
- Shared M1 1.0.0 schema/semantic/Markdown validation: baseline artifacts validate against retained baseline trees in tests and blind evaluations.
- Official Skill quick validation: impact Skill and main routing Skill passed.
- Working-tree source/artifact/index/HEAD fingerprints remain unchanged across planning in deterministic tests. Git commits/mutations occur only during authored disposable fixture setup, not project history or production planning.
- No project documentation/Diagram JSON was regenerated, no target HTML rebuilt, and no target application or infrastructure was executed.

A fresh blind agent used the Skill/helpers with four real temporary repositories and explicit trusted scope/provenance inputs, excluding tests/oracles/design/review answers. Its service case included shared plus alpha/beta/consumer and both async relationships, while excluding independent body and reviewer notes after inspection. Its subscription/unknown-plugin case required broader common-startup discovery and identified a broken exact-destination match. Its move case detected stale imports affecting every startup entry beyond the old graph closure. Its missing-baseline case declined precise planning without inventing HEAD or revision provenance. The plan was the only evaluator output; it did not perform regeneration or analysis of live runtime state.

The blind evaluator did not capture a separate before/after full target fingerprint; automated preservation tests supply that verification. Its original submodule limit text was superseded by the final collector's fail-closed policy. Independent review checked the plan's source-refined conclusions.

## Independent findings and fixes

- A hunk insertion immediately after a cited end line was labeled as a range shift. Fixed the boundary condition; context review remains conservative.
- Assume-unchanged/skip-worktree flags could hide actual changes. Working-tree collection now fails closed without clearing flags; actual Git tests verify index preservation.
- Parent filter disabling did not protect initialized submodules' child-local filters. Reproduced with a controlled marker, then rejected gitlinks before any status/diff. The child filter trap now stays unexecuted.
- Valid ./path and contained symlink SourceReference aliases lost direct mapping under literal string comparison. Added normalized/canonical baseline path matching without changing stored values; both aliases are regression-tested.
- Additional safety checks reject untracked special-file reads and partial/promisor remote access. Tests confirm no trap execution.

Independent recheck passed the then-current twenty-four focused tests and closed the confirmed findings. The final broad-restructuring test brought the focused count to twenty-five; full regression passes. No unresolved critical or confirmed defect remains. Review covered source/configuration meaning and controlled temporary reproductions, not deployed application behavior.

## Limits and M6-02 recommendation

Provenance is an explicit trusted input: helpers cannot prove that a caller's arbitrary snapshot corresponds to its claimed commit. A physical baseline source/docs tree must exist; automatic historical reconstruction is not implemented. Current line bounds alone do not establish correct evidence. Unsupported Git scopes fail clearly; ignored/nested repositories and runtime configuration remain coverage questions. Two matching reads do not eliminate all races, particularly adversarial concurrent filesystem/configuration changes.

There is no AST or complete dependency graph. The helper can overinclude methods sharing a file and connected async contexts, while newly introduced loaders/import dependencies still require targeted source refinement. It does not determine final entry identity, repair paths, discover all dynamic targets or guarantee semantic independence. These limits are explicit in the blind evaluation and Skill instructions.

Recommend M6-02 consume this reviewed plan, preserve unaffected artifacts/IDs, reanalyze only justified scopes while honoring broader-discovery requirements, and define safe evidence relocation/deletion plus atomic update/failure tests before regeneration. No M6-02 work has started.
