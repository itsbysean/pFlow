# python discovery evaluation

Owned code and launch surfaces were inspected in the small authored fixture. These results cover domain handlers only; process bootstrap is reported as reachability evidence.

| Entry | Mechanism | Module |
|---|---|---|
| [Dial signal callback](entry-points.md#flow_3ebca5ae03e6) | stdin signal/7 token | project-owned launch/loop/worker |

## Unresolved and excluded leads

Excluded within inspected launch scope: HttpController_onRequest is not bound by main; its name does not prove HTTP activation. Evidence: [src_9e016ea66e2a], [src_d0f8d2e2a660].

## Coverage

The supplied launch/configuration/registration surfaces were inspected. Runtime overrides remain unknown. Framework/dependency internals and downstream handler execution are outside this evaluation. No claim of whole-program completeness is made.

## Source evidence

[src_d0f8d2e2a660]: ../../../python-repository/launch.py#L5-L8
[src_9e016ea66e2a]: ../../../python-repository/worker.py#L4-L5
