# pFlow roadmap

Status: approved M8/M9 reassignment, 30 October 2026. This document is the current planning authority for milestone numbering. Research found individual milestone plans and reviews but no central roadmap file; this document records the approved reassignment and retained future requirements.

- **M7 — Generic Process Documentation Refactoring.** Reuse the existing documentation and visualization pipeline for repository analysis and developer-described processes.
- **M8 — Viewer Redesign & Single-Bundle Skill Packaging.** M8-01 covers layout/navigation, M8-02 diagram/document integration, M8-03 polish/E2E, and M8-04 single-bundle Skill packaging/validation.
- **M9 — Optional Potential Bug Analysis & Reporting.** Preserve the deferred potential-bug scope in full. It has moved, not been cancelled.

This reassignment supersedes older references to M7 as potential-bug analysis, including the milestone label in [the Markdown contract](markdown-contract.md#validation-and-limits). It does not change that contract's fields or rules. Historical M1–M6 plans and completion reports retain their original scope statements; they are not current roadmap assignments. The later approved M8-01 request moves potential bug analysis from M8 to M9 and approves pFlow branding only for the Viewer.

## Completed foundation

| Milestone | Completed capability |
|---|---|
| M1 | Approved graph/schema, evidence references and Markdown navigation contract |
| M2 | Read-only interactive SVG Viewer, hierarchy, selection, documentation and source inspection |
| M3 | Offline Markdown search, result navigation and highlighting |
| M4 | Validating Builder, safe Markdown, bounded snippets and standalone offline HTML |
| M5 | Evidence-backed repository discovery, flow/boundary analysis, async linking and generation |
| M6 | Git impact planning, targeted regeneration, consistency validation, safe rebuild and bounded real-repository E2E evaluation |

M1–M6 are retained at commit ff9d6b5a4554822783a0694369954499eb5f5a8e. That completion includes the limitations in [M6-04](design/m6-04-review.md), not a guarantee of complete discovery or arbitrary runtime correctness.

## M7 scope and approved product policy

Application execution, human work and system operations are processes. Both input modes must use the same graph, Markdown, validation, search, Builder and Viewer pipeline. Do not create a parallel process schema, renderer or analysis engine. Add fields or types only if demonstrated limits justify an approved contract change.

Repository mode uses verified source/configuration evidence. Prompt mode uses the developer's description as primary evidence. Ask only for material missing information, omit insignificant unspecified details, and invent no steps, responsibilities, decisions, order or branches. Expand a step only when its substeps are actually supported. Preserve Flow ownership, reusable detail, navigation-only expansion and stable IDs. The Viewer stays read-only.

Default location policy, implemented by the shared M7-03 selector:

1. Use the analyzed project root for repository input; use the current working directory for prompt input.
2. An explicit output directory overrides the default selection.
3. Otherwise reuse root docs/ when it is a directory; else root doc/ when it is a directory; else create root docs/.
4. Put all generated documentation artifacts under architecture/ in that selected directory.

M7-03 implements new flat output with index.md, flows/, diagrams/architecture.json and architecture.html under the selected bundle. Legacy architecture.json + docs/ remains supported without migration. The [M7-01 compatibility assessment](design/m7-01-process-compatibility.md) remains the historical research basis; no schema change was needed.

### Proposed task sequence

M7-01 and M7-02 are complete; their reports retain their original implementation boundaries. M7-03 adds the shared selector and compatible flat/legacy resolution; see its [completion record](design/m7-03-review.md). M7-04 adds generic presentation and templates; see its [completion record](design/m7-04-review.md). M7-05 completes the [bounded compatibility evaluation](m7-05-compatibility-evaluation.md) and recommends initial real-team use with limitations. M7 closure remains a developer decision; M8-01 through M8-04 are complete within their recorded validation limits. M9 requires separate approval.

| Task | Scope | Reviewable completion |
|---|---|---|
| M7-01 | Roadmap alignment and architecture research | This roadmap, evidence-based assessment, proposed tasks and independent review; no feature implementation |
| M7-02 | Dual-input orchestration and prompt evidence profile | Implemented file-backed prompt evidence and described hierarchy through existing generation and truthful unknowns, without a new graph schema |
| M7-03 | Default output selection and compatible bundle resolution | Implemented docs/ → doc/ → docs/ policy and flat/legacy resolution through the existing Builder, with M6 safety retained |
| M7-04 | Generic presentation and documentation wording | Implemented neutral labels/templates while retaining technical evidence, graph semantics, selection, search and drill-down |
| M7-05 | Unified E2E and backward-compatibility evaluation | Repository and prompt examples through the same offline pipeline; onboarding and operational hierarchy/branch evidence, malicious input, output policy and M1–M6 regressions |

Do not create extra schema, participant-management, generic incremental or renderer tasks without an actual need. Prompt updates do not automatically inherit Git-based M6 behavior. M7-05 is the current completed evaluation: 559/559 tests passed, with fresh source/prompt generation and offline browser checks. See the [review and limits](design/m7-05-review.md). M8-01 implements the approved shell redesign. M8-02 integrates existing diagram/document selection. M8-03 adds bounded Viewer polish and offline regression evaluation. M8-04 completes portable single-bundle packaging; do not begin M9 without developer approval.

## M8 Viewer redesign and single-bundle packaging

| Task | Scope |
|---|---|
| M8-01 | pFlow header, three-column shell, collapse/restore, resizing and complete light/dark themes; preserve current graph/document/search behavior |
| M8-02 | Persistent complete Flow documentation, canonical bidirectional selection and explicit subflow entry |
| M8-03 | Completed: long-text/short-window fixes, contrast and keyboard checks, bounded performance and offline E2E evaluation |
| M8-04 | Completed: portable Skill, one executable, embedded runtime resources, isolated-install/offline and incremental checks |

See [the M8-01 plan](design/m8-01-plan.md) and [completion/review record](design/m8-01-review.md). M8-01 passed 574 tests. See the [M8-02 integration plan](design/m8-02-plan.md) and [completion/review record](design/m8-02-review.md), with 589 tests passed. See the [M8-03 completion/review record](design/m8-03-review.md) for current checks and limits. See [M8-04 packaging and final M8 limits](design/m8-04-review.md): 607 tests passed, one executable plus necessary Markdown, no runtime npm installation. No repository-wide rename or schema change is authorized.

## M8.5 layout stabilization

Approved after M8 completion and before M9. The existing deterministic renderer now reserves label-aware corridors and outside lanes, checks hidden route segments, fits diamond text using native line bounds, and keeps actual frame geometry independent of viewport size. No engine, dependency, schema or Viewer redesign is introduced. See [root causes and completion/review](design/m8-5-review.md), including 620 passing tests and bounded offline/dense/cyclic graph evaluations. M9 remains deferred and requires separate approval.

## M9 preserved scope

M9 remains optional and separate from M7/M8. No findings implementation, review-state management or bug visualization belongs in M7/M8.

| Preserved requirement | M9 planning boundary |
|---|---|
| Optional AI-triggered analysis | Run potential-bug analysis only when requested through the AI workflow; base documentation generation must work without it |
| Schema-validated findings.json | Store findings separately from Diagram JSON and base Markdown; define and validate the findings contract in M9 |
| Severity, confidence and review status | Preserve all three concepts; their exact fields/enums require M9 contract design, not new graph fields |
| AI-managed review changes | AI updates review decisions and preserves review rationale; HTML does not edit findings or statuses |
| Previously reviewed findings | Respect retained review decisions and rationale across reruns; do not silently reset or overwrite them; define evidence/identity reconciliation in M9 |
| Read-only HTML findings | The future Builder may combine separate findings with documentation for offline viewing; no browser-side review management |
| Diagram warnings and reports | Show associated warnings and integrate findings into reports/documentation presentation, without turning base process Markdown into a bug store |
| Default project-local output | Repository findings follow the approved project-root docs/ → doc/ → docs/ architecture/ default; prompt-context artifacts use the current-directory rule if applicable; honor explicit output locations |

Stable graph IDs and artifact/revision matching remain the foundation for findings associations. An unchanged ID alone does not prove that an old finding still applies; removed targets must not attach to unrelated replacements. See the existing [M1 findings compatibility decision](design/m1-01-common-architecture-data-model.md#stable-identity-and-incremental-updates).

M9 task numbering, schema details and implementation plans are deferred. This roadmap preserves requirements without starting analysis or adding findings.json, review controls, warning rendering or report code.
