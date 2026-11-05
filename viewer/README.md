# pFlow Viewer

Open `index.html` directly in a browser. Keep its neighboring CSS and JavaScript files beside it. Viewing needs no server, package installation, or network access. The Builder can also package this Viewer into one standalone HTML file; see [Builder usage](../builder/README.md).

On macOS, from the repository root:

```sh
open viewer/index.html
```

The Process starts explorer lists starts from all three approved the data contract samples. Use the Header search to find documentation, or expand supported subprocesses beneath a start. Start with **Synchronous refresh**, select **Refresh command**, then use the explicit **↗** controls to open **Refresh component** and **Read state**. Select **Fetch state** to inspect its HTTP metadata and read its associated Markdown section. **Asynchronous jobs** demonstrates a verified producer/consumer connection; **Custom task dispatch** demonstrates configuration and registry evidence.

## Selection and expansion

- Click a node body, or focus it and press Enter/Space, to select it. Selection highlights the node and updates the inspector and document context without replacing, fitting, or panning the diagram.
- A node with a recorded detail Flow has a separate **↗** button. Activate that button, or the inspector's detail action, to navigate. Double-click is not required. A recursive target uses **↻** and explains the navigation block.
- Click an edge path or its label to select the relationship. Edges are also keyboard-focusable buttons. The inspector shows actual endpoints, kind, mode, label, evidence, and any external metadata recorded on those endpoints.
- Drag a node, edge, or background to pan. A drag does not select or expand. **Clear selection** returns to the Flow's document context and focuses the diagram while preserving its viewport.

The inspector reads canonical the data contract objects. It shows relevant source references, conditions, related relationships, external metadata, detail targets, and documentation links. Irrelevant sections are hidden. the data contract has no description field, so the Viewer does not invent descriptions or reuse curated preview prose as metadata. Unresolved boundaries and unknown transfer modes receive explicit explanations of their recorded uncertainty.

## Documentation and evidence

Each Flow opens its complete canonical Markdown document. Node or edge selection locates its own canonical `docs` section within that document; absent or unreliable links retain the current Flow's documentation with feedback. Remote targets do not replace it with another Flow's document. Mapped sections and outline entries can select and center their graph element. Ordinary Markdown links change reading context without changing graph selection. The document-reference picker retains supporting documents.

The renderer implements the the data contract profile with native DOM APIs: headings, literal entity-ID sections, paragraphs, simple lists/tables, inline code/strong text, fenced code, relative document links, and SourceReference citations. It does not implement all CommonMark syntax or generate heading slugs. Raw HTML is displayed as text except for the exact canonical anchor convention. Generated output uses the same Builder-rendered fragments, checked and rebound to existing controls by the renderer's hydration function. External/unsupported destinations are inactive. Missing documents, missing sections, and duplicate literal sections produce explicit states instead of guessed destinations.

Source buttons in the inspector or Markdown open **Evidence references**. That view shows the exact repository-relative path, inclusive line range, and symbol when present. File-level references omit line fields. The source preview has location-only fixtures. Builder-generated HTML includes the bounded numbered snippets prepared from actual SourceReferences; the pane renders line text with native code/text nodes. Missing snippets show their processing warning or the location-only state. It does not fetch local files, follow source-definition URLs, extract code, or fabricate snippets. The source pane never reads original files; extraction happens at build time.

Markdown snapshots are exact copies of the the data contract sample documents. Source citations resolve through the architecture's SourceReference IDs. the data contract validation remains responsible for checking authored definitions against their repository locations; runtime rendering does not replace that validation. The Process summary disclosure reports structural counts and documented exits, without treating node-array order as an execution sequence.

## Navigation and viewport

Selecting an entry point resolves its `flowId` and starts a fresh trail. **Back** moves to the parent; **Forward** revisits a retained descendant. Breadcrumbs and **Top level** move toward the root while keeping Forward available. Opening another branch discards the old forward trail. Selecting any entry, including the active one, clears the prior trail and selection.

