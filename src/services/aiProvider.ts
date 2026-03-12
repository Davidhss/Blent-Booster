// =============================================
// MULTI-PROVIDER AI — Gemini, OpenAI, Claude
// =============================================

export type AIProvider = 'gemini' | 'openai' | 'claude';

export interface ProviderInfo {
  id: AIProvider;
  name: string;
  supportsText: boolean;
  supportsImage: boolean;
  color: string;
}

export const PROVIDERS: Record<AIProvider, ProviderInfo> = {
  gemini: { id: 'gemini', name: 'Google Gemini', supportsText: true, supportsImage: true, color: '#4285F4' },
  openai: { id: 'openai', name: 'OpenAI (GPT + DALL-E)', supportsText: true, supportsImage: true, color: '#10A37F' },
  claude: { id: 'claude', name: 'Anthropic Claude', supportsText: true, supportsImage: false, color: '#D4A574' },
};

/** Detecta o provedor baseado no formato da chave API */
export const detectProvider = (apiKey: string): AIProvider => {
  const key = apiKey.trim();
  if (key.startsWith('sk-ant-')) return 'claude';
  if (key.startsWith('sk-')) return 'openai';
  return 'gemini'; // Default — AIzaSy... ou qualquer outro formato
};

/** Retorna info do provedor baseado na chave customizada salva */
export const getActiveProvider = (): ProviderInfo => {
  if (typeof window === 'undefined') return PROVIDERS.gemini;
  const key = localStorage.getItem('blent_custom_gemini_key');
  if (!key || !key.trim()) return PROVIDERS.gemini;
  return PROVIDERS[detectProvider(key)];
};

// =============================================
// TEXT GENERATION
// =============================================

interface TextOptions {
  jsonMode?: boolean;
  systemPrompt?: string;
}

/** Gera texto via OpenAI REST API */
const openaiGenerateText = async (apiKey: string, prompt: string, opts?: TextOptions): Promise<string> => {
  const messages: any[] = [];
  if (opts?.systemPrompt) {
    messages.push({ role: 'system', content: opts.systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const body: any = {
    model: 'gpt-4o-mini',
    messages,
    max_tokens: 4096,
  };
  if (opts?.jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`OpenAI API error ${res.status}: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
};

/** Gera texto via Claude REST API */
const claudeGenerateText = async (apiKey: string, prompt: string, opts?: TextOptions): Promise<string> => {
  const messages: any[] = [{ role: 'user', content: prompt }];
  
  const body: any = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages,
  };
  if (opts?.systemPrompt) {
    body.system = opts.systemPrompt;
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Claude API error ${res.status}: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  // Claude returns content as array of blocks
  const textBlock = data.content?.find((b: any) => b.type === 'text');
  return textBlock?.text || '';
};

/**
 * Gera texto usando o provedor correto baseado na chave do usuário.
 * Se não há chave customizada, usa Gemini (servidor).
 */
export const providerGenerateText = async (
  apiKey: string,
  provider: AIProvider,
  prompt: string,
  opts?: TextOptions
): Promise<string> => {
  switch (provider) {
    case 'openai':
      return openaiGenerateText(apiKey, prompt, opts);
    case 'claude':
      return claudeGenerateText(apiKey, prompt, opts);
    case 'gemini':
    default:
      // Gemini usa o SDK diretamente — retornamos null para sinalizar fallback
      throw new Error('USE_GEMINI_SDK');
  }
};

// =============================================
// IMAGE GENERATION
// =============================================

/** Gera imagem via OpenAI DALL-E 3 */
export const openaiGenerateImage = async (apiKey: string, prompt: string): Promise<string[]> => {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'b64_json',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`OpenAI Image API error ${res.status}: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  const images: string[] = [];
  for (const img of data.data || []) {
    if (img.b64_json) {
      images.push(`data:image/png;base64,${img.b64_json}`);
    } else if (img.url) {
      images.push(img.url);
    }
  }
  return images;
};
