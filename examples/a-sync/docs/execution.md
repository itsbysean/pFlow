# Synchronous refresh

Illustrative Python fixtures; dependency bodies and deployment settings are outside scope.

<a id="entry_b285ac74eb27"></a>
## Entry point

The registered `refresh` command activates `run_refresh`. Evidence: [src_65bf5e7a0a3d], [src_9eeed4e44319].

<a id="flow_9a0eb994df17"></a>
## Refresh command

Receive the command and invoke the refresh component. Return its result or propagate its exception. Evidence: [src_9eeed4e44319], [src_e8a62f5a06fa].

<a id="flow_df8ae1187700"></a>
## Refresh component

Called by the refresh command. Invoke `read_state`, then return its result or propagate its exception. Open the [function detail](execution.md#flow_844c0963da42) through the call-site expansion. Evidence: [src_e8a62f5a06fa], [src_1def2254d126].

<a id="flow_844c0963da42"></a>
## Read state

Called by the refresh component. Validate input; when valid, fetch and return state. Invalid input returns immediately. A request exception propagates to the caller. Evidence: [src_ea6916f84f7c], [src_9c29a4625764], [src_35f0bded3992], [src_58fcca3eb0d2].

<a id="node_687dd127f403"></a>
### Validation library

`input_rules.check` is an external library boundary. Its implementation is outside this summary. Evidence: [src_ea6916f84f7c].

<a id="node_b5b0dd797025"></a>
### Input condition

`valid` continues to the state request. `invalid` returns `invalid input` without making the request. Evidence: [src_9c29a4625764].

<a id="node_d1e0f061c044"></a>
### State service

Send a synchronous GET request to `${STATE_URL}/state`. The host is unresolved. Return and exception exits remain in this Flow and in each caller. Evidence: [src_35f0bded3992].

## Source evidence

[src_65bf5e7a0a3d]: ../sources/command.py.txt#L2
[src_9eeed4e44319]: ../sources/command.py.txt#L3-L4
[src_e8a62f5a06fa]: ../sources/component.py.txt#L2-L3
[src_1def2254d126]: ../sources/state.py.txt#L2-L7
[src_ea6916f84f7c]: ../sources/state.py.txt#L3
[src_9c29a4625764]: ../sources/state.py.txt#L4-L5
[src_35f0bded3992]: ../sources/state.py.txt#L6
[src_58fcca3eb0d2]: ../sources/state.py.txt#L7
