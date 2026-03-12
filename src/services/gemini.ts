import { GoogleGenAI, Type } from "@google/genai";
import { detectProvider, providerGenerateText, openaiGenerateImage, type AIProvider } from './aiProvider';

// Tenta pegar a chave customizada do localStorage, senão cai na env
const getApiKey = () => {
  if (typeof window !== 'undefined') {
    const customKey = localStorage.getItem('blent_custom_gemini_key');
    if (customKey && customKey.trim().length > 0) {
      console.log('[Gemini] Usando chave API customizada do usuário.');
      return customKey.trim();
    }
  }

  const key = import.meta.env?.VITE_GEMINI_API_KEY ||
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    "";

  if (!key) {
    console.error("FATAL ERROR: VITE_GEMINI_API_KEY is not defined in the environment! The app will crash.");
  }
  console.log('[Gemini] Usando chave API do servidor (.env).');
  return key;
};

// Proxy para instanciar dinamicamente, garantindo que pegue a chave atualizada do localStorage
const ai = {
  get models() {
    const instance = new GoogleGenAI({
      apiKey: getApiKey() || 'dummy_key_to_prevent_crash'
    });
    return instance.models;
  }
};

// =============================================
// MULTI-PROVIDER TEXT HELPER
// =============================================

/** Retorna provedor + chave customizada (ou null se usar servidor Gemini) */
const getCustomProviderInfo = (): { provider: AIProvider; apiKey: string } | null => {
  if (typeof window === 'undefined') return null;
  const key = localStorage.getItem('blent_custom_gemini_key');
  if (!key || !key.trim()) return null;
  return { provider: detectProvider(key), apiKey: key.trim() };
};

/**
 * Tenta gerar texto pelo provedor customizado (OpenAI/Claude).
 * Se o provedor for Gemini ou não houver chave customizada, usa o SDK do Gemini.
 */
const multiProviderGenerateText = async (
  prompt: string,
  opts?: { jsonMode?: boolean; systemPrompt?: string }
): Promise<string> => {
  const custom = getCustomProviderInfo();
  if (custom && custom.provider !== 'gemini') {
    try {
      const jsonPrompt = opts?.jsonMode
        ? prompt + '\n\nIMPORTANTE: Retorne APENAS um JSON válido, sem texto adicional, sem markdown, sem ```json.'
        : prompt;
      const result = await providerGenerateText(custom.apiKey, custom.provider, jsonPrompt, opts);
      console.log(`[AI] Texto gerado via ${custom.provider}`);
      return result;
    } catch (err) {
      console.warn(`[AI] Falha no provedor ${custom.provider}, voltando ao Gemini:`, err);
    }
  }
  // Fallback: usa Gemini SDK
  return ''; // sinaliza para caller usar o Gemini SDK normalmente
};

/**
 * Wrapper completo: tenta provedor customizado, se retornar vazio usa Gemini SDK.
 * Para funções que precisam de JSON, passa jsonMode: true.
 */
const generateWithProvider = async (
  prompt: string,
  geminiModel: string,
  opts?: { jsonMode?: boolean; geminiConfig?: any }
): Promise<string> => {
  // Tentar provedor customizado primeiro
  const customResult = await multiProviderGenerateText(prompt, { jsonMode: opts?.jsonMode });
  if (customResult) return customResult;

  // Fallback: Gemini SDK
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: prompt,
    config: opts?.geminiConfig || (opts?.jsonMode ? { responseMimeType: 'application/json' } : undefined),
  });
  return response.text || '';
};

