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

## Catálogo de identidade visual (PDF)

Fica em `catalogo/`. O PDF pronto é `Catalogo-Identidade-Visual-Mary-Criativa.pdf`.

Para mudar textos, itens ou preços, edite `catalogo/catalogo-identidade-visual.html` (listas `PACOTES`, `CONTATO` e `PAGAMENTO` no fim do arquivo). Para a foto da Mary na página "Sobre mim", coloque `img/mary.jpg`. Depois abra o HTML no Chrome e use Imprimir > Salvar como PDF, com margens "Nenhuma" e "Gráficos de plano de fundo" marcado.

## Modelo de posts para o Canva

Fica em `posts/`. O arquivo `Modelo-Posts-Mary-Criativa.pptx` tem 6 páginas em 1080 x 1350 (feed do Instagram): capa com brasão, monograma/logotipo/paleta, estampas e elementos, aplicações, chamada final e post de promoção de pacote. As imagens em `posts/previas/` mostram como cada página fica.

No Canva: Criar design > Importar arquivo > escolha o `.pptx`. Os retângulos tracejados "SUA ARTE AQUI" marcam onde colocar cada arte. Para mudar o modelo de novo pelo código, edite `gerar_modelo.py` e rode `python3 gerar_modelo.py`.

## Catálogo de convites (página escura)

Fica em `convites/index.html` (abre em `/convites/`). Estilo catálogo: card de cada modelo com demonstração, valor e os botões "Ver demonstração", "Quero este modelo" e "Ver o que está incluso", mais comparação rápida, extras (confirmação de presença e álbum digital), como funciona a produção e rodapé.

Tudo se edita no fim do arquivo:

1. `CONFIG`: WhatsApp, Instagram, prazos, passo a passo e texto de urgência.
2. `MODELOS`: um bloco por convite (nome, descrição, tags, `preco`, `promo`, o que está incluso). Os modelos que estão lá são provisórios.
   - `imagem`: capa do card (ex.: `img/livro.jpg` dentro de `convites/`). Sem imagem aparece uma arte provisória.
   - `video`: vídeo `.mp4` da demonstração (abre no próprio site) ou `demo`: link do convite de exemplo. O botão "Ver demonstração" só aparece quando um dos dois está preenchido.
3. `EXTRAS`: serviços adicionais com preço.
