# M7-05 compatibility and release evaluation

Date: 30 October 2026. Scope: M7 evaluation only. No M8, commit, push, target application execution, target dependency installation or live infrastructure access.

## Method and baseline

The starting checkout was main at `ff9d6b5a4554822783a0694369954499eb5f5a8e`, with the completed M7-01–M7-04 changes uncommitted. Those changes were preserved. Research read the current main Skill, prompt/evidence/output references, selectors, flat/legacy resolver, Builder, Viewer, M6 regression tests and milestone completion records. [The plan](design/m7-05-plan.md) preceded evaluation.

Two delegated Coding Agent evaluations generated fresh artifacts. The repository evaluator received only raw service source/configuration, not the expected graph. The prompt evaluator received the descriptions below and one material clarification. Both used the existing Skill and shared output selector, graph/Markdown validation and Builder. This was an AI-assisted forward evaluation, not a new automatic natural-language or code-analysis engine. A separate final reviewer checked the results and claims after generation and browser checks.

Environment: macOS, Node.js 24.22.1, source-checkout dependencies, Playwright Core and installed Google Chrome in headless mode. Tests used private temporary directories. The selected document workspace was supplied directly to the same selector used by the Skill; no actual Codex folder-registration UI was exercised.

Fresh `npm test` passed **559/559**, zero failed or skipped. This includes browser tests, source/Markdown safety, both layouts, real temporary Git impact/regeneration, manual-note preservation and failed-publication recovery. Log: `/private/tmp/pflow-m7-05-baseline.log`. Historical M6 real-repository reports were inspected, not rerun as deployed-system tests.

## Compatibility matrix

| Scenario | Actual execution and result | Boundary |
|---|---|---|
| A — repository service | Raw 13-file fixture copied; owned code/configuration inspected; fresh flat graph/Markdown authored; shared validation passed; repeated CLI builds byte-identical; relocated HTML exercised offline | Synthetic service fixture, not a deployed service or discovery-recall benchmark |
| B — onboarding | Exact original text and separate answer captured; actual non-Git `doc/` fallback; supported detail and both outcomes; validation/build/offline interaction passed | One authored clarification exchange, not a human interview |
| C — deployment | Exact text captured; separate explicit document workspace used as final bundle; verified handoffs, branches and preparation detail; validation/build/offline interaction passed | Description does not establish health/verification criteria, tooling or timing |
| D — workspace isolation | Fresh output-policy, layout and prompt tests exercised `docs/`, `doc/`, neither, both, overrides, independent workspace, traversal/symlink/collision rejection; B/C verified real chosen roots | Registered-folder ordering was represented by separate folders and an unchanged application sentinel, not UI automation |
| E — compatibility | Fresh legacy/flat CLI and offline tests; real Git flat apply/rebuild with manual notes, stable IDs, failure rollback and unchanged-output checks; actual non-Git B impact/regeneration requests rejected without a valid baseline | Repository M6 only; no prompt merging, external-bundle targeted apply or crash-atomic publication claim |
| F — offline Viewer | A/B/C HTML copied alone to new folders, opened through `file://` with networking disabled; starts, selection, explicit detail, Back/Forward/Top level, branch inspection, evidence, search and keyboard activation passed | Chrome only; fresh suite separately covers shared detail, cycles, hostile text, Unicode, missing references and viewport controls |

Every fresh A/B/C build used the existing command, with the actual selected roots:

```sh
node builder/cli.mjs build --input BUNDLE --repository-root EVIDENCE_ROOT --output BUNDLE/architecture.html
```

The source checkout supplied the Builder and its dependencies. Nothing was installed into the target fixtures. The generated file alone is standalone; a prebuilt Skill distribution was not evaluated or implemented.

## A — source-backed service

