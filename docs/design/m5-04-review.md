# M5-04 completion and review

Started on local main at a337298. Implemented a separate source Skill for evidence-backed asynchronous linking. No approved architecture decision, schema field, execution vocabulary, dependency, Viewer or Builder behavior changed. M5-05 is not started.

## Files changed

- skills/pflow-async-linking/SKILL.md and references/{representation,matching,review}.md: minimal linking workflow, evidence criteria, existing receive/async representation and finite-context review.
- skills/pflow-external-boundaries/references/representation.md: explicit next-stage handoff, keeping M5-03's no-link scope intact.
- test/fixtures/async-linking/repository/: owned bootstrap, handlers, registration and config plus a declared custom message-port integration contract. The dependency is fictitious and is not installed/executed.
- test/fixtures/async-linking/seeds/: existing M5-03 graph, identity roles and canonical documentation scaffolding.
- test/fixtures/async-linking/expected/: linked oracle, expected identities, preserved documentation and separate candidate diagnostics. Filenames exclude these fixtures from default Builder artifact discovery.
- test/async-linking-evaluation.test.mjs: thirteen focused behavioral, evidence, negative, cycle and compatibility checks.
- README.md, docs/async-linking-evaluation.md, docs/design/m5-04-plan.md and this file: usage, evaluation method, limits and delivery record.

## Matching and representation

A confirmed possibility requires reachable publication, active concrete registration, the same established scoped broker/system identity and destination, and compatible route/type/filter/group semantics. Equal labels or independent environment keys do not prove identity. Incompatible evidence rejects a candidate; unknown settings or semantics leave it unresolved. Neither outcome creates a confirmed edge.

Existing publication nodes retain external.kind messaging. New edges belong to the publication's Flow and use kind receive, mode async, targeting existing registered receiving nodes. Local waiting/continuation semantics remain. Competing workers are eligible alternatives, independent groups are possible recipients, and upstream input.audit/message.replay conditions remain. No guaranteed delivery, broadcast-to-every-member, order or exactly-once claim is made. Existing graph references form event chains/cycles without recursive copies or a new graph model.

## Evaluation and validation

- Thirteen focused tests passed. Controlled owned-code recorders compare actual publication and registration options; exercise the workerOne → receipt → orders callback chain; check broker/namespace mismatch, config resolution, runtime uncertainty, group/route/type constraints, conditional destinations, disabled/unregistered leads, source witnesses and invalid endpoint/mode failures.
- Seed and linked oracle pass the existing schema 1.0.0, semantic and Markdown validators. All ten entries, ten Flows, twenty-eight Nodes and twenty local edges are retained. Eleven async transfers are added without copied consumer graphs.
- Original blind forward run: eleven confirmed, eight unresolved, thirty-five rejected candidate pairs. The agent had no oracle/test access and ran no target code or infrastructure. Shared validation passed. Independent review matched every confirmed transfer tuple and evidence set with the oracle.
- Changed-config blind run: renamed active orders destination, incompatible workerTwo route and newly compatible wrongBroker binding. Eleven confirmed, seven unresolved, thirty-six rejected pairs. Three workerTwo links disappeared; three wrongBroker links appeared. Eight unchanged transfer IDs were reused, three new links received new IDs, and stale metadata/activation evidence was corrected. Shared validation and independent review passed.
- Full npm test suite: 409/409 passed, including existing local Chrome offline Viewer checks. Focused checks also exercise existing async boundary projection and finite layout geometry.
- Official Skill quick validators: async-linking and external-boundaries both passed.
- Default Builder regression: three artifacts, six Markdown documents, nineteen snippets, 185144 bytes; byte-for-byte equal to the existing ignored architecture.html. No Builder integration was added.

## Independent review and fixes

Delegated contract research confirmed the approved representation and identified runtime broker uncertainty in the earlier M5-03 fixture. A separate reviewer assessed source/configuration meaning, all expected links, graph preservation, test strength, original blind output and changed blind output. No blocking or critical issue remains.

Blind evaluation identified two small instruction gaps: relocation of source citations and identification of candidate pairs without new graph IDs. Added explicit citation rebasing, existing publication/entry/receiving IDs and source/symbol fallback for unregistered declarations. Review identified a misleading test comment about callback identity; corrected it and documented the coverage limit. No contract change was required.

## Limits and M5-05 recommendation

This Skill is an AI investigation procedure, not an automatic broker matcher or parser. Synthetic fixtures establish only their declared port semantics, not real infrastructure behavior or general repository recall. Source review remains necessary because validators cannot prove a messaging relationship. Unknown deployment values and unsupported adapter semantics remain unresolved.

Recorder subscription labels use active configuration order. Pass-through handler identities depend on source review; event-chain callbacks are behaviorally exercised. Type-only rejection is a constructed recorder case, not a separate raw active subscription. No live broker, external SDK or target bootstrap was executed. IDs are retained in known contexts; historical identity tracking is not implemented.

Recommend M5-05 next: final concise Markdown generation from the validated linked graph, preserving canonical entity sections, evidence citations, routing/group conditions and unresolved diagnostics without duplicating diagram data. That stage needs separate approval.
