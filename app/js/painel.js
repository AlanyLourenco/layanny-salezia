/* Painel da confeiteira: pedidos em tempo real, cardápio do dia, produtos e ajustes. */
import * as dados from './dados.js';
import { LOJA_PADRAO } from './dados.js';
import { I } from './icones.js';
import { $, $$, esc, moeda, paraCentavos, centavosParaCampo, comprimirFoto, formatarFone, soDigitos, linkWhats, hora, ehHoje, STATUS, rotuloPagamento } from './util.js';

const estado = {
  loja: { ...LOJA_PADRAO },
  produtos: [],
  hoje: [],
  pedidos: [],
  filtro: 'ativos',
  rascunhoDia: null,   // { produtoId: { on, qtd } } enquanto ela edita a aba Hoje
  vistos: null,        // ids de pedidos já mostrados (para tocar o som só nos novos)
};
let parar = [];

function icones(raiz = document) {
  $$('[data-i]', raiz).forEach((el) => { if (!el.firstElementChild) el.innerHTML = I[el.dataset.i] || ''; });
}
function toast(texto) {
  const t = $('#toast');
  t.textContent = texto;
  t.classList.add('on');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove('on'), 2600);
}
// Botão que pede um segundo toque para confirmar (evita apagar/cancelar sem querer)
function confirmarDuplo(btn, texto = 'Toque de novo para confirmar') {
  if (btn.dataset.armado) { delete btn.dataset.armado; return true; }
  const original = btn.textContent;
  btn.dataset.armado = '1';
  btn.textContent = texto;
  setTimeout(() => { if (btn.dataset.armado) { delete btn.dataset.armado; btn.textContent = original; } }, 3500);
  return false;
}
const fotoOuDoce = (p) => p?.foto ? `<img src="${p.foto}" alt="" loading="lazy">` : `<div class="sem logo--principal">${LOGOS.brownie()}</div>`;
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

icones();
if (dados.MODO_DEMO) {
  $('#faixa-demo').hidden = false;
  $('#form-login [name=senha]').required = false;
  $('#form-login [name=senha]').placeholder = 'no modo demonstração, qualquer uma';
}

/* ================= Login ================= */

dados.ouvirAuth((usuario) => {
  $('#tela-login').hidden = !!usuario;
  $('#tela-painel').hidden = !usuario;
  parar.forEach((f) => f());
  parar = [];
  if (usuario) iniciar();
  else requestAnimationFrame(() => window.LSMotion?.play($('.login-logo')).catch(() => {}));
});

$('#form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  $('#erro-login').hidden = true;
  try {
    await dados.entrar(f.email.value.trim(), f.senha.value);
  } catch (erro) {
    $('#erro-login').hidden = false;
    $('#erro-login').textContent = /invalid|wrong|user-not-found/i.test(erro.code || '') ? 'E-mail ou senha não conferem.' : 'Não deu para entrar agora. Confere a internet.';
  }
});
$('#sair').addEventListener('click', () => dados.sair());

/* ================= Abas ================= */

$$('.abas button').forEach((b) => b.addEventListener('click', () => {
  $$('.abas button').forEach((x) => x.classList.toggle('on', x === b));
  $$('.aba').forEach((a) => (a.hidden = a.id !== `aba-${b.dataset.aba}`));
  if (b.dataset.aba === 'pedidos') $('#ponto-novo').hidden = true;
  if (b.dataset.aba === 'hoje') renderDia();
  if (b.dataset.aba === 'ajustes') renderAjustes();
  scrollTo(0, 0);
}));
const abaAtual = () => $('.abas button.on').dataset.aba;

function iniciar() {
  saudar();
  parar.push(
    dados.ouvirLoja((l) => { estado.loja = { ...LOJA_PADRAO, ...l }; renderLoja(); }),
    dados.ouvirProdutos((p) => { estado.produtos = p; renderCatalogo(); renderDia(); renderPedidos(); }),
    dados.ouvirHoje((h) => { estado.hoje = h; renderDia(); renderNumeros(); }),
    dados.ouvirPedidos(receberPedidos),
  );
}

