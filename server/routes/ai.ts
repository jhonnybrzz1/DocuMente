import { Router } from "express";
import { ZodError, z } from "zod";
import * as fs from "fs";
import * as path from "path";
import {
  suggestTitleInputSchema,
  quickActionInputSchema,
  chatRefineInputSchema,
  qualityScoreInputSchema,
  documentTypes,
  type DocumentType,
  type QualityScore,
} from "@shared/schema";
import { storage } from "../storage";
import { chatCompletion, extractJson, type ChatMessage } from "../services/openrouter";
import { appCache } from "../utils/cache";

const router = Router();

// Helpers de label do tipo (espelho do schema, usado em prompts)
function typeLabel(type: DocumentType): string {
  return documentTypes.find(dt => dt.value === type)?.label ?? type;
}

function handleError(err: unknown, res: any, fallback: string) {
  if (err instanceof ZodError) {
    const message = err.errors.map(e => e.message).join(", ");
    return res.status(400).json({ message });
  }
  console.error(`[ai] ${fallback}:`, err);
  const message = err instanceof Error ? err.message : fallback;
  return res.status(500).json({ message });
}

/**
 * Executa chatCompletion exigindo um JSON estruturado e validado via Zod.
 * Se o parse ou a validação do Zod falhar, realiza uma auto-correção (Self-Repair Loop)
 * enviando o erro detalhado de volta ao modelo para obter a versão válida.
 */
async function chatCompletionJsonWithRetry<T>(
  messages: ChatMessage[],
  schema: z.ZodType<T>,
  options: { temperature?: number; maxTokens?: number; model?: string; taskName?: string } = {}
): Promise<T> {
  const firstTry = await chatCompletion(messages, {
    ...options,
    jsonMode: true,
  });

  try {
    const rawJson = extractJson(firstTry);
    return schema.parse(rawJson);
  } catch (err) {
    console.warn("[ai] Primeira tentativa de JSON/Zod falhou, solicitando auto-correção:", err);
    
    const repairMessages: ChatMessage[] = [
      ...messages,
      { role: "assistant", content: firstTry },
      {
        role: "user",
        content: `O JSON gerado anteriormente apresentou um erro de validação ou estrutura: "${err instanceof Error ? err.message : String(err)}".
Por favor, corrija a resposta imediatamente e retorne APENAS um JSON válido e completo que obedeça estritamente ao formato pedido.`
      }
    ];

    const secondTry = await chatCompletion(repairMessages, {
      ...options,
      jsonMode: true,
    });

    const rawJson = extractJson(secondTry);
    return schema.parse(rawJson);
  }
}

// =============================================================================
// POST /api/ai/suggest-tags
// Sugere 3-5 tags baseadas no tipo e conteúdo do documento gerado.
// =============================================================================
router.post("/suggest-tags", async (req, res) => {
  try {
    const schema = z.object({
      type: z.string().min(1),
      content: z.string().min(10).max(20000),
    });
    const { type, content } = schema.parse(req.body);

    const cacheKey = { type, content: content.slice(0, 500) };
    const cached = appCache.get("suggest-tags", cacheKey);
    if (cached) return res.json(cached);

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `Você é um especialista em Product Management. Analise o documento abaixo e sugira entre 3 e 5 tags curtas em português brasileiro para categorizar e facilitar a busca deste documento.

REGRAS:
- Cada tag: 1-3 palavras, sem acentos, letras minúsculas, palavras separadas por hífen (ex: login-social, checkout, q1-2026)
- Prefira tags temáticas: squad, feature, produto, sprint, trimestre, domínio técnico
- Evite tags genéricas como "documento", "prd", "feature" isolada
- Responda APENAS com JSON válido, sem texto adicional

FORMATO:
{"tags": ["tag-1", "tag-2", "tag-3"]}`,
      },
      {
        role: "user",
        content: `Tipo: ${type}\n\nConteúdo:\n${content.slice(0, 3000)}`,
      },
    ];

    const tagsSchema = z.object({ tags: z.array(z.string()) });
    const parsed = await chatCompletionJsonWithRetry(messages, tagsSchema, {
      temperature: 0.4,
      maxTokens: 150,
      taskName: "suggest-tags",
    });

    const tags = (parsed.tags ?? [])
      .filter((t) => typeof t === "string" && t.trim().length > 0)
      .map((t) =>
        t.trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9-]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 40)
      )
      .filter((t) => t.length > 0)
      .slice(0, 5);

    const result = { tags };
    appCache.set("suggest-tags", cacheKey, result, 1800);
    res.json(result);
  } catch (err) {
    handleError(err, res, "Failed to suggest tags");
  }
});

