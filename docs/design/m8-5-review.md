# M8.5 diagram layout stability and collision resolution

Date: 2 November 2026. Baseline: main `6648497`. Unrelated `.DS_Store` files were preserved. No commit, push, schema change, dependency change, engine replacement, analysis-generation rewrite or M9 work was performed.

## Root causes and before/after evidence

The [research plan](m8-5-plan.md) records the investigation and corrections. The Viewer uses its own iterative layered layout, not a third-party engine. DFS removes backward edges for longest-path ranks; that algorithm and graph semantics remain unchanged. Existing default node frames are bounded 224×80 and already had 100px horizontal clearance. No node-frame intersections were reproduced in the supplied synthetic cases. This task therefore does not claim that arbitrary user-reported node collisions were all fixed by changing their sizes.

Confirmed defects were:

1. Adjacent-edge tracks reused only three vertical offsets, 7.2px apart, for 20px-high label plates. Parallel branches, calls and normal/exception relationships could obscure each other's labels. This is not limited to decisions.
2. Outside lanes started 80px beyond the node envelope without reserving half the full label width. A long label could extend over an intermediate node. Local label overhang also matters when establishing that envelope.
3. Vertical source/target stems could pass behind another label plate even after the plates themselves were separated. Labels render above paths, so these were hidden relationships, not ordinary visible line crossings.
4. At normal zoom, actual first-line font bounds could exceed a diamond's narrowing top section. The old width cap did not use native line ascent/descent. Scaled SVG font measurement also changed under the default text rendering mode. Geometric text precision and line-specific fitting now keep glyph geometry stable.

Zoom applies one shared affine scene transform. It cannot separate elements that already share logical coordinates. Panel resizing changes the viewport Fit transform, not node ranks. No independent error/finding badge system exists here: exception exits are normal terminal nodes with failure colors; most of the observed small overlapping components are relationship-label plates.

An initial whole-text-box test was rejected: a multiline bounding rectangle includes empty corners between lines. Fit-only per-line checks also missed the normal-zoom issue. `/private/tmp/pflow-m85/text-probe-normal.json` records three original dense-case first lines crossing their diamond at 100%; the long-span original is reproduced by the new browser test's first normal-zoom check. Exploratory `after` fields in the early text probes used an abandoned enlarged-node experiment. They are not final evidence. Default node dimensions and text baselines remain unchanged in the final implementation.

### Reproduction matrix

`test/support/layout-cases.mjs` provides maintainable, deterministic synthetic graphs and canonical documents. They cover parallel relations, a 12-wide mixed rank, divergence/convergence, long titles, external shapes, normal/error exits, skip edges, self-loops and cycles. Separate nonuniform frame tests pass private measured presentation sizes; no widths/heights are added to public Diagram JSON.

| Graph | Nodes / edges | Before label-label or label-node intersections | After | Before hidden route/other-label contacts | After | Coincident segment pairs before → after |
|---|---:|---:|---:|---:|---:|---:|
| Parallel branch plus return/exception | 3 / 5 | 4 | 0 | 9 | 0 | 4 → 0 |
| Dense mixed branching/error/convergence | 16 / 39 | 30 | 0 | 328 | 0 | 141 → 0 |
| Long-span/self/cyclic | 9 / 11 | 1 | 0 | 7 | 0 | 1 → 0 |

Counts refer to exact plate/segment geometry and can include several contacts per relationship. Some old shared-origin segments were intentional common trunks; the count does not label every old shared segment a semantic bug. Final tested routes retain distinct paths and zero coincident positive-length segments in these cases. Ordinary point crossings remain possible and are not conflated with overlap or hidden labels.

Original and final records: `/private/tmp/pflow-m85/before-geometry.json`, `after-geometry.json`, `route-comparison.json`, `before-browser.json`, `after-browser.json`, and `before-*.html/png` / `after-*.html/png`. Original small-graph images were generated before source changes; final images were regenerated from the same inputs. Main visually compared the parallel before/after and dense final captures. The dense final graph is wider/taller because it reserves real routing space; Fit is small and zoom/pan remains appropriate.

## Implementation

`viewer/graph-layout.js` now derives each row's width and maximum height from its presentation frames. The default remains 224×80. A private `nodeSizes` map permits measured nonuniform frames in layout/renderer tests; it is neither a new architecture schema nor a public process field. Logical graph dimensions are independent of viewport dimensions. Selection/control/arrow/plate extents are included in final Fit bounds.

