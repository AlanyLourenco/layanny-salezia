// Exporta a vinheta em MP4 (1080×1920, 30 fps, H.264).
// Uso: npm run export:video [-- motion/vinheta.html export/vinheta-logo.mp4]
// Cada quadro é posicionado com VINHETA.seek(ms) e capturado; o ffmpeg monta o vídeo.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const [arq = 'motion/vinheta.html', saida = 'export/vinheta-logo.mp4'] = process.argv.slice(2);
const FPS = 30, W = 1080, H = 1920;

(async () => {
  fs.mkdirSync(path.dirname(saida), { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on('pageerror', (e) => console.log('pageerror:', e.message));
  await page.goto(pathToFileURL(path.resolve(arq)).href + '?modo=export');
  await page.waitForFunction(() => window.VINHETA && document.fonts.status === 'loaded');
  await page.waitForTimeout(500);
  const dur = await page.evaluate(() => VINHETA.duracao);
  const total = Math.ceil(dur / 1000 * FPS);

  const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'slow', '-movflags', '+faststart', saida],
    { stdio: ['pipe', 'ignore', 'inherit'] });

  for (let f = 0; f <= total; f++) {
    await page.evaluate((ms) => VINHETA.seek(ms), f * 1000 / FPS);
    const png = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
    if (f % 30 === 0) process.stdout.write(`\rquadro ${f}/${total}`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await browser.close();
  console.log(`\nok → ${saida}`);
})();
