const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('file://' + path.join(__dirname, 'index.html'));
  await page.waitForTimeout(200);

  await page.click('.nav-item[data-tab="businesses"]');
  await page.click('[data-action="open-add-business"]');
  await page.fill('input[name="name"]', 'コンサル事業');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(100);
  await page.click('[data-action="open-add-business"]');
  await page.fill('input[name="name"]', '研修事業');
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
  await addWonDeal('案件A', 'コンサル事業', 1200000, thisMonth + '-10');

  await page.click('.nav-item[data-tab="dashboard"]');
  await page.waitForTimeout(100);

  await page.click('.nav-item[data-tab="customers"]');
  await page.click('[data-action="open-add-customer"]');
  await page.waitForTimeout(100);
  console.log('name count:', await page.locator('input[name="name"]').count());
  await page.fill('input[name="name"]', '山田 太郎');
  console.log('after name fill ->', JSON.stringify(await page.locator('input[name="name"]').inputValue()));
  await page.fill('input[name="consultant"]', '鈴木');
  console.log('after consultant fill, name ->', JSON.stringify(await page.locator('input[name="name"]').inputValue()));
  console.log('after consultant fill, consultant ->', JSON.stringify(await page.locator('input[name="consultant"]').inputValue()));
  await page.fill('input[name="birthday"]', '1990-05-20');
  console.log('after birthday fill, name ->', JSON.stringify(await page.locator('input[name="name"]').inputValue()));

  await browser.close();
})();