// =============================================================================
// POST /api/ai/chain-document
// Gera a demanda pré-populada para criar um documento filho a partir de um pai.
// =============================================================================
const CHAIN_MAP: Record<string, { targetType: string; targetLabel: string }[]> = {
  prd:        [{ targetType: "epic",       targetLabel: "Épicos"        },
               { targetType: "userstories",targetLabel: "User Stories"  }],
  epic:       [{ targetType: "userstories",targetLabel: "User Stories"  },
               { targetType: "techspec",   targetLabel: "Spec Técnica"  }],
  userstories:[{ targetType: "testplan",   targetLabel: "Plano de Testes"}],
  techspec:   [{ targetType: "testplan",   targetLabel: "Plano de Testes"},
               { targetType: "apidoc",     targetLabel: "Doc de API"    }],
  roadmap:    [{ targetType: "epic",       targetLabel: "Épicos"        }],
  pitch:      [{ targetType: "prd",        targetLabel: "PRD"           }],
  releasenote:[],
  testplan:   [],
  apidoc:     [],
};

router.post("/chain-document", async (req, res) => {
  try {
    const schema = z.object({
      sourceDocumentId: z.number().int().positive(),
      targetType: z.string().min(1),
    });
    const { sourceDocumentId, targetType } = schema.parse(req.body);

    const sourceDoc = await storage.getDocument(sourceDocumentId);
    if (!sourceDoc) {
      return res.status(404).json({ message: "Documento fonte não encontrado." });
    }

    const validTarget = (CHAIN_MAP[sourceDoc.type] ?? []).find(
      (c) => c.targetType === targetType
    );
    if (!validTarget) {
      return res.status(400).json({
        message: `Encadeamento de '${sourceDoc.type}' para '${targetType}' não é suportado.`,
      });
    }

    const targetLabel = typeLabel(targetType as DocumentType);

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `Você é um especialista em Product Management. 
Com base no documento abaixo, crie uma DEMANDA detalhada (não o documento final) para que a IA gere um(a) "${targetLabel}" derivado(a) deste contexto.

A demanda deve:
- Resumir os pontos essenciais do documento fonte relevantes para o(a) "${targetLabel}"
- Indicar claramente o escopo, objetivos e critérios de sucesso esperados
- Ser escrita em português brasileiro
- Ter entre 150 e 400 palavras
- NÃO ser o documento final — apenas a demanda/briefing para gerá-lo

Responda APENAS com a demanda em texto puro, sem prefixos, sem markdown.`,
      },
      {
        role: "user",
        content: `Documento fonte (${typeLabel(sourceDoc.type as DocumentType)}):\n\nTítulo: ${sourceDoc.title}\n\n${sourceDoc.content.slice(0, 6000)}`,
      },
    ];

    const demand = await chatCompletion(messages, {
      temperature: 0.5,
      maxTokens: 800,
      taskName: "chain-document",
    });

    res.json({
      demand: demand.trim(),
      suggestedTitle: `${sourceDoc.title} — ${targetLabel}`,
      targetType,
      parentDocumentId: sourceDocumentId,
      availableChains: CHAIN_MAP[sourceDoc.type] ?? [],
    });
  } catch (err) {
    handleError(err, res, "Failed to chain document");
  }
});

