



import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDocumentSchema, insertApiKeySchema, documentTypes } from "@shared/schema";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

const documentTemplates = {
  prd: `Você é um especialista em Product Management. Sua função é criar um PRD (Product Requirements Document) estruturado com base na descrição fornecida.

Siga exatamente este formato:

📄 **PRD (Product Requirements Document)**
- Visão Geral do Produto
- Cenário Atual (Problema)
- Solução Proposta
- Requisitos Funcionais
- Casos de Uso
- Fluxo de Funcionamento
- Validações
- Dependências
- Resultados Esperados
- Métricas de Sucesso
- Notas Técnicas da Squad (se necessário)

Gere o documento de forma clara, direta e estruturada.`,
  epic: `Você é um especialista em Product Management. Sua função é criar um Épico estruturado com base na descrição fornecida.

Siga exatamente este formato:

📘 **Épico**
- Título
- Objetivo
- Justificativa
- Critérios de Aceite
- User Stories relacionadas

Gere o documento de forma clara, direta e estruturada.`,
  userstories: `Você é um especialista em Product Management. Sua função é criar User Stories estruturadas com base na descrição fornecida.

Siga exatamente este formato:

🧩 **User Stories**
Para cada história:
- Como [tipo de usuário], eu quero [ação], para [benefício].
- Critérios de Aceite (bullet ou Gherkin)

IMPORTANTE: Se a demanda for complexa, divida em múltiplas user stories. Gere o documento de forma clara, direta e estruturada.`,
  roadmap: `Você é um especialista em Product Management. Sua função é criar um Cronograma de Produto (Roadmap) estruturado com base na descrição fornecida.

Siga exatamente este formato:

🗓️ **Cronograma de Produto (Roadmap)**
- Entregas por trimestre ou fase
- Marcos principais (milestones)
- Dependências e riscos

Gere o documento de forma clara, direta e estruturada.`,
  releasenote: `Você é um especialista em Product Management. Sua função é criar uma Release Note estruturada com base na descrição fornecida.

Siga exatamente este formato:

🚀 **Release Note**
- Título da Release
- Descrição geral
- Novas funcionalidades
- Correções
- Instruções de uso

Gere o documento de forma clara, direta e estruturada.`,
  pitch: `Você é um especialista em Product Management. Sua função é criar um Pitch de Produto (1 slide) estruturado com base na descrição fornecida.

Siga exatamente este formato:

🎯 **Pitch de Produto (1 slide)**
- Problema
- Solução
- Público-alvo
- Benefícios esperados
- Métrica principal

Gere o documento de forma clara, direta e estruturada.`,
  techspec: `Você é um especialista em Product Management. Sua função é criar uma Especificação Técnica estruturada com base na descrição fornecida.

Siga exatamente este formato:

⚙️ **Especificação Técnica**
- Visão Geral Técnica
- Arquitetura Proposta
- Tecnologias Utilizadas
- Requisitos Técnicos
- Interfaces e APIs
- Considerações de Performance
- Segurança
- Testes Técnicos
- Deployment e Infraestrutura

Gere o documento de forma clara, direta e estruturada.`,
  testplan: `Você é um especialista em Product Management. Sua função é criar um Plano de Testes estruturado com base na descrição fornecida.

Siga exatamente este formato:

🧪 **Plano de Testes**
- Escopo dos Testes
- Casos de Teste Funcionais
- Casos de Teste de Usabilidade
- Casos de Teste de Performance
- Casos de Teste de Segurança
- Critérios de Aceitação
- Ambiente de Testes
- Cronograma de Execução

Gere o documento de forma clara, direta e estruturada.`,
  apidoc: `Você é um especialista em Product Management. Sua função é criar uma Documentação de API estruturada com base na descrição fornecida.

Siga exatamente este formato:

📡 **Documentação de API**
- Visão Geral da API
- Autenticação
- Endpoints Principais
- Modelos de Dados
- Códigos de Resposta
- Exemplos de Uso
- Rate Limiting
- Versionamento
- SDKs e Bibliotecas

Gere o documento de forma clara, direta e estruturada.`
};

