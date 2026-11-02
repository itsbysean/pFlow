# Drain by pull receive

<a id="flow_1b2ffbaed441"></a>
## Drain by pull receive

Startup awaits drain only for the drain argument. drain awaits the bus pull receive for ledger.saved and returns its result. There is no local catch. The pull options establish no callback, routing key, message type or group compatibility; no publish-to-drain transfer is added.

Evidence: [src_3fc52f6f0bab], [src_bf1c60e98979], [src_e3d1ee51d4eb], [src_5a3dea7ad4e0], [src_b8166b47a1ca], [src_31e88f0af926].

<a id="node_3e85fb99a1e4"></a>
### Pull ledger.saved message

This is a pull operation on the shared bus, not archive callback registration. Its return value and live delivery remain unverified.

Evidence: [src_bf1c60e98979], [src_e3d1ee51d4eb], [src_762085eda643], [src_5a3dea7ad4e0], [src_b8166b47a1ca], [src_31e88f0af926], [src_e6b7e41c878a], [src_c928067b59c5], [src_bc13d322e5b4].


## Source evidence

[src_3fc52f6f0bab]: ../../../../boot.mjs#L12-L21
[src_bf1c60e98979]: ../../../../app/handlers.mjs#L15-L17
[src_e3d1ee51d4eb]: ../../../../boot.mjs#L13-L18
[src_5a3dea7ad4e0]: ../../../../settings.mjs#L1-L6
[src_b8166b47a1ca]: ../../../../config/transport.xml#L1-L4
[src_31e88f0af926]: ../../../../message-port.md#L5-L9
[src_762085eda643]: ../../../../config/settings.json#L7
[src_e6b7e41c878a]: ../../../../boot.mjs#L2-L6
[src_c928067b59c5]: ../../../../package.json#L1
[src_bc13d322e5b4]: ../../../../boot.mjs#L12
