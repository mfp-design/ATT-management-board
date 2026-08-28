# ATT 経営管理 (ATT Management Board)

A single-page sales-force-automation (SFA) tool for managing accounts (取引先), individual customers (顧客), partners (パートナー), deals/pipeline (案件・商談), and business-scoped tasks (事業とタスク) — published and shared as a [Claude Artifact](https://claude.ai) using the `artifact` runtime capability for team-shared, persisted data.

## How it's built

This is intentionally a **single self-contained HTML file** with no bundler, framework, or build tooling beyond a tiny Node script. The whole client-side app — markup, CSS, and JS — lives in one place so it can be embedded verbatim into a published Artifact page.

- **`app-runtime.js`** — the single source of truth. This is the *only* file you hand-edit. It contains:
  - the page's CSS (`CSS_TEXT()`), document shell (`buildDocument()`), and default/migration data shape (`defaultState()`, `migrateState()`)
  - all render functions, CRUD logic, and event handling for the browser app
  - it doubles as a Node module (guarded by `typeof window === 'undefined'`) so the same source that runs in the browser also generates the initial HTML — no separate template to keep in sync, and no live-DOM serialization when the page republishes itself.
- **`build.js`** — a short Node script that calls `buildDocument(defaultState(), <app-runtime.js source>)` and writes the result to `index.html`.
- **`index.html`** — generated output (`node build.js`). This is what actually gets published as the Artifact. It's committed here so the repo always reflects what's live, but never hand-edit it — edit `app-runtime.js` and rebuild.

## Data model

State is embedded in the published page as JSON (`<script id="app-data" type="application/json">`) and split from `state` (shared, persisted, team-wide) is `ui` (per-viewer, in-memory only — current tab, filters, etc.). Because the `artifact` capability's `publish()` reloads *every* open view (including the one that just saved), a small slice of `ui` (current tab, selected business, task view mode) is mirrored into `localStorage` so a viewer's own save doesn't visually bounce them back to the dashboard.

## Developing

```bash
node -c app-runtime.js   # syntax check
node build.js            # regenerate index.html from app-runtime.js
```

Then run the Playwright regression tests (Chromium, loading `index.html` via `file://`):

```bash
node test3.js                    # dashboard/revenue-trend + animal-fortune smoke test
node test4-fortune.js            # animal-fortune (動物占い) calculation, verified against known table values
node test5-verify.js             # account/customer form fields, accountId-preservation regression
node test7-partners.js           # partners (パートナー) tab CRUD
node test8-business-reorder.js   # free-text business add
node test9-ui-state-persist.js   # tab/selection survives the post-publish reload
node test10-business-dragdrop.js # drag-and-drop business reordering
```

(A `console: Failed to load resource: net::ERR_TUNNEL_CONNECTION_FAILED` line in test output is expected — it's the sandboxed test browser being unable to reach Google Fonts over `file://`, not an app bug.)

## Publishing

The built `index.html` is published via the Artifact tool to the team's shared URL. Every change should be built and tested locally first, then republished to the *same* artifact URL so the shared team link never changes.
