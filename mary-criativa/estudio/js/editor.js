/* Editor de convites (todos os modelos). Salva sozinho e atualiza o celular de prévia. */
(function () {
  "use strict";
  const S = window.Store;
  const UI = window.UI;
  const ic = S.icone;
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  /* Limites por arquivo. Arquivos leves deixam o convite abrindo rápido no 4G. */
  const LIMITES = {
    imagem: { aceita: "image/", mb: 15, nome: "imagem", icone: "image" },
    video: { aceita: "video/", mb: 80, nome: "vídeo", icone: "film" },
    audio: { aceita: "audio/", mb: 20, nome: "música", icone: "music" }
  };
  const SLOTS = {
    capa: { tipo: "imagem" }, abertura: { tipo: "imagem" }, video: { tipo: "video" }, musica: { tipo: "audio" },
    arte: { tipo: "imagem" }, revelada: { tipo: "imagem" }, quebra: { tipo: "imagem" }, compartilhar: { tipo: "imagem" },
    galeria: { tipo: "imagem", multi: true }, paginas: { tipo: "imagem", multi: true, livro: true }
  };
  const RECOMENDADO_MB = 40;
  const LIVRO = { maxPaginas: 15, maxVideos: 6, videoMb: 40 };

  /* Campos de cada tipo de botão quando a ação é "Padrão". */
  const CAMPOS_BOTAO = {
    rsvp: [
      { c: "whatsapp", l: "WhatsApp que recebe as confirmações", ph: "(65) 99999-9999", t: "tel" },
      { c: "prazo", l: "Confirmar até (opcional)", t: "date" },
      { c: "acompanhantes", l: "Perguntar quantos adultos e crianças", t: "check" }
    ],
    local: [
      { c: "nome", l: "Nome do local", ph: "Ex.: Espaço Jardim das Flores" },
      { c: "endereco", l: "Endereço completo", ph: "Rua, número, bairro, cidade", t: "area" },
      { c: "mapa", l: "Link do Google Maps (opcional)", ph: "https://maps.app.goo.gl/..." }
    ],
    whatsapp: [
      { c: "numero", l: "Número do WhatsApp", ph: "(65) 99999-9999", t: "tel" },
      { c: "mensagem", l: "Mensagem pronta (opcional)", ph: "Oi! Vim pelo convite da Giovanna.", t: "area" }
    ],
    presentes: [
      { c: "texto", l: "Mensagem", ph: "Ex.: Sua presença é o melhor presente! Se quiser me presentear...", t: "area" },
      { c: "link", l: "Link da lista de presentes (opcional)", ph: "https://..." }
    ],
    lista: [
      { c: "itens", l: "Presentes, um por linha: nome | preço | link", ph: "Jogo de toalhas | 120 | https://loja.com/toalhas\nAparelho de jantar | 350\nCafeteira | 280 | https://...", t: "area" },
      { c: "whatsapp", l: "WhatsApp para avisar quem vai dar cada presente (opcional)", ph: "(65) 99999-9999", t: "tel" }
    ],
    pix: [
      { c: "chave", l: "Chave Pix", ph: "CPF, celular, e-mail ou chave aleatória" },
      { c: "nome", l: "Nome de quem recebe", ph: "Ex.: Ana Paula Souza" },
      { c: "texto", l: "Mensagem (opcional)", t: "area" }
    ],
    dresscode: [{ c: "texto", l: "Traje", ph: "Ex.: Esporte fino. Evite branco.", t: "area" }],
    info: [{ c: "texto", l: "Informações", ph: "Ex.: Haverá estacionamento no local.", t: "area" }],
    manual: [{ c: "itens", l: "Uma regra por linha", ph: "Chegue no horário\nDance muito\nNão use branco", t: "area" }],
    galeria: [{ slot: "galeria", l: "Fotos da galeria" }],
    agenda: [{ nota: "Usa a data e o horário do Passo 1." }],
    rever: [{ nota: "Toca o vídeo de novo, com som." }],
    convite: [{ nota: "Leva para a tela com as informações. Fica ótimo em cima do vídeo ou da arte." }]
  };
  const ONDE = {
    abertura: "Na abertura (sobre a capa)", video: "No vídeo", arte: "Na arte", livro: "No livrinho",
    revelacao: "Na raspadinha", quebra: "No quebra-cabeça", convite: "No topo do convite (sobre a capa)"
  };
  const ESTILOS = [["visivel", "Cor do convite"], ["claro", "Claro"], ["vidro", "Transparente"], ["invisivel", "Invisível (só área de toque)"]];

  let P = null;
  let marca = null;
  let previaPronta = false;
  let telaPrevia = "abertura";
  let posicionando = false;
  let zoom = 1;
  let botaoAberto = null;

  const pegar = (o, caminho) => caminho.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
  function definir(o, caminho, valor) {
    const partes = caminho.split(".");
    const ultimo = partes.pop();
    partes.reduce((a, k) => a[k], o)[ultimo] = valor;
  }
  const botao = id => P.botoes.find(b => b.id === id);
  const telasDoTipo = () => S.TIPOS[P.tipo].telas;

  /* =========================================================
     Salvar e prévia
     ========================================================= */
  let timerSalvar = null;
  function agendarSalvar() {
    $("#salvo").textContent = "Salvando...";
    $("#salvo").classList.add("salvando");
    clearTimeout(timerSalvar);
    timerSalvar = setTimeout(salvarAgora, 450);
    atualizarTopo();
    atualizarPendencias();
    enviarPrevia();
  }
  async function salvarAgora() {
    clearTimeout(timerSalvar);
    timerSalvar = null;
    try {
      await S.salvarProjeto(P);
      $("#salvo").textContent = "Salvo";
      $("#salvo").classList.remove("salvando");
    } catch (e) {
      console.error(e);
      $("#salvo").textContent = "Erro ao salvar";
      UI.toast("Não consegui salvar. Veja se o aparelho tem espaço livre.", true);
    }
  }
  window.addEventListener("beforeunload", () => { if (timerSalvar) salvarAgora(); });

  let timerPrevia = null;
  const enviar = msg => $("#previa").contentWindow.postMessage(msg, location.origin);
  function enviarPrevia() {
    clearTimeout(timerPrevia);
    timerPrevia = setTimeout(async () => {
      if (!previaPronta) return;
      const urls = await S.urlsDoProjeto(P);
      enviar({ tipo: "projeto", projeto: JSON.parse(JSON.stringify(P)), urls, marca });
    }, 120);
  }

  window.addEventListener("message", e => {
    if (e.origin !== location.origin || !e.data) return;
    const d = e.data;
    if (d.tipo === "previa-pronta") {
      previaPronta = true;
      enviarPrevia();
      setTimeout(() => { if (posicionando) enviar({ tipo: "posicionar", on: true }); }, 300);
    }
    if (d.tipo === "tela-atual") { telaPrevia = d.tela; marcarAbas(); }
    if (d.tipo === "posicao") {
      const b = botao(d.id);
      if (b) { b.pos = d.pos; agendarSalvar(); }
    }
    if (d.tipo === "selecionar") destacarBotao(d.id, true);
  });

  /* ---------- Barra da prévia ---------- */
  function montarAbas() {
    $("#abas").innerHTML = telasDoTipo().map(t => '<button type="button" data-tela="' + t + '" aria-pressed="false">' + S.TELAS[t] + "</button>").join("");
    marcarAbas();
  }
  function marcarAbas() {
    $$("#abas button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.tela === telaPrevia)));
    const mostrarVideo = posicionando && telaPrevia === "video";
    $("#video-inicio").hidden = !mostrarVideo;
    $("#video-final").hidden = !mostrarVideo;
  }
  function mostrarTela(tela) {
    telaPrevia = tela;
    marcarAbas();
    enviar({ tipo: "tela", tela });
  }
  $("#abas").addEventListener("click", e => { const b = e.target.closest("[data-tela]"); if (b) mostrarTela(b.dataset.tela); });

  function definirPosicionando(on) {
    posicionando = on;
    $("#posicionar").setAttribute("aria-pressed", String(on));
    $("#posicionar").innerHTML = ic("move", 15) + (on ? "Posicionando..." : "Posicionar botões");
    $("#dica-previa").innerHTML = on
      ? "<strong>Arraste</strong> os botões para mover e puxe a <strong>bolinha do canto</strong> para mudar o tamanho. Escolha a tela nas abas acima."
      : "A prévia atualiza sozinha enquanto você edita. Toque nos botões do convite para testar.";
    enviar({ tipo: "posicionar", on });
    marcarAbas();
  }
  $("#posicionar").addEventListener("click", () => definirPosicionando(!posicionando));
  $("#video-inicio").innerHTML = ic("back5", 14) + "Início do vídeo";
  $("#video-final").innerHTML = ic("skip", 14) + "Final do vídeo";
  $("#video-inicio").addEventListener("click", () => enviar({ tipo: "video-ir", onde: "inicio" }));
  $("#video-final").addEventListener("click", () => enviar({ tipo: "video-ir", onde: "final" }));

  function aplicarZoom() {
    const cel = $("#celular");
    cel.style.transform = "scale(" + zoom + ")";
    $("#moldura").style.height = cel.offsetHeight * zoom + "px";
    $("#zoom-valor").textContent = Math.round(zoom * 100) + "%";
  }
  $("#zoom-menos").innerHTML = ic("minus", 14);
  $("#zoom-mais").innerHTML = ic("plus", 14);
  $("#zoom-menos").addEventListener("click", () => { zoom = Math.max(0.6, +(zoom - 0.1).toFixed(1)); aplicarZoom(); });
  $("#zoom-mais").addEventListener("click", () => { zoom = Math.min(1.3, +(zoom + 0.1).toFixed(1)); aplicarZoom(); });
  window.addEventListener("resize", aplicarZoom);

  $("#ver-previa").innerHTML = ic("phone", 16) + "Ver no celular";
  $("#fechar-previa").innerHTML = ic("x", 16) + "Voltar a editar";
  $("#ver-previa").addEventListener("click", () => { document.body.classList.add("vendo-previa"); setTimeout(aplicarZoom, 30); });
  $("#fechar-previa").addEventListener("click", () => document.body.classList.remove("vendo-previa"));

  /* =========================================================
     Topo e pendências
     ========================================================= */
  function atualizarTopo() {
    const nome = P.nomeProjeto || [P.titulo, P.subtitulo].filter(Boolean).join(" ") || "Novo convite";
    $("#titulo-editor").textContent = nome;
    document.title = nome + " | Estúdio de Convites";
  }
  function atualizarPendencias() {
    const falta = S.pendencias(P);
    const box = $("#pendencias");
    box.classList.toggle("ok", !falta.length);
    box.innerHTML = falta.length
      ? ic("info", 18) + "<div><strong>Para o convite ficar pronto, falta:</strong> " + falta.map(S.esc).join(", ") + ".</div>"
      : ic("check", 18) + "<div><strong>Tudo certo!</strong> Confira a prévia e exporte o convite para entregar.</div>";
  }

  /* =========================================================
     Peças reutilizáveis de formulário
     ========================================================= */
  function segmentos(attr, caminho, atual, opcoes) {
    return '<div class="segmentos" role="group">' + opcoes.map(([v, l, icone]) =>
      '<button type="button" ' + attr + '="' + caminho + '" data-valor="' + S.esc(v) + '" aria-pressed="' + (String(atual) === String(v)) + '">' +
      (icone ? ic(icone, 14) : "") + S.esc(l) + "</button>").join("") + "</div>";
  }
  function campoTexto(attr, caminho, f) {
    const ph = f.ph ? ' placeholder="' + S.esc(f.ph) + '"' : "";
    if (f.t === "check") return '<label class="check"><input type="checkbox" ' + attr + '="' + caminho + '">' + S.esc(f.l) + "</label>";
    if (f.t === "area") return '<label class="campo"><span>' + S.esc(f.l) + "</span><textarea " + attr + '="' + caminho + '"' + ph + ' maxlength="3000"></textarea></label>';
    const tipo = f.t === "tel" ? ' type="tel" inputmode="tel"' : f.t === "date" ? ' type="date"' : f.t === "url" ? ' inputmode="url"' : "";
    return '<label class="campo"><span>' + S.esc(f.l) + "</span><input " + attr + '="' + caminho + '"' + tipo + ph + ' maxlength="' + (f.max || 300) + '"></label>';
  }
  const slotHTML = (chave, rotulo, ajuda) =>
    '<div class="campo largo">' + (rotulo ? "<span>" + rotulo + "</span>" : "") + '<div data-slot="' + chave + '"></div>' + (ajuda ? "<small>" + ajuda + "</small>" : "") + "</div>";

  /* =========================================================
     Passo 1: cores e idioma
     ========================================================= */
  function montarCores() {
    $("#cores").innerHTML = S.CORES.map(c =>
      '<button type="button" style="--c:' + c.cor + '" data-cor="' + c.cor + '" aria-label="' + c.nome + '" title="' + c.nome + '"></button>'
    ).join("") + '<label title="Escolher outra cor"><input type="color" id="cor-livre" aria-label="Escolher outra cor">Outra cor</label>';
    marcarCor();
  }
  function marcarCor() {
    $$("#cores [data-cor]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.cor.toLowerCase() === P.cor.toLowerCase())));
    $("#cor-livre").value = P.cor;
  }
  $("#cores").addEventListener("click", e => { const b = e.target.closest("[data-cor]"); if (b) { P.cor = b.dataset.cor; marcarCor(); agendarSalvar(); } });
  $("#cores").addEventListener("input", e => { if (e.target.id === "cor-livre") { P.cor = e.target.value; marcarCor(); agendarSalvar(); } });

  /* =========================================================
     Passo 2: mídias de cada modelo
     ========================================================= */
  function montarMidias() {
    const t = P.tipo;
    let h = '<div class="campos">';
    h += slotHTML("capa", t === "livrinho" ? "Capa <em>(opcional no livrinho)</em>" : "Capa", t === "livrinho" ? "Sem capa, a primeira página do livro vira a capa." : "Aparece na abertura e no topo do convite. Vertical, 1080 x 1920.");
    if (t === "cinematografico") {
      h += slotHTML("video", "Vídeo do convite", "MP4 na vertical (9:16). Até 80 MB, mas o ideal é até uns 20 MB.");
      h += '<div class="campo largo"><span>Depois do vídeo</span>' + segmentos("data-escolha", "opcoes.video.depois", P.opcoes.video.depois, [["convite", "Ir para o convite"], ["parar", "Parar no último quadro"]]) +
        "<small>Em \"Parar no último quadro\", os botões que você posicionar no vídeo ficam por cima da arte final.</small></div>";
      h += '<label class="check largo"><input type="checkbox" data-campo="opcoes.video.pular"> Mostrar botão "Pular"</label>';
    }
    if (t === "interativo") h += slotHTML("arte", "Arte do convite", "A imagem em tela cheia. Depois você coloca áreas de toque em cima dos desenhos.");
    if (t === "livrinho") h += slotHTML("paginas", "Páginas do livrinho", "Use páginas do mesmo tamanho (vertical, 1080 x 1920 ou 1080 x 1350). Vídeo até " + LIVRO.videoMb + " MB por página.");
    if (t === "revelacao") {
      h += slotHTML("revelada", "Imagem da surpresa", "Aparece quando o convidado raspar a tela.");
      h += '<label class="campo largo"><span>Texto da raspadinha</span><input data-campo="opcoes.revelacao.texto" maxlength="40" placeholder="Raspe para revelar"></label>';
    }
    if (t === "quebracabeca") {
      h += slotHTML("quebra", "Imagem do quebra-cabeça <em>(opcional)</em>", "Sem imagem, usa a capa.");
      h += '<div class="campo largo"><span>Número de peças</span>' + segmentos("data-escolha", "opcoes.quebra.pecas", P.opcoes.quebra.pecas, [[2, "2 x 2 (fácil)"], [3, "3 x 3"], [4, "4 x 4"], [5, "5 x 5 (difícil)"]]) + "</div>";
    }
    h += '<label class="check largo"><input type="checkbox" data-campo="opcoes.musica.on"> Tocar música de fundo</label>';
    h += slotHTML("musica", "", "MP3. Começa quando o convidado abre o convite (no cinematográfico, depois do vídeo).");
    h += "</div>";
    $("#midias").innerHTML = h;
  }

  /* =========================================================
     Passo 3: abertura e efeitos
     ========================================================= */
  function opcaoHTML(id, icone, nome, ajuda, caminhoOn, corpo) {
    return '<div class="opcao" data-opcao="' + id + '"><div class="opcao-topo"><span class="bolha">' + ic(icone, 18) + "</span>" +
      '<div class="opcao-nome"><strong id="op-' + id + '">' + S.esc(nome) + "</strong><small>" + S.esc(ajuda) + "</small></div>" +
      '<label class="chave"><input type="checkbox" data-campo="' + caminhoOn + '" aria-labelledby="op-' + id + '"><i></i></label></div>' +
      '<div class="opcao-corpo">' + (corpo || "") + "</div></div>";
  }
  function montarOpcoes() {
    const o = P.opcoes;
    $("#opcoes").innerHTML =
      opcaoHTML("abertura", "sparkle", "Tela de abertura", "Capa com o botão para abrir. Garante que o vídeo e a música toquem com som.", "opcoes.abertura.on",
        '<div class="campos">' + campoTexto("data-campo", "opcoes.abertura.texto", { l: "Texto do botão", ph: S.textos(P.idioma).abrir, max: 30 }) +
        slotHTML("abertura", "Imagem própria da abertura <em>(opcional)</em>", "Sem imagem, usa a capa.") + "</div>") +
      opcaoHTML("contagem", "clock", "Contagem regressiva", "Dias, horas, minutos e segundos até a festa.", "opcoes.contagem.on") +
      opcaoHTML("efeito", "heart", "Efeito ao tocar na tela", "Corações, brilhos ou confete onde o convidado tocar.", "opcoes.efeito.on",
        segmentos("data-escolha", "opcoes.efeito.tipo", o.efeito.tipo, [["coracoes", "Corações", "heart"], ["brilhos", "Brilhos", "sparkle"], ["confete", "Confete", "star"]])) +
      opcaoHTML("senha", "lock", "Senha do convite", "Só abre para quem tiver a senha. É uma proteção simples, não guarde dados sigilosos.", "opcoes.senha.on",
        '<div class="campos">' + campoTexto("data-campo", "opcoes.senha.valor", { l: "Senha", ph: "Ex.: giovanna15", max: 40 }) + "</div>") +
      opcaoHTML("previa", "eye", "Marca d'água de prévia", "Escreve \"Prévia\" por cima do convite todo. Use para mandar para aprovação antes do pagamento.", "opcoes.previa.on");
  }

  /* =========================================================
     Passo 4: botões
     ========================================================= */
  function onde(b) { return b.pos && telasDoTipo().includes(b.pos.tela) ? b.pos.tela : ""; }

  function cardBotao(b) {
    const tipo = S.BOTOES[b.tipo] || S.BOTOES.personalizado;
    const nome = S.nomeDoBotao(b, "pt");
    const tela = onde(b);
    const k = "data-b";
    let corpo = '<div class="bloco-botao">';
    corpo += '<div class="campos">' +
      '<label class="campo"><span>Nome do botão</span><input ' + k + '="nome" maxlength="40" placeholder="' + S.esc(tipo.nome.pt) + '"></label>' +
      '<div class="campo"><span>Ícone</span><div class="icones">' + S.ICONES_ESCOLHA.map(n =>
        '<button type="button" data-b-escolha="icone" data-valor="' + n + '" aria-pressed="' + (b.icone === n) + '" aria-label="Ícone ' + n + '">' + ic(n, 16) + "</button>").join("") + "</div></div>" +
      "</div>";

    const acoes = b.tipo === "personalizado"
      ? [["texto", "Texto", "info"], ["imagem", "Mostrar imagem", "image"], ["link", "Abrir link", "link"]]
      : [["padrao", "Padrão", tipo.icone], ["imagem", "Mostrar imagem", "image"], ["link", "Abrir link", "link"]];
    corpo += '<div class="campo"><span>Ao tocar</span>' + segmentos("data-b-escolha", "acao", b.acao, acoes) + "</div>";

    if (b.acao === "padrao") {
      corpo += '<div class="campos" style="grid-template-columns:1fr">' + (CAMPOS_BOTAO[b.tipo] || []).map(f => {
        if (f.nota) return '<p class="ajuda">' + S.esc(f.nota) + "</p>";
        if (f.slot) return slotHTML(f.slot, S.esc(f.l));
        return campoTexto(k, "dados." + f.c, f);
      }).join("") + "</div>";
    } else if (b.acao === "texto") {
      corpo += campoTexto(k, "texto", { l: "Texto que aparece", t: "area", ph: "Escreva aqui o que o convidado vai ler." });
    } else if (b.acao === "imagem") {
      corpo += slotHTML("botao:" + b.id, "Imagem que abre ao tocar", "Pode ser a arte do dress code, do cardápio, do manual... Abre em tela cheia.");
    } else if (b.acao === "link") {
      corpo += campoTexto(k, "link", { l: "Link externo", ph: "https://...", t: "url", max: 600 });
    }

    corpo += '<div class="campos">' +
      '<label class="campo"><span>Onde aparece</span><select data-b-onde>' +
      '<option value="">Na lista do convite</option>' +
      telasDoTipo().map(t => '<option value="' + t + '"' + (tela === t ? " selected" : "") + ">" + S.esc(ONDE[t]) + "</option>").join("") +
      "</select></label>";
    if (tela) {
      corpo += '<div class="campo"><span>Posição</span><button type="button" class="btn btn-linha" data-ajustar="' + b.id + '">' + ic("move", 15) + "Ajustar na prévia</button></div>";
      corpo += '<div class="campo largo"><span>Estilo</span>' + segmentos("data-b-escolha", "estilo", b.estilo, ESTILOS) + "</div>";
      if (S.FINAL_DA_TELA[tela]) {
        corpo += '<div class="campo largo"><span>Quando aparece</span>' + segmentos("data-b-escolha", "aparecer", b.aparecer, [["sempre", "O tempo todo"], ["final", "Só " + S.FINAL_DA_TELA[tela]]]) + "</div>";
      }
    }
    corpo += "</div>";
    corpo += '<div class="linha-acoes"><span></span><button type="button" class="btn btn-linha btn-pequeno" data-remover-botao="' + b.id + '">' + ic("trash", 14) + "Remover botão</button></div>";
    corpo += "</div>";

    return '<div class="opcao' + (b.on ? " ligada" : "") + '" data-bid="' + b.id + '">' +
      '<div class="opcao-topo"><span class="bolha">' + ic(b.icone, 18) + "</span>" +
      '<div class="opcao-nome"><strong data-nome-botao>' + S.esc(nome) + "</strong><small>" + S.esc(tipo.ajuda) + "</small>" +
      (tela ? '<span class="local">' + ic("move", 11) + S.esc(S.TELAS[tela]) + "</span>" : "") + "</div>" +
      '<label class="chave"><input type="checkbox" ' + k + '="on" aria-label="Ligar ' + S.esc(nome) + '"><i></i></label></div>' +
      '<div class="opcao-corpo">' + corpo + "</div></div>";
  }

  function preencherBotao(card) {
    const b = botao(card.dataset.bid);
    if (!b) return;
    card.querySelectorAll("[data-b]").forEach(el => {
      const v = pegar(b, el.dataset.b);
      if (el.type === "checkbox") el.checked = !!v; else el.value = v == null ? "" : v;
    });
  }
  function montarBotoes() {
    const lista = P.botoes.filter(b => !S.BOTOES[b.tipo] || !S.BOTOES[b.tipo].tipos || S.BOTOES[b.tipo].tipos.includes(P.tipo));
    $("#botoes").innerHTML = lista.map(cardBotao).join("");
    $$("#botoes [data-bid]").forEach(preencherBotao);
    montarSlots($("#botoes"));
  }
  function remontarBotao(id) {
    const velho = document.querySelector('[data-bid="' + id + '"]');
    const b = botao(id);
    if (!velho || !b) return montarBotoes();
    const tmp = document.createElement("div");
    tmp.innerHTML = cardBotao(b);
    const novo = tmp.firstElementChild;
    velho.replaceWith(novo);
    preencherBotao(novo);
    montarSlots(novo);
  }
  function destacarBotao(id, rolar) {
    $$("#botoes .opcao").forEach(c => c.classList.toggle("selecionada", c.dataset.bid === id));
    const c = document.querySelector('[data-bid="' + id + '"]');
    if (c && rolar && !document.body.classList.contains("vendo-previa")) c.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function montarMenuAdicionar() {
    const tipos = Object.entries(S.BOTOES).filter(([, t]) => !t.tipos || t.tipos.includes(P.tipo));
    $("#adicionar").innerHTML = tipos.map(([id, t]) =>
      '<button type="button" data-adicionar="' + id + '">' + ic(t.icone, 16) + S.esc(id === "personalizado" ? "Personalizado" : t.nome.pt) + "</button>").join("");
  }
  $("#adicionar").addEventListener("click", e => {
    const a = e.target.closest("[data-adicionar]");
    if (!a) return;
    const b = S.novoBotao(a.dataset.adicionar);
    const iguais = P.botoes.filter(x => x.tipo === b.tipo).length;
    if (iguais) b.nome = S.BOTOES[b.tipo].nome.pt + " " + (iguais + 1);
    P.botoes.push(b);
    montarBotoes();
    agendarSalvar();
    destacarBotao(b.id, true);
  });

  function posicaoInicial(tela) {
    const ja = P.botoes.filter(b => b.pos && b.pos.tela === tela).length;
    return { tela, x: 20, y: Math.min(88, 56 + ja * 9), w: 60, h: 7 };
  }

  /* =========================================================
     Eventos dos campos
     ========================================================= */
  function preencherCampos(raiz) {
    (raiz || document).querySelectorAll("[data-campo]").forEach(el => {
      const v = pegar(P, el.dataset.campo);
      if (el.type === "checkbox") el.checked = !!v; else el.value = v == null ? "" : v;
    });
    marcarOpcoes();
  }
  function marcarOpcoes() {
    $$("[data-opcao]").forEach(el => {
      const inp = el.querySelector(".opcao-topo [data-campo]");
      el.classList.toggle("ligada", !!(inp && inp.checked));
    });
  }

  function aoMudar(el) {
    if (el.dataset.campo) {
      definir(P, el.dataset.campo, el.type === "checkbox" ? el.checked : el.value);
      if (el.dataset.campo === "idioma") montarOpcoes(), preencherCampos($("#opcoes")), montarSlots($("#opcoes"));
      marcarOpcoes();
      agendarSalvar();
      return;
    }
    const card = el.closest("[data-bid]");
    if (!card) return;
    const b = botao(card.dataset.bid);
    if (!b) return;
    if (el.hasAttribute("data-b-onde")) {
      const tela = el.value;
      b.pos = tela ? (b.pos && b.pos.tela === tela ? b.pos : posicaoInicial(tela)) : null;
      remontarBotao(b.id);
      agendarSalvar();
      if (tela) { mostrarTela(tela); enviar({ tipo: "selecionar", id: b.id }); }
      return;
    }
    if (!el.dataset.b) return;
    const v = el.type === "checkbox" ? el.checked : el.value;
    if (pegar(b, el.dataset.b) === v) return;
    definir(b, el.dataset.b, v);
    if (el.dataset.b === "on") card.classList.toggle("ligada", !!v);
    if (el.dataset.b === "nome") card.querySelector("[data-nome-botao]").textContent = S.nomeDoBotao(b, "pt");
    agendarSalvar();
  }
  document.addEventListener("input", e => {
    const el = e.target.closest("[data-campo],[data-b]");
    if (el && el.type !== "file") aoMudar(el);
  });
  document.addEventListener("change", e => {
    const el = e.target.closest("[data-campo],[data-b],[data-b-onde]");
    if (!el || el.type === "file") return;
    if (el.tagName === "SELECT" || el.type === "checkbox" || el.type === "date" || el.type === "time" || el.hasAttribute("data-b-onde")) {
      if (el.dataset.campo && pegar(P, el.dataset.campo) === (el.type === "checkbox" ? el.checked : el.value) && el.tagName !== "SELECT") return;
      aoMudar(el);
    }
  });

  document.addEventListener("click", async e => {
    const esc = e.target.closest("[data-escolha]");
    if (esc) {
      const atual = pegar(P, esc.dataset.escolha);
      const v = typeof atual === "number" ? Number(esc.dataset.valor) : esc.dataset.valor;
      definir(P, esc.dataset.escolha, v);
      esc.parentElement.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === esc)));
      agendarSalvar();
      return;
    }
    const bEsc = e.target.closest("[data-b-escolha]");
    if (bEsc) {
      const card = bEsc.closest("[data-bid]");
      const b = botao(card.dataset.bid);
      b[bEsc.dataset.bEscolha] = bEsc.dataset.valor;
      remontarBotao(b.id);
      agendarSalvar();
      return;
    }
    const aj = e.target.closest("[data-ajustar]");
    if (aj) {
      const b = botao(aj.dataset.ajustar);
      if (!b || !b.pos) return;
      if (window.matchMedia("(max-width:1060px)").matches) { document.body.classList.add("vendo-previa"); setTimeout(aplicarZoom, 30); }
      if (!posicionando) definirPosicionando(true);
      mostrarTela(b.pos.tela);
      enviar({ tipo: "selecionar", id: b.id });
      destacarBotao(b.id, false);
      return;
    }
    const rem = e.target.closest("[data-remover-botao]");
    if (rem) {
      const b = botao(rem.dataset.removerBotao);
      if (!b || !confirm("Remover o botão " + S.nomeDoBotao(b, "pt") + "?")) return;
      P.botoes = P.botoes.filter(x => x !== b);
      if (b.imagem) await S.excluirMidia(b.imagem);
      montarBotoes();
      atualizarUso();
      agendarSalvar();
    }
  });

  /* =========================================================
     Mídias (envio, troca, remoção e ordem)
     ========================================================= */
  function infoSlot(chave) {
    if (chave.startsWith("botao:")) return { tipo: "imagem" };
    return SLOTS[chave];
  }
  function lerSlot(chave) {
    if (chave.startsWith("botao:")) { const b = botao(chave.slice(6)); return b ? b.imagem : null; }
    return P.midias[chave];
  }
  function gravarSlot(chave, valor) {
    if (chave.startsWith("botao:")) { const b = botao(chave.slice(6)); if (b) b.imagem = valor; return; }
    P.midias[chave] = valor;
  }

  async function montarSlot(alvo) {
    const chave = alvo.dataset.slot;
    const info = infoSlot(chave);
    if (!info) return;
    const lim = LIMITES[info.tipo];
    const valor = lerSlot(chave);
    let html;
    if (info.livro) {
      alvo.innerHTML = await paginasHTML();
      return;
    }
    if (info.multi) {
      const lista = valor || [];
      html = '<div class="midia" data-midia="' + chave + '">' +
        '<span class="midia-miniatura">' + ic("image", 22) + "</span>" +
        '<span class="midia-texto"><strong>' + (lista.length ? lista.length + " imagem(ns)" : "Nenhuma imagem") + "</strong>Até " + lim.mb + " MB cada · arraste aqui</span>" +
        '<label class="btn btn-linha">' + ic("upload", 15) + 'Adicionar<input type="file" accept="' + lim.aceita + '*" multiple data-arquivo="' + chave + '"></label></div>';
      if (lista.length) {
        const fotos = await Promise.all(lista.map(async (id, i) =>
          '<div style="background-image:url(&quot;' + (await S.urlMidia(id)) + '&quot;)">' +
          (info.ordem ? "<span>" + (i + 1) + "</span>" : "") +
          '<button type="button" data-remover-item="' + chave + '" data-item="' + id + '" aria-label="Remover">' + ic("x", 12) + "</button>" +
          (info.ordem && i > 0 ? '<button type="button" class="mover" data-mover-item="' + chave + '" data-item="' + id + '" aria-label="Mover para antes">' + ic("back", 12) + "</button>" : "") +
          "</div>"));
        html += '<div class="galeria-editor">' + fotos.join("") + "</div>";
      }
    } else {
      const m = valor ? await S.obterMidia(valor) : null;
      const u = valor ? await S.urlMidia(valor) : "";
      let mini = ic(lim.icone, 22), estilo = "";
      if (u && info.tipo === "imagem") { mini = ""; estilo = ' style="background-image:url(&quot;' + u + '&quot;)"'; }
      if (u && info.tipo === "video") mini = '<video src="' + u + '#t=0.5" muted playsinline preload="metadata"></video>';
      html = '<div class="midia" data-midia="' + chave + '">' +
        '<span class="midia-miniatura"' + estilo + ">" + mini + "</span>" +
        '<span class="midia-texto"><strong>' + (m ? S.esc(m.nome) : "Nenhum arquivo") + "</strong>" + (m ? S.formatarTamanho(m.tamanho) : "Até " + lim.mb + " MB · toque ou arraste aqui") + "</span>" +
        '<label class="btn btn-linha">' + ic(m ? "replay" : "upload", 15) + (m ? "Trocar" : "Enviar") +
        '<input type="file" accept="' + lim.aceita + '*" data-arquivo="' + chave + '"></label>' +
        (m ? '<button type="button" class="btn-icone" data-remover-midia="' + chave + '" aria-label="Remover arquivo" title="Remover">' + ic("trash", 16) + "</button>" : "") +
        "</div>";
    }
    alvo.innerHTML = html;
  }
  /* Páginas do livrinho: cartões numerados, arrastáveis, com imagem, GIF ou vídeo. */
  async function paginasHTML() {
    const lista = P.midias.paginas;
    const videos = lista.filter(id => P.midias.videos.includes(id)).length;
    const cartoes = await Promise.all(lista.map(async (id, i) => {
      const u = await S.urlMidia(id);
      const video = P.midias.videos.includes(id);
      const capa = i === 0 && !P.midias.capa;
      return '<div class="pagina-card" draggable="true" data-pagina-id="' + id + '">' +
        '<div class="pagina-folha"' + (video ? "" : ' style="background-image:url(&quot;' + u + '&quot;)"') + ">" +
        (video ? '<video src="' + u + '#t=0.5" muted playsinline preload="metadata"></video>' : "") +
        '<span class="pagina-num">' + (i + 1) + "</span>" +
        (capa ? '<span class="pagina-tag">Capa do livro</span>' : video ? '<span class="pagina-tag">' + ic("film", 11) + "Vídeo</span>" : "") +
        '<button type="button" class="pagina-x" data-remover-item="paginas" data-item="' + id + '" aria-label="Remover página ' + (i + 1) + '">' + ic("x", 12) + "</button>" +
        "</div>" +
        '<div class="pagina-mover">' +
        '<button type="button" data-mover-item="paginas" data-item="' + id + '" data-dir="-1" aria-label="Mover para antes"' + (i === 0 ? " disabled" : "") + ">" + ic("back", 13) + "</button>" +
        '<span aria-hidden="true">' + ic("move", 13) + "</span>" +
        '<button type="button" data-mover-item="paginas" data-item="' + id + '" data-dir="1" aria-label="Mover para depois"' + (i === lista.length - 1 ? " disabled" : "") + '><span style="display:inline-flex;transform:scaleX(-1)">' + ic("back", 13) + "</span></button>" +
        "</div></div>";
    }));
    const cabe = lista.length < LIVRO.maxPaginas;
    return '<div class="livro-editor" data-midia="paginas">' +
      '<div class="livro-topo"><span><strong>' + lista.length + "</strong> de " + LIVRO.maxPaginas + " páginas · " + videos + " de " + LIVRO.maxVideos + " vídeos</span>" +
      "<small>Arraste os cartões para mudar a ordem" + (P.midias.capa ? "" : ". A primeira página vira a capa") + ".</small></div>" +
      '<div class="paginas-grade">' + cartoes.join("") +
      (cabe ? '<label class="pagina-nova">' + ic("plus", 22) + "<span>Nova página</span><small>Imagem, GIF ou vídeo</small>" +
        '<input type="file" accept="image/*,video/*" multiple data-arquivo="paginas"></label>' : "") +
      "</div></div>";
  }

  /* Arrastar para reordenar as páginas. */
  let paginaArrastada = null;
  document.addEventListener("dragstart", e => {
    const c = e.target.closest && e.target.closest(".pagina-card");
    if (!c) return;
    paginaArrastada = c.dataset.paginaId;
    c.classList.add("arrastando");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", paginaArrastada);
  });
  document.addEventListener("dragend", () => {
    paginaArrastada = null;
    $$(".pagina-card").forEach(c => c.classList.remove("arrastando", "alvo"));
  });
  document.addEventListener("dragover", e => {
    if (!paginaArrastada) return;
    const c = e.target.closest && e.target.closest(".pagina-card");
    if (!c) return;
    e.preventDefault();
    $$(".pagina-card").forEach(x => x.classList.toggle("alvo", x === c && x.dataset.paginaId !== paginaArrastada));
  });
  document.addEventListener("drop", async e => {
    if (!paginaArrastada) return;
    const c = e.target.closest && e.target.closest(".pagina-card");
    e.preventDefault();
    const origem = paginaArrastada;
    paginaArrastada = null;
    if (!c || c.dataset.paginaId === origem) return;
    const lista = P.midias.paginas;
    const destino = lista.indexOf(c.dataset.paginaId);
    lista.splice(lista.indexOf(origem), 1);
    lista.splice(destino, 0, origem);
    await remontarSlot("paginas");
    agendarSalvar();
  });

  /* Paginador embaixo do celular de prévia. */
  let paginaPrevia = 0, totalPrevia = 0;
  function atualizarPaginador() {
    const pg = $("#paginador");
    const mostrar = P.tipo === "livrinho" && telaPrevia === "livro" && totalPrevia > 0;
    pg.hidden = !mostrar;
    if (!mostrar) return;
    pg.querySelector("span").textContent = "Página " + (paginaPrevia + 1) + " de " + totalPrevia;
    pg.querySelector("[data-pag='-1']").disabled = paginaPrevia <= 0;
    pg.querySelector("[data-pag='1']").disabled = paginaPrevia >= totalPrevia - 1;
  }
  $("#paginador").addEventListener("click", e => {
    const b = e.target.closest("[data-pag]");
    if (b) enviar({ tipo: "pagina", n: paginaPrevia + Number(b.dataset.pag) });
  });
  window.addEventListener("message", e => {
    if (e.origin !== location.origin || !e.data) return;
    if (e.data.tipo === "pagina-atual") { paginaPrevia = e.data.n; totalPrevia = e.data.total; atualizarPaginador(); }
    if (e.data.tipo === "tela-atual") atualizarPaginador();
  });

  function montarSlots(raiz) {
    return Promise.all(Array.from((raiz || document).querySelectorAll("[data-slot]")).map(montarSlot)).then(atualizarUso);
  }
  const remontarSlot = chave => Promise.all($$('[data-slot="' + chave + '"]').map(montarSlot)).then(atualizarUso);

  async function receberArquivos(chave, arquivos) {
    const info = infoSlot(chave);
    const lim = LIMITES[info.tipo];
    const lista = Array.from(arquivos || []);
    if (!lista.length) return;
    for (const arq of lista) {
      if (info.livro) {
        const video = arq.type.startsWith("video/");
        if (!video && !arq.type.startsWith("image/")) { UI.toast(arq.name + " não é imagem nem vídeo.", true); continue; }
        if (P.midias.paginas.length >= LIVRO.maxPaginas) { UI.toast("O livrinho já tem " + LIVRO.maxPaginas + " páginas.", true); break; }
        const nVideos = P.midias.paginas.filter(id => P.midias.videos.includes(id)).length;
        if (video && nVideos >= LIVRO.maxVideos) { UI.toast("Máximo de " + LIVRO.maxVideos + " páginas em vídeo.", true); continue; }
        const mb = video ? LIVRO.videoMb : LIMITES.imagem.mb;
        if (arq.size > mb * 1024 * 1024) { UI.toast(arq.name + " passou de " + mb + " MB.", true); continue; }
        try {
          const m = await S.salvarMidia(arq);
          P.midias.paginas.push(m.id);
          if (video) P.midias.videos.push(m.id);
        } catch (e) { console.error(e); UI.toast("Não consegui guardar " + arq.name + ".", true); }
        continue;
      }
      if (!arq.type.startsWith(lim.aceita)) { UI.toast(arq.name + " não é um arquivo de " + lim.nome + ".", true); continue; }
      if (arq.size > lim.mb * 1024 * 1024) { UI.toast(arq.name + " passou de " + lim.mb + " MB. Use um arquivo mais leve.", true); continue; }
      try {
        const m = await S.salvarMidia(arq);
        if (info.multi) P.midias[chave].push(m.id);
        else {
          const antigo = lerSlot(chave);
          gravarSlot(chave, m.id);
          if (antigo) await S.excluirMidia(antigo);
        }
      } catch (e) {
        console.error(e);
        UI.toast("Não consegui guardar " + arq.name + ". O aparelho pode estar sem espaço.", true);
      }
    }
    if (chave === "musica" && P.midias.musica && !P.opcoes.musica.on) { P.opcoes.musica.on = true; preencherCampos($("#midias")); }
    if (chave === "galeria" && P.midias.galeria.length) {
      const g = P.botoes.find(b => b.tipo === "galeria");
      if (g && !g.on) { g.on = true; remontarBotao(g.id); }
    }
    await remontarSlot(chave);
    agendarSalvar();
    await salvarAgora();
  }

  document.addEventListener("change", e => {
    const inp = e.target.closest("[data-arquivo]");
    if (!inp) return;
    receberArquivos(inp.dataset.arquivo, inp.files);
    inp.value = "";
  });
  document.addEventListener("click", async e => {
    const rem = e.target.closest("[data-remover-midia]");
    if (rem) {
      const chave = rem.dataset.removerMidia;
      const id = lerSlot(chave);
      gravarSlot(chave, null);
      await S.excluirMidia(id);
      await remontarSlot(chave);
      agendarSalvar();
      return;
    }
    const remItem = e.target.closest("[data-remover-item]");
    if (remItem) {
      const chave = remItem.dataset.removerItem, id = remItem.dataset.item;
      P.midias[chave] = P.midias[chave].filter(x => x !== id);
      P.midias.videos = P.midias.videos.filter(x => x !== id);
      await S.excluirMidia(id);
      await remontarSlot(chave);
      agendarSalvar();
      return;
    }
    const mov = e.target.closest("[data-mover-item]");
    if (mov) {
      const lista = P.midias[mov.dataset.moverItem];
      const i = lista.indexOf(mov.dataset.item);
      const j = i + (Number(mov.dataset.dir) || -1);
      if (i >= 0 && j >= 0 && j < lista.length) { [lista[j], lista[i]] = [lista[i], lista[j]]; }
      await remontarSlot(mov.dataset.moverItem);
      agendarSalvar();
    }
  });
  ["dragenter", "dragover"].forEach(ev => document.addEventListener(ev, e => {
    const z = e.target.closest && e.target.closest("[data-midia]");
    if (!z) return;
    e.preventDefault();
    z.classList.add("arrastando");
  }));
  ["dragleave", "drop"].forEach(ev => document.addEventListener(ev, e => {
    const z = e.target.closest && e.target.closest("[data-midia]");
    if (!z) return;
    e.preventDefault();
    z.classList.remove("arrastando");
    if (ev === "drop") receberArquivos(z.dataset.midia, e.dataTransfer.files);
  }));

  async function atualizarUso() {
    const total = await S.tamanhoDoProjeto(P);
    const pct = Math.min(100, total / (RECOMENDADO_MB * 1024 * 1024) * 100);
    const box = $("#uso");
    box.querySelector("i").style.width = pct + "%";
    box.classList.toggle("alto", pct >= 100);
    const sp = box.querySelectorAll("small span");
    sp[0].textContent = "Mídias do convite: " + S.formatarTamanho(total);
    sp[1].textContent = "ideal até " + RECOMENDADO_MB + " MB";
  }

  /* =========================================================
     Topo
     ========================================================= */
  $("#voltar").innerHTML = ic("back", 18);
  $("#exportar").innerHTML = ic("download", 16) + "Exportar";
  $("#exportar").addEventListener("click", async () => { await salvarAgora(); UI.exportarComAjuda(P); });

  /* =========================================================
     Início
     ========================================================= */
  async function iniciar() {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    if (id) P = await S.obterProjeto(id);
    if (!P) {
      if (id) UI.toast("Esse convite não foi encontrado. Criei um novo para você.", true);
      const t = params.get("tipo");
      P = S.novoProjeto(S.TIPOS[t] && S.TIPOS[t].ativo ? t : "cinematografico");
      await S.salvarProjeto(P);
      history.replaceState(null, "", "editor.html?id=" + P.id);
    }
    const m = await S.lerMarca();
    marca = { nome: m.nome, mostrar: m.mostrar, logo: await S.urlMidia(m.logo) };

    $("#chip-tipo").textContent = S.TIPOS[P.tipo].nome;
    $("#status").innerHTML = Object.entries(S.STATUS).map(([k, v]) => '<option value="' + k + '">' + v + "</option>").join("");
    $("#idioma").innerHTML = Object.entries(S.IDIOMAS).map(([k, v]) => '<option value="' + k + '">' + v + "</option>").join("");
    const abrir = $("#abrir-convite");
    abrir.href = "convite.html?id=" + P.id;
    abrir.innerHTML = ic("eye", 16) + "Abrir convite";

    montarCores();
    montarMidias();
    montarOpcoes();
    montarBotoes();
    montarMenuAdicionar();
    montarAbas();
    preencherCampos();
    atualizarTopo();
    atualizarPendencias();
    definirPosicionando(false);
    await montarSlots();
    aplicarZoom();
    $("#salvo").textContent = "Salvo";
    enviarPrevia();
  }

  iniciar().catch(err => { console.error(err); UI.toast("Não consegui abrir o editor neste navegador.", true); });
})();
