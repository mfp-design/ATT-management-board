const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (msg) => { if (msg.type() === 'error' && !msg.text().includes('ERR_TUNNEL_CONNECTION_FAILED')) errors.push('console: ' + msg.text()); });

  await page.goto('file://' + path.join(__dirname, 'index.html'));
  await page.waitForTimeout(200);

  let allPass = true;
  function check(cond, label) {
    console.log((cond ? 'PASS' : 'FAIL'), label);
    if (!cond) allPass = false;
  }

  await page.click('.nav-item[data-tab="businesses"]');
  await page.waitForTimeout(100);

  // 1. Add-business form is free-text with suggestions (see test8/test10 for
  // full coverage of this form) — here we just need two businesses to check colors.
  await page.click('[data-action="open-add-business"]');
  await page.waitForTimeout(100);
  await page.fill('input[name="name"]', 'FP事業');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(150);

  await page.click('[data-action="open-add-business"]');
  await page.waitForTimeout(100);
  await page.fill('input[name="name"]', 'MoneRun');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(150);

  // 3. Business cards show a color dot / colored left border
  const card1Color = await page.locator('.biz-card').nth(0).evaluate(el => getComputedStyle(el).borderLeftColor);
  const card2Color = await page.locator('.biz-card').nth(1).evaluate(el => getComputedStyle(el).borderLeftColor);
  check(!!card1Color && card1Color !== 'rgba(0, 0, 0, 0)', 'first biz-card has a colored left border: ' + card1Color);
  check(card1Color !== card2Color, 'two different businesses get two different colors (' + card1Color + ' vs ' + card2Color + ')');

  // 4. Task form: labels renamed, business select works, and task rows are color-coded
  await page.click('.biz-card >> nth=0');
  await page.waitForTimeout(100);
  await page.click('[data-action="open-add-task"]');
  await page.waitForTimeout(100);
  check((await page.locator('label:has-text("期日")').count()) >= 1, 'task form has 期日 label');
  check((await page.locator('label:has-text("タスク責任者")').count()) === 1, 'task form has タスク責任者 label');
  await page.fill('input[name="title"]', '見積書送付');
  await page.fill('input[name="assignee"]', '田中');
  await page.fill('input[name="dueDate"]', '2026-09-15');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(150);

  const taskRowStyle = await page.locator('.task-row').first().getAttribute('style');
  check(!!taskRowStyle && taskRowStyle.includes('border-left'), 'task row has a colored left border style: ' + taskRowStyle);

  // switch to "全タスク" view to see the business-name badge + dot
  await page.click('[data-action="set-task-view"][data-mode="all"]');
  await page.waitForTimeout(100);
  const metaText = await page.locator('.task-meta').first().innerText();
  check(metaText.includes('責任者: 田中'), '担当者 label renamed to 責任者 in task row: ' + metaText.replace(/\n/g, ' | '));
  check((await page.locator('.task-meta .biz-dot').count()) >= 1, 'business color dot shown next to business name in all-tasks view');

  check(errors.length === 0, 'no unexpected console/page errors (' + errors.join(' | ') + ')');

  console.log(allPass ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED');
  await browser.close();
  process.exit(allPass ? 0 : 1);
})();
