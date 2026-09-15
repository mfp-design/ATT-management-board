# ATT 経営管理ボード — 新アプリ基盤

対象：[Issue #14](https://github.com/mfp-design/ATT-management-board/issues/14)。React・TypeScript strict・Cloudflare Workers・ローカルD1を一緒に動かす基盤。画面/APIの境界、共通エラー、入力検証、環境検査を実装した。業務スキーマと永続保存は #15以降、認証・認可は #17・#18、目標や売上等の業務入力は各機能Issueで実装する。

## 起動

Nodeの検証版は `.node-version` の26.7.0、npmは11.19.0。Node 24または26を対象とする。依存の直接バージョンと推移依存を `package.json` / `package-lock.json` で固定している。

```sh
cd apps/management-board
npm ci
npm run check
npm run dev
```

開発画面：[http://127.0.0.1:4177/](http://127.0.0.1:4177/)。APIも同じURL。SlackやGoogleの登録、APIキーは不要。`.dev.vars` の作成も不要。

ビルドされたWorkers環境を確かめる場合：

```sh
npm run build
npm run preview
```

[http://127.0.0.1:4178/](http://127.0.0.1:4178/)で確認する。別のターミナルから `npm run test:smoke` を実行すると、画面/API/ローカルD1/入力検証/未設定機能/セキュリティヘッダーを確認できる。開発サーバーのReact HMRはインラインスクリプト等を必要とするため、CSPの厳格な確認はビルド済みプレビューで行う。

ポートを使用中の場合は別のサービスを停止せず、そのサーバーを確認する。このアプリの起動はstrictPortで失敗させる。

## ディレクトリの境界

| 場所 | 役割 |
| --- | --- |
| `src/` | 新しいReact画面、ルーティング、APIクライアント。ユーザー本文はReactの文字列として描画 |
| `worker/` | HTTP/API、環境検証、ローカルD1接続、架空データ。ブラウザから直接インポートしない |
| `shared/` | DTO、共通フォーム入力検証。秘密情報・DBアクセスを置かない |
| `config/*.json.example` | 検証／本番の別環境用雛形。実リソースではなく未登録のプレースホルダー |
| `tests/` | 環境境界、入力・エラー、未設定時停止、ヘッダーの試験 |
| `scripts/` | 設定検査、ローカル起動、ビルド済みAPIの確認 |

リポジトリ直下の `src/`・`public/`・`tests/` は旧Artifactの参考資料。`docs/ui-prototype/` は #13の画面案、`tools/upsider-poc/` は既存Slack検証。このアプリはどちらの埋め込みデータ・保存処理・実データも参照しない。既存ファイルやPoCのWorker・DB設定は変更しない。

## この段階の画面とAPI

ホーム、入力確認、接続状況、404画面があり、URL直アクセスとブラウザの戻る操作に対応する。見た目は既存の紺色とNoto Sans JP／Zen Kaku Gothic Newを継承し、書体はローカル配信する。

| メソッド・パス | 動作 |
| --- | --- |
| `GET /api/health` | Worker稼働状況。DBや外部連携の成功を意味しない |
| `GET /api/status` | ローカルD1に `SELECT 1`。失敗・未設定時は503。Slack・メール・認証・月次締めは利用不可と返す |
| `GET /api/sample/expenses` | 架空の経費3件。`synthetic: true` |
| `POST /api/sample/validate` | 内容の必須／120文字・JSON最大4KB・同一Originを確認。確認のみで保存せず `persisted: false` |
| `/api/monthly-close`、`/api/integrations/*`、Slack受信口 | 未実装／未設定を示す503。成功したように見せない |
| 未知の `/api/*` | JSONの404。ブラウザ直アクセスでもSPAのHTMLへ置き換えない |

成功は `{ok:true,data,requestId}`、失敗は `{ok:false,error:{code,message,fields?},requestId}`。予期しないエラーの本文・スタックを返さず、ユーザーの本文・金額・認証情報をアプリケーションログへ出さない。入力確認の本文は保存も通知もしない。

## 環境と秘密情報

- ローカルWorker名：`att-management-board-local`。D1名：`att-management-board-local-db`。UUIDはローカル用の固定ダミーで、実Cloudflareアカウントに接続しない。
- Cloudflare Vite pluginのremote bindingsを無効化し、DBも `remote:false`。起動時・ビルド時の設定検査で外部DB・PoC名・環境変数の混入を拒否する。
- ローカルD1の状態はこのディレクトリの `.wrangler/state/` にだけ保存する。業務テーブル・マイグレーション・データ投入はまだない。
- `APP_ENV` と `APP_INSTANCE` がこのローカル環境に一致し、URLがloopbackである場合だけ応答する。検証／本番値・外部URLでは画面もAPIも503。これは開発用の制限であり、認証実装ではない。
- 全パスでWorkerを先に通し、CSP・フレーム埋め込み禁止・nosniff・no-store等を付ける。ビルド版CSPは `unsafe-inline` / `unsafe-eval` を許可しない。
- 起動コマンドは環境選択の外部上書きを外し、明示したローカル設定を使う。`workers_dev` / preview URLは無効。`npm run deploy` は認証未実装のため停止する。
- 検証・本番のDB識別子、秘密情報、Access設定は #9・#16・#17で別々に用意する。雛形のIDはまだ置き換えない。無料枠から始める合意を維持し、今回はリモートリソース／契約を作らない。
- 将来必要になるローカルの秘密情報は、このアプリの `.dev.vars` にだけ設定する。雛形は `.dev.vars.example`。ルート `.env` の復旧コードやPoCトークンをコピーしない。ブラウザへ埋め込まれる `VITE_*` には秘密を入れない。
- `.env*`・`.dev.vars*`・ローカル設定・生成物はGitから除外する。実環境への秘密設定は対象環境を確定した後に別途行う。

## 公式資料・依存確認

2026-09-15に公式資料とnpmレジストリの対応範囲を確認した。

- [CloudflareのReact SPA＋API](https://developers.cloudflare.com/workers/vite-plugin/tutorial/)と[plugin設定](https://developers.cloudflare.com/workers/vite-plugin/reference/api/)を使用。開発・ビルド・プレビューでWorkers実行環境を使う。
- [ViteのNode要件](https://vite.dev/guide/)を満たすNodeで検証。Vite 8.3.0、Cloudflare plugin 1.54.9、Wrangler 4.131.2、React 19.3.0、TypeScript 7.0.2を固定した。
- Nodeネイティブのテストランナーを使用。esbuildとworkerdのインストールスクリプトは、導入した版だけ `allowScripts` で許可する。

確認結果は [verification.md](verification.md) に記録する。#13の画面レビューや本番業務の受入とは別の確認である。
