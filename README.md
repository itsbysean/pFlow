# pFlow data contract

Current planning: **M7 — Generic Process Documentation Refactoring**; **M8 — Viewer Redesign & Single-Bundle Skill Packaging**; **M9 — Optional Potential Bug Analysis & Reporting**. The [approved roadmap reassignment](docs/roadmap.md) supersedes older milestone labels. [M7-01 research](docs/design/m7-01-process-compatibility.md) assesses reuse and gaps. M7-02 adds prompt input through the existing pipeline. M7-03 adds shared output selection and flat/legacy bundle resolution; M7-04 adds neutral Viewer wording and generic documentation templates.

[M7-05 compatibility evaluation](docs/m7-05-compatibility-evaluation.md) recommends initial real-team use **with limitations**: fresh repository and prompt examples validate and work offline, and all 559 tests passed. Evidence review is still required; prompt updates use full generation only. This is a fixture-backed, Chrome-based and heuristic usability evaluation, not a human study or deployed-system guarantee. Potential bug analysis remains deferred to M9.

This repository contains the architecture data contract, the [Markdown documentation contract](docs/markdown-contract.md), three sample bundles, and the [interactive SVG Viewer](viewer/README.md). The source of truth for the graph is the [approved M1-01 design](docs/design/m1-01-common-architecture-data-model.md). M2 provides layout, diagrams/viewport controls, hierarchical navigation, node/edge inspection, and offline Markdown reading. M4-03 packages the existing Viewer, validated graphs, safe Markdown and evidence-backed snippets into one offline HTML file. The [discovery Skill](skills/pflow-discovery/SKILL.md) and [execution-flow Skill](skills/pflow-execution-flow/SKILL.md) provide evidence-backed repository/entry investigation and internal execution analysis. The boundary and async-linking Skills complete external/routing analysis. The main [pFlow Skill](skills/pflow/SKILL.md) now integrates these stages with final documentation and HTML generation. Change detection, targeted regeneration and safe HTML rebuilding are available as separate incremental workflows. Potential bug analysis remains later work.

Open [viewer/index.html](viewer/index.html) directly in a browser. Keep the `viewer/` files together; no development server is required. Click a node or edge to inspect it; use the separate ↗ control to open detail. Back/Forward/Top level and breadcrumbs preserve the caller trail without merging graphs. The right documentation column follows the active Flow or selected element's Markdown links. The source preview shows location metadata; generated HTML also shows the Builder's bounded numbered snippets. M3 adds offline full-text search over all embedded Markdown bundles. Use Ctrl+K or Cmd+K, then click a result or press Enter to open its highlighted passage. Canonical M1 links synchronize diagram selection; unmapped text remains available as documentation.

The Viewer is branded **pFlow**. Its header contains global search, Docs and a light/dark toggle. Resize the side columns with their dividers (or arrow keys), and use their chevrons to collapse/restore them. Docs opens the active Flow’s document. Selection details are available in the right column’s Details tab. Process starts from all loaded bundles remain in the explorer, with recorded-condition and text filters. There is no project/branch/settings selector. The source Skills, JavaScript namespace and package names use pFlow.

M8-02 keeps complete Flow documentation visible on selection. Select a graph node to locate its canonical section; select a mapped section or use **Locate in diagram** to center the same node. **Open detail** remains a separate action. Missing mappings show an explicit Flow-document fallback. See [the integration report](docs/design/m8-02-review.md). M8-03 bounds long headings and short-window search, improves light-theme contrast, and verifies the same pipeline with code, onboarding and deployment examples. See [the polish/E2E report](docs/design/m8-03-review.md). M8-04 packaging remains separate.

M8.5 addresses diagram label collisions and hidden connecting lines with deterministic corridor and outside-lane reservations. Node sizes and architecture contracts remain unchanged. See [layout stabilization results](docs/design/m8-5-review.md) and their bounded browser/performance checks.

## Installable pFlow Skill

