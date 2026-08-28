const { chromium } = require('playwright');
const path = require('path');

async function run(scenario) {
  const errors = [];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));

  await page.addInitScript((scn) => {
    window.__published = [];
    window.claude = {
      use: async (name) => {
        if (name !== 'artifact') return null;
        return {
          publish: async (html) => {
            window.__published.push(html);
            if (scn === 'not_writer') {
              const err = new Error('no write access');
              err.code = 'not_writer';
              throw err;
            }
            if (scn === 'conflict') {
              const err = new Error('conflict');
              err.code = 'conflict';
              throw err;
            }
            return { version: 'v' + window.__published.length };
          }
        };
      }
    };
  }, scenario);

  const url = 'file://' + path.join(__dirname, 'index.html');
  await page.goto(url);
  await page.waitForTimeout(200);

  // trigger a write: add a business
  await page.click('.nav-item[data-tab="businesses"]');
  await page.click('[data-action="open-add-business"]');
  await page.fill('input[name="name"]', 'テスト事業');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(300);

  const published = await page.evaluate(() => window.__published);
  const readOnlyBannerVisible = await page.locator('.readonly-banner').count();
  const syncText = await page.locator('.sync-box').innerText();
  const startsOk = published.length && published[0].startsWith('<!doctype html>');

  console.log('scenario:', scenario);
  console.log('  publish call count:', published.length);
  console.log('  published starts with doctype:', startsOk);
  console.log('  readonly banner shown:', readOnlyBannerVisible > 0);
  console.log('  sync box text:', JSON.stringify(syncText));
  console.log('  console/page errors:', errors.length, errors);

  await browser.close();
}

(async () => {
  await run('success');
  await run('not_writer');
  await run('conflict');
})();
