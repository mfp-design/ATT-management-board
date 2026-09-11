> **2026-09-11 21時台の確認：定刻の再通知送信は未確認。** D1の予約は `armed`、送信日時・投稿参照は未記録。一方で対象の回答保存は12:52:29（JST）に確認できた。期限切れのテスト設定とCronは解除済みで、履歴は保持している。最新配信は [カード本人への通知切替](owner-routing-review.md) を参照。以下は予約時点の手順・記録。

# 9月11日の未回答再通知テスト

## 予約時点の状態（2026-09-10）

- 対象：[ユーザー指定の分類投稿](https://atthetophq.slack.com/archives/C0BVAA7G1DK/p1789015758205399?thread_ts=1789000138.991659&cid=C0BVAA7G1DK) の1件のみ。
- 予定：**2026-09-11 10:00（日本時間）**。テストID `reminder-2026-09-11`。
- メンション先：検証担当 `ryosuke.kojima`。実カード利用者・回答権限の対応は変更していない。
- D1は `pending`、元投稿はメンションなしの「未回答」と事業9択・登録確認へ更新済み。
- 予約は `armed`、送信時刻と再通知の投稿参照は未記録。予定時刻の実送信は未検証。
- 配信版：`5eade76f-5a0f-4348-ad6b-3785895b3876` を100%。Cloudflare APIで版・設定・Cron・プレビュー無効を確認済み。

ユーザーの依頼に基づき、この1件の現在の分類を未回答へ戻した。リセット前の分類行全体を
`before_json`、操作日時・理由を `poc_reminder_tests` に保存した。原回答の監査1件と
理由付き修正履歴1件は保持している。再回答は `poc_classification_answers` に実際の回答者・事業・日時を追加記録する。

## 実行範囲

`POC_REMINDER_TEST_ENABLED=true` と `POC_REMINDER_TEST_ID` に一致する予約1件だけを処理する。
一般の `POC_SLACK_SEND_ENABLED` は `false`。対象1件を `POC_SLACK_UPDATE_ONLY_TRANSACTION_ID` に指定し、
再回答・修正後の既存投稿の更新だけを許可している。ほかの経費の初回投稿待ち5件は送信していない。

再通知は元決済スレッドへの1投稿で、メンション、利用日・利用先・金額、元の回答欄へのリンクを表示する。
送信時に未回答・利用日が前日以前・カード有効・通知先と投稿参照が準備時どおりであることを確認する。
リンク取得後にも再確認し、回答済み・確認待ちへの変更、カード無効化・通知先変更があれば送信を止める。
送信権を1回だけ確保し、重複起動でも投稿を増やさない。成功は `sent`、対象外は `skipped`、結果不明は `uncertain`。

Cloudflare CronはUTCなので `0 1 11 9 *` を登録した。年を指定できないため、D1の実施日と
実時刻をコード側で照合し、2026年9月11日10時の定期イベントだけを対象とする。
10時前や11時以降には送信せず、翌回・翌年へ送信予約を繰り越さない。

## 予定時刻後の確認と終了

1. 元スレッドでryosuke.kojimaへの再通知が1件増えたことを確認する。
2. 検証D1のConsoleで下記SQLを実行し、`sent`・投稿参照・送信日時を確認する。
3. 再通知の「対象事業を回答する」から元の選択欄へ移り、選択・確認して回答する。
4. 分類済み表示が実際の回答者名・メンションなしで更新されることを確認する。
5. `armed` のままならCronの履歴と配信版、`skipped` なら分類状態や通知先の変化を確認する。`sending` / `uncertain` は実投稿と照合して復旧判断し、無条件に再投稿しない。
6. 終了後に配置設定の `triggers.crons=[]` と `POC_REMINDER_TEST_ENABLED=false` を反映してCronを解除する。再回答の確認後に対象1件の更新許可も解除する。履歴・検証結果は残す。

```sql
SELECT test_id, run_date, recipient_id, state, outcome, message_ts, sent_at
FROM poc_reminder_tests WHERE test_id = 'reminder-2026-09-11';
```

## 確認結果

既存86件と追加24件の計110件が成功（`node --test tools/upsider-poc/*.test.mjs`）。日時境界、
対象1件への限定、同時・重複実行、早期・期限切れの実行、回答直前の競合、通知先・カード変更、
結果不明時の保留、履歴保持、再回答後の対象投稿だけの更新を確認した。単一ファイル結合・構文検査も成功。

実Slackで未回答表示と選択欄への更新を確認済み。回答リンク取得はJSON POSTで `invalid_arguments` となったため、
GETとクエリ引数へ修正し、実APIで正しいリンクの取得を確認した。再通知メンションは前倒し送信していない。
リセット用の管理処理は公開受信ルートに追加せず、一時Workerを使用して実行後に停止した。

複数経費・継続再通知・復旧を含む本体の実装は [#43](https://github.com/mfp-design/ATT-management-board/issues/43) で行う。
今回の1件テストをもって #43 全体の完了とは扱わない。

参照：[Cloudflare Cron](https://developers.cloudflare.com/workers/configuration/cron-triggers/)、
[Slack投稿](https://docs.slack.dev/reference/methods/chat.postMessage/)、
[Slack投稿更新](https://docs.slack.dev/reference/methods/chat.update/)、
[回答リンク取得](https://docs.slack.dev/reference/methods/chat.getPermalink/)。
