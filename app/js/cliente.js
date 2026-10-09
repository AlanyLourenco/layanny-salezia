/* Página de quem compra: vê o que tem hoje, monta o pedido, escolhe retirada ou entrega e acompanha o status. */
import * as dados from './dados.js';
import { SemEstoque } from './dados.js';
import { I } from './icones.js';
import { $, $$, esc, moeda, paraCentavos, codigoPedido, soDigitos, formatarFone, linkWhats, textoPedido, STATUS, passos, rotuloPagamento, hora } from './util.js';

const estado = {
  loja: null,
  produtos: new Map(),   // id → produto
  hoje: [],              // [{ produtoId, qtd, vendidos }]
  carrinho: new Map(),   // produtoId → qtd
  carregou: { loja: false, produtos: false, hoje: false },
};

const guardado = (k, padrao) => { try { return JSON.parse(localStorage.getItem(k)) ?? padrao; } catch { return padrao; } };
const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

function icones(raiz = document) {
  $$('[data-i]', raiz).forEach((el) => { if (!el.firstElementChild) el.innerHTML = I[el.dataset.i] || ''; });
}
function toast(texto) {
  const t = $('#toast');
  t.textContent = texto;
  t.classList.add('on');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove('on'), 2400);
}
const fotoOuDoce = (p, cls = 'sem logo--principal') => p?.foto ? `<img src="${p.foto}" alt="" loading="lazy">` : `<div class="${cls}">${LOGOS.brownie()}</div>`;
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

if (dados.MODO_DEMO) $('#faixa-demo').hidden = false;
icones();

/* ================= Abertura ================= */
// Só na primeira visita da sessão; sai quando os dados chegam e o logo termina de "derramar"
const abertura = $('#abertura');
const viuAbertura = sessionStorage.getItem('ls-abertura');
let fimAbertura = Promise.resolve();
if (viuAbertura) abertura.remove();
else {
  sessionStorage.setItem('ls-abertura', '1');
  fimAbertura = new Promise((ok) => {
    requestAnimationFrame(() => window.LSMotion?.play($('.abertura-logo')).catch(() => {}));
    setTimeout(ok, 1900);
  });
}
async function tirarAbertura() {
  if (!abertura.isConnected) return;
  await Promise.race([fimAbertura, new Promise((ok) => setTimeout(ok, 4000))]);
  abertura.classList.add('sai');
  setTimeout(() => abertura.remove(), 700);
}

/* ================= Início ================= */

function saudar() {
  const h = new Date().getHours();
  const oi = h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const nome = (guardado('ls-cliente', {}).nome || '').split(' ')[0];
  $('#saudacao').innerHTML = nome ? `${oi}, <span class="script">${esc(nome)}</span>` : `${oi}!`;
}
saudar();

const disponivel = () => estado.hoje
  .map((h) => ({ ...h, produto: estado.produtos.get(h.produtoId), resta: h.qtd - h.vendidos }))
  .filter((h) => h.produto && h.produto.ativo !== false && h.qtd > 0);
const restaDe = (id) => disponivel().find((h) => h.produtoId === id)?.resta ?? 0;

