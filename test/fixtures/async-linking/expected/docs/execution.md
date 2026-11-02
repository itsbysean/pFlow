# Messaging execution handoff

These are existing execution contexts. Independently registered consumers do not alone prove delivery. Link analysis must retain broker and routing constraints.

<a id="flow_cbe6f5153b38"></a>
## emit

CLI default invokes emit. Await publication to orders. If input.audit, await publication to receipts; otherwise skip it. Then return. External failures are unmodeled. Evidence: [src_6c8a8f87fbd8], [src_207d2e80db4c], [src_69413e2258b8], [src_cbe6f5153b38], [src_ce5763e58f11], [src_debd90d09631], [src_7208821376ea], [src_8337fdd3dada].

<a id="flow_eb6f9dd9d2e0"></a>
## retry

CLI retry invokes retry and awaits orders publication before returning. External failures are unmodeled. Evidence: [src_6c8a8f87fbd8], [src_207d2e80db4c], [src_69413e2258b8], [src_eb6f9dd9d2e0], [src_00f615880573], [src_debd90d09631], [src_7208821376ea].

<a id="flow_4ad0c5b90470"></a>
## workerOne

Active workers subscription invokes workerOne. Await a receipts publication through the primary client, then return. External failures remain unmodeled. Evidence: [src_6c8a8f87fbd8], [src_207d2e80db4c], [src_69413e2258b8], [src_4ad0c5b90470], [src_b8d7c054f7c7], [src_cdf5c5e6f7a8], [src_7208821376ea], [src_debd90d09631], [src_323c450255d5].

<a id="flow_9caa229dc74f"></a>
## workerTwo

The enabled subscription selects this handler under its configured broker, destination, route, type and group. It returns the supplied message without further significant calls; runtime outcomes remain unverified. Evidence: [src_6c8a8f87fbd8], [src_207d2e80db4c], [src_69413e2258b8], [src_9caa229dc74f], [src_b8d7c054f7c7], [src_35491b9f975b], [src_7208821376ea], [src_debd90d09631].

<a id="flow_cb8bb08c6973"></a>
## auditTap

The enabled subscription selects this handler under its configured broker, destination, route, type and group. It returns the supplied message without further significant calls; runtime outcomes remain unverified. Evidence: [src_6c8a8f87fbd8], [src_207d2e80db4c], [src_69413e2258b8], [src_cb8bb08c6973], [src_b8d7c054f7c7], [src_5e62bdfebed0], [src_7208821376ea], [src_debd90d09631].

<a id="flow_8a6b65c8b772"></a>
## receipt

Active receipts subscription invokes receipt. Only when message.replay, await orders publication; then return. This permits an event cycle without a completion or delivery guarantee. Evidence: [src_6c8a8f87fbd8], [src_207d2e80db4c], [src_69413e2258b8], [src_8a6b65c8b772], [src_b8d7c054f7c7], [src_d7bb1f107a82], [src_7208821376ea], [src_debd90d09631], [src_1b3ea6da9678].

<a id="flow_1511096ac1a4"></a>
## rejectedOnly

The enabled subscription selects this handler under its configured broker, destination, route, type and group. It returns the supplied message without further significant calls; runtime outcomes remain unverified. Evidence: [src_6c8a8f87fbd8], [src_207d2e80db4c], [src_69413e2258b8], [src_1511096ac1a4], [src_b8d7c054f7c7], [src_f25a62e5bb5e], [src_7208821376ea], [src_debd90d09631].

<a id="flow_8db1396ab2e4"></a>
## wrongBroker

The enabled subscription selects this handler under its configured broker, destination, route, type and group. It returns the supplied message without further significant calls; runtime outcomes remain unverified. Evidence: [src_6c8a8f87fbd8], [src_207d2e80db4c], [src_69413e2258b8], [src_8db1396ab2e4], [src_b8d7c054f7c7], [src_712d2221849b], [src_f92222fa5ded], [src_debd90d09631].

<a id="flow_e121783623c1"></a>
## runtimeConsumer

The enabled subscription selects this handler under its configured broker, destination, route, type and group. It returns the supplied message without further significant calls; runtime outcomes remain unverified. Evidence: [src_6c8a8f87fbd8], [src_207d2e80db4c], [src_69413e2258b8], [src_e121783623c1], [src_b8d7c054f7c7], [src_178b5a67faee], [src_e9cedc72efc5], [src_debd90d09631].

<a id="flow_c4da96fde9ca"></a>
## runtimeProducer

CLI runtime invokes runtimeProducer through an independently runtime-configured client. Await orders publication and return; endpoint and external outcomes remain unknown. Evidence: [src_6c8a8f87fbd8], [src_207d2e80db4c], [src_69413e2258b8], [src_c4da96fde9ca], [src_0e172ef5aa4f], [src_debd90d09631], [src_4d9a691d3ada].

## Source evidence

[src_207d2e80db4c]: ../../repository/package.json#L1
[src_6c8a8f87fbd8]: ../../repository/boot.mjs#L1-L11
[src_69413e2258b8]: ../../repository/message-port.md#L3-L11
[src_b8d7c054f7c7]: ../../repository/app/register.mjs#L1-L7
[src_7208821376ea]: ../../repository/config/routes.json#L3
[src_f92222fa5ded]: ../../repository/config/routes.json#L4
[src_4d9a691d3ada]: ../../repository/config/routes.json#L5
[src_e9cedc72efc5]: ../../repository/config/routes.json#L6
[src_debd90d09631]: ../../repository/config/routes.json#L8
[src_cdf5c5e6f7a8]: ../../repository/config/routes.json#L10
[src_35491b9f975b]: ../../repository/config/routes.json#L11
[src_5e62bdfebed0]: ../../repository/config/routes.json#L12
[src_d7bb1f107a82]: ../../repository/config/routes.json#L13
[src_f25a62e5bb5e]: ../../repository/config/routes.json#L14
[src_712d2221849b]: ../../repository/config/routes.json#L15
[src_178b5a67faee]: ../../repository/config/routes.json#L16
[src_cbe6f5153b38]: ../../repository/app/handlers.mjs#L1-L4
[src_eb6f9dd9d2e0]: ../../repository/app/handlers.mjs#L5-L7
[src_4ad0c5b90470]: ../../repository/app/handlers.mjs#L8-L10
[src_9caa229dc74f]: ../../repository/app/handlers.mjs#L11
[src_cb8bb08c6973]: ../../repository/app/handlers.mjs#L12
[src_8a6b65c8b772]: ../../repository/app/handlers.mjs#L13-L15
[src_1511096ac1a4]: ../../repository/app/handlers.mjs#L16
[src_8db1396ab2e4]: ../../repository/app/handlers.mjs#L17
[src_e121783623c1]: ../../repository/app/handlers.mjs#L18
[src_c4da96fde9ca]: ../../repository/app/handlers.mjs#L21-L23
[src_ce5763e58f11]: ../../repository/app/handlers.mjs#L2
[src_8337fdd3dada]: ../../repository/app/handlers.mjs#L3
[src_00f615880573]: ../../repository/app/handlers.mjs#L6
[src_323c450255d5]: ../../repository/app/handlers.mjs#L9
[src_1b3ea6da9678]: ../../repository/app/handlers.mjs#L14
[src_0e172ef5aa4f]: ../../repository/app/handlers.mjs#L22
