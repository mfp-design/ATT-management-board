> 最新の本人対応・配置・送信設定は [カード本人への通知切替](owner-routing-review.md)、認可は [代理回答の検証記録](responders-review.md) を参照。以下は各段階の検証記録を含む。

# カード利用者による事業分類のPoC

2026-09-09。Cloudflare配置済み。分類処理は有効、実Slack投稿は無効。
独立検証の最初の本人回答までを対象とする。本実装・#10全体の完了ではない。

## 合意した対応

| カード名（確認用） | 利用者 | Slack |
| --- | --- | --- |
| 小島 | 小島さん | ryosuke.kojima（ユーザーからメンバーID確認済み） |
| 五井 | 五井さん | ゴーイ（2026-09-11 ID確認・登録済み） |
| ATT | 小林さん | Daisuke（2026-09-11 ID確認・登録済み） |
| 小林 | 小林さん | Daisuke（2026-09-11 ID確認・登録済み） |

照合キーはワークスペースIDとカードID。共通のUPSIDERユーザー名、カード名、
投稿ボットのuser IDから本人を自動推測しない。
実カードID・SlackメンバーIDは検証DBへ登録し、テストには架空値だけを使う。
未登録・無効・Slack ID未登録は `unmapped`（利用者未対応）で保持する。

## 実装

- 原文保存後に通常決済を抽出し、取引IDごとに分類対象を作る。
- 対応済みカードは同じスレッドへの本人メンションと10択を送信待ちにする。
- 表示例：「@本人 【検証】この決済の対象事業を選択してください。」
  カード名・金額・利用先・日本時間の日時を表示。
- 回答完了後は「分類済み：FP事業（回答者：小島さん）」のように、
  対応表の利用者名をplain_textで表示する。完了表示ではメンションせず、入力依頼のみメンションする。
  選択肢はFP事業、MoneRun、Agerun、自社不動産事業、日本デザイン、日本酒、トラストサロン、ビルメンテナンス、企業研修、全社共通の順（2026-09-13更新）。
- 署名をフォーム本文のまま検証。ワークスペース・独自アプリ・チャンネル・
  投稿ID・スレッド・本人ID・現在のカード対応・選択肢を照合する。
- 本人以外は403、同一回答再送は200、回答変更は409。上書きしない。
- 分類と監査とSlack更新の送信待ちをD1 batchで原子的に保存する。
- 通知内の取引内容変更は確認待ちへ。元の詳細・原文を消さない。
- Slackへの送信を先にclaimする。送信成否が不明なら `uncertain`、
  プロセス停止時は `sending` に残し、自動再投稿しない。
  更新失敗でもDBの分類結果は失わない。response_urlは使わない。
- 送信処理はHTTP応答後のwaitUntil。1回最大5件。定期実行ハンドラもあるが、
  この段階ではCronを設定しない。次のイベントでもpendingを処理できる。

## 配置前・配置手順

1. D1に保存された原文の決済リンクの `<url|label>` 表現を確認する。
   貼り付けられたJSONはリンク化で破損していたため、架空データの試験と実原文の試験を混同しない。
2. Slackの小島さんのプロフィール → その他 → メンバーIDをコピーで、
   `U...` のIDを確認する（DMの `D...` は使わない）。
3. 既存DBの原文表はそのまま、`classification.sql` をConsoleで実行する。
4. `poc_card_owners` に確認済みのカードIDとメンバーIDを登録する。
   未作成のSlack IDはNULL。名前だけの自動登録はしない。
5. `node tools/upsider-poc/build-worker.mjs /private/tmp/att-upsider-worker.mjs` を実行。
   `node --check /private/tmp/att-upsider-worker.mjs` とテストを通してから生成物を配置する。
6. 以下のText変数を登録。最初は送信無効のまま配置する。

| Key | Value |
| --- | --- |
| SLACK_APP_ID | A0C03AL8CLR |
| POC_CLASSIFICATION_ENABLED | true |
| POC_CURRENCY | JPY |
| POC_TIMEZONE | Asia/Tokyo |
| POC_SLACK_SEND_ENABLED | false |

7. Deploymentsで最新設定版を100%配信。新着イベントで分類対象・unmapped・reviewを確認。
8. ATT UPSIDER PoC → Interactivity & Shortcuts → On。
   Request URLを `https://att-upsider-poc.tiny-smoke-00b7.workers.dev/slack/interactions` に設定して保存。
   EventsのURLは `/slack/events` のまま。Socket ModeはOff。
9. 小島さんの検証スレッドへのメンション投稿をユーザーが承認した後に限り、
   `POC_SLACK_SEND_ENABLED=true` の版を配信する。
   この開発ターンでは投稿の承認を得た扱いにせず、実投稿はしていない。
10. 本人回答、第三者拒否、回答再送、分類済み表示を実Slackで確認する。

## 検証と運用上の制約

`node --test tools/upsider-poc/*.test.mjs`：48件成功。
分類系はNode組込みSQLiteで実SQLを実行し、監査失敗時のロールバックを確認。
ネットワークはスタブ。Workers上の3秒以内応答・CPU時間・Slack画面の動作は未検証。