// =============================================================================
// GET /api/ai/chain-options/:documentId
// Retorna os tipos de documento que podem ser gerados a partir de um dado documento.
// =============================================================================
router.get("/chain-options/:documentId", async (req, res) => {
  try {
    const id = parseInt(req.params.documentId);
    if (isNaN(id)) return res.status(400).json({ message: "ID inválido." });

    const doc = await storage.getDocument(id);
    if (!doc) return res.status(404).json({ message: "Documento não encontrado." });

    res.json({ availableChains: CHAIN_MAP[doc.type] ?? [] });
  } catch (err) {
    handleError(err, res, "Failed to get chain options");
  }
});

// =============================================================================
// POST /api/ai/suggest-title
// Sugere até 5 títulos curtos baseados na demanda + tipo de documento.
// =============================================================================
router.post("/suggest-title", async (req, res) => {
  try {
    const { type, demand } = suggestTitleInputSchema.parse(req.body);

    const cacheKey = { type, demand };
    const cached = appCache.get("suggest-title", cacheKey);
    if (cached) {
      console.log(`[cache] Cache hit para suggest-title do tipo ${type}.`);
      return res.json(cached);
    }

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `Você é um especialista em Product Management. Sua tarefa é sugerir títulos curtos, claros e objetivos para um documento de ${typeLabel(
          type as DocumentType
        )} em português brasileiro.

REGRAS:
- 5 sugestões diferentes
- Cada título com no máximo 60 caracteres
- Foco no valor/feature/produto, sem palavras genéricas como "Documento de" ou "Sobre"
- Evite usar o tipo do documento no título (ex: não escreva "PRD - " ou "Épico:")
- Resposta APENAS em JSON válido, sem texto adicional, sem markdown.

FORMATO DE RESPOSTA:
{
  "suggestions": ["Título 1", "Título 2", "Título 3", "Título 4", "Título 5"]
}`,
      },
      {
        role: "user",
        content: `Demanda do produto:\n${demand}`,
      },
    ];

    const titleSchema = z.object({
      suggestions: z.array(z.string()),
    });

    const parsed = await chatCompletionJsonWithRetry(messages, titleSchema, {
      temperature: 0.6,
      maxTokens: 400,
      taskName: "suggest-title"
    });

    const suggestions = (parsed.suggestions ?? [])
      .filter(s => typeof s === "string" && s.trim().length > 0)
      .map(s => s.trim().slice(0, 80))
      .slice(0, 5);

    if (suggestions.length === 0) {
      return res.status(502).json({ message: "A IA não retornou sugestões válidas. Tente novamente." });
    }

    const responseObj = { suggestions };
    appCache.set("suggest-title", cacheKey, responseObj);
    res.json(responseObj);
  } catch (err) {
    handleError(err, res, "Failed to suggest title");
  }
});

// =============================================================================
// POST /api/ai/quick-action
// Aplica uma ação rápida (resumir, expandir, reescrever, etc.) num trecho.
// =============================================================================
const ACTION_PROMPTS: Record<string, string> = {
  summarize:
    "Resuma o texto editável mantendo as ideias principais. Reduza para cerca de 30-40% do tamanho original. Não altere regras, valores, prazos, condições ou exceções. Mantenha tom profissional e estrutura em markdown se houver.",
  expand:
    "Expanda o texto editável adicionando clareza e exemplos apenas quando forem inferências seguras. Não invente fatos e não altere regras, valores, prazos, condições ou exceções. Mantenha o tom e estrutura originais.",
  rewrite:
    "Reescreva o texto editável de forma mais clara, direta e profissional, mantendo o mesmo significado, regras e formatação markdown. Conserve termos literais cruciais de regras de negócio (como 'aprovação manual' e 'fluxo automático') sem alterá-los por sinônimos.",
  "fix-grammar":
    "Corrija erros de gramática, ortografia e pontuação no texto abaixo, sem alterar o conteúdo ou estilo. Mantenha a formatação markdown intacta.",
  "translate-en":
    "Translate the text below to professional English, preserving markdown formatting, headers, lists and tone.",
  "validate-invest":
    "Avalie se as user stories no texto abaixo seguem o padrão INVEST (Independent, Negotiable, Valuable, Estimable, Small, Testable). Para cada story problemática, indique qual critério falha e como melhorar. Use formato markdown com checkboxes ✅/⚠️/❌.",
};

