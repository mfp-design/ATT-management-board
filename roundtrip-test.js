const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.addInitScript(() => {
    window.__published = [];
    window.claude = {
      use: async (name) => {
        if (name !== 'artifact') return null;
        return {
          publish: async (html) => {
            window.__published.push(html);
            return { version: 'v1' };
          }
        };
      }
    };
  });

  await page.goto('file://' + path.join(__dirname, 'index.html'));
  await page.waitForTimeout(200);
  await page.click('.nav-item[data-tab="businesses"]');
  await page.click('[data-action="open-add-business"]');
  await page.fill('input[name="name"]', 'ラウンドトリップ事業');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(300);

  const html = await page.evaluate(() => window.__published[0]);
  require('fs').writeFileSync(path.join(__dirname, 'published-roundtrip.html'), html);

  // Now load the PUBLISHED html directly (simulating a fresh viewer reload)
  await browser.close();

  const browser2 = await chromium.launch();
  const page2 = await browser2.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page2.on('pageerror', e => errors.push(e.message));
  await page2.goto('file://' + path.join(__dirname, 'published-roundtrip.html'));
  await page2.waitForTimeout(200);
  await page2.click('.nav-item[data-tab="businesses"]');
  await page2.waitForTimeout(150);
  const text = await page2.locator('.biz-card-name').innerText();
  console.log('business name survived republish round-trip:', text === 'ラウンドトリップ事業', '(' + text + ')');
  console.log('errors on reloaded published doc:', errors);
  await page2.screenshot({ path: 'shot-roundtrip.png' });
  await browser2.close();
})();
