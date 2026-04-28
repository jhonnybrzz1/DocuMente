import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  originalDemand: text("original_demand").notNull(),
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
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
  isActive: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;

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
});

export type GenerateDocumentInput = z.infer<typeof generateDocumentInputSchema>;
export type PreviewDocumentInput = z.infer<typeof previewDocumentInputSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentInputSchema>;
