// Screenshot rápido para revisão: node scripts/shot.js <arquivo.html> <saida.png> [largura] [altura] [--full]
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const [arq, saida, w = 1440, h = 900] = process.argv.slice(2);
  const full = process.argv.includes('--full');
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  page.on('console', (m) => m.type() === 'error' && console.log('console:', m.text()));
  page.on('pageerror', (e) => console.log('pageerror:', e.message));
  await page.goto(require('url').pathToFileURL(path.resolve(arq)).href);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(+(process.env.WAIT || 600));
  await page.screenshot({ path: saida, fullPage: full });
  await browser.close();
})();