Input: `test/fixtures/documentation-generation/repository`, copied without expected artifacts to `/private/tmp/pflow-m7-05/service/target`. Manifest: `/private/tmp/pflow-m7-05/service/provenance.json`. All 13 original file hashes remained unchanged. No `.git`, target `node_modules`, or injected `outside-output.txt` was created. Dependency implementations were not traced.

Actual evidence review:

- `package.json` and `boot.mjs:12–21` establish startup, loaded settings, subscription registration and command selection. The separate archive callback is established by `app/subscription.mjs:4–8` and `config/transport.xml`.
- `app/handlers.mjs:3–13` establishes the billing rejection, peer request, persistence, publication, storage, signing and runtime-selected plugin/request paths. The graph preserves the early rejection and plugin boundary; it does not invent a receiver.
- `settings.mjs` plus active JSON/XML establish the billing URL/options, `acct_items` table, bus/domain/topic/routing and bucket. `PEER_URL` and `input.endpoint` remain expressions, not invented deployment URLs. The unused import/settings do not become interactions.
- `app/persist.mjs:1–10` supports INSERT/COMMIT recovery through rollback. BEGIN is outside the try block. Rollback success is not guaranteed.
- The checked-in `message-port.md` fixture contract, shared bus, actual publication and registered subscription support exactly one possible archive delivery. The broker boundary remains visible; no ship-to-pull-receive edge, broadcast, ordering or exactly-once claim is added. This is fixture-contract evidence, not live broker verification.

Artifacts: `service/target/docs/architecture/{index.md,flows/,diagrams/architecture.json,architecture.html}` beneath the private run root. Counts: **2 starts, 5 flows, 33 nodes, 31 edges, 15 evidence references, 6 Markdown documents, 15 snippets**. One cross-flow async edge. Shared validation returned zero diagnostics; Builder returned zero warnings. Recorded repeated builds were byte-identical, 211078 bytes, SHA-256 `091dbe570064bd4504e9cdcf362c1a0ef5e7132c4655eaef62ee7057d837eaa6`.

General setup/client failures, rollback failure and runtime bindings remain bounded omissions. Source inspection supports the documented paths; it does not prove deployed behavior or exhaustive discovery.

## B — onboarding with clarification

Exact authored input, captured without adding a newline:

```text
When a new employee accepts the offer, People Operations collects their details and checks whether the required details are complete. If complete, People Operations hands the details to IT for access preparation. Access preparation means IT creates an account, then sends the welcome link with the message ‘Bienvenue · 환영합니다 · ようこそ’. After access preparation, the manager confirms first-day readiness and onboarding finishes. If details are incomplete, People Operations requests the missing information.
```

The evaluator asked whether requesting missing information stops this attempt or returns to collection/checking, then waited. The evaluation author supplied this exact answer:

```text
After People Operations requests the missing information, this attempt stops. A later resubmission begins a new attempt outside this documented process.
```

The actual question and answer are separately attributed in `evidence/clarification-001.md`; only the answer at line 5 supports the added stop/resubmission boundary. The file also retains the agent's contemporaneous scope note in its question. This was a supplied fixture-author response, not an independent developer interview.

Input cwd: `/private/tmp/pflow-m7-05/onboarding/workspace`, non-Git, with `doc/` and no `docs/`. Output: `doc/architecture/`; evidence root: that cwd. All captured evidence remained under the selected workspace. `request.md` bytes and clarification text matched; every cited range resolved to actual contained text. No `docs/` was created.

Artifacts: `onboarding/workspace/doc/architecture/{index.md,flows/onboarding.md,flows/onboarding-detail.md,diagrams/architecture.json,evidence/,architecture.html}`. Counts: **1 start, 2 flows, 10 nodes, 8 edges, 2 snippets**. Zero validation errors or build warnings; both CLI builds matched SHA-256 `34f17c584a9a76600cf4dc3e8862a06ebd7253408881d622bb4b133b67426848`.

