# Baseline flows

<a id="flow_6daded7ae701"></a>
## alpha

CLI selection invokes the shared function detail and returns its result. Dependency failure paths are unmodeled; the finite event cycle promises no delivery or termination. Evidence: [src_6daded7ae701].

<a id="flow_e8a0c4059ae6"></a>
## beta

CLI selection invokes the shared function detail and returns its result. Dependency failure paths are unmodeled; the finite event cycle promises no delivery or termination. Evidence: [src_e8a0c4059ae6].

<a id="flow_d814e61191d1"></a>
## shared

Direct callers or the registered relay callback enter processRecord. Await a jobs publication and return input. The configured jobs callback is an async possibility. Dependency failure paths are unmodeled; the finite event cycle promises no delivery or termination. Evidence: [src_d814e61191d1], [src_612d754ef27e], [src_4ddb4d12e6e6], [src_71f7c4e13703], [src_25caa77b46f4].

<a id="flow_9f3625e6d230"></a>
## consumer

Registered jobs callback enters consume. Await relay publication and return the message. The configured relay callback is an async possibility. Dependency failure paths are unmodeled; the finite event cycle promises no delivery or termination. Evidence: [src_9f3625e6d230], [src_612d754ef27e], [src_4ddb4d12e6e6], [src_71f7c4e13703], [src_25caa77b46f4].

<a id="flow_010761f5e0b5"></a>
## unrelated

The alternate CLI selection returns its input without invoking shared detail. Dependency failure paths are unmodeled; the finite event cycle promises no delivery or termination. Evidence: [src_010761f5e0b5].

## Source evidence

[src_6daded7ae701]: ../../entries.mjs#L1-L2
[src_e8a0c4059ae6]: ../../entries.mjs#L1-L3
[src_010761f5e0b5]: ../../entries.mjs#L4
[src_d814e61191d1]: ../../shared.mjs#L3-L6
[src_9f3625e6d230]: ../../consumer.mjs#L1-L4
[src_612d754ef27e]: ../../config/publish.json#L1
[src_4ddb4d12e6e6]: ../../config/subscriptions.json#L1
[src_71f7c4e13703]: ../../boot.mjs#L1-L14
[src_25caa77b46f4]: ../../message-port.md#L3
