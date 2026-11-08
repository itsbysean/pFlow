# M1-01 — Common architecture data model

Status: approved by the user on 29 October 2026 for implementation in M1-02.

## Scope and research

The workspace was inspected on 29 October 2026. It is empty and is not a Git repository. No project files, repository instructions, documentation, or implementation were found. The supplied task and chat instructions define the requirements.

This document proposes a conceptual model. It does not define a production JSON Schema, Viewer, Builder, Skill, or update algorithm. Example source files below are fictional.

Confirmed requirements: language and framework independence, evidence-backed execution relationships, hierarchical navigation, Markdown links, separate optional findings, and stable references across updates.

The user approved the field names, enum values, ID rules, and storage rules below on 29 October 2026. The original illustrative JSON remains a draft example, not a production artifact.

## Conceptual model

Use five entities: **EntryPoint, Flow, Node, Edge, and SourceReference**. A small document envelope stores them. Markdown links and external metadata are value objects, not additional entities.

- An EntryPoint identifies an executable boundary that repository evidence confirms.
- A Flow owns the nodes and outgoing edges for one level of execution detail.
- A Node represents an execution occurrence or boundary at that level. It does not identify a source symbol globally.
- An Edge describes a directed execution relationship.
- A SourceReference identifies repository evidence, including configuration without a symbol.

Each entity has a globally unique, persistent ID within one architecture document. Store each entity once. References use IDs.

### Ownership and expansion

Nest nodes and edges under their owning flow. This avoids separate node/edge membership lists. Two calls to the same function are distinct occurrence nodes. Both can use `expandFlowId` to open the same function detail flow. Its internals are stored once.

`expandFlowId` is a navigation link. It is not an execution edge and does not insert a subgraph into its caller. The caller retains its own continuation, return, and exception relationships. This avoids call-site return mappings and context leakage between callers.

A typical navigation path is entry flow → component delegation node → component flow → function call node → function/internal flow. Only introduce a component node when an actual delegation supports it. Do not invent execution steps to fill a hierarchy level. A monolithic program may omit the component level.

Recursive expansion links and cyclic execution edges are valid. A Viewer must track the navigation stack, expand on demand, and offer a link to an already open flow instead of expanding forever.

### Entity relationship diagram

```mermaid
erDiagram
    ENTRY_POINT }o--|| FLOW : starts_in
    FLOW ||--|{ NODE : owns
    FLOW ||--o{ EDGE : owns
    FLOW }o--|| NODE : selects_start
    NODE }o--o| FLOW : expands_to
    EDGE }o--|| NODE : from
    EDGE }o--|| NODE : to
    ENTRY_POINT }o--|{ SOURCE_REFERENCE : supported_by
    NODE }o--|{ SOURCE_REFERENCE : supported_by
    EDGE }o--|{ SOURCE_REFERENCE : supported_by
```

The start node belongs to its flow. An edge belongs to its source node's flow. Its target can belong to another flow for an evidenced transfer of execution.

## Entities and fields

R = required; O = optional. Lists of evidence IDs must be nonempty.

| Entity | Field | Need and meaning |
|---|---|---|
| EntryPoint | `id` R | Stable identity for navigation and future findings. |
| | `label` R | Human-readable name; not an identity key. |
| | `flowId` R | Flow entered through its start node. |
| | `sourceIds` R | Evidence of activation and target selection. May combine registration, configuration, and implementation. |
| | `trigger` O | Short evidence-backed description, such as a command, schedule, event, or registration. No fixed framework taxonomy. |
| | `docs` O | Markdown section links. |
| Flow | `id` R | Stable detail-flow identity. |
| | `label` R | Display name for its scope. |
| | `startNodeId` R | One local starting point; separate flows for distinct executable starts. |
| | `nodes` R | Nonempty list of owned occurrence nodes. |
| | `edges` R | Owned outgoing relationships; can be empty. |
| | `docs` O | Markdown section links for the flow. |
| Node | `id` R | Stable identity of this occurrence within a logical flow. |
| | `label` R | Concise description of the action or boundary. |
| | `kind` R | `operation`, `decision`, `external`, `terminal`, or `unresolved`; controls basic presentation. |
| | `sourceIds` R | Evidence for the action, decision, endpoint, or observed dynamic expression. |
| | `expandFlowId` O | Reusable detail flow for this occurrence. |
| | `external` O | Evidence-backed integration metadata; used only on external nodes. |
| | `docs` O | Markdown section links for this element. |
| Edge | `id` R | Stable relationship identity. |
| | `from`, `to` R | Source and target node IDs. Both must exist. |
| | `kind` R | `next`, `call`, `branch`, `return`, `exception`, `send`, or `receive`. |
| | `mode` R | `sync`, `async`, or `unknown`; avoids assuming synchronous execution. |
| | `sourceIds` R | Evidence for this relationship, not merely its endpoints. |
| | `label` O | Branch outcome, exception type, message description, or other useful qualifier. |
| | `docs` O | Markdown section links when an edge needs explanation. |
| SourceReference | `id` R | Stable evidence-reference identity. |
| | `path` R | Repository-relative file path, including source, XML, scripts, and configuration. |
| | `symbol` O | Qualified source symbol when one exists. |
| | `startLine`, `endLine` O | Inclusive, one-based range; both present or both absent. |