Source and destination ports are sorted by neighbor center and stable edge ID, then cached per layout. Diamond ports touch actual slopes; capsule ports stay in their flat top region. Multiple relationships retain separate ports and arrowheads. Edges keep their real IDs/endpoints/kinds/modes. No consumer graph duplication, speculative edge or hierarchy is introduced.

Each rank gap uses deterministic first-fit horizontal interval reservation. Intervals include the path and plate width; disjoint spans can share tracks. Conflicts get separate tracks spaced for 20px plates and clearance. A simple chain retains its 48px base gap. Only occupied gaps grow. Outside lanes clear both the node and local-label envelope, and successive lanes reserve the full plate width.

Local plates use a clear part of their horizontal route where one exists. A route/other-label check then identifies plates that still hide stems. Only those plates are promoted to dedicated outer lanes, and reservations are repeated. The promoted set grows monotonically, each edge can be promoted once, and no-progress fails through the existing error state. Outer plates sit halfway between source-gap horizontal track levels, so another horizontal spoke does not cut through them. A local-detour experiment was discarded because it created coincident bypass segments; it is not in the final code.

Static ports/label specifications are reused across reservation passes. A coarse route bounding-box check rejects unrelated pairs before segment tests. This avoids unnecessary work on long sparse graphs while retaining the collision checks. There is no persistent cache, new layout dependency, visibility framework or graph reconstruction on simple selection/theme changes.

`viewer/diagram.js` sets SVG text rendering to geometric precision and measures each decision tspan/type/source line's vertical bounds. The permitted width comes from the actual diamond cross-section with padding, then existing native width fitting truncates safely. Full labels/evidence remain available through existing accessible names, SVG titles and inspector/documentation. No public content is rewritten.

## Changed files

| Files | Responsibility |
|---|---|
| `viewer/graph-layout.js` | Frame-based rows/ports, interval reservations, clear label placement, bounded outer-lane promotion and scene bounds |
| `viewer/diagram.js` | Stable geometric text rendering and native per-line diamond fitting |
| `test/diagram.test.mjs` | Existing endpoint assertions now verify actual diamond borders rather than an obsolete rectangular-bottom assumption |
| `test/layout-collision.test.mjs` | Eight geometry regressions, including nonuniform frames, parallel/error paths, local overhang and seeded 160-node/328-edge cycles |
| `test/layout-collision-browser.test.mjs` | Five packaged-file browser cases with actual SVG path/plate/glyph geometry and Viewer interactions |
| `test/support/layout-cases.mjs` | Reproducible synthetic artifacts, canonical docs and collision checks |
| `README.md`, `viewer/README.md`, `docs/roadmap.md` | Current behavior and stabilization scope |
| `docs/design/m8-5-plan.md`, this report | Research, root-cause corrections, validation and independent reviews |

The ignored `dist/pflow/` was rebuilt. No maintainable source or unrelated file was removed.

## Actual tests and performance

| Execution | Result |
|---|---|
| Original geometry/browser reproduction | Label collisions and hidden routes recorded; original pages opened offline without runtime errors |
| Initial existing geometry suite | 22/23; old endpoint test assumed bottom-center diamond ports. Replaced with stronger actual-slope checks |
| Initial new browser suite | Exposed normal-zoom glyph bounds and later extreme-Fit measurement instability; fixed with native shape fitting/geometric precision, without weakening checks |
| Final focused `node --test test/diagram.test.mjs test/layout-collision.test.mjs test/layout-collision-browser.test.mjs` | **36 passed**, zero failed/skipped/cancelled; `/private/tmp/pflow-m85/verified-focused.log` |
| Final `npm test` | **620 passed**, zero failed/skipped/cancelled; `/private/tmp/pflow-m85/verified-full.log` |
| `npm run build:skill` | Passed; 40 files, one runtime, unchanged distribution structure |
| `git diff --check` | Passed |

Geometry checks now cover node/node, label/node, label/label, route/unrelated-node and route/other-label intersections, actual source/target shape ports, orthogonal legs, arrow approach, bounds/auxiliary halo, array-order determinism, dense merges, nonuniform frames and cyclic termination. Test setup corrected an invalid branch after changing a synthetic source node to an operation; no validator rule was changed.

