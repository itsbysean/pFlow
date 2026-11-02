# M8-01 pFlow layout completion and independent review

Date: 30 October 2026. Baseline: main `4a3d3e03f9a648feea71281e05c7109a5e86ce2a`. The unrelated `docs/.DS_Store` was preserved. No commit or push is included.

## Approved scope and reference

The supplied M8-01 request reassigns M8 to Viewer UI/UX redesign and moves optional potential bug analysis to M9. The roadmap retains that deferred scope. Earlier M1–M7 completion records remain historical. Only the Viewer branding changes to pFlow. Internal package names, graph IDs, schemas and evidence rules remain unchanged.

The supplied process-explorer screenshot was available and inspected before implementation. Reference SHA-256: `6e9a653a8e68d95da9e6a0f5a01ffb964c6b3d9764f2faf494e49fb7687fb033`. It establishes the light desktop header, three vertical panels, subtle boundaries, central diagram and visible document column. Its illustrative HTTP/Java/broker content is not copied into graph data or navigation categories. There is no Settings control.

The [plan](m8-01-plan.md) records research and integration choices. Native components were reused. No new rendering, analysis, schema or state framework was introduced.

## Implemented behavior

- Header: pFlow, existing offline Markdown search, Docs and a working light/dark toggle. No project/artifact selector, branch selector, Settings control or hidden replacement action remains.
- Explorer: actual starts from every loaded artifact, with bundle context, recorded-condition grouping, text/category filtering and active selection. A start switches the existing active artifact and root flow. Artifacts without starts expose their documented Flows without inventing starts. There is no replacement project menu.
- Center: existing SVG renderer, graph semantics, explicit expansion, Back/Forward/Top level, breadcrumbs, selection, zoom, fit and pan. Its existing ResizeObserver fits changed available space.
- Right: one full-height documentation column. Existing Markdown, evidence, summary and inspector DOM are reused in Documentation, Evidence references, Process summary and Details tabs. Selection exposes Details. Existing search activation still opens its matching document passage. There is no separate Inspector panel or bottom documentation panel.
- Docs restores the right column and opens the current Flow's canonical documentation without changing graph selection. Existing index content or an explicit unavailable state handles absent Flow documentation. Evidence and document actions also restore the column.
- Chevrons independently collapse and restore either side. Both sides can be closed. Visible restore rails remain available. Pointer capture supports dragging and cancellation. Separator Left/Right keys change width by 20 pixels. Home/End use the available minimum/maximum. Bounds retain center space. Focus moves to a restore button when resizing hides focused panel content or a separator.
- Narrow windows shrink panels within responsive limits, then collapse them. Restoring a side may close the opposite side if both cannot fit. No documentation region is stacked below the diagram. At 720px the explorer collapses and the diagram/documentation remain usable beside each other.
- Dark tokens cover header, panels, SVG categories/edges/labels, search, documentation, evidence and panel controls. Light remains the default. Theme and panel state are session-only.

This is structural placement and preservation of existing navigation. No new bidirectional node/paragraph synchronization or M8-02 timeline integration is implemented.

## Changed files

| Files | Responsibility |
|---|---|
| `viewer/index.html` | Approved header, three panels, restore/divider controls, existing inspector moved into right-column Details tab |
| `viewer/viewer.css` | Full-height shell, document-column presentation, responsive controls and dark semantic tokens |
| `viewer/layout.js` | Presentation-only panel sizes, collapse/restore, pointer/keyboard interaction, focus recovery and theme |
| `viewer/viewer.js` | All-artifact process navigation/filtering, real Docs action, pFlow title and tab coordination |
| `viewer/documentation-panel.js` | Restore right column for explicit document/evidence opening |
| `builder/html.mjs` | Remove obsolete sample-picker label dereference; declared assets use the existing packaging path |
| `test/viewer-shell.test.mjs` | Fifteen generated-file cases for shell behavior, themes, filters, focus and narrow windows |
| `test/viewer.test.mjs` | Replace removed picker interactions with actual start navigation; preserve graph/search/evidence assertions and test new placement |
| `test/documentation-generation.test.mjs`, `test/generic-presentation.test.mjs`, `test/prompt-mode.test.mjs` | Open the explicit Details tab before inspector evidence actions |
| `README.md`, `viewer/README.md`, `builder/README.md` | Current header, artifact browsing, panel keys, evidence access and preview instructions |
| `docs/roadmap.md` | Approved M8/M9 reassignment with deferred requirements retained |
| `docs/design/m8-01-plan.md`, this report | Plan, actual checks, review findings and limitations |

