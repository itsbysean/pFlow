# Unified source and release integration plan

1. Start `feat/unified-source-and-releases` from the public pFlow repository. Preserve its history, homepage, bilingual copy, demos and verification file. Preserve original development history separately without deleting or rewriting either `.git` directory.
2. Import development commit `5169c38` as source files. Remove the duplicate committed `skill/` output and the old cross-repository export command. Keep generated `dist/` ignored.
3. Reuse `buildSkill` to create `pflow.zip` plus SHA-256 with sorted entries, fixed timestamps and one installed root. Add no runtime dependency. Reject release tags that do not exactly match the stable package version before writing output.
4. Use one reusable source/package verification workflow for PRs, main and tagged releases. Preserve the website-only Pages publication root. Publish the verified ZIP only from a version tag, with write permission limited to publishing.
5. Update English/Korean installation text and download links. State that the ZIP is unavailable before the first release.
6. Test fresh installation from the actual ZIP without source/dependencies, offline HTML, archive integrity/determinism, version guards, website controls and the existing full suite. Lint Actions separately. Report hosted CI and publication as unexecuted until explicitly authorized.

Scope excludes Viewer/model changes, M9, commits, pushes, tags, settings changes and actual release publication.
