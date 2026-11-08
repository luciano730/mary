/* Convite cinematográfico: abertura, vídeo em tela cheia e informações.
   Abre de três jeitos:
   1. convite.html?id=...      lê o projeto salvo neste navegador
   2. convite.html?previa=1    recebe os dados do editor (celular de prévia)
   3. arquivo exportado        os dados vêm embutidos em window.CONVITE_EXPORTADO */
(function () {
  "use strict";
  const S = window.Store;
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const ic = S.icone;

  const params = new URLSearchParams(location.search);
  const modoPrevia = params.get("previa") === "1";

  let P = null;          // projeto
  let U = {};            // id da mídia -> url
  let telaAtual = "";
  let relogio = null;
  let somLigado = true;

  const video = $("#video");
  const musica = $("#musica");
  const botaoSom = $("#botao-som");

  /* ---------- Montagem da página ---------- */
  function urlDe(id) { return id ? (U[id] || "") : ""; }

  function aplicar() {
    const sec = P.secoes;
    document.documentElement.style.setProperty("--cor", P.cor || "#E8789F");
    document.title = [P.titulo, P.subtitulo].filter(Boolean).join(" · ") || "Convite";

    const capa = urlDe(P.midias.capa);
    $$("[data-capa]").forEach(el => { el.style.backgroundImage = capa ? 'url("' + capa + '")' : ""; });
    $$("[data-titulo]").forEach(el => { el.textContent = P.titulo || "Seu nome aqui"; });
    $$("[data-subtitulo]").forEach(el => { el.textContent = P.subtitulo || ""; });
    $("[data-texto-abrir]").textContent = sec.abertura.texto || "Toque para abrir";
    $("#data-evento").textContent = S.dataLonga(P.data, P.hora);
    $("#mensagem").textContent = P.mensagem || "";

    const urlVideo = sec.video.on ? urlDe(P.midias.video) : "";
    if (video.getAttribute("src") !== urlVideo) {
      if (urlVideo) video.setAttribute("src", urlVideo); else video.removeAttribute("src");
      video.load();
    }
    const btnPular = $("#botao-pular");
    btnPular.innerHTML = "Pular " + ic("skip", 14);
    btnPular.hidden = !sec.video.pular;

    const urlMusica = sec.musica.on ? urlDe(P.midias.musica) : "";
    if (musica.getAttribute("src") !== urlMusica) {
      if (urlMusica) musica.setAttribute("src", urlMusica); else { musica.pause(); musica.removeAttribute("src"); }
      musica.load();
      if (urlMusica && telaAtual === "principal" && somLigado) tocarMusica();
    }

    montarAcoes();
    montarGrade();
    iniciarContagem();
    atualizarBotaoSom();
  }

  function temVideo() { return P.secoes.video.on && !!urlDe(P.midias.video); }
  function temMusica() { return P.secoes.musica.on && !!urlDe(P.midias.musica); }

  function montarAcoes() {
    const box = $("#acoes-rapidas");
    let html = "";
    if (temVideo()) html += '<button type="button" data-acao="rever">' + ic("replay", 16) + "Rever vídeo</button>";
    if (P.data) html += '<button type="button" data-acao="agenda">' + ic("calendar", 16) + "Salvar na agenda</button>";
    box.innerHTML = html;
  }

  function montarGrade() {
    const sec = P.secoes;
    const itens = [];
    if (sec.rsvp.on) itens.push({ id: "rsvp", nome: "Confirmar presença", icone: "check", destaque: true });
    S.SECOES.forEach(s => {
      if (!sec[s.id] || !sec[s.id].on) return;
      if (["abertura", "video", "musica", "contagem", "rsvp"].includes(s.id)) return;
      if (s.id === "galeria" && !P.midias.galeria.length) return;
      itens.push({ id: s.id, nome: s.nome, icone: s.icone });
    });
    $("#grade-secoes").innerHTML = itens.map(i =>
      '<button type="button" data-secao="' + i.id + '"' + (i.destaque ? ' class="destaque"' : "") + ">" +
      '<span class="bolha">' + ic(i.icone, i.destaque ? 20 : 22) + "</span>" + S.esc(i.nome) + "</button>"
    ).join("");
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
    if (!P.secoes.contagem.on || !alvo) { box.innerHTML = ""; return; }
    const desenhar = () => {
      const falta = alvo - new Date();
      if (falta <= 0) {
        const mesmoDia = new Date().toDateString() === alvo.toDateString();
        box.innerHTML = "<p>" + (mesmoDia ? "É hoje!" : "Obrigado por celebrar com a gente") + "</p>";
        clearInterval(relogio);
        return;
      }
      const seg = Math.floor(falta / 1000);
      const partes = [[Math.floor(seg / 86400), "dias"], [Math.floor(seg % 86400 / 3600), "horas"], [Math.floor(seg % 3600 / 60), "min"], [seg % 60, "seg"]];
      box.innerHTML = partes.map(([n, r]) => "<div><strong>" + String(n).padStart(2, "0") + "</strong><small>" + r + "</small></div>").join("");
    };
    desenhar();
    relogio = setInterval(desenhar, 1000);
  }

  /* ---------- Telas ---------- */
  function irPara(tela) {
    telaAtual = tela;
    $$(".tela").forEach(t => t.classList.remove("ativa"));
    $("#tela-" + tela).classList.add("ativa");
    window.scrollTo(0, 0);
    if (tela !== "video") video.pause();
    if (tela === "principal") { if (somLigado) tocarMusica(); }
    else musica.pause();
    atualizarBotaoSom();
    if (modoPrevia) window.parent.postMessage({ tipo: "tela-atual", tela }, location.origin);
  }

  function tocarVideo(comSom) {
    irPara("video");
    video.currentTime = 0;
    video.muted = !comSom;
    const p = video.play();
    if (p && p.catch) p.catch(() => { video.muted = true; video.play().catch(() => {}); atualizarBotaoSom(); });
    atualizarBotaoSom();
  }

  function abrirConvite() {
    if (temVideo()) tocarVideo(true);
    else irPara("principal");
  }

  function tocarMusica() {
    if (!temMusica()) return;
    const p = musica.play();
    if (p && p.catch) p.catch(() => { somLigado = false; atualizarBotaoSom(); });
  }

  function atualizarBotaoSom() {
    let visivel = false, ligado = false;
    if (telaAtual === "video") { visivel = true; ligado = !video.muted; }
    else if (telaAtual === "principal" && temMusica()) { visivel = true; ligado = !musica.paused; }
    botaoSom.classList.toggle("visivel", visivel);
    botaoSom.innerHTML = ic(ligado ? "volume" : "mute", 20);
    botaoSom.setAttribute("aria-label", ligado ? "Desligar o som" : "Ligar o som");
  }

  botaoSom.addEventListener("click", () => {
    if (telaAtual === "video") video.muted = !video.muted;
    else if (musica.paused) { somLigado = true; tocarMusica(); }
    else { somLigado = false; musica.pause(); }
    setTimeout(atualizarBotaoSom, 60);
  });
  musica.addEventListener("play", atualizarBotaoSom);
  musica.addEventListener("pause", atualizarBotaoSom);

  $("#botao-abrir").addEventListener("click", abrirConvite);
  $("#botao-pular").addEventListener("click", () => irPara("principal"));
  video.addEventListener("ended", () => irPara("principal"));
  video.addEventListener("error", () => { if (telaAtual === "video") irPara("principal"); });

  /* ---------- Folha com o conteúdo de cada botão ---------- */
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
  function fecharFolha() {
    folha.classList.remove("aberta");
    folha.setAttribute("aria-hidden", "true");
  }
  folha.addEventListener("click", e => { if (e.target.closest("[data-fechar]")) fecharFolha(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") { fecharFolha(); fecharVisor(); } });

  const textoBloco = t => '<p class="texto">' + S.esc(t) + "</p>";

  const CONTEUDO = {
    rsvp() {
      const r = P.secoes.rsvp;
      let h = "";
      if (r.prazo) h += '<p class="prazo">Confirme até <strong>' + S.esc(S.dataCurta(r.prazo)) + "</strong></p>";
      h += '<form class="form" id="form-rsvp" novalidate>' +
        '<label>Seu nome<input name="nome" autocomplete="name" required placeholder="Nome e sobrenome"></label>' +
        '<div class="escolha">' +
        '<label><input type="radio" name="resposta" value="sim" checked><span>Vou comparecer</span></label>' +
        '<label><input type="radio" name="resposta" value="nao"><span>Não poderei ir</span></label></div>';
      if (r.acompanhantes) h += '<div class="duas" id="qtd"><label>Adultos<input name="adultos" type="number" min="0" max="30" value="1" inputmode="numeric"></label><label>Crianças<input name="criancas" type="number" min="0" max="30" value="0" inputmode="numeric"></label></div>';
      h += '<label>Recado (opcional)<textarea name="recado" rows="3" placeholder="Deixe uma mensagem carinhosa"></textarea></label>' +
        '<p class="erro" id="erro-rsvp"></p>' +
        '<button class="btn" type="submit">' + ic("chat", 18) + "Enviar confirmação</button></form>";
      return { icone: "check", titulo: "Confirmar presença", html: h };
    },
    local() {
      const l = P.secoes.local;
      const busca = [l.nome, l.endereco].filter(Boolean).join(", ");
      const maps = l.mapa && /^https?:\/\//i.test(l.mapa) ? l.mapa : "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(busca);
      const waze = "https://waze.com/ul?q=" + encodeURIComponent(busca) + "&navigate=yes";
      let h = "";
      if (l.nome) h += '<p class="destaque-texto">' + S.esc(l.nome) + "</p>";
      if (l.endereco) h += '<p class="texto centro" style="margin-top:6px">' + S.esc(l.endereco) + "</p>";
      if (busca) h += '<div class="botoes"><a class="btn" target="_blank" rel="noopener" href="' + S.esc(maps) + '">' + ic("pin", 18) + 'Abrir no Google Maps</a><a class="btn secundario" target="_blank" rel="noopener" href="' + S.esc(waze) + '">' + ic("nav", 18) + "Ir com o Waze</a></div>";
      return { icone: "pin", titulo: "Localização", html: h || textoBloco("Endereço em breve.") };
    },
    presentes() {
      const p = P.secoes.presentes;
      let h = p.texto ? textoBloco(p.texto) : textoBloco("Sua presença é o nosso maior presente!");
      if (p.link && /^https?:\/\//i.test(p.link)) h += '<div class="botoes"><a class="btn" target="_blank" rel="noopener" href="' + S.esc(p.link) + '">' + ic("gift", 18) + "Ver lista de presentes</a></div>";
      return { icone: "gift", titulo: "Sugestão de presente", html: h };
    },
    pix() {
      const p = P.secoes.pix;
      let h = p.texto ? textoBloco(p.texto) : "";
      if (p.chave) {
        h += '<div class="chave-pix">' + ic("pix", 18) + "<span>" + S.esc(p.chave) + "</span></div>";
        if (p.nome) h += '<p class="centro" style="margin-top:8px;font-size:12px">Em nome de ' + S.esc(p.nome) + "</p>";
        h += '<div class="botoes"><button type="button" class="btn" data-copiar="' + S.esc(p.chave) + '">' + ic("copy", 18) + "Copiar chave Pix</button></div>";
      }
      return { icone: "pix", titulo: "Pix", html: h || textoBloco("Chave Pix em breve.") };
    },
    dresscode() { return { icone: "shirt", titulo: "Dress code", html: '<p class="destaque-texto texto">' + S.esc(P.secoes.dresscode.texto || "Em breve") + "</p>" }; },
    info() { return { icone: "info", titulo: "Informações", html: textoBloco(P.secoes.info.texto || "Em breve.") }; },
    manual() {
      const itens = (P.secoes.manual.itens || "").split("\n").map(s => s.trim()).filter(Boolean);
      const h = itens.length ? '<ol class="lista-manual">' + itens.map(i => "<li>" + S.esc(i) + "</li>").join("") + "</ol>" : textoBloco("Em breve.");
      return { icone: "book", titulo: "Manual do convidado", html: h };
    },
    galeria() {
      const h = '<div class="galeria">' + P.midias.galeria.map(id => {
        const u = urlDe(id);
        return u ? '<button type="button" data-foto="' + S.esc(u) + '" style="background-image:url(&quot;' + S.esc(u) + '&quot;)" aria-label="Ver foto"></button>' : "";
      }).join("") + "</div>";
      return { icone: "image", titulo: "Galeria de fotos", html: h };
    }
  };

  function abrirSecao(id) {
    const c = CONTEUDO[id] && CONTEUDO[id]();
    if (c) abrirFolha(c.icone, c.titulo, c.html);
  }

  document.addEventListener("click", e => {
    const b = e.target.closest("[data-secao]");
    if (b) return abrirSecao(b.dataset.secao);
    const a = e.target.closest("[data-acao]");
    if (a && a.dataset.acao === "rever") return tocarVideo(true);
    if (a && a.dataset.acao === "agenda") return baixarAgenda();
    const cp = e.target.closest("[data-copiar]");
    if (cp) return copiar(cp.dataset.copiar);
    const f = e.target.closest("[data-foto]");
    if (f) return abrirVisor(f.dataset.foto);
    if (e.target.closest("[data-fechar-visor]") || e.target.id === "visor") fecharVisor();
  });

  document.addEventListener("change", e => {
    if (e.target.name === "resposta") {
      const q = $("#qtd");
      if (q) q.style.display = e.target.value === "sim" ? "" : "none";
    }
  });

  document.addEventListener("submit", e => {
    if (e.target.id !== "form-rsvp") return;
    e.preventDefault();
    const f = e.target;
    const nome = f.nome.value.trim();
    const erro = $("#erro-rsvp");
    if (nome.length < 2) { erro.textContent = "Escreva seu nome para confirmar."; f.nome.focus(); return; }
    erro.textContent = "";
    const vai = f.resposta.value === "sim";
    const linhas = [
      "*Confirmação de presença*",
      [P.titulo, P.subtitulo].filter(Boolean).join(" "),
      "",
      "Nome: " + nome,
      "Resposta: " + (vai ? "Vou comparecer ✅" : "Não poderei ir")
    ];
    if (vai && f.adultos) {
      linhas.push("Adultos: " + (parseInt(f.adultos.value, 10) || 0));
      linhas.push("Crianças: " + (parseInt(f.criancas.value, 10) || 0));
    }
    if (f.recado.value.trim()) linhas.push("Recado: " + f.recado.value.trim());
    const numero = S.whatsappInternacional(P.secoes.rsvp.whatsapp);
    const url = "https://wa.me/" + numero + "?text=" + encodeURIComponent(linhas.join("\n"));
    window.open(url, "_blank", "noopener");
    $("#folha-corpo").innerHTML = '<p class="destaque-texto">' + (vai ? "Obrigado, até a festa!" : "Obrigado por avisar!") + '</p><p class="texto centro" style="margin-top:8px">Sua resposta abriu no WhatsApp. É só tocar em enviar.</p>';
  });

  function abrirVisor(url) {
    const v = $("#visor");
    v.querySelector("img").src = url;
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
    const ok = () => avisar("Chave Pix copiada!");
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(txt).then(ok).catch(copiarAntigo);
    } else copiarAntigo();
    function copiarAntigo() {
      const t = document.createElement("textarea");
      t.value = txt; t.style.position = "fixed"; t.style.opacity = "0";
      document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); ok(); } catch (_) { avisar("Não deu para copiar. Segure o texto para copiar."); }
      t.remove();
    }
  }

  /* Arquivo .ics: abre no calendário do celular. */
  function baixarAgenda() {
    const ini = dataDoEvento();
    if (!ini) return;
    const fim = new Date(ini.getTime() + (P.hora ? 4 : 24) * 3600 * 1000);
    const f = d => d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0") + "T" + String(d.getHours()).padStart(2, "0") + String(d.getMinutes()).padStart(2, "0") + "00";
    const limpa = s => String(s || "").replace(/[\\,;]/g, m => "\\" + m).replace(/\n/g, "\\n");
    const titulo = [P.titulo, P.subtitulo].filter(Boolean).join(" ");
    const local = [P.secoes.local.nome, P.secoes.local.endereco].filter(Boolean).join(", ");
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Mary Criativa//Convites//PT", "BEGIN:VEVENT",
      "UID:" + P.id + "@marycriativa", "DTSTAMP:" + f(new Date()), "DTSTART:" + f(ini), "DTEND:" + f(fim),
      "SUMMARY:" + limpa(titulo), P.secoes.local.on && local ? "LOCATION:" + limpa(local) : "",
      "END:VEVENT", "END:VCALENDAR"].filter(Boolean).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = (titulo || "convite").replace(/[^\w\- ]+/g, "").trim() + ".ics";
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* ---------- Início ---------- */
  function pronto() { $("#carregando").classList.add("some"); }

  function telaInicial() {
    if (P.secoes.abertura.on) irPara("abertura");
    else if (temVideo()) tocarVideo(false);
    else irPara("principal");
  }

  async function iniciar() {
    if (window.CONVITE_EXPORTADO) {
      P = S.completar(window.CONVITE_EXPORTADO.projeto);
      U = window.CONVITE_EXPORTADO.midias || {};
      aplicar(); telaInicial(); pronto();
      return;
    }
    if (modoPrevia) {
      window.addEventListener("message", e => {
        if (e.origin !== location.origin || !e.data) return;
        if (e.data.tipo === "projeto") {
          const primeira = !P;
          P = S.completar(e.data.projeto);
          U = e.data.urls || {};
          aplicar();
          if (primeira) { telaInicial(); pronto(); }
        }
        if (e.data.tipo === "tela" && P) {
          if (e.data.tela === "video") { if (temVideo()) tocarVideo(true); else avisar("Envie o vídeo para ver esta parte"); }
          else irPara(e.data.tela);
        }
      });
      window.parent.postMessage({ tipo: "previa-pronta" }, location.origin);
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
    aplicar(); telaInicial(); pronto();
  }

  iniciar().catch(err => { console.error(err); pronto(); });
})();
