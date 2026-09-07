"""Independent arithmetic checks for CORE03; not production code or integration tests."""
import calendar
import json
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent

def month_shift(y, m, n):
    k = y * 12 + m - 1 + n
    return k // 12, k % 12 + 1

def period(v):
    y, m = map(int, v['month'].split('-'))
    kind = v['kind']
    if kind == 'ten_days':
        start = date(y, m, [1, 11, 21][v['part'] - 1])
        end = date(y, m, [10, 20, calendar.monthrange(y, m)[1]][v['part'] - 1])
    else:
        sy, sm = month_shift(y, m, 1 - v['months'])
        start, end = date(sy, sm, 1), date(y, m, calendar.monthrange(y, m)[1])
    return [start.isoformat(), end.isoformat()]

def previous(v):
    start, end = map(date.fromisoformat, v['period'])
    if v['kind'] == 'month':
        assert start.day == 1 and end == date(start.year, start.month, calendar.monthrange(start.year, start.month)[1])
        y, m = month_shift(start.year, start.month, -1)
        return [date(y, m, 1).isoformat(), date(y, m, calendar.monthrange(y, m)[1]).isoformat()]
    if v['kind'] == 'ten_days':
        assert start.year == end.year and start.month == end.month
        assert (start.day, end.day) in [(1, 10), (11, 20), (21, calendar.monthrange(start.year, start.month)[1])]
        if start.day == 1:
            y, m = month_shift(start.year, start.month, -1)
            lo, hi = date(y, m, 21), date(y, m, calendar.monthrange(y, m)[1])
        elif start.day == 11:
            lo, hi = start.replace(day=1), start.replace(day=10)
        else:
            lo, hi = start.replace(day=11), start.replace(day=20)
        return [lo.isoformat(), hi.isoformat()]
    if v['kind'] in ['months', 'fiscal']:
        assert start.day == 1 and end.day == calendar.monthrange(end.year,end.month)[1]
        months=(end.year-start.year)*12+end.month-start.month+1
        assert 1<=months<=12
        y,m=month_shift(start.year,start.month,-months)
        return [date(y,m,1).isoformat(),(start-timedelta(days=1)).isoformat()]
    raise ValueError(v['kind'])


def actual_sum(rows, kind, start, end):
    # IDs identify one canonical record, irrespective of retry/JOIN duplication.
    selected = {r['id']: r for r in rows if r['kind'] == kind and r.get('actual', True)}
    return sum(r['amount'] for r in selected.values() if start <= r['date'] <= end)

def ledger(v):
    rows = v['rows']; start, end = v['period']
    vals = {k: actual_sum(rows, k, start, end) for k in ['sale', 'invoice', 'receipt']}
    totals = {k: actual_sum(rows, k, '0001-01-01', end) for k in vals}
    vals.update(unbilled=totals['sale']-totals['invoice'], unpaid=totals['invoice']-totals['receipt'])
    return vals

def forecast(v):
    end=v['period'][1]; start=v['period'][0]
    snapshots={}
    for d in sorted(v['versions'],key=lambda x:x['at']):
        if d['at'] <= end: snapshots[d['id']]=d
    chosen=[d for d in snapshots.values() if not d.get('cancelled') and (not v.get('business') or d['business']==v['business']) and (not v.get('members') or set(v['members']) & set(d['owners'])) and (not v.get('stage') or d['stage']==v['stage'])]
    prospect=sum(p['amount'] for d in chosen if d['stage'] in ['lead','approach','proposal','negotiation'] for p in d['plans'] if start <= p['date'] <= end)
    actual=actual_sum([r for r in v.get('sales',[]) if r['deal'] in {d['id'] for d in chosen}], 'sale', start, end)
    recognized={(r['deal'],r['plan']) for r in v.get('sales',[]) if r['kind']=='sale' and r.get('actual',True) and r['date']<=end}
    pending=sum(p['amount'] for d in chosen if d['stage']=='won' for p in {p['id']:p for p in d['plans']}.values() if start<=p['date']<=end and (d['id'],p['id']) not in recognized)
    return dict(count=len(chosen),amount=sum(d['amount'] for d in chosen),forecast=prospect,sales=actual,confirmed=actual+pending,landing=actual+pending+prospect,ids=sorted(d['id'] for d in chosen))

def profit(v):
    exp=dict.fromkeys(v['sales'],0); common=unclassified=review=0
    for e in {r['id']:r for r in v['expenses']}.values():
        if e['target']=='common': common+=e['amount']
        elif e['target']=='unclassified':unclassified+=e['amount']
        else:exp[e['target']]+=e['amount']
        if e.get('review'):review+=e['amount']
    profits={k:v['sales'][k]-exp[k] for k in exp}
    return dict(business_profit=profits,common=common,unclassified=unclassified,expense_total=sum(exp.values())+common+unclassified,company_profit=sum(profits.values())-common-unclassified-v['labor'],review=review)

