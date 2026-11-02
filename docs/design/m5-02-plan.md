# M5-02 — Execution-flow analysis

Research: main starts at 1a55d0c. M5-01 supplies confirmed EntryPoints and minimal receiving Flows. M1 already supports local call/branch/return/exception edges, reusable navigation-only detail, unresolved nodes and cyclic references. Existing validators prove references and structure, not dispatch/path semantics. No contract or Builder/Viewer change is required.

One workflow: built-in contract research → implementation → blind forward analysis and independent review → focused/full validation. Apply existing skill-creator guidance; use no orchestration plugin.

1. Add a separate pflow-execution-flow source Skill. Keep discovery's stop boundary and add only an explicit handoff link. The new Skill requires a confirmed bundle/source root, preserves proven IDs, follows owned calls with binding context and stops at unresolved/non-owned boundaries.
2. Put M1 representation, dynamic-dispatch guidance and review criteria in progressive references. Preserve local caller continuation, return/exception semantics and finite recursive detail. Do not invent selector conditions, concrete implementors or graph layers. External nodes may mark a proven stop without integration metadata extraction.
3. Add small authored multi-module JavaScript and Python fixtures plus confirmed discovery seeds. Cover service/repository traversal, guards, early returns, caught/rethrown failure, two selected policies, a bound callback, an unknown runtime plugin and recursion. Store seed/oracle snapshots under non-build filenames to preserve normal Builder discovery.
4. Validate static M1 oracle/Markdown output and identity handoff, and test actual controlled fixture call order/outcomes/bindings. Keep these deterministic checks distinct from general AI analysis. Blind-evaluate raw code plus seeds without exposing oracle answers, then review emitted evidence/graphs independently.
5. Verify no Builder/Viewer/schema/dependency changes, run Skill validators and all tests, document limits and commit on main. Stop before M5-03/external boundary analysis.
