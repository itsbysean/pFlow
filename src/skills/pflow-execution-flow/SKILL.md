---
name: pflow-execution-flow
description: Analyze evidence-backed execution paths from confirmed pFlow entry points through project-owned code. Use after entry discovery for internal calls, branches, outcomes, dispatch and reusable detail; defer external integration analysis.
---

# Execution-flow analysis

Start from the requested M5-01 bundle and its actual source repository. Read the approved contracts linked in [representation.md](references/representation.md). Verify each selected EntryPoint's activation and receiving handler before traversing. Missing/stale activation evidence is a handoff gap, not permission to guess a root. If confirmed entries or source/output locations are missing, identify the needed input; do not invent a parallel entry list.

Preserve proven EntryPoint, root Flow, receiving-node and evidence-role IDs. Extend the receiving context instead of turning its existing entry node into an unrelated guard or call. Honor the requested destination; keep a separate draft when continuity or overwrite scope is unclear. Do not implement identity matching or incremental updates.

Use existing file/content/symbol navigation. Read the handler, relevant caller context, dependency wiring and selected configuration, then follow significant calls across owned modules. A declaration or matching method name does not prove a call target. Read [dispatch.md](references/dispatch.md) when interfaces, factories, callbacks, reflection or runtime registries affect selection.

For each analyzed context:

1. Establish project ownership and concrete bindings. Follow the actual call site to its target, including constructor/factory/registration evidence needed to resolve it. Reuse source references by evidence role, with real repository-relative paths and inclusive line ranges.
2. Preserve meaningful evaluation order, significant guards and branch outcomes, early exits, normal completion and explicit thrown/caught/propagated failures. Distinguish a handler's outcomes from an expanded callee's exits. Omit trivial assignments/accessors and transformations that do not change the documented path.
3. Keep caller-owned invocation nodes and optional reusable detail Flows. Expand only when it makes significant internal behavior easier to read. Do not invent component/method levels or copy a callee's whole graph into every caller.
4. Track analyzed code plus binding/receiving context and the active expansion path. Revisit compatible existing detail for recursion/cycles instead of unrolling it. A different concrete dependency context may need distinct detail; changing ordinary input values alone must not create endless copies.
5. Stop at a proven external library/system call without investigating third-party internals or extracting integration metadata. Keep an actual unresolved target-selection expression explicit and add no guessed handler edges. Do not claim unknown completion or failure behavior.

Before emitting graphs, use the mapping rules in representation.md. Write concise M1-03 Markdown with important calls, selection conditions, exits and coverage gaps; do not duplicate source bodies. Read [evaluation.md](references/evaluation.md) before reviewing results. Use the existing shared schema/semantic/Markdown validation and review source meaning separately: validator success cannot establish a dispatch target or path completeness.

Report analyzed entries/contexts, important paths, unresolved/boundary stops, skipped scope and validation/review results. Do not run unknown target code to infer behavior. No AST/indexing service, mandatory LSP/Tree-sitter, external metadata extraction, producer/consumer linking, findings, HTML generation or Builder/Viewer redesign is part of this Skill. Stop after internal execution-flow analysis; identify M5-03 boundary work without starting it.