async function callMistralAPI(prompt: string, demandText: string, apiKey: string): Promise<string> {
  const response = await fetch(MISTRAL_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "ft:mistral-large-latest:87817515:20250910:33f45a53",
      messages: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: `Descrição da demanda: ${demandText}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mistral API Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function createWordDocument(title: string, content: string): Promise<Buffer> {
  // Parse content and create structured Word document
  const lines = content.split('\n').filter(line => line.trim());
  const children: any[] = [];

  // Add header with company/project info
  children.push(new Paragraph({
    children: [new TextRun({ text: "DocuMente - Documentação de Produto", size: 18, color: "666666" })],
    alignment: "right",
  }));

  children.push(new Paragraph({ text: "" })); // Spacing

  // Add document title with better styling
  children.push(new Paragraph({
    children: [new TextRun({ text: title, bold: true, size: 32, color: "1F4E79" })],
    heading: HeadingLevel.TITLE,
    spacing: { after: 400 },
  }));

  // Add creation date
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  children.push(new Paragraph({
    children: [new TextRun({ text: `Gerado em: ${currentDate}`, size: 18, color: "666666", italics: true })],
    spacing: { after: 600 },
  }));

  children.push(new Paragraph({ text: "" })); // Add spacing

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      children.push(new Paragraph({ text: "" })); // Preserve empty lines
      continue;
    }

    if (trimmedLine.startsWith('📄') || trimmedLine.startsWith('📘') || trimmedLine.startsWith('🧩') ||
        trimmedLine.startsWith('🗓️') || trimmedLine.startsWith('🚀') || trimmedLine.startsWith('🎯') ||
        trimmedLine.startsWith('⚙️') || trimmedLine.startsWith('🧪') || trimmedLine.startsWith('📡')) {
      // Document type header with better styling
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmedLine, bold: true, size: 24, color: "1F4E79" })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
        border: {
          bottom: {
            color: "1F4E79",
            space: 1,
            style: "single",
            size: 6,
          },
        },
      }));
    } else if (trimmedLine.startsWith('##')) {
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmedLine.replace('##', '').trim(), bold: true, size: 20, color: "2E5D8A" })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
      }));
    } else if (trimmedLine.startsWith('#')) {
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmedLine.replace('#', '').trim(), bold: true, size: 18, color: "2E5D8A" })],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 },
      }));
    } else if (trimmedLine.startsWith('-')) {
      // Better bullet points
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmedLine.substring(1).trim(), size: 22 })],
        bullet: { level: 0 },
        spacing: { after: 100 },
        indent: { left: 360 },
      }));
    } else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
      // Bold text sections
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmedLine.replace(/\*\*/g, ''), bold: true, size: 22, color: "1F4E79" })],
        spacing: { before: 200, after: 100 },
      }));
    } else {
      // Regular text with better spacing
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmedLine, size: 22 })],
        spacing: { after: 100 },
        alignment: "both",
      }));
    }
  }

  // Add footer
  children.push(new Paragraph({ text: "" }));
  children.push(new Paragraph({ text: "" }));
  children.push(new Paragraph({
    children: [new TextRun({ text: "Este documento foi gerado automaticamente pela plataforma DocuMente.", size: 16, color: "999999", italics: true })],
    alignment: "center",
    spacing: { before: 400 },
  }));

  try {
    const doc = new Document({
      styles: {
        paragraphStyles: [
          {
            id: "Normal",
            name: "Normal",
            basedOn: "Normal",
            next: "Normal",
            run: {
              font: "Calibri",
              size: 22,
            },
            paragraph: {
              spacing: {
                line: 276,
                after: 100,
              },
            },
          },
        ],
      },
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: children,
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    console.log(`[docx] Created document with ${buffer.length} bytes`);
    return buffer;
  } catch (error) {
    console.error("[docx] Error creating document:", error);
    throw new Error("Failed to create Word document");
  }
}

export async function registerRoutes(app: Express): Promise<Server> {

  // Test API connection
  app.post("/api/test-connection", async (req, res) => {
    try {
      const { apiKey } = req.body;

      if (!apiKey) {
        return res.status(400).json({ message: "API key is required" });
      }

      // Test API key format first
      if (typeof apiKey !== 'string' || apiKey.length < 10) {
        return res.status(400).json({
          message: "API key format is invalid",
          errorCode: "INVALID_FORMAT"
        });
      }

      const response = await fetch(MISTRAL_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "ft:mistral-small-latest:450092c5:20250910:23569512",
          messages: [
            {
              role: "user",
              content: "Hello, this is a test message.",
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `API connection failed: ${response.status}`;

        // Parse error details if possible
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error && errorData.error.message) {
            errorMessage = errorData.error.message;
          }
        } catch (e) {
          // Keep original error text if not JSON
          errorMessage = errorText;
        }

        // Common error cases
        if (response.status === 401) {
          return res.status(401).json({
            message: "API key is invalid or unauthorized",
            errorCode: "UNAUTHORIZED",
            details: errorMessage
          });
        }

        if (response.status === 403) {
          return res.status(403).json({
            message: "Access forbidden - check your API key permissions",
            errorCode: "FORBIDDEN",
            details: errorMessage
          });
        }

        if (response.status === 429) {
          return res.status(429).json({
            message: "API rate limit exceeded",
            errorCode: "RATE_LIMIT",
            details: errorMessage
          });
        }

        return res.status(400).json({
          message: `API connection failed: ${errorMessage}`,
          errorCode: "CONNECTION_FAILED",
          details: errorText
        });
      }

      res.json({
        message: "API connection successful",
        status: "connected"
      });
    } catch (error: any) {
      console.error("API test error:", error);

      // Handle network errors
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return res.status(503).json({
          message: "API service is unavailable",
          errorCode: "SERVICE_UNAVAILABLE",
          details: error.message
        });
      }

      res.status(500).json({
        message: "Failed to test API connection",
        errorCode: "INTERNAL_ERROR",
        details: error.message
      });
    }
  });

  // Save API key
  app.post("/api/api-keys", async (req, res) => {
    try {
      const validated = insertApiKeySchema.parse(req.body);
      const apiKey = await storage.createApiKey(validated);
      res.json(apiKey);
    } catch (error) {
      console.error("Save API key error:", error);
      res.status(400).json({ message: "Invalid API key data" });
    }
  });

  // Get active API key
  app.get("/api/api-keys/active", async (req, res) => {
    try {
      const apiKey = await storage.createApiKey({ mistralKey: process.env.MISTRAL_API_KEY || "" });
      res.json(apiKey);
    } catch (error) {
      console.error("Get API key error:", error);
      res.status(500).json({ message: "Failed to get API key" });
    }
  });

  // Generate document
  app.post("/api/generate-document", async (req, res) => {
    try {
      const { type, demand, title } = req.body;

      if (!type || !demand || !title) {
        return res.status(400).json({ message: "Type, demand, and title are required" });
      }

      const apiKey = await storage.getActiveApiKey();
      if (!apiKey) {
        return res.status(400).json({ message: "No API key configured" });
      }

      const template = documentTemplates[type as keyof typeof documentTemplates];
      if (!template) {
        return res.status(400).json({ message: "Invalid document type" });
      }

      const content = await callMistralAPI(template, demand, apiKey.mistralKey);

      const validated = insertDocumentSchema.parse({
        title,
        type,
        content,
        originalDemand: demand,
      });

      const document = await storage.createDocument(validated);
      res.json(document);

    } catch (error) {
      console.error("Generate document error:", error);
      res.status(500).json({ message: "Failed to generate document" });
    }
  });

  // Preview document (generate content without saving)
  app.post("/api/preview-document", async (req, res) => {
    try {
      const { type, demand } = req.body;

      if (!type || !demand) {
        return res.status(400).json({ message: "Type and demand are required" });
      }

      const apiKey = await storage.getActiveApiKey();
      if (!apiKey) {
        return res.status(400).json({ message: "No API key configured" });
      }

      const template = documentTemplates[type as keyof typeof documentTemplates];
      if (!template) {
        return res.status(400).json({ message: "Invalid document type" });
      }

      const content = await callMistralAPI(template, demand, apiKey.mistralKey);
      res.json({ content });

    } catch (error) {
      console.error("Preview document error:", error);
      res.status(500).json({ message: "Failed to preview document" });
    }
  });

  // Download document as Word
  app.get("/api/documents/:id/download", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const wordBuffer = await createWordDocument(document.title, document.content);

      // Sanitize filename for download
      const sanitizedFilename = document.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}.docx"`);
      res.setHeader('Content-Length', wordBuffer.length.toString());
      res.send(wordBuffer);

    } catch (error) {
      console.error("Download document error:", error);
      res.status(500).json({ message: "Failed to download document" });
    }
  });

  // Get documents with search
  app.get("/api/documents", async (req, res) => {
    try {
      const { search, type } = req.query;

      let documents;
      if (search || (type && type !== "all")) {
        documents = await storage.searchDocuments(
          search as string || "",
          type === "all" ? undefined : (type as string || undefined)
        );
      } else {
        documents = await storage.getDocuments();
      }

      res.json(documents);
    } catch (error) {
      console.error("Get documents error:", error);
      res.status(500).json({ message: "Failed to get documents" });
    }
  });

  app.get("/api/documents/:id/versions", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid document ID" });
      }

      const versions = await storage.getDocumentVersions(id);
      res.json(versions);
    } catch (error: any) {
      console.error("[api] Error fetching document versions:", error);
      res.status(500).json({ error: "Failed to fetch document versions" });
    }
  });

  app.post("/api/documents/:id/versions", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { type, demand, title } = req.body;

      if (!type || !demand || !title) {
        return res.status(400).json({ message: "Type, demand, and title are required" });
      }

      const apiKey = await storage.getActiveApiKey();
      if (!apiKey) {
        return res.status(400).json({ message: "No API key configured" });
      }

      const template = documentTemplates[type as keyof typeof documentTemplates];
      if (!template) {
        return res.status(400).json({ message: "Invalid document type" });
      }

      const content = await callMistralAPI(template, demand, apiKey.mistralKey);

      const validated = insertDocumentSchema.parse({
        title,
        type,
        content,
        originalDemand: demand,
      });

      const document = await storage.createDocumentVersion(id, validated);
      res.json(document);

    } catch (error) {
      console.error("Create document version error:", error);
      res.status(500).json({ message: "Failed to create document version" });
    }
  });

  // Edit document and create new version
  app.post("/api/documents/:id/edit", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }

      // Get the original document
      const originalDocument = await storage.getDocument(id);
      if (!originalDocument) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Create a new version with the edited content
      const validated = insertDocumentSchema.parse({
        title: originalDocument.title,
        type: originalDocument.type,
        content,
        originalDemand: originalDocument.originalDemand,
      });

      const newVersion = await storage.createDocumentVersion(id, validated);
      res.json(newVersion);

    } catch (error) {
      console.error("Edit document error:", error);
      res.status(500).json({ message: "Failed to edit document" });
    }
  });

  app.get("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      res.json(document);
    } catch (error) {
      console.error("Get document error:", error);
      res.status(500).json({ message: "Failed to get document" });
    }
  });

  // Generate AI prompt
  app.get("/api/documents/:id/generate-prompt", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Generate a more useful AI prompt based on document content
      const prompt = `Você é um assistente de IA especializado em documentação de produtos. Com base no seguinte documento, forneça sugestões de melhorias, expansões ou ideias relacionadas:

      **Título:** ${document.title}
      **Tipo:** ${document.type}
      **Conteúdo:**
      ${document.content || "Nenhum conteúdo disponível"}

      Por favor, forneça um prompt detalhado que possa ser usado para gerar conteúdo adicional ou melhorar este documento.`;

      res.json({ prompt });
    } catch (error) {
      console.error("Generate AI prompt error:", error);
      res.status(500).json({ message: "Failed to generate AI prompt" });
    }
  });

  // Delete document
  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDocument(id);

      if (!success) {
        return res.status(404).json({ message: "Document not found" });
      }

      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Delete document error:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  return createServer(app);
}