router.post("/quick-action", async (req, res) => {
  try {
    const { text, action, context } = quickActionInputSchema.parse(req.body);

    const cacheKey = { text, action, context };
    const cached = appCache.get("quick-action", cacheKey);
    if (cached) {
      console.log(`[cache] Cache hit para quick-action ${action}.`);
      return res.json(cached);
    }

    const systemPrompt = ACTION_PROMPTS[action];
    if (!systemPrompt) {
      return res.status(400).json({ message: "Ação inválida." });
    }

    const userContent = context
      ? `<CONTEXTO_NAO_EDITAVEL>\n${context}\n</CONTEXTO_NAO_EDITAVEL>\n\n<TEXTO_EDITAVEL>\n${text}\n</TEXTO_EDITAVEL>`
      : `<TEXTO_EDITAVEL>\n${text}\n</TEXTO_EDITAVEL>`;

    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          "Você é um assistente especializado em redação de documentos de Product Management em português brasileiro. Responda APENAS com o resultado pedido — sem comentários, sem explicações, sem prefixos como 'Aqui está:'. Preserve formatação markdown sempre.\n\n" +
          "Use CONTEXTO_NAO_EDITAVEL apenas como referência. Altere somente o conteúdo em TEXTO_EDITAVEL. Se houver regras claras, preserve-as fielmente.\n\n" +
          systemPrompt,
      },
      { role: "user", content: userContent },
    ];

    const result = await chatCompletion(messages, {
      temperature: action === "fix-grammar" ? 0.2 : 0.5,
      maxTokens: 4000,
      taskName: "quick-action"
    });

    const responseObj = { result: result.trim() };
    appCache.set("quick-action", cacheKey, responseObj);
    res.json(responseObj);
  } catch (err) {
    handleError(err, res, "Failed to run quick action");
  }
});

// =============================================================================
// POST /api/ai/chat
// Chat de refinamento - conversa iterativa pra ajustar o documento.
// O cliente envia o histórico completo da conversa; o servidor não armazena.
// =============================================================================
router.post("/chat", async (req, res) => {
  try {
    const { documentContent, documentType, messages: userMessages } =
      chatRefineInputSchema.parse(req.body);

    // Limitamos o histórico de mensagens para as últimas 6 para otimização de custos e escopo do contexto.
    const limitedMessages = userMessages.slice(-6);

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `Você é um assistente especializado em Product Management ajudando o usuário a refinar um documento do tipo "${typeLabel(
          documentType as DocumentType
        )}" em português brasileiro.

INSTRUÇÕES:
- O usuário irá pedir ajustes (encurtar, adicionar exemplos, mudar tom, traduzir, etc.)
- Quando ele pedir uma alteração concreta no documento, retorne o documento ATUALIZADO COMPLETO em markdown.
- Quando ele só fizer perguntas, responda de forma curta e direta.
- Sempre que retornar o documento atualizado, comece com a linha exata: "DOCUMENTO_ATUALIZADO:" numa linha sozinha, e em seguida o conteúdo em markdown.
- Mantenha estrutura e formatação markdown originais.
- Não invente dados que não estejam no documento ou na conversa.
- Preserve fielmente regras de negócio, regras legais, critérios, condições, valores, limites, prazos e exceções já presentes no documento.
- Se o usuário pedir apenas ajuste de formato, clareza, tom, resumo, expansão ou organização, altere somente a apresentação do conteúdo, não as regras.
- Só mude uma regra do documento quando o usuário pedir explicitamente essa mudança de regra. Se a instrução do usuário for vaga, ambígua ou ampla (ex: "deixa isso mais flexivel", "melhore o texto", "mude as regras"), você NÃO deve atualizar o documento e NÃO deve incluir a tag "DOCUMENTO_ATUALIZADO:". Em vez disso, explique a dúvida ou a ambiguidade em vez de alterar, e solicite esclarecimentos de forma curta e direta.

DOCUMENTO ATUAL:
\`\`\`markdown
${documentContent}
\`\`\``,
      },
      ...limitedMessages.map(m => ({ role: m.role, content: m.content }) as ChatMessage),
    ];

    const reply = await chatCompletion(messages, {
      temperature: 0.4,
      maxTokens: 4000,
    });

    // Detecta se a resposta inclui um documento atualizado
    const updatedMatch = reply.match(/DOCUMENTO_ATUALIZADO:\s*\n([\s\S]*)/);
    let response: string;
    let updatedContent: string | null = null;

    if (updatedMatch) {
      updatedContent = updatedMatch[1].trim();
      response = reply.slice(0, updatedMatch.index).trim();
      if (!response) {
        response = "Documento atualizado conforme solicitado.";
      }
    } else {
      response = reply.trim();
    }

    res.json({ response, updatedContent });
  } catch (err) {
    handleError(err, res, "Failed to process chat");
  }
});