function saudar() {
  const h = new Date().getHours();
  const oi = h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  $('#saudacao').innerHTML = `${oi}, <span class="script">${esc(BRAND.primeiroNome)}</span>`;
  const data = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  $('#data-hoje').textContent = data[0].toUpperCase() + data.slice(1);
}

/* ================= Loja aberta/fechada ================= */

function renderLoja() {
  const aberta = !!estado.loja.aberta;
  $('#loja-aberta').checked = aberta;
  $('#loja-aberta-txt').textContent = aberta ? 'Aberta' : 'Fechada';
  $('#status-loja').classList.toggle('aberto', aberta);
  $('#status-loja').lastElementChild.textContent = aberta ? 'Aberta' : 'Fechada';
  for (const [id, campo] of [['#hoje-ate', 'ate'], ['#hoje-entrega', 'entregaInicio'], ['#hoje-aviso', 'aviso']]) {
    if (document.activeElement !== $(id)) $(id).value = estado.loja[campo] || '';
  }
}
async function mudarLoja(aberta) {
  if (aberta && !estado.hoje.some((h) => h.qtd > h.vendidos)) toast('Dica: marque o que tem hoje na aba Hoje');
  await dados.salvarLoja({ aberta });
  toast(aberta ? 'Loja aberta: o cardápio já aparece para os clientes' : 'Loja fechada para pedidos');
}
$('#loja-aberta').addEventListener('change', (e) => mudarLoja(e.target.checked));
$('#status-loja').addEventListener('click', () => mudarLoja(!estado.loja.aberta));

/* ================= Pedidos ================= */

let audio;
$('#ativar-som').addEventListener('click', () => {
  audio = new (window.AudioContext || window.webkitAudioContext)();
  $('#ativar-som').hidden = true;
  tocar();
  toast('Som ligado 🔔');
});
// "plim-plom" curto gerado na hora, sem arquivo de áudio
function tocar() {
  if (!audio) return;
  [[880, 0], [1320, 0.16]].forEach(([f, t]) => {
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, audio.currentTime + t);
    g.gain.exponentialRampToValueAtTime(0.35, audio.currentTime + t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + t + 0.5);
    o.connect(g).connect(audio.destination);
    o.start(audio.currentTime + t);
    o.stop(audio.currentTime + t + 0.55);
  });
}

function receberPedidos(lista) {
  const novos = estado.vistos ? lista.filter((p) => !estado.vistos.has(p.id) && p.status === 'novo') : [];
  estado.vistos = new Set(lista.map((p) => p.id));
  estado.pedidos = lista;
  if (novos.length) {
    tocar();
    navigator.vibrate?.([120, 60, 120]);
    toast(novos.length > 1 ? `${novos.length} pedidos novos!` : `Pedido novo de ${novos[0].cliente.nome.split(' ')[0]}! 🧡`);
    if (abaAtual() !== 'pedidos') $('#ponto-novo').hidden = false;
  }
  renderPedidos();
  renderNumeros();
}

const ativo = (p) => !['entregue', 'cancelado'].includes(p.status);
$$('[name=filtro]').forEach((r) => r.addEventListener('change', () => { estado.filtro = r.value; renderPedidos(); }));

const PROXIMO = {
  novo: { para: 'confirmado', rotulo: 'Confirmar pedido' },
  confirmado: { entrega: { para: 'saiu', rotulo: 'Saiu para entrega' }, retirada: { para: 'pronto', rotulo: 'Pronto para retirar' } },
  pronto: { para: 'entregue', rotulo: 'Cliente retirou' },
  saiu: { para: 'entregue', rotulo: 'Foi entregue' },
};
const proximo = (p) => { const n = PROXIMO[p.status]; return n?.para ? n : n?.[p.entrega.tipo]; };

