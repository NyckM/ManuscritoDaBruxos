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

function getSceneData(idea, duration, aspect, structure) {
  const cleanIdea = normalize(idea);
  const profile = detectProfile(cleanIdea);
  const lighting = detectLighting(cleanIdea);
  const sound = detectSound(cleanIdea);
  const beats = splitBeats(cleanIdea, duration);
  const structureText = structure === "continuous"
    ? "um único plano contínuo, sem cortes e sem mudanças incoerentes de eixo"
    : "sequência cinematográfica em múltiplos planos, com cortes motivados pela ação e continuidade espacial";
  const timing = beats || `Ao longo dos ${duration} segundos, a ação evolui de forma clara, legível e contínua, com início, desenvolvimento e imagem final bem definida.`;
  return { cleanIdea, profile, lighting, sound, beats, structureText, timing, duration, aspect, structure };
}

function buildSeedance(data) {
  const { cleanIdea, profile, lighting, sound, duration, aspect, structure, beats } = data;
  const shotCount = structure === "continuous" ? "1 plano contínuo" : `${Math.max(3, Math.min(6, Math.round(duration / 3)))} planos`;
  const progression = beats || `0–${Math.round(duration * .3)}s: estabelecer claramente o personagem e o ambiente. ${Math.round(duration * .3)}–${Math.round(duration * .75)}s: desenvolver a ação principal com intensidade crescente. ${Math.round(duration * .75)}–${duration}s: concluir a ação em uma imagem final forte e legível.`;
  const cutRule = structure === "continuous"
    ? "A câmera permanece em uma tomada única: sem cortes, sem zoom arbitrário, sem trocar o ponto de vista."
    : "Cada plano deve ter enquadramento e função diferentes; não repetir o mesmo ângulo.";
  return `SEEDANCE — ${shotCount} / ${duration}s / ${aspect}

Conceito: ${cleanIdea}

Estrutura temporal: ${progression}

Câmera: ${profile.camera}, usando ${profile.lens}. ${cutRule}

Visual: ${lighting}, composição cinematográfica, texturas físicas detalhadas, profundidade atmosférica, motion blur natural, grão sutil de filme e gradação de cor profissional. [VFX: efeitos integrados à iluminação da cena, sombras de contato, reflexos e interação física com o ambiente].

Áudio: ${sound}. Sem música, salvo quando fizer parte da cena.

Continuidade: manter identidade, roupas, anatomia, direção de movimento, escala, cenário e lógica de luz consistentes. Evitar texto, logos, membros extras, objetos surgindo ou desaparecendo, deformações, física caótica e mudanças involuntárias de estilo.

TOTAL: ${duration}s / ${shotCount} / ${aspect}`;
}

function buildBernini(data) {
  const { cleanIdea, profile, lighting, sound, duration, aspect, structureText } = data;
  return `Tarefa: geração texto-para-vídeo (T2V). Crie um vídeo de ${duration} segundos em ${aspect}, construído como ${structureText}. ${cleanIdea} A direção visual transforma a ideia em uma cena cinematográfica de alta qualidade: ${profile.camera}, usando ${profile.lens}. A ação do sujeito e os movimentos secundários do ambiente são descritos como um processo contínuo, com causa, reação e conclusão claras; vento, tecido, cabelo, partículas e elementos de fundo respondem fisicamente à cena. A iluminação utiliza ${lighting}, preservando uma única lógica de fontes, intensidade e direção. O sujeito mantém aparência, roupa, proporções e identidade constantes em todos os quadros. Materiais exibem textura, volume, sombras de contato e reflexos coerentes; a composição mantém hierarquia visual, profundidade e legibilidade. Acabamento fotorrealista cinematográfico, detalhe fino, movimento natural, gradação de cor profissional e alta qualidade estética. Áudio sugerido: ${sound}. Preservar anatomia, estrutura espacial, continuidade temporal e direção do movimento; evitar texto legível, logos, flicker, duplicações, deformações e alterações não solicitadas.`;
}

function buildLtx(data) {
  const { cleanIdea, profile, lighting, sound, duration, aspect, structureText, timing } = data;
  return `Vídeo cinematográfico de ${duration} segundos em ${aspect}, apresentado como ${structureText}. O plano mostra ${cleanIdea.charAt(0).toLocaleLowerCase("pt-BR") + cleanIdea.slice(1)} ${timing} ${profile.camera}, usando ${profile.lens}. O personagem demonstra intenção por meio do olhar, da postura, da respiração e de gestos físicos específicos, enquanto cada ação conduz naturalmente à próxima. O ambiente apresenta ${lighting}, superfícies táteis, escala coerente, sombras de contato, reflexos naturais, profundidade atmosférica e pequenas imperfeições realistas. A câmera se move em relação clara ao sujeito e revela como ele aparece após cada movimento, sem perder o eixo nem a continuidade. O áudio sincronizado contém ${sound}, com perspectiva sonora e reverberação correspondentes ao espaço; qualquer diálogo deve ser curto, entre aspas, com pausas e ações físicas entre as falas. Manter personagem, roupas, anatomia, cenário, direção de movimento e iluminação consistentes do início ao fim. Acabamento cinematográfico fotorrealista, gradação de cor profissional, motion blur natural, detalhe fino, grão sutil e highlights suaves; sem texto legível, logos, duplicações, deformações, física caótica, ações excessivas ou instruções visuais contraditórias.`;
}

function buildPrompt(idea, duration, aspect, structure, platform) {
  const data = getSceneData(idea, duration, aspect, structure);
  if (platform === "bernini") return buildBernini(data);
  if (platform === "ltx") return buildLtx(data);
  return buildSeedance(data);
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
  const platform = $("#platform").value;
  const names = { seedance: "Seedance", bernini: "Bernini", ltx: "LTX-2.3" };
  output.textContent = buildPrompt(idea, Number($("#duration").value), $("#aspect").value, $("#structure").value, platform);
  $("#resultSubtitle").textContent = `Estruturado especificamente para ${names[platform]}.`;
  $("#methodBadge").textContent = `✓ Método ${names[platform]}`;
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
