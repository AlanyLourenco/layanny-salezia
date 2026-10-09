/* ==========================================================
   brand.js — Layanny Salezia Confeitaria
   Nome, textos fixos e desenho dos logos em um lugar só.

   Uso nas peças:
     <span data-brand="nomeCompleto"></span>   → texto da marca
     <div data-logo="assinatura" class="logo--claro"></div> → logo em SVG
   Variantes de cor: logo--claro | logo--escuro | logo--mono | logo--ouro
   ========================================================== */

(function () {
  const BRAND = {
    nome: 'Layanny Salezia',
    primeiroNome: 'Layanny',
    sobrenome: 'Salezia',
    complemento: 'Confeitaria',        // ← troque aqui para mudar em todas as peças
    monograma: ['L', 'S'],
    doce: 'brownie',                   // decidido no logo oficial (v2)
    apelido: 'Lalá',
    linhaBrownie: 'Brownie da Lalá',
    instagram: '@layannysalezia',      // provisório até trocar o @ atual
    instagramAtual: '@brownie.da_lala',
    cidades: 'Itacajá',
    estado: 'Tocantins',
    uf: 'TO',
    promessa: 'Brownies artesanais que derretem na boca',
    palavraChave: 'derrete',
    emoji: '🧡',
    seloTopo: 'Layanny Salezia',
    seloBase: 'doces artesanais • tocantins',
    seloTexto: 'Layanny Salezia • Confeitaria artesanal • Itacajá — Tocantins • ',
    assinaturaMao: 'feito à mão por Layanny',
    get nomeCompleto() { return `${this.nome} ${this.complemento}`.trim(); },
    get linhaAssinada() { return `${this.linhaBrownie} by ${this.nome}`; },
  };

  /* ---------- Geometria reutilizável ---------- */

  // Faixa de calda com gotas. drops: [[posição 0..1, comprimento, largura]]
  function calda({ x, y, w, h, drops, curva = 3 }) {
    const b = y + h;
    let d = `M${x} ${b - h * 0.1} C${x + w * 0.2} ${y - curva} ${x + w * 0.8} ${y - curva} ${x + w} ${b - h * 0.1}`;
    const gotas = drops
      .map(([p, l, dw]) => ({ cx: x + p * w, l, r: dw / 2 }))
      .sort((a, z) => z.cx - a.cx);
    let atual = x + w;
    for (const { cx, l, r } of gotas) {
      const f = r * 1.3; // abertura onde a gota nasce
      const mx = (atual + cx + r + f) / 2;
      d += ` Q${mx} ${b + h * 0.5} ${cx + r + f} ${b}`;
      d += ` C${cx + r} ${b} ${cx + r * 0.62} ${b + (l - r) * 0.55} ${cx + r} ${b + l - r}`;
      d += ` A${r} ${r} 0 0 1 ${cx - r} ${b + l - r}`;
      d += ` C${cx - r * 0.62} ${b + (l - r) * 0.55} ${cx - r} ${b} ${cx - r - f} ${b}`;
      atual = cx - r - f;
    }
    d += ` Q${(atual + x) / 2} ${b + h * 0.5} ${x} ${b - h * 0.1} Z`;
    return d;
  }

  // Gota solta (caindo)
  function gota(cx, cy, s) {
    return `M${cx} ${cy - s * 1.7} C${cx + s * 0.25} ${cy - s * 0.95} ${cx + s} ${cy - s * 0.35} ${cx + s} ${cy + s * 0.15}` +
      ` A${s} ${s} 0 0 1 ${cx - s} ${cy + s * 0.15}` +
      ` C${cx - s} ${cy - s * 0.35} ${cx - s * 0.25} ${cy - s * 0.95} ${cx} ${cy - s * 1.7} Z`;
  }

  // Coração (o 🧡 vetorizado)
  function coracao(cx, cy, s) {
    const p = (x, y) => `${cx + x * s} ${cy + y * s}`;
    return `M${p(0, 4.5)} C${p(-2.5, 2.5)} ${p(-5.5, 0.5)} ${p(-5.5, -1.8)} C${p(-5.5, -3.8)} ${p(-4, -5)} ${p(-2.6, -5)}` +
      ` C${p(-1.4, -5)} ${p(-0.5, -4.3)} ${p(0, -3.3)} C${p(0.5, -4.3)} ${p(1.4, -5)} ${p(2.6, -5)}` +
      ` C${p(4, -5)} ${p(5.5, -3.8)} ${p(5.5, -1.8)} C${p(5.5, 0.5)} ${p(2.5, 2.5)} ${p(0, 4.5)} Z`;
  }

  // Arco de circunferência (ângulos em graus, sentido da tela)
  function arco(cx, cy, r, de, ate, sweep, large) {
    const pt = (a) => [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)];
    const [x1, y1] = pt(de), [x2, y2] = pt(ate);
    return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 ${large} ${sweep} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  }

  let uid = 0;
  const T = 'font-family:var(--fonte-titulo);font-variation-settings:var(--titulo-variacao)';
  const S = 'font-family:var(--fonte-assinatura)';
  const X = 'font-family:var(--fonte-texto)';
  const M = 'font-family:var(--fonte-monograma);font-weight:300';
  // o S passa por cima do L com um respiro da cor do fundo (entrelaçado)
  const corte = (w) => `stroke:var(--logo-fundo);stroke-width:${w};paint-order:stroke;stroke-linejoin:round`;
  const tinta = 'fill:var(--logo-tinta)';
  const gotaCor = 'fill:var(--logo-gota)';
  const ouro = 'var(--logo-ouro)';
  const fundo = 'fill:var(--logo-fundo)';

  /* ---------- Os logos ---------- */
  const LOGOS = {
    /* Proposta A — Monograma: LS entrelaçado, fio de calda e uma gota caindo */
    monograma({ nome = false } = {}) {
      const h = nome ? 520 : 420;
      const [l, s] = BRAND.monograma;
      return `<svg viewBox="0 0 400 ${h}" role="img" aria-label="${BRAND.nomeCompleto}" data-anim="monograma">
        <path class="a-fio" d="${arco(200, 210, 165, 205, -25, 0, 1)}" fill="none" style="stroke:var(--logo-tinta)" stroke-width="2.4" stroke-linecap="round"/>
        <text class="a-l" x="114" y="318" style="${M};${tinta}" font-size="300">${l}</text>
        <text class="a-s" x="104" y="326" style="${M};font-style:italic;${tinta};${corte(9)}" font-size="320">${s}</text>
        <path class="a-gota-presa" d="${calda({ x: 182, y: 373.4, w: 36, h: 3, drops: [[0.5, 22, 7]], curva: 0 })}" style="${tinta}"/>
        <path class="a-gota" d="${gota(200, 412, 7)}" style="${gotaCor}"/>
        ${nome ? `
        <text x="200" y="468" text-anchor="middle" style="${T};font-weight:450;${tinta}" font-size="31" letter-spacing="5.5">${BRAND.nome.toUpperCase()}</text>
        <text x="200" y="502" text-anchor="middle" style="${X};font-weight:500;${tinta}" font-size="13.5" letter-spacing="9">${BRAND.complemento.toUpperCase()}</text>` : ''}
      </svg>`;
    },

    /* Proposta B — Assinatura: o nome dela, à mão, com calda escorrendo do traço */
    assinatura({ curta = false } = {}) {
      const texto = curta ? BRAND.primeiroNome : BRAND.nome;
      const w = curta ? 520 : 900;
      const traco = curta
        ? { x: 120, y: 196, w: 300, h: 7, drops: [[0.3, 30, 9], [0.72, 46, 11]] }
        : { x: 150, y: 196, w: 600, h: 7, drops: [[0.18, 26, 9], [0.47, 50, 12], [0.8, 34, 10]] };
      return `<svg viewBox="0 0 ${w} ${curta ? 280 : 330}" role="img" aria-label="${BRAND.nomeCompleto}" data-anim="assinatura">
        <text class="b-nome" x="${w / 2}" y="165" text-anchor="middle" style="${S};${tinta}" font-size="${curta ? 170 : 150}">${texto}</text>
        <path class="b-calda" d="${calda(traco)}" style="${gotaCor}"/>
        ${curta ? '' : `<text x="${w / 2}" y="306" text-anchor="middle" style="${X};font-weight:500;${tinta}" font-size="24" letter-spacing="15">${BRAND.complemento.toUpperCase()}</text>`}
      </svg>`;
    },

    /* Proposta C — Selo: anel de chocolate que derrete para dentro */
    selo({ reduzido = false } = {}) {
      const id = `selo${++uid}`;
      const [l, s] = BRAND.monograma;
      const drops = [[0.16, 30, 12], [0.34, 52, 15], [0.55, 34, 12], [0.76, 58, 16], [0.9, 24, 10]];
      if (reduzido) {
        return `<svg viewBox="0 0 400 400" role="img" aria-label="${BRAND.nomeCompleto}" data-anim="selo">
          <defs><clipPath id="${id}c"><circle cx="200" cy="200" r="190"/></clipPath></defs>
          <circle cx="200" cy="200" r="190" style="${fundo}"/>
          <g clip-path="url(#${id}c)"><path class="c-calda" d="${calda({ x: -10, y: -10, w: 420, h: 100, drops: drops.map(([p, l, w]) => [p, l * 1.4, w * 1.4]), curva: 0 })}" style="${tinta}"/></g>
          <circle cx="200" cy="200" r="182" fill="none" style="stroke:${ouro}" stroke-width="2"/>
          <text x="140" y="318" style="${M};${tinta}" font-size="190">${l}</text>
          <text x="138" y="323" style="${M};font-style:italic;${tinta};${corte(6)}" font-size="202">${s}</text>
        </svg>`;
      }
      return `<svg viewBox="0 0 400 400" role="img" aria-label="${BRAND.nomeCompleto}" data-anim="selo">
        <defs>
          <clipPath id="${id}c"><circle cx="200" cy="200" r="130"/></clipPath>
          <path id="${id}t" d="${arco(200, 200, 150, 180, 360, 1, 0)}"/>
          <path id="${id}b" d="${arco(200, 200, 170, 180, 0, 0, 0)}"/>
        </defs>
        <circle cx="200" cy="200" r="194" style="${tinta}"/>
        <circle cx="200" cy="200" r="130" style="${fundo}"/>
        <g clip-path="url(#${id}c)"><path class="c-calda" d="${calda({ x: 60, y: 40, w: 280, h: 62, drops, curva: 0 })}" style="${tinta}"/></g>
        <circle cx="200" cy="200" r="137" fill="none" style="stroke:${ouro}" stroke-width="1.6"/>
        <circle cx="200" cy="200" r="187" fill="none" style="stroke:${ouro}" stroke-width="1.2"/>
        <text style="${T};font-weight:500;${fundo}" font-size="25" letter-spacing="4.5"><textPath href="#${id}t" startOffset="50%" text-anchor="middle">${BRAND.seloTopo.toUpperCase()}</textPath></text>
        <text style="${X};font-weight:500;${fundo}" font-size="15" letter-spacing="5"><textPath href="#${id}b" startOffset="50%" text-anchor="middle">${BRAND.seloBase.toUpperCase()}</textPath></text>
        <path d="${coracao(37, 200, 1.5)}" style="fill:${ouro}"/>
        <path d="${coracao(363, 200, 1.5)}" style="fill:${ouro}"/>
        <text x="152" y="292" style="${M};${tinta}" font-size="140">${l}</text>
        <text x="148" y="296" style="${M};font-style:italic;${tinta};${corte(5)}" font-size="150">${s}</text>
      </svg>`;
    },
  };

  /* Logo oficial: monograma LS vetorizado da referência, com um doce no lugar da borboleta.
     Dados em logo/ls-monograma.js. Cores: --ls-letra (letras) e --ls-doce (doce), ambas caem em --logo-tinta. */
  LOGOS.ls = function ({ doce, zoom } = {}) {
    const M = window.LS_MONOGRAMA;
    if (!M) return '';
    const desenho = M.doces[doce || BRAND.doce];
    const { x, y, rot, traco, escala = 1 } = M.doce;
    return `<svg viewBox="${zoom ? M.zoomBox : M.viewBox}" role="img" aria-label="${BRAND.nomeCompleto}" data-anim="ls">
      <path class="ls-letras" d="${M.path}" fill-rule="evenodd" style="fill:var(--ls-letra, var(--logo-tinta))"/>
      <g class="ls-doce" transform="translate(${x} ${y}) rotate(${rot}) scale(${escala})" fill="none" stroke-width="${traco / escala}" stroke-linecap="round" stroke-linejoin="round" style="stroke:var(--ls-doce, var(--logo-tinta))">
        ${desenho.d.map((d) => `<path d="${d}"/>`).join('')}
      </g>
    </svg>`;
  };


  /* ================= v2 — Logo oficial (monograma LS com brownie, vetorizado do arquivo da cliente) =================
     Dados em logo/ls-logo.js (gerado por scripts/vetorizar-logo.py).
     Partes animáveis: .lo-letras (L, S e arco), .lo-doce (brownie, coração, brilhos),
     .lo-calda (máscara que "derrama" o logo de cima para baixo), .lo-brilho (reflexo do foil). */
  const LV = { x: 196, y: 186, w: 756, h: 1054 };      // caixa do monograma
  const VB = `${LV.x} ${LV.y} ${LV.w} ${LV.h}`;
  const FT = 'font-family:var(--fonte-titulo)';
  const FS = 'font-family:var(--fonte-assinatura)';

  function monogramaV2({ id, brilho = true } = {}) {
    const L = window.LS_LOGO;
    if (!L) return '';
    // máscara de calda: retângulo com gotas na borda de baixo; em repouso cobre o logo todo
    const base = LV.y + LV.h + 10;
    const drops = [[0.12, 60, 34], [0.3, 120, 44], [0.47, 80, 36], [0.66, 140, 48], [0.85, 90, 38]];
    const mascara = `M${LV.x - 60} ${base - 1300} H${LV.x + LV.w + 60} V${base + 2} H${LV.x - 60} Z ` +
      calda({ x: LV.x - 60, y: base - 6, w: LV.w + 120, h: 14, drops, curva: 0 });
    return `<defs>
        <mask id="${id}m" maskUnits="userSpaceOnUse" x="${LV.x - 200}" y="${LV.y - 1600}" width="${LV.w + 400}" height="${LV.h + 1900}">
          <path class="lo-calda" d="${mascara}" fill="#fff"/>
        </mask>
        <clipPath id="${id}c"><use href="#${id}l"/><use href="#${id}d"/></clipPath>
        <linearGradient id="${id}g" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#FFF6DD" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <g mask="url(#${id}m)"><path id="${id}l" class="lo-letras" d="${L.letras}" style="fill:var(--logo-tinta)"/></g>
      <g class="lo-doce-mov"><path id="${id}d" class="lo-doce" d="${L.doce}" style="fill:var(--logo-doce, var(--logo-tinta))"/></g>
      ${brilho ? `<g clip-path="url(#${id}c)" style="pointer-events:none"><rect class="lo-brilho" x="${LV.x - 300}" y="${LV.y - 100}" width="240" height="${LV.h + 200}" fill="url(#${id}g)" opacity="0"/></g>` : ''}`;
  }

  // Monograma isolado (perfil, ícones, selos)
  LOGOS.oficial = function ({ brilho } = {}) {
    const id = `lo${++uid}`;
    return `<svg viewBox="${VB}" role="img" aria-label="${BRAND.nomeCompleto}" data-anim="oficial">${monogramaV2({ id, brilho })}</svg>`;
  };

  // Nome escrito: LAYANNY SALEZIA em versal espaçado + complemento em cursiva
  function nomeV2(cx, y, escala = 1, local = false) {
    const k = (n) => +(n * escala).toFixed(2);
    return `<g class="lo-nome">
      <text class="lo-nome-1" x="${cx}" y="${y}" text-anchor="middle" style="${FT};font-weight:500;fill:var(--logo-tinta)" font-size="${k(112)}" letter-spacing="${k(15)}">${BRAND.nome.toUpperCase()}</text>
      <text class="lo-nome-2" x="${cx}" y="${y + k(122)}" text-anchor="middle" style="${FS};fill:var(--logo-acento, var(--logo-tinta))" font-size="${k(132)}">${BRAND.complemento}</text>
      ${local ? `<text class="lo-nome-3" x="${cx}" y="${y + k(215)}" text-anchor="middle" style="font-family:var(--fonte-texto);font-weight:500;fill:var(--logo-tinta)" font-size="${k(30)}" letter-spacing="${k(12)}">${BRAND.cidades.toUpperCase()} — ${BRAND.uf}</text>` : ''}
    </g>`;
  }

  // Assinatura vertical: monograma em cima, nome embaixo
  LOGOS.vertical = function ({ local } = {}) {
    const id = `lo${++uid}`;
    const W = 1400, mh = 900, mw = mh * LV.w / LV.h;
    return `<svg viewBox="0 0 ${W} ${mh + (local ? 440 : 360)}" role="img" aria-label="${BRAND.nomeCompleto}" data-anim="vertical">
      <svg x="${(W - mw) / 2}" y="0" width="${mw}" height="${mh}" viewBox="${VB}" overflow="visible">${monogramaV2({ id })}</svg>
      ${nomeV2(W / 2, mh + 140, 1, local)}
    </svg>`;
  };

  // Assinatura horizontal: monograma à esquerda, nome à direita
  LOGOS.horizontal = function () {
    const id = `lo${++uid}`;
    const mh = 400, mw = mh * LV.w / LV.h;
    return `<svg viewBox="0 0 1500 420" role="img" aria-label="${BRAND.nomeCompleto}" data-anim="horizontal">
      <svg x="0" y="10" width="${mw}" height="${mh}" viewBox="${VB}" overflow="visible">${monogramaV2({ id })}</svg>
      <line x1="${mw + 50}" y1="70" x2="${mw + 50}" y2="350" style="stroke:var(--logo-acento, var(--logo-tinta))" stroke-width="2"/>
      <g class="lo-nome">
        <text class="lo-nome-1" x="${mw + 110}" y="215" style="${FT};font-weight:500;fill:var(--logo-tinta)" font-size="100" letter-spacing="13">${BRAND.nome.toUpperCase()}</text>
        <text class="lo-nome-2" x="${mw + 130}" y="335" style="${FS};fill:var(--logo-acento, var(--logo-tinta))" font-size="118">${BRAND.complemento}</text>
      </g>
    </svg>`;
  };

  // Só o nome (rodapés, etiquetas estreitas)
  LOGOS.nome = function ({ local } = {}) {
    return `<svg viewBox="0 0 1400 ${local ? 320 : 260}" role="img" aria-label="${BRAND.nomeCompleto}" data-anim="nome">${nomeV2(700, 110, 1, local)}</svg>`;
  };

  // Selo redondo: monograma no centro e texto em volta (adesivo, sacola, lacre)
  LOGOS.seloV2 = function ({ cheio } = {}) {
    const id = `lo${++uid}`;
    const mh = 440, mw = mh * LV.w / LV.h;
    return `<svg viewBox="0 0 800 800" role="img" aria-label="${BRAND.nomeCompleto}" data-anim="selo2">
      <defs><path id="${id}t" d="M400 400 m-300 0 a300 300 0 1 1 600 0 a300 300 0 1 1 -600 0"/></defs>
      ${cheio ? `<circle cx="400" cy="400" r="396" style="fill:var(--logo-fundo)"/>` : ''}
      <circle cx="400" cy="400" r="380" fill="none" style="stroke:var(--logo-acento, var(--logo-tinta))" stroke-width="3"/>
      <circle cx="400" cy="400" r="236" fill="none" style="stroke:var(--logo-acento, var(--logo-tinta))" stroke-width="3" stroke-dasharray="0 12" stroke-linecap="round"/>
      <g class="lo-giro">
        <text style="${FT};font-weight:400;fill:var(--logo-tinta)" font-size="50" letter-spacing="6"><textPath href="#${id}t" startOffset="0" textLength="1870" lengthAdjust="spacing">${BRAND.seloTexto.toUpperCase()}</textPath></text>
      </g>
      <svg x="${400 - mw / 2}" y="${400 - mh / 2 + 4}" width="${mw}" height="${mh}" viewBox="${VB}" overflow="visible">${monogramaV2({ id, brilho: false })}</svg>
    </svg>`;
  };

  // Só o brownie desenhado (elemento gráfico de apoio)
  LOGOS.brownie = function () {
    const L = window.LS_LOGO;
    if (!L) return '';
    return `<svg viewBox="262 604 186 240" role="img" aria-label="Brownie"><path d="${L.doce}" style="fill:var(--logo-doce, var(--logo-tinta))"/></svg>`;
  };

  /* ---------- Render automático ---------- */
  const FOIL = `<svg width="0" height="0" style="position:absolute;left:-9999px" aria-hidden="true"><defs>
    <linearGradient id="ls-foil" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8C5E16"/><stop offset=".24" stop-color="#C8952E"/><stop offset=".42" stop-color="#F0D38A"/>
      <stop offset=".6" stop-color="#B98528"/><stop offset=".8" stop-color="#E6BF6A"/><stop offset="1" stop-color="#8F6017"/>
    </linearGradient></defs></svg>`;

  function opcoes(el) {
    return {
      nome: el.hasAttribute('data-com-nome'),
      curta: el.hasAttribute('data-curta'),
      reduzido: el.hasAttribute('data-reduzido'),
      doce: el.dataset.doce,
      zoom: el.hasAttribute('data-zoom'),
      local: el.hasAttribute('data-local'),
      cheio: el.hasAttribute('data-cheio'),
      brilho: !el.hasAttribute('data-sem-brilho'),
    };
  }

  function render(raiz = document) {
    raiz.querySelectorAll('[data-brand]').forEach((el) => {
      const v = BRAND[el.dataset.brand];
      if (v !== undefined) el.textContent = v;
    });
    raiz.querySelectorAll('[data-logo]').forEach((el) => {
      const fn = LOGOS[el.dataset.logo];
      if (fn) el.innerHTML = fn(opcoes(el));
    });
  }

  window.BRAND = BRAND;
  window.LOGOS = LOGOS;
  window.BrandGeo = { calda, gota, coracao, arco };
  window.renderBrand = render;

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('ls-foil')) document.body.insertAdjacentHTML('afterbegin', FOIL);
    render();
  });
})();
