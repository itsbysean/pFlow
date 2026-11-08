# M6-04 completion and review

Implemented on main at afdb8f2 while preserving the uncommitted M6-01–M6-03 work. No commit, push, merge or original repository change was made. Stop here; no M7 work is authorized.

## Files changed for M6-04

- README.md: current workflow status, real evaluation link and removal of obsolete milestone notices.
- docs/design/m6-04-plan.md: scopes and observable acceptance before real evaluations.
- docs/real-repository-e2e.md: reproducible source-checkout procedure, real scopes, output evidence, corrections, offline/incremental/recovery results and limits.
- docs/design/m6-04-review.md: this completion record.
- src/skills/pflow-execution-flow/references/{representation,evaluation}.md: concise guidance for guard order, normal completion versus throw, typed recovery/propagation, invocation binding, path-specific defaults and dependent caller summaries.
- test/flow-review-regression.test.mjs and test/fixtures/flow-review/{repository/operations.mjs,expected/graph.json,expected/roles.json,expected/docs/index.md,expected/docs/execution.md}: seven portable source-review regressions.

Real source copies, generated documentation, browser captures, manifests and replay drivers remain private under /private/tmp/pflow-m6-04. They are not checked into the product or required by the tests. The approved schema, Viewer, search, Builder and M6 helper implementations were reused unchanged by this milestone.

## Results

Two local real applications produced valid graph/Markdown bundles and standalone HTML. Source review covered 11 entries across the bounded Tidefolk and Dotal scopes. It corrected five output/evidence defects; no application bug analysis was performed. A further caller-summary draft issue was corrected before staging/apply. All final staged/applied summaries are consistent with the controlled source changes.

Seven new regressions use authored pure operations and recording ports. They reject meaningful semantic counterexamples that still satisfy the structural contract. They do not claim general AI accuracy or execute the private applications.

Final npm test: 489/489 passed, zero failures or skips. Focused flow/source-review/boundary suite: 28/28 passed. Official Skill quick validation passed for the main, execution-flow, impact, regeneration and rebuild Skills. No dependency was added.

Offline Chrome opened relocated HTML-only output for both applications. All entry roots, keyboard selection/expansion/back, external and edge inspection, exact numbered source, Markdown search navigation/highlighting and reopening worked. Final Tidefolk checks also verified the readiness registration, changed guest-provider source, absent removed Nodes and explicit parent-result search mapping. Only the HTML was requested; no page error occurred. This is Chrome coverage, not cross-browser certification.

Three real-source incremental rounds used the existing impact, regeneration and full-set rebuild helpers. They changed an internal predicate, registration path and compensating call. They preserved 20/14/20 unaffected Flow objects respectively, retained proven identities, removed obsolete relationships and retained a manual note. Each apply preserved old HTML until successful rebuild; repeated rebuilds preserved bytes, inode and mtime.

Actual missing/invalid inputs, broken graph/Markdown, unavailable Git baseline, real Builder packaging rejection, candidate validation failure and injected partial-apply failure were tested on disposable real bundle copies. Previous valid output was preserved; rollback restored the prior bundle fingerprint. These tests do not prove process-crash atomicity.

Original selected source bytes/modes, recorded HEADs and index hashes were checked again after the evaluation: all 235 selected original files and both Git states matched the recorded copy baseline. Only the isolated Tidefolk target's two intended source paths differ from copied provenance. Original application scripts, dependencies, services and infrastructure were never executed.

## Compatibility and remaining limits

No approved architecture contract changed. Output uses architecture.json with sibling docs/index.md and docs/flows/*.md, as required by the existing Builder. The task's illustrative flat diagrams layout was not imposed.

Source-checkout invocation is verified. A prebuilt/global Skill distribution does not exist and was not installed or tested. The target needs no dependency install; trusted tool dependencies are needed for building. Only output HTML is standalone.

Real coverage is bounded: 16 Tidefolk routes and Dotal's other applications/modules remain untraced. Deployment values, live runtime behavior and complete discovery recall are not established. The selected real paths did not prove an active producer–consumer transfer or execution cycle; existing positive async/group/cycle fixtures remain fixture-only evidence. Inactive or conditional registrations stay unresolved rather than receiving guessed edges.

Incremental use needs trusted source/generated baselines, reviewed ownership and exact impact/index review. Structural validation cannot establish source meaning, catch every stale prose claim, or replace source review. Ordinary-error preservation is verified; adversarial races and crash recovery remain limited as documented by M6-02/M6-03.

Recommend closing M6 for the tested source-checkout workflow with these limits. Prebuilt distribution, wider repository coverage and further milestones need separate scope and approval. Do not begin M7 automatically.

## Independent review

A separate reviewer inspected actual source-to-documentation evidence and all incremental stages, independently compared unaffected Flow objects, reran validateDocumentation against both final real bundles with zero diagnostics, and verified that relocated offline HTML equals the final target bytes. It reviewed the real failure/recovery drivers, original-preservation checks, portable semantic witnesses, final 489-test log and reporting boundaries.

No unresolved critical M6-04 integration defect remained. Its final recommendation is completion within the limits above. Private audit: /private/tmp/pflow-m6-04/review/source-review.md. The transient caller-summary finding was explicitly reclassified as an in-progress draft issue after checking the pre-apply stage and retained baseline; no applied-output defect is claimed for it.
