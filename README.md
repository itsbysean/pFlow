# pFlow

pFlow documents how systems work and how teams work. A coding agent uses repository evidence or a process description to create linked Markdown, flow diagrams and one offline HTML Viewer.

## Install

[Download the latest Skill ZIP](https://github.com/itsbysean/pFlow/releases/latest/download/pflow.zip), extract it, and copy the `pflow/` folder into your agent's Skills location. Keep `SKILL.md`, `references/` and `scripts/pflow.mjs` together.

Node.js 24+ is required. The installed Skill needs no npm install or web server. Repository incremental updates also require Git. GitHub's source-code archive is a development checkout, not the installed Skill.

## Use

Ask your coding agent:

> Use pFlow to explain how [feature] works in this repository.

Or describe a team process:

> Use pFlow to document this process: [steps and decisions].

pFlow captures prompt evidence or traces verified code/configuration, creates the documentation, validates its references and builds `architecture.html`. It asks about missing information that changes the process and leaves unsupported relationships unresolved.

## Explore

Open `architecture.html` in a browser. No server or network connection is required.

- Select a process start to open its flow.
- Select a component or arrow to inspect its documentation and evidence.
- Use the separate ↗ action to open supported detail flows; use Back or breadcrumbs to return.
- Keep reading in the selected Documentation, Evidence, Summary or Details tab while moving between flows.
- Use **Docs** to open the current flow's full documentation.
- Search document text with Ctrl+K or Cmd+K. Switch themes and resize the side panels as needed.

## Output

```text
docs/architecture/
  index.md
  flows/
  diagrams/architecture.json
  evidence/                 # captured prompt evidence, when applicable
  architecture.html
```

Explicit output paths are final bundle destinations. Otherwise pFlow prefers an existing root `docs/`, then `doc/`, or creates `docs/`. Legacy bundles remain supported. See [output policy](docs/output-bundle-evaluation.md).

Repository updates can use Git-based impact planning, reviewed targeted regeneration and safe HTML rebuilds. Prompt updates require explicit full generation; uncertain ownership or manual edits need a safe replacement decision. pFlow does not run target scripts, install target dependencies or contact infrastructure to discover architecture.

## Develop

```sh
npm ci --ignore-scripts
npm test
npm run build:release
```

Tests require Chrome/Chromium; set `PFLOW_BROWSER_PATH` if needed. Packaging also uses Python 3's standard ZIP library. Build output is ignored under `dist/`; the installed runtime remains one JavaScript file.

Publishing is manual. In GitHub Actions, run **Publish patch release** from `main` to test, increment the patch version and publish the ZIP. Run **Deploy website to GitHub Pages** separately to update the homepage. Merging a PR does not deploy either. See [release instructions](docs/release-workflow.md).

## Reference

- [Builder commands](builder/README.md)
- [Viewer behavior and tests](viewer/README.md)
- [Skill instructions](skills/pflow/SKILL.md)
- [Graph schema](schema/architecture-1.0.0.schema.json) and [Markdown contract](docs/markdown-contract.md)
- [Sample bundles](examples/) and [project roadmap](docs/roadmap.md)

The graph model remains version `1.0.0`, independent of the package release version. Source evidence, exact identifiers and canonical links remain authoritative. The read-only Viewer does not prove runtime behavior or fill gaps in the evidence.