The trail stores only entry, Flow, and calling-node IDs. Reused Flows retain their calling context without copying graphs. A target already in the active path is blocked until the user returns through Back or a breadcrumb. Valid recursive references and execution cycles remain in the artifact.

The flat **Displayed flow** chooser is direct browsing: it clears entry context and does not invent intermediate levels. A cross-flow async target is an inspectable boundary stub, not a hierarchical expansion control. Selecting it can show its owner and documentation without navigating to a consumer. Use the consumer's entry point to change execution context explicitly.

**+ / −** zoom around the viewport center. **Fit view** contains all geometry without enlarging beyond 100%; **Reset zoom** restores 100% and aligns tall diagrams to the top. Focus the SVG and use arrow keys to pan. Every Flow transition, including Back and breadcrumbs, clears selection, loads the new Flow's documentation, and fits the diagram. Resizing also refits. There is no viewport history or browser-history integration.

## Offline Markdown search

Use the header input or **Ctrl+K / Cmd+K**. Search covers all six embedded Markdown files across the three sample bundles, including documents outside the active Flow. Results show the actual document title, section heading, preview, bundle, path, and literal section ID when available. **↑ / ↓** review results; **Enter** opens the reviewed result, or the first current result when none is reviewed. A mouse click opens that result. **Escape** closes search and restores the shortcut's previous focus. Clear empties the query. Activation closes the overlay, retains the query and focuses the matching document passage. Reopen with the same shortcut.

The index is built once from `pFlowDocuments`. It extracts prose, headings, inline code, list/table content and link labels. It excludes anchor markup, source citation IDs/definitions, link destinations, comments, embedded script/style blocks and fenced examples. Text belongs to its nearest literal entity section; unanchored subheadings share that section, and unanchored top-level content uses a document-level record with `sectionId: null`. No heading slugs or graph IDs are generated. The validated the data contract Markdown remains authoritative for section identity.

Matching uses NFKC normalization, locale-independent case folding, and Unicode letter/mark/number tokens. Each query term must match part of a token in the section's document title, headings or body. Terms may match different fields within that section. There is no English word list, stemming, transliteration, fuzzy matching or query syntax. Exact normalized document titles rank first, heading matches next, then body matches. Within those groups, exact headings and the number of heading/body terms improve rank; bundle, path and section order break ties. A section appears once; a title-only match appears once per document. Distinct documents retain their own results.

Input updates are debounced by 120 ms. Keyboard review flushes pending input. At most 20 previews are rendered; the status reports the total. Highlight ranges map normalized matches back to the original graphemes, including composed accents and expanded ligatures. Previews use native text and `mark` nodes. They do not insert HTML or request resources. The results list scrolls independently and the popup does not resize the diagram.

### Result navigation and highlights

Activation resolves the exact bundle, document path and literal section ID. Embedded Markdown is rendered and the section is checked before any graph change. A diagram association requires an entity with that exact ID and a canonical `docs` backlink to the same path/ID. Node and Edge sections must also be nested in their owning Flow section. Supporting links and matching titles do not establish ownership.

Mapped Nodes and Edges select their actual owning Flow and update the inspector. Flow sections navigate without choosing an arbitrary node; EntryPoint sections select that entry's root. The route policy is deterministic:

1. Keep the current trail when its active Flow already owns the result (except an explicit EntryPoint result).
2. Otherwise, search expansion links breadth-first from the current entry, then remaining entries in artifact order. Within each root, choose a shortest path; node-array order breaks ties. Each Flow is visited once per root, so recursive links terminate safely.
3. If no entry reaches the known Flow, browse it directly with a notice. Do not add intermediate breadcrumbs. Asynchronous edges are never expansion links.

