import React, {useState} from 'react';
import {Card, GridTable, Badge, input, yen, stamp} from './workflow-panels.jsx';

export function ExpensePanel({expenses, setExpenses, members, businesses, begin, saveGuard, tab, setTab, role, held}) {
  const [search, setSearch] = useState('');
  const write = (e, f) => setExpenses(xs => xs.map(x => x.id === e.id ? {...x, ...f, history: [...(x.history || []), {before: x.business || '未分類', after: f.business || x.business, reason: f.reason || '通常更新', actor: role, at: stamp()}]} : x));
  const add = () => begin({title: '手入力経費を登録', confirm: true, text: 'UPSIDERカード以外の支出を登録します。', fields: [
    input('date', '利用日', 'date', null, {value: '2026-09-11'}), input('merchant', '支払先・内容'), input('amount', '税込金額（円）', 'number', null, {min: 1}),
    input('owner', '支払者', 'select', [...members, '経営者（サンプル）', '会社']), input('payment', '支払方法', 'select', ['銀行振込', '口座振替', '現金', 'その他']), input('business', '対象事業', 'select', [...businesses, '全社共通']),
    input('cycle', '継続・単発', 'select', ['継続', '単発'], {required: false}), input('renewal', '次回更新日', 'date', null, {required: false}), input('memo', 'メモ', 'textarea', null, {required: false})],
    hint: f => {const candidates = expenses.filter(e => !e.cancelled && e.date === f.date && e.amount === Number(f.amount));return candidates.length > 0 && <div className="notice"><div>重複の可能性があります。別の支出であることを確認して登録してください。{candidates.map(e => <p key={e.id}>{e.merchant} · {yen(e.amount)} · {e.source}</p>)}</div></div>;},
    save: f => {const error = saveGuard(f.date);if (error) return error;setExpenses(xs => [...xs, {...f, id: 'E-' + Date.now(), amount: Number(f.amount), source: '手入力', state: '分類済み'}]);}});
  const classify = e => begin({title: e.business ? '経費の分類を修正' : '経費の対象事業を登録', confirm: true, text: `${e.date} · ${e.merchant} · ${yen(e.amount)} · ${e.owner}`,
    fields: [input('business', '対象事業', 'select', [...businesses, '全社共通'], {value: e.business}), ...(e.business ? [input('reason', '修正理由', 'textarea')] : [])],
    save: f => {const error = saveGuard(e.date);if (error) return error;write(e, {...f, state: '分類済み', respondent: role});}, success: '経費の分類を登録しました。'});
  const detail = e => begin({title: '経費の詳細・見直し候補', text: `${e.date} · ${e.merchant} · ${yen(e.amount)} · ${e.owner} / ${e.source}`,
    fields: [input('review', '経費見直し候補', 'select', ['対象外', '候補'], {value: e.review ? '候補' : '対象外'}), input('reviewReason', '見直し理由', 'textarea', null, {value: e.reviewReason, required: false}), input('cycle', '継続・単発', 'select', ['継続', '単発'], {value: e.cycle, required: false}), input('renewal', '次回更新日', 'date', null, {value: e.renewal, required: false}), input('memo', 'メモ', 'textarea', null, {value: e.memo, required: false})],
    content: <><p className="small">{e.source === 'UPSIDER' ? '利用日・利用者・利用先・金額は連携元の情報です。ここでは上書きしません。' : '手入力経費。支払方法：' + (e.payment || '未記録')}</p>{e.history?.length > 0 && <details><summary>分類の変更履歴</summary>{e.history.map((h, i) => <p key={i}>{h.before} → {h.after} · {h.reason} · {h.actor} · {h.at}</p>)}</details>}</>,
    save: f => {const error = saveGuard(e.date);if (error) return error;write(e, {...f, review: f.review === '候補'});}});
  const adjust = e => begin({title: '経費の返金・訂正を記録', confirm: true, text: '元の明細を保持して差額を記録します。入力誤りは元の月、通常の返金は発生日に記録してください。',
    fields: [input('kind', '区分', 'select', ['返金', '取消', '入力誤りの訂正']), input('date', '実績日', 'date', null, {value: '2026-09-11'}), input('amount', '税込差額（減額はマイナス）', 'number', null, {min: -999999999, value: -e.amount}), input('reason', '理由', 'textarea')],
    validate: f => !Number(f.amount) ? '0円以外の差額を入力してください。' : null,
    save: f => {const error = saveGuard(f.date);if (error) return error;setExpenses(xs => [...xs, {...e, ...f, id: 'ADJ-' + Date.now(), amount: Number(f.amount), originalId: e.id, merchant: `${e.merchant}（${f.kind}）`, history: [], review: false}]);}});
  const rows = expenses.filter(e => !e.cancelled && (tab === 'すべて' || tab === '見直し候補' && e.review || e.state === tab) && `${e.merchant} ${e.business} ${e.owner}`.includes(search));
  const pending = tab === '連携確認待ち' || held;
  return <><div className="toolbar"><div className="segments">{['すべて', '対象未分類', '分類済み', '見直し候補', '連携確認待ち'].map(t => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>)}</div><button className="primary" onClick={add}>手入力経費</button></div>
    <label className="search"><span className="sr-only">利用先・事業・利用者で検索</span><input value={search} placeholder="利用先・事業・利用者で検索" onChange={e => setSearch(e.target.value)}/></label>
    {pending && <div className="notice"><div>連携確認待ちがある場合は、金額や対象を推測せずに保留します。原文・解析結果をシステム担当が確認し、解消するまで月次を締めません。<p className="small">{held?'確認待ち：HOLD-001（サンプル） / 受信済み・解析結果の確認が必要 / 金額は集計に含めません。':'この架空データには連携確認待ちの明細はありません。'}</p></div></div>}
    <Card title="経費明細" subtitle={tab === '見直し候補' ? `見直し候補の合計 ${yen(rows.reduce((n, e) => n + e.amount, 0))}` : '利用日で集計。未分類も全社経費に含めます。'}>
      <GridTable headers={['利用日・利用先', '利用者', '税込金額', '対象事業', '状態', '操作']} rows={rows.map(e => [<>{e.date}<strong>{e.merchant}</strong><small>{e.source}{e.originalId && ` · 元明細 ${e.originalId}`}</small></>, e.owner, yen(e.amount), <>{e.business || '未回答'}{e.reason && <small>理由：{e.reason}</small>}{e.respondent && <small>回答者：{e.respondent}</small>}</>, <><Badge>{e.state}</Badge>{e.review && <small>見直し候補</small>}</>, <div className="row-actions"><button onClick={() => classify(e)}>{e.business ? '回答を修正' : '事業を選択'}</button><button onClick={() => detail(e)}>詳細・見直し</button>{e.source === '手入力' && <button onClick={() => adjust(e)}>返金・訂正</button>}</div>])}/>
    </Card><p className="small">未回答経費は毎月1・11・21日10:00に元のSlackスレッドで1件ずつ再通知します。</p></>;
}
