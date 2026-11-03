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
| PR to `main` | `verify.yml` | Read-only verification, complete test suite and a local release ZIP build; no version bump or publication |
| Manual dispatch from `main` | `deploy-website.yml` | Existing website-only Pages deployment |
| Manual dispatch from `main` | `release.yml` | Prepare the next patch, test/build that version, atomically publish version files and tag, then publish the ZIP/checksum |

### Manual publication with automatic patch versioning

Every requested successful release publication increments the highest stable package/tag version by one patch. For example, publishing from package `1.0.1` prepares `1.0.2` / `v1.0.2`. Major/minor versions are never increased automatically. Merges never publish or increment versions. Website deployment is a separate manual action. Model version `1.0.0` remains independent and unchanged.

The preparer updates `package.json`, `package-lock.json` and the lock's root package entry in the disposable runner before installing dependencies, testing and building. Only after verification does it commit those two files as `chore: release vX.Y.Z`, annotate the tag with the original source SHA and push main/tag together using `git push --atomic`. No force push is used.

The main release job needs `contents: write`; the PR verifier remains read-only. The built-in `GITHUB_TOKEN` publishes the version commit/tag, which does not trigger another push Workflow. The ZIP is published in the same run rather than depending on a tag-triggered run. This prevents a version-bump loop. Personal access tokens are not configured or required by this implementation.

A rerun for the same source reuses its annotated tag and version. If the prior Git push succeeded but release creation failed, the rerun resumes at that version. If a published release already exists, its downloaded ZIP must match the verified build; assets are never overwritten. An unfinished draft requires manual review. Tests for version output read the current package version rather than assuming `1.0.0`.

One release Workflow runs at a time. If main advances while a run verifies, the older run fails safely before pushing; start a new manual run from current main to include those changes. Pending runs can be coalesced by GitHub concurrency. This is one patch per requested successful publication; merges alone do not create releases. A rerun must not be used to release an obsolete source over newer main.

Protected branches or rulesets may reject the bot's main push. They are not changed or bypassed here; atomic rejection leaves remote main/tag unchanged and no ZIP is published. The maintainer must deliberately permit the release actor's version-only updates or choose a release-PR policy. Git permissions and GitHub event routing still need hosted verification after merge.

Manual tag pushes no longer trigger this Workflow. `npm run build:release -- --tag vX.Y.Z` remains an exact-version local build guard, not a remote publisher. `node packaging/auto-release.mjs publish-git` is CI-only publication tooling and should not be run from a development working tree. No release is performed by `npm run build:release` alone.

Keep Settings → Pages configured for GitHub Actions. Require the PR verifier in the main branch ruleset if checks must block merges. These files do not change repository settings.

To publish, open Actions → **Publish patch release** → Run workflow, choose `main`, and confirm. The job rejects other branches. Patch calculation, tests and publication happen only for this explicit run. To update the homepage, run **Deploy website to GitHub Pages** from `main` separately. PR verification remains automatic. Do not merge merely to trigger deployment.

## Downloads and installation

The website and README link to:

`https://github.com/itsbysean/pFlow/releases/latest/download/pflow.zip`

The ZIP is unavailable until the first stable release is published. The website states this. No runtime API call or dependency is needed to discover the download. A version-specific download remains under `releases/download/vX.Y.Z/pflow.zip`.

Download the ZIP and checksum from the same release. Verify `shasum -a 256 -c pflow.zip.sha256`, extract the ZIP and copy `pflow/` into the agent's Skills location. Keep all 40 files together. Check `node /installed/pflow/scripts/pflow.mjs --version`. GitHub's automatic **Source code** archives contain development sources and are not the installed Skill package.

## Verification boundary

Local tests verify archive contents, metadata, checksum, repeat builds, rejected tags, isolated extracted-runtime execution, standalone HTML and `file://` interactions. They also check the bilingual website download control. Existing tests retain prompt/repository modes, geometry, search and incremental safety checks.

Workflow YAML can be inspected and linted locally. GitHub event routing, hosted Ubuntu execution, repository permissions, actual Pages deployment and release/download availability require a pushed branch and approved publication. Local verification does not claim those external actions happened.
