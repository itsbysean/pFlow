# M5-01 review and completion

Implemented on local main after 02accc6. Approved M1 model/schema 1.0.0 and Markdown conventions are unchanged. Builder, Viewer, package scripts and dependencies have no changes.

## Files

| Files | Purpose |
|---|---|
| `src/skills/pflow-discovery/SKILL.md` | AI-first repository/entry discovery, evidence thresholds, scope and stopping rules |
| `src/skills/pflow-discovery/references/investigation.md` | Adaptive mechanism/configuration investigation, negative evidence and coverage |
| `src/skills/pflow-discovery/references/output.md` | Existing M1 mapping, minimal handler-entry Flows, identity, Markdown and validation |
| `test/fixtures/discovery/repository/` | Small authored HTTP, XML schedule, custom stdin dispatch, runtime target and misleading declarations |
| `test/fixtures/discovery/python-repository/` | Console launch and project-owned stdin callback registry |
| `test/fixtures/discovery/expected/{javascript,python}/` | Stable M1 oracle snapshots, canonical Markdown and private evaluation expectations |
| `test/discovery-evaluation.test.mjs` | Oracle validation and actual fixture registration/dispatch counterexamples |
| `docs/discovery-evaluation.md` | Repeatable blind prompts, evidence rubric, counterfactual procedure and limits |
| `README.md` | Source Skill usage and task status |
| `docs/design/m5-01-plan.md`, this file | Research, workflow and review record |

The Skill is repository source, not a machine-global installation or distribution package. Its main instructions are 494 words; two references disclose additional detail as needed. It links the actual approved contracts instead of repeating them. No production analyzer, parser, LSP, source index, new CLI or orchestration plugin was added.

## Workflow implemented

One built-in workflow was used: delegated contract research → root implementation → blind forward evaluations → independent review → validation/completion. The skill-creator guidance informed file structure and validation.

The Skill maps actual launch roots, languages/owned modules and configuration before following registration helpers, registry selection and dispatch to concrete project handlers. It uses existing file/content/symbol navigation, not a fixed framework taxonomy or exhaustive reading. Naming, annotations, matching labels and declarations are leads only. Dynamic targets, missing configuration, inactive leads and uninspected modules are reported as gaps rather than speculative entries.

M1 EntryPoint.trigger carries the mechanism, label identifies the activation, and SourceReferences retain actual locations/symbols. Module/configuration/coverage explanations stay in Markdown. A discovery-only Flow contains one actual receiving operation and no edges. Unknown candidates stay outside entryPoints. The Skill stops before body tracing, external boundary analysis, producer/consumer linking, incremental updates and findings. Opaque IDs persist only through reliable identity evidence; no new identity ledger or automatic matching engine was introduced.

## Evaluations

Automated deterministic checks: **8 passed**. They validate both oracle snapshots against the actual raw source roots and M1-03 Markdown. Controlled fixture dispatch checks request selector/function identity, loaded XML/key/handler selection, custom token dispatch, unresolved environment targets, unbound names and the effect of removed/replaced registrations. A handler-only evidence claim fails the witness check. Tests do not claim that these probes implement AI discovery or prove general semantic correctness.

A separate agent received only the Skill, linked contracts and raw fixture repositories, without oracle snapshots, tests or intended answers. It inspected source without executing target code and emitted its own minimal bundles in temporary directories:

| Forward evaluation | Observed outcome | Shared validation |
|---|---|---|
| JavaScript, domain-only scope | GET /status → status; configured ledger task → compactLedger; stdin drain/9 → flushBuffer. Runtime-site task unresolved; misleading declarations excluded. | Zero diagnostics |
| Python, domain-only scope | stdin signal/7 → rotate through the console-installed registry. Unbound HTTP-shaped function excluded. | Zero diagnostics |
| Mutated JavaScript | GET /status now binds AdminController_handleRequest despite the stale comment. Changed site-handler task is unresolved; runtime task still unresolved. Custom dispatch unchanged. | Zero diagnostics |
| Python, default scope | CLI watch-dials → launch.main plus stdin signal/7 → worker.rotate. Internal bind/deliver helpers and a direct python launch.py activation were not invented. | Zero diagnostics |

All four emitted bundles have zero execution edges. The root agent independently reran their actual-source-root validation. Temporary model outputs were not committed as deterministic oracle data. Reports/bundles were produced under `/private/tmp/pflow-m5-01-forward/` for this run; the committed guide describes how to repeat the evaluation.

## Independent review and fixes

An independent reviewer inspected the implementation, raw fixtures, oracle checks and blind outputs against M1. It reported **no actionable defects or unresolved critical issues**. A narrow follow-up independently verified default-scope Python entries and their evidence.

Research confirmed no model blocker. The first forward pass identified a scope ambiguity about launch wrappers. The Skill now explicitly includes independently launched process/module/CLI entries by default, honors narrower user scope and excludes internal helpers without separate external activation. The default-scope evaluation and follow-up review confirm this correction on the Python fixture.

Oracle snapshots were renamed discovery.json to prevent the existing recursive Builder from treating test-only fixture-relative envelopes as production architecture.json inputs. No Builder change was needed. The reviewer independently confirmed its preparation still yields three artifacts, six documents, 19 snippets and zero diagnostics. The root ran the unchanged CLI and byte-compared its output with the existing generated HTML: identical.

## Verification

- `npm test`: **375 passed, 0 failed, 0 skipped**, including existing M1–M4 and offline Chromium regressions.
- `node --test test/discovery-evaluation.test.mjs`: **8 passed**.
- Official skill-creator quick validator: **Skill is valid**. The default/bundled Python lacked PyYAML, so the unchanged validator ran in a temporary validation-only virtual environment; no project/target dependency was added.
- Four independent forward bundles passed existing schema/semantic/Markdown validation, plus independent semantic source review.
- `git diff --check` passes. No Builder, Viewer, schema, existing sample or dependency changes.

## Limitations and M5-02 handoff

The Skill is instruction-driven and depends on the Coding Agent's investigation quality and available navigation. Two small repositories and a counterfactual variation establish representative behavior, not broad recall or exhaustive coverage. Existing validators prove structure/references, not activation meaning. Runtime-selected/missing bindings remain unresolved until real evidence is supplied. Language runtimes, AST parsers and a discovery service are not required.

No handler bodies, downstream flows, external integrations or async producer/consumer links were analyzed. No installed Skill distribution or retained incremental identity store is supplied. Existing detailed architecture must not be replaced with minimal discovery output.

Recommended M5-02 work, only after approval: trace the confirmed receiving handlers with evidence, retain proven entry/receiver identities, and carry the unresolved candidates and coverage limits forward. Do not treat successful M5-01 discovery as permission to infer downstream execution. M5-02 was not started.
