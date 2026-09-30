# Mary Criativa

Site de uma página em estilo catálogo, com animações ao rolar a tela. Tudo está em `index.html` (HTML, CSS e JS juntos). Paleta branco, rosa e rosé.

Seções: início, serviços, catálogo com filtros (clique abre os detalhes), pacotes, como funciona, sobre a Mary e contato. Todos os botões levam ao WhatsApp com uma mensagem pronta.

## Como personalizar

1. **Contato**: no fim do `index.html`, procure `CONFIG` e coloque o WhatsApp e o Instagram reais.
2. **Fotos** (JPG, na pasta `img/`). Enquanto a foto não existir, aparece um desenho da peça no lugar.
   - `img/hero.jpg`: foto grande do topo (aparece dentro do arco)
   - `img/mary.jpg`: foto da Mary na seção Sobre
   - `img/catalogo/<id>.jpg`: foto de cada peça do catálogo. O `id` está na lista `CATALOGO` (ex.: `convite-jardim.jpg`)
3. **Catálogo**: na lista `CATALOGO` dá pra mudar título, texto, categoria e itens. Para uma peça nova, copie um bloco e troque o `id`.
4. **Serviços e pacotes**: listas `SERVICOS` e `PACOTES`, logo acima.
5. **Textos**: edite direto no `index.html`.

## Como publicar de graça

- Arraste a pasta `mary-criativa` no https://app.netlify.com/drop
- Ou GitHub Pages: Settings > Pages > Branch > salvar (o site fica em `/mary-criativa/`).
