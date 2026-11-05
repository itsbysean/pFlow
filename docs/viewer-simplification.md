# Viewer simplification

## Scope

This follow-up implements the presentation gaps verified against the current working tree. It reuses the existing graph, Markdown, evidence, navigation, findings and standalone packaging implementations. The public graph contract and analysis pipeline are unchanged.

## Behavior

- The Header contains the only search input. The Navigator retains data-derived start groups and exposes existing detail flows in lazy, nested native disclosures. Buttons retain the entry and calling-node path. Shared graphs remain shared; repeated flows in a path cannot expand again. Async edges do not create hierarchy.
- The complete Markdown narrative remains mounted during selection. The optional Contents outline, Evidence references, Process summary, Technical details and Findings use independent native disclosures. Documentation and evidence links reuse their existing reference resolution. Technical fields remain available without a separate inspector tab.
- Node selection emphasizes its immediate connections and dims unrelated elements. Edge selection emphasizes the relationship and both endpoints. Clearing selection restores the graph. Selection does not reconstruct the SVG or change its viewport.
- Show exceptions hides exception edges and exclusively reached terminal outcomes. Shared outcomes and nonterminal steps remain visible. This is a presentation filter: graph coordinates, Markdown and source evidence are retained. Explicit navigation to a hidden exception reveals it again.
- Local storage holds only theme, panel widths and explicit collapsed states. Blocked or malformed storage does not prevent use. Responsive layout clamps restored widths. Process, node, zoom and exception visibility are not persisted.

## Verification

Browser tests use Builder-generated standalone HTML through `file://`, with network access blocked. They cover repository, onboarding and deployment fixtures; canonical section navigation; keyboard controls; shared and recursive detail navigation; source excerpts; safe untrusted text; selection emphasis; exception filtering; persisted preferences; blocked storage; panel resizing and both themes.

Existing packaged-Skill tests build and execute the single runtime without development dependencies and remove the original input files before using generated HTML. Existing lifecycle, containment, rollback and deterministic-build tests remain part of the full suite.

Screenshots were also inspected in Chrome at 1440 × 900, in light and dark themes, with the narrative and evidence disclosure. This is a heuristic visual check, not a human usability study or cross-browser certification.

## Limits

The current Viewer payload has no authoritative recent-change history, analysis-progress state or Documentation Mismatch classification. No such indicators or empty report sections are fabricated. Findings remain separate from those concepts.

Exception filtering leaves logical whitespace rather than rerouting the graph. Only exception edges and exclusively reached terminal outcomes are hidden; it does not infer which other steps are technical. The direct Flow chooser remains for flows without a reachable entry-point path. Document context metadata is available in a collapsed disclosure.

The follow-up received main-agent code and browser review. No separate independent reviewer was used in this follow-up.

## Executed checks

- `node --test --test-concurrency=2 test/*.test.mjs`: 717 passed, 0 failed, 0 skipped on the final implementation.
- `npm run build:release`: passed; rebuilt the local `dist/pflow.zip` with one executable (`pflow/scripts/pflow.mjs`). No release was published and no version was changed.
- The local packaged runtime built 3 architecture artifacts, 6 Markdown documents and 19 evidence snippets. Its generated HTML was byte-identical to output from the development Builder.
- `git diff --check`: passed.

The source changes and regenerated distribution remain local. This follow-up did not commit, push or deploy.
