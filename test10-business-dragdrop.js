const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (msg) => { if (msg.type() === 'error' && !msg.text().includes('ERR_TUNNEL_CONNECTION_FAILED')) errors.push('console: ' + msg.text()); });

  await page.goto('file://' + path.join(__dirname, 'index.html'));
  await page.waitForTimeout(200);

  let allPass = true;
  function check(cond, label) {
    console.log((cond ? 'PASS' : 'FAIL'), label);
    if (!cond) allPass = false;
  }

  async function addBusiness(name) {
    await page.click('[data-action="open-add-business"]');
    await page.fill('input[name="name"]', name);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(120);
  }

  await page.click('.nav-item[data-tab="businesses"]');
  await page.waitForTimeout(100);

  // 1. Old up/down buttons are gone; cards are draggable with a grip handle
  await addBusiness('A事業');
  check((await page.locator('[data-action="move-business-up"]').count()) === 0, 'old move-business-up button no longer exists');
  check((await page.locator('[data-action="move-business-down"]').count()) === 0, 'old move-business-down button no longer exists');
  check((await page.locator('.biz-card').first().getAttribute('draggable')) === 'true', 'biz-card has draggable=true');
  check((await page.locator('.biz-card-grip').count()) === 1, 'drag-handle grip icon is shown');

  await addBusiness('B事業');
  await addBusiness('C事業');

  let names = await page.locator('.biz-card-name').allInnerTexts();
  check(names[0].includes('A事業') && names[1].includes('B事業') && names[2].includes('C事業'), 'initial order A,B,C: ' + names.join(' | '));

  // 2. Drag the first card (A) and drop it onto the TOP half of the third card (C)
  //    -> should land just before C: B, A, C
  await page.locator('.biz-card').nth(0).dragTo(page.locator('.biz-card').nth(2), { targetPosition: { x: 40, y: 4 } });
  await page.waitForTimeout(200);
  names = await page.locator('.biz-card-name').allInnerTexts();
  check(names[0].includes('B事業') && names[1].includes('A事業') && names[2].includes('C事業'), 'drag onto top-half inserts before target: ' + names.join(' | '));

  // 3. drag C (last) onto the BOTTOM half of the first card (B) -> B, C, A
  const targetBox = await page.locator('.biz-card').nth(0).boundingBox();
  await page.locator('.biz-card').nth(2).dragTo(page.locator('.biz-card').nth(0), { targetPosition: { x: 40, y: targetBox.height - 4 } });
  await page.waitForTimeout(200);
  names = await page.locator('.biz-card-name').allInnerTexts();
  check(names[0].includes('B事業') && names[1].includes('C事業') && names[2].includes('A事業'), 'drag onto bottom-half inserts after target: ' + names.join(' | '));

  // 4. Dropping a card onto itself should be a no-op (no error, order unchanged)
  await page.locator('.biz-card').nth(0).dragTo(page.locator('.biz-card').nth(0), { targetPosition: { x: 40, y: 4 } });
  await page.waitForTimeout(150);
  names = await page.locator('.biz-card-name').allInnerTexts();
  check(names[0].includes('B事業') && names[1].includes('C事業') && names[2].includes('A事業'), 'drop-on-self is a no-op: ' + names.join(' | '));

  // 5. Clicking a card (not dragging) still selects it for the task pane (regression check)
  await page.click('.biz-card >> nth=1');
  await page.waitForTimeout(120);
  const header = await page.locator('.card-title').first().innerText();
  check(header.includes('C事業'), 'plain click still selects the business (drag did not break click): ' + header);

  check(errors.length === 0, 'no unexpected console/page errors (' + errors.join(' | ') + ')');

  console.log(allPass ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED');
  await browser.close();
  process.exit(allPass ? 0 : 1);
})();
