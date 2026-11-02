# M8-04 single-bundle Skill plan

Date: 1 November 2026. Preserve uncommitted M8-01 through M8-03 and unrelated files. Their actual reports and Viewer implementation were inspected; M8-03 passed 598 tests. No commit/push or M9 work is authorized.

## Verified dependency graph

The existing Builder CLI imports argument parsing, shared preparation/validation, Markdown processing and HTML packaging. Ajv imports the approved JSON Schema; LinkeDOM runs the same safe Viewer Markdown renderer. These JavaScript dependencies and schema/version JSON can be compiled together. Node built-ins remain external. Playwright is test-only.

HTML packaging reads template/CSS/browser scripts from `viewer/`. M6 safe rebuild fingerprints those assets as well as the graph, Markdown, discovery inventory and evidence. A shared asset module will keep file-backed source operation and provide embedded assets in the bundle. In packaged execution the executable itself is fingerprinted/protected: changing the bundle changes the asset/code snapshot. No temporary asset extraction or second renderer is needed.

M6 impact and regeneration are exported functions, not existing CLIs. A small additive dispatcher will retain build/help/version and expose validation, output selection, impact, regeneration preparation/apply and inspected safe rebuild. Existing exported helpers will also be available through the one module, preserving staged review/apply for Coding Agents. JSON request files are transient tool arguments, not a new public architecture schema. No data-supplied function hooks are accepted.

## Distribution

`npm run build:skill` will create `dist/pflow/`: one SKILL.md, linked Markdown references and exactly `scripts/pflow.mjs`. Maintainable source modules remain. A pinned development esbuild dependency compiles the runtime for Node 24. Third-party license notices remain embedded; build tooling, fixtures, source files, JSON, CSS and node_modules are excluded.

The build copies maintained analysis guidance into named reference documents, rewrites local links, and includes approved model/Markdown contracts, templates and a Markdown copy of the exact schema. Component Skill front matter is removed; only one Skill entry point remains. Links and final allowlisted contents are checked. The schema is also embedded for runtime validation. No runtime resource requires a separate file.

## Validation

- Build twice and compare every output byte. Check the bundler dependency graph for non-built-in unresolved imports, plus distribution contents and local links.
- Copy to an unrelated temporary install path, run from another working directory with no node_modules/source tree. Use Node permission restrictions to deny development-tree reads in child CLI tests.
- Verify code, prompt onboarding and deployment fixtures with real validation/build, output policy, containment, failed-build preservation and M6 baseline/regeneration/manual-note/safe-rebuild behavior.
- Move generated HTML away from inputs/install; remove them before offline file:// browser interaction checks. Verify the M8 shell, canonical mapping, explicit detail, search, panels/themes/evidence and console/request logs.
- Run the full existing suite and independent review. Fixture inputs are reviewed analysis outputs, not a claim of autonomous AI analysis correctness. Git is required only for repository incremental operations. No target scripts or services run.
