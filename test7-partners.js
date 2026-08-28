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

  // 1. Sidebar tab exists
  check((await page.locator('.nav-item[data-tab="partners"]').count()) === 1, 'sidebar has パートナー nav item');
  const navText = await page.locator('.nav-item[data-tab="partners"]').innerText();
  check(navText.includes('パートナー'), 'nav item labeled パートナー');

  await page.click('.nav-item[data-tab="partners"]');
  await page.waitForTimeout(100);
  check((await page.locator('.page-title').innerText()) === 'パートナー', 'page title is パートナー');

  // 2. Empty state
  check((await page.locator('.empty-title').innerText()).includes('まだパートナーが登録されていません'), 'empty state shown initially');

  // 3. Add a partner with all fields
  await page.click('[data-action="open-add-partner"]');
  await page.waitForTimeout(100);
  check((await page.locator('.modal-head h2').innerText()) === '新規パートナー', 'modal title is 新規パートナー');
  const labels = await page.locator('.modal label').allInnerTexts();
  check(labels.some(l => l.includes('パートナー氏名')), 'has パートナー氏名 label: ' + labels.join(','));
  check(labels.some(l => l.includes('属性')), 'has 属性 label');
  check(labels.some(l => l.includes('職業')), 'has 職業 label');
  check(labels.some(l => l.includes('アプローチ担当')), 'has アプローチ担当 label');
  check(labels.some(l => l.includes('ネクストアクション')), 'has ネクストアクション label');

  await page.fill('input[name="name"]', '佐藤 一郎');
  await page.fill('input[name="attribute"]', '保険募集人');
  await page.fill('input[name="occupation"]', '生命保険会社 営業');
  await page.fill('input[name="approachOwner"]', '田中');
  await page.fill('textarea[name="nextAction"]', '来月アポイント設定');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(150);

  const rowText = await page.locator('.data-table tbody tr').first().innerText();
  check(rowText.includes('佐藤 一郎'), 'table shows partner name: ' + rowText.replace(/\n/g, ' | '));
  check(rowText.includes('保険募集人'), 'table shows attribute');
  check(rowText.includes('生命保険会社 営業'), 'table shows occupation');
  check(rowText.includes('田中'), 'table shows approach owner');
  check(rowText.includes('来月アポイント設定'), 'table shows next action');

  // 4. Edit round-trip
  await page.click('.data-table tbody tr >> nth=0');
  await page.waitForTimeout(100);
  check((await page.locator('input[name="name"]').inputValue()) === '佐藤 一郎', 'edit form name round-trips');
  check((await page.locator('input[name="attribute"]').inputValue()) === '保険募集人', 'edit form attribute round-trips');
  check((await page.locator('textarea[name="nextAction"]').inputValue()) === '来月アポイント設定', 'edit form nextAction round-trips');
  await page.fill('input[name="occupation"]', '生命保険会社 マネージャー');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(150);
  const rowText2 = await page.locator('.data-table tbody tr').first().innerText();
  check(rowText2.includes('生命保険会社 マネージャー'), 'edit persisted occupation change');

  // 5. Search filter
  await page.fill('[data-input="partner-filter"]', '存在しない名前');
  await page.waitForTimeout(100);
  check((await page.locator('.empty-title').innerText()).includes('該当するパートナーがありません'), 'filter shows no-match empty state');
  await page.fill('[data-input="partner-filter"]', '');
  await page.waitForTimeout(100);

  // 6. Delete
  await page.click('.data-table tbody tr >> nth=0');
  await page.waitForTimeout(100);
  await page.click('[data-action="delete-partner"]');
  await page.waitForTimeout(100);
  await page.click('[data-action="confirm-yes"]');
  await page.waitForTimeout(150);
  check((await page.locator('.empty-title').innerText()).includes('まだパートナーが登録されていません'), 'partner deleted, empty state returns');

  // 7. Other tabs / data untouched (sanity check other nav still works)
  await page.click('.nav-item[data-tab="accounts"]');
  await page.waitForTimeout(100);
  check((await page.locator('.page-title').innerText()) === '取引先', 'accounts tab still works after adding partners feature');

  check(errors.length === 0, 'no unexpected console/page errors (' + errors.join(' | ') + ')');

  console.log(allPass ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED');
  await browser.close();
  process.exit(allPass ? 0 : 1);
})();
