# Dispatch and contextual traversal

Resolve targets from call sites, imports, constructor/factory arguments, composition/bootstrap code, registration writes and configuration precedence. Inspect callers of adapters when they carry the concrete binding. A type/interface declaration lists possibilities; it does not select an implementation. A function-valued argument is not inherently unresolved when its supplied callback is known.

When one concrete receiver is established, trace it in that binding context. When multiple targets are justified by an inspected selector, preserve those alternatives and their actual selection conditions. Do not render every declared implementation as an unconditional call or silently choose the familiar one. An unregistered implementation is a declaration, not a proven alternative.

If a finite candidate set is visible but the activation/selection condition is not established, document the supported candidates and the missing resolution in Markdown rather than inventing a decision node or target edges. Missing plugin tables, environment values, reflection targets and late registry writes remain unresolved at their actual expression. Explain what evidence would close the gap without guessing it.

Traverse an internal callback when its registration or passed function plus invocation context is proven. Check capture/receiver context, selected configuration and whether the callback is invoked immediately, awaited, stored or independently triggered. Do not infer waiting behavior from callback syntax. A library-hosted callback may be known from an API contract, but do not inspect third-party bodies; distinguish that basis from project source evidence.

Use a small worklist of significant contexts and an active expansion set. Share detail only when code and meaningful binding context match. Recursion with the same dependency context reuses detail even when scalar input values change. Repeated names across classes/modules or different injected dependencies do not establish reusable identity. Stop unexplored contexts at an explicit coverage boundary instead of claiming all paths were analyzed.
