# CLAUDE.md — Layanny Salezia Confeitaria

Responda e escreva textos sempre em **português do Brasil**.

## O projeto
Confeitaria artesanal da **Layanny Salezia** (antes "Brownie da Lalá", @brownie.da_lala), em Itacajá (TO).
Produção (identidade visual e site): **Alany Gabriely**. Os créditos aparecem em letras miúdas no rodapé do site. O projeto tem duas frentes:

| Pasta | O que é | Instruções |
|---|---|---|
| `identidade/` | Identidade visual e proposta de marca: logo, manual, paleta, peças de Instagram, motion, referências e vídeos brutos | `identidade/CLAUDE.md` |
| `app/` | Aplicação de pedidos: painel da Layanny e cardápio do cliente | seção abaixo |

**Fonte única da marca:** `identidade/tokens.css` e `identidade/brand.js`. O app nunca edita a cópia em `app/marca/`: ela é gerada com `npm run marca` (dentro de `app/`).

## Como trabalhar comigo
- Antes de criar várias peças ou telas, mostre **uma** primeiro e espere minha aprovação do estilo.
- Ao apresentar opções, explique em uma frase a ideia de cada uma.
- Quando eu aprovar algo, registre a decisão em "Decisões tomadas" do CLAUDE.md da frente certa.

## App de pedidos (`app/`)
Dois lados ligados pelo mesmo banco de dados:
1. **Painel da Layanny** (`app/painel/`): ela cadastra os produtos uma vez e, a cada dia, escolhe o que tem e em que quantidade. Também abre e fecha a loja, recebe e acompanha os pedidos, define o horário das entregas e configura retirada, entrega mínima e Pix.
2. **Cardápio do cliente** (`app/index.html`): mostra o que tem hoje e quanto resta. O cliente escolhe as quantidades, retirada ou entrega, e a forma de pagamento. Depois faz o pedido e acompanha o status.

### Decisões tomadas
- **Backend:** Firebase Firestore + Authentication (e-mail e senha), plano Spark gratuito. Sem Storage: as fotos são comprimidas (480px, WebP, ~20–35 KB) e guardadas no próprio documento. **Minimizar ocupação do banco** é requisito.
- **Hospedagem:** Vercel (plano Hobby, grátis), um projeto só com cliente em `/` e painel em `/painel/`. O Firebase serve só como banco (`npm run regras` publica as regras).
- **Pagamento:** Pix manual (o app mostra a chave e o valor, e a Layanny marca como pago) ou pagamento na entrega/retirada (dinheiro com troco, cartão ou Pix na hora).
- **Aviso de pedido:** o pedido cai no painel em tempo real, com som. Ao finalizar, o cliente envia a mensagem pronta para o WhatsApp da Layanny: **+55 63 99202-0224** (padrão em `LOJA_PADRAO.whatsapp`, editável em Ajustes).
- **Atende só Itacajá** (Palmas saiu).
- **Entrega grátis a partir de 2 unidades** (`entregaMinimo`, ajustável no painel). Abaixo disso, só retirada. Não há taxa nem lista de bairros.
- **Horário de início das entregas:** a Layanny define no painel, na aba Hoje (`entregaInicio`). O cliente vê no checkout e no acompanhamento.
- **Estoque:** ao fazer o pedido, uma transação reserva a quantidade. Se o pedido for cancelado, a quantidade volta.
- **Stack:** HTML, CSS e JS puros (módulos ES). Firebase via CDN, sem build.
- **Modo demonstração:** com `app/js/config.js` sem as chaves do Firebase, os dados ficam no `localStorage`. As abas do mesmo navegador se falam, o que permite testar painel e cliente lado a lado.

### Estado atual
- **Página do cliente v2 (aprovada em 08/10/2026):** estrutura inspirada nas referências em `identidade/refs/app-cliente/`, com cores e logo da marca. Telas: abertura com o logo "derramando", início (saudação, banner em arco e grade de produtos com "+"), ficha do produto, finalizar pedido (opções com ícones) e acompanhamento (etapas com ícones). Não copiar a estética das referências, só a estrutura.
- **Painel v2 (aprovado em 08/10/2026):** mesma linguagem da página do cliente. Tem login com o logo animado, banner com saudação, números do dia e interruptor da loja, e pedidos em cartões com miniaturas e ícones. A aba Hoje usa interruptores e o horário das entregas. Produtos aparecem em grade com editor em folha. Barra de abas rosa e créditos no rodapé de Ajustes.

### Comandos (dentro de `app/`)
- `npm run dev`: servidor local em http://localhost:5173 (cliente) e /painel/.
- `npm run marca`: copia tokens, brand.js, logo e fontes de `identidade/` para `app/marca/`.
- `npm run deploy`: publica na Vercel. `npm run regras`: publica as regras do Firestore.
- Passo a passo completo: `app/COMO-PUBLICAR.md`.