export const analyzePostStyle = async (imageData: string) => {
  const model = "gemini-2.5-flash";

  const prompt = "Você é um extrator de texto de imagens. Analise esta imagem de um post e extraia TODO o texto visível. Identifique: 1) O texto principal/título (geralmente o maior, mais destacado ou o slogan principal) como 'mainTitle', 2) Todo o restante do texto de apoio, legenda, autor ou descrição como 'bodyText'. Retorne um JSON com os campos: mainTitle (string - o texto principal da imagem), bodyText (string - todo o texto secundário ou de suporte, separado por nova linha se houver múltiplos), hasImage (boolean - se a imagem contém uma foto ou ilustração além do texto).";

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ inlineData: { data: imageData.split(',')[1], mimeType: "image/png" } }, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mainTitle: { type: Type.STRING, description: "Texto principal/título da imagem" },
            bodyText: { type: Type.STRING, description: "Texto secundário, autor, legenda ou descrição" },
            hasImage: { type: Type.BOOLEAN, description: "Se a imagem tem foto ou ilustração além do texto" },
          },
          required: ["mainTitle"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error analyzing post:", error);
    return null;
  }
};


export const generateAudienceQuestions = async (
  audienceData: any,
  serviceInfo: string,
  helpInfo: string,
  awarenessLevel: string = 'Inconsciente',
  informalityLevel: number = 50
) => {
  const model = "gemini-2.5-flash";

  const audienceContext = typeof audienceData === 'string'
    ? `Público: ${audienceData}`
    : `Público Detalhado: ${JSON.stringify(audienceData)}`;

  const prompt = `
    Você é um estrategista de conteúdo sênior e psicólogo comportamental.
    Com base no contexto abaixo, gere um conjunto de INSIGHTS ESTRATÉGICOS em forma de perguntas que o público faria.
    
    CONTEXTO:
    ${audienceContext}
    O que eu faço: ${serviceInfo}
    Como eu ajudo: ${helpInfo}
    Nível de Consciência do Público: ${awarenessLevel}
    Nível de Informalidade (0-100): ${informalityLevel} (0 é muito formal, 100 é gírias e linguagem de internet)
    
    OBJETIVO:
    Gerar 8 insights poderosos. Cada insight deve conter uma pergunta real do público, a categoria da dúvida, a estratégia por trás da resposta e um "gancho" (hook) inicial para um post.

    CATEGORIAS POSSÍVEIS:
    - "Objeção Oculta": O que impede a compra mas eles não dizem.
    - "Dúvida Técnica": Confusão sobre o processo.
    - "Desabafo Emocional": Medos e frustrações reais.
    - "Desejo Aspiracional": Onde eles querem chegar.
    - "Mito/Crença": O que eles acreditam que está errado.

    DIRETRIZES:
    1. Perguntas devem ser ultra-específicas e refletir o NÍVEL DE CONSCIÊNCIA (${awarenessLevel}).
    2. O tom das perguntas deve respeitar o NÍVEL DE INFORMALIDADE (${informalityLevel}).
    3. A estratégia deve explicar QUAL gatilho mental usar na resposta.
    4. O gancho deve ser impossível de ignorar.
    
    Retorne um JSON com um array chamado "insights".
  `;

  try {
    const result = await generateWithProvider(prompt, model, { jsonMode: true });
    return JSON.parse(result || '{"insights": []}');
  } catch (error) {
    console.error("Error generating questions:", error);
    return { insights: [] };
  }
};

export const generateCaption = async (postContent: string) => {
  const model = "gemini-2.5-flash";
  const prompt = `Crie uma legenda engajadora para o Instagram baseada neste conteúdo: "${postContent}". Use emojis, hashtags relevantes e um tom que incentive comentários.`;

  try {
    const result = await generateWithProvider(prompt, model);
    return result || "Erro ao gerar legenda.";
  } catch (error) {
    console.error("Error generating caption:", error);
    return "Erro ao gerar legenda.";
  }
};
// =============================================
// IMAGEM COM IA — SISTEMA INTELIGENTE
// =============================================

// Chave do servidor dedicada para geração de imagens
const SERVER_IMAGE_API_KEY = 'AIzaSyDLVpDVtbyzAxezqbZUtAgQAuCVpdEEjFU';
const DAILY_IMAGE_LIMIT = 8; // Limite diário para quem usa chave do servidor
const DEFAULT_IMAGE_MODEL = 'gemini-2.5-flash-preview-image-generation';

