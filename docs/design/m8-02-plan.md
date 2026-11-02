# M8-02 diagram/document integration plan

Baseline: main 4a3d3e0 with completed uncommitted M8-01 implementation. Preserve it and unrelated docs/.DS_Store. No commit or push. M8-03 polish, M8-04 packaging and M9 findings are outside scope.

Research confirms M1-03 canonical ID/backlink rules already support both directions. Node docs are optional and must be nested under their actual owning Flow. Titles and array order do not establish mappings. Reuse resolveDocumentTarget, safe Markdown rendering/hydration, resolveSearchAssociation and planSearchFlow. Existing diagram selection, source/inspector controls and hierarchy remain authoritative.

1. Keep complete canonical Flow documentation mounted on ordinary selection. Reuse the current rendered document when its sample/path/content are unchanged. Update selected evidence/metadata separately. Preserve normal scrolling, and do not switch to Details automatically.
2. Validate associations with exact IDs, canonical backlinks and the nearest rendered owning Flow. Missing/stale/misnested mappings show explicit feedback and use the current Flow section without claiming node ownership. Remote async targets do not automatically change the active Flow.
3. Diagram selection scrolls to and briefly highlights the mapped section, including repeated selection. Document selection uses the same Viewer selection function, then centers the selected element while retaining zoom unless the element cannot fit. Do not rebuild the SVG for a selection within its current Flow.
4. Add native keyboard-accessible locate controls to reliable Node/Edge sections and one delegated body-click handler. Exclude citations, links and other interactive content from section clicks. Never synthesize a second graph/selection store or emit circular selection events.
5. Reuse explicit Open detail controls. When a different owning Flow must be displayed, reuse the existing deterministic expansion-only navigation planner. Keep valid shared calling context, cycle protection and Back/Forward/Top level behavior. Preserve search passage highlighting and unmapped document navigation.
6. Add generated-file tests for repository/prompt inputs, persistent complete text, DOM/viewport stability, centering, duplicate labels, branches, missing/misnested/backlink-less sections, repeat activation, hierarchy, panels, keyboard, themes and safe evidence. Run existing suites and full npm test. Delegate independent review and fix verified scoped defects.

No schema, parser, graph layout, packaging/distribution or analysis change is required. The right column remains the M8-01 layout. This plan implements only M8-02.
