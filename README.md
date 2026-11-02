# pFlow

pFlow is an AI agent Skill for mapping processes from repository evidence or natural-language descriptions. It creates structured diagrams, Markdown documentation, and an offline HTML viewer.

## Install the Skill

Copy the contents of [`skill/`](skill/) into a folder named `pflow` in your agent's Skills location. The Skill requires Node.js 24 or newer and does not need an npm install at runtime.

The distributable package contains `SKILL.md`, its required reference files, and the bundled runtime at `scripts/pflow.mjs`. See [`skill/references/`](skill/references/) for its workflow and output contracts.

## Website and interactive demos

The bilingual product site is in [`website/`](website/). It explains repository and natural-language workflows, Skill installation, and the generated files. It also links to two standalone HTML demos built by the packaged pFlow Builder: a code architecture fixture and a natural-language deployment process example. The demo inputs are illustrative examples, not production systems or company policy.

GitHub Actions deploys the full `website/` directory, including both demos. The expected site address is <https://itsbysean.github.io/pFlow/> after Pages is enabled and a deployment succeeds.

To enable deployment:

1. Open **Settings → Pages** in this repository.
2. Set **Build and deployment → Source** to **GitHub Actions**.
3. Push a change to `main`, or run **Deploy website to GitHub Pages** from the Actions tab.
4. Confirm the workflow succeeds, then open the site address above. Open **Live Demos** to launch either interactive Viewer as a full page.

GitHub Pages is not confirmed as enabled or deployed yet.
