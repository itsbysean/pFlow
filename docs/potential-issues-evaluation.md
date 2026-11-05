# Optional code findings and full-label tooltips

## Scope and research

The developer approved code-based potential-bug analysis and Viewer warnings, alongside full-label tooltips, on 5 November 2026. Prompt-only workflow omission/contradiction analysis is excluded. The earlier broad UX simplification recommendations were not implemented.

The repository already had stable graph identities, canonical Markdown, bounded SourceReferences, an offline Builder, lifecycle snapshots, safe rebuilds and a recoverable bundle transaction. It had no findings implementation. Native SVG titles existed, but did not provide an explicitly keyboard-accessible, zoom-independent tooltip experience. The approved roadmap preserved separate findings, severity, confidence, AI-managed review rationale, read-only HTML and retained decisions.

The implementation keeps architecture model 1.0.0 unchanged. Findings schema 1.0.0 is a separate sidecar. No target-code analyzer, mandatory AST parser, dependency, VCS integration, renderer or database was introduced.

## Contract and behavior

findings.json lives at the resolved bundle root in both layouts. A record contains an opaque ID, graph hash, title, causal description, severity, confidence, explicit Flow/Node/Edge targets, bounded code evidence with file hashes, and append-only reviews. It reuses the existing SourceReference definition through a schema reference. Severity is low/medium/high/critical; confidence is low/medium/high. Review states are unreviewed/supported/dismissed/resolved. Supported is a review judgment about the described scenario, not proof of an observed production failure.

Analysis is opt-in through the existing pFlow Skill. The agent checks current code, callers, guards and relevant configuration. Base generation/rebuild never runs bug analysis automatically. Findings-only work does not regenerate canonical architecture merely to add a report. Existing valid sidecars are embedded by the Builder; invalid structure blocks a build.

Graph/evidence changes and missing targets mark results stale. They remain readable but have no active warning and cannot attach to a replacement by a matching label. When a lifecycle Snapshot is present, evidence must be tracked and have unambiguous code provenance. Generated bundle content, including captured prompt statements, cannot establish code evidence.

Reruns preserve omitted diagnoses and all review rationale. Candidate review history cannot reset an existing decision. Explicit reviewChanges need a current reanalyzed candidate and rationale. Exact duplicate diagnoses under new IDs are rejected. Changed title/causal description/target identity requires a new ID; similar wording is not an identity algorithm.

The findings publisher stages findings.json and HTML through the existing Builder and applyBundle transaction. It checks prior findings digest, source and bundle freshness. Failure preserves the old bundle when rollback succeeds. Canonical graph and Markdown are retained. Architecture lifecycle updates retain findings/history; stale references after a proven source move no longer block updates solely because the old SourceReference ID persists.

## Viewer

- Hover or keyboard-focus a node for its full plain-text name. Text is 13 CSS pixels, independent of SVG zoom. Tooltip placement is viewport-bounded, hoverable and Escape-dismissible.
- Focused tooltips survive unrelated document scrolling. Graph movement repositions a focused tooltip or dismisses a hover tooltip. Navigation removes stale anchors.
- Current unreviewed/supported issues add an in-bounds node warning button. Severity affects its color. Exact relationship targets outline the corresponding edge label.
- Warning activation selects the actual entity and opens the existing Details panel without hierarchical expansion. No new tab or panel is added.
- Issue report is present only when retained findings exist. It includes severity, confidence, state, causal description and on-demand code excerpts/review history.
- Locate uses existing hierarchy/search routing. A Flow-only target clears unrelated node selection; stale targets have no Locate action.
- The HTML has no review/edit controls. All user-derived text uses textContent/native text nodes; code is never evaluated.
- Warning geometry does not change ranks, frame sizes or routes. Decision text reserves badge space; terminal badges/strokes stay within rounded bounds.

## Components changed

| Area | Files |
| --- | --- |
| Findings contract and evidence/review logic | schema/findings-1.0.0.schema.json, findings/validate.mjs |
| Safe publication and inspection | findings/publish.mjs |
| Builder and packaging | builder/pipeline.mjs, builder/html.mjs, packaging/cli.mjs, packaging/build-skill.mjs |
| Incremental safety | lifecycle/documentation.mjs, skills/pflow-rebuild/scripts/rebuild.mjs |
| Viewer | viewer/tooltip.js, viewer/findings.js, viewer/diagram.js, viewer/viewer.js, viewer/index.html, viewer/viewer.css |
| Instructions | skills/pflow/SKILL.md, references/potential-bugs.md, references/runtime.md, references/build.md |
| Product documentation | README.md, builder/README.md, viewer/README.md, docs/roadmap.md |
| Tests | test/findings.test.mjs, test/findings-viewer.test.mjs, test/support/findings-fixture.mjs, test/viewer.test.mjs |

## Verification

Actual environment: local Node 26.13.0 and headless Google Chrome. Runtime minimum remains Node 24. This session does not establish a new cross-platform/browser matrix.

