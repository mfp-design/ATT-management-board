import React from 'react';
import {Card, GridTable, Badge, input, stamp} from './workflow-panels.jsx';

export function UsersPanel({users, setUsers, begin}) {
  const roles = ['経営者', '総務担当', 'システム担当'];
  const edit = u => begin({title: u ? '利用者の権限を変更' : '利用者を登録', confirm: true,
    text: 'Googleのメールアドレスを許可リストに登録します。本人にGoogleの2段階認証が有効であることを確認してください。',
    fields: [input('email', 'Googleメールアドレス', 'email', null, {value: u?.email}), input('role', '役割', 'select', roles, {value: u?.role}), ...(u ? [input('reason', '変更理由', 'textarea')] : [])],
    validate: f => users.some(x => x.id !== u?.id && x.email.toLowerCase() === f.email.toLowerCase()) ? 'このメールアドレスは登録済みです。既存の利用者を編集してください。' : null,
    save: f => {
      if (u?.role === 'システム担当' && f.role !== 'システム担当' && users.filter(x => x.role === 'システム担当' && x.active).length === 1) return '最後の有効なシステム担当は変更できません。別の担当を先に登録してください。';
      setUsers(xs => u ? xs.map(x => x.id === u.id ? {...x, ...f, at: stamp()} : x) : [...xs, {...f, id: 'USER-' + Date.now(), active: true, at: stamp()}]);
    }, success: '利用者の許可リストを更新しました（画面案・メール送信なし）。'});
  const toggle = u => begin({title: u.active ? '利用者を無効化' : '利用者を再有効化', confirm: true, text: `${u.email}。無効化後は既存セッションからも利用できなくなる設計です。`, fields: [input('reason', '変更理由', 'textarea')],
    save: f => {if (u.active && u.role === 'システム担当' && users.filter(x => x.role === 'システム担当' && x.active).length === 1) return '最後の有効なシステム担当は無効化できません。';setUsers(xs => xs.map(x => x.id === u.id ? {...x, active: !x.active, reason: f.reason, at: stamp()} : x));}});
  return <Card title="利用者・権限" subtitle="メールアドレス・役割・有効状態を管理します。" action={<button className="primary" onClick={() => edit()}>利用者を登録</button>}>
    <GridTable headers={['利用者', '役割', '状態・変更記録', '操作']} rows={users.map(u => [u.email, u.role, <><Badge>{u.active ? '有効' : '無効'}</Badge><small>{u.reason} {u.at}</small></>, <div className="row-actions"><button onClick={() => edit(u)}>権限を変更</button><button onClick={() => toggle(u)}>{u.active ? '無効化' : '再有効化'}</button></div>])}/>
  </Card>;
}

export function OrganizationPanel({organization, setOrganization, begin, system}) {
  const businesses = organization.businesses.filter(x => x.active).map(x => x.name);
  const edit = (kind, row) => begin({title: `${kind === 'businesses' ? '事業' : 'メンバー'}を${row ? '編集' : '登録'}`, confirm: true,
    fields: [input('name', '名称', 'text', null, {value: row?.name}), input('start', '開始日', 'date', null, {value: row?.start || '2026-09-11'}), input('end', '終了日', 'date', null, {value: row?.end, required: false}),
      ...(kind === 'members' ? [input('primary', '主所属', 'select', businesses, {value: row?.primary}), input('additional', '兼務先（複数選択可）', 'multiselect', businesses, {value: row?.additional || [], required: false})] : []), ...(row ? [input('reason', '変更理由', 'textarea')] : [])],
    validate: f => f.end && f.end < f.start ? '終了日は開始日以降にしてください。' : f.additional?.includes(f.primary) ? '主所属と兼務先は別の事業を選択してください。' : null,
    save: f => setOrganization(x => ({...x, [kind]: row ? x[kind].map(v => v.id === row.id ? {...v, ...f, history: [...(v.history || []), {before: `${v.name} / ${v.primary || ''}`, after: `${f.name} / ${f.primary || ''}`, reason: f.reason, at: stamp()}]} : v) : [...x[kind], {...f, id: kind + Date.now(), active: true}]}))});
  const disable = (kind, row) => begin({title: `${row.name}を無効化`, text: '新規入力の候補から除外し、過去の名称と所属は保持します。', confirm: true,
    fields: [input('end', '終了日', 'date', null, {value: '2026-09-11'}), input('reason', '無効化理由', 'textarea')],
    save: f => setOrganization(x => ({...x, [kind]: x[kind].map(v => v.id === row.id ? {...v, active: false, ...f} : v)}))});
  return <>{['businesses', 'members'].map(kind => <Card key={kind} title={kind === 'businesses' ? '事業' : 'メンバー・所属'} subtitle="開始・終了日と名称・所属の履歴を保持します。" action={system && <button onClick={() => edit(kind)}>登録</button>}>
    <GridTable headers={['名称', '有効期間・状態', '所属・履歴', '操作']} rows={organization[kind].map(row => [row.name, <>{row.start} — {row.end || ''}<small>{row.active ? '有効' : '無効'}</small></>, <>{row.primary}<small>{row.additional?.join('、')}</small>{row.history?.map((h, i) => <small key={i}>{h.before} → {h.after} · {h.reason} · {h.at}</small>)}</>, system && row.active && <div className="row-actions"><button onClick={() => edit(kind, row)}>編集</button><button onClick={() => disable(kind, row)}>無効化</button></div>])}/>
  </Card>)}</>;
}

