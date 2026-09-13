> 最新の配置・送信設定は [カード本人への通知切替](owner-routing-review.md) を参照。集約設定は削除済みで、本人への分類依頼と回答後の表示更新を有効化した。通常通知の形式は [通知の実証記録](notification-review.md)、9月11日再通知の未確認事項は [再通知テスト](reminder-review.md) を参照。

# UPSIDER受信PoC：URL確認と原文保管の基礎

2026-09-09 / #9・#10。受信・原文保存はCloudflareで実通知5件の保存を確認済み。
分類・登録確認・回答修正はCloudflare配置済み。2026-09-11、本人対応4枚を登録済みとし、一般のSlack送信を有効化した。未送信9件を本人宛てに送信済み。1件限定の再通知テストとそのCronは無効化した。初期の経緯は [分類検証手順](classification-review.md)。

## 現在の対象

2026-09-13：経費の事業選択に「日本デザイン」を追加。「自社不動産事業 → 日本デザイン → 日本酒」の順で、初回登録・回答修正の両方に適用した。配信版は `7b1ac341-af33-483e-bf87-f3f6f248df68`。投稿済みの未回答4件も `chat.update` で更新し、全件のAPI応答で10項目の順序を確認済み。新規投稿と回答データの変更は行っていない。ローカル114ケース成功。

- Worker: att-upsider-poc（Workers Free）
- URL: https://att-upsider-poc.tiny-smoke-00b7.workers.dev/
- D1: att-upsider-poc-db、バインディング: DB
- Slack: T0BV7K8H95K / C0BVAA7G1DK、独自アプリ: ATT UPSIDER PoC
- 署名用Secret: SLACK_SIGNING_SECRET、投稿用Secret: SLACK_BOT_TOKEN
- Text: SLACK_TEAM_ID / SLACK_CHANNEL_ID

## 配置する手順

1. CloudflareのD1で **att-upsider-poc-db** を開き、Consoleで `schema.sql` の全文を実行する。
2. `SELECT name FROM sqlite_master WHERE type='table' AND name='poc_events';` で表名を確認する。
3. 現在のソースは複数モジュール。`node tools/upsider-poc/build-worker.mjs /private/tmp/att-upsider-worker.mjs` で単一ファイル化する。Workers & Pages → **att-upsider-poc** → Edit codeへ生成ファイルを配置する。`worker.mjs` 単体は貼り付けない。現在の配信版を控えてからDeployする。
4. Workerの公開ルートに `ATT UPSIDER PoC receiver` が表示されることを確認する。
5. Slackアプリ管理で **ATT UPSIDER PoC** → Event Subscriptions → Enable EventsをOn。
6. Request URLに `https://att-upsider-poc.tiny-smoke-00b7.workers.dev/slack/events` を入力する。
7. **Verified**を確認し、Save Changesがあれば保存する。URL確認では署名の検証とD1へのSELECTを行う。VerifiedはD1テーブルへの実イベント保存やCPU予算の検証完了を意味しない。
   Socket ModeはOff。Cloudflare変数を保存した後は、DeploymentsのActive deploymentにその版が100%で反映されていることを確認する。保存だけでは古い版が配信され続ける場合がある。
8. 原文受信だけを準備する段階では購読・Interactivityを無効にしておく。現在の検証環境では `message.groups` と Interactivity を有効化済み。分類には `classification.sql`、修正・操作記録には `corrections.sql`、代理回答権限には `responders.sql`、今回の再通知テストには `reminder-test.sql` も適用する。詳細は上記の検証記録を参照。

## 実通知の受信を有効にする前の残作業

- 役員のUPSIDER接続設定が完了し、通常決済と分離した検証カードの通知経路を確認する。
- 実際のUPSIDER公式アプリの送信元App IDとBot IDを管理画面／正式なAPI応答から検証し、Textの `UPSIDER_APP_ID` と `UPSIDER_BOT_ID` に登録する。表示名やMarketplace URLだけから推測しない。どちらかが未設定ならイベントは503、本文は保存しない。
- 実通知の構造を確認する。現実装が保管するのは外側のmessageにapp_id・bot_id・tsがある通知のみ。編集・削除・返金等の形式は未検証、取得済みとしない。
- 送信元設定後にmessage.groupsを購読し、実通知で受信遅延とWorkers FreeのCPU上限、重複・障害を検証する。D1失敗時は503としてSlackに再送を委ね、無限再試行を実装しない。
- 原文保管に加え、メンション・本人確認付き分類操作のPoCを実装済み。実Slack投稿は確認済み。過去の回答者については調査未解決で、本人回答の実証は未完了。1時間照合は未実装。#10を完了扱いにしない。
- 生データはこの検証D1に限定。公開APIで読み出さず、Cloudflareの認証されたConsoleで確認する。ログへ本文・秘密を出さない。検証終了後の保管期限と削除を決める。
- 本番DB・トークンとの共用、本番データの複製は禁止。R2は有効化していない。

## ローカル検証

`node --test tools/upsider-poc/*.test.mjs`

全114ケースのうち、受信部分は15ケース：正規署名、D1疎通を伴うchallenge応答、偽署名、過去／未来要求、workspace/channelの不一致、未確認送信元、別app/bot、人の投稿、原文保管と再送キー、DB障害、不正JSON、サイズ上限、非公開データの読出し経路なし。D1はスタブで、SQLiteのテーブル作成・一意制約は別途インメモリSQLiteで検証。Workersの実CPU・実Slack配信の試験ではない。

根拠：[Slack署名検証](https://docs.slack.dev/authentication/verifying-requests-from-slack/)、[URL確認](https://docs.slack.dev/reference/events/url_verification/)。
