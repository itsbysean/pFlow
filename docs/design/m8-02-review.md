# M8-02 diagram/document integration completion and review

Date: 30 October 2026. Baseline: main `4a3d3e0` plus completed uncommitted M8-01 work. That foundation and the unrelated `docs/.DS_Store` were preserved. No commit or push is included. M8-03 polish, M8-04 packaging and M9 potential bug analysis were not started.

## Research and implementation

The approved M1-03 profile already supplies literal entity anchors, canonical document backlinks and Flow ownership. Node documentation remains optional. The existing safe renderer/hydrator returns a section map, and search already resolves associations and expansion-only navigation paths. These components were reused. [The plan](m8-02-plan.md) records the integration and scope.

The right panel now keeps the complete canonical Flow document mounted on ordinary selection. It does not switch to Details. Markdown order, descriptions, outcomes, supporting sections and evidence remain intact. The document picker and links retain supporting-document access. One currently mounted document is reused when sample, normalized path, Markdown and processed HTML match. It is not a new corpus cache or parser. Selected evidence and summary metadata update separately.

Diagram selection uses the entity's canonical link, not its label. It checks a unique current entity, an exact document backlink, the owning Flow backlink and the nearest rendered Flow ancestor. A valid target is scrolled into view and receives a 1.6-second outline. The existing selected-section background remains. Repeated selection scrolls again and restarts the outline. Light/dark tokens supply the colors. Missing, stale, misnested or remote mappings retain the current process document and show an explicit limit. A Flow fallback is never described as a Node's own section.

Mapped Node/Edge sections receive native **Locate in diagram** buttons. Section text and outline entries also use the same action. Enter/Space work on the native buttons. Citations, links, form controls, code blocks, modifier clicks and text selections do not activate a surrounding section. Buttons are constructed with DOM APIs after existing safe rendering. Untrusted Markdown cannot supply the new action attributes through hydration.

Document activation calls the Viewer's existing selection function, then centers the selected SVG element. The current graph is not rebuilt for a same-Flow selection. Zoom stays unchanged unless the selected element is too large to fit. Centering can move neighboring nodes outside the viewport; Fit and pan remain available. Document-origin selection does not scroll the article again. Programmatic updates do not emit another selection event.

**Open detail** remains separate from selection in the SVG, optional inspector and supported mapped Node sections. It uses the actual `expandFlowId`. A section belonging to another Flow uses the existing planner: keep current context when possible, otherwise prefer the current entry, then artifact order, with breadth-first node-order expansion paths. Unreachable Flows open directly with a notice rather than a fabricated parent. Async edges do not supply hierarchy. Shared caller trails, cycle protection and Back/Forward/Top level retain their existing behavior.

Search retains matching-passage scrolling and safe highlighting. Unmapped results can still open another bundle's documentation without changing the diagram. Docs explicitly restores the active diagram's sample/Flow/selected evidence context before opening that Flow's document. Clear selection remains available in the shared documentation header; the header wraps at narrow widths so restore controls stay reachable.

## Files changed for M8-02

| Files | M8-02 change |
|---|---|
| `viewer/documentation-panel.js` | Persistent process document, bounded mounted-document reuse, current canonical associations, safe delegated actions, scroll/highlight and separate detail callbacks |
| `viewer/search-navigation.js` | Shared association helper with exact owner backlink and nearest-Flow checks |
| `viewer/diagram.js` | Center the existing selected element without graph reconstruction |
| `viewer/viewer.js` | One selection path, shared Flow-display planner, document callbacks, search coordination and active-context Docs restoration |
| `viewer/index.html` | Move the existing Clear selection control into the shared right-column header |
| `viewer/viewer.css` | Temporary highlight, native section controls, collapsed clear-control hiding and narrow selected-header wrapping |
| `test/document-integration.test.mjs` | Fifteen generated-file integration cases |
| `test/viewer.test.mjs`, `test/viewer-shell.test.mjs` | Persistent Documentation expectations, explicit Details access, truthful current-Flow fallback, cross-bundle Docs regression |
| `test/bundle-layout.test.mjs`, `test/consistency-rebuild.test.mjs`, `test/documentation-generation.test.mjs` | Access optional inspector evidence through its tab; preserve existing rebuild, standalone and source assertions |
| `README.md`, `viewer/README.md`, `docs/roadmap.md` | Current interactions, limitations and approved M8-04 planning slot |
| `docs/design/m8-02-plan.md`, this report | Plan, verification, findings and scope |

Earlier dirty Builder, layout, template/generic test and M8-01 report files remain M8-01 work. M8-02 changed no schema, Markdown parser, source validator, Builder/distribution engine, dependency, analysis semantics or M6 provenance/transaction rule.

## Tests executed

