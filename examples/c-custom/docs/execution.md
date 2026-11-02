# Custom configured task

Illustrative XML and custom-runtime pseudocode; no framework is required.

<a id="entry_614ac3cd60a1"></a>
## Configured entry point

The XML task selects `rollup-v1`. Custom scheduler registration activates dispatch; the registry binds that key to `rollup`. Evidence: [src_32bed10ef9e0], [src_d2d9d64232f1], [src_eae3e0bb6cfb], [src_d346d8984be7].

<a id="flow_4131e85f26d2"></a>
## Custom dispatch

Activate the configured task, resolve its registry key, invoke `rollup`, and return the handler result. Configuration, binding, and lookup establish this path. Evidence: [src_32bed10ef9e0], [src_d2d9d64232f1], [src_eae3e0bb6cfb], [src_d346d8984be7], [src_101537a07182].

<a id="flow_6dc031d9e806"></a>
## Rollup handler

Called by custom dispatch. Compact the archive and return `complete`. Evidence: [src_101537a07182].

No significant conditions are shown. The task name does not establish a schedule time. Missing-key behavior and archive failure handling are unknown.

<a id="node_441a3ec507a6"></a>
### Archive boundary

The archive service performs compaction. Its protocol is not established. Evidence: [src_101537a07182].

## Source evidence

[src_32bed10ef9e0]: ../sources/tasks.xml#L2
[src_d2d9d64232f1]: ../sources/runtime.txt#L2
[src_eae3e0bb6cfb]: ../sources/runtime.txt#L3-L4
[src_d346d8984be7]: ../sources/runtime.txt#L5-L6
[src_101537a07182]: ../sources/handler.txt#L2-L4
