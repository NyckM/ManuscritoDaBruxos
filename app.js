const $ = (selector) => document.querySelector(selector);
const input = $("#ideaInput");
const form = $("#promptForm");
const resultCard = $("#resultCard");
const output = $("#promptOutput");

const normalize = (text) => text.trim().replace(/\s+/g, " ").replace(/\s+([,.!?;:])/g, "$1");

function detectProfile(text) {
  const t = text.toLocaleLowerCase("pt-BR");
  if (/pov|primeira pessoa|pelos olhos/.test(t)) {
    return {
      camera: "A câmera assume rigorosamente a perspectiva em primeira pessoa, com movimento natural da cabeça, microtrepidações orgânicas e mãos visíveis quando coerente; sem cortes, sem zoom e sem abandonar o ponto de vista",
      lens: "lente grande-angular moderada, distorção periférica sutil e foco imperfeito natural"
    };
  }
  if (/luta|batalha|persegui|correndo|explos|ataque|combate/.test(t)) {
    return {
      camera: "A câmera acompanha a ação com tracking handheld controlado, aproxima-se nos impactos e abre o quadro nos momentos de maior escala, mantendo geografia e direção de movimento claras",
      lens: "lente anamórfica de 35 mm, motion blur natural e profundidade de campo responsiva"
    };
  }
  if (/rosto|olhar|retrato|chora|sorri|fala|diálogo|dialogo/.test(t)) {
    return {
      camera: "A câmera começa em plano médio e realiza um dolly-in lento até um close-up, acompanhando gestos, respiração e mudanças sutis da expressão",
      lens: "lente de 50 mm, profundidade de campo rasa e foco preciso nos olhos"
    };
  }
  if (/paisagem|cidade|floresta|deserto|montanha|espaço|espaco/.test(t)) {
    return {
      camera: "O plano abre em enquadramento geral de estabelecimento e avança suavemente em direção ao sujeito, revelando escala, profundidade e camadas do ambiente",
      lens: "lente de 24 mm, perspectiva ampla e profundidade atmosférica"
    };
  }
  return {
    camera: "A câmera inicia em plano geral de estabelecimento, aproxima-se em travelling suave e termina em plano médio, sempre mantendo o sujeito como ponto de atenção",
    lens: "lente cinematográfica de 35 mm, profundidade de campo natural e movimento estável"
  };
}

function detectLighting(text) {
  const t = text.toLocaleLowerCase("pt-BR");
  if (/noite|noturno|lua|neon/.test(t)) return "iluminação noturna motivada, contraste entre luz fria ambiente e recortes luminosos, reflexos controlados e sombras profundas";
  if (/pôr do sol|por do sol|entardecer|dourad/.test(t)) return "luz lateral de golden hour, contraluz quente, sombras longas, highlights suaves e atmosfera levemente enevoada";
  if (/terror|sombria|escuro|medo/.test(t)) return "luz de baixa intensidade, fonte lateral dura, áreas de sombra densa, névoa volumétrica sutil e paleta fria dessaturada";
  if (/futur|sci-fi|ficção científica|ficcao cientifica/.test(t)) return "fontes práticas integradas ao cenário, recortes de luz ciano e magenta, superfícies metálicas refletindo luz e contraste cinematográfico";
  return "iluminação cinematográfica motivada pelo ambiente, contraste equilibrado, recorte suave no sujeito e highlights com roll-off natural";
}

function detectSound(text) {
  const t = text.toLocaleLowerCase("pt-BR");
  const sounds = [];
  if (/chuva|tempestade/.test(t)) sounds.push("chuva atingindo superfícies");
  if (/floresta|árvore|arvore/.test(t)) sounds.push("vento nas folhas e ambiência distante da floresta");
  if (/cidade|rua/.test(t)) sounds.push("ambiência urbana em profundidade");
  if (/mar|oceano|praia/.test(t)) sounds.push("ondas, vento e reverberação costeira");
  if (/explos|luta|batalha/.test(t)) sounds.push("impactos definidos, deslocamento de ar e detritos");
  if (/fala|diz|diálogo|dialogo/.test(t)) sounds.push("vozes nítidas, interpretação natural e room tone coerente");
  return sounds.length ? sounds.join(", ") : "ambiência correspondente ao local, movimentos físicos sincronizados e room tone natural";
}

