import { Router } from "express";
import { ZodError } from "zod";
import crypto from "node:crypto";
import { storage } from "../storage";
import { updateDocumentMetaSchema } from "@shared/schema";

const router = Router();

function handleError(err: unknown, res: any, fallback: string) {
  if (err instanceof ZodError) {
    const message = err.errors.map(e => e.message).join(", ");
    return res.status(400).json({ message });
  }
  console.error(`[documents-extra] ${fallback}:`, err);
  return res.status(500).json({ message: fallback });
}

// =============================================================================
// PATCH /api/documents/:id/meta - atualizar título, tags, parentDocumentId
// =============================================================================
router.patch("/documents/:id/meta", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid document ID" });

    const updates = updateDocumentMetaSchema.parse(req.body);

    const doc = await storage.getDocument(id);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    // Sanitiza tags
    const cleanUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) cleanUpdates.title = updates.title;
    if (updates.tags !== undefined) {
      cleanUpdates.tags = updates.tags
        .map(t => t.trim().toLowerCase().replace(/^#/, ""))
        .filter(t => t.length > 0 && t.length <= 50);
    }
    if (updates.parentDocumentId !== undefined) {
      // Evita auto-referência e validação básica
      if (updates.parentDocumentId === id) {
        return res.status(400).json({ message: "Documento não pode ser pai de si mesmo" });
      }
      cleanUpdates.parentDocumentId = updates.parentDocumentId;
    }

    const updated = await storage.updateDocument(id, cleanUpdates as any);
    if (!updated) return res.status(404).json({ message: "Document not found" });
    res.json(updated);
  } catch (err) {
    handleError(err, res, "Failed to update document metadata");
  }
});

// =============================================================================
// POST /api/documents/:id/share - cria/regenera token de compartilhamento
// =============================================================================
router.post("/documents/:id/share", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid document ID" });

    const doc = await storage.getDocument(id);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    const token = crypto.randomBytes(16).toString("hex");
    const updated = await storage.updateDocument(id, { shareToken: token });

    if (!updated) return res.status(500).json({ message: "Failed to create share token" });

    res.json({ shareToken: token, document: updated });
  } catch (err) {
    handleError(err, res, "Failed to create share link");
  }
});

// =============================================================================
// DELETE /api/documents/:id/share - revoga token de compartilhamento
// =============================================================================
router.delete("/documents/:id/share", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid document ID" });

    const doc = await storage.getDocument(id);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    const updated = await storage.updateDocument(id, { shareToken: null as any });
    res.json({ document: updated });
  } catch (err) {
    handleError(err, res, "Failed to revoke share link");
  }
});

// =============================================================================
// GET /api/share/:token - rota PÚBLICA: recupera documento por token
// =============================================================================
router.get("/share/:token", async (req, res) => {
  try {
    const token = req.params.token;
    if (!token || token.length < 16) {
      return res.status(400).json({ message: "Invalid share token" });
    }

    const doc = await storage.getDocumentByShareToken(token);
    if (!doc) return res.status(404).json({ message: "Documento não encontrado ou link expirado" });

    // Retorna apenas dados públicos (sem demanda original que pode ter dados sensíveis)
    res.json({
      title: doc.title,
      type: doc.type,
      content: doc.content,
      tags: doc.tags,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    handleError(err, res, "Failed to fetch shared document");
  }
});

// =============================================================================
// GET /api/stats - estatísticas globais dos documentos
// =============================================================================
router.get("/stats", async (_req, res) => {
  try {
    const stats = await storage.getDocumentStats();
    res.json(stats);
  } catch (err) {
    handleError(err, res, "Failed to compute stats");
  }
});

// =============================================================================
// GET /api/documents/:id/versions - histórico de versões
// =============================================================================
router.get("/documents/:id/versions", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid document ID" });

    const versions = await storage.getDocumentVersions(id);
    res.json(versions);
  } catch (err) {
    handleError(err, res, "Failed to fetch document versions");
  }
});

// =============================================================================
// POST /api/documents/:id/push/github - Criar Issue no GitHub
// =============================================================================

/** Valida formato owner/repo para evitar SSRF via path traversal */
const GITHUB_REPO_RE = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;

router.post("/documents/:id/push/github", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "ID do documento inválido" });

    const doc = await storage.getDocument(id);
    if (!doc) return res.status(404).json({ message: "Documento não encontrado" });

    const { repo, token, title: customTitle, body: customBody } = req.body;

    if (!repo || !token) {
      return res.status(400).json({ message: "Repositório e Token são obrigatórios." });
    }

    const cleanedRepo = repo.replace(/^(https:\/\/github\.com\/)/, "").replace(/\/$/, "");

    if (!GITHUB_REPO_RE.test(cleanedRepo)) {
      return res.status(400).json({ message: "Formato de repositório inválido. Use 'owner/repo'." });
    }

    const response = await fetch(`https://api.github.com/repos/${cleanedRepo}/issues`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `token ${token}`,
        "User-Agent": "DocuMente-App"
      },
      body: JSON.stringify({
        title: customTitle || doc.title,
        body: customBody || doc.content
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ message: `Erro na API do GitHub: ${errText}` });
    }

    const issueData = await response.json() as { html_url: string; number: number };
    res.json({
      success: true,
      url: issueData.html_url,
      number: issueData.number
    });
  } catch (err) {
    handleError(err, res, "Erro ao exportar issue para o GitHub");
  }
});

// =============================================================================
// POST /api/documents/:id/push/jira - Criar Issue/Epic no Jira
// =============================================================================

/** Valida domínio Jira: apenas subdomínios atlassian.net ou domínios on-premise sem path injection */
const JIRA_DOMAIN_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]*\.[a-zA-Z]{2,}$/;