/** Verifica se o usuário tem chave customizada */
export const hasCustomApiKey = (): boolean => {
  if (typeof window === 'undefined') return false;
  const key = localStorage.getItem('blent_custom_gemini_key');
  return !!(key && key.trim().length > 0);
};

/** Retorna o modelo de imagem preferido salvo pelo usuário */
export const getPreferredImageModel = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('blent_preferred_image_model');
    if (saved && saved.trim()) return saved.trim();
  }
  return DEFAULT_IMAGE_MODEL;
};

/** Salva o modelo de imagem preferido */
export const setPreferredImageModel = (model: string) => {
  localStorage.setItem('blent_preferred_image_model', model);
};

/** Lista modelos de imagem disponíveis para uma API key */
export const listImageModels = async (apiKey: string): Promise<{ id: string; displayName: string }[]> => {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    
    const imageModels: { id: string; displayName: string }[] = [];
    for (const model of data.models || []) {
      const name: string = model.name || '';
      const displayName: string = model.displayName || name;
      const methods: string[] = model.supportedGenerationMethods || [];
      
      // Filtrar modelos que suportam geração de conteúdo ou predict E têm "image" ou "imagen" no nome
      if ((methods.includes('generateContent') || methods.includes('predict')) && /image|imagen/i.test(name)) {
        // Extrair apenas o ID (sem "models/" prefix)
        const id = name.replace('models/', '');
        imageModels.push({ id, displayName });
      }
    }
    
    return imageModels;
  } catch (error) {
    console.error('[Gemini] Erro ao listar modelos:', error);
    return [];
  }
};

/** Verifica e atualiza o contador diário de imagens (para chave do servidor) */
export const checkImageDailyLimit = (): { allowed: boolean; used: number; limit: number } => {
  if (typeof window === 'undefined') return { allowed: false, used: 0, limit: DAILY_IMAGE_LIMIT };
  
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const savedDate = localStorage.getItem('blent_image_gen_date');
  let count = parseInt(localStorage.getItem('blent_image_gen_count') || '0', 10);
  
  // Reset se é um novo dia
  if (savedDate !== today) {
    count = 0;
    localStorage.setItem('blent_image_gen_date', today);
    localStorage.setItem('blent_image_gen_count', '0');
  }
  
  return { allowed: count < DAILY_IMAGE_LIMIT, used: count, limit: DAILY_IMAGE_LIMIT };
};

/** Incrementa o contador diário */
const incrementImageCount = () => {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem('blent_image_gen_date', today);
  const current = parseInt(localStorage.getItem('blent_image_gen_count') || '0', 10);
  localStorage.setItem('blent_image_gen_count', String(current + 1));
};