A Flow transition fits the diagram. Within the current Flow, search keeps the SVG and trail, then pans only as needed to reveal the selected element; an oversized element uses Fit. Back, Forward, Top level and breadcrumbs continue to use the existing caller trail. No graph data is copied.

Whole-document and unmapped sections open without changing the diagram Flow or viewport. Previous selection is cleared. A document from another bundle can be read without switching the architecture picker when it has no verified diagram mapping. Source citations resolve in that document's bundle. Unknown/ambiguous entities, missing backlinks or invalid ownership receive a documentation-only notice. Missing bundles/documents/sections and invalid result IDs report an error and focus the navigation status. They do not select an unrelated element.

Highlights reuse search normalization and original-text ranges. Native text-node splitting preserves inline code, strong text and link controls, including matches that span inline formatting. Highlighting is limited to the indexed section's own content; nested canonical sections and source-reference UI are excluded. For repeated terms, the first matching body passage in document order is revealed, falling back to a heading or the section. The article scrolls normally afterward. Normal document/outline, node/edge and Flow navigation clear highlights; switching tabs retains them. The Markdown payload is never changed.

Typing and arrow review still leave the diagram unchanged. If a click lands on an obsolete row before a pending query is processed, search refreshes the list and waits for another click. Enter processes the current query and opens its reviewed/first result. Search activation itself adds no browser-history route, result URL or source extraction; packaging uses the separate Builder.

### Search payload for future embedding

`pFlow.buildMarkdownSearchIndex([{bundleId, path, markdown}])` creates a JSON-serializable, private search index. `pFlow.createMarkdownSearcher(index).search(query, limit)` returns totals and result metadata with highlight ranges. The index contains:

- `version: 1`: the Viewer search payload version, separate from the data contract `modelVersion`.
- `documents`: bundle ID, bundle-relative Markdown path, and actual title.
- `sections`: document-array index, literal `sectionId` or null, headings, plain text and deterministic ordinal.
- `postings`: normalized token keys, with unique document indices for titles and section indices for headings/body.

A future embedding step can supply `globalThis.pFlowSearchIndex` before `search.js` runs. That bypasses runtime Markdown indexing. `pFlow.search.setIndex(index)` explicitly replaces the search index without changing diagram state. Unsupported versions and invalid document/posting references fail explicitly. The format is internal, not an addition to the approved architecture schema or a general validation API. No Builder or serialization CLI is included. Replacing Markdown at runtime requires explicit index replacement; queries and Flow changes do not rebuild it.

## Files

| File | Responsibility |
|---|---|
| `index.html`, `viewer.css` | Five-region layout, light-theme tokens, responsive scrolling, focus and selection styles |
| `sample-data.js`, `sample-documents.js` | Exact offline graph and Markdown fixtures; no source file contents |
| `sample-adapter.js` | Data-derived entry grouping and header/count presentation |
| `graph-layout.js`, `diagram-viewport.js` | Deterministic geometry and viewport math |
| `diagram.js` | Native SVG rendering, separate selection/detail controls, and pan handling |
| `flow-navigation.js` | ID-only caller trail and recursion guard |
| `details-inspector.js` | Canonical selection resolution and supported metadata presentation |
| `markdown.js` | DOM rendering and bundle-relative document target resolution |
| `documentation-panel.js` | Document links/sections, source-reference view, and structural summary |
| `markdown-search.js` | Plain Markdown extraction, serializable token index, matching, ranking and highlight ranges |
| `search.js` | Isolated header search, safe previews, debounce, keyboard review and activation delegation |
| `search-navigation.js` | Canonical document associations and deterministic expansion-path planning |
| `viewer.js` | Initialization, navigation/selection coordination, tabs, and empty/loading/error states |

Entry groups use exact recorded `trigger` text, with `Trigger not recorded` for absent values. No framework taxonomy is inferred. Geometry and selection are temporary presentation state; nothing is written back to the data contract artifacts.

## Tests

