# 権限表示・スマホ・出力・管理設定の検証

実施: 2026-09-15 20:26〜20:45 JST / Codex 親担当。対象HEAD `a704317cb901c79b57ec5da0b9848c251d7af8b4`。ローカル画面案は4176番、画面ソースは9月11日版。IABの独立タブとChromeの検証タブを使用した。

画面案の操作は架空データのみ。実Slack・Cloudflareは既存ログイン状態で管理画面を読むだけとし、投稿、決済、分類、認証設定、契約、実DBの変更はしていない。認証情報・復旧コードは取得していない。

## 今回確認できたこと

| ID | 判定 | 実施内容・証跡 | 残る範囲 |
| --- | --- | --- | --- |
| P14 | PASS（表示範囲） | 総務へ切替後、ダッシュボード・メニュー・CSV・印刷プレビューに予算、利益、人件費、支援記録がない。[総務画面](root-02-office-dashboard.png)・[CSV](root-03-office-csv.png)・[印刷](root-04-office-print.png)。実保存CSVも照合した。 | 全画面の直積、実API認可・他ユーザーへのデータ配信は別試験。 |
| P15 | PASS（代表操作） | Chromeで実測390×844、320×740。ページ幅も各390/320で横はみ出しなし。メニューのShift+Tab/Tab循環、Escapeで閉じる・起点へフォーカス復帰を確認。支援コメントは空本文を拒否、本文のみでは対象選択エラー、FP事業を指定して保存。訂正は別投稿として追加され元文・投稿者・時刻が残る。[390px](root-07-mobile-dashboard.png)・[320pxの訂正結果](root-08-mobile-comments.png)。 | 実機のソフトキーボード・タッチ精度・OS差は未検証。320pxの「コメントを記録」は細かく折り返すため、文言とボタン幅の改善候補。 |
| P16 | PASS（承認・取消・期限切れ） | PCで空理由を拒否→理由付き確認・申請→役員が24時間許可→システム担当が予算を閲覧でき編集は不可→期限切れデモで限定メニューが消える。[承認](root-05-access-approved.png)・[期限切れ](root-06-access-expired.png)。390pxでも申請→承認→取消を実施し、取消後はシステム担当の予算・人件費・支援記録が消える。[スマホ承認](root-09-mobile-access.png)。 | 拒否分岐は今回未操作。実際に24時間経過させる試験・実認可は対象外。 |
| P19 | PARTIAL | 総務CSVを保存して実ファイルを開いた。UTF-8 BOMあり、13行の条件・金額が表示と一致し秘匿項目なし。印刷プレビューの読みやすさと印刷ボタンまで確認。 | OSの印刷ダイアログ・保存済みPDFは確認できなかった。経営者CSVの実保存も今回未実施。 |
| P20 | 人の判断が必要 | subagentの操作試験は完了したが、業務上の使いやすさ・経営判断への有用性について役員が承認したとは扱わない。 | 指摘修正後の判断・承認記録。 |

CSV証拠は [root-office-export.csv](root-office-export.csv)。ブラウザーがDownloadsへ生成した実ファイルをそのまま複写した。元ファイルの更新日時は2026-09-15 20:31:44 JST。売上700,000円、着地1,700,000円、確定920,000円、未確定780,000円、未請求0円、未入金420,000円、経費108,240円、見直し候補0円。SHA-256は [root-office-export.sha256](root-office-export.sha256) に保存。

IABのviewport設定は実測1280×720のままで変更が反映されなかったため、これをスマホの証拠には採用せず、Chromeで390px/320pxを実測して撮影した。両ブラウザーの一時的なviewport設定は解除済み。自分の検証用画面を再読み込みして初期状態へ戻した。

## RQA-01: 未設定月から予算画面へ移動すると画面全体が消える

優先度 P1。財務担当がソースから見つけた候補を親担当が実操作で再現した、新規不具合。

1. 経営者・通常のダッシュボードで対象月を2025年9月へ変更する。入力欄だけでなく、集計期間が2025/09/01〜30になったことを確認する。
2. 左メニューの「月次予算」を押す。
3. 画面の全要素が消え、濃紺の背景だけになる。画面内に戻る操作・未設定の説明はない。再読み込みで初期9月へ戻せる。

期待: 未設定を表示して登録へ進めるか、対応月を明示して範囲外選択を制限し、画面全体を停止させない。

原因: `docs/ui-prototype/src/finance-panel.jsx:9` で対象月の `item` が未定義となり、月次予算表示の `item.sales` を参照する。コンソールは `TypeError: Cannot read properties of undefined (reading 'sales')`。ソースの16行に対応するVite変換後48行で発生した。[画像](root-10-missing-month-crash.png)・[今回のエラーログ](root-missing-month-errors.json)。人件費側の同様の参照はソースで確認したが、今回実操作は月次予算だけ。

この最終境界試験以前の親担当の通常操作ではerror/warnなし。全試験を「エラーなし」とは報告しない。

## 管理画面の読み取り結果

| ID | 現在の観測結果 | 判定・残る作業 |
| --- | --- | --- |
| A01 | ATT Slackのアカウント設定でメール `info@mfp-design.jp`、プライマリーオーナー、**2要素認証「アクティブ」**を確認。[証拠](root-a01-slack-2fa.png)。 | 個人2FA有効化のチェックは完了。新規ログイン時の追加認証と復旧経路は今回未確認。 |
| A02 | 復旧情報の保管先・アクセス者は照会していない。 | 経営者二名でのアクセス体制を未確認のまま残す。 |
| A03 | CloudflareのProfile → Access Management → Authenticationで **Two-Factor Authentication「Inactive」**。[証拠](root-a03-cloudflare-2fa-inactive.png)。 | Cloudflare自身の2FAは未設定として#8に残す。GitHub側の2FA無効や、アカウント侵害を意味しない。ログイン全経路・復旧も未確認。 |
| A04 | 対象CloudflareアカウントのSubscriptionsに **Workers Free / Active**のみ表示。支払方法は **No payment method on file**。[証拠](root-a04-workers-free.png)。 | この契約画面の確認は完了。利用量担当は既存合意どおり花沢。あらゆるサービス・将来課金の保証ではない。 |

参照した実画面: [Slack設定](https://atthetophq.slack.com/account/settings)、[Cloudflare認証](https://dash.cloudflare.com/profile/access-management/authentication)、[Cloudflare契約一覧](https://dash.cloudflare.com/07682052381018086f7899f344e998c1/billing/subscriptions)。設定ボタン・復旧コード表示・アップグレードは操作していない。
