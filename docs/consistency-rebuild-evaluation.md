# Complete-set consistency and HTML rebuild evaluation

[pflow-rebuild](../skills/pflow-rebuild/SKILL.md) connects applied M6-02 updates to complete current-set validation and safe M4 HTML publication. It adds orchestration checks, not another schema validator, parser, rendering engine or source analyzer.

## Existing contracts and missing semantic check

prepareBuild discovers every exact architecture.json under the selected input and validates each envelope plus sibling docs/index.md and entity-associated Markdown. It checks untouched artifacts, schema, IDs, local/cross-flow/hierarchy/async references, canonical/index links, source structure/containment/ranges and safe content processing. Independent envelopes may reuse IDs; cross-envelope relationships are unsupported and cannot resolve through another artifact. Unrelated manual Markdown is outside the approved corpus.

Plain entry/trigger prose is the known contract limit. M1 requires entry/index and evidence review, but a deleted entry can leave a valid link to a surviving Flow. The integration does not guess from names, add metadata or impose an unapproved row syntax. It presents the complete current entry/index inventory and requires a completed review bound to the exact inspection digest. Rejected, missing or stale review blocks publication. A pass must come from actual review, not merely copying the digest. Rebuild-only work needs no fresh source AI analysis. Automated strict row enforcement would require a separate approved representation.

Deterministic errors retain the existing artifact, phase, path and message diagnostics; review findings can include the retired/affected identifier and corrective action. Legitimate unresolved calls remain model uncertainty, not unknown graph references. Source meaning, trigger truth and repository coverage are not proven by structural validation.

## Integration and safety

inspectArchitectureSet calls existing preparation twice around whole-input fingerprints to avoid binding stale prepared content. It hashes discovery inventory, artifact JSON, mapped Markdown, all SourceReferences including unused/file-level evidence, canonical paths and declared Viewer assets. It reads referenced source, not the entire repository.

rebuildArchitectureSet requires that matching review, then calls the existing writeStandaloneHTML on an owned private output. After successful generation it rechecks the complete set, assets, stage and old output. Existing validateOutput protection covers input/evidence/Viewer collisions and symbolic-link destinations. A single same-parent atomic rename replaces only HTML. Equal output bytes skip replacement and retain inode/mtime; normal replacement preserves existing permission bits. Owned temporary output is cleaned on ordinary failure. Markdown/JSON and successful M6-02 updates remain intact.

No random values, digest paths or timestamps are embedded in HTML. Packaging remains the existing M4 safe serialization, Markdown/snippet processing, Viewer and search. Existing HTML is reported stale on failure. Process/machine interruption or hostile concurrent edits are not made into an atomic source/docs/HTML transaction.

## Tests

Run:

```sh
node --test test/rebuild-safety.test.mjs test/consistency-rebuild.test.mjs
npm test
```

Seventeen new tests cover:

- Every discovered envelope, including an untouched invalid one, and all mapped documents/source evidence.
- Reused IDs in independent valid envelopes, while a target present only in another envelope remains an error.
- Missing hierarchy/graph/cross-flow targets, invalid async mode and broken Markdown association; valid unresolved source selection remains valid.
- A real beta EntryPoint removed while its Flow and index item survive: existing structural preparation passes, stale review is rejected, and the completed failed review identifies the actual retired ID and blocks HTML.
- Actual M4 packaging failure from unsupported Viewer CSS after successful inspection/review, plus missing asset and validation failures. Prior output and docs remain unchanged.
- Source, asset, discovery inventory, staged output and concurrent prior-HTML changes before publication; atomic rename failure and owned-temp cleanup.
- Output/evidence/Viewer hardlink protection, existing mode preservation, deterministic bytes and unchanged inode/mtime on repeated builds.
- Unused file-level evidence included in fingerprints, unrelated manual repository files excluded.
- Actual M6-01 collection → M6-02 staged regeneration/apply → complete-set review/validation → M4 rebuild, preserving graph/docs/manual/source/index/HEAD.

Test setup creates commits only in disposable authored fixtures. Helpers do not execute target code, hooks, services or project Git mutations. CI candidates are reviewed fixture data, not a live model call.

## Offline verification

The integration browser test applies a real consumer-result change, rebuilds, moves only the HTML and deletes its inputs. Chrome runs offline. It verifies entry switching, hierarchical expansion/back, selected node details, async-edge keyboard inspection, the changed source at numbered line 3 and body search opening/highlighting the updated consumer document. Only the moved HTML is requested and no page error occurs. No actual project E2E or live infrastructure run is added.

See [completion/review record](design/m6-03-review.md) for final results and limits. M6-04 is not started.
