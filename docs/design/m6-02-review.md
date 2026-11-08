# M6-02 completion and review

Implemented on main afdb8f2 while preserving the existing uncommitted M6-01 changes. Project history remains unchanged and implementation changes remain uncommitted. No M1 contract, mandatory dependency, analysis engine, Viewer, Builder, HTML rebuilding or M6-03 feature was introduced.

## Files created or modified for M6-02

- src/skills/pflow-regenerate/SKILL.md and references/{workflow,generation,preservation}.md: plan-driven M5 reuse, ownership/provenance, lifecycle/identity, source refresh, preservation and safe apply.
- src/skills/pflow-regenerate/scripts/regenerate.mjs: candidate scope/identity/evidence guards, source/doc freshness, private mirror validation and apply orchestration.
- src/skills/pflow-regenerate/scripts/safe-update.mjs: native text three-way merge, exact bundle fingerprints and recoverable directory replacement/rollback.
- test/targeted-regeneration.test.mjs and test/safe-update.test.mjs: twenty-six integration and preservation/transaction tests.
- test/fixtures/regeneration/baseline/{graph.json,roles.json,docs/index.md,docs/flows/*.md}: approved generated fixture text/identities; raw source reuses the M6-01 impact fixture. Names avoid default Builder discovery.
- src/skills/pflow/SKILL.md and references/workflow.md, src/skills/pflow-impact/references/impact.md: explicit routing without starting HTML generation.
- README.md, docs/targeted-regeneration-evaluation.md, docs/design/m6-02-plan.md and this file: usage, evaluation, plan and completion record.

## Workflow and preservation

Consume the final reviewed M6-01 impact plan plus its original collector fingerprint, not just the conservative graph draft. Resolve uncertain scopes through targeted or broader M5 discovery/execution/boundary/link review. Produce complete affected Flow replacements in one coherent M1 envelope; do not union stale edges into candidates. Preserve surviving logical IDs and evidence roles, retire unsupported identities/relationships and update entry/index/canonical references together.

No generated/manual boundary exists in M1; anchors are graph associations, not ownership labels. The compatible mechanism uses an explicitly approved generated baseline, current user-edited text and new generated candidate. Native git merge-file preserves disjoint manual edits. Overlaps, uncertain ownership, manual graph divergence and deletion of edited documents block apply. No mandatory markers, new public fields or persistent merge/ownership format were added, so no contract approval was required.

Unchanged files are omitted from replacements. Out-of-scope Flow/entity/evidence changes are rejected; shared documents protect unaffected canonical Flow content, including nested parent sections. Paths and ranges are refreshed against current source. The candidate is staged outside the target with original source-relative layout, materializing referenced evidence for the existing full validator. Exact source bytes/realpaths, live working-tree comparison, current bundle and validated stage are rechecked before apply.

Apply copies the validated bundle into an owned sibling, backs up the old directory, then renames the replacement into place. Ordinary errors restore the original; rollback failure reports and retains the original backup. This is recoverable, not crash-atomic. Existing HTML and unrelated/manual files retain bytes and modes. No Builder call occurs, and HTML is reported stale.

## Tests and validation

- Focused tests: 26/26 passed (15 targeted integration and 11 merge/transaction checks).
- Full npm test suite: 465/465 passed, no skips. Existing browser/HTML tests run in isolated regression fixtures; M6-02 does not rebuild target HTML.
- Official Skill quick validators: regeneration and impact Skills passed; main Skill routing also validated.
- Existing M1 schema 1.0.0, semantic and Markdown validation pass on merged staged candidates and actual applied targets.
- Cases cover changed/independent Flows, shared callers, new branches, removed invocation/relationship, new/removed entry, stable-identity move, async destination mismatch, manual notes/conflicts/edited deletion, no-op bytes, stale source/docs/stage, missing ownership/unresolved impact and invalid graph preservation.
- Injected first/second rename failures restore prior bytes; rollback failure retains a reported recovery path. Pipeline-level apply failure also verifies complete restoration.
- Added committed-comparison stale-source and valid nested-Flow negative/positive regression cases after independent findings.
- Read-only target source/index/HEAD checks remain passing. Temporary Git commits are authored fixture setup only, never production helper operations or project history edits.

## Blind reanalysis and independent applied-result check

A fresh agent received only changed raw source, old approved generated bundle/source snapshot, trusted provenance and original M6-01 plan/change evidence. It could not read tests, future candidates/oracles, generator scripts or reviewer answers. It inspected actual M5 invocation/configuration/registration/adapter evidence, resolved documentation-only uncertainty, generated candidates and reviewed the complete stage diff before apply.

The combined case removes beta activation and adds gamma selecting alpha/shared; shared now has a skip early return and wrapped normal return. The jobs destination becomes jobs.v2 while its consumer remains jobs.v1. The agent removed the obsolete forward receive edge, retained the compatible reverse relay edge, retired beta's unused root/document, added gamma's execution context, refreshed shared source evidence and preserved the hand-maintained operator note.

Post-apply validation returned zero errors against actual current source. Independent review verified raw source semantics, graph/docs, 36 retained IDs, 12 new IDs and 10 removed IDs. Source plus the complete .git inventory/hashes/modes exactly match pre-apply records. HTML, alpha/consumer/unrelated Flow Markdown and user-notes bytes/modes are identical; the Operator note appears exactly once. Changed files are architecture.json, docs/index.md and docs/flows/shared.md; gamma.md is added and beta.md removed. No target application/service or Builder executed. The report/candidates remain temporary evaluation observations under /private/tmp/pflow-m6-02-forward, not public formats.

## Review findings and fixes

Delegated research confirmed the actual ownership gap and staging realpath requirement. A separate review found two verified defects:

1. Commit-only Git fingerprints did not bind current source bytes: current source could change after validation and still apply. Added current worktree and raw evidence/canonical-path guards through staging/apply, including ignored referenced inputs. Commit plans require matching current non-bundle source, and out-of-scope evidence bytes cannot change silently.
2. A single active-block recognizer lost an unaffected parent when a nested Flow began. Replaced it with nested-context tracking and protected exclusive parent content while allowing affected child updates.

The review's original controlled reproductions now reject at the intended boundaries. Independent combined focused tests passed after fixes. Further guards protect entry-only evidence, no-scope graph edits, duplicate normalized document inputs and validated-root arguments. The full regression suite passes. Independent applied-case review found no verified residual defect; no unresolved critical issue remains.

## Limits and next task

Source meaning, ownership and logical continuity still require trusted input and review. The helper accepts reviewed complete candidates; it does not analyze source, infer historical identities or reconstruct baselines. A physical in-repository bundle and retained baseline are required; manually edited Diagram JSON, external bundles and symlink/special bundle paths need reconciliation or a reviewed proposal. Semantic validation cannot prove source truth or delivery guarantees.

Directory copies preserve bytes/modes, not all timestamps, inodes or extended attributes. Fingerprints do not eliminate adversarial concurrent filesystem races; process/machine interruption between renames may require recovery from the retained backup. Conflicting or now-invalid manual references require review rather than deletion. Retain the approved new generated text and provenance separately for a future run; no persistent ownership/identity database is implemented.

Recommend defining M6-03's separate output/update contract against these validated regenerated artifacts, with explicit recovery, baseline retention and stale-HTML handling. M6-03 has not started and requires separate approval.
