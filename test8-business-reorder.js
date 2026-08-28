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

  await page.click('.nav-item[data-tab="businesses"]');
  await page.waitForTimeout(100);

  // 1. Add-business form is free text again (not a select)
  await page.click('[data-action="open-add-business"]');
  await page.waitForTimeout(100);
  check((await page.locator('input[name="name"]').count()) === 1, 'business form has free-text input[name=name]');
  check((await page.locator('select[name="name"]').count()) === 0, 'business form no longer has select[name=name]');
  check((await page.locator('input[name="name"]').getAttribute('list')) === 'business-name-options', 'input has datalist suggestions attached');
  const datalistOptions = await page.locator('#business-name-options option').evaluateAll(els => els.map(e => e.getAttribute('value')));
  check(datalistOptions.includes('FP事業') && datalistOptions.includes('その他'), 'datalist still offers the known business names as suggestions: ' + datalistOptions.join(','));

  await page.fill('input[name="name"]', 'コンサル事業');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(150);
  check((await page.locator('.biz-card').count()) === 1, 'custom free-text business name was added');
  check((await page.locator('.biz-card-name').first().innerText()).includes('コンサル事業'), 'business card shows the typed name');

  // add two more custom businesses to test reordering
  await page.click('[data-action="open-add-business"]');
  await page.fill('input[name="name"]', '研修事業');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(150);
  await page.click('[data-action="open-add-business"]');
  await page.fill('input[name="name"]', 'IT事業');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(150);

  let names = await page.locator('.biz-card-name').allInnerTexts();
  check(names.length === 3, 'three businesses now present: ' + names.join(','));
  check(names[0].includes('コンサル事業') && names[1].includes('研修事業') && names[2].includes('IT事業'), 'initial order is insertion order: ' + names.join(' | '));

  // reordering itself (drag-and-drop) is covered by test10-business-dragdrop.js

  check(errors.length === 0, 'no unexpected console/page errors (' + errors.join(' | ') + ')');

  console.log(allPass ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED');
  await browser.close();
  process.exit(allPass ? 0 : 1);
})();
