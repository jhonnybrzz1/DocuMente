// Wrapper isolado para as APIs da OpenRouter e Mistral. Usado por todas as features de IA.

import * as fs from "fs";
import * as path from "path";

const OPENROUTER_API_URL =
  process.env.OPENROUTER_API_URL ?? "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "deepseek/deepseek-chat"; // DeepSeek Chat para escrita rápida e barata
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL;
const OPENROUTER_APP_URL = process.env.APP_URL ?? "http://localhost:5001";

// Provider routing - prefer providers de baixa latência e ignora os instáveis.
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
  content: string | Array<Record<string, any>>;
};

export type TelemetryData = {
  timestamp: string;
  taskName: string;
  model: string;
  provider: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  status: "success" | "failure";
  retries: number;
  estimatedCostUsd: number;
};

// Custos estimados por 1M tokens para cálculo de telemetria
const MODEL_COSTS: Record<string, { prompt: number; completion: number }> = {
  "deepseek/deepseek-chat": { prompt: 0.14, completion: 0.28 },
  "xiaomi/mimo-v2.5-pro": { prompt: 0.14, completion: 0.28 },
  "codestral-latest": { prompt: 0.2, completion: 0.6 },
  "mistral-large-latest": { prompt: 2.0, completion: 6.0 },
  "default": { prompt: 0.15, completion: 0.3 }
};

