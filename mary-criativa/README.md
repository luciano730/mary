# Mary Criativa

Site em estilo catálogo, roxo com rosinha. Tudo está em `index.html` (HTML, CSS e JS juntos).

Início com convites em destaque (o envelope abre ao tocar), catálogos por ocasião (aniversário, casamento, 15 anos, chá de bebê e batizado) e uma página para cada ocasião, com abas (convites, identidade visual, cardápios e placas, decoração) e botões de preço que abrem o WhatsApp com a mensagem pronta.

## Como personalizar

1. **Contato**: no fim do `index.html`, procure `CONFIG` e coloque o WhatsApp e o Instagram reais.
2. **Fotos** (JPG, na pasta `img/`). Enquanto a foto não existir, aparece um desenho da peça no lugar.
   - `img/mary.jpg`: foto da Mary na seção Sobre
   - `img/catalogo/<ocasiao>-<produto>.jpg`: foto de cada produto em cada ocasião (ex.: `aniversario-convite-interativo.jpg`)
3. **Preços e produtos**: na lista `PRODUTOS`, preencha `precos` (ex.: `pronto: "80", personalizado: "90"`). Vazio mostra só o nome do botão.
4. **Ocasiões**: na lista `OCASIOES` dá pra mudar títulos, cores e os nomes de exemplo que aparecem nos desenhos.
5. **Textos**: edite direto no `index.html`.

## Como publicar de graça

- Arraste a pasta `mary-criativa` no https://app.netlify.com/drop
- Ou GitHub Pages: Settings > Pages > Branch > salvar (o site fica em `/mary-criativa/`).
