# Custom-task architecture

Illustrative task activation through XML, a custom scheduler, and a handler registry.

## Entry points

| Entry point | Trigger | Execution |
|---|---|---|
| Nightly rollup task | Scheduler registration from XML | [Custom dispatch](execution.md#flow_4131e85f26d2) |

## Detail flows

- [Rollup handler](execution.md#flow_6dc031d9e806)

## Coverage

Schedule timing, missing-key handling, and archive failure behavior are not established.
