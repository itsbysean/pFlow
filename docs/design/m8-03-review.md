# M8-03 Viewer polish and end-to-end validation

Date: 1 November 2026. Baseline: main `4a3d3e0` with completed, uncommitted M8-01 and M8-02. Existing work and unrelated `docs/.DS_Store` were preserved. No commit or push was made. M8-04 packaging and M9 potential bug analysis were not started.

## Findings and fixes

The [plan](m8-03-plan.md) records research and the bounded scope. Main inspected the actual shell, selection/navigation components, safe Markdown, Builder integration and existing tests. Delegated read-only research confirmed that native panel, tab, diagram and search keyboard controls already exist. It identified contrast and reduced-motion verification gaps, rather than proposing new components.

Main reproduced three presentation defects in generated HTML:

- An unbroken title extended to about 15,948px in a 320px workspace. A long Unicode title could make the heading 437px tall even in a wide workspace. Titles and context descriptions now wrap within the column and display at most three lines. Complete text remains in the DOM, accessible heading and native title metadata. Short workspaces scroll locally so controls are reachable.
- At 420x350 the search popup extended below the window. Its height is now bounded by the viewport and its results shrink and scroll while status and keyboard help remain available.
- Several light-theme normal-text combinations were below a 4.5:1 contrast ratio: muted/selected 4.37, blue/selected 4.42, purple/category 4.47, orange/category 3.68 and red/category 4.46. Their existing tokens were darkened. Placeholders use the muted token at full opacity. Focused checks now require at least 4.5:1 for seven normal-text pairs in both themes. Disabled text is not treated as enabled text.

No graph/schema, analysis, parser, navigation model, dependency, Builder, M6 safety or packaging change was needed. Existing selection and explicit expansion remain separate. No motion was added: the current UI has no running animations under reduced-motion preference.

## Changed files for M8-03

| File | Change |
|---|---|
| `viewer/viewer.css` | Contrast tokens/placeholders, bounded title/context, local workspace scroll, bounded search overlay |
| `viewer/viewer.js` | Complete native title metadata for Flow heading/context |
| `test/viewer-polish.test.mjs` | Nine generated-file behavior/contrast/focus/performance cases |
| `viewer/README.md`, `README.md`, `docs/roadmap.md` | Verified behavior, scope and limits |
| `docs/design/m8-03-plan.md`, this report | Findings, plan, execution results and review |

Other dirty files belong to M8-01/M8-02. They were not staged or discarded. Historical completion records were retained.

## Execution and test results

| Execution | Result |
|---|---|
| Initial restricted `npm test` | Browser launches were blocked by the execution environment. This was not counted as a Viewer regression or a pass. |
| Baseline `npm test` with permitted Chrome execution | 589 passed, zero failed/skipped; `/private/tmp/pflow-m8-03-baseline-browser.log` |
| New tests before fixes | Reproduced long-title, short-window search and contrast failures. Also exposed test setup errors: code Nodes need not have Markdown labels equal to diagram labels; unknown mode belongs in branch labels; the synthetic Flow needed its evidence citation. These setup errors were corrected without changing the contract. `/private/tmp/pflow-m8-03-repro.log` |
| `node --test test/viewer-polish.test.mjs` after fixes | 9 passed, zero failed/skipped; `/private/tmp/pflow-m8-03-focused-verified.log` |
| Full regression before the final focus case | 597 passed, zero failed/skipped; `/private/tmp/pflow-m8-03-verified.log` |
| Final `npm test` | 598 passed, zero failed, skipped or cancelled; `/private/tmp/pflow-m8-03-final.log` |
| `git diff --check` | Passed |

The full suite includes schema/semantic/Markdown safety, graph geometry/cycles, async boundaries, shared detail callers, selection/document synchronization, source snippets, search, panel drag/cancel/keyboard resizing, both themes, flat/legacy layouts, deterministic standalone generation, and M6 impact/regeneration/manual-note/rollback/rebuild behavior. No existing assertion was weakened for this task.

### New generated-file evaluation matrix

All three primary scenarios use existing reviewed analysis artifacts, actual evidence files, the existing validators and the real Builder. Inputs are deleted before the browser opens the output. Chrome runs offline and tests reject additional requests, page errors and console errors.

