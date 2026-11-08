# Review execution results

Review source meaning after reference validation. Check caller/callee and binding evidence together, including the import, constructor, factory or static binding that selects the invoked receiver; an invocation range alone may not prove its identity. Check argument order and guards; normal/early outcomes; explicit throw/catch/rethrow paths; multiple implementation selection; known callback registration/invocation; unresolved targets without guessed edges; and finite recursive/detail reuse.

For an inspected callee whose detail is collapsed, retain significant guard/return/throw conditions in its linked summary or detail. A generic may-fail edge does not replace a known rejection condition. Check that the handoff launcher can actually invoke its receiver with the supplied arguments.

When detail behavior changes, recheck callers' result, status and branch summaries against the changed predicate; updating the child section alone can leave the parent incorrect.

Check each path's mapped fields and defaults against that path's source. Similar handlers can have different defaults; shared prose must not copy a field or fallback from a sibling path. Review graph order and edge kinds against successful helper completion, the explicit throw site, and each catch branch separately.

Compare the emitted EntryPoint/root/receiving identities with the confirmed handoff. Ensure caller continuations remain local, expansion is navigation-only, and source-backed cycles do not create unbounded graph copies. Look for omitted significant paths, excessive low-level nodes, fabricated layer boundaries and metadata work outside scope.

For representative evaluation, use small raw repositories and confirmed M5-01 bundles without exposing intended flow answers to the analyzing agent. Validate the result against actual files. Where safe authored test fixtures exist, probe both branch outcomes, handled/unhandled exceptions, callback selection and altered bindings; these are fixture checks, not permission to execute arbitrary target projects.

A counterfactual binding change should alter target resolution. A declaration, expected keyword or structurally valid graph must not satisfy an evidence check by itself. Report deterministic fixture/oracle checks separately from AI forward-run observations. Neither a small successful sample nor validator success proves general recall or complete runtime coverage.
