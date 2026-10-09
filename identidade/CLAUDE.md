# CLAUDE.md — Identidade visual (pasta `identidade/`)

> Tudo aqui vale para a pasta `identidade/`. Os comandos `npm run ...` rodam de dentro dela. A visão geral do projeto está em `../CLAUDE.md`.

## Sobre o projeto
Este projeto cria a **nova identidade visual** de uma confeitaria artesanal que hoje se chama **Brownie da Lalá** (Instagram @brownie.da_lala). Ela atende **só Itacajá**, no Tocantins (Palmas saiu em 08/10/2026).

O rebranding troca a marca pelo **nome da própria confeiteira, Layanny Salezia**, seguindo o modelo de marca pessoal em que a pessoa é a marca.

Todo o trabalho é feito com **HTML, CSS, JavaScript e SVG**, com motion design no navegador. O resultado precisa ser exportável como imagem (PNG) e vídeo (MP4) para usar no Instagram.

Responda e escreva textos sempre em **português do Brasil**.

## Situação atual da marca
- **Seguidores:** 26,2 mil, com apenas 117 posts. O engajamento é alto, então o produto já vende bem.
- **Bio atual:** "Brownies artesanais que derretem na boca 🧡", "Por: @salezia.layanny", "Itacajá - TO / Palmas - TO", "Parcerias via direct".
- **Produtos:** brownie (carro-chefe), torta cookie, banoffee e brownies temáticos para datas comemorativas.
- **Pontos fracos de hoje:**
  - fotos escuras em bancada de granito
  - a confeiteira quase não aparece nos posts
  - a bio não tem link nem diz como pedir
  - os destaques mostram só produtos
  - não há padrão visual na grade
- **O que deve continuar:**
  - a promessa "derrete na boca"
  - o 🧡 como assinatura
  - o tom próximo e afetivo
  - "Lalá" como apelido carinhoso, que pode virar o nome da linha de brownies ("Brownie da Lalá by Layanny Salezia")

## Objetivo do rebranding
Crescer em duas frentes ao mesmo tempo:
1. **Delivery e encomendas:** vender mais brownies e doces.
2. **Criadora de conteúdo:** fechar parcerias com marcas, ganhar com afiliados e, no futuro, lançar um e-book ou curso de brownies.

A identidade precisa funcionar para uma **pessoa** (rosto, rotina, autoridade), não só para uma loja.

## Nome
- **Base decidida:** "Layanny Salezia". O sobrenome é raro, o que deixa a marca única e fácil de achar na busca.
- **Complemento ainda não decidido.** Crie as peças de forma que o complemento seja fácil de trocar (uma variável única). As opções em avaliação são:
  - Layanny Salezia Brownies
  - Layanny Salezia | Confeiteira
  - Ateliê Layanny Salezia
  - Layanny Salezia Doces Artesanais
- **Monograma:** **LS**.

## Referência (inspiração, NÃO cópia)
A referência é o perfil @jadebraga_doceria, de Governador Valadares (MG), com 173 mil seguidores. Dele, aproveitar a **estratégia**:
- rosto em quase todos os posts e uniforme fixo
- cozinha clara e bem iluminada, sempre igual
- reels com texto de gancho contando a rotina
- destaques estratégicos
- bio com chamada para ação e link

**Não copiar a estética dela.** Fica proibido:
- usar o emoji 🩷
- usar frases ou slogans dela
- fazer layouts que pareçam "uma versão dela"

## Direção de identidade visual

### Conceito
Chocolate quente e derretido, feito à mão, afetivo, mas com acabamento profissional. A palavra-chave é **"derrete"**.

### Paleta (ponto de partida, pode ser refinada)
```css
:root {
  --chocolate:   #3B2218; /* principal, textos e logo */
  --cacau:       #5A3426; /* apoio */
  --caramelo:    #E27A3F; /* destaque, ligado ao 🧡 */
  --caramelo-claro: #F4B184;
  --creme:       #F7EDE0; /* fundo principal */
  --off-white:   #FFFAF4;
  --rosa:        #E0336F; /* rosa forte: destaque e doce do logo (decisão da cliente) */
  --dourado:     #C99A5B; /* detalhes finos, selos */
}
```
Fundo claro (creme) é o padrão. Use o modo escuro (chocolate) só em peças de impacto.

### Tipografia (Google Fonts, testar combinações)
- **Assinatura/logo:** uma fonte cursiva com personalidade (ex.: Allura, Great Vibes, Dancing Script, Parisienne). O ideal depois é vetorizar e ajustar à mão no SVG.
- **Títulos:** uma serifada moderna e calorosa (ex.: Fraunces, Playfair Display, DM Serif Display).
- **Textos, preços e cardápio:** uma sem serifa limpa (ex.: DM Sans, Poppins, Montserrat).

