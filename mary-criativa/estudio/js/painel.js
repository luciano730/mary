/* Painel: saudação, tipos de convite e lista de projetos. */
(function () {
  "use strict";
  const S = window.Store;
  const ic = S.icone;
  const $ = s => document.querySelector(s);

  function saudacao() {
    const h = new Date().getHours();
    return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  }

  async function carregarNome() {
    const nome = await S.lerConfig("nome", "Mary");
    $("#nome-usuaria").textContent = nome;
  }

  $("#nome-usuaria").addEventListener("click", async () => {
    const atual = $("#nome-usuaria").textContent;
    const novo = prompt("Como você quer ser chamada?", atual);
    if (novo && novo.trim()) {
      await S.gravarConfig("nome", novo.trim());
      $("#nome-usuaria").textContent = novo.trim();
    }
  });

  function montarTipos() {
    $("#tipos").innerHTML = Object.entries(S.TIPOS).map(([id, t]) => {
      if (t.ativo) {
        return '<a class="tipo principal" href="editor.html?tipo=' + id + '">' +
          '<span class="bolha">' + ic(t.icone, 22) + "</span>" +
          "<strong>Convite " + S.esc(t.nome) + "</strong><span>" + S.esc(t.descricao) + "</span>" +
          "<em>" + ic("plus", 14) + "Criar agora</em></a>";
      }
      return '<div class="tipo bloqueado" aria-disabled="true">' +
        '<span class="breve">' + ic("lock", 11) + "Em breve</span>" +
        '<span class="bolha">' + ic(t.icone, 22) + "</span>" +
        "<strong>" + S.esc(t.nome) + "</strong><span>" + S.esc(t.descricao) + "</span></div>";
    }).join("");
  }

  async function montarProjetos() {
    const lista = await S.listarProjetos();
    $("#n-total").textContent = lista.length;
    $("#n-prontos").textContent = lista.filter(p => !S.pendencias(p).length).length;

    const box = $("#projetos");
    if (!lista.length) {
      box.innerHTML = '<div class="vazio"><strong>Nenhum convite ainda</strong>Comece pelo cinematográfico: capa, vídeo, música e as informações da festa.' +
        '<br><a class="btn btn-primario" href="editor.html?tipo=cinematografico">' + ic("plus", 16) + "Criar meu primeiro convite</a></div>";
      return;
    }

    const cards = await Promise.all(lista.map(async p => {
      const capa = await S.urlMidia(p.midias.capa);
      const pronto = !S.pendencias(p).length;
      const tipo = (S.TIPOS[p.tipo] || {}).nome || "Convite";
      const nome = p.nomeProjeto || [p.titulo, p.subtitulo].filter(Boolean).join(" ") || "Convite sem nome";
      const quando = p.data ? "Festa em " + S.dataCurta(p.data) : "Sem data";
      return '<article class="projeto">' +
        '<a class="projeto-capa" href="editor.html?id=' + p.id + '"' + (capa ? ' style="background-image:url(&quot;' + capa + '&quot;)"' : "") + ' aria-label="Editar ' + S.esc(nome) + '">' +
        (capa ? "" : '<span class="sem-capa">' + S.esc((p.titulo || "Convite").slice(0, 18)) + "</span>") +
        '<span class="status' + (pronto ? " pronto" : "") + '"><i></i>' + (pronto ? "Pronto" : "Rascunho") + "</span></a>" +
        '<div class="projeto-info"><strong>' + S.esc(nome) + "</strong><small>" + S.esc(tipo) + " · " + S.esc(quando) + "</small></div>" +
        '<div class="projeto-acoes">' +
        '<a class="btn btn-primario" href="editor.html?id=' + p.id + '">' + ic("pencil", 15) + "Editar</a>" +
        '<a class="btn-icone" href="convite.html?id=' + p.id + '" target="_blank" rel="noopener" title="Ver convite" aria-label="Ver convite">' + ic("eye", 17) + "</a>" +
        '<button type="button" class="btn-icone" data-exportar="' + p.id + '" title="Exportar convite" aria-label="Exportar convite">' + ic("download", 17) + "</button>" +
        '<button type="button" class="btn-icone" data-duplicar="' + p.id + '" title="Duplicar" aria-label="Duplicar">' + ic("copy", 17) + "</button>" +
        '<button type="button" class="btn-icone" data-excluir="' + p.id + '" title="Excluir" aria-label="Excluir">' + ic("trash", 17) + "</button>" +
        "</div></article>";
    }));
    box.innerHTML = '<div class="projetos">' + cards.join("") + "</div>";
  }

  document.addEventListener("click", async e => {
    const exp = e.target.closest("[data-exportar]");
    const dup = e.target.closest("[data-duplicar]");
    const exc = e.target.closest("[data-excluir]");
    if (exp) {
      const p = await S.obterProjeto(exp.dataset.exportar);
      if (p) window.UI.exportarComAjuda(p);
    }
    if (dup) {
      await S.duplicarProjeto(dup.dataset.duplicar);
      window.UI.toast("Convite duplicado");
      montarProjetos();
    }
    if (exc) {
      const p = await S.obterProjeto(exc.dataset.excluir);
      const nome = p && (p.nomeProjeto || p.titulo) || "este convite";
      if (!confirm("Excluir " + nome + "? As fotos, o vídeo e a música dele também serão apagados.")) return;
      await S.excluirProjeto(exc.dataset.excluir);
      window.UI.toast("Convite excluído");
      montarProjetos();
    }
  });

  $("#botao-novo").innerHTML = ic("plus", 16) + '<span class="esconde-movel">Novo convite</span>';
  $("#saudacao").textContent = saudacao();
  $("#aviso-local").innerHTML = ic("info", 18) +
    "<div><strong>Seus convites ficam salvos neste aparelho.</strong> Para entregar um convite, use o botão de exportar " +
    "(ícone de download): ele gera um arquivo com tudo dentro, que vira link no Netlify Drop. " +
    "Se limpar os dados do navegador, os projetos somem, então exporte os convites prontos.</div>";

  montarTipos();
  carregarNome();
  montarProjetos().catch(err => { console.error(err); window.UI.toast("Não consegui abrir seus projetos neste navegador.", true); });
})();
