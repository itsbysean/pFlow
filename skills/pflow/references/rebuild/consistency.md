# Consistency scope and diagnostics

The [M1 model](../contracts/model.md), [schema](../contracts/schema.md), [Markdown profile](../contracts/markdown.md) and [M4 Builder contract](../runtime.md) remain authoritative. Use prepareBuild through the integration helper: it discovers every exact architecture.json under the selected root, validates every envelope and its complete mapped docs, and prepares safe rendered content/snippets without writing. It already aggregates sorted diagnostics. Do not duplicate its checks.

IDs are unique across entities inside one architecture document. Independent envelopes may reuse IDs. Cross-flow edges, detail references and entry roots must resolve inside their own envelope; another file containing the same identifier cannot repair a missing target. No cross-envelope resolver is approved. Validate all envelopes, including untouched ones, before publishing the combined Viewer.

The corpus is each artifact's resolved Markdown-root index.md plus entity docs paths (flat root or legacy sibling docs/). Existing validators cover schema/version, unique IDs, endpoints, Flow ownership, local starts, terminal exits, hierarchy targets, branch constraints, cross-flow async receive, reachability, source containment/ranges, canonical section backlinks/nesting, local document links and index Flow coverage. Unknown references are errors; a valid unresolved node is an analysis limitation, not a missing graph target. Valid graph/navigation cycles remain supported.

Do not scan arbitrary manual Markdown as architecture data or infer retired-file ownership. Compare the known M6-02 changed/removed inventory with discovered corpora. Report a known retired generated file that remains outside the corpus for ownership review; do not delete it automatically. Source evidence checks are bounded to referenced files; they cannot establish complete repository analysis or source meaning.

## Existing index review requirement

M1 requires listing entries and evidenced triggers beside root Flow links, but labels and prose are not machine-associated with EntryPoint IDs. The existing checker validates navigation targets and Flow coverage; an old beta entry can still point at a surviving valid Flow. Arbitrary heading/title/keyword heuristics would reject legitimate detail/history prose and change the approved convention.

Use the existing required human/agent review instead: inspect current index text together with the full current entry inventory and M6-02 lifecycle findings. Confirm every entry/trigger/root is present and no stale entry is described as active. Canonical EntryPoint anchors, when present, already get deterministic ID checks. Plain text requires review. This is documentation inventory review, not rerunning code analysis. Existing completed review can be reused only when bound to the exact unchanged inputs.

inspectArchitectureSet returns an internal digest and indexInventory for all envelopes. A transient indexReview contains that digest, pass/fail outcome and findings. Supply pass only after review; never copy the digest as a substitute for it. Missing, rejected or stale review blocks HTML replacement. These are tool-call arguments, not a new persisted schema, source-analysis field or mandatory Markdown representation. An automated strict entry-row representation would require separate contract approval and is not implemented.

Keep actionable diagnostics in the existing artifact/phase/path/message form. Review findings should add the entry/reference ID and suggested correction where known. Distinguish schema/semantic/Markdown/source/output failures from review-required analysis limitations. Fix the actual owner envelope or canonical association, not another envelope with a similar label.
