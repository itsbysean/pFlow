# M2-01 — Viewer foundation plan

M1-01 through M1-03 are present and consistent. There is no existing Viewer. The supplied image is stored as `pflow-viewer-reference.png`; its Java/HTTP content is illustrative only.

1. Build an offline preview in `viewer/index.html` with local classic scripts and CSS. Separate HTML structure, design tokens/styles, sample adaptation, and UI initialization. No runtime packages, imports, fetches, or CDN assets are needed. These assets can later be inlined into a standalone file; packaging is outside this task.
2. Match the reference's compact header, narrow navigator, large center workspace, right inspector, and bottom document panel. Use system fonts, neutral surfaces, blue selection, and the five reserved diagram colors. Stack panels at narrow desktop widths.
3. Package copies of the three actual M1 artifacts as demo data and test them against their source files. Group entries by exact recorded trigger text, with an unspecified fallback, because M1 has no mechanism taxonomy. Do not infer framework categories or change the schema.
4. Keep the diagram area a visible empty/loading placeholder. Initialize one sample inspector and plain, curated summary text. Provide working presentation tabs and navigator selection styling only. Search and diagram controls remain clearly unavailable. No graph navigation, Markdown parser, syntax highlighter, or source navigation.
5. Use Node tests plus a real Chromium browser through a development-only Playwright dependency. Test `file://` startup, all regions, sample adaptation, custom triggers, empty/loading states, keyboard tabs, responsive bounds, and offline operation. Review screenshots against the reference.

Continue on `main`, following the user's latest repository workflow. Do not start M2-02. A single-file export or Builder is not part of this foundation.
