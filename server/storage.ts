import { documents, apiKeys, type Document, type InsertDocument, type ApiKey, type InsertApiKey } from "@shared/schema";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { neon } from "@neondatabase/serverless";
import postgres from "postgres";
import { eq, desc, or, ilike, and } from "drizzle-orm";

export interface IStorage {
  // Documents
  getDocuments(): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  searchDocuments(query: string, type?: string): Promise<Document[]>;
  updateDocument(id: number, updates: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;

  // API Keys
  getActiveApiKey(): Promise<ApiKey | undefined>;
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  updateApiKey(id: number, updates: Partial<ApiKey>): Promise<ApiKey | undefined>;
}

// PostgreSQL Storage usando Drizzle ORM
export class DatabaseStorage implements IStorage {
  private db: ReturnType<typeof drizzleNeon> | ReturnType<typeof drizzlePostgres>;

  constructor(databaseUrl: string) {
    // Detecta se é Neon (cloud) ou PostgreSQL local
    if (databaseUrl.includes('neon.tech') || databaseUrl.includes('neon.')) {
      const sql = neon(databaseUrl);
      this.db = drizzleNeon(sql);
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

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const results = await this.db
      .insert(documents)
      .values(insertDocument)
      .returning();
    return results[0];
  }

  async searchDocuments(query: string, type?: string): Promise<Document[]> {
    if (!query && !type) {
      return this.getDocuments();
    }

    let conditions = [];

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
      .set(updates)
      .where(eq(documents.id, id))
      .returning();
    return results[0];
  }

  async deleteDocument(id: number): Promise<boolean> {
    const results = await this.db
      .delete(documents)
      .where(eq(documents.id, id))
      .returning();
    return results.length > 0;
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
    // Desativar chaves existentes
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
  private apiKeys: Map<number, ApiKey>;
  private currentDocumentId: number;
  private currentApiKeyId: number;

  constructor() {
    this.documents = new Map();
    this.apiKeys = new Map();
    this.currentDocumentId = 1;
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

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentDocumentId++;
    const document: Document = {
      ...insertDocument,
      id,
      createdAt: new Date(),
    };
    this.documents.set(id, document);
    return document;
  }

  async searchDocuments(query: string, type?: string): Promise<Document[]> {
    const allDocs = await this.getDocuments();
    return allDocs.filter(doc => {
      const matchesQuery = !query ||
        doc.title.toLowerCase().includes(query.toLowerCase()) ||
        doc.content.toLowerCase().includes(query.toLowerCase()) ||
        doc.originalDemand.toLowerCase().includes(query.toLowerCase());

      const matchesType = !type || doc.type === type;

      return matchesQuery && matchesType;
    });
  }

  async updateDocument(id: number, updates: Partial<Document>): Promise<Document | undefined> {
    const existing = this.documents.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    this.documents.set(id, updated);
    return updated;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }

  async getActiveApiKey(): Promise<ApiKey | undefined> {
    return Array.from(this.apiKeys.values()).find(key => key.isActive);
  }

  async createApiKey(insertApiKey: InsertApiKey): Promise<ApiKey> {
    // Desativar chaves existentes
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

// Verifica se a DATABASE_URL é válida (não é placeholder)
function isValidDatabaseUrl(url: string | undefined): url is string {
  if (!url) return false;
  // Verifica se não é um placeholder genérico
  if (url.includes('usuario:senha') || url.includes('user:password')) {
    return false;
  }
  // Verifica se começa com postgresql:// ou postgres://
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