export const generateBackgroundImages = async (prompt: string, userPrompt?: string, modelOverride?: string): Promise<string[]> => {
  try {
    const usingCustomKey = hasCustomApiKey();
    const apiKey = usingCustomKey
      ? localStorage.getItem('blent_custom_gemini_key')!.trim()
      : SERVER_IMAGE_API_KEY;
    
    // Verificar limite diário para quem usa chave do servidor
    if (!usingCustomKey) {
      const { allowed, used, limit } = checkImageDailyLimit();
      if (!allowed) {
        console.warn(`[AI] Limite de imagens atingido (${used}/${limit}).`);
        return [];
      }
    }

    const fullPrompt = userPrompt
      ? `${userPrompt}. Contexto visual: ${prompt}`
      : `Gere uma imagem de fundo premium para um post de redes sociais sobre: "${prompt}". Estilo: fotografia de alta qualidade, iluminação dramática, cores ricas e composição profissional. NÃO inclua texto na imagem, somente a arte visual.`;

    // Detectar provedor para imagens
    const provider = usingCustomKey ? detectProvider(apiKey) : 'gemini';
    console.log(`[AI] Gerando imagem via ${provider} | Chave: ${usingCustomKey ? 'customizada' : 'servidor'}`);

    let images: string[] = [];

    if (provider === 'openai') {
      // OpenAI → DALL-E 3
      images = await openaiGenerateImage(apiKey, fullPrompt);
    } else {
      // Gemini (padrão + Claude fallback para imagem)
      const geminiKey = provider === 'claude' ? SERVER_IMAGE_API_KEY : apiKey;
      const model = modelOverride || (usingCustomKey && provider === 'gemini' ? getPreferredImageModel() : DEFAULT_IMAGE_MODEL);
      const instance = new GoogleGenAI({ apiKey: geminiKey });

      if (model.startsWith('imagen')) {
        // Modelos Imagen 3 e 4 usam o endpoint dedicado de gerar imagens (predict fallback interno)
        const response = await instance.models.generateImages({
          model,
          prompt: fullPrompt,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
          }
        });
        
        if (response.generatedImages && response.generatedImages.length > 0) {
          for (const img of response.generatedImages) {
            if (img.image && img.image.imageBytes) {
              images.push(`data:image/jpeg;base64,${img.image.imageBytes}`);
            }
          }
        }
      } else {
        // Modelos Flash (gemini-2.5-flash) suportam IMAGE multimodality no generateContent
        const response = await instance.models.generateContent({
          model,
          contents: fullPrompt,
          config: {
            responseModalities: ['IMAGE', 'TEXT'],
          }
        });

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData?.mimeType?.startsWith('image/')) {
              images.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
            }
          }
        }
      }
    }

    // Incrementar contador se usando chave do servidor
    if (!usingCustomKey && images.length > 0) {
      incrementImageCount();
    }

    return images;
  } catch (error: any) {
    console.error("Error generating background image:", error);
    let errorMessage = error.message || "Erro desconhecido ao gerar imagem.";
    const status = error.status || error?.response?.status;
    
    // Categorizar erros comuns da API
    if (errorMessage.includes('paid plans') || errorMessage.includes('PAY_AS_YOU_GO') || status === 400) {
      errorMessage = "PAY_AS_YOU_GO_REQUIRED";
    } else if (errorMessage.includes('Quota exceeded') || status === 429) {
      errorMessage = "QUOTA_EXCEEDED";
    } else if (status === 403 || status === 401) {
      errorMessage = "INVALID_API_KEY";
    } else {
      errorMessage = `Erro da API: ${errorMessage}`;
    }
    
    throw new Error(errorMessage);
  }
};

export const generateQuote = async (topic: string): Promise<{ text: string; author: string } | null> => {
  const model = "gemini-2.5-flash";
  const prompt = `Gere uma citação inspiradora e famosa sobre o tema: "${topic}". 
  Retorne APENAS um JSON com os campos: 
  - text: a frase da citação em português.
  - author: o nome do autor da frase.`;

  try {
    const result = await generateWithProvider(prompt, model, { jsonMode: true });
    return JSON.parse(result || "null");
  } catch (error) {
    console.error("Error generating quote:", error);
    return null;
  }
};

export const suggestTextVariations = async (title: string, description: string) => {
  const model = "gemini-2.5-flash";
  const prompt = `Gere 3 variações criativas e impactantes para este conteúdo de post de rede social. Mantenha a mesma essência, mas mude as palavras ou o direcionamento (ex: uma mais direta, uma mais emocional, uma mais provocativa).
  
  Título Original: "${title}"
  Descrição Original: "${description}"
  
  Retorne um JSON com um array "variations" contendo objetos com "title" e "description".`;

  try {
    const result = await generateWithProvider(prompt, model, { jsonMode: true });
    return JSON.parse(result || '{"variations": []}');
  } catch (error) {
    console.error("Error suggesting variations:", error);
    return { variations: [] };
  }
};

