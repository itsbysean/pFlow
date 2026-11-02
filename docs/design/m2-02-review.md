# M2-02 review and completion

Reviewed against the approved M1-01 model, schema 1.0.0, M1-03 documentation rules, the M2-01 Viewer, and its visual reference.

## Files

| Change | Files |
|---|---|
| New rendering modules | `viewer/graph-layout.js`, `viewer/diagram-viewport.js`, `viewer/diagram.js` |
| Viewer integration | `viewer/index.html`, `viewer/viewer.js`, `viewer/viewer.css` |
| Tests | New `test/diagram.test.mjs`; extended `test/viewer.test.mjs` |
| Documentation | Root `README.md`, `viewer/README.md`, `docs/design/m2-02-plan.md`, this report |

## Rendering and layout

The renderer reads approved Flow/Node/Edge/SourceReference objects. A small projection adds temporary geometry without modifying or serializing an alternate architecture format. Each selected Flow retains all its local nodes and owned edges. Known nonlocal destinations appear once as dashed boundary stubs with their actual IDs, names, source evidence, and owner Flow. Neither destination internals nor `expandFlowId` are traversed.

Layout sorts by stable IDs, uses iterative DFS to mark backward edges for ranking, assigns longest-path layers over the remaining acyclic edges, and orders rows using parent positions. All original edges, including backward edges and self-loops, remain rendered. Adjacent relationships route between rows; long and backward relationships use outside lanes. Branches separate into columns and shared targets converge below their predecessors. No graph package or runtime dependency was introduced.

Native SVG shapes and CSS tokens distinguish internal operations, decisions, libraries, systems, unresolved boundaries, terminals, and displayed exception-only exits. Edge color, dash pattern, label, and arrowhead convey kind and mode. Async exception edges retain red while using the async dash pattern. Unknown mode is explicit. Full labels and evidence remain in native titles and accessible descriptions. Names wrap to two lines; native text measurement bounds wide Unicode glyphs and source captions.

Zoom buttons preserve the viewport's center world point. Fit includes all node/edge/label geometry, including negative routing lanes. Reset restores 100% and aligns tall diagrams to the top. Pointer capture supports panning; arrow keys provide keyboard panning. Resize refits the diagram. Invalid graph references clear stale output, disable controls, and show an error that can be recovered from by loading another sample.

## Review and verification

The header, data-derived navigator, fixed inspector, documentation tabs, and responsive panel arrangement remain in place. A flat Flow chooser provides sample coverage without hierarchical drill-down, node selection, source navigation, or Markdown navigation. The narrow desktop workspace height was increased to 560 pixels to improve diagram readability while preserving the existing stacking breakpoints.

Visual checks covered the branch and asynchronous samples at desktop width and the narrower stacked layout. Review reduced excess vertical diagram spacing, added decision context to accessible edge labels, bounded wide-glyph labels using SVG measurement, and used dark caption text on pastel shapes. Shape and edge accents retain the established category colors. A full accessibility audit and additional browser engines remain unverified.

`npm test`: **185 passed, 0 failed, 0 skipped**:

- 143 data and Markdown contract tests.
- 23 pure diagram tests: sample coverage, deterministic order, branch/convergence geometry, multiple outgoing edges, long-edge routing, cycles/self-loops, category semantics, real async targets, invalid references, empty graphs, text wrapping, fit/zoom math, and a 300-node cyclic layout.
- 19 Viewer/browser tests: prior panel/offline behavior plus rendered categories, labeled directed edges, async stubs, zoom/reset/fit, pointer/keyboard panning, resize fitting, bounded Unicode text, recoverable errors, and a real 300-node SVG render.

Browser tests run directly over `file://`, block HTTP(S), and reject network requests and console/page errors. The single-file compatibility test now inlines all three rendering modules with the existing assets and verifies startup with matching CSP hashes. No development server or Builder was used. The host requires process-launch permission for headless Chrome.

The M1 schema, sample JSON, evidence fixtures, Markdown contract, and offline sample snapshots are unchanged. No new architecture fields, framework categories, source interpretations, packages, or runtime network resources were added.

## Remaining limits

This is a lightweight layout, not a crossing-minimizing engine. Dense and parallel edges/labels can still overlap, and outside lanes increase diagram width. Large graphs become small after Fit and require zoom/pan. Resize deliberately resets a manual viewport. Text captions can truncate; complete values remain in titles and accessible descriptions. There is no graph virtualization or arbitrary-size performance guarantee.

Runtime integrity checks are narrower than full schema/semantic validation and cannot prove evidence adequacy. The inspector and document content remain fixed sample previews. No hierarchical expansion, graph-node inspection interactions, Markdown navigation, search, or M2-03 functionality was implemented.

Review method: a separate manual pass by the implementing agent, screenshot inspection, pure tests, and real Chromium tests. No independent reviewer or sub-agent was used.

Recommended next task: confirm the M2-03 scope before extending the Viewer.
