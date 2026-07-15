# Design: Routes Split

## Overview

Desmembramento incremental de `server/routes.ts` (3.467 linhas) em módulos por domínio. A estratégia é extrair de dentro para fora: primeiro os dados estáticos (templates, schemas), depois os serviços (IA, DOCX, PDF), depois os handlers de rota. Cada camada só é movida após a anterior estar estável e com build verde.

## Architecture

### Estado atual
```
server/routes.ts  ← 3.467 linhas — tudo aqui
```

### Estado alvo
```
server/
  prompts/
    prd.ts          ← template string PRD
    epic.ts
    userstories.ts
    roadmap.ts
    releasenote.ts
    pitch.ts
    techspec.ts
    testplan.ts
    apidoc.ts
  schemas/
    prd.ts          ← prdJsonSchema + renderPrdMarkdown
    userstories.ts
    apidoc.ts
    techspec.ts
  services/
    ai-generation.ts ← callOpenRouterAPI + verifyAndRepairGeneratedDocument + getOpenRouterApiKey
    docx.ts          ← createWordDocument + imports docx library
    pdf.ts           ← Puppeteer block + convertMarkdownToHtml (importa pdfTemplate.ts)
  routes/
    documents.ts     ← CRUD handlers
    generation.ts    ← /generate-document, /preview-document, /external/generate
    ai.ts            ← já existe: /api/ai/*
    documents-extra.ts ← já existe: share, versions, push
    upload.ts        ← já existe
  routes.ts          ← orquestrador < 150 linhas
```

## Components and Interfaces

### Camada 1 — Prompts (`server/prompts/{type}.ts`)

Cada arquivo exporta uma única constante:

```typescript
// server/prompts/prd.ts
export const prdTemplate = `Você é um especialista...`;
```

`routes.ts` atual substitui:
```typescript
const documentTemplates = {
  prd: prdTemplate,
  epic: epicTemplate,
  // ...
}
```

### Camada 2 — Schemas (`server/schemas/{type}.ts`)

```typescript
// server/schemas/prd.ts
import { z } from "zod";
export const prdJsonSchema = z.object({ ... });
export function renderPrdMarkdown(data: z.infer<typeof prdJsonSchema>): string { ... }
```

### Camada 3 — Serviços

**`server/services/ai-generation.ts`**
```typescript
export function getOpenRouterApiKey(): string | undefined { ... }
export async function callOpenRouterAPI(...): Promise<string> { ... }
export async function verifyAndRepairGeneratedDocument(...): Promise<string> { ... }
```

**`server/services/docx.ts`**
```typescript
import { Document, Packer, ... } from "docx";
export async function createWordDocument(title: string, content: string): Promise<Buffer> { ... }
```

**`server/services/pdf.ts`**
```typescript
import puppeteer from "puppeteer";
import { convertMarkdownToHtml } from "./pdfHelper"; // extrai de routes.ts
export async function generatePdf(title: string, content: string, theme: string): Promise<Buffer> {
  const browser = await puppeteer.launch({ ... });
  try {
    // ... lógica existente
  } finally {
    await browser.close(); // cleanup já implementado na wave-1
  }
}
```

### Camada 4 — Rotas

**`server/routes/documents.ts`** — Router Express com os 5 handlers CRUD.

**`server/routes/generation.ts`** — Router Express com generate, preview, external/generate.

### Orquestrador final (`server/routes.ts` < 150 linhas)

```typescript
import { type Express } from "express";
import { createServer } from "http";
import uploadRouter from "./routes/upload";
import aiRouter from "./routes/ai";
import documentsExtraRouter from "./routes/documents-extra";
import documentsRouter from "./routes/documents";
import generationRouter from "./routes/generation";

export async function registerRoutes(app: Express) {
  app.use("/api", uploadRouter);
  app.use("/api", aiRouter);
  app.use("/api", documentsExtraRouter);
  app.use("/api", documentsRouter);
  app.use("/api", generationRouter);
  return createServer(app);
}
```

## Data Models

Nenhuma mudança de banco, schema ou API pública. Refatoração é puramente estrutural.

## Error Handling

A estratégia de erro de cada handler permanece idêntica — `try/catch` com `ZodError → 400`, erros genéricos → 500. Nenhum comportamento de erro é alterado.

**Risco principal:** imports circulares. Mitigação: `ai-generation.ts` não importa nada de `routes/`; schemas não importam serviços; prompts não importam nada do projeto. A dependência flui em um único sentido: `routes → services → schemas/prompts`.

## Testing Strategy

### Pré-condição obrigatória
Criar `tests/unit/routes-smoke.test.ts` antes do primeiro commit de extração. Cobrir com mocks:
- `POST /api/generate-document`
- `GET /api/documents`
- `POST /api/documents`
- `PUT /api/documents/:id`
- `DELETE /api/documents/:id`
- `POST /api/preview-document`

### Validação por commit
Após cada extração:
```bash
npm run check      # zero erros TypeScript novos
npm run build      # build completo
npm test           # suíte existente 100%
grep -r "getOpenRouterApiKey" server/ | wc -l  # deve ser apenas importadores
```

### Validação final
```bash
wc -l server/routes.ts  # < 150
```

### Sequência de commits

| Commit | Extração | Verificação |
|--------|----------|-------------|
| 0 | Smoke tests | tsc + build |
| 1 | 9 prompts | tsc + build + smoke |
| 2 | 4 schemas + renderizadores | tsc + build + smoke |
| 3 | ai-generation.ts | tsc + build + grep getOpenRouterApiKey |
| 4 | docx.ts + pdf.ts | tsc + build + smoke |
| 5 | routes/documents.ts | tsc + build + smoke CRUD |
| 6 | routes/generation.ts | tsc + build + smoke geração |
| 7 | routes.ts < 150 linhas | tsc + build + wc -l + suíte completa |
