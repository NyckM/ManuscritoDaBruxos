const MODEL_ID = "onnx-community/gemma-3-270m-it-ONNX";
const SYSTEM_PROMPT = `Você é ManuscritoDaBruxos, um diretor criativo e supervisor de efeitos visuais brasileiro.
Você ajuda a construir prompts profissionais para geração de imagens e vídeos, conversa sobre VFX, composição,
3D, edição, color grading e ferramentas como Blender, After Effects, DaVinci Resolve, Nuke, Houdini, ComfyUI,
Unreal Engine e softwares relacionados. Responda em português do Brasil, salvo pedido contrário.
Se estiver criando um prompt, entregue primeiro o prompt final em um bloco claro e depois explique brevemente
as escolhas. Seja imaginativo, prático e honesto. Não invente recursos de software; quando houver dúvida,
indique que a versão ou documentação deve ser verificada.`;

const modePrompts = {
  video: "Aja como diretor de fotografia e prompt designer de vídeo. Priorize ação, movimento de câmera, lente, luz, duração, ritmo, continuidade e negativos.",
  image: "Aja como diretor de arte e prompt designer de imagem. Priorize assunto, composição, lente, iluminação, cor, textura, estilo e negativos.",
  vfx: "Aja como supervisor de VFX. Estruture a resposta em abordagem, captação, tracking, 3D/simulação, composição, acabamento e riscos.",
  software: "Aja como consultor de pipeline audiovisual. Compare ferramentas, proponha etapas executáveis e deixe claros requisitos, limitações e alternativas."
};

const modeLabels = {
  video: "▶ Prompt de vídeo",
  image: "◇ Prompt de imagem",
  vfx: "✦ Supervisor de VFX",
  software: "⌘ Consultor de software"
};

const KNOWLEDGE_BASE = [
  {
    terms: ["jurassic park", "jurassic", "dinossauro", "dinossauri"],
    answer: `Em Jurassic Park (1993), os dinossauros foram criados combinando técnicas práticas e digitais — não foi “só CGI”.

• Stan Winston e sua equipe construíram animatrônicos em tamanho real, incluindo o T. rex, a cabeça e o pescoço do braquiossauro e os velociraptores. Eles eram usados principalmente em planos próximos, interação física e cenas com chuva.
• A Industrial Light & Magic (ILM), supervisionada por Dennis Muren, criou os dinossauros digitais para planos de corpo inteiro, corrida e movimentos impossíveis para os animatrônicos.
• Phil Tippett inicialmente preparava animação em go-motion. Quando Spielberg aprovou os testes digitais da ILM, sua equipe passou a orientar a animação e desenvolveu o Dinosaur Input Device: um esqueleto articulado cujos movimentos eram transferidos para o computador.
• Os artistas estudaram esqueletos, animais reais e biomecânica. Depois da animação, a ILM combinou iluminação, textura, sombras, motion blur, grão e composição para integrar os modelos à fotografia.
• Michael Lantieri cuidou de muitos efeitos físicos no set, como chuva, lama, impactos, árvores e a interação do cenário com criaturas que seriam adicionadas depois.

O resultado funciona porque cada técnica foi usada onde era mais convincente: animatrônicos para presença física e close; CGI para escala, velocidade e liberdade de movimento.`
  },
  {
    terms: ["matrix", "bullet time"],
    answer: `O “bullet time” de Matrix (1999) combinou uma sequência de câmeras fotográficas distribuídas ao redor do ator, câmeras de filme nas extremidades e reconstrução digital. As câmeras eram disparadas em sequência; os quadros intermediários eram tratados e o cenário podia ser substituído ou ampliado em computação gráfica. Isso criou uma câmera virtual que parece se mover em velocidade normal enquanto a ação está quase congelada.`
  },
  {
    terms: ["avatar", "performance capture", "captura de performance"],
    answer: `Avatar combinou performance capture, câmera virtual, animação facial e cenários digitais. Os atores atuavam com marcadores corporais e câmeras faciais; os dados serviam como base para a animação, que depois era refinada por artistas. James Cameron podia enquadrar personagens e ambientes digitais por meio de uma câmera virtual, como se estivesse filmando dentro de Pandora.`
  },
  {
    terms: ["after effects", "blender", "nuke", "houdini", "davinci"],
    answer: `Para escolher a ferramenta, pense na função: After Effects é forte em motion graphics e composição por camadas; Blender cobre modelagem, animação, tracking, simulação e render 3D; Nuke é especializado em composição nodal para VFX; Houdini se destaca em efeitos procedurais e simulações; DaVinci Resolve reúne edição, cor, áudio e composição no Fusion. Um pipeline pode combinar várias delas.`
  }
];