### Logo (entregar em SVG)
**Decidido:** o logo é o monograma LS da cliente (`refs/adc443d5-96e6-40c6-8941-a84d620997eb.jpg`), vetorizado sem alterar letras nem arco. A única mudança é trocar a **borboleta por um doce**, desenhado no mesmo traço fino e orgânico (linha única, curvas soltas, sem cara de ícone). Os dados ficam em `logo/ls-monograma.js` e o desenho é feito por `LOGOS.ls` em `brand.js`. As propostas antigas (monograma em Fraunces, assinatura e selo) foram **rejeitadas**.

Itens originais do briefing (anteriores à decisão):
1. **Versão principal:** "Layanny Salezia" em lettering cursivo, com um **detalhe de chocolate escorrendo** (drip) saindo de uma letra.
2. **Versão reduzida:** só "Layanny" ou o monograma **LS**, para a foto de perfil e ícones.
3. **Selo redondo:** monograma com o texto circular "doces artesanais • Tocantins", para adesivos de embalagem e sacola kraft.
4. **Variações de cor:** chocolate sobre creme, creme sobre chocolate e versão monocromática.

Sempre que eu pedir logo, gere **2 ou 3 propostas diferentes** lado a lado para eu comparar.

## Entregáveis (em ordem de prioridade)
1. **Propostas de logo** (SVG) e uma página de comparação.
2. **Manual da marca** em uma página HTML: logo, usos certos e errados, paleta com códigos, tipografia, exemplos de aplicação.
3. **Foto de perfil:** moldura e fundo na paleta (1080×1080, o recorte é circular).
4. **Capas de destaques** (1080×1920, ícone centralizado em área segura circular). Destaques:
   - Cardápio
   - Como pedir
   - Clientes
   - Bastidores
   - Parcerias
5. **Templates de post de feed** (1080×1350):
   - produto
   - lançamento
   - feedback de cliente
   - dica/ensina
   - frase
6. **Template de capa de reels** (1080×1920, com área segura para o recorte 4:5 da grade).
7. **Templates de stories:** cardápio, pronta entrega, caixinha de perguntas.
8. **Motion:**
   - animação do logo (chocolate escorrendo e assinatura sendo "escrita", 3 a 5 segundos)
   - vinheta de abertura e de fim para reels
   - transições simples
9. **Mockups de aplicação:** adesivo, sacola kraft, caixa de brownie, avental.
10. **Mídia kit** em uma página HTML para enviar a marcas.

## Stack e regras técnicas
- HTML, CSS e JavaScript puros, sem framework, a menos que eu peça.
- Cores, fontes e o nome da marca centralizados em **variáveis CSS** (`tokens.css`) e em um `brand.js`. Trocar o nome ou a cor em um lugar deve atualizar todas as peças.
- **Animação:** CSS animations e SVG (stroke-dasharray para o efeito de escrita). Use GSAP via CDN quando precisar de timeline mais complexa.
- **Exportação:**
  - PNG: usar Playwright ou Puppeteer para tirar screenshot de cada peça no tamanho exato.
  - MP4: capturar frames com Playwright e montar o vídeo com ffmpeg (30 fps, H.264, 1080×1920).
  - Criar scripts `npm run export:png` e `npm run export:video`.
- Cada peça é um arquivo HTML próprio, com o tamanho fixo correto no `body`.
- Fontes carregadas do Google Fonts. Antes de exportar, esperar `document.fonts.ready`.
- Não usar imagens de terceiros nem bancos de imagens sem eu pedir. Para fotos de produto, deixar espaços marcados como `[FOTO]` onde vou colocar fotos reais.

## Estrutura de pastas sugerida
```
/
├── CLAUDE.md
├── tokens.css          # cores, fontes, espaçamentos
├── brand.js            # nome da marca, complemento, @, textos fixos
├── logo/               # propostas e versões finais em SVG
├── manual/             # manual da marca (index.html)
├── instagram/
│   ├── perfil/
│   ├── destaques/
│   ├── feed/
│   ├── reels/
│   └── stories/
├── motion/             # animações do logo e vinhetas
├── mockups/
├── midia-kit/
├── scripts/            # exportação PNG e MP4
└── export/             # arquivos finais gerados (não editar à mão)
```

## Textos de apoio
Bio sugerida (ajustar quando o nome final for decidido):
```
Layanny Salezia | Confeiteira
Brownies artesanais que derretem na boca 🧡
🎥 Rotina de uma confeiteira empreendedora
📍 Itacajá - TO
📩 Parcerias via direct
👇 Peça o seu aqui
```

Pilares de conteúdo, para orientar os templates:
- **40% Vende:** produto, pedidos, lançamentos, datas sazonais
- **30% Conecta:** rosto, rotina, conquistas, humor
- **20% Ensina:** corte, embalagem, precificação, dicas
- **10% Prova:** feedbacks, entregas, números