| Check | Actual result |
|---|---|
| `node --test test/search-navigation.test.mjs` | 6 passed |
| Initial affected Viewer/prompt/generic suites | Exposed old automatic-Details and remote/missing-section expectations; updated tests for the approved persistent Flow document and explicit fallback |
| New integration suite | 15 passed; `/private/tmp/pflow-m8-02-integration-final.log` |
| Docs cross-bundle reproduction | Added assertion failed before the fix; `/private/tmp/pflow-m8-02-docs-repro.log` |
| Focused Docs regression after fix | Passed; `/private/tmp/pflow-m8-02-docs-fixed.log` |
| Initial full suite | 586/589; two old hidden-inspector actions and one empty-status expectation needed the approved explicit-tab/fallback behavior |
| Final `npm test` | **589 passed, zero failed, skipped or cancelled**; `/private/tmp/pflow-m8-02-verified.log` |
| `git diff --check` | Passed |

The new generated-file cases cover complete text and mounted Markdown/SVG preservation, section scrolling, temporary highlighting, repeated selection, body/keyboard selection and centering, stable zoom, duplicate labels, explicit detail/return navigation, nested Flow paths, missing and misnested sections, removed backlinks, unchanged manual scroll, evidence-click isolation, collapse/restore/resize, narrow selected headers, both themes, search coordination, actual repository-derived decisions/evidence and shared detail caller context. They use isolated copies of existing repository/prompt fixtures and the real Builder, open `file://` with networking disabled, and assert only the HTML itself is requested with no page errors.

The expanded tests caught two implementation issues before final review: reused-document controls needed refreshing after a backlink was removed, and the relocated Clear selection control could push a restore button beyond a 420px viewport. Controls are now refreshed without reparsing/replacing the document, and the header wraps. Both have regression coverage. Test setup failures from a wrong fixture evidence root were corrected to use the existing root contract; no containment check was weakened.

The full suite retains M1–M7 contracts, M8-01 controls, safe untrusted Markdown/evidence, Unicode, source line ranges, offline packaging, flat/legacy layouts, M6 manual preservation and failure recovery. Old browser tests now visit Details explicitly before inspector actions. Undocumented edges and remote targets assert the truthful current-Flow fallback instead of assuming an empty notice or another Flow's section.

## Generated HTML and browser observations

Actual commands:

```sh
node builder/cli.mjs build --input examples --repository-root . --output /private/tmp/pflow-m8-02/architecture.html
node builder/cli.mjs build --input /private/tmp/pflow-m8-02/prompt/architecture --repository-root /private/tmp/pflow-m8-02/prompt --output /private/tmp/pflow-m8-02/onboarding.html
```

The first build embedded 3 artifacts, 6 Markdown documents and 19 snippets. The second used an isolated copy of the existing onboarding fixture and embedded 1 artifact, 2 documents and 6 snippets. Both used the existing Builder and real evidence files. No target scripts, dependencies, services or live infrastructure were executed.

Main opened both files with installed Chrome/Playwright offline. The preview driver selected a diagram node, activated its canonical locate control with Enter, and captured light/dark desktop and narrow layouts. Each page made exactly one request for its own HTML and had no page errors. At 420px the final selected-state right restore control remained within the viewport. Results: `/private/tmp/pflow-m8-02/preview-results.json`. Main visually inspected `code-light.png`, `prompt-light.png` and `prompt-narrow.png`; dark and narrow automated cases also passed. Local driver and captures remain in the same private directory.

This is bounded browser verification and visual inspection, not cross-browser, human-usability or assistive-technology certification. Temporary previews are local evidence, not a permanent distribution artifact.

## Independent review

Gavin performed read-only research of canonical mappings, rendered section ownership and existing tests. Yena then independently reviewed the scoped implementation, new tests, plan and actual run logs over the uncommitted M8-01 foundation.

The reviewer found one P2 defect: after an unmapped cross-bundle search, Docs could resolve the active Flow reference using the searched bundle's document context. Main reproduced it, restored the active sample/Flow/selection context before opening Docs, and verified the focused fix. The final full suite includes that regression and passed 589/589.

The reviewer found no other blocking issue in canonical mapping, centering, explicit expansion, persistent documents, shared caller handling or safe delegated controls. It inspected the focused pass/fix logs but did not independently run builds, tests or Chrome. The final full suite and refreshed narrow preview were completed by Main afterward. No unresolved critical finding remains in this task's bounded scope.

## Limitations and next task

A Node without a reliable section cannot receive precise paragraph navigation. The current Flow document is retained with feedback. Complete canonical Markdown files may contain sibling/detail Flow sections; they remain readable and supporting links stay explicit. No process order is inferred from graph arrays. A brief highlight is presentation feedback, not evidence of a new execution relationship.

Large graphs can still need Fit/zoom after centering. Only the currently mounted document is reused; there is no multi-document cache or hot-reload engine. Chrome was the tested browser. Themes and widths remain session-only. Source/evidence views stay read-only, and browser rendering still cannot prove source-to-claim accuracy.

Stop after M8-02. Recommend M8-03 Viewer polish/E2E only after approval. M8-04 packaging and M9 findings remain separate. No commit or push was performed.