Use Node.js 24, run `npm ci --ignore-scripts`, then `npm test`. Playwright Core is development-only. Browser tests detect common Chrome/Chromium paths or use:

```sh
PFLOW_BROWSER_PATH=/path/to/chromium npm test
```

A Playwright-managed Chromium installation can also be used when available. Browser process launch must be allowed by the host; tests fail rather than silently skip when a browser cannot launch.

Tests cover the data contract contracts, sample/document equality, graph layout and cycles, navigation, selection versus expansion, inspector fields, source locations, Markdown reference resolution, missing/ambiguous sections, keyboard behavior, stale-selection clearing, responsive bounds, viewport preservation, Markdown body search, Unicode normalization, ranking, duplicate suppression, precomputed indexes, safe previews, composition keys, result activation, passage scrolling/highlighting, canonical graph synchronization, stale references and search-state isolation. Browser tests load `file://`, block HTTP(S), and fail on requests or page/console errors. Standalone Builder tests verify the same assets with CSP hashes, moved output and deleted inputs. Search/navigation/source interactions continue to work under file:// without any external/local resource requests.

## Limits

Dense/parallel edges and labels can still overlap. Fit can make large graphs small; use zoom/pan. There is no graph virtualization, arbitrary-size guarantee, general artifact loader, persistent navigation session, or selection/viewport restoration across Flow changes.

Desktop panels keep the approved arrangement. At narrower desktop widths the document panel is bounded to 360 pixels and scrolls internally; the inspector stacks below it. On smaller screens the layout uses one column. The Viewer uses native controls, SVG text, focus indicators, and named regions, but only Chromium was exercised. Additional browser and assistive-technology testing remains necessary.

search completes search activation and highlighting. The extractor supports the the data contract profile, not all CommonMark syntax. Partial matching scans the indexed vocabulary; the index is not designed for unbounded corpora. Builder generation and source embedding are implemented in the Builder. Optional findings, AI analysis and incremental updates remain outside the Viewer.

## Generic process presentation

One Viewer serves both how a team works and how systems work. The navigator says Process starts; the legend says Process step; the right-column inspector and evidence tab say Evidence references; the structural summary is Process summary. Code-specific names, call/exception/async kinds, library/system metadata, optional source symbols and exact paths/ranges stay available when the artifact records them. No input mode is stored or guessed from labels/paths.

The visible hint separates selection from ↗ detail navigation. Top level returns to the first Flow in the current path, including a directly opened Flow; it does not promise a fabricated entry-point path. The level badge says Start flow, Detail or Direct flow from actual navigation state. Back/Forward, breadcrumbs, shared detail and recursion protection are unchanged.

Outcome means a documented exit at this Flow's scope. Exception path remains a specific recorded exceptional transfer, not a claim that every alternative or failure is an exception. Dashed borders identify existing unresolved nodes; the inspector states the uncertainty instead of inventing a next step. Unknown waiting/transfer behavior remains unknown. A source reference can identify code, configuration or captured developer text; bounded evidence excerpts remain read-only text nodes and never fetch local files.

Use the existing index/flow templates for a concise purpose, scope, start, major sequence/decisions, outcomes and known limits. State participants or rationale only when evidenced. Canonical IDs/links and SourceReference citation/range rules are unchanged. The contract's Source evidence Markdown heading remains valid for every evidence type.

## pFlow layout

The Viewer uses one full-height explorer, diagram and documentation column below the pFlow/search/Docs/theme header. No project, branch or Settings control remains. Docs restores the documentation column and opens the active Flow document without changing graph selection. The same existing renderer and canonical links populate Documentation, Evidence references and Process summary. The optional Details tab retains the existing inspector; current node/edge selection behavior is described below. Search result activation retains its existing passage navigation.