function renderInicio() {
  const loja = estado.loja;
  if (!loja || !estado.carregou.produtos || !estado.carregou.hoje) return;
  const itens = disponivel();
  const aberta = loja.aberta && itens.length > 0;
  const total = itens.reduce((s, h) => s + Math.max(0, h.resta), 0);

  const pill = $('#status-pill');
  pill.classList.toggle('aberto', aberta);
  pill.lastElementChild.textContent = aberta ? 'Aberto' : 'Fechado';

  // Banner principal
  const destaque = itens.find((h) => h.produto.foto && h.resta > 0)?.produto;
  $('#hero-arco').innerHTML = `<div>${destaque ? `<img src="${destaque.foto}" alt="${esc(destaque.nome)}">` : `<div class="logo--ouro">${LOGOS.brownie()}</div>`}</div>`;
  $('#hero-btn').hidden = false;
  if (aberta) {
    $('#hero-titulo').innerHTML = 'Derrete<br>na boca';
    $('#hero-sub').textContent = total > 0
      ? `Fornada de hoje: ${plural(total, 'unidade', 'unidades')}. Pedidos até ${loja.ate || 'acabar'}. Entrega grátis a partir de ${plural(loja.entregaMinimo ?? 2, 'unidade', 'unidades')}.`
      : 'Tudo vendido por hoje. Obrigada! 🧡';
    $('#hero-btn').innerHTML = 'Ver cardápio';
    $('#hero-btn').href = '#cardapio';
    $('#hero-btn').removeAttribute('target');
  } else {
    $('#hero-titulo').innerHTML = 'Hoje sem<br>fornada';
    $('#hero-sub').textContent = 'A próxima sai logo. A Layanny avisa no Instagram.';
    if (loja.whatsapp) {
      $('#hero-btn').innerHTML = 'Perguntar quando abre';
      $('#hero-btn').href = linkWhats(loja.whatsapp, 'Oi, Layanny! 🧡 Quando abre a próxima fornada?');
      $('#hero-btn').target = '_blank';
    } else $('#hero-btn').hidden = true;
  }

  $('#aviso').hidden = !loja.aviso;
  $('#aviso').textContent = loja.aviso || '';
  $('#cardapio').hidden = !aberta;

  if (!aberta) { estado.carrinho.clear(); renderBarra(); return; }

  // se o estoque baixou enquanto o cliente escolhia, ajusta o pedido
  for (const [id, q] of estado.carrinho) {
    const max = restaDe(id);
    if (q > max) {
      max > 0 ? estado.carrinho.set(id, max) : estado.carrinho.delete(id);
      const nome = estado.produtos.get(id)?.nome || 'Um item';
      toast(max > 0 ? `Só restam ${max} de ${nome}` : `${nome} acabou`);
    }
  }

  const ordenados = [...itens].sort((a, b) => (a.resta <= 0) - (b.resta <= 0));
  $('#n-itens').textContent = plural(itens.length, 'opção', 'opções');
  $('#grade').innerHTML = ordenados.map(({ produto: p, produtoId, resta }) => {
    const q = estado.carrinho.get(produtoId) || 0;
    const esgotado = resta <= 0;
    return `<li class="card ${esgotado ? 'esgotado' : ''}" data-abrir="${produtoId}" tabindex="0" role="button" aria-label="${esc(p.nome)}, ${moeda(p.preco)}">
      <div class="card-foto">
        ${fotoOuDoce(p)}
        ${esgotado ? '<span class="etiqueta">Esgotado</span>' : resta <= 3 ? `<span class="etiqueta">${resta === 1 ? 'Último!' : `Só ${resta}`}</span>` : ''}
        ${q ? `<span class="no-pedido" aria-label="${q} no pedido">${q}×</span>` : ''}
      </div>
      <div class="card-info">
        <div><h3>${esc(p.nome)}</h3>${p.descricao ? `<p class="desc">${esc(p.descricao)}</p>` : ''}</div>
        <div class="card-pe">
          <span class="preco">${moeda(p.preco)}</span>
          <button class="mais-btn" data-mais="${produtoId}" aria-label="Adicionar ${esc(p.nome)}" ${esgotado || q >= resta ? 'disabled' : ''}>${I.mais}</button>
        </div>
      </div>
    </li>`;
  }).join('');
  renderBarra();
}

function adicionar(id, delta = 1) {
  const max = restaDe(id);
  const atual = estado.carrinho.get(id) || 0;
  const q = Math.max(0, Math.min(max, atual + delta));
  if (delta > 0 && q === atual) { toast(`Só tem ${max} hoje`); return; }
  q ? estado.carrinho.set(id, q) : estado.carrinho.delete(id);
  renderInicio();
  if (!$('#tela-pedido').hidden) renderPedido();
}

