# Refresh architecture

Illustrative synchronous command with reusable component and function detail.

## Entry points

| Entry point | Trigger | Execution |
|---|---|---|
| Refresh command | Registered command `refresh` | [Refresh command](execution.md#flow_9a0eb994df17) |

## Detail flows

- [Refresh component](execution.md#flow_df8ae1187700)
- [Read state](execution.md#flow_844c0963da42)

## Coverage

The command and component retain their own return paths. Dependency internals and the state-service host are not established.
