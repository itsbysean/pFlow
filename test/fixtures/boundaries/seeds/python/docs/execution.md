# Execution boundary stops

Non-owned invocation stops are identified without integration metadata. Unknown deployment values and external outcomes remain unverified. No producer/consumer link is established.

<a id="flow_cafa776809b0"></a>
## Read configured report

The copy-note script invokes run, constructs a path from REPORT_PATH, reads UTF-8 text and returns it. Missing environment or file/read failures remain unmodeled. Evidence: [src_1f90c832bab6], [src_9afa4f003fdb], [src_11f58d83b2f8], [src_c2de3f0385ae], [src_914468fcc89c].

## Source evidence

[src_1f90c832bab6]: ../../../python-repository/pyproject.toml#L4-L5
[src_9afa4f003fdb]: ../../../python-repository/entry.py#L4
[src_11f58d83b2f8]: ../../../python-repository/entry.py#L1-L2
[src_c2de3f0385ae]: ../../../python-repository/entry.py#L5
[src_914468fcc89c]: ../../../python-repository/entry.py#L6