const MSG_CLIENTE = {
  novo: (p) => `Oi, ${p.cliente.nome.split(' ')[0]}! Aqui é a Layanny 🧡 Recebi seu pedido #${p.codigo}.`,
  confirmado: (p) => `Oi, ${p.cliente.nome.split(' ')[0]}! Seu pedido #${p.codigo} está confirmado 🧡`,
  pronto: (p) => `Oi, ${p.cliente.nome.split(' ')[0]}! Seu pedido #${p.codigo} está pronto para retirar 🧡`,
  saiu: (p) => `Oi, ${p.cliente.nome.split(' ')[0]}! Seu pedido #${p.codigo} saiu para entrega 🛵🧡`,
  entregue: (p) => `Oi, ${p.cliente.nome.split(' ')[0]}! Obrigada pelo pedido 🧡 Depois me conta o que achou?`,
  cancelado: (p) => `Oi, ${p.cliente.nome.split(' ')[0]}! Sobre o pedido #${p.codigo}:`,
};
const ICONE_PAG = { pix: 'pix', pixEntrega: 'pix', cartao: 'cartao', dinheiro: 'dinheiro' };

function renderPedidos() {
  const ativos = estado.pedidos.filter(ativo);
  $('#n-ativos').textContent = ativos.length;
  const lista = estado.filtro === 'ativos' ? [...ativos].reverse() : estado.pedidos.filter((p) => !ativo(p));
  $('#sem-pedidos').hidden = lista.length > 0;
  $('#sem-pedidos-txt').textContent = estado.filtro === 'ativos' ? 'Nenhum pedido em andamento. Respira 🧡' : 'Nenhum pedido concluído nos últimos 3 dias.';
  const fotos = new Map(estado.produtos.map((p) => [p.id, p]));
  $('#lista-pedidos').innerHTML = lista.map((p) => {
    const e = p.entrega;
    const prox = proximo(p);
    const quando = ehHoje(p.criadoEm) ? hora(p.criadoEm) : `${new Date(p.criadoEm).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })} ${hora(p.criadoEm)}`;
    return `<li class="pedido ${p.status}">
      <div class="pc-cab">
        <span class="cod">#${esc(p.codigo)}</span>
        <span class="chip ${p.status === 'novo' ? 'novo' : p.status === 'entregue' ? 'ok' : ''}">${STATUS[p.status].rotulo}</span>
        <span class="hora">${quando}</span>
      </div>
      <div class="pc-corpo">
        <div class="pc-cliente">
          <div><b>${esc(p.cliente.nome)}</b><small>${formatarFone(p.cliente.whatsapp)}</small></div>
          <a class="whats-redondo" href="${linkWhats(p.cliente.whatsapp, MSG_CLIENTE[p.status](p))}" target="_blank" rel="noopener" aria-label="Chamar ${esc(p.cliente.nome)} no WhatsApp">${I.whats}</a>
        </div>
        <ul class="pc-itens">${p.itens.map((i) => `<li><span class="mini-foto">${fotoOuDoce(fotos.get(i.produtoId))}</span><span><span class="q">${i.qtd}×</span>${esc(i.nome)}</span><span>${moeda(i.preco * i.qtd)}</span></li>`).join('')}</ul>
        <div class="pc-info">${I[e.tipo === 'entrega' ? 'moto' : 'loja']}<span>${e.tipo === 'entrega'
          ? `<b>Entrega grátis</b> · ${esc(e.endereco)}, ${esc(e.bairro)}${e.complemento ? ` · ${esc(e.complemento)}` : ''}`
          : '<b>Retirada</b>'}</span></div>
        <div class="pc-info">${I[ICONE_PAG[p.pagamento.forma]]}<span>${rotuloPagamento(p)}${p.pagamento.troco ? ` · troco para ${moeda(p.pagamento.troco)}` : ''}</span></div>
        ${p.obs ? `<div class="pc-obs">📝 ${esc(p.obs)}</div>` : ''}
        <div class="pc-pe">
          <strong>${moeda(p.total)}</strong>
          ${p.status !== 'cancelado' ? `<button class="pago ${p.pago ? 'sim' : ''}" data-pago="${p.id}">${p.pago ? `${I.check} Pago` : 'Marcar como pago'}</button>` : ''}
        </div>
      </div>
      ${ativo(p) ? `<div class="pc-acoes">
        ${prox ? `<button class="btn" data-avancar="${p.id}" data-para="${prox.para}">${prox.rotulo}</button>` : '<span></span>'}
        <button class="cancelar" data-cancelar="${p.id}">Cancelar</button>
      </div>` : ''}
    </li>`;
  }).join('');
}

