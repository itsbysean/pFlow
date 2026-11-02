---
name: pflow-regenerate
description: Reanalyze affected pFlow scopes from an M6-01 impact plan and safely update Diagram JSON and Markdown while preserving manual edits. Use for targeted regeneration; do not rebuild HTML.
---

# Targeted documentation regeneration

Start from the reviewed M6-01 impact plan, its original Git change evidence/fingerprint, trusted generated baseline bundle/source snapshot and current documentation. Read [workflow.md](references/workflow.md). Missing provenance or uncertain ownership is a reason to preserve originals and prepare a review proposal, not permission to overwrite them. Do not rerun full generation/build automatically.

1. Recheck the [impact workflow](../pflow-impact/SKILL.md): direct/transitive Flow IDs, entry rediscovery, incoming/outgoing relationship review, changed source identities and unresolved areas. Resolve uncertainties with targeted inspection or require broader reanalysis before applying. Keep the original comparison scope; reject stale source/index/doc fingerprints.
2. Reuse the existing [discovery](../pflow-discovery/SKILL.md), [execution](../pflow-execution-flow/SKILL.md), [boundary](../pflow-external-boundaries/SKILL.md) and [async-linking](../pflow-async-linking/SKILL.md) procedures only for the affected scopes and required dependencies. This regeneration request authorizes those analysis steps; their standalone stop markers remain stage boundaries. Do not inspect unrelated handlers or execute target code/services.
3. Follow [generation rules](references/generation.md) to produce complete reviewed replacements for changed Flow content and a single coherent candidate graph. Preserve unchanged logical IDs and reuse validated evidence. Remove obsolete calls, recipients and registrations instead of unioning old edges into new results. Broaden the plan when changed evidence or shared context reaches another scope.
4. Use [preservation and apply](references/preservation.md) for canonical Markdown, baseline/current/candidate merging, staging, shared validation and recoverable apply. No ownership markers or public schema fields are introduced. Retain manual notes, unrelated files and existing HTML bytes. Conflicting edits or uncertain deletions block the entire update.
5. Review the staged diff and evidence before applying. Recheck the exact source and document inputs, validate all graph/docs references against current source, then apply only the validated staged bytes. On failure, preserve/restore the last valid bundle and report any retained recovery path.

Use the trusted helper [prepareRegeneration](scripts/regenerate.mjs) for these checks where available. It applies reviewed analysis candidates, not automatic source analysis. Its temporary input/output objects are not a persistent schema or identity engine. Report changed/unchanged artifacts, retained/new/removed identities, source/routing changes, manual-content handling, validation, apply/failure status and unresolved limits.

No HTML rebuilding, Builder/Viewer rewrite, findings, mandatory AST/parser, target dependency installation or Git history/index edits are included. Report existing HTML as stale when docs change. Stop before M6-03.
