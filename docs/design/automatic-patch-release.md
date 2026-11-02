# Automatic patch release follow-up

## Policy

Replace manual tag-triggered publication with a main-push release. The first successful publication from the current `1.0.0` base is `1.0.1`. Website-only main changes also count. PR checks never increment versions or publish. The schema/model version stays `1.0.0`.

`packaging/auto-release.mjs prepare` synchronizes package/lock metadata in a disposable runner. Stable tags and package metadata determine the next patch; numeric comparison avoids `1.0.9`/`1.0.10` ordering errors. An annotated release tag records the original source commit. Repeating preparation or rerunning the same source reuses the same version.

The release job tests and builds that prepared version. `publish-git` verifies the source has not changed, only the two version files differ, and remote main still matches the tested source. It commits those files and pushes main/tag atomically without force. A newer main or branch rejection fails rather than partially publishing. Retrying an older release after main advanced also fails.

Built-in GITHUB_TOKEN pushes do not recursively start push Workflows. Release creation therefore stays in the same run; it does not wait for a second tag Workflow. Existing published assets must match the verified ZIP; reruns do not overwrite them. Draft releases require manual review.

Existing branch protection/rulesets are not modified. A read-only check during this task returned no effective main rules and `Branch not protected` from the protection endpoint. This is a configuration observation, not proof of hosted token writes.

## Changes

- `packaging/auto-release.mjs`: preparation, idempotent source/tag matching, version updates, race guards and atomic Git publication.
- `.github/workflows/release.yml`: main-triggered prepare → install → test → build → checksum → atomic Git push → publish/resume.
- `.github/workflows/verify.yml`: PR-only read-only verification; no duplicate main build or manual-tag release path.
- Version-related tests now read package metadata; graph/schema assertions keep the unchanged model version.
- Ten local Git integration cases cover patch ordering, synchronized metadata, no preparation-side push, exact changed files/tag, reruns, following source changes, dirty/mismatched inputs, main races, protected-branch rejection and obsolete reruns.
- README and current release guidance describe the automatic policy and its concurrency/settings limits. The original integration report remains a record of the earlier manual-tag implementation.

## Verification

Local fixtures use real isolated Git repositories and bare remotes; they do not modify the public remote or run external services. A separate source copy actually prepared version `1.0.1` and passed 54 CLI, bundle, archive, offline browser and installation checks. Its first symlink-based dependency setup did not match the normal install layout used for bundled dependency notices; the final check uses a regular copied dependency tree.

Final full suite: 636 passed, zero failures/skips/cancellations (44.15s), logged at `/private/tmp/pflow-auto-full-final.log`. All three Workflow files pass actionlint v1.7.11 with external ShellCheck/Pyflakes integration disabled; `git diff --check` passes. Local execution used Node 26.13.0, Python 3.15.2 and Chrome; hosted Node 24 remains a separate verification boundary. Hosted automatic main publication cannot be tested without merging/pushing main; no live version commit/tag/release is performed in this task.

See [current release workflow](../release-workflow.md) for operating instructions. One patch is produced per successful main publication. Concurrent rapid merges may coalesce; this does not promise a separate release for every queued merge.
