# M7-03 completion and independent review

Baseline: main ff9d6b5 with existing uncommitted M7-01/M7-02 changes. Those changes and completed M1–M6 history were preserved. No commit/push or later milestone work is included.

## Files created or modified for M7-03

Implementation:

- builder/output-policy.mjs: deterministic output selection, explicit workspace/final destination semantics, checked optional directory creation and source/output collision guards.
- builder/bundle-layout.mjs: shared flat/legacy filesystem resolver and ambiguity/containment checks.
- builder/pipeline.mjs: passes actual docsRoot to the existing validators and content pipeline, retaining internal resolved locations.
- builder/html.mjs: protects Markdown files at their resolved root without changing embedded data or rendering.
- src/skills/pflow-regenerate/scripts/regenerate.mjs: resolves baseline/current/staged graph/Markdown paths, blocks layout mismatch and retains existing safety rules.
- src/skills/pflow-rebuild/scripts/rebuild.mjs: fingerprints resolved corpus files and exposes the actual index path in review inventory/diagnostics.

Instructions and documentation:

- src/skills/pflow/SKILL.md and references/{output,workflow,generation,build,prompt-evidence}.md: use the trusted selector and returned roots, author flat new bundles and preserve legacy layouts/evidence semantics.
- src/skills/pflow-impact/references/baseline.md, src/skills/pflow-regenerate/references/preservation.md and src/skills/pflow-rebuild/references/rebuild.md: shared resolution without changing repository-only impact/apply scope.
- README.md, builder/README.md and docs/roadmap.md: current usage/status and both layouts. Historical M1–M6 completion reports were not rewritten.
- docs/output-bundle-evaluation.md, docs/design/m7-03-plan.md and this report: design, results, review and limits.

Tests:

- test/output-policy.test.mjs: 22 filesystem policy/safety cases.
- test/bundle-layout.test.mjs: 16 flat/legacy, corruption, protection, freshness and offline cases.
- test/flat-incremental.test.mjs: 6 actual flat Git impact/apply/rebuild and recovery cases.

No public schema, semantic/Markdown validator, Viewer, dependency or existing sample/fixture migration was introduced. Existing M7-02 prompt fixtures/tests retain their legacy layout and continue passing.

## Resulting behavior

Both modes use one output selector and the same Builder/Viewer pipeline. Repository defaults start at the analyzed project, prompt defaults at cwd, then existing docs/, existing doc/, or new docs/, with architecture/ beneath it. docs/ wins when both exist. Selected collisions/unwritable paths fail without fallback.

An explicit document workspace or output directory is a final bundle destination. A relative outputDirectory inside a designated workspace is contained there; escaping it is rejected. No unexpected architecture/ is added. Generated prompt documentation/evidence stays in that boundary, regardless of registered-folder order. Repository evidence remains rooted at the actual project, even when output is external.

New output is index.md + flows/ + diagrams/architecture.json + architecture.html, with evidence/ only when prompt input needs it. Existing architecture.json + docs/ bundles remain readable and retain their layout. One graph envelope still contains connected detail/async relationships. Independent envelopes remain separate, including valid nested legacy bundles named diagrams.

Canonical links, source definitions and line bounds use the same validators. Raw evidence under a flat filesystem Markdown root remains outside the indexed canonical corpus. Added absolute filesystem metadata stays internal and is excluded from HTML payloads. The output remains a single offline, read-only HTML file; CLI flags are unchanged.

M6 resolves both repository layouts and rejects baseline/current migration. All Git provenance, contained/separate bundle, unchanged-scope/evidence, stable relationship identity, manual merge, source/output overlap, exact-stage fingerprint, rollback and safe publication guards remain. Prompt incremental apply and external repository targeted apply remain unsupported.

## Executed checks

- New focused suite: 44/44 passed, zero failures/skips.
- Initial affected Builder/content/M6 suites: 102/102 passed.
- Final npm test after the resolved-index diagnostic update: 551/551 passed, zero failures/skips. Log: /private/tmp/pflow-m7-03-final.log.
- Official Skill quick validation passed for pflow, pflow-impact, pflow-regenerate and pflow-rebuild.
- Whitespace and documentation-target checks passed. No changes under schema/, validation/, viewer/ or dependency manifests; HEAD remains ff9d6b5.

Actual temporary filesystem cases verify directory precedence, explicit-root isolation, no needless repository evidence, protected source aliases/hardlinks, path/symlink/file/writability failures and unchanged prior output. Both layouts run through actual CLI preparation/rendering with exact evidence and deterministic HTML. Flat M6 tests exercise real Git evidence, manual three-way merge, preserved unrelated content/IDs, old HTML until rebuild, no-op bytes/inode/mtime, migration/provenance/overlap rejection and ordinary-error rollback.

Offline Chrome opens relocated flat HTML after removing inputs. Keyboard detail/back navigation, numbered clarification snippets and Markdown search/highlighting work, with exactly the HTML request and no page errors. These are authored fixture/browser results, not new real-project discovery or cross-browser evidence.

## Independent review and corrections

The first read-only reviewer inspected actual path assumptions, independently ran selector tests and found two verified new-code issues: protected source aliases needed target inode comparison, and complete independent nested legacy envelopes named diagrams needed preservation. Both were fixed with regressions. Earlier-ancestor symlink rejection was also strengthened and tested.

A final separate reviewer inspected the scoped code and safety invariants. It independently covered 44 focused cases: 43 passed under normal execution, and the browser case passed separately after Chrome required approved execution. It verified selector precedence, explicit destinations, shared resolution, unchanged payloads, resolved writer protection and M6 provenance/separation/merge/freshness/rollback. No verified finding remained. It inspected the initial full-suite log but did not independently rerun the entire suite; the root subsequently completed the final 551/551 run after the index-diagnostic update.

No unresolved critical issue remains within the evaluated scope. The review is not a guarantee against concurrent hostile filesystem mutations or a replacement for source/ownership review.

## Limits and recommendation

The selector requires canonical roots and rejects symlinks in selected output paths, including ancestor aliases. It selects/creates directories only; it does not establish generated ownership or authorize overwriting manuals. Directory creation is not an atomic content transaction. Existing M4 HTML replacement and M6 ordinary-error recovery limits remain documented; fingerprints cannot eliminate adversarial races.

Prompt full generation/rebuild works without Git, with evidence in its selected boundary. Prompt incremental merging, automatic legacy migration, external targeted apply, generic Viewer wording and all M8 findings/review/visualization remain outside scope.

Recommend M7-04 for neutral presentation/templates after developer approval. Stop here; no M7-04 implementation has begun.
