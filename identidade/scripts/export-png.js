// Exporta as peças em PNG no tamanho exato e os monogramas em SVG puro.
// Uso: npm run export:png
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const PECAS = [
  { html: 'instagram/perfil/foto-perfil.html', out: 'export/instagram/foto-perfil.png', w: 1080, h: 1080 },
];
// monograma isolado em cada cor (fundo transparente)
const CORES = { ouro: 'logo--ouro', rosa: 'logo--principal', bordo: 'logo--bordo', creme: 'logo--creme', preto: 'logo--mono' };

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('pageerror:', e.message));

  for (const p of PECAS) {
    await page.setViewportSize({ width: p.w, height: p.h });
    await page.goto(pathToFileURL(path.resolve(p.html)).href);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    fs.mkdirSync(path.dirname(p.out), { recursive: true });
    await page.screenshot({ path: p.out, omitBackground: true });
    console.log('png →', p.out);
  }

  // logos: renderiza com brand.js e grava SVG com as cores já resolvidas
  await page.setViewportSize({ width: 1200, height: 1600 });
  await page.goto(pathToFileURL(path.resolve('manual/index.html')).href);
  await page.evaluate(() => document.fonts.ready);
  fs.mkdirSync('export/logo', { recursive: true });
  for (const [nome, classe] of Object.entries(CORES)) {
    const { svg } = await page.evaluate((classe) => {
      const box = document.createElement('div');
      box.className = classe; box.style.cssText = 'position:fixed;left:0;top:0;width:756px;color:#000';
      box.innerHTML = LOGOS.oficial({ brilho: false });
      document.body.appendChild(box);
      const s = box.querySelector('svg');
      s.querySelectorAll('[style]').forEach((el) => {
        const fill = getComputedStyle(el).fill;
        el.setAttribute('fill', fill.startsWith('url(') ? 'url(#ls-foil)' : fill);
        el.removeAttribute('style');
      });
      s.querySelectorAll('mask, clipPath, [mask], [clip-path]').forEach((el) => {
        if (el.tagName === 'mask' || el.tagName === 'clipPath') el.remove();
        else { el.removeAttribute('mask'); el.removeAttribute('clip-path'); }
      });
      s.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      s.setAttribute('width', '756'); s.setAttribute('height', '1054');
      if (classe === 'logo--ouro') s.insertAdjacentHTML('afterbegin', document.getElementById('ls-foil').closest('defs').outerHTML);
      const out = s.outerHTML;
      box.remove();
      return { svg: out };
    }, classe);
    fs.writeFileSync(`export/logo/monograma-${nome}.svg`, svg);
    const el = await page.evaluateHandle((svg) => { document.body.style.background = 'transparent'; [...document.body.children].forEach((c) => (c.style.visibility = 'hidden')); const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:0;top:0;width:756px;z-index:999'; d.innerHTML = svg; document.body.appendChild(d); return d; }, svg);
    await el.screenshot({ path: `export/logo/monograma-${nome}.png`, omitBackground: true });
    await el.evaluate((d) => d.remove());
    console.log('svg/png →', `export/logo/monograma-${nome}`);
  }
  await browser.close();
})();
