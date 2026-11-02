# External invocation boundaries

Configured values describe caller inputs, not live service guarantees. Environment values, runtime destinations and external outcomes remain unknown. No producer/consumer link is established. Unmodeled external failures remain outside this handoff.

<a id="flow_86e533f27463"></a>
## Ship invoice

CLI startup invokes ship unless the action is drain. Await billing; status >= 400 throws before downstream calls. Otherwise await the environment-based peer request, open owned persistence detail, await publication and object storage, sign, then await the runtime-destination request and return its signature. Evidence: [src_3974bdf10af3], [src_2f0b2166ded0], [src_431b24774cdf], [src_767bdca92f20], [src_841afc5f3e77], [src_4f43cf5b58b8], [src_6e77bac3dce5], [src_da58dbdebcb6], [src_7fab64aecaa3], [src_1a08070b10c1], [src_415e0e97127f], [src_623954d5f119], [src_8f600b3cb06a], [src_d881f98f570c], [src_99e42a8a1430], [src_05872b2715c1], [src_10ce4554ba7f], [src_d63b5dd688c4], [src_fafc28b8880b], [src_fdb80eeb1b59].

<a id="node_4a5f17222e7a"></a>
### Await billing request

http boundary. library.name: `wire-http`; library.symbol: `request`; http.method: `POST`; http.url: `https://billing.example.invalid/v1/items`; http.baseUrl: `https://billing.example.invalid`; http.path: `/v1/items`; http.timeoutMs: `900`; http.retries: `2`; http.errorRule: `response status >= 400`. Evidence: [src_841afc5f3e77], [src_2f0b2166ded0], [src_3974bdf10af3], [src_4f43cf5b58b8], [src_6e77bac3dce5], [src_da58dbdebcb6], [src_7fab64aecaa3].

<a id="node_12798bfc1e35"></a>
### Await peer request

http boundary. library.name: `wire-http`; library.symbol: `request`; http.method: `GET`; http.baseUrlEnv: `PEER_URL`; http.urlTemplate: `${PEER_URL}/status`. Evidence: [src_1a08070b10c1], [src_2f0b2166ded0], [src_3974bdf10af3], [src_4f43cf5b58b8], [src_7fab64aecaa3].

<a id="node_e44e296cfaee"></a>
### Publish invoice event

messaging boundary. library.name: `parcel-bus`; library.symbol: `publish`; messaging.protocol: `amqp`; messaging.operation: `publish`; messaging.channel: `ledger.saved`; messaging.brokerUrlEnv: `BROKER_URL`; messaging.routingKey: `invoice.saved`; messaging.messageType: `InvoiceSaved`. Evidence: [src_8f600b3cb06a], [src_2f0b2166ded0], [src_3974bdf10af3], [src_4f43cf5b58b8], [src_d881f98f570c], [src_7fab64aecaa3].

<a id="node_c1d632d804c4"></a>
### Put archive object

other boundary. library.name: `cloud-objects`; library.symbol: `putObject`; system.type: `object-storage`; storage.operation: `putObject`; storage.bucket: `invoice-archive`; storage.region: `region-one`; storage.keyExpression: `input.id`. Evidence: [src_99e42a8a1430], [src_2f0b2166ded0], [src_3974bdf10af3], [src_4f43cf5b58b8], [src_05872b2715c1], [src_7fab64aecaa3].

<a id="node_a3d0a67c11bc"></a>
### Sign invoice

library boundary. library.name: `seal-kit`; library.symbol: `sign`; library.format: `compact`. Evidence: [src_10ce4554ba7f], [src_2f0b2166ded0], [src_3974bdf10af3], [src_4f43cf5b58b8], [src_d63b5dd688c4], [src_7fab64aecaa3].

<a id="node_c2fbda9e4eb1"></a>
### Request input-provided destination

http boundary. library.name: `wire-http`; library.symbol: `request`; http.method: `GET`; http.urlExpression: `input.endpoint`. Evidence: [src_fafc28b8880b], [src_2f0b2166ded0], [src_3974bdf10af3], [src_7fab64aecaa3].

<a id="flow_d50d43f1cd4f"></a>
## Persist invoice transaction

The owned persistInvoice call awaits BEGIN, mapped INSERT and COMMIT before returning. INSERT or COMMIT failure awaits ROLLBACK and then rethrows the original error only if rollback completes. Evidence: [src_623954d5f119], [src_8555d77003bf], [src_2f0b2166ded0], [src_3974bdf10af3], [src_4f43cf5b58b8], [src_b29be286e76e], [src_7fab64aecaa3], [src_f444eee89ff5], [src_9162b1bd2103], [src_ec2735e31dad], [src_cfac07212562].

<a id="node_9e2169070a05"></a>
### Begin transaction

