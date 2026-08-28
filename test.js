const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const errors = [];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('console', msg => { if (msg.type() === 'error') errors.push('console: ' + msg.text()); });
  page.on('pageerror', err => errors.push('pageerror: ' + err.message));

  const url = 'file://' + path.join(__dirname, 'index.html');
  await page.goto(url);
  await page.waitForTimeout(300);

  await page.screenshot({ path: 'shot-dashboard-light.png' });

  // Add a business
  await page.click('.nav-item[data-tab="businesses"]');
  await page.waitForTimeout(150);
  await page.click('[data-action="open-add-business"]');
  await page.fill('input[name="name"]', '新規開拓プロジェクト');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(150);

  // Add a task under that business
  await page.click('[data-action="open-add-task"]');
  await page.fill('input[name="title"]', '見積書を送付する');
  await page.fill('input[name="dueDate"]', '2026-09-01');
  await page.selectOption('select[name="priority"]', 'high');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'shot-businesses.png' });

  // Add a customer
  await page.click('.nav-item[data-tab="customers"]');
  await page.waitForTimeout(150);
  await page.click('[data-action="open-add-customer"]');
  await page.fill('input[name="name"]', '株式会社サンプル商事');
  await page.fill('input[name="industry"]', '製造業');
  await page.fill('input[name="contact"]', '山田 太郎');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'shot-customers.png' });

  // Add a deal
  await page.click('.nav-item[data-tab="deals"]');
  await page.waitForTimeout(150);
  await page.click('[data-action="open-add-deal"]');
  await page.fill('input[name="title"]', 'サンプル商事様向け導入案件');
  await page.selectOption('select[name="customerId"]', { index: 1 });
  await page.fill('input[name="amount"]', '3400000');
  await page.fill('input[name="closeDate"]', '2026-09-15');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'shot-deals.png' });

  // Drag the deal card to the next column (approach)
  const card = await page.$('.deal-card');
  const targetCol = await page.$('.kanban-col[data-stage="approach"]');
  if (card && targetCol) {
    const cardBox = await card.boundingBox();
    const targetBox = await targetCol.boundingBox();
    await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 60, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(200);
  }
  await page.screenshot({ path: 'shot-deals-after-drag.png' });

  // Dashboard after data entered
  await page.click('.nav-item[data-tab="dashboard"]');
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'shot-dashboard-filled.png' });

  // Dark mode
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'shot-dashboard-dark.png' });
  await page.click('.nav-item[data-tab="deals"]');
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'shot-deals-dark.png' });

  await browser.close();

  console.log('ERRORS:', errors.length);
  errors.forEach(e => console.log(' -', e));
})();