| Scenario | Input and actual execution | Result |
|---|---|---|
| Repository | `examples/a-sync`: command registration, reusable execution detail, validation library, condition, unresolved configured HTTP host and return/exception paths | Existing graph/Markdown pass preparation. Generated file supports start selection, canonical Node/document mapping, keyboard locate, exact evidence, actual Markdown search and both themes. Other full-suite fixtures cover async chains and shared detail paths. |
| Onboarding | `test/fixtures/prompt-mode/onboarding/bundle`: original request, separate clarification evidence and documented access subprocess | Same pipeline passes; explicit detail entry, Back/Forward/Top level, document/diagram selection, evidence, search and themes work offline. No extra responsibilities or steps were authored. |
| Deployment | `test/fixtures/prompt-mode/deployment/bundle`: prepare, verify, pass/publish and fail/abort | Same pipeline passes; decision and both labeled alternatives render. Unknown relationship mode is retained; no approval, retry or rollback is invented. |
| Long labels | Isolated deployment fixture with long unbroken or Unicode Flow title | Full accessible text/title retained; heading stays inside workspace and under 100px at 1024x600. Fit remains usable. Synthetic labels are presentation stress data, not process claims. |
| Short search | Generated deployment file, 420x350 | Popup and keyboard help stay in window; results remain scrollable; Arrow/Enter opens a real result. |
| Focus and motion | Generated deployment file, both themes and 800x300; reduced-motion browser preference | Keyboard focus is visible on separator, Fit and SVG select controls. Short workspace controls remain reachable; no running animations. Existing tests also cover shortcuts, tabs, resize and recursive navigation. |
| Bounded load | Synthetic 120-node chain, 609,559 UTF-8 Markdown bytes, 30 selections | SVG and mounted document stay identical, with zero observed root replacements. Focused run: maximum synchronous selection 8.4ms, total 22.7ms. Resize/theme preserve content and selection. No optimization was justified. |

The performance test has a loose 3-second single-selection stall guard. The recorded measurements are local observations, not a general performance target. It measures the synchronous selection work, not full input-to-paint latency. The synthetic source association permits structural validation but does not establish real process evidence. Fixture-backed Viewer tests are not a new autonomous AI analysis of a real repository.

## Offline and visual verification

Main generated persistent previews with `/private/tmp/pflow-m8-03-preview.mjs`, using `prepareBuild` and `writeStandaloneHTML`. It deleted each temporary input tree before opening the file. Outputs:

| Output | Embedded documents/snippets | Bytes |
|---|---|---|
| `/private/tmp/pflow-m8-03/code.html` | 2 / 8 | 178,160 |
| `/private/tmp/pflow-m8-03/onboarding.html` | 2 / 6 | 172,568 |
| `/private/tmp/pflow-m8-03/deployment.html` | 2 / 4 | 167,413 |

Each browser context was offline. Each page requested only its own `file://` HTML and had no page errors. Results: `/private/tmp/pflow-m8-03/preview-results.json`. Captures cover 1536x1024, 1024x768, 720x600 and 420x700 light layouts, plus desktop dark mode. Existing shell tests cover additional widths and panel drag/keyboard behavior.

Main visually inspected `code-1536-light.png`, `onboarding-1536-dark.png` and `deployment-720-light.png`. They retain the approved header and three-column hierarchy, graph categories and complete process-document panel. At narrow width the explorer becomes a restore rail; the diagram and documentation remain available. The fitted graph is small at 720px; users can collapse documentation, zoom and pan for detail. This is a practical desktop-first fallback, not a new mobile UI.

As a heuristic onboarding review, the representative documents state their start, sequence, branching and exits; explicit detail buttons expose supported substeps and evidence links expose exact sources. The repository example leaves the HTTP host unresolved, onboarding records the incomplete-submission clarification, and deployment does not invent missing policies. No independent human participant or screen-reader session was used. Structural validation alone is not proof of explanation accuracy.

## Independent review

Gavin performed read-only research. Yena independently reviewed the scoped implementation, tests, baseline and focused logs over the prior dirty foundation. No blocking code defect was found. The reviewer noted that a metric originally used JavaScript string length under a byte label. Main corrected it to `Buffer.byteLength` and reran the focused suite: 609,559 UTF-8 bytes.

The reviewer did not independently run tests or browser sessions and did not receive an immutable task-only patch. Final full-suite and visual/report verification were Main's responsibility. Main checked the final report against the 598/598 full log, 9/9 focused log and three preview records. The reviewer did not perform an iterative re-review of those final additions. The final keyboard-focus case and corrected byte metric were verified by Main. No unresolved critical in-scope finding remains.

## Remaining limits and next task

Chrome is the tested browser. Screen-reader behavior, cross-browser rendering and human usability are not certified. Contrast tests cover selected semantic pairs, not an exhaustive WCAG audit. The bounded load measurement does not promise arbitrary graph/document scale. Long headings have a visual limit; complete text remains available in the accessible DOM, title and documentation context. Very narrow/short windows need local scrolling, panel collapse and zoom.

M8-01 through M8-03 are ready for the bounded desktop/offline workflow verified here. M8-04 single-bundle Skill packaging remains unimplemented and requires separate approval. M9 remains deferred. No commit or push was made.
