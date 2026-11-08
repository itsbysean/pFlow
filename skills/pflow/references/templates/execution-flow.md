# {{process document title}}

<a id="{{flow_id}}"></a>
## {{flow label}}

{{Purpose and scope. Supported starting condition, or the caller/context for this detail.}}

{{Concise main sequence, important decisions and alternatives, and documented outcomes. Mention participants or systems only when evidenced.}}

{{Significant failure paths or unresolved information, when applicable. Explain why a step matters only when the source or developer states that rationale.}}
Evidence: [{{src_id}}].

<a id="{{node_id}}"></a>
### {{important step, condition or boundary}}

{{Explain this component specifically: what it receives or checks, what it does, and the result or next handoff. State actual branch outcomes, failure behavior or unknowns when relevant. Use a short paragraph or bullets; do not repeat the Flow overview. Link to supported detail when available.}}
Evidence: [{{src_id}}].

## Source evidence

[{{src_id}}]: {{relative-evidence-path}}{{line-fragment}}

<!-- Keep canonical anchors, owner nesting and exact JSON citation ranges.
Source evidence may be code, configuration or captured developer statements.
Omit optional Node sections and irrelevant prompts; add no mandatory metadata.
Use #L4 for a single line and no fragment for file-level evidence.
Remove this comment and all placeholders before publication. -->