export function SettingsPanel({executive, system, started, setStarted, settings, setSettings, begin, go}) {
  const start = () => begin({title: '本番運用を開始する', confirm: true, text: '初期データ・受入結果の確認後に実行してください。開始後、システム担当は役員限定情報の閲覧に24時間許可が必要となり、運用開始前の状態には戻せません。この画面案では実環境は変更しません。',
    fields: [input('reviewed', '初期データと受入結果の確認', 'select', ['確認済み'])],
    save: () => {setStarted(true);setSettings(x => ({...x, startedAt: stamp(), startedBy: '経営者（サンプル）'}));}, success: '画面案を本番運用開始後の状態へ変更しました。'});
  const fiscal = () => begin({title: '会計年度の変更を申請', confirm: true, text: '開始済みの年度は変更しません。次の未開始年度から適用し、移行が必要なら短縮年度を確認します。',
    fields: [input('month', '新しい年度開始月', 'select', Array.from({length: 12}, (_, i) => `${i + 1}月`)), input('reason', '変更理由', 'textarea')],
    save: f => setSettings(x => ({...x, fiscal: {...f, state: '役員承認待ち', at: stamp()}}))});
  const restore = () => begin({title: 'バックアップからの復元を申請', confirm: true, text: '復元対象と影響を経営者が確認します。画面案では実データの復元は実行しません。',
    fields: [input('snapshot', '復元時点', 'select', ['2026/09/10 03:00（サンプル）', '2026/09/09 03:00（サンプル）']), input('reason', '復元が必要な理由', 'textarea')],
    save: f => setSettings(x => ({...x, restore: {...f, state: '役員承認待ち', at: stamp()}}))});
  return <><Card title="本番運用" subtitle="開始操作は経営者が初期データを確認してから実行します。"><Badge>{started ? '開始済み' : '開始前'}</Badge><p className="muted">{settings.startedBy} {settings.startedAt}</p>{executive && !started && <button className="primary" onClick={start}>本番運用を開始する</button>}{system && <p className="small">{started ? '役員限定情報の閲覧には一時アクセスが必要です。' : '受入確認用に全情報を閲覧できる状態です。'}</p>}</Card>
    <Card title="運用の状況" subtitle="窓口：info@mfp-design.jp / 障害の一次確認：花沢">
      <div className="check-row"><span>UPSIDER連携</span><Badge>{settings.integration ? '稼働（サンプル）' : '停止（サンプル）'}</Badge>{system && <button onClick={() => begin({title: settings.integration ? '連携を停止する' : '連携を再開する', confirm: true, text: 'この操作は画面案の表示だけを変更します。', fields: [input('reason', '変更理由', 'textarea')], save: () => setSettings(x => ({...x, integration: !x.integration}))})}>{settings.integration ? '停止を確認' : '再開を確認'}</button>}</div>
      <div className="check-row"><span>バックアップ</span><span>2026/09/10 03:00 · 正常（サンプル）</span></div><div className="check-row"><span>料金</span><span>Workers Freeで開始・課金の自動切替なし</span></div>
      {system && <div className="panel-footer"><button onClick={restore}>復元を申請</button><button onClick={() => go('access')}>一時アクセスを申請</button></div>}
      {settings.restore && <div className="notice"><div>復元：{settings.restore.snapshot}<p>理由：{settings.restore.reason}</p><Badge>{settings.restore.state}</Badge>{executive && settings.restore.state === '役員承認待ち' && <div className="row-actions"><button onClick={() => setSettings(x => ({...x, restore: {...x.restore, state: '承認済み・実施待ち'}}))}>復元を承認</button><button onClick={() => setSettings(x => ({...x, restore: {...x.restore, state: '拒否'}}))}>拒否</button></div>}</div></div>}
    </Card><Card title="会計年度" subtitle="現在の年度：2025/10/01〜2026/09/30（開始月10月）">{system && <button onClick={fiscal}>変更を申請</button>}
      {settings.fiscal && <div className="notice"><div>変更案：{settings.fiscal.month}開始<p>理由：{settings.fiscal.reason}</p><p>移行期間：2026/10/01〜{settings.fiscal.month === '10月' ? '2027/09/30（変更なし）' : new Date(Date.UTC(2026 + (Number(settings.fiscal.month.replace('月', '')) > 10 ? 0 : 1), Number(settings.fiscal.month.replace('月', '')) - 1, 0)).toISOString().slice(0, 10)}</p><Badge>{settings.fiscal.state}</Badge>{executive && settings.fiscal.state === '役員承認待ち' && <div className="row-actions"><button onClick={() => setSettings(x => ({...x, fiscal: {...x.fiscal, state: '承認済み・適用待ち'}}))}>年度変更を承認</button><button onClick={() => setSettings(x => ({...x, fiscal: {...x.fiscal, state: '拒否'}}))}>拒否</button></div>}</div></div>}
    </Card></>;
}