export const generateStorytellingScript = async (
  objective: string,
  story: string,
  audience: string,
  tone: string,
  cta: string,
  extraContext: string
) => {
  const model = "gemini-2.5-flash";
  const prompt = `Você é um roteirista especialista em storytelling para redes sociais (Reels, TikTok, Shorts).
  Sua missão é criar um roteiro de vídeo altamente engajador baseado em uma história real, conectando-a a um objetivo específico.

  DADOS DO ROTEIRO:
  Objetivo do vídeo: ${objective}
  A História: ${story}
  Público-Alvo: ${audience}
  Tom da comunicação: ${tone}
  Chamada para Ação (CTA): ${cta}
  Contexto Adicional: ${extraContext}

  ESTRUTURA OBRIGATÓRIA DO ROTEIRO:
  1. Gancho (Hook): Os primeiros 3 segundos. Tem que ser magnético, gerando curiosidade imediata.
  2. Introdução da História: O contexto inicial (o "mundo comum" antes do conflito).
  3. O Conflito/Clímax: O momento de tensão, erro, ou virada de chave na história.
  4. A Resolução/Lição: Como a história se resolveu e qual o aprendizado (conectando com o objetivo).
  5. CTA: A chamada para ação clara e direta.

  Retorne um JSON com os seguintes campos:
  - title: Um título interno para o roteiro.
  - hook: O texto exato para falar nos primeiros 3 segundos.
  - storyBody: O desenvolvimento da história (Introdução, Conflito, Resolução).
  - lesson: A lição principal ou ponte para a venda/objetivo.
  - cta: O texto exato da chamada para ação.
  - visualCues: Dicas visuais (o que mostrar na tela, expressões, B-roll).`;

  try {
    const result = await generateWithProvider(prompt, model, { jsonMode: true });
    return JSON.parse(result || "{}");
  } catch (error) {
    console.error("Error generating storytelling script:", error);
    return null;
  }
};

export const generateAdScript = async (productInfo: string, targetAudience: string, tone: string) => {
  const model = "gemini-2.5-flash";
  const prompt = `Você é um copywriter de alta conversão especializado em Meta Ads.
  Gere um roteiro de anúncio em vídeo (Reels/TikTok) para o seguinte produto/serviço:
  
  Produto: "${productInfo}"
  Público-Alvo: "${targetAudience}"
  Tom/Ângulo: "${tone}" (ex: dor, medo, desejo, dificuldade)
  
  O roteiro deve conter:
  1. Gancho (Hook): Os primeiros 3 segundos para parar o scroll.
  2. Corpo (Body): Onde você desenvolve a oferta e conecta com o público.
  3. CTA (Chamada para Ação): O que o usuário deve fazer agora.
  4. Dicas de Otimização: Dicas técnicas para o vídeo performar melhor.
  
  Retorne um JSON com os campos: hook, body, cta, optimizationTips.`;

  try {
    const result = await generateWithProvider(prompt, model, { jsonMode: true });
    return JSON.parse(result || "{}");
  } catch (error) {
    console.error("Error generating ad script:", error);
    return null;
  }
};

export const optimizeIdea = async (ideaNote: string) => {
  const model = "gemini-2.5-flash";
  const prompt = `Você é um planejador de conteúdo especialista. Um criador de conteúdo teve a seguinte anotação/ideia e quer expandi-la num conteúdo completo:
  
  Ideia Original: "${ideaNote}"

  
  Sua tarefa é expandir essa ideia fornecendo:
  1. Título do post (chamativo)
  2. Mais ideias ou ângulos sobre o que falar no post
  3. Fatos interessantes ou Momentos históricos (se aplicável ao tópico) que enriqueçam a mensagem
  4. Um CTA (Chamada de Ação) sugerida 

  Retorne um JSON com os seguintes campos:
  - title: O título sugerido
  - expansion: O texto expandindo a ideia (explicação detalhada do que falar)
  - facts: Um array de strings com fatos ou história
  - cta: A chamada de ação`;

  try {
    const result = await generateWithProvider(prompt, model, { jsonMode: true });
    return JSON.parse(result || "{}");
  } catch (error) {
    console.error("Error optimizing idea:", error);
    return null;
  }
};