// =============================================================================
// POST /api/ai/quality-score
// Calcula um score de qualidade (0-100) com dimensões e sugestões de melhoria.
// =============================================================================
router.post("/quality-score", async (req, res) => {
  try {
    const { content, type, documentId } = qualityScoreInputSchema.parse(req.body);

    const cacheKey = { type, content };
    const cached = appCache.get("quality-score", cacheKey);
    if (cached) {
      console.log(`[cache] Cache hit para quality-score do tipo ${type}.`);
      return res.json(cached);
    }

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `Avaliador de qualidade de documentos de Product Management. Tipo: "${typeLabel(type as DocumentType)}".
Rubrica (notas 1-5): Fidelidade(0.35): 1=altera regras, 3=perde detalhes, 5=preserva tudo. Completude(0.25): 1=omite requisitos, 3=essencial com lacunas, 5=excelência. Aderência formato(0.15): 1=errada/placeholders, 3=parcial, 5=100% correta. Acionabilidade(0.15): 1=genérico, 3=exige retrabalho, 5=executável. Clareza(0.10): 1=confuso, 3=entendível, 5=direto.
Bloqueadores de release: violação crítica de regra; alucinação factual; documento sem critérios de aceite (quando tipo exige: prd, userstories, techspec, testplan); placeholders em seções essenciais.
JSON apenas: {"fidelidade":{"nota":N,"justificativa":""},"completude":{"nota":N,"justificativa":""},"aderencia_formato":{"nota":N,"justificativa":""},"acionabilidade":{"nota":N,"justificativa":""},"clareza":{"nota":N,"justificativa":""},"blockers":[],"suggestions":[]}`,
      },
      { role: "user", content: `Documento a avaliar:\n\n${content}` },
    ];

    const qualitySchema = z.object({
      fidelidade: z.object({ nota: z.number(), justificativa: z.string() }),
      completude: z.object({ nota: z.number(), justificativa: z.string() }),
      aderencia_formato: z.object({ nota: z.number(), justificativa: z.string() }),
      acionabilidade: z.object({ nota: z.number(), justificativa: z.string() }),
      clareza: z.object({ nota: z.number(), justificativa: z.string() }),
      blockers: z.array(z.string()),
      suggestions: z.array(z.string()),
    });

    const userPlan = (req.header("X-User-Plan") || "pro").toLowerCase();

    const isComplex = content.length > 5000;
    const isLegalCompliance = /legal|compliance|lei|regulamentação|bcb|lgpd|regulamento|norma|portaria|resolução|câmbio|excomex|siscomex|duimp|bcb 277/i.test(content);
    
    let judgeModel = "deepseek/deepseek-flash";
    if (userPlan === "free") {
      judgeModel = "deepseek/deepseek-flash";
      console.log(`[quality-plan] Perfil FREE: forçando deepseek-flash como Juiz.`);
    } else if (userPlan === "enterprise") {
      judgeModel = "mimo-2.5-pro";
      console.log(`[quality-plan] Perfil ENTERPRISE: forçando mimo-2.5-pro como Juiz.`);
    } else {
      // Perfil PRO
      const useStrongJudge = isComplex || isLegalCompliance;
      judgeModel = useStrongJudge ? "mimo-2.5-pro" : "deepseek/deepseek-flash";
      console.log(`[quality-plan] Perfil PRO: judgeModel = ${judgeModel}`);
    }

    const parsed = await chatCompletionJsonWithRetry(messages, qualitySchema, {
      temperature: 0.1,
      maxTokens: 1500,
      model: judgeModel,
      taskName: "quality-score"
    });

    const clamp1to5 = (n: unknown): number => {
      const num = Number(n);
      if (!Number.isFinite(num)) return 3;
      return Math.max(1, Math.min(5, Math.round(num)));
    };

    const fid = clamp1to5(parsed.fidelidade.nota);
    const comp = clamp1to5(parsed.completude.nota);
    const fmt = clamp1to5(parsed.aderencia_formato.nota);
    const aci = clamp1to5(parsed.acionabilidade.nota);
    const cla = clamp1to5(parsed.clareza.nota);

    // Fórmula da Rubrica Oficial:
    // score = (fid * 0.35 + comp * 0.25 + fmt * 0.15 + aci * 0.15 + cla * 0.10) * 20
    const overallScore = Math.round(
      (fid * 0.35 + comp * 0.25 + fmt * 0.15 + aci * 0.15 + cla * 0.10) * 20
    );

    const dimensionsList = [
      { name: "Fidelidade", score: fid * 20, feedback: `Nota: ${fid}/5. ${parsed.fidelidade.justificativa}` },
      { name: "Completude", score: comp * 20, feedback: `Nota: ${comp}/5. ${parsed.completude.justificativa}` },
      { name: "Aderência ao Formato", score: fmt * 20, feedback: `Nota: ${fmt}/5. ${parsed.aderencia_formato.justificativa}` },
      { name: "Acionabilidade", score: aci * 20, feedback: `Nota: ${aci}/5. ${parsed.acionabilidade.justificativa}` },
      { name: "Clareza", score: cla * 20, feedback: `Nota: ${cla}/5. ${parsed.clareza.justificativa}` }
    ];

    const score: QualityScore = {
      overall: overallScore,
      dimensions: dimensionsList,
      suggestions: (parsed.suggestions ?? []).map(s => String(s).slice(0, 500)).slice(0, 5),
      evaluatedAt: new Date().toISOString(),
      isReleaseBlocked: (parsed.blockers ?? []).length > 0,
      blockers: (parsed.blockers ?? []).slice(0, 5)
    };

    // Cacheia no documento se um id foi passado
    if (documentId) {
      try {
        await storage.updateDocument(documentId, { qualityScore: score });
      } catch (cacheErr) {
        console.warn("[ai] failed to cache quality score:", cacheErr);
      }
    }

    appCache.set("quality-score", cacheKey, score);
    res.json(score);
  } catch (err) {
    handleError(err, res, "Failed to compute quality score");
  }
});