$('#grade').addEventListener('click', (e) => {
  const mais = e.target.closest('[data-mais]');
  if (mais) {
    adicionar(mais.dataset.mais);
    const card = $(`[data-abrir="${mais.dataset.mais}"]`);
    card?.classList.add('pulsa');
    $('#badge').classList.remove('pula'); void $('#badge').offsetWidth; $('#badge').classList.add('pula');
    return;
  }
  const card = e.target.closest('[data-abrir]');
  if (card && !card.classList.contains('esgotado')) abrirFicha(card.dataset.abrir);
});
$('#grade').addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-abrir]')) { e.preventDefault(); e.target.click(); }
});

const itensCarrinho = () => [...estado.carrinho].map(([id, qtd]) => {
  const p = estado.produtos.get(id);
  return { produtoId: id, nome: p.nome, preco: p.preco, qtd };
});
const subtotal = () => itensCarrinho().reduce((s, i) => s + i.preco * i.qtd, 0);
const unidades = () => [...estado.carrinho.values()].reduce((a, b) => a + b, 0);

function renderBarra() {
  const n = unidades();
  $('#badge').hidden = n === 0;
  $('#badge').textContent = n;
  $('#barra-pedido').hidden = n === 0;
  $('#barra-itens').textContent = plural(n, 'item', 'itens');
  $('#barra-total').textContent = moeda(subtotal());
}

/* ================= Ficha do produto ================= */

const ficha = $('#ficha');
let fichaId = null;
let fichaQtd = 1;

function abrirFicha(id) {
  const p = estado.produtos.get(id);
  if (!p) return;
  fichaId = id;
  const noPedido = estado.carrinho.get(id) || 0;
  fichaQtd = noPedido || 1;
  const resta = restaDe(id);
  $('#ficha-foto').innerHTML = fotoOuDoce(p);
  $('#ficha-nome').textContent = p.nome;
  $('#ficha-preco').textContent = moeda(p.preco);
  $('#ficha-desc').textContent = p.descricao || 'Feito à mão, no dia, do jeitinho da Lalá.';
  $('#ficha-resta').textContent = resta <= 3 ? (resta === 1 ? 'Só resta 1 hoje!' : `Só restam ${resta} hoje!`) : `${resta} disponíveis hoje`;
  $('#ficha-resta').classList.toggle('pouco', resta <= 3);
  renderFicha();
  ficha.showModal();
}
function renderFicha() {
  const p = estado.produtos.get(fichaId);
  const noPedido = estado.carrinho.get(fichaId) || 0;
  const resta = restaDe(fichaId);
  $('#ficha-qtd').textContent = fichaQtd;
  $('#ficha-menos').disabled = fichaQtd <= (noPedido ? 0 : 1);
  $('#ficha-mais').disabled = fichaQtd >= resta;
  $('#ficha-add').textContent = fichaQtd === 0 ? 'Tirar do pedido'
    : `${noPedido ? 'Atualizar' : 'Adicionar'} · ${moeda(p.preco * fichaQtd)}`;
}
$('#ficha-menos').addEventListener('click', () => { fichaQtd = Math.max(0, fichaQtd - 1); renderFicha(); });
$('#ficha-mais').addEventListener('click', () => { fichaQtd = Math.min(restaDe(fichaId), fichaQtd + 1); renderFicha(); });
$('#ficha-add').addEventListener('click', () => {
  const antes = estado.carrinho.get(fichaId) || 0;
  fichaQtd ? estado.carrinho.set(fichaId, fichaQtd) : estado.carrinho.delete(fichaId);
  ficha.close();
  renderInicio();
  if (!$('#tela-pedido').hidden) renderPedido();
  toast(fichaQtd === 0 ? 'Tirado do pedido' : antes ? 'Pedido atualizado' : 'Adicionado ao pedido 🧡');
});
$('#ficha-fechar').addEventListener('click', () => ficha.close());
ficha.addEventListener('click', (e) => { if (e.target === ficha) ficha.close(); });

