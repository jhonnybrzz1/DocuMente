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

export default router;
