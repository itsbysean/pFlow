# External invocation boundaries

Configured values describe caller inputs, not live service guarantees. Environment values, runtime destinations and external outcomes remain unknown. No producer/consumer link is established. Unmodeled external failures remain outside this handoff.

<a id="flow_cafa776809b0"></a>
## Read configured report

The configured copy-note script invokes run. Construct a path from required REPORT_PATH, read UTF-8 text and return the result. Missing environment, file and read failures remain unmodeled. Evidence: [src_1f90c832bab6], [src_9afa4f003fdb], [src_11f58d83b2f8], [src_c2de3f0385ae], [src_914468fcc89c].

<a id="node_3a1a46c9137d"></a>
### Read text from configured path

other boundary. system.type: `filesystem`; filesystem.operation: `read_text`; filesystem.pathEnv: `REPORT_PATH`; filesystem.encoding: `utf-8`; library.name: `pathlib`; library.symbol: `Path.read_text`. Evidence: [src_11f58d83b2f8], [src_c2de3f0385ae], [src_914468fcc89c].

## Source evidence

[src_1f90c832bab6]: ../../../python-repository/pyproject.toml#L4-L5
[src_9afa4f003fdb]: ../../../python-repository/entry.py#L4
[src_11f58d83b2f8]: ../../../python-repository/entry.py#L1-L2
[src_c2de3f0385ae]: ../../../python-repository/entry.py#L5
[src_914468fcc89c]: ../../../python-repository/entry.py#L6
