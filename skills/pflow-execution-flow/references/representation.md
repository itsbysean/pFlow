# M1 handoff and representation

Use the actual [approved model](../../../docs/design/m1-01-common-architecture-data-model.md), [schema 1.0.0](../../../schema/architecture-1.0.0.schema.json) and [Markdown contract](../../../docs/markdown-contract.md). M5-01 [output rules](../../pflow-discovery/references/output.md) describe the confirmed-entry handoff. No discovery-specific status, confidence, module or callee field is added to Diagram JSON.

The handoff envelope contains EntryPoints whose flowId reaches a minimal receiving Flow. Confirm the source and preserve those identities when still valid. Keep the receiving operation as the local start and add downstream nodes/edges. Preserve source IDs while the same evidence role persists; assign new opaque IDs once for new occurrences/relationships and check uniqueness. Do not derive IDs from line numbers, paths, labels, hashes or traversal order.

## Calls, hierarchy and order

Flows own nodes and outgoing edges. A caller's invocation occurrence is an operation node; a local call edge identifies invocation and optional expandFlowId opens its reusable body. Caller continuations and failure paths stay in the caller Flow. A callee's normal/exceptional terminals describe exits from that callee, never a return edge to one particular caller. Do not exploit permissive cross-flow validation to splice internal call graphs.

Use next for proven local continuation, call for invocation, branch from an actual significant decision with distinct outcome labels, return for a documented normal/early exit and exception for evidenced exceptional transfer. Branches can directly reach invocation/exit nodes when that is the actual guarded transfer; do not add fake operations merely to force another edge kind. Cite the call/binding on invocation nodes and relevant relationship evidence on edges.

A decision summarizes source-backed conditions that change execution, including a selector inside a factory when that selector governs the call under analysis. Preserve guards before the operations they control; do not bypass a validation decision or move a guarded operation before it. A return is terminal only for the current scope; a handled exception may continue through local recovery instead. Capture meaningful outcome choices, not every ordinary return. Exception edges require a throw, handler or propagation basis; do not attach a speculative failure edge to every call. A helper that returns normally before an owned throw reaches that throw by `next`; the throw supplies the exceptional transfer. For a typed catch, preserve both the matching recovery and propagation of other errors, including error identity when rethrown. Do not map all caught errors to the handled outcome.

mode is based on actual waiting/transfer evidence. An async keyword does not establish detached execution. Use unknown when waiting behavior cannot be established. A local continuation after an unresolved expression is allowed only when caller source proves it; it does not prove the unknown receiver's eventual success.

## Uncertainty, cycles and boundaries

An unresolved node denotes the actual expression/dispatch boundary whose concrete target is unknown. An incoming edge proves that expression is reached. Do not connect it to guessed implementors, add a fictitious terminal, or mark uninspected known code unresolved. Separate a depth/scope omission from target uncertainty in Markdown.

For source-backed loops use local backward edges. For recursive calls, reuse a compatible detail Flow through expandFlowId, even when it refers to the current/ancestor Flow. Keep its local base/recursive outcome and caller continuation. Do not create a new Flow per recursion depth, eliminate valid cycles, or use an execution edge solely to represent navigation.

A proven non-owned invocation may use kind external with call-site evidence and no external value object. Stop there. Classifying/extracting protocols, URLs, library versions, integration attributes or cross-flow producer/consumer bindings is deferred. If ownership or target is unknown, explain that uncertainty instead of assuming externality.

## Documentation and validation

Each new Flow needs a canonical docs backlink and exact literal Flow-ID section plus an index link. Node/Edge docs, if used, have their own sections nested in the owning Flow. Source citations must belong to that entity's evidence; Flow citations use owned-node/edge evidence. Keep activation evidence on the retained receiving context when its summary needs it. Include unresolved paths, boundary stops, untraced scope and incomplete exception coverage where material.

Prefer semantic descriptions and symbols over copied indexed-call expressions: the focused Markdown checker treats ]( as navigation syntax even inside inline code. Cite the source instead.

Call validateDocumentation from the existing tool environment with docsRoot and sourceRoot set to the actual output/source roots. Do not run HTML build just to validate or install dependencies in the target. Existing validators check schema, references, ownership, local reachability, evidence locations and Markdown associations. They do not prove target binding, branch completeness, exception behavior or absence of guessed relationships. Preserve the actual M1 envelope and stop if a needed relationship cannot be represented without a contract change.

For explicitly requested external-boundary enrichment, pass the analyzed bundle/source root to [pflow-external-boundaries](../../pflow-external-boundaries/SKILL.md). Internal analysis alone does not activate that stage or M5-04 linking.
