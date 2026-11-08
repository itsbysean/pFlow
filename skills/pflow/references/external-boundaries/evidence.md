# Invocation and configuration evidence

Follow the actual composition path: caller → owned wrapper → supplied client/factory → invoked API and active options. Use dependency/build metadata to establish the non-owned boundary, not as proof that a service is contacted. Search for wrapper callers and configuration loaders before expanding searches into unused environments or examples. Skip trivial formatting/utility calls unless they materially define an architectural boundary.

## HTTP

Record method and actual destination argument. A literal base plus literal path may establish a complete URL only if the construction semantics are clear. A variable/environment base or dynamic path remains an expression/template; do not put a guessed value in a resolved-URL attribute. Capture service identity only when explicitly associated with this invocation/configuration, not from a familiar hostname or package label.

Trace defaults, overrides, injected options and URL/path joining. A configured base that the call overrides or never uses is not its destination. Configured timeout/retry options prove what was supplied, not elapsed time, retry success or an exact number of attempts unless the contract/code establishes those meanings. Caller response checks can describe verified handling without guessing response schemas or status behavior from SDK names.

## Database

Connect the actual query/client operation to its active mapping/configuration. Table/collection names need SQL/query text, an invoked mapping or inspected framework configuration—not repository/entity class names. Record a configured driver/dialect as configured; do not turn it into a verified server/version or deployment identity. Significant transaction calls can be summarized with source-backed begin/commit/rollback scope; do not claim isolation, atomicity or rollback guarantees that were not established.

## Messaging

Record publication, reception, consumption or subscription from actual invoked APIs and supplied destination/configuration. Distinguish broker technology/product, protocol and a package name. Record channel/topic/queue, routing key or message type only when used by the call/mapping. A test's supplied environment or message is not deployment evidence. Awaiting publish acknowledgment is not delivery or consumer completion. Preserve independent producer/consumer paths; defer their relation to M5-04.

## Libraries and other systems

A significant SDK call can use library metadata, or other when the operation establishes storage, filesystem, cache, process or another system interaction. Do not infer a cloud vendor, filesystem host, cache engine or RPC transport from a method's spelling alone. Document verified operation/arguments and unresolved configuration. Do not inspect SDK bodies to expand the architecture or extract unrelated internal endpoints.

## Evidence and uncertainty

Keep only options actually used by the significant invocation. Cite their loader, selected record, factory binding and call site as needed. Explain whether a value is literal, composed, defaulted, overridden or unresolved. Attributes do not have a confidence/status convention; omit unknown facts and state gaps in Markdown. Use descriptive namespaced keys that preserve the distinction between resolved values and configuration expressions; the model does not mandate a new key registry.

Never copy credentials, tokens or current machine-specific deployment values. Preserve the relevant configuration key/expression instead. Do not cite nonexistent files as inspected evidence. If metadata changes under a counterfactual binding/configuration, reevaluate it rather than carrying over the prior destination.
