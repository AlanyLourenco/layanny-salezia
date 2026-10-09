/* Utilidades compartilhadas entre o cardápio e o painel. Preços sempre em centavos. */

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const moeda = (centavos) => BRL.format((centavos || 0) / 100);

// "12,50" | "12.5" | "12" → 1250
export function paraCentavos(texto) {
  const n = parseFloat(String(texto).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}
export const centavosParaCampo = (c) => ((c || 0) / 100).toFixed(2).replace('.', ',');

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

// Código curto e fácil de falar no WhatsApp (sem 0/O/1/I)
export function codigoPedido() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => A[b % A.length]).join('');
}

export const soDigitos = (t) => String(t || '').replace(/\D/g, '');

// (63) 99999-9999
export function formatarFone(t) {
  let d = soDigitos(t);
  if (d.length > 11 && d.startsWith('55')) d = d.slice(2);
  d = d.slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
}

export function linkWhats(numero, texto) {
  let d = soDigitos(numero);
  if (d.length <= 11) d = '55' + d;
  return `https://wa.me/${d}?text=${encodeURIComponent(texto)}`;
}

// Reduz a foto para ocupar pouco no banco gratuito: lado maior 480px, WebP (~20–35 KB).
// Se o navegador não gerar WebP (Safari antigo), cai para JPEG.
export function comprimirFoto(arquivo, lado = 480, qualidade = 0.72) {
  return new Promise((ok, falha) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, lado / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      const webp = c.toDataURL('image/webp', qualidade);
      ok(webp.startsWith('data:image/webp') ? webp : c.toDataURL('image/jpeg', qualidade));
    };
    img.onerror = () => falha(new Error('Não consegui abrir essa imagem.'));
    img.src = URL.createObjectURL(arquivo);
  });
}

export function hora(data) {
  const d = data instanceof Date ? data : new Date(data);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function ehHoje(data) {
  const d = data instanceof Date ? data : new Date(data);
  return d.toDateString() === new Date().toDateString();
}

export const STATUS = {
  novo:       { rotulo: 'Recebido',          cliente: 'Recebemos seu pedido' },
  confirmado: { rotulo: 'Confirmado',        cliente: 'A Layanny confirmou seu pedido' },
  pronto:     { rotulo: 'Pronto',            cliente: 'Seu pedido está pronto' },
  saiu:       { rotulo: 'Saiu para entrega', cliente: 'Seu pedido saiu para entrega' },
  entregue:   { rotulo: 'Entregue',          cliente: 'Pedido entregue. Bom apetite!' },
  cancelado:  { rotulo: 'Cancelado',         cliente: 'Este pedido foi cancelado' },
};

// Ordem dos passos para cada tipo de recebimento
export const passos = (tipo) => tipo === 'entrega' ? ['novo', 'confirmado', 'saiu', 'entregue'] : ['novo', 'confirmado', 'pronto', 'entregue'];

export const PAGAMENTO = { pix: 'Pix agora', dinheiro: 'Dinheiro na entrega', cartao: 'Cartão na entrega', pixEntrega: 'Pix na entrega' };
// "na entrega" vira "na retirada" quando o cliente vai buscar
export const rotuloPagamento = (p) => {
  const t = PAGAMENTO[p.pagamento.forma] || '';
  return p.entrega.tipo === 'retirada' ? t.replace('na entrega', 'na retirada') : t;
};

// Mensagem do pedido para o WhatsApp
export function textoPedido(p) {
  const linhas = [
    `Olá, Layanny! 🧡 Acabei de fazer o pedido *#${p.codigo}*`,
    '',
    ...p.itens.map((i) => `• ${i.qtd}x ${i.nome} (${moeda(i.preco * i.qtd)})`),
    '',
    p.entrega.tipo === 'entrega'
      ? `🛵 Entrega grátis: ${p.entrega.endereco}, ${p.entrega.bairro}${p.entrega.complemento ? ` (${p.entrega.complemento})` : ''}`
      : '🛍️ Vou retirar',
    `💳 ${rotuloPagamento(p)}${p.pagamento.troco ? ` (troco para ${moeda(p.pagamento.troco)})` : ''}`,
    `*Total: ${moeda(p.total)}*`,
    p.obs ? `\n📝 ${p.obs}` : null,
    '',
    `Nome: ${p.cliente.nome}`,
  ];
  return linhas.filter((l) => l !== null).join('\n');
}
