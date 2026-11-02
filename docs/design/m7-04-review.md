# M7-04 completion and independent review

Baseline: main ff9d6b5 with uncommitted M7-01–M7-03 implementation/planning. Actual prompt/layout/flat-incremental baseline checks passed 62/62 before edits. Those changes and M1–M6 history were preserved. No commit or push is included.

## Changed files for this task

- viewer/index.html: neutral process/evidence labels, one interaction hint, Top level accessible label, path badge and outcome/unresolved legend explanations.
- viewer/viewer.js: neutral empty/context states and a level badge derived only from the actual navigation trail.
- viewer/diagram.js: generic SVG/evidence wording and the existing keyboard description linked with the visible hint; unchanged kinds, geometry and controls.
- viewer/details-inspector.js, viewer/documentation-panel.js and viewer/markdown.js: neutral uncertainty/evidence/detail wording while retaining exact metadata, source symbols, text-node excerpts and safe citation controls.
- viewer/viewer.css: one scoped dashed legend marker using existing tokens; no layout redesign.
- docs/templates/{architecture-index,execution-flow}.md and skills/pflow/references/generation.md: concise generic knowledge-transfer guidance with canonical anchors/citations and evidence-backed rationale only.
- test/generic-presentation.test.mjs: eight content/standalone browser cases; no new model or fixture analyzer.
- test/viewer.test.mjs, test/documentation-generation.test.mjs and test/consistency-rebuild.test.mjs: update directly affected accessible/text expectations while retaining behavior and technical-data assertions.
- README.md, viewer/README.md, docs/roadmap.md, docs/generic-presentation-evaluation.md, docs/design/m7-04-plan.md and this report: current use, decisions, evidence and limits.

Earlier uncommitted Builder/output/M6 changes belong to M7-03 and remain intact; this task does not change their implementation. No M7-04 schema, semantic/Markdown validator, dependency, input-mode field, M6 safety, prompt incremental or M8 change was introduced.

## Behavior and compatibility

Process starts, Process step, Process context, Evidence references, Evidence excerpt and Process summary work for team workflows and system flows alike. Recorded node/edge kinds and modes remain visible, including actual calls/exceptions and synchronous/asynchronous relationships. Library/system metadata, exact paths, optional symbols and line ranges are retained. No mode is guessed from names or paths, and the product remains pFlow.

The visible hint distinguishes selection from the separate detail action. The badge uses the real trail: Start flow, Detail or Direct flow. Top level returns to the first Flow in that path; it does not fabricate a path to an unrelated process start. Existing Back/Forward/breadcrumbs, reused detail, recursion protection, pan/zoom and selection behavior remain unchanged.

Outcome describes an existing terminal exit at the current scope. Exception path retains its specific semantics, without labeling every business alternative as an exception. Unresolved nodes retain their dashed style, visible explanation and linked evidence; unknown relationship modes do not receive invented waiting or delivery guarantees. Read-only bounded excerpts still use textContent and do not fetch local files.

Templates support purpose/scope, a supported start/caller, concise major sequence, decisions/alternatives, evidenced participants/systems, outcomes/failures/unknowns and exact citations. They add no mandatory metadata, actor model or rationale assumption. The contract's Source evidence heading remains valid for all evidence types. A line-fragment placeholder supports exact single/multiline/file-level references instead of forcing a redundant single-line range.

## Executed verification

- Pre-edit M7-02/03 baseline: 62/62 passed.
- Affected selection/Markdown/content suites: 100/100 passed.
- Existing Viewer and standalone integration suites: 89/89 passed.
- New generic-presentation suite: 8/8 passed.
- Full npm test: 559/559 passed, zero failures/skips. Log: /private/tmp/pflow-m7-04-full.log.

The focused cases build actual standalone files for existing repository/service, prompt onboarding/deployment, shared alpha/beta detail and literal-text inputs. They inspect meaningful starts, branch endpoints, terminal outcomes, recorded HTTP/kind/mode/evidence data, selected-context stability, keyboard detail/back/top navigation, real caller context, unresolved information, exact Unicode/unsafe excerpts, read-only controls and canonical search/highlighting. A populated generic template passes unchanged full documentation validation. Existing empty/missing-doc/no-excerpt, recursion and viewport tests remain green.

Offline browser cases request only their HTML and produce no page errors. Manual preview used the same trusted Builder for service/onboarding/deployment files at 1440px and 720px; the root visually inspected three desktop images and narrow onboarding. The complete hint/legend stayed within the workspace at both widths. Dense/narrow diagrams retain the existing fit scaling and may require zoom/detail. No user interviews or measured onboarding outcomes are claimed. Screenshots/observations: /private/tmp/pflow-m7-04-preview/.

## Independent review

A separate read-only reviewer inspected the scoped working files, diff, plan, contract and actual verification logs. It found two accessibility/usability issues during review: the Top level accessible name omitted the visible words, and the dashed-border explanation was tooltip-only. Both were fixed, with corresponding UI assertions. The template evaluation exposed single-line #L1-L1 formatting; the template now takes the exact #L1/#L1-Ln/empty fragment and its validation case passes.

Final independent review found no blocking defect. It confirmed generic wording, path-derived navigation context, preserved graph/technical metadata, safe evidence text rendering and canonical templates. It inspected the 100/100, 89/89 and 8/8 logs but did not execute tests/builds itself. The full 559-test run and manual screenshots were completed by the root afterward. No independent full-suite or assistive-technology certification is claimed.

## Limits and next task

The UI cannot prove a process claim or missing rationale; generation/evidence review still must do so. Actual source names, raw model kinds and Flow terminology remain where meaningful. Existing documents are not rewritten or inferred into new relationships. Readable dense graphs may need zoom and progressive detail; no layout algorithm or mobile redesign was added.

No M8 findings, warning/report system, review statuses, alternate Viewer, BPMN/swimlanes or prompt incremental merging is implemented. Recommend M7-05 unified E2E/backward-compatibility evaluation only after developer approval. Stop after M7-04.
