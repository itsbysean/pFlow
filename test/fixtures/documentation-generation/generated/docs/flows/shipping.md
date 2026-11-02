# Ship an invoice

<a id="flow_ff2edda491e6"></a>
## Ship an invoice

Startup calls ship for every command other than drain. It awaits billing, checks the response, awaits peer status and persistence, publishes the event, writes the object, signs the input, then selects a plugin or a final HTTP request. Awaited local operations wait for completion; publication does not wait for archive processing. There is no catch in ship. Unhandled dependency failures propagate; only the explicit billing rejection and persistence propagation are drawn.

Evidence: [src_3fc52f6f0bab], [src_4206f2208fd8], [src_cda0ebe3e019], [src_f15faa2be590], [src_977c92b5b55d], [src_55e7e5157281], [src_50bf0dee9ed4], [src_134649cc129b], [src_58a5758d39ec].

<a id="node_cf9ef68432e0"></a>
### POST billing items

POST uses the composed billing URL, timeoutMs 900, retries 2 and billing-ledger tag. These are supplied options, not verified retry or timing guarantees.

Evidence: [src_4206f2208fd8], [src_9e7c8fa7c276], [src_e3d1ee51d4eb], [src_e6b7e41c878a], [src_c928067b59c5], [src_bc13d322e5b4], [src_5a3dea7ad4e0].

<a id="node_48cb28ddf84e"></a>
### Billing status at least 400?

A response status of at least 400 throws billing rejected. A lower status permits the peer request.

Evidence: [src_4206f2208fd8].

<a id="node_bcd42383a0ef"></a>
### GET peer status

The destination uses PEER_URL plus /status. No deployment value or fallback is supplied.

Evidence: [src_cda0ebe3e019], [src_5a3dea7ad4e0], [src_e3d1ee51d4eb], [src_e6b7e41c878a], [src_c928067b59c5].

<a id="node_926798dab987"></a>
### Publish InvoiceSaved

The awaited publication uses ledger.saved, invoice.saved and InvoiceSaved on the shared accounting bus. Matching archive registration is eligible as a competing group member. Delivery and consumer completion are not guaranteed.

Evidence: [src_977c92b5b55d], [src_e3d1ee51d4eb], [src_5a3dea7ad4e0], [src_762085eda643], [src_b8166b47a1ca], [src_31e88f0af926], [src_e6b7e41c878a], [src_c928067b59c5], [src_bc13d322e5b4], [src_2be95f0a1dc4], [src_e05f7912d484].

<a id="node_8963b8c3470a"></a>
### Put invoice object

The object write uses invoice-archive in region-one. The input id supplies the key and the input supplies the body. No cloud vendor or durability guarantee is established.

Evidence: [src_55e7e5157281], [src_5b0f441a3a99], [src_e3d1ee51d4eb], [src_e6b7e41c878a], [src_c928067b59c5], [src_bc13d322e5b4], [src_5a3dea7ad4e0].

<a id="node_f7b2b3ec3924"></a>
### Sign input

The non-owned signer receives compact format. No algorithm or key provenance is established; its body is outside scope.

Evidence: [src_50bf0dee9ed4], [src_5b0f441a3a99], [src_e3d1ee51d4eb], [src_e6b7e41c878a], [src_c928067b59c5], [src_bc13d322e5b4], [src_5a3dea7ad4e0].

<a id="node_44938a406eb3"></a>
### Is input.plugin truthy?

A truthy plugin selector returns the runtime registry call. Otherwise ship requests input.endpoint and returns the signature.

Evidence: [src_134649cc129b].

<a id="node_72b6b46e7b9f"></a>
### Invoke runtime-selected plugin

The runtimePlugins registry is externally populated. No concrete target or plugin edges can be established. The direct return is an early exit from ship; plugin completion and failures remain unknown.

Evidence: [src_134649cc129b], [src_e3d1ee51d4eb], [src_31e88f0af926].

<a id="node_1133c8095b8d"></a>
### GET input endpoint

The GET URL is input.endpoint. Its destination is unresolved while the invoked HTTP client is known.

Evidence: [src_58a5758d39ec], [src_e3d1ee51d4eb], [src_e6b7e41c878a], [src_c928067b59c5].


## Source evidence

[src_3fc52f6f0bab]: ../../../../boot.mjs#L12-L21
[src_4206f2208fd8]: ../../../../app/handlers.mjs#L3-L5
[src_cda0ebe3e019]: ../../../../app/handlers.mjs#L6
[src_f15faa2be590]: ../../../../app/handlers.mjs#L7
[src_977c92b5b55d]: ../../../../app/handlers.mjs#L8
[src_55e7e5157281]: ../../../../app/handlers.mjs#L9
[src_50bf0dee9ed4]: ../../../../app/handlers.mjs#L10
[src_134649cc129b]: ../../../../app/handlers.mjs#L11
[src_58a5758d39ec]: ../../../../app/handlers.mjs#L12-L13
[src_9e7c8fa7c276]: ../../../../config/settings.json#L2
[src_e3d1ee51d4eb]: ../../../../boot.mjs#L13-L18
[src_e6b7e41c878a]: ../../../../boot.mjs#L2-L6
[src_c928067b59c5]: ../../../../package.json#L1
[src_bc13d322e5b4]: ../../../../boot.mjs#L12
[src_5a3dea7ad4e0]: ../../../../settings.mjs#L1-L6
[src_762085eda643]: ../../../../config/settings.json#L7
[src_b8166b47a1ca]: ../../../../config/transport.xml#L1-L4
[src_31e88f0af926]: ../../../../message-port.md#L5-L9
[src_2be95f0a1dc4]: ../../../../app/subscription.mjs#L4-L8
[src_e05f7912d484]: ../../../../app/subscription.mjs#L1-L3
[src_5b0f441a3a99]: ../../../../config/settings.json#L5-L6
