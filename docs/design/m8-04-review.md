# M8-04 single-bundle Skill completion and review

Date: 1 November 2026. Baseline: main `4a3d3e0` plus completed, uncommitted M8-01 through M8-03. Main inspected their implementation and reports, including M8-03's 598-test result. Existing dirty work and unrelated `docs/.DS_Store` were preserved. No commit, push, global Skill installation or M9 work was performed.

## Result and installation

`npm run build:skill` produces `dist/pflow/`:

```text
pflow/
  SKILL.md
  references/          # 38 necessary Markdown reference/contract/template files
  scripts/
    pflow.mjs
```

There are 40 files, exactly one JavaScript runtime, no individual modules, CSS, JSON, source directory, node_modules, build tooling or test fixtures. The executable is 1,209,204 bytes and has executable permission. SHA-256: `0284546ecd063500ba1c75c67706821a0d4bbbf1c0ebf8028624038fb7eae808`. The generated directory is ignored by Git and can be regenerated; maintainable development sources remain authoritative.

Copy the directory to the chosen Skill installation location. Full-generation users need Node.js 24+ and the installed files, without npm installation or this checkout. Repository incremental operations also require local Git. No host registration or installation into a user's global Skill directory was performed here.

```sh
node /installed/pflow/scripts/pflow.mjs --help
node /installed/pflow/scripts/pflow.mjs validate --input /target/docs/architecture --repository-root /target
node /installed/pflow/scripts/pflow.mjs build --input /target/docs/architecture --repository-root /target --output /target/docs/architecture/architecture.html
```

These are placeholders; resolve and quote actual paths. [Runtime guidance](../../src/skills/pflow/references/runtime.md) documents output selection, impact, regeneration, inspected safe rebuild and exported APIs. Existing `node builder/cli.mjs build ...`, help/version and source module APIs remain available. New commands are additive; no public graph schema or input-mode field was added.

## Integration and resource classification

The [plan](m8-04-plan.md) follows the actual dependency graph. Development-only esbuild 0.28.2 compiles the dispatcher, existing Builder/validators, Ajv, LinkeDOM, Markdown renderer and M6 helpers. Node built-ins are the only external imports allowed by the build's metafile check. The approved schema and version metadata are compiled JSON. All declared non-sample Viewer JavaScript, CSS and HTML are embedded as strings and still pass through the existing safe standalone writer. No asset extraction, second renderer, analysis engine or runtime fetch was introduced.

