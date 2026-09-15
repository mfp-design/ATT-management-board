import React from 'react';
import {formatMoney, relinkAccounts} from './prototype-model.js';

export const yen = formatMoney;
export const input = (name, label, type = 'text', options, extra = {}) => ({name, label, type, options, required: true, ...extra});
export const stamp = () => new Date().toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'});
export function Badge({children}) { return <span className="tag">{children}</span>; }
export function Card({title, children, action, subtitle}) {
  return <section className="panel"><div className="panel-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>{children}</section>;
}
export function GridTable({headers, rows}) {
  return <div className="table-wrap"><table><thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((v, j) => <td key={j} data-label={headers[j]}>{v}</td>)}</tr>)}</tbody></table>{!rows.length && <p className="muted">該当する記録はありません。</p>}</div>;
}

export function AccountsPanel({accounts, setAccounts, setDeals, begin, role}) {
  const active = accounts.filter(a => !a.mergedInto);
  const edit = row => begin({title: row ? '取引先を編集' : '取引先を登録', confirm: true,
    text: row ? `取引先：${row.id}。同じ識別子の案件だけに名称を反映し、変更前の情報を履歴に残します。` : undefined,
    fields: [input('name', '名称', 'text', null, {value: row?.name}), input('type', '種別', 'select', ['個人', '法人'], {value: row?.type}), ...(row ? [input('reason', '変更理由', 'textarea')] : [])],
    hint: f => {
      const matches = f.name ? active.filter(a => a.id !== row?.id && (a.name.includes(f.name.trim()) || f.name.trim().includes(a.name))) : [];
      return matches.length > 0 && <div className="notice"><div>似た名前の取引先があります。別の取引先であることを確認して登録してください。{matches.map(a => <p key={a.id}>{a.name} · {a.type} · {a.id}</p>)}</div></div>;
    },
    validate: f => !f.name.trim() ? '名称を入力してください。' : row && !f.reason.trim() ? '変更理由を入力してください。' : null,
    save: f => {
      const at = stamp(), updated = {id: row?.id || 'A-' + Date.now(), name: f.name.trim(), type: f.type, at};
      if (!row) {setAccounts(xs => [...xs, updated]);return;}
      setAccounts(xs => xs.map(a => a.id === row.id ? {...a, ...updated, history: [...(a.history || []), {before: `${a.name} / ${a.type}`, after: `${updated.name} / ${updated.type}`, reason: f.reason.trim(), actor: role, at}]} : a));
      setDeals(xs => relinkAccounts(xs, row.id, updated, f.reason.trim(), at, role));
    }
  });
  const merge = a => begin({title: '取引先を統合', confirm: true,
    text: `統合元：${a.name}（${a.id}）。元の識別子を保持し、案件の参照先を統合先へ付け替えます。`,
    fields: [input('target', '統合先', 'select', active.filter(x => x.id !== a.id).map(x => `${x.id} / ${x.name}`)), input('reason', '統合理由', 'textarea')],
    validate: f => !f.reason.trim() ? '統合理由を入力してください。' : null,
    save: f => {
      const target = active.find(x => f.target.startsWith(x.id + ' /'));
      if (!target) return '統合先を選択してください。';
      const at = stamp();
      setAccounts(xs => xs.map(x => x.id === a.id ? {...x, mergedInto: target.id, reason: f.reason.trim(), actor: role, at} : x));
      setDeals(xs => relinkAccounts(xs, a.id, target, f.reason.trim(), at, role));
    }, success: '取引先を統合しました。元の識別子と理由は履歴に残っています。'
  });
  return <><Card title="取引先一覧" subtitle="同名でも別の取引先として登録できます。識別子で区別します。" action={<button className="primary" onClick={() => edit()}>取引先を登録</button>}>
    <GridTable headers={['名称・識別子', '種別', '操作']} rows={active.map(a => [<>{a.name}<small>{a.id}</small></>, a.type, <div className="row-actions"><button onClick={() => edit(a)}>編集</button>{role === '総務担当' ? <button disabled={active.length < 2} onClick={() => merge(a)}>統合を確認</button> : <small>統合は総務担当が実行</small>}</div>])}/>
  </Card><Card title="変更の履歴"><GridTable headers={['取引先', '変更前 → 変更後', '理由・実行者・日時']} rows={accounts.flatMap(a => (a.history || []).map(h => [a.id, `${h.before} → ${h.after}`, <>{h.reason}<small>{h.actor} · {h.at}</small></>]))}/>
  </Card><Card title="統合の履歴"><GridTable headers={['統合元', '統合先', '理由・実行者・日時']} rows={accounts.filter(a => a.mergedInto).map(a => [`${a.name} (${a.id})`, a.mergedInto, <>{a.reason}<small>{a.actor} · {a.at}</small></>])}/></Card></>;
}