router.post("/documents/:id/push/jira", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "ID do documento inválido" });

    const doc = await storage.getDocument(id);
    if (!doc) return res.status(404).json({ message: "Documento não encontrado" });

    const { domain, projectKey, email, apiToken, issueType, summary, description } = req.body;

    if (!domain || !projectKey || !email || !apiToken) {
      return res.status(400).json({ message: "Domínio, Chave do Projeto, E-mail e Token de API do Jira são obrigatórios." });
    }

    const cleanedDomain = domain.replace(/^(https?:\/\/)/, "").replace(/\/$/, "");

    if (!JIRA_DOMAIN_RE.test(cleanedDomain)) {
      return res.status(400).json({ message: "Formato de domínio Jira inválido." });
    }
    const authString = Buffer.from(`${email}:${apiToken}`).toString("base64");

    // Converte a especificação do produto em markdown para sintaxe nativa do Jira Wiki
    const convertedDescription = markdownToJiraWiki(description || doc.content);

    const response = await fetch(`https://${cleanedDomain}/rest/api/2/issue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${authString}`
      },
      body: JSON.stringify({
        fields: {
          project: {
            key: projectKey
          },
          summary: summary || doc.title,
          description: convertedDescription,
          issuetype: {
            name: issueType || (doc.type === "epic" ? "Epic" : "Story")
          }
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ message: `Erro na API do Jira: ${errText}` });
    }

    const issueData = await response.json() as { key: string; self: string };
    const issueUrl = `https://${cleanedDomain}/browse/${issueData.key}`;

    res.json({
      success: true,
      key: issueData.key,
      url: issueUrl
    });
  } catch (err) {
    handleError(err, res, "Erro ao exportar para o Jira");
  }
});

/**
 * Converte Markdown para sintaxe Jira Wiki Markup
 */
function markdownToJiraWiki(markdown: string): string {
  if (!markdown) return "";

  let wiki = markdown;

  // 1. Cabeçalhos: # Título -> h1. Título
  wiki = wiki.replace(/^######\s+(.+)$/gm, "h6. $1");
  wiki = wiki.replace(/^#####\s+(.+)$/gm, "h5. $1");
  wiki = wiki.replace(/^####\s+(.+)$/gm, "h4. $1");
  wiki = wiki.replace(/^###\s+(.+)$/gm, "h3. $1");
  wiki = wiki.replace(/^##\s+(.+)$/gm, "h2. $1");
  wiki = wiki.replace(/^#\s+(.+)$/gm, "h1. $1");

  // 2. Itálico: *texto* ou _texto_ -> _texto_
  wiki = wiki.replace(/_([^_]+)_/g, "_$1_");
  wiki = wiki.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "_$1_");

  // 3. Negrito: **texto** ou __texto__ -> *texto*
  wiki = wiki.replace(/\*\*(.*?)\*\*/g, "*$1*");
  wiki = wiki.replace(/__(.*?)__/g, "*$1*");

  // 4. Tachado: ~~texto~~ -> -texto-
  wiki = wiki.replace(/~~(.*?)~~/g, "-$1-");

  // 5. Código inline: `codigo` -> {{codigo}}
  wiki = wiki.replace(/`(.*?)`/g, "{{$1}}");

  // 6. Blocos de código: ```lang\n código\n ``` -> {code:lang}\n código\n {code}
  wiki = wiki.replace(/^```(\w*)\n([\s\S]*?)\n```/gm, (match, lang, code) => {
    return `{code:${lang || "javascript"}}\n${code}\n{code}`;
  });

  // 7. Citações (Blockquotes): > texto -> bq. texto
  wiki = wiki.replace(/^>\s+(.+)$/gm, "bq. $1");

  // 8. Listas não ordenadas com suporte a indentação
  wiki = wiki.replace(/^(\s*)([-*])\s+(.+)$/gm, (match: string, spaces: string, bullet: string, content: string) => {
    const level = Math.floor(spaces.length / 2) + 1;
    return "*".repeat(level) + " " + content;
  });

  // 9. Listas ordenadas com suporte a indentação
  wiki = wiki.replace(/^(\s*)(\d+\.|\d+\.\d+\.?)\s+(.+)$/gm, (match: string, spaces: string, num: string, content: string) => {
    const level = Math.floor(spaces.length / 2) + 1;
    return "#".repeat(level) + " " + content;
  });

  // 10. Links: [Texto](URL) -> [Texto|URL]
  wiki = wiki.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "[$1|$2]");

  // 11. Checkboxes em listas (comuns no DocuMente):
  wiki = wiki.replace(/-\s+\[\s*\]/g, "* ( )");
  wiki = wiki.replace(/-\s+\[x\]/g, "* (/)"); // (/) é o ícone de Check verde no Jira

  // 12. Tabelas Markdown para Tabelas Jira Wiki
  wiki = wiki.replace(/^(\|.*?\|)\s*\n\s*\|?[\s-:|]*\|[\s-:|]*\n((?:\|.*?\|\s*\n?)*)/gm, (match: string, headerRow: string, dataRows: string) => {
    const jiraHeader = headerRow
      .split('|')
      .map((cell: string) => cell.trim())
      .filter((cell: string) => cell !== '')
      .map((cell: string) => `||${cell}`)
      .join('') + '||';

    const jiraData = dataRows
      .split('\n')
      .map((row: string) => {
        if (!row.trim()) return '';
        return row
          .split('|')
          .map((cell: string) => cell.trim())
          .filter((cell: string, idx: number, arr: string[]) => {
            if (idx === 0 || idx === arr.length - 1) return cell === '';
            return true;
          })
          .join('|');
      })
      .filter(Boolean)
      .join('\n');

    return `${jiraHeader}\n${jiraData}\n`;
  });

  return wiki;
}

export default router;
