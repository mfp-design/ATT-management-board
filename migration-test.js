const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const errors = [];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.join(__dirname, 'legacy-doc.html'));
  await page.waitForTimeout(250);

  await page.click('.nav-item[data-tab="accounts"]');
  await page.waitForTimeout(150);
  const accountName = await page.locator('.data-table tbody tr td').first().innerText();
  await page.screenshot({ path: 'shot-migration-accounts.png' });

  await page.click('.nav-item[data-tab="customers"]');
  await page.waitForTimeout(150);
  const personName = await page.locator('.data-table tbody tr td').first().innerText().catch(() => '(none)');
  await page.screenshot({ path: 'shot-migration-customers.png' });

  await page.click('.nav-item[data-tab="deals"]');
  await page.waitForTimeout(150);
  const dealCardText = await page.locator('.deal-card').first().innerText();

  console.log('migrated account name:', accountName);
  console.log('migrated person name (from legacy "contact" field):', personName);
  console.log('deal card text:\n', dealCardText);
  console.log('errors:', errors);

  await browser.close();
})();