/* ================= Navegação ================= */

function mostrar(tela) {
  for (const t of ['#tela-inicio', '#tela-pedido', '#tela-acompanhar']) $(t).hidden = t !== tela;
  scrollTo(0, 0);
}
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-ir="pedido"]')) {
    if (!estado.carrinho.size) { toast('Seu pedido está vazio. Escolha um docinho 🧡'); return; }
    preencherCliente();
    renderOpcoesEntrega();
    renderPedido();
    mostrar('#tela-pedido');
    history.pushState({ tela: 'pedido' }, '');
  }
  if (e.target.closest('[data-voltar]')) history.back();
});
addEventListener('popstate', () => {
  if (!$('#tela-pedido').hidden) { mostrar('#tela-inicio'); renderInicio(); }
});

/* ================= Finalizar pedido ================= */

const form = $('#form-pedido');
const tipoAtual = () => form.tipo.value;
const minimoEntrega = () => estado.loja?.entregaMinimo ?? 2;

function preencherCliente() {
  const c = guardado('ls-cliente', {});
  for (const k of ['nome', 'whatsapp', 'endereco', 'bairro', 'complemento']) if (c[k] && !form[k].value) form[k].value = c[k];
}

// Entrega grátis só a partir de N unidades; abaixo disso, só retirada
function renderOpcoesEntrega() {
  const loja = estado.loja || {};
  const min = minimoEntrega();
  const falta = Math.max(0, min - unidades());
  const entrega = form.querySelector('[name=tipo][value=entrega]');
  entrega.disabled = falta > 0;
  if (entrega.disabled) form.querySelector('[name=tipo][value=retirada]').checked = true;
  $('#sub-entrega').textContent = [`a partir de ${plural(min, 'unidade', 'unidades')}`, loja.entregaInicio ? `entregas a partir das ${loja.entregaInicio}` : ''].filter(Boolean).join(' · ');
  $('#dica-entrega').hidden = falta === 0;
  $('#dica-entrega').textContent = `Falta ${plural(falta, 'unidade', 'unidades')} para ganhar entrega grátis 🧡`;
  $('#sub-retirada').textContent = loja.retirada || 'combine o local pelo WhatsApp';
  atualizarEntrega();
}

function atualizarEntrega() {
  const entrega = tipoAtual() === 'entrega';
  $('#campos-entrega').hidden = !entrega;
  $$('.quando').forEach((s) => (s.textContent = entrega ? 'na entrega' : 'na retirada'));
  $('#campo-troco').hidden = form.pagamento.value !== 'dinheiro';
  renderResumo();
}

function renderResumo() {
  const s = subtotal();
  $('#r-subtotal').textContent = moeda(s);
  $('#r-linha-taxa').hidden = tipoAtual() !== 'entrega';
  $('#r-total').textContent = moeda(s);
  $('#enviar-total').textContent = moeda(s);
}

function renderPedido() {
  const itens = itensCarrinho();
  if (!itens.length) { history.back(); return; }
  $('#itens-pedido').innerHTML = itens.map((i) => {
    const p = estado.produtos.get(i.produtoId);
    const max = restaDe(i.produtoId);
    return `<li class="item">
      <div class="mini-foto">${fotoOuDoce(p)}</div>
      <div><div class="nome">${esc(i.nome)}</div><div class="sub">${moeda(i.preco * i.qtd)}</div></div>
      <div class="qtd" role="group" aria-label="Quantidade de ${esc(i.nome)}">
        <button type="button" data-menos="${i.produtoId}" aria-label="${i.qtd === 1 ? 'Tirar do pedido' : 'Tirar um'}">${i.qtd === 1 ? I.lixo : I.menos}</button>
        <output>${i.qtd}</output>
        <button type="button" data-mais-p="${i.produtoId}" aria-label="Pôr mais um" ${i.qtd >= max ? 'disabled' : ''}>${I.mais}</button>
      </div>
    </li>`;
  }).join('');
  renderOpcoesEntrega();
}
$('#itens-pedido').addEventListener('click', (e) => {
  const menos = e.target.closest('[data-menos]');
  const mais = e.target.closest('[data-mais-p]');
  if (menos) adicionar(menos.dataset.menos, -1);
  if (mais) adicionar(mais.dataset.maisP, +1);
});

