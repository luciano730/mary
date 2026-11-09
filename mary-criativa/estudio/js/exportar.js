/* Gera um .zip com o convite pronto para publicar:
   index.html (o convite) + pasta midia/ (fotos, vídeo e música) +
   a imagem que aparece quando o link é compartilhado no WhatsApp.
   É só descompactar e arrastar a pasta no Netlify Drop. */
(function () {
  "use strict";
  const S = window.Store;

  const texto = url => fetch(url, { cache: "no-store" }).then(r => {
    if (!r.ok) throw new Error("Não consegui ler " + url);
    return r.text();
  });

  /* Evita que "</script" dentro de textos quebre o arquivo final. */
  const seguroEmScript = s => s.replace(/<\/(script)/gi, "<\\/$1");

  function extensao(m) {
    const doNome = (m.nome || "").split(".").pop().toLowerCase();
    if (doNome && doNome.length <= 4 && doNome !== m.nome) return doNome;
    const t = (m.tipo || "").split("/")[1] || "bin";
    return { jpeg: "jpg", quicktime: "mov", mpeg: "mp3", "svg+xml": "svg" }[t] || t;
  }

  function nomeDaPasta(p) {
    const base = (p.titulo || p.nomeProjeto || "convite").normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return base || "convite";
  }

  async function gerarZip(projeto) {
    if (!window.JSZip) throw new Error("Biblioteca do zip não carregou. Verifique a internet.");
    const [html, css, storeJs, conviteJs] = await Promise.all([
      texto("convite.html"), texto("css/convite.css"), texto("js/store.js"), texto("js/convite.js")
    ]);
    const zip = new window.JSZip();
    const pasta = nomeDaPasta(projeto);
    const raiz = zip.folder(pasta);

    const midias = {};
    for (const id of S.idsDeMidia(projeto)) {
      const m = await S.obterMidia(id);
      if (!m) continue;
      const caminho = "midia/" + id + "." + extensao(m);
      raiz.file(caminho, m.blob);
      midias[id] = caminho;
    }

    const marcaCfg = await S.lerMarca();
    const marca = { nome: marcaCfg.nome, mostrar: marcaCfg.mostrar, logo: null };
    if (marcaCfg.logo) {
      const lg = await S.obterMidia(marcaCfg.logo);
      if (lg) { marca.logo = "midia/marca." + extensao(lg); raiz.file(marca.logo, lg.blob); }
    }

    /* Imagem do link: precisa de endereço completo para o WhatsApp achar. */
    let ogImagem = "";
    const imgLink = projeto.midias.compartilhar || projeto.midias.capa;
    if (imgLink && midias[imgLink]) {
      const m = await S.obterMidia(imgLink);
      const arquivo = "compartilhar." + extensao(m);
      raiz.file(arquivo, m.blob);
      const base = String(projeto.endereco || "").trim();
      ogImagem = /^https?:\/\//i.test(base) ? base.replace(/\/?$/, "/") + arquivo : arquivo;
    }

    const dados = JSON.stringify({ projeto, midias, marca }).replace(/</g, "\\u003c");
    const titulo = [projeto.titulo, projeto.subtitulo].filter(Boolean).join(" · ") || "Convite";
    const descricao = S.dataLonga(projeto.data, projeto.hora, projeto.idioma) || "Você foi convidado!";
    const metas = [
      "<title>" + S.esc(titulo) + "</title>",
      '<meta name="description" content="' + S.esc(descricao) + '">',
      '<meta property="og:type" content="website">',
      '<meta property="og:title" content="' + S.esc(titulo) + '">',
      '<meta property="og:description" content="' + S.esc(descricao) + '">',
      ogImagem ? '<meta property="og:image" content="' + S.esc(ogImagem) + '">' : "",
      ogImagem ? '<meta name="twitter:card" content="summary_large_image">' : ""
    ].filter(Boolean).join("\n");

    const out = html
      .replace("<title>Convite</title>", () => metas)
      .replace('<link rel="stylesheet" href="css/convite.css">', () => "<style>\n" + css + "\n</style>")
      .replace('<script src="js/store.js"></script>', () => "<script>\n" + seguroEmScript(storeJs) + "\n</script>")
      .replace('<script src="js/convite.js"></script>', () =>
        "<script>window.CONVITE_EXPORTADO=" + dados + ";</script>\n<script>\n" + seguroEmScript(conviteJs) + "\n</script>");
    raiz.file("index.html", out);

    const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
    return { blob, nome: pasta + ".zip", pasta, temEndereco: /^https?:\/\//i.test(String(projeto.endereco || "")) };
  }

  async function baixar(projeto) {
    const r = await gerarZip(projeto);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(r.blob);
    a.download = r.nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return { nome: r.nome, pasta: r.pasta, tamanho: r.blob.size, temEndereco: r.temEndereco };
  }

  window.Exportar = { gerarZip, baixar };
})();
