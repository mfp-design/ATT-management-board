const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const errors = [];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('console', msg => { if (msg.type() === 'error') errors.push('console: ' + msg.text()); });
  page.on('pageerror', err => errors.push('pageerror: ' + err.message));

  await page.goto('file://' + path.join(__dirname, 'index.html'));
  await page.waitForTimeout(200);

  // Dashboard with no data: should show empty state, not a broken chart
  await page.screenshot({ path: 'shot3-dashboard-empty.png' });
  const emptyTitle = await page.locator('.empty-title').first().innerText().catch(() => null);
  console.log('empty-state text when no revenue:', emptyTitle);

  // Set up: two businesses, one account, three won deals across different months/businesses
  await page.click('.nav-item[data-tab="businesses"]');
  await page.click('[data-action="open-add-business"]');
  await page.fill('input[name="name"]', 'FP事業');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(100);
  await page.click('[data-action="open-add-business"]');
  await page.fill('input[name="name"]', 'MoneRun');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(100);

  await page.click('.nav-item[data-tab="accounts"]');
  await page.click('[data-action="open-add-account"]');
  await page.fill('input[name="name"]', '株式会社テスト');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(100);

  async function addWonDeal(title, businessLabel, amount, closeDate) {
    await page.click('.nav-item[data-tab="deals"]');
    await page.click('[data-action="open-add-deal"]');
    await page.fill('input[name="title"]', title);
    await page.selectOption('select[name="accountId"]', { index: 1 });
    await page.selectOption('select[name="businessId"]', { label: businessLabel });
    await page.selectOption('select[name="stage"]', 'won');
    await page.fill('input[name="amount"]', String(amount));
    await page.fill('input[name="closeDate"]', closeDate);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(100);
  }

  const now = new Date();
  const thisMonth = now.toISOString().slice(0, 7);
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 15);
  const lastMonth = lastMonthDate.toISOString().slice(0, 7);

  await addWonDeal('案件A', 'FP事業', 1200000, thisMonth + '-10');
  await addWonDeal('案件B', 'MoneRun', 800000, thisMonth + '-15');
  await addWonDeal('案件C', 'FP事業', 500000, lastMonth + '-05');

  await page.click('.nav-item[data-tab="dashboard"]');
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'shot3-dashboard-revenue.png' });

  const legendItems = await page.locator('.rev-legend-item').allInnerTexts();
  console.log('legend items:', legendItems);
  const colTotals = await page.locator('.rev-col-total').allInnerTexts();
  console.log('column totals:', colTotals);

  // dark mode check
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'shot3-dashboard-revenue-dark.png' });
  await page.emulateMedia({ colorScheme: 'light' });

  // Animal fortune: add a customer with a birthday, verify live preview + table badge
  await page.click('.nav-item[data-tab="customers"]');
  await page.click('[data-action="open-add-customer"]');
  await page.fill('input[name="name"]', '山田 太郎');
  await page.fill('input[name="consultant"]', '鈴木');
  await page.fill('input[name="birthday"]', '1990-05-20');
  await page.waitForTimeout(150);
  const previewText = await page.locator('#animal-fortune-preview').innerText();
  console.log('live preview after entering birthday:', previewText);
  await page.screenshot({ path: 'shot3-customer-form.png' });
  await page.click('button[type="submit"]');
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'shot3-customer-list.png' });
  const rowText = await page.locator('.data-table tbody tr').first().innerText();
  console.log('customer row text:\n', rowText);

  await browser.close();
  console.log('ERRORS:', errors.length);
  errors.forEach(e => console.log(' -', e));
})();
