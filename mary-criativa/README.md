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

## Estúdio de Convites (app)

Fica em `estudio/` (abre em `/estudio/`). É o app para a Mary criar convites digitais e entregar para as clientes. Funciona no computador e no celular, e dá para instalar na tela inicial (no Chrome: menu > Instalar app; no iPhone: Compartilhar > Adicionar à Tela de Início).

- **Painel** (`estudio/index.html`): saudação, Minha marca (nome e logo no rodapé dos convites), modelos de convite e projetos com status (Rascunho, Aguardando aprovação, Aprovado, Entregue).
- **Editor** (`estudio/editor.html`): dados, cor, idioma (português, inglês ou espanhol), mídias de cada modelo, abertura e efeitos (contagem regressiva, efeito ao tocar, senha, marca d'água de prévia) e botões. O celular de prévia ao lado atualiza na hora, tem zoom e salva sozinho.
- **Convite** (`estudio/convite.html`): o que o convidado vê. Um motor só para todos os modelos.

### Modelos

- **Cinematográfico**: abertura, vídeo em tela cheia com som e depois o convite. O vídeo pode parar no último quadro com os botões por cima.
- **Interativo**: uma arte em tela cheia com áreas de toque em cima dos desenhos.
- **Livrinho**: até 15 páginas (imagem, GIF ou vídeo, no máximo 6 vídeos) que viram como livro. Os cartões de página se arrastam para mudar a ordem. Sem capa, a primeira página vira a capa.
- **Revelação**: raspadinha que revela a imagem surpresa, com confete.
- **Quebra-cabeça**: de 2 x 2 a 5 x 5 peças, o convidado troca as peças de lugar.
- **Lista de presentes**: um presente por linha (`nome | preço | link`), com botão de comprar e aviso pelo WhatsApp.
- **Mural de recados**: em breve, precisa do servidor.

### Botões

Cada botão (confirmar presença, localização, WhatsApp, sugestão de presente, lista, Pix, dress code, informações, manual, galeria, agenda, rever vídeo, ver convite ou personalizado) pode:

- mostrar o conteúdo padrão, **mostrar uma imagem** enviada ou **abrir um link externo**;
- ficar na lista do convite ou ser **posicionado** na abertura, no vídeo, na arte, no livrinho, na raspadinha, no quebra-cabeça ou no topo do convite. No modo "Posicionar botões" da prévia, os botões aparecem com contorno tracejado para arrastar e redimensionar. No vídeo, os botões "Início do vídeo" e "Final do vídeo" ajudam a encaixar no quadro certo;
- ter estilo na cor do convite, claro, transparente ou **invisível** (só a área de toque, por cima de um botão desenhado na arte);
- aparecer o tempo todo ou só no final (fim do vídeo, última página, depois de raspar ou de montar).

Dá para adicionar quantos botões quiser (Localização 2, WhatsApp 2 etc.).

### Como entregar um convite

1. No editor, clique em **Exportar**. Baixa um `.zip` com o convite (`index.html`), a pasta `midia/` e a imagem do link.
2. Descompacte e arraste a pasta no https://app.netlify.com/drop.
3. Mande o link para a cliente.
4. Para a imagem aparecer quando o link for enviado no WhatsApp, cole o link final em **Endereço do convite** (Passo 5) e exporte de novo.

Para mandar para aprovação antes do pagamento, ligue a **Marca d'água de prévia**. Quando a cliente pagar, desligue e exporte de novo.

### Importante

- Os projetos ficam salvos **no navegador do aparelho** onde foram criados. Limpar os dados do navegador apaga os projetos, então exporte os convites prontos.
- O estúdio precisa abrir por um endereço `http`/`https` (GitHub Pages, Netlify ou, no computador, `python3 -m http.server` dentro da pasta `estudio`). Abrindo o arquivo direto (duplo clique), a exportação não funciona.
- Vídeo: MP4 na vertical (9:16), de preferência até uns 20 MB para o link abrir rápido no 4G.

### Próximos passos (para vender assinatura)

Para outras pessoas usarem com login, link online direto (sem exportar), lista de confirmações dentro do app, mural de recados, votação e contador de carinhos, o estúdio precisa de um servidor (por exemplo Supabase). O código já está preparado: tudo que salva e lê dados passa pelo arquivo `estudio/js/store.js`, que é o único que muda.
