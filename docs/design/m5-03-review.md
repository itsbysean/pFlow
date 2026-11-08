# M5-03 completion and review

Implemented on local main from 09afc5e. M1 schema 1.0.0, Viewer and Builder remain unchanged. No new dependency, parser, runtime analyzer or asynchronous linking was introduced.

## Files

- src/skills/pflow-external-boundaries/SKILL.md and references/{representation,evidence,review}.md: separate AI boundary stage with invocation/configuration evidence rules, generic metadata and review limits.
- src/skills/pflow-execution-flow/references/representation.md: explicit optional handoff; does not activate the next stage automatically.
- test/fixtures/boundaries/: authored JavaScript/JSON/XML and Python repositories, M5-02 seeds, enriched oracles, identity roles and canonical Markdown. No installed fixture packages or vendor execution.
- test/external-boundary-evaluation.test.mjs: 11 deterministic contract, argument, evidence, negative and counterfactual checks.
- README.md, docs/external-boundary-evaluation.md, docs/design/m5-03-plan.md and this review: usage, evaluation boundaries, plan and results.

## Evaluation

The implementation distinguishes owned wrappers, significant library APIs, actual system operations and unknown destinations/receivers. HTTP supports static/configured, environment and input-derived destination evidence; database supports active SQL/mapping and transaction inputs; messaging supports independently configured publishing/receiving; generic metadata supports object storage and filesystem operations. Library-only signing stops at its non-owned API. Unknown runtime/deployment values remain expressions/keys or concise Markdown gaps.

Deterministic tests exercise owned JavaScript callers using recording ports. They compare configured URL/options, caller response rejection, SQL/table/transaction calls, publish/receive arguments, object SDK options and signing inputs with the oracle. They retain graph IDs, edges and old evidence; reject unused leads/vendor internals; distinguish structural validity from metadata witness checks. Python checks source evidence, environment key and UTF-8 metadata without reading a host file. Fixture tests are not an AI accuracy guarantee.

A blind agent read the Skill/contracts, analyzed seeds and raw owned source/configuration, without expected outputs/tests or vendor bodies. It produced 11 JavaScript and one Python boundary enrichments. Both outputs passed shared schema/semantic/Markdown validation. A second blind run against changed active configuration retained all graph identities and changed the URL (including literal double slash), table and both topic arguments correctly. Independent review repeated validation and identity checks for all three bundles. Temporary forward outputs are evaluation observations, not committed product artifacts.

## Independent findings and fixes

Separate contract research confirmed no model/UI blocker. Independent source review found two fixture defects: library metadata lacked import-binding SourceReferences, and authored Markdown had stale handoff text, insufficient execution summaries and an unrelated Python rollback statement. Fixed the import evidence, added a regression witness check, replaced stale indexes and wrote concise trigger/sequence/return summaries. Removed the Python rollback claim. No critical Skill or contract issue was found. Review did not inspect vendor implementations or run fixture startup/live infrastructure.

## Verification

- Focused evaluation: 11/11 passed after fixes.
- Full suite: 396/396 passed, including existing local Chrome offline Viewer checks; final post-fix rerun recorded before commit.
- Official Skill quick validation: boundary Skill and execution-flow handoff Skill passed.
- Shared M1 schema, semantic and Markdown validation: both seeds/oracles and three blind outputs passed.
- Default Builder: 3 artifacts, 6 Markdown documents, 19 snippets, 185144 bytes. Output equals the existing ignored architecture.html byte for byte. Non-build oracle filenames preserve artifact discovery.

## Limits and next task

These are small synthetic evaluations, not production recall, live protocol behavior, transaction guarantees or source/deployment verification. Generic attribute keys remain open; no new registry or per-field evidence contract is imposed. Significant scope and configuration completeness require agent judgment and independent source review. Current host environment and vendor internals are not evidence for deployment values. Existing persistent IDs are retained; this stage does not implement a historical identity store.

Recommend M5-04 next: establish producer/consumer relationships only through verified binding/configuration evidence, retaining existing boundary identities and unresolved gaps. That stage requires separate approval and has not started.