function clampScore(n: unknown): number {
  const num = Number(n);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

// =============================================================================
// POST /api/ai/github-repo
// Busca informações públicas do repositório do GitHub e formata como contexto.
// =============================================================================
router.post("/github-repo", async (req, res) => {
  try {
    const { repoUrl } = req.body;
    if (!repoUrl || typeof repoUrl !== "string") {
      return res.status(400).json({ message: "URL do repositório é obrigatória." });
    }

    const parseResult = parseGithubUrl(repoUrl);
    if (!parseResult) {
      return res.status(400).json({ message: "URL do GitHub inválida. Use o formato: https://github.com/owner/repo" });
    }

    const { owner, repo } = parseResult;
    const githubToken = process.env.GITHUB_TOKEN;

    const headers: Record<string, string> = {
      "User-Agent": "DocuMente-App",
    };
    if (githubToken) {
      headers["Authorization"] = `token ${githubToken}`;
    }

    // 1. Verificar se repositório existe e obter branch padrão
    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (!repoResponse.ok) {
      return res.status(404).json({ message: `Repositório '${owner}/${repo}' não encontrado ou é privado.` });
    }
    const repoData = (await repoResponse.json()) as { default_branch: string; description: string };
    const defaultBranch = repoData.default_branch || "main";
    const description = repoData.description || "";

    // 2. Buscar README
    const readmeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers: { ...headers, Accept: "application/vnd.github.v3.raw" },
    });
    const readme = readmeResponse.ok ? await readmeResponse.text() : "";

    // 3. Buscar arquivos raiz para identificar estrutura e tecnologia
    const contentsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, { headers });
    let rootFiles: any[] = [];
    if (contentsResponse.ok) {
      rootFiles = (await contentsResponse.json()) as any[];
    }

    let techStackInfo = "";
    const sourceFilesToFetch: string[] = [];

    // Procurar arquivos de configuração
    for (const file of rootFiles) {
      if (file.type === "file") {
        const name = file.name.toLowerCase();
        if (["package.json", "requirements.txt", "go.mod", "cargo.toml", "gemfile", "composer.json"].includes(name)) {
          try {
            const fileRes = await fetch(file.download_url, { headers });
            if (fileRes.ok) {
              const content = await fileRes.text();
              techStackInfo += `\n### Arquivo: ${file.name}\n\`\`\`json\n${content.slice(0, 1500)}\n\`\`\`\n`;
            }
          } catch (e) {
            console.error(`Erro ao ler arquivo de config ${file.name}:`, e);
          }
        }
      } else if (file.type === "dir" && ["src", "lib", "app", "server"].includes(file.name.toLowerCase())) {
        // Obter arquivos de código da primeira subpasta relevante
        try {
          const subRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${file.name}`, { headers });
          if (subRes.ok) {
            const subFiles = (await subRes.json()) as any[];
            const codeFiles = subFiles.filter(
              (f) =>
                f.type === "file" &&
                /\.(ts|tsx|js|jsx|py|go|rs|java|cs|cpp|c|h|php)$/i.test(f.name)
            );
            // Pegar até 3 arquivos dessa pasta
            codeFiles.slice(0, 3).forEach((f) => sourceFilesToFetch.push(f.path));
          }
        } catch (e) {
          console.error(`Erro ao varrer subpasta ${file.name}:`, e);
        }
      }
    }

    // Buscar conteúdos de código fonte selecionados
    let codeContext = "";
    for (const filePath of sourceFilesToFetch.slice(0, 4)) {
      try {
        const fileResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
          { headers: { ...headers, Accept: "application/vnd.github.v3.raw" } }
        );
        if (fileResponse.ok) {
          const content = await fileResponse.text();
          const ext = filePath.split(".").pop();
          codeContext += `\n### Código: ${filePath}\n\`\`\`${ext}\n${content.slice(0, 2000)}\n\`\`\`\n`;
        }
      } catch (e) {
        console.error(`Erro ao obter arquivo de código ${filePath}:`, e);
      }
    }

    // Compilar tudo
    let contextText = `=== CONTEXTO DO REPOSITÓRIO GITHUB ===\n`;
    contextText += `Repositório: ${owner}/${repo}\n`;
    contextText += `Descrição: ${description}\n`;
    contextText += `Branch Padrão: ${defaultBranch}\n\n`;

    if (readme) {
      contextText += `## README.md\n${readme.slice(0, 8000)}\n\n`;
    }

    if (techStackInfo) {
      contextText += `## Arquivos de Configuração / Dependências\n${techStackInfo}\n`;
    }

    if (codeContext) {
      contextText += `## Amostras de Código-Fonte\n${codeContext}\n`;
    }

    res.json({
      owner,
      repo,
      description,
      readme: readme.slice(0, 5000),
      contextText: contextText.trim(),
    });
  } catch (error) {
    console.error("[github] Failed to fetch repo info:", error);
    res.status(500).json({ message: "Falha ao obter dados do repositório GitHub.", error: error instanceof Error ? error.message : "Erro desconhecido" });
  }
});

