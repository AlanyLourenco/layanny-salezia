# Como publicar o app de pedidos (grátis)

- **Site** (cliente + painel): Vercel, plano Hobby, grátis.
- **Banco de dados:** Firebase Firestore, plano Spark, grátis e sem cartão.

Enquanto `js/config.js` estiver sem as chaves, o app roda em **modo demonstração**, com os dados só no navegador.

## 1. Banco de dados (Firebase)
1. Entre em https://console.firebase.google.com com a conta Google da Layanny e clique em **Adicionar projeto** (`layanny-salezia`). Pode desligar o Analytics.
2. Em **Firestore Database**, clique em **Criar banco de dados**, escolha a região `southamerica-east1` (São Paulo) e o **modo de produção**.
3. Em **Authentication**, clique em **Vamos começar** e ative **E-mail/senha**. Depois, em **Usuários**, use **Adicionar usuário** com o e-mail e a senha do painel.
4. Em **Configurações do projeto → Seus apps → Web `</>`**, copie o `firebaseConfig` para `js/config.js`.
5. Em `firestore.rules`, troque `TROCAR-PELO-EMAIL@DA-LAYANNY.com` pelo e-mail do passo 3.
6. Publique as regras (dentro de `app/`):
   ```
   npm install -g firebase-tools
   firebase login
   firebase use --add        # escolha o projeto
   npm run regras
   ```

## 2. Site (Vercel)
```
npm install -g vercel
vercel login
npm run deploy            # copia a marca e publica em produção
```
Na primeira vez, a Vercel faz algumas perguntas: o projeto é novo, a pasta é `./`, e não há comando de build. O endereço sai no final, algo como `https://layanny-salezia.vercel.app`.
- **Cliente** (vai no link da bio): `https://layanny-salezia.vercel.app/`
- **Painel:** `https://layanny-salezia.vercel.app/painel/` (no celular dela, use "Adicionar à tela inicial")

Também dá para ligar a pasta a um repositório no GitHub e publicar a cada `git push`. Nesse caso, a pasta `marca/` precisa ir junto: rode `npm run marca` antes do commit.

## 3. Primeiro uso (no painel)
1. **Ajustes:** WhatsApp (já vem com o da Layanny), chave Pix, onde retirar e a partir de quantas unidades a entrega é grátis (padrão: 2).
2. **Produtos:** cadastre cada doce com foto, preço e descrição.
3. **Hoje:** marque o que tem e as quantidades, preencha **Pedidos até** e **Entregas a partir de**, e toque em **Salvar o dia**.
4. Ligue o interruptor **Aberta** no topo.
5. Em **Pedidos**, toque em **Ativar som**.

## Quanto ocupa no banco grátis
O plano Spark dá 1 GB de espaço e 50 mil leituras por dia.
- **Foto de produto:** fica entre 20 e 35 KB, porque o app reduz para 480 px. Com 30 produtos, dá cerca de 1 MB.
- **Pedido:** cerca de 0,5 KB. Mil pedidos ocupam cerca de 0,5 MB.
- **Visita de cliente:** gasta cerca de 1 leitura por produto cadastrado, mais 2. Dá folga para milhares de visitas por dia.
