# Archive callback

<a id="flow_0ebe141e7ede"></a>
## Archive callback

The active XML subscription selects archiveInvoice. An eligible message can reach this callback in the archive competing group. The callback returns an object with archived set to message.id; it performs no storage write. Live delivery and processing guarantees are outside this inspection.

Evidence: [src_3fc52f6f0bab], [src_2be95f0a1dc4], [src_b8166b47a1ca], [src_e05f7912d484], [src_31e88f0af926].


## Source evidence

[src_3fc52f6f0bab]: ../../../../boot.mjs#L12-L21
[src_2be95f0a1dc4]: ../../../../app/subscription.mjs#L4-L8
[src_b8166b47a1ca]: ../../../../config/transport.xml#L1-L4
[src_e05f7912d484]: ../../../../app/subscription.mjs#L1-L3
[src_31e88f0af926]: ../../../../message-port.md#L5-L9
