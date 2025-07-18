import { apiRequest } from "./queryClient";
import type { InsertDocument, InsertApiKey, Document, ApiKey } from "@shared/schema";

export const api = {
  // API Keys
  testConnection: async (apiKey: string) => {
    const response = await apiRequest("POST", "/api/test-connection", { apiKey });
    return response.json();
  },

  saveApiKey: async (data: InsertApiKey) => {
    const response = await apiRequest("POST", "/api/api-keys", data);
    return response.json();
  },

  getActiveApiKey: async (): Promise<ApiKey | null> => {
    const response = await fetch("/api/api-keys/active");
    if (!response.ok) return null;
    return response.json();
  },

  // Documents
  generateDocument: async (data: InsertDocument) => {
    const response = await apiRequest("POST", "/api/generate-document", data);
    return response.json();
  },

  previewDocument: async (type: string, demand: string) => {
    const response = await apiRequest("POST", "/api/preview-document", { type, demand });
    return response.json();
  },

  getDocuments: async (search?: string, type?: string): Promise<Document[]> => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (type) params.append("type", type);
    
    const response = await fetch(`/api/documents?${params}`);
    if (!response.ok) throw new Error("Failed to fetch documents");
    return response.json();
  },

  downloadDocument: async (id: number) => {
    const response = await fetch(`/api/documents/${id}/download`);
    if (!response.ok) throw new Error("Failed to download document");
    return response.blob();
  },
};
