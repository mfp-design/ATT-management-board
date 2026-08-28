const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('file://' + path.join(__dirname, 'index.html'));
  await page.waitForTimeout(200);
  await page.click('.nav-item[data-tab="customers"]');
  await page.click('[data-action="open-add-customer"]');
  await page.waitForTimeout(100);

  const count = await page.locator('input[name="name"]').count();
  console.log('input[name=name] count:', count);
  const countConsultant = await page.locator('input[name="consultant"]').count();
  console.log('input[name=consultant] count:', countConsultant);

  await page.fill('input[name="name"]', '山田 太郎');
  console.log('after name fill:', await page.locator('input[name="name"]').inputValue());
  await page.fill('input[name="consultant"]', '鈴木');
  console.log('after consultant fill, name value:', await page.locator('input[name="name"]').inputValue());
  console.log('after consultant fill, consultant value:', await page.locator('input[name="consultant"]').inputValue());

  await browser.close();
})();
