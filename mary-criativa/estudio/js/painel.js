/* Painel: saudação, atalhos, modelos de convite e lista de projetos. */
(function () {
  "use strict";
  const S = window.Store;
  const UI = window.UI;
  const ic = S.icone;
  const $ = s => document.querySelector(s);
  let filtro = "todos";

  function saudacao() {
    const h = new Date().getHours();
    return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  }

  async function carregarNome() {
    $("#nome-usuaria").textContent = await S.lerConfig("nome", "Mary");
  }
  $("#nome-usuaria").addEventListener("click", async () => {
    const novo = prompt("Como você quer ser chamada?", $("#nome-usuaria").textContent);
    if (novo && novo.trim()) {
      await S.gravarConfig("nome", novo.trim());
      $("#nome-usuaria").textContent = novo.trim();
    }
  });

  /* ---------- Minha marca ---------- */
  $("#abrir-marca").addEventListener("click", async () => {
    const marca = await S.lerMarca();
    const logo = await S.urlMidia(marca.logo);
    const d = UI.dialogo(
      '<span class="rotulo">Minha marca</span><h2>Sua marca nos convites</h2>' +
      "<p>O nome e o logo aparecem no rodapé de todos os convites, com a frase \"Convite feito com carinho por\".</p>" +
      '<div class="campos">' +
      '<label class="campo largo"><span>Nome da marca</span><input id="marca-nome" maxlength="40" value="' + S.esc(marca.nome) + '"></label>' +
      '<div class="campo largo"><span>Logo <em>(PNG quadrado)</em></span>' +
      '<div class="midia"><span class="midia-miniatura" id="marca-mini"' + (logo ? ' style="background-image:url(&quot;' + logo + '&quot;);background-size:contain;background-color:#fff"' : "") + ">" + (logo ? "" : ic("brand", 22)) + "</span>" +
      '<span class="midia-texto"><strong id="marca-arquivo">' + (logo ? "Logo enviado" : "Nenhum logo") + "</strong>Até 3 MB</span>" +
      '<label class="btn btn-linha">' + ic("upload", 15) + 'Enviar<input type="file" accept="image/*" id="marca-logo"></label></div></div>' +
      '<label class="check largo"><input type="checkbox" id="marca-mostrar"' + (marca.mostrar !== false ? " checked" : "") + "> Mostrar no rodapé dos convites</label>" +
      "</div>" +
      '<div class="dialogo-acoes"><button type="button" class="btn btn-linha" data-fechar-dialogo>Cancelar</button><button type="button" class="btn btn-primario" id="marca-salvar">Salvar</button></div>'
    );
    let novoLogo = null;
    d.querySelector("#marca-logo").addEventListener("change", e => {
      const f = e.target.files[0];
      if (!f) return;
      if (!f.type.startsWith("image/") || f.size > 3 * 1024 * 1024) { UI.toast("Use uma imagem de até 3 MB.", true); return; }
      novoLogo = f;
      const mini = d.querySelector("#marca-mini");
      mini.innerHTML = "";
      mini.style.cssText = 'background-image:url("' + URL.createObjectURL(f) + '");background-size:contain;background-color:#fff';
      d.querySelector("#marca-arquivo").textContent = f.name;
    });
    d.querySelector("#marca-salvar").addEventListener("click", async () => {
      const nova = Object.assign({}, marca, {
        nome: d.querySelector("#marca-nome").value.trim() || "Mary Criativa",
        mostrar: d.querySelector("#marca-mostrar").checked
      });
      if (novoLogo) {
        const m = await S.salvarMidia(novoLogo);
        if (marca.logo) await S.excluirMidia(marca.logo);
        nova.logo = m.id;
      }
      await S.gravarConfig("marca", nova);
      d.close();
      UI.toast("Marca salva");
    });
  });

  /* ---------- Modelos ---------- */
  function montarTipos() {
    $("#tipos").innerHTML = Object.entries(S.TIPOS).map(([id, t], i) => {
      if (!t.ativo) {
        return '<div class="tipo bloqueado" aria-disabled="true">' +
          '<span class="breve">' + ic("lock", 11) + "Em breve</span>" +
          '<span class="bolha">' + ic(t.icone, 22) + "</span>" +
          "<strong>" + S.esc(t.nome) + "</strong><span>" + S.esc(t.descricao) + "</span></div>";
      }
      return '<a class="tipo' + (i === 0 ? " principal" : "") + '" href="editor.html?tipo=' + id + '">' +
        '<span class="bolha">' + ic(t.icone, 22) + "</span>" +
        "<strong>" + S.esc(t.nome) + "</strong><span>" + S.esc(t.descricao) + "</span>" +
        "<em>" + ic("plus", 14) + "Criar</em></a>";
    }).join("");
  }

  function montarFiltros() {
    const opcoes = [["todos", "Todos"]].concat(Object.entries(S.STATUS));
    $("#filtros").innerHTML = opcoes.map(([id, nome]) =>
      '<button type="button" data-filtro="' + id + '" aria-pressed="' + (filtro === id) + '">' + S.esc(nome) + "</button>").join("");
  }
  $("#filtros").addEventListener("click", e => {
    const b = e.target.closest("[data-filtro]");
    if (!b) return;
    filtro = b.dataset.filtro;
    montarFiltros();
    montarProjetos();
  });

  async function montarProjetos() {
    const todos = await S.listarProjetos();
    $("#n-total").textContent = todos.length;
    $("#n-aprovacao").textContent = todos.filter(p => p.status === "aprovacao").length;
    $("#n-entregues").textContent = todos.filter(p => p.status === "entregue").length;
    const lista = filtro === "todos" ? todos : todos.filter(p => p.status === filtro);

    const box = $("#projetos");
    if (!todos.length) {
      box.innerHTML = '<div class="vazio"><strong>Nenhum convite ainda</strong>Escolha um modelo acima para começar.' +
        '<br><a class="btn btn-primario" href="editor.html?tipo=cinematografico">' + ic("plus", 16) + "Criar convite cinematográfico</a></div>";
      return;
    }
    if (!lista.length) { box.innerHTML = '<div class="vazio">Nenhum convite com esse status.</div>'; return; }

    const cards = await Promise.all(lista.map(async p => {
      const capa = await S.urlMidia(p.midias.capa);
      const tipo = (S.TIPOS[p.tipo] || {}).nome || "Convite";
      const nome = p.nomeProjeto || [p.titulo, p.subtitulo].filter(Boolean).join(" ") || "Convite sem nome";
      const quando = p.data ? "Festa em " + S.dataCurta(p.data) : "Sem data";
      return '<article class="projeto">' +
        '<a class="projeto-capa" href="editor.html?id=' + p.id + '"' + (capa ? ' style="background-image:url(&quot;' + capa + '&quot;)"' : "") + ' aria-label="Editar ' + S.esc(nome) + '">' +
        (capa ? "" : '<span class="sem-capa">' + S.esc((p.titulo || "Convite").slice(0, 18)) + "</span>") +
        '<span class="status ' + p.status + '"><i></i>' + S.esc(S.STATUS[p.status] || "Rascunho") + "</span></a>" +
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
      if (p) UI.exportarComAjuda(p);
    }
    if (dup) {
      await S.duplicarProjeto(dup.dataset.duplicar);
      UI.toast("Convite duplicado");
      montarProjetos();
    }
    if (exc) {
      const p = await S.obterProjeto(exc.dataset.excluir);
      const nome = (p && (p.nomeProjeto || p.titulo)) || "este convite";
      if (!confirm("Excluir " + nome + "? As fotos, o vídeo e a música dele também serão apagados.")) return;
      await S.excluirProjeto(exc.dataset.excluir);
      UI.toast("Convite excluído");
      montarProjetos();
    }
  });

  document.querySelectorAll("[data-ic]").forEach(el => { el.innerHTML = ic(el.dataset.ic, 18); });
  $("#botao-novo").innerHTML = ic("plus", 16) + '<span class="esconde-movel">Novo convite</span>';
  $("#saudacao").textContent = saudacao();
  $("#aviso-local").innerHTML = ic("info", 18) +
    "<div><strong>Seus convites ficam salvos neste aparelho.</strong> Para entregar, use o botão de exportar (ícone de download): " +
    "ele gera um .zip com o convite pronto, que vira link no Netlify Drop. " +
    "Se limpar os dados do navegador, os projetos somem, então exporte os convites prontos.</div>";

  montarTipos();
  montarFiltros();
  carregarNome();
  montarProjetos().catch(err => { console.error(err); UI.toast("Não consegui abrir seus projetos neste navegador.", true); });
})();
