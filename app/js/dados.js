/* Camada de dados: o resto do app só conversa com este arquivo.
   Escolhe o Firebase (produção) ou o modo demonstração (localStorage), com a mesma API:

   Leitura em tempo real (todas devolvem a função para parar de ouvir):
     ouvirLoja(cb)        → { aberta, ate, aviso, whatsapp, pix: { chave, titular }, cidades: [{ nome, retirada, bairros: [{ nome, taxa }] }] }
     ouvirProdutos(cb)    → [{ id, nome, descricao, preco, foto, ativo, ordem }]
     ouvirHoje(cb)        → [{ produtoId, qtd, vendidos, ordem }]
     ouvirPedido(id, cb)  → pedido | null
     ouvirPedidos(cb)     → pedidos dos últimos 3 dias (só painel)
   Escrita do cliente:
     criarPedido(pedido)  → { id }   (reserva o estoque numa transação; lança erro se acabou)
   Escrita do painel (exige login):
     entrar(email, senha), sair(), ouvirAuth(cb)
     salvarProduto(p), apagarProduto(id), salvarHoje(lista, { zerar }), salvarLoja(cfg)
     atualizarPedido(id, campos), cancelarPedido(pedido)
*/
import { MODO_DEMO } from './config.js';
export { SemEstoque, LOJA_PADRAO } from './modelo.js';

const impl = MODO_DEMO ? await import('./dados-demo.js') : await import('./dados-firebase.js');

export const {
  ouvirLoja, ouvirProdutos, ouvirHoje, ouvirPedido, ouvirPedidos,
  criarPedido,
  entrar, sair, ouvirAuth,
  salvarProduto, apagarProduto, salvarHoje, salvarLoja,
  atualizarPedido, cancelarPedido,
} = impl;

export { MODO_DEMO };