function splitBeats(text, duration) {
  const clauses = text.split(/(?<=[.!?;])\s+|\s+(?:então|depois|em seguida|até que)\s+/i).map(normalize).filter(Boolean);
  if (clauses.length < 2) return "";
  const usable = clauses.slice(0, 5);
  const segment = duration / usable.length;
  return usable.map((beat, index) => {
    const start = Math.round(index * segment * 10) / 10;
    const end = Math.round((index + 1) * segment * 10) / 10;
    return `${start}–${end}s: ${beat}`;
  }).join(" ");
}

function buildPrompt(idea, duration, aspect, structure) {
  const cleanIdea = normalize(idea);
  const profile = detectProfile(cleanIdea);
  const lighting = detectLighting(cleanIdea);
  const sound = detectSound(cleanIdea);
  const beats = splitBeats(cleanIdea, duration);
  const structureText = structure === "continuous"
    ? "um único plano contínuo, sem cortes e sem mudanças incoerentes de eixo"
    : "sequência cinematográfica em múltiplos planos, com cortes motivados pela ação e continuidade espacial";
  const timing = beats || `Ao longo dos ${duration} segundos, a ação evolui de forma clara, legível e contínua, com início, desenvolvimento e imagem final bem definida.`;

  return `VÍDEO CINEMATOGRÁFICO — ${duration} segundos, ${structureText}, proporção ${aspect}. ${cleanIdea} ${timing} ${profile.camera}, usando ${profile.lens}. A cena apresenta ${lighting}; materiais e superfícies têm textura física detalhada, escala coerente, sombras de contato, reflexos naturais, movimento com peso e pequenas imperfeições realistas. A ação acontece no presente e cada gesto conduz naturalmente ao seguinte; emoções são demonstradas por postura, olhar, respiração e comportamento físico, nunca por rótulos abstratos. ÁUDIO: ${sound}; sem música, salvo quando ela fizer parte da própria cena. Manter identidade, roupas, anatomia, direção de movimento, iluminação e cenário consistentes durante todo o vídeo. Evitar texto legível, logos acidentais, objetos surgindo ou desaparecendo, membros extras, deformações, física caótica, cortes involuntários, câmera sem motivação e mudanças bruscas de estilo. Acabamento cinematográfico fotorrealista, gradação de cor profissional, motion blur natural, detalhe fino, grão sutil de filme e highlights suaves.`;
}

function updateCount() {
  $("#charCount").textContent = `${input.value.length} / 1200`;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const idea = input.value.trim();
  if (idea.length < 12) {
    input.focus();
    input.setCustomValidity("Escreva um pouco mais sobre a cena.");
    input.reportValidity();
    return;
  }
  input.setCustomValidity("");
  output.textContent = buildPrompt(idea, Number($("#duration").value), $("#aspect").value, $("#structure").value);
  resultCard.classList.remove("hidden");
  resultCard.scrollIntoView({ behavior: "smooth", block: "center" });
});

input.addEventListener("input", () => {
  input.setCustomValidity("");
  updateCount();
});

$("#copyButton").addEventListener("click", async () => {
  await navigator.clipboard.writeText(output.textContent);
  const button = $("#copyButton");
  button.textContent = "✓ Copiado";
  setTimeout(() => { button.textContent = "□ Copiar"; }, 1600);
});

$("#downloadButton").addEventListener("click", () => {
  const blob = new Blob([output.textContent], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "prompt-manuscrito-da-bruxos.txt";
  link.click();
  URL.revokeObjectURL(link.href);
});

$("#resetButton").addEventListener("click", () => {
  form.reset();
  input.value = "";
  resultCard.classList.add("hidden");
  updateCount();
  input.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

updateCount();