export const generateContentStrategy = async (product: string, audience: string) => {
  const model = "gemini-2.5-flash";
  const prompt = `Você é um estrategista de conteúdo digital de elite. 
  Gere 5 ideias de conteúdos magnéticos para o seguinte contexto:
  
  Produto/Oferta: ${product}
  Público-Alvo: "${audience}"
  
  Cada ideia deve ter um PROPÓSITO claro (ex: Autoridade, Quebra de Objeção, Conexão, Venda Direta, Entretenimento Educativo).
  
  Retorne um JSON com um array "ideas" contendo objetos com:
  - id: number (1 a 5)
  - title: string (Título chamativo da ideia)
  - purpose: string (O propósito do conteúdo)
  - description: string (Breve explicação do que se trata a ideia)`;

  try {
    const result = await generateWithProvider(prompt, model, { jsonMode: true });
    return JSON.parse(result || '{"ideas": []}');
  } catch (error) {
    console.error("Error generating content strategy:", error);
    return { ideas: [] };
  }
};

export const expandContentIdea = async (
  title: string,
  description: string,
  product: string,
  audience: string,
  userInstructions?: string
) => {
  const model = "gemini-2.5-flash";
  const prompt = `Você é um roteirista de elite. Expanda a seguinte ideia de conteúdo em um ROTEIRO COMPLETO DE FUNIL (Top, Middle, Bottom).
  
  Ideia: "${title}"
  Contexto Original: "${description}"
  Produto: ${product}
  Público: "${audience}"
  Instruções do Usuário: "${userInstructions || 'Nenhuma'}"
  
  ESTRUTURA DO ROTEIRO:
  1. TOPO DO FUNIL (Hook): Primeiros 5-7 segundos. Atrair atenção rápida, falar com quem não te conhece ainda. Use ganchos psicológicos.
  2. MEIO DO FUNIL (Desenvolvimento): Falar com quem já tem o problema, educar, gerar desejo, autoridade. Mostre que você entende a dor deles.
  3. FUNDO DO FUNIL (Oferta): Expandir a consciência, fazer a ponte para o produto e o CTA matador.
  
  Retorne um JSON com os campos: hook, content, cta, visualNotes.`;

  try {
    const result = await generateWithProvider(prompt, model, { jsonMode: true });
    return JSON.parse(result || "{}");
  } catch (error) {
    console.error("Error expanding content idea:", error);
    return null;
  }
};

export const generateCarouselContent = async (topic: string, numSlides: number) => {
  const model = "gemini-2.5-flash";
  const prompt = `Você é um copywriter de elite para redes sociais.
  Gere um carrossel completo de altíssimo impacto para Instagram/LinkedIn.
  
  Tema: "${topic}"
  Número de slides desejado: ${numSlides}
  
  O carrossel deve ter a seguinte estrutura:
  - Slide 1 (Capa): Um título (gancho) irresistível e uma descrição muito curta.
  - Slides Intermediários: Conteúdo de valor e desenvolvimento da ideia. Títulos mais curtos e textos diretos ao ponto, persuasivos.
  - ÚLTIMO Slide: CTAs (Chamada para Ação) claras para seguir, comentar ou comprar algo.
  
  Retorne EXATAMENTE um JSON na seguinte estrutura de array:
  {
    "slides": [
      {
        "title": "Título do slide 1",
        "description": "Texto do corpo do slide 1 (se houver)"
      },
      ...
    ]
  }
  
  Assegure-se de gerar exatamente ${numSlides} slides no array "slides".`;

  try {
    const result = await generateWithProvider(prompt, model, { jsonMode: true });
    const parsed = JSON.parse(result || '{"slides": []}');
    return parsed.slides || [];
  } catch (error) {
    console.error("Error generating carousel:", error);
    return [];
  }
};
