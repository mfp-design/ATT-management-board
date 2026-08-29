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

  // sidebar order: businesses -> KPI -> ideas
  const navLabels = await page.locator('.nav-item span').allInnerTexts();
  const bizIdx = navLabels.indexOf('事業とタスク');
  const kpiIdx = navLabels.indexOf('KPI');
  const ideaIdx = navLabels.indexOf('アイデア');
  check(bizIdx !== -1 && kpiIdx === bizIdx + 1, 'KPI tab sits right after 事業とタスク: ' + navLabels.join(','));
  check(ideaIdx === kpiIdx + 1, 'アイデア tab sits right after KPI: ' + navLabels.join(','));

  // set up two businesses to work with
  await page.click('.nav-item[data-tab="businesses"]');
  await page.waitForTimeout(100);
  async function addBusiness(name) {
    await page.click('[data-action="open-add-business"]');
    await page.fill('input[name="name"]', name);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(120);
  }
  await addBusiness('FP事業');
  await addBusiness('MoneRun');

  // ---- KPI tab ----
  await page.click('.nav-item[data-tab="kpi"]');
  await page.waitForTimeout(100);
  check((await page.locator('.page-title').innerText()) === 'KPI', 'KPI page title correct');
  check((await page.locator('.data-table tbody tr').count()) === 2, 'KPI table has one row per business');

  // edit first business's KPI numbers -> low conversion should be flagged
  await page.click('.data-table tbody tr >> nth=0');
  await page.waitForTimeout(100);
  check((await page.locator('.modal-head h2').innerText()).includes('FP事業'), 'KPI modal titled for the right business');
  await page.fill('input[name="approached"]', '100');
  await page.fill('input[name="negotiated"]', '10'); // 10% -> should be flagged low (danger)
  await page.fill('input[name="won"]', '5'); // 50% of negotiated -> healthy
  await page.click('button[type="submit"]');
  await page.waitForTimeout(150);

  let row0 = await page.locator('.data-table tbody tr').nth(0);
  let row0Text = await row0.innerText();
  check(row0Text.includes('100人') && row0Text.includes('10人') && row0Text.includes('5件'), 'KPI numbers saved and displayed: ' + row0Text.replace(/\n/g, ' | '));
  const lowBadgeClass = await row0.locator('.badge').nth(0).getAttribute('class'); // 商談化率 = 10/100 = 10% -> danger
  check(lowBadgeClass.includes('badge-danger'), 'low conversion rate (10%) is flagged as danger: ' + lowBadgeClass);
  const healthyBadgeClass = await row0.locator('.badge').nth(1).getAttribute('class'); // 成約率 = 5/10 = 50% -> healthy (muted)
  check(healthyBadgeClass.includes('badge-muted') && !healthyBadgeClass.includes('danger') && !healthyBadgeClass.includes('warning'), 'healthy conversion rate (50%) is not flagged: ' + healthyBadgeClass);

  // second business, no KPI entered yet -> shows em dash, not a false "low" flag
  let row1Text = await page.locator('.data-table tbody tr').nth(1).innerText();
  check(row1Text.includes('0人') && row1Text.includes('—'), 'business with no KPI data yet shows zeros/dashes, not a fake rate: ' + row1Text.replace(/\n/g, ' | '));

  // re-open and confirm values round-trip
  await page.click('.data-table tbody tr >> nth=0');
  await page.waitForTimeout(100);
  check((await page.locator('input[name="approached"]').inputValue()) === '100', 'approached value round-trips');
  check((await page.locator('input[name="negotiated"]').inputValue()) === '10', 'negotiated value round-trips');
  check((await page.locator('input[name="won"]').inputValue()) === '5', 'won value round-trips');
  await page.click('[data-action="close-modal"]');
  await page.waitForTimeout(100);

  // ---- Ideas tab ----
  await page.click('.nav-item[data-tab="ideas"]');
  await page.waitForTimeout(100);
  check((await page.locator('.empty-title').innerText()).includes('まだアイデアが登録されていません'), 'ideas empty state shown initially');

  await page.click('[data-action="open-add-idea"]');
  await page.waitForTimeout(100);
  check((await page.locator('select[name="businessId"] option').count()) >= 3, 'idea form business select has options (incl. placeholder)'); // placeholder + 2 businesses
  const bizOptionTexts = await page.locator('select[name="businessId"] option').allTextContents();
  check(bizOptionTexts.includes('FP事業') && bizOptionTexts.includes('MoneRun'), 'idea form business dropdown lists the same businesses: ' + bizOptionTexts.join(','));
  check((await page.locator('select[name="priority"] option').count()) === 3, 'idea form has 3 priority options');

  await page.selectOption('select[name="businessId"]', { label: 'FP事業' });
  await page.selectOption('select[name="priority"]', 'high');
  await page.fill('textarea[name="content"]', '紹介キャンペーンを開始する');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(150);

  let ideaRowText = await page.locator('.data-table tbody tr').first().innerText();
  check(ideaRowText.includes('FP事業'), 'idea row shows selected business: ' + ideaRowText.replace(/\n/g, ' | '));
  check(ideaRowText.includes('紹介キャンペーンを開始する'), 'idea row shows content');
  check(ideaRowText.includes('高'), 'idea row shows priority');

  // edit round-trip
  await page.click('.data-table tbody tr >> nth=0');
  await page.waitForTimeout(100);
  check((await page.locator('textarea[name="content"]').inputValue()) === '紹介キャンペーンを開始する', 'idea edit form content round-trips');
  check((await page.locator('select[name="priority"]').inputValue()) === 'high', 'idea edit form priority round-trips');
  await page.click('[data-action="close-modal"]');
  await page.waitForTimeout(100);

  // search filter
  await page.fill('[data-input="idea-filter"]', '存在しない内容');
  await page.waitForTimeout(100);
  check((await page.locator('.empty-title').innerText()).includes('該当するアイデアがありません'), 'idea filter shows no-match empty state');
  await page.fill('[data-input="idea-filter"]', '');
  await page.waitForTimeout(100);

  // delete
  await page.click('.data-table tbody tr >> nth=0');
  await page.waitForTimeout(100);
  await page.click('[data-action="delete-idea"]');
  await page.waitForTimeout(100);
  await page.click('[data-action="confirm-yes"]');
  await page.waitForTimeout(150);
  check((await page.locator('.empty-title').innerText()).includes('まだアイデアが登録されていません'), 'idea deleted, empty state returns');

  // ---- cascade delete: deleting a business removes its KPI row and its ideas ----
  await page.click('[data-action="open-add-idea"]');
  await page.waitForTimeout(100);
  await page.selectOption('select[name="businessId"]', { label: 'MoneRun' });
  await page.fill('textarea[name="content"]', 'MoneRun向けの新機能案');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(150);

  await page.click('.nav-item[data-tab="businesses"]');
  await page.waitForTimeout(100);
  const monerunCard = page.locator('.biz-card', { hasText: 'MoneRun' });
  await monerunCard.locator('[data-action="edit-business"]').click();
  await page.waitForTimeout(100);
  await page.click('[data-action="delete-business"]');
  await page.waitForTimeout(100);
  await page.click('[data-action="confirm-yes"]');
  await page.waitForTimeout(150);

  await page.click('.nav-item[data-tab="kpi"]');
  await page.waitForTimeout(100);
  check((await page.locator('.data-table tbody tr').count()) === 1, 'KPI table row count drops after deleting a business');

  await page.click('.nav-item[data-tab="ideas"]');
  await page.waitForTimeout(100);
  check((await page.locator('.empty-title').innerText()).includes('まだアイデアが登録されていません'), 'idea tied to the deleted business was cascade-deleted');

  check(errors.length === 0, 'no unexpected console/page errors (' + errors.join(' | ') + ')');

  console.log(allPass ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED');
  await browser.close();
  process.exit(allPass ? 0 : 1);
})();