Use the chevrons to collapse or restore each side independently. Both can be closed. Drag the dividers, or focus a separator and use Left/Right (20px), Home (minimum), or End (available maximum). The center retains usable width. At narrow sizes panels shrink within responsive limits, then collapse as needed. Restoring one may collapse the other when both cannot fit. Restore buttons stay in visible rails. The existing diagram ResizeObserver fits the SVG to changed space. Theme, panel widths and explicit collapsed states are saved in local storage when available. Invalid or blocked storage falls back safely. Selected process, selected node, viewport and exception visibility are not persisted. Responsive layout still clamps restored widths to the available space.

Light is the default. The theme button changes all surface, graph, search and evidence tokens. Evidence remains read-only. Multiple artifacts are browsed through actual process starts, not a replacement project selector. Artifacts without starts expose their documented Flows explicitly.

`layout.js` owns only panel widths/collapse and theme presentation. Builder and incremental updates freshness automatically include declared Viewer assets. File paths, schema IDs, graph semantics and validation protections are unchanged. Tests in `test/viewer-shell.test.mjs` exercise generated standalone HTML without network access.

## Diagram/document integration

The right column retains the complete canonical Flow document when a node or edge is selected. Selection locates its own canonical section only when exact IDs, document backlinks and the nearest owning Flow agree. The section receives a brief theme-aware outline. Repeated selection relocates it again. Missing, remote or unreliable mappings keep the current Flow document and explain the limit; titles never establish mappings. Supporting documents remain available through existing links and the document picker.

Click a mapped section's text, its outline entry, or **Locate in diagram** to select the same element and center it. Use Enter/Space on the native locate button. Existing links, citations, form controls and code blocks do not trigger surrounding section selection. Text selection remains available. Zoom stays unchanged unless the target is too large to fit. The SVG is not rebuilt for a selection in its current Flow.

**Open detail** is a separate action in supported Node sections and the existing SVG control. It opens only an actual referenced Flow. Selecting a section in another Flow reuses the existing expansion-only path planner: prefer the current entry, then artifact order, with breadth-first node-order paths. An unreachable Flow opens directly with a notice rather than an invented parent. Async edges never supply hierarchy. Back/Forward/Top level retain their existing meaning, including shared caller context and cycle protection.

Normal document scrolling does not pan the graph. Section activation preserves document scroll while centering the graph. Search continues to open its matched passage, including unmapped index text. **Docs** explicitly restores the active diagram Flow document after such a cross-bundle search. Technical details and evidence remain available in independent disclosures below the narrative and through actual citations. Nothing fetches source files at runtime.

Only the currently mounted document is reused, keyed by sample, normalized path and exact Markdown/processed content. Selection/evidence metadata is updated separately. No second parser, graph model or competing selection state is introduced. The [Viewer improvements plan](../docs/design/m8-02-plan.md) and [completion/review record](../docs/design/m8-02-review.md) cover tests and limits.

## Viewer polish and validation

Long Flow titles and descriptions wrap within the workspace and show at most three lines. Their complete text remains in the accessible heading/description and native title. Small-height workspaces scroll locally instead of hiding controls. Search results shrink within the window; the result list scrolls separately. Theme tokens and placeholders use the same readable colors, with focused tests for normal text on selected/category surfaces.

The [Viewer improvements report](../docs/design/m8-03-review.md) records generated-file offline checks for repository, onboarding and deployment examples, keyboard focus, panel and navigation regressions, and bounded performance measurements. These are Chrome-based fixture evaluations, not a screen-reader certification or a human usability study. Very large graphs can still need Fit, zoom and pan. Viewer improvements packaging remains separate.

## Layout collision handling

Node frames remain bounded at 224×80; long text is fitted with native SVG measurement and complete accessible labels. Diamond lines use their actual font ascent/descent to limit width at sloping borders. SVG geometric text precision keeps those measurements stable across zoom. The layout derives rows from each frame's width and maximum height; a private `nodeSizes` presentation option supports nonuniform measured frames without adding graph fields.

