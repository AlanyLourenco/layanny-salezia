/* Implementação real: Firestore + Firebase Auth (via CDN, sem build).
   Coleções: produtos/{id}, hoje/{produtoId}, config/loja, pedidos/{id}. Regras em ../firestore.rules. */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore, collection, doc, onSnapshot, query, where, orderBy,
  runTransaction, writeBatch, setDoc, updateDoc, getDocs, serverTimestamp, Timestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { CONFIG } from './config.js';
import { SemEstoque, LOJA_PADRAO } from './modelo.js';

const app = initializeApp(CONFIG.firebase);
const db = getFirestore(app);
const auth = getAuth(app);

const ordenar = (lista) => lista.sort((a, b) => (a.ordem ?? 99) - (b.ordem ?? 99));
const comId = (d) => ({ id: d.id, ...d.data() });
// serverTimestamp fica nulo até o servidor confirmar: usa a hora local enquanto isso
const pedidoDe = (d) => { const p = comId(d); p.criadoEm = p.criadoEm?.toMillis?.() ?? Date.now(); return p; };
const falhou = (e) => console.error('[dados]', e);

export const ouvirLoja = (cb) => onSnapshot(doc(db, 'config', 'loja'), (d) => cb({ ...LOJA_PADRAO, ...d.data() }), falhou);
export const ouvirProdutos = (cb) => onSnapshot(collection(db, 'produtos'), (s) => cb(ordenar(s.docs.map(comId))), falhou);
export const ouvirHoje = (cb) => onSnapshot(collection(db, 'hoje'), (s) => cb(ordenar(s.docs.map((d) => ({ produtoId: d.id, ...d.data() })))), falhou);
export const ouvirPedido = (id, cb) => onSnapshot(doc(db, 'pedidos', id), (d) => cb(d.exists() ? pedidoDe(d) : null), () => cb(null));
export const ouvirPedidos = (cb) => {
  const desde = Timestamp.fromMillis(Date.now() - 3 * 864e5);
  return onSnapshot(query(collection(db, 'pedidos'), where('criadoEm', '>', desde), orderBy('criadoEm', 'desc')), (s) => cb(s.docs.map(pedidoDe)), falhou);
};

export async function criarPedido(pedido) {
  const ref = doc(collection(db, 'pedidos'));
  await runTransaction(db, async (t) => {
    const loja = await t.get(doc(db, 'config', 'loja'));
    if (!loja.data()?.aberta) throw new Error('A loja acabou de fechar para pedidos.');
    const refs = pedido.itens.map((i) => doc(db, 'hoje', i.produtoId));
    const atuais = await Promise.all(refs.map((r) => t.get(r)));
    const faltas = [];
    pedido.itens.forEach((i, k) => {
      const h = atuais[k].data();
      const resta = h ? h.qtd - h.vendidos : 0;
      if (i.qtd > resta) faltas.push({ produtoId: i.produtoId, nome: i.nome, resta });
    });
    if (faltas.length) throw new SemEstoque(faltas);
    pedido.itens.forEach((i, k) => t.update(refs[k], { vendidos: atuais[k].data().vendidos + i.qtd }));
    t.set(ref, { ...pedido, status: 'novo', pago: false, criadoEm: serverTimestamp() });
  });
  return { id: ref.id };
}

export const ouvirAuth = (cb) => onAuthStateChanged(auth, cb);
export const entrar = (email, senha) => signInWithEmailAndPassword(auth, email, senha);
export const sair = () => signOut(auth);

export async function salvarProduto(p) {
  const ref = p.id ? doc(db, 'produtos', p.id) : doc(collection(db, 'produtos'));
  const { id, ...dados } = p;
  await setDoc(ref, dados, { merge: true });
  return ref.id;
}
export async function apagarProduto(id) {
  const b = writeBatch(db);
  b.delete(doc(db, 'produtos', id));
  b.delete(doc(db, 'hoje', id));
  await b.commit();
}
export async function salvarHoje(lista, { zerar = false } = {}) {
  const atuais = await getDocs(collection(db, 'hoje'));
  const antes = Object.fromEntries(atuais.docs.map((d) => [d.id, d.data()]));
  const b = writeBatch(db);
  const ficam = new Set(lista.map((i) => i.produtoId));
  atuais.docs.forEach((d) => { if (!ficam.has(d.id)) b.delete(d.ref); });
  lista.forEach((item, ordem) => {
    const vendidos = zerar || !antes[item.produtoId] ? 0 : antes[item.produtoId].vendidos;
    b.set(doc(db, 'hoje', item.produtoId), { qtd: item.qtd, vendidos, ordem });
  });
  await b.commit();
}
export const salvarLoja = (cfg) => setDoc(doc(db, 'config', 'loja'), cfg, { merge: true });
export const atualizarPedido = (id, campos) => updateDoc(doc(db, 'pedidos', id), campos);
export async function cancelarPedido(pedido) {
  await runTransaction(db, async (t) => {
    const ref = doc(db, 'pedidos', pedido.id);
    const atual = await t.get(ref);
    if (!atual.exists() || atual.data().status === 'cancelado') return;
    const refs = atual.data().itens.map((i) => doc(db, 'hoje', i.produtoId));
    const hoje = await Promise.all(refs.map((r) => t.get(r)));
    atual.data().itens.forEach((i, k) => {
      if (hoje[k].exists()) t.update(refs[k], { vendidos: Math.max(0, hoje[k].data().vendidos - i.qtd) });
    });
    t.update(ref, { status: 'cancelado' });
  });
}

