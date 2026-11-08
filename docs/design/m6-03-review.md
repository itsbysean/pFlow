# M6-03 completion and independent review

Implemented on main afdb8f2 while preserving the uncommitted M6-01/M6-02 work. Project history is unchanged; implementation remains uncommitted. No schema, rendering/search engine, Viewer, Builder implementation, mandatory dependency, source-analysis capability or M6-04 feature was added.

## Files created or modified for M6-03

- src/skills/pflow-rebuild/SKILL.md and references/{consistency,rebuild}.md: complete-set validation, exact index review, existing Builder reuse, safe/idempotent HTML publication and limits.
- src/skills/pflow-rebuild/scripts/rebuild.mjs: inspectArchitectureSet and rebuildArchitectureSet, delegating to existing prepareBuild, validateOutput and writeStandaloneHTML.
- test/rebuild-safety.test.mjs and test/consistency-rebuild.test.mjs: thirteen safety and four actual-regeneration/whole-set/offline integration tests.
- src/skills/pflow/SKILL.md and references/workflow.md, src/skills/pflow-regenerate/references/preservation.md: connected incremental/rebuild routing without parallel generation logic.
- README.md, docs/consistency-rebuild-evaluation.md, docs/design/m6-03-plan.md and this record: usage, evaluation and completion results.

## Consistency and review approach

Existing M1/M4 validation covers every discovered architecture envelope, including unchanged artifacts, and its complete approved Markdown/source corpus. Global publication does not merge identity scopes: independent envelopes may reuse IDs, and cross-flow/detail/entry targets must resolve within their owner envelope. Broken references cannot be repaired by a matching ID in another file. Unrelated/manual Markdown is not silently promoted into the corpus.

The remaining index ambiguity is explicitly handled without a contract change: current plain text does not machine-bind entry labels/triggers to IDs. A retired entry can still link to a valid shared/surviving Flow. M1 already assigns that semantic check to review. The helper presents every current index and entry inventory and blocks missing, stale or rejected review. Findings retain artifact/path, known identifier and correction. The bound result is transient tool input, not new architecture metadata or mandatory index syntax. No automatic stale-prose detection is claimed.

Source/schema/navigation failures are deterministic diagnostics. Legitimately unresolved calls remain valid uncertainty. Physical references/ranges cannot prove source meaning, current deployment, routing guarantees or complete discovery. No AI source analysis is invoked just to package HTML; an actual inconsistency is returned to the appropriate prior stage.

## HTML integration and replacement

The same M4 preparation/writer used by its CLI generates the private candidate, preserving all existing Viewer/search/snippet functionality. Snapshot checks bind discovery inventory, graphs, mapped Markdown, every referenced source (including unused/file-level records), canonical paths and declared Viewer assets. Repeated preparation around fingerprints avoids publishing stale prepared data.

Only after generation and rechecks does one same-parent atomic rename replace final HTML. Equal bytes skip rename, preserving inode/mtime; existing normal permission bits are retained on replacement. Failure cleans owned temporary files and preserves prior output. Successful M6-02 Markdown/JSON updates remain intact even when rebuild fails; old HTML is reported stale. No combined docs/HTML rollback is claimed.

## Tests and offline results

- Full npm test suite: 482/482 passed, zero failures/skips.
- Final safety suite: 13/13 passed, including the strengthened retired-beta/surviving-Flow review case and real M4 packaging failure. Integration suite: 4/4 passed.
- Official Skill quick validation: rebuild Skill and main routing Skill passed.
- Existing schema 1.0.0, semantic and Markdown validators handle all test candidates. Invalid hierarchy, cross-flow, async and document associations block complete publication even in untouched envelopes.
- Real M6-01 change collection and M6-02 apply precede HTML rebuilding in the integration fixture. Updated graph/Markdown and actual wrapped-return source are embedded. Markdown/JSON/manual files, source, index bytes and HEAD are preserved by rebuilding.
- Repeated unchanged builds are byte-identical; final inode/mtime are unchanged. Source/asset/inventory/stage/prior-output changes, invalid corpus, missing assets, unsupported CSS packaging and injected final rename failure preserve prior HTML.
- Independent valid envelopes with repeated IDs publish; cross-envelope-only targets fail. Unrelated manual documents remain untouched. Referenced file-level/unused evidence participates in freshness checks.
- Offline Chrome opened relocated rebuilt HTML after input deletion, with network disabled. Entry navigation, expansion/back, node details, async-edge keyboard selection, numbered updated source and Markdown body search/highlighting worked. Only HTML was requested and no page errors occurred.
- No real-repository E2E or live services were run. HTML generation occurs only in task fixtures/tests; no unspecified project publication was performed.

## Independent research and review

Delegated research verified actual Builder/corpus/ID scope and identified the plain-text index limitation. The approved representation was retained with the existing review requirement rather than introducing a new mandatory contract.

Independent review inspected the implementation, scoped-ID/corpus rules, diagnostic/review boundary, freshness and publication behavior. It ran twelve initial safety tests and three non-browser integration tests, finding no verified defect. Final independent recheck ran all thirteen safety tests, including actual M4 packaging rejection and the real removed-entry case, and confirmed no verified residual defect. Root verified the offline browser and full suite. No unresolved critical issue remains.

## Limits and M6-04 recommendation

Plain entry/trigger text and source semantics still require genuine review; callers must not forge a pass by copying a digest. The helper cannot infer retired prose from arbitrary labels or validate manual Markdown outside the approved corpus. Index review tokens are bound to exact input/asset snapshots and must be renewed if they change.

Fingerprints do not eliminate adversarial filesystem races or edits restored between observations. A crash before final publication leaves old HTML and can leave an owned private temporary file; cleanup must not remove unrelated files. There is no atomic combined source/docs/HTML transaction or real-deployment verification. The trusted source tool environment is required for building; only the output HTML is standalone.

Recommend defining M6-04 acceptance around the existing validated incremental sequence, including explicit baseline/review retention, failure recovery and the distinction between structural and semantic consistency. Do not assume a new index representation or real-project E2E scope without approval. M6-04 has not started.
