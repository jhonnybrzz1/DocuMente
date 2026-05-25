import {
  documents,
  apiKeys,
  documentVersions,
  type Document,
  type InsertDocument,
  type ApiKey,
  type InsertApiKey,
  type DocumentVersion,
  type InsertDocumentVersion,
} from "@shared/schema";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { neon } from "@neondatabase/serverless";
import postgres from "postgres";
import { eq, desc, or, ilike, and, sql, asc } from "drizzle-orm";

export interface DocumentStats {
  total: number;
  byType: Record<string, number>;
  byMonth: Array<{ month: string; count: number }>;
  thisWeek: number;
  thisMonth: number;
  shared: number;
  averageContentLength: number;
  topTags: Array<{ tag: string; count: number }>;
}

export interface SearchOptions {
  query?: string;
  type?: string;
  tags?: string[];
}

export interface IStorage {
  // Documents
  getDocuments(): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  getDocumentByShareToken(token: string): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  searchDocuments(options: SearchOptions): Promise<Document[]>;
  updateDocument(id: number, updates: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  getDocumentStats(): Promise<DocumentStats>;

  // Versions
  getDocumentVersions(documentId: number): Promise<DocumentVersion[]>;
  createDocumentVersion(version: InsertDocumentVersion): Promise<DocumentVersion>;

  // API Keys
  getActiveApiKey(): Promise<ApiKey | undefined>;
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  updateApiKey(id: number, updates: Partial<ApiKey>): Promise<ApiKey | undefined>;
}

// PostgreSQL Storage usando Drizzle ORM
export class DatabaseStorage implements IStorage {
  private db: ReturnType<typeof drizzleNeon> | ReturnType<typeof drizzlePostgres>;

  constructor(databaseUrl: string) {
    if (databaseUrl.includes('neon.tech') || databaseUrl.includes('neon.')) {
      const sqlClient = neon(databaseUrl);
      this.db = drizzleNeon(sqlClient);
    } else {
      const client = postgres(databaseUrl);
      this.db = drizzlePostgres(client);
    }
  }

  async getDocuments(): Promise<Document[]> {
    return await this.db
      .select()
      .from(documents)
      .orderBy(desc(documents.createdAt));
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const results = await this.db
      .select()
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);
    return results[0];
  }

  async getDocumentByShareToken(token: string): Promise<Document | undefined> {
    const results = await this.db
      .select()
      .from(documents)
      .where(eq(documents.shareToken, token))
      .limit(1);
    return results[0];
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const results = await this.db
      .insert(documents)
      .values(insertDocument)
      .returning();
    return results[0];
  }

  async searchDocuments(options: SearchOptions): Promise<Document[]> {
    const { query, type, tags } = options;

    if (!query && !type && (!tags || tags.length === 0)) {
      return this.getDocuments();
    }

    const conditions = [];

    if (query) {
      conditions.push(
        or(
          ilike(documents.title, `%${query}%`),
          ilike(documents.content, `%${query}%`),
          ilike(documents.originalDemand, `%${query}%`)
        )
      );
    }

    if (type) {
      conditions.push(eq(documents.type, type));
    }

    if (tags && tags.length > 0) {
      // Postgres array overlap operator: tags && ARRAY[...]
      conditions.push(sql`${documents.tags} && ${tags}::text[]`);
    }

    const whereClause = conditions.length === 1
      ? conditions[0]
      : and(...conditions);

    return await this.db
      .select()
      .from(documents)
      .where(whereClause!)
      .orderBy(desc(documents.createdAt));
  }

