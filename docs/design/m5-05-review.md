# M5-05 completion and review

Started from local main aa14768. Added the main AI documentation Skill and a raw-input integration evaluation. No M1 contract, Viewer, search or Builder code changed. No new dependency, parser, custom analyzer, incremental update, findings or M6 implementation was added.

## Files created or modified

- skills/pflow/SKILL.md and references/{workflow,generation,build}.md: concise main workflow, actual output conventions, existing stage reuse, canonical generation, evidence checks, trusted validation/build and offline verification.
- test/fixtures/documentation-generation/repository/: compact authored target extending M5-03 with reachable XML consumer registration, a selected message-port specification, a configured shared bus and runtime plugin uncertainty. Contains hostile source text/vendor traps solely as untrusted fixture data.
- test/fixtures/documentation-generation/generated/graph.json and docs/{index.md,flows/*.md}: final reviewed artifacts from the blind raw-input run, stored without a Builder-discovered filename. expectations.json assigns test roles to their existing opaque IDs.
- test/documentation-generation.test.mjs: five meaningful integration tests of generated contents, evidence, validation, actual CLI, output/source isolation, failed-build preservation and relocated offline browser interactions.
- README.md, docs/documentation-generation-evaluation.md, docs/design/m5-05-plan.md and this file: main usage, test procedure, workflow and completion record.

## Pipeline and generated locations

Main Skill sequences discovery → owned execution analysis → significant boundaries → evidence-backed async linking → final Markdown/Diagram JSON → existing schema/semantic/Markdown validation → trusted M4 Builder. The same evolving graph/evidence is reused, with no duplicate analysis engine. Component stop markers remain correct for standalone use; the explicitly requested full sequence requires no repeated stage approval.

Actual Builder convention is architecture.json with sibling docs/. The default output is <target>/docs/architecture/{architecture.json,docs/index.md,docs/flows/*.md,architecture.html}. Connected detail/async graphs stay in one envelope. Illustrative separate diagrams/*.json with unrelated sibling Markdown is not supported by the current Builder and was not introduced.

The evaluation ran in /private/tmp/pflow-m5-05-forward/target with spaces. Its intended docs/architecture subtree contains the actual generated JSON, seven Markdown documents and architecture.html. Portable snapshots are committed under test/fixtures/documentation-generation/generated/; tests materialize them into compatible temporary roots. Snapshot Markdown evidence paths are authored for that materialized target layout, not for direct rendering from snapshot storage. No generated HTML binary is committed.

## Coverage and evidence

Fresh-agent input included only raw target source and the main/stage/M1/tool instructions, excluding oracles/tests/earlier answers/review reports. It produced two entries, six Flows, thirty-nine Nodes, thirty-six Edges, twenty-eight SourceReferences, twelve external boundaries, one unresolved plugin and one async possibility.

The command-process entry branches to ship/drain detail, with reusable persistence and archive-registration detail. The independent callback entry is concretely selected by active XML registration. Shipping retains the billing guard/error, external HTTP/object/library/messaging calls, persistence propagation, plugin early exit and dynamic endpoint. Persistence preserves BEGIN outside the try, INSERT/COMMIT inside it, ROLLBACK before rethrow, and BEGIN/rollback failure exits. The actual mapped table and configured values have source evidence. PEER_URL, input.endpoint and plugin targets remain unknown. Only the shared bus publication→archive relationship is confirmed; pull receive has no guessed callback route.

This is static analysis of selected owned/configuration paths, not a complete runtime trace. Startup setup failure details and third-party internals are not exhaustively expanded. No host deployment values, target scripts, services or installed vendor implementations were used. Source hashes match the raw target, the hostile-note output was not created, and only intended architecture files were added.

## Validation and tests

- Shared production schema 1.0.0, semantic and Markdown validation: zero errors on final generated artifacts.
- Existing CLI: success with explicit --repository-root and space-containing paths; one graph, seven Markdown documents, twenty-seven snippets, no warnings, 245687 bytes.
- Repeated final builds: byte-identical; evaluation HTML SHA-256 ce16304e395ea2b17d1121dab32b0881eba3e4e8c0873c4853ec598afdaf5783.
- Focused integration: 5/5 passed. The tests check actual generated graph/canonical contents, complete evidence witnesses, safe packaging, source preservation, deterministic repeated builds and failed validation preserving prior HTML.
- Offline browser: Chrome opened moved HTML through file:// with network disabled after input removal. Verified node→section inspection, HTTP metadata, source line 4, detail expansion/back, async-edge keyboard inspection, callback entry switching and Markdown body search/highlighting selecting the unresolved plugin. Only the moved HTML was requested; no page errors.
- Full suite: 414/414 passed, no skips. Earlier contract, stage, Builder, Viewer, search and safety tests remain passing.
- Official Skill quick validation: main Skill passed. Component Skills are reused unchanged.
- Default Builder regression: original three artifacts, six Markdown documents, nineteen snippets and 185144-byte HTML remain byte-for-byte unchanged.

## Independent review and fixes

Delegated research verified actual CLI/layout/reference constraints. Independent review assessed the main workflow, raw source, generated graph, all seven documents, source isolation and non-browser tests. It confirmed that one command-process entry with ship/drain detail is valid; separate CLI-action entries are an alternative, not a requirement.

Evidence review found two P2 gaps in the first blind output despite correct values: package→factory import references were absent, and billing/static configuration lacked the active loader chain. The generating agent added those associations/citations, retained every graph ID/edge/metadata value and rebuilt/revalidated. Regression witnesses and a concise main build checklist now cover these gaps. Independent recheck closed both findings; no unresolved critical issue remains.

The new browser test initially assumed one code element for a multi-line snippet; corrected the assertion to the exact numbered source line. Browser launch required the same permitted local Chrome execution as existing tests. No product behavior changed for either test issue.

## Limitations and recommendation

AI analysis is not deterministic semantic proof. CI tests a reviewed generated snapshot, not a live model call; the fresh raw-input run is a repeatable evaluation procedure. Identical artifact packaging is deterministic, while independent AI runs can choose different prose and initial opaque IDs. This single integration fixture does not establish general language/framework recall or deployed delivery behavior; prior stages retain separate fixture coverage. Manual evidence review remains essential, as the initial citation gaps demonstrate.

The main Skill is source in the trusted pFlow checkout. Building needs its ready Node.js 24/development dependencies; the target needs no installation, and the HTML is standalone. Prebuilt distribution, historical identity tracking, incremental analysis and findings remain outside this milestone.

Recommend defining M6 scope and acceptance tests before implementation, using this validated end-to-end baseline and explicit retained-identity/coverage limits. M6 has not started and requires separate approval.
