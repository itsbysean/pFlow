# Internal execution analysis

Discovery identities are retained. This is internal execution analysis only; runtime plugin resolution, external integration metadata, async linking and exhaustive exception coverage are not claimed.

<a id="flow_7595fc490e75"></a>
## Count depth

The confirmed console receiver invokes the owned count_down function and returns its result. Evidence: [src_9164ab193c62], [src_5e2501075f45], [src_94ad48aff725], [src_952baaec0c93].

<a id="flow_6dad8626e3bd"></a>
## Recursive depth count

Nonpositive depth returns zero. Positive depth recursively invokes the same owned function and returns the child count plus one. The recursive occurrence expands to this same compatible Flow; no depth-based copies or cross-Flow return edges are introduced. Evidence: [src_952baaec0c93], [src_aadc69e180ac], [src_c8646daf750d].

## Source evidence

[src_9164ab193c62]: ../../../python-repository/pyproject.toml#L4-L5
[src_5e2501075f45]: ../../../python-repository/entry.py#L3
[src_94ad48aff725]: ../../../python-repository/entry.py#L1-L4
[src_952baaec0c93]: ../../../python-repository/recursion.py#L1-L4
[src_aadc69e180ac]: ../../../python-repository/recursion.py#L2-L3
[src_c8646daf750d]: ../../../python-repository/recursion.py#L4
