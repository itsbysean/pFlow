# Offline HTML Builder

the Builder discovers and validates artifacts, processes Markdown and bounded snippets, then writes one self-contained architecture.html with the existing Viewer. The generated HTML needs no original input files, neighboring assets, runtime dependencies, web server or network connection. The source CLI uses this checkout and its development dependencies; the portable Skill below requires neither at runtime.

Use Node.js 24. In the pFlow source checkout, install development dependencies with `npm ci --ignore-scripts`. The source CLI can run from any working directory and does not need npm installation in the target repository.

```sh
node builder/cli.mjs --help
node builder/cli.mjs --version
npm run archdoc -- build --input . --output architecture.html
node builder/cli.mjs build --input examples/a-sync --repository-root . --output architecture.html
```

Paths resolve from the calling working directory. Quote paths with spaces. `--input` and `--output` are required. `--repository-root` selects the source repository; it defaults to `--input` to retain the Builder behavior. For another project:

```sh
node builder/cli.mjs build --input /project/docs/architecture --repository-root /project --output /project/architecture.html
```

This example requires the existing bundle arrangement under the selected artifact tree. The option changes the source-reference base; it does not relocate or rewrite authored evidence links.

Help and version need no target artifacts. Invalid commands/options, duplicate flags and missing values fail. Errors go to stderr with status 1. Warnings go to stderr with `warning:source` and status 0 when preparation otherwise succeeds. Success reports document/snippet counts, byte length and the written file. The writer uses a temporary file in the output directory and atomic rename; successful builds replace an existing regular output file. Failed validation or packaging leaves an existing output unchanged.

## Discovery and validation

Discovery follows physical directories below `--input`, excludes `.git`, and does not traverse directory symlinks. Every file named `architecture.json` is a candidate. A directory or special file with that name is an error; candidate file symlinks must stay inside input. Unrelated JSON is outside the architecture corpus. Use a physical tree rather than linked-directory discovery.

The existing the data contract sample arrangement is:

```text
repository/                         --repository-root
  examples/a-sync/                  --input (or select repository for all samples)
    architecture.json
    docs/
      index.md
      execution.md
    sources/
      command.py.txt
      component.py.txt
      state.py.txt
```

