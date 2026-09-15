import React from 'react';
import {Card, GridTable, input, yen, stamp} from './workflow-panels.jsx';
import {writeFinance} from './prototype-model.js';

export const seedFinance = Array.from({length: 12}, (_, i) => {
  const month = new Date(Date.UTC(2025, 9 + i, 1)).toISOString().slice(0, 7);
  return {month, sales: {'FP事業': 700000, MoneRun: 350000, Agerun: 50000, '自社不動産事業': 100000, '日本デザイン': 0, '日本酒': 50000, 'トラストサロン': 50000, 'ビルメンテナンス': 100000, '企業研修': 100000}, costs: {'FP事業': 100000, MoneRun: 40000, Agerun: 10000, '自社不動産事業': 20000, '日本デザイン': 0, '日本酒': 10000, 'トラストサロン': 10000, 'ビルメンテナンス': 10000, '企業研修': 0}, common: 100000, payrollBudget: 250000, payroll: 250000, history: []};
});
export function FinancePanel({finance, setFinance, month, setMonth, businesses, route, begin, saveGuard, executive}) {
  const item = finance.find(x => x.month === month);
  const update = (kind, key, label, value) => begin({title: `${label}を${value == null ? '登録' : '変更'}`, confirm: true, text: `${month} / 現在：${yen(value)}`,
    fields: [input('amount', '税込金額（円）', 'number', null, {value}), input('reason', '変更理由', 'textarea')],
    validate: f => !Number.isSafeInteger(Number(f.amount)) || Number(f.amount) < 0 ? '金額は0円以上の整数で入力してください。' : !f.reason.trim() ? '変更理由を入力してください。' : null,
    save: f => {const error = saveGuard(month + '-01');if (error) return error;setFinance(xs => writeFinance(xs, month, kind, key, Number(f.amount), {label, before: value ?? null, after: Number(f.amount), reason: f.reason.trim(), at: stamp()}));}});
  const row = (kind, key, label, amount) => [label, yen(amount), executive ? <button onClick={() => update(kind, key, label, amount)}>{amount == null ? '登録' : '変更'}</button> : '閲覧のみ'];
  return <><div className="toolbar"><label>対象月 <input type="month" aria-label="予算・人件費の対象月" value={month} onChange={e => {if (/^\d{4}-\d{2}$/.test(e.target.value)) setMonth(e.target.value);}}/></label></div>
    {!item && <p className="notice">この月の予算・人件費は未設定です。項目ごとに登録できます。</p>}
    <Card title={`${month} ${route === 'payroll' ? '全社人件費' : '月次予算'}`} subtitle="月単位の税込金額。変更履歴を保持し、締め後は解除が必要です。">
      <GridTable headers={['対象・種別', '金額', '操作']} rows={route === 'payroll' ? [row('payroll', null, '全社人件費（実績集計額）', item?.payroll)] : [...businesses.flatMap(b => [row('sales', b, `${b}・売上予算`, item?.sales?.[b]), row('costs', b, `${b}・経費予算`, item?.costs?.[b])]), row('common', null, '全社共通費予算', item?.common), row('payrollBudget', null, '全社人件費予算', item?.payrollBudget)]}/>
      {route === 'payroll' && <p className="small">個人別の給与明細は保存しません。</p>}
    </Card><Card title="変更履歴"><GridTable headers={['対象', '変更前 → 変更後', '理由・日時']} rows={(item?.history || []).filter(h => route === 'payroll' ? h.label.includes('実績集計額') : !h.label.includes('実績集計額')).map(h => [h.label, `${yen(h.before)} → ${yen(h.after)}`, <>{h.reason}<small>経営者 · {h.at}</small></>])}/></Card></>;
}
