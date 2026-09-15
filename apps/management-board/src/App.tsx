import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router';
import { validateInput } from '../shared/contracts.ts';
import type { ConnectionStatus, FieldErrors, InputValues, SampleExpense } from '../shared/contracts.ts';
import { requestApi, RequestFailure } from './api.ts';

function ErrorNotice({ error, retry }: { error: RequestFailure; retry?: () => void }) {
  return <div className="error-notice" role="alert"><p>{error.message}</p>{error.requestId && <small>お問い合わせ用ID：{error.requestId}</small>}{retry && <button onClick={retry}>再読み込み</button>}</div>;
}

function useApi<T>(path: string) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<RequestFailure>();
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setData(undefined); setError(undefined);
    void requestApi<T>(path, { signal: controller.signal }).then(value => {
      if (!controller.signal.aborted) setData(value);
    }).catch((reason: unknown) => {
      if (!controller.signal.aborted) setError(reason instanceof RequestFailure ? reason : new RequestFailure('読み込みに失敗しました。'));
    });
    return () => controller.abort();
  }, [path, revision]);
  return { data, error, retry: () => setRevision(value => value + 1) };
}

function PageHeading({ title, children }: { title: string; children: ReactNode }) {
  return <header className="page-heading"><p className="eyebrow">AT THE TOP · MANAGEMENT BOARD</p><h1>{title}</h1><p>{children}</p></header>;
}

function Home() {
  const { data, error, retry } = useApi<{ items: SampleExpense[]; synthetic: true }>('/api/sample/expenses');
  return <><PageHeading title="経営管理ボード">新しいアプリの土台を確認する画面です。業務データの入力は、準備が整ってから利用できます。</PageHeading>
    <section className="intro-panel"><div><span className="badge">ローカル開発</span><h2>画面とサーバーをつなぐ基盤</h2><p>画面の切り替え、入力内容の確認、接続状況を試せます。</p></div><Link className="primary button" to="/input-check">入力を試す <span aria-hidden="true">→</span></Link></section>
    <section className="panel" aria-labelledby="sample-heading"><div className="panel-heading"><div><h2 id="sample-heading">経費のサンプル</h2><p>サーバーから取得した架空の明細です。実際の決済ではありません。</p></div><span className="badge neutral">閲覧のみ</span></div>
      {error ? <ErrorNotice error={error} retry={retry} /> : !data ? <p role="status">読み込んでいます…</p> : <div className="table-scroll" role="region" aria-label="経費サンプル一覧" tabIndex={0}><table><caption className="sr-only">APIから取得した架空の経費3件</caption><thead><tr><th scope="col">利用日</th><th scope="col">内容</th><th scope="col">対象事業</th><th scope="col" className="amount">金額（税込）</th></tr></thead><tbody>{data.items.map(item => <tr key={item.id}><td>{item.date}</td><td>{item.description}</td><td>{item.business}</td><td className="amount">{item.amountYen.toLocaleString('ja-JP')}円</td></tr>)}</tbody></table></div>}
    </section>
    <div className="next-grid"><section className="panel"><p className="eyebrow">次の実装</p><h2>入力を保存できるように</h2><p>変更履歴と同時編集の制御を整えた後、目標・売上・経費の入力機能を追加します。</p></section><section className="panel"><p className="eyebrow">今回確認できること</p><h2>入力と接続の動作</h2><p>入力エラーの表示や、未設定の連携を正しく区別できることを確認します。</p><Link to="/settings">接続状況を確認する →</Link></section></div>
  </>;
}

