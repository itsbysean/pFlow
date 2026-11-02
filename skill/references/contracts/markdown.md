# Markdown documentation contract

Status: M1-03 documentation profile for architecture model 1.0.0. This contract changes no JSON Schema fields or execution semantics.

## Bundle structure

One documentation bundle belongs to one architecture artifact. It contains `index.md` and the Markdown files referenced by that artifact's `docs` values. Paths in `docs` are relative to the bundle root. These files form the architecture documentation and future search corpus; unrelated Markdown is not implicitly included.

The index needs one title, a short scope statement, and navigation to every Flow. List each entry point and its evidenced trigger beside a link to its Flow. List reusable detail Flows separately when useful. Link to existing detail, not a second copy of its execution sequence. State material coverage limits. No front matter or copy of Diagram JSON is needed.

Execution documents need one title and a section for each Flow they describe. One file may contain several Flows. For each Flow, cover:

- Entry point and trigger, or the caller when this is reusable detail.
- Main internal calls and their order.
- Significant conditions, labeled outcomes, normal returns, and exception paths.
- Important external calls and verified asynchronous transfers.
- Material unknowns or omissions, without invented behavior.

Use short paragraphs or lists. Add Node subsections only when separate navigation helps, such as a decision, external boundary, or call site. An optional Edge section can explain a verified transfer. An optional EntryPoint section can explain registration or activation. Avoid empty boilerplate headings. A heading's wording and source language have no contractual meaning.

Templates: [architecture index](../templates/architecture-index.md) and [execution flow](../templates/execution-flow.md). Replace every placeholder before publishing a bundle. Templates themselves are not artifact documents and are not validated as populated bundles.

## Stable section identity

Use the exact existing entity ID as a literal section ID:

```markdown
<a id="flow_a12"></a>
## Refresh execution

Main sequence and exits, with evidence citations.

<a id="node_c34"></a>
### Input validation

Condition and outcomes, with evidence citations.
```

An anchor is an unindented line in exactly the form `<a id="ID"></a>`, followed by an ATX heading (`## Heading`, for example). Blank lines between them are allowed. Use heading levels 2–6 for entity sections; level 1 is the document title. IDs use the model's `entry_`, `flow_`, `node_`, or `edge_` prefix and opaque suffix. The ID must exist in the artifact and occur only once across the bundle. Do not derive it from a heading, path, symbol name, or traversal order. Retain it when its graph identity is retained.

Each Node section is nested beneath its owning Flow section, in the same document and at a deeper heading level. Each Edge section is nested beneath its source Flow section. It may be placed after Node sections. EntryPoint sections can stand alone. Unanchored subheadings are allowed; they are not navigation targets. HTML is limited to these anchor lines. Fenced examples are ignored by the focused checker and must not supply real section IDs or citations. Do not embed source listings in execution documentation.

## Diagram and Markdown mapping

For this documentation profile:

1. Every Flow has exactly one canonical section and a `docs` link whose `anchor` equals its own ID. A Flow can have other supporting links.
2. Node `docs` remains optional. When nonempty, it must include a link to the Node's own canonical section. A Node section must belong to its actual owning Flow, not its expanded callee.
3. EntryPoint and Edge documentation is optional. When nonempty, it follows the same canonical-section rule.
4. Every entity anchor in Markdown has a matching `docs` backlink on that entity with the same document path and ID. Do not leave orphan section anchors.
5. Supporting links may address an existing section or a whole document. They do not establish section ownership. An entity cannot satisfy its canonical link with another entity's section.

For example, a Flow with ID `flow_a12` can use `{"path":"execution.md","anchor":"flow_a12"}`. A related Node uses its own ID in its `docs` association. The future Viewer can index sections by their existing IDs, resolve JSON links within the bundle, and select a Flow or Node from the section's ID. Titles are display text. No heading-slug algorithm is involved.

When a Node has no documentation link, the Viewer may offer its owning Flow's section. It must not claim that the Flow's section is the Node's own section. A call-site section remains in the caller; `expandFlowId` opens reusable callee detail separately. Whole-document links remain valid supporting navigation.

These are documented-bundle rules, not new schema requirements for every architecture artifact. The schema still allows absent `docs` and whole-document links. Model version 1.0.0 is unchanged.

## Markdown navigation links

Use ordinary inline links such as `[Read state](execution.md#flow_a12)`. Document links are relative to the current Markdown file, while JSON document paths remain relative to the bundle root. Use `/` in paths. Resolve against the same bundle, reject escapes, and match the literal ID. The index must link to every Flow's canonical section, including reusable detail. EntryPoint links can supplement those Flow links.

For this minimal profile, navigation links use plain relative `.md` paths, optional literal fragments, and no URL encoding, spaces, titles, or nested link syntax. Navigation to a heading-generated fragment is invalid. Source evidence links use the separate convention below. Do not use external links as architecture navigation.

## Source evidence

Cite SourceReference IDs with reference-style Markdown links:

```markdown
The configured task selects its registered handler. Evidence: [src_e56].

## Source evidence

[src_e56]: ../sources/tasks.xml#L4-L6
```

The definition target is relative to the Markdown file and resolves to the same repository file as `SourceReference.path`. That JSON path remains repository-relative. Single-line ranges use `#L4`; multi-line ranges use `#L4-L6`; file-level references omit the fragment. Use the exact JSON range. No symbol or snippet is duplicated in the definition. Link fragments describe source ranges for the future Builder; a plain text browser may not scroll to a line.

Place definitions at the end of each document that cites them, under `## Source evidence`. Each cited source ID needs exactly one definition in that document. Each definition must name an existing SourceReference and be cited. Paths are plain relative paths without whitespace or URL encoding in this profile. Definition targets can leave the documentation directory to reach source files, but must remain inside the repository. They cannot address a network location.

Keep the exact case of source IDs. Two source labels in one document must not differ only by letter case: Markdown reference labels are case-insensitive. The checker rejects that ambiguity while graph IDs remain case-sensitive. See the [CommonMark link-reference rules](https://spec.commonmark.org/0.31.2/#link-reference-definitions).

Each entity section must cite evidence from its graph association: its own `sourceIds`, or, for a Flow, the union of its nodes' and edges' evidence. Citations in nested Node/Edge sections belong to those sections. Not every graph evidence record needs to be repeated in prose. A relationship that depends on several files should cite the necessary chain, as the messaging sample does. The checker validates associations and exact locations; a reviewer must assess whether the evidence proves the prose.

The index can rely on its linked execution sections for evidence. Do not add arbitrary source paths or line numbers in prose as a second source-reference system. Do not paste large source blocks; snippet extraction belongs to the future Builder.

## Validation and limits

For installed validation, use [the packaged runtime](../runtime.md) validate command; source-checkout test commands do not apply to installations. Existing M1-02 schema and semantic checks run unchanged in scope. The M1-03 test-only checker adds canonical mappings, duplicate/invalid/unknown section IDs, section nesting, index Flow coverage, local links, and source citation/definition consistency. Errors identify the file or JSON association.

The checker recognizes the small syntax above and ignores fenced examples. It is not a CommonMark parser, renderer, source analyzer, or Builder. Unsupported HTML anchor forms are rejected rather than guessed. Human review checks sequence accuracy, coverage, index trigger descriptions, significant conditions, and evidence adequacy. Historical evidence and identity continuity remain outside this task.

Potential bugs are not part of this base contract. M9 findings (historically M7) remain in separate `findings.json`; the future Builder may combine them during rendering. No findings metadata or potential-bug sections are required or introduced here.
