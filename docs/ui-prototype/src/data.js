export const businesses = ['FP事業','MoneRun','Agerun','自社不動産事業','日本酒','トラストサロン','ビルメンテナンス','企業研修'];
export const members = ['担当A','担当B','担当C'];
export const stages = ['見込み','アプローチ','提案','商談中','成約','失注'];
export const seedDeals = [
 {id:'D-001',name:'ライフプラン継続支援',account:'サンプル商事',business:'FP事業',member:'担当A',stage:'商談中',amount:360000,due:'2026-09-25',revenueDate:'2026-09-30'},
 {id:'D-002',name:'ランニング講座 第2期',account:'サンプル企画',business:'MoneRun',member:'担当B',stage:'提案',amount:180000,due:'2026-09-18',revenueDate:'2026-09-28'},
 {id:'D-003',name:'管理職研修 秋季プログラム',account:'サンプル工業',business:'企業研修',member:'担当C',stage:'成約',amount:420000,due:'2026-09-05',revenueDate:'2026-09-10'},
 {id:'D-004',name:'物件活用コンサルティング',account:'サンプル不動産',business:'自社不動産事業',member:'担当A',stage:'アプローチ',amount:240000,due:'2026-09-27',revenueDate:'2026-09-30'}
];
seedDeals.push(
 {id:'D-005',name:'保険相談 継続サポート',account:'サンプル商事',business:'FP事業',member:'担当A',stage:'成約',amount:280000,due:'2026-09-02',revenueDate:'2026-09-04'},
 {id:'D-006',name:'秋季イベント運営',account:'サンプル企画',business:'MoneRun',member:'担当B',stage:'成約',amount:220000,due:'2026-09-08',revenueDate:'2026-09-22'}
);
export const seedRevenue = [
 {id:'R-001',deal:'D-003',name:'管理職研修 秋季プログラム',business:'企業研修',member:'担当C',amount:420000,date:'2026-09-10',booked:true,invoiced:420000,paid:0,invoiceDate:'2026-09-10',paidDate:'',mode:'一括'},
 {id:'R-002',deal:'D-005',name:'保険相談 継続サポート',business:'FP事業',member:'担当A',amount:280000,date:'2026-09-04',booked:true,invoiced:280000,paid:280000,invoiceDate:'2026-09-04',paidDate:'2026-09-08',mode:'一括'},
 {id:'R-003',deal:'D-006',name:'秋季イベント運営',business:'MoneRun',member:'担当B',amount:220000,date:'2026-09-22',booked:false,invoiced:0,paid:0,mode:'一括'}
];
export const seedExpenses = [
 {id:'E-001',date:'2026-09-08',merchant:'サンプル貸会議室',amount:8800,owner:'担当A',business:'',source:'UPSIDER',state:'対象未分類',reason:''},
 {id:'E-002',date:'2026-09-09',merchant:'サンプル交通',amount:2640,owner:'担当B',business:'',source:'UPSIDER',state:'対象未分類',reason:''},
 {id:'E-003',date:'2026-09-06',merchant:'サンプル広告サービス',amount:36000,owner:'担当A',business:'FP事業',source:'UPSIDER',state:'分類済み',reason:''},
 {id:'E-004',date:'2026-09-10',merchant:'サンプル備品',amount:12800,owner:'会社',business:'全社共通',source:'手入力',state:'分類済み',reason:''},
 {id:'E-005',date:'2026-09-18',merchant:'サンプル会場',amount:48000,owner:'担当B',business:'MoneRun',source:'手入力',state:'分類済み',reason:''},
];
export function rangeFor(period,month,part=0){
 const [y,m]=month.split('-').map(Number),fmt=d=>d.toISOString().slice(0,10);
 const date=(yy,mm,dd)=>new Date(Date.UTC(yy,mm,dd));
 let start,end,prevStart,prevEnd;
 if(period==='10日毎'){
  start=date(y,m-1,[1,11,21][part]);end=date(y,m-1,part===2?new Date(Date.UTC(y,m,0)).getUTCDate():[10,20][part]);
  prevEnd=date(y,m-1,[0,10,20][part]);prevStart=part===0?date(y,m-2,21):date(y,m-1,part===1?1:11);
 }else{
  const count=({'1か月':1,'3か月':3,'6か月':6,'1年':12})[period];
  const endMonth=period==='1年'?(m>=10?21:9):m;
  start=date(y,endMonth-count,1);end=date(y,endMonth,0);prevStart=date(y,endMonth-2*count,1);prevEnd=date(y,endMonth-count,0);
 }
 return {start:fmt(start),end:fmt(end),prevStart:fmt(prevStart),prevEnd:fmt(prevEnd)};
}
export const screenCatalog = [
 ['dashboard','経営ダッシュボード','7.1','経営者・総務（項目制限）','期間・事業・担当・段階、指標、比較、明細、CSV・印刷'],
 ['deals','案件','7.3','経営者・総務','一覧・新規・詳細・成約確認、予定差額・理由付き再開・取消'],
 ['revenue','売上・請求・入金','7.4','経営者・総務','計上前・計上済み・一括／分割・実績日・上限エラー・調整'],
 ['expenses','経費','7.5','経営者・総務','未分類・分類済み・確認待ち、分類修正、手入力・重複候補・見直し'],
 ['closing','月次締め','7.6','経営者：確定／総務：下書き','未締め・確認待ち・締め済み・解除理由・再締め待ち'],
 ['activities','活動・次の行動','7.2・7.8','経営者：閲覧／総務：入力','活動日・事業・メンバー・内容、複数の行動・期限超過・日程未定'],
 ['support','支援記録','7.2','経営者のみ','事業／メンバー・関連案件／活動・コメント・追記訂正'],
 ['projects','全社プロジェクト','7.10','経営者・総務（予算・完了／中止を制限）','一覧・進捗・期限・責任者・成果・課題・税込予算'],
 ['ideas','アイデア受信箱','7.11','経営者・総務（採否を制限）','アイデアメモ・出所・関連事業・状態・投稿者／日時'],
 ['accounts','取引先','7.2','経営者・総務','名称・個人／法人、類似候補・統合確認・履歴'],
 ['organization','事業・メンバー','8.1','システム担当：管理／業務利用者：参照','有効期間・主所属・兼務・所属履歴・無効化'],
 ['budgets','月次予算','7.5','経営者のみ','事業別売上・事業経費・全社共通費・人件費、変更履歴・締め後制御'],
 ['payroll','人件費','7.5','経営者のみ','月・全社集計額、個人別給与を保持しない'],
 ['audit','監査履歴','10・7.12','経営者・システム担当（閲覧範囲による）','対象・操作・実行者・日時・理由・前後値・権限内の出力'],
 ['users','利用者・権限','5.3・5.4','システム担当のみ','許可メール・役割・有効状態・招待・変更・無効化'],
 ['access','一時アクセス','5.3','経営者：承認／システム担当：申請','理由・24時間許可・拒否・期限・途中取消'],
 ['settings','運用・設定','5.3・11・13','システム担当（本番開始は経営者）','年度設定・連携停止・監視・バックアップ・復元申請・本番開始確認'],
 ['login','ログイン・利用不可','5.4','全利用者','Googleログイン、未登録・無効化・期限切れ・権限不足']
];
