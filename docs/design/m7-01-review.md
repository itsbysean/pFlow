# M7-01 research and roadmap alignment

Baseline: main ff9d6b5a4554822783a0694369954499eb5f5a8e. M1–M6 implementation and history are preserved. This task changes planning documents only; no commit or push is part of this task.

## Changed files

- README.md: points to the current milestone assignment and clearly distinguishes proposed generic-process work from existing capabilities.
- docs/roadmap.md: establishes the approved M7/M8 reassignment, records all retained M8 requirements and proposes small M7 tasks.
- docs/design/m7-01-process-compatibility.md: component-level behavior, limits, minimal changes, compatibility risks, tests and next-task decisions with concrete source references.
- docs/design/m7-01-review.md: this scope and verification record.

The old M7 findings label in the M1 Markdown contract is explicitly superseded by the new roadmap. Approved M1–M6 contract text and historical completion records were not rewritten. No runtime, schema, Viewer, Builder, Skill, dependency, test or fixture change was made.

## Research conclusions

Flow/Node/Edge, canonical Markdown, reusable navigation-only detail, search and HTML packaging are substantially reusable. There is no required class/method structure. Physical file evidence, repository-specific orchestration, hardcoded bundle roots and software-specific presentation are the actual adaptation points.

File-backed developer input is the smallest evidence proposal. It needs a documented semantic profile and root decision before implementation; it must not weaken repository evidence validation. Participants can remain in cited Markdown. A generic process does not justify a new schema, participant entity, BPMN engine, graph format or renderer.

Default docs/ → doc/ → docs/ selection is approved product policy but is not implemented. The proposed flat bundle needs legacy compatibility and coordinated M4/M6 path handling. Git-based targeted regeneration is repository-specific; prompt incremental merging is not silently promised or implemented.

M8 retains optional AI analysis, separate schema-validated findings.json, severity/confidence/review status, AI-managed decisions/rationale, respect for reviewed findings, read-only presentation, diagram warnings/report integration and project-local default output policy. No M8 contract or feature is implemented here.

## Verification

- Existing contract, Markdown, Builder and content-processing suites: 217/217 passed, zero failures/skips. Command: node --test test/contract.test.mjs test/markdown-contract.test.mjs test/builder.test.mjs test/content-processing.test.mjs.
- An authored temporary non-Git workflow graph with real captured-text evidence passed existing validators and HTML string generation. A virtual prompt:// reference failed as expected. This checks existing structural/build compatibility, not AI prompt analysis or browser behavior.
- Local file/line/heading links checked in the roadmap and assessment; whitespace checks passed.
- Scope check confirms no changes under schema/, validation/, builder/, viewer/, skills/, test/, package.json or package-lock.json. M6 commit remains HEAD.

## Recommendation

Approve M7-02 next to confirm prompt evidence/root handling and add dual-input orchestration using the existing pipeline. Preserve current supported bundle layout in that first task. Output resolution and neutral presentation remain separate follow-ups. Stop after M7-01; neither M7-02 nor potential-bug analysis starts automatically.

## Independent review

A separate read-only reviewer checked the roadmap and assessment against actual schemas, validators, Builder, Viewer, Skills and M6 code. All requested M8 requirements remain; no unsupported new model or implementation was introduced. One broken link to the M1 findings compatibility text was corrected. The review also prompted clearer separation of location-selection and evidence-containment roots; that decision remains proposed for M7-02.

Final result: no unresolved critical research or roadmap issue. The reviewer confirmed the 217-test log and the limited meaning of the temporary authored probe. Compatibility work must include M6's hardcoded document roots and source/output overlap protection; full prompt generation outside Git must not be presented as existing Git incremental support.
