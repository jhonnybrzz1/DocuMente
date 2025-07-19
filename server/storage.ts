import { documents, apiKeys, type Document, type InsertDocument, type ApiKey, type InsertApiKey } from "@shared/schema";

export interface IStorage {
  // Documents
  getDocuments(): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  createDocumentVersion(originalId: number, document: InsertDocument): Promise<Document>;
  getDocumentVersions(parentId: number): Promise<Document[]>;
  searchDocuments(query: string, type?: string): Promise<Document[]>;
  
  // API Keys
  getActiveApiKey(): Promise<ApiKey | undefined>;
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  updateApiKey(id: number, updates: Partial<ApiKey>): Promise<ApiKey | undefined>;
}

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
    // Only return latest versions of documents
    return Array.from(this.documents.values())
      .filter(doc => doc.isLatest)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentDocumentId++;
    const document: Document = {
      ...insertDocument,
      id,
      version: 1,
      parentId: null,
      isLatest: true,
      createdAt: new Date(),
    };
    this.documents.set(id, document);
    return document;
  }

  async createDocumentVersion(originalId: number, insertDocument: InsertDocument): Promise<Document> {
    const originalDoc = this.documents.get(originalId);
    if (!originalDoc) {
      throw new Error('Original document not found');
    }

    // Find the parent document (either the original or its parent)
    const parentId = originalDoc.parentId || originalId;
    
    // Get all versions to find the highest version number
    const allVersions = Array.from(this.documents.values())
      .filter(doc => doc.parentId === parentId || doc.id === parentId);
    
    const highestVersion = Math.max(...allVersions.map(doc => doc.version));
    const newVersion = highestVersion + 1;

    // Mark all previous versions as not latest
    allVersions.forEach(doc => {
      doc.isLatest = false;
    });

    // Create new version
    const id = this.currentDocumentId++;
    const document: Document = {
      ...insertDocument,
      id,
      version: newVersion,
      parentId,
      isLatest: true,
      createdAt: new Date(),
    };
    
    this.documents.set(id, document);
    return document;
  }

  async getDocumentVersions(parentId: number): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter(doc => doc.parentId === parentId || doc.id === parentId)
      .sort((a, b) => b.version - a.version);
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

  async getActiveApiKey(): Promise<ApiKey | undefined> {
    return Array.from(this.apiKeys.values()).find(key => key.isActive);
  }

  async createApiKey(insertApiKey: InsertApiKey): Promise<ApiKey> {
    // Deactivate existing keys
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

export const storage = new MemStorage();