M1 validators, M6 provenance/transactions, source containment, graph layout algorithms, search implementation and dependencies were not changed. Builder and M6 freshness discover the declared layout script through existing mechanisms.

## Verification executed

From the repository root:

| Check | Result |
|---|---|
| Initial affected browser suites | Prompt/generic/packaging cases passed; old layout/picker/tab assertions were updated to match the approved shell |
| First full `npm test` | 572 passed, zero failures/skips, before the final narrow/focus/filter regressions |
| Expanded full run | Found a wrong artifact path in the new filter test selector; corrected the test to check the visible matching entries |
| Final `npm test` | **574 passed, zero failed, skipped or cancelled**; `/private/tmp/pflow-m8-01-verified.log` |
| `git diff --check` | Passed |
| `node builder/cli.mjs build --input examples --repository-root . --output /private/tmp/pflow-m8-01/architecture.html` | 3 artifacts, 6 Markdown documents, 19 embedded snippets; valid standalone HTML |
| Generated-file preview via installed Chrome/Playwright, networking disabled | Only the HTML file itself requested; no page errors |

The fifteen new browser cases test header/removed controls, full-height geometry, independent and simultaneous collapse, restore focus, pointer/keyboard width bounds, cancellation, SVG resize/viewport controls, Docs/selection preservation, all-artifact navigation, actual category filtering, Cmd/Ctrl+K and search activation, complete theme token changes, missing/padded trigger normalization, automatic-collapse focus recovery, and widths 1100/900/720/640/420px. Every case opens actual Builder output through `file://` and checks for no external requests or page errors.

The full suite also exercises repository and prompt bundles, shared detail/recursion, selection versus expansion, source excerpts, safe Markdown and hostile content, Unicode, canonical search navigation, flat/legacy compatibility, M6 regeneration/manual preservation and failed-publication recovery. Existing tests continue to verify behavior through accessible tabs rather than relying on removed controls.

## Visual inspection and offline preview

Preview: `/private/tmp/pflow-m8-01/architecture.html`. Driver/results: `preview.mjs`, `preview-results.json` in the same private directory. Generated captures: `light.png`, `dark.png`, `narrow.png`. Main inspected both desktop themes at 1536×1024 and the final 720×1024 layout against the supplied reference. The updated narrow capture shows the left restore rail and visible diagram/documentation. Header search, Docs and theme remain reachable.

The implementation follows the reference's layout, light surfaces, subtle boundaries and hierarchy. The graph content, existing graph geometry and canonical document structure remain from M1 examples. Numbered narrative cards, new node/paragraph synchronization and final diagram styling belong to later tasks. Visual inspection is not a pixel-equality, human usability, cross-browser or assistive-technology certification.

## Independent review and fixes

Gavin performed bounded read-only research of test, search and packaging dependencies. It identified the old picker dereference in Builder and the need to retain all-artifact navigation without moving the removed selector.

Yena performed a separate read-only review of the working diff, new layout/test files, supplied reference, generated light/dark captures and recorded 572-test result. It found one P2 defect: raw trigger values populated filter options, while the existing adapter trimmed labels and supplied a missing-trigger label. Missing or padded triggers could therefore hide their own entries. The fix reuses the adapter's group labels for both options and groups. A generated-file regression now checks omitted and padded triggers. The final full 574-test run verifies that fix and the latest narrow/focus changes.

The reviewer found no other blocking issue. It did not independently run Chrome, builds or tests, and its initial narrow capture preceded Main's final adjustment. Main completed the final run and inspected the refreshed narrow image afterward. No unresolved critical finding remains in this bounded scope.

## Limits and next task

Only installed Chrome was browser-tested. Very small windows use reduced panel minima and may require collapsing a side for readable content. Dense graphs still need zoom or supported detail flows. Themes and widths are not persisted across reloads. Documentation uses the existing canonical sections and tabs rather than the final integrated presentation. No new synchronization, graph taxonomy, settings, findings, repository rename or prompt incremental mode was added.

Stop at M8-01. Recommend M8-02 diagram/document integration only after developer approval. No commit or push was performed.
