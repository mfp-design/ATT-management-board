# UPSIDER受信PoC：URL確認と原文保管の基礎

2026-09-07 / #9・#10。ローカル検証済み、Cloudflareへは未配置。

## 現在の対象

- Worker: att-upsider-poc（Workers Free）
- URL: https://att-upsider-poc.tiny-smoke-00b7.workers.dev/
- D1: att-upsider-poc-db、バインディング: DB
- Slack: T0BV7K8H95K / C0BVAA7G1DK、独自アプリ: ATT UPSIDER PoC
- 署名用Secret: SLACK_SIGNING_SECRET、投稿用Secret: SLACK_BOT_TOKEN（この受信基礎ではまだ使用しない）
- Text: SLACK_TEAM_ID / SLACK_CHANNEL_ID

## 配置する手順

1. CloudflareのD1で **att-upsider-poc-db** を開き、Consoleで `schema.sql` の全文を実行する。
2. `SELECT name FROM sqlite_master WHERE type='table' AND name='poc_events';` で表名を確認する。
3. Workers & Pages → **att-upsider-poc** → Edit code。Hello Worldのコード全体を `worker.mjs` の全文に置換しDeployする。ファイル名はエディターの既存名のままでよい。既にHello World以外のコードがある場合は先に確認する。
4. Workerの公開ルートに `ATT UPSIDER PoC receiver` が表示されることを確認する。
5. Slackアプリ管理で **ATT UPSIDER PoC** → Event Subscriptions → Enable EventsをOn。
6. Request URLに `https://att-upsider-poc.tiny-smoke-00b7.workers.dev/slack/events` を入力する。
7. **Verified**を確認し、Save Changesがあれば保存する。URL確認では署名の検証とD1へのSELECTを行う。VerifiedはD1テーブルへの実イベント保存やCPU予算の検証完了を意味しない。
8. この段階では **Subscribe to bot eventsは追加せず、InteractivityもOff**のままにする。

## 実通知の受信を有効にする前の残作業

- 役員のUPSIDER接続設定が完了し、通常決済と分離した検証カードの通知経路を確認する。
- 実際のUPSIDER公式アプリの送信元App IDとBot IDを管理画面／正式なAPI応答から検証し、Textの `UPSIDER_APP_ID` と `UPSIDER_BOT_ID` に登録する。表示名やMarketplace URLだけから推測しない。どちらかが未設定ならイベントは503、本文は保存しない。
- 実通知の構造を確認する。現実装が保管するのは外側のmessageにapp_id・bot_id・tsがある通知のみ。編集・削除・返金等の形式は未検証、取得済みとしない。
- 送信元設定後にmessage.groupsを購読し、実通知で受信遅延とWorkers FreeのCPU上限、重複・障害を検証する。D1失敗時は503としてSlackに再送を委ね、無限再試行を実装しない。
- このコードは原文保管の基礎のみ。メンション・本人確認付き分類操作・1時間照合はまだ実装していない。#10を完了扱いにしない。
- 生データはこの検証D1に限定。公開APIで読み出さず、Cloudflareの認証されたConsoleで確認する。ログへ本文・秘密を出さない。検証終了後の保管期限と削除を決める。
- 本番DB・トークンとの共用、本番データの複製は禁止。R2は有効化していない。

## ローカル検証

`node --test tools/upsider-poc/worker.test.mjs`

15ケース：正規署名、D1疎通を伴うchallenge応答、偽署名、過去／未来要求、workspace/channelの不一致、未確認送信元、別app/bot、人の投稿、原文保管と再送キー、DB障害、不正JSON、サイズ上限、非公開データの読出し経路なし。D1はスタブで、SQLiteのテーブル作成・一意制約は別途インメモリSQLiteで検証。Workersの実CPU・実Slack配信の試験ではない。

根拠：[Slack署名検証](https://docs.slack.dev/authentication/verifying-requests-from-slack/)、[URL確認](https://docs.slack.dev/reference/events/url_verification/)。