$('#lista-pedidos').addEventListener('click', async (e) => {
  const alvo = e.target.closest('button');
  if (!alvo) return;
  const pedido = estado.pedidos.find((p) => p.id === (alvo.dataset.pago || alvo.dataset.avancar || alvo.dataset.cancelar));
  if (!pedido) return;
  try {
    if (alvo.dataset.pago) await dados.atualizarPedido(pedido.id, { pago: !pedido.pago });
    if (alvo.dataset.avancar) {
      await dados.atualizarPedido(pedido.id, { status: alvo.dataset.para });
      toast(`#${pedido.codigo}: ${STATUS[alvo.dataset.para].rotulo.toLowerCase()}`);
    }
    if (alvo.dataset.cancelar && confirmarDuplo(alvo, 'Confirmar?')) {
      await dados.cancelarPedido(pedido);
      toast(`#${pedido.codigo} cancelado. As unidades voltaram para o estoque.`);
    }
  } catch (erro) {
    console.error(erro);
    toast('Não salvou. Confere a internet.');
  }
});

function renderNumeros() {
  const hoje = estado.pedidos.filter((p) => ehHoje(p.criadoEm) && p.status !== 'cancelado');
  const total = hoje.reduce((s, p) => s + p.total, 0);
  $('#n-pedidos').textContent = hoje.length;
  $('#n-faturado').textContent = moeda(total).replace(/,00$/, '');
  $('#n-estoque').textContent = estado.hoje.reduce((s, h) => s + Math.max(0, h.qtd - h.vendidos), 0);
}

/* ================= Hoje ================= */

function rascunhoInicial() {
  const r = {};
  for (const p of estado.produtos) r[p.id] = { on: false, qtd: 0 };
  for (const h of estado.hoje) r[h.produtoId] = { on: true, qtd: h.qtd };
  return r;
}

function renderDia() {
  if (abaAtual() !== 'hoje') return;
  estado.rascunhoDia ||= rascunhoInicial();
  const r = estado.rascunhoDia;
  const vendidos = Object.fromEntries(estado.hoje.map((h) => [h.produtoId, h.vendidos]));
  const lista = estado.produtos.filter((p) => p.ativo !== false);
  $('#sem-produtos').hidden = lista.length > 0;
  const foco = document.activeElement?.dataset?.qtdDia;
  $('#lista-dia').innerHTML = lista.map((p) => {
    const d = r[p.id] ||= { on: false, qtd: 0 };
    const v = vendidos[p.id] || 0;
    return `<li class="item ${d.on ? '' : 'fora'}">
      <div class="mini-foto">${fotoOuDoce(p)}</div>
      <div><div class="nome">${esc(p.nome)}</div><div class="vend">${d.on ? (v ? `${plural(v, 'vendido', 'vendidos')} · restam ${Math.max(0, d.qtd - v)}` : 'nenhum vendido ainda') : 'não tem hoje'}</div></div>
      <div class="direita">
        <label class="interruptor"><input type="checkbox" data-marcar="${p.id}" ${d.on ? 'checked' : ''} aria-label="Tem ${esc(p.nome)} hoje"><span class="trilho"><span class="bola"></span></span></label>
        ${d.on ? `<div class="qtd" role="group" aria-label="Quantidade de ${esc(p.nome)}">
          <button type="button" data-dia-menos="${p.id}" aria-label="Menos" ${d.qtd <= Math.max(v, 1) ? 'disabled' : ''}>${I.menos}</button>
          <input type="number" inputmode="numeric" min="${v}" value="${d.qtd}" data-qtd-dia="${p.id}" aria-label="Unidades">
          <button type="button" data-dia-mais="${p.id}" aria-label="Mais">${I.mais}</button>
        </div>` : ''}
      </div>
    </li>`;
  }).join('');
  if (foco) $(`[data-qtd-dia="${foco}"]`)?.focus();
}

