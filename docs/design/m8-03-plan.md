# M8-03 Viewer polish and E2E plan

Date: 1 November 2026. Baseline: main `4a3d3e0` plus uncommitted M8-01 and M8-02. Preserve those changes and unrelated `docs/.DS_Store`. Do not commit or push.

## Research

The actual Viewer has the approved three-column shell, header controls, ID-based bidirectional document navigation and explicit detail actions. Existing native controls cover selection, search, tabs and separators. The Builder embeds the same runtime and evidence. No schema or packaging change is needed.

Read-only delegated research found no confirmed functional regression, but identified missing quantitative contrast and reduced-motion coverage. Main opened real Builder output in Chrome. At 1536x1024, 1024x768, 800x600, 720x600 and 420x700 the normal panel restore and diagram controls were within the window. A long Flow label produced a 437px heading even in a wide workspace. Long text and short-window search need focused regression checks. Current styles have no animation or transition; do not add motion just to test it.

## Implementation and validation

1. Reproduce long-heading and short-window clipping before fixing it. Bound presentation height while retaining complete accessible text and an inspectable full title. Preserve diagram controls and local panel scrolling.
2. Measure theme text/control contrast. Fix only verified failures. Test native keyboard/focus behavior, reduced-motion preference, narrow controls and actual drag/cancel behavior.
3. Extend generated-file tests for repository, onboarding and deployment fixtures. Use real validation and Builder, remove source inputs before opening, disable networking, and verify navigation, evidence, search and themes.
4. Measure a bounded synthetic stress document/graph. Count document/SVG reconstruction during repeated selection, resize and theme updates. Do not add a cache or optimizer without a demonstrated need.
5. Run the full existing suite, including M6 safety tests. Independently review the scoped patch and actual results. Fix significant in-scope findings and rerun affected checks.

Fixture artifacts are reviewed analysis outputs, not a fresh autonomous analysis run. Browser evidence is Chrome-only. Report usability as heuristic observation, not a human study. Keep M8-04 packaging and M9 out of scope.
