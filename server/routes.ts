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
      model: "mistral-large-latest",
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

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    if (trimmedLine.startsWith('📄') || trimmedLine.startsWith('📘') || trimmedLine.startsWith('🧩') || 
        trimmedLine.startsWith('🗓️') || trimmedLine.startsWith('🚀') || trimmedLine.startsWith('🎯') ||
        trimmedLine.startsWith('⚙️') || trimmedLine.startsWith('🧪') || trimmedLine.startsWith('📡')) {
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmedLine, bold: true, size: 32 })],
        heading: HeadingLevel.HEADING_1,
      }));
    } else if (trimmedLine.startsWith('##')) {
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmedLine.replace('##', '').trim(), bold: true, size: 28 })],
        heading: HeadingLevel.HEADING_2,
      }));
    } else if (trimmedLine.startsWith('#')) {
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmedLine.replace('#', '').trim(), bold: true, size: 24 })],
        heading: HeadingLevel.HEADING_3,
      }));
    } else if (trimmedLine.startsWith('-')) {
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmedLine, size: 22 })],
        bullet: { level: 0 },
      }));
    } else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmedLine.replace(/\*\*/g, ''), bold: true, size: 24 })],
      }));
    } else {
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmedLine, size: 22 })],
      }));
    }
  }

  const doc = new Document({
    sections: [{
      children: children,
    }],
  });

  return await Packer.toBuffer(doc);
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Test API connection
  app.post("/api/test-connection", async (req, res) => {
    try {
      const { apiKey } = req.body;
      
      if (!apiKey) {
        return res.status(400).json({ message: "API key is required" });
      }

      const response = await fetch(MISTRAL_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "mistral-large-latest",
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
        return res.status(400).json({ 
          message: `API connection failed: ${response.status} - ${errorText}` 
        });
      }

      res.json({ message: "API connection successful" });
    } catch (error) {
      console.error("API test error:", error);
      res.status(500).json({ message: "Failed to test API connection" });
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
      const apiKey = await storage.getActiveApiKey();
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
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${document.title}.docx"`);
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

  // Get single document
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

  const httpServer = createServer(app);
  return httpServer;
}