```sql
SELECT state, COUNT(*) FROM poc_classifications GROUP BY state;
SELECT kind, state, COUNT(*) FROM poc_slack_outbox GROUP BY kind, state;
SELECT reason, COUNT(*) FROM poc_parse_reviews GROUP BY reason;
```

`sending` / `uncertain` を無条件にpendingへ戻さない。Slackスレッドで投稿の有無を確認してから修復する。
本人対応が後から追加されても既存unmappedを勝手に再送しない。再対応・送信は別の運用手順が必要。
過去原文の再解析、未対応者の総務通知、翌日1回リマインダー、代理分類、理由付き修正、
締め制御、1時間照合、失敗・取消・返金・編集・削除通知は今回の範囲外で未実装。
これらを終える前に本番経費として稼働させない。

参考：[Slackインタラクション](https://docs.slack.dev/interactivity/handling-user-interaction/)、
[選択メニュー](https://docs.slack.dev/reference/block-kit/block-elements/select-menu-element/)。

## 対応表登録の実施状況

2026-09-09、Slackの元通知とD1保存原文を照合して4枚のカードIDを確認。
検証D1の `poc_card_owners` を作成し、4枚を登録した。小島さんのみSlack ID設定済み、
五井さんと小林さんの3枚はNULL。SELECTで4件の登録結果を確認した。
既存原文は保持。分類用の残り4テーブルも作成済み。
D1原文で決済リンクの `<url|label>` を確認できた。実通知には3桁区切り金額があるため、
桁区切りの厳密検証を追加し、配置用単一ファイルも再生成した。

## Cloudflare配置の実施結果

2026-09-09、コード版 `3ad9d171`、続いて上記5変数を含む版 `ee79b68c` を配信。
Deploymentsで `ee79b68c` の100%配信を確認。従来の原文受信版 `678a5df6` を復旧先として記録する。
Workers Freeを継続し、Cronは未設定。`POC_SLACK_SEND_ENABLED=false` を設定画面でも確認。
エディタでTextDecoderの型診断を修正し、診断0件・ローカル48テスト成功を確認した。
公開URLのGETは200、`/slack/interactions` への署名なしPOSTは401。
D1確認時点で原文5件、カード対応4件、分類・確認待ち・監査・送信待ちは各0件。
過去イベントは再処理していない。次の新着通知で分類保存を確認する必要がある。
配置時点ではSlack Interactivity設定・実投稿・本人回答の実地検証は未完了。

## 初回検証投稿

2026-09-10、ユーザーがInteractivity設定の完了を申告し、小島さんへの検証投稿1件を明示承認。
Wranglerの再認証後、配信版を変更せず一時リモート実行環境で送信した。
送信クエリは承認済み取引ID・kind=prompt・pendingの1件に限定。
既存の暗号化済みBot Tokenを継承し、秘密値は取得・表示していない。
D1でprompt_tsの保存とoutboxのsentを確認。一時実行環境は停止済み。
配信版の自動送信設定はfalseのまま。本人による事業選択とDB保存は次の検証。
回答後のSlack表示更新も自動送信停止の対象となるため、DB確認後に別途手動実行する。

2026-09-10、本人の選択後にD1のstate=classified、business_id=fp、
classified_byが登録済みの小島さんのIDと一致することを確認。
同じ回答者・事業・時刻の監査記録も1件確認した。
承認済み取引のkind=updateだけを一時リモート環境で実行し、
Slack API成功とoutboxのupdate=sentを確認。投稿を「分類済み：FP事業」に更新した。
一時環境は停止。配信版の自動送信はfalseを継続。
通常通知→本人への依頼→本人回答→分類・監査保存→表示更新の1件の実地検証が成功。
第三者の回答拒否・回答再送などの実Slack検証は引き続き未完了。

2026-09-10、回答完了表示の回答者メンションを廃止することを合意。
ローカル実装を通常の氏名表示に変更。Cloudflare配信版と既存投稿への反映は未実施。

## 2026-09-10 回答者の矛盾に関する訂正

「本人回答まで検証成功」とした上記の結論は撤回する。
ユーザーから、回答はinfoアカウントで行ったとの申告があった。
通知受信・分類保存・表示更新は確認済みだが、回答したアカウントの実証はできていない。
詳細は [回答者調査](actor-investigation.md)。旧来の本人限定仕様を変更することと、
今回の挙動の原因究明を分ける。新方針は本人へメンションし、他の利用者も回答可能とする。
回答者は依頼先から転記せず、実操作のアカウントとして記録・表示する。
代理回答の許可範囲と実装はまだ確定・配置していない。

事業選択の9項目への変更はローカル実装済み。Cloudflare配信版・既存Slack投稿への反映は未実施。

## 登録確認・修正機能の追加

事業9択・回答者の通常文字表示・登録確認・回答修正ボタンを検証Workerへ反映した。
最新の配信版、追加テーブル、69件の試験結果と制約は [修正機能の検証記録](corrections-review.md) を参照。
既存投稿1件のボタン反映は確認済み。実Slackでの修正操作は未検証。