export function AccessPanel({system, access, setAccess, request, setRequest, expired, setExpired, begin, notify}) {
  const status = expired && access === '許可中' ? '期限切れ' : access;
  const apply = () => begin({title: '一時アクセスを申請', fields: [input('reason', '閲覧が必要な理由', 'textarea')], confirm: true,
    save: f => {setAccess('申請中'); setExpired(false); setRequest({reason: f.reason, requestedAt: stamp(), applicant: 'システム担当（サンプル）'});}, success: '一時アクセスを申請しました。'});
  const approve = () => {const now = Date.now();setRequest(r => ({...r, approver: '経営者（サンプル）', startedAt: new Date(now).toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'}), until: now + 86400000}));setAccess('許可中');setExpired(false);notify('一時アクセスを24時間許可しました。');};
  return <Card title={system ? '一時アクセスを申請' : '一時アクセスの承認'} subtitle="役員限定情報へのアクセスは承認から24時間。期限前でも取り消せます。">
    <dl className="details"><dt>申請者</dt><dd>{request.applicant}</dd><dt>理由</dt><dd>{request.reason}</dd><dt>申請日時</dt><dd>{request.requestedAt}</dd><dt>状態</dt><dd><Badge>{status}</Badge></dd>{request.startedAt && <><dt>承認者</dt><dd>{request.approver}</dd><dt>開始日時</dt><dd>{request.startedAt}</dd><dt>終了日時</dt><dd>{new Date(request.until).toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'})}</dd></>}</dl>
    <div className="panel-footer">{system ? <button disabled={status === '申請中' || status === '許可中'} className="primary" onClick={apply}>理由を付けて申請</button> : status === '申請中' ? <><button onClick={() => {setAccess('拒否');notify('申請を拒否しました。');}}>拒否</button><button className="primary" onClick={approve}>24時間許可</button></> : status === '許可中' ? <button onClick={() => {setAccess('取り消し済み');notify('一時アクセスを取り消しました。');}}>許可を取り消す</button> : <p className="muted">新しい申請をお待ちください。</p>}</div>
    {status === '許可中' && <div className="preview-control"><span>画面確認用</span><button onClick={() => {setExpired(true);notify('期限切れの表示に切り替えました。');}}>期限切れを試す</button></div>}
  </Card>;
}

export function ActivitiesPanel({activities, setActivities, actions, setActions, members, businesses, deals, begin, role, today}) {
  const editable = role === '総務担当';
  const edit = a => begin({title: a ? '活動を編集' : '活動を記録', fields: [
    input('date', '活動日', 'date', null, {value: a?.date || today}), input('business', '対象事業', 'select', businesses, {value: a?.business}),
    input('member', '対象メンバー', 'select', members, {value: a?.member}), input('name', '活動内容', 'textarea', null, {value: a?.name}),
    input('deal', '関連案件', 'select', deals.filter(d => !d.cancelled).map(d => d.name), {value: a?.deal, required: false}), input('result', '結果', 'textarea', null, {value: a?.result, required: false})],
    save: f => setActivities(xs => a ? xs.map(x => x.id === a.id ? {...x, ...f, updatedAt: stamp()} : x) : [...xs, {...f, id: 'ACT-' + Date.now(), updatedAt: stamp()}])});
  const editAction = (activity, action) => begin({title: action ? '次の行動を編集' : '次の行動を追加', text: `活動：${activity.name}`, fields: [
    input('text', '行動内容', 'textarea', null, {value: action?.text}), input('owner', '責任者', 'select', members, {value: action?.owner || activity.member}),
    input('timing', '実施時期', 'select', ['指定日', '期限', '期間', '未定'], {value: action?.timing || '期限'}),
    input('start', '期間の開始日', 'date', null, {value: action?.start, required: false}), input('end', '指定日・期限・期間の終了日', 'date', null, {value: action?.end, required: false})],
    hint: f => <p className="small">{f.timing === '未定' ? '未定では日付を保存せず、期限超過にもなりません。' : '指定日・期限は終了日の欄だけ、期間は開始日と終了日の両方を入力してください。'}</p>,
    validate: f => f.timing !== '未定' && !f.end ? '指定日・期限・期間の終了日を入力してください。' : f.timing === '期間' && (!f.start || f.start > f.end) ? '期間の開始日と終了日を正しい順に入力してください。' : null,
    save: f => {const record = {...f, start: f.timing === '期間' ? f.start : '', end: f.timing === '未定' ? '' : f.end, activityId: activity.id, business: activity.business, id: action?.id || 'NA-' + Date.now(), status: action?.status || '未着手'};setActions(xs => action ? xs.map(x => x.id === action.id ? record : x) : [...xs, record]);}});
  const statusAction = (a, status) => begin({title: `次の行動を${status}`, text: a.text, confirm: true, fields: status === '中止' ? [input('reason', '中止理由', 'textarea')] : [], save: f => setActions(xs => xs.map(x => x.id === a.id ? {...x, status, reason: f.reason, completedBy: role, completedAt: stamp()} : x))});
  const order = [...actions].sort((a, b) => {
    const late = x => x.status === '未着手' && x.end && x.end < today ? 0 : 1;
    return late(a) - late(b) || (a.end || '9999').localeCompare(b.end || '9999');
  });
  return <><Card title="活動記録" subtitle="一つの活動に、複数の次の行動を追加できます。" action={editable && <button className="primary" onClick={() => edit()}>活動を記録</button>}>
    <GridTable headers={['活動', '事業・担当', '結果・関連案件', '操作']} rows={activities.filter(a => !a.cancelled).map(a => [<>{a.name}<small>{a.date}</small></>, `${a.business} / ${a.member}`, <>{a.result || '結果の記録なし'}<small>{a.deal}</small></>, editable && <div className="row-actions"><button onClick={() => editAction(a)}>次の行動を追加</button><button onClick={() => edit(a)}>編集</button><button onClick={() => begin({title: '活動を取り消す', text: '元記録と関連する次の行動は保持します。次の行動の中止は別途確認してください。', fields: [input('reason', '取消理由', 'textarea')], confirm: true, save: f => setActivities(xs => xs.map(x => x.id === a.id ? {...x, cancelled: true, reason: f.reason} : x))})}>取消</button></div>])}/>
  </Card><Card title="次の行動" subtitle="期限超過を先頭に、日付の近い順で表示。日程未定は最後に表示します。">
    <GridTable headers={['行動・責任者', '実施時期', '状態・記録', '操作']} rows={order.map(a => [<>{a.text}<small>{a.owner}</small></>, a.timing === '未定' ? '日程未定' : `${a.timing} ${a.start ? a.start + ' 〜 ' : ''}${a.end}`, <><Badge>{a.status === '未着手' && a.end && a.end < today ? '期限超過' : a.status}</Badge><small>{a.completedBy} {a.completedAt}</small>{a.reason && <small>理由：{a.reason}</small>}</>, editable && a.status === '未着手' && <div className="row-actions"><button onClick={() => editAction(activities.find(x => x.id === a.activityId), a)}>編集</button><button onClick={() => statusAction(a, '完了')}>完了</button><button onClick={() => statusAction(a, '中止')}>中止</button></div>])}/>
  </Card><details className="panel"><summary>取り消した活動</summary>{activities.filter(a => a.cancelled).map(a => <p key={a.id}>{a.name} · 取消理由：{a.reason}</p>)}</details></>;
}
