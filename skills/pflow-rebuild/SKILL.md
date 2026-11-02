---
name: pflow-rebuild
description: Validate the complete pFlow architecture documentation set and safely rebuild standalone offline HTML after regeneration. Use existing M1/M4 tooling; do not rerun source analysis merely to rebuild.
---

# Consistency validation and HTML rebuild

Read [consistency.md](references/consistency.md) and [rebuild.md](references/rebuild.md). Confirm the trusted pFlow tool root, target source root, complete documentation input scope and HTML destination. Preserve uncommitted/unrelated work. Use the existing Builder and validators, never target scripts, dependency installs, services or another renderer.

For a complete incremental request, use the existing [impact](../pflow-impact/SKILL.md) → [targeted regeneration](../pflow-regenerate/SKILL.md) workflows, then continue here after successful apply. Their individual stop markers remain stage boundaries. For a rebuild-only request, consume the current applied artifacts and existing analysis/review; do not repeat M5 analysis or regenerate documents.

1. Inspect the complete selected architecture set with [inspectArchitectureSet](scripts/rebuild.mjs), not just changed files. For repository-wide discovery select the source repository as input. List every discovered architecture.json and its mapped Markdown corpus. A narrower documentation root is valid only when it is the explicitly selected complete publication scope.
2. Resolve deterministic schema/semantic/Markdown/source/navigation failures through the existing validators. Deleted entities must have no dangling canonical links, hierarchy or cross-flow targets. IDs are scoped to each envelope: do not merge independent graphs or reject their repeated IDs.
3. Complete the entry/index inventory review required by the existing Markdown contract. Compare every current entry, trigger and root Flow with its index, using the M6-02 lifecycle report where available. Valid Flow links alone do not prove old entry prose is current. Preserve manual text; unresolved stale/ambiguous entries block rebuilding. Record the result against the exact inspection digest, without adding public metadata or imposing a new index syntax.
4. Call rebuildArchitectureSet with that matching review result. It uses the existing M4 writer to build a private candidate, rechecks the complete inputs/Viewer assets and old output, then atomically replaces only HTML. Identical bytes skip replacement. Validation, review, build or publication failure preserves the previous HTML and all Markdown/JSON.
5. Report artifact/corpus counts, diagnostics and corrective scope, index review, rebuilt versus unchanged HTML, source-snippet warnings and offline verification performed. If rebuild fails after a successful M6-02 update, retain those validated docs and report the old HTML as stale; do not undo regeneration or present stale HTML as current.

No new repository analysis, schema, index markers, rendering/search engine, Viewer rewrite, findings, Git history/index edits or M6-04 work is included. Request source reanalysis only when a real inconsistency needs it. Stop after validation/rebuild.
