import {relinkAccounts} from './prototype-model.js';
import React, {useState} from 'react';
import {Card, GridTable, Badge, input, yen, stamp} from './workflow-panels.jsx';
import {withLedger} from './revenue-panel.jsx';

export function DealsPanel({deals, setDeals, revenue, setRevenue, accounts, businesses, members, stages, begin, focusDeal, setFocusDeal, go, saveGuard, role}) {
  const [search, setSearch] = useState('');
  const selected = deals.find(d => d.id === focusDeal);
  const linked = d => revenue.filter(r => r.deal === d.id);
  const hasActual = d => linked(d).some(r => withLedger(r).entries.filter(e => e.kind === '売上').reduce((n, e) => n + e.amount, 0) !== 0);
  const update = (id, values, reason) => setDeals(xs => xs.map(x => {
    if (x.id !== id) return x;
    const at = stamp();
    const current = values.accountId && values.accountId !== x.accountId ? relinkAccounts([x], x.accountId, {id: values.accountId, name: values.account}, reason, at, role)[0] : x;
    return {...current, ...values, history: [...(x.history || []), {before: `${x.stage} / ${yen(x.amount)} / ${x.business} / ${x.member}`, after: `${values.stage || x.stage} / ${yen(values.amount ?? x.amount)} / ${values.business || x.business} / ${values.member || x.member}`, reason, at}]};
  }));
  const edit = d => begin({title: d ? '案件を編集' : '案件を登録', confirm: true, fields: [
    input('name', '案件名', 'text', null, {value: d?.name}), input('business', '事業', 'select', businesses, {value: d?.business}),
    input('account', '取引先', 'select', accounts.filter(a => !a.mergedInto).map(a => `${a.id} / ${a.name}`), {value: d ? accounts.filter(a => !a.mergedInto && a.id === d.accountId).map(a => `${a.id} / ${a.name}`)[0] || '' : ''}),
    input('member', '主担当者', 'select', members, {value: d?.member}), input('coMembers', '共同担当者（複数選択可）', 'multiselect', members, {value: d?.coMembers || [], required: false}),
    input('amount', '全件成約時の税込金額（円）', 'number', null, {value: d?.amount, min: 1}), input('due', '成約予定日', 'date', null, {value: d?.due}),
    input('revenueDate', '売上計上予定日', 'date', null, {value: d?.revenueDate}), input('memo', 'メモ', 'textarea', null, {value: d?.memo, required: false}), ...(d ? [input('reason', '変更理由', 'textarea')] : [])],
    save: f => {
      const account = accounts.find(a => !a.mergedInto && f.account.startsWith(a.id + ' /'));
      if (!account) return '有効な取引先を選択してください。';
      if (d && linked(d).some(r => r.booked) && f.business !== d.business) {const err = saveGuard(linked(d).find(r => r.booked).date);if (err) return err;}
      const values = {...f, amount: Number(f.amount), account: account.name, accountId: account.id};
      if (d) {update(d.id, values, f.reason);if (f.business !== d.business) setRevenue(xs => xs.map(r => r.deal === d.id ? {...r, business: f.business, businessHistory: [...(r.businessHistory || []), {before: r.business, after: f.business, reason: f.reason, at: stamp()}]} : r));}
      else setDeals(xs => [...xs, {...values, id: 'D-' + Date.now(), stage: '見込み', createdAt: stamp()}]);
    }, success: '案件を保存しました。登録済みの売上予定額は自動変更していません。'});
  const plan = (d, r) => begin({title: r ? '売上予定を編集' : '売上予定を追加', confirm: true, text: `対象事業：${d.business}（案件から引継ぎ）`,
    fields: [input('date', '売上計上予定日', 'date', null, {value: r?.date || d.revenueDate}), input('amount', '税込予定額（円）', 'number', null, {value: r?.amount ?? Math.max(0, d.amount - linked(d).reduce((n, x) => n + x.amount, 0)), min: 1})],
    save: f => {const error = saveGuard(f.date);if (error) return error;const values = {amount: Number(f.amount), date: f.date};setRevenue(xs => r ? xs.map(x => x.id === r.id ? {...x, ...values} : x) : [...xs, {id: 'R-' + Date.now(), deal: d.id, name: d.name, business: d.business, member: d.member, ...values, booked: false, invoiced: 0, paid: 0, mode: '一括'}]);}});
  const stage = d => begin({title: '案件段階を変更', confirm: true, text: '成約時は案件金額と売上予定の合計を一致させます。成約だけでは売上実績になりません。',
    fields: [input('stage', '案件段階', 'select', stages, {value: d.stage}), input('reason', '変更理由', 'textarea', null, {required: ['成約', '失注'].includes(d.stage)})],
    save: f => {
      const records = linked(d), sum = records.reduce((n, r) => n + r.amount, 0);
      if (f.stage === '成約' && records.length && sum !== d.amount) return `売上予定合計 ${yen(sum)} と案件金額 ${yen(d.amount)} が一致しません。予定を修正してください。`;
      if (f.stage === '失注' && hasActual(d)) return '売上実績が残っています。売上側の取消・訂正を先に行ってください。';
      if (f.stage === '成約' && !records.length) setRevenue(xs => [...xs, {id: 'R-' + Date.now(), deal: d.id, name: d.name, business: d.business, member: d.member, amount: d.amount, date: d.revenueDate, booked: false, invoiced: 0, paid: 0, mode: '一括'}]);
      update(d.id, {stage: f.stage}, f.reason || '通常の段階変更');
    }, success: '案件段階を変更しました。'});
  if (selected) {
    const d = selected, records = linked(d), sum = records.reduce((n, r) => n + r.amount, 0);
    return <><button className="text-btn" onClick={() => setFocusDeal(null)}>← 案件一覧へ戻る</button><Card title={d.name} subtitle={`${d.business} · ${d.member}`} action={!d.cancelled && <button onClick={() => edit(d)}>案件を編集</button>}>
      <dl className="details"><dt>取引先</dt><dd>{d.account}<small>{d.accountId}</small></dd><dt>案件段階</dt><dd><Badge>{d.cancelled ? '取消' : d.stage}</Badge></dd><dt>案件金額</dt><dd>{yen(d.amount)}</dd><dt>共同担当者</dt><dd>{d.coMembers?.join('、') || 'なし'}</dd><dt>成約予定日</dt><dd>{d.due}</dd><dt>売上計上予定日</dt><dd>{d.revenueDate}</dd><dt>メモ</dt><dd>{d.memo || 'なし'}</dd></dl>
      {!d.cancelled && <div className="panel-footer"><button onClick={() => stage(d)}>段階を変更</button><button onClick={() => begin({title: '案件を取り消す', confirm: true, text: '誤登録の案件を通常一覧から除外します。元記録・関係・履歴は保持します。', fields: [input('reason', '取消理由', 'textarea')], save: f => {if (hasActual(d)) return '売上実績が残っています。売上側の取消・訂正を先に行ってください。';update(d.id, {cancelled: true, cancelReason: f.reason}, f.reason);setFocusDeal(null);}})}>理由を付けて取消</button></div>}
    </Card><Card title="売上予定" subtitle={`案件金額 ${yen(d.amount)} / 予定合計 ${yen(sum)} / 差額 ${yen(d.amount - sum)}`} action={!d.cancelled && <button onClick={() => plan(d)}>売上予定を追加</button>}>
      <GridTable headers={['予定日', '金額', '状態', '操作']} rows={records.map(r => [r.date, yen(r.amount), r.booked ? '計上済み' : '売上予定', r.booked ? <button onClick={() => go('revenue')}>実績を確認</button> : !d.cancelled && <button onClick={() => plan(d, r)}>予定を編集</button>])}/>
      <p className="small">部分成約は、成約部分と継続部分を別の案件へ分けます。</p>
    </Card><Card title="取引先の変更履歴"><GridTable headers={['変更前', '変更後', '理由・実行者・日時']} rows={(d.accountHistory || []).map(h => [h.before, h.after, <>{h.reason}<small>{h.actor} · {h.at}</small></>])}/></Card><Card title="案件の変更履歴"><GridTable headers={['変更前', '変更後', '理由・日時']} rows={(d.history || []).map(h => [h.before, h.after, <>{h.reason}<small>{h.at}</small></>])}/></Card></>;
  }
  return <><div className="toolbar"><label className="search"><span className="sr-only">案件名・取引先で検索</span><input aria-label="案件名・取引先で検索" value={search} onChange={e => setSearch(e.target.value)} placeholder="案件名・取引先で検索"/></label><button className="primary" onClick={() => edit()}>案件を登録</button></div>
    <Card title="案件一覧" subtitle="成約と売上計上を分けて管理"><GridTable headers={['案件・取引先', '事業・担当', '段階', '金額', '操作']} rows={deals.filter(d => !d.cancelled && `${d.name} ${d.account}`.includes(search)).map(d => [<>{d.name}<small>{d.account}</small></>, `${d.business} / ${d.member}`, <Badge>{d.stage}</Badge>, yen(d.amount), <button onClick={() => setFocusDeal(d.id)}>詳細</button>])}/></Card>
    <details className="panel"><summary>取り消した案件</summary>{deals.filter(d => d.cancelled).map(d => <p key={d.id}>{d.name} · 理由：{d.cancelReason} <button onClick={() => setFocusDeal(d.id)}>記録を見る</button></p>)}</details></>;
}
