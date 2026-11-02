# M5-02 review and completion

Implemented on local main after 1a55d0c. M1 model/schema 1.0.0, Builder, Viewer, dependencies, existing samples and execution vocabulary are unchanged.

## Files

| Files | Change |
|---|---|
| `skills/pflow-execution-flow/SKILL.md` | Confirmed-entry handoff, contextual owned traversal, significant paths, uncertainty and stopping rules |
| `skills/pflow-execution-flow/references/{representation,dispatch,evaluation}.md` | M1 mapping, target resolution, finite detail/recursion and semantic review |
| `skills/pflow-discovery/references/output.md` | Explicit link to the separately requested next-stage Skill; discovery scope remains unchanged |
| `test/fixtures/flow-analysis/repository/` | Small authored JavaScript receiver, injected service/repository, policies, callback and runtime plugin |
| `test/fixtures/flow-analysis/python-repository/` | Console receiver and cross-module recursive helper |
| `test/fixtures/flow-analysis/seeds/{javascript,python}/` | M5-01-style confirmed M1 handoffs with canonical Markdown |
| `test/fixtures/flow-analysis/expected/{javascript,python}/` | Stable authored analysis oracles and private test role metadata |
| `test/flow-analysis-evaluation.test.mjs` | Identity, contract, actual fixture behavior, target/boundary and recursion checks |
| `docs/flow-analysis-evaluation.md` | Repeatable blind/counterfactual prompts, evidence rubric and limitations |
| `README.md`, `docs/design/m5-02-plan.md`, this file | Usage, research/plan and review/completion record |

This is repository Skill source, not a global installation or analyzer service. The main Skill has 491 words and uses three progressive references. No AST, language server, Tree-sitter, indexing engine, automatic call-graph engine or new CLI is introduced.

## Workflow implemented

One built-in workflow was used: delegated M1/handoff research → implementation → blind source analysis → independent semantic review → corrections/re-evaluation → validation. Existing skill-creator guidance was reused; no orchestration plugin was invoked.

The Skill starts from confirmed M5-01 envelopes and rechecks activation/receiving context. It preserves proven EntryPoint, root Flow, receiving-node and evidence-role identities, then follows significant owned calls using actual call sites and constructor/factory/registration context. Conditions, early/normal outcomes, catches/rethrows, known callbacks, finite recursion and unresolved expressions remain explicit.

Calls and continuations stay local to the caller. Reusable detail uses expandFlowId only for navigation; callee exits are not spliced into a particular caller. Multiple implementations require actual selection evidence. Unknown plugin/registry targets have no guessed handler edges. A known external call may mark a stop with call-site evidence only; integration metadata extraction and producer/consumer linking remain deferred.

The handoff/analysis snapshots use discovery.json and analysis.json so the existing Builder does not mistake test-only fixture envelopes for production architecture.json inputs. They use the unchanged M1 schema and Markdown profile, not a second public model.

## Deterministic evaluations

`node --test test/flow-analysis-evaluation.test.mjs`: **10 passed**.

Coverage:

- Existing handoff entry/root/start/source identities retained exactly; canonical docs and all source ranges validate.
- Actual cross-module receiver/service/repository/callback ordering and dependency selection.
- Authorization early return before selection/save/notification.
- Strict/default policy alternatives; explicit strict `!` rejection guard and normal path.
- Handled InvalidRecord versus rethrown StorageFault; no notification after failed transformation/save.
- Known bound callback versus unresolved runtime plugin without invented outgoing edges.
- Changed factory binding changes actual selected policy/outcomes.
- Finite recursive detail and hierarchical navigation through existing Viewer navigation utilities.
- Missing binding/target witnesses remain a semantic defect even when structure/reference validation still passes.

These tests audit authored oracles and controlled fixture behavior, not arbitrary AI analysis. They never import the HTTP bootstrap or start listeners/timers. A separate optional controlled Python probe verified run() returns 3 and count_down base/negative/100-depth outcomes. Python is not a mandatory Skill/CI dependency; no unknown target code ran.

Authored final oracles: JavaScript **5 Flows / 27 Nodes / 24 Edges**, Python **2 Flows / 8 Nodes / 6 Edges**. All internal execution endpoints are local; recursive navigation reuses the same detail Flow. No external metadata is present.

## Blind forward evaluation

A separate agent received only the Skill/contracts, raw repositories and confirmed seeds, without oracle answers/tests. Temporary bundles/reports are under `/private/tmp/pflow-m5-02-forward/`; they are not committed as deterministic oracle data.

| Case | Observations | Final validation |
|---|---|---|
| JavaScript | Actual service/repository context, strict/default factory selection, guard/outcomes, explicit failures, bound audit callback and unresolved plugin. Unused implementation has no target edge. | Zero diagnostics; 4 Flows / 27 Nodes / 25 Edges |
| Corrected Python | No-argument-compatible receiver, base/recursive result and one self-referential detail without depth copies. | Zero diagnostics; 2 Flows / 8 Nodes / 6 Edges |
| Changed JavaScript factory | Constructor now supplies only standardPolicy. Strict execution/detail/rejection paths disappear; unused policyFor import does not establish a call. Catch logic, storage failure, callback and plugin uncertainty remain. | Zero diagnostics; 3 Flows / 21 Nodes / 18 Edges |

All preserve seed entry/root/receiving/source identities. The root independently reran shared validation against each actual source root. The analyzing agent did not execute target code, inspect intended answers or start external analysis. Its initial Markdown diagnostic from indexed-call notation was corrected by semantic wording; the representation reference now notes this focused M1-03 checker limitation.

## Independent review and fixes

The independent reviewer found two P2 defects that schema validation alone missed:

1. The Python fixture's registered console receiver originally required an argument the launcher would not provide. The receiver now has a default argument, its existing declaration evidence remains valid, and fresh blind analysis plus a no-argument controlled probe verify the handoff.
2. The authored JavaScript oracle initially collapsed the strict policy without recording its significant rejection condition. It now has an explicit strict detail Flow with rejection/normal branches, and a deterministic coverage check. The original blind JavaScript output had already captured that guard.

The review guidance now explicitly checks launcher arguments and significant conditions hidden by collapsed detail. Follow-up independent review confirmed both fixes, all ten checks, revised Python and changed-binding output, with **no remaining verified defects or unresolved critical issues**. No model change was needed.

## Verification and limits

`npm test`: **385 passed, 0 failed, 0 skipped**. Both source Skills pass the official skill-creator validator. `git diff --check` passes. The unchanged Builder still prepares three sample artifacts, six documents and 19 snippets; its generated HTML is byte-identical to the prior output. No Builder/Viewer/schema/dependency changes were made.

Small fixtures and a few blind runs do not establish general recall, whole-program completeness or symbolic path feasibility. Detail granularity and significance require judgment. Source/Markdown validation proves references, not actual behavior. Runtime plugins remain unresolved; unknown downstream completion/failures are not fabricated. Third-party internals, integration metadata, async linking, incremental identity matching, findings and distribution are not implemented.

Recommended M5-03 handoff, after approval: analyze the recorded non-owned boundary stops with evidence, without assuming unresolved targets are external. Keep async linking and other deferred capabilities separately scoped. M5-03/external-boundary analysis was not started.
