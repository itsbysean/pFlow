# M3-02 review and completion

Implemented on local `main` after `41e73e0`. M1 model/schema 1.0.0, Markdown contract, sample artifacts and version-1 search payload remain unchanged.

## Files

| Files | Change |
|---|---|
| `viewer/search-navigation.js` | Canonical ID/backlink resolution and cycle-safe expansion-path planning |
| `viewer/viewer.js` | Result validation, bundle/context coordination, existing navigation/selection calls and error feedback |
| `viewer/documentation-panel.js` | Document preflight, native Markdown highlights, passage focus and internal scrolling |
| `viewer/diagram.js` | Reveal the selected element without replacing the current SVG |
| `viewer/search.js` | Mouse/Enter activation, query retention, overlay close and stale-row protection |
| `viewer/markdown-search.js` | Export the existing query tokenizer for matching rendered text consistently |
| `viewer/index.html`, `viewer/viewer.css` | Load the resolver, update keyboard help and style passage highlights |
| `test/search-navigation.test.mjs`, `test/viewer.test.mjs` | Mapping/path tests, browser activation/highlighting tests and updated preview-only regression expectations |
| `README.md`, `viewer/README.md` | Usage, route policy, focus/error behavior and limits |
| `docs/design/m3-02-plan.md`, this file | Research/plan and review record |

## Navigation and highlighting

Results use exact bundle, path and literal section identity. Titles and graph labels do not establish mappings. A canonical entity backlink is required, with owner-Flow nesting for Node/Edge sections. Preflight checks embedded documents and sections before graph changes. Unmapped or stale entity associations remain readable with an explicit notice and no unrelated selection.

Mapped selection keeps a correct active Flow/trail. Other targets use breadth-first expansion traversal, preferring the current entry, then artifact entry order, with node order breaking shortest-path ties. Reused detail Flows keep the chosen calling context; recursion terminates through visited IDs. A known Flow without an entry route opens directly with a notice. Async execution edges never supply hierarchy. Entry sections use their own explicit entry. Edge sections select their source-owned relationship.

Native text-node splitting highlights query terms without changing Markdown or inline formatting. Highlight scope matches the indexed section's owned content. Source controls, fenced examples and nested canonical sections are excluded. Repeated hits reveal the first body occurrence, then headings/section as fallback. Focus moves to the passage; the document article remains normally scrollable. New results replace old highlights. Ordinary document, outline, graph selection and Flow navigation clear them; tab changes retain them.

Activation closes search and keeps the query. Opening/reviewing search continues to preserve navigation state. Errors focus a visible status and leave the previous graph selection intact when document preflight fails.

## Separate review pass

A separate self-review checked mapping correctness, hierarchy reuse/cycles, state coordination, safe rendering, keyboard/focus behavior, viewport reveal and offline execution. No sub-agent review was performed.

Review found that a click on an old result row during a pending query could otherwise open a different hit. Activation now refreshes that list and waits for another click; Enter deliberately opens the first current result. A behavior test covers this case.

Screenshots at 1440, 900 and 640 pixels were inspected after node activation. They show the real breadcrumb path, selected boundary, updated inspector, retained query and focused body highlights. The matched passage remains visible at each width. Existing light-theme tokens are reused.

## Validation

`npm test`: **281 passed, 0 failed, 0 skipped**.

Coverage includes canonical backlinks and stale/duplicate IDs; shortest/reusable/cyclic paths; entry/node/edge/Flow activation; cross-bundle documents; unmapped sections; missing content and invalid IDs; unreachable detail; async hierarchy separation; keyboard activation/reopening; long-body scrolling; multiple Unicode terms; inline formatting/source actions; safe untrusted text; highlight replacement and normal navigation; stale-row protection; selected-node reveal without SVG replacement; and existing schema, Markdown, diagram and navigation tests.

Browser checks use local `file://`, block HTTP(S), and fail on network requests and page/console errors. The fixed-asset single-file CSP compatibility test passes. `git diff --check` passes. No runtime dependency or package/lockfile change was introduced.

## Limits and next milestone

Highlighting follows the M1-03 Markdown subset and existing Unicode token matching. It is not a general CommonMark parser, phrase-ranking engine, source extractor or historical-identity validator. Unanchored text remains document-level context. There is no persistent search route/session or browser-history integration. Existing dense-diagram limitations remain. Chromium was exercised; other engines and a full assistive-technology audit remain unverified.

M3 is complete. Recommended next milestone: **M4 — Offline Builder and source embedding**, after its task scope is approved. M4 was not started.
