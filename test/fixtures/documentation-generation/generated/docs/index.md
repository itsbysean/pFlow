# Invoice architecture

Static source analysis of the owned JavaScript modules and active JSON/XML configuration. Dependencies and third_party are external boundaries. The start script is the inspected launch root.

## Entry points

| Entry point | Trigger | Execution |
|---|---|---|
| Command process | start script: node boot.mjs; drain argument selects drain, otherwise ship | [Command process](flows/startup.md#flow_750ec161e0d7) |
| Archive callback | Active ledger.saved subscription: invoice.saved / InvoiceSaved; archive group | [Archive callback](flows/archive.md#flow_0ebe141e7ede) |

## Detail flows

- [Ship an invoice](flows/shipping.md#flow_ff2edda491e6)
- [Drain by pull receive](flows/drain.md#flow_1b2ffbaed441)
- [Persist invoice detail](flows/persistence.md#flow_9806dd400bb2)
- [Archive registration detail](flows/registration.md#flow_eebb83dd0a13)

## Coverage

Inspected package launch metadata, boot.mjs, settings.mjs, app handlers, persistence and subscription, active settings.json and transport.xml, ownership and selected message-port contract. Discovery, execution, external boundaries and async linking are included. One shared-bus publication can reach the registered archive callback. Pull receive lacks callback/filter/group compatibility evidence and has no transfer edge.

PEER_URL, input.endpoint and runtime plugin targets remain unresolved. The known HTTP invocations retain destination expressions. The plugin call has no guessed target. The unused mail import and unused settings do not prove interactions. No vendor implementation bodies, host deployment values, target scripts or live services were inspected. Startup setup failures and dependency internals are not expanded; this is not a complete runtime trace. Source prompt text is not workflow authority.