database boundary. library.name: `ledger-store`; library.symbol: `exec`; database.driver: `sqlite`; database.operation: `BEGIN`. Evidence: [src_8555d77003bf], [src_2f0b2166ded0], [src_3974bdf10af3], [src_4f43cf5b58b8], [src_b29be286e76e], [src_7fab64aecaa3].

<a id="node_b2b5552943b7"></a>
### Execute mapped insert

database boundary. library.name: `ledger-store`; library.symbol: `exec`; database.driver: `sqlite`; database.operation: `INSERT`; database.table: `acct_items`. Evidence: [src_f444eee89ff5], [src_2f0b2166ded0], [src_3974bdf10af3], [src_4f43cf5b58b8], [src_b29be286e76e], [src_9162b1bd2103], [src_7fab64aecaa3].

<a id="node_c4637fe6a5b0"></a>
### Commit transaction

database boundary. library.name: `ledger-store`; library.symbol: `exec`; database.driver: `sqlite`; database.operation: `COMMIT`. Evidence: [src_ec2735e31dad], [src_2f0b2166ded0], [src_3974bdf10af3], [src_4f43cf5b58b8], [src_b29be286e76e], [src_7fab64aecaa3].

<a id="node_811c20083dcc"></a>
### Rollback transaction after failure

database boundary. library.name: `ledger-store`; library.symbol: `exec`; database.driver: `sqlite`; database.operation: `ROLLBACK`. Evidence: [src_cfac07212562], [src_2f0b2166ded0], [src_3974bdf10af3], [src_4f43cf5b58b8], [src_b29be286e76e], [src_7fab64aecaa3].

<a id="flow_d445bdf2fa71"></a>
## Drain configured channel

The CLI drain action calls drain, awaits receive on the configured channel and returns its result. It does not establish a producer relationship. Evidence: [src_3974bdf10af3], [src_2f0b2166ded0], [src_7f55d69338f2], [src_148369f1e624], [src_4f43cf5b58b8], [src_d881f98f570c], [src_7fab64aecaa3].

<a id="node_221367b29eab"></a>
### Receive configured message

messaging boundary. library.name: `parcel-bus`; library.symbol: `receive`; messaging.protocol: `amqp`; messaging.operation: `receive`; messaging.channel: `ledger.saved`; messaging.brokerUrlEnv: `BROKER_URL`. Evidence: [src_148369f1e624], [src_2f0b2166ded0], [src_3974bdf10af3], [src_4f43cf5b58b8], [src_d881f98f570c], [src_7fab64aecaa3].

## Source evidence

[src_3974bdf10af3]: ../../../repository/package.json#L1
[src_2f0b2166ded0]: ../../../repository/boot.mjs#L11-L19
[src_431b24774cdf]: ../../../repository/OWNERSHIP.md#L3
[src_767bdca92f20]: ../../../repository/app/handlers.mjs#L3
[src_841afc5f3e77]: ../../../repository/app/handlers.mjs#L4
[src_da58dbdebcb6]: ../../../repository/app/handlers.mjs#L5
[src_1a08070b10c1]: ../../../repository/app/handlers.mjs#L6
[src_415e0e97127f]: ../../../repository/app/handlers.mjs#L7
[src_8f600b3cb06a]: ../../../repository/app/handlers.mjs#L8
[src_99e42a8a1430]: ../../../repository/app/handlers.mjs#L9
[src_10ce4554ba7f]: ../../../repository/app/handlers.mjs#L10
[src_fafc28b8880b]: ../../../repository/app/handlers.mjs#L11
[src_fdb80eeb1b59]: ../../../repository/app/handlers.mjs#L12
[src_7f55d69338f2]: ../../../repository/app/handlers.mjs#L14
[src_148369f1e624]: ../../../repository/app/handlers.mjs#L15
[src_623954d5f119]: ../../../repository/app/persist.mjs#L1
[src_8555d77003bf]: ../../../repository/app/persist.mjs#L2
[src_f444eee89ff5]: ../../../repository/app/persist.mjs#L4
[src_ec2735e31dad]: ../../../repository/app/persist.mjs#L5
[src_cfac07212562]: ../../../repository/app/persist.mjs#L6-L8
[src_7fab64aecaa3]: ../../../repository/boot.mjs#L2-L6
[src_4f43cf5b58b8]: ../../../repository/settings.mjs#L1-L5
[src_6e77bac3dce5]: ../../../repository/config/settings.json#L2
[src_b29be286e76e]: ../../../repository/config/settings.json#L3
[src_9162b1bd2103]: ../../../repository/config/settings.json#L4
[src_05872b2715c1]: ../../../repository/config/settings.json#L5
[src_d63b5dd688c4]: ../../../repository/config/settings.json#L6
[src_d881f98f570c]: ../../../repository/config/transport.xml#L1-L2