  async updateDocument(id: number, updates: Partial<Document>): Promise<Document | undefined> {
    const results = await this.db
      .update(documents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return results[0];
  }

  async deleteDocument(id: number): Promise<boolean> {
    // Apaga versões associadas primeiro
    await this.db
      .delete(documentVersions)
      .where(eq(documentVersions.documentId, id));

    const results = await this.db
      .delete(documents)
      .where(eq(documents.id, id))
      .returning();
    return results.length > 0;
  }

  async getDocumentVersions(documentId: number): Promise<DocumentVersion[]> {
    return await this.db
      .select()
      .from(documentVersions)
      .where(eq(documentVersions.documentId, documentId))
      .orderBy(asc(documentVersions.version));
  }

  async createDocumentVersion(version: InsertDocumentVersion): Promise<DocumentVersion> {
    const results = await this.db
      .insert(documentVersions)
      .values(version)
      .returning();
    return results[0];
  }

  async getDocumentStats(): Promise<DocumentStats> {
    const allDocs = await this.getDocuments();
    return computeStats(allDocs);
  }

  async getActiveApiKey(): Promise<ApiKey | undefined> {
    const results = await this.db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.isActive, true))
      .limit(1);
    return results[0];
  }

  async createApiKey(insertApiKey: InsertApiKey): Promise<ApiKey> {
    await this.db
      .update(apiKeys)
      .set({ isActive: false })
      .where(eq(apiKeys.isActive, true));

    const results = await this.db
      .insert(apiKeys)
      .values({ ...insertApiKey, isActive: true })
      .returning();
    return results[0];
  }

  async updateApiKey(id: number, updates: Partial<ApiKey>): Promise<ApiKey | undefined> {
    const results = await this.db
      .update(apiKeys)
      .set(updates)
      .where(eq(apiKeys.id, id))
      .returning();
    return results[0];
  }
}

// Memory Storage para desenvolvimento sem banco de dados
export class MemStorage implements IStorage {
  private documents: Map<number, Document>;
  private versions: Map<number, DocumentVersion>;
  private apiKeys: Map<number, ApiKey>;
  private currentDocumentId: number;
  private currentVersionId: number;
  private currentApiKeyId: number;

  constructor() {
    this.documents = new Map();
    this.versions = new Map();
    this.apiKeys = new Map();
    this.currentDocumentId = 1;
    this.currentVersionId = 1;
    this.currentApiKeyId = 1;
  }

  async getDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values()).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocumentByShareToken(token: string): Promise<Document | undefined> {
    return Array.from(this.documents.values()).find(d => d.shareToken === token);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentDocumentId++;
    const now = new Date();
    const document: Document = {
      ...insertDocument,
      tags: insertDocument.tags ?? [],
      parentDocumentId: insertDocument.parentDocumentId ?? null,
      shareToken: null,
      qualityScore: null,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.documents.set(id, document);
    return document;
  }

  async searchDocuments(options: SearchOptions): Promise<Document[]> {
    const allDocs = await this.getDocuments();
    const { query, type, tags } = options;
    const queryLower = query?.toLowerCase();

    return allDocs.filter(doc => {
      const matchesQuery = !queryLower ||
        doc.title.toLowerCase().includes(queryLower) ||
        doc.content.toLowerCase().includes(queryLower) ||
        doc.originalDemand.toLowerCase().includes(queryLower);

      const matchesType = !type || doc.type === type;

      const matchesTags = !tags || tags.length === 0 ||
        tags.some(t => (doc.tags ?? []).includes(t));

      return matchesQuery && matchesType && matchesTags;
    });
  }

  async updateDocument(id: number, updates: Partial<Document>): Promise<Document | undefined> {
    const existing = this.documents.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.documents.set(id, updated);
    return updated;
  }

  async deleteDocument(id: number): Promise<boolean> {
    // Apaga versões associadas
    const versionsToDelete: number[] = [];
    this.versions.forEach((version, versionId) => {
      if (version.documentId === id) versionsToDelete.push(versionId);
    });
    versionsToDelete.forEach(vid => this.versions.delete(vid));
    return this.documents.delete(id);
  }

  async getDocumentVersions(documentId: number): Promise<DocumentVersion[]> {
    return Array.from(this.versions.values())
      .filter(v => v.documentId === documentId)
      .sort((a, b) => a.version - b.version);
  }

  async createDocumentVersion(insertVersion: InsertDocumentVersion): Promise<DocumentVersion> {
    const id = this.currentVersionId++;
    const version: DocumentVersion = {
      ...insertVersion,
      changeDescription: insertVersion.changeDescription ?? null,
      id,
      createdAt: new Date(),
    };
    this.versions.set(id, version);
    return version;
  }

  async getDocumentStats(): Promise<DocumentStats> {
    const allDocs = await this.getDocuments();
    return computeStats(allDocs);
  }

  async getActiveApiKey(): Promise<ApiKey | undefined> {
    return Array.from(this.apiKeys.values()).find(key => key.isActive);
  }

  async createApiKey(insertApiKey: InsertApiKey): Promise<ApiKey> {
    const keys = Array.from(this.apiKeys.values());
    for (const key of keys) {
      key.isActive = false;
    }

    const id = this.currentApiKeyId++;
    const apiKey: ApiKey = {
      ...insertApiKey,
      id,
      isActive: true,
      createdAt: new Date(),
    };
    this.apiKeys.set(id, apiKey);
    return apiKey;
  }

  async updateApiKey(id: number, updates: Partial<ApiKey>): Promise<ApiKey | undefined> {
    const existing = this.apiKeys.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    this.apiKeys.set(id, updated);
    return updated;
  }
}

