import React, {useState} from 'react';
import {Card, GridTable, Badge, input, yen, stamp} from './workflow-panels.jsx';

export function withLedger(r) {
  const plans = r.plans || ['請求', '入金'].map(kind => ({id: kind + '-1', kind, date: r.date, amount: r.amount}));
  const entries = r.entries || [
    ...(r.booked ? [{id: r.id + '-book', kind: '売上', date: r.date, amount: r.amount, reason: '通常計上'}] : []),
    ...(r.invoiced ? [{id: r.id + '-invoice', planId: '請求-1', kind: '請求', date: r.invoiceDate || r.date, amount: r.invoiced, reason: '通常入力'}] : []),
    ...(r.paid ? [{id: r.id + '-paid', planId: '入金-1', kind: '入金', date: r.paidDate || r.date, amount: r.paid, reason: '通常入力'}] : [])
  ];
  return {...r, plans, entries};
}
const total = (r, kind) => r.entries.filter(e => e.kind === kind).reduce((n, e) => n + e.amount, 0);
export function RevenuePanel({revenue, setRevenue, begin, saveGuard, today, role, onChanged}) {
  const [selected, setSelected] = useState(null);
  const rows = revenue.map(withLedger), record = rows.find(r => r.id === selected);
  const change = (id, update) => {setRevenue(xs => xs.map(x => x.id === id ? update(withLedger(x)) : x));onChanged?.();};
  const commitEntry = (r, entry) => change(r.id, current => {
    const next = {...current, entries: [...current.entries, {...entry, id: 'ENTRY-' + Date.now(), actor: role+'（サンプル）', at: stamp()}]};
    return {...next, invoiced: total(next, '請求'), paid: total(next, '入金')};
  });
  const book = r => begin({title: '売上を計上', text: r.name, confirm: true,
    fields: [input('date', '売上計上実績日', 'date', null, {value: today}), input('amount', '税込実績額（円）', 'number', null, {value: r.amount, min: 1})],
    save: f => {const error = saveGuard(f.date);if (error) return error;
      change(r.id, x => withLedger({...x, booked: true, amount: Number(f.amount), date: f.date,
        plans: ['請求', '入金'].map(kind => ({id: kind + '-1', kind, date: f.date, amount: Number(f.amount)})),
        entries: [{id: 'ENTRY-' + Date.now(), kind: '売上', date: f.date, amount: Number(f.amount), reason: '通常計上', actor: role+'（サンプル）', at: stamp()}]}));
    }, success: '売上を計上しました。請求・入金予定を各1件作成しました。'});
  const schedule = r => begin({title: '一括・分割を選択', text: '実績がない予定を作り直します。次の画面で日付と金額を確認してください。',
    fields: [input('mode', '請求・入金の方法', 'select', ['一括', '分割（2回）', '分割（3回）', '分割（4回）'], {value: r.mode === '一括' ? '一括' : '分割（2回）'})],
    save: f => {
      const count = f.mode === '一括' ? 1 : Number(f.mode.match(/[234]/)[0]);
      setTimeout(() => begin({title: '請求・入金予定を確認', confirm: true, text: `売上計上額 ${yen(r.amount)}。請求予定・入金予定は、それぞれ合計を一致させます。`,
        fields: ['請求', '入金'].flatMap(kind => Array.from({length: count}, (_, i) => [
          input(`${kind}Date${i}`, `${kind}${i + 1}回目・予定日`, 'date', null, {value: r.date}),
          input(`${kind}Amount${i}`, `${kind}${i + 1}回目・税込予定額`, 'number', null, {min: 1, value: i === count - 1 ? r.amount - Math.floor(r.amount / count) * i : Math.floor(r.amount / count)})]).flat()),
        validate: values => ['請求', '入金'].some(kind => Array.from({length: count}, (_, i) => Number(values[`${kind}Amount${i}`])).reduce((a, b) => a + b, 0) !== r.amount) ? '請求予定と入金予定の合計を、それぞれ売上計上額に一致させてください。' : null,
        save: values => {const error = saveGuard(r.date);if (error) return error;
          if (r.entries.some(e => e.kind !== '売上')) return '実績があるため、直接変更できません。調整記録で訂正してください。';
          change(r.id, x => ({...x, mode: count === 1 ? '一括' : '分割', planHistory: [...(x.planHistory || []), {plans: x.plans, at: stamp()}], plans: ['請求', '入金'].flatMap(kind => Array.from({length: count}, (_, i) => ({id: kind + '-' + (i + 1), kind, date: values[`${kind}Date${i}`], amount: Number(values[`${kind}Amount${i}`])})))}));
        }, success: '請求・入金予定を作り直しました。'}), 0);
    }});
  const actual = (r, plan) => begin({title: `${plan.kind}実績を登録`, text: `${r.name} / ${plan.kind}予定 ${yen(plan.amount)}`, confirm: true,
    fields: [input('date', `${plan.kind}実績日`, 'date', null, {value: today}), input('amount', '税込実績額（円）', 'number', null, {value: plan.amount, min: 1})],
    save: f => {const error = saveGuard(f.date);if (error) return error;const amount = Number(f.amount);
      if (plan.kind === '請求' && total(r, '請求') + amount > total(r, '売上')) return '売上計上済額を超える請求は登録できません。差額は調整記録で扱います。';
      if (plan.kind === '入金' && total(r, '入金') + amount > total(r, '請求')) return '請求済額を超える入金は登録できません。';
      commitEntry(r, {kind: plan.kind, date: f.date, amount, planId: plan.id, reason: '通常入力'});
    }, success: `${plan.kind}実績を登録しました。`});
  const adjust = (r, original) => begin({title: original ? '実績を取り消す' : '理由付き調整を登録', confirm: true,
    text: original ? `${original.kind} ${yen(original.amount)} の反対額を記録します。元記録は保持します。` : '返金・取消は発生日に記録します。入力誤りの訂正は元の月へ記録し、締め済みなら解除が必要です。増額は正、減額は負の差額を入力してください。',
    fields: [...(!original ? [input('kind', '調整対象', 'select', ['売上', '請求', '入金']), input('category', '調整区分', 'select', ['返金', '取消', '入力誤りの訂正', '振込手数料', '過入金', 'その他']), input('amount', '税込調整額（円・減額はマイナス）', 'number', null, {min: -999999999})] : []), input('date', '調整実績日', 'date', null, {value: today}), input('reason', '調整理由', 'textarea')],
    validate: f => !original && !Number(f.amount) ? '0円以外の調整額を入力してください。' : null,
    save: f => {const error = saveGuard(f.date);if (error) return error;
      commitEntry(r, {kind: original?.kind || f.kind, date: f.date, amount: original ? -original.amount : Number(f.amount), reason: f.reason, adjustment: original ? '取消' : f.category, originalId: original?.id, planId: original?.planId});
    }, success: '調整を登録しました。元記録と理由は履歴に残っています。'});
  const details = r => <>
    <button className="text-btn" onClick={() => setSelected(null)}>← 売上一覧へ戻る</button>
    <Card title={r.name} subtitle={`${r.business} · ${r.booked ? '売上計上済み' : '売上予定'} · ${r.date}`} action={!r.booked && <button className="primary" onClick={() => book(r)}>売上を計上</button>}>
      <div className="summary-strip"><div>{r.booked ? '売上計上額（調整後）' : '売上予定額'}<strong>{yen(r.booked ? total(r, '売上') : r.amount)}</strong></div><div>未請求額<strong>{yen((r.booked ? total(r, '売上') : 0) - total(r, '請求'))}</strong></div><div>未入金額<strong>{yen(total(r, '請求') - total(r, '入金'))}</strong></div></div>
    </Card>
    {r.booked && <><Card title="請求・入金の予定と実績" subtitle={`方法：${r.mode}`} action={<button disabled={r.entries.some(e => e.kind !== '売上')} onClick={() => schedule(r)}>一括・分割を変更</button>}>
      {r.entries.some(e => e.kind !== '売上') && <p className="small">実績があるため、予定の一括・分割は直接変更できません。誤りは調整で記録します。</p>}
      <GridTable headers={['明細', '予定日・予定額', '実績日・実績額', '操作']} rows={r.plans.map(plan => {
        const entries = r.entries.filter(e => e.planId === plan.id);return [plan.id, <>{plan.date}<small>{yen(plan.amount)}</small></>, entries.length ? entries.map(e => <div key={e.id}>{e.date} / {yen(e.amount)}</div>) : '未実績', <button onClick={() => actual(r, plan)}>{entries.length ? `${plan.kind}実績を追加` : `${plan.kind}済みにする`}</button>];
      })}/>
    </Card><Card title="実績・調整履歴" subtitle="元記録を削除せず、金額・日付・理由を残します。" action={<button onClick={() => adjust(r)}>調整を登録</button>}>
      <GridTable headers={['実績日・対象', '金額', '理由・実行者', '操作']} rows={r.entries.map(e => [<>{e.date}<small>{e.kind} {e.adjustment}</small></>, yen(e.amount), <>{e.reason}<small>{e.actor || '総務（サンプル）'} · {e.at || e.date}</small></>, !e.adjustment && !r.entries.some(x => x.originalId === e.id) && <button onClick={() => adjust(r, e)}>取消を記録</button>])}/>
    </Card></>}
  </>;
  if (record) return details(record);
  return <><div className="metrics">{[['売上計上済額', rows.reduce((n, r) => n + total(r, '売上'), 0)], ['未請求額', rows.reduce((n, r) => n + total(r, '売上') - total(r, '請求'), 0)], ['未入金額', rows.reduce((n, r) => n + total(r, '請求') - total(r, '入金'), 0)]].map(([label, n]) => <div className="metric" key={label}><p>{label}</p><strong>{yen(n)}</strong><small>架空データの累積実績（調整を含む）</small></div>)}</div>
    <Card title="売上・請求・入金の明細" subtitle="予定を実績に含めず、明細の実績額から集計します。"><GridTable headers={['案件', '売上額', '状態', '請求済額', '入金済額', '操作']} rows={rows.map(r => [<>{r.name}<small>{r.business} · {r.date}</small></>, yen(r.booked ? total(r, '売上') : r.amount), <Badge>{r.booked ? '計上済み' : '売上予定'}</Badge>, yen(total(r, '請求')), yen(total(r, '入金')), <button onClick={() => setSelected(r.id)}>明細を見る</button>])}/></Card></>;
}
