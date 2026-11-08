# Async producer–consumer linking

Start with the requested M5-03 bundle, M5-01 registered entries, actual source root and coverage notes. Read [representation.md](async-linking/representation.md) and the linked approved contracts. Recheck stale evidence before linking. Honor the requested output scope; identify missing input or output locations rather than inventing a bundle or overwriting unrelated work.

Reuse existing execution graphs, messaging invocation occurrences, registered receiving nodes and source roles. Inspect only the publication, active client/configuration binding, subscription/registration and relevant routing chain. Do not retrace complete handlers or inspect third-party implementations. A package, method name, topic label or handler declaration alone proves neither publication nor registration.

Use [matching.md](async-linking/matching.md) to decide each candidate:

1. Establish a reachable publication and its bound messaging system, scoped destination and relevant routing/message values.
2. Establish a reachable, enabled subscription that selects an existing consumer entry and receiving node. Trace the used loader, registration, binding, filters and group semantics; configuration that is never registered is not a consumer.
3. Compare actual broker/system identity, namespace/tenant, destination and delivery constraints. Preserve unresolved runtime values; do not equate independent environment placeholders, aliases or familiar labels. Verify whether messages can reach this receiver under the inspected contract, not whether names look alike.
4. Add a confirmed possibility only when both sides and the transfer evidence are established. Keep the external messaging boundary and the producer's local continuation. Add no speculative edge for incomplete evidence or incompatible routing.
5. Keep unresolved and rejected candidates in concise analysis diagnostics with existing candidate IDs, missing/conflicting evidence and conditions. No new public status fields or placeholder receiver graphs. Do not claim guaranteed delivery, every-consumer broadcast, order or exactly-once processing.

Use a finite worklist of existing publication/receiving contexts, plus a reviewed candidate-pair set. Reuse a consumer graph once even when several producers reach it. Follow event chains only through already analyzed publications; record cycles as references, never recursively copy flows or enumerate arbitrary message sequences. Missing handler analysis is a handoff gap for the earlier stages, not permission for scope expansion.

Validate with the shared schema/semantic checks and documentation checks where the bundle has M1-03 associations. Then review evidence meaning separately using [review.md](async-linking/review.md). Report confirmed possibilities, exclusions, uncertainty, coverage and validation. Existing Markdown associations must remain valid; final Markdown generation is M5-05, outside this stage.

Do not run target code, contact brokers, read host environment values as deployment evidence, install broker/parser dependencies, build HTML, modify Viewer behavior, implement incremental updates or findings. Stop after linking; M5-05 needs a separate request.

Runtime functions and commands are available through [the packaged runtime](runtime.md). No sibling Skill installation is required.
