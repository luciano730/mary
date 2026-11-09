/* Convite Mary Criativa: o que o convidado vê, em todos os modelos.
   Abre de três jeitos:
   1. convite.html?id=...      lê o projeto salvo neste navegador
   2. convite.html?previa=1    recebe os dados do editor (celular de prévia)
   3. convite exportado        os dados vêm em window.CONVITE_EXPORTADO */
(function () {
  "use strict";
  const S = window.Store;
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const ic = S.icone;

  const params = new URLSearchParams(location.search);
  const modoPrevia = params.get("previa") === "1";

  let P = null;            // projeto
  let U = {};              // id da mídia -> url
  let M = null;            // marca da Mary (nome e logo)
  let T = S.textos("pt");  // textos no idioma do convite
  let telaAtual = "";
  let posicionando = false;
  let somLigado = true;
  let relogio = null;
  const proporcao = { video: 9 / 16 };  // largura / altura de cada palco

  const video = $("#video");
  const musica = $("#musica");
  const botaoSom = $("#botao-som");

  const url = id => (id ? U[id] || "" : "");
  const ehVideo = id => (P.midias.videos || []).includes(id);
  /* No livrinho, sem capa enviada, a primeira página com imagem vira a capa. */
  function urlCapa() {
    if (url(P.midias.capa)) return url(P.midias.capa);
    if (P.tipo === "livrinho") { const pg = P.midias.paginas.find(id => !ehVideo(id)); return url(pg); }
    return "";
  }
  const telas = () => (S.TIPOS[P.tipo] || S.TIPOS.cinematografico).telas;
  const avisarEditor = msg => { if (modoPrevia) window.parent.postMessage(msg, location.origin); };

  /* =========================================================
     Palcos: caixa com a proporção da mídia (cobre a tela ou cabe nela)
     ========================================================= */
  const medidas = {};
  function medirImagem(u) {
    if (!u) return Promise.resolve(null);
    if (medidas[u]) return Promise.resolve(medidas[u]);
    return new Promise(res => {
      const im = new Image();
      im.onload = () => { medidas[u] = im.naturalWidth / im.naturalHeight || null; res(medidas[u]); };
      im.onerror = () => res(null);
      im.src = u;
    });
  }

  function ajustarPalcos() {
    $$("[data-palco]").forEach(palco => {
      const nome = palco.dataset.palco;
      const caixa = nome === "convite" ? palco.parentElement : palco.closest(".tela");
      const w = caixa.clientWidth || window.innerWidth;
      const h = caixa.clientHeight || window.innerHeight;
      const r = proporcao[nome] || 9 / 16;
      let pw, ph, left, top;
      if (palco.classList.contains("contido")) {
        const mw = w * 0.9, mh = h * 0.8;
        pw = Math.min(mw, mh * r); ph = pw / r;
        left = (w - pw) / 2; top = (h - ph) / 2 - h * 0.02;
      } else {
        pw = Math.max(w, h * r); ph = pw / r;
        left = (w - pw) / 2; top = (h - ph) / 2;
      }
      Object.assign(palco.style, { width: pw + "px", height: ph + "px", left: left + "px", top: top + "px" });
    });
    if (telaAtual === "revelacao") prepararRaspadinha(false);
  }
  window.addEventListener("resize", ajustarPalcos);

  async function atualizarProporcoes() {
    const m = P.midias;
    const pares = [
      ["abertura", url(m.abertura) || urlCapa()],
      ["convite", urlCapa()],
      ["arte", url(m.arte)],
      ["revelacao", url(m.revelada)],
      ["quebra", url(m.quebra) || url(m.capa)],
      ["livro", ehVideo(m.paginas[0]) ? "" : url(m.paginas[0])]
    ];
    for (const [nome, u] of pares) proporcao[nome] = (await medirImagem(u)) || 9 / 16;
    ajustarPalcos();
  }
  video.addEventListener("loadedmetadata", () => {
    if (video.videoWidth) proporcao.video = video.videoWidth / video.videoHeight;
    ajustarPalcos();
  });

  /* =========================================================
     Montagem da página
     ========================================================= */
  const fundo = (nome, u) => { const el = $('[data-fundo="' + nome + '"]'); if (el) el.style.backgroundImage = u ? 'url("' + u + '")' : ""; };

  function aplicar() {
    const o = P.opcoes, m = P.midias;
    T = S.textos(P.idioma);
    document.documentElement.lang = { pt: "pt-BR", en: "en", es: "es" }[P.idioma] || "pt-BR";
    document.documentElement.style.setProperty("--cor", P.cor || "#E8B8B1");
    document.documentElement.style.setProperty("--cor-texto", S.corDoTexto(P.cor));
    document.title = [P.titulo, P.subtitulo].filter(Boolean).join(" · ") || "Convite";

    $$("[data-t]").forEach(el => { el.textContent = T[el.dataset.t] || ""; });
    $("#senha-icone").innerHTML = ic("lock", 26);
    fundo("abertura", url(m.abertura) || urlCapa());
    fundo("convite", urlCapa());
    fundo("arte", url(m.arte));
    fundo("revelacao", url(m.revelada));
    $$("[data-titulo]").forEach(el => { el.textContent = P.titulo || "Seu nome aqui"; });
    $$("[data-subtitulo]").forEach(el => { el.textContent = P.subtitulo || ""; });
    $("#texto-abrir").textContent = o.abertura.texto || T.abrir;
    $("#dica-raspe").textContent = o.revelacao.texto || T.raspe;
    $("#data-evento").textContent = S.dataLonga(P.data, P.hora, P.idioma);
    $("#mensagem").textContent = P.mensagem || "";

    const urlVideo = P.tipo === "cinematografico" ? url(m.video) : "";
    if (video.getAttribute("src") !== urlVideo) {
      if (urlVideo) video.setAttribute("src", urlVideo); else video.removeAttribute("src");
      video.load();
    }
    $("#botao-pular").innerHTML = T.pular + " " + ic("skip", 14);
    $("#botao-pular").hidden = !o.video.pular;

    const urlMusica = o.musica.on ? url(m.musica) : "";
    if (musica.getAttribute("src") !== urlMusica) {
      if (urlMusica) musica.setAttribute("src", urlMusica); else { musica.pause(); musica.removeAttribute("src"); }
      musica.load();
      if (urlMusica && telaAtual && !["abertura", "video", "senha"].includes(telaAtual) && somLigado) tocarMusica();
    }

    montarLivro();
    montarQuebra();
    montarCamadas();
    montarGrade();
    montarListaInline();
    iniciarContagem();
    montarRodape();
    montarMarcaDagua();
    atualizarPilula();
    atualizarBotaoSom();
    atualizarProporcoes();
  }

  /* ---------- Botões ---------- */
  function botaoLivreHTML(b) {
    const p = b.pos;
    const estilo = ["visivel", "claro", "vidro", "invisivel"].includes(b.estilo) ? b.estilo : "visivel";
    const temFinal = !!S.FINAL_DA_TELA[p.tela];
    return '<button type="button" class="bt-livre ' + estilo + '" data-botao="' + b.id + '"' +
      ' data-aparecer="' + (temFinal ? b.aparecer : "sempre") + '"' +
      ' style="left:' + p.x + "%;top:" + p.y + "%;width:" + p.w + "%;height:" + p.h + '%"' +
      ' aria-label="' + S.esc(S.nomeDoBotao(b, P.idioma)) + '">' +
      ic(b.icone, 20) + '<span class="rotulo">' + S.esc(S.nomeDoBotao(b, P.idioma)) + "</span>" +
      '<span class="alca" data-alca></span></button>';
  }
  function montarCamadas() {
    const minhas = telas();
    $$("[data-camada]").forEach(c => {
      const tela = c.dataset.camada;
      c.innerHTML = minhas.includes(tela)
        ? P.botoes.filter(b => b.on && b.pos && b.pos.tela === tela && botaoUtil(b)).map(botaoLivreHTML).join("")
        : "";
    });
    if (selecionado) { const el = $('.bt-livre[data-botao="' + selecionado + '"]'); if (el) el.classList.add("selecionado"); }
  }

  /* Botão que não faz sentido neste convite fica de fora. */
  function botaoUtil(b) {
    if (b.acao !== "padrao") return true;
    if (b.tipo === "rever") return P.tipo === "cinematografico" && !!url(P.midias.video);
    if (b.tipo === "galeria") return P.midias.galeria.length > 0;
    if (b.tipo === "agenda") return !!P.data;
    return true;
  }
  function botoesDaGrade() {
    const minhas = telas();
    let listaInlineUsada = false;
    return P.botoes.filter(b => {
      if (!b.on || !botaoUtil(b)) return false;
      if (b.pos && minhas.includes(b.pos.tela)) return false;
      if (b.acao === "padrao" && b.tipo === "convite") return false;
      if (P.tipo === "presentes" && b.tipo === "lista" && b.acao === "padrao" && !listaInlineUsada) { listaInlineUsada = true; return false; }
      return true;
    });
  }
  function montarGrade() {
    const lista = botoesDaGrade();
    const destaque = lista.find(b => b.tipo === "rsvp");
    const ordem = destaque ? [destaque].concat(lista.filter(b => b !== destaque)) : lista;
    $("#grade-botoes").innerHTML = ordem.map(b =>
      '<button type="button" data-botao="' + b.id + '"' + (b === destaque ? ' class="destaque"' : "") + ">" +
      '<span class="bolha">' + ic(b.icone, b === destaque ? 20 : 22) + "</span>" + S.esc(S.nomeDoBotao(b, P.idioma)) + "</button>"
    ).join("");
  }
  function montarListaInline() {
    const box = $("#lista-inline");
    const b = P.tipo === "presentes" && P.botoes.find(x => x.on && x.tipo === "lista" && x.acao === "padrao");
    box.innerHTML = b ? "<h2>" + S.esc(S.nomeDoBotao(b, P.idioma)) + "</h2>" + listaHTML(b) : "";
  }

  function montarRodape() {
    const box = $("#rodape");
    if (!M || M.mostrar === false || !M.nome) { box.innerHTML = ""; return; }
    box.innerHTML = (M.logo ? '<img src="' + S.esc(M.logo) + '" alt="">' : "") +
      "<p>" + S.esc(T.feitoPor) + " <strong>" + S.esc(M.nome) + "</strong></p>";
  }

  function montarMarcaDagua() {
    const el = $("#marca-dagua");
    const on = !!P.opcoes.previa.on;
    el.classList.toggle("ligada", on);
    let faixa = $(".faixa-previa");
    if (on) {
      const nome = (M && M.nome) || "Mary Criativa";
      const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='260' height='120'><text x='12' y='64' font-family='Jost,Arial,sans-serif' font-size='20' font-weight='600' fill='rgba(255,255,255,0.42)' stroke='rgba(0,0,0,0.25)' stroke-width='0.6'>" +
        S.esc(T.previa + " · " + nome) + "</text></svg>";
      el.style.setProperty("--marca", 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")');
      if (!faixa) { faixa = document.createElement("div"); faixa.className = "faixa-previa"; document.body.appendChild(faixa); }
      faixa.textContent = T.previaTexto;
    } else if (faixa) faixa.remove();
  }

  /* ---------- Contagem regressiva ---------- */
  function dataDoEvento() {
    if (!P.data) return null;
    const [a, m, d] = P.data.split("-").map(Number);
    const [h, mi] = (P.hora || "00:00").split(":").map(Number);
    return new Date(a, m - 1, d, h || 0, mi || 0);
  }
  function iniciarContagem() {
    clearInterval(relogio);
    const box = $("#contagem");
    const alvo = dataDoEvento();
    if (!P.opcoes.contagem.on || !alvo) { box.innerHTML = ""; return; }
    const desenhar = () => {
      const falta = alvo - new Date();
      if (falta <= 0) {
        const mesmoDia = new Date().toDateString() === alvo.toDateString();
        box.innerHTML = "<p>" + S.esc(mesmoDia ? T.hoje : T.passou) + "</p>";
        clearInterval(relogio);
        return;
      }
      const seg = Math.floor(falta / 1000);
      const partes = [[Math.floor(seg / 86400), T.dias], [Math.floor(seg % 86400 / 3600), T.horas], [Math.floor(seg % 3600 / 60), T.min], [seg % 60, T.seg]];
      box.innerHTML = partes.map(([n, r]) => "<div><strong>" + String(n).padStart(2, "0") + "</strong><small>" + S.esc(r) + "</small></div>").join("");
    };
    desenhar();
    relogio = setInterval(desenhar, 1000);
  }

  /* =========================================================
     Telas e fluxo
     ========================================================= */
  function irPara(tela) {
    telaAtual = tela;
    $$(".tela").forEach(t => t.classList.remove("ativa"));
    $("#tela-" + tela).classList.add("ativa");
    window.scrollTo(0, 0);
    if (tela !== "video") video.pause();
    if (["abertura", "video", "senha"].includes(tela)) musica.pause();
    else if (somLigado) tocarMusica();
    if (tela === "revelacao") prepararRaspadinha(true);
    if (tela === "quebra" && !posicionando) embaralhar();
    if (tela === "livro") mostrarPagina(posicionando ? P.midias.paginas.length - 1 : 0);
    if (tela === "arte") terminar("arte");
    ajustarPalcos();
    atualizarPilula();
    atualizarBotaoSom();
    avisarEditor({ tipo: "tela-atual", tela });
  }

  /* A tela chegou ao fim: mostra os botões "do final". */
  function terminar(tela) {
    const c = $('[data-camada="' + tela + '"]');
    if (c) c.classList.add("terminou");
    if (tela === "video") $("#botao-pular").classList.add("some");
    atualizarPilula();
  }
  function reiniciarTela(tela) {
    const c = $('[data-camada="' + tela + '"]');
    if (c) c.classList.remove("terminou");
    if (tela === "video") $("#botao-pular").classList.remove("some");
  }

  /* Botão "Mais informações" nas telas que não levam sozinhas ao convite. */
  function atualizarPilula() {
    const pil = $("#pilula");
    const tela = telaAtual;
    const c = $('[data-camada="' + tela + '"]');
    let mostrar = ["arte", "livro", "revelacao", "quebra", "video"].includes(tela) && c && c.classList.contains("terminou");
    if (tela === "video" && P.opcoes.video.depois !== "parar") mostrar = false;
    if (mostrar && P.botoes.some(b => b.on && b.tipo === "convite" && b.acao === "padrao" && b.pos && b.pos.tela === tela)) mostrar = false;
    pil.innerHTML = ic("mail", 16) + S.esc(T.mais);
    pil.classList.toggle("visivel", !!mostrar && !posicionando);
  }
  $("#pilula").addEventListener("click", () => irPara("convite"));

  function temVideo() { return P.tipo === "cinematografico" && !!url(P.midias.video); }
  function temMusica() { return P.opcoes.musica.on && !!url(P.midias.musica); }

  function entrarNaExperiencia(comGesto) {
    const tipo = P.tipo;
    if (comGesto && tipo !== "cinematografico") { somLigado = true; }
    if (tipo === "cinematografico") return temVideo() ? tocarVideo(comGesto) : irPara("convite");
    if (tipo === "interativo") return irPara(url(P.midias.arte) ? "arte" : "convite");
    if (tipo === "livrinho") return irPara(P.midias.paginas.length ? "livro" : "convite");
    if (tipo === "revelacao") return irPara(url(P.midias.revelada) ? "revelacao" : "convite");
    if (tipo === "quebracabeca") return irPara(url(P.midias.quebra) || url(P.midias.capa) ? "quebra" : "convite");
    irPara("convite");
  }

  function telaInicial() {
    if (P.opcoes.senha.on && P.opcoes.senha.valor && !modoPrevia) return irPara("senha");
    if (P.opcoes.abertura.on) irPara("abertura");
    else entrarNaExperiencia(false);
  }

  $("#botao-abrir").addEventListener("click", () => { if (!posicionando) entrarNaExperiencia(true); });

  $("#form-senha").addEventListener("submit", e => {
    e.preventDefault();
    const v = e.target.senha.value.trim().toLowerCase();
    if (v && v === String(P.opcoes.senha.valor).trim().toLowerCase()) {
      $("#erro-senha").textContent = "";
      if (P.opcoes.abertura.on) irPara("abertura"); else entrarNaExperiencia(true);
    } else {
      $("#erro-senha").textContent = T.senhaErrada;
    }
  });

  /* ---------- Vídeo ---------- */
  function tocarVideo(comSom) {
    reiniciarTela("video");
    irPara("video");
    video.currentTime = 0;
    video.muted = !comSom;
    const p = video.play();
    if (p && p.catch) p.catch(() => { video.muted = true; video.play().catch(() => {}); atualizarBotaoSom(); });
    atualizarBotaoSom();
  }
  function fimDoVideo() {
    if (posicionando) return;
    if (P.opcoes.video.depois === "parar") {
      terminar("video");
      if (somLigado) tocarMusica();
      atualizarBotaoSom();
    } else irPara("convite");
  }
  video.addEventListener("ended", fimDoVideo);
  video.addEventListener("error", () => { if (telaAtual === "video" && !posicionando && video.getAttribute("src")) irPara("convite"); });
  $("#botao-pular").addEventListener("click", () => {
    if (P.opcoes.video.depois === "parar" && isFinite(video.duration)) {
      video.pause();
      video.currentTime = Math.max(0, video.duration - 0.05);
      fimDoVideo();
    } else irPara("convite");
  });

  /* ---------- Música e som ---------- */
  function tocarMusica() {
    if (!temMusica()) return;
    if (telaAtual === "video" && !$('[data-camada="video"]').classList.contains("terminou")) return;
    const p = musica.play();
    if (p && p.catch) p.catch(() => { somLigado = false; atualizarBotaoSom(); });
  }
  function atualizarBotaoSom() {
    let visivel = false, ligado = false;
    const videoTocando = telaAtual === "video" && !video.paused;
    if (videoTocando) { visivel = true; ligado = !video.muted; }
    else if (telaAtual && !["abertura", "senha"].includes(telaAtual) && temMusica()) { visivel = true; ligado = !musica.paused; }
    botaoSom.classList.toggle("visivel", visivel && !posicionando);
    botaoSom.innerHTML = ic(ligado ? "volume" : "mute", 20);
    botaoSom.setAttribute("aria-label", ligado ? "Desligar o som" : "Ligar o som");
  }
  botaoSom.addEventListener("click", () => {
    if (telaAtual === "video" && !video.paused) video.muted = !video.muted;
    else if (musica.paused) { somLigado = true; tocarMusica(); }
    else { somLigado = false; musica.pause(); }
    setTimeout(atualizarBotaoSom, 60);
  });
  ["play", "pause"].forEach(ev => { musica.addEventListener(ev, atualizarBotaoSom); video.addEventListener(ev, atualizarBotaoSom); });

  /* ---------- Livrinho ---------- */
  let assinaturaLivro = "", paginaAtual = 0;
  function montarLivro() {
    const ids = P.tipo === "livrinho" ? P.midias.paginas : [];
    const assinatura = ids.map(id => url(id) + (ehVideo(id) ? "v" : "")).join("|");
    if (assinatura === assinaturaLivro) return;
    assinaturaLivro = assinatura;
    $("#livro").innerHTML = ids.map((id, i) => ehVideo(id)
      ? '<div class="pagina pagina-video" data-pagina="' + i + '" style="z-index:' + (ids.length - i) + '"><video src="' + S.esc(url(id)) + '" muted loop playsinline preload="metadata"></video></div>'
      : '<div class="pagina" data-pagina="' + i + '" style="z-index:' + (ids.length - i) + ';background-image:url(&quot;' + S.esc(url(id)) + '&quot;)"></div>').join("");
    mostrarPagina(Math.min(paginaAtual, Math.max(0, ids.length - 1)));
  }
  function mostrarPagina(n) {
    const total = P.midias.paginas.length;
    paginaAtual = Math.max(0, Math.min(n, total - 1));
    $$(".pagina").forEach((pg, i) => {
      pg.classList.toggle("virada", i < paginaAtual);
      const v = pg.querySelector("video");
      if (v) { if (i === paginaAtual && telaAtual === "livro") v.play().catch(() => {}); else v.pause(); }
    });
    avisarEditor({ tipo: "pagina-atual", n: paginaAtual, total });
    const ultima = paginaAtual >= total - 1;
    $('#tela-livro .dica').classList.toggle("some", ultima);
    if (ultima) terminar("livro"); else reiniciarTela("livro");
  }
  $("#livro").addEventListener("click", e => {
    if (posicionando) return;
    const r = $("#livro").getBoundingClientRect();
    const voltar = e.clientX < r.left + r.width * 0.3;
    mostrarPagina(paginaAtual + (voltar ? -1 : 1));
  });

  /* ---------- Revelação (raspadinha) ---------- */
  let raspado = false, contaRaspa = 0;
  function prepararRaspadinha(novo) {
    const cv = $("#raspadinha");
    const palco = $('[data-palco="revelacao"]');
    if (novo) { raspado = false; reiniciarTela("revelacao"); cv.classList.remove("some"); $("#dica-raspe").classList.remove("some"); }
    if (raspado) return;
    const w = palco.clientWidth, h = palco.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    const g = ctx.createLinearGradient(0, 0, w, h);
    const cor = P.cor || "#E8B8B1";
    g.addColorStop(0, "#F4E6E2"); g.addColorStop(.5, cor); g.addColorStop(1, "#D9C09A");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) {
      ctx.fillStyle = "rgba(255,255,255," + (Math.random() * .5).toFixed(2) + ")";
      ctx.beginPath(); ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 2.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = "rgba(42,29,31,.78)";
    ctx.textAlign = "center";
    ctx.font = "400 " + Math.round(Math.min(w, h) * .13) + "px 'Great Vibes', cursive";
    ctx.fillText(P.titulo || "Surpresa", w / 2, h / 2);
    ctx.font = "600 " + Math.round(Math.min(w, h) * .04) + "px Jost, sans-serif";
    ctx.fillText((P.opcoes.revelacao.texto || T.raspe).toUpperCase(), w / 2, h / 2 + Math.min(w, h) * .1);
    ctx.globalCompositeOperation = "destination-out";
  }
  (function () {
    const cv = $("#raspadinha");
    let raspando = false, ultimo = null;
    const ponto = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    function riscar(e) {
      const ctx = cv.getContext("2d");
      const [x, y] = ponto(e);
      const raio = Math.max(22, cv.clientWidth * 0.07);
      ctx.lineWidth = raio * 2; ctx.lineCap = "round";
      ctx.beginPath();
      if (ultimo) { ctx.moveTo(ultimo[0], ultimo[1]); ctx.lineTo(x, y); ctx.stroke(); }
      ctx.arc(x, y, raio, 0, Math.PI * 2); ctx.fill();
      ultimo = [x, y];
      if (++contaRaspa % 12 === 0) conferir();
    }
    function conferir() {
      /* Conta só a parte da raspadinha que aparece na tela do celular. */
      const r = cv.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const esc = cv.width / r.width;
      const x0 = Math.max(0, -r.left) * esc, x1 = Math.min(r.width, window.innerWidth - r.left) * esc;
      const y0 = Math.max(0, -r.top) * esc, y1 = Math.min(r.height, window.innerHeight - r.top) * esc;
      const w = Math.floor(x1 - x0), h = Math.floor(y1 - y0);
      if (w <= 0 || h <= 0) return;
      const d = cv.getContext("2d").getImageData(Math.floor(x0), Math.floor(y0), w, h).data;
      let limpos = 0, total = 0;
      for (let i = 3; i < d.length; i += 4 * 37) { total++; if (d[i] < 40) limpos++; }
      if (total && limpos / total > 0.5) revelar();
    }
    function revelar() {
      if (raspado) return;
      raspado = true;
      cv.classList.add("some");
      $("#dica-raspe").classList.add("some");
      terminar("revelacao");
      festa();
    }
    cv.addEventListener("pointerdown", e => { raspando = true; ultimo = null; cv.setPointerCapture(e.pointerId); $("#dica-raspe").classList.add("some"); riscar(e); });
    cv.addEventListener("pointermove", e => { if (raspando) riscar(e); });
    ["pointerup", "pointercancel"].forEach(ev => cv.addEventListener(ev, () => { raspando = false; ultimo = null; if (!raspado) conferir(); }));
  })();

  /* ---------- Quebra-cabeça ---------- */
  let assinaturaQuebra = "", ordem = [], escolhida = null;
  function montarQuebra() {
    if (P.tipo !== "quebracabeca") { $("#tabuleiro").innerHTML = ""; assinaturaQuebra = ""; return; }
    const n = Math.max(2, Math.min(5, parseInt(P.opcoes.quebra.pecas, 10) || 3));
    const u = url(P.midias.quebra) || url(P.midias.capa);
    const assinatura = n + "|" + u;
    if (assinatura === assinaturaQuebra) return;
    assinaturaQuebra = assinatura;
    ordem = Array.from({ length: n * n }, (_, i) => i);
    desenharQuebra();
    if (telaAtual === "quebra" && !posicionando) embaralhar();
  }
  function desenharQuebra() {
    const n = Math.round(Math.sqrt(ordem.length));
    const u = url(P.midias.quebra) || url(P.midias.capa);
    const tab = $("#tabuleiro");
    tab.style.gridTemplateColumns = "repeat(" + n + ",1fr)";
    tab.innerHTML = ordem.map((peca, lugar) => {
      const col = peca % n, lin = Math.floor(peca / n);
      return '<button type="button" class="peca" data-lugar="' + lugar + '" aria-label="Peça" style="background-image:url(&quot;' + S.esc(u) + '&quot;);background-size:' + n * 100 + "% " + n * 100 + "%;background-position:" + (n > 1 ? col / (n - 1) * 100 : 0) + "% " + (n > 1 ? lin / (n - 1) * 100 : 0) + '%"></button>';
    }).join("");
    const montado = ordem.every((p, i) => p === i);
    tab.classList.toggle("montado", montado);
  }
  function embaralhar() {
    reiniciarTela("quebra");
    $("#dica-quebra").classList.remove("some");
    const n = ordem.length;
    do {
      for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ordem[i], ordem[j]] = [ordem[j], ordem[i]]; }
    } while (n > 1 && ordem.every((p, i) => p === i));
    escolhida = null;
    desenharQuebra();
  }
  $("#tabuleiro").addEventListener("click", e => {
    const peca = e.target.closest(".peca");
    if (!peca || posicionando || $('[data-camada="quebra"]').classList.contains("terminou")) return;
    const lugar = +peca.dataset.lugar;
    if (escolhida === null) { escolhida = lugar; peca.classList.add("escolhida"); return; }
    if (escolhida !== lugar) { [ordem[escolhida], ordem[lugar]] = [ordem[lugar], ordem[escolhida]]; }
    escolhida = null;
    desenharQuebra();
    if (ordem.every((p, i) => p === i)) {
      $("#dica-quebra").classList.add("some");
      terminar("quebra");
      festa();
      avisar(T.montou);
    }
  });

  /* =========================================================
     Ações dos botões
     ========================================================= */
  const folha = $("#folha");
  function abrirFolha(icone, titulo, html) {
    $("#folha-icone").innerHTML = ic(icone, 24);
    $("#folha-titulo").textContent = titulo;
    $("#folha-corpo").innerHTML = html;
    $(".folha-fechar").innerHTML = ic("x", 18);
    folha.classList.add("aberta");
    folha.setAttribute("aria-hidden", "false");
    setTimeout(() => $(".folha-fechar").focus(), 50);
  }
  function fecharFolha() { folha.classList.remove("aberta"); folha.setAttribute("aria-hidden", "true"); }
  folha.addEventListener("click", e => { if (e.target.closest("[data-fechar]")) fecharFolha(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") { fecharFolha(); fecharVisor(); } });

  const bloco = t => '<p class="texto">' + S.esc(t) + "</p>";
  const linkSeguro = l => /^https?:\/\//i.test(String(l || "").trim()) ? String(l).trim() : "";

  function listaHTML(b) {
    const itens = (b.dados.itens || "").split("\n").map(l => l.trim()).filter(Boolean).map(l => {
      const [nome, preco, link] = l.split("|").map(s => (s || "").trim());
      return { nome, preco, link: linkSeguro(link) };
    });
    if (!itens.length) return bloco(T.emBreve);
    const numero = S.whatsappInternacional(b.dados.whatsapp);
    return '<div class="presentes">' + itens.map(it => {
      let preco = it.preco;
      const n = Number(String(preco).replace(/\./g, "").replace(",", "."));
      if (preco && !isNaN(n)) preco = n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      return '<div class="presente"><div class="presente-topo"><strong>' + S.esc(it.nome) + "</strong>" + (preco ? "<span>" + S.esc(preco) + "</span>" : "") + "</div>" +
        '<div class="presente-acoes">' +
        (it.link ? '<a class="btn pequeno" target="_blank" rel="noopener" href="' + S.esc(it.link) + '">' + ic("bag", 16) + S.esc(T.comprar) + "</a>" : "") +
        (numero ? '<button type="button" class="btn pequeno secundario" data-presentear="' + S.esc(it.nome) + '" data-numero="' + numero + '">' + ic("chat", 16) + S.esc(T.avisarPresente) + "</button>" : "") +
        "</div></div>";
    }).join("") + "</div>";
  }

  const CONTEUDO = {
    rsvp(b) {
      const r = b.dados;
      let h = "";
      if (r.prazo) h += '<p class="prazo">' + S.esc(T.confirmeAte) + " <strong>" + S.esc(S.dataCurta(r.prazo)) + "</strong></p>";
      h += '<form class="form" id="form-rsvp" data-botao-form="' + b.id + '" novalidate>' +
        "<label>" + S.esc(T.seuNome) + '<input name="nome" autocomplete="name" required placeholder="' + S.esc(T.nomeSobrenome) + '"></label>' +
        '<div class="escolha">' +
        '<label><input type="radio" name="resposta" value="sim" checked><span>' + S.esc(T.vou) + "</span></label>" +
        '<label><input type="radio" name="resposta" value="nao"><span>' + S.esc(T.naoVou) + "</span></label></div>";
      if (r.acompanhantes) h += '<div class="duas" id="qtd"><label>' + S.esc(T.adultos) + '<input name="adultos" type="number" min="0" max="30" value="1" inputmode="numeric"></label><label>' + S.esc(T.criancas) + '<input name="criancas" type="number" min="0" max="30" value="0" inputmode="numeric"></label></div>';
      h += "<label>" + S.esc(T.recado) + '<textarea name="recado" rows="3" placeholder="' + S.esc(T.recadoPh) + '"></textarea></label>' +
        '<p class="erro" id="erro-rsvp"></p>' +
        '<button class="btn" type="submit">' + ic("chat", 18) + S.esc(T.enviar) + "</button></form>";
      return h;
    },
    local(b) {
      const l = b.dados;
      const busca = [l.nome, l.endereco].filter(Boolean).join(", ");
      const maps = linkSeguro(l.mapa) || "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(busca);
      const waze = "https://waze.com/ul?q=" + encodeURIComponent(busca) + "&navigate=yes";
      let h = "";
      if (l.nome) h += '<p class="destaque-texto">' + S.esc(l.nome) + "</p>";
      if (l.endereco) h += '<p class="texto centro" style="margin-top:6px">' + S.esc(l.endereco) + "</p>";
      if (busca) h += '<div class="botoes"><a class="btn" target="_blank" rel="noopener" href="' + S.esc(maps) + '">' + ic("pin", 18) + S.esc(T.maps) + '</a><a class="btn secundario" target="_blank" rel="noopener" href="' + S.esc(waze) + '">' + ic("nav", 18) + S.esc(T.waze) + "</a></div>";
      return h || bloco(T.emBreve);
    },
    presentes(b) {
      let h = bloco(b.dados.texto || T.presencaPresente);
      const l = linkSeguro(b.dados.link);
      if (l) h += '<div class="botoes"><a class="btn" target="_blank" rel="noopener" href="' + S.esc(l) + '">' + ic("gift", 18) + S.esc(T.verLista) + "</a></div>";
      return h;
    },
    lista: b => listaHTML(b),
    pix(b) {
      const p = b.dados;
      let h = p.texto ? bloco(p.texto) : "";
      if (p.chave) {
        h += '<div class="chave-pix">' + ic("pix", 18) + "<span>" + S.esc(p.chave) + "</span></div>";
        if (p.nome) h += '<p class="centro" style="margin-top:8px;font-size:13px">' + S.esc(T.emNome) + " " + S.esc(p.nome) + "</p>";
        h += '<div class="botoes"><button type="button" class="btn" data-copiar="' + S.esc(p.chave) + '">' + ic("copy", 18) + S.esc(T.copiarPix) + "</button></div>";
      }
      return h || bloco(T.emBreve);
    },
    dresscode: b => '<p class="destaque-texto texto">' + S.esc(b.dados.texto || T.emBreve) + "</p>",
    info: b => bloco(b.dados.texto || T.emBreve),
    manual(b) {
      const itens = (b.dados.itens || "").split("\n").map(s => s.trim()).filter(Boolean);
      return itens.length ? '<ol class="lista-manual">' + itens.map(i => "<li>" + S.esc(i) + "</li>").join("") + "</ol>" : bloco(T.emBreve);
    },
    galeria() {
      return '<div class="galeria">' + P.midias.galeria.map(id => {
        const u = url(id);
        return u ? '<button type="button" data-foto="' + S.esc(u) + '" style="background-image:url(&quot;' + S.esc(u) + '&quot;)" aria-label="Ver foto"></button>' : "";
      }).join("") + "</div>";
    }
  };

  function acionar(b) {
    const nome = S.nomeDoBotao(b, P.idioma);
    if (b.acao === "link") { const l = linkSeguro(b.link); if (l) window.open(l, "_blank", "noopener"); return; }
    if (b.acao === "imagem") { if (url(b.imagem)) abrirVisor(url(b.imagem)); return; }
    if (b.acao === "texto") return abrirFolha(b.icone, nome, bloco(b.texto || T.emBreve));
    switch (b.tipo) {
      case "whatsapp": {
        const n = S.whatsappInternacional(b.dados.numero);
        if (n) window.open("https://wa.me/" + n + (b.dados.mensagem ? "?text=" + encodeURIComponent(b.dados.mensagem) : ""), "_blank", "noopener");
        return;
      }
      case "agenda": return baixarAgenda();
      case "rever": return tocarVideo(true);
      case "convite": return irPara("convite");
      case "personalizado": return abrirFolha(b.icone, nome, bloco(b.texto || T.emBreve));
      default:
        if (CONTEUDO[b.tipo]) abrirFolha(b.icone, nome, CONTEUDO[b.tipo](b));
    }
  }

  document.addEventListener("click", e => {
    if (posicionando) return;
    const bt = e.target.closest("[data-botao]");
    if (bt) { const b = P.botoes.find(x => x.id === bt.dataset.botao); if (b) acionar(b); return; }
    const cp = e.target.closest("[data-copiar]");
    if (cp) return copiar(cp.dataset.copiar);
    const f = e.target.closest("[data-foto]");
    if (f) return abrirVisor(f.dataset.foto);
    const pr = e.target.closest("[data-presentear]");
    if (pr) {
      const msg = T.querPresentear + ": " + pr.dataset.presentear + "\n" + [P.titulo, P.subtitulo].filter(Boolean).join(" ");
      window.open("https://wa.me/" + pr.dataset.numero + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
      return;
    }
    if (e.target.closest("[data-fechar-visor]") || e.target.id === "visor") fecharVisor();
  });

  document.addEventListener("change", e => {
    if (e.target.name === "resposta") { const q = $("#qtd"); if (q) q.style.display = e.target.value === "sim" ? "" : "none"; }
  });

  document.addEventListener("submit", e => {
    if (e.target.id !== "form-rsvp") return;
    e.preventDefault();
    const f = e.target;
    const b = P.botoes.find(x => x.id === f.dataset.botaoForm);
    const nome = f.nome.value.trim();
    if (nome.length < 2) { $("#erro-rsvp").textContent = T.escrevaNome; f.nome.focus(); return; }
    const vai = f.resposta.value === "sim";
    const linhas = ["*" + T.confirmacao + "*", [P.titulo, P.subtitulo].filter(Boolean).join(" "), "", T.nome + ": " + nome, T.resposta + ": " + (vai ? T.vou + " ✅" : T.naoVou)];
    if (vai && f.adultos) { linhas.push(T.adultos + ": " + (parseInt(f.adultos.value, 10) || 0)); linhas.push(T.criancas + ": " + (parseInt(f.criancas.value, 10) || 0)); }
    if (f.recado.value.trim()) linhas.push(T.recado.replace(/\s*\(.*\)/, "") + ": " + f.recado.value.trim());
    const numero = S.whatsappInternacional(b ? b.dados.whatsapp : "");
    window.open("https://wa.me/" + numero + "?text=" + encodeURIComponent(linhas.join("\n")), "_blank", "noopener");
    $("#folha-corpo").innerHTML = '<p class="destaque-texto">' + S.esc(vai ? T.obrigadoSim : T.obrigadoNao) + '</p><p class="texto centro" style="margin-top:8px">' + S.esc(T.abriuWhats) + "</p>";
  });

  function abrirVisor(u) {
    const v = $("#visor");
    v.querySelector("img").src = u;
    v.querySelector("button").innerHTML = ic("x", 20);
    v.classList.add("aberto");
  }
  function fecharVisor() { $("#visor").classList.remove("aberto"); }

  function avisar(txt) {
    const a = $("#aviso");
    a.textContent = txt;
    a.classList.add("visivel");
    clearTimeout(avisar.t);
    avisar.t = setTimeout(() => a.classList.remove("visivel"), 2600);
  }
  function copiar(txt) {
    const ok = () => avisar(T.pixCopiado);
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(ok).catch(antigo);
    else antigo();
    function antigo() {
      const t = document.createElement("textarea");
      t.value = txt; t.style.position = "fixed"; t.style.opacity = "0";
      document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); ok(); } catch (_) { avisar(T.naoCopiou); }
      t.remove();
    }
  }

  function baixarAgenda() {
    const ini = dataDoEvento();
    if (!ini) return;
    const fim = new Date(ini.getTime() + (P.hora ? 4 : 24) * 3600 * 1000);
    const f = d => d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0") + "T" + String(d.getHours()).padStart(2, "0") + String(d.getMinutes()).padStart(2, "0") + "00";
    const limpa = s => String(s || "").replace(/[\\,;]/g, m => "\\" + m).replace(/\n/g, "\\n");
    const titulo = [P.titulo, P.subtitulo].filter(Boolean).join(" ");
    const loc = P.botoes.find(b => b.on && b.tipo === "local");
    const local = loc ? [loc.dados.nome, loc.dados.endereco].filter(Boolean).join(", ") : "";
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Mary Criativa//Convites//PT", "BEGIN:VEVENT",
      "UID:" + P.id + "@marycriativa", "DTSTAMP:" + f(new Date()), "DTSTART:" + f(ini), "DTEND:" + f(fim),
      "SUMMARY:" + limpa(titulo), local ? "LOCATION:" + limpa(local) : "", "END:VEVENT", "END:VCALENDAR"].filter(Boolean).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = (titulo || "convite").replace(/[^\w\- ]+/g, "").trim() + ".ics";
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* =========================================================
     Efeitos (toque na tela e comemoração)
     ========================================================= */
  const CORES_CONFETE = ["#F4E6E2", "#E8B8B1", "#D9C09A", "#E58FA6", "#FFFFFF"];
  function particulas(x, y, qtd, tipo, forca) {
    const box = $("#efeitos");
    for (let i = 0; i < qtd; i++) {
      const el = document.createElement("span");
      const ang = Math.random() * Math.PI * 2;
      const dist = (forca || 60) * (0.5 + Math.random());
      el.className = "particula" + (tipo === "confete" ? " confete" : "");
      el.style.left = x + "px"; el.style.top = y + "px";
      el.style.setProperty("--dx", Math.cos(ang) * dist + "px");
      el.style.setProperty("--dy", Math.sin(ang) * dist - (tipo === "confete" ? 0 : 30) + "px");
      el.style.setProperty("--t", (tipo === "confete" ? 6 + Math.random() * 6 : 10 + Math.random() * 10) + "px");
      el.style.setProperty("--d", (0.8 + Math.random() * 0.7) + "s");
      el.style.setProperty("--r", (Math.random() * 540 - 270) + "deg");
      el.style.setProperty("--c", tipo === "coracoes" ? (Math.random() < .5 ? P.cor : "#F4E6E2") : CORES_CONFETE[i % CORES_CONFETE.length]);
      if (tipo === "coracoes") el.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/></svg>';
      if (tipo === "brilhos") el.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 1 14.4 9.6 23 12l-8.6 2.4L12 23l-2.4-8.6L1 12l8.6-2.4Z"/></svg>';
      box.appendChild(el);
      setTimeout(() => el.remove(), 1600);
    }
  }
  function festa() { particulas(window.innerWidth / 2, window.innerHeight * 0.45, 46, "confete", 190); }
  document.addEventListener("pointerdown", e => {
    if (!P || posicionando || !P.opcoes.efeito.on) return;
    particulas(e.clientX, e.clientY, 8, P.opcoes.efeito.tipo, 55);
  });

  /* =========================================================
     Modo posicionar: arrastar e redimensionar (só na prévia)
     ========================================================= */
  let selecionado = null, arrasto = null;
  const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
  const arred = v => Math.round(v * 100) / 100;

  document.addEventListener("pointerdown", e => {
    if (!posicionando) return;
    const el = e.target.closest(".bt-livre");
    if (!el) return;
    e.preventDefault();
    const b = P.botoes.find(x => x.id === el.dataset.botao);
    if (!b || !b.pos) return;
    $$(".bt-livre.selecionado").forEach(x => x.classList.remove("selecionado"));
    el.classList.add("selecionado");
    selecionado = b.id;
    avisarEditor({ tipo: "selecionar", id: b.id });
    const rect = el.parentElement.getBoundingClientRect();
    arrasto = { el, b, rect, x0: e.clientX, y0: e.clientY, pos: Object.assign({}, b.pos), redimensionar: !!e.target.closest("[data-alca]") };
    el.setPointerCapture(e.pointerId);
  });
  document.addEventListener("pointermove", e => {
    if (!arrasto) return;
    const a = arrasto;
    const dx = (e.clientX - a.x0) / a.rect.width * 100;
    const dy = (e.clientY - a.y0) / a.rect.height * 100;
    const p = a.b.pos;
    if (a.redimensionar) {
      p.w = limitar(a.pos.w + dx, 4, 100 - a.pos.x);
      p.h = limitar(a.pos.h + dy, 2.5, 100 - a.pos.y);
    } else {
      p.x = limitar(a.pos.x + dx, 0, 100 - a.pos.w);
      p.y = limitar(a.pos.y + dy, 0, 100 - a.pos.h);
    }
    Object.assign(a.el.style, { left: p.x + "%", top: p.y + "%", width: p.w + "%", height: p.h + "%" });
  });
  ["pointerup", "pointercancel"].forEach(ev => document.addEventListener(ev, () => {
    if (!arrasto) return;
    const p = arrasto.b.pos;
    ["x", "y", "w", "h"].forEach(k => { p[k] = arred(p[k]); });
    avisarEditor({ tipo: "posicao", id: arrasto.b.id, pos: Object.assign({}, p) });
    arrasto = null;
  }));

  function definirPosicionando(on) {
    posicionando = !!on;
    document.body.classList.toggle("posicionando", posicionando);
    if (posicionando) {
      fecharFolha(); fecharVisor();
      video.pause();
      if (telaAtual === "quebra") { ordem = ordem.map((_, i) => i); desenharQuebra(); }
      if (telaAtual === "livro") mostrarPagina(P.midias.paginas.length - 1);
    } else if (telaAtual === "revelacao") prepararRaspadinha(true);
    atualizarPilula();
    atualizarBotaoSom();
  }

  function irParaTelaDoEditor(tela) {
    if (!telas().includes(tela) && tela !== "convite") return;
    if (tela === "video") {
      if (!temVideo()) { avisar(T.enviarVideo); return; }
      if (posicionando) { reiniciarTela("video"); irPara("video"); video.pause(); video.currentTime = 0.01; return; }
      return tocarVideo(true);
    }
    if (tela === "quebra" && posicionando) { irPara("quebra"); ordem = ordem.map((_, i) => i); desenharQuebra(); return; }
    irPara(tela);
  }

  /* =========================================================
     Início
     ========================================================= */
  function pronto() { $("#carregando").classList.add("some"); }
  const pendente = { tela: "", posicionar: false };

  async function iniciar() {
    if (window.CONVITE_EXPORTADO) {
      const d = window.CONVITE_EXPORTADO;
      P = S.completar(d.projeto); U = d.midias || {}; M = d.marca || null;
      aplicar(); telaInicial(); pronto();
      return;
    }
    if (modoPrevia) {
      window.addEventListener("message", e => {
        if (e.origin !== location.origin || !e.data) return;
        const d = e.data;
        if (d.tipo === "projeto") {
          const primeira = !P;
          P = S.completar(d.projeto); U = d.urls || {}; M = d.marca || null;
          aplicar();
          if (primeira) {
            telaInicial(); pronto();
            if (pendente.posicionar) definirPosicionando(true);
            if (pendente.tela) irParaTelaDoEditor(pendente.tela);
          }
        }
        /* Pedidos que chegam antes do projeto ficam guardados. */
        if (!P) {
          if (d.tipo === "tela") pendente.tela = d.tela;
          if (d.tipo === "posicionar") pendente.posicionar = d.on;
          return;
        }
        if (d.tipo === "tela") irParaTelaDoEditor(d.tela);
        if (d.tipo === "posicionar") definirPosicionando(d.on);
        if (d.tipo === "pagina" && telaAtual === "livro") mostrarPagina(d.n);
        if (d.tipo === "selecionar") {
          selecionado = d.id;
          $$(".bt-livre").forEach(x => x.classList.toggle("selecionado", x.dataset.botao === d.id));
        }
        if (d.tipo === "video-ir" && telaAtual === "video") {
          video.pause();
          if (d.onde === "final" && isFinite(video.duration)) { video.currentTime = Math.max(0, video.duration - 0.05); terminar("video"); }
          else { video.currentTime = 0.01; reiniciarTela("video"); }
        }
      });
      avisarEditor({ tipo: "previa-pronta" });
      return;
    }
    const id = params.get("id");
    P = id ? await S.obterProjeto(id) : null;
    if (!P) {
      pronto();
      document.body.innerHTML = '<div class="vazio-previa">Este convite não foi encontrado neste aparelho.<br>Abra pelo Estúdio de Convites ou use o arquivo exportado.</div>';
      return;
    }
    U = await S.urlsDoProjeto(P);
    const marca = await S.lerMarca();
    M = { nome: marca.nome, mostrar: marca.mostrar, logo: await S.urlMidia(marca.logo) };
    aplicar(); telaInicial(); pronto();
  }

  iniciar().catch(err => { console.error(err); pronto(); });
})();
