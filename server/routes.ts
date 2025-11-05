import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDocumentSchema, insertApiKeySchema, documentTypes } from "@shared/schema";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  BorderStyle,
  convertInchesToTwip,
  Table,
  TableCell,
  TableRow,
  WidthType,
  VerticalAlign,
  ShadingType
} from "docx";

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
  try {
    const lines = content.split('\n');
    const children: any[] = [];
    const currentDate = new Date().toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // === COVER PAGE ===
    // Logo/Brand area (could be replaced with actual image)
    children.push(new Paragraph({
      children: [new TextRun({
        text: "DocuMente",
        size: 48,
        bold: true,
        color: "2E86AB",
        font: "Calibri"
      })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 1440, after: 720 },
    }));

    // Horizontal line
    children.push(new Paragraph({
      border: {
        bottom: {
          color: "2E86AB",
          space: 1,
          style: BorderStyle.SINGLE,
          size: 20,
        },
      },
      spacing: { after: 1440 },
    }));

    // Document Title
    children.push(new Paragraph({
      children: [new TextRun({
        text: title,
        size: 40,
        bold: true,
        color: "1F4E79",
        font: "Calibri"
      })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 720 },
    }));

    // Subtitle/Date info
    children.push(new Paragraph({
      children: [new TextRun({
        text: `Gerado automaticamente em ${currentDate}`,
        size: 20,
        color: "666666",
        italics: true,
        font: "Calibri"
      })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 2880 }, // Page break equivalent
    }));

    // === CONTENT ===
    let inList = false;
    let listLevel = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        // Add spacing between sections
        children.push(new Paragraph({
          text: "",
          spacing: { after: 200 },
        }));
        continue;
      }

      // Main document type header (with emoji)
      if (trimmedLine.match(/^[📄📘🧩🗓️🚀🎯⚙️🧪📡]/)) {
        children.push(new Paragraph({
          children: [new TextRun({
            text: trimmedLine,
            size: 36,
            bold: true,
            color: "2E86AB",
            font: "Calibri"
          })],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 480, after: 240 },
          border: {
            bottom: {
              color: "2E86AB",
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6,
            },
          },
        }));
        inList = false;
      }
      // H2 (##)
      else if (trimmedLine.startsWith('##')) {
        const text = trimmedLine.replace(/^##\s*/, '');
        children.push(new Paragraph({
          children: [new TextRun({
            text: text,
            size: 28,
            bold: true,
            color: "1F4E79",
            font: "Calibri"
          })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 360, after: 180 },
        }));
        inList = false;
      }
      // H3 (#)
      else if (trimmedLine.startsWith('#')) {
        const text = trimmedLine.replace(/^#\s*/, '');
        children.push(new Paragraph({
          children: [new TextRun({
            text: text,
            size: 24,
            bold: true,
            color: "404040",
            font: "Calibri"
          })],
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 240, after: 120 },
        }));
        inList = false;
      }
      // Bullet points
      else if (trimmedLine.startsWith('-')) {
        const text = trimmedLine.substring(1).trim();
        // Check indent level
        const indent = line.search(/\S/);
        const level = Math.floor(indent / 2);

        children.push(new Paragraph({
          children: [new TextRun({
            text: text,
            size: 22,
            color: "333333",
            font: "Calibri"
          })],
          bullet: { level: Math.min(level, 4) },
          spacing: { after: 100 },
        }));
        inList = true;
      }
      // Bold text (**text**)
      else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        const text = trimmedLine.replace(/\*\*/g, '');
        children.push(new Paragraph({
          children: [new TextRun({
            text: text,
            size: 24,
            bold: true,
            color: "1F4E79",
            font: "Calibri"
          })],
          spacing: { before: 180, after: 120 },
        }));
        inList = false;
      }
      // Regular paragraph
      else {
        // Parse inline bold (**text**)
        const parts = trimmedLine.split(/(\*\*[^*]+\*\*)/g);
        const textRuns: TextRun[] = parts
          .filter(part => part.length > 0)
          .map(part => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return new TextRun({
                text: part.replace(/\*\*/g, ''),
                bold: true,
                size: 22,
                color: "1F4E79",
                font: "Calibri"
              });
            }
            return new TextRun({
              text: part,
              size: 22,
              color: "333333",
              font: "Calibri"
            });
          });

        children.push(new Paragraph({
          children: textRuns.length > 0 ? textRuns : [new TextRun({
            text: trimmedLine,
            size: 22,
            color: "333333",
            font: "Calibri"
          })],
          spacing: { after: inList ? 100 : 180 },
          alignment: AlignmentType.JUSTIFIED,
        }));
        inList = false;
      }
    }

    // Footer spacing
    children.push(new Paragraph({
      text: "",
      spacing: { before: 480 },
    }));

    // === DOCUMENT PROPERTIES ===
    const doc = new Document({
      creator: "DocuMente",
      description: "Documento gerado automaticamente",
      title: title,

      sections: [{
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "DocuMente",
                    size: 16,
                    color: "666666",
                    font: "Calibri"
                  }),
                ],
                alignment: AlignmentType.RIGHT,
                border: {
                  bottom: {
                    color: "CCCCCC",
                    space: 1,
                    style: BorderStyle.SINGLE,
                    size: 6,
                  },
                },
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${title} • `,
                    size: 16,
                    color: "666666",
                    font: "Calibri"
                  }),
                  new TextRun({
                    text: "Página ",
                    size: 16,
                    color: "666666",
                    font: "Calibri"
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: "666666",
                    font: "Calibri"
                  }),
                ],
                alignment: AlignmentType.CENTER,
                border: {
                  top: {
                    color: "CCCCCC",
                    space: 1,
                    style: BorderStyle.SINGLE,
                    size: 6,
                  },
                },
              }),
            ],
          }),
        },
        children: children,
      }],
    });

    const buffer = await Packer.toBuffer(doc);

    if (!buffer || buffer.length === 0) {
      throw new Error("Failed to generate document buffer");
    }

    return buffer;
  } catch (error) {
    console.error("Error creating Word document:", error);
    throw new Error(`Failed to create Word document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Test API connection (uses server-side API key)
  app.post("/api/test-connection", async (req, res) => {
    try {
      const apiKey = process.env.MISTRAL_API_KEY;

      if (!apiKey) {
        return res.status(400).json({ message: "API key is not configured on the server. Please contact the administrator." });
      }

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

  // Get active API key (returns status, not the actual key)
  app.get("/api/api-keys/active", async (req, res) => {
    try {
      const apiKey = process.env.MISTRAL_API_KEY;
      if (apiKey) {
        // Return masked key for security
        const maskedKey = apiKey.substring(0, 8) + "..." + apiKey.substring(apiKey.length - 4);
        res.json({
          configured: true,
          mistralKey: maskedKey
        });
      } else {
        res.json({
          configured: false,
          mistralKey: null
        });
      }
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

      const apiKey = process.env.MISTRAL_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ message: "API key is not configured on the server. Please contact the administrator." });
      }

      const template = documentTemplates[type as keyof typeof documentTemplates];
      if (!template) {
        return res.status(400).json({ message: "Invalid document type" });
      }

      const content = await callMistralAPI(template, demand, apiKey);

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

      const apiKey = process.env.MISTRAL_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ message: "API key is not configured on the server. Please contact the administrator." });
      }

      const template = documentTemplates[type as keyof typeof documentTemplates];
      if (!template) {
        return res.status(400).json({ message: "Invalid document type" });
      }

      const content = await callMistralAPI(template, demand, apiKey);
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

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      const document = await storage.getDocument(id);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const wordBuffer = await createWordDocument(document.title, document.content);

      if (!wordBuffer || wordBuffer.length === 0) {
        return res.status(500).json({ message: "Failed to generate document file" });
      }

      // Sanitize filename to remove invalid characters
      const safeFilename = document.title.replace(/[^a-zA-Z0-9\s\-_áéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ]/g, '_');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.docx"`);
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

  // Generate AI prompt from document
  app.get("/api/documents/:id/generate-prompt", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      const document = await storage.getDocument(id);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Extract document type label
      const typeLabel = documentTypes.find(dt => dt.value === document.type)?.label || document.type;

      // Extract key sections from content
      const lines = document.content.split('\n').filter(line => line.trim());
      const sections: string[] = [];
      const keywords: string[] = [];

      lines.forEach(line => {
        const trimmed = line.trim();
        // Extract section headers (lines starting with emojis or #)
        if (trimmed.match(/^[📄📘🧩🗓️🚀🎯⚙️🧪📡#]/)) {
          sections.push(trimmed.replace(/^#+\s*/, ''));
        }
      });

      // Generate the AI prompt
      const prompt = `Contexto: Este é um [${typeLabel}] criado no Documente, intitulado "${document.title}".

Objetivo: Use as informações abaixo para análise, resumo ou geração de conteúdo baseado neste documento.

────────────────────────────────────────────

📋 Dados do Documento:

Título: ${document.title}
Tipo: ${typeLabel}
Data de Criação: ${new Date(document.createdAt).toLocaleDateString('pt-BR')}

Demanda Original:
${document.originalDemand}

Seções Principais:
${sections.slice(0, 5).map((s, i) => `${i + 1}. ${s}`).join('\n')}

────────────────────────────────────────────

📝 Conteúdo Completo:
${document.content}

────────────────────────────────────────────

💡 Instruções para a IA:
1. Analise o documento acima e identifique os pontos-chave
2. Resuma as principais ideias em tópicos claros
3. Identifique ações, recomendações ou próximos passos mencionados
4. Formate a resposta em markdown com títulos e listas

────────────────────────────────────────────

✨ Gerado automaticamente pelo Documente
`;

      res.json({ prompt });

    } catch (error) {
      console.error("Generate prompt error:", error);
      res.status(500).json({ message: "Failed to generate AI prompt" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
