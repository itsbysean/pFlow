# External boundary analysis

Start with the requested M5-02 bundle, its source root and inspected ownership/coverage notes. Read [representation.md](external-boundaries/representation.md) before emitting data. Recheck the actual call path, client binding and active configuration. Missing/stale handoff evidence is a gap to report, not permission to infer a boundary from an import or package name.

Preserve proven entry, Flow, invocation-occurrence, edge and evidence-role IDs. Enrich a known external stop in place when it is the same call. Owned wrappers/handlers stay internal; place external metadata on their actual non-owned invocation occurrences. Do not merge separate calls merely because they share a destination, or duplicate one operation into library and system nodes solely for presentation.

Use existing file/content/symbol navigation. Follow only the owned wrapper, constructor/factory/registration and configuration chain needed to establish the invocation and meaningful options. Read [evidence.md](external-boundaries/evidence.md) for destination/configuration rules. Do not enter third-party implementations, run target code, contact services or read current host environment values as if they described deployment.

For each significant stop:

1. Verify ownership and reachability. Separate owned code, a non-owned library API, a proven service/infrastructure operation, and an actual unknown receiver. Dependency declarations and unused configuration provide leads, not proof of an interaction.
2. Establish the invoked operation and its binding. Resolve active source/config/environment/XML references far enough to distinguish literal values, defaults, expressions, overrides and missing inputs. Omit unverified values rather than selecting a plausible destination.
3. Record relevant HTTP/database/messaging/other metadata in the existing generic value object. Preserve environment keys or expressions without claiming a resolved deployment value. Record configured timeout/retry/transaction/response behavior only when the invocation uses it; distinguish configured behavior from runtime guarantees.
4. Cite invocation, binding and relevant configuration through SourceReferences. Keep role explanations and unknowns concise in M1-03 Markdown. Do not copy credentials or bulk SDK/configuration text. If a line range would embed credentials, use narrower safe evidence or file-level evidence and explain the location-only limit.
5. Keep existing ordering, guarded outcomes and waiting semantics. Awaited publication may wait for acknowledgment; it does not prove processing or delivery. Document publish/receive/subscribe boundaries independently; add no execution or navigation link between their Flows in this task.

Use [review.md](external-boundaries/review.md) to check metadata meaning after shared schema/semantic/Markdown validation. The validators establish structure/references, not destination resolution or evidence quality. Report significant boundaries, verified metadata, unresolved values/receivers, skipped scope and diagnostics.

Honor the requested destination and existing detailed artifacts. If required input/output scope is missing, identify it before writing. No AST service, mandatory language parser, new architecture schema, Builder/Viewer rewrite, live infrastructure, incremental update or finding analysis is included. Stop after boundary analysis. M5-04 linking requires a separate request.

Runtime functions and commands are available through [the packaged runtime](runtime.md). No sibling Skill installation is required.
