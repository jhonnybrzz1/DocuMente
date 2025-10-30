import { apiRequest } from "./queryClient";
import type { InsertDocument, InsertApiKey, Document, ApiKey } from "@shared/schema";

export const api = {
  

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
