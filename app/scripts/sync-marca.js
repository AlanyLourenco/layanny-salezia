// Copia a marca de ../identidade para app/marca. Não edite app/marca à mão: rode `npm run marca`.
const fs = require('fs');
const path = require('path');

const origem = path.resolve(__dirname, '../../identidade');
const destino = path.resolve(__dirname, '../marca');
const arquivos = ['tokens.css', 'brand.js', 'logo/ls-logo.js', 'motion/logo-motion.js', 'export/logo/monograma-ouro.png', 'fonts/fraunces-monograma.woff2', 'fonts/fraunces-monograma-italic.woff2'];

for (const a of arquivos) {
  const de = path.join(origem, a);
  const para = path.join(destino, a);
  fs.mkdirSync(path.dirname(para), { recursive: true });
  fs.copyFileSync(de, para);
}
console.log(`marca → app/marca (${arquivos.length} arquivos)`);
