# M2-04 review and completion

Reviewed against the approved M1 model/schema, the M1-03 Markdown profile, and the existing M2 Viewer.

## Files

| Change | Files |
|---|---|
| Inspector and selection resolution | New `viewer/details-inspector.js` |
| Offline Markdown and reference views | New `viewer/markdown.js`, `viewer/documentation-panel.js`, `viewer/sample-documents.js` |
| Selection/expansion integration | `viewer/diagram.js`, `viewer/viewer.js`, `viewer/index.html`, `viewer/viewer.css` |
| Remove curated metadata/snippets | `viewer/sample-data.js`, `viewer/sample-adapter.js` |
| Tests | New `test/selection-documents.test.mjs`; updated and extended `test/viewer.test.mjs` |
| Guides and review | Root `README.md`, `viewer/README.md`, `docs/design/m2-04-plan.md`, this report |

## Interaction and data correctness

Node bodies select on click, Enter, or Space. Their detail action is a separate sibling SVG button with its own accessible name and keyboard activation. The inspector also offers a native detail button when the selected node belongs to the current Flow. Double-click is not required. Dragging either control pans without activating it.

Edges have wider hit paths and selectable labels, plus keyboard controls. Node/edge selection changes classes and pressed states in place. Tests verify that neither the SVG object nor its viewport transform is replaced. The Viewer stores only one selection value containing entity type and opaque ID. Selection resolves to canonical M1 objects that are visible in the current projection; hidden nodes and foreign edges cannot be selected through this path.

The inspector displays actual labels, kinds, modes, endpoint names, owner Flow, source evidence, branch labels, related relationships, external metadata, and detail/document references. Related relationships retain their original ownership, including verified cross-flow edges. A selected remote stub can be inspected without turning it into a hierarchical control or navigating to a consumer. Empty/irrelevant sections are hidden. M1 has no description field: curated preview descriptions and source excerpts were removed. The only explanatory uncertainty text follows the recorded `unresolved` kind or `unknown` mode.

Flow transitions clear selection and load the new Flow's documentation. Back to a parent gives its Flow overview rather than stale child metadata. Clear selection preserves the viewport, returns to Flow documentation, and restores keyboard focus to the SVG. Loading clears stale inspector and source context. Existing entry grouping, caller trails, recursion guards, rendering semantics, zoom/pan/fit, and responsive panel arrangement remain intact.

## Documentation and source evidence

The new fixture asset contains exact copies of the sample Markdown files. No runtime file/network loader or Builder was introduced. The native DOM renderer supports the M1-03 subset: literal section anchors, headings, paragraphs, simple lists/tables, inline code/strong text, fences, relative document links, and source citations. It does not interpret raw HTML or activate external destinations.

An element's canonical document link is preferred. When absent, its owning Flow's documentation is shown with an explicit fallback label. Literal IDs determine section navigation; renamed titles do not change it. Targets are highlighted and revealed inside the document scroller. Document links and outline buttons do not alter diagram selection or active Flow. Missing documents, missing sections, and duplicate section IDs have explicit states, without heading-slug guesses or stale content.

Source actions display the exact repository-relative path, inclusive line range, and optional symbol from SourceReference. Source citations resolve through their M1 IDs, not by fetching definition URLs. Source text is intentionally unavailable; no source snippets are invented or extracted. M4 remains responsible for source extraction/embedding.

## Review and tests

`npm test`: **243 passed, 0 failed, 0 skipped**:

- 143 data/Markdown contract tests.
- 23 graph/layout/math tests.
- 11 navigation tests.
- 14 pure selection/document-resolution tests.
- 52 real Chromium tests, including all prior Viewer checks and the new selection, inspector, document, source, and coordination cases.

Coverage includes node/edge selection, explicit expansion, stable viewport/SVG identity, actual endpoint/branch/async semantics, external library/HTTP/messaging/database/custom metadata, optional symbols/file-level evidence, missing/ambiguous Markdown, literal IDs after heading changes, source unavailability, stale-selection clearing, keyboard controls, long metadata, drag discrimination, and document-only navigation. Snapshot equality checks compare the embedded graph and Markdown with actual M1 artifacts. Behavioral tests are not snapshot-only.

Browser tests use `file://`, block HTTP(S), and reject attempted requests and console/page errors. The temporary single-file test includes all new assets with matching CSP hashes. No runtime dependency or package change was added.

Wide and narrow screenshots were reviewed for selected nodes and async edges. The review made the inspector heading sticky, kept document context visible, revealed the active outline item, bounded narrow documentation scrolling, and returned focus after clearing selection. Long paths/metadata wrap without widening the page. No independent reviewer or sub-agent was used; this was a separate manual pass by the implementing agent with pure and real-browser verification.

The M1 schema, source fixtures, sample JSON/Markdown, graph layout, viewport math, and caller-trail module are unchanged. Offline graph snapshots retain exact artifact data; only their old curated presentation fields were removed.

## Limits and next milestone

The Markdown renderer supports the M1-03 profile, not all CommonMark features or a replacement semantic validator. Authored source definitions and graph evidence still need M1 validation/review. The checked-in Viewer uses separate local assets; single-file compatibility is tested, while export/Builder packaging remains deferred.

Source text, syntax highlighting, full-text search, general artifact loading, browser-history routes, persistent selection, and per-Flow viewport restoration are not implemented. Existing dense-graph layout limits remain. Chromium was tested; other engines and a full assistive-technology audit remain unverified.

M2-04 completes the planned M2 interactions. Recommended next milestone: review/approve M2, then confirm the M3 scope. M3 was not started.
