# Discovery output and M1 compatibility

Read the actual [approved model](../contracts/model.md), [schema 1.0.0](../contracts/schema.md) and [Markdown contract](../contracts/markdown.md) in this tool repository. They are authoritative; illustrative names are not additional fields.

## Compact report

Report repository languages/structure/owned boundaries, inspected launch roots and configuration, then one row per confirmed activation: trigger → registration/selection → receiving handler, module, evidence references and activation conditions. Add unresolved candidates, excluded leads and incomplete coverage with reasons/evidence. Keep body behavior untraced. Avoid a large source listing or a second copy of the graph.

Mechanism/type belongs in EntryPoint.trigger (free text), concise identification in label, and exact locations/symbols in SourceReferences. M1 has no EntryPoint module, description, configuration, confidence or status fields. Put those explanations in associated Markdown. Cite verified configuration through SourceReferences; omit secrets and runtime values that were not established.

## Discovery-only graph

A confirmed EntryPoint requires an actual root flowId. Represent only the evidenced handler entry using a Flow with one operation Node, startNodeId equal to that node's ID, and edges: []. The node means receiving control at the proven handler, not a placeholder for an unknown target. Its sourceIds cite handler entry evidence; EntryPoint.sourceIds include the activation/binding evidence. A Flow's evidence is the union of its owned nodes/edges, so include any activation evidence needed by its prose on that receiving node as well. Do not add calls, returns, terminals, conditions, external boundaries or expandFlowId merely to make the graph look complete.

Distinct entries may share a minimal Flow only when they reach the same evidenced receiving context. Do not assume reuse solely because symbols have the same name. The Markdown must state that handler bodies and downstream flows were not traced.

Keep unresolved candidates out of entryPoints and do not turn uninspected bodies into unresolved graph nodes. M1 unresolved nodes concern an actual unresolved execution boundary inside an established Flow; discovery does not need to invent that Flow. Put uncertainty/coverage in index.md. Existing code/configuration evidence for such notes can use SourceReferences and citations there, without a fictitious EntryPoint. SourceReferences must still resolve to real inspected files; do not create records for missing files or guess line ranges.

An empty confirmed set is valid: entryPoints: [], flows: [], sources: [] (or actual evidence references used in the index). Do not add dummy nodes/entries to satisfy the Viewer.

## Identity

Reuse existing opaque IDs only when the previous artifact and current evidence reliably establish the same activation/handler occurrence and evidence roles. First discovery assigns fresh opaque entry_, flow_, node_ and src_ IDs once, checks uniqueness and persists them in the emitted artifact. Never derive IDs from current paths, line numbers, labels, enumeration order or content hashes. Do not reuse uncertain/deleted identities. If continuity cannot be established and would replace an existing artifact, report the issue and produce a separate draft; M5-01 does not implement rename matching, incremental updates or a new identity ledger.

## Bundle and validation

When requested, write architecture.json and sibling docs/index.md plus docs/entry-points.md (or a requested equivalent). Every Flow needs its own literal entity-ID section, canonical docs backlink and index link. Node/EntryPoint sections are optional; when supplied, use their own IDs/backlinks and correct nesting. Evidence citations/definitions use exact SourceReference IDs and ranges per M1-03. Keep module/configuration notes concise and attached to the relevant Flow. Unresolved/coverage notes have no fabricated entity anchors.

Use the existing validation functions, not the HTML build command just to validate:

```js
import { validateDocumentation } from '/path/to/pflow/scripts/pflow.mjs';
const diagnostics = validateDocumentation(architecture, { docsRoot, sourceRoot: targetRepositoryRoot });
```

Run from an installed pFlow source/tool environment; do not install tooling in the target repository. This checks schema, graph references, actual evidence paths/ranges and Markdown associations together. Failures must be resolved or reported before claiming valid output. Passing validation does not prove that an evidence chain establishes activation: independently review source meaning, reachable setup and target selection. Leave the Builder and Viewer unchanged.

For an explicitly requested execution analysis, pass the confirmed bundle and source root to [pflow-execution-flow](../execution-flow-workflow.md). Discovery alone does not activate that next stage.