const state = { mode: "video", generator: null, loading: false, generating: false, history: [] };
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const messages = $("#messages");
const input = $("#promptInput");
const initialMessage = messages.innerHTML;

function setStatus(text, ready = false) {
  const status = $("#modelStatus");
  status.textContent = text;
  status.classList.toggle("ready", ready);
}

function showNotice(text, kind = "") {
  const notice = $("#runtimeNotice");
  notice.textContent = text;
  notice.className = `runtime-notice${kind ? ` ${kind}` : ""}`;
}

function setProgress(value, text) {
  const normalized = Math.max(0, Math.min(100, Math.round(value || 0)));
  $("#progressPanel").classList.remove("hidden");
  $("#progressText").textContent = text || "Carregando modelo…";
  $("#progressValue").textContent = `${normalized}%`;
  $("#progressBar").style.width = `${normalized}%`;
}

function addMessage(role, text, typing = false) {
  const article = document.createElement("article");
  article.className = `message ${role}`;
  if (role === "assistant") {
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "✦";
    article.append(avatar);
  }
  const bubble = document.createElement("div");
  bubble.className = `bubble${typing ? " typing" : ""}`;
  const p = document.createElement("p");
  p.textContent = text;
  bubble.append(p);
  article.append(bubble);
  messages.append(article);
  messages.scrollTop = messages.scrollHeight;
  return { article, bubble, p };
}

async function loadModel() {
  if (state.generator || state.loading) return state.generator;
  state.loading = true;
  const button = $("#loadModel");
  button.disabled = true;
  button.textContent = "Carregando…";
  setStatus("Preparando WebGPU");
  showNotice("Iniciando o WebGPU. Aguarde o progresso do download abaixo…");
  setProgress(1, "Conectando ao grimório…");
  try {
    if (location.protocol === "file:") {
      throw new Error("Esta página foi aberta como arquivo local. Inicie-a pelo arquivo iniciar-local.bat para permitir o carregamento do modelo.");
    }
    if (!("gpu" in navigator)) throw new Error("WebGPU não está disponível neste navegador.");
    const { pipeline, env } = await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2");
    env.allowLocalModels = false;
    state.generator = await pipeline("text-generation", MODEL_ID, {
      device: "webgpu",
      // O modelo Gemma 3 270M WebGPU publicado pela comunidade ONNX usa fp32.
      // Solicitar q4 faz alguns navegadores baixarem os arquivos e falharem ao
      // criar a sessão, retornando apenas um código numérico.
      dtype: "fp32",
      progress_callback: (data) => {
        const value = data.progress ?? (data.loaded && data.total ? data.loaded / data.total * 100 : 3);
        const label = data.status === "ready" ? "Finalizando…" : (data.file ? `Baixando ${data.file.split("/").pop()}` : "Carregando Gemma…");
        setProgress(value, label);
      }
    });
    setProgress(100, "Modelo pronto");
    setTimeout(() => $("#progressPanel").classList.add("hidden"), 900);
    setStatus("Gemma ativo · execução local", true);
    showNotice("✓ Modelo carregado e pronto. Agora você pode enviar mensagens pelo campo abaixo.", "ready");
    button.textContent = "Modelo pronto";
    return state.generator;
  } catch (error) {
    console.error("Falha ao carregar Gemma:", error);
    state.generator = null;
    $("#progressPanel").classList.add("hidden");
    const rawError = error?.message || error?.name || String(error || "");
    const friendlyError = /memory|allocation|buffer|RangeError|^[0-9]+$/i.test(rawError)
      ? "A GPU ficou sem memória durante a inicialização. Feche outras abas e programas que usam a GPU e tente novamente."
      : rawError || "Não foi possível carregar o modelo.";
    setStatus("Falha ao carregar");
    showNotice(friendlyError, "error");
    button.disabled = false;
    button.textContent = "Tentar novamente";
    addMessage("assistant", `O modelo não carregou: ${friendlyError}`);
    throw error;
  } finally {
    state.loading = false;
  }
}

