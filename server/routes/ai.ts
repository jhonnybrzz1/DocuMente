import { Router } from "express";
import { ZodError } from "zod";
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

// =============================================================================
// POST /api/ai/suggest-title
// Sugere até 5 títulos curtos baseados na demanda + tipo de documento.
// =============================================================================
router.post("/suggest-title", async (req, res) => {
  try {
    const { type, demand } = suggestTitleInputSchema.parse(req.body);

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

    const raw = await chatCompletion(messages, {
      temperature: 0.6,
      maxTokens: 400,
      jsonMode: true,
    });
    const parsed = extractJson<{ suggestions: string[] }>(raw);
    const suggestions = (parsed.suggestions ?? [])
      .filter(s => typeof s === "string" && s.trim().length > 0)
      .map(s => s.trim().slice(0, 80))
      .slice(0, 5);

    if (suggestions.length === 0) {
      return res.status(502).json({ message: "A IA não retornou sugestões válidas. Tente novamente." });
    }

    res.json({ suggestions });
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
    "Resuma o texto abaixo mantendo as ideias principais. Reduza para cerca de 30-40% do tamanho original. Mantenha tom profissional e estrutura em markdown se houver.",
  expand:
    "Expanda o texto abaixo adicionando detalhes, exemplos concretos e contexto, sem inventar fatos. Mantenha o tom e estrutura originais.",
  rewrite:
    "Reescreva o texto abaixo de forma mais clara, direta e profissional, mantendo o mesmo significado e formatação markdown.",
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

    const systemPrompt = ACTION_PROMPTS[action];
    if (!systemPrompt) {
      return res.status(400).json({ message: "Ação inválida." });
    }

    const userContent = context
      ? `Contexto adicional: ${context}\n\nTexto:\n${text}`
      : `Texto:\n${text}`;

    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          "Você é um assistente especializado em redação de documentos de Product Management em português brasileiro. Responda APENAS com o resultado pedido — sem comentários, sem explicações, sem prefixos como 'Aqui está:'. Preserve formatação markdown sempre.\n\n" +
          systemPrompt,
      },
      { role: "user", content: userContent },
    ];

    const result = await chatCompletion(messages, {
      temperature: action === "fix-grammar" ? 0.2 : 0.5,
      maxTokens: 4000,
    });

    res.json({ result: result.trim() });
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

DOCUMENTO ATUAL:
\`\`\`markdown
${documentContent}
\`\`\``,
      },
      ...userMessages.map(m => ({ role: m.role, content: m.content }) as ChatMessage),
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

    const dimensionsByType: Record<DocumentType, string[]> = {
      prd: ["Clareza do problema", "Definição de usuários", "Solução proposta", "Critérios de aceite", "Métricas de sucesso", "Riscos e dependências"],
      epic: ["Hipótese testável", "Outcome mensurável", "Validação INVEST", "Story map / divisão", "Métricas e guardrails", "Dependências"],
      userstories: ["Formato Mike Cohn", "Critérios em Gherkin", "INVEST por story", "Splitting adequado", "Definition of Done", "Cobertura de cenários"],
      roadmap: ["Visão e North Star", "Now/Next/Later", "Outcomes vs outputs", "Trade-offs explícitos", "Riscos e premissas", "Cadência de revisão"],
      releasenote: ["Resumo orientado a usuário", "Mudanças destacadas", "Compatibilidade", "Bugs corrigidos", "Próximos passos", "Linguagem acessível"],
      pitch: ["Hook inicial", "Problema/oportunidade", "Solução e diferencial", "Mercado e tamanho", "Tração / evidências", "Call to action"],
      techspec: ["Arquitetura clara", "Fluxos detalhados", "Modelagem de dados", "Segurança", "Performance / escalabilidade", "Plano de rollout"],
      testplan: ["Escopo de testes", "Estratégia (unit/integ/e2e)", "Critérios de entrada/saída", "Casos críticos", "Ambientes e dados", "Riscos de qualidade"],
      apidoc: ["Endpoints documentados", "Auth e permissões", "Exemplos de request/response", "Erros e códigos", "Versionamento", "Rate limiting"],
    };

    const dimensions = dimensionsByType[type as DocumentType] ?? dimensionsByType.prd;

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `Você é um avaliador de qualidade de documentos de Product Management. Avalie o documento de tipo "${typeLabel(
          type as DocumentType
        )}" abaixo nas seguintes dimensões: ${dimensions.join(", ")}.

REGRAS:
- Para cada dimensão, dê um score 0-100 e um feedback curto (1-2 frases) em português.
- Calcule um score geral (média ponderada simples).
- Liste no máximo 5 sugestões concretas e acionáveis para melhorar o documento.
- Resposta APENAS em JSON válido, sem markdown e sem texto adicional.

FORMATO:
{
  "overall": 0-100,
  "dimensions": [
    { "name": "<dimensão>", "score": 0-100, "feedback": "<feedback curto>" }
  ],
  "suggestions": ["<sugestão>", ...]
}`,
      },
      { role: "user", content: `Documento a avaliar:\n\n${content}` },
    ];

    const raw = await chatCompletion(messages, {
      temperature: 0.2,
      maxTokens: 1500,
      jsonMode: true,
    });

    const parsed = extractJson<{
      overall: number;
      dimensions: Array<{ name: string; score: number; feedback: string }>;
      suggestions: string[];
    }>(raw);

    const score: QualityScore = {
      overall: clampScore(parsed.overall),
      dimensions: (parsed.dimensions ?? []).map(d => ({
        name: String(d.name ?? "").slice(0, 80),
        score: clampScore(d.score),
        feedback: String(d.feedback ?? "").slice(0, 500),
      })),
      suggestions: (parsed.suggestions ?? []).map(s => String(s).slice(0, 500)).slice(0, 5),
      evaluatedAt: new Date().toISOString(),
    };

    // Cacheia no documento se um id foi passado
    if (documentId) {
      try {
        await storage.updateDocument(documentId, { qualityScore: score });
      } catch (cacheErr) {
        console.warn("[ai] failed to cache quality score:", cacheErr);
      }
    }

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

export default router;
