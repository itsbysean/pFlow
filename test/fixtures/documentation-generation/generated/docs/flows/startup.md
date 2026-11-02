# Process startup and command selection

<a id="flow_750ec161e0d7"></a>
## Process startup and command selection

The start script launches boot.mjs. Startup loads JSON and XML, binds clients, installs archive registration, parses the command input, then awaits drain for the drain argument or ship otherwise. These callees retain their own exits. Malformed JSON/XML, failed client creation and failed file reads are not expanded. No services were run.

Evidence: [src_c928067b59c5], [src_3fc52f6f0bab], [src_5a3dea7ad4e0], [src_e3d1ee51d4eb].

<a id="node_96c5e5625ebf"></a>
### Read and load JSON/XML settings

Two configuration reads feed loadSettings. JSON values are combined with XML topic/protocol and the PEER_URL environment key. A third XML read supplies registration. The current host environment is not deployment evidence.

Evidence: [src_3fc52f6f0bab], [src_5a3dea7ad4e0].

<a id="node_e97fd383987e"></a>
### Create bound dependency clients

The single bus instance uses the configured URL and namespace. The HTTP client, database, object client and signer are non-owned. runtimePlugins supplies an external registry; its entries are absent here. Factory internals are outside scope.

Evidence: [src_e3d1ee51d4eb], [src_5c1aee5bbfc3], [src_762085eda643], [src_5b0f441a3a99], [src_bc13d322e5b4], [src_5a3dea7ad4e0].

<a id="node_e13ae3096380"></a>
### Is command drain?

Only the drain command selects drain; all other command values select ship. JSON input parsing occurs before this selection.

Evidence: [src_3fc52f6f0bab].


## Source evidence

[src_c928067b59c5]: ../../../../package.json#L1
[src_3fc52f6f0bab]: ../../../../boot.mjs#L12-L21
[src_5a3dea7ad4e0]: ../../../../settings.mjs#L1-L6
[src_e3d1ee51d4eb]: ../../../../boot.mjs#L13-L18
[src_5c1aee5bbfc3]: ../../../../config/settings.json#L3-L4
[src_762085eda643]: ../../../../config/settings.json#L7
[src_5b0f441a3a99]: ../../../../config/settings.json#L5-L6
[src_bc13d322e5b4]: ../../../../boot.mjs#L12
