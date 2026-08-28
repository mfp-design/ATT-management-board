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

  // Add an account (取引先)
  await page.click('.nav-item[data-tab="accounts"]');
  await page.waitForTimeout(150);
  await page.click('[data-action="open-add-account"]');
  await page.fill('input[name="name"]', '株式会社サンプル商事');
  await page.fill('input[name="industry"]', '製造業');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'shot2-accounts.png' });

  // Add a customer (個人) linked to that account
  await page.click('.nav-item[data-tab="customers"]');
  await page.waitForTimeout(150);
  await page.click('[data-action="open-add-customer"]');
  await page.fill('input[name="name"]', '山田 太郎');
  await page.selectOption('select[name="accountId"]', { index: 1 });
  await page.fill('input[name="title"]', '営業部 部長');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'shot2-customers.png' });

  // Add a second, unaffiliated individual customer
  await page.click('[data-action="open-add-customer"]');
  await page.fill('input[name="name"]', '佐藤 花子');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'shot2-customers-2.png' });

  // Add a deal referencing both the account and the customer contact
  await page.click('.nav-item[data-tab="deals"]');
  await page.waitForTimeout(150);
  await page.click('[data-action="open-add-deal"]');
  await page.fill('input[name="title"]', 'サンプル商事様向け導入案件');
  await page.selectOption('select[name="accountId"]', { index: 1 });
  await page.selectOption('select[name="customerId"]', { label: '山田 太郎（株式会社サンプル商事）' });
  await page.fill('input[name="amount"]', '2200000');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'shot2-deals.png' });

  // Verify account detail shows related customer + deal
  await page.click('.nav-item[data-tab="accounts"]');
  await page.waitForTimeout(150);
  await page.click('[data-action="edit-account"]');
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'shot2-account-detail.png' });
  await page.click('[data-action="close-modal"]');

  // Try deleting the account while a deal references it -> should be blocked
  await page.click('[data-action="delete-account"]');
  await page.waitForTimeout(150);
  await page.click('[data-action="confirm-yes"]');
  await page.waitForTimeout(200);
  const toastText = await page.locator('.toast').first().innerText().catch(() => null);
  console.log('delete-blocked toast:', toastText);

  await browser.close();
  console.log('ERRORS:', errors.length);
  errors.forEach(e => console.log(' -', e));
})();
