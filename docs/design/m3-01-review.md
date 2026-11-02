# M3-01 review and completion

Implemented on local `main` after M2-04 (`d19622a`). M1 schema 1.0.0, architecture examples and Markdown contracts are unchanged.

## Files

| Files | Change |
|---|---|
| `viewer/markdown-search.js` | DOM-independent Markdown extraction, normalized token postings, ranked AND/partial matching, previews and Unicode highlight ranges |
| `viewer/search.js` | Independent header search controller, native text rendering, keyboard review and optional precomputed index input |
| `viewer/index.html`, `viewer/viewer.css` | Accessible combobox/listbox, bounded overlay, result/focus styling and sticky header |
| `test/markdown-search.test.mjs` | Deterministic content, ranking, Unicode, deduplication, empty/index validity and corpus tests |
| `test/viewer.test.mjs` | Offline search interaction/security/state tests; updated runtime list and single-file coverage |
| `README.md`, `viewer/README.md` | Usage, ranking, index interface, scope and limits |
| `docs/design/m3-01-plan.md`, this file | Plan and review record |

## Separate review pass

A separate self-review pass checked the implementation against the request. No sub-agent review was performed.

- The index reads all available embedded Markdown, including architecture indexes and inactive bundles. It does not use graph labels as a substitute for prose. Literal entity sections retain IDs; unanchored text remains document-level context. Source-ID citation syntax, destinations and example fences are not search terms.
- Ranking and ties are deterministic. All terms must match the same section context; partial words and Unicode casing/normalization are supported. Multiple hits in one section do not create duplicate rows. Title-only hits do not create a row for every child section.
- Search has no navigation, selection, documentation-panel or viewport dependency. Tests compare selected entity, diagram identity/transform, caller trail and reading context before and after search review.
- DOM previews use text nodes and `mark`, with literal normalized offset mapping. Untrusted inline markup stays text. No network API, runtime dependency or generated HTML insertion was added.
- The index builds once; queries reuse token postings. Precomputed version-1 payloads survive JSON round trips and initialize the real Viewer. Twenty-row rendering bounds DOM updates. This is an internal Viewer payload, not an M1 contract extension.
- Browser testing found narrow popup overflow; anchoring the narrow overlay to the header fixed it. Review also added composition-key guards and Escape handling when the clear button has focus.
- Screenshots at 1440, 900 and 640 pixels were inspected. Popup bounds, readable hierarchy, internal scrolling and the light theme were checked. Chromium exercised native focus, active-descendant review, shortcut focus return, clearing and empty states.

## Validation

`npm test`: **260 passed, 0 failed, 0 skipped**. This includes existing schema, semantic/Markdown-contract, graph/navigation, inspector and offline browser tests. Browser tests load `file://`, block HTTP(S), and fail on remote requests or console/page errors. Fixed-asset single-file startup still passes with CSP hashes.

The deterministic corpus exercise indexes 500 documents / 1,500 sections once and runs 25 repeated multi-term queries. Timing is reported as a diagnostic, not a machine-dependent pass threshold. No performance claim for unbounded corpora is made.

`git diff --check` passes. No package/lockfile, M1 schema, sample JSON, source fixture or sample Markdown changes were required.

## Limits and next task

This is an M1-03 extractor, not a full CommonMark parser or linguistic search engine. Unanchored subheadings share their nearest literal section; no generated slugs are used. Results are previews and do not change reading/diagram context. There is no fuzzy search, stemming, query language, live corpus watcher, persistent search session or arbitrary-size index guarantee. Browser validation used Chromium; other browser engines and a full assistive-technology audit remain unverified.

Recommended next task: **M3-02 — Search Result Navigation**. It was not started. Builder/source extraction remain later work.
