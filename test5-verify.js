const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push('console: ' + msg.text()); });

  await page.goto('file://' + path.join(__dirname, 'index.html'));
  await page.waitForTimeout(200);

  let allPass = true;
  function check(cond, label) {
    console.log((cond ? 'PASS' : 'FAIL'), label);
    if (!cond) allPass = false;
  }

  // 1. Create an account with contact + url
  await page.click('.nav-item[data-tab="accounts"]');
  await page.click('[data-action="open-add-account"]');
  await page.waitForTimeout(80);
  await page.fill('input[name="name"]', '株式会社サンプル商事');
  await page.fill('input[name="contact"]', '山田 太郎');
  await page.fill('input[name="url"]', 'https://sample-shoji.example.com');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(150);

  const rowText = await page.locator('.data-table tbody tr').first().innerText();
  check(rowText.includes('山田 太郎'), 'accounts table shows 担当者 column value');

  await page.click('.data-table tbody tr >> nth=0');
  await page.waitForTimeout(120);
  check((await page.locator('input[name="contact"]').inputValue()) === '山田 太郎', 'account edit form contact round-trips');
  check((await page.locator('input[name="url"]').inputValue()) === 'https://sample-shoji.example.com', 'account edit form url round-trips');
  await page.click('[data-action="close-modal"]');
  await page.waitForTimeout(80);

  // 2. New customer form: no accountId select present
  await page.click('.nav-item[data-tab="customers"]');
  await page.click('[data-action="open-add-customer"]');
  await page.waitForTimeout(80);
  check((await page.locator('select[name="accountId"]').count()) === 0, 'customer form has no accountId select');
  check((await page.locator('label:has-text("勤務先・職業")').count()) === 1, 'customer form label renamed to 勤務先・職業');
  check((await page.locator('input[name="title"]').getAttribute('placeholder')) === '◯◯株式会社（会社員）', 'title placeholder updated');
  await page.click('[data-action="close-modal"]');
  await page.waitForTimeout(80);

  check(errors.length === 0, 'part1: no console/page errors');
  await browser.close();

  // --- Part 2: build a fixture HTML with a pre-linked customer, then verify editing preserves accountId ---
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const fixtureState = {
    businesses: [],
    accounts: [{ id: 'acc_fixture1', name: '株式会社サンプル商事', industry: '', contact: '山田 太郎', phone: '', email: '', url: 'https://sample-shoji.example.com', address: '', memo: '' }],
    customers: [{ id: 'cust_fixture1', accountId: 'acc_fixture1', name: '佐藤 花子', title: 'デザイン事務所（フリーランス）', consultant: '', phone: '', birthday: '1990-05-20', email: '', memo: '', createdAt: new Date().toISOString() }],
    deals: [],
    tasks: [],
    updatedAt: null
  };
  const marker = '<script id="app-data" type="application/json">';
  const idx = html.indexOf(marker);
  const closeIdx = html.indexOf('</script>', idx);
  const fixtureHtml = html.slice(0, idx) + marker + JSON.stringify(fixtureState).replace(/</g, '\\u003c') + html.slice(closeIdx);
  const fixturePath = path.join(__dirname, 'fixture-linked-customer.html');
  fs.writeFileSync(fixturePath, fixtureHtml);

  const browser2 = await chromium.launch();
  const page2 = await browser2.newPage({ viewport: { width: 1440, height: 900 } });
  const errors2 = [];
  page2.on('pageerror', (e) => errors2.push('pageerror: ' + e.message));
  page2.on('console', (msg) => { if (msg.type() === 'error') errors2.push('console: ' + msg.text()); });

  await page2.goto('file://' + fixturePath);
  await page2.waitForTimeout(200);
  await page2.click('.nav-item[data-tab="customers"]');
  await page2.waitForTimeout(100);

  let custRowText = await page2.locator('.data-table tbody tr', { hasText: '佐藤 花子' }).innerText();
  check(custRowText.includes('株式会社サンプル商事'), 'fixture: customer table shows linked account name before edit');
  check(custRowText.includes('デザイン事務所'), 'fixture: 勤務先・職業 shown in table');

  await page2.click('.data-table tbody tr', { hasText: '佐藤 花子' });
  await page2.waitForTimeout(100);
  check((await page2.locator('select[name="accountId"]').count()) === 0, 'fixture: edit form has no accountId select either');
  await page2.fill('input[name="phone"]', '090-9999-8888');
  await page2.click('button[type="submit"]');
  await page2.waitForTimeout(150);

  custRowText = await page2.locator('.data-table tbody tr', { hasText: '佐藤 花子' }).innerText();
  check(custRowText.includes('株式会社サンプル商事'), 'fixture: customer table STILL shows linked account after unrelated edit (accountId preserved)');
  check(custRowText.includes('090-9999-8888'), 'fixture: phone edit was saved');
  check(custRowText.includes('デザイン事務所'), 'fixture: title preserved and shown after edit');
  check(errors2.length === 0, 'part2: no console/page errors (' + errors2.join(' | ') + ')');

  console.log(allPass ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED');
  await browser2.close();
  fs.unlinkSync(fixturePath);
  process.exit(allPass ? 0 : 1);
})();
