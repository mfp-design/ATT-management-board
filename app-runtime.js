/* SFA Tool — app runtime.
 * This file is BOTH the browser app AND, via Node (see build.js), the
 * generator of the initial index.html. That guarantees the head markup and
 * the script tag this page republishes to itself (via the `artifact`
 * capability) are byte-identical to how the page was originally authored —
 * no live-DOM serialization involved.
 */
(function () {
  'use strict';

  /* ============================== DOC HEAD ============================== */
  var DOC_HEAD = '<head>\n' +
    '<meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>ATT 経営管理</title>\n' +
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
    '<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Zen+Kaku+Gothic+New:wght@500;700&display=swap" rel="stylesheet">\n' +
    '<style>\n' + CSS_TEXT() + '\n</style>\n' +
    '</head>';

  function CSS_TEXT() {
    return [
'*, *::before, *::after { box-sizing: border-box; }',
'html, body { margin: 0; padding: 0; }',
'body { min-height: 100vh; }',
'ul, ol { margin: 0; padding: 0; list-style: none; }',
'button { font: inherit; color: inherit; }',
'input, select, textarea { font: inherit; color: inherit; }',
'h1, h2, h3, p { margin: 0; }',
'a { color: inherit; }',
'',
':root {',
'  color-scheme: light;',
'  --page-bg: #F6F7FB;',
'  --surface: #FFFFFF;',
'  --surface-alt: #EEF0F8;',
'  --surface-sunken: #E7E9F4;',
'  --border: #DBDFEE;',
'  --border-strong: #C3C9E3;',
'  --text: #171B2E;',
'  --text-secondary: #565D7C;',
'  --text-muted: #8A8FAA;',
'  --sidebar-bg: #161C33;',
'  --sidebar-bg-active: #232C52;',
'  --sidebar-text: #B9BFDD;',
'  --sidebar-text-active: #FFFFFF;',
'  --sidebar-border: #262E52;',
'  --accent: #33436B;',
'  --accent-hover: #283555;',
'  --accent-contrast: #FFFFFF;',
'  --focus-ring: #7C97D6;',
'  --danger: #C1301F;',
'  --danger-bg: #FBEAE7;',
'  --danger-text: #A32A1B;',
'  --warning: #8A5A00;',
'  --warning-bg: #FDF1DC;',
'  --good: #0C7A32;',
'  --good-bg: #E5F5EA;',
'  --serious: #A2431B;',
'  --serious-bg: #FBEAE0;',
'  --stage-lead: #2A78D6; --stage-lead-bg: #E7F0FB;',
'  --stage-approach: #4A3AA7; --stage-approach-bg: #ECE8F8;',
'  --stage-proposal: #C24B18; --stage-proposal-bg: #FBEAE1;',
'  --stage-negotiation: #93610A; --stage-negotiation-bg: #FBF0DA;',
'  --stage-won: #0C7A32; --stage-won-bg: #E5F5EA;',
'  --stage-lost: #6B7089; --stage-lost-bg: #ECEDF4;',
'  --biz-1: #2A78D6; --biz-2: #EB6834; --biz-3: #1BAF7A; --biz-4: #B8830A; --biz-5: #C2568A; --biz-6: #1F8A1F; --biz-7: #4A3AA7; --biz-8: #C4433F;',
'  --shadow-sm: 0 1px 2px rgba(23,27,46,0.07), 0 1px 1px rgba(23,27,46,0.04);',
'  --shadow-md: 0 12px 28px rgba(23,27,46,0.14), 0 2px 8px rgba(23,27,46,0.08);',
'  --radius-sm: 6px; --radius-md: 10px; --radius-lg: 14px;',
'}',
'@media (prefers-color-scheme: dark) {',
'  :root:not([data-theme="light"]) {',
'    color-scheme: dark;',
'    --page-bg: #0E1220;',
'    --surface: #171C30;',
'    --surface-alt: #1E2438;',
'    --surface-sunken: #131728;',
'    --border: #2B3153;',
'    --border-strong: #3B4270;',
'    --text: #E8EAF6;',
'    --text-secondary: #AEB4D4;',
'    --text-muted: #7C82A6;',
'    --sidebar-bg: #0B0E1C;',
'    --sidebar-bg-active: #1D2547;',
'    --sidebar-text: #A6ACD0;',
'    --sidebar-text-active: #FFFFFF;',
'    --sidebar-border: #1E2547;',
'    --accent: #5977B0;',
'    --accent-hover: #6E8AC0;',
'    --accent-contrast: #0B0E1C;',
'    --focus-ring: #7C97D6;',
'    --danger: #E8836F;',
'    --danger-bg: #3A2020;',
'    --danger-text: #F3AE9E;',
'    --warning: #E3B23C;',
'    --warning-bg: #3A2E10;',
'    --good: #4FCB7C;',
'    --good-bg: #12301C;',
'    --serious: #E8916A;',
'    --serious-bg: #3A2416;',
'    --stage-lead: #6FA3E8; --stage-lead-bg: #17263F;',
'    --stage-approach: #9C8CE8; --stage-approach-bg: #241E42;',
'    --stage-proposal: #E88B5B; --stage-proposal-bg: #3A2416;',
'    --stage-negotiation: #E3B23C; --stage-negotiation-bg: #362A10;',
'    --stage-won: #4FCB7C; --stage-won-bg: #12301C;',
'    --stage-lost: #9298B8; --stage-lost-bg: #232742;',
'    --biz-1: #3987E5; --biz-2: #D9752E; --biz-3: #2DBE8B; --biz-4: #D9A438; --biz-5: #E080AC; --biz-6: #3FB23F; --biz-7: #9C8CE8; --biz-8: #E67A73;',
'    --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);',
'    --shadow-md: 0 16px 32px rgba(0,0,0,0.45);',
'  }',
'}',
':root[data-theme="dark"] {',
'  color-scheme: dark;',
'  --page-bg: #0E1220; --surface: #171C30; --surface-alt: #1E2438; --surface-sunken: #131728;',
'  --border: #2B3153; --border-strong: #3B4270;',
'  --text: #E8EAF6; --text-secondary: #AEB4D4; --text-muted: #7C82A6;',
'  --sidebar-bg: #0B0E1C; --sidebar-bg-active: #1D2547; --sidebar-text: #A6ACD0; --sidebar-text-active: #FFFFFF; --sidebar-border: #1E2547;',
'  --accent: #5977B0; --accent-hover: #6E8AC0; --accent-contrast: #0B0E1C; --focus-ring: #7C97D6;',
'  --danger: #E8836F; --danger-bg: #3A2020; --danger-text: #F3AE9E;',
'  --warning: #E3B23C; --warning-bg: #3A2E10;',
'  --good: #4FCB7C; --good-bg: #12301C;',
'  --serious: #E8916A; --serious-bg: #3A2416;',
'  --stage-lead: #6FA3E8; --stage-lead-bg: #17263F;',
'  --stage-approach: #9C8CE8; --stage-approach-bg: #241E42;',
'  --stage-proposal: #E88B5B; --stage-proposal-bg: #3A2416;',
'  --stage-negotiation: #E3B23C; --stage-negotiation-bg: #362A10;',
'  --stage-won: #4FCB7C; --stage-won-bg: #12301C;',
'  --stage-lost: #9298B8; --stage-lost-bg: #232742;',
'  --biz-1: #3987E5; --biz-2: #D9752E; --biz-3: #2DBE8B; --biz-4: #D9A438; --biz-5: #E080AC; --biz-6: #3FB23F; --biz-7: #9C8CE8; --biz-8: #E67A73;',
'  --shadow-sm: 0 1px 2px rgba(0,0,0,0.3); --shadow-md: 0 16px 32px rgba(0,0,0,0.45);',
'}',
'',
'body {',
'  background: var(--page-bg);',
'  color: var(--text);',
'  font-family: "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic", sans-serif;',
'  font-size: 14px;',
'  line-height: 1.6;',
'  -webkit-font-smoothing: antialiased;',
'}',
'.app-shell { display: flex; min-height: 100vh; }',
'',
'/* ---------- sidebar ---------- */',
'.sidebar {',
'  width: 232px; flex: 0 0 232px; background: var(--sidebar-bg); color: var(--sidebar-text);',
'  display: flex; flex-direction: column; padding: 20px 14px; gap: 4px;',
'  border-right: 1px solid var(--sidebar-border); position: sticky; top: 0; height: 100vh;',
'}',
'.brand { display: flex; align-items: center; gap: 10px; padding: 6px 10px 20px; }',
'.brand-mark {',
'  width: 34px; height: 34px; border-radius: 9px; background: linear-gradient(155deg, #4A6FA5, #2A3B63);',
'  display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700;',
'  font-family: "Zen Kaku Gothic New", sans-serif; font-size: 15px; flex: 0 0 auto;',
'}',
'.brand-name { font-family: "Zen Kaku Gothic New", sans-serif; font-weight: 700; font-size: 15px; color: #fff; line-height: 1.3; }',
'.brand-sub { font-size: 11px; color: var(--sidebar-text); opacity: .8; }',
'.nav-item {',
'  display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px;',
'  cursor: pointer; font-size: 13.5px; font-weight: 500; color: var(--sidebar-text); user-select: none;',
'}',
'.nav-item:hover { background: rgba(255,255,255,0.06); color: var(--sidebar-text-active); }',
'.nav-item.active { background: var(--sidebar-bg-active); color: var(--sidebar-text-active); }',
'.nav-icon { width: 18px; height: 18px; flex: 0 0 auto; opacity: .9; }',
'.sidebar-spacer { flex: 1; }',
'.sync-box { margin-top: 12px; padding: 12px; border-radius: 10px; background: rgba(255,255,255,0.05); font-size: 12px; color: var(--sidebar-text); }',
'.sync-row { display: flex; align-items: center; gap: 7px; }',
'.sync-dot { width: 7px; height: 7px; border-radius: 50%; background: #4FCB7C; flex: 0 0 auto; }',
'.sync-dot.saving { background: #E3B23C; animation: pulse 1s infinite ease-in-out; }',
'.sync-dot.readonly { background: #E8836F; }',
'@keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:.4;} }',
'.sync-meta { margin-top: 3px; color: var(--sidebar-text); opacity: .65; font-size: 11px; }',
'',
'/* ---------- main ---------- */',
'.main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; }',
'.topbar {',
'  display: flex; align-items: center; justify-content: space-between; gap: 16px;',
'  padding: 22px 32px 18px; flex-wrap: wrap;',
'}',
'.page-title { font-family: "Zen Kaku Gothic New", sans-serif; font-weight: 700; font-size: 21px; letter-spacing: .01em; }',
'.page-sub { color: var(--text-secondary); font-size: 12.5px; margin-top: 3px; }',
'.topbar-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }',
'.content { padding: 0 32px 40px; flex: 1; }',
'',
'/* ---------- buttons ---------- */',
'.btn {',
'  display: inline-flex; align-items: center; gap: 7px; border: 1px solid var(--border-strong);',
'  background: var(--surface); color: var(--text); padding: 9px 15px; border-radius: 8px;',
'  font-size: 13px; font-weight: 500; cursor: pointer; white-space: nowrap; transition: background .12s, border-color .12s;',
'}',
'.btn:hover { background: var(--surface-alt); }',
'.btn:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 1px; }',
'.btn-primary { background: var(--accent); border-color: var(--accent); color: var(--accent-contrast); }',
'.btn-primary:hover { background: var(--accent-hover); border-color: var(--accent-hover); }',
'.btn-danger { background: transparent; border-color: var(--border-strong); color: var(--danger-text); }',
'.btn-danger:hover { background: var(--danger-bg); border-color: var(--danger); }',
'.btn-ghost { background: transparent; border-color: transparent; padding: 6px 8px; }',
'.btn-ghost:hover { background: var(--surface-alt); }',
'.btn-sm { padding: 6px 11px; font-size: 12.5px; }',
'.btn[disabled] { opacity: .5; cursor: not-allowed; }',
'.icon-btn { width: 30px; height: 30px; padding: 0; justify-content: center; border-radius: 7px; }',
'',
'/* ---------- forms ---------- */',
'.field { display: flex; flex-direction: column; gap: 5px; }',
'.field label { font-size: 12px; font-weight: 500; color: var(--text-secondary); }',
'.field label .req { color: var(--danger); margin-left: 2px; }',
'.field input, .field select, .field textarea {',
'  border: 1px solid var(--border-strong); background: var(--surface); color: var(--text);',
'  border-radius: 7px; padding: 8px 10px; font-size: 13.5px; width: 100%;',
'}',
'.field input:focus, .field select:focus, .field textarea:focus { outline: 2px solid var(--focus-ring); outline-offset: 0; border-color: transparent; }',
'.field textarea { resize: vertical; min-height: 64px; }',
'.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 16px; }',
'.form-grid .span-2 { grid-column: 1 / -1; }',
'.search-input {',
'  border: 1px solid var(--border-strong); background: var(--surface); border-radius: 8px;',
'  padding: 8px 12px; font-size: 13px; min-width: 220px;',
'}',
'.search-input:focus { outline: 2px solid var(--focus-ring); }',
'',
'/* ---------- cards / surfaces ---------- */',
'.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); }',
'.card-pad { padding: 20px 22px; }',
'.card-title { font-family: "Zen Kaku Gothic New", sans-serif; font-weight: 700; font-size: 15px; }',
'',
'/* ---------- dashboard stat tiles ---------- */',
'.stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }',
'.stat-tile { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 18px 20px; box-shadow: var(--shadow-sm); }',
'.stat-label { font-size: 12px; color: var(--text-secondary); font-weight: 500; }',
'.stat-value { font-family: "Zen Kaku Gothic New", sans-serif; font-weight: 700; font-size: 26px; margin-top: 8px; letter-spacing: -.01em; }',
'.stat-note { font-size: 12px; color: var(--text-muted); margin-top: 5px; }',
'.stat-note.alert { color: var(--danger-text); }',
'',
'/* ---------- funnel ---------- */',
'.funnel-row { display: grid; grid-template-columns: 108px 1fr 148px; align-items: center; gap: 12px; padding: 7px 0; }',
'.funnel-label { display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 500; }',
'.funnel-dot { width: 9px; height: 9px; border-radius: 3px; flex: 0 0 auto; }',
'.funnel-track { background: var(--surface-sunken); border-radius: 6px; height: 20px; position: relative; overflow: hidden; }',
'.funnel-fill { height: 100%; border-radius: 4px 6px 6px 4px; min-width: 3px; }',
'.funnel-meta { font-size: 12px; color: var(--text-secondary); text-align: right; font-variant-numeric: tabular-nums; }',
'.funnel-meta b { color: var(--text); font-weight: 600; }',
'',
'/* ---------- revenue trend ---------- */',
'.rev-chart { display: flex; align-items: flex-end; gap: 4px; padding-top: 4px; }',
'.rev-col { display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1 1 0; min-width: 0; }',
'.rev-col-total { font-size: 11.5px; font-weight: 600; color: var(--text-secondary); font-variant-numeric: tabular-nums; white-space: nowrap; }',
'.rev-col-bar { display: flex; flex-direction: column-reverse; gap: 2px; width: 100%; max-width: 56px; height: 176px; }',
'.rev-seg { width: 100%; min-height: 2px; }',
'.rev-seg:last-child { border-radius: 4px 4px 0 0; }',
'.rev-col-label { font-size: 11.5px; color: var(--text-muted); }',
'.rev-legend { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--border); }',
'.rev-legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary); }',
'.rev-legend-dot { width: 9px; height: 9px; border-radius: 3px; flex: 0 0 auto; }',
'',
'/* ---------- upcoming task list ---------- */',
'.uplist { display: flex; flex-direction: column; }',
'.uplist-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); }',
'.uplist-row:last-child { border-bottom: none; }',
'.uplist-title { font-weight: 500; font-size: 13.5px; }',
'.uplist-meta { font-size: 12px; color: var(--text-muted); margin-top: 2px; }',
'.uplist-spacer { flex: 1; }',
'',
'/* ---------- badges ---------- */',
'.badge {',
'  display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px;',
'  font-size: 11.5px; font-weight: 600; white-space: nowrap;',
'}',
'.badge-dot { width: 6px; height: 6px; border-radius: 50%; flex: 0 0 auto; }',
'.badge-good { background: var(--good-bg); color: var(--good); }',
'.badge-warning { background: var(--warning-bg); color: var(--warning); }',
'.badge-danger { background: var(--danger-bg); color: var(--danger-text); }',
'.badge-serious { background: var(--serious-bg); color: var(--serious); }',
'.badge-muted { background: var(--surface-sunken); color: var(--text-muted); }',
'.stage-badge { background: var(--bg-tint); color: var(--fg-tint); }',
'',
'/* ---------- table ---------- */',
'.table-wrap { overflow-x: auto; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); box-shadow: var(--shadow-sm); }',
'table.data-table { width: 100%; border-collapse: collapse; font-size: 13.5px; min-width: 720px; }',
'.data-table th { text-align: left; font-size: 11.5px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: .04em; padding: 12px 16px; border-bottom: 1px solid var(--border); }',
'.data-table td { padding: 13px 16px; border-bottom: 1px solid var(--border); vertical-align: middle; }',
'.data-table tbody tr { cursor: pointer; }',
'.data-table tbody tr:hover { background: var(--surface-alt); }',
'.data-table tbody tr:last-child td { border-bottom: none; }',
'.cell-primary { font-weight: 600; }',
'.cell-muted { color: var(--text-muted); }',
'.cell-sub { font-size: 11px; color: var(--text-muted); margin-top: 3px; font-weight: 400; }',
'.tnum { font-variant-numeric: tabular-nums; }',
'.row-actions { display: flex; gap: 4px; justify-content: flex-end; }',
'',
'/* ---------- kanban ---------- */',
'.board { display: flex; gap: 14px; overflow-x: auto; padding-bottom: 12px; align-items: flex-start; }',
'.kanban-col { flex: 0 0 258px; background: var(--surface-alt); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 12px; min-height: 120px; }',
'.kanban-col.drag-over { border-color: var(--border-strong); background: var(--surface-sunken); }',
'.kanban-col-head { display: flex; align-items: center; gap: 8px; padding: 4px 4px 12px; }',
'.kanban-col-title { font-weight: 700; font-size: 12.5px; flex: 1; }',
'.kanban-col-count { font-size: 11px; color: var(--text-muted); background: var(--surface); border-radius: 999px; padding: 1px 8px; }',
'.kanban-col-sum { font-size: 11px; color: var(--text-muted); padding: 0 4px 8px; font-variant-numeric: tabular-nums; }',
'.deal-card {',
'  background: var(--surface); border: 1px solid var(--border); border-left: 4px solid var(--stage-color, var(--border));',
'  border-radius: 9px; padding: 11px 12px; margin-bottom: 9px; cursor: grab; box-shadow: var(--shadow-sm);',
'}',
'.deal-card:active { cursor: grabbing; }',
'.deal-card.dragging { opacity: .45; }',
'.deal-card-title { font-weight: 600; font-size: 13px; margin-bottom: 5px; }',
'.deal-card-meta { font-size: 11.5px; color: var(--text-secondary); display: flex; flex-direction: column; gap: 3px; }',
'.deal-card-amount { font-weight: 700; font-size: 13px; font-variant-numeric: tabular-nums; margin-top: 6px; }',
'.kanban-empty { font-size: 12px; color: var(--text-muted); text-align: center; padding: 18px 6px; }',
'',
'/* ---------- businesses / tasks ---------- */',
'.biz-layout { display: grid; grid-template-columns: 260px 1fr; gap: 18px; align-items: start; }',
'.biz-list { display: flex; flex-direction: column; gap: 8px; }',
'.biz-card {',
'  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md);',
'  padding: 12px 14px; cursor: grab;',
'}',
'.biz-card:active { cursor: grabbing; }',
'.biz-card.dragging { opacity: .45; }',
'.biz-card.drag-over-above { box-shadow: 0 -3px 0 0 var(--accent) inset; }',
'.biz-card.drag-over-below { box-shadow: 0 3px 0 0 var(--accent) inset; }',
'.biz-card.active { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent) inset; }',
'.biz-card-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }',
'.biz-card-main { min-width: 0; flex: 1; }',
'.biz-card-name { font-weight: 600; font-size: 13.5px; display: flex; align-items: center; gap: 7px; }',
'.biz-dot { width: 8px; height: 8px; border-radius: 50%; flex: 0 0 auto; display: inline-block; }',
'.biz-card-grip { flex: 0 0 auto; color: var(--text-muted); padding-top: 2px; }',
'.biz-card-meta { font-size: 11.5px; color: var(--text-muted); margin-top: 4px; display: flex; gap: 8px; }',
'.task-row { display: flex; align-items: flex-start; gap: 12px; padding: 12px 4px; border-bottom: 1px solid var(--border); }',
'.task-row:last-child { border-bottom: none; }',
'.status-toggle {',
'  width: 20px; height: 20px; border-radius: 6px; border: 1.5px solid var(--border-strong); background: var(--surface);',
'  cursor: pointer; flex: 0 0 auto; margin-top: 1px; display: flex; align-items: center; justify-content: center; padding: 0;',
'}',
'.status-toggle.doing { border-color: var(--stage-lead); background: var(--stage-lead-bg); }',
'.status-toggle.done { border-color: var(--good); background: var(--good); }',
'.status-toggle.done::after { content: ""; width: 9px; height: 6px; border-left: 2px solid #fff; border-bottom: 2px solid #fff; transform: rotate(-45deg) translate(1px,-1px); }',
'.task-body { flex: 1; min-width: 0; }',
'.task-title { font-size: 13.5px; font-weight: 500; }',
'.task-title.done { text-decoration: line-through; color: var(--text-muted); }',
'.task-meta { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 6px; align-items: center; }',
'.task-meta-item { font-size: 11.5px; color: var(--text-muted); display: inline-flex; align-items: center; gap: 4px; }',
'.view-toggle { display: inline-flex; border: 1px solid var(--border-strong); border-radius: 8px; overflow: hidden; }',
'.view-toggle button { border: none; background: var(--surface); padding: 7px 13px; font-size: 12.5px; cursor: pointer; color: var(--text-secondary); }',
'.view-toggle button.active { background: var(--accent); color: var(--accent-contrast); }',
'',
'/* ---------- empty state ---------- */',
'.empty { text-align: center; padding: 44px 20px; color: var(--text-muted); }',
'.empty-title { font-weight: 600; color: var(--text-secondary); font-size: 14px; margin-bottom: 6px; }',
'.empty-sub { font-size: 12.5px; }',
'',
'/* ---------- modal ---------- */',
'.modal-backdrop {',
'  position: fixed; inset: 0; background: rgba(14,17,30,0.55); display: flex; align-items: flex-start;',
'  justify-content: center; padding: 6vh 20px; z-index: 100; overflow-y: auto;',
'}',
'.modal {',
'  background: var(--surface); border-radius: var(--radius-lg); width: 100%; max-width: 560px;',
'  box-shadow: var(--shadow-md); border: 1px solid var(--border);',
'}',
'.modal-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px; border-bottom: 1px solid var(--border); }',
'.modal-head h2 { font-family: "Zen Kaku Gothic New", sans-serif; font-size: 16px; font-weight: 700; }',
'.modal-body { padding: 20px 22px; display: flex; flex-direction: column; gap: 14px; max-height: 62vh; overflow-y: auto; }',
'.modal-foot { display: flex; justify-content: space-between; align-items: center; padding: 16px 22px; border-top: 1px solid var(--border); gap: 10px; }',
'.related-list { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }',
'.related-item { display: flex; align-items: center; gap: 8px; font-size: 12.5px; padding: 7px 9px; background: var(--surface-alt); border-radius: 7px; }',
'.related-item .amt { margin-left: auto; font-variant-numeric: tabular-nums; color: var(--text-secondary); }',
'',
'/* ---------- toast ---------- */',
'.toast-stack { position: fixed; bottom: 22px; right: 22px; display: flex; flex-direction: column; gap: 8px; z-index: 200; }',
'.toast {',
'  background: var(--text); color: var(--page-bg); padding: 11px 16px; border-radius: 9px; font-size: 13px;',
'  box-shadow: var(--shadow-md); max-width: 320px;',
'}',
'.toast.warn { background: var(--warning); color: #241a00; }',
'.toast.error { background: var(--danger); color: #2b0b06; }',
'',
'/* ---------- readonly banner ---------- */',
'.readonly-banner { background: var(--warning-bg); color: var(--warning); border: 1px solid var(--warning); border-radius: 10px; padding: 10px 16px; font-size: 12.5px; margin-bottom: 18px; display: flex; align-items: center; gap: 8px; }',
'',
'@media (max-width: 880px) {',
'  .app-shell { flex-direction: column; }',
'  .sidebar { width: 100%; flex: none; height: auto; position: static; flex-direction: row; align-items: center; padding: 12px 16px; overflow-x: auto; }',
'  .brand { padding: 0 12px 0 0; }',
'  .sidebar-spacer { display: none; }',
'  .sync-box { display: none; }',
'  .content, .topbar { padding-left: 16px; padding-right: 16px; }',
'  .stat-grid { grid-template-columns: 1fr 1fr; }',
'  .biz-layout { grid-template-columns: 1fr; }',
'  .form-grid { grid-template-columns: 1fr; }',
'}'
    ].join('\n');
  }

  /* ============================== DATA MODEL ============================= */
  var STAGES = [
    { key: 'lead', label: '見込み' },
    { key: 'approach', label: 'アプローチ' },
    { key: 'proposal', label: '提案・見積' },
    { key: 'negotiation', label: '交渉' },
    { key: 'won', label: '受注' },
    { key: 'lost', label: '失注' }
  ];
  var OPEN_STAGE_KEYS = ['lead', 'approach', 'proposal', 'negotiation'];
  function stageMeta(key) { for (var i = 0; i < STAGES.length; i++) if (STAGES[i].key === key) return STAGES[i]; return STAGES[0]; }

  var TASK_STATUSES = [
    { key: 'todo', label: '未着手' },
    { key: 'doing', label: '進行中' },
    { key: 'done', label: '完了' }
  ];
  var PRIORITIES = [
    { key: 'high', label: '高' },
    { key: 'mid', label: '中' },
    { key: 'low', label: '低' }
  ];
  function priorityLabel(k) { for (var i = 0; i < PRIORITIES.length; i++) if (PRIORITIES[i].key === k) return PRIORITIES[i].label; return '中'; }

  /* Fixed business list — 1:1 with the --biz-1..--biz-8 palette slots so every
     business always renders in the same color for everyone on the team. */
  var BUSINESS_PRESETS = ['FP事業', 'MoneRun', 'Agerun', '日本酒', '自社不動産', '採用', 'トラストサロン', 'その他'];
  function businessColorVar(name) {
    var idx = BUSINESS_PRESETS.indexOf(name);
    if (idx === -1) {
      /* legacy/custom business name (pre-existing data): hash to a stable slot
         so it still gets a consistent color instead of breaking. */
      var h = 0;
      var s = name || '';
      for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
      idx = h % BUSINESS_PRESETS.length;
    }
    return '--biz-' + (idx + 1);
  }

  function defaultState() {
    return { businesses: [], accounts: [], customers: [], partners: [], deals: [], tasks: [], updatedAt: null };
  }

  /* Migrate the pre-split shape (a single "customers" array that held
   * companies, with a free-text "contact" field for the person's name)
   * into the current shape: "accounts" holds companies, "customers" holds
   * individual people who may optionally belong to an account. Deals used
   * to point at a company via `customerId`; that becomes `accountId`. */
  function migrateState(parsed, uidFn) {
    if (!parsed || Array.isArray(parsed.accounts)) return parsed; /* already current shape */
    var legacy = Array.isArray(parsed.customers) ? parsed.customers : [];
    var accounts = [];
    var people = [];
    legacy.forEach(function (c) {
      accounts.push({ id: c.id, name: c.name || '', industry: c.industry || '', phone: c.phone || '', email: c.email || '', address: c.address || '', memo: c.memo || '', createdAt: c.createdAt || null });
      if (c.contact) {
        people.push({ id: uidFn('cust'), name: c.contact, accountId: c.id, title: '', phone: '', email: '', memo: '', createdAt: c.createdAt || null });
      }
    });
    parsed.accounts = accounts;
    parsed.customers = people;
    (parsed.deals || []).forEach(function (d) {
      if (d.customerId && !d.accountId) d.accountId = d.customerId;
      d.customerId = null;
    });
    return parsed;
  }

  /* ============================== BUILD DOC =============================== */
  function escapeJsonForScript(obj) {
    return JSON.stringify(obj).replace(/</g, '\\u003c');
  }

  function buildDocument(state, appJsSource) {
    return '<!doctype html>\n<html lang="ja">' + DOC_HEAD + '\n<body>\n' +
      '<div id="app" class="app-shell"></div>\n' +
      '<script id="app-data" type="application/json">' + escapeJsonForScript(state) + '<' + '/script>\n' +
      '<script id="app-script">\n' + appJsSource + '\n<' + '/script>\n' +
      '</body>\n</html>\n';
  }

  /* expose for the Node build step */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DOC_HEAD: DOC_HEAD, buildDocument: buildDocument, defaultState: defaultState, escapeJsonForScript: escapeJsonForScript };
  }

  /* ======================= BROWSER-ONLY APP LOGIC ========================= */
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return; /* running under Node for the build step — stop here */
  }

  var APP_JS_SOURCE = (document.currentScript && document.currentScript.textContent) || '';

  /* ---------- utils ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function uid(prefix) { return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function todayStr() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function fmtDate(s) { if (!s) return '未設定'; var p = s.split('-'); return p[0] + '/' + p[1] + '/' + p[2]; }
  function fmtYen(n) {
    n = Number(n) || 0;
    if (Math.abs(n) >= 10000) {
      var man = Math.round(n / 1000) / 10;
      return man.toLocaleString('ja-JP', { maximumFractionDigits: 1 }) + '万円';
    }
    return n.toLocaleString('ja-JP') + '円';
  }
  function fmtYenFull(n) { return (Number(n) || 0).toLocaleString('ja-JP') + '円'; }
  function daysUntil(dateStr) {
    if (!dateStr) return null;
    var now = new Date(todayStr() + 'T00:00:00');
    var due = new Date(dateStr + 'T00:00:00');
    return Math.round((due - now) / 86400000);
  }
  function isOverdue(task) { return task.status !== 'done' && task.dueDate && daysUntil(task.dueDate) < 0; }
  function isDueSoon(task) { if (task.status === 'done' || !task.dueDate) return false; var d = daysUntil(task.dueDate); return d >= 0 && d <= 7; }
  function monthStr(s) { return s ? s.slice(0, 7) : ''; }
  function currentMonthStr() { return todayStr().slice(0, 7); }
  function opt(value, label, selected) { return '<option value="' + esc(value) + '"' + (String(value) === String(selected) ? ' selected' : '') + '>' + esc(label) + '</option>'; }

  /* ---------- animal fortune (60種類判定) ----------
   * Implements the base-number-table algorithm the user supplied: look up
   * a base number for the birth year/month, add the day, subtract 60 if
   * over 60, then map the 1-60 result to one of 60 named types.
   *
   * Rather than hand-transcribing the ~1,260-cell table image (which is
   * error-prone — a couple of its rows visibly lose a column in OCR), the
   * base number is computed directly as elapsed calendar days from a
   * calibrated anchor (1926年1月 = base 26), since that reproduces every
   * spot-checked cell of the supplied table exactly (1926/1927/1928/1929
   * leap-year boundary, 1980, 2024) and generalizes cleanly to any date. */
  var ANIMAL_60 = [
    '長距離ランナーのチータ', '社交家のたぬき', '落ち着きのない猿', 'フットワークの軽い子守熊', '面倒見のいい黒ひょう',
    '愛情あふれる虎', '全力疾走するチータ', '磨き上げられたたぬき', '大きな志をもった猿', '母性豊かな子守熊',
    '正直なこじか', '人気者のゾウ', 'ネアカの狼', '協調性のないひつじ', 'どっしりとした猿',
    'コアラのなかの子守熊', '強い意志をもったこじか', 'デリケートなゾウ', '放浪の狼', '物静かなひつじ',
    '落ち着きのあるペガサス', '強靭な翼をもつペガサス', '無邪気なひつじ', 'クリエイティブな狼', '穏やかな狼',
    '粘り強いひつじ', '波乱に満ちたペガサス', '優雅なペガサス', 'チャレンジ精神旺盛なひつじ', '順応性のある狼',
    'リーダーとなるゾウ', 'しっかり者のこじか', '活動的な子守熊', '気分屋の猿', '頼られると嬉しいひつじ',
    '好感のもたれる狼', 'まっしぐらに突き進むゾウ', '華やかなこじか', '夢とロマンの子守熊', '尽す猿',
    '大器晩成のたぬき', '足腰の強いチータ', '動きまわる虎', '情熱的な黒ひょう', 'サービス精神旺盛な子守熊',
    '守りの猿', '人間味あふれるたぬき', '品格のあるチータ', 'ゆったりとした悠然の虎', '落ち込みの激しい黒ひょう',
    '我が道を行くライオン', '統率力のあるライオン', '感情豊かな黒ひょう', '楽天的な虎', 'パワフルな虎',
    '気どらない黒ひょう', '感情的なライオン', '傷つきやすいライオン', '束縛を嫌う黒ひょう', '慈悲深い虎'
  ];
  function animalFortuneNumber(dateStr) {
    if (!dateStr) return null;
    var parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    var year = parseInt(parts[0], 10), month = parseInt(parts[1], 10), day = parseInt(parts[2], 10);
    if (!year || !month || !day) return null;
    var firstOfMonth = Date.UTC(year, month - 1, 1);
    var anchor = Date.UTC(1926, 0, 1); /* 1926年1月の基数=26 */
    var daysBetween = Math.round((firstOfMonth - anchor) / 86400000);
    var base = ((daysBetween + 26) % 60 + 60) % 60;
    var sum = base + day;
    if (sum > 60) sum -= 60;
    if (sum < 1) sum += 60;
    return sum;
  }
  function animalFortune(dateStr) {
    var n = animalFortuneNumber(dateStr);
    if (!n) return null;
    return { no: n, name: ANIMAL_60[n - 1] };
  }

  /* ---------- state ---------- */
  var state = defaultState();
  try {
    var raw = document.getElementById('app-data');
    if (raw && raw.textContent.trim()) {
      var parsed = JSON.parse(raw.textContent);
      parsed = migrateState(parsed, uid);
      state = Object.assign(defaultState(), parsed);
    }
  } catch (e) { console.warn('SFA: failed to parse initial state', e); }

  var ui = {
    tab: 'dashboard',
    accountFilter: '',
    personFilter: '',
    partnerFilter: '',
    dealFilter: '',
    selectedBusinessId: (state.businesses[0] && state.businesses[0].id) || null,
    taskViewMode: 'byBusiness'
  };

  /* Every successful save republishes this page, and the publishing view
   * reloads to the freshly published document just like every other open
   * view (see the `artifact` capability). `ui` is per-viewer and never part
   * of the persisted `state`, so without this it would snap back to its
   * hard-coded defaults (dashboard tab, first business, etc.) after every
   * single add/edit/delete/reorder. Stash just enough of it in localStorage
   * — private to this viewer's browser, never sent anywhere — so a reload
   * the viewer's own action triggered lands back where they were. */
  var UI_STORAGE_KEY = 'att-sfa-ui-state-v1';
  (function restoreUiState() {
    try {
      var raw = localStorage.getItem(UI_STORAGE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (saved && typeof saved === 'object') {
        if (saved.tab) ui.tab = saved.tab;
        if (saved.selectedBusinessId) ui.selectedBusinessId = saved.selectedBusinessId;
        if (saved.taskViewMode) ui.taskViewMode = saved.taskViewMode;
      }
    } catch (e) { /* private browsing, storage disabled, corrupt value, etc. — keep defaults */ }
  })();
  function saveUiState() {
    try {
      localStorage.setItem(UI_STORAGE_KEY, JSON.stringify({
        tab: ui.tab,
        selectedBusinessId: ui.selectedBusinessId,
        taskViewMode: ui.taskViewMode
      }));
    } catch (e) { /* ignore — this is a convenience, not critical data */ }
  }

  var readOnly = false;
  var saving = false;
  var pendingConfirmAction = null;
  var artifactPromise = null;
  var toastSeq = 0;

  function findAccount(id) { return state.accounts.find(function (a) { return a.id === id; }); }
  function findCustomer(id) { return state.customers.find(function (c) { return c.id === id; }); }
  function findPartner(id) { return state.partners.find(function (p) { return p.id === id; }); }
  function findBusiness(id) { return state.businesses.find(function (b) { return b.id === id; }); }
  function findDeal(id) { return state.deals.find(function (d) { return d.id === id; }); }
  function findTask(id) { return state.tasks.find(function (t) { return t.id === id; }); }

  /* ============================== RENDER =================================== */
  function render() {
    var app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = renderSidebar() + renderMain();
    saveUiState();
  }

  function navItem(tab, label, iconPath) {
    var active = ui.tab === tab ? ' active' : '';
    return '<div class="nav-item' + active + '" data-action="nav" data-tab="' + tab + '">' +
      '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + iconPath + '</svg>' +
      '<span>' + label + '</span></div>';
  }

  var ICONS = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    accounts: '<path d="M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16"/><path d="M14 10h5a1 1 0 0 1 1 1v10"/><path d="M9 21v-3h3v3"/><path d="M7 7h1M7 10h1M7 13h1M11 7h1M11 10h1M11 13h1"/><path d="M17 14h1M17 17h1"/>',
    customers: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="7" r="2.6"/><path d="M15.5 13.2c2.6.4 4.5 2.6 4.5 5.3"/>',
    partners: '<circle cx="8" cy="8" r="3"/><path d="M8 11c-3 0-5.5 2.3-5.5 5.5V20h11v-3.5C13.5 13.3 11 11 8 11Z"/><circle cx="17" cy="7" r="2.5"/><path d="M14.8 11.3c.7-.3 1.4-.5 2.2-.5 2.8 0 5 2.1 5 4.7V19h-4"/>',
    deals: '<path d="M3 9h18"/><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 14h3"/>',
    tasks: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18"/><path d="M8 13l2 2 4-4"/>'
  };

  function renderSidebar() {
    var syncRow;
    if (readOnly) {
      syncRow = '<div class="sync-row"><span class="sync-dot readonly"></span>閲覧専用モード</div><div class="sync-meta">変更は保存されません</div>';
    } else if (saving) {
      syncRow = '<div class="sync-row"><span class="sync-dot saving"></span>保存中…</div><div class="sync-meta">チームに同期しています</div>';
    } else {
      syncRow = '<div class="sync-row"><span class="sync-dot"></span>チームで共有中</div><div class="sync-meta">' + (state.updatedAt ? '最終更新 ' + new Date(state.updatedAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '未保存'  ) + '</div>';
    }
    return '<aside class="sidebar">' +
      '<div class="brand"><div class="brand-mark" style="font-size:12px;">ATT</div><div><div class="brand-name">ATT 経営管理</div><div class="brand-sub">Management Board</div></div></div>' +
      navItem('dashboard', 'ダッシュボード', ICONS.dashboard) +
      navItem('accounts', '取引先', ICONS.accounts) +
      navItem('customers', '顧客', ICONS.customers) +
      navItem('partners', 'パートナー', ICONS.partners) +
      navItem('deals', '案件・商談', ICONS.deals) +
      navItem('businesses', '事業とタスク', ICONS.tasks) +
      '<div class="sidebar-spacer"></div>' +
      '<div class="sync-box">' + syncRow + '</div>' +
      '</aside>';
  }

  function renderMain() {
    var body;
    if (ui.tab === 'accounts') body = renderAccountsView();
    else if (ui.tab === 'customers') body = renderCustomersView();
    else if (ui.tab === 'partners') body = renderPartnersView();
    else if (ui.tab === 'deals') body = renderDealsView();
    else if (ui.tab === 'businesses') body = renderBusinessesView();
    else body = renderDashboardView();
    return '<div class="main"><div id="modal-root"></div><div id="toast-root" class="toast-stack"></div>' + body + '</div>';
  }

  function readOnlyBanner() {
    if (!readOnly) return '';
    return '<div class="readonly-banner">現在は閲覧専用です。編集内容はチームに保存されません。</div>';
  }

  /* ---------------------------- dashboard ---------------------------- */
  function renderDashboardView() {
    var openDeals = state.deals.filter(function (d) { return OPEN_STAGE_KEYS.indexOf(d.stage) !== -1; });
    var openAmount = openDeals.reduce(function (s, d) { return s + (Number(d.amount) || 0); }, 0);
    var wonThisMonth = state.deals.filter(function (d) { return d.stage === 'won' && monthStr(d.closeDate) === currentMonthStr(); });
    var wonAmount = wonThisMonth.reduce(function (s, d) { return s + (Number(d.amount) || 0); }, 0);
    var overdueTasks = state.tasks.filter(isOverdue);
    var dueSoonTasks = state.tasks.filter(isDueSoon);

    var upcoming = state.tasks
      .filter(function (t) { return t.status !== 'done' && t.dueDate; })
      .sort(function (a, b) { return a.dueDate < b.dueDate ? -1 : 1; })
      .slice(0, 6);

    var upcomingHtml = upcoming.length ? '<div class="uplist">' + upcoming.map(function (t) {
      var biz = findBusiness(t.businessId);
      var badge = isOverdue(t) ? '<span class="badge badge-danger">期限超過</span>' : (isDueSoon(t) ? '<span class="badge badge-warning">まもなく</span>' : '<span class="badge badge-muted">' + fmtDate(t.dueDate) + '</span>');
      return '<div class="uplist-row"><div><div class="uplist-title">' + esc(t.title) + '</div>' +
        '<div class="uplist-meta">' + esc(biz ? biz.name : '未分類') + (t.assignee ? ' ・ ' + esc(t.assignee) : '') + ' ・ 期限 ' + fmtDate(t.dueDate) + '</div></div>' +
        '<div class="uplist-spacer"></div>' + badge + '</div>';
    }).join('') + '</div>' : '<div class="empty"><div class="empty-title">タスクはありません</div><div class="empty-sub">「事業とタスク」から追加できます</div></div>';

    return '<div class="topbar"><div><div class="page-title">ダッシュボード</div><div class="page-sub">' + todayStr().replace(/-/g, '/') + ' 時点のサマリー</div></div></div>' +
      '<div class="content">' + readOnlyBanner() +
      '<div class="stat-grid">' +
      '<div class="stat-tile"><div class="stat-label">進行中の案件</div><div class="stat-value">' + openDeals.length + '<span style="font-size:14px;font-weight:500;color:var(--text-muted);">件</span></div><div class="stat-note">合計 ' + fmtYen(openAmount) + '</div></div>' +
      '<div class="stat-tile"><div class="stat-label">今月の受注金額</div><div class="stat-value">' + fmtYen(wonAmount) + '</div><div class="stat-note">' + wonThisMonth.length + '件成約</div></div>' +
      '<div class="stat-tile"><div class="stat-label">期限超過タスク</div><div class="stat-value">' + overdueTasks.length + '<span style="font-size:14px;font-weight:500;color:var(--text-muted);">件</span></div><div class="stat-note' + (overdueTasks.length ? ' alert' : '') + '">' + (overdueTasks.length ? '至急ご確認ください' : '対応漏れなし') + '</div></div>' +
      '<div class="stat-tile"><div class="stat-label">今週期限のタスク</div><div class="stat-value">' + dueSoonTasks.length + '<span style="font-size:14px;font-weight:500;color:var(--text-muted);">件</span></div><div class="stat-note">7日以内が対象</div></div>' +
      '</div>' +
      '<div class="card card-pad" style="margin-bottom:18px;"><div class="card-title">売上推移</div><div class="page-sub" style="margin-bottom:14px;">事業ごとの売上推移（過去6か月・受注ベース）</div>' + renderRevenueTrend() + '</div>' +
      '<div class="card card-pad"><div class="card-title" style="margin-bottom:6px;">直近期限のタスク</div>' + upcomingHtml + '</div>' +
      '</div>';
  }

  /* ---------------------------- revenue trend (事業ごとの売上推移) ---------------------------- */
  function renderRevenueTrend() {
    var MONTHS = 6;
    var months = [];
    var now = new Date(todayStr() + 'T00:00:00');
    for (var i = MONTHS - 1; i >= 0; i--) {
      var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
    }

    var MAX_SERIES = 7; /* + 1 "その他/未分類" bucket = 8, matching the --biz-1..8 palette slots */
    var bizList = state.businesses.slice(0, MAX_SERIES);
    var hasOverflow = state.businesses.length > MAX_SERIES;
    var series = bizList.map(function (b) { return { id: b.id, label: b.name, colorVar: businessColorVar(b.name) }; });
    series.push({ id: null, label: hasOverflow ? 'その他・未分類' : '未分類', colorVar: '--biz-8' });

    function seriesKeyFor(businessId) {
      var found = businessId && bizList.find(function (b) { return b.id === businessId; });
      return found ? found.id : '__none__';
    }

    var wonDeals = state.deals.filter(function (d) { return d.stage === 'won' && d.closeDate; });
    var totalRevenue = wonDeals.reduce(function (s, d) { return s + (Number(d.amount) || 0); }, 0);
    if (!totalRevenue) {
      return '<div class="empty"><div class="empty-title">受注実績がありません</div><div class="empty-sub">案件が「受注」ステージになり、予定日/成立日が入力されると集計されます</div></div>';
    }

    var table = {};
    months.forEach(function (m) { table[m] = {}; });
    wonDeals.forEach(function (d) {
      var m = monthStr(d.closeDate);
      if (!table[m]) return; /* outside the displayed window */
      var key = seriesKeyFor(d.businessId);
      table[m][key] = (table[m][key] || 0) + (Number(d.amount) || 0);
    });

    var monthTotals = months.map(function (m) {
      var t = table[m], sum = 0;
      Object.keys(t).forEach(function (k) { sum += t[k]; });
      return sum;
    });
    var maxTotal = Math.max.apply(null, monthTotals.concat([1]));

    var cols = months.map(function (m, idx) {
      var t = table[m];
      var segs = series.map(function (s) {
        var key = s.id || '__none__';
        var amt = t[key] || 0;
        if (!amt) return '';
        var h = Math.max(2, Math.round((amt / maxTotal) * 176));
        return '<div class="rev-seg" style="height:' + h + 'px;background:var(' + s.colorVar + ')" title="' + esc(s.label) + ': ' + esc(fmtYen(amt)) + '"></div>';
      }).join('');
      return '<div class="rev-col">' +
        '<div class="rev-col-total">' + (monthTotals[idx] ? fmtYen(monthTotals[idx]) : '') + '</div>' +
        '<div class="rev-col-bar">' + segs + '</div>' +
        '<div class="rev-col-label">' + esc(m.slice(5, 7)) + '月</div>' +
        '</div>';
    }).join('');

    var activeSeries = series.filter(function (s) {
      return months.some(function (m) { return (table[m][s.id || '__none__'] || 0) > 0; });
    });
    var legend = activeSeries.length >= 2 ? '<div class="rev-legend">' + activeSeries.map(function (s) {
      return '<div class="rev-legend-item"><span class="rev-legend-dot" style="background:var(' + s.colorVar + ')"></span>' + esc(s.label) + '</div>';
    }).join('') + '</div>' : '';

    return '<div class="rev-chart">' + cols + '</div>' + legend;
  }

  /* ---------------------------- accounts (取引先: companies) ---------------------------- */
  function renderAccountsView() {
    var q = ui.accountFilter.trim().toLowerCase();
    var list = state.accounts.filter(function (a) {
      if (!q) return true;
      return (a.name + ' ' + (a.industry || '')).toLowerCase().indexOf(q) !== -1;
    });

    var rows = list.map(function (a) {
      var dealCount = state.deals.filter(function (d) { return d.accountId === a.id; }).length;
      var personCount = state.customers.filter(function (c) { return c.accountId === a.id; }).length;
      return '<tr data-action="edit-account" data-id="' + a.id + '">' +
        '<td class="cell-primary">' + esc(a.name) + '</td>' +
        '<td class="cell-muted">' + esc(a.industry || '—') + '</td>' +
        '<td class="cell-muted">' + esc(a.contact || '—') + '</td>' +
        '<td class="cell-muted">' + esc(a.phone || '—') + '</td>' +
        '<td class="cell-muted">' + personCount + '名</td>' +
        '<td class="cell-muted">' + dealCount + '件</td>' +
        '<td><div class="row-actions">' +
        '<button type="button" class="btn btn-ghost icon-btn" data-action="edit-account" data-id="' + a.id + '" title="編集" aria-label="編集">' + svgEdit() + '</button>' +
        '<button type="button" class="btn btn-ghost icon-btn" data-action="delete-account" data-id="' + a.id + '" title="削除" aria-label="削除">' + svgTrash() + '</button>' +
        '</div></td></tr>';
    }).join('');

    var body = list.length ?
      '<div class="table-wrap"><table class="data-table"><thead><tr><th>会社名</th><th>業種</th><th>担当者</th><th>電話</th><th>顧客</th><th>関連案件</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>' :
      '<div class="card"><div class="empty"><div class="empty-title">' + (state.accounts.length ? '該当する取引先がありません' : 'まだ取引先が登録されていません') + '</div><div class="empty-sub">「+ 新規取引先」から追加してください</div></div></div>';

    return '<div class="topbar"><div><div class="page-title">取引先</div><div class="page-sub">全' + state.accounts.length + '件</div></div>' +
      '<div class="topbar-actions"><input class="search-input" type="text" placeholder="会社名・業種で検索" value="' + esc(ui.accountFilter) + '" data-input="account-filter">' +
      (readOnly ? '' : '<button type="button" class="btn btn-primary" data-action="open-add-account">+ 新規取引先</button>') + '</div></div>' +
      '<div class="content">' + readOnlyBanner() + body + '</div>';
  }

  /* ---------------------------- customers (顧客: individuals) ---------------------------- */
  function renderCustomersView() {
    var q = ui.personFilter.trim().toLowerCase();
    var list = state.customers.filter(function (c) {
      if (!q) return true;
      var acc = findAccount(c.accountId);
      return (c.name + ' ' + (acc ? acc.name : '') + ' ' + (c.title || '')).toLowerCase().indexOf(q) !== -1;
    });

    var rows = list.map(function (c) {
      var acc = findAccount(c.accountId);
      var fortune = c.birthday ? animalFortune(c.birthday) : null;
      return '<tr data-action="edit-customer" data-id="' + c.id + '">' +
        '<td class="cell-primary">' + esc(c.name) + (fortune ? '<div class="cell-sub">🐾 ' + esc(fortune.name) + '</div>' : '') + '</td>' +
        '<td class="cell-muted">' + esc(acc ? acc.name : '所属なし') + '</td>' +
        '<td class="cell-muted">' + esc(c.title || '—') + '</td>' +
        '<td class="cell-muted">' + esc(c.consultant || '—') + '</td>' +
        '<td class="cell-muted">' + esc(c.phone || '—') + '</td>' +
        '<td class="cell-muted">' + esc(c.email || '—') + '</td>' +
        '<td><div class="row-actions">' +
        '<button type="button" class="btn btn-ghost icon-btn" data-action="edit-customer" data-id="' + c.id + '" title="編集" aria-label="編集">' + svgEdit() + '</button>' +
        '<button type="button" class="btn btn-ghost icon-btn" data-action="delete-customer" data-id="' + c.id + '" title="削除" aria-label="削除">' + svgTrash() + '</button>' +
        '</div></td></tr>';
    }).join('');

    var body = list.length ?
      '<div class="table-wrap"><table class="data-table"><thead><tr><th>氏名</th><th>所属取引先</th><th>勤務先・職業</th><th>担当コンサルタント</th><th>電話</th><th>メール</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>' :
      '<div class="card"><div class="empty"><div class="empty-title">' + (state.customers.length ? '該当する顧客がありません' : 'まだ顧客が登録されていません') + '</div><div class="empty-sub">「+ 新規顧客」から追加してください</div></div></div>';

    return '<div class="topbar"><div><div class="page-title">顧客</div><div class="page-sub">全' + state.customers.length + '名</div></div>' +
      '<div class="topbar-actions"><input class="search-input" type="text" placeholder="氏名・所属取引先で検索" value="' + esc(ui.personFilter) + '" data-input="person-filter">' +
      (readOnly ? '' : '<button type="button" class="btn btn-primary" data-action="open-add-customer">+ 新規顧客</button>') + '</div></div>' +
      '<div class="content">' + readOnlyBanner() + body + '</div>';
  }

  /* ---------------------------- partners (パートナー) ---------------------------- */
  function renderPartnersView() {
    var q = ui.partnerFilter.trim().toLowerCase();
    var list = state.partners.filter(function (p) {
      if (!q) return true;
      return (p.name + ' ' + (p.attribute || '') + ' ' + (p.occupation || '')).toLowerCase().indexOf(q) !== -1;
    });

    var rows = list.map(function (p) {
      return '<tr data-action="edit-partner" data-id="' + p.id + '">' +
        '<td class="cell-primary">' + esc(p.name) + '</td>' +
        '<td class="cell-muted">' + (p.attribute ? '<span class="badge badge-muted">' + esc(p.attribute) + '</span>' : '—') + '</td>' +
        '<td class="cell-muted">' + esc(p.occupation || '—') + '</td>' +
        '<td class="cell-muted">' + esc(p.approachOwner || '—') + '</td>' +
        '<td class="cell-muted">' + esc(p.nextAction || '—') + '</td>' +
        '<td><div class="row-actions">' +
        '<button type="button" class="btn btn-ghost icon-btn" data-action="edit-partner" data-id="' + p.id + '" title="編集" aria-label="編集">' + svgEdit() + '</button>' +
        '<button type="button" class="btn btn-ghost icon-btn" data-action="delete-partner" data-id="' + p.id + '" title="削除" aria-label="削除">' + svgTrash() + '</button>' +
        '</div></td></tr>';
    }).join('');

    var body = list.length ?
      '<div class="table-wrap"><table class="data-table"><thead><tr><th>パートナー氏名</th><th>属性</th><th>職業</th><th>アプローチ担当</th><th>ネクストアクション</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>' :
      '<div class="card"><div class="empty"><div class="empty-title">' + (state.partners.length ? '該当するパートナーがありません' : 'まだパートナーが登録されていません') + '</div><div class="empty-sub">「+ 新規パートナー」から追加してください</div></div></div>';

    return '<div class="topbar"><div><div class="page-title">パートナー</div><div class="page-sub">全' + state.partners.length + '名</div></div>' +
      '<div class="topbar-actions"><input class="search-input" type="text" placeholder="氏名・属性・職業で検索" value="' + esc(ui.partnerFilter) + '" data-input="partner-filter">' +
      (readOnly ? '' : '<button type="button" class="btn btn-primary" data-action="open-add-partner">+ 新規パートナー</button>') + '</div></div>' +
      '<div class="content">' + readOnlyBanner() + body + '</div>';
  }

  function svgEdit() { return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>'; }
  function svgGrip() { return '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>'; }
  function svgTrash() { return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>'; }

  /* ---------------------------- deals (kanban) ---------------------------- */
  function renderDealsView() {
    var q = ui.dealFilter.trim().toLowerCase();
    var columns = STAGES.map(function (s) {
      var deals = state.deals.filter(function (d) {
        if (d.stage !== s.key) return false;
        if (!q) return true;
        var acc = findAccount(d.accountId);
        var cust = findCustomer(d.customerId);
        return (d.title + ' ' + (acc ? acc.name : '') + ' ' + (cust ? cust.name : '')).toLowerCase().indexOf(q) !== -1;
      });
      var sum = deals.reduce(function (acc, d) { return acc + (Number(d.amount) || 0); }, 0);
      var cards = deals.map(function (d) {
        var acc = findAccount(d.accountId);
        var cust = findCustomer(d.customerId);
        return '<div class="deal-card" draggable="true" data-id="' + d.id + '" data-action="edit-deal" style="--stage-color:var(--stage-' + s.key + ')">' +
          '<div class="deal-card-title">' + esc(d.title) + '</div>' +
          '<div class="deal-card-meta"><span>' + esc(acc ? acc.name : '取引先未設定') + '</span>' +
          (cust ? '<span>顧客: ' + esc(cust.name) + '</span>' : '') +
          (d.owner ? '<span>担当: ' + esc(d.owner) + '</span>' : '') +
          '<span>予定日: ' + fmtDate(d.closeDate) + '</span></div>' +
          '<div class="deal-card-amount">' + fmtYen(d.amount) + '</div>' +
          '</div>';
      }).join('');
      return '<div class="kanban-col" data-stage="' + s.key + '">' +
        '<div class="kanban-col-head"><span class="funnel-dot" style="background:var(--stage-' + s.key + ')"></span><span class="kanban-col-title">' + esc(s.label) + '</span><span class="kanban-col-count">' + deals.length + '</span></div>' +
        '<div class="kanban-col-sum">' + fmtYen(sum) + '</div>' +
        (cards || '<div class="kanban-empty">案件なし</div>') +
        '</div>';
    }).join('');

    return '<div class="topbar"><div><div class="page-title">案件・商談</div><div class="page-sub">全' + state.deals.length + '件（ドラッグでステージ変更）</div></div>' +
      '<div class="topbar-actions"><input class="search-input" type="text" placeholder="案件名・取引先で検索" value="' + esc(ui.dealFilter) + '" data-input="deal-filter">' +
      (readOnly ? '' : '<button type="button" class="btn btn-primary" data-action="open-add-deal">+ 新規案件</button>') + '</div></div>' +
      '<div class="content">' + readOnlyBanner() + '<div class="board">' + columns + '</div></div>';
  }

  /* ---------------------------- businesses & tasks ---------------------------- */
  function renderBusinessesView() {
    if (!ui.selectedBusinessId || !findBusiness(ui.selectedBusinessId)) {
      ui.selectedBusinessId = (state.businesses[0] && state.businesses[0].id) || null;
    }

    var bizCards = state.businesses.map(function (b) {
      var ts = state.tasks.filter(function (t) { return t.businessId === b.id; });
      var open = ts.filter(function (t) { return t.status !== 'done'; }).length;
      var overdue = ts.filter(isOverdue).length;
      var active = b.id === ui.selectedBusinessId && ui.taskViewMode === 'byBusiness' ? ' active' : '';
      var grip = readOnly ? '' : '<div class="biz-card-grip" title="ドラッグして並び替え" aria-hidden="true">' + svgGrip() + '</div>';
      return '<div class="biz-card' + active + '"' + (readOnly ? '' : ' draggable="true"') + ' style="border-left:4px solid var(' + businessColorVar(b.name) + ')" data-action="select-business" data-id="' + b.id + '">' +
        '<div class="biz-card-row">' +
        '<div class="biz-card-main"><div class="biz-card-name"><span class="biz-dot" style="background:var(' + businessColorVar(b.name) + ')"></span>' + esc(b.name) + '</div>' +
        '<div class="biz-card-meta"><span>未完了 ' + open + '件</span>' + (overdue ? '<span style="color:var(--danger-text);">超過 ' + overdue + '件</span>' : '') + '</div></div>' +
        grip +
        '</div></div>';
    }).join('');

    var bizPane = '<div class="biz-list">' + bizCards +
      (readOnly ? '' : '<button type="button" class="btn btn-sm" data-action="open-add-business" style="margin-top:4px;">+ 事業を追加</button>') +
      (state.businesses.length === 0 ? '<div class="empty" style="padding:20px 8px;"><div class="empty-title" style="font-size:12.5px;">事業がありません</div></div>' : '') +
      '</div>';

    var tasks;
    var headerTitle;
    if (ui.taskViewMode === 'all') {
      tasks = state.tasks.slice();
      headerTitle = 'すべてのタスク';
    } else {
      var biz = findBusiness(ui.selectedBusinessId);
      tasks = state.tasks.filter(function (t) { return t.businessId === ui.selectedBusinessId; });
      headerTitle = biz ? biz.name : 'タスク';
    }
    tasks = tasks.slice().sort(function (a, b) {
      if (!!a.dueDate !== !!b.dueDate) return a.dueDate ? -1 : 1;
      if (a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
      return 0;
    });

    var taskRows = tasks.map(function (t) {
      var taskBiz = findBusiness(t.businessId);
      var bizName = ui.taskViewMode === 'all' ? (taskBiz ? taskBiz.name : '未分類') : null;
      var bizColorVar = taskBiz ? businessColorVar(taskBiz.name) : null;
      var deal = t.dealId ? findDeal(t.dealId) : null;
      var dueBadge = '';
      if (t.dueDate) {
        if (isOverdue(t)) dueBadge = '<span class="badge badge-danger">期日超過 ' + fmtDate(t.dueDate) + '</span>';
        else if (isDueSoon(t)) dueBadge = '<span class="badge badge-warning">' + fmtDate(t.dueDate) + '</span>';
        else dueBadge = '<span class="badge badge-muted">' + fmtDate(t.dueDate) + '</span>';
      }
      var prBadgeClass = t.priority === 'high' ? 'badge-serious' : (t.priority === 'low' ? 'badge-muted' : 'badge-warning');
      return '<div class="task-row" style="' + (bizColorVar ? 'border-left:3px solid var(' + bizColorVar + ');padding-left:9px;' : '') + '">' +
        '<button type="button" class="status-toggle ' + t.status + '" data-action="cycle-task-status" data-id="' + t.id + '" title="' + statusLabel(t.status) + '（クリックで変更）" aria-label="ステータス変更"></button>' +
        '<div class="task-body" data-action="edit-task" data-id="' + t.id + '">' +
        '<div class="task-title' + (t.status === 'done' ? ' done' : '') + '">' + esc(t.title) + '</div>' +
        '<div class="task-meta">' +
        (bizName ? '<span class="task-meta-item"><span class="biz-dot" style="background:var(' + bizColorVar + ')"></span>' + esc(bizName) + '</span>' : '') +
        (t.assignee ? '<span class="task-meta-item">責任者: ' + esc(t.assignee) + '</span>' : '') +
        (deal ? '<span class="task-meta-item">案件: ' + esc(deal.title) + '</span>' : '') +
        '<span class="badge ' + prBadgeClass + '">優先度 ' + priorityLabel(t.priority) + '</span>' +
        dueBadge +
        '</div></div>' +
        (readOnly ? '' : '<button type="button" class="btn btn-ghost icon-btn" data-action="delete-task" data-id="' + t.id + '" title="削除" aria-label="削除">' + svgTrash() + '</button>') +
        '</div>';
    }).join('');

    var taskPane = '<div class="card card-pad">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap;">' +
      '<div class="card-title">' + esc(headerTitle) + '</div>' +
      '<div style="display:flex;gap:10px;align-items:center;">' +
      '<div class="view-toggle"><button type="button" class="' + (ui.taskViewMode === 'byBusiness' ? 'active' : '') + '" data-action="set-task-view" data-mode="byBusiness">事業別</button><button type="button" class="' + (ui.taskViewMode === 'all' ? 'active' : '') + '" data-action="set-task-view" data-mode="all">全タスク</button></div>' +
      (readOnly || (!ui.selectedBusinessId && ui.taskViewMode !== 'all') ? '' : '<button type="button" class="btn btn-primary btn-sm" data-action="open-add-task" data-business-id="' + (ui.selectedBusinessId || '') + '">+ タスク追加</button>') +
      '</div></div>' +
      (tasks.length ? taskRows : '<div class="empty"><div class="empty-title">タスクがありません</div><div class="empty-sub">' + (state.businesses.length ? '「+ タスク追加」から登録できます' : '先に事業を追加してください') + '</div></div>') +
      '</div>';

    return '<div class="topbar"><div><div class="page-title">事業とタスク</div><div class="page-sub">事業ごとにタスクを管理します</div></div></div>' +
      '<div class="content">' + readOnlyBanner() + '<div class="biz-layout">' + bizPane + taskPane + '</div></div>';
  }
  function statusLabel(k) { for (var i = 0; i < TASK_STATUSES.length; i++) if (TASK_STATUSES[i].key === k) return TASK_STATUSES[i].label; return '未着手'; }

  /* ============================== MODALS ==================================== */
  function openModal(html) {
    var root = document.getElementById('modal-root');
    if (!root) return;
    root.innerHTML = '<div class="modal-backdrop">' + html + '</div>';
    var first = root.querySelector('input, select, textarea');
    if (first) setTimeout(function () { first.focus(); }, 30);
  }
  function closeModal() {
    var root = document.getElementById('modal-root');
    if (root) root.innerHTML = '';
    pendingConfirmAction = null;
  }

  function modalShell(title, bodyHtml, footHtml, formAttrs) {
    var open = formAttrs ? '<form class="modal" ' + formAttrs + '>' : '<div class="modal">';
    var close = formAttrs ? '</form>' : '</div>';
    return open +
      '<div class="modal-head"><h2>' + esc(title) + '</h2><button type="button" class="btn btn-ghost icon-btn" data-action="close-modal" aria-label="閉じる">✕</button></div>' +
      '<div class="modal-body">' + bodyHtml + '</div>' +
      '<div class="modal-foot">' + footHtml + '</div>' +
      close;
  }

  function renderAccountForm(a) {
    var isEdit = !!a;
    a = a || {};
    var relatedDeals = isEdit ? state.deals.filter(function (d) { return d.accountId === a.id; }) : [];
    var relatedPeople = isEdit ? state.customers.filter(function (c) { return c.accountId === a.id; }) : [];
    var relatedHtml = '';
    if (relatedPeople.length) {
      relatedHtml += '<div class="field"><label>所属する顧客（' + relatedPeople.length + '名）</label><div class="related-list">' +
        relatedPeople.map(function (c) { return '<div class="related-item">' + esc(c.name) + (c.title ? '<span class="amt">' + esc(c.title) + '</span>' : '') + '</div>'; }).join('') +
        '</div></div>';
    }
    if (relatedDeals.length) {
      relatedHtml += '<div class="field"><label>関連する案件（' + relatedDeals.length + '件）</label><div class="related-list">' +
        relatedDeals.map(function (d) { return '<div class="related-item"><span class="funnel-dot" style="background:var(--stage-' + d.stage + ')"></span>' + esc(d.title) + '<span class="amt">' + fmtYen(d.amount) + '</span></div>'; }).join('') +
        '</div></div>';
    }
    var body =
      '<div class="form-grid">' +
      '<div class="field span-2"><label>会社名<span class="req">*</span></label><input name="name" required maxlength="80" value="' + esc(a.name) + '" placeholder="株式会社サンプル"></div>' +
      '<div class="field"><label>業種</label><input name="industry" maxlength="60" value="' + esc(a.industry) + '" placeholder="製造業"></div>' +
      '<div class="field"><label>担当者</label><input name="contact" maxlength="60" value="' + esc(a.contact) + '" placeholder="山田 太郎"></div>' +
      '<div class="field"><label>電話番号</label><input name="phone" maxlength="40" value="' + esc(a.phone) + '" placeholder="03-1234-5678"></div>' +
      '<div class="field"><label>メールアドレス</label><input name="email" type="email" maxlength="120" value="' + esc(a.email) + '" placeholder="contact@example.com"></div>' +
      '<div class="field span-2"><label>URL（HPなど）</label><input name="url" type="text" maxlength="200" value="' + esc(a.url) + '" placeholder="https://example.com"></div>' +
      '<div class="field span-2"><label>住所</label><input name="address" maxlength="160" value="' + esc(a.address) + '"></div>' +
      '<div class="field span-2"><label>メモ</label><textarea name="memo" maxlength="1000">' + esc(a.memo) + '</textarea></div>' +
      '</div>' + relatedHtml;
    var foot = (isEdit && !readOnly ? '<button type="button" class="btn btn-danger" data-action="delete-account" data-id="' + a.id + '">削除</button>' : '<span></span>') +
      '<div style="display:flex;gap:8px;"><button type="button" class="btn" data-action="close-modal">キャンセル</button>' + (readOnly ? '' : '<button type="submit" class="btn btn-primary">保存</button>') + '</div>';
    return modalShell(isEdit ? '取引先を編集' : '新規取引先', body, foot, 'data-form="account" data-id="' + (a.id || '') + '"');
  }

  function animalPreviewHtml(dateStr) {
    var fortune = dateStr ? animalFortune(dateStr) : null;
    return fortune ?
      ('🐾 <b>' + esc(fortune.name) + '</b>（動物占い No.' + fortune.no + '）') :
      '誕生日を入力すると動物占いの結果が表示されます';
  }

  function renderCustomerForm(c) {
    var isEdit = !!c;
    c = c || {};
    var body =
      '<div class="form-grid">' +
      '<div class="field span-2"><label>氏名<span class="req">*</span></label><input name="name" required maxlength="80" value="' + esc(c.name) + '" placeholder="山田 太郎"></div>' +
      '<div class="field span-2"><label>勤務先・職業</label><input name="title" maxlength="60" value="' + esc(c.title) + '" placeholder="◯◯株式会社（会社員）"></div>' +
      '<div class="field"><label>担当コンサルタント</label><input name="consultant" maxlength="60" value="' + esc(c.consultant) + '" placeholder="鈴木"></div>' +
      '<div class="field"><label>電話番号</label><input name="phone" maxlength="40" value="' + esc(c.phone) + '" placeholder="090-1234-5678"></div>' +
      '<div class="field"><label>誕生日</label><input name="birthday" type="date" value="' + esc(c.birthday) + '" data-input="customer-birthday"></div>' +
      '<div class="field span-2"><label>メールアドレス</label><input name="email" type="email" maxlength="120" value="' + esc(c.email) + '" placeholder="taro@example.com"></div>' +
      '<div class="field span-2" style="background:var(--surface-alt);border-radius:8px;padding:10px 12px;font-size:12.5px;color:var(--text-secondary);" id="animal-fortune-preview">' + animalPreviewHtml(c.birthday) + '</div>' +
      '<div class="field span-2"><label>メモ</label><textarea name="memo" maxlength="1000">' + esc(c.memo) + '</textarea></div>' +
      '</div>';
    var foot = (isEdit && !readOnly ? '<button type="button" class="btn btn-danger" data-action="delete-customer" data-id="' + c.id + '">削除</button>' : '<span></span>') +
      '<div style="display:flex;gap:8px;"><button type="button" class="btn" data-action="close-modal">キャンセル</button>' + (readOnly ? '' : '<button type="submit" class="btn btn-primary">保存</button>') + '</div>';
    return modalShell(isEdit ? '顧客を編集' : '新規顧客', body, foot, 'data-form="customer" data-id="' + (c.id || '') + '"');
  }

  function renderPartnerForm(p) {
    var isEdit = !!p;
    p = p || {};
    var body =
      '<div class="form-grid">' +
      '<div class="field span-2"><label>パートナー氏名<span class="req">*</span></label><input name="name" required maxlength="80" value="' + esc(p.name) + '" placeholder="山田 太郎"></div>' +
      '<div class="field"><label>属性</label><input name="attribute" maxlength="60" value="' + esc(p.attribute) + '" placeholder="保険募集人 / 士業 / キーマン など" list="partner-attribute-options"></div>' +
      '<div class="field"><label>職業</label><input name="occupation" maxlength="60" value="' + esc(p.occupation) + '" placeholder="税理士"></div>' +
      '<div class="field"><label>アプローチ担当</label><input name="approachOwner" maxlength="60" value="' + esc(p.approachOwner) + '" placeholder="鈴木"></div>' +
      '<div class="field span-2"><label>ネクストアクション</label><textarea name="nextAction" maxlength="1000">' + esc(p.nextAction) + '</textarea></div>' +
      '</div>' +
      '<datalist id="partner-attribute-options"><option value="保険募集人"><option value="士業"><option value="キーマン"></datalist>';
    var foot = (isEdit && !readOnly ? '<button type="button" class="btn btn-danger" data-action="delete-partner" data-id="' + p.id + '">削除</button>' : '<span></span>') +
      '<div style="display:flex;gap:8px;"><button type="button" class="btn" data-action="close-modal">キャンセル</button>' + (readOnly ? '' : '<button type="submit" class="btn btn-primary">保存</button>') + '</div>';
    return modalShell(isEdit ? 'パートナーを編集' : '新規パートナー', body, foot, 'data-form="partner" data-id="' + (p.id || '') + '"');
  }

  function renderDealForm(d) {
    var isEdit = !!d;
    d = d || { stage: 'lead' };
    var accOptions = state.accounts.map(function (a) { return opt(a.id, a.name, d.accountId); }).join('');
    var custOptions = '<option value="">未設定</option>' + state.customers.map(function (c) { var acc = findAccount(c.accountId); return opt(c.id, c.name + (acc ? '（' + acc.name + '）' : ''), d.customerId); }).join('');
    var bizOptions = '<option value="">未設定</option>' + state.businesses.map(function (b) { return opt(b.id, b.name, d.businessId); }).join('');
    var stageOptions = STAGES.map(function (s) { return opt(s.key, s.label, d.stage); }).join('');
    var body = '<div class="form-grid">' +
      '<div class="field span-2"><label>案件名<span class="req">*</span></label><input name="title" required maxlength="120" value="' + esc(d.title) + '" placeholder="○○様向け△△導入"></div>' +
      '<div class="field"><label>取引先<span class="req">*</span></label><select name="accountId" required' + (state.accounts.length ? '' : ' disabled') + '><option value="">選択してください</option>' + accOptions + '</select></div>' +
      '<div class="field"><label>顧客（担当者）</label><select name="customerId">' + custOptions + '</select></div>' +
      '<div class="field"><label>関連する事業</label><select name="businessId">' + bizOptions + '</select></div>' +
      '<div class="field"><label>ステージ</label><select name="stage">' + stageOptions + '</select></div>' +
      '<div class="field"><label>金額（円）</label><input name="amount" type="number" min="0" step="1" value="' + (d.amount != null ? d.amount : '') + '" placeholder="1000000"></div>' +
      '<div class="field"><label>予定日 / 成立日</label><input name="closeDate" type="date" value="' + esc(d.closeDate) + '"></div>' +
      '<div class="field"><label>担当者（自社側）</label><input name="owner" maxlength="60" value="' + esc(d.owner) + '"></div>' +
      '<div class="field span-2"><label>メモ</label><textarea name="memo" maxlength="1000">' + esc(d.memo) + '</textarea></div>' +
      '</div>' +
      (state.accounts.length ? '' : '<div class="stat-note" style="color:var(--danger-text);">先に「取引先」から会社を登録してください</div>');
    var foot = (isEdit && !readOnly ? '<button type="button" class="btn btn-danger" data-action="delete-deal" data-id="' + d.id + '">削除</button>' : '<span></span>') +
      '<div style="display:flex;gap:8px;"><button type="button" class="btn" data-action="close-modal">キャンセル</button>' + (readOnly ? '' : '<button type="submit" class="btn btn-primary">保存</button>') + '</div>';
    return modalShell(isEdit ? '案件を編集' : '新規案件', body, foot, 'data-form="deal" data-id="' + (d.id || '') + '"');
  }

  function renderBusinessForm(b) {
    var isEdit = !!b;
    b = b || {};
    var presetOptions = BUSINESS_PRESETS.map(function (name) { return '<option value="' + esc(name) + '">'; }).join('');
    var body = '<div class="form-grid">' +
      '<div class="field span-2"><label>事業名<span class="req">*</span></label><input name="name" required maxlength="80" value="' + esc(b.name) + '" placeholder="新規開拓プロジェクト" list="business-name-options"></div>' +
      '<div class="field span-2"><label>メモ</label><textarea name="memo" maxlength="1000">' + esc(b.memo) + '</textarea></div>' +
      '</div>' +
      '<datalist id="business-name-options">' + presetOptions + '</datalist>';
    var foot = (isEdit && !readOnly ? '<button type="button" class="btn btn-danger" data-action="delete-business" data-id="' + b.id + '">削除</button>' : '<span></span>') +
      '<div style="display:flex;gap:8px;"><button type="button" class="btn" data-action="close-modal">キャンセル</button>' + (readOnly ? '' : '<button type="submit" class="btn btn-primary">保存</button>') + '</div>';
    return modalShell(isEdit ? '事業を編集' : '新規事業', body, foot, 'data-form="business" data-id="' + (b.id || '') + '"');
  }

  function renderTaskForm(t, defaultBusinessId) {
    var isEdit = !!t;
    t = t || { businessId: defaultBusinessId || '', priority: 'mid', status: 'todo' };
    var bizOptions = state.businesses.map(function (b) { return opt(b.id, b.name, t.businessId); }).join('');
    var dealOptions = '<option value="">関連案件なし</option>' + state.deals.map(function (d) { return opt(d.id, d.title, t.dealId); }).join('');
    var prOptions = PRIORITIES.map(function (p) { return opt(p.key, p.label, t.priority); }).join('');
    var stOptions = TASK_STATUSES.map(function (s) { return opt(s.key, s.label, t.status); }).join('');
    var body = '<div class="form-grid">' +
      '<div class="field span-2"><label>タスク名<span class="req">*</span></label><input name="title" required maxlength="120" value="' + esc(t.title) + '" placeholder="見積書を送付する"></div>' +
      '<div class="field"><label>事業<span class="req">*</span></label><select name="businessId" required' + (state.businesses.length ? '' : ' disabled') + '><option value="">選択してください</option>' + bizOptions + '</select></div>' +
      '<div class="field"><label>関連案件</label><select name="dealId">' + dealOptions + '</select></div>' +
      '<div class="field"><label>タスク責任者</label><input name="assignee" maxlength="60" value="' + esc(t.assignee) + '"></div>' +
      '<div class="field"><label>期日</label><input name="dueDate" type="date" value="' + esc(t.dueDate) + '"></div>' +
      '<div class="field"><label>優先度</label><select name="priority">' + prOptions + '</select></div>' +
      '<div class="field"><label>ステータス</label><select name="status">' + stOptions + '</select></div>' +
      '<div class="field span-2"><label>メモ</label><textarea name="memo" maxlength="1000">' + esc(t.memo) + '</textarea></div>' +
      '</div>' +
      (state.businesses.length ? '' : '<div class="stat-note" style="color:var(--danger-text);">先に事業を追加してください</div>');
    var foot = (isEdit && !readOnly ? '<button type="button" class="btn btn-danger" data-action="delete-task" data-id="' + t.id + '">削除</button>' : '<span></span>') +
      '<div style="display:flex;gap:8px;"><button type="button" class="btn" data-action="close-modal">キャンセル</button>' + (readOnly ? '' : '<button type="submit" class="btn btn-primary">保存</button>') + '</div>';
    return modalShell(isEdit ? 'タスクを編集' : '新規タスク', body, foot, 'data-form="task" data-id="' + (t.id || '') + '"');
  }

  function renderConfirmModal(message) {
    var body = '<p style="font-size:13.5px;color:var(--text-secondary);">' + esc(message) + '</p>';
    var foot = '<span></span><div style="display:flex;gap:8px;"><button type="button" class="btn" data-action="confirm-no">キャンセル</button><button type="button" class="btn btn-danger" data-action="confirm-yes">削除する</button></div>';
    return modalShell('確認', body, foot, null);
  }
  function openConfirm(message, fn) { pendingConfirmAction = fn; openModal(renderConfirmModal(message)); }

  /* ============================== TOAST ===================================== */
  function showToast(msg, kind) {
    var root = document.getElementById('toast-root');
    if (!root) return;
    var id = 'toast_' + (++toastSeq);
    var el = document.createElement('div');
    el.className = 'toast' + (kind ? ' ' + kind : '');
    el.id = id;
    el.textContent = msg;
    root.appendChild(el);
    setTimeout(function () { var e = document.getElementById(id); if (e) e.remove(); }, 4000);
  }

  /* ============================== CRUD ======================================= */
  function saveAccountForm(form) {
    var fd = new FormData(form);
    var id = form.dataset.id;
    var data = {
      name: (fd.get('name') || '').toString().trim(),
      industry: (fd.get('industry') || '').toString().trim(),
      contact: (fd.get('contact') || '').toString().trim(),
      phone: (fd.get('phone') || '').toString().trim(),
      email: (fd.get('email') || '').toString().trim(),
      url: (fd.get('url') || '').toString().trim(),
      address: (fd.get('address') || '').toString().trim(),
      memo: (fd.get('memo') || '').toString().trim()
    };
    if (!data.name) return;
    if (id) {
      var existing = findAccount(id);
      if (existing) Object.assign(existing, data);
    } else {
      data.id = uid('acct');
      data.createdAt = new Date().toISOString();
      state.accounts.push(data);
    }
    closeModal();
    persist();
  }

  function doDeleteAccount(id) {
    var hasDeals = state.deals.some(function (d) { return d.accountId === id; });
    if (hasDeals) {
      showToast('この取引先には案件が紐づいているため削除できません', 'warn');
      return;
    }
    state.accounts = state.accounts.filter(function (a) { return a.id !== id; });
    state.customers.forEach(function (c) { if (c.accountId === id) c.accountId = null; });
    closeModal();
    persist();
  }

  function saveCustomerForm(form) {
    var fd = new FormData(form);
    var id = form.dataset.id;
    var data = {
      name: (fd.get('name') || '').toString().trim(),
      title: (fd.get('title') || '').toString().trim(),
      consultant: (fd.get('consultant') || '').toString().trim(),
      phone: (fd.get('phone') || '').toString().trim(),
      birthday: (fd.get('birthday') || '').toString(),
      email: (fd.get('email') || '').toString().trim(),
      memo: (fd.get('memo') || '').toString().trim()
    };
    if (!data.name) return;
    if (id) {
      var existing = findCustomer(id);
      if (existing) Object.assign(existing, data);
    } else {
      data.id = uid('cust');
      data.accountId = null;
      data.createdAt = new Date().toISOString();
      state.customers.push(data);
    }
    closeModal();
    persist();
  }

  function doDeleteCustomer(id) {
    state.customers = state.customers.filter(function (c) { return c.id !== id; });
    state.deals.forEach(function (d) { if (d.customerId === id) d.customerId = null; });
    closeModal();
    persist();
  }

  function savePartnerForm(form) {
    var fd = new FormData(form);
    var id = form.dataset.id;
    var data = {
      name: (fd.get('name') || '').toString().trim(),
      attribute: (fd.get('attribute') || '').toString().trim(),
      occupation: (fd.get('occupation') || '').toString().trim(),
      approachOwner: (fd.get('approachOwner') || '').toString().trim(),
      nextAction: (fd.get('nextAction') || '').toString().trim()
    };
    if (!data.name) return;
    if (id) {
      var existing = findPartner(id);
      if (existing) Object.assign(existing, data);
    } else {
      data.id = uid('partner');
      data.createdAt = new Date().toISOString();
      state.partners.push(data);
    }
    closeModal();
    persist();
  }

  function doDeletePartner(id) {
    state.partners = state.partners.filter(function (p) { return p.id !== id; });
    closeModal();
    persist();
  }

  function saveDealForm(form) {
    var fd = new FormData(form);
    var id = form.dataset.id;
    var data = {
      title: (fd.get('title') || '').toString().trim(),
      accountId: (fd.get('accountId') || '').toString(),
      customerId: (fd.get('customerId') || '').toString() || null,
      businessId: (fd.get('businessId') || '').toString() || null,
      stage: (fd.get('stage') || 'lead').toString(),
      amount: Number(fd.get('amount')) || 0,
      closeDate: (fd.get('closeDate') || '').toString(),
      owner: (fd.get('owner') || '').toString().trim(),
      memo: (fd.get('memo') || '').toString().trim()
    };
    if (!data.title || !data.accountId) return;
    if (id) {
      var existing = findDeal(id);
      if (existing) { Object.assign(existing, data); existing.updatedAt = new Date().toISOString(); }
    } else {
      data.id = uid('deal');
      data.createdAt = new Date().toISOString();
      data.updatedAt = data.createdAt;
      state.deals.push(data);
    }
    closeModal();
    persist();
  }

  function doDeleteDeal(id) {
    state.deals = state.deals.filter(function (d) { return d.id !== id; });
    state.tasks.forEach(function (t) { if (t.dealId === id) t.dealId = null; });
    closeModal();
    persist();
  }

  function moveDealStage(id, stage) {
    var d = findDeal(id);
    if (!d || d.stage === stage) return;
    d.stage = stage;
    d.updatedAt = new Date().toISOString();
    persist();
  }

  function saveBusinessForm(form) {
    var fd = new FormData(form);
    var id = form.dataset.id;
    var data = { name: (fd.get('name') || '').toString().trim(), memo: (fd.get('memo') || '').toString().trim() };
    if (!data.name) return;
    if (id) {
      var existing = findBusiness(id);
      if (existing) Object.assign(existing, data);
    } else {
      data.id = uid('biz');
      data.createdAt = new Date().toISOString();
      state.businesses.push(data);
      ui.selectedBusinessId = data.id;
    }
    closeModal();
    persist();
  }

  function doDeleteBusiness(id) {
    state.businesses = state.businesses.filter(function (b) { return b.id !== id; });
    state.tasks = state.tasks.filter(function (t) { return t.businessId !== id; });
    state.deals.forEach(function (d) { if (d.businessId === id) d.businessId = null; });
    if (ui.selectedBusinessId === id) ui.selectedBusinessId = (state.businesses[0] && state.businesses[0].id) || null;
    closeModal();
    persist();
  }

  /* Drag-and-drop reorder of the businesses list (see the dragstart/dragover/
   * drop handlers in setupEvents). Removes the dragged business first, then
   * re-locates the (possibly now-shifted) target and inserts before/after it
   * — handles moving earlier or later in the list uniformly. */
  function doReorderBusiness(draggedId, targetId, insertBefore) {
    var fromIdx = state.businesses.findIndex(function (b) { return b.id === draggedId; });
    if (fromIdx === -1) return;
    var moved = state.businesses.splice(fromIdx, 1)[0];
    var toIdx = state.businesses.findIndex(function (b) { return b.id === targetId; });
    if (toIdx === -1) { state.businesses.splice(fromIdx, 0, moved); return; }
    var insertAt = insertBefore ? toIdx : toIdx + 1;
    state.businesses.splice(insertAt, 0, moved);
    persist();
  }

  function saveTaskForm(form) {
    var fd = new FormData(form);
    var id = form.dataset.id;
    var data = {
      title: (fd.get('title') || '').toString().trim(),
      businessId: (fd.get('businessId') || '').toString(),
      dealId: (fd.get('dealId') || '').toString() || null,
      assignee: (fd.get('assignee') || '').toString().trim(),
      dueDate: (fd.get('dueDate') || '').toString(),
      priority: (fd.get('priority') || 'mid').toString(),
      status: (fd.get('status') || 'todo').toString(),
      memo: (fd.get('memo') || '').toString().trim()
    };
    if (!data.title || !data.businessId) return;
    if (id) {
      var existing = findTask(id);
      if (existing) Object.assign(existing, data);
    } else {
      data.id = uid('task');
      data.createdAt = new Date().toISOString();
      state.tasks.push(data);
    }
    closeModal();
    persist();
  }

  function doDeleteTask(id) {
    state.tasks = state.tasks.filter(function (t) { return t.id !== id; });
    closeModal();
    persist();
  }

  function cycleTaskStatus(id) {
    var t = findTask(id);
    if (!t) return;
    var order = ['todo', 'doing', 'done'];
    var idx = order.indexOf(t.status);
    t.status = order[(idx + 1) % order.length];
    persist();
  }

  /* ============================== PERSIST ==================================== */
  function getArtifactNS() {
    if (!window.claude) return Promise.resolve(null);
    if (!artifactPromise) artifactPromise = window.claude.use('artifact').catch(function () { return null; });
    return artifactPromise;
  }

  function persist() {
    state.updatedAt = new Date().toISOString();
    render();
    if (!window.claude) return; /* standalone preview: no persistence available */
    if (readOnly) { showToast('閲覧専用のため保存されません', 'warn'); return; }
    saving = true;
    render();
    getArtifactNS().then(function (artifact) {
      if (!artifact) { saving = false; render(); return; }
      var doc = buildDocument(state, APP_JS_SOURCE);
      artifact.publish(doc).then(function () {
        saving = false;
        /* a successful publish reloads this view */
      }).catch(function (err) {
        saving = false;
        handlePublishError(err);
        render();
      });
    });
  }

  function handlePublishError(err) {
    var code = err && err.code;
    if (code === 'conflict') { return; }
    if (code === 'not_writer' || code === 'not_granted' || code === 'consent_required' || code === 'not_declared' || code === 'capability_disabled' || code === 'capability_removed') {
      readOnly = true;
      showToast('閲覧専用モードです。変更は保存されません', 'warn');
      return;
    }
    if (code === 'rate_limited') { showToast('保存が混み合っています。しばらくして操作してください', 'warn'); return; }
    if (code === 'too_large') { showToast('データ量が多すぎて保存できませんでした', 'error'); return; }
    if (code === 'upstream_error') {
      var delay = 500 + Math.random() * 600;
      setTimeout(function () {
        getArtifactNS().then(function (artifact) {
          if (!artifact) return;
          artifact.publish(buildDocument(state, APP_JS_SOURCE)).catch(function () {
            showToast('保存に失敗しました。もう一度お試しください', 'error');
          });
        });
      }, delay);
      return;
    }
    console.warn('SFA publish failed', err);
    showToast('保存に失敗しました', 'error');
  }

  /* ============================== EVENTS ====================================== */
  function setupEvents() {
    document.addEventListener('click', function (e) {
      if (e.target.classList && e.target.classList.contains('modal-backdrop')) { closeModal(); return; }
      var t = e.target.closest('[data-action]');
      if (!t) return;
      var action = t.dataset.action;
      var id = t.dataset.id;
      if (readOnly && ['open-add-account', 'open-add-customer', 'open-add-partner', 'open-add-deal', 'open-add-business', 'open-add-task', 'delete-account', 'delete-customer', 'delete-partner', 'delete-deal', 'delete-business', 'delete-task', 'cycle-task-status'].indexOf(action) !== -1) {
        showToast('閲覧専用のため操作できません', 'warn');
        return;
      }
      switch (action) {
        case 'nav': ui.tab = t.dataset.tab; render(); break;
        case 'open-add-account': openModal(renderAccountForm(null)); break;
        case 'edit-account': openModal(renderAccountForm(findAccount(id))); break;
        case 'delete-account': openConfirm('この取引先を削除しますか？', function () { doDeleteAccount(id); }); break;
        case 'open-add-customer': openModal(renderCustomerForm(null)); break;
        case 'edit-customer': openModal(renderCustomerForm(findCustomer(id))); break;
        case 'delete-customer': openConfirm('この顧客を削除しますか？', function () { doDeleteCustomer(id); }); break;
        case 'open-add-partner': openModal(renderPartnerForm(null)); break;
        case 'edit-partner': openModal(renderPartnerForm(findPartner(id))); break;
        case 'delete-partner': openConfirm('このパートナーを削除しますか？', function () { doDeletePartner(id); }); break;
        case 'open-add-deal': openModal(renderDealForm(null)); break;
        case 'edit-deal': openModal(renderDealForm(findDeal(id))); break;
        case 'delete-deal': openConfirm('この案件を削除しますか？', function () { doDeleteDeal(id); }); break;
        case 'open-add-business': openModal(renderBusinessForm(null)); break;
        case 'edit-business': openModal(renderBusinessForm(findBusiness(id))); break;
        case 'delete-business': openConfirm('この事業を削除しますか？紐づくタスクもすべて削除されます。', function () { doDeleteBusiness(id); }); break;
        case 'open-add-task': openModal(renderTaskForm(null, t.dataset.businessId)); break;
        case 'edit-task': openModal(renderTaskForm(findTask(id))); break;
        case 'delete-task': openConfirm('このタスクを削除しますか？', function () { doDeleteTask(id); }); break;
        case 'cycle-task-status': cycleTaskStatus(id); break;
        case 'select-business': ui.selectedBusinessId = id; ui.taskViewMode = 'byBusiness'; render(); break;
        case 'set-task-view': ui.taskViewMode = t.dataset.mode; render(); break;
        case 'close-modal': closeModal(); render(); break;
        case 'confirm-yes':
          var fn = pendingConfirmAction; pendingConfirmAction = null;
          if (fn) fn();
          break;
        case 'confirm-no': closeModal(); render(); break;
      }
    });

    document.addEventListener('submit', function (e) {
      var form = e.target;
      if (!form || !form.matches || !form.matches('[data-form]')) return;
      e.preventDefault();
      if (readOnly) { showToast('閲覧専用のため保存できません', 'warn'); return; }
      var type = form.dataset.form;
      if (type === 'account') saveAccountForm(form);
      else if (type === 'customer') saveCustomerForm(form);
      else if (type === 'partner') savePartnerForm(form);
      else if (type === 'deal') saveDealForm(form);
      else if (type === 'business') saveBusinessForm(form);
      else if (type === 'task') saveTaskForm(form);
    });

    document.addEventListener('input', function (e) {
      var el = e.target;
      if (!el.dataset) return;
      if (el.dataset.input === 'account-filter') { ui.accountFilter = el.value; renderKeepFocus(el); }
      else if (el.dataset.input === 'person-filter') { ui.personFilter = el.value; renderKeepFocus(el); }
      else if (el.dataset.input === 'partner-filter') { ui.partnerFilter = el.value; renderKeepFocus(el); }
      else if (el.dataset.input === 'deal-filter') { ui.dealFilter = el.value; renderKeepFocus(el); }
      else if (el.dataset.input === 'customer-birthday') {
        /* local modal-only preview — must NOT call the global render(), which
         * would rebuild #modal-root empty and discard the open form */
        var preview = document.getElementById('animal-fortune-preview');
        if (preview) preview.innerHTML = animalPreviewHtml(el.value);
      }
    });

    function renderKeepFocus(el) {
      var selStart = el.selectionStart, selEnd = el.selectionEnd, name = el.dataset.input;
      render();
      var again = document.querySelector('[data-input="' + name + '"]');
      if (again) { again.focus(); try { again.setSelectionRange(selStart, selEnd); } catch (e) {} }
    }

    /* drag and drop for kanban */
    document.addEventListener('dragstart', function (e) {
      var card = e.target.closest && e.target.closest('.deal-card');
      if (!card) return;
      e.dataTransfer.setData('text/plain', card.dataset.id);
      e.dataTransfer.effectAllowed = 'move';
      card.classList.add('dragging');
    });
    document.addEventListener('dragend', function (e) {
      var card = e.target.closest && e.target.closest('.deal-card');
      if (card) card.classList.remove('dragging');
    });
    document.addEventListener('dragover', function (e) {
      var col = e.target.closest && e.target.closest('.kanban-col');
      if (!col) return;
      e.preventDefault();
      col.classList.add('drag-over');
    });
    document.addEventListener('dragleave', function (e) {
      var col = e.target.closest && e.target.closest('.kanban-col');
      if (col && !col.contains(e.relatedTarget)) col.classList.remove('drag-over');
    });
    document.addEventListener('drop', function (e) {
      var col = e.target.closest && e.target.closest('.kanban-col');
      if (!col) return;
      e.preventDefault();
      col.classList.remove('drag-over');
      if (readOnly) { showToast('閲覧専用のため操作できません', 'warn'); return; }
      var dealId = e.dataTransfer.getData('text/plain');
      var stage = col.dataset.stage;
      if (dealId && stage) moveDealStage(dealId, stage);
    });

    /* drag and drop to reorder the businesses list — one continuous drag can
     * move a business past several others, instead of clicking one step at
     * a time. Only fires persist()/republish once, on drop. */
    document.addEventListener('dragstart', function (e) {
      var card = e.target.closest && e.target.closest('.biz-card');
      if (!card) return;
      e.dataTransfer.setData('application/x-att-business-id', card.dataset.id);
      e.dataTransfer.effectAllowed = 'move';
      card.classList.add('dragging');
    });
    document.addEventListener('dragend', function (e) {
      var card = e.target.closest && e.target.closest('.biz-card');
      if (card) card.classList.remove('dragging');
      var marked = document.querySelectorAll('.biz-card.drag-over-above, .biz-card.drag-over-below');
      for (var i = 0; i < marked.length; i++) marked[i].classList.remove('drag-over-above', 'drag-over-below');
    });
    document.addEventListener('dragover', function (e) {
      var card = e.target.closest && e.target.closest('.biz-card');
      if (!card || card.classList.contains('dragging')) return;
      e.preventDefault();
      var rect = card.getBoundingClientRect();
      var isAbove = (e.clientY - rect.top) < rect.height / 2;
      card.classList.toggle('drag-over-above', isAbove);
      card.classList.toggle('drag-over-below', !isAbove);
    });
    document.addEventListener('dragleave', function (e) {
      var card = e.target.closest && e.target.closest('.biz-card');
      if (card && !card.contains(e.relatedTarget)) card.classList.remove('drag-over-above', 'drag-over-below');
    });
    document.addEventListener('drop', function (e) {
      var card = e.target.closest && e.target.closest('.biz-card');
      if (!card) return;
      var draggedId = e.dataTransfer.getData('application/x-att-business-id');
      if (!draggedId) return; /* not a business-card drag */
      e.preventDefault();
      card.classList.remove('drag-over-above', 'drag-over-below');
      if (readOnly) { showToast('閲覧専用のため操作できません', 'warn'); return; }
      var targetId = card.dataset.id;
      if (draggedId === targetId) return;
      var rect = card.getBoundingClientRect();
      var insertBefore = (e.clientY - rect.top) < rect.height / 2;
      doReorderBusiness(draggedId, targetId, insertBefore);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { var root = document.getElementById('modal-root'); if (root && root.innerHTML) { closeModal(); render(); } }
    });
  }

  function bootstrap() {
    setupEvents();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