Run `npm ci` and `npm run build:skill` in this development repository. Copy [dist/pflow](dist/pflow/) to your chosen Skill location. It contains one `SKILL.md`, required Markdown references and one executable, `scripts/pflow.mjs`. Users need Node.js 24+; npm installation and this source checkout are not needed at runtime. Repository incremental operations also need Git. Existing source commands remain compatible.

This repository contains the development sources and `website/`. Install the [latest release ZIP](https://github.com/itsbysean/pFlow/releases/latest/download/pflow.zip), extract it and copy the `pflow/` folder to your agent’s Skills location. A first release must be published before this download is available. Source-code ZIPs are development checkouts, not installed Skills.

See [development and release workflow](docs/release-workflow.md) for CI, local verification, Pages and version-tag releases.

```sh
node /installed/pflow/scripts/pflow.mjs --help
node /installed/pflow/scripts/pflow.mjs validate --input /target/docs/architecture --repository-root /target
node /installed/pflow/scripts/pflow.mjs build --input /target/docs/architecture --repository-root /target --output /target/docs/architecture/architecture.html
```

See [runtime commands](skills/pflow/references/runtime.md) and [M8-04 verification](docs/design/m8-04-review.md). The generated HTML also works after the Skill and source inputs are removed. Packaging adds no automatic AI analyzer or prompt incremental merge.

## Generate architecture documentation

Use [skills/pflow/SKILL.md](skills/pflow/SKILL.md) with a Coding Agent, specifying a target repository or a developer-described process and its scope. Repository mode retains the existing discovery, execution, boundary and async-linking stages. Prompt mode captures the original description and clarification answers as real evidence files, skips repository analysis, then uses the same canonical graph/Markdown generation, validators and trusted Builder. Neither mode runs target scripts, installs target dependencies or contacts infrastructure.

For prompt input, explicitly selected document workspaces contain all documentation and evidence; folder registration order does not select a destination. The [prompt evidence profile](skills/pflow/references/prompt-evidence.md) defines the current bundle/root mapping, exact capture and clarification attribution. The shared [output selector](builder/output-policy.mjs) implements current-directory docs/ → doc/ → new docs/ selection for prompt mode and analyzed-project-root selection for repository mode. Explicit workspaces/output directories are final destinations, with no extra architecture/ appended. See [output/bundle compatibility](docs/output-bundle-evaluation.md). Prompt input supports explicit full generation only: manual/uncertain existing content needs a safe ownership decision, and M6 targeted regeneration remains repository-only. See [prompt evaluations](docs/prompt-mode-evaluation.md) for actual checks and limits.

The default output follows the current Builder contract:

```text
docs/architecture/
  index.md
  flows/*.md
  diagrams/architecture.json
  evidence/request.md       # prompt input only; clarification files when needed
  architecture.html
```

New bundles use the flat layout above. Existing root architecture.json + sibling docs/ bundles remain readable and retain their layout. Both use the same schema, canonical document links and evidence validation. Competing graphs/corpora fail clearly; connected hierarchical and async relationships stay in one envelope. Raw prompt evidence remains outside the indexed canonical corpus. No samples are migrated. The trusted pFlow checkout needs Node.js 24 and its source dependencies; the target does not need npm install. Only the resulting HTML is fully standalone. This milestone does not provide a prebuilt distribution bundle.

See [generation evaluation](docs/documentation-generation-evaluation.md) for fixture coverage and [real repository evaluation](docs/real-repository-e2e.md) for bounded source review, offline use and incremental updates. The incremental workflows below require an explicit update request and a trusted baseline.

## Version and validation

Model version: **1.0.0**. Schema dialect: **JSON Schema Draft 2020-12**. The schema is [schema/architecture-1.0.0.schema.json](schema/architecture-1.0.0.schema.json), identified by `urn:pflow:architecture:1.0.0`. The URN identifies the schema; it is not a download address. Each artifact requires `modelVersion: "1.0.0"`. The M1-01 `draft` illustration is not a versioned sample.

Use Node.js 24 and npm:

```sh
npm ci --ignore-scripts
npm test
```

The lockfile pins the test dependencies. Tests run locally without network access after installation. Tests do not execute unknown target projects or fixture startup/vendor code. Selected authored pure modules are exercised with controlled inputs/recording ports. Viewer tests require an installed Chrome/Chromium browser; see the [Viewer test setup](viewer/README.md#tests) for `PFLOW_BROWSER_PATH` and browser availability requirements.

There are three validation layers:

| Layer | Checks |
|---|---|
| JSON Schema, using Ajv's Draft 2020-12 class | Required fields, types, enums, ID prefixes, nonempty evidence lists and node lists, paired positive line numbers, branch labels, external metadata shape, and supported version. Unknown fields are rejected. |
| Shared semantic validation | Global ID uniqueness; typed references; local flow starts; source-flow edge ownership; expansion targets; terminal exits; branch origin and distinct outcomes; local continuation; asynchronous cross-flow receive; local reachability with cross-flow entry; source files and range bounds; Markdown files and explicit anchors; root containment, including symlinks. |
| Shared Markdown profile validation | Canonical entity-ID sections and backlinks; unique section IDs; Node/Edge nesting within their Flow; index coverage; local navigation; source-ID citations and definitions with paths/ranges that match JSON. |

The shared validators are [validation/validate-artifact.mjs](validation/validate-artifact.mjs) and [validation/validate-documentation.mjs](validation/validate-documentation.mjs). They apply schema, semantic and Markdown-profile checks in sequence. Test-support wrappers retain the fixture repository root; the Builder passes its selected input root explicitly. No duplicate validators were introduced. Errors identify their layer and JSON location or Markdown file/line. The [Builder CLI](builder/README.md) adds artifact paths and stable diagnostic ordering. To validate a new sample bundle in the test suite, add it to the sample lists in [contract tests](test/contract.test.mjs) and [Markdown tests](test/markdown-contract.test.mjs).

The dialect and validator setup follow the [JSON Schema specification](https://json-schema.org/draft/2020-12) and [Ajv documentation](https://ajv.js.org/json-schema.html#draft-2020-12).

## Contract fields

All fields below come from M1-01. The schema is normative for structural constraints; the design defines execution meaning.

| Object | Responsibility | Required | Optional |
|---|---|---|---|
| Envelope | Versioned architecture snapshot | `modelVersion`, `entryPoints`, `flows`, `sources` | `revision` |
| EntryPoint | Confirmed executable boundary | `id`, `label`, `flowId`, `sourceIds` | `trigger`, `docs` |
| Flow | Own one execution-detail graph | `id`, `label`, `startNodeId`, `nodes`, `edges` | `docs` |
| Node | Execution occurrence or boundary | `id`, `label`, `kind`, `sourceIds` | `expandFlowId`, `external`, `docs` |
| Edge | Directed execution relationship | `id`, `from`, `to`, `kind`, `mode`, `sourceIds` | `label` (required for a branch), `docs` |
| SourceReference | Repository evidence | `id`, `path` | `symbol`, paired `startLine` and `endLine` |
| Document link value | Markdown navigation | `path` | `anchor` |
| External metadata value | Describe an evidenced dependency boundary | `kind` | `name`, `attributes` |

Node kinds are `operation`, `decision`, `external`, `terminal`, and `unresolved`. Edge kinds are `next`, `call`, `branch`, `return`, `exception`, `send`, and `receive`. Transfer modes are `sync`, `async`, and `unknown`. External kinds are `http`, `database`, `messaging`, `library`, and `other`.

`external` is optional, even on an external node. If supplied, the node must have kind `external`. Attribute keys are namespaced, such as `http.method`. Values are JSON scalars, including null, or lists of scalars. Objects and nested lists are excluded. Do not include secrets.

`nodes` and `sourceIds` must be nonempty. Empty envelope collections, empty edge lists, and absent optional fields are allowed. Do not add a dummy entry point or evidence record to an empty analysis. Labels and other text fields must contain non-whitespace text.

## Reference and identity conventions

- IDs use `entry_`, `flow_`, `node_`, `edge_`, or `src_`, followed by ASCII letters, digits, `_`, or `-`. The suffix is opaque. IDs are unique across the artifact and retained across reliable identity matches. The static samples contain assigned IDs; no ID generator or identity-state store is implemented.
- A flow start is one of its own nodes. Edges belong to their source node's flow; targets may be nonlocal for evidenced execution transfers. `next` remains local. Cross-flow messaging receives use `async`.
- `expandFlowId` is navigation only. Multiple call sites may open one detail flow. Recursive expansion and execution cycles are valid. Caller continuations remain in the caller flow.
- Source paths are repository-relative and use `/`. In these samples they point to files under `examples/*/sources/`. Symbols are optional. Line ranges are inclusive and one-based; no range means file-level evidence. Paths cannot escape their root.
- Document paths are relative to each sample's `docs/` bundle. Anchors omit `#`. The Markdown profile uses `<a id="ENTITY_ID"></a>` sections to identify the related graph entity. Every Flow has a canonical section; optional Node/EntryPoint/Edge documentation has a canonical section when supplied. Whole-document links remain valid supporting links. This profile does not change schema 1.0.0.
- Reuse evidence records when they describe the same evidence role. Multiple references may support a configured binding. Evidence for endpoints alone does not establish a relationship.
- `revision`, when present, is an opaque repository revision. Future findings must match the artifact/revision as well as entity IDs. Deleted or uncertain identities must not donate IDs to replacement entities.

## Sample bundles

| Bundle | Execution and evidence |
|---|---|
| [A — synchronous](examples/a-sync/architecture.json) | Registered command → component → function. Validation branches to an immediate return or an HTTP request. Request success and exception exits are distinct. Includes a library boundary and three navigation levels. [Markdown](examples/a-sync/docs/execution.md). |
| [B — asynchronous](examples/b-async/architecture.json) | Producer publishes to a broker, then returns. A separate async receive edge connects to a worker through an XML subscription and explicit registration evidence. The consumer writes to a database. [Markdown](examples/b-async/docs/execution.md). |
| [C — custom mechanism](examples/c-custom/architecture.json) | XML-configured task → custom scheduler registration → registry lookup → handler → archive boundary. Activation is based on configuration and code, without annotations or framework conventions. [Markdown](examples/c-custom/docs/execution.md). |

All source/configuration fixtures are illustrative and inert. Python, JavaScript, XML, and pseudocode demonstrate that the contract has no mandatory source language. The artifact paths and line ranges refer to actual checked-in fixture files, not a deployed system. Markdown cites SourceReference IDs and defines their targets relative to the Markdown file; JSON source paths remain relative to the repository root. Each bundle's `docs/index.md` links to all its Flows. Start new bundles with the [index](docs/templates/architecture-index.md) and [execution](docs/templates/execution-flow.md) templates.

## Limits and compatibility

Structural conformance does not establish evidence quality. The semantic helper checks files and references, not source meaning, dynamic bindings, symbol existence, or whether a cited statement proves an edge. The messaging sample cites publisher, subscription, and registration evidence; tests check that the evidence chain is retained. A reviewer must still assess that chain.

The profile checker supports the contract's literal anchors, plain inline navigation links, and source reference-link syntax. It does not parse arbitrary Markdown, derive heading slugs, or validate historical source snapshots. Its path/range checks use the current fixture checkout; it cannot prove that the prose follows the cited source. Unknown targets remain unresolved; summaries do not promise complete runtime coverage or delivery guarantees. Exception-terminal meaning and safe reuse of detail flows still need semantic review.

Persistent identity requires retained history. This task does not implement rename matching, ID non-reuse tracking, aliases, tombstones, or findings. The schema cannot prove identity continuity or prevent a producer from presenting speculation as evidence.

Version 1.0.0 accepts only its exact `modelVersion` and approved fields. Other versions require an explicit matching schema. New fields, enum values, or changed semantics require a versioned contract decision; consumers must not silently accept them. Keep the 1.0.0 schema fixed and retain old schemas when a new version is introduced. There is no automatic migration in this task.

M4-03 standalone generation is complete. From this source checkout, use:

```sh
node builder/cli.mjs build --input . --output architecture.html
```

The command discovers all three samples, validates and processes their content, then writes a self-contained architecture.html. Open that file directly through file://; it can be moved away from this repository and needs no server, original input files or network access. See [Builder usage and limits](builder/README.md). Use `--repository-root /path/to/repository` when artifact discovery starts in a separate documentation tree. M5-01 discovery, M5-02 internal analysis, M5-03 boundary enrichment and M5-04 async linking are available below. M5-05 requires separate approval.

## Repository and entry-point discovery

Use the repository source Skill at [skills/pflow-discovery/SKILL.md](skills/pflow-discovery/SKILL.md) with a Coding Agent. It investigates actual launch, registration, configuration and dispatch evidence through existing search/navigation capabilities. It does not run target code or require a language parser, indexing service or discovery CLI.

Confirmed entries use the existing M1 model: a proven activation, source evidence and a minimal receiving-handler Flow. Module/configuration notes and unresolved/coverage gaps stay in Markdown. Discovery stops before handler-body tracing. The Skill is source in this repository; no machine-global installation or distribution package is added.

See [discovery evaluations](docs/discovery-evaluation.md) for raw JavaScript/XML and Python fixtures, deterministic oracle/dispatch checks and blind forward-evaluation instructions. These limited evaluations do not establish general discovery recall. M5-01 is complete. Execution analysis is a separate explicit request, using the Skill below.

## Internal execution-flow analysis

Use [skills/pflow-execution-flow/SKILL.md](skills/pflow-execution-flow/SKILL.md) with a confirmed M5-01 bundle and actual source root. It follows significant owned calls, branches, exits and dispatch evidence, retaining proven receiving identities and reusing finite detail Flows. It stops at unresolved/non-owned boundaries without guessed target edges. No general parser, language service or runtime analyzer is installed.

See [flow evaluations](docs/flow-analysis-evaluation.md) for handoffs, JavaScript/Python fixtures, deterministic checks and blind/counterfactual review. Validation proves structural/reference conformance; source review remains necessary. M5-02 is complete. External-boundary enrichment is a separate explicit request, using the Skill below.

## External boundary analysis

Use [skills/pflow-external-boundaries/SKILL.md](skills/pflow-external-boundaries/SKILL.md) with a confirmed M5-02 bundle and actual source root. It enriches significant non-owned invocation occurrences with verified HTTP, database, messaging, SDK, library or generic system metadata. It follows active configuration evidence, retains unknown environment/runtime values and stops at third-party implementations. Owned wrappers stay internal; one call is not duplicated into client and destination nodes.

See [boundary evaluations](docs/external-boundary-evaluation.md) for fixtures, caller-argument checks, blind enrichment and configuration counterfactuals. M1 schema and documentation validators check structure and references; source review checks metadata meaning. No new schema, parser dependency or runtime analyzer is added. M5-03 stops before producer–consumer linking. That work is a separate explicit stage, available below.

## Async producer–consumer linking

Use [skills/pflow-async-linking/SKILL.md](skills/pflow-async-linking/SKILL.md) with analyzed boundaries, registered consumer entries and the actual source root. It follows broker identity, destination resolution and routing/filter/group evidence before adding producer-owned receive/async edges to existing receiving nodes. It preserves the external boundary and local continuation. Unknown or incompatible candidates add no confirmed edge; event cycles reuse finite graph references.

See [async linking evaluations](docs/async-linking-evaluation.md) for fixtures, controlled probes, blind/configuration-change results and limits. No schema, Viewer or Builder change is required. This source Skill is not a runtime matcher or installed global tool. The main pFlow Skill includes final documentation generation when requested.

## Incremental impact planning

Use [skills/pflow-impact/SKILL.md](skills/pflow-impact/SKILL.md) with an explicitly established Git baseline, the corresponding architecture/source snapshot and a selected commit or working-tree comparison. It identifies changed evidence, affected Flows and upstream entries, and relationships/registration mechanisms requiring revalidation. It stops at a human-readable impact plan; it does not regenerate Markdown/JSON or rebuild HTML.

The small read-only helpers use native Git plus existing validators and graph relationships. They require trusted baseline provenance, reject incomplete/unsafe Git scopes, preserve IDs and report unmapped/dynamic changes for targeted or broader discovery. The draft graph closure is refined by source inspection, not treated as a complete dependency model. See [impact evaluations](docs/impact-planning-evaluation.md) and [review record](docs/design/m6-01-review.md). M6-02 targeted regeneration is available below; no HTML rebuild is included.

## Targeted documentation regeneration

Use [skills/pflow-regenerate/SKILL.md](skills/pflow-regenerate/SKILL.md) with a reviewed M6-01 plan, its original change evidence, the current bundle and an approved generated baseline/source snapshot. It reuses the existing M5 analysis stages for affected scopes, refreshes the graph and canonical Markdown, preserves manual text through conservative three-way merging, validates staging and applies a recoverable bundle update.

There are no new ownership markers or graph fields. Unknown ownership, conflicting notes, changed current inputs or unresolved impact blocks apply. Unrelated bytes and existing HTML are retained; HTML becomes stale and is not rebuilt. See [regeneration evaluation](docs/targeted-regeneration-evaluation.md) and [completion/review](docs/design/m6-02-review.md). Consistency validation and HTML rebuilding are available below.

## Consistency validation and HTML rebuild

Use [skills/pflow-rebuild/SKILL.md](skills/pflow-rebuild/SKILL.md) after successful targeted regeneration, or for a rebuild-only request. It validates every architecture.json and mapped Markdown corpus in the complete publication scope through the existing M1/M4 tooling, reviews the current entry/index inventory, then uses the existing Builder to produce one standalone HTML file. It does not rerun source analysis merely to rebuild.

IDs stay scoped to each envelope; another artifact cannot satisfy a missing graph reference. Plain index entry/trigger text still requires the existing M1 review because valid Flow links alone cannot identify retired entry prose. A matching transient review result is required before publication; no new schema fields or index markers are imposed.

The rebuilt candidate is private until input, asset, inventory, staged-byte and prior-output checks pass. A single atomic rename replaces only HTML; equal bytes skip replacement. Failures preserve the prior HTML and successful Markdown/JSON regeneration. See [consistency/rebuild evaluations](docs/consistency-rebuild-evaluation.md), [completion/review record](docs/design/m6-03-review.md), and [real repository evaluation](docs/real-repository-e2e.md). Potential bug analysis is outside these workflows.

See [M7-04 presentation evaluation](docs/generic-presentation-evaluation.md) for repository/onboarding/deployment, shared-detail, evidence, accessibility and offline checks. One read-only Viewer supports team workflows and service execution without a public input-mode field. Technical kinds, symbols and integration metadata remain intact.

## Naming compatibility

The product and source Skills use pFlow. The JavaScript global is `pFlow`, the embedded payload ID is `pflow-data`, the browser test override is `PFLOW_BROWSER_PATH`, and the schema identifier is `urn:pflow:architecture:1.0.0`. The model fields and `modelVersion` remain unchanged. Integrations that reference former identifiers or Skill paths must use these names. Existing graph payloads use the same validation rules.
