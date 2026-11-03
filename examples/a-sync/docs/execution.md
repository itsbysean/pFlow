# Synchronous refresh

Illustrative Python fixtures; dependency bodies and deployment settings are outside scope.

<a id="entry_b285ac74eb27"></a>
## Entry point

The registered `refresh` command activates `run_refresh`. Evidence: [src_65bf5e7a0a3d], [src_9eeed4e44319].

<a id="flow_9a0eb994df17"></a>
## Refresh command

Receive the command and invoke the refresh component. Return its result or propagate its exception. Evidence: [src_9eeed4e44319], [src_e8a62f5a06fa].

<a id="node_352296cd82d5"></a>
### Receive command

The registered refresh command passes its received arguments to `run_refresh`. Registration identifies this start; it does not perform the state request itself. Evidence: [src_9eeed4e44319].

<a id="node_8b15c706f980"></a>
### Invoke refresh component

Call the project-owned refresh component with the command arguments. The command returns its result; an exception continues to the command’s exception exit. Open component detail to inspect the receiving code. Evidence: [src_9eeed4e44319], [src_e8a62f5a06fa].

<a id="node_4810507d3d99"></a>
### Return result

Finish the command by returning the refresh component’s result unchanged. The returned value is established inside the component and its function detail. Evidence: [src_9eeed4e44319].

<a id="node_a750a397fbb6"></a>
### Propagate exception

An exception from the component propagates through the command. The cited command body does not add a retry or recovery handler. Evidence: [src_9eeed4e44319].

<a id="flow_df8ae1187700"></a>
## Refresh component

Called by the refresh command. Invoke `read_state`, then return its result or propagate its exception. Open the [function detail](execution.md#flow_844c0963da42) through the call-site expansion. Evidence: [src_e8a62f5a06fa], [src_1def2254d126].

<a id="node_8a44645d4337"></a>
### Receive execution request

Receive arguments from the command in the refresh component. The component delegates state retrieval to `read_state` rather than implementing validation or HTTP access here. Evidence: [src_e8a62f5a06fa].

<a id="node_a92196d6ef71"></a>
### Invoke read_state

Invoke `read_state` with the received arguments and return its result. Its detail contains input validation and the conditional state-service request. Evidence: [src_e8a62f5a06fa], [src_1def2254d126].

<a id="node_6f458592ca7a"></a>
### Return result

Return the value supplied by `read_state` to the command. This includes the documented invalid-input result or the fetched state. Evidence: [src_e8a62f5a06fa].

<a id="node_f76637525363"></a>
### Propagate exception

Propagate an exception raised by `read_state` to the command. No component-level recovery behavior is shown by this fixture. Evidence: [src_e8a62f5a06fa].

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

<a id="node_61a961f4ac47"></a>
### Return invalid input

When input validation is false, return `invalid input` immediately. This path makes no state-service request. Evidence: [src_9c29a4625764].

<a id="node_3e4fe1d913f7"></a>
### Return state

Return the state produced by the preceding synchronous HTTP request. This exit is reached only after validation and a successful request. Evidence: [src_58fcca3eb0d2].

<a id="node_e9162329f133"></a>
### Propagate request exception

A request exception leaves `read_state` and propagates through its callers. The source explicitly records propagation; no retry policy is established. Evidence: [src_35f0bded3992].

## Source evidence

[src_65bf5e7a0a3d]: ../sources/command.py.txt#L2
[src_9eeed4e44319]: ../sources/command.py.txt#L3-L4
[src_e8a62f5a06fa]: ../sources/component.py.txt#L2-L3
[src_1def2254d126]: ../sources/state.py.txt#L2-L7
[src_ea6916f84f7c]: ../sources/state.py.txt#L3
[src_9c29a4625764]: ../sources/state.py.txt#L4-L5
[src_35f0bded3992]: ../sources/state.py.txt#L6
[src_58fcca3eb0d2]: ../sources/state.py.txt#L7
