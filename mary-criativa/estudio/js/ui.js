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
    toast.t = setTimeout(() => el.classList.remove("visivel"), 3200);
  }

  /* Exporta e explica como transformar o arquivo em link. */
  async function exportarComAjuda(projeto) {
    const falta = S.pendencias(projeto);
    if (falta.length && !confirm("Ainda falta: " + falta.join(", ") + ".\n\nQuer exportar mesmo assim?")) return;
    toast("Preparando o arquivo do convite...");
    let res;
    try {
      res = await window.Exportar.baixar(projeto);
    } catch (e) {
      console.error(e);
      toast("Não consegui exportar. Abra o estúdio por um link (http), não direto do arquivo.", true);
      return;
    }
    const d = document.createElement("dialog");
    d.className = "dialogo";
    d.innerHTML =
      '<div class="dialogo-corpo">' +
      '<span class="rotulo">Convite exportado</span>' +
      "<h2>Pronto! Agora é só gerar o link</h2>" +
      "<p>O arquivo <strong>" + S.esc(res.nome) + "</strong> (" + S.formatarTamanho(res.tamanho) + ") já está nos seus downloads, com fotos, vídeo e música dentro dele.</p>" +
      "<ol>" +
      '<li>Abra o <a href="https://app.netlify.com/drop" target="_blank" rel="noopener">Netlify Drop</a> (é grátis).</li>' +
      "<li>Crie uma pasta, coloque o arquivo dentro com o nome <strong>index.html</strong> e arraste a pasta para a página.</li>" +
      "<li>Copie o link que aparecer e mande para a sua cliente.</li>" +
      "</ol>" +
      "<p>As confirmações de presença chegam direto no WhatsApp que você colocou no convite.</p>" +
      (res.tamanho > 40 * 1024 * 1024 ? '<p style="color:var(--gold);margin-top:8px">O arquivo ficou grande. Em internet de celular ele pode demorar para abrir. Se der, use um vídeo mais leve (até uns 20 MB).</p>' : "") +
      '<div class="dialogo-acoes"><button type="button" class="btn btn-primario" data-ok>Entendi</button></div>' +
      "</div>";
    document.body.appendChild(d);
    d.querySelector("[data-ok]").addEventListener("click", () => d.close());
    d.addEventListener("close", () => d.remove());
    d.showModal();
  }

  window.UI = { toast, exportarComAjuda };
})();