form.addEventListener('change', (e) => {
  if (['tipo', 'pagamento'].includes(e.target.name)) atualizarEntrega();
});
form.whatsapp.addEventListener('input', () => { form.whatsapp.value = formatarFone(form.whatsapp.value); });
form.addEventListener('input', (e) => {
  const c = e.target.closest('.campo');
  c?.classList.remove('invalido');
  c?.querySelector('.msg')?.remove();
});

function invalidar(campo, msg) {
  const c = form[campo].closest('.campo');
  c.classList.add('invalido');
  c.querySelector('.msg')?.remove();
  c.insertAdjacentHTML('beforeend', `<span class="msg">${msg}</span>`);
  return form[campo];
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  $$('.campo .msg', form).forEach((m) => m.remove());
  $('#erro-pedido').hidden = true;
  const entrega = tipoAtual() === 'entrega';
  const erros = [];
  if (entrega && form.endereco.value.trim().length < 4) erros.push(invalidar('endereco', 'Precisamos do endereço.'));
  if (entrega && form.bairro.value.trim().length < 2) erros.push(invalidar('bairro', 'Qual o bairro?'));
  if (form.nome.value.trim().length < 2) erros.push(invalidar('nome', 'Conta pra gente seu nome.'));
  if (soDigitos(form.whatsapp.value).length < 10) erros.push(invalidar('whatsapp', 'Confere o número com DDD.'));
  if (erros.length) { erros[0].focus(); erros[0].scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }

  const itens = itensCarrinho();
  const sub = subtotal();
  const pedido = {
    codigo: codigoPedido(),
    cliente: { nome: form.nome.value.trim(), whatsapp: soDigitos(form.whatsapp.value) },
    itens,
    entrega: entrega
      ? { tipo: 'entrega', endereco: form.endereco.value.trim(), bairro: form.bairro.value.trim(), complemento: form.complemento.value.trim() }
      : { tipo: 'retirada' },
    pagamento: { forma: form.pagamento.value, troco: form.pagamento.value === 'dinheiro' ? paraCentavos(form.troco.value) : 0 },
    obs: form.obs.value.trim(),
    subtotal: sub,
    total: sub,
  };

  const btn = $('#enviar');
  btn.disabled = true;
  btn.firstElementChild.textContent = 'Enviando…';
  try {
    const { id } = await dados.criarPedido(pedido);
    guardar('ls-cliente', { nome: pedido.cliente.nome, whatsapp: form.whatsapp.value, endereco: form.endereco.value, bairro: form.bairro.value, complemento: form.complemento.value });
    guardar('ls-meus-pedidos', [{ id, codigo: pedido.codigo, em: Date.now() }, ...guardado('ls-meus-pedidos', [])].slice(0, 10));
    estado.carrinho.clear();
    form.obs.value = '';
    history.replaceState(null, '', `?pedido=${id}`);
    renderBarra();
    saudar();
    acompanhar(id, true);
  } catch (erro) {
    const caixa = $('#erro-pedido');
    caixa.hidden = false;
    if (erro instanceof SemEstoque) {
      caixa.textContent = `${erro.message} ${erro.faltas.map((f) => f.resta > 0 ? `${f.nome}: só restam ${f.resta}.` : `${f.nome} acabou.`).join(' ')} Já ajustamos seu pedido.`;
      erro.faltas.forEach((f) => f.resta > 0 ? estado.carrinho.set(f.produtoId, f.resta) : estado.carrinho.delete(f.produtoId));
      if (estado.carrinho.size) renderPedido();
    } else {
      console.error(erro);
      caixa.textContent = erro.message?.startsWith('A loja') ? erro.message : 'Não conseguimos enviar agora. Confere sua internet e tenta de novo.';
    }
    caixa.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } finally {
    btn.disabled = false;
    btn.firstElementChild.textContent = 'Fazer pedido';
    renderResumo();
  }
});