// =============================================================================
// GET /api/ai/cost-summary
// Retorna um dashboard com o resumo agregado dos custos de IA baseados em telemetria.
// =============================================================================
router.get("/cost-summary", async (_req, res) => {
  try {
    const logFilePath = path.resolve(process.cwd(), "logs/telemetry.jsonl");
    
    let totalCostUsd = 0;
    let totalTokens = 0;
    let promptTokens = 0;
    let completionTokens = 0;
    let totalRequests = 0;
    let successCount = 0;
    let failureCount = 0;
    let sumLatencyMs = 0;
    let validLatencyCount = 0;

    const byModel: Record<string, { costUsd: number; count: number; tokens: number }> = {};
    const byTask: Record<string, { costUsd: number; count: number; tokens: number }> = {};
    const dailyCost: Record<string, number> = {};

    if (fs.existsSync(logFilePath)) {
      const fileContent = await fs.promises.readFile(logFilePath, "utf-8");
      const lines = fileContent.split("\n").map(l => l.trim()).filter(Boolean);

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          totalRequests++;
          
          if (data.status === "success") {
            successCount++;
          } else {
            failureCount++;
          }

          if (data.latencyMs && data.latencyMs > 0) {
            sumLatencyMs += data.latencyMs;
            validLatencyCount++;
          }

          const cost = data.estimatedCostUsd || 0;
          const tokens = data.totalTokens || 0;
          const pTokens = data.promptTokens || 0;
          const cTokens = data.completionTokens || 0;

          totalCostUsd += cost;
          totalTokens += tokens;
          promptTokens += pTokens;
          completionTokens += cTokens;

          // Agrupado por Modelo
          const modelName = data.model || "unknown";
          if (!byModel[modelName]) {
            byModel[modelName] = { costUsd: 0, count: 0, tokens: 0 };
          }
          byModel[modelName].costUsd += cost;
          byModel[modelName].count++;
          byModel[modelName].tokens += tokens;

          // Agrupado por Tarefa
          const taskName = data.taskName || "unknown";
          if (!byTask[taskName]) {
            byTask[taskName] = { costUsd: 0, count: 0, tokens: 0 };
          }
          byTask[taskName].costUsd += cost;
          byTask[taskName].count++;
          byTask[taskName].tokens += tokens;

          // Agrupado por Dia
          if (data.timestamp) {
            const dateStr = data.timestamp.split("T")[0]; // YYYY-MM-DD
            dailyCost[dateStr] = (dailyCost[dateStr] || 0) + cost;
          }
        } catch (e) {
          // Ignora linhas malformadas
        }
      }
    }

    // Ordenar a série temporal diária por data
    const dailyCostSorted = Object.entries(dailyCost)
      .map(([date, cost]) => ({ date, cost }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      summary: {
        totalCostUsd,
        totalTokens,
        promptTokens,
        completionTokens,
        totalRequests,
        successCount,
        failureCount,
        averageLatencyMs: validLatencyCount > 0 ? Math.round(sumLatencyMs / validLatencyCount) : 0,
      },
      byModel,
      byTask,
      dailyCost: dailyCostSorted,
    });
  } catch (error) {
    console.error("[cost-summary] Failed to load cost summary:", error);
    res.status(500).json({ message: "Falha ao processar resumo de custos.", error: error instanceof Error ? error.message : "Erro desconhecido" });
  }
});

function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  const cleaned = url.trim().replace(/\.git$/, "");
  // Suporta https://github.com/owner/repo ou simplesmente owner/repo
  const regex = /(?:github\.com\/|^)([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/;
  const match = cleaned.match(regex);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }
  const parts = cleaned.split("/");
  if (parts.length === 2 && parts[0] && parts[1]) {
    return { owner: parts[0], repo: parts[1] };
  }
  return null;
}

export default router;
