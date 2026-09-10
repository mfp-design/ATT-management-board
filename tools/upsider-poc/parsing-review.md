> 最新の実通知照合とメモボタンなし形式への対応は [通知の実証記録](notification-review.md) を参照。以下は初回観測時の記録。

# 通常決済通知の抽出検証

2026-09-09 / #10の部分検証。実通知の貼り付けから構造を確認した。
生の通知・利用先・利用者・カード名・取引IDはリポジトリに保存しない。

## 確認できた構造

- `event.text` は空。本文は `attachments[0].blocks` の `fields` と `elements` にある。
- 「ご利用先」「ご利用金額」、ステータス・日時、ユーザー名・カード名・決済IDを読み取れる。
- ボタンの `value` と `action_id` にも決済IDがある。リンクの決済IDとの一致を検証する。
- `event.user` はボットの投稿者ID。カード利用者のSlack IDとして使用しない。
- `block_id` のランダム値・ブロック順序に依存しない。
- 保存済みイベントの `app_id` / `bot_id` は、設定した公式アプリの識別子と一致していた。

## ローカル実装の範囲

`parse-notification.mjs` は署名・送信元を検証したイベント向けの純粋な抽出関数。
今回観測した通常決済・OK・正整数金額だけを候補にする。
日付の実在性、必須項目の欠落・重複、決済IDの不一致を検査し、
未対応形式は理由付き `review_required` とする。
元データは呼び出し側が既存D1の原文を保持する。抽出関数自体は原文を変更・保存しない。

金額に通貨、日時にタイムゾーンが明示されていないため、どちらもnullのまま。
この段階では確定経費ではなく `parsed_candidate` とする。事業の自動分類もしない。
受信Workerへの組み込みは `POC_CLASSIFICATION_ENABLED=true` の明示設定で有効になる。
2026-09-09時点で分類機能はローカルのみ。Cloudflareへの追加デプロイ・データ移行は未実施。

## 未確認事項・次の確認

1. 貼り付けたJSONにはMarkdownのリンク化による破損がある。
   テストは観測した構造を架空値で再構成したもの。原文そのものの解析成功ではない。
   決済リンクの `<url|label>` 表現はD1の原文で確認済み。
2. 今回の通常決済について、ユーザーが日本円・日本時間・利用先の一致を確認済み。
   分類層ではJPY・Asia/Tokyoの明示設定を要求する。外貨通知への一般化はしない。
3. 別の通常決済通知でも解析する。実通知のカンマ付き金額を確認し、正しい3桁区切りを受け付けるテストを追加済み。
4. ユーザー名は4枚で共通のため本人識別に使えない。カードIDからSlackメンバーIDへ対応づける。
5. 失敗・取消・返金・金額変更・編集・削除の実通知は未検証。
   今回のOK通知だけで会計上の確定や将来の変更がないことを判定しない。

## 検証方法

`node --test tools/upsider-poc/*.test.mjs`

原文リンクだけを確認する読取専用SQL（1件の値のみ。event_idは対象を指定）：

```sql
SELECT json_extract(element.value, '$.text') AS transaction_reference
FROM poc_events AS p,
     json_each(p.raw_body, '$.event.attachments') AS attachment,
     json_each(attachment.value, '$.blocks') AS block,
     json_each(block.value, '$.elements') AS element
WHERE p.event_id = :event_id
  AND json_extract(element.value, '$.text') LIKE '決済ID:%';
```

貼り付け時はコードブロックを使い、URLが自動的にリンク化されないようにする。
