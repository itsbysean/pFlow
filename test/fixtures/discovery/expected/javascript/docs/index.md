# javascript discovery evaluation

Owned code and launch surfaces were inspected in the small authored fixture. These results cover domain handlers only; process bootstrap is reported as reachability evidence.

| Entry | Mechanism | Module |
|---|---|---|
| [Status request](entry-points.md#flow_b3fff5d6d754) | HTTP GET /status | web |
| [Ledger compaction task](entry-points.md#flow_c7c664ff21fd) | Configured ledger-compaction task every 60000 ms | engine |
| [Buffer drain token](entry-points.md#flow_aab5bde75abd) | stdin activation token drain/9 | engine |

## Unresolved and excluded leads

Unresolved: runtime-site-task selects TASK_TARGET from the runtime environment. No supplied value establishes its receiver; it is not a confirmed entry. Evidence: [src_ba65c69115f1], [src_39e746cb3871], [src_be57acc2443e].

Excluded within inspected launch scope: AdminController_handleRequest has a route-like annotation/name but is not installed in the active router. Evidence: [src_ebb873a57c1d], [src_33bad8545bb5].

Excluded within inspected registry scope: onScheduledTask is declared but not bound by configureJobs. Evidence: [src_544274531e02], [src_239508adb291].

## Coverage

The supplied launch/configuration/registration surfaces were inspected. Runtime overrides remain unknown. Framework/dependency internals and downstream handler execution are outside this evaluation. No claim of whole-program completeness is made.

## Source evidence

[src_33bad8545bb5]: ../../../repository/web/routes.mjs#L17-L19
[src_be57acc2443e]: ../../../repository/boot.mjs#L9-L10
[src_239508adb291]: ../../../repository/engine/runtime.mjs#L3-L4
[src_39e746cb3871]: ../../../repository/engine/runtime.mjs#L9-L15
[src_ba65c69115f1]: ../../../repository/config/tasks.xml#L3
[src_ebb873a57c1d]: ../../../repository/web/routes.mjs#L3-L4
[src_544274531e02]: ../../../repository/engine/handlers.mjs#L3
