# Async linking evaluation

The [source Skill](../skills/pflow-async-linking/SKILL.md) is an AI investigation stage. It reuses M5-01 registration, M5-02 execution and M5-03 boundary evidence. It does not install a matcher, parser or broker runtime. Schema 1.0.0 remains unchanged.

## Fixture contract

[test/fixtures/async-linking](../test/fixtures/async-linking/) contains an authored custom message-port repository, M5-03 seed, linked oracle and analysis diagnostics. Its checked-in message-port.md defines the selected API: endpoint and namespace form an isolated routing domain; destination, route and envelope type match exactly; same-group subscriptions compete; distinct groups are independent possible recipients. This explicit specification supplies fixture semantics without assuming a real broker's behavior. Dependencies are fictitious: do not install them or execute boot.mjs.

The source separates caller publication, reachable registration, config loading, handler binding and public port semantics. SourceReference ranges cover all these roles. Opaque entity identities are retained from the seed; eleven new producer-owned receive/async edges connect existing messaging nodes to registered starts. Local awaited send/return paths remain unchanged. No producer or consumer graph is copied.

| Scenario | Evidence/result |
|---|---|
| Same broker/destination | Primary client, sales namespace and configured orders destination allow eligible ready/Order recipients. |
| Different broker | Same destination on an explicitly isolated beta endpoint adds no link. Namespace mismatch also fails. |
| Resolved config | Both sides resolve used destinationKey values; changing orders.v1 to an opaque name preserves eligible pairs. |
| Runtime environment | Independent clients with BUS_ENDPOINT remain unresolved despite equal key names; no edge. |
| Multiple receivers | workerOne/workerTwo compete in workers; auditTap is an independent possible group. Route rejected is incompatible. |
| Message type | A constructed recorder input with another envelope type is rejected; missing route data is not a wildcard. |
| Multiple publications | emit and retry publish orders; emit conditionally also publishes receipts. Existing input.audit branch remains. |
| Event chain and cycle | workerOne publishes receipts; receipt can publish orders only under message.replay. Existing Flow references form a finite cycle. |
| Misleading candidates | Disabled registration and a conventionally named unregistered handler produce no consumer entries or links. |
| Cross-flow validity | Edges reference existing receiving nodes, retain complete binding evidence and preserve broker nodes and all seed graphs. |

## Deterministic checks

Run `node --test test/async-linking-evaluation.test.mjs` (13 tests), or `npm test` for the full suite. Shared validators check schema, semantics and existing Markdown associations. Recording ports execute only owned registration/handler code, compare actual supplied options and exercise the workerOne → receipt → orders callback chain. No bootstrap, host environment, adapter implementation or external service is executed.

The routing helper is fixture-specific and follows the declared port contract; it is not an independent implementation of a real broker or a product matcher. Negative checks distinguish schema-valid false links or missing binding witnesses from structural violations such as missing endpoints or sync cross-flow receive. Existing Viewer projection/layout is exercised to verify remote stubs and finite geometry without consumer graph import.

Captured pass-through registration identities are labeled by config row order and verified by source review; the tests do not independently distinguish every behaviorally identical callback. Type-only mismatch is a constructed case rather than a separate raw active subscription. These are explicit evaluation limits.

## Blind forward procedure

Give a fresh agent only the source Skill, linked contracts, raw fixture root and seeds/boundaries.json with its Markdown. Exclude expected/, tests, evaluation/review/design documents and generator scripts. Ask it to add only evidence-backed links, preserve existing graphs/identities, retain broker and routing conditions, report unresolved/rejected candidates and validate output. Do not give intended relationships or counts. No target execution, dependency installation, live broker or host environment inspection is allowed.

A blind run produced eleven confirmed links, eight unresolved and thirty-five rejected candidate pairs (including disabled/unregistered leads), without intended-answer access. Shared validation passed. Independent review compared the eleven transfer tuples and source evidence with the authored oracle.

Repeat from the same handoff against a temporary source copy: rename the active orders destination, change workerTwo's route to rejected and move wrongBroker's registration to primary. Keep unrelated values unchanged. The second blind run retained eleven links: the three orders publications lost workerTwo and gained wrongBroker. It updated stale destination/binding evidence, reused eight unchanged edge IDs and added three newly established edge IDs. Both runs passed shared validation; diagnostics changed rather than preserving stale candidates.

## Limits

Small synthetic evaluations do not establish general repository recall or deployed messaging behavior. The source port contract is inspected evidence, not live delivery verification. Review must assess aliases, namespaces, configuration overrides, payload/selector compatibility and real adapter semantics in each target. Unknown runtime values remain unresolved. Schema/semantic validation cannot prove a transfer. No delivery/ordering/exactly-once guarantee, historical identity store, final Markdown generator or Builder integration is added.

See [completion/review record](design/m5-04-review.md). M5-05 is not started.
