import React from 'react';
import {Card, GridTable, input, yen, stamp, Badge} from './workflow-panels.jsx';

export function ProjectsPanel({projects, setProjects, executive, sensitive, members, begin}) {
  const edit = (p, index) => begin({title: p ? 'プロジェクトを更新' : '全社プロジェクトを登録', confirm: true, fields: [
    input('name', 'プロジェクト名', 'text', null, {value: p?.name}), input('due', '期限', 'date', null, {value: p?.due}), input('owner', '責任者', 'select', members, {value: p?.owner}),
    input('status', '進捗状態', 'select', executive ? ['未着手', '進行中', '要支援', '完了', '中止'] : ['未着手', '進行中', '要支援'], {value: p?.status || '未着手'}),
    ...(executive ? [input('budget', '全体の税込予算（円）', 'number', null, {value: p?.budget ?? 0})] : []), input('outcome', '成果', 'textarea', null, {value: p?.outcome, required: false}), input('problem', '課題', 'textarea', null, {value: p?.problem, required: false})],
    save: f => {const value = {...f, ...(executive ? {budget: Number(f.budget)} : {}), at: stamp()};setProjects(xs => p ? xs.map((x, i) => i === index ? {...x, ...value, history: [...(x.history || []), {status: f.status, outcome: f.outcome, problem: f.problem, at: stamp()}]} : x) : [...xs, {...value, budget: Number(f.budget || 0)}]);}});
  return <Card title="全社プロジェクト" subtitle="期限・成果・課題から支援を判断。予算と経費の消化率は連動させません。" action={<button className="primary" onClick={() => edit()}>プロジェクトを登録</button>}>
    {projects.map((p, i) => <article className="project" key={i}><div><h3>{p.name}</h3><Badge>{p.status}</Badge></div><p>{p.outcome || '成果の記録なし'}</p><p className="muted">課題：{p.problem || 'なし'}</p><div className="summary-strip"><span>期限 {p.due}</span><span>責任者 {p.owner}</span>{sensitive && <span>予算 {yen(p.budget)}</span>}</div>
      {(executive || !['完了', '中止'].includes(p.status)) && <button onClick={() => edit(p, i)}>進捗を更新</button>}
      {p.history?.length > 0 && <details><summary>更新履歴</summary><GridTable headers={['状態', '成果・課題', '日時']} rows={p.history.map(h => [h.status, `${h.outcome} / ${h.problem}`, h.at])}/></details>}
    </article>)}
  </Card>;
}
