import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  originalDemand: text("original_demand").notNull(),
  version: integer("version").default(1).notNull(),
  parentId: integer("parent_id"), // Reference to original document for versions
  isLatest: boolean("is_latest").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  version: true,
  isLatest: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

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
