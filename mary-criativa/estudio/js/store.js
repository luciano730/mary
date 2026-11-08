/* =====================================================================
   Estúdio de Convites Mary Criativa: dados, mídias e ícones
   ---------------------------------------------------------------------
   Por enquanto tudo fica salvo no próprio navegador (IndexedDB).
   Quando o app ganhar servidor (para vender assinatura e gerar link
   online), basta trocar as funções do objeto Store por chamadas à API:
   o painel, o editor e o convite só conversam com o Store.
   ===================================================================== */
(function () {
  "use strict";

  const DB_NOME = "mary-estudio-convites";
  const DB_VERSAO = 1;
  let dbPromise = null;

  function abrirDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NOME, DB_VERSAO);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("projetos")) db.createObjectStore("projetos", { keyPath: "id" });
        if (!db.objectStoreNames.contains("midias")) db.createObjectStore("midias", { keyPath: "id" });
        if (!db.objectStoreNames.contains("config")) db.createObjectStore("config", { keyPath: "chave" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function operar(nomeStore, modo, fn) {
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
      const t = db.transaction(nomeStore, modo);
      const req = fn(t.objectStore(nomeStore));
      t.oncomplete = () => resolve(req ? req.result : undefined);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  }

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const clonar = o => JSON.parse(JSON.stringify(o));

  /* ---------- Tipos de convite ---------- */
  const TIPOS = {
    cinematografico: { nome: "Cinematográfico", descricao: "Vídeo em tela cheia, música e as informações da festa logo depois.", icone: "film", ativo: true },
    livrinho: { nome: "Livrinho", descricao: "Páginas que viram como um livro.", icone: "book", ativo: false },
    revelacao: { nome: "Revelação", descricao: "O convidado raspa a tela para descobrir a surpresa.", icone: "sparkle", ativo: false },
    quebracabeca: { nome: "Quebra-cabeça", descricao: "Monte as peças para abrir o convite.", icone: "puzzle", ativo: false },
    presentes: { nome: "Lista de presentes", descricao: "Lista com reserva de presentes e Pix.", icone: "gift", ativo: false },
    mural: { nome: "Mural de recados", descricao: "Os convidados deixam mensagens carinhosas.", icone: "heart", ativo: false }
  };

  /* ---------- Seções do convite cinematográfico ----------
     Ordem aqui = ordem no editor e nos botões do convite. */
  const SECOES = [
    { id: "abertura", nome: "Tela de abertura", icone: "sparkle", ajuda: "Primeira tela, com a capa e o botão para abrir. Ela garante que o vídeo toque com som." },
    { id: "video", nome: "Vídeo do convite", icone: "film", ajuda: "O vídeo principal, em tela cheia. MP4 na vertical (9:16) fica perfeito." },
    { id: "musica", nome: "Música de fundo", icone: "music", ajuda: "Toca depois do vídeo, enquanto o convidado vê as informações." },
    { id: "contagem", nome: "Contagem regressiva", icone: "clock", ajuda: "Dias, horas e minutos até a festa." },
    { id: "rsvp", nome: "Confirmação de presença", icone: "check", ajuda: "O convidado preenche e a confirmação chega pronta no WhatsApp." },
    { id: "local", nome: "Localização", icone: "pin", ajuda: "Endereço com botões para Google Maps e Waze." },
    { id: "presentes", nome: "Sugestão de presente", icone: "gift", ajuda: "Mensagem e link para a lista de presentes." },
    { id: "pix", nome: "Pix", icone: "pix", ajuda: "Chave Pix com botão de copiar." },
    { id: "dresscode", nome: "Dress code", icone: "shirt", ajuda: "O traje sugerido para a festa." },
    { id: "info", nome: "Informações e avisos", icone: "info", ajuda: "Recados importantes para os convidados." },
    { id: "manual", nome: "Manual do convidado", icone: "book", ajuda: "Regrinhas divertidas da festa, uma por linha." },
    { id: "galeria", nome: "Galeria de fotos", icone: "image", ajuda: "Fotos que o convidado pode ver em tela cheia." }
  ];

  const CORES = [
    { nome: "Rosa", cor: "#E8789F" },
    { nome: "Lilás", cor: "#B58BD9" },
    { nome: "Dourado", cor: "#C9A04E" },
    { nome: "Vinho", cor: "#9B2C4F" },
    { nome: "Azul", cor: "#6F9BD8" },
    { nome: "Verde", cor: "#6FAE8C" }
  ];

  function novoProjeto(tipo) {
    const agora = new Date().toISOString();
    return {
      id: uid(),
      tipo: tipo || "cinematografico",
      nomeProjeto: "",
      titulo: "",
      subtitulo: "",
      data: "",
      hora: "",
      mensagem: "",
      cor: "#E8789F",
      midias: { capa: null, video: null, musica: null, galeria: [] },
      secoes: {
        abertura: { on: true, texto: "Toque para abrir" },
        video: { on: true, pular: true },
        musica: { on: false },
        contagem: { on: true },
        rsvp: { on: true, whatsapp: "", prazo: "", acompanhantes: true },
        local: { on: true, nome: "", endereco: "", mapa: "" },
        presentes: { on: false, texto: "", link: "" },
        pix: { on: false, chave: "", nome: "", texto: "" },
        dresscode: { on: false, texto: "" },
        info: { on: false, texto: "" },
        manual: { on: false, itens: "" },
        galeria: { on: false }
      },
      criadoEm: agora,
      atualizadoEm: agora
    };
  }

  /* Garante que projetos antigos ganhem campos novos sem quebrar. */
  function completar(p) {
    const base = novoProjeto(p.tipo);
    const out = Object.assign(base, p);
    out.midias = Object.assign(base.midias, p.midias || {});
    out.secoes = Object.assign({}, base.secoes);
    Object.keys(p.secoes || {}).forEach(k => { out.secoes[k] = Object.assign({}, base.secoes[k] || {}, p.secoes[k]); });
    return out;
  }

  /* O que falta para o convite poder ser entregue. */
  function pendencias(p) {
    const falta = [];
    if (!p.titulo.trim()) falta.push("Nome no convite");
    if (!p.data) falta.push("Data do evento");
    if (!p.midias.capa) falta.push("Imagem de capa");
    if (p.secoes.video.on && !p.midias.video) falta.push("Vídeo do convite");
    if (p.secoes.musica.on && !p.midias.musica) falta.push("Arquivo de música");
    if (p.secoes.rsvp.on && soDigitos(p.secoes.rsvp.whatsapp).length < 10) falta.push("WhatsApp da confirmação");
    if (p.secoes.local.on && !p.secoes.local.endereco.trim()) falta.push("Endereço do local");
    if (p.secoes.pix.on && !p.secoes.pix.chave.trim()) falta.push("Chave Pix");
    if (p.secoes.galeria.on && !p.midias.galeria.length) falta.push("Fotos da galeria");
    return falta;
  }

  const soDigitos = s => String(s || "").replace(/\D/g, "");

  /* WhatsApp no formato do wa.me: 55 + DDD + número. */
  function whatsappInternacional(s) {
    const d = soDigitos(s);
    if (!d) return "";
    return d.length <= 11 ? "55" + d : d;
  }

  /* ---------- Projetos ---------- */
  async function listarProjetos() {
    const lista = (await operar("projetos", "readonly", s => s.getAll())) || [];
    return lista.map(completar).sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm));
  }
  async function obterProjeto(id) {
    const p = await operar("projetos", "readonly", s => s.get(id));
    return p ? completar(p) : null;
  }
  async function salvarProjeto(p) {
    p.atualizadoEm = new Date().toISOString();
    await operar("projetos", "readwrite", s => s.put(clonar(p)));
    return p;
  }
  function idsDeMidia(p) {
    const m = p.midias || {};
    return [m.capa, m.video, m.musica].concat(m.galeria || []).filter(Boolean);
  }
  async function excluirProjeto(id) {
    const p = await obterProjeto(id);
    if (!p) return;
    for (const mid of idsDeMidia(p)) await excluirMidia(mid);
    await operar("projetos", "readwrite", s => s.delete(id));
  }
  async function duplicarProjeto(id) {
    const p = await obterProjeto(id);
    if (!p) return null;
    const copia = clonar(p);
    copia.id = uid();
    copia.nomeProjeto = (p.nomeProjeto || p.titulo || "Convite") + " (cópia)";
    copia.criadoEm = new Date().toISOString();
    const copiarMidia = async mid => {
      if (!mid) return null;
      const m = await obterMidia(mid);
      if (!m) return null;
      const nova = Object.assign({}, m, { id: uid() });
      await operar("midias", "readwrite", s => s.put(nova));
      return nova.id;
    };
    copia.midias.capa = await copiarMidia(p.midias.capa);
    copia.midias.video = await copiarMidia(p.midias.video);
    copia.midias.musica = await copiarMidia(p.midias.musica);
    copia.midias.galeria = (await Promise.all(p.midias.galeria.map(copiarMidia))).filter(Boolean);
    await salvarProjeto(copia);
    return copia;
  }

  /* ---------- Mídias (fotos, vídeo e música) ---------- */
  async function salvarMidia(arquivo) {
    const m = { id: uid(), nome: arquivo.name, tipo: arquivo.type, tamanho: arquivo.size, blob: arquivo };
    await operar("midias", "readwrite", s => s.put(m));
    return m;
  }
  const obterMidia = id => operar("midias", "readonly", s => s.get(id));
  async function excluirMidia(id) {
    if (!id) return;
    if (urlCache[id]) { URL.revokeObjectURL(urlCache[id]); delete urlCache[id]; }
    await operar("midias", "readwrite", s => s.delete(id));
  }
  const urlCache = {};
  async function urlMidia(id) {
    if (!id) return "";
    if (urlCache[id]) return urlCache[id];
    const m = await obterMidia(id);
    if (!m) return "";
    urlCache[id] = URL.createObjectURL(m.blob);
    return urlCache[id];
  }
  async function urlsDoProjeto(p) {
    const urls = {};
    for (const id of idsDeMidia(p)) urls[id] = await urlMidia(id);
    return urls;
  }
  async function tamanhoDoProjeto(p) {
    let total = 0;
    for (const id of idsDeMidia(p)) { const m = await obterMidia(id); if (m) total += m.tamanho || 0; }
    return total;
  }

  /* ---------- Configurações (nome da usuária etc.) ---------- */
  async function lerConfig(chave, padrao) {
    const r = await operar("config", "readonly", s => s.get(chave));
    return r ? r.valor : padrao;
  }
  const gravarConfig = (chave, valor) => operar("config", "readwrite", s => s.put({ chave, valor }));

  /* ---------- Utilidades de texto ---------- */
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function formatarTamanho(bytes) {
    if (!bytes) return "0 MB";
    if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + " KB";
    return (bytes / 1024 / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " MB";
  }

  function dataLonga(data, hora) {
    if (!data) return "";
    const [a, m, d] = data.split("-").map(Number);
    const dt = new Date(a, m - 1, d);
    let txt = dt.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    txt = txt.charAt(0).toUpperCase() + txt.slice(1);
    return hora ? txt + " às " + hora.replace(":", "h").replace(/h00$/, "h") : txt;
  }
  function dataCurta(data) {
    if (!data) return "";
    const [a, m, d] = data.split("-");
    return d + "/" + m + "/" + a;
  }

  /* ---------- Ícones (traço fino, herdam a cor do texto) ---------- */
  const ICONES = {
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    check: '<path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="m9 11 3 3L22 4"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
    shirt: '<path d="M20.4 3.5 16 2a4 4 0 0 1-8 0L3.6 3.5a2 2 0 0 0-1.3 2.2l.6 3.5a1 1 0 0 0 1 .8H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.1a1 1 0 0 0 1-.8l.6-3.5a2 2 0 0 0-1.3-2.2Z"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2Z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7Z"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
    pix: '<path d="M12 2 22 12 12 22 2 12Z"/><path d="M12 7.5 16.5 12 12 16.5 7.5 12Z"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    play: '<path d="M6 3l14 9-14 9Z"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    film: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18M17 3v18M3 7.5h4M3 12h18M3 16.5h4M17 7.5h4M17 16.5h4"/>',
    sparkle: '<path d="M12 3 13.9 8.8 20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2Z"/><path d="M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7Z"/>',
    puzzle: '<path d="M19.4 14.6a2.5 2.5 0 1 0 0-3.2L18 12.8V8a2 2 0 0 0-2-2h-4.8l1.4-1.4a2.5 2.5 0 1 0-3.2 0L10.8 6H6a2 2 0 0 0-2 2v4.8l1.4-1.4a2.5 2.5 0 1 1 0 3.2L4 13.2V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3.6Z"/>',
    heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/>',
    chat: '<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.4 8.4 0 1 1 21 11.5Z"/>',
    volume: '<path d="M11 5 6 9H2v6h4l5 4Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/>',
    mute: '<path d="M11 5 6 9H2v6h4l5 4Z"/><path d="m22 9-6 6M16 9l6 6"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2"/>',
    skip: '<path d="M5 4l10 8-10 8Z"/><path d="M19 5v14"/>',
    replay: '<path d="M3 12a9 9 0 1 0 9-9 9.8 9.8 0 0 0-6.7 2.7L3 8"/><path d="M3 3v5h5"/>',
    pencil: '<path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    back: '<path d="m12 19-7-7 7-7M19 12H5"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    phone: '<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/>',
    folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    nav: '<path d="m3 11 19-9-9 19-2-8Z"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'
  };
  function icone(nome, tam) {
    const t = tam || 20;
    return '<svg class="ic" width="' + t + '" height="' + t + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONES[nome] || "") + "</svg>";
  }

  window.Store = {
    TIPOS, SECOES, CORES,
    uid, novoProjeto, completar, pendencias,
    listarProjetos, obterProjeto, salvarProjeto, excluirProjeto, duplicarProjeto,
    salvarMidia, obterMidia, excluirMidia, urlMidia, urlsDoProjeto, tamanhoDoProjeto, idsDeMidia,
    lerConfig, gravarConfig,
    esc, formatarTamanho, dataLonga, dataCurta, soDigitos, whatsappInternacional, icone
  };
})();