Flow evidence is obtained from its nodes and edges. Do not duplicate those evidence lists on the flow. EntryPoint evidence remains separate because activation can require evidence beyond execution-body evidence.

### Envelope and value objects

The envelope requires `modelVersion`, `entryPoints`, `flows`, and `sources`. It optionally includes `revision`, an opaque repository revision that binds source ranges and the documentation to a snapshot. M1-02 must select the initial model version. The example uses `draft`.

Each `docs` item has `path` and optional `anchor`. Paths are relative to the documentation bundle; anchors are literal section IDs without `#`. Multiple links are allowed. The Builder must reject paths outside the bundle and verify that linked files and anchors exist. Markdown remains the search corpus; do not duplicate its text in the graph. Search indexing is outside this task.

`external` requires `kind`: `http`, `database`, `messaging`, `library`, or `other`. It optionally has `name` and `attributes`, a map of namespaced keys to scalar values or scalar lists. Examples: `http.method`, `http.urlTemplate`, `database.operation`, `messaging.channel`, or `library.symbol`. Include only known values supported by the node's evidence. Do not copy credentials or tokens. An HTTP method can be known while its host remains unknown.

Node `kind` describes presentation, not a framework type. Calls are described by edges; a call operation can expand into a detail flow. Use `external.kind = library` for a dependency call whose body is outside the documented scope, and another external kind for a system interaction. The model must not require dependency source code.

## Execution rules

### Branches, returns, and exceptions

A decision is a node. Its outgoing `branch` edges require distinct, evidence-backed labels, such as `valid` and `invalid`. Do not assume only two outcomes. Edges can converge on a shared node. A loop uses a backward edge, not a copied body. Labels describe outcomes without requiring a parsed expression language.

Use a terminal node for an exit at the current flow boundary. `return` means a normal exit; `exception` means exceptional transfer. An exception edge can target a catch/recovery operation or an exceptional terminal. Do not treat a throw as a return. Use multiple terminals when outcomes differ. When a detail flow exits, navigation returns to the caller; that is not a shared execution edge to one particular caller.

### Synchronous and asynchronous execution

An edge is a possible transfer supported by evidence, not proof that it executes on every run. `mode` describes waiting/transfer semantics for that edge. `send` and `receive` describe integration direction; neither implies asynchronous behavior by itself.

`next` means local continuation. `call` means invocation of the target operation; its reusable body can be opened through that node's `expandFlowId`. After a call node, separate outgoing edges describe continuation or failure. Here `sync` means the continuation waits for completion, including an awaited operation; `async` means a detached or independently scheduled transfer. An `async` keyword alone does not establish this mode. Use `unknown` when the evidence does not establish waiting behavior.

For messaging, the producer flow can own an external channel occurrence, and the consumer flow can own a separate receive occurrence. A cross-flow `receive` edge with `mode: async` may connect them **only** when evidence establishes their binding. It belongs to the producer channel node's flow. A Viewer shows its nonlocal target as a link or boundary stub until opened; it does not import the consumer graph.

The producer's local continuation is a separate edge. A channel-to-consumer edge means possible delivery, not guaranteed delivery, unique consumption, order, transaction completion, or caller waiting. Record those stronger properties only when evidenced in metadata or Markdown. Use a direct async `call` edge for a proven callback or dispatch transfer without an external channel.

Do not connect a producer to a consumer merely because their labels match. If deployment binding is unavailable, document the producer and consumer independently. Consumers can also be EntryPoints when activation evidence is available.