Browser assertions use actual screen-space path points and label rectangles, and native per-line glyph bounds against rendered shapes. They run at 100%, three increased zoom steps, pan, Fit, desktop and 720px widths, drag/keyboard resizing, collapse/restore and theme changes. They assert the same mounted SVG/document roots survive presentation interactions, Node/section synchronization still centers the correct Node, detail opens explicitly, Back restores the caller and repeated rendering yields identical paths. Existing full-suite tests retain source/evidence safety, Unicode, async, shared detail, search, selection, M6 recovery and packaging regressions.

The new collision work adds CPU cost. A same-host warm benchmark (five warmups plus thirty samples, no concurrent test run) records the following layout-only medians in `/private/tmp/pflow-m85/performance.json`:

| Case | Original median | Final median | Final maximum |
|---|---:|---:|---:|
| Parallel | 0.024ms | 0.042ms | 0.187ms |
| Dense | 0.187ms | 0.687ms | 0.996ms |
| 300-node cyclic chain | 0.888ms | 3.138ms | 3.833ms |

A seeded 160-node/328-edge cold test also completed under the 3-second stall guard; cold timings fluctuate during concurrent browser suites. This is not a general latency guarantee. Pair checking and additional promotion passes can cost more on large dense graphs; the bounded pass count prevents infinite retries, not arbitrary-scale complexity. The measured additional work remained small for these cases and is not repeated for selection, pan, zoom, resize or theme. No measured UI stall required a new engine or dependency.

## Offline and single-bundle validation

Final generated executable: `dist/pflow/scripts/pflow.mjs`, **1,217,587 bytes**, SHA-256 `4b1480abff0cd87cf72ea02ca03781a373ca0676421d23d4764df7817e12d78b`. There is still exactly one runtime plus SKILL.md/38 Markdown references; schema, Builder, Viewer and M6 code use the existing packaging pipeline.

The new browser fixtures build a copied Skill in unrelated temporary paths. A Node child can read/write only its installation/input/output tree and runs the actual packaged build command from a different cwd. Input and installation trees are removed before Chrome opens the generated standalone HTML offline. The new cases made only one request for their own HTML and had no page/console errors. The full existing packaging suite also validates byte-identical source/bundle output, deterministic builds, both input modes and installed M6 safeguards.

Persistent before/after captures use the existing Builder with synthetic artifacts, not a target application script or service. The primary proof of packaged behavior is the generated-file browser suite. No real services, target installs, source execution or network infrastructure were used. The pages are read-only and need no external CSS/JS, local server, input files or installed Skill at runtime.

## Independent review

Gavin performed read-only root-cause research. Its initial text-box suspicions were checked against native browser measurements rather than accepted as proof. The root plan records rejected aggregate-box and enlarged-node experiments.

Yena's first independent pass found **M85-R1 (P2)**: fourteen dense-case segments still passed behind another plate. It ran read-only geometry probes and identified exact relationships. Main added segment/other-label assertions to both geometry and browser tests, replaced hidden-plate routing with bounded outer-lane promotion, and reran tests. The final reproduced cases have zero such contacts and no coincident route segments.

A fresh independent reviewer checked the revised algorithm and tests, verified R1 resolved, and ran 100 deterministic cyclic/irregular graphs with 25–64 nodes. It found zero collision/determinism failures; its maximum measured layout time was 9.83ms. It found no unresolved blocking runtime defect and inspected a 620-pass full log. It requested that the plan distinguish Fit-only checks from the later normal-zoom glyph finding; that documentation was corrected.

Reviewers did not independently run builds, browser sessions or the complete suite. They reviewed current scoped files without an immutable task-only patch. Main then ran the final focused/full suites, packaging, captures and performance measurements, including the final coarse-bound/port/specification reuse optimization. No unresolved critical in-scope issue remains in this bounded evaluation.

## Limits and stopping point

The tested collisions are fixed; this is not proof that every graph from real-world use is collision-free or easy to read at Fit. Ordinary line crossings remain possible. Dense logical diagrams can grow wider/taller and require zoom, pan or genuinely supported detail Flows. Do not fabricate hierarchy to make a graph smaller. Default frames still use bounded text/truncation; full text is preserved elsewhere.

Chrome on this host is the browser verification boundary. Other engines, fonts, OSes and assistive technologies are not certified. The private frame tests are presentation stress tests, not new schema capabilities. Synthetic source files establish structural fixture validity, not application/process truth. The updated runtime preserves existing source containment, safe Markdown, canonical references and M6 safeguards.

Stop after M8.5. M9 remains deferred. No commit or push was made.