Review confirmed only the stated People Operations, IT and manager responsibilities. The supported account/welcome substeps form a detail Flow; the incomplete attempt stops only because of the answer. Required fields, account system, delivery mechanism, deadlines and resubmission workflow remain unknown. No extra ownership, retries or integrations were invented.

## C — deployment and explicit workspace

Exact authored input:

```text
The release owner starts deployment by preparing a candidate package. Preparing the candidate means building the archive, then recording its checksum. The owner hands the candidate and checksum to the reviewer for verification. If verification passes, the reviewer approves the candidate and hands it to the operator. The operator deploys it and checks health. If health is good, deployment finishes. If health is bad, the operator notifies the release owner and stops. If verification fails, the reviewer rejects the candidate, notifies the release owner, and stops. No rollback, retry, parallel work or delivery guarantee is specified.
```

Explicit document workspace: `/private/tmp/pflow-m7-05/deployment/documents`, also the evidence root and final bundle destination. No extra `architecture/` was appended. The separate `deployment/application` sentinel stayed unchanged. Both roots were non-Git. Exact request bytes and contained citation ranges were checked.

Artifacts: `deployment/documents/{index.md,flows/deployment.md,flows/deployment-detail.md,diagrams/architecture.json,evidence/request.md,architecture.html}`. Counts: **1 start, 2 flows, 17 nodes, 15 edges, 1 snippet**. Zero validation errors or build warnings; repeated CLI builds matched SHA-256 `7dc4ba9bea2faa5ba70cb3665a709870b4dc0c0ec11c88c62e6f07066bc46d1b`.

Review checked owner→reviewer→operator handoffs, verification rejection, good/bad health outcomes and the two supported preparation substeps. Sequential edges use the approved `unknown` mode because waiting/transfer semantics are not stated. No rollback, retry, extra approval, actor, parallelism or delivery guarantee was introduced. Verification/health criteria, tools, target environment and timing remain unknown.

## Offline execution and safety

Private driver: `/private/tmp/pflow-m7-05/offline-check.mjs`; inputs and combined results: `browser-inputs.json`, `browser-results.json`. Each fresh HTML was copied alone to `relocated/CASE/architecture.html` and opened with browser networking disabled. Each page made exactly one request, for its own file URL; no script errors or external runtime asset references were found.

For A/B/C the driver selected all process starts, selected a node without expansion, expanded with Space, used Back/Forward/Top level, inspected a branch with Enter, compared an evidence excerpt to its exact original line, activated body search (`billing rejected`, `missing information`, `checksum`), checked highlighted results and reopened the retained query. Screenshots were taken at 1440 and 720 pixels. The root evaluator visually inspected the service and deployment desktop captures. This is browser automation and a bounded visual review, not cross-browser or assistive-technology certification.

The fresh full suite also executed generated-file tests for shared detail calling context, cyclic navigation, Unicode, hostile script-like evidence, safe Markdown hydration, missing references, search synchronization, and viewport controls. These are authored regression fixtures, distinct from fresh A/B/C forward generation. No unsafe text was deliberately added to the original B/C descriptions. No claim is made that structural validation detects whether arbitrary source text is true.

Output-policy and bundle tests rejected actual traversal, symlink escapes, hardlink/file collisions, mixed layouts, invalid citations and line ranges. M6 tests exercised real temporary Git baselines, unchanged files/IDs, manual notes, provenance failure, publication failure and prior-HTML preservation. Some publication errors were deliberately injected; they test handled failures, not power-loss or adversarial-race recovery. Prompt incremental generation remains unsupported by Skill instructions. An actual impact request on non-Git B failed with a Git diagnostic; an actual B candidate without a valid change set/baseline failed the regeneration provenance guard and preserved its HTML. Results: `/private/tmp/pflow-m7-05/prompt-incremental-rejection.json`. No Git provenance was fabricated. This verifies the non-Git case and baseline guard, not automatic input-mode detection for every possible Git-backed prompt workspace. Separate repository-fixture tests exercise source/output overlap rejection.

