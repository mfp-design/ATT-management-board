# Architecture

> この文書は再構築前のClaude Artifact版の現行構成を説明する。再構築後の構成は、[ADR 0005](adr/0005-cloudflare-low-cost-stack.md)と[全面再構築 要件定義書](requirements/management-board-rebuild.md)を参照する。

## Build flow

```text
src/app-runtime.js
        |
        v
scripts/build.js
        |
        v
public/index.html
```

`src/app-runtime.js` contains the CSS, document template, initial data shape, rendering, and browser behavior. It also exports the document builder when loaded by Node. `scripts/build.js` reads that source and embeds it into a self-contained `public/index.html` for Claude Artifact publishing.

## Editing rules

- Edit application behavior only in `src/app-runtime.js`.
- Treat `public/index.html` as generated output.
- Run `node scripts/build.js` after every source change.
- Keep durable browser regressions in `tests/` and use a descriptive `*.test.js` filename.
- Do not commit screenshots, temporary fixture HTML, or one-off debug scripts.

## Runtime data

Shared business data is serialized into the `app-data` JSON script element in the generated page. Viewer-specific navigation state remains in memory and is partially mirrored to `localStorage` so an Artifact publish reload does not reset the current view.