async function generate(text) {
  if (state.generating) return;
  state.generating = true;
  $("#sendButton").disabled = true;
  addMessage("user", text);
  state.history.push({ role: "user", content: text });
  const pending = addMessage("assistant", "Consultando o manuscrito", true);
  try {
    const knownAnswer = findKnowledge(text);
    if (knownAnswer && !/crie|prompt|roteiro|transforme|melhore/i.test(text)) {
      pending.p.textContent = knownAnswer;
      pending.bubble.classList.remove("typing");
      state.history.push({ role: "assistant", content: knownAnswer });
      return;
    }
    const generator = await loadModel();
    pending.p.textContent = "Criando sua resposta";
    const retrievedContext = findKnowledge(text);
    const conversation = [
      { role: "system", content: `${SYSTEM_PROMPT}

Modo atual: ${modePrompts[state.mode]}
Responda à pergunta exatamente como ela foi feita. Perguntas históricas ou técnicas devem receber uma explicação factual, não um prompt. Não comece se apresentando. Não escreva palavras incompletas.
${retrievedContext ? `\nContexto confiável para esta pergunta:\n${retrievedContext}` : ""}` },
      ...state.history.slice(-10)
    ];
    const output = await generator(conversation, {
      max_new_tokens: 512,
      do_sample: false,
      repetition_penalty: 1.12
    });
    const generated = output?.[0]?.generated_text;
    const answer = Array.isArray(generated)
      ? generated.at(-1)?.content
      : String(generated || "").replace(text, "").trim();
    pending.p.textContent = isBadAnswer(answer)
      ? "Esse modelo local compacto não conseguiu produzir uma resposta confiável para esta pergunta. Tente incluir o nome do filme, software ou efeito e mais contexto."
      : answer;
    pending.bubble.classList.remove("typing");
    state.history.push({ role: "assistant", content: pending.p.textContent });
  } catch {
    pending.article.remove();
  } finally {
    state.generating = false;
    $("#sendButton").disabled = false;
    input.focus();
  }
}

function usePrompt(text) {
  input.value = text;
  input.dispatchEvent(new Event("input"));
  input.focus();
}

function clearChat() {
  state.history = [];
  messages.innerHTML = initialMessage;
  wirePromptButtons();
}

function findKnowledge(text) {
  const normalized = text.toLocaleLowerCase("pt-BR");
  return KNOWLEDGE_BASE.find((entry) => entry.terms.some((term) => normalized.includes(term)))?.answer || "";
}

function isBadAnswer(answer) {
  if (!answer || answer.trim().length < 45) return true;
  const words = answer.trim().split(/\s+/);
  const malformed = words.filter((word) => word.length > 22 || /[^\p{L}\p{N}.,;:!?'"“”()/%+\-–—`*#]/u.test(word));
  return malformed.length > Math.max(3, words.length * .14);
}

function wirePromptButtons() {
  $$("#messages [data-prompt]").forEach((button) => {
    button.addEventListener("click", () => usePrompt(button.dataset.prompt));
  });
}

$$("[data-view]").forEach((button) => button.addEventListener("click", () => {
  const view = button.dataset.view;
  $("#chatView").classList.toggle("hidden", view !== "chat");
  $("#aboutView").classList.toggle("hidden", view !== "about");
  $$(".rail-button").forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  window.scrollTo({ top: 0, behavior: "smooth" });
}));

$$(".mode").forEach((button) => button.addEventListener("click", () => {
  state.mode = button.dataset.mode;
  $$(".mode").forEach((item) => item.classList.toggle("active", item === button));
  $("#modeBadge").textContent = modeLabels[state.mode];
  input.placeholder = {
    video: "Descreva a cena, ação ou sensação do seu vídeo…",
    image: "Descreva a imagem que você quer criar…",
    vfx: "Conte qual efeito ou plano você precisa executar…",
    software: "Pergunte sobre ferramentas ou seu pipeline…"
  }[state.mode];
}));

$$(".quick[data-prompt]").forEach((button) => button.addEventListener("click", () => usePrompt(button.dataset.prompt)));
$("#chatForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  input.style.height = "auto";
  generate(text);
});
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    $("#chatForm").requestSubmit();
  }
});
input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
});
$("#loadModel").addEventListener("click", () => loadModel().catch(() => {}));
$("#clearChat").addEventListener("click", clearChat);
$("#newChatTop").addEventListener("click", clearChat);
wirePromptButtons();

if (!("gpu" in navigator)) {
  setStatus("WebGPU não detectado");
  $("#loadModel").title = "Use Chrome ou Edge atualizado com aceleração de hardware";
}

if (location.protocol === "file:") {
  showNotice("Para os botões e o modelo funcionarem corretamente, feche esta aba e execute iniciar-local.bat.", "error");
} else if ("gpu" in navigator) {
  showNotice("WebGPU detectado. Clique em “Carregar modelo”; quando terminar, aparecerá “Modelo pronto”.");
} else {
  showNotice("WebGPU não foi detectado. Use Chrome ou Edge atualizado com aceleração de hardware ativa.", "error");
}
