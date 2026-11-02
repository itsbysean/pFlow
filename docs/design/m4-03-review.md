# M4-03 review and completion

Implemented on local main after 1cf73f9. M1 schema/model 1.0.0, sample artifacts, Markdown associations, source extraction and execution semantics are unchanged. No dependency was added.

## Files

| Files | Change |
|---|---|
| `builder/html.mjs` | Existing Viewer asset/template loading, safe data embedding, hash CSP, deterministic HTML and atomic output |
| `builder/cli.mjs`, `builder/arguments.mjs` | Existing build command now writes HTML and reports bytes/counts; options retained |
| `viewer/markdown.js` | Allowlisted inert fragment hydration, section maps and binding of existing document/source callbacks |
| `viewer/documentation-panel.js` | Prefer processed fragments, show numbered embedded snippets/warnings, reveal source controls in stacked layout |
| `viewer/index.html`, `viewer/viewer.css` | Numbered source list and light-theme styling/focus visibility |
| `test/html-generation.test.mjs` | Resource/content embedding, serialization, determinism, missing assets, output preservation and collision checks |
| `test/viewer.test.mjs` | Real generated-file offline navigation/search/source tests, hostile text, warning states and hydration checks |
| `test/builder.test.mjs`, `test/content-processing.test.mjs` | Update CLI expectations from preparation-only to successful HTML generation; preparation API remains read-only |
| `README.md`, `builder/README.md`, `viewer/README.md` | Build/preview instructions, integration boundaries, safety and limits |
| `.gitignore` | Ignore the default generated architecture.html output |
| `docs/design/m4-03-plan.md`, this file | Research/plan and review record |

## Integration

The packager reads the existing Viewer index/template and declared JS/CSS order, removes sample fixture scripts and embeds validated preparation data. Stable artifact-relative keys and authored index headings supply the artifact picker; no graph identity is derived from display names. Original envelopes, raw Markdown, rendered fragments, snippets and source warnings remain associated within each bundle.

The existing Viewer initializes from embedded globals. Processed fragment hydration binds declarative controls to the same Markdown/source callbacks and reconstructs literal section maps. Existing entry/detail trails, selection, inspector, SVG viewport and M3 search/highlights remain responsible for behavior. The source pane displays exact numbered snippet text or the corresponding unavailable warning. The raw-render path stays available for the source preview; generated-output tests disable it to prove processed fragments are used.

The payload is inert JSON with HTML-significant characters and Unicode separators escaped. Trusted inline JS/CSS have exact SHA-256 CSP hashes. External runtime resources, connections, unsafe-inline and unsafe-eval are not allowed. There are no runtime fetches or original-file URLs. Builder absolute input/repository/output locations, timestamps and temporary names are not embedded. Authored strings remain unchanged.

HTML is completed in memory, then written to a same-parent temporary file and atomically renamed. Validation or packaging failure preserves an existing output; temporary state is cleaned. Existing input/evidence collision checks are reused and the Viewer template is also protected. No new CLI option or command is required.

## Separate review pass

A separate self-review checked offline compatibility, injection boundaries, reference binding, determinism, duplication, output safety and maintenance. No sub-agent review was performed.

- Serialization tests cover closing tags, comments, quotes, ampersands, HTML-like source and Unicode separators. Actual browser tests verify these remain inert text and execute no injected script.
- Review added early rejection of unsupported fragment tag tokens before parsing, followed by element/attribute/ID/control checks in an inert document before adoption. The initial defensive test exposed an inline-handler CSP diagnostic during unsafe fragment parsing; the early tag rejection fixes that test while valid generated fragments continue to work.
- Missing/unsupported asset references fail packaging. Runtime code and CSS come from existing files; no alternate Viewer, graph, navigation or search implementation was added. The only new runtime UI is the bounded source list and processed-fragment adapter.
- Review protects the tool template from output collision. Invalid JSON/required assets leave previous output unchanged. Byte equality is checked across repeat writes, different output locations and relocated repositories.
- Visual review at 1440 and 900 pixels found source controls could remain above the viewport after clicking an inspector reference in the stacked layout. Source opening now reveals the pane below the sticky header, with a browser regression test.

## Validation and offline verification

`npm test`: **367 passed, 0 failed, 0 skipped**. This includes the existing M1–M4 validation/processing cases, six dedicated packaging tests and five new generated/hydration browser checks.

The focused Builder/processing/packaging run passed **80 tests**. Browser tests move the generated file, delete the original input tree, set the context offline and reload through file://. They assert that reload plus all interactions request only the generated HTML, with no remote/local asset requests or page/console errors. Covered interactions include entry switching, reusable detail trails, node/edge inspection, Markdown links/citations, zoom/fit, numbered programming/configuration snippets, M3 result activation/highlights, unavailable states and source-pane focus.

The source tool command succeeds:

```sh
npm run archdoc -- build --input . --output architecture.html
```

The local generated preview contains **3 artifacts, 6 documents and 19 snippets**, totaling **185,144 UTF-8 bytes** for the reviewed assets/input. A fresh in-memory build equals its bytes. architecture.html is present locally and ignored by Git. `git diff --check` passes.

## Remaining limits

Building uses the pFlow source tool, installed development dependencies and neighboring Viewer assets. The resulting HTML alone is portable; a prebuilt Node/Skill distribution is not produced here. There is no compression, streaming/lazy loading or arbitrary-size guarantee. Existing M1-03 Markdown, dense graph and snippet-budget limits remain. Snippets are plain numbered text without syntax highlighting.

Chromium was exercised; other browser engines and a full assistive-technology audit remain unverified. Filesystem checks do not claim a snapshot against concurrent hostile mutations. Authored source/prose can itself contain filesystem paths; only Builder host locations are excluded from generated metadata.

Stop after M4-03. M5 requires separate approval and was not started.
