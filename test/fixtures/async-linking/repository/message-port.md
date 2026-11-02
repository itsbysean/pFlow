# Selected message-fabric adapter contract

The project owns boot.mjs, app/ and config/. message-fabric is non-owned. This checked-in integration specification defines the selected adapter's public routing contract; it is not an implementation to traverse or execute.

A connect call selects a routing domain by its exact endpoint and namespace. Configured distinct literal endpoints are isolated domains in this fixture. Destination names are exact and scoped to that domain. No aliases or deployment overrides are configured. Independent endpointEnv values remain unresolved; using the same environment key does not prove independent clients select one domain.

publish sends an envelope with destination, route, type and payload. subscribe registers a concrete callback. A publication is eligible for a subscription only when domain, destination, route and type match exactly. Payload is passed through unchanged; the adapter performs no type-name conversion. Both sides use these envelopes without another codec or payload selector. Missing configuration is not a wildcard.

Within each matching domain/destination/route/type, subscriptions with the same group compete: any one eligible member can process a message, never a promise to every member. Distinct groups are independent possible recipients. This contract establishes eligibility, not successful delivery, processing, ordering, retries or exactly-once behavior. Awaiting publication does not wait for a consumer's completion.

Registration remains active for the process lifetime: this fixture has no unsubscribe/replacement path. Runtime deployment and external outcomes are unverified. Do not install the fictitious dependency or execute boot.mjs.
