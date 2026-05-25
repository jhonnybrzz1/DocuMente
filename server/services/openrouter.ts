// Wrapper isolado para a OpenRouter API. Usado por todas as features de IA
// (auto-sugestão de título, ações rápidas, chat de refinamento, score de qualidade).

const OPENROUTER_API_URL =
  process.env.OPENROUTER_API_URL ?? "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? "google/gemma-4-31b-it";
const OPENROUTER_APP_URL = process.env.APP_URL ?? "http://localhost:5001";

// Provider routing - prefer providers de baixa latência e ignora os instáveis.
// Defaults baseados em análise via openrouter-models skill (DeepInfra: 493ms p50,
// 99.5% uptime; SiliconFlow estava degradado a ~37% durante a análise).
// Pode ser sobrescrito via env: OPENROUTER_PREFERRED_PROVIDERS, OPENROUTER_IGNORED_PROVIDERS
function parseProviderList(envValue: string | undefined): string[] | undefined {
  if (envValue === undefined) return undefined;
  if (envValue.trim() === "" || envValue.toLowerCase() === "none") return [];
  return envValue.split(",").map(p => p.trim()).filter(Boolean);
}

const PREFERRED_PROVIDERS =
  parseProviderList(process.env.OPENROUTER_PREFERRED_PROVIDERS) ?? ["DeepInfra"];
const IGNORED_PROVIDERS =
  parseProviderList(process.env.OPENROUTER_IGNORED_PROVIDERS) ?? ["SiliconFlow"];
const ALLOW_FALLBACKS = process.env.OPENROUTER_ALLOW_FALLBACKS !== "false";

/** Retorna o objeto `provider` a ser injetado no body da OpenRouter, ou undefined. */
export function buildProviderRouting(): Record<string, unknown> | undefined {
  const provider: Record<string, unknown> = {};
  if (PREFERRED_PROVIDERS.length > 0) {
    provider.order = PREFERRED_PROVIDERS;
    provider.allow_fallbacks = ALLOW_FALLBACKS;
  }
  if (IGNORED_PROVIDERS.length > 0) {
    provider.ignore = IGNORED_PROVIDERS;
  }
  return Object.keys(provider).length > 0 ? provider : undefined;
}

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export function getOpenRouterApiKey(): string | undefined {
  return process.env.OPENROUTER_API_KEY;
}

export async function chatCompletion(
  messages: ChatMessage[],
  options: { temperature?: number; maxTokens?: number; jsonMode?: boolean } = {}
): Promise<string> {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured on the server.");
  }

  const body: Record<string, unknown> = {
    model: OPENROUTER_MODEL,
    messages,
  };

  if (options.temperature !== undefined) body.temperature = options.temperature;
  if (options.maxTokens !== undefined) body.max_tokens = options.maxTokens;
  if (options.jsonMode) body.response_format = { type: "json_object" };

  const providerRouting = buildProviderRouting();
  if (providerRouting) body.provider = providerRouting;

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": OPENROUTER_APP_URL,
      "X-Title": "DocuMente",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter API returned an empty response");
  }
  return content as string;
}

// Tenta extrair JSON mesmo quando o modelo embrulha em ```json ... ```
export function extractJson<T = unknown>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  // Procura primeiro JSON válido na string
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = cleaned.slice(firstBrace, lastBrace + 1);
    return JSON.parse(candidate) as T;
  }

  return JSON.parse(cleaned) as T;
}