$('#lista-dia').addEventListener('change', (e) => {
  const r = estado.rascunhoDia;
  if (e.target.dataset.marcar) {
    const d = r[e.target.dataset.marcar];
    d.on = e.target.checked;
    if (d.on && !d.qtd) d.qtd = 10;
    renderDia();
  }
  const id = e.target.dataset.qtdDia;
  if (id) { r[id].qtd = Math.max(0, parseInt(e.target.value, 10) || 0); renderDia(); }
});
$('#lista-dia').addEventListener('click', (e) => {
  const r = estado.rascunhoDia;
  const t = e.target.closest('[data-dia-mais],[data-dia-menos]');
  if (!t) return;
  if (t.dataset.diaMais) r[t.dataset.diaMais].qtd++;
  if (t.dataset.diaMenos) r[t.dataset.diaMenos].qtd = Math.max(1, r[t.dataset.diaMenos].qtd - 1);
  renderDia();
});

async function salvarDia(zerar) {
  const r = estado.rascunhoDia || rascunhoInicial();
  const vendidos = Object.fromEntries(estado.hoje.map((h) => [h.produtoId, h.vendidos]));
  const lista = estado.produtos
    .filter((p) => r[p.id]?.on && r[p.id].qtd > 0)
    .map((p) => ({ produtoId: p.id, qtd: zerar ? r[p.id].qtd : Math.max(r[p.id].qtd, vendidos[p.id] || 0) }));
  await dados.salvarHoje(lista, { zerar });
  await dados.salvarLoja({ ate: $('#hoje-ate').value, entregaInicio: $('#hoje-entrega').value, aviso: $('#hoje-aviso').value.trim() });
  estado.rascunhoDia = null;
  renderDia();
  toast(lista.length ? `Cardápio de hoje salvo: ${plural(lista.length, 'doce', 'doces')}` : 'Cardápio de hoje vazio');
}
$('#salvar-dia').addEventListener('click', () => salvarDia(false).catch(() => toast('Não salvou. Confere a internet.')));
$('#novo-dia').addEventListener('click', (e) => {
  const btn = e.currentTarget;
  if (!confirmarDuplo(btn, 'Toque de novo: zera os vendidos de hoje')) return;
  salvarDia(true).catch(() => toast('Não salvou. Confere a internet.'));
});

/* ================= Produtos ================= */

function renderCatalogo() {
  $('#n-produtos').textContent = plural(estado.produtos.length, 'doce', 'doces');
  $('#lista-catalogo').innerHTML = `<li><button class="card-novo" id="novo-produto" type="button"><span class="mais-btn">${I.mais}</span>Novo doce</button></li>` +
    estado.produtos.map((p) => `<li class="card ${p.ativo === false ? 'inativo' : ''}" data-editar="${p.id}" tabindex="0" role="button" aria-label="Editar ${esc(p.nome)}">
      <div class="card-foto">${fotoOuDoce(p)}${p.ativo === false ? '<span class="estado">Fora do cardápio</span>' : ''}</div>
      <div class="card-info">
        <div><h3>${esc(p.nome)}</h3>${p.descricao ? `<p class="desc">${esc(p.descricao)}</p>` : ''}</div>
        <div class="card-pe"><span class="preco">${moeda(p.preco)}</span><span class="editar-ic">${I.ajustes}</span></div>
      </div>
    </li>`).join('');
}

const editor = $('#editor');
const fp = $('#form-produto');
let editando = null;
let fotoNova = null;

