# Archive registration detail

<a id="flow_eebb83dd0a13"></a>
## Archive registration detail

Startup calls registerArchive with the shared bus, loaded settings and transport XML. The XML row selects archiveInvoice from the owned handler map. subscribe installs that concrete callback for ledger.saved with invoice.saved routing, InvoiceSaved type and archive group. This setup flow does not execute the callback.

Evidence: [src_3fc52f6f0bab], [src_2be95f0a1dc4], [src_b8166b47a1ca], [src_e3d1ee51d4eb], [src_31e88f0af926].

<a id="node_5fc276bab1d8"></a>
### Subscribe archive callback

The active XML row and handler map bind archiveInvoice. The group competes according to the selected integration contract. No unsubscribe or replacement is configured.

Evidence: [src_2be95f0a1dc4], [src_b8166b47a1ca], [src_e3d1ee51d4eb], [src_762085eda643], [src_31e88f0af926], [src_e6b7e41c878a], [src_c928067b59c5], [src_bc13d322e5b4], [src_5a3dea7ad4e0].


## Source evidence

[src_3fc52f6f0bab]: ../../../../boot.mjs#L12-L21
[src_2be95f0a1dc4]: ../../../../app/subscription.mjs#L4-L8
[src_b8166b47a1ca]: ../../../../config/transport.xml#L1-L4
[src_e3d1ee51d4eb]: ../../../../boot.mjs#L13-L18
[src_31e88f0af926]: ../../../../message-port.md#L5-L9
[src_762085eda643]: ../../../../config/settings.json#L7
[src_e6b7e41c878a]: ../../../../boot.mjs#L2-L6
[src_c928067b59c5]: ../../../../package.json#L1
[src_bc13d322e5b4]: ../../../../boot.mjs#L12
[src_5a3dea7ad4e0]: ../../../../settings.mjs#L1-L6
