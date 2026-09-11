# Prototype Instructions

## ATT-specific scope

- Issue #13のローカル画面案。現在の要件は `../requirements/management-board-rebuild.md`、見た目の基準は `../visual-reference/README.md` と保存画像を参照する。
- 既存の紺色・書体を継承し、コードと情報構造は現在の要件から組み直す。架空データを使用し、実システム・UPSIDER PoCには接続しない。
- 2026年9月11日に一次レビュー用の画面案を整備。継続時は `README.md`、`review-guide.md`、`screen-inventory.md`、`design-qa.md` を先に読む。CSV内容・コピーと印刷プレビューは確認済みだが、ファイル保存・OS印刷は未確認。
- 要件責任者・役員の二段階確認は未実施。全画面・状態の完成やIssue #13の完了を主張しない。

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
