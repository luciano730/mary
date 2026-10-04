# Landing Pages | Mary Criativa

Catálogo em vinho e dourado dos serviços de criação de landing pages para negócios. Tudo está em `index.html`.

## Como personalizar

1. **Contato**: no fim do `index.html`, em `CONFIG` (WhatsApp e Instagram).
2. **Planos e preços**: lista `PLANOS`. Com `preco: ""` aparece "Valor sob consulta". Para mostrar o preço, coloque só o número (ex.: `preco: "890"`).
3. **Projetos**: lista `PROJETOS` no `index.html`. As páginas de amostra ficam na pasta `amostras/` (clínica de estética, advocacia, arquitetura e nutricionista), cada uma com seu próprio `index`, cores e fontes. Os prints usados nos cards ficam em `img/<id>-desktop.jpg` e `img/<id>-mobile.jpg`. Para colocar uma página nova, salve o HTML em `amostras/`, tire os dois prints e adicione uma linha em `PROJETOS`.
   O WhatsApp de cada amostra está no `<body data-wa="...">` dela.
4. **Segmentos da faixa dourada**: lista `SEGMENTOS`.
5. **O que inclui / Como funciona**: listas `INCLUSO` e `PASSOS`.

## Como publicar

- Arraste a pasta `landing-pages` no https://app.netlify.com/drop
