# M4-01 review and completion

Implemented on local `main` after `6bd5c79`. Model/schema 1.0.0, Markdown profile, sample artifacts, Viewer and search remain unchanged.

## Files

| Files | Change |
|---|---|
| `builder/arguments.mjs` | One build command, explicit input/output arguments, help/version parsing |
| `builder/cli.mjs` | CLI entry, package version, phase/path diagnostics, nonzero failures and explicit preparation-only success |
| `builder/pipeline.mjs` | Stable discovery/loading, validation integration, output-path checks and private normalized input |
| `builder/README.md` | Usage, root/bundle conventions, boundaries, internal interface and distribution limits |
| `validation/validate-artifact.mjs` | Existing approved schema and semantic validator promoted from test support; schema is a static JSON import |
| `validation/validate-documentation.mjs` | Existing Markdown-profile checker promoted from test support, with stable file order and regular-file guard |
| `test/support/validate-artifact.mjs`, `test/support/validate-documentation.mjs` | Compatibility wrappers preserving existing fixture-root defaults |
| `test/builder.test.mjs` | Real temporary bundles and CLI subprocess tests |
| `package.json`, `README.md` | Source CLI script and shared-validation/preparation documentation |
| `docs/design/m4-01-plan.md`, this file | Research, plan and review record |

## Implemented behavior

`node builder/cli.mjs build --input . --output architecture.html` discovers the existing three samples, validates them and prepares three unchanged M1 envelopes plus six raw Markdown documents in memory. It states that no HTML was created or overwritten. `--help`, `--version` and `npm run archdoc -- ...` work. No success message is emitted on failure.

Input is the repository root for approved source-relative paths. Discovery follows the existing architecture.json + sibling docs/index.md arrangement rather than adopting illustrative flows/diagrams folders. All candidate artifacts are checked in stable order; unrelated JSON and unreferenced Markdown are outside the architecture corpus. Directory symlinks are not traversed, and .git metadata is excluded.

The private preparation object stores resolved input/output locations and sorted artifact/document records. Original graph arrays, IDs, fields and raw Markdown strings are retained. It is not a second public architecture schema or a persisted format. No source snippets, Viewer payload, search index or HTML is generated.

## Separate review pass

A separate self-review checked correctness, containment, validation reuse, diagnostics, determinism, dependency footprint and future packaging. No sub-agent review was performed.

- Both production and M1 tests call the same validator modules. The Builder has no test-helper dependency or inferred source-checkout root. Existing Ajv configuration and approved schema remain authoritative; no parallel schema or semantic framework was added.
- Discovery/normalized records and diagnostics use stable code-unit ordering. No clock, random ID or generated revision is included. Repeat runs produce equal preparation data and CLI output.
- Candidate JSON, docs directories, document files and repository evidence are bounded by real paths. Approved Markdown evidence links can leave docs only to match a contained repository SourceReference. Directory link cycles are not traversed. Source and fenced Markdown content are treated as data.
- Output is user-controlled and may be outside input; it cannot widen reference resolution. Writable existing parents, HTML extension, regular destinations and input/evidence collisions are checked, including symlinks and hard links. No writes occur in this milestone.
- Review tightened two file-type cases: a directory named architecture.json now fails as a bad candidate, and the required index is checked as a regular file before reading. This also prevents special files from being treated as Markdown streams.
- Schema diagnostics include supported constant/enum values, and terminal control characters are escaped in untrusted filenames/messages.
- No new dependency was added and package-lock.json is unchanged. Static schema/version imports and explicit roots are compatible with a later distribution bundle. This task does not produce dist/archdoc.bundle.mjs or require npm installation in a target checkout.

## Validation

`node --test test/builder.test.mjs`: **39 passed**.

`npm test`: **320 passed, 0 failed, 0 skipped**. Existing schema/semantic/Markdown, graph/navigation/search and offline Chromium checks all pass after validator promotion.

Builder coverage includes arguments/help/version, target checkout without node_modules, all real samples, normalized content equality, stable discovery/diagnostics/output, multiple invalid artifacts, schema versions/vocabulary/required fields/source structure, dangling edge/detail/root references, duplicate IDs, cross-flow semantics, Markdown ownership, missing input/index/documents/sections, invalid JSON, traversal/symlink/file-type failures, output path/link/collision failures, no-write behavior and untrusted executable-looking Markdown.

`npm run archdoc -- build --input . --output architecture.html` succeeds with three architecture artifacts and six Markdown documents; architecture.html remains absent. Existing-output preservation is also tested. `git diff --check` passes.

## Limits and next task

The source checkout needs its existing development dependencies. A future prebuilt Skill distribution must include validator code/schema/dependencies and require no npm install in the target repository. No distribution, final HTML generation or Viewer bundling is implemented here.

Discovery uses physical directories and exact architecture.json filenames, not Git-ignore rules or arbitrary graph-file naming. Output parent directories must exist. Source ranges and evidence definitions are checked against the current filesystem; evidence meaning and historical identity require review. No concurrent hostile-filesystem snapshot guarantee, watch mode, source extraction or general artifact migration framework is provided.

Recommended next task: **M4-02**, after its scope is confirmed. It was not started.