- Findings and browser checks: 35 passed, zero failures/skips. This includes the final terminal-stroke geometry regression.
- Final full regression: **710 passed, 0 failed, 0 skipped** (47.83 seconds), including the terminal geometry correction. One earlier run exposed a focus-tooltip race; that defect was fixed, not hidden by relaxing the assertion.
- Skill quick_validate passed in a temporary PyYAML environment without a project dependency change.
- Diff/JavaScript syntax checks passed.
- `npm run build:release` passed. The local ZIP contains one runtime and the findings schema/reference instructions; integrity and checksum checks passed. Package version remains 1.0.3 until a separately authorized release.

Meaningful cases cover schema versions/enums/duplicates, missing and unsafe source paths, bounded ranges and size limits, stale graph/source data, omitted reviewed findings, review-history preservation, duplicate-ID review bypass, transactional rollback, concurrent edits, sidecar-aware safe rebuilds, invalid Snapshot provenance, stable-ID source moves, prompt/generated-prose rejection, optional builds without findings, keyboard/pointer tooltip behavior, Escape and dark/narrow views, warning selection versus expansion, explicit detail navigation, Flow-only selection, plain-text injection handling, and isolated single-runtime execution with empty PATH.

The real SVG geometry checks assert that decision badges do not overlap rendered text and stay within the diamond, and that terminal badges including stroke clearance stay within the actual rounded fill. Existing dense/cyclic layout, navigation, source, search and M6/lifecycle suites remain part of the full regression.

The packaged-runtime browser test removes the installation and bundle before opening the generated file. Other offline tests remove all source/bundle inputs. The Viewer uses only its HTML request. No application code, live services or target dependencies are executed to obtain evidence.

## Independent forward evaluation

A separate agent followed the actual updated Skill in two isolated workspaces. The user scenario was limited to object payloads with empty or omitted items. It inspected the raw source independently, without reading the test oracle or executing the application.

- Unprotected code: receive defaults omitted items to []; firstSku dereferences items[0].sku. The agent published one medium-severity/high-confidence unreviewed issue with caller/body evidence.
- Guarded code: firstSku uses items[0]?.sku ?? null. The agent published zero findings for the requested scenario instead of inventing a defect.

The trusted runtime ran output selection, lifecycle detection, validation, findings inspection, dry-run publication, apply and post-inspection. Every command exited 0 without diagnostics. Hash checks confirmed that the original graph and three Markdown files were unchanged. Exact arguments/results are retained in /private/tmp/pflow-findings-forward/{unprotected,guarded}/ during the session. These are evaluation artifacts, not distributed runtime dependencies.

The independent agent did not verify browser interactions. Main separately regenerated the unprotected report with current assets and opened it through file:// with networking disabled. Light/dark screenshots, full-name tooltip, warning and code report were inspected. There were zero page errors and exactly one HTML request. Captures are under /private/tmp/pflow-findings-preview/.

This is a bounded source/Skill evaluation, not a claim of universal AI accuracy, production reproduction or a human usability study.

## Independent review and fixes

The independent reviewer ran the findings tests and isolated reproductions. Confirmed issues were corrected and regression-tested:

1. Missing/ambiguous Snapshot code provenance could pass publication. Evidence now requires tracked, exclusive code provenance whenever a Snapshot is present; malformed profiles mark retained results stale.
2. A proven file move retaining SourceReference IDs could make old finding evidence block lifecycle publication. Required canonical evidence is now distinguished by path; stale optional evidence is retained safely.
3. Leaving the tooltip popup could dismiss a still-focused anchor. Focus persistence is now preserved.
4. Null Snapshot scope entries could throw while building. Scope/file-map elements are checked before use, and invalid provenance yields stale diagnostics instead of a base-build crash.

Main also fixed the browser-observed unrelated-scroll/fit focus race, protected Flow-only selection, prevented exact diagnosis duplication from bypassing review decisions, reused existing action styling, and verified terminal/decision warning bounds. Independent source tests and review are distinct from Main's browser and packaged-runtime execution.

## Limits and delivery

- Semantic evidence-to-diagnosis/target relevance is an AI review responsibility. Schema/hash validation cannot prove a bug or its production severity.
- Without a lifecycle Snapshot, code provenance classification is established by the agent's source review. Generated-bundle files are still excluded mechanically.
- Graph-wide hashes are conservative: an unrelated diagram change can require findings revalidation.
- File fingerprints are whole-file; unrelated edits can invalidate retained evidence. Renames do not establish identity automatically.
- Evidence remains subject to existing bounded UTF-8/snippet budgets. Unsupported evidence cannot create active warnings; no replacement source is fabricated.
- Findings limits are 4 MiB per sidecar, 1000 diagnoses, 50 evidence references and 25 targets per diagnosis, and 1000 retained review entries per diagnosis. Exceeding limits fails rather than silently dropping history.
- The transaction is recoverable through two renames, not guaranteed power-loss atomicity. A failed rollback reports a preserved backup location through the existing tool.
- Warning controls scale with the graph; the full-label tooltip stays at readable screen size. The diagram still needs sensible zoom/layout; tooltip support is not a complete UX redesign.
- Prompt-only process gap analysis, automatic bug fixes, continuous scanning and browser review editing are excluded. Findings text is not added to the base architecture Markdown search index.
- No commit, push or deployment is part of this task. The rebuilt local distribution is not a newly published release.