Horizontal corridors reserve both paths and label plates. Clear intervals share tracks; only occupied gaps grow. Long/back/self relationships use outside lanes sized for complete plates. A label first uses a clear part of its path where possible. If another path would still be hidden behind it, that label receives a dedicated outer lane and reservations repeat with a bounded monotonic set. Outer captions sit between horizontal track levels. Diamond endpoints connect to their actual slopes, and separate relationships receive stable distinct ports. Scene bounds include selection/control/arrow/plate clearance.

Logical dimensions grow with the graph, not with the available screen width. Fit can make a dense diagram small; zoom/pan and existing supported detail navigation remain necessary. Ordinary edge crossings can still occur; zero crossings for arbitrary graphs is not claimed. [Viewer improvements research and validation](../docs/design/m8-5-review.md) distinguishes confirmed collisions, rejected hypotheses, performance cost and tested limits.

## Reading component documentation

The complete narrative remains mounted while independent Evidence, Process summary and Technical details disclosures keep their open state through node/edge selection, flow changes, drill-down, Back and process-start changes. Evidence links open the Evidence disclosure; documentation links, search results and **Docs** locate the narrative. The Evidence picker follows the selected component, or the current Flow's recorded node/edge references when nothing is selected.

The document context and canonical reference identify the selected component. Its own section is highlighted and brought into view in the narrative, while the complete Flow text remains mounted. Missing sections remain an explicit Flow fallback. Component prose is authored from evidence; the Viewer does not generate explanations from labels. **Docs** deliberately opens the full current Flow document, restores its column and focuses the article without changing diagram selection.

Node selection keeps the component's category color and exact shape. It uses a slightly stronger fill, a modest stroke and a soft glow, with no surrounding selection box. Keyboard focus uses a separate dashed contour matching the actual shape. Moving focus does not clear selection. Hover changes the fill without moving or scaling the component.

## Full-label tooltips and optional issue reports

Hover a node or focus it with the keyboard to read the full label. Tooltip text uses viewport pixels, not graph zoom. Escape dismisses it; pointer access to the tooltip and keyboard focus preserve it until dismissal/exit. Graph movement repositions a focused tooltip or dismisses a hover tooltip; unrelated document scrolling does not dismiss keyboard context. Navigation clears stale anchors.

When a separately validated findings.json is embedded, current unreviewed/supported findings mark their exact nodes with a severity-colored warning control and their exact edge labels with a warning outline. Warning controls open the Findings disclosure; they do not expand a Flow. Issue report opens the read-only retained list, including dismissed/resolved or stale diagnoses. Stale results have no active badges. Explicit Locate actions use existing hierarchical navigation; no paths or replacement associations are invented. Evidence and review history expand on demand. The Viewer cannot write review decisions. No findings means no extra report control.

## Simplified process reading

The Header contains the only search input. The Navigator groups starts using recorded triggers and lazily exposes only existing `expandFlowId` relationships. Each detail button retains its entry and calling-node path. Shared graphs are not copied. Repeated Flows in the current path are disabled and labelled; asynchronous edges never create hierarchy.

Selecting a node emphasizes its immediate connections and dims unrelated elements. Selecting an edge emphasizes its two endpoints. Clearing selection restores all elements without rebuilding the SVG. Full node names remain available through hover/focus tooltips.

**Show exceptions** is on initially. Turning it off hides exception edges and terminal outcomes reached only by exception edges. Shared outcomes and other steps remain visible. Coordinates and viewport are preserved; blank space may remain. Explicit documentation/search navigation to a hidden exception reveals it again. Original Markdown and graph data remain complete.

The Contents outline is optional and collapsed initially. Evidence and technical metadata are disclosed on demand; the full narrative stays available. Findings have their own disclosure, with separate evidence and review-history controls. No change history, analysis-progress indicator or Documentation Mismatch is inferred from missing data. Those inputs are not part of the current Viewer payload.
