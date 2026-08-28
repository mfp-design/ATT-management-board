const { chromium } = require('playwright');
const path = require('path');

// Cases derived directly from the user-supplied base-number table:
// [birthday, base-number-for-that-year/month-read-from-the-table, expected animal name]
const cases = [
  { date: '1926-05-05', base: 26, name: null }, // 1926年1月=26 row unused; use Jan directly below
  { date: '1926-01-05', base: 26, expectSum: 31, name: 'リーダーとなるゾウ' },
  { date: '1928-02-15', base: 7, expectSum: 22, name: '強靭な翼をもつペガサス' },
  { date: '1980-01-01', base: 9, expectSum: 10, name: '母性豊かな子守熊' },
  { date: '2024-01-31', base: 0, expectSum: 31, name: 'リーダーとなるゾウ' },
  { date: '2010-01-31', base: 47, expectSum: 18, name: 'デリケートなゾウ' } // 47+31=78-60=18
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('file://' + path.join(__dirname, 'index.html'));
  await page.waitForTimeout(200);

  let allPass = true;
  for (const c of cases) {
    if (!c.name) continue;
    await page.click('.nav-item[data-tab="customers"]');
    await page.click('[data-action="open-add-customer"]');
    await page.waitForTimeout(80);
    await page.fill('input[name="name"]', 'テスト');
    await page.fill('input[name="birthday"]', c.date);
    await page.waitForTimeout(80);
    const text = await page.locator('#animal-fortune-preview').innerText();
    const pass = text.includes(c.name);
    if (!pass) allPass = false;
    console.log((pass ? 'PASS' : 'FAIL'), c.date, '-> expected:', c.name, '| got:', text.replace(/\n/g, ' '));
    await page.click('[data-action="close-modal"]');
    await page.waitForTimeout(80);
  }
  console.log(allPass ? '\nALL CASES PASSED' : '\nSOME CASES FAILED');
  await browser.close();
})();
