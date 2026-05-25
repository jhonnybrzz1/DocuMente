import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  originalDemand: text("original_demand").notNull(),
  tags: text("tags").array().default([]).notNull(),
  parentDocumentId: integer("parent_document_id"),
  shareToken: text("share_token").unique(),
  qualityScore: jsonb("quality_score"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const documentVersions = pgTable("document_versions", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  version: integer("version").notNull(),
  content: text("content").notNull(),
  changeDescription: text("change_description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  mistralKey: text("mistral_key").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  shareToken: true,
  qualityScore: true,
});

export const insertDocumentVersionSchema = createInsertSchema(documentVersions).omit({
  id: true,
  createdAt: true,
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
  isActive: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocumentVersion = z.infer<typeof insertDocumentVersionSchema>;
export type DocumentVersion = typeof documentVersions.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;

export type QualityScore = {
  overall: number; // 0-100
  dimensions: Array<{
    name: string;
    score: number;
    feedback: string;
  }>;
  suggestions: string[];
  evaluatedAt: string;
};

export const documentTypes = [
  { value: "prd", label: "PRD", description: "Product Requirements", icon: "file-text", color: "blue" },
  { value: "epic", label: "Épico", description: "Epic Documentation", icon: "layer-group", color: "purple" },
  { value: "userstories", label: "User Stories", description: "Stories & Criteria", icon: "users", color: "green" },
  { value: "roadmap", label: "Roadmap", description: "Product Roadmap", icon: "road", color: "orange" },
  { value: "releasenote", label: "Release Note", description: "Release Documentation", icon: "rocket", color: "indigo" },
  { value: "pitch", label: "Pitch", description: "Product Pitch", icon: "bullseye", color: "red" },
  { value: "techspec", label: "Spec Técnica", description: "Technical Specification", icon: "cogs", color: "gray" },
  { value: "testplan", label: "Plano de Testes", description: "Test Plan", icon: "check-circle", color: "yellow" },
  { value: "apidoc", label: "Doc de API", description: "API Documentation", icon: "code", color: "teal" },
] as const;

export type DocumentType = typeof documentTypes[number]["value"];

// Validação de tipos de documento
const documentTypeValues = documentTypes.map(dt => dt.value) as [string, ...string[]];

// Schemas de validação de input para API
export const generateDocumentInputSchema = z.object({
  type: z.enum(documentTypeValues, {
    errorMap: () => ({ message: "Tipo de documento inválido" })
  }),
  demand: z.string()
    .min(10, "A demanda deve ter pelo menos 10 caracteres")
    .max(50000, "A demanda não pode exceder 50.000 caracteres"),
  title: z.string()
    .min(3, "O título deve ter pelo menos 3 caracteres")
    .max(200, "O título não pode exceder 200 caracteres"),
  extractedText: z.string().max(100000, "Texto extraído muito grande").optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  parentDocumentId: z.number().int().positive().optional(),
});

export const previewDocumentInputSchema = z.object({
  type: z.enum(documentTypeValues, {
    errorMap: () => ({ message: "Tipo de documento inválido" })
  }),
  demand: z.string()
    .min(10, "A demanda deve ter pelo menos 10 caracteres")
    .max(50000, "A demanda não pode exceder 50.000 caracteres"),
});

export const updateDocumentInputSchema = z.object({
  content: z.string()
    .min(1, "O conteúdo não pode estar vazio")
    .max(500000, "O conteúdo não pode exceder 500.000 caracteres"),
  changeDescription: z.string().max(500).optional(),
});

export const updateDocumentMetaSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  parentDocumentId: z.number().int().positive().nullable().optional(),
});

export const suggestTitleInputSchema = z.object({
  type: z.enum(documentTypeValues),
  demand: z.string().min(10).max(50000),
});

export const quickActionInputSchema = z.object({
  text: z.string().min(1).max(50000),
  action: z.enum(["summarize", "expand", "rewrite", "fix-grammar", "translate-en", "validate-invest"]),
  context: z.string().max(200).optional(),
});

export const chatRefineInputSchema = z.object({
  documentContent: z.string().min(1).max(100000),
  documentType: z.enum(documentTypeValues),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1).max(10000),
    })
  ).min(1).max(20),
});

export const qualityScoreInputSchema = z.object({
  documentId: z.number().int().positive().optional(),
  content: z.string().min(1).max(100000),
  type: z.enum(documentTypeValues),
});

export type GenerateDocumentInput = z.infer<typeof generateDocumentInputSchema>;
export type PreviewDocumentInput = z.infer<typeof previewDocumentInputSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentInputSchema>;
export type UpdateDocumentMetaInput = z.infer<typeof updateDocumentMetaSchema>;
export type SuggestTitleInput = z.infer<typeof suggestTitleInputSchema>;
export type QuickActionInput = z.infer<typeof quickActionInputSchema>;
export type ChatRefineInput = z.infer<typeof chatRefineInputSchema>;
export type QualityScoreInput = z.infer<typeof qualityScoreInputSchema>;
