# Existing model and handoff

Read the [approved model](../../../../docs/design/m1-01-common-architecture-data-model.md), [schema](../../../../schema/architecture-1.0.0.schema.json), [Markdown profile](../../../../docs/markdown-contract.md) and M5-02 [representation rules](../../pflow-execution-flow/references/representation.md). These remain authoritative; no boundary registry, destination entity, confidence field or per-attribute evidence field is added.

A proven boundary uses Node.kind external and optional external: {kind, name?, attributes?}. Allowed kinds are http, database, messaging, library and other. Attribute keys are namespaced; values are JSON scalars or scalar lists, not nested objects. These kinds are the approved contract, not an exhaustive technology taxonomy. Filesystems, storage, cache, processes, RPC and similar systems can use other with verified namespaced attributes.

Use library for an architecturally significant dependency invocation when no separate service/infrastructure interaction is established. Use a system kind when call/binding evidence establishes it. One operation can carry library.name/library.symbol alongside http.*, database.* or storage.* attributes. Do not add an artificial second call to show both the client API and its destination. Follow an owned wrapper to its real boundary rather than classifying the wrapper as third-party.

Unknown receiver and unknown destination differ. A proven HTTP request to a runtime expression stays external/http; omit the resolved URL/name and retain the expression/key with uncertainty in Markdown. An unknown plugin/factory callable stays kind unresolved, without an external object or guessed target edges. Do not infer ownership/technology merely because its destination is missing.

Enrich the same existing invocation ID when identity is proven. Retain Flow ownership, local continuations, branches, source roles and edge semantics. No expansion into non-owned bodies. A changed concrete binding may change which metadata is valid; do not preserve old attributes by inertia. Do not implement rename/move matching or an identity ledger.

send/receive describe direction, not automatic asynchronous mode. mode follows actual waiting/transfer evidence independently. In M5-03, no producer→consumer edge, expansion link or shared fabricated destination node connects their Flows, even when topic names match or binding evidence is visible. Subscription setup belongs to its actual setup path, not a fictitious call from a consumer callback back to registration.

Keep canonical Flow sections/index links and any existing node sections. New node docs, when useful, use its own literal ID nested in its owning Flow. Attribute evidence belongs in that node's sourceIds; concise prose can say which reference proves method, table mapping, configuration expression or unknown deployment value. Flow prose cites owned-node/edge evidence. Avoid copied indexed-call syntax that the focused Markdown checker can mistake for a link.

Validate with existing validateDocumentation(architecture, {docsRoot, sourceRoot}) from the installed source/tool environment. Do not invoke HTML build just for validation or install tooling in the target. Missing files, escaping paths, stale ranges and graph/docs inconsistencies must be resolved or reported. Do not claim validation establishes external interaction semantics.

For explicitly requested producer–consumer linking, pass the proven boundary bundle and registered entry evidence to [pflow-async-linking](../../pflow-async-linking/SKILL.md). M5-03 alone still adds no such links.
