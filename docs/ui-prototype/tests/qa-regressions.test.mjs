import test from 'node:test';
import assert from 'node:assert/strict';
import {businesses, seedDeals} from '../src/data.js';
import {financeTotal, writeFinance, addAmounts, formatMoney, matchesDeal, relinkAccounts, memberMemberships, membershipError, validPeriod, describeOrganization} from '../src/prototype-model.js';

test('未設定月・項目を部分合計や0円にせず、登録済み0円は金額として扱う', () => {
  const finance = ['2026-07', '2026-08', '2026-09'].map(month => ({month, payroll: 250000, sales: {FP事業: 700000, MoneRun: 0}}));
  assert.equal(financeTotal(finance, '2026-07-01', '2026-09-30', 'payroll'), 750000);
  assert.equal(financeTotal(finance, '2026-06-01', '2026-09-30', 'payroll'), null);
  assert.equal(financeTotal(finance, '2025-09-01', '2025-09-30', 'payroll'), null);
  assert.equal(financeTotal(finance, '2026-09-01', '2026-09-10', 'sales', 'MoneRun', []), 0);
  assert.equal(financeTotal(finance, '2026-09-01', '2026-09-30', 'sales', 'すべての事業', ['FP事業', 'MoneRun', '日本デザイン']), null);
  assert.equal(addAmounts(100000, null), null);
  assert.equal(formatMoney(null), '未設定');
  assert.equal(formatMoney(0), '¥0');
});

test('存在しない月の一項目だけを登録でき、他項目は未設定のまま履歴を保つ', () => {
  const original = [];
  const saved = writeFinance(original, '2025-09', 'sales', 'FP事業', 0, {before: null, after: 0, reason: '目標なし'});
  const edited = writeFinance(saved, '2025-09', 'sales', 'FP事業', 100000, {before: 0, after: 100000, reason: '目標変更'});
  assert.deepEqual(original, []);
  assert.equal(saved[0].sales.FP事業, 0);
  assert.equal(edited.length, 1);
  assert.equal(edited[0].history.length, 2);
  assert.equal(edited[0].sales.FP事業, 100000);
  assert.equal(financeTotal(edited, '2025-09-01', '2025-09-30', 'payroll'), null);
});

test('共同担当を含む案件・売上予定・実績・残高に同じ担当条件を適用し二重計上しない', () => {
  const deals = [
    {id: 'D-1', business: 'MoneRun', member: '担当B', stage: '成約', amount: 400000},
    {id: 'D-2', business: 'FP事業', member: '担当A', coMembers: ['担当B', '担当C'], stage: '見込み', amount: 120000},
  ];
  const filters = {business: 'すべての事業', member: '担当B', stage: 'すべての段階'};
  assert.equal(deals.filter(d => matchesDeal(d, deals, filters)).reduce((sum, d) => sum + d.amount, 0), 520000);
  const revenue = {deal: 'D-2', member: '担当A', business: 'FP事業', amount: 120000};
  assert.equal(matchesDeal(revenue, deals, filters), true);
  assert.equal(matchesDeal(revenue, deals, {...filters, business: 'MoneRun'}), false);
  assert.equal(matchesDeal(revenue, deals, {...filters, stage: '成約'}), false);
  deals[1].member = '担当B';
  assert.equal(deals.filter(d => matchesDeal(d, deals, filters)).length, 2);
  deals[1].coMembers = [];
  assert.equal(matchesDeal(revenue, deals, {...filters, member: '担当A'}), false);
});

test('同名の別取引先の統合は元の既存案件へ影響せず、参照先編集もIDだけで反映', () => {
  assert.ok(seedDeals.every(x => x.accountId));
  const moved = relinkAccounts(seedDeals, 'A-new', {id: 'A-002', name: 'サンプル企画'}, '新規だけ統合', 'now', '総務');
  assert.deepEqual(moved, seedDeals);
  const all = [...seedDeals, {id: 'D-new', accountId: 'A-new', account: 'サンプル商事'}];
  const result = relinkAccounts(all, 'A-new', {id: 'A-002', name: 'サンプル企画'}, '新規だけ統合', 'now', '総務');
  assert.equal(result.find(x => x.id === 'D-001').accountId, 'A-001');
  assert.equal(result.at(-1).accountId, 'A-002');
  assert.equal(result.at(-1).accountHistory[0].before, 'A-new / サンプル商事');
  const renamed = relinkAccounts(result, 'A-002', {id: 'A-002', name: '新しい名称'}, '名称訂正', 'later', '総務');
  assert.equal(renamed.at(-1).originalAccountId, 'A-new');
  assert.equal(renamed.at(-1).accountHistory.length, 2);
  assert.equal(all.at(-1).account, 'サンプル商事');
});

test('事業・所属の期間逆転、在籍期間外、主所属と兼務重複を拒否', () => {
  assert.equal(validPeriod('2025-10-01', '2025-09-30'), false);
  assert.equal(validPeriod('2025-10-01', '2025-10-01'), true);
  const member = {start: '2025-10-01', end: '', memberships: [{businessId: 'B-1', kind: '主所属', start: '2025-10-01', end: ''}]};
  assert.equal(membershipError(member), null);
  assert.match(membershipError({...member, memberships: [{...member.memberships[0], end: '2025-09-30'}]}), /所属の終了日/);
  assert.match(membershipError({...member, start: '2026-01-01'}), /在籍期間/);
  assert.match(membershipError({...member, memberships: [...member.memberships, {...member.memberships[0], kind: '兼務'}]}), /別の事業/);
});

test('兼務追加でも既存の所属期間を保持し、主所属・兼務・期間の前後値を説明できる', () => {
  const businesses = [{id: 'B-1', name: 'MoneRun'}, {id: 'B-2', name: 'FP事業'}, {id: 'B-3', name: '企業研修'}];
  const old = {name: '担当B', active: true, start: '2025-10-01', end: '', memberships: [{businessId: 'B-1', kind: '主所属', start: '2025-11-01', end: ''}]};
  const next = {...old, memberships: memberMemberships(old, {...old, primary: 'MoneRun', additional: ['FP事業', '企業研修']}, businesses)};
  assert.equal(next.memberships.length, 3);
  assert.equal(next.memberships[0].start, '2025-11-01');
  next.memberships[1].start = '2026-09-01';
  next.memberships[1].end = '2026-09-30';
  assert.equal(membershipError(next), null);
  assert.equal(old.memberships.length, 1);
  assert.match(describeOrganization(next, businesses), /兼務：FP事業（2026-09-01〜2026-09-30）/);
  assert.match(describeOrganization(next, businesses), /兼務：企業研修/);
  assert.notEqual(describeOrganization(old, businesses), describeOrganization(next, businesses));
});

test('画面案の事業に日本デザインが指定順で入り、全社共通は事業として重複登録しない', () => {
  assert.deepEqual(businesses, ['FP事業', 'MoneRun', 'Agerun', '自社不動産事業', '日本デザイン', '日本酒', 'トラストサロン', 'ビルメンテナンス', '企業研修']);
});
