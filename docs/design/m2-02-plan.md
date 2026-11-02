# M2-02 — Native SVG execution diagrams

Research: `main` is clean at `d1d7d0c`. M1-01 is approved, schema 1.0.0 and all three samples are present, M1-03 defines documentation links, and M2-01 supplies a working offline layout plus Chromium tests. No graph renderer exists.

1. Add a small read-only projection of one approved Flow and its outgoing edges. Known nonlocal targets become boundary stubs using their real IDs, names, source references, and owner Flow. Never import their internals or follow `expandFlowId`. Check reference integrity before layout.
2. Implement deterministic layered layout using stable ID ordering, iterative cycle detection, longest-path ranks after removing backward edges from ranking, and parent-based row ordering. Route adjacent edges between rows and long/backward edges through outside lanes. Keep every edge and arrow direction; this is a layout projection, not a rewrite of execution semantics.
3. Render native SVG shapes, text, source captions, edge labels, and arrowheads with existing color tokens. Preserve full labels and evidence in accessible text/tooltips. Add distinctions for decisions, unresolved boundaries, normal terminals, exception-only terminals, libraries, systems, and cross-flow stubs.
4. Add zoom in/out, fit, 100% reset, pointer panning, keyboard panning, and responsive refitting. Use a flat Flow chooser to demonstrate every sample Flow; no hierarchical navigation or node selection.
5. Extend pure Node tests for layout/math and real Chromium tests for SVG output, semantics, interaction, offline startup, and safe errors. Update prior Viewer tests for the newly rendered workspace. Review screenshots and record the limits. Continue on `main` under the current repository workflow.

Limits to review: this lightweight layout reduces overlaps but does not promise crossing-free dense graphs. Long/cyclic edges use outside lanes; large graphs can require zoom/pan. Full schema validation and evidence interpretation remain separate from the renderer's integrity checks. No runtime library, schema field, graph-node interaction, Markdown navigation, search, or Builder is added.
