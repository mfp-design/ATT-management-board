const { chromium } = require('playwright');
const path = require('path');

/* Reproduces the reported bug: the `artifact` capability reloads the current
 * view too after every successful publish() (per the platform's own docs:
 * "every open view, this one included, reloads to it"). Since `ui.tab` etc.
 * live only in memory and are never part of the persisted `state`, without
 * a fix every add/edit/delete/reorder would snap the view back to the
 * hard-coded defaults (dashboard tab). This mock simulates that real reload
 * behavior (via document.open/write/close of the freshly "published" HTML)
 * so we can verify the localStorage-based fix actually survives it. */

async function withMockedReloadingPublish(page) {
  await page.addInitScript(() => {
    window.claude = {
      use: async (name) => {
        if (name !== 'artifact') return null;
        return {
          publish: async (html) => {
            setTimeout(() => {
              document.open();
              document.write(html);
              document.close();
            }, 10);
            return { version: 'v1' };
          }
        };
      }
    };
  });
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (msg) => { if (msg.type() === 'error' && !msg.text().includes('ERR_TUNNEL_CONNECTION_FAILED') && !msg.text().includes('ERR_FILE_NOT_FOUND')) errors.push('console: ' + msg.text()); });

  let allPass = true;
  function check(cond, label) {
    console.log((cond ? 'PASS' : 'FAIL'), label);
    if (!cond) allPass = false;
  }

  await withMockedReloadingPublish(page);
  await page.goto('file://' + path.join(__dirname, 'index.html'));
  await page.waitForTimeout(200);

  // 1. Navigate to businesses tab, add a business -> triggers a simulated reload
  await page.click('.nav-item[data-tab="businesses"]');
  await page.waitForTimeout(100);
  await page.click('[data-action="open-add-business"]');
  await page.fill('input[name="name"]', 'コンサル事業');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(400); // let the mocked "reload" (document.write) settle

  let pageTitle = await page.locator('.page-title').innerText();
  check(pageTitle === '事業とタスク', 'after adding a business (+ reload), still on 事業とタスク tab (got: ' + pageTitle + ')');

  // add two more, so we have something to reorder
  await page.click('[data-action="open-add-business"]');
  await page.fill('input[name="name"]', '研修事業');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(400);
  pageTitle = await page.locator('.page-title').innerText();
  check(pageTitle === '事業とタスク', 'after adding a 2nd business (+ reload), still on 事業とタスク tab (got: ' + pageTitle + ')');

  // 2. Reorder (drag the first card onto the bottom half of the second) -> also triggers a simulated reload
  const targetBox = await page.locator('.biz-card').nth(1).boundingBox();
  await page.locator('.biz-card').nth(0).dragTo(page.locator('.biz-card').nth(1), { targetPosition: { x: 40, y: targetBox.height - 4 } });
  await page.waitForTimeout(400);
  pageTitle = await page.locator('.page-title').innerText();
  check(pageTitle === '事業とタスク', 'after reordering (+ reload), still on 事業とタスク tab (got: ' + pageTitle + ')');
  let names = await page.locator('.biz-card-name').allInnerTexts();
  check(names[0].includes('研修事業') && names[1].includes('コンサル事業'), 'reorder itself was applied correctly across the reload: ' + names.join(' | '));

  // 3. Switch to a different top-level tab, then trigger a save elsewhere -> should stay on that tab
  await page.click('.nav-item[data-tab="accounts"]');
  await page.waitForTimeout(100);
  await page.click('[data-action="open-add-account"]');
  await page.fill('input[name="name"]', '株式会社サンプル');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(400);
  pageTitle = await page.locator('.page-title').innerText();
  check(pageTitle === '取引先', 'after adding an account (+ reload) while on 取引先 tab, stays on 取引先 (got: ' + pageTitle + ')');

  check(errors.length === 0, 'no unexpected console/page errors (' + errors.join(' | ') + ')');

  console.log(allPass ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED');
  await browser.close();
  process.exit(allPass ? 0 : 1);
})();
