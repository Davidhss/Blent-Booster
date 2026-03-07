import { GoogleGenAI, Type } from "@google/genai";

const getApiKey = () => {
  return (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    (import.meta.env?.VITE_GEMINI_API_KEY) ||
    (import.meta.env?.GEMINI_API_KEY) ||
    "";
};

const ai = new GoogleGenAI({
  apiKey: getApiKey(),
});

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
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || '{"insights": []}');
  } catch (error) {
    console.error("Error generating questions:", error);
    return { insights: [] };
  }
};

export const generateCaption = async (postContent: string) => {
  const model = "gemini-2.5-flash";
  const prompt = `Crie uma legenda engajadora para o Instagram baseada neste conteúdo: "${postContent}". Use emojis, hashtags relevantes e um tom que incentive comentários.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating caption:", error);
    return "Erro ao gerar legenda.";
  }
};

export const generateBackgroundImages = async (prompt: string, userPrompt?: string) => {
  try {
    const response = await fetch('/api/generate-images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, userPrompt }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error("Image generation server error:", err);
      return [];
    }

    const data = await response.json();
    return (data.images || []) as string[];
  } catch (error) {
    console.error("Error calling image generation endpoint:", error);
    return [];
  }
};

export const generateQuote = async (topic: string): Promise<{ text: string; author: string } | null> => {
  const model = "gemini-2.5-flash";
  const prompt = `Gere uma citação inspiradora e famosa sobre o tema: "${topic}". 
  Retorne APENAS um JSON com os campos: 
  - text: a frase da citação em português.
  - author: o nome do autor da frase.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || "null");
  } catch (error) {
    console.error("Error generating quote with Gemini:", error);
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
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || '{"variations": []}');
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
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || "{}");
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
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || "{}");
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
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || "{}");
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
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ideas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.NUMBER },
                  title: { type: Type.STRING },
                  purpose: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["id", "title", "purpose", "description"]
              }
            }
          },
          required: ["ideas"]
        }
      }
    });

    return JSON.parse(response.text || '{"ideas": []}');
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
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hook: { type: Type.STRING, description: "Texto do topo do funil (atração)" },
            content: { type: Type.STRING, description: "Desenvolvimento do meio do funil" },
            cta: { type: Type.STRING, description: "Chamada para ação do fundo do funil" },
            visualNotes: { type: Type.STRING, description: "Sugestões visuais e de edição" }
          },
          required: ["hook", "content", "cta", "visualNotes"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error expanding content idea:", error);
    return null;
  }
};