## Como trabalhar comigo
- Antes de criar várias peças, mostre **uma** primeiro e espere minha aprovação do estilo.
- Ao apresentar opções, explique em uma frase a ideia de cada uma.
- Tudo precisa ficar legível no **celular**: texto mínimo de cerca de 40px nas peças de 1080px e bom contraste.
- Quando eu aprovar algo, registre a decisão na seção "Decisões tomadas" abaixo.

## Decisões tomadas
- **Identidade visual v2 aprovada em 08/10/2026** (detalhes abaixo, em "Identidade v2"). Ela substitui as decisões de paleta, fontes e logo da v1 listadas nesta seção, que ficam só como histórico.
- Marca pessoal com o nome **Layanny Salezia**. Complemento atual: **Confeitaria** ("Layanny Salezia Confeitaria"), definido em `brand.js` (`complemento`).
- Paleta quente (chocolate, caramelo, creme) **com um rosa forte** (`--rosa` #E0336F), pedido da cliente. Continua proibido o 🩷 e copiar frases ou layouts da Jade Braga.
- Manter o 🧡 como assinatura.
- Fontes: **Allura** (assinatura), **Fraunces Soft** (títulos), **DM Sans** (texto). O monograma usa uma instância fixa da Fraunces (`fonts/fraunces-monograma*.woff2`, família `LS Monograma`), porque dentro de SVG o Chrome ignora o eixo `opsz` e a letra perde o alto contraste.
- **Logo oficial:** monograma LS da cliente com um doce no lugar da borboleta (ver seção Logo). Doce ainda em escolha: cupcake, brigadeiro ou brownie (`BRAND.doce` em `brand.js`); comparação em `logo/monograma.html`.
- Regra da gota (só valia para as propostas rejeitadas): nas propostas A e B a calda/gota é **caramelo**; no selo (C) a calda é da cor do anel (chocolate escorrendo).
- Cor `--caramelo-texto` (#A94F1F) para palavras em caramelo sobre creme; o caramelo puro (#E27A3F) não passa em contraste como texto.

## Identidade v2 (aprovada em 08/10/2026)
Feita a partir das novas referências: logo dourado com brownie, paleta creme, areia e rosa antigo, e estilo "Belmont". Cor principal: rosa queimado.
- **Logo v2:** `refs/Orçamento brownie - Sophia.png` (monograma LS dourado com brownie) vetorizado por `npm run vetorizar` (`scripts/vetorizar-logo.py`, potracer) em `logo/ls-logo.js`. Gerado em `brand.js`: `LOGOS.oficial`, `vertical`, `horizontal`, `nome`, `seloV2`, `brownie`. Cores por classe: `logo--ouro`, `logo--ouro-creme`, `logo--bordo`, `logo--creme`, `logo--rosa`, `logo--mono`.
- **Paleta v2** em `tokens.css`: creme #EEE4DA, areia #D8C4AC, rosa antigo #C8A49F, bordô #4D0E13, dourado #B5832A (+ rosa queimado #A04C57 no lugar do vinho, off-white, dourado claro, dourado-texto). Substitui o rosa forte #E0336F (fica só nas páginas antigas).
- **Cor principal = rosa queimado #A04C57** (pedido da Layanny, no lugar do bordô). Tokens de papel em `tokens.css`: `--principal`, `--principal-claro` (#BA6470), `--principal-escuro` (#6E2833); trocar a cor principal é mudar só essas três linhas. O bordô virou apoio: sombras e texto sobre rosa antigo e areia (o rosa queimado não tem contraste nesses fundos). Classe de logo `logo--principal`; `logo--bordo` continua existindo.
- **Fontes v2:** Gilda Display (títulos, só peso 400, sem itálico), Pinyon Script (assinatura), DM Sans (texto). Cormorant foi testada e descartada: acentos altos demais em português.
- **Motion v2:** `motion/logo-motion.js` (roteiros `oficial`, `vertical`, `horizontal`, `nome`, `selo2`): o ouro "derrama" com máscara de gotas, o brownie cai e assenta, reflexo no foil.
- `manual/index.html`: manual v2 completo (o antigo está em `manual/v1.html`).
- `motion/vinheta.html` → `npm run export:video` gera `export/vinheta-logo.mp4` (1080×1920, 30 fps).
- `npm run export:png` gera `export/instagram/foto-perfil.png` e `export/logo/monograma-{ouro,bordo,creme,preto}.{svg,png}`.
- Templates de Instagram existem só como prévia dentro do manual; falta virar arquivos 1080 próprios após aprovação.
- `logo/index.html` e `logo/monograma.html`: histórico (v1).
- `npm run shot -- <arquivo.html> <saida.png> [largura] [altura] [--full]` tira screenshot com o Chrome instalado.