function abrirEditor(p) {
  editando = p;
  fotoNova = null;
  fp.reset();
  $('#editor-titulo').textContent = p ? 'Editar doce' : 'Novo doce';
  fp.nome.value = p?.nome || '';
  fp.descricao.value = p?.descricao || '';
  fp.preco.value = p ? centavosParaCampo(p.preco) : '';
  fp.ativo.checked = p?.ativo !== false;
  $('#editor-foto').innerHTML = fotoOuDoce(p);
  $('#apagar-produto').hidden = !p;
  $('#apagar-produto').textContent = 'Apagar';
  editor.showModal();
}
$('#lista-catalogo').addEventListener('click', (e) => {
  if (e.target.closest('#novo-produto')) return abrirEditor(null);
  const c = e.target.closest('[data-editar]');
  if (c) abrirEditor(estado.produtos.find((p) => p.id === c.dataset.editar));
});
$('#lista-catalogo').addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-editar]')) { e.preventDefault(); e.target.click(); }
});
$('#editor-arquivo').addEventListener('change', async (e) => {
  const arq = e.target.files[0];
  if (!arq) return;
  try {
    fotoNova = await comprimirFoto(arq);
    $('#editor-foto').innerHTML = `<img src="${fotoNova}" alt="">`;
  } catch (erro) { toast(erro.message); }
});
fp.addEventListener('submit', async (e) => {
  if (e.submitter?.value !== 'salvar') return;
  e.preventDefault();
  const preco = paraCentavos(fp.preco.value);
  if (!fp.nome.value.trim() || preco <= 0) { toast('Preencha o nome e o preço'); return; }
  const produto = {
    ...(editando ? { id: editando.id } : { ordem: estado.produtos.length + 1 }),
    nome: fp.nome.value.trim(),
    descricao: fp.descricao.value.trim(),
    preco,
    ativo: fp.ativo.checked,
    ...(fotoNova ? { foto: fotoNova } : editando ? {} : { foto: '' }),
  };
  try {
    await dados.salvarProduto(produto);
    editor.close();
    toast('Doce salvo');
  } catch (erro) { console.error(erro); toast('Não salvou. Confere a internet.'); }
});
fp.ativo.addEventListener('change', () => { fp.ativo.closest('.interruptor').querySelector('.interruptor-txt').textContent = fp.ativo.checked ? 'Ativo' : 'Fora'; });
$('#apagar-produto').addEventListener('click', async (e) => {
  if (!confirmarDuplo(e.currentTarget, 'Apagar mesmo?')) return;
  await dados.apagarProduto(editando.id);
  editor.close();
  toast('Doce apagado');
});
$('#editor-fechar').addEventListener('click', () => editor.close());
editor.addEventListener('click', (e) => { if (e.target === editor) editor.close(); });

/* ================= Ajustes ================= */

const fa = $('#form-ajustes');
function renderAjustes() {
  const l = estado.loja;
  fa.whatsapp.value = formatarFone(l.whatsapp);
  fa.pixChave.value = l.pix?.chave || '';
  fa.pixTitular.value = l.pix?.titular || '';
  fa.retirada.value = l.retirada || '';
  fa.entregaMinimo.value = l.entregaMinimo ?? 2;
}
fa.whatsapp.addEventListener('input', () => { fa.whatsapp.value = formatarFone(fa.whatsapp.value); });
fa.addEventListener('submit', async (e) => {
  e.preventDefault();
  let whatsapp = soDigitos(fa.whatsapp.value);
  if (whatsapp.length <= 11) whatsapp = '55' + whatsapp;
  try {
    await dados.salvarLoja({
      whatsapp,
      pix: { chave: fa.pixChave.value.trim(), titular: fa.pixTitular.value.trim() },
      retirada: fa.retirada.value.trim(),
      entregaMinimo: Math.max(1, parseInt(fa.entregaMinimo.value, 10) || 2),
    });
    toast('Ajustes salvos');
  } catch (erro) { console.error(erro); toast('Não salvou. Confere a internet.'); }
});
