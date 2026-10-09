/* Tipos compartilhados pelas duas implementações de dados (fica separado para evitar import circular). */

// Erro de estoque, com a lista do que faltou: [{ produtoId, nome, resta }]
export class SemEstoque extends Error {
  constructor(faltas) {
    super('Alguns itens acabaram enquanto você escolhia.');
    this.faltas = faltas;
  }
}

// Configuração da loja (documento config/loja). Atende só Itacajá.
export const LOJA_PADRAO = {
  aberta: false,
  ate: '18:00',            // pedidos até
  entregaInicio: '',       // a Layanny define a cada dia (aba Hoje)
  entregaMinimo: 2,        // entrega grátis a partir de N unidades; abaixo disso, só retirada
  aviso: '',
  whatsapp: '5563992020224',
  retirada: '',            // onde retirar
  pix: { chave: '', titular: '' },
};

export const CIDADE = 'Itacajá';
