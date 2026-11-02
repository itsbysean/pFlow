# Discovered handler entries

Only activation and handler entry are established. Handler bodies, calls, returns, external interactions and async links were not traced.

<a id="flow_3ebca5ae03e6"></a>
## Dial signal callback

The installed watch-dials command invokes main, which binds signal/7 to rotate and delivers stdin tokens through the registry. Module: project-owned launch/loop/worker. The handler body is not traced. Evidence: [src_cb974f03c132], [src_d0f8d2e2a660], [src_f62c82af09fa], [src_dd80e92231ab].

## Source evidence

[src_cb974f03c132]: ../../../python-repository/pyproject.toml#L4-L5
[src_d0f8d2e2a660]: ../../../python-repository/launch.py#L5-L8
[src_f62c82af09fa]: ../../../python-repository/loop.py#L1-L8
[src_dd80e92231ab]: ../../../python-repository/worker.py#L1-L2