export function logTelemetry(data: TelemetryData) {
  try {
    const logsDir = path.resolve(process.cwd(), "logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    const logFilePath = path.join(logsDir, "telemetry.jsonl");
    fs.appendFileSync(logFilePath, JSON.stringify(data) + "\n");
  } catch (err) {
    console.error("[telemetry] Falha ao registrar log:", err);
  }
}

export function getOpenRouterApiKey(): string | undefined {
  return process.env.OPENROUTER_API_KEY;
}

export function getMistralApiKey(): string | undefined {
  return process.env.MISTRAL_API_KEY;
}

// Helper para delay/sleep
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function chatCompletion(
  messages: ChatMessage[],
  options: { 
    temperature?: number; 
    maxTokens?: number; 
    jsonMode?: boolean; 
    model?: string;
    timeoutMs?: number;
    taskName?: string;
    onChunk?: (chunk: string) => void;
  } = {}
): Promise<string> {
  const openRouterKey = getOpenRouterApiKey();
  const mistralKey = getMistralApiKey();
  const startTime = Date.now();
  let retriesCount = 0;
  const maxRetries = 2;

  // Mapeia timeouts por padrão se não especificados nas opções
  const defaultTimeouts: Record<string, number> = {
    "suggest-title": 10000,
    "quick-action": 20000,
    "chat": 30000,
    "generation": 60000,
    "verification": 45000,
    "repair": 45000
  };
  const timeoutMs = options.timeoutMs ?? defaultTimeouts[options.taskName || ""] ?? 60000;

  // Lógica principal de execução com retry para erros transientes
  while (retriesCount <= maxRetries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // 1. Tentar OpenRouter (Provedor Primário)
      if (openRouterKey) {
        const rawModel = options.model || OPENROUTER_MODEL;
        let selectedModel = rawModel;
        if (rawModel === "gemini-2.5-pro" || rawModel === "mimo-2.5-pro" || rawModel === "xiaomi/mimo-2.5-pro") {
          selectedModel = "xiaomi/mimo-v2.5-pro";
        } else if (rawModel === "deepseek-flash" || rawModel === "deepseek/deepseek-flash" || rawModel === "deepseek/deepseek-chat") {
          selectedModel = "deepseek/deepseek-chat";
        }

        const body: Record<string, unknown> = {
          model: selectedModel,
          messages,
        };

        if (options.temperature !== undefined) body.temperature = options.temperature;
        if (options.maxTokens !== undefined) body.max_tokens = options.maxTokens;
        if (options.jsonMode) body.response_format = { type: "json_object" };
        if (options.onChunk) body.stream = true;

        const providerRouting = buildProviderRouting();
        if (providerRouting) body.provider = providerRouting;

        const response = await fetch(OPENROUTER_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openRouterKey}`,
            "HTTP-Referer": OPENROUTER_APP_URL,
            "X-Title": "DocuMente",
          },
          body: JSON.stringify(body),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Erro transiente de HTTP
        if (!response.ok) {
          const status = response.status;
          const errorText = await response.text();
          
          if ([400, 401, 402, 403, 404].includes(status)) {
            throw new Error(`OpenRouter HTTP Client Error ${status}: ${errorText}`);
          }
          
          throw new Error(`OpenRouter HTTP Transient Error ${status}: ${errorText}`);
        }

        if (options.onChunk) {
          let content = "";
          const reader = response.body?.getReader();
          const decoder = new TextDecoder("utf-8");
          let done = false;
          let buffer = "";

          while (!done) {
            const { value, done: doneReading } = await reader!.read();
            done = doneReading;
            if (value) {
              buffer += decoder.decode(value, { stream: !done });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";
              
              for (const line of lines) {
                const cleanedLine = line.trim();
                if (cleanedLine.startsWith("data: ")) {
                  const dataText = cleanedLine.slice(6).trim();
                  if (dataText === "[DONE]") {
                    done = true;
                    break;
                  }
                  try {
                    const parsed = JSON.parse(dataText);
                    const chunkContent = parsed.choices?.[0]?.delta?.content || "";
                    if (chunkContent) {
                      content += chunkContent;
                      options.onChunk(chunkContent);
                    }
                  } catch (e) {
                    // Ignora parsing de JSON inválido nas linhas de stream incompletas
                  }
                }
              }
            }
          }

          // Grava telemetria com tokens aproximados no streaming
          const approxPromptTokens = messages.map(m => typeof m.content === "string" ? m.content.length : 100).reduce((a, b) => a + b, 0) / 4;
          const approxCompletionTokens = content.length / 4;
          const costConfig = MODEL_COSTS[selectedModel] || MODEL_COSTS["default"];
          const cost = ((approxPromptTokens * costConfig.prompt) + (approxCompletionTokens * costConfig.completion)) / 1000000;

          logTelemetry({
            timestamp: new Date().toISOString(),
            taskName: options.taskName || "unknown",
            model: selectedModel,
            provider: "OpenRouter",
            promptTokens: Math.round(approxPromptTokens),
            completionTokens: Math.round(approxCompletionTokens),
            totalTokens: Math.round(approxPromptTokens + approxCompletionTokens),
            latencyMs: Date.now() - startTime,
            status: "success",
            retries: retriesCount,
            estimatedCostUsd: cost
          });

          return content;
        } else {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (!content) {
            throw new Error("OpenRouter API returned an empty response");
          }

          const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
          const costConfig = MODEL_COSTS[selectedModel] || MODEL_COSTS["default"];
          const cost = ((usage.prompt_tokens * costConfig.prompt) + (usage.completion_tokens * costConfig.completion)) / 1000000;

          logTelemetry({
            timestamp: new Date().toISOString(),
            taskName: options.taskName || "unknown",
            model: selectedModel,
            provider: "OpenRouter",
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
            latencyMs: Date.now() - startTime,
            status: "success",
            retries: retriesCount,
            estimatedCostUsd: cost
          });

          return content as string;
        }
      }

      // 2. Fallback: Se não houver OpenRouter, mas houver chave da Mistral
      if (mistralKey) {
        let mistralModel = "codestral-latest";
        const requestedModel = options.model || OPENROUTER_MODEL;

        if (
          requestedModel.includes("gemini") || 
          requestedModel === "gemini-2.5-pro" || 
          requestedModel === "mimo-2.5-pro"
        ) {
          mistralModel = "mistral-large-latest"; 
        } else if (requestedModel.includes("flash")) {
          mistralModel = "codestral-latest"; 
        }

        const body: Record<string, unknown> = {
          model: mistralModel,
          messages,
        };

        if (options.temperature !== undefined) body.temperature = options.temperature;
        if (options.maxTokens !== undefined) body.max_tokens = options.maxTokens;
        if (options.jsonMode) body.response_format = { type: "json_object" };
        if (options.onChunk) body.stream = true;

        const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${mistralKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const status = response.status;
          const errorText = await response.text();
          if ([400, 401, 402, 403, 404].includes(status)) {
            throw new Error(`Mistral HTTP Client Error ${status}: ${errorText}`);
          }
          throw new Error(`Mistral HTTP Transient Error ${status}: ${errorText}`);
        }

        if (options.onChunk) {
          let content = "";
          const reader = response.body?.getReader();
          const decoder = new TextDecoder("utf-8");
          let done = false;
          let buffer = "";

          while (!done) {
            const { value, done: doneReading } = await reader!.read();
            done = doneReading;
            if (value) {
              buffer += decoder.decode(value, { stream: !done });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";
              
              for (const line of lines) {
                const cleanedLine = line.trim();
                if (cleanedLine.startsWith("data: ")) {
                  const dataText = cleanedLine.slice(6).trim();
                  if (dataText === "[DONE]") {
                    done = true;
                    break;
                  }
                  try {
                    const parsed = JSON.parse(dataText);
                    const chunkContent = parsed.choices?.[0]?.delta?.content || "";
                    if (chunkContent) {
                      content += chunkContent;
                      options.onChunk(chunkContent);
                    }
                  } catch (e) {
                    // Ignora parsing de JSON inválido nas linhas de stream incompletas
                  }
                }
              }
            }
          }

          // Grava telemetria para Mistral com tokens aproximados no streaming
          const approxPromptTokens = messages.map(m => typeof m.content === "string" ? m.content.length : 100).reduce((a, b) => a + b, 0) / 4;
          const approxCompletionTokens = content.length / 4;
          const costConfig = MODEL_COSTS[mistralModel] || MODEL_COSTS["default"];
          const cost = ((approxPromptTokens * costConfig.prompt) + (approxCompletionTokens * costConfig.completion)) / 1000000;

          logTelemetry({
            timestamp: new Date().toISOString(),
            taskName: options.taskName || "unknown",
            model: mistralModel,
            provider: "Mistral",
            promptTokens: Math.round(approxPromptTokens),
            completionTokens: Math.round(approxCompletionTokens),
            totalTokens: Math.round(approxPromptTokens + approxCompletionTokens),
            latencyMs: Date.now() - startTime,
            status: "success",
            retries: retriesCount,
            estimatedCostUsd: cost
          });

          return content;
        } else {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (!content) {
            throw new Error("Mistral API returned an empty response");
          }

          const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
          const costConfig = MODEL_COSTS[mistralModel] || MODEL_COSTS["default"];
          const cost = ((usage.prompt_tokens * costConfig.prompt) + (usage.completion_tokens * costConfig.completion)) / 1000000;

          logTelemetry({
            timestamp: new Date().toISOString(),
            taskName: options.taskName || "unknown",
            model: mistralModel,
            provider: "Mistral",
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
            latencyMs: Date.now() - startTime,
            status: "success",
            retries: retriesCount,
            estimatedCostUsd: cost
          });

          return content as string;
        }
      }

      throw new Error("Nenhuma chave de API (OpenRouter ou Mistral) configurada no servidor.");

    } catch (err: any) {
      clearTimeout(timeoutId);
      
      const isTransient = err.message && (
        err.message.includes("Transient") || 
        err.name === "AbortError" || 
        err.message.includes("fetch") ||
        err.message.includes("timeout") ||
        err.message.includes("empty response") ||
        err.message.includes("429")
      );

      if (isTransient && retriesCount < maxRetries) {
        retriesCount++;
        const backoffMs = retriesCount * 500;
        console.warn(`[ai] Chamada de IA falhou (erro transiente). Tentando novamente em ${backoffMs}ms... (Tentativa ${retriesCount}/${maxRetries})`, err);
        await sleep(backoffMs);
        continue;
      }

      logTelemetry({
        timestamp: new Date().toISOString(),
        taskName: options.taskName || "unknown",
        model: options.model || "unknown",
        provider: openRouterKey ? "OpenRouter" : (mistralKey ? "Mistral" : "none"),
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        latencyMs: Date.now() - startTime,
        status: "failure",
        retries: retriesCount,
        estimatedCostUsd: 0
      });

      throw err;
    }
  }

  throw new Error("Falha ao se conectar com os modelos de IA após múltiplas tentativas.");
}

// Tenta extrair JSON mesmo quando o modelo embrulha em ```json ... ```
export function extractJson<T = unknown>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = cleaned.slice(firstBrace, lastBrace + 1);
    return JSON.parse(candidate) as T;
  }

  const firstBracket = cleaned.indexOf("[");
  const lastBracket = cleaned.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    const candidate = cleaned.slice(firstBracket, lastBracket + 1);
    return JSON.parse(candidate) as T;
  }

  return JSON.parse(cleaned) as T;
}
