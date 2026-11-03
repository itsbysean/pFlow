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

<a id="node_0e7cc113b65d"></a>
### Receive submit command

The registered submit command receives a job and enters the publisher. Publication is the following operation, not evidence that a worker has already processed the job. Evidence: [src_cd50bc1a2640].

<a id="node_baa95457c989"></a>
### Return accepted

Return `accepted` after the synchronous publication acknowledgment. The worker is detached, so this result does not report successful message processing. Evidence: [src_eef0c1c8de4a].

<a id="flow_4b996747ac21"></a>
## Consumer

The configured worker receives a message, writes it to the job store, and returns `processed`. There are no significant conditions in this fixture. Evidence: [src_cb7eb44009b5], [src_4e211161c2b5], [src_3007021966f4].

Broker and store failure handling, delivery order, retries, and guaranteed consumption are not established.

<a id="node_b02d324b90b7"></a>
### Job store

Write the message through `store.write`. The database product and address are unknown. Evidence: [src_3007021966f4].

<a id="node_787c595615f3"></a>
### Receive jobs message

Receive a jobs message through the configured subscription and registered indexer handler. The receiving flow starts here; it is not a synchronous continuation of the submit command. Evidence: [src_cb7eb44009b5], [src_4e211161c2b5].

<a id="node_fae9e45838b8"></a>
### Return processed

Return `processed` after `store.write(message)` finishes in the worker. The fixture does not establish retry, acknowledgment or duplicate-processing behavior. Evidence: [src_3007021966f4].

## Source evidence

[src_54f1fff7e970]: ../sources/publisher.js.txt#L4
[src_cd50bc1a2640]: ../sources/publisher.js.txt#L2
[src_eef0c1c8de4a]: ../sources/publisher.js.txt#L5
[src_cb7eb44009b5]: ../sources/bindings.xml#L2
[src_4e211161c2b5]: ../sources/worker.js.txt#L2
[src_3007021966f4]: ../sources/worker.js.txt#L3-L5