### Dynamic and incomplete analysis

An `unresolved` node means the analyzer found an execution boundary or dispatch expression but could not establish its target. Its label states the gap, for example `Target selected from runtime registry; binding unavailable`. The incoming edge's evidence supports reaching that expression, not a particular handler.

Do not create candidate handler edges or imply that the unknown target terminates execution. Where continuation behavior is also unknown, leave it unknown. If code proves that an unresolved call returns before the next action, a separate local continuation may be shown.

Each confirmed edge requires direct evidence or a deterministic binding supported by all relevant source references. This model has no speculative-edge flag or confidence score. Hypotheses belong in explanatory Markdown and cannot be rendered as confirmed paths. A flow is an evidence-backed summary; it does not claim exhaustive runtime coverage. Document material omissions in its linked Markdown.

## Stable identity and incremental updates

Use opaque, type-prefixed IDs, such as `flow_a12` and `node_c34`. IDs must not encode line numbers, labels, paths, graph traversal order, or content hashes. Those values change during ordinary edits.

Retain IDs from the previous artifact when identity is established. An initial generator can assign an ID once using a namespace plus a logical identity seed; collision checks are mandatory. That seed is a matching aid, not the current path or an ongoing formula that rekeys entities after edits. Stable regeneration requires the previous artifact or retained identity state. A stateless generator cannot guarantee identity through arbitrary renames and moves.

Approved continuity rules:

- Preserve identity across a rename or move only when evidence supports the match.
- Give distinct call occurrences distinct IDs, even if they share one callee flow.
- Preserve an edge ID only while its endpoints and semantic relationship remain the same. Labels and source ranges can change without changing identity.
- Assign new IDs after ambiguous splits, merges, or uncertain matches. Do not guess continuity.
- Remove deleted entities from the current graph. Never reuse their IDs. Findings targeting removed IDs remain stale references, not references to a replacement element.
- Update source ranges and paths while retaining a SourceReference ID only when it still identifies the same evidence role. Reused lines alone do not establish identity.

An update can report old-to-new matches separately in the future. Do not add aliases, tombstones, or an identity registry entity to the common graph now. Durable non-reuse requires retained identity history; its storage belongs to incremental-update design.

Future `findings.json` can identify this architecture artifact/revision and refer to flow or node IDs. Finding status, severity, and text do not belong in the architecture graph. Matching revisions is necessary because a stable ID alone does not prove that a finding still applies.

## Illustrative JSON

This complete small flow has a configured command boundary, validation, a branch, an external call, a normal return, and an exception path. The filenames and line ranges illustrate evidence structure; they are not repository findings. Advanced hierarchy and asynchronous cases are specified above rather than added to this example.

```json
{
  "modelVersion": "draft",
  "entryPoints": [
    {
      "id": "entry_a1",
      "label": "Refresh command",
      "trigger": "Command registered as refresh",
      "flowId": "flow_a1",
      "sourceIds": ["src_registration", "src_body"]
    }
  ],
  "flows": [
    {
      "id": "flow_a1",
      "label": "Refresh execution",
      "startNodeId": "node_validate",
      "docs": [{"path": "flows/refresh.md", "anchor": "execution"}],
      "nodes": [
        {"id": "node_validate", "kind": "operation", "label": "Validate input", "sourceIds": ["src_body"]},
        {"id": "node_valid", "kind": "decision", "label": "Input valid?", "sourceIds": ["src_branch"]},
        {
          "id": "node_http",
          "kind": "external",
          "label": "Fetch current state",
          "sourceIds": ["src_request"],
          "external": {
            "kind": "http",
            "name": "State service",
            "attributes": {"http.method": "GET", "http.urlTemplate": "${STATE_URL}/state"}
          },
          "docs": [{"path": "flows/refresh.md", "anchor": "state-service"}]
        },
        {"id": "node_rejected", "kind": "terminal", "label": "Return invalid input", "sourceIds": ["src_branch"]},
        {"id": "node_done", "kind": "terminal", "label": "Return state", "sourceIds": ["src_result"]},
        {"id": "node_failed", "kind": "terminal", "label": "Propagate request exception", "sourceIds": ["src_request"]}
      ],
      "edges": [
        {"id": "edge_a1", "from": "node_validate", "to": "node_valid", "kind": "next", "mode": "sync", "sourceIds": ["src_body"]},
        {"id": "edge_a2", "from": "node_valid", "to": "node_http", "kind": "branch", "mode": "sync", "label": "valid", "sourceIds": ["src_branch", "src_request"]},
        {"id": "edge_a3", "from": "node_valid", "to": "node_rejected", "kind": "branch", "mode": "sync", "label": "invalid", "sourceIds": ["src_branch"]},
        {"id": "edge_a4", "from": "node_http", "to": "node_done", "kind": "return", "mode": "sync", "sourceIds": ["src_result"]},
        {"id": "edge_a5", "from": "node_http", "to": "node_failed", "kind": "exception", "mode": "sync", "label": "request throws", "sourceIds": ["src_request"]}
      ]
    }
  ],
  "sources": [
    {"id": "src_registration", "path": "config/commands.xml", "startLine": 4, "endLine": 6},
    {"id": "src_body", "path": "src/refresh.ext", "symbol": "refresh", "startLine": 10, "endLine": 11},
    {"id": "src_branch", "path": "src/refresh.ext", "startLine": 12, "endLine": 14},
    {"id": "src_request", "path": "src/refresh.ext", "startLine": 15, "endLine": 15},
    {"id": "src_result", "path": "src/refresh.ext", "startLine": 16, "endLine": 16}
  ]
}
```