/* ================= Acompanhar ================= */

const ICONE_PASSO = { novo: 'nota', confirmado: 'coracao', pronto: 'presente', saiu: 'moto', entregue: 'check' };
const SUB_STATUS = {
  novo: 'Assim que a Layanny confirmar, você vê aqui.',
  confirmado: 'Seu pedido já está na fila do forno.',
  pronto: 'Pode vir buscar quando quiser.',
  saiu: 'Já já chega aí. Fica de olho no portão!',
  entregue: 'Depois conta pra Layanny o que achou 🧡',
  cancelado: 'Ficou alguma dúvida? Fale com a Layanny.',
};

let pararPedido = null;
let ultimoPedido = null;
function acompanhar(id, recemFeito = false) {
  mostrar('#tela-acompanhar');
  pararPedido?.();
  pararPedido = dados.ouvirPedido(id, (p) => {
    ultimoPedido = p;
    if (!p) { $('#a-status').textContent = 'Não encontramos esse pedido.'; return; }
    renderAcompanhar(p, recemFeito);
  });
}

function renderAcompanhar(p, recemFeito) {
  const loja = estado.loja || {};
  const cancelado = p.status === 'cancelado';
  $('#a-codigo').textContent = `#${p.codigo}`;
  $('#a-status').textContent = STATUS[p.status]?.cliente || '';
  $('#a-sub').textContent = SUB_STATUS[p.status] || '';
  $('.status-cartao').classList.toggle('cancelado', cancelado);

  const lista = passos(p.entrega.tipo);
  const atual = lista.indexOf(p.status);
  $('#a-passos').hidden = cancelado;
  $('#a-passos').innerHTML = lista.map((s, i) => {
    const cls = p.status === 'entregue' || i < atual ? 'feito' : i === atual ? 'agora' : '';
    return `<li class="${cls}"><span class="p-ic">${cls === 'feito' ? I.check : I[ICONE_PASSO[s]]}</span>${STATUS[s].rotulo}</li>`;
  }).join('');

  const whats = $('#a-whats');
  whats.hidden = !loja.whatsapp || cancelado || !recemFeito;
  if (loja.whatsapp) whats.href = linkWhats(loja.whatsapp, textoPedido(p));

  const mostrarPix = p.pagamento.forma === 'pix' && !p.pago && !cancelado && loja.pix?.chave;
  $('#a-pix').hidden = !mostrarPix;
  if (mostrarPix) {
    $('#a-pix-valor').textContent = moeda(p.total);
    $('#a-pix-chave span').textContent = loja.pix.chave;
    $('#a-pix-titular').textContent = loja.pix.titular ? `em nome de ${loja.pix.titular}` : '';
  }

  $('#a-hora').textContent = `feito às ${hora(p.criadoEm)}`;
  $('#a-itens').innerHTML = p.itens.map((i) => `<li class="item">
      <div class="mini-foto">${fotoOuDoce(estado.produtos.get(i.produtoId))}</div>
      <div><div class="nome">${esc(i.nome)}</div><div class="mini suave">${i.qtd} × ${moeda(i.preco)}</div></div>
      <span class="valor">${moeda(i.preco * i.qtd)}</span>
    </li>`).join('');
  const e = p.entrega;
  $('#a-resumo').innerHTML = `${e.tipo === 'entrega' ? '<div><span>Entrega</span><span>Grátis</span></div>' : ''}
    <div class="total"><span>Total</span><span>${moeda(p.total)}</span></div>`;
  $('#a-entrega').innerHTML = `${I[e.tipo === 'entrega' ? 'pin' : 'loja']}<span>${e.tipo === 'entrega'
    ? `Entrega grátis em ${esc(e.endereco)}, ${esc(e.bairro)}${e.complemento ? ` (${esc(e.complemento)})` : ''}${loja.entregaInicio ? `. Entregas a partir das ${esc(loja.entregaInicio)}.` : ''}`
    : `Retirada${loja.retirada ? `: ${esc(loja.retirada)}` : ', combine o local pelo WhatsApp'}`}</span>`;
  $('#a-pagamento').innerHTML = `${I[{ pix: 'pix', pixEntrega: 'pix', cartao: 'cartao', dinheiro: 'dinheiro' }[p.pagamento.forma]]}<span>${rotuloPagamento(p)}${p.pagamento.troco ? ` · troco para ${moeda(p.pagamento.troco)}` : ''}${p.pago ? ' · <b>pago ✓</b>' : ''}</span>`;

  const ajuda = $('#a-ajuda');
  ajuda.hidden = !loja.whatsapp;
  if (loja.whatsapp) ajuda.href = linkWhats(loja.whatsapp, `Oi, Layanny! Sobre o meu pedido #${p.codigo}:`);
}

