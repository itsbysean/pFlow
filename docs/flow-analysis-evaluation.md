# Execution-flow evaluations

M5-02 is an instruction-driven analysis Skill. Tests audit authored sources/oracles and actual controlled fixture behavior; they are not a deterministic analyzer or a measure of general AI recall.

## Fixtures and handoff

`test/fixtures/flow-analysis/repository` has a confirmed HTTP receiver, a boot-injected service/repository, a two-policy factory, a bound internal callback, handled/rethrown failures and an unknown runtime plugin table. `python-repository` has a no-argument-compatible console receiver and recursive cross-module helper. The Skills do not require a particular language or runtime.

`seeds/{javascript,python}/discovery.json` and sibling docs are M5-01-style confirmed handoffs with actual activation evidence and one receiving operation per Flow. `expected/{javascript,python}/analysis.json` contains authored M1 snapshots; expectations.json is private test role metadata. Non-build filenames keep these evaluation snapshots out of the Builder's normal architecture.json discovery. They are not new public formats or required Skill output names.

Run deterministic checks:

```sh
node --test test/flow-analysis-evaluation.test.mjs
npm test
```

They check schema/semantic/Markdown conformance, unchanged seed identities/evidence roles, local ownership, actual call order/outcomes, guard/return behavior, concrete factory selection, explicit strict rejection, repository failure, callback execution, unknown-target restraint and cyclic detail navigation. Controlled fixture modules are used without importing the HTTP bootstrap, starting listeners or scheduling timers. Python graph/identity/navigation checks need no interpreter. An optional authored-fixture Python probe can call run() and count_down on bounded inputs; this is not permission for the Skill to execute arbitrary target code.

## Blind analysis procedure

Give a fresh Coding Agent only the Skill, linked contracts, raw source roots and corresponding discovery seeds/docs:

> Use skills/pflow-execution-flow/SKILL.md to analyze internal execution starting from each confirmed seed. Preserve proven handoff identities. Emit a concise M1 bundle and coverage report under a temporary output directory and validate against the actual source roots. Do not run target code or inspect expected snapshots, oracle tests or prior analysis. Stop before integration metadata extraction/linking.

Review meaning, not display wording or exact newly assigned IDs:

| Area | Required evidence/outcome |
|---|---|
| Handoff | Same confirmed entry, root Flow, receiving node and existing evidence roles |
| Owned traversal | Receiving handler → bound service → bound repository across source modules |
| Guards | Unauthorized result occurs before selection/save/notification; strict policy has a source-backed rejection condition |
| Outcomes | InvalidRecord becomes invalid response; unmatched storage failure is rethrown; normal results return locally |
| Dispatch | Factory condition selects strict or standard only; unused implementation declarations do not establish calls |
| Callback | Supplied recordSaved binding and service invocation establish the internal receiver |
| Uncertainty | Actual runtime plugin expression stays unresolved with no guessed target/completion edges |
| Hierarchy | Reusable callee detail; local caller continuations; no cross-flow call/return splicing |
| Recursion | Base/recursive paths and one compatible self-referential detail rather than depth copies |

Validators do not establish invocation semantics, path feasibility or completeness. Inspect call sites, constructor/factory context, source conditions and catch/rethrow behavior. Significant conditions must appear in graph/detail or precise linked prose, not disappear behind a generic failure edge. Check launch arguments as well as declaration names.

## Counterfactual

Copy the JavaScript repository to a temporary directory. Change the constructor's policy argument from policyFor to a known factory returning only standardPolicy. Analyze against that actual source root using the same confirmed handoff. Do not tell the agent the intended flow result.

Correct analysis follows the supplied factory: strict-policy execution and its rejection path disappear; an unused policyFor import does not establish a call. Handler catch logic, repository failure, the known callback and runtime-plugin uncertainty remain. This is a fresh context evaluation, not an incremental-update engine.

Record deterministic checks separately from blind model runs. Keep temporary model outputs outside committed oracles. Independent review must compare source meaning and identity retention, not accept a graph because its references or expected keywords exist. Small samples cannot establish exhaustive discovery/analysis coverage.