// Calcula estatísticas em memória a partir da lista de documentos
function computeStats(allDocs: Document[]): DocumentStats {
  const total = allDocs.length;
  const now = new Date();

  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const monthAgo = new Date(now);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  const byType: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};
  const byMonthMap: Record<string, number> = {};

  let thisWeek = 0;
  let thisMonth = 0;
  let shared = 0;
  let totalLength = 0;

  for (const doc of allDocs) {
    byType[doc.type] = (byType[doc.type] ?? 0) + 1;

    const created = new Date(doc.createdAt);
    if (created > weekAgo) thisWeek++;
    if (created > monthAgo) thisMonth++;

    if (doc.shareToken) shared++;

    totalLength += doc.content?.length ?? 0;

    for (const tag of doc.tags ?? []) {
      if (!tag) continue;
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }

    const monthKey = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`;
    byMonthMap[monthKey] = (byMonthMap[monthKey] ?? 0) + 1;
  }

  const byMonth = Object.entries(byMonthMap)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12);

  const topTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    total,
    byType,
    byMonth,
    thisWeek,
    thisMonth,
    shared,
    averageContentLength: total > 0 ? Math.round(totalLength / total) : 0,
    topTags,
  };
}

// Verifica se a DATABASE_URL é válida (não é placeholder)
function isValidDatabaseUrl(url: string | undefined): url is string {
  if (!url) return false;
  if (url.includes('usuario:senha') || url.includes('user:password')) {
    return false;
  }
  return url.startsWith('postgresql://') || url.startsWith('postgres://');
}

// Factory para criar o storage correto baseado na configuração
function createStorage(): IStorage {
  const databaseUrl = process.env.DATABASE_URL;

  if (isValidDatabaseUrl(databaseUrl)) {
    const isNeon = databaseUrl.includes('neon.tech') || databaseUrl.includes('neon.');
    const isLocal = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');

    if (isNeon) {
      console.log("📦 Usando Neon PostgreSQL (cloud) para persistência");
    } else if (isLocal) {
      console.log("📦 Usando PostgreSQL local para persistência");
    } else {
      console.log("📦 Usando PostgreSQL para persistência");
    }

    return new DatabaseStorage(databaseUrl);
  } else {
    if (databaseUrl) {
      console.log("⚠️  DATABASE_URL parece ser um placeholder - usando armazenamento em memória");
    } else {
      console.log("⚠️  DATABASE_URL não configurado - usando armazenamento em memória");
    }
    console.log("   (dados serão perdidos ao reiniciar o servidor)");
    return new MemStorage();
  }
}

export const storage = createStorage();
