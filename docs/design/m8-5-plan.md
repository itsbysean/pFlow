# M8.5 layout collision research and plan

Date: 2 November 2026. Baseline main `6648497`. Preserve unrelated `.DS_Store` files. No commit/push or M9 work.

## Reproduced root causes

The Viewer uses its own deterministic layered SVG layout, no third-party graph engine. Rank assignment removes DFS back edges, then uses a longest-path DAG rank. Current node rectangles are always 224x80, with 100 horizontal and 48 vertical gaps. Those rectangles did not overlap in the three reproduced graphs. This does not establish that every real-world report has the same cause.

Confirmed before-fix evidence in `/private/tmp/pflow-m85/`:

- Three parallel branches and parallel return/exception relations: four label-label intersections.
- Twelve-way mixed branching/convergence/error exits: thirty label-label intersections.
- Long-span/cyclic graph: one outer-lane label intersects an unrelated node.
- Initial whole-text bounds were a false-positive shape test because they include empty corners between lines. Per-line Fit checks alone also missed an issue: at 100% the original first lines in three dense decisions and one long-span decision crossed their diamond boundary. Native font bounds varied with rendering scale. Keep default node sizes; fit each actual line to the diamond cross-section and use geometricPrecision for stable scaled SVG text. No terminal overflow was confirmed.

`before-geometry.json` records exact IDs and bounds. Actual generated offline pages, screenshots and `before-browser.json` record the rendered shapes. Edge-label plates use estimated widths, but text is already natively measured and truncated inside them. The confirmed defect is placement, not uncontrolled text expansion. Adjacent route tracks repeat three offsets only 7.2px apart for 20px label plates. Outside lanes start only 80px from the node envelope although a label can exceed 160px. The layout never reserves intervals for either class. Zoom applies a uniform scene transform, so it preserves these intersections.

## Targeted changes

1. Keep rank/ownership/entry/detail semantics, stable ordering and the proven bounded 224x80 renderer frames. Derive rows and ports from each returned frame rather than global constants. A private layout-only nodeSizes map permits geometry tests with nonuniform measured frames, without public graph fields. Keep native text fitting and complete accessible titles. Include selection/control extents in scene bounds.
2. Position each row using actual node widths and maximum row height. Keep current base horizontal clearance; logical graph width grows with occupancy, independent of viewport.
3. Reserve horizontal route intervals in each rank gap. First-fit nonintersecting intervals share a track; conflicting intervals receive distinct tracks spaced for actual label plates. Only occupied gaps grow. Allocate long/back/self edge lanes using half-label widths and clearances, not fixed offsets. Connect to actual shape borders and spread ports deterministically.
4. Add geometric checks for label/node/label collisions, orthogonal routing, unrelated node interiors, mixed dimensions, correct shape endpoints, determinism and bounded performance. Preserve valid cycles and async stubs. Record unavoidable crossings/shared near-port geometry separately.
5. Test actual per-line SVG glyph/shape/auxiliary bounds, normal/increased/Fit zoom, pan, narrow/desktop panels, resize/collapse/themes, document selection and explicit detail. Keep SVG/document roots stable for simple interactions.
6. Rebuild the existing single-runtime Skill; use installed CLI to generate tested HTML outside the repository, then remove inputs/installation before offline Chrome checks. Run complete regression suite and independent review. No new dependency, graph engine, public schema, UI feature or analysis logic is required.

Follow-up correction: text-probe.json records Fit-only per-line checks; text-probe-normal.json supplies the original 100% reproduction. Those exploratory files also contain an abandoned enlarged-node experiment, not the final renderer. Final generated-file tests use unchanged default frames and check all zoom states. No node-size increase is part of the fix.

Independent review R1 found fourteen remaining path-under-label segments after initial plate placement. Tests now include these intersections. Local labels move to clear route spans where possible; labels with no clear span receive a dedicated outer lane. Re-reservation uses a monotonic promoted-edge set and has a bounded pass count. Outer captions sit between source-gap track levels, so other horizontal spokes do not cross them. Zero-progress fails safely. Static ports/label specifications and coarse route bounds avoid needless repeated work. Experimental local detours were discarded because they created coincident segments.