## Validation and review

Structural validation must check unique IDs across the document, reference existence and entity types, local flow starts, and edge ownership by the source flow. Cross-flow targets must be intentional evidenced transfers. Ranges must use positive integers with `startLine <= endLine`. Repository paths must be relative and must not escape the repository. An absent line range means file-level evidence, not a guessed range.

Semantic review must check that each activation and relationship has adequate evidence; branch labels are distinct; terminal nodes have no outgoing execution edges; exception exits are distinct from normal exits; and unresolved nodes do not imply known targets. The illustration's invalid branch enters a normal terminal directly; a terminal marks the exit even without a separate `return` edge.

Do not require all nodes to be reachable from an EntryPoint: reusable detail flows can be reached through expansion. Within a flow, every node should be reachable from its start unless a documented cross-flow transfer enters it. Do not enforce an acyclic graph or tree-shaped expansion hierarchy. Source-reference validity alone cannot prove execution semantics; AI review remains necessary.

| Review area | Decision, trade-off, and residual limit |
|---|---|
| Complexity | Five entities; no symbol registry, port model, AST, layout coordinates, or runtime instance model. Context-sensitive execution can require separate detail flows. |
| Independence | No method, annotation, language, framework, LSP, or parser is required. Entry evidence can be XML or registration code. |
| Duplication | Ownership is unambiguous. Reuse detail flows and evidence. Separate occurrence nodes preserve separate call sites and failure paths. |
| Execution semantics | Explicit branches, exceptions, transfer mode, and cross-flow links cover the requested cases. This is not a concurrency simulator or a runtime trace. |
| Hierarchy | Expansion is navigation, which keeps caller continuations correct. Automatic in-place subgraph splicing is outside this proposal. |
| Scale and Viewer | Indexed ID lookup supports lazy navigation and boundary stubs. Large flows can still be expensive; authors must choose meaningful detail boundaries. File partitioning and layout are deferred. |
| Evidence | Multi-file references support configured bindings. There is no machine-checkable proof language; reviewers must assess the evidence. |
| Findings and updates | Stable IDs permit separate findings. Rename continuity and ID non-reuse require retained state; they cannot be guaranteed from one fresh scan. |

No repository implementation was available for compatibility testing. The main design risks are evidence quality, ambiguous identity matching, and loss of context when a supposedly reusable flow actually varies by caller. For the last case, use separate flows with distinct documented scopes rather than adding speculative branches.

## Approved decisions

The user explicitly approved all four decisions on 29 October 2026:

1. Use flow-owned nodes and edges, reusable detail flows, and navigation-only expansion. This defers automatic graph splicing.
2. Allow cross-flow asynchronous edges only when supported by verifiable source or configuration evidence. Edges remain owned by their source flow; nonlocal targets are navigation links.
3. Use persistent opaque IDs with retained identity state for rename/move tracking. Do not reuse IDs when identity cannot be established reliably. Ambiguous changes receive new IDs.
4. Adopt the proposed fields and execution vocabulary as the M1-02 baseline, including unresolved nodes and no speculative edges.

M1-02 is authorized to implement this approved model. Changes beyond it require discussion before implementation.
