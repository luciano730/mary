/* Gera um único arquivo .html com o convite completo (fotos, vídeo e música
   dentro dele). Esse arquivo pode ser hospedado em qualquer lugar
   (Netlify Drop, GitHub Pages) para virar o link que vai para a cliente. */
(function () {
  "use strict";
  const S = window.Store;

  function paraDataURL(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
  }

  const texto = url => fetch(url, { cache: "no-store" }).then(r => {
    if (!r.ok) throw new Error("Não consegui ler " + url);
    return r.text();
  });

  /* Evita que "</script" dentro de textos quebre o arquivo final. */
  const seguroEmScript = s => s.replace(/<\/(script)/gi, "<\\/$1");

  function nomeDoArquivo(p) {
    const base = (p.titulo || p.nomeProjeto || "convite").normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return (base || "convite") + ".html";
  }

  async function gerarArquivo(projeto) {
    const [html, css, storeJs, conviteJs] = await Promise.all([
      texto("convite.html"), texto("css/convite.css"), texto("js/store.js"), texto("js/convite.js")
    ]);
    const midias = {};
    for (const id of S.idsDeMidia(projeto)) {
      const m = await S.obterMidia(id);
      if (m) midias[id] = await paraDataURL(m.blob);
    }
    const dados = JSON.stringify({ projeto, midias }).replace(/</g, "\\u003c");
    const titulo = [projeto.titulo, projeto.subtitulo].filter(Boolean).join(" · ") || "Convite";
    const descricao = S.dataLonga(projeto.data, projeto.hora) || "Você foi convidado!";

    let out = html
      .replace("<title>Convite</title>",
        "<title>" + S.esc(titulo) + "</title>\n" +
        '<meta property="og:title" content="' + S.esc(titulo) + '">\n' +
        '<meta property="og:description" content="' + S.esc(descricao) + '">')
      .replace('<link rel="stylesheet" href="css/convite.css">', () => "<style>\n" + css + "\n</style>")
      .replace('<script src="js/store.js"></script>', () => "<script>\n" + seguroEmScript(storeJs) + "\n</script>")
      .replace('<script src="js/convite.js"></script>', () =>
        "<script>window.CONVITE_EXPORTADO=" + dados + ";</script>\n<script>\n" + seguroEmScript(conviteJs) + "\n</script>");

    return { blob: new Blob([out], { type: "text/html" }), nome: nomeDoArquivo(projeto) };
  }

  async function baixar(projeto) {
    const { blob, nome } = await gerarArquivo(projeto);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return { nome, tamanho: blob.size };
  }

  window.Exportar = { gerarArquivo, baixar };
})();
