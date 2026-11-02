# Targeted regeneration evaluation

[pflow-regenerate](../skills/pflow-regenerate/SKILL.md) consumes a reviewed M6-01 impact plan and its original Git evidence, reuses the four M5 analysis procedures, and applies reviewed graph/Markdown candidates. It is not a second source-analysis engine. No schema or persistent patch/ownership format is introduced.

## Preservation contract

M1 has no general generated/manual boundary. Entity anchors identify graph sections, not authorship. A trusted approved generated baseline is required for replacement/merge. Matching bytes alone are not ownership proof. Native git merge-file combines baseline→current manual edits and baseline→new generated text; nonconflicting notes survive. Unknown ownership, overlapping edits, manually deleted documents or deletion of edited text block the update. No new markers are required.

The candidate graph is a complete M1 envelope after scoped replacements, not a union that retains old edges. Existing out-of-scope Flows, activation/evidence and canonical section text are protected. Nested Flow sections preserve their unaffected exclusive parent text. Current graph edits that differ from the generated baseline require reconciliation rather than blind merging. Entry removal, index references and generated-file removal are checked together by existing validation.

## Fixture-backed integration

[test/fixtures/regeneration/baseline](../test/fixtures/regeneration/baseline/) contains approved generated fixtures with separate Flow documents; raw source is reused from the M6-01 impact fixture. Tests materialize these in disposable Git repositories with retained source/docs snapshots. New temporary commits are fixture setup only. Production helpers never commit/stage/checkout target files. An existing HTML sentinel and unrelated manual note must remain byte-identical.

Run `node --test test/targeted-regeneration.test.mjs test/safe-update.test.mjs` (26 tests). These feed reviewed authored M5 candidates to the real helper after actual source edits and real M6-01 impact collection. They do not call a model in CI or claim automatic source-analysis correctness.

| Case | Verified result |
|---|---|
| One changed Flow | Changed graph/prose applied; independent Flow, manual file and HTML bytes retained. |
| Shared return shape | Shared plus parent scopes reviewed; changed descriptions use retained identities and source evidence. |
| New conditional exit | New decision/branch replaces obsolete local edge; unrelated async identity remains. |
| Removed publication | External invocation and forward transfer disappear rather than surviving a union. |
| New/removed entries | Planned rediscovery updates index and entry roots; unused generated document is removed while shared detail survives. |
| Proven move | Same evidence/entity IDs survive with refreshed paths; imports are repaired by the authored source mutation. |
| Messaging destination | Unsupported forward receive edge is removed; external broker and valid reverse relay survive. |
| Manual content | Disjoint notes survive; edited-document deletion/conflicts/unknown ownership block. |
| Validation/apply failure | Existing bundle stays intact or is restored; rollback failure retains and reports original backup. |
| Stale or unresolved plan | Changed source/docs/stage, broader-analysis requirement or missing ownership prevents overwrite. |
| Nested shared Markdown | Unaffected parent prose is protected while affected child text can change. |
| No regeneration | Bytes remain identical and apply returns an unchanged result. |

The helpers validate baseline against baseline source, and the merged candidate against current source in an external temporary mirror with original relative layout. This preserves exact evidence-link realpaths without rewriting citations toward staging. Source hashes/canonical paths, live working-tree evidence and bundle/stage fingerprints are checked again before apply. Commit comparisons still require a matching current source tree; immutable commit diff alone cannot protect live inputs. Referenced ignored inputs are included in raw evidence fingerprints.

Application copies exact validated bytes/modes into an owned sibling, backs up the current directory and renames the candidate into place. Ordinary failures roll back. This is recoverable, not a crash-atomic transaction; interruption can require recovery from the retained backup. Symlink/special bundle paths and unsupported outside-repository bundles fail rather than broadening writes. Unrelated files and HTML are copied unchanged; HTML is reported stale, never rebuilt.

## Blind source reanalysis

A fresh agent received raw changed source, the actual old bundle, trusted generated/source provenance and an M6-01 plan/change fingerprint. It could not read tests, future candidates/oracles, generator scripts or review answers. It refined document-only uncertainty, reused M5 analysis, inspected the actual stage diff, then invoked the unchanged helper. Its target changes combine a conditional shared return, registration replacement, changed jobs destination and a hand-maintained operator note.

The evaluation checks obsolete entry/root/file and async-edge removal, new entry mapping to a surviving handler, stable IDs for unchanged entities, source refresh, manual note retention and byte-identical unaffected documents/HTML. The completion record reports final independent verification and explicit limits. No target application, broker or Builder execution is needed.

## Limits

Structural validation cannot prove source meaning or logical identity. Tests exercise reviewed candidates; blind AI evaluation supplies a separate observed reanalysis. A generated merge base and current physical source snapshot must be available. The tool does not infer ownership, reconstruct historical source or persist a future identity/ownership database. Retain approved generated text/provenance separately for the next run; merged manual text is not automatically a generated-only base.

Directory replacement preserves content and permission modes, not every timestamp, inode or extended attribute. Fingerprints detect normal stale inputs but do not eliminate hostile concurrent filesystem races. Unknown ownership or conflicting manual references need an explicit reviewed proposal. See [completion and review](design/m6-02-review.md). M6-03 has not started.
