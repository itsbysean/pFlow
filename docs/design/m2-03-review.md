# M2-03 review and completion

Reviewed against the approved M1-01 model, schema 1.0.0, M1-03 documentation rules, and the existing M2-01/M2-02 Viewer.

## Files

| Change | Files |
|---|---|
| ID-only navigation | New `viewer/flow-navigation.js` |
| Entry/detail navigation and breadcrumbs | `viewer/viewer.js`, `viewer/index.html`, `viewer/viewer.css` |
| SVG interaction | `viewer/diagram.js` |
| Tests | New `test/flow-navigation.test.mjs`; extended `test/viewer.test.mjs` |
| Guides and review | Root `README.md`, `viewer/README.md`, `docs/design/m2-03-plan.md`, this report |

## Behavior and review

Entry selection resolves the exact `flowId`, updates the pressed entry, resets both directions of the prior trail, and renders the root with its actual title. Trigger-derived grouping is unchanged. Selecting the already active entry also resets the trail.

Owned nodes with `expandFlowId` are SVG buttons with a detail marker, hover/focus feedback, and Enter/Space activation. A deliberate click opens only the referenced Flow. Pointer movement beyond a small threshold pans instead; a drag does not trigger detail navigation. Nodes without detail references have no button or expansion marker. Remote async boundary stubs remain noninteractive even when their original node has detail metadata.

The navigation module indexes the original artifact and stores only `entryId`, Flow IDs, call-site Node IDs, and a cursor. It does not copy or rewrite graph data. Back moves to the parent context; Forward revisits a retained descendant. Breadcrumbs and Root move the cursor toward the root while retaining Forward. Opening a different branch discards the old forward trail. A reused Flow is rendered from the same artifact data, with the actual calling node retained for each visit.

Breadcrumb labels come from the root entry and subsequent Flows. Tooltips and the workspace context identify the calling node. The current breadcrumb remains actionable and refits the view. Long trails scroll horizontally, revealing the current endpoint. The flat Flow chooser is retained as explicit direct browsing; it clears entry/caller context rather than inventing intermediate levels.

A repeated Flow in the active path is marked with a recursion indicator. Activation shows a live notice and does not append a frame. Back, Root, and ancestor breadcrumbs remain available. This blocks infinite navigation without removing recursive references or execution cycles from the graph. A target retained only in Forward is not treated as an ancestor.

Each Flow transition refits the diagram, including Back/Forward and breadcrumbs. Focus moves to the new SVG without scrolling the page, so Tab can reach its detail buttons. Viewport restoration was deliberately deferred. Full node inspection, document navigation, search, and browser-history integration remain outside this task.

The review fixed decorative entry icons leaking into accessible button names, distinguished drag from activation, preserved assistive click activation after panning, and kept interactive SVG descendants under a group role. Wide and narrow screenshots confirmed that the navigation bar fits the existing layout. The fixed inspector/document previews and SVG shapes, categories, edges, source captions, and controls remain intact.

## Validation

`npm test`: **208 passed, 0 failed, 0 skipped**:

- 143 data/Markdown contract tests.
- 23 diagram/layout/math tests.
- 11 pure navigation tests for IDs, trail behavior, shared detail, context, recursion, missing references, ownership, direct roots, and immutability.
- 31 browser tests, including real entry/detail activation, Back/Forward/Root, actionable breadcrumbs, entry switching/reselection, shared callees, self/mutual recursion, keyboard focus, drag discrimination, async separation, missing targets, viewport fitting, and all prior offline/rendering/responsive checks.

Browser tests load `file://` directly, reject HTTP(S) requests and console/page errors, and continue to test a temporary single-file inlined preview. The new navigation module is included in that compatibility check. No server, runtime package, or state-management library was added.

The M1 schema, source/sample artifacts, offline sample snapshots, graph layout, viewport math module, and package dependencies are unchanged. Missing detail references retain the renderer's fail-closed error behavior; no nonexistent child breadcrumb or graph is fabricated. Source-evidence interpretation remains a separate review responsibility.

## Limits and next task

Navigation is local to the current in-memory artifact and resets on sample change or reload. Browser Back/Forward, persistent routes, and per-context viewport restoration are not implemented. Every transition fits instead. Existing dense-graph layout limits remain. The inspector and documentation are fixed sample previews; navigation does not turn them into a selected-node inspector or Markdown reader. Chromium was tested; other engines and assistive technologies remain unverified.

Review method: a separate manual pass by the implementing agent, source/contract comparison, screenshot inspection, pure tests, and real Chromium tests. No independent reviewer or sub-agent was used.

Recommended next task: confirm the M2-04 scope. M2-04 was not started.
