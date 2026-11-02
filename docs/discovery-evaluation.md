# Discovery evaluations

M5-01 is an instruction-driven Skill, not a deterministic repository analyzer. The automated checks audit small authored fixtures, expected M1 bundles and actual fixture dispatch. They do not prove general AI discovery quality. Blind agent runs provide separate behavioral evidence.

## Raw repositories and oracles

- `test/fixtures/discovery/repository`: active Node HTTP bootstrap, project router, XML task loader/registry, custom stdin token dispatcher, runtime-selected task and misleading unbound declarations.
- `test/fixtures/discovery/python-repository`: console-script metadata, a project-owned stdin callback registry and an unbound controller-shaped name. No Python runtime is required by the Skill or CI oracle checks.
- `test/fixtures/discovery/expected/{javascript,python}`: stable, committed M1 oracle snapshots (discovery.json) with canonical Markdown. The non-build filename keeps test oracles out of normal Builder discovery. `expectations.json` is private evaluation data, not a new architecture model or required Skill output. It records required cases and evidence IDs.

Both oracles cover domain handler entries only. Launch roots are reachability evidence. A general invocation without that restriction must also assess independently launched process/module/CLI entries. No helper is an entry solely because bootstrap calls it.

Run deterministic checks from the tool checkout:

```sh
node --test test/discovery-evaluation.test.mjs
npm test
```

The checks validate both bundles with the existing M1 validators. Controlled fixture modules are imported to verify actual selector-to-function identity and dispatch outcomes. The listener/timer/stdin bootstrap is never run. Removing/replacing a route, changing a configured key, or supplying a previously absent environment value changes the selected receiver. The tests also reject an oracle that cites only a handler while dropping activation witnesses. They are not a custom parser, AST engine, LSP, source indexer or discovery CLI.

## Repeatable blind forward evaluation

Give a fresh Coding Agent only this request, the Skill and the two raw repository roots. Do not expose `expected/`, oracle tests or prior conclusions:

> Use skills/pflow-discovery/SKILL.md to discover domain execution entries in each raw repository. Report process launch roots as reachability evidence, not separate confirmed entries for this evaluation. Write a compact repository/coverage summary and a minimal valid M1 bundle for each repository under a temporary evaluation directory. Do not run target code or trace handler bodies. Validate with the existing tool validators against the actual source roots.

Evaluate the result semantically, without comparing display wording or opaque ID values:

| Scenario | Evidence required | Unsupported claim to reject |
|---|---|---|
| HTTP | Loaded startup → installed request selector → actual callback declaration | Controller-like export or annotation alone |
| Configured schedule | Loaded XML record → startup installation → registry key → receiving handler | Interval/name alone, or a record whose key has no binding |
| Custom dispatch | Reachable stdin installation → token registry → selection → receiving handler | Function-name matching instead of the actual token |
| Runtime target | Existing environment-selection expression and config, with missing binding stated | Assuming a deployed environment value or known receiver |
| Python callback | Console launch → main's callback binding → registry delivery → handler | Treating a controller-shaped unbound name as HTTP |

Check source ranges and their meaning, active vs dead registration, uncertainty, inspected/skipped modules, no speculative entries/edges, and correct M1-03 canonical links. Validator success proves references/structure, not activation semantics. Accept alternate precise ranges or shared evidence that establish the same chain. Do not accept missing registration evidence merely because the JSON validates.

## Counterfactual evaluation

Copy the JavaScript raw repository to a temporary directory. Change only the installed GET /status callback from status to AdminController_handleRequest and the static task key from fold-v2 to an unbound site-handler. Keep the old comment unchanged. Ask the agent to inspect the new files and emit a fresh domain-only discovery bundle, without supplying intended conclusions.

Correct behavior follows the new registration over the stale comment: the controller-shaped handler is now bound, the former status handler has no current route, the static task is unresolved, the runtime-selected task is still unresolved, and the custom dispatcher remains confirmed. This is a fresh evaluation, not an incremental-update/identity-matching implementation.

Record source roots, scope, observed findings, validation diagnostics, reviewer findings and limitations in the milestone review. Do not commit nondeterministic temporary agent outputs as new oracle data. Do not claim one successful agent run establishes recall across arbitrary repositories.