$('#a-pix-chave').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('#a-pix-chave span').textContent); toast('Chave Pix copiada'); }
  catch { toast('Segure o texto para copiar'); }
});
function voltarAoInicio() {
  pararPedido?.();
  history.replaceState(null, '', location.pathname);
  mostrar('#tela-inicio');
  renderInicio();
  renderUltimo();
}
$('#a-novo').addEventListener('click', voltarAoInicio);
$('#a-voltar').addEventListener('click', voltarAoInicio);

// Atalho para o último pedido feito hoje neste aparelho
function renderUltimo() {
  const ult = guardado('ls-meus-pedidos', []).find((p) => new Date(p.em).toDateString() === new Date().toDateString());
  const a = $('#ultimo-pedido');
  a.hidden = !ult;
  if (ult) { a.href = `?pedido=${ult.id}`; a.innerHTML = `<span>Acompanhe seu pedido <b>#${esc(ult.codigo)}</b></span>${I.seta}`; }
}
$('#ultimo-pedido').addEventListener('click', (e) => {
  e.preventDefault();
  const id = new URL(e.currentTarget.href).searchParams.get('pedido');
  history.replaceState(null, '', `?pedido=${id}`);
  acompanhar(id);
});

/* ================= Marca ================= */
$('#marca-cartao').href = `https://instagram.com/${(window.BRAND?.instagramAtual || '').replace('@', '')}`;

/* ================= Dados em tempo real ================= */

function chegou(parte) {
  estado.carregou[parte] = true;
  if (Object.values(estado.carregou).every(Boolean)) tirarAbertura();
}
dados.ouvirLoja((l) => {
  estado.loja = l;
  chegou('loja');
  renderInicio();
  if (!$('#tela-pedido').hidden) renderOpcoesEntrega();
  if (ultimoPedido && !$('#tela-acompanhar').hidden) renderAcompanhar(ultimoPedido, !$('#a-whats').hidden);
});
dados.ouvirProdutos((lista) => { estado.produtos = new Map(lista.map((p) => [p.id, p])); chegou('produtos'); renderInicio(); });
dados.ouvirHoje((lista) => {
  estado.hoje = lista;
  chegou('hoje');
  renderInicio();
  if (!$('#tela-pedido').hidden && estado.carrinho.size) renderPedido();
});

const idUrl = new URLSearchParams(location.search).get('pedido');
if (idUrl) acompanhar(idUrl);
renderUltimo();
