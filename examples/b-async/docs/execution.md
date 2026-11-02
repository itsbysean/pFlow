# Asynchronous job processing

Illustrative JavaScript and XML fixtures. Broker and store implementations are outside scope.

<a id="entry_1a955790e646"></a>
## Submit entry point

The registered `submit` command activates the producer. Evidence: [src_cd50bc1a2640].

<a id="entry_25020255407d"></a>
## Worker entry point

The configured `jobs` subscription activates the registered `indexer` worker. Evidence: [src_cb7eb44009b5], [src_4e211161c2b5].

<a id="flow_9e27be90a054"></a>
## Producer

Publish a job, wait for publish acknowledgment, and return `accepted`. Consumer execution is detached. Evidence: [src_54f1fff7e970], [src_eef0c1c8de4a].

<a id="node_565205c4b6ac"></a>
### Messaging boundary

Publish to broker channel `jobs`. Publish acknowledgment does not mean that processing is complete. Evidence: [src_54f1fff7e970].

<a id="edge_3656a413844b"></a>
### Verified delivery binding

The XML subscription binds channel `jobs` to worker `indexer`. Publisher, subscription, and registration evidence support the async receive edge to the [consumer](execution.md#flow_4b996747ac21). Matching labels alone would not establish delivery. Evidence: [src_54f1fff7e970], [src_cb7eb44009b5], [src_4e211161c2b5].

<a id="flow_4b996747ac21"></a>
## Consumer

The configured worker receives a message, writes it to the job store, and returns `processed`. There are no significant conditions in this fixture. Evidence: [src_cb7eb44009b5], [src_4e211161c2b5], [src_3007021966f4].

Broker and store failure handling, delivery order, retries, and guaranteed consumption are not established.

<a id="node_b02d324b90b7"></a>
### Job store

Write the message through `store.write`. The database product and address are unknown. Evidence: [src_3007021966f4].

## Source evidence

[src_54f1fff7e970]: ../sources/publisher.js.txt#L4
[src_cd50bc1a2640]: ../sources/publisher.js.txt#L2
[src_eef0c1c8de4a]: ../sources/publisher.js.txt#L5
[src_cb7eb44009b5]: ../sources/bindings.xml#L2
[src_4e211161c2b5]: ../sources/worker.js.txt#L2
[src_3007021966f4]: ../sources/worker.js.txt#L3-L5
