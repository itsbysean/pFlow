# Unified source and release integration results

## Scope and source

Work is on `feat/unified-source-and-releases` in the existing public pFlow working directory. Its HEAD remains `8570cc4`; no commit or push was made. The source import is development commit `5169c38aba106509e354994c29e192d5dd90c267`. The original development working tree remains unchanged. Its commits are also available locally under `archive/development-source`; the feature branch retains the public repository ancestry. That archive branch has not been published or merged into public history.

The planning record is [unified-source-release-plan.md](unified-source-release-plan.md). Operational guidance is [release-workflow.md](../release-workflow.md).

## Changes

- Import tracked development sources, fixtures, tests and completion records into the public source tree. Do not copy `.git`, local dependency folders or generated output.
- Remove the redundant committed `skill/` distribution and cross-repository export script/command. Source Skills remain in `skills/`; installed output is generated in ignored `dist/pflow/`.
- Add `packaging/release.mjs` and the standard-library `archive-skill.py`. They reuse the existing single-runtime builder, validate exact stable version tags, and create a deterministic ZIP with SHA-256. No npm/runtime dependency is added.
- Add `verify.yml` for PR/main verification and reusable tagged verification. Add `release.yml` for checksum-verified publication of the same tested ZIP. Only the publisher gets release write permission. It requires an existing tag and does not overwrite an existing release.
- Preserve the existing website-only Pages deployment workflow, Google verification file, assets, bilingual JavaScript and demos byte-for-byte. Only `website/index.html` changes: download control, ZIP installation text and first-release availability notice.
- Update the root README and add release guidance, a plan, this report and five release integration tests.

## Executed verification

Environment: macOS, Node.js `v26.13.0`, Python `3.15.2`, local Chrome. CI is configured for Node.js 24 and hosted Ubuntu; that environment has not been executed in this local task.

| Check | Actual result |
|---|---|
| Fresh `npm ci --ignore-scripts` in pFlow | 28 packages installed; npm audit reported zero vulnerabilities |
| `npm test` in the actual pFlow working directory | **626 passed**, zero failed/skipped/cancelled; 44.97s; `/private/tmp/pflow-unified-full.log` |
| Five new release cases, included above | Exact 40-file archive/permissions/checksum, byte-identical repeat ZIP, invalid/prerelease tag rejection and previous-output preservation, isolated ZIP runtime/offline HTML/search/keyboard, bilingual download control |
| `actionlint v1.7.11` | All three Workflow files pass. External ShellCheck/Pyflakes integration was disabled; this is Actions syntax/type/expression validation, not hosted execution |
| `npm run build:release -- --tag v1.0.0` | Built real `dist/pflow.zip` and `dist/pflow.zip.sha256` |
| Checksum from `dist/` and ZIP integrity check | Passed; 40 files, about 341 KiB |
| Bundled `--version` | `pFlow 1.0.0` |
| `git diff --check` | Passed |
| Website preservation | Git diff lists only `website/index.html`; workflow, styles, scripts, demos and verification file are unchanged |
| Original development repository | Clean working tree, HEAD still `5169c38` |

Final ZIP SHA-256: `8d4a5f00393add81c3fe2c2a6172f616926638ae73066895d5cb36509c12b242`.

The first local ZIP test exposed test setup errors: a macOS temporary-path alias under Node's permission model, an evidence fixture copied under the wrong root name, and a search term absent from the actual fixture. Test setup now uses a canonical temporary root, the fixture's documented architecture directory and its actual term `verification`. No runtime guard, validation rule or search behavior was weakened. All final cases passed.

A checksum invocation initially ran from the repository root although the checksum names `pflow.zip` relative to its own folder. It was rerun successfully from `dist/`, matching the release job's working-directory behavior.

## Review and limits

Main reviewed the archive allowlist, one-runtime package, output permissions, stable timestamps, exact version gate, reusable Workflow wiring, read/write permission split, environment-based tag handling and checksum verification before publishing. Website tests use actual English/Korean controls; they do not contact GitHub or claim a working hosted download. Existing package tests and the new ZIP extraction case exercise standalone generated HTML after source input and installation removal. No independent subagent review was requested or performed for this integration.

The original repository and the public repository histories remain separate and retained. If a future publication must include the full development ancestry in the public main graph, that needs a deliberate history integration; copying the source files does not perform that merge.

No branch, commit, tag, ZIP or workflow was pushed. No release, Pages deployment, GitHub setting or production service was changed. The latest-download URL becomes available only after the first stable release. GitHub-hosted Node 24/Ubuntu checks and actual publication are pending. Compression byte identity across different Python/zlib versions is not claimed; the publisher consumes the exact artifact produced by its verifier.

Do not begin M9 as part of this integration.
