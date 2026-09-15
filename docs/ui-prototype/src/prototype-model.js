// Pure state transitions used by the local prototype and its regression checks.
export const formatMoney = value => value == null ? '未設定' : '¥' + Number(value).toLocaleString('ja-JP');
export const addAmounts = (...values) => values.some(x => x == null) ? null : values.reduce((a, b) => a + b, 0);

export function financeTotal(finance, start, end, kind, business, businesses) {
  let total = 0;
  const [year, month] = start.slice(0, 7).split('-').map(Number);
  const cursor = new Date(Date.UTC(year, month - 1, 1));
  while (cursor.toISOString().slice(0, 7) <= end.slice(0, 7)) {
    const record = finance.find(x => x.month === cursor.toISOString().slice(0, 7));
    const value = record?.[kind];
    if (kind === 'sales' || kind === 'costs') {
      const keys = business === 'すべての事業' ? [...new Set([...businesses, ...Object.keys(value || {})])] : [business];
      if (!value || keys.some(key => !Number.isSafeInteger(value[key]))) return null;
      total += keys.reduce((sum, key) => sum + value[key], 0);
    } else {
      if (!Number.isSafeInteger(value)) return null;
      total += value;
    }
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return total;
}

export function writeFinance(finance, month, kind, key, amount, history) {
  const current = finance.find(x => x.month === month) || {month, sales: {}, costs: {}, history: []};
  const updated = {...current, ...(key ? {[kind]: {...current[kind], [key]: amount}} : {[kind]: amount}), history: [...current.history, history]};
  return [...finance.filter(x => x.month !== month), updated].sort((a, b) => a.month.localeCompare(b.month));
}

export function matchesDeal(row, deals, {business, member, stage}) {
  const deal = row.deal ? deals.find(x => x.id === row.deal) : row;
  return !row.cancelled && (business === 'すべての事業' || row.business === business)
    && (member === 'すべての担当' || (deal?.member || row.member) === member || deal?.coMembers?.includes(member))
    && (stage === 'すべての段階' || (deal?.stage || row.stage || '成約') === stage);
}

export function relinkAccounts(deals, fromId, target, reason, at, actor) {
  return deals.map(deal => deal.accountId !== fromId ? deal : {
    ...deal, accountId: target.id, account: target.name,
    originalAccountId: deal.originalAccountId || fromId,
    accountHistory: [...(deal.accountHistory || []), {before: `${fromId} / ${deal.account}`, after: `${target.id} / ${target.name}`, reason, at, actor}],
  });
}

export const validPeriod = (start, end) => Boolean(start) && (!end || end >= start);

export function memberMemberships(row, values, businesses) {
  return [values.primary, ...(values.additional || [])].filter(Boolean).map((name, i) => {
    const business = businesses.find(x => x.name === name);
    const previous = row?.memberships?.find(x => x.businessId === business.id);
    return {businessId: business.id, kind: i === 0 ? '主所属' : '兼務', start: previous?.start || values.start, end: previous?.end ?? (values.end || '')};
  });
}

export function membershipError(member) {
  if (!validPeriod(member.start, member.end)) return '終了日は開始日以降にしてください。';
  const memberships = member.memberships || [];
  if (memberships.filter(x => x.kind === '主所属').length !== 1) return '主所属を一つ選択してください。';
  if (new Set(memberships.map(x => x.businessId)).size !== memberships.length) return '主所属と兼務先は別の事業を選択してください。';
  for (const row of memberships) {
    if (!validPeriod(row.start, row.end)) return '所属の終了日は開始日以降にしてください。';
    if (row.start < member.start || (member.end && (!row.end || row.end > member.end))) return '所属期間はメンバーの在籍期間内にしてください。先に所属期間を確認してください。';
  }
  return null;
}

export function describeOrganization(row, businesses) {
  const membership = (row.memberships || []).map(x => `${x.kind}：${businesses.find(b => b.id === x.businessId)?.name || x.businessId}（${x.start}〜${x.end || '終了未定'}）`);
  return `${row.name} / ${row.start}〜${row.end || '終了未定'} / ${row.active ? '有効' : '無効'}${membership.length ? ' / ' + membership.join('、') : ''}`;
}
