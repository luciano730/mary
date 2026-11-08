/* Editor do convite cinematográfico. Salva sozinho e atualiza o celular de prévia. */
(function () {
  "use strict";
  const S = window.Store;
  const UI = window.UI;
  const ic = S.icone;
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  /* Limites por arquivo. O convite exportado leva tudo junto, então
     arquivos leves deixam o link abrindo rápido no celular. */
  const LIMITES = {
    capa: { aceita: "image/", mb: 15, nome: "imagem" },
    galeria: { aceita: "image/", mb: 15, nome: "imagem" },
    video: { aceita: "video/", mb: 80, nome: "vídeo" },
    musica: { aceita: "audio/", mb: 20, nome: "música" }
  };
  const RECOMENDADO_MB = 40;

  /* Campos extras de cada parte do convite. */
  const CAMPOS = {
    abertura: [{ c: "texto", l: "Texto do botão", ph: "Toque para abrir", max: 30 }],
    video: [{ midia: "video", l: "Vídeo (MP4, de preferência vertical)" }, { c: "pular", l: 'Mostrar botão "Pular"', t: "check" }],
    musica: [{ midia: "musica", l: "Música (MP3)" }],
    contagem: [],
    rsvp: [
      { c: "whatsapp", l: "WhatsApp que recebe as confirmações", ph: "(65) 99999-9999", t: "tel" },
      { c: "prazo", l: "Confirmar até (opcional)", t: "date" },
      { c: "acompanhantes", l: "Perguntar quantos adultos e crianças", t: "check" }
    ],
    local: [
      { c: "nome", l: "Nome do local", ph: "Ex.: Espaço Jardim das Flores", max: 80 },
      { c: "endereco", l: "Endereço completo", ph: "Rua, número, bairro, cidade", t: "area" },
      { c: "mapa", l: "Link do Google Maps (opcional)", ph: "https://maps.app.goo.gl/..." }
    ],
    presentes: [
      { c: "texto", l: "Mensagem", ph: "Ex.: Sua presença é o melhor presente! Se quiser me presentear...", t: "area" },
      { c: "link", l: "Link da lista de presentes (opcional)", ph: "https://..." }
    ],
    pix: [
      { c: "chave", l: "Chave Pix", ph: "CPF, celular, e-mail ou chave aleatória" },
      { c: "nome", l: "Nome de quem recebe", ph: "Ex.: Ana Paula Souza" },
      { c: "texto", l: "Mensagem (opcional)", t: "area" }
    ],
    dresscode: [{ c: "texto", l: "Traje", ph: "Ex.: Esporte fino. Evite branco.", t: "area" }],
    info: [{ c: "texto", l: "Informações", ph: "Ex.: Haverá estacionamento no local.", t: "area" }],
    manual: [{ c: "itens", l: "Uma regra por linha", ph: "Chegue no horário\nDance muito\nNão use branco", t: "area" }],
    galeria: [{ midia: "galeria", l: "Fotos" }]
  };

  let P = null;
  let previaPronta = false;
  let telaPrevia = "abertura";

  const pegar = (o, caminho) => caminho.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
  function definir(o, caminho, valor) {
    const partes = caminho.split(".");
    const ultimo = partes.pop();
    partes.reduce((a, k) => a[k], o)[ultimo] = valor;
  }

  /* ---------- Salvar ---------- */
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

  /* ---------- Prévia ---------- */
  let timerPrevia = null;
  function enviarPrevia() {
    clearTimeout(timerPrevia);
    timerPrevia = setTimeout(async () => {
      if (!previaPronta) return;
      const urls = await S.urlsDoProjeto(P);
      $("#previa").contentWindow.postMessage({ tipo: "projeto", projeto: JSON.parse(JSON.stringify(P)), urls }, location.origin);
    }, 120);
  }
  window.addEventListener("message", e => {
    if (e.origin !== location.origin || !e.data) return;
    if (e.data.tipo === "previa-pronta") {
      previaPronta = true;
      enviarPrevia();
    }
    if (e.data.tipo === "tela-atual") {
      telaPrevia = e.data.tela;
      marcarAba();
    }
  });
  function mostrarTela(tela) {
    telaPrevia = tela;
    marcarAba();
    $("#previa").contentWindow.postMessage({ tipo: "tela", tela }, location.origin);
  }
  function marcarAba() { $$(".abas-previa button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.tela === telaPrevia))); }
  $$(".abas-previa button").forEach(b => b.addEventListener("click", () => mostrarTela(b.dataset.tela)));

  $("#ver-previa").innerHTML = ic("phone", 16) + "Ver no celular";
  $("#fechar-previa").innerHTML = ic("x", 16) + "Voltar a editar";
  $("#ver-previa").addEventListener("click", () => document.body.classList.add("vendo-previa"));
  $("#fechar-previa").addEventListener("click", () => document.body.classList.remove("vendo-previa"));

  /* ---------- Topo e pendências ---------- */
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

  /* ---------- Cores ---------- */
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
  $("#cores").addEventListener("click", e => {
    const b = e.target.closest("[data-cor]");
    if (!b) return;
    P.cor = b.dataset.cor;
    marcarCor();
    agendarSalvar();
  });
  $("#cores").addEventListener("input", e => {
    if (e.target.id !== "cor-livre") return;
    P.cor = e.target.value;
    marcarCor();
    agendarSalvar();
  });

  /* ---------- Partes do convite ---------- */
  function campoHTML(id, f) {
    if (f.midia) return '<div class="campo largo"><span>' + S.esc(f.l) + "</span><div data-slot-" + f.midia + "></div></div>";
    const caminho = "secoes." + id + "." + f.c;
    if (f.t === "check") return '<label class="check"><input type="checkbox" data-campo="' + caminho + '">' + S.esc(f.l) + "</label>";
    const ph = f.ph ? ' placeholder="' + S.esc(f.ph) + '"' : "";
    const max = f.max ? ' maxlength="' + f.max + '"' : "";
    if (f.t === "area") return '<label class="campo"><span>' + S.esc(f.l) + '</span><textarea data-campo="' + caminho + '"' + ph + ' maxlength="1200"></textarea></label>';
    const tipo = f.t === "tel" ? ' type="tel" inputmode="tel"' : f.t === "date" ? ' type="date"' : "";
    return '<label class="campo"><span>' + S.esc(f.l) + '</span><input data-campo="' + caminho + '"' + tipo + ph + max + "></label>";
  }
  function montarSecoes() {
    $("#secoes").innerHTML = S.SECOES.map(s => {
      const campos = (CAMPOS[s.id] || []).map(f => campoHTML(s.id, f)).join("");
      return '<div class="secao" data-secao="' + s.id + '">' +
        '<div class="secao-topo">' +
        '<span class="bolha">' + ic(s.icone, 18) + "</span>" +
        '<div class="secao-nome"><strong id="sec-' + s.id + '">' + S.esc(s.nome) + "</strong><small>" + S.esc(s.ajuda) + "</small></div>" +
        '<label class="chave"><input type="checkbox" data-campo="secoes.' + s.id + '.on" aria-labelledby="sec-' + s.id + '"><i></i></label>' +
        "</div>" +
        '<div class="secao-corpo">' + (campos ? '<div class="campos">' + campos + "</div>" : "") + "</div>" +
        "</div>";
    }).join("");
  }
  function marcarSecoes() {
    S.SECOES.forEach(s => {
      const el = document.querySelector('[data-secao="' + s.id + '"]');
      if (el) el.classList.toggle("ligada", !!P.secoes[s.id].on);
    });
  }

  /* ---------- Ligação dos campos com o projeto ---------- */
  function preencherCampos() {
    $$("[data-campo]").forEach(el => {
      const v = pegar(P, el.dataset.campo);
      if (el.type === "checkbox") el.checked = !!v;
      else el.value = v == null ? "" : v;
    });
    marcarSecoes();
  }
  document.addEventListener("input", e => {
    const el = e.target.closest("[data-campo]");
    if (!el) return;
    definir(P, el.dataset.campo, el.type === "checkbox" ? el.checked : el.value);
    if (el.dataset.campo.endsWith(".on")) marcarSecoes();
    agendarSalvar();
  });
  /* Alguns navegadores só avisam "change" em checkbox e data. */
  document.addEventListener("change", e => {
    const el = e.target.closest("[data-campo]");
    if (!el || (el.type !== "checkbox" && el.type !== "date" && el.type !== "time")) return;
    const v = el.type === "checkbox" ? el.checked : el.value;
    if (pegar(P, el.dataset.campo) === v) return;
    definir(P, el.dataset.campo, v);
    marcarSecoes();
    agendarSalvar();
  });

  /* ---------- Mídias ---------- */
  async function montarSlot(slot) {
    const alvo = document.querySelector("[data-slot-" + slot + "]");
    if (!alvo) return;
    const lim = LIMITES[slot];
    const multi = slot === "galeria";
    const id = multi ? null : P.midias[slot];
    const m = id ? await S.obterMidia(id) : null;
    const url = id ? await S.urlMidia(id) : "";

    let mini = ic(slot === "musica" ? "music" : slot === "video" ? "film" : "image", 22);
    let estilo = "";
    if (url && slot === "capa") { mini = ""; estilo = ' style="background-image:url(&quot;' + url + '&quot;)"'; }
    if (url && slot === "video") mini = '<video src="' + url + '#t=0.5" muted playsinline preload="metadata"></video>';

    const titulo = m ? S.esc(m.nome) : multi ? "Adicione fotos" : "Nenhum arquivo";
    const detalhe = m ? S.formatarTamanho(m.tamanho) : multi ? P.midias.galeria.length + " foto(s) · até " + lim.mb + " MB cada" : "Até " + lim.mb + " MB · toque ou arraste aqui";
    let html = '<div class="midia" data-midia="' + slot + '">' +
      '<span class="midia-miniatura"' + estilo + ">" + mini + "</span>" +
      '<span class="midia-texto"><strong>' + titulo + "</strong>" + detalhe + "</span>" +
      '<label class="btn btn-linha">' + ic(m ? "replay" : "upload", 15) + (multi ? "Adicionar" : m ? "Trocar" : "Enviar") +
      '<input type="file" accept="' + lim.aceita + '*"' + (multi ? " multiple" : "") + ' data-arquivo="' + slot + '"></label>' +
      (m ? '<button type="button" class="btn-icone" data-remover="' + slot + '" aria-label="Remover arquivo" title="Remover">' + ic("trash", 16) + "</button>" : "") +
      "</div>";

    if (multi && P.midias.galeria.length) {
      const fotos = await Promise.all(P.midias.galeria.map(async gid =>
        '<div style="background-image:url(&quot;' + (await S.urlMidia(gid)) + '&quot;)"><button type="button" data-remover-foto="' + gid + '" aria-label="Remover foto">' + ic("x", 12) + "</button></div>"));
      html += '<div class="galeria-editor">' + fotos.join("") + "</div>";
    }
    alvo.innerHTML = html;
  }
  async function montarSlots() {
    await Promise.all(["capa", "video", "musica", "galeria"].map(montarSlot));
    atualizarUso();
  }

  async function receberArquivos(slot, arquivos) {
    const lim = LIMITES[slot];
    const lista = Array.from(arquivos || []);
    if (!lista.length) return;
    for (const arq of lista) {
      if (!arq.type.startsWith(lim.aceita)) { UI.toast(arq.name + " não é um arquivo de " + lim.nome + ".", true); continue; }
      if (arq.size > lim.mb * 1024 * 1024) { UI.toast(arq.name + " passou de " + lim.mb + " MB. Use um arquivo mais leve.", true); continue; }
      try {
        const m = await S.salvarMidia(arq);
        if (slot === "galeria") P.midias.galeria.push(m.id);
        else {
          const antigo = P.midias[slot];
          P.midias[slot] = m.id;
          if (antigo) await S.excluirMidia(antigo);
        }
      } catch (e) {
        console.error(e);
        UI.toast("Não consegui guardar " + arq.name + ". O aparelho pode estar sem espaço.", true);
      }
    }
    if (slot === "video" && P.midias.video) { P.secoes.video.on = true; preencherCampos(); }
    if (slot === "musica" && P.midias.musica) { P.secoes.musica.on = true; preencherCampos(); }
    if (slot === "galeria" && P.midias.galeria.length) { P.secoes.galeria.on = true; preencherCampos(); }
    await montarSlot(slot);
    atualizarUso();
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
    const rem = e.target.closest("[data-remover]");
    if (rem) {
      const slot = rem.dataset.remover;
      const id = P.midias[slot];
      P.midias[slot] = null;
      await S.excluirMidia(id);
      await montarSlot(slot);
      atualizarUso();
      agendarSalvar();
    }
    const remFoto = e.target.closest("[data-remover-foto]");
    if (remFoto) {
      const id = remFoto.dataset.removerFoto;
      P.midias.galeria = P.midias.galeria.filter(x => x !== id);
      await S.excluirMidia(id);
      await montarSlot("galeria");
      atualizarUso();
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

  /* ---------- Botões do topo ---------- */
  $("#voltar").innerHTML = ic("back", 18);
  $("#exportar").innerHTML = ic("download", 16) + "Exportar";
  $("#exportar").addEventListener("click", async () => { await salvarAgora(); UI.exportarComAjuda(P); });

  /* ---------- Início ---------- */
  async function iniciar() {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    if (id) P = await S.obterProjeto(id);
    if (!P) {
      if (id) UI.toast("Esse convite não foi encontrado. Criei um novo para você.", true);
      const tipo = S.TIPOS[params.get("tipo")] && S.TIPOS[params.get("tipo")].ativo ? params.get("tipo") : "cinematografico";
      P = S.novoProjeto(tipo);
      await S.salvarProjeto(P);
      history.replaceState(null, "", "editor.html?id=" + P.id);
    }
    $("#chip-tipo").textContent = (S.TIPOS[P.tipo] || {}).nome || "Convite";
    const abrir = $("#abrir-convite");
    abrir.href = "convite.html?id=" + P.id;
    abrir.innerHTML = ic("eye", 16) + "Abrir convite";

    montarCores();
    montarSecoes();
    preencherCampos();
    atualizarTopo();
    atualizarPendencias();
    await montarSlots();
    $("#salvo").textContent = "Salvo";
    enviarPrevia();
  }

  iniciar().catch(err => { console.error(err); UI.toast("Não consegui abrir o editor neste navegador.", true); });
})();