That legacy layout remains supported without migration. New bundles use root index.md and flows/, with diagrams/architecture.json. The shared bundle-layout.mjs resolver selects the Markdown root: bundle root for flat output, sibling docs/ for legacy output. Its corpus is index.md plus unique entity docs paths, including nested paths where used; evidence/*.md is not promoted into canonical/search documents. Competing graph locations or Markdown roots fail rather than being guessed. A complete independent nested legacy bundle named diagrams remains a separate envelope. Multiple envelopes stay separate; IDs are not merged across them. Files/records and diagnostics use stable case-sensitive code-unit path order. Original graph array order and IDs are retained.

Shared `validation/validate-artifact.mjs` and `validation/validate-documentation.mjs` retain the approved Draft 2020-12 schema, semantic checks and the data contract profile. Test-support wrappers use the same code. Schema 1.0.0 is unchanged. The optional bounded source-text reader lets validation and extraction share file reads without changing public artifacts. A truly empty file has zero lines; CRLF, LF and CR delimiters are recognized without a phantom final line.

Artifact JSON and Markdown stay inside input; document references also stay in their own bundle. Source paths stay inside the configured repository root. Markdown evidence definitions may leave docs only to resolve to the exact contained SourceReference file/range. Real paths and regular-file checks reject symlink escapes and special files. No source code, Markdown expression or artifact JSON is executed. No server or network resource is used.

Output is explicitly user-selected and may be outside input. It needs an existing writable parent and `.html` extension. Existing destinations must be writable regular files, not directories or symlinks. Input/evidence collisions, including hard links, fail. The preparation API does not write. CLI build writes only the selected HTML destination and cleans its temporary directory. Concurrent hostile filesystem changes are outside these path checks.

## One shared Markdown renderer

`builder/markdown.mjs` calls the existing `viewer/markdown.js` renderer with a supplied [LinkeDOM document](https://github.com/WebReflection/linkedom). LinkeDOM is pinned as a source-tool development dependency. It provides DOM construction/serialization in Node; it is not loaded by the offline Viewer. There is no second Markdown parser or browser runtime dependency.

The small the data contract profile supports headings, paragraphs, simple ordered/unordered lists, tables, inline code, fenced code, strong/emphasis, document links and evidence citations. It does not implement full CommonMark or nested inline syntax. Explicit entity anchors become exact `section` IDs. No heading slug is generated. Inline code and source indentation remain text.

Only a fixed, trusted shell is parsed as HTML. Markdown enters through native text nodes and an allowlisted set of renderer-created elements. Raw HTML is escaped, including scripts, SVG, images and event attributes. Supported links become buttons with validated `data-document-path` / optional `data-document-section`; evidence controls use `data-source-id`. No untrusted `href`, `src` or event-handler attribute is emitted. The the data contract validator rejects unsupported navigation URLs in authored bundles; the renderer also makes them inert when called independently.

Serialized controls carry associations, not event listeners. The existing renderer module now hydrates them in an inert document, validates allowed elements/attributes/targets and binds the same Viewer document/source callbacks. The live source preview continues to render raw Markdown with native callbacks. Class names, literal IDs and section structure remain compatible with the Viewer/search. Raw Markdown is retained for the existing search index and highlighting; no search/navigation implementation is duplicated here.

## Source snippets and diagnostics

Source references retain their original repository-relative path, optional symbol and inclusive one-based range in `architecture.sources`. The processor never infers language, symbol boundaries or missing code. It embeds only explicit ranges used by entry/node/edge `sourceIds`. Unused source records are still validated but do not cause unrelated content to be embedded.

Each snippet contains `sourceIds` and `lines: [{number, text}]`. Exact canonical file/range duplicates share one snippet, even when several references or path aliases identify them. Distinct/overlapping ranges stay separate. Lines retain UTF-8 text, tabs, spaces and original numbers. Line delimiters are normalized out of the line records; no syntax highlighting or source execution occurs. Full source text is cached only during processing and is discarded afterward. Render snippet text through text nodes when packaging; it is data, not HTML.

Fatal errors include missing/moved/unreadable or nonregular files, unsafe paths, symlink escapes, invalid UTF-8, reversed/nonpositive ranges and ranges beyond a readable file's line count. Existing schema/semantic/Markdown failures remain fatal. No partial successful build input is returned.

Warnings keep documentation usable without a snippet: file-level evidence with no explicit range, empty file-level evidence, and safety-limit skips. Empty ranged evidence fails against zero lines. Oversized source files are not read; their range bounds are explicitly reported as unverified. No skipped content is silently truncated and no substitute is fabricated.

Defaults, configurable through the Builder API's `limits` object:

| Key | Default | Result when exceeded |
|---|---:|---|
| `sourceBytes` | 1 MiB per file | Skip file content, warn that line bounds were not verified |
| `snippetLines` | 200 per range | Skip whole range with warning |
| `snippetBytes` | 64 KiB of text per snippet | Skip whole range with warning |
| `totalSnippetBytes` | 1 MiB of snippet text per artifact | Skip subsequent whole ranges with warnings |

Limits must be positive safe integers; unknown keys fail. The byte budget counts UTF-8 line text plus normalized separators, not JSON metadata. Oversized files are checked before allocation/read; a bounded read also protects against growth past the file limit. Memory and read limits are per referenced file, not a whole-repository snapshot guarantee.

## Internal processing interface

```js
import { prepareBuild } from './pipeline.mjs';
const prepared = prepareBuild({
  input: '/project/docs/architecture',
  repositoryRoot: '/project',
  output: '/project/architecture.html',
  limits: { snippetLines: 150 },
});
```

The private object has resolved `inputRoot`, `repositoryRoot`, `outputPath`, sorted `artifacts` and sorted processing `diagnostics`. Each artifact has input-relative `path`, the unchanged `architecture`, ordered `documents` and deduplicated `snippets`. Each document has bundle-relative `path`, exact raw `markdown`, safe fragment `html`, and `sections: [{id, label}]`. Graph-owned mappings remain in the approved envelope; no parallel entity model is introduced.

Processing warnings identify artifact, severity, phase, SourceReference ID and path. Fatal `BuildError.diagnostics` identify the failed stage and JSON/document/identifier location. CLI output escapes terminal control characters. No timestamps or random IDs are generated.

This is in-memory Builder state, not a second public schema or a persisted intermediate format. The standalone writer embeds this processed content and binds it through the current Viewer. The source panel shows numbered text with native code/text nodes, or the recorded warning/location-only state when no snippet is available. No `dist/archdoc.bundle.mjs` is generated. A future Skill bundle must carry Node dependencies and require no npm install in the target repository.

## Standalone packaging

`builder/html.mjs` reads the existing Viewer index/template and declared JS/CSS order. Sample fixtures are replaced by validated build data. It embeds unchanged the data contract envelopes, raw Markdown for existing search search, rendered fragments, numbered snippets and source warning metadata. Bundle keys are artifact-relative paths; titles come from authored index headings. No Builder input/repository/output absolute locations, timestamp or random identifier is embedded. Authored text is preserved, including any paths that authors put in their own code or prose.

The output contains one inline stylesheet, inert JSON data and the existing runtime scripts in one ordered inline block. JSON escapes `<`, `>`, `&`, U+2028 and U+2029, including script-closing sequences. CSP uses exact SHA-256 hashes for trusted scripts/styles, denies connections and external runtime assets, and allows neither unsafe-inline nor unsafe-eval. No CDN or LinkeDOM code is shipped to the browser. A template with missing assets or unexpected external resource references fails packaging.

`generateHTML(prepared)` returns the deterministic HTML string. `writeStandaloneHTML(prepared)` checks the destination, generates the complete string, writes a same-parent temporary file, checks again and atomically renames it to the output. The input/evidence files and Viewer template are protected from destination collisions. Preparation remains callable without writing. Byte equality is tested across repeated builds and relocated repositories with the same authored data/assets, regardless of output path.

The generated pFlow Viewer lists starts from all architecture artifacts in its Process starts explorer. The removed project/artifact picker is not retained. Existing entry grouping, expansion trails, inspector, selection, zoom/pan, Markdown links/citations and search use their current implementations. Source snippets keep original line numbers and whitespace. Source code is never parsed as HTML, fetched or executed.

Example API:

```js
import { prepareBuild } from './pipeline.mjs';
import { writeStandaloneHTML } from './html.mjs';
const prepared = prepareBuild({ input: '/project/docs/architecture', repositoryRoot: '/project', output: '/project/architecture.html' });
writeStandaloneHTML(prepared);
```

Output size grows with graphs, raw/rendered documentation and snippets; there is no compression, lazy loading or arbitrary-size guarantee. Existing Markdown/diagram limitations and snippet budgets still apply. The Node CLI itself is not bundled as dist/archdoc.bundle.mjs here; prebuilt Skill distribution remains separate work. Build-time assets must remain beside the source tool. Only the resulting HTML is fully standalone.

## Tests and limits

```sh
node --test test/builder.test.mjs test/content-processing.test.mjs
npm test
```

Tests use real temporary artifacts, CLI subprocesses, source files and offline Chromium. Generated-file tests move the HTML and delete the inputs before exercising Viewer interactions. They assert that only the HTML itself is requested, with the browser context offline. They check supported/safe rendering, stable navigation attributes, actual browser equivalence, UTF-8/line endings/range precision, deduplication, file-level/limit warnings, fatal stale/missing/unreadable evidence, roots/path safety, deterministic integration, no writes, and existing the data contract–search behavior.

The renderer is intentionally limited to the data contract; the validators do not prove source meaning, dynamic execution or historical identity. Discovery is not a Git-ignore engine or arbitrary filename loader. There is no watch mode, whole-file fallback, source-language inference, AI analysis or prebuilt Node/Skill distribution in the Builder.

Stop after the Builder. analysis needs separate approval.

## Output policy and both bundle layouts

The existing Skill uses [output-policy.mjs](output-policy.mjs) selectOutput with mode repository/prompt, repositoryRoot/cwd, optional documentWorkspace/outputDirectory and optional protectedPaths. New output is flat:

```text
<bundle>/index.md
<bundle>/flows/*.md
<bundle>/diagrams/architecture.json
<bundle>/evidence/request.md      # prompt only
<bundle>/architecture.html
```

Default selection is the analyzed project root for repository mode, cwd for prompt mode, then existing docs/, existing doc/, or new docs/, with architecture/ beneath it. docs/ wins when both exist. An explicit workspace alone or explicit output directory is the final bundle destination; no extra architecture/ is appended. A relative outputDirectory with documentWorkspace is inside that workspace; escaping it is rejected. Workspace registration order has no role.

The helper is read-only by default; create:true creates checked directories only. It returns selectionRoot, containmentRoot, evidenceRoot, bundleRoot, graphPath, docsRoot and outputPath for the existing pipeline. Pass canonical absolute roots; symlinks in selected output paths are conservatively rejected, including ancestor aliases. Do not canonicalize a rejected child path into a different authorized root. File collisions, unwritable selected directories, unowned conflicting content and protected source/evidence aliases fail without fallback. A recognized existing bundle retains its layout; it does not prove generated ownership or permit overwriting manual content.

Builder CLI flags stay unchanged. Supply --input <bundle>, --repository-root <evidenceRoot> and --output <bundle>/architecture.html after directory selection. The CLI itself still requires explicit input/output and does not create missing output parents. Repository evidence always uses the actual analyzed project, even when output is external. Prompt evidence uses the selected document boundary (cwd for defaults, explicit workspace when provided, or explicit bundle when it alone defines the document workspace).

JSON documentation paths remain relative to resolved docsRoot; source paths remain relative to evidenceRoot. Rebase evidence definitions when authoring the new layout: a flat flows/name.md uses ../evidence/request.md, while legacy docs/flows/name.md uses ../../evidence/request.md. Do not migrate an old bundle or duplicate the same Markdown into both roots.

Preparation adds only internal filesystem metadata (layout, graphPath, docsRoot and bundle-relative paths). Public graph schema and embedded Viewer payload are unchanged. HTML input protection and rebuild freshness use those actual roots. incremental updates repository apply resolves baseline/current/staged paths, requires matching layouts and preserves provenance, source/output separation, manual merging and rollback. External repository full builds work; external or prompt targeted apply remains unsupported.

## Portable Skill distribution

From the development checkout, run `npm ci` then `npm run build:skill`. This creates `dist/pflow/` with one Skill entry point, necessary Markdown references and exactly `scripts/pflow.mjs`. Copy that directory to the chosen Skill installation location; do not copy the source checkout or node_modules. Node.js 24+ is the only runtime requirement for full generation. Repository incremental work also requires local Git. Source CLI and library imports remain supported.

```sh
node /installed/pflow/scripts/pflow.mjs validate --input /target/docs/architecture --repository-root /target
node /installed/pflow/scripts/pflow.mjs build --input /target/docs/architecture --repository-root /target --output /target/docs/architecture/architecture.html
```

`--help` lists additive commands for output selection, impact planning, regeneration preparation/apply and inspected safe rebuilding. The [runtime reference](../skills/pflow/references/runtime.md) defines their transient arguments and the maintained API exports. No source-analysis engine or automatic provenance/index approval is added. Prompt updates still use explicit full generation.

The build uses pinned development esbuild and embeds schema/version JSON, Viewer assets and third-party JavaScript. Node built-ins remain external. The existing optional Canvas and CSSOM add-ons are fixed to their existing non-addon fallbacks; no ambient native/global package is loaded. Third-party license notices are embedded in the executable. Reference documents and templates are copied with checked local links, not fetched at runtime. The distribution directory is generated/ignored; source modules and tests remain authoritative.

Development assets remain file-backed. Packaged assets are immutable embedded strings. Safe rebuild fingerprints/protects the installed executable instead of looking for a neighboring Viewer directory. Both paths use the same Builder, safe Markdown and Viewer code. Replacing the executable requires fresh inspection/review before safe rebuild. The standalone HTML remains independent of the Skill after generation.

## Documentation lifecycle

The single packaged runtime also exposes VCS-independent detect, plan and publish commands for code, prompt and mixed evidence. They reuse this Builder and existing validators; graph schema 1.0.0 is unchanged. See [lifecycle instructions](../skills/pflow/references/lifecycle.md) and [runtime commands](../skills/pflow/references/runtime.md). Publication stages all canonical artifacts and HTML together and retains the previous bundle on recoverable failure.

## Optional findings

An adjacent findings.json is optional for both bundle layouts. The Builder validates schema 1.0.0, graph targets and source evidence, embeds a read-only report and marks outdated results for revalidation without active badges. Invalid findings structure blocks a build; stale retained findings generate diagnostics. Base builds never run AI bug analysis. Use the trusted single-runtime findings-inspect/findings-publish commands for reviewed publication of findings plus HTML. See [analysis and review instructions](../skills/pflow/references/potential-bugs.md).