function InputCheck() {
  const [description, setDescription] = useState('サンプル：打ち合わせ資料');
  const [fields, setFields] = useState<FieldErrors>({});
  const [error, setError] = useState<RequestFailure>();
  const [result, setResult] = useState<InputValues & { persisted: false }>();
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null);
  async function submit(event: FormEvent) {
    event.preventDefault(); setResult(undefined); setError(undefined);
    const validated = validateInput({ description });
    if (!validated.valid) { setFields(validated.fields); input.current?.focus(); return; }
    setFields({}); setBusy(true);
    try { setResult(await requestApi<InputValues & { persisted: false }>('/api/sample/validate', { method: 'POST', body: JSON.stringify(validated.value) })); }
    catch (reason) { const failure = reason instanceof RequestFailure ? reason : new RequestFailure('確認に失敗しました。'); setError(failure); setFields(failure.fields ?? {}); }
    finally { setBusy(false); }
  }
  return <><PageHeading title="入力確認">入力内容をサーバーで確認します。ここで送った内容は保存されません。</PageHeading>
    <section className="panel form-panel"><h2>内容を試しに入力する</h2><p>架空の内容でお試しください。</p><form onSubmit={event => void submit(event)} noValidate>
      <label htmlFor="description">内容 <span className="required">必須</span></label>
      <textarea ref={input} id="description" rows={4} value={description} onChange={event => { setDescription(event.target.value); setResult(undefined); setError(undefined); setFields({}); }} aria-invalid={Boolean(fields.description)} aria-describedby={fields.description ? 'description-hint description-error' : 'description-hint'} disabled={busy} />
      <p id="description-hint" className="hint">120文字以内。前後の空白を除いて確認します。</p>{fields.description && <p id="description-error" className="field-error">{fields.description}</p>}
      <button className="primary" disabled={busy} type="submit">{busy ? '確認中…' : '入力内容を確認する'}</button>
    </form>{error && <ErrorNotice error={error} />}{result && <div className="confirmation" role="status"><h3>入力内容を確認しました</h3><p className="user-text">{result.description}</p><small>確認のみ完了しました。データは保存していません。</small></div>}</section>
  </>;
}

function Settings() {
  const { data, error, retry } = useApi<ConnectionStatus>('/api/status');
  return <><PageHeading title="接続状況">このローカル開発環境の状態です。Slackの経費検証とは別の環境です。</PageHeading>
    {error ? <ErrorNotice error={error} retry={retry} /> : !data ? <p role="status">接続を確認しています…</p> : <section className="panel"><h2>現在の状態</h2><dl className="connection-list"><div><dt>データベース</dt><dd><span className="badge">接続済み</span><small>ローカルのD1。業務用のテーブルは次の実装で作成します。</small></dd></div><div><dt>Googleログイン</dt><dd><span className="badge neutral">準備中</span><small>認証と権限の実装後に利用できます。</small></dd></div><div><dt>Slack・メール</dt><dd><span className="badge neutral">未設定</span><small>このアプリから通知は送りません。</small></dd></div><div><dt>月次締め</dt><dd><span className="badge neutral">利用不可</span><small>認証・データ保存・経費照合の準備が必要です。</small></dd></div></dl></section>}
    <p className="support">システムの連絡先：info@mfp-design.jp</p></>;
}

export function App() {
  const location = useLocation();
  const main = useRef<HTMLElement>(null);
  const previousPath = useRef(location.pathname);
  useEffect(() => { if (previousPath.current !== location.pathname) main.current?.focus(); previousPath.current = location.pathname; }, [location.pathname]);
  return <><a className="skip-link" href="#main">本文へ移動</a><div className="app-shell"><aside><Link className="brand" to="/"><span className="brand-mark" aria-hidden="true">A</span><span>ATT<small>経営管理ボード</small></span></Link><nav aria-label="メインメニュー"><NavLink end to="/">ホーム</NavLink><NavLink to="/input-check">入力確認</NavLink><NavLink to="/settings">接続状況</NavLink></nav><div className="sidebar-note"><span className="status-dot" /> ローカル開発<small>実データは使用していません</small></div></aside><main id="main" ref={main} tabIndex={-1}><Routes><Route path="/" element={<Home />} /><Route path="/input-check" element={<InputCheck />} /><Route path="/settings" element={<Settings />} /><Route path="*" element={<><PageHeading title="ページが見つかりません">URLをご確認ください。</PageHeading><Link className="button" to="/">ホームへ戻る</Link></>} /></Routes><footer>ATT MANAGEMENT BOARD <span>開発環境 · #14</span></footer></main></div></>;
}
