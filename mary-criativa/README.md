# Mary Criativa

Site em estilo loja, nas cores rosa, dourado e lilás. Tudo está em `index.html` (HTML, CSS e JS juntos).

- Menu igual ao de loja: Tema da festa, Escolha o evento, Tipos de convite e Outras artes (sanfona no celular, menu suspenso no computador).
- Busca, página para cada tema, evento e produto.
- Carrinho de orçamento: a cliente adiciona as peças e envia a lista pronta para o WhatsApp da Mary.

## Como personalizar

1. **Contato**: no fim do `index.html`, procure `CONFIG` e coloque o WhatsApp e o Instagram reais. Ali também fica o texto da faixa do topo (pode virar um cupom).
2. **Fotos** (pasta `img/`). Enquanto a foto não existir, aparece um desenho da peça no lugar.
   - `img/mary-banner.png`: foto da Mary para o banner do topo (de preferência PNG sem fundo)
   - `img/mary.jpg`: foto da Mary na seção Sobre
   - `img/catalogo/<produto>-<tema>.jpg` (ex.: `convite-interativo-jardim.jpg`) ou só `img/catalogo/<produto>.jpg` para usar em todos os temas
3. **Produtos e preços**: lista `PRODUTOS`. Preencha `preco` (ex.: `preco: "80"`). Vazio mostra "Consultar valor".
4. **Temas e eventos**: listas `TEMAS` e `EVENTOS`. Para um tema novo, copie um bloco e troque o `id`, o nome e as cores.
5. **Textos**: edite direto no `index.html`.

## Como publicar de graça

- Arraste a pasta `mary-criativa` no https://app.netlify.com/drop
- Ou GitHub Pages: Settings > Pages > Branch > salvar (o site fica em `/mary-criativa/`).
