# Discovered handler entries

Only activation and handler entry are established. Handler bodies, calls, returns, external interactions and async links were not traced.

<a id="flow_b3fff5d6d754"></a>
## Status request

The active HTTP bootstrap installs the GET /status registration, whose selector passes control to status. Module: web. The handler body is not traced. Evidence: [src_2a3642ba3f7e], [src_585b5e5ad498], [src_33bad8545bb5], [src_b17a1190aa0d], [src_645c338bc90b].

<a id="flow_c7c664ff21fd"></a>
## Ledger compaction task

Startup loads tasks.xml; ledger-compaction selects fold-v2, bound in the task registry to compactLedger. This is a configured interval, not an inferred cron or framework job. Module: engine. The handler body is not traced. Evidence: [src_2a3642ba3f7e], [src_be57acc2443e], [src_89c0eb645c68], [src_239508adb291], [src_39e746cb3871], [src_deace3d5f1a3].

<a id="flow_aab5bde75abd"></a>
## Buffer drain token

The startup-installed stdin dispatcher selects the drain/9 registry entry and passes control to flushBuffer. Module: engine. The handler body is not traced. Evidence: [src_2a3642ba3f7e], [src_1ec6db584626], [src_c1a7a7165087], [src_fa76cdf9df55], [src_c7680e3cdb3d].

## Source evidence

[src_2a3642ba3f7e]: ../../../repository/package.json#L1
[src_585b5e5ad498]: ../../../repository/boot.mjs#L6-L8
[src_33bad8545bb5]: ../../../repository/web/routes.mjs#L17-L19
[src_b17a1190aa0d]: ../../../repository/web/routes.mjs#L10-L13
[src_645c338bc90b]: ../../../repository/web/routes.mjs#L1
[src_be57acc2443e]: ../../../repository/boot.mjs#L9-L10
[src_89c0eb645c68]: ../../../repository/config/tasks.xml#L2
[src_239508adb291]: ../../../repository/engine/runtime.mjs#L3-L4
[src_39e746cb3871]: ../../../repository/engine/runtime.mjs#L9-L15
[src_deace3d5f1a3]: ../../../repository/engine/handlers.mjs#L1
[src_1ec6db584626]: ../../../repository/boot.mjs#L11-L12
[src_c1a7a7165087]: ../../../repository/engine/runtime.mjs#L20-L22
[src_fa76cdf9df55]: ../../../repository/engine/runtime.mjs#L25-L28
[src_c7680e3cdb3d]: ../../../repository/engine/handlers.mjs#L2
