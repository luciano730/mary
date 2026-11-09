/* Pedacinhos de interface usados no painel e no editor. */
(function () {
  "use strict";
  const S = window.Store;

  function toast(msg, erro) {
    let el = document.getElementById("toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      el.className = "toast";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.toggle("erro", !!erro);
    el.classList.add("visivel");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove("visivel"), 3400);
  }

  function dialogo(html) {
    const d = document.createElement("dialog");
    d.className = "dialogo";
    d.innerHTML = '<div class="dialogo-corpo">' + html + "</div>";
    document.body.appendChild(d);
    d.addEventListener("close", () => d.remove());
    d.addEventListener("click", e => { if (e.target.closest("[data-fechar-dialogo]")) d.close(); });
    d.showModal();
    return d;
  }

  /* Exporta e explica como transformar o arquivo em link. */
  async function exportarComAjuda(projeto) {
    const falta = S.pendencias(projeto);
    if (falta.length && !confirm("Ainda falta: " + falta.join(", ") + ".\n\nQuer exportar mesmo assim?")) return;
    toast("Preparando o convite...");
    let r;
    try {
      r = await window.Exportar.baixar(projeto);
    } catch (e) {
      console.error(e);
      toast(e && e.message && e.message.includes("zip") ? e.message : "Não consegui exportar. Abra o estúdio por um link (https), não direto do arquivo.", true);
      return;
    }
    dialogo(
      '<span class="rotulo">Convite exportado</span>' +
      "<h2>Pronto! Agora é só gerar o link</h2>" +
      "<p>Baixou o arquivo <strong>" + S.esc(r.nome) + "</strong> (" + S.formatarTamanho(r.tamanho) + ").</p>" +
      "<ol>" +
      "<li>Descompacte o arquivo. Vai aparecer a pasta <strong>" + S.esc(r.pasta) + "</strong>.</li>" +
      '<li>Abra o <a href="https://app.netlify.com/drop" target="_blank" rel="noopener">Netlify Drop</a> e arraste essa pasta para a página.</li>' +
      "<li>Copie o link que aparecer e mande para a sua cliente.</li>" +
      "</ol>" +
      (r.temEndereco ? "" : '<p class="nota">Para a imagem aparecer quando o link for enviado no WhatsApp, cole o link final no campo <strong>Endereço do convite</strong> (no editor) e exporte de novo.</p>') +
      (projeto.opcoes.previa.on ? '<p class="nota">A marca d\'água de prévia está ligada. Quando a cliente pagar, desligue e exporte de novo.</p>' : "") +
      '<div class="dialogo-acoes"><button type="button" class="btn btn-primario" data-fechar-dialogo>Entendi</button></div>'
    );
  }

  window.UI = { toast, dialogo, exportarComAjuda };
})();
