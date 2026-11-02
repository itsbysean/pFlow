# M4-02 review and completion

Implemented on local main after c4b6ac5. Public model/schema 1.0.0, Markdown associations, sample artifacts and execution semantics are unchanged.

## Files

| Files | Change |
|---|---|
| `builder/markdown.mjs` | Node adapter to the existing safe DOM renderer, serialized fragments and literal section metadata |
| `viewer/markdown.js` | Injected document support, basic emphasis and declarative document/source control attributes; same live callbacks retained |
| `builder/sources.mjs` | Bounded UTF-8 reads, canonical path checks, numbered range extraction, deduplication and explicit diagnostics |
| `builder/pipeline.mjs` | Separate repository root, bounded validation reader, processed documents/snippets and sorted warnings in private preparation data |
| `builder/arguments.mjs`, `builder/cli.mjs` | Optional repository-root flag, processing counts and warning output; no disk generation |
| `validation/validate-artifact.mjs`, `validation/validate-documentation.mjs` | Optional bounded source reader with strict existing defaults; empty/CRLF/LF/CR line counting |
| `test/content-processing.test.mjs`, `test/viewer.test.mjs` | Content/security/source/integration tests and actual browser equivalence with shared rendering |
| `package.json`, `package-lock.json` | Pin LinkeDOM 0.18.14 as a source-tool development dependency |
| `README.md`, `builder/README.md` | Updated commands, internal content interface, warning policy, limits and packaging boundary |
| `docs/design/m4-02-plan.md`, this file | Research/plan and separate review record |

## Implemented behavior

The Builder calls the existing M1-03 native-DOM renderer with a LinkeDOM document. Only the fixed DOM shell is parsed as HTML; untrusted Markdown is rendered through text nodes and approved elements. Explicit section IDs remain unchanged. Supported document links/source citations carry validated data attributes for later binding. Raw Markdown is retained for existing M3 search. No alternate Markdown or graph implementation is introduced.

Source paths resolve relative to optional `--repository-root`, defaulting to `--input`. Discovery/Markdown remain bounded by input; evidence stays within the canonical configured source root. Explicit inclusive ranges become numbered text lines, independent of source language. Symbols and location metadata stay in the original envelope. Matching file/range references share one snippet. File-level evidence has no guessed fallback range. Unused source records do not embed unrelated content.

Missing, moved, unreadable, nonregular, escaping or invalid UTF-8 sources and invalid/stale ranges fail. File-level or safety-limit unavailability produces a warning and retains location metadata. Limits default to 1 MiB/file, 200 lines/range, 64 KiB/snippet and 1 MiB snippet text/artifact. No partial snippet is silently truncated. Oversized file warnings explicitly say bounds could not be verified. Full text is discarded after processing.

## Separate review pass

A separate self-review checked rendering, XSS/protocol handling, root containment, line accuracy, limits, deduplication, deterministic output, offline execution and Viewer compatibility. No sub-agent review was performed.

- The Builder and Viewer use one renderer. Node processing adds a pinned DOM implementation instead of a second parser, custom DOM facade, browser requirement or unrestricted HTML sanitizer pipeline. Browser runtime scripts/dependencies are unchanged.
- Serialized output contains no untrusted href/src/event attributes. Malicious script/SVG/image/code-closing content stays text. Unsupported protocols and escaping document links are inert at renderer level and rejected by full contract validation.
- Source path checks occur in shared validation and in the processing reader/extractor, including canonical symlink containment. Reads use file descriptors, regular-file checks, a size precheck and a bounded read. Source content is never executed or interpreted.
- Review excluded unused SourceReference records from embedding. It also added word boundaries for underscore emphasis so source symbols such as run_refresh remain plain, and corrected empty/CR-only line counting alongside CRLF/LF support.
- Numbered snippets retain whitespace and Unicode; deduplication uses canonical file plus exact range and preserves all associated SourceReference IDs. Overlapping but different ranges remain independent.
- Internal additions are rendered fragments/section labels, snippets and diagnostics, not new public model fields. Serialized control binding and Viewer source-pane population are reserved for M4-03. Live document/search navigation remains intact.

## Validation

`node --test test/builder.test.mjs test/content-processing.test.mjs`: **74 passed**.

`npm test`: **356 passed, 0 failed, 0 skipped**. Coverage includes existing M1 schema/semantic/Markdown tests, M2/M3 offline browser regressions, malicious Markdown/protocols, formatting and literal IDs, source/control metadata, UTF-8 and CRLF/LF/CR, exact numbering/indentation, duplicate/multiple references, empty/missing/stale/unreadable files, safety limits, traversal/symlink escape, separate roots, warning/fatal behavior, no unrelated content, and deterministic integration.

A Chromium test compares shared native Viewer rendering with serialized Builder fragments and verifies that raw Markdown still produces the same section search targets. Existing highlight, node/edge navigation and source-reference controls pass. Viewer tests continue to block HTTP(S) and reject browser errors.

Preparing the real repository yields three artifacts, six rendered Markdown documents, **19 unique snippets** (8 synchronous, 6 asynchronous, 5 custom) and no warnings. The separate-root command works:

```sh
node builder/cli.mjs build --input examples/a-sync --repository-root . --output architecture.html
```

It prepares eight snippets and leaves architecture.html absent. `git diff --check` passes.

## Limits and next task

Rendering remains the small M1-03 subset, not all CommonMark or nested inline formatting. Serialized buttons have declarative associations; M4-03 must bind them to existing Viewer APIs. Snippets are plain numbered text without syntax highlighting. No symbol-range inference, whole-file fallback, historical checkout verification or concurrent-hostile-filesystem snapshot guarantee is provided. Oversized source line bounds cannot be checked within this policy and are explicitly warned. Chromium was tested; other browser engines remain unverified.

LinkeDOM and its locked dependencies are installed only in the pFlow source/tool environment. A later prebuilt Skill must carry required dependencies without npm installation in the target repository. No final standalone HTML, Viewer bundle or distribution package is generated.

Recommended next task: **M4-03 — Standalone HTML packaging**, after its scope is confirmed. It was not started.
