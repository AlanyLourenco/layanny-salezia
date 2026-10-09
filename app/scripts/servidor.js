// Servidor estático para testar o app localmente (módulos ES não rodam via file://).
const http = require('http');
const fs = require('fs');
const path = require('path');

const raiz = path.resolve(__dirname, '..');
const porta = +process.env.PORT || 5173;
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.ico': 'image/x-icon' };

http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (url.endsWith('/')) url += 'index.html';
  const arq = path.join(raiz, url);
  if (!arq.startsWith(raiz)) { res.writeHead(403); return res.end(); }
  fs.readFile(arq, (erro, dados) => {
    if (erro) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': (tipos[path.extname(arq)] || 'application/octet-stream') + '; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(dados);
  });
}).listen(porta, () => console.log(`Cliente: http://localhost:${porta}/\nPainel:  http://localhost:${porta}/painel/`));
