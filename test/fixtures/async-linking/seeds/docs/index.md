# Analyzed messaging contexts

Source/configuration evidence covers registered receiving handlers and significant publications. No live deployment, external delivery or unmodeled failure is verified.

- [emit](execution.md#flow_cbe6f5153b38) — CLI default.
- [retry](execution.md#flow_eb6f9dd9d2e0) — CLI retry.
- [workerOne](execution.md#flow_4ad0c5b90470) — Enabled subscription primary/orders, group workers.
- [workerTwo](execution.md#flow_9caa229dc74f) — Enabled subscription primary/orders, group workers.
- [auditTap](execution.md#flow_cb8bb08c6973) — Enabled subscription primary/orders, group audit.
- [receipt](execution.md#flow_8a6b65c8b772) — Enabled subscription primary/audit, group receipts.
- [rejectedOnly](execution.md#flow_1511096ac1a4) — Enabled subscription primary/orders, group rejects.
- [wrongBroker](execution.md#flow_8db1396ab2e4) — Enabled subscription separate/orders, group workers.
- [runtimeConsumer](execution.md#flow_e121783623c1) — Enabled subscription runtimeConsumer/orders, group runtime.
- [runtimeProducer](execution.md#flow_c4da96fde9ca) — CLI runtime.
