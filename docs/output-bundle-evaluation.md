# M7-03 output policy and bundle compatibility

The existing orchestration uses builder/output-policy.mjs selectOutput. The Builder, HTML writer and M6 integrations use builder/bundle-layout.mjs. There is one graph/Markdown validation and rendering pipeline, with unchanged schema 1.0.0 and Viewer code.

## Selection and roots

Default repository selection starts at the actual analyzed project; prompt selection starts at cwd. Existing docs/ wins, otherwise existing doc/, otherwise new docs/, then architecture/. A selected collision/unwritable directory/symlink is an error, never a reason to fall back silently.

An explicit workspace alone or explicit output directory is the final bundle destination. With both, a relative output directory is inside that workspace; an escaping absolute destination is rejected. Registered-folder ordering has no role. Repository evidence remains rooted at the actual project even for external output. Prompt evidence stays inside the selected document boundary. No Git repository is needed for prompt full generation/build.

selectOutput is read-only unless create:true is supplied. Creation only makes validated directories; it never writes graph, Markdown, evidence or HTML, establishes ownership, migrates layouts or grants overwrite approval. Use returned roots/paths in generation and pass known source/evidence absolute paths as protectedPaths. Roots must be canonical: symlinks in selected paths, including ancestor aliases, are conservatively rejected. Do not canonicalize away a rejected child path to move output into another workspace.

## Supported layouts

```text
New flat:                       Existing legacy:
  index.md                        architecture.json
  flows/*.md                      docs/index.md
  diagrams/architecture.json      docs/flows/*.md
  evidence/request.md (prompt)     evidence/request.md (prompt)
  architecture.html               architecture.html
```

Discovery still recognizes only architecture.json and does not traverse directory links. The resolver recognizes a flat graph in diagrams/ with its parent Markdown root, or a legacy graph with sibling docs/. A complete independent legacy envelope named diagrams may remain nested under a parent legacy envelope; it has its own docs/index.md and is not mistaken for a competing flat graph. No envelope IDs are merged.

Competing root/diagrams graphs for one corpus, root and legacy indexes, or competing diagrams/docs are rejected. A flat input selected at diagrams/ alone cannot read parent Markdown outside its input boundary. Existing valid legacy bundles are not rewritten or converted.

JSON docs paths such as flows/process.md remain relative to the resolved Markdown root. SourceReference paths remain relative to the actual evidence root. Source definitions are relative to each Markdown file and must identify the same physical file/range. New flat flows normally cite ../evidence/request.md; legacy docs/flows cite ../../evidence/request.md. Rebase citations when authoring a new layout; do not alter evidence to satisfy a path.

The indexed corpus remains index.md plus entity-associated Markdown. Raw evidence beneath the flat filesystem root is not automatically a canonical/search document. Preparation's added layout/path metadata is internal and excluded from embedded graph/Viewer payloads. No public field or evidence relaxation was introduced.

## Builder and incremental integration

CLI flags stay unchanged: --input <bundle>, --repository-root <evidenceRoot>, --output <bundle>/architecture.html. The orchestration helper selects/creates directories; CLI builds still require input/output and an existing writable output parent. All output is standalone and read-only, without runtime fetch/server dependencies.

HTML collision protection and whole-set rebuild fingerprints now use actual docsRoot rather than reconstructing sibling docs/. Rebuild index inventory includes its resolved indexPath for actionable review diagnostics. Source/evidence files and Viewer assets remain protected; changed Markdown, prompt evidence, layout markers or assets block stale publication.

M6 baseline/current/staged graph and Markdown paths use the same resolver. Matching flat or legacy repository layouts are supported. A baseline/current mismatch is blocked instead of silently migrating. Git/snapshot provenance, allowed scope, stable edge identity, source/output separation, manual merges, complete validation, source/stage fingerprints, recoverable apply and safe HTML replacement remain unchanged.

Prompt incremental merging remains unsupported; prompt evidence inside output is valid for full builds/rebuilds but cannot bypass M6's overlap guard. External repository full generation remains supported; targeted apply still requires a separate contained bundle inside the actual source project. A request to change that safety scope needs a separate decision.

## Focused tests

New suites are test/output-policy.test.mjs, test/bundle-layout.test.mjs and test/flat-incremental.test.mjs. They use real temporary files and existing validators/CLI rather than a second renderer or mocked pipeline. Existing sample/fixture bundles are not migrated.

- Selection: docs/, doc/, new docs/, docs preference, source-root versus cwd, explicit final workspace/bundle, separate folders, no unnecessary repository evidence, file/directory collisions, unwritable roots, traversal, ancestor/child symlinks, protected source hardlinks including aliases, and retained legacy bytes.
- Bundle compatibility: flat and legacy canonical docs/evidence, exact numbered snippets, deterministic HTML, no absolute root leakage or runtime assets, independent nested legacy envelopes, mixed-layout diagnostics and previous-HTML preservation.
- Invalid inputs: source traversal and symlink escapes, escaped documents, line ranges, missing sections and output/Markdown hardlink collisions.
- M6 flat repository updates: actual Git impact → apply → rebuild; manual notes, IDs, unaffected files, previous HTML before rebuild, repeated byte/inode/mtime idempotence, rejected migration/provenance/output evidence, second-rename rollback and failed publication preservation.
- Freshness: changed flat Markdown or prompt evidence prevents stale HTML replacement.
- Offline Chrome: flat HTML relocated away from inputs still supports keyboard detail navigation/back, exact clarification snippets and Markdown search/highlights, with only the HTML request and no page errors.

These are deterministic authored fixture/browser checks, not a new AI accuracy or real-repository discovery evaluation. Existing M7-02 prompt and M1–M6 suites remain part of the full regression run. Full/independent final results are recorded in the completion report.

## Review corrections and limits

Independent review found two new-code issues during development: a protected source alias could hide a hardlink collision, and an independent nested legacy bundle named diagrams could be mistaken for flat output. Both were corrected with targeted regressions. Output-only destinations with an earlier symlink ancestor were also hardened and tested.

Path checks/fingerprints are not a guarantee against adversarial filesystem races. Directory creation is not a multi-file transaction and does not authorize overwriting existing content. The existing Builder atomically replaces HTML; M6 bundle apply retains its documented ordinary-error rollback limits. Canonical roots are required by the selector; the unchanged Builder's evidence aliases remain supported within their root.

No prompt ownership engine, new schema, Viewer redesign, M7-04 presentation change or M8 feature is implemented. Stop after M7-03.

## Final results

Focused output/layout/flat-M6 tests: **44/44 passed**. Full npm test after the final index-path diagnostic update: **551/551 passed**, zero failures/skips. The four affected Skills pass official quick validation.

Independent review covered the code/path invariants and all 44 focused cases, including a separate successful offline Chrome rerun. It found no verified residual issue; it did not independently rerun the full suite. The root performed the final full run. See [completion and review](design/m7-03-review.md) for exact changed files, corrections, evidence boundaries and remaining limits.
