/* Modo demonstração: tudo no localStorage deste navegador.
   As abas se falam pelo evento `storage`: abra o painel numa aba e o cardápio em outra. */
import { SemEstoque, LOJA_PADRAO } from './modelo.js';

const CHAVE = 'ls-pedidos-demo-v2';

function exemplo() {
  const produtos = {
    tradicional: { nome: 'Brownie tradicional', descricao: 'O clássico que derrete na boca: casquinha fina e miolo molhadinho.', preco: 1200, ordem: 1 },
    ninho:       { nome: 'Brownie de Ninho', descricao: 'Recheio cremoso de leite Ninho por cima do brownie.', preco: 1400, ordem: 2 },
    nutella:     { nome: 'Brownie de Nutella', descricao: 'Camada generosa de Nutella. Para quem não tem medo de ser feliz.', preco: 1500, ordem: 3 },
    cookie:      { nome: 'Torta cookie (fatia)', descricao: 'Massa de cookie recheada com brigadeiro.', preco: 1600, ordem: 4 },
    banoffee:    { nome: 'Banoffee (pote)', descricao: 'Doce de leite, banana e chantilly.', preco: 1500, ordem: 5 },
  };
  for (const [id, p] of Object.entries(produtos)) Object.assign(p, { id, foto: '', ativo: true });
  return {
    produtos,
    hoje: {
      tradicional: { produtoId: 'tradicional', qtd: 20, vendidos: 0, ordem: 1 },
      ninho: { produtoId: 'ninho', qtd: 8, vendidos: 0, ordem: 2 },
      nutella: { produtoId: 'nutella', qtd: 3, vendidos: 0, ordem: 3 },
    },
    loja: {
      ...LOJA_PADRAO,
      aberta: true,
      entregaInicio: '15:00',
      retirada: 'Centro, combinar o ponto pelo WhatsApp',
      pix: { chave: 'exemplo@pix.com', titular: 'Layanny Salezia' },
    },
    pedidos: {},
  };
}

let banco = ler();
function ler() {
  try { return JSON.parse(localStorage.getItem(CHAVE)) || exemplo(); } catch { return exemplo(); }
}
function gravar() {
  localStorage.setItem(CHAVE, JSON.stringify(banco));
  avisar();
}

const ouvintes = new Set();
function avisar() { ouvintes.forEach((f) => f()); }
window.addEventListener('storage', (e) => { if (e.key === CHAVE) { banco = ler(); avisar(); } });

function ouvir(montar, cb) {
  const f = () => cb(structuredClone(montar()));
  ouvintes.add(f);
  queueMicrotask(f);
  return () => ouvintes.delete(f);
}
const ordenar = (lista) => lista.sort((a, b) => (a.ordem ?? 99) - (b.ordem ?? 99));
const novoId = () => Math.random().toString(36).slice(2, 12) + Date.now().toString(36);

export const ouvirLoja = (cb) => ouvir(() => banco.loja, cb);
export const ouvirProdutos = (cb) => ouvir(() => ordenar(Object.values(banco.produtos)), cb);
export const ouvirHoje = (cb) => ouvir(() => ordenar(Object.values(banco.hoje)), cb);
export const ouvirPedido = (id, cb) => ouvir(() => banco.pedidos[id] || null, cb);
export const ouvirPedidos = (cb) => ouvir(() => {
  const limite = Date.now() - 3 * 864e5;
  return Object.values(banco.pedidos).filter((p) => p.criadoEm > limite).sort((a, b) => b.criadoEm - a.criadoEm);
}, cb);

export async function criarPedido(pedido) {
  banco = ler();
  if (!banco.loja.aberta) throw new Error('A loja acabou de fechar para pedidos.');
  const faltas = [];
  for (const i of pedido.itens) {
    const h = banco.hoje[i.produtoId];
    const resta = h ? h.qtd - h.vendidos : 0;
    if (i.qtd > resta) faltas.push({ produtoId: i.produtoId, nome: i.nome, resta });
  }
  if (faltas.length) throw new SemEstoque(faltas);
  for (const i of pedido.itens) banco.hoje[i.produtoId].vendidos += i.qtd;
  const id = novoId();
  banco.pedidos[id] = { ...pedido, id, status: 'novo', pago: false, criadoEm: Date.now() };
  gravar();
  return { id };
}

// Login fictício: no modo demonstração qualquer e-mail entra
let usuario = JSON.parse(sessionStorage.getItem('ls-demo-usuario') || 'null');
const ouvintesAuth = new Set();
export function ouvirAuth(cb) { ouvintesAuth.add(cb); queueMicrotask(() => cb(usuario)); return () => ouvintesAuth.delete(cb); }
export async function entrar(email) {
  usuario = { email: email || 'layanny@demo' };
  sessionStorage.setItem('ls-demo-usuario', JSON.stringify(usuario));
  ouvintesAuth.forEach((f) => f(usuario));
}
export async function sair() {
  usuario = null;
  sessionStorage.removeItem('ls-demo-usuario');
  ouvintesAuth.forEach((f) => f(null));
}

export async function salvarProduto(p) {
  const id = p.id || novoId();
  banco.produtos[id] = { ...banco.produtos[id], ...p, id };
  gravar();
  return id;
}
export async function apagarProduto(id) {
  delete banco.produtos[id];
  delete banco.hoje[id];
  gravar();
}
export async function salvarHoje(lista, { zerar = false } = {}) {
  const novo = {};
  lista.forEach((item, ordem) => {
    const antes = banco.hoje[item.produtoId];
    novo[item.produtoId] = { produtoId: item.produtoId, qtd: item.qtd, vendidos: zerar || !antes ? 0 : antes.vendidos, ordem };
  });
  banco.hoje = novo;
  gravar();
}
export async function salvarLoja(cfg) {
  banco.loja = { ...banco.loja, ...cfg };
  gravar();
}
export async function atualizarPedido(id, campos) {
  Object.assign(banco.pedidos[id], campos);
  gravar();
}
export async function cancelarPedido(pedido) {
  const p = banco.pedidos[pedido.id];
  if (!p || p.status === 'cancelado') return;
  for (const i of p.itens) {
    const h = banco.hoje[i.produtoId];
    if (h) h.vendidos = Math.max(0, h.vendidos - i.qtd);
  }
  p.status = 'cancelado';
  gravar();
}
