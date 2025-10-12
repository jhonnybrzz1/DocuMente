

import { documents, apiKeys, type Document, type InsertDocument, type ApiKey, type InsertApiKey } from "@shared/schema";

export interface IStorage {
  // Documents
  getDocuments(): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  createDocumentVersion(originalId: number, document: InsertDocument): Promise<Document>;
  getDocumentVersions(parentId: number): Promise<Document[]>;
  searchDocuments(query: string, type?: string): Promise<Document[]>;
  deleteDocument(id: number): Promise<boolean>;

  // API Keys
  getActiveApiKey(): Promise<ApiKey | undefined>;
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
}

export class InMemoryStorage implements IStorage {
  private documents = new Map<number, Document>();
  private apiKeys = new Map<number, ApiKey>();
  private nextDocumentId = 1;
  private nextApiKeyId = 1;

  async getDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter(doc => !doc.parentId) // Only return parent documents
      .sort((a, b) => b.id - a.id);
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const newDocument: Document = {
      id: this.nextDocumentId++,
      ...document,
      createdAt: new Date(),
      version: 1,
      parentId: undefined,
    };
    this.documents.set(newDocument.id, newDocument);
    return newDocument;
  }

  async createDocumentVersion(originalId: number, document: InsertDocument): Promise<Document> {
    const original = this.documents.get(originalId);
    if (!original) {
      throw new Error("Original document not found");
    }

    const newVersion: Document = {
      id: this.nextDocumentId++,
      ...document,
      createdAt: new Date(),
      version: (original.version || 1) + 1,
      parentId: originalId,
    };
    this.documents.set(newVersion.id, newVersion);
    return newVersion;
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

  async deleteDocument(id: number): Promise<boolean> {
    const document = this.documents.get(id);
    if (!document) {
      return false;
    }

    // Remove the document
    this.documents.delete(id);

    // If this document has versions, also remove them
    const versions = Array.from(this.documents.values())
      .filter(doc => doc.parentId === id);

    versions.forEach(version => {
      this.documents.delete(version.id);
    });

    return true;
  }

  async getActiveApiKey(): Promise<ApiKey | undefined> {
    const keys = Array.from(this.apiKeys.values());
    return keys[0]; // Return the first API key for now
  }

  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    const newApiKey: ApiKey = {
      id: this.nextApiKeyId++,
      ...apiKey,
      createdAt: new Date(),
    };
    this.apiKeys.set(newApiKey.id, newApiKey);
    return newApiKey;
  }
}

export const storage = new InMemoryStorage();

