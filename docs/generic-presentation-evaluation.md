# M7-04 generic presentation evaluation

One read-only Viewer now presents both team workflows and system execution. The actual M7-02/03 implementation was checked first: its 62 focused prompt, output-policy, layout and flat-incremental tests passed before presentation edits. Prior uncommitted work remains intact.

## Presentation choices

| Context | Change | Preserved meaning |
|---|---|---|
| Navigator/workspace | Process starts, recorded starting condition, Process workspace | Real EntryPoint triggers/labels and direct Flow fallback; no fixed framework categories |
| Diagram legend | Process step, Outcome, Exception path, Unresolved (dashed border) | Existing shapes/colors and exceptional-transfer semantics; not every failure/rejection becomes an exception |
| Navigation | Short selection/detail hint; Start flow/Detail/Direct flow badge; Top level | Actual trail drives context; shared detail, Back/Forward, keyboard and recursion policy unchanged |
| Inspector/documents | Process context, Evidence references, Process summary, Evidence excerpt | Actual kinds/modes, endpoints, integration metadata, source symbols, paths and line bounds remain |
| Uncertainty | Neutral unresolved-boundary and unrecorded-transfer explanations | No guessed destination, owner, rationale, timing or guaranteed result |

The Top level accessible name includes its visible text and explains that it returns to the first Flow in the current path. The diagram references the visible hint and retains existing keyboard/pan instructions. The dashed-border explanation is visible, not tooltip-only. Branding, five-region layout and renderer/navigation model are unchanged; there is no mode field or filename/label inference.

## Templates and generation

The two existing templates now request concise purpose/scope, supported start or caller, main sequence, significant conditions/alternatives, participants/systems when evidenced, outcomes/failures/unknowns and citations. Optional rationale must be supported by actual source/configuration or developer statements. Inapplicable prompts and unspecified responsibilities are omitted. No public field or mandatory metadata was added.

Canonical entity anchors, owner nesting, backlinks and citation syntax remain. The contract's Source evidence heading is retained: source can be code, configuration or captured text. A line-fragment placeholder accommodates #L4, #L4-L6 or an empty file-level fragment; no incorrect #L4-L4 fragment is forced by the template. The template-population test validates the resulting graph/Markdown with the unchanged validators.

Generation guidance keeps a high-level explanation readable and reserves detail sections for important steps/decisions/boundaries. It does not ask writers to duplicate every node or invent explanations to fill a template.

## Automated evaluations

New focused suite: node --test test/generic-presentation.test.mjs — 8/8 passed.

| Required case | Executed evidence |
|---|---|
| Existing service execution | Existing repository-generated fixture built as standalone HTML; real decisions/branches, HTTP POST metadata, raw kind/mode and exact path/range/symbol values inspected |
| Onboarding prompt | Starts, completeness branches, outcomes, request/clarification evidence and separately opened access detail |
| Conditional deployment | Recorded pass/fail endpoints and terminal outcomes; no new approvals or actors |
| Hierarchy | Enter selects without expansion; separate Space-activated detail control; truthful level badge, Back/Forward and Top level |
| Shared detail | Existing alpha/beta fixture enters the same detail graph with its own caller context and returns correctly; no graph copy |
| Missing/unresolved information | Existing empty/missing-doc/location-only tests retained; unresolved boundary has a visible explanation and no detail affordance; unknown modes remain recorded values |
| Unicode/unsafe excerpts | José/민지 and script/image-like input render literally; evidence is not editable, no injected elements/scripts or additional requests |
| Search/document navigation | Ctrl+K, body matches, canonical Node/Flow navigation and highlights remain functional |
| Accessibility/keyboard | Updated accessible-name expectations retain existing behavioral assertions; visible Top level label matches its name; source citations use Inspect evidence |

The initial affected content suites passed 100/100. Existing Viewer/documentation-generation/consistency-rebuild UI suites passed 89/89. These are actual runs, not assertions based on file existence or source keywords. Existing behavior tests were updated only for intentionally changed presentation/accessibility text; technical metadata expectations remain.

## Manual browser observations

Generated service, onboarding and deployment files were opened directly through file:// in offline Chrome at widths 1440 and 720. Six screenshots and geometry/request observations are retained under /private/tmp/pflow-m7-04-preview/. The root visually inspected all three desktop screenshots and the narrow onboarding screenshot. Each page requested only its HTML, with no page errors. At both widths the hint and complete legend remained inside the workspace; canvas height was approximately 389px/187px respectively.

Observed: starts stay identifiable at left, main branches/outcomes occupy the center, separate detail controls remain visible, and the lower documentation follows the active scope. Prompt evidence is visibly a request/clarification location; the service keeps actual source/handler labels. The new hint supplies a path to details/evidence without a new panel or tutorial.

Dense service diagrams and narrow windows still use the existing fit-to-view scaling; readable inspection may require zoom or supported drill-down. No layout algorithm or mobile redesign was attempted. These are developer observations on authored examples, not usability interviews, measured onboarding outcomes or assistive-technology certification.

## Scope and remaining limits

No graph schema, validator, input-mode metadata, separate Viewer, renderer dependency, M6 provenance/safety rule or prompt incremental feature changed in this milestone. Previously completed path/layout changes remain in the working tree. The HTML stays read-only and safe rendering still uses text nodes/allowlisted markup.

Raw graph terms such as operation, call, exception, sync/async and Flow remain where technically meaningful. This task does not rewrite existing architecture documents or source names into generic language. Evidence correctness, supplied rationale and substantive missing process details still require generation/review; UI wording does not establish truth. M8 findings and bug visualization remain unimplemented. Stop before M7-05.

## Final verification and review

Full npm test passed **559/559**, with zero failures/skips. Official quick validation passed for the main Skill; local documentation links and whitespace checks passed.

Independent read-only review found no blocking residual issue after accessibility and citation-format corrections. It inspected code and the executed focused logs, without independently running tests or manual screenshots. The root performed the full regression and visual observations. See [completion/review](design/m7-04-review.md) for changed files, exact verification boundaries and remaining limitations.
