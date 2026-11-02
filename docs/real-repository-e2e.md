# M6-04 real repository evaluation

Evaluation date: 2026-10-30. Tool checkout: main at afdb8f2 plus the uncommitted M6 work. The [plan](design/m6-04-plan.md) defined acceptance before execution. This evaluation uses real source copies; it does not start the applications or contact infrastructure.

## Repositories and coverage

| Scope | Recorded original revision | Copied material | Initial detailed output |
|---|---|---|---|
| Tidefolk API | db0b85fd4541b4841e1be9546e882ebfe2bb30cb | 82 allowlisted files, including all 70 production TypeScript files, SQL migrations and selected Worker/build metadata | 3 entries, 22 Flows, 232 Nodes, 259 Edges, 69 SourceReferences, 28 external occurrences |
| Dotal logging and source closure | 3ce56327529d358cbc70c2fa482d62c80385f5e6 | 153 allowlisted files; 142 Java files across logging, common, web, member-core, notification-core and auth-core, plus selected configuration/build metadata | 8 entries, 14 Flows, 57 Nodes, 45 Edges, 45 SourceReferences, 11 external occurrences |

Tidefolk inventory found 19 explicit routes. Detailed traces cover guest authentication, health and Google OAuth callback; 16 routes remain outside detailed analysis. Traces cover request-scoped composition, reusable authentication/session/player operations, conditions, typed catches, compensation, Google HTTP/jose boundaries and configured D1 operations.

Dotal covers startup, three HTTP operations, three configured Kafka consumers and a retention schedule. It follows controller/service calls across modules, Jackson binding, Elasticsearch/JPA mappings, listener factory/topic/group configuration and conditional scheduler registration. Root settings declare 17 modules; this copy materializes only the six-module source closure. Other applications/modules and deployed configuration are outside the evaluation.

Dotal's candidate LoggingAspect producer is outside the logging application's component scan. No activation proof connects it to these consumers. Topic-name similarity does not justify a receive edge. Conditional scheduler dispatch and unproven async advice remain explicit limitations. Positive producer–consumer linking, event cycles, competing groups and recursive execution are covered by existing authored fixtures, **not by a confirmed real transfer in these selected scopes**.

## Invocation and output

The source-checkout procedure worked using trusted pFlow Node dependencies. No target dependency installation, AST parser, Gradle/TypeScript build, target script, service, broker or network access was used. There is no prebuilt Skill distribution to install. Prebuilt/global installation remains unsupported and was not verified. Only generated HTML is independent of the tool checkout.

The approved M1/M4 layout is:

```text
docs/architecture/
  architecture.json
  docs/index.md
  docs/flows/*.md
  architecture.html
```

The illustrative flat index/flows/diagrams layout in the task is not the current contract. Connected Flows stay in one envelope. No schema or layout contract changed.

Private evaluation root: `/private/tmp/pflow-m6-04`. Each application has `target/docs/architecture/architecture.html`, its graph and Markdown, and `analysis/report.md`. These files contain source excerpts and remain outside the product repository. They are disposable local evidence, not distributed examples or CI prerequisites.

Actual initial build interface:

```sh
node /path/to/pflow/builder/cli.mjs build \
  --input /private/tmp/pflow-m6-04/tidefolk/target/docs/architecture \
  --repository-root /private/tmp/pflow-m6-04/tidefolk/target \
  --output /private/tmp/pflow-m6-04/tidefolk/target/docs/architecture/architecture.html
```

Both bundles pass existing schema 1.0.0, semantic and Markdown-profile validation. Initial HTML embeds 63 deduplicated Tidefolk snippets and 45 Dotal snippets, with no processing warnings. Repeated initial CLI builds are byte-identical:

| Bundle | Bytes | SHA-256 |
|---|---:|---|
| Tidefolk initial | 571684 | 3f104016e81c634d993d8d91708d43a90ad0c6a62db1ee615cfbffb298a0eb02 |
| Dotal | 343386 | 506e9a7890f0373dc92c70324c7b494c20da1ae04cf060ff3ceec00dbfec8d22 |

## Source review and corrections