Two additional probes copied the fresh B workspace, then introduced a dangling edge target and a missing request-evidence file separately. The actual CLI returned exit code 1 with the exact graph/source reference in each diagnostic; the previous HTML remained byte-identical. The original fresh B bundle was not modified. Commands/results: `/private/tmp/pflow-m7-05/failure-probes/results.json`. Root rechecked all 13 raw service hashes against both the original fixture and analyzed copy: unchanged.

## New-reader usability: heuristic findings

No independent human participant was available. The following is an agent heuristic review of generated prose, graphs, citations and browser behavior. A structurally valid artifact is not proof of accurate or understandable prose.

| Reader question | A — service | B — onboarding | C — deployment |
|---|---|---|---|
| Purpose/scope? | Index explains command processing and archive callback, explicitly source-only | Index explains supplied onboarding and incomplete-details outcome | Index explains candidate preparation, verification and deployment outcomes |
| Where does it begin? | Command launch or registered eligible archive message | Employee accepts offer | Release owner begins candidate preparation |
| Main sequence? | Startup→ship/drain; ship overview states ordered boundary calls | Collect/check→IT access→manager readiness | Prepare→review→approve→operator deployment→health |
| What changes the path? | Command, billing status and optional runtime plugin | Required details complete/incomplete | Verification pass/fail and good/bad health |
| Success/failure? | Signature/receive/callback return; billing throw; database recovery | Finish or clarified stop for this attempt | Finish or notification and stop; no invented rollback |
| More detail? | Startup opens ship/drain; ship opens persistence | Access opens account creation and welcome | Preparation opens archive creation and checksum |
| Supporting evidence? | Real code/configuration and explicit fixture port contract, numbered excerpts | Exact request plus separate answer excerpt | Exact request excerpt |
| Unknowns? | Environment/runtime targets and bounded failure coverage stated | Required fields, tooling, timing and resubmission stated as unknown | Health/verification criteria, tooling, environment and timing unknown |

The explanations support these eight questions in the bounded examples. Remaining usability limits: long service graphs can fit at 25%, requiring zoom or detail exploration; raw kind/mode values remain technical; citations to a one-line prompt highlight a broad passage rather than a single clause. Some generated step sections repeat labels and need editorial review for larger processes. These are limitations, not evidence of a critical navigation failure. No design rationale or unspecified responsibility was added to improve apparent completeness.

## Stabilization, release boundary and next step

No reproducible product defect requiring a runtime fix was found in this evaluation. Existing regression tests were run; no duplicate test or new feature was added merely to increase the count. M7-05 changes are the evaluation plan/report, final review record and current-status documentation. M1 schema, runtime code, prior milestone work and history remain unchanged by this task.

Recommendation: **ready with limitations for initial real-team usage from the trusted source checkout**. Both modes completed the same validated offline pipeline, isolation and legacy compatibility passed, and M6 safety regressions passed. Start with reviewed documentation and a bounded team pilot. This is not evidence of complete repository discovery, guaranteed AI accuracy, live infrastructure correctness or validated human learning outcomes.

Known limits: human evidence review remains necessary; prompt updates require explicit full generation and a safe ownership decision for existing content; Git provenance is required for repository incremental apply; selected roots must be canonical and pass containment checks; no prebuilt distribution/install evaluation was performed; only installed Chrome was tested. The independent review outcome is recorded in [the completion/review record](design/m7-05-review.md).

Raw generated artifacts, command logs, per-case `evaluation.md`/`results.json`, screenshots and hashes are retained under `/private/tmp/pflow-m7-05`. These are local temporary evidence, not a shipped sample corpus or permanent CI artifact archive. The raw service fixture, exact prompt inputs above and checked-in tests permit rerunning the evaluation; future AI output is not promised to match the recorded graph or IDs byte-for-byte.

Stop at M7-05. Recommended next action: review and approve M7 closure, then run a bounded real-team pilot. M8 remains separate and needs explicit approval.
