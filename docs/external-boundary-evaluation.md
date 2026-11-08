# External boundary evaluation

M5-03 is an AI analysis stage, not a deterministic repository scanner. The source Skill is [pflow-external-boundaries](../src/skills/pflow-external-boundaries/SKILL.md). It consumes a confirmed M5-02 bundle and actual source root. Existing M1 contracts remain unchanged.

## Fixtures and checks

[test/fixtures/boundaries](../test/fixtures/boundaries/) contains small authored source repositories, analyzed seeds and enriched oracles. The oracle files use boundaries.json to keep them outside default Builder artifact discovery. The fixture packages describe non-owned APIs; do not install their dependencies or execute boot.mjs or third-party implementations.

| Scenario | Required evidence and rejection |
|---|---|
| Static HTTP | Invocation, startup binding, selected JSON config, loader and response guard; POST URL, timeout and retry inputs. No runtime retry guarantee. |
| Environment HTTP | GET uses PEER_URL plus /status; preserve the key/template, never the test environment as deployment evidence. |
| Runtime destination | GET uses input.endpoint; keep the expression, omit a resolved URL. |
| Database | Called SQL and active table mapping establish acct_items. Separate BEGIN/INSERT/COMMIT/ROLLBACK occurrences; configured sqlite driver is not live server verification. |
| Messaging | Invoked publish/receive and selected XML establish amqp and ledger.saved. BROKER_URL remains a key. Routing/message fields belong to publication. No producer–consumer edge. |
| Object SDK | Called putObject, bound client and configuration establish bucket/region/key expression. Do not infer a vendor or endpoint. |
| Library stop | Bound seal-kit sign call uses compact format. Stop at the API; do not read its implementation or invent network activity. |
| Misleading leads | Unused mail import, unused URL/table/topic and third-party implementation endpoints add no boundaries. |
| Python filesystem | Path.read_text uses REPORT_PATH and UTF-8. Preserve the key; do not claim an actual file exists or a read succeeds. |

Run `node --test test/external-boundary-evaluation.test.mjs`. Tests validate seeds/oracles through shared schema, semantic and Markdown checks. They preserve all entries, Flow starts, nodes, edges and existing evidence identities. Controlled recording ports execute only owned pure callers and the settings loader, not startup or vendor implementations. Tests compare actual argument values/order, the billing rejection and database rollback with the authored graph. A missing table witness is rejected separately from structural validation. These fixture checks are not a general metadata validator or proof of AI accuracy.

## Blind forward procedure

Give a fresh agent the source Skill, linked contracts, raw source root and seeds/LANGUAGE/analyzed.json plus its Markdown. Exclude expected/, tests, design/review reports and prior answers. Ask it to produce an M1 bundle and matching Markdown in a temporary directory, retaining established identities and relationships. Do not supply oracle attributes or destination answers. It must not execute target code, inspect current host environment, read vendor bodies, contact infrastructure or link producer/consumer Flows. Validate its output with validateDocumentation against its output docs and the actual source root, then independently inspect source meaning.

Repeat against a temporary copy with active configuration changed while unused values remain unchanged. Change the billing origin to https://billing-next.example.invalid/ (trailing slash), table mapping to invoice_audit and XML topic to ledger.revised. The caller performs literal concatenation, so the resulting request URL must retain the double slash. Reevaluate both messaging operations without linking them.

The recorded runs enriched 11 JavaScript boundaries and one Python boundary. Both original runs and the changed-config run passed shared validation with zero errors. The changed run followed all three active changes, including the double slash. Outputs were produced without oracle/test access; temporary outputs are not distribution artifacts. See [review record](design/m5-03-review.md).

## Limits

Small synthetic repositories cover selected evidence chains, not general language/framework recall or production integration. Source/metadata truth requires review; the shared validators do not prove it. Attribute keys remain namespaced and open, so equivalent analysts can choose different keys. No new key registry, per-field evidence schema, target runtime validation or persistent identity engine is introduced. Configuration expressions and deployment values remain unresolved when evidence cannot establish them. M5-04 linking is outside this evaluation.
