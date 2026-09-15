# ATT 経営管理 (ATT Management Board)

ATTの経営者が会社全体の実績・見込み・活動状況を把握し、意思決定するための経営管理ボード。

## 最新の要件

[全面再構築 要件定義書](docs/requirements/management-board-rebuild.md)を参照してください。役員承認済みで、GitHub Issueに沿ってPhase 1を実装中です。要件書冒頭の承認待ち表記は承認前の記載であり、再度の承認待ちを意味しません。

Phase 1では経営・売上管理を本稼働させ、Phase 2でFP顧客管理を統合します。現行の見た目を継承し、React・TypeScriptとCloudflare Workers／D1／Access／R2を使ってコードとデータ構造を再構築する方針です。UPSIDER連携は実際のSlack通知による技術検証を本実装前に行います。

## 再構築の開発先

- [新アプリ基盤](apps/management-board/README.md)：React・TypeScript・WorkersとローカルD1。#14の起動・ビルド・検証手順。
- [画面案](docs/ui-prototype/README.md)：#13の主要画面。要件責任者・役員の二段階確認は未実施。
- [UPSIDER PoC](tools/upsider-poc/README.md)：実Slack通知の受信と経費分類の検証。新アプリとは分離している。

以下は、視覚参考として保持している再構築前のClaude Artifact版の構成・開発手順です。

## Repository layout

This is intentionally a **single self-contained HTML file** with no bundler, framework, or build tooling beyond a tiny Node script. The whole client-side app — markup, CSS, and JS — lives in one place so it can be embedded verbatim into a published Artifact page.

- **`src/app-runtime.js`** — the single source of truth. This is the *only* application file you hand-edit. It contains:
  - the page's CSS (`CSS_TEXT()`), document shell (`buildDocument()`), and default/migration data shape (`defaultState()`, `migrateState()`)
  - all render functions, CRUD logic, and event handling for the browser app
  - it doubles as a Node module (guarded by `typeof window === 'undefined'`) so the same source that runs in the browser also generates the initial HTML — no separate template to keep in sync, and no live-DOM serialization when the page republishes itself.
- **`scripts/build.js`** — generates the publishable HTML from the source.
- **`public/index.html`** — generated output and the file published as the Artifact. Do not hand-edit it.
- **`tests/`** — maintained Playwright regression tests.
- **`docs/`** — architecture and maintenance notes.

See [`docs/architecture.md`](docs/architecture.md) for the dependency flow and editing rules.

## Data model

State is embedded in the published page as JSON (`<script id="app-data" type="application/json">`) and split from `state` (shared, persisted, team-wide) is `ui` (per-viewer, in-memory only — current tab, filters, etc.). Because the `artifact` capability's `publish()` reloads *every* open view (including the one that just saved), a small slice of `ui` (current tab, selected business, task view mode) is mirrored into `localStorage` so a viewer's own save doesn't visually bounce them back to the dashboard.

## Developing

```bash
node -c src/app-runtime.js  # syntax check
node scripts/build.js       # regenerate public/index.html
```

Then run the Playwright regression tests (Chromium, loading `public/index.html` via `file://`):

```bash
for test_file in tests/*.test.js; do node "$test_file" || exit 1; done
```

(A `console: Failed to load resource: net::ERR_TUNNEL_CONNECTION_FAILED` line in test output is expected — it's the sandboxed test browser being unable to reach Google Fonts over `file://`, not an app bug.)

## Publishing

The built `public/index.html` is published via the Artifact tool to the team's shared URL. Every change should be built and tested locally first, then republished to the *same* artifact URL so the shared team link never changes.
