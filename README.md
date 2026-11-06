# Vigneswer’s portfolio

The main portfolio uses the imported studio design with the original profile data in `src/content/profile.ts`. The previous portfolio—including its terminal, physics interactions, and games—is available at `/classic`.

```sh
npm ci
npm run dev
npm run build
npm run lint
npm run preview
```

Open the URL printed by Vite. Check `/`, `/projects/commerce`, `/projects/petition`, `/projects/malayalam`, `/projects/askktu`, and `/classic`. The sidebar character opens the handheld arcade and local portfolio guide. Chat answers use public portfolio data locally; no AI service or secret is configured.

Cloudflare configuration and the existing `npm run deploy` command are unchanged. No deployment was performed during integration. See [the analysis, plan, file manifest and verification record](docs/portfolio-integration.md).

The résumé PDF was already deleted in the working tree before integration. Restore `public/Vigneswer_V.pdf` when ready; the studio automatically shows the download link when the file exists at build time.

---

## Original scaffold notes

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
