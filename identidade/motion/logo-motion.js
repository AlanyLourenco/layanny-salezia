/* ==========================================================
   logo-motion.js — animação dos logos (Web Animations API)
   LSMotion.play(elementoComSvg) → Promise que resolve no fim.
   Duração total: ~4s. Princípio: tudo se move como calda,
   devagar no começo e no fim; só a gota acelera ao cair.
   ========================================================== */

(function () {
  const css = (nome) => getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
  const DERRETE = () => css('--ease-derrete') || 'cubic-bezier(.65,0,.35,1)';
  const PINGA = () => css('--ease-pinga') || 'cubic-bezier(.55,0,.9,.45)';
  const ASSENTA = () => css('--ease-assenta') || 'cubic-bezier(.16,1,.3,1)';

  const reduzir = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function anim(el, frames, opts) {
    if (!el) return null;
    return el.animate(frames, { fill: 'both', ...opts });
  }

  // "escrever": revela da esquerda para a direita
  const escrever = (el, delay, duration, easing = 'cubic-bezier(.45,.05,.55,.95)') =>
    anim(el, [{ clipPath: 'inset(-20% 100% -20% -5%)' }, { clipPath: 'inset(-20% -5% -20% -5%)' }], { delay, duration, easing });

  // "escorrer": revela de cima para baixo
  const escorrer = (el, delay, duration, easing) =>
    anim(el, [{ clipPath: 'inset(-5% -5% 100% -5%)' }, { clipPath: 'inset(-5% -5% -5% -5%)' }], { delay, duration, easing: easing || DERRETE() });

  const surgir = (el, delay, duration = 800, dy = 12) =>
    anim(el, [{ opacity: 0, transform: `translateY(${dy}px)` }, { opacity: 1, transform: 'translateY(0)' }], { delay, duration, easing: DERRETE() });

  function desenharTraco(el, delay, duration) {
    if (!el) return null;
    const len = el.getTotalLength();
    el.style.strokeDasharray = len;
    return anim(el, [{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { delay, duration, easing: DERRETE() });
  }

  /* ---------- v2: logo oficial ----------
     0,0s  o ouro "derrama" de cima para baixo (máscara com gotas)
     1,9s  o brownie cai no lugar e assenta
     2,8s  reflexo do foil atravessa o logo
     2,6s+ o nome surge; a cursiva é "escrita" da esquerda para a direita */
  function monogramaV2(svg, t0 = 0) {
    const doce = svg.querySelector('.lo-doce-mov');
    if (doce) { doce.style.transformBox = 'view-box'; doce.style.transformOrigin = '345px 835px'; }
    return [
      anim(svg.querySelector('.lo-calda'), [{ transform: 'translateY(-1380px)' }, { transform: 'translateY(0)' }],
        { delay: t0 + 100, duration: 2300, easing: DERRETE() }),
      anim(doce, [
        { opacity: 0, transform: 'translateY(-170px)' },
        { opacity: 1, transform: 'translateY(0) scale(1.04, .94)', offset: .62 },
        { opacity: 1, transform: 'translateY(-14px) scale(.98, 1.03)', offset: .8 },
        { opacity: 1, transform: 'translateY(0) scale(1)' },
      ], { delay: t0 + 1800, duration: 1000, easing: 'cubic-bezier(.5,0,.5,1)' }),
      anim(svg.querySelector('.lo-brilho'), [
        { opacity: 0, transform: 'translateX(0) skewX(-18deg)' },
        { opacity: 1, offset: .2 },
        { opacity: 1, offset: .8 },
        { opacity: 0, transform: 'translateX(1250px) skewX(-18deg)' },
      ], { delay: t0 + 2700, duration: 1400, easing: DERRETE() }),
    ];
  }

  function nomeV2(svg, t0) {
    return [
      anim(svg.querySelector('.lo-nome-1'), [
        { opacity: 0, transform: 'translateY(30px)', filter: 'blur(6px)' },
        { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' },
      ], { delay: t0, duration: 1200, easing: ASSENTA() }),
      escrever(svg.querySelector('.lo-nome-2'), t0 + 450, 1500),
      surgir(svg.querySelector('.lo-nome-3'), t0 + 1200, 900, 10),
    ];
  }

  const ROTEIROS = {
    oficial: (svg) => monogramaV2(svg),
    vertical: (svg) => [...monogramaV2(svg), ...nomeV2(svg, 2500)],
    horizontal: (svg) => [...monogramaV2(svg), ...nomeV2(svg, 2300)],
    nome: (svg) => nomeV2(svg, 0),
    selo2(svg) {
      const giro = svg.querySelector('.lo-giro');
      giro.style.transformBox = 'view-box';
      giro.style.transformOrigin = '400px 400px';
      return [
        ...monogramaV2(svg, 300),
        anim(giro, [{ opacity: 0, transform: 'rotate(-120deg)' }, { opacity: 1, transform: 'rotate(0)' }],
          { duration: 2600, easing: ASSENTA() }),
        ...[...svg.querySelectorAll(':scope > circle')].map((c, i) => (c.style.transformBox = 'view-box', c.style.transformOrigin = '400px 400px', c)).map((c, i) =>
          anim(c, [{ opacity: 0, transform: 'scale(.9)' }, { opacity: 1, transform: 'scale(1)' }],
            { delay: i * 160, duration: 1200, easing: ASSENTA() })),
      ];
    },

    monograma(svg) {
      const textos = svg.querySelectorAll('text');
      return [
        desenharTraco(svg.querySelector('.a-fio'), 0, 1600),
        escorrer(svg.querySelector('.a-l'), 250, 1100),
        escrever(svg.querySelector('.a-s'), 700, 1300),
        escorrer(svg.querySelector('.a-gota-presa'), 1700, 700, PINGA()),
        anim(svg.querySelector('.a-gota'), [
          { opacity: 0, transform: 'translateY(-22px) scale(.4)' },
          { opacity: 1, transform: 'translateY(-22px) scale(.7)', offset: .35 },
          { opacity: 1, transform: 'translateY(0) scale(1)' },
        ], { delay: 2300, duration: 800, easing: PINGA() }),
        ...[...textos].slice(2).map((t, i) => surgir(t, 2700 + i * 200)),
      ];
    },

    assinatura(svg) {
      const sub = svg.querySelectorAll('text')[1];
      return [
        escrever(svg.querySelector('.b-nome'), 0, 2400),
        escrever(svg.querySelector('.b-calda'), 1800, 700, DERRETE()),
        anim(svg.querySelector('.b-calda'), [
          { transform: 'scaleY(.35)' }, { transform: 'scaleY(1)' },
        ], { delay: 2300, duration: 1100, easing: PINGA() }),
        surgir(sub, 3000),
      ];
    },

    selo(svg) {
      const textos = svg.querySelectorAll('text');
      return [
        anim(svg, [{ opacity: 0, transform: 'rotate(-25deg) scale(.88)' }, { opacity: 1, transform: 'rotate(0) scale(1)' }],
          { duration: 1400, easing: ASSENTA() }),
        escorrer(svg.querySelector('.c-calda'), 900, 1500, PINGA()),
        ...[...textos].map((t, i) => surgir(t, 1500 + i * 180, 900, 8)),
      ];
    },
  };

  function prepararOrigens(svg) {
    svg.querySelectorAll('path, text').forEach((el) => {
      el.style.transformBox = 'fill-box';
      el.style.transformOrigin = 'top center';
    });
    svg.style.transformOrigin = 'center';
  }

  async function play(alvo) {
    const svg = alvo.tagName === 'svg' ? alvo : alvo.querySelector('svg');
    if (!svg) return;
    svg.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    const roteiro = ROTEIROS[svg.dataset.anim];
    if (!roteiro || reduzir()) return;
    prepararOrigens(svg);
    const anims = roteiro(svg).filter(Boolean);
    await Promise.all(anims.map((a) => a.finished.catch(() => {})));
  }

  // Para exportar vídeo: posiciona todas as animações num instante exato (ms)
  function seek(alvo, ms) {
    const svg = alvo.tagName === 'svg' ? alvo : alvo.querySelector('svg');
    svg.getAnimations({ subtree: true }).forEach((a) => { a.pause(); a.currentTime = ms; });
  }

  window.LSMotion = { play, seek };
})();
