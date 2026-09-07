# Cloudflare中心の低コスト構成を採用する

> 状態: 採用
> 置換対象: ADR 0002

利用者は経営者3名、システム担当2名、総務担当2〜3名から始まり、年間増加も顧客約300件、案件約50件と小規模である。VercelとSupabaseの有料構成はこの規模に対して月額が大きいため、ReactとTypeScriptの画面、サーバー処理、データ保存、ログイン入口、バックアップをCloudflare Workers、D1、Access、R2へまとめる。

本番の基本料金はWorkers Paidの月5ドルとし、初期の月額予算は1,000円以内とする。D1の保存容量が7GBへ近づくか、同時書き込みによる待ち時間が発生した場合は、SupabaseまたはNeonへの移行を判断する。

UPSIDERの経費連携では、UPSIDER公式Slackアプリの決済通知をSlack Events APIで受信する。受信処理はCloudflare Workersで動かし、新たな常時稼働サーバーは追加しない。