An independent agent compared actual source activation, owned bindings, branch/exit order, external configuration and citation ranges with both generated bundles. Structural validity alone did not pass this review.

Five output defects were corrected and rechecked:

1. Write-log prose had a capture-only default copied from a different execution path. The unsupported default was removed.
2. Jackson invocation evidence lacked its import/static ObjectMapper binding. A narrow binding SourceReference was added.
3. OAuth transaction edges bypassed correlation validation and reached pending-switch handling too early. The validation decision now precedes that branch.
4. Two typed catches incorrectly mapped every error to an authentication response. They now distinguish SessionValidationError from other errors that propagate.
5. A parser's normal completion was marked as an exception before a later owned throw. The completion now uses next.

These are analysis-output/evidence defects, not findings about application bugs. Existing validators cannot prove their source meaning. Review guidance and portable regression witnesses cover these failure patterns; no source-analysis engine or public field was added.

## Offline browser verification

Chrome opened a relocated HTML-only directory for each application with network disabled. All 11 entry buttons selected their actual root Flow. Keyboard selection preserved the current Flow; the explicit expansion control opened detail and Back restored the parent. External metadata, edge details and exact numbered source lines were checked against source bytes. Search opened the matching documentation passage with highlights, retained the query on reopening, and closed with Escape.

Each run recorded exactly one request: its file:// HTML. No page errors occurred. Screenshots were inspected. This verifies bounded Viewer interactions in Chrome, not all browsers, arbitrary graph sizes or application runtime behavior. Evidence: `offline-check.mjs`, `offline-results.json` and each application's `offline-viewer.png` under the private evaluation root.

## Failure checks

On disposable Dotal bundle copies, missing input, malformed JSON, a dangling edge endpoint and missing Markdown each exited with status 1 and a path/category-specific diagnostic. Previous valid HTML bytes and the supplied graph bytes remained unchanged. Evidence: `failure-check.mjs` and `failure-results.json` under the private root.

## Isolation

The originals were copied as plain allowlisted files. Git metadata, dependencies, build output, environment/secret files and unrelated data were excluded. Original HEAD, index bytes and selected file bytes/modes were recorded before copy analysis and compared afterward. All 235 selected original files, both recorded HEADs and both index hashes were unchanged. This comparison covers the recorded copy baseline and selected source scope; it is not a claim about every file on the machine.

Only isolated targets receive controlled source edits and local fixture history for incremental comparison. Trusted pFlow tooling reads those inputs. The product checkout retains the existing uncommitted M6 work and has no delivery/history changes.

## Portable regressions

`test/flow-review-regression.test.mjs` adds seven tests with small authored operations and a valid graph/Markdown bundle. Recording ports exercise both validation outcomes, typed recovery versus propagation of the same error, parser completion before an explicit throw, path-specific mapped defaults, a real built-in library invocation with import/static binding evidence, and caller status claims after a child predicate changes. Mutated graph/prose counterexamples still pass structural validation but fail these semantic witnesses. This makes the validator boundary explicit; these tests do not execute private application code or implement an analyzer.

Run the focused checks from the trusted tool checkout:

```sh
node --test test/flow-review-regression.test.mjs \
  test/flow-analysis-evaluation.test.mjs \
  test/external-boundary-evaluation.test.mjs
```

The focused suite passes 28/28. Existing async, hierarchy, impact, regeneration, rebuild and browser suites provide portable coverage for mechanisms absent from the selected real paths. These fixture results must not be reported as observed real broker delivery or deployed application behavior.

## Real incremental sequence

The isolated Tidefolk copy has its own fixture Git history. Its initial copied-source provenance remains tied to the original revision above. Each round retains a physical source snapshot and a separate generated-only Markdown baseline. A manually added index note is current user text, not retroactively declared generated content. Explicit snapshot commits, raw Git changes, raw/refined impact plans and source-review reasons are retained under `tidefolk/analysis/round-{1,2,3}`.

Each round uses collectGitChanges and planImpact, then targeted source reanalysis, prepareRegeneration/apply, inspectArchitectureSet, actual entry/index inventory review, and rebuildArchitectureSet. It does not replace those helpers with an alternate update script or renderer.