The optional Canvas binding is fixed to LinkeDOM's existing fallback. CSSOM's optional cssstyle module is represented as absent so its existing built-in fallback is used. This matches the source checkout without those add-ons and prevents ambient/global dependency loading. Full license notices from actual bundled dependencies are sorted and embedded in the executable. The [esbuild API](https://esbuild.github.io/api/) documents the bundling/platform/metafile features used by the development build.

One shared Viewer asset provider supports both modes. Development reads and fingerprints actual Viewer files. Installed execution reads embedded contents and fingerprints/protects the installed executable itself, since it contains the Viewer and code. M6 still snapshots discovery inventory, graph, complete mapped Markdown and evidence, requires the matching completed index review, stages/rechecks HTML and preserves old output on failure. Changing the installed executable requires a new inspection/review. Source/output separation, Git provenance, ownership, merge, manual-note and rollback guards remain unchanged.

The build copies maintained stage guidance into named Markdown references, without sibling Skill entry points or YAML front matter. It includes the approved model, Markdown profile, templates and an exact schema code block. Local links are rewritten and checked. Historical contract wording is retained, with the distributed Markdown profile's development-only npm-test invocation changed to the installed validator and the obsolete findings milestone reference aligned to M9. No schema fields or execution semantics change. Raw evidence stays outside the canonical document corpus.

## Files changed for M8-04

| Files | Responsibility |
|---|---|
| `packaging/build-skill.mjs` | Reproducible compilation, assets/schema/dependency notices, reference mapping and allowlisted distribution validation |
| `packaging/cli.mjs` | Small additive dispatcher and maintained API exports; strict transient JSON request keys/boolean controls |
| `builder/viewer-assets.mjs` | Shared file-backed/embedded asset source and protected/fingerprinted file inventory |
| `builder/html.mjs` | Reuse asset provider and protect runtime/assets; existing rendering/serialization/publication retained |
| `src/skills/pflow-rebuild/scripts/rebuild.mjs` | Use the same asset inventory in existing freshness checks |
| `src/skills/pflow/SKILL.md`, `src/skills/pflow/references/{runtime,build,output,workflow,prompt-analysis}.md` | Installed runtime, dual-mode routing/output/evidence and command guidance |
| `src/skills/pflow-rebuild/references/{consistency,rebuild}.md` | Current shared runtime and flat/legacy corpus wording |
| `package.json`, `package-lock.json`, `.gitignore` | Pinned development bundler, build command and generated-output exclusion |
| `README.md`, `builder/README.md`, `docs/roadmap.md` | Build/install/use scope and verified completion |
| `test/skill-packaging.test.mjs` | Nine independent-install, browser, safety, reproducibility and incremental cases |
| `docs/design/m8-04-plan.md`, this report | Research, plan, completion and review |

Other dirty Viewer and test files are prior M8-01 through M8-03 work. No source was deleted and no internal package/schema/repository rename was performed.

## Actual automated execution

| Command/check | Result |
|---|---|
| `npm run build:skill` | Passed; 40 files, one executable, no non-built-in unresolved imports |
| Two builds to different distribution destinations | Every output file byte-identical; local link/content checks passed |
| `node --test test/skill-packaging.test.mjs` | Final **9 passed**, zero failed/skipped/cancelled; `/private/tmp/pflow-m8-04-focused-final.log` |
| `npm test` before final review changes | 607 passed; `/private/tmp/pflow-m8-04-full.log` |
| Final `npm test` after notices, boolean validation and corrected executable-collision test | **607 passed**, zero failed/skipped/cancelled; `/private/tmp/pflow-m8-04-final.log` |
| `git diff --check` | Passed |
| Host skill-creator `quick_validate.py dist/pflow` | Could not start: host Python lacks PyYAML. No pass claimed. The build's distribution/link validation and Node tests independently ran, including installed entry-point naming and actual Skill use. |

Initial build attempts identified optional canvas/cssstyle imports and an inline Markdown example mistaken for a real reference. The bundler now fixes the existing optional fallbacks and the reference checker ignores fenced/inline examples. Initial test attempts also identified overly narrow Node permission allowlists for ancestor metadata, and an incorrect directory-removal call in fixture setup. These were test-environment/setup failures, not waived containment checks.

Most installed CLI cases use Node's permission mode with filesystem access limited to the isolated temporary installation/input/output tree. This denies development-checkout and node_modules reads. Code/onboarding/deployment clean-install children use an even narrower per-case tree and a separate cwd. Output selection and transactional apply inspect ancestor metadata, including `/`; Node's recursive allowlist cannot grant metadata-only access to that ancestor. Those commands are tested normally outside the checkout, with the existing explicit containment/transaction guards intact. Git subprocesses are permitted only for incremental cases; this is not a claim that Node permissions constrain Git's child process. No target scripts or live services run.

The tests verify:

- Extra JS, node_modules (including an empty directory), symlinks and missing references are rejected by distribution validation.
- Installed validation/build/schema/help/version and API import work from unrelated paths, including spaces and Unicode.
- Code, onboarding and deployment outputs are byte-identical to source execution; repeated installed builds are deterministic.
- Both default docs/doc/new-docs selection and a separate explicit prompt workspace retain correct evidence roots; traversal fails without fallback.
- Broken graph references, evidence escapes, data-supplied hooks and executable aliases fail without replacing prior HTML/runtime bytes.
- Packaged Git impact binds an explicit baseline; reviewed targeted dry-run/apply preserves manual notes, source Git index/history and old HTML. Complete-set inspect/rebuild requires actual review, rejects stale review and skips identical output without changing mtime. Missing baseline and invalid ownership types fail.
- The unchanged full suite retains legacy/flat layouts, M1 contracts, malicious Markdown/evidence, source ranges, async/shared/cyclic graph cases, M6 preservation/rollback and M8 layout/navigation/search/contrast/focus checks.

No user dependencies were installed in a target project. Only the development checkout received the pinned bundler dependency.

## Standalone browser verification

Each of the three automated clean-install scenarios validates/builds with the actual copied executable, then removes that installation and all input files before opening its HTML in Chrome through `file://`, offline. Assertions cover branding/three columns, SVG, complete Markdown, Node-to-section mapping, section-to-Node selection, evidence snippets, keyboard search, resize/collapse/restore, both themes, and explicit detail with Back/Forward/Top level for onboarding. Pages made exactly one request for their own HTML, with no page or console errors.

Main also generated persistent previews from the final distribution through a restricted child CLI, removed temporary installation/input trees, and opened them offline. `/private/tmp/pflow-m8-04/preview-results.json` records:

| File | Documents / snippets | HTML bytes |
|---|---|---|
| `/private/tmp/pflow-m8-04/code.html` | 2 / 8 | 178,160 |
| `/private/tmp/pflow-m8-04/onboarding.html` | 2 / 6 | 172,568 |
| `/private/tmp/pflow-m8-04/deployment.html` | 2 / 4 | 167,413 |

Main visually inspected the onboarding dark capture and the fresh support-process light capture described below. All four preview pages requested only their own HTML and had no page/console errors. Captures and driver `/private/tmp/pflow-m8-04-preview.mjs` remain local, outside the distribution.

## Independent forward Skill evaluation

A separate worker received only the installed Skill, an empty explicitly selected document workspace and a new support-request description. It was instructed not to inspect this repository or intended fixture answers. It generated evidence and canonical graph/Markdown through the installed workflow, not a custom analyzer. This was an actual bounded Coding Agent generation, separate from deterministic fixture tests.

The request described a coordinator checking an account ID, missing-ID request/end, present-ID response preparation, sending/finish and two preparation substeps. Main inspected the resulting graph and evidence mapping: it has one entry, two Flows, eight nodes, six edges and one source. Only the supplied responsibility is assigned; expansion is navigation-only; no retry, approval, parallelism or delivery guarantee was invented. The exact 388-byte original request has no added newline.

Installed CLI validation returned valid with no diagnostics, three canonical documents and one artifact. Build embedded one snippet in 170,481 bytes; repeated output was byte-identical. The worker used Node 26.13.0; main automated checks used Node 24.22.1. Results live in `/private/tmp/pflow-m8-04-evaluation/forward-report.md` and the selected `documents/` bundle. The worker did not claim browser verification. Main later opened that exact generated HTML offline, selected its mapped decision and captured light/dark views; requests/errors are included in the preview record. It observed that the instructions were sufficient; an old development-test sentence in the copied contract was then clarified for installed use. No user-facing graph contract was changed.

This is one prompt forward evaluation, not general recall/accuracy proof or an independent real-repository analysis. Repository-mode packaging was evaluated with existing reviewed code fixtures. Claim/evidence review remains necessary in real-team use.

## Independent review and resolution

Gavin supplied read-only dependency/resource research. Yena independently reviewed current scoped files, distribution structure, runtime/provider changes, CLI, M6 integration, tests and actual focused/full logs. It found no blocking runtime defect. It found **M8-04-R1 (P2)**: an executable-collision assertion still had invalid evidence and a non-HTML output path, so it could fail before reaching the new runtime protection.

Main restored valid evidence, created an actual `.html` hardlink to the installed executable, asserted the output-overwrite diagnostic and checked both names retained identical runtime bytes. The final focused and full suites include this correction and passed. Main also embedded full dependency licenses and checked strict boolean request controls. No unresolved critical packaging finding remains.

The reviewer did not independently run builds/tests/Chrome, receive an immutable task-only patch, or re-review the final report and later test correction. It inspected the earlier 9/9 and 607/607 logs; main executed and checked final runs, preview records and forward artifacts afterward. Prior dirty work is explicitly excluded from this task's changed-file list.

## M8 completion and limits

M8-01 through M8-04 are complete within their approved bounds: one read-only shared Viewer, canonical bidirectional documentation, desktop/offline polish and portable single-runtime Skill. Ready for initial team use **with limitations**: evidence and ownership review are required; repository incremental work needs retained reliable Git/source/generated baselines; prompt updates remain explicit full generation only. Packaging does not implement historical identity persistence, automatic analysis correctness or findings.

Node 24.22.1 and one Node 26.13.0 forward run were executed; other runtimes/platforms were not certified. Chrome was tested; screen-reader/cross-browser/human usability certification is not claimed. Build reproducibility was checked with the pinned dependency tree on this host, not every OS. Development bundling needs npm dependencies; installed users do not. Only Node built-ins remain external; Git is intentionally external for M6. No global Skill installation or distribution upload occurred.

The build replaces only a validated dedicated distribution directory; it is a development operation, not a transaction over target documentation. Existing M6 crash/recovery and concurrent-edit limits remain. Do not treat successful structure, snippets or HTML as proof of source semantics or deployment behavior. Stop after M8-04; M9 requires separate approval.
