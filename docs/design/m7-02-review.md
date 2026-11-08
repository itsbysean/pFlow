# M7-02 completion and independent review

Baseline: main ff9d6b5 with existing uncommitted M7-01 planning. Preserve those changes and completed M1–M6 history. No commit/push, M7-03 resolver/layout work or M8 feature is part of this task.

## Files created or modified

- src/skills/pflow/SKILL.md: routes repository versus prompt input through one Skill; preserves repository M5 stages and shares generation/validation/build.
- src/skills/pflow/references/prompt-analysis.md: supported steps/branches/detail, material clarification, omitted responsibilities, safe full generation and untrusted-evidence rules.
- src/skills/pflow/references/prompt-evidence.md: exact UTF-8 capture, separate attributed clarification answers, selected document/evidence roots and current layout.
- src/skills/pflow/references/{generation,build}.md: mode-aware evidence and shared canonical output/Builder instructions, with repository bindings retained.
- test/prompt-mode.test.mjs and test/fixtures/prompt-mode/: authored onboarding, deployment, literal/instruction-text and ambiguous cases with raw inputs, compatible graph/Markdown examples and semantic evidence witnesses.
- README.md and docs/roadmap.md: current use/status without changing later milestone assignments.
- docs/prompt-mode-evaluation.md, docs/design/m7-02-plan.md and this report: scope, actual results, independent review and limitations.

Existing M7-01 assessment/review files remain intact. There are no changes to schema/, validation/, builder/, viewer/, M5 component Skills, M6 helpers, dependencies or existing tests. New expected fixture graphs use the unchanged schema 1.0.0 and existing Markdown profile; no second public model or analyzer was introduced.

## Implemented behavior

Repository requests still use code/configuration discovery, execution, boundaries and async linking. Prompt requests skip those stages, automatically capture the supplied description as a real file, preserve original wording/bytes, and record actual clarification answers separately with attribution. Claims link to the supporting statement ranges. Generated documentation is never used as its own evidence.

Prompt starts, decisions, sequence and supported substeps use the existing vocabulary. Unstated waiting uses unknown mode. Participants stay in supported prose; missing minor responsibility is omitted. Essential branch/order ambiguity causes a focused question, without a fabricated answer or complete-flow claim. expandFlowId provides navigation-only detail, with caller continuations retained locally.

All output/evidence remains inside the explicitly selected document workspace, regardless of registered-folder order. Default prompt selection is instructed agent inspection of the approved current-directory docs/ → doc/ → docs/ policy. No automatic resolver is added. The actual Builder receives that selected containment root as --repository-root and uses architecture.json + docs/ + prompt evidence/ + architecture.html. It requires no Git metadata. The later flat output format is unsupported.

Prompt updates are explicit full generation only. Existing manual/uncertain material requires a safe baseline/ownership decision before replacement. M6 targeted regeneration and its provenance/source-overlap protections are not repurposed or weakened. Existing safe HTML publication and validators are reused.

## Executed verification

- Focused tests: node --test test/prompt-mode.test.mjs — 18/18 passed, zero skips/failures.
- Full npm test — 507/507 passed, zero skips/failures; existing repository, M1–M6 and offline tests remain green.
- Official skill-creator quick validation — passed for src/skills/pflow.
- Authored tests exercise actual validators/CLI, exact request/answer/range capture including Unicode/CRLF, supported branch/hierarchy topology, omitted actors, structurally valid semantic counterexamples, missing/invalid evidence, traversal/symlink escape and preservation of previous HTML.
- Offline Chrome verifies relocated prompt HTML after removing inputs: keyboard select/expand/back, exact numbered answer snippets, search/highlighting and inert injected markup. Only opened HTML files are requested; no page errors occurred.

The Skill remains AI instructions, not a runtime capture API or NLP service. Deterministic fixtures are authored review oracles, not proof of autonomous analysis. A temporary-path assertion was corrected to use canonical paths on macOS; production path validation was already correct.

## Independent review

A separate agent first received the revised Skill and raw deployment/ambiguity descriptions without these fixtures or intended answers. It produced exact evidence, 1 EntryPoint/2 Flows/10 Nodes/8 Edges with documented package detail, supported pass/fail branches and no invented waiting/delivery guarantees. Existing validation passed; two CLI builds were identical (142805 bytes), with no warnings. The separate registered application remained unchanged. The ambiguous input produced two material questions and no fabricated reply/completed graph.

Additional nonblind independent review checks verified inert literal-message evidence and a full-generation rerun stopping before overwriting manually edited content. All prior copy bytes and HTML survived; no M6 step ran. The reviewer inspected fixture/test quality and shared references, reran the focused suite including Chrome (18/18), and verified the 507/507 full-suite log. Two wording issues were fixed: evidence/ is prompt-specific, and current README text acknowledges prompt support.

No unresolved critical issue remained. Private audit/results: /private/tmp/pflow-m7-02-forward/{review.md,forward-results.json,extra-results.json}. These are bounded evaluations, not general NLP accuracy, runtime or cross-browser certification.

## Limits and next task

The Coding Agent performs capture, path selection, ownership review and source-meaning analysis following the Skill. Validators enforce actual file/graph/Markdown containment and structure, not truth of natural-language claims. Only supported scope can be documented; substantive missing details still require developer answers.

Current layout, software-oriented Viewer labels and trusted source-checkout Builder dependencies remain. Prompt incremental regeneration, automatic directory resolution, the flat layout and M8 findings/review/warnings remain unsupported here. Subsequent full prompt reruns must preserve existing content until ownership is resolved.

Recommend M7-03 for the shared default-directory resolver and backward-compatible bundle-layout work, only after developer approval. Do not start it automatically. M8 optional potential-bug analysis remains preserved in the roadmap and unimplemented.
