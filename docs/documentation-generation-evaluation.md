# End-to-end documentation evaluation

The [main source Skill](../skills/pflow/SKILL.md) connects the four existing analysis Skills to canonical artifact generation, shared validation and the existing trusted Builder. It is an AI investigation workflow, not a custom analysis engine or broker/parser runtime.

## Raw-input evaluation

[test/fixtures/documentation-generation/repository](../test/fixtures/documentation-generation/repository/) extends the M5-03 raw fixture with active XML callback registration, an explicit selected message-port contract, a configured shared bus and an unresolved runtime plugin registry. It includes a hostile source note and a non-owned implementation trap. Do not run startup, install the fictitious packages or inspect vendor implementation bodies.

A fresh agent received only this raw source copy, the main Skill and its linked stage/M1/tool contracts. It could not read previous oracles, tests, generator scripts, design/review/evaluation reports or other agents' answers. The target path contained spaces. The agent performed discovery → execution → boundaries → async linking → Markdown/Diagram generation → shared validation → actual CLI build, writing only the intended architecture subtree. It did not execute target code, install dependencies, read host deployment values or contact infrastructure.

The generated result has two entries (command process and registered archive callback), six Flows, thirty-nine Nodes, thirty-six Edges, twelve external boundaries and one verified async possibility. Command dispatch exposes ship/drain detail; persistence and registration use reusable detail Flows. HTTP rejection, transaction failure/rollback and plugin early-exit conditions remain explicit. PEER_URL, input.endpoint and plugin targets remain unknown. Shared broker/configuration, exact routing/type, reachable registration and the selected adapter contract establish publish→archive; pull receive lacks sufficient registration/filter evidence and has no guessed transfer.

## Review and preserved artifacts

The first generated bundle passed structure/reference validation and the Builder, but independent evidence review found missing package import and active settings loader associations. Added those SourceReferences/canonical citations without changing IDs, execution edges or metadata. Main build guidance now explicitly checks these chains. Reviewed final snapshots are [generated/graph.json](../test/fixtures/documentation-generation/generated/graph.json) and [generated/docs](../test/fixtures/documentation-generation/generated/docs/). Their IDs were assigned once in the raw-input run and retained during correction. expectations.json contains test-only role identities, not a public architecture format.

The graph snapshot is not named architecture.json so default repository Builder discovery remains the three original samples. Snapshot Markdown paths target the materialized bundle arrangement, not their storage location: tests copy graph.json to <target>/docs/architecture/architecture.json and docs/ beside it. JSON SourceReference paths remain target-repository-relative. No absolute host paths are embedded in graph/HTML.

To repeat the AI evaluation, copy only the raw repository to a temporary root and ask a fresh agent to use the main Skill with that source/output scope. Exclude generated/, tests and these reports. Compare source-backed semantics and canonical references, not independently assigned opaque ID values or exact prose. Run shared validation, review invocation/configuration/transfer meaning and build through the actual CLI. A new AI run is not guaranteed to produce byte-identical prose or IDs; deterministic packaging applies to identical input artifacts.

## Automated integration

Run `node --test test/documentation-generation.test.mjs` (five tests) or `npm test`. Tests materialize the reviewed generated snapshot in temporary targets and use the unchanged production validators and CLI. They check actual graph/boundary/reference contents, complete evidence witnesses, canonical mappings, retained source files, unsupported links, invalid-association failure preserving prior HTML, embedded Markdown/snippets and byte-identical repeated builds. They do not invoke an AI model in CI or establish general semantic accuracy.

The browser test builds the snapshot, moves only architecture.html and removes the inputs. Chrome runs with the browser context offline. It verifies entry switching, hierarchical expansion/back, node inspection and section targeting, async-edge keyboard inspection, source line 4, and body-text search that navigates/highlights the unresolved plugin section. Only the moved HTML is requested; no original files/server/assets are available.

The initial generated browser test assertion expected one code element for a multi-line snippet. It was corrected to inspect the referenced numbered line; no Viewer change was needed. Browser launch requires the same installed Chrome/Chromium setup as existing Viewer tests.

## Results and limits

Final shared validation returned zero diagnostics. The trusted Builder embedded seven Markdown documents and twenty-seven snippets, without warnings, producing 245687 bytes. Repeated builds from unchanged artifacts were identical. Source hashes matched the raw fixture and no hostile-note output was created. The full verification record is [here](design/m5-05-review.md).

This single authored JavaScript/JSON/XML integration target covers selected mechanisms, not all languages/frameworks, deployment values, delivery guarantees or repository recall. Earlier stage tests retain their independent language and mechanism coverage. Setup failures and non-owned internals are not exhaustively expanded. Source review remains essential: validators prove structure and references, not execution truth. No historical identity engine, incremental update, findings, prebuilt distribution bundle or M6 feature is introduced.
