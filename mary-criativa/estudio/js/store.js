/* =====================================================================
   Estúdio de Convites Mary Criativa: dados, mídias, textos e ícones
   ---------------------------------------------------------------------
   Por enquanto tudo fica salvo no próprio navegador (IndexedDB).
   Quando o app ganhar servidor (para vender assinatura e gerar link
   online), basta trocar as funções de dados deste arquivo por chamadas
   à API: o painel, o editor e o convite só conversam com o Store.
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

  /* ---------- Modelos de convite ----------
     telas: as telas por onde o convidado passa. "convite" é sempre a
     última, com as informações e os botões em lista. */
  const TIPOS = {
    cinematografico: { nome: "Cinematográfico", descricao: "Vídeo em tela cheia com som, e os botões por cima do vídeo ou no convite.", icone: "film", ativo: true, telas: ["abertura", "video", "convite"] },
    interativo: { nome: "Interativo", descricao: "Uma arte em tela cheia com áreas de toque onde você quiser.", icone: "touch", ativo: true, telas: ["abertura", "arte", "convite"] },
    livrinho: { nome: "Livrinho", descricao: "Páginas que viram como um livro, com os botões na última página.", icone: "book", ativo: true, telas: ["abertura", "livro", "convite"] },
    revelacao: { nome: "Revelação", descricao: "O convidado raspa a tela para descobrir a surpresa.", icone: "sparkle", ativo: true, telas: ["abertura", "revelacao", "convite"] },
    quebracabeca: { nome: "Quebra-cabeça", descricao: "O convidado monta as peças para abrir o convite.", icone: "puzzle", ativo: true, telas: ["abertura", "quebra", "convite"] },
    presentes: { nome: "Lista de presentes", descricao: "Lista de presentes com link, Pix e aviso pelo WhatsApp.", icone: "gift", ativo: true, telas: ["abertura", "convite"] },
    mural: { nome: "Mural de recados", descricao: "Os convidados deixam mensagens. Precisa do servidor, que é o próximo passo.", icone: "heart", ativo: false, telas: [] }
  };

  /* Nome de cada tela no editor. */
  const TELAS = {
    abertura: "Abertura",
    video: "Vídeo",
    arte: "Arte",
    livro: "Livro",
    revelacao: "Raspadinha",
    quebra: "Quebra-cabeça",
    convite: "Convite"
  };
  /* Quando a tela termina (vídeo acabou, última página, raspou, montou). */
  const FINAL_DA_TELA = { video: "no final do vídeo", livro: "na última página", revelacao: "depois de raspar", quebra: "depois de montar" };

  /* ---------- Tipos de botão ---------- */
  const BOTOES = {
    rsvp: { nome: { pt: "Confirmar presença", en: "RSVP", es: "Confirmar asistencia" }, icone: "check", ajuda: "O convidado preenche e a confirmação chega pronta no WhatsApp." },
    local: { nome: { pt: "Localização", en: "Location", es: "Ubicación" }, icone: "pin", ajuda: "Endereço com Google Maps e Waze." },
    whatsapp: { nome: { pt: "WhatsApp", en: "WhatsApp", es: "WhatsApp" }, icone: "chat", ajuda: "Abre uma conversa no WhatsApp." },
    presentes: { nome: { pt: "Sugestão de presente", en: "Gift ideas", es: "Sugerencia de regalo" }, icone: "gift", ajuda: "Mensagem e link para a lista de presentes." },
    lista: { nome: { pt: "Lista de presentes", en: "Gift list", es: "Lista de regalos" }, icone: "bag", ajuda: "Itens com preço, link de compra e aviso pelo WhatsApp." },
    pix: { nome: { pt: "Pix", en: "Pix", es: "Pix" }, icone: "pix", ajuda: "Chave Pix com botão de copiar." },
    dresscode: { nome: { pt: "Dress code", en: "Dress code", es: "Código de vestimenta" }, icone: "shirt", ajuda: "O traje sugerido." },
    info: { nome: { pt: "Informações", en: "Information", es: "Información" }, icone: "info", ajuda: "Avisos e recados importantes." },
    manual: { nome: { pt: "Manual do convidado", en: "Guest guide", es: "Manual del invitado" }, icone: "book", ajuda: "Regrinhas da festa, uma por linha." },
    galeria: { nome: { pt: "Galeria de fotos", en: "Photo gallery", es: "Galería de fotos" }, icone: "image", ajuda: "Fotos que abrem em tela cheia." },
    agenda: { nome: { pt: "Salvar na agenda", en: "Add to calendar", es: "Guardar en el calendario" }, icone: "calendar", ajuda: "Salva a data no calendário do celular." },
    rever: { nome: { pt: "Rever vídeo", en: "Watch again", es: "Ver de nuevo" }, icone: "replay", ajuda: "Toca o vídeo de novo.", tipos: ["cinematografico"] },
    convite: { nome: { pt: "Ver convite", en: "See invitation", es: "Ver invitación" }, icone: "mail", ajuda: "Leva para a tela do convite com as informações." },
    personalizado: { nome: { pt: "Botão", en: "Button", es: "Botón" }, icone: "sparkle", ajuda: "Do jeito que você quiser: texto, imagem ou link." }
  };

  const ICONES_ESCOLHA = ["sparkle", "heart", "check", "pin", "chat", "gift", "bag", "pix", "shirt", "info", "book", "image", "calendar", "clock", "music", "mail", "link", "star", "camera", "car", "glass", "cake"];

  const CORES = [
    { nome: "Rosé", cor: "#E8B8B1" },
    { nome: "Rosa", cor: "#E58FA6" },
    { nome: "Champanhe", cor: "#D6B98C" },
    { nome: "Lavanda", cor: "#BFA8D9" },
    { nome: "Vinho", cor: "#9E3B52" },
    { nome: "Azul", cor: "#8FB0D9" },
    { nome: "Sálvia", cor: "#9DB89A" }
  ];

  function novoBotao(tipo, extra) {
    const b = {
      id: uid(), tipo, nome: "", icone: (BOTOES[tipo] || BOTOES.personalizado).icone, on: true,
      acao: tipo === "personalizado" ? "texto" : "padrao", link: "", imagem: null, texto: "",
      dados: {}, pos: null, estilo: "visivel", aparecer: "final"
    };
    const d = {
      rsvp: { whatsapp: "", prazo: "", acompanhantes: true },
      local: { nome: "", endereco: "", mapa: "" },
      whatsapp: { numero: "", mensagem: "" },
      presentes: { texto: "", link: "" },
      lista: { whatsapp: "", itens: "" },
      pix: { chave: "", nome: "", texto: "" },
      dresscode: { texto: "" },
      info: { texto: "" },
      manual: { itens: "" }
    }[tipo];
    if (d) b.dados = d;
    return Object.assign(b, extra || {});
  }

  function botoesPadrao(tipo) {
    const lista = [
      novoBotao("rsvp"),
      novoBotao("local"),
      novoBotao("presentes", { on: false }),
      novoBotao("pix", { on: false }),
      novoBotao("dresscode", { on: false }),
      novoBotao("info", { on: false }),
      novoBotao("manual", { on: false }),
      novoBotao("galeria", { on: false }),
      novoBotao("agenda")
    ];
    if (tipo === "cinematografico") lista.push(novoBotao("rever"));
    if (tipo === "presentes") {
      lista.unshift(novoBotao("lista"));
      lista.forEach(b => { if (b.tipo === "presentes") b.on = false; });
    }
    return lista;
  }

  function novoProjeto(tipo) {
    tipo = TIPOS[tipo] ? tipo : "cinematografico";
    const agora = new Date().toISOString();
    return {
      id: uid(),
      tipo,
      versao: 2,
      status: "rascunho",
      nomeProjeto: "",
      titulo: "",
      subtitulo: "",
      data: "",
      hora: "",
      mensagem: "",
      cor: "#E8B8B1",
      idioma: "pt",
      midias: { capa: null, abertura: null, video: null, musica: null, compartilhar: null, arte: null, revelada: null, quebra: null, galeria: [], paginas: [], videos: [] },
      opcoes: {
        abertura: { on: true, texto: "" },
        video: { depois: "convite", pular: true },
        musica: { on: false },
        contagem: { on: true },
        efeito: { on: false, tipo: "coracoes" },
        senha: { on: false, valor: "" },
        previa: { on: false },
        revelacao: { texto: "" },
        quebra: { pecas: 3 }
      },
      botoes: botoesPadrao(tipo),
      endereco: "",
      criadoEm: agora,
      atualizadoEm: agora
    };
  }

  /* Converte projetos da primeira versão (com "secoes") para botões. */
  function migrarV1(p) {
    const s = p.secoes || {};
    const botoes = [];
    const add = (tipo, sec, dados) => { if (sec) botoes.push(novoBotao(tipo, { on: !!sec.on, dados: Object.assign(novoBotao(tipo).dados, dados || {}) })); };
    if (s.rsvp) add("rsvp", s.rsvp, { whatsapp: s.rsvp.whatsapp || "", prazo: s.rsvp.prazo || "", acompanhantes: s.rsvp.acompanhantes !== false });
    if (s.local) add("local", s.local, { nome: s.local.nome || "", endereco: s.local.endereco || "", mapa: s.local.mapa || "" });
    if (s.presentes) add("presentes", s.presentes, { texto: s.presentes.texto || "", link: s.presentes.link || "" });
    if (s.pix) add("pix", s.pix, { chave: s.pix.chave || "", nome: s.pix.nome || "", texto: s.pix.texto || "" });
    if (s.dresscode) add("dresscode", s.dresscode, { texto: s.dresscode.texto || "" });
    if (s.info) add("info", s.info, { texto: s.info.texto || "" });
    if (s.manual) add("manual", s.manual, { itens: s.manual.itens || "" });
    if (s.galeria) add("galeria", s.galeria);
    botoes.push(novoBotao("agenda"), novoBotao("rever"));
    const out = Object.assign({}, p, { versao: 2, botoes });
    out.opcoes = {
      abertura: { on: s.abertura ? s.abertura.on : true, texto: s.abertura && s.abertura.texto !== "Toque para abrir" ? s.abertura.texto || "" : "" },
      video: { depois: "convite", pular: s.video ? s.video.pular !== false : true },
      musica: { on: !!(s.musica && s.musica.on) },
      contagem: { on: s.contagem ? !!s.contagem.on : true }
    };
    delete out.secoes;
    return out;
  }

  /* Garante que projetos antigos ganhem campos novos sem quebrar. */
  function completar(p) {
    if (!p.versao && p.secoes) p = migrarV1(p);
    const base = novoProjeto(p.tipo);
    const out = Object.assign({}, base, p);
    out.midias = Object.assign({}, base.midias, p.midias || {});
    out.opcoes = {};
    Object.keys(base.opcoes).forEach(k => { out.opcoes[k] = Object.assign({}, base.opcoes[k], (p.opcoes || {})[k] || {}); });
    out.botoes = (p.botoes || base.botoes).map(b => {
      const n = novoBotao(b.tipo);
      return Object.assign(n, b, { dados: Object.assign({}, n.dados, b.dados || {}) });
    });
    return out;
  }

  const soDigitos = s => String(s || "").replace(/\D/g, "");
  function whatsappInternacional(s) {
    const d = soDigitos(s);
    if (!d) return "";
    return d.length <= 11 ? "55" + d : d;
  }

  /* O que falta para o convite poder ser entregue. */
  function pendencias(p) {
    const falta = [];
    const o = p.opcoes;
    if (!p.titulo.trim()) falta.push("Nome no convite");
    if (!p.data) falta.push("Data do evento");
    if (!p.midias.capa && !(p.tipo === "livrinho" && p.midias.paginas.length)) falta.push("Imagem de capa");
    if (p.tipo === "cinematografico" && !p.midias.video) falta.push("Vídeo do convite");
    if (p.tipo === "interativo" && !p.midias.arte) falta.push("Arte do convite");
    if (p.tipo === "livrinho" && p.midias.paginas.length < 2) falta.push("Páginas do livrinho (pelo menos 2)");
    if (p.tipo === "revelacao" && !p.midias.revelada) falta.push("Imagem da surpresa");
    if (o.musica.on && !p.midias.musica) falta.push("Arquivo de música");
    if (o.senha.on && !o.senha.valor.trim()) falta.push("Senha do convite");
    p.botoes.filter(b => b.on).forEach(b => {
      const nome = nomeDoBotao(b, "pt");
      if (b.acao === "imagem" && !b.imagem) falta.push("Imagem do botão " + nome);
      else if (b.acao === "link" && !/^https?:\/\//i.test(b.link)) falta.push("Link do botão " + nome);
      else if (b.acao === "padrao") {
        if (b.tipo === "rsvp" && soDigitos(b.dados.whatsapp).length < 10) falta.push("WhatsApp da confirmação");
        if (b.tipo === "whatsapp" && soDigitos(b.dados.numero).length < 10) falta.push("Número do botão " + nome);
        if (b.tipo === "local" && !b.dados.endereco.trim()) falta.push("Endereço do local");
        if (b.tipo === "pix" && !b.dados.chave.trim()) falta.push("Chave Pix");
        if (b.tipo === "lista" && !b.dados.itens.trim()) falta.push("Itens da lista de presentes");
        if (b.tipo === "galeria" && !p.midias.galeria.length) falta.push("Fotos da galeria");
      }
    });
    if (o.previa.on) falta.push("Desligar a marca d'água de prévia antes de entregar");
    return falta;
  }

  const STATUS = {
    rascunho: "Rascunho",
    aprovacao: "Aguardando aprovação",
    aprovado: "Aprovado",
    entregue: "Entregue"
  };

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
    const unicos = ["capa", "abertura", "video", "musica", "compartilhar", "arte", "revelada", "quebra"].map(k => m[k]);
    const botoes = (p.botoes || []).map(b => b.imagem);
    return unicos.concat(m.galeria || [], m.paginas || [], botoes).filter(Boolean);
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
    copia.status = "rascunho";
    copia.nomeProjeto = (p.nomeProjeto || p.titulo || "Convite") + " (cópia)";
    copia.criadoEm = new Date().toISOString();
    const mapa = {};
    for (const mid of idsDeMidia(p)) {
      const m = await obterMidia(mid);
      if (!m) continue;
      const nova = Object.assign({}, m, { id: uid() });
      await operar("midias", "readwrite", s => s.put(nova));
      mapa[mid] = nova.id;
    }
    const troca = v => (v && mapa[v]) || null;
    Object.keys(copia.midias).forEach(k => {
      copia.midias[k] = Array.isArray(copia.midias[k]) ? copia.midias[k].map(troca).filter(Boolean) : troca(copia.midias[k]);
    });
    copia.botoes.forEach(b => { b.imagem = troca(b.imagem); b.id = uid(); });
    await salvarProjeto(copia);
    return copia;
  }

  /* ---------- Mídias ---------- */
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

  /* ---------- Configurações (nome, marca) ---------- */
  async function lerConfig(chave, padrao) {
    const r = await operar("config", "readonly", s => s.get(chave));
    return r ? r.valor : padrao;
  }
  const gravarConfig = (chave, valor) => operar("config", "readwrite", s => s.put({ chave, valor }));
  const MARCA_PADRAO = { nome: "Mary Criativa", logo: null, whatsapp: "", instagram: "", mostrar: true };
  async function lerMarca() { return Object.assign({}, MARCA_PADRAO, await lerConfig("marca", {})); }

  /* ---------- Textos do convite em 3 idiomas ---------- */
  const TEXTOS = {
    pt: {
      convidado: "Você foi convidado", abrir: "Toque para abrir", pular: "Pular", dias: "dias", horas: "horas", min: "min", seg: "seg",
      hoje: "É hoje!", passou: "Obrigado por celebrar com a gente", mais: "Mais informações",
      confirmeAte: "Confirme até", seuNome: "Seu nome", nomeSobrenome: "Nome e sobrenome", vou: "Vou comparecer", naoVou: "Não poderei ir",
      adultos: "Adultos", criancas: "Crianças", recado: "Recado (opcional)", recadoPh: "Deixe uma mensagem carinhosa", enviar: "Enviar confirmação",
      escrevaNome: "Escreva seu nome para confirmar.", obrigadoSim: "Obrigado, até a festa!", obrigadoNao: "Obrigado por avisar!", abriuWhats: "Sua resposta abriu no WhatsApp. É só tocar em enviar.",
      maps: "Abrir no Google Maps", waze: "Ir com o Waze", verLista: "Ver lista de presentes", presencaPresente: "Sua presença é o nosso maior presente!",
      copiarPix: "Copiar chave Pix", emNome: "Em nome de", pixCopiado: "Chave Pix copiada!", naoCopiou: "Não deu para copiar. Segure o texto para copiar.",
      emBreve: "Em breve.", abrirLink: "Abrir link", presentear: "Presentear", comprar: "Comprar", avisarPresente: "Vou dar este",
      senhaTitulo: "Convite protegido", senhaTexto: "Digite a senha que você recebeu", senhaErrada: "Senha incorreta", entrar: "Entrar",
      raspe: "Raspe para revelar", monte: "Toque em duas peças para trocar de lugar", montou: "Parabéns, você montou!", vireAPagina: "Toque para virar a página",
      previa: "PRÉVIA", previaTexto: "Prévia para aprovação", feitoPor: "Convite feito com carinho por", confirmacao: "Confirmação de presença",
      resposta: "Resposta", nome: "Nome", querPresentear: "Quero presentear", enviarVideo: "Envie o vídeo para ver esta parte"
    },
    en: {
      convidado: "You are invited", abrir: "Tap to open", pular: "Skip", dias: "days", horas: "hours", min: "min", seg: "sec",
      hoje: "It's today!", passou: "Thank you for celebrating with us", mais: "More information",
      confirmeAte: "Please reply by", seuNome: "Your name", nomeSobrenome: "Full name", vou: "I'll be there", naoVou: "Can't make it",
      adultos: "Adults", criancas: "Children", recado: "Message (optional)", recadoPh: "Leave a sweet message", enviar: "Send reply",
      escrevaNome: "Please write your name.", obrigadoSim: "Thank you, see you there!", obrigadoNao: "Thank you for letting us know!", abriuWhats: "Your reply opened in WhatsApp. Just tap send.",
      maps: "Open in Google Maps", waze: "Go with Waze", verLista: "See gift list", presencaPresente: "Your presence is our greatest gift!",
      copiarPix: "Copy Pix key", emNome: "Recipient", pixCopiado: "Pix key copied!", naoCopiou: "Could not copy. Press and hold the text to copy.",
      emBreve: "Coming soon.", abrirLink: "Open link", presentear: "Give this gift", comprar: "Buy", avisarPresente: "I'll give this",
      senhaTitulo: "Protected invitation", senhaTexto: "Type the password you received", senhaErrada: "Wrong password", entrar: "Enter",
      raspe: "Scratch to reveal", monte: "Tap two pieces to swap them", montou: "Well done!", vireAPagina: "Tap to turn the page",
      previa: "PREVIEW", previaTexto: "Preview for approval", feitoPor: "Invitation lovingly made by", confirmacao: "RSVP",
      resposta: "Answer", nome: "Name", querPresentear: "I want to give", enviarVideo: "Upload the video to see this part"
    },
    es: {
      convidado: "Estás invitado", abrir: "Toca para abrir", pular: "Saltar", dias: "días", horas: "horas", min: "min", seg: "seg",
      hoje: "¡Es hoy!", passou: "Gracias por celebrar con nosotros", mais: "Más información",
      confirmeAte: "Confirma antes del", seuNome: "Tu nombre", nomeSobrenome: "Nombre y apellido", vou: "Asistiré", naoVou: "No podré ir",
      adultos: "Adultos", criancas: "Niños", recado: "Mensaje (opcional)", recadoPh: "Deja un mensaje cariñoso", enviar: "Enviar confirmación",
      escrevaNome: "Escribe tu nombre para confirmar.", obrigadoSim: "¡Gracias, nos vemos en la fiesta!", obrigadoNao: "¡Gracias por avisar!", abriuWhats: "Tu respuesta se abrió en WhatsApp. Solo toca enviar.",
      maps: "Abrir en Google Maps", waze: "Ir con Waze", verLista: "Ver lista de regalos", presencaPresente: "¡Tu presencia es nuestro mejor regalo!",
      copiarPix: "Copiar clave Pix", emNome: "A nombre de", pixCopiado: "¡Clave Pix copiada!", naoCopiou: "No se pudo copiar. Mantén presionado el texto.",
      emBreve: "Próximamente.", abrirLink: "Abrir enlace", presentear: "Regalar", comprar: "Comprar", avisarPresente: "Yo lo regalo",
      senhaTitulo: "Invitación protegida", senhaTexto: "Escribe la contraseña que recibiste", senhaErrada: "Contraseña incorrecta", entrar: "Entrar",
      raspe: "Raspa para descubrir", monte: "Toca dos piezas para cambiarlas", montou: "¡Lo lograste!", vireAPagina: "Toca para pasar la página",
      previa: "VISTA PREVIA", previaTexto: "Vista previa para aprobación", feitoPor: "Invitación hecha con cariño por", confirmacao: "Confirmación de asistencia",
      resposta: "Respuesta", nome: "Nombre", querPresentear: "Quiero regalar", enviarVideo: "Sube el video para ver esta parte"
    }
  };
  const IDIOMAS = { pt: "Português (Brasil)", en: "English", es: "Español" };
  const LOCALES = { pt: "pt-BR", en: "en-US", es: "es-ES" };
  const textos = idioma => TEXTOS[idioma] || TEXTOS.pt;

  function nomeDoBotao(b, idioma) {
    if (b.nome && b.nome.trim()) return b.nome.trim();
    const t = BOTOES[b.tipo] || BOTOES.personalizado;
    return t.nome[idioma] || t.nome.pt;
  }

  /* ---------- Utilidades de texto ---------- */
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function formatarTamanho(bytes) {
    if (!bytes) return "0 MB";
    if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + " KB";
    return (bytes / 1024 / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " MB";
  }
  function dataLonga(data, hora, idioma) {
    if (!data) return "";
    const [a, m, d] = data.split("-").map(Number);
    const dt = new Date(a, m - 1, d);
    let txt = dt.toLocaleDateString(LOCALES[idioma] || "pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    txt = txt.charAt(0).toUpperCase() + txt.slice(1);
    if (!hora) return txt;
    if (idioma === "en") return txt + " · " + hora;
    return txt + (idioma === "es" ? " a las " : " às ") + hora.replace(":", "h").replace(/h00$/, "h");
  }
  function dataCurta(data) {
    if (!data) return "";
    const [a, m, d] = data.split("-");
    return d + "/" + m + "/" + a;
  }

  /* Texto escuro ou claro, conforme a cor do fundo. */
  function corDoTexto(hex) {
    const h = String(hex || "").replace("#", "");
    if (h.length !== 6) return "#fff";
    const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(c => c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4));
    const lum = .2126 * r + .7152 * g + .0722 * b;
    return lum > .4 ? "#1E1517" : "#FFFFFF";
  }

  /* ---------- Ícones (traço fino, herdam a cor do texto) ---------- */
  const ICONES = {
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    check: '<path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="m9 11 3 3L22 4"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
    bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
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
    back5: '<path d="M19 20 9 12l10-8Z"/><path d="M5 19V5"/>',
    replay: '<path d="M3 12a9 9 0 1 0 9-9 9.8 9.8 0 0 0-6.7 2.7L3 8"/><path d="M3 3v5h5"/>',
    pencil: '<path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    back: '<path d="m12 19-7-7 7-7M19 12H5"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    phone: '<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/>',
    nav: '<path d="m3 11 19-9-9 19-2-8Z"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-10 6L2 7"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1Z"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3Z"/><circle cx="12" cy="13" r="3"/>',
    car: '<path d="M19 17h2v-4l-2-5H5L3 13v4h2"/><circle cx="7.5" cy="17.5" r="2"/><circle cx="16.5" cy="17.5" r="2"/><path d="M9.5 17.5h5"/>',
    glass: '<path d="M8 22h8M12 15v7M6 2h12l-1 7a5 5 0 0 1-10 0Z"/>',
    cake: '<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20M7 8v3M12 8v3M17 8v3M7 4h.01M12 4h.01M17 4h.01"/>',
    touch: '<path d="M9 11V5a2 2 0 0 1 4 0v5"/><path d="M13 10V9a2 2 0 0 1 4 0v2"/><path d="M17 11a2 2 0 0 1 4 0v3a8 8 0 0 1-8 8h-1a8 8 0 0 1-6.4-3.2L3 15.5a2 2 0 0 1 3-2.6L9 16"/>',
    move: '<path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>',
    status: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    brand: '<path d="M12 2 15 8l6 .9-4.5 4.3 1 6.3L12 16.6 6.5 19.5l1-6.3L3 8.9 9 8Z"/>',
    folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>'
  };
  function icone(nome, tam) {
    const t = tam || 20;
    return '<svg class="ic" width="' + t + '" height="' + t + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONES[nome] || ICONES.sparkle) + "</svg>";
  }

  window.Store = {
    TIPOS, TELAS, FINAL_DA_TELA, BOTOES, ICONES_ESCOLHA, CORES, STATUS, IDIOMAS,
    uid, novoProjeto, novoBotao, completar, pendencias, nomeDoBotao, textos,
    listarProjetos, obterProjeto, salvarProjeto, excluirProjeto, duplicarProjeto,
    salvarMidia, obterMidia, excluirMidia, urlMidia, urlsDoProjeto, tamanhoDoProjeto, idsDeMidia,
    lerConfig, gravarConfig, lerMarca,
    esc, formatarTamanho, dataLonga, dataCurta, soDigitos, whatsappInternacional, corDoTexto, icone
  };
})();
