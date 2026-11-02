# Development, website and release workflow

## Repository layout

This repository contains the source, tests, Skill instructions and `website/`. Source modules live in `builder/`, `viewer/`, `validation/`, `schema/` and `skills/`. The `website/` folder remains the Pages publication root. Its existing demos and verification file are preserved.

`dist/` is generated and ignored. The old committed `skill/` copy is removed so there is one maintained source. Do not copy generated runtime files back into Git. There is no longer a separate export command or sibling distribution repository in the development workflow.

The initial import comes from development commit `5169c38aba106509e354994c29e192d5dd90c267`. The original repository remains unchanged. Its history is also retained locally in `archive/development-source`; the integration branch starts from the existing public repository history. No history was rewritten, and this task does not publish the archive branch.

## Local checks

Development requires Node.js 24+, npm, Python 3 and Chrome/Chromium. Python's standard ZIP library is used only for packaging; installed users need Node.js, not Python or npm dependencies. No new npm dependency is added.

```sh
npm ci --ignore-scripts
# Use an installed browser, or install one for tests:
npx --no-install playwright-core install --with-deps chromium
# Set PFLOW_BROWSER_PATH if the browser is not at a standard host path.
npm test
npm run build:release
```

The Actions verifier sets `PFLOW_BROWSER_PATH` to Playwright's installed Chromium executable. A local shell can obtain that path with `node --input-type=module -e "import {chromium} from 'playwright-core'; console.log(chromium.executablePath())"`.

`npm run build:release` rebuilds the existing single-runtime Skill and creates:

- `dist/pflow/`: one Skill, 38 reference documents and `scripts/pflow.mjs`.
- `dist/pflow.zip`: the same package under one `pflow/` top-level folder.
- `dist/pflow.zip.sha256`: checksum for the ZIP.

Files are sorted, use fixed ZIP timestamps and preserve text bytes and executable metadata. Repeated local builds use identical ZIP bytes. Compression may differ between Python/zlib versions; cross-toolchain byte identity is not promised. Build and publish use the same verified artifact rather than rebuilding between jobs.

## Automation

| Event | Workflow | Behavior |
|---|---|---|
| PR to `main`, push to `main` | `verify.yml` | Install pinned development dependencies, install test Chromium, run the full suite, build the ZIP and retain it as a seven-day Actions artifact |
| Push to `main`, manual dispatch | `deploy-website.yml` | Validate and deploy only `website/` through the existing Pages workflow |
| Push of a `v*` tag | `release.yml` | Call the same verifier with the exact tag, download its ZIP/checksum, check SHA-256 and publish them to GitHub Releases |

Only the publish job receives `contents: write`. Verification receives read access and uses no repository secrets. Tag input is passed through an environment variable, not interpolated into shell code. The publisher uses `gh release create --verify-tag`; it never creates a missing tag. Existing releases are not overwritten on reruns. A repeated published tag fails rather than replacing its assets.

Only stable `vX.Y.Z` tags exactly matching `package.json` are supported. Release versions and model versions are independent; changing a package version does not require changing the M1 model. Keep `package-lock.json` in sync using `npm version <version> --no-git-tag-version`, review and commit the version change, then tag that reviewed commit. Version/tag publication remains an explicit maintainer action. No tag, release, commit or push is performed by local build commands.

In Settings → Pages, keep the deployment source set to GitHub Actions. Require the verifier in the main branch protection/ruleset if checks must block merges. Repository settings still control Pages permissions and PR branch protection. These files do not configure those settings or prove that a hosted workflow has succeeded.

## Downloads and installation

The website and README link to:

`https://github.com/itsbysean/pFlow/releases/latest/download/pflow.zip`

The ZIP is unavailable until the first stable release is published. The website states this. No runtime API call or dependency is needed to discover the download. A version-specific download remains under `releases/download/vX.Y.Z/pflow.zip`.

Download the ZIP and checksum from the same release. Verify `shasum -a 256 -c pflow.zip.sha256`, extract the ZIP and copy `pflow/` into the agent's Skills location. Keep all 40 files together. Check `node /installed/pflow/scripts/pflow.mjs --version`. GitHub's automatic **Source code** archives contain development sources and are not the installed Skill package.

## Verification boundary

Local tests verify archive contents, metadata, checksum, repeat builds, rejected tags, isolated extracted-runtime execution, standalone HTML and `file://` interactions. They also check the bilingual website download control. Existing tests retain prompt/repository modes, geometry, search and incremental safety checks.

Workflow YAML can be inspected and linted locally. GitHub event routing, hosted Ubuntu execution, repository permissions, actual Pages deployment and release/download availability require a pushed branch and approved publication. Local verification does not claim those external actions happened.
