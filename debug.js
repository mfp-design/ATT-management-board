const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('file://' + path.join(__dirname, 'index.html'));
  await page.waitForTimeout(200);
  await page.click('.nav-item[data-tab="businesses"]');
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'debug-businesses.png' });
  const sidebar = await page.$('.sidebar');
  const btn = await page.$('[data-action="open-add-business"]');
  console.log('sidebar box', await sidebar.boundingBox());
  console.log('btn box', await btn.boundingBox());
  const html = await page.content();
  require('fs').writeFileSync('debug-dom.html', html);
  await browser.close();
})();