| Round | Controlled source change | Observed documentation change | Unaffected Flow objects preserved |
|---|---|---|---:|
| 1 | Reuse an existing identity only when its providers include guest | Detail predicate and caller result/status summaries distinguish reused guests from existing non-guests that create a new guest | 20 of 22 |
| 2 | Register the same health handler at /readiness instead of /health | Rediscovery updates trigger, index, receiving/Flow labels and relevant prose; proven EntryPoint/root identities remain | 14 of 22 |
| 3 | Remove guest-creation compensation's deleteUnreferenced invocation; retain the original cause in GuestCreationError | Remove two obsolete Nodes, four Edges and one SourceReference; add one fresh failure-to-throw Edge without reusing removed relationship identity | 20 of 22 |

Registration changes conservatively review every owner of the changed app.ts evidence, even when some cited lines stay textually identical. This is not a claim of minimum invalidation. Unchanged Flow objects were independently compared with their prior snapshots; unchanged document files and stable IDs were also checked where appropriate. Shared detail remains available to its other actual callers.

All three staged candidates pass complete schema/semantic/Markdown validation. The manual note survives every three-way merge. M6-02 preserves previous HTML bytes until M6-03 successfully rebuilds. Every repeated M6-03 build returns unchanged, retaining identical HTML bytes, inode and mtime.

| Round | HTML bytes | SHA-256 |
|---|---:|---|
| 1 | 572554 | 98ec37e3c5dffb9ca604aadd75d0cdf8ee83e5fb8dd722064402e3ad11c4ee37 |
| 2 | 572795 | 382c4e3799d827805ee9463c3a3ac6f0cf6d86b482a3080481db6421da6f3ef6 |
| 3 | 564949 | a7696ad0ba19f0e95b2f0d8785e2a31339f57f067d2290fc68bfd7b3d5c8ec48 |

Final Tidefolk graph: 3 entries, 22 Flows, 230 Nodes, 256 Edges, 68 SourceReferences and 27 external occurrences. The original application was not changed; these are controlled test-copy changes.

A reviewer caught an old caller summary while the round-1 candidate was still being authored. The corrected summary was already present before staging/apply and in each retained generated baseline. This was a draft-review finding, not an applied-regeneration failure; no replay or silent patch of protected output was needed. A seventh portable regression tests the child-predicate/parent-status relationship. The focused suite now passes 28/28.

## Incremental recovery

Disposable Tidefolk copies verify an invalid Git baseline, invalid global Flow reference, actual M4 packaging rejection from a copied Viewer asset, invalid staged Markdown association, and injected second-rename failure during a valid regeneration. Each failure is reported. The previous HTML remains byte-identical; invalid staging does not alter the bundle. The injected apply failure restores the original bundle fingerprint. These are ordinary-error recovery checks, not crash-atomicity or adversarial-race guarantees.

Evidence is retained in `tidefolk/analysis/incremental-failures.json` and the private replay inputs. The Builder failure uses the real existing packaging validator, not a mock success/failure renderer. No AI reanalysis is needed solely to rebuild HTML.

## Final verification and recommendation

Final full suite: **489/489 passed**, with zero failures or skips. Official quick validation passed for the main, execution-flow, impact, regeneration and rebuild Skills. No dependency, public schema, Viewer, search engine, Builder or M6 helper change was needed for this milestone.

Both final relocated HTML files passed the offline checks again after incremental updates. Tidefolk additionally exposes the readiness registration, embeds the changed guest-provider predicate, omits both removed Nodes, and navigates a caller-result body search to its explicit Node section and Flow with highlights. The independent reviewer reran both final bundle validators with zero diagnostics and confirmed relocated HTML bytes match the final publications. No unresolved critical integration defect remained within the evaluated scope.

Recommend closing M6 for the tested source-checkout workflow. This is not complete repository recall, deployed behavior, a cross-browser guarantee or proof of real broker delivery. Prebuilt distribution is still unavailable. Targeted updates still require retained generated/source baselines and actual impact/index/source review. Ordinary-error recovery does not imply crash-atomicity. No M7 work was performed; further scope requires approval.
