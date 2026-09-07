# Next.jsとSupabaseによる低コストなサーバーレス構成を採用する

> 状態: ADR 0005により置換

当初はNext.jsとTypeScriptをVercelで稼働させ、SupabaseのPostgreSQL・認証・バックアップを利用する案を採用した。その後、Vercelの商用利用条件と月額費用を確認し、月額運用費をさらに抑えるため、ADR 0005のCloudflare構成へ変更した。