def guards(v):
    action=v['action']
    if action=='invoice':return v['existing']+v['add']<=v['sales']
    if action=='receipt':return v['existing']+v['add']<=v['invoiced']
    if action=='plan_total':return sum(v['invoices'])==v['sales']==sum(v['receipts'])
    if action=='change_mode':return not v['has_actual'] and v['confirmed']
    if action=='won':
        if not v['plans']:return dict(allowed=True,created=[v['amount']],gap=0)
        gap=v['amount']-sum(v['plans']);return dict(allowed=gap==0,created=[],gap=gap)
    if action=='reopen':return bool(v['reason'].strip())
    if action=='lost':return not v['active_sales']
    if action=='same_business':return v['deal_business']==v['sale_business']
    if action=='close':return v['role']=='executive' and v['reconciled'] and v['pending']==0 and v['unclassified']==0
    if action=='edit_closed':return False
    if action=='yen':return type(v['amount']) is int and v['amount']>=0 and v['currency']=='JPY'
    raise ValueError(action)

def adjust(v):
    rows=list(v['rows'])
    rows.append(dict(id='adjustment',kind='expense',date=v['effective'],amount=v['delta']))
    return {m:actual_sum(rows,'expense',m+'-01',m+'-31') for m in v['months']}

def budgets(v):
    if v.get('member') or v.get('stage'):return dict(values=None,reason='filter_not_applicable')
    months=v['months']; latest={}
    for x in sorted(v['rows'],key=lambda x:x['version']):
        if x['month'] in months: latest[(x['month'],x['kind'])]=x['amount']
    values={k:sum(latest[(m,k)] for m in months) if all((m,k) in latest for m in months) else None for k in ['sales','business_expense','common','labor']}
    return dict(values=values,mode='monthly_reference' if v.get('partial') else 'period_budget',variance=None if v.get('partial') else {k:None if b is None else v['actual'][k]-b for k,b in values.items()})

def access(v):
    if not v['active']:return []
    regular=['sales','expenses','common']; restricted=['budget','profit','labor']
    if v['role']=='executive':return regular+restricted+['comments']
    if v['role']=='admin':return regular
    if v['role']=='system' and (not v['production'] or (not v.get('revoked',False) and v.get('grant_start','9999')<=v['now']<v.get('grant_end','0000'))):return regular+restricted
    return []

def next_actions(v):
    start,end=v['period']; selected=[];undated=[];overdue=[]
    for a in v['rows']:
        if a['kind']=='undated':undated.append(a['id']);continue
        lo=a.get('start',a['end']);hi=a['end']
        if lo<=end and hi>=start:selected.append(a['id'])
        if a['status']=='todo' and hi<v['today']:overdue.append(a['id'])
    return dict(selected=selected,undated=undated,overdue=overdue)

def fiscal(v):
    rows=v['years']
    return dict(contiguous=all(date.fromisoformat(a['end'])+timedelta(days=1)==date.fromisoformat(b['start']) for a,b in zip(rows,rows[1:])),year=[r['id'] for r in rows if r['start']<=v['date']<=r['end']][0])

def events(v):
    start,end=v['period']; rows={r['id']:r for r in v['rows'] if start<=r['date']<=end}
    return dict(ids=sorted(rows),amount_delta=sum(r.get('delta',0) for r in rows.values()),categories=sorted({c for r in rows.values() for c in r['categories']}))

def run(c):
    v=c['input'];op=c['operation']
    handlers=dict(period=period,previous=previous,ledger=ledger,forecast=forecast,profit=profit,guard=guards,adjust=adjust,budgets=budgets,access=access,next_actions=next_actions,fiscal=fiscal,events=events)
    if op=='expense_period':
        start,end=v['period']; rows={x['id']:x for x in v['rows'] if x.get('actual',True) and start<=x['date']<=end}
        parts={k:sum(x['amount'] for x in rows.values() if x['target']==k) for k in ['A','common','unclassified']}
        return dict(by_target=parts,total=sum(parts.values()),labor_included=False)
    if op=='jst_date':return datetime.fromisoformat(v).astimezone(timezone(timedelta(hours=9))).date().isoformat()
    if op=='late':return dict(old_profit=v['sales']-v['old_expense'],current_profit=v['sales']-v['old_expense']-v['late_expense'],state='reclose_pending',expense_month=v['use_date'][:7],old_version_preserved=True)
    if op=='deadline':return dict(overdue=v['today']>v['target'],auto_close=False,auto_stop=False)
    return handlers[op](v)

if __name__=='__main__':
    cases=json.loads((ROOT/'cases.json').read_text())['cases'];results=[]
    for c in cases:
        actual=run(c)
        assert actual==c['expected'],f"{c['id']} {c['name']}: expected {c['expected']!r}, got {actual!r}"
        results.append(f"| {c['id']} | {c['name']} | PASS |")
    text='# 検算結果\n\n2026-09-07 / Codex / Python標準ライブラリ。固定期待値を独立計算と照合。\n\n'
    text+=f'{len(cases)}ケース全件PASS。業務確認・本番実装テスト・DB権限テスト・Slack実通知PoCの完了を意味しない。\n\n'
    text+='| ID | 内容 | 結果 |\n|---|---|---|\n'+'\n'.join(results)+'\n'
    (ROOT/'results.md').write_text(text)
    print(f'{len(cases)} cases passed')
