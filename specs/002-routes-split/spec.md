# Feature Specification: Routes Split (God Object)

**Feature Branch**: `002-routes-split`

**Created**: 2026-07-14

**Status**: Ready

**Origin**: Crítico 4 da Auditoria Wave 1 — `server/routes.ts` tem 3.467 linhas contendo templates de documentos, schemas Zod, renderizadores markdown, orquestração de IA e 15+ handlers de rota em um único arquivo.

## User Scenarios & Testing

### User Story 1 — Templates isolados em arquivos próprios (Priority: P1)

Como desenvolvedor, quando quero editar o template de PRD, quero encontrá-lo em `server/prompts/prd.ts` e não varrer 3.500 linhas, para reduzir o tempo de contexto e o risco de acidente.

**Acceptance Scenarios**:

1. **Given** o arquivo `server/prompts/prd.ts`, **When** importado, **Then** exporta a string de template completa usada na geração.
2. **Given** qualquer dos 9 tipos de documento, **When** o handler de geração executa, **Then** o template é importado do módulo correto e o resultado é idêntico ao pré-refatoração.

---

### User Story 2 — Serviços de IA extraídos (Priority: P1)

Como desenvolvedor, quando quero corrigir a lógica de verificação de fidelidade do documento gerado, quero encontrá-la em `server/services/ai-generation.ts`, para editar sem risco de afetar handlers de rota.

**Acceptance Scenarios**:

1. **Given** `server/services/ai-generation.ts`, **When** importado, **Then** exporta `callOpenRouterAPI` e `verifyAndRepairGeneratedDocument` com a mesma assinatura atual.
2. **Given** `server/services/docx.ts`, **When** importado, **Then** exporta `createWordDocument` com a mesma assinatura atual.
3. **Given** `server/services/pdf.ts`, **When** importado, **Then** exporta a função de geração PDF com Puppeteer e `try/finally` já existente.

---

### User Story 3 — Rotas em arquivos por domínio (Priority: P1)

Como desenvolvedor, quando preciso adicionar um campo ao retorno de `GET /api/documents`, quero editar apenas `server/routes/documents.ts`, para não abrir um arquivo de 3.500 linhas.

**Acceptance Scenarios**:

1. **Given** `server/routes/documents.ts`, **When** registrado, **Then** expõe `GET /api/documents`, `POST /api/documents`, `GET /api/documents/:id`, `PUT /api/documents/:id`, `DELETE /api/documents/:id`.
2. **Given** `server/routes/generation.ts`, **When** registrado, **Then** expõe `POST /api/generate-document`, `POST /api/preview-document`, `POST /api/external/generate`.
3. **Given** `server/routes.ts` após refatoração, **When** carregado, **Then** funciona como orquestrador simples de `< 100 linhas` que monta os routers.

---

### Edge Cases

- Nenhuma rota pode ser perdida durante a migração.
- Todos os imports circulares devem ser verificados após extração.
- `getOpenRouterApiKey()` duplicada deve ser consolidada em um único local.
- Os schemas Zod inline (`prdJsonSchema`, `userStoriesJsonSchema`, etc.) devem ir para `server/schemas/`.
- O `OPENROUTER_MODEL` e `OPENROUTER_API_URL` devem vir de `server/config.ts` — não de magic strings inline.

## Requirements

### Functional Requirements

- **FR-001**: Os 9 templates de documento MUST ser extraídos para `server/prompts/{type}.ts`, cada um exportando uma string.
- **FR-002**: `callOpenRouterAPI` e `verifyAndRepairGeneratedDocument` MUST ser movidos para `server/services/ai-generation.ts`.
- **FR-003**: `createWordDocument` MUST ser movido para `server/services/docx.ts`.
- **FR-004**: A geração de PDF (Puppeteer) MUST ser movida para `server/services/pdf.ts`.
- **FR-005**: Os 4 schemas Zod de geração estruturada MUST ir para `server/schemas/{type}.ts`.
- **FR-006**: Os 4 renderizadores markdown (`renderPrdMarkdown`, etc.) MUST ir junto com seus schemas.
- **FR-007**: As rotas CRUD de documentos MUST ir para `server/routes/documents.ts`.
- **FR-008**: As rotas de geração MUST ir para `server/routes/generation.ts`.
- **FR-009**: `server/routes.ts` resultante MUST ter menos de 150 linhas e funcionar como orquestrador de imports.
- **FR-010**: A função duplicada `getOpenRouterApiKey` MUST ter exatamente uma definição.
- **FR-011**: ZERO regressão funcional — todos os endpoints existentes MUST continuar respondendo identicamente.
- **FR-012**: A migração MUST ser incremental: cada extração em commit separado com testes passando.

### Key Entities

```
server/
  prompts/           ← 9 arquivos de template (prd.ts, epic.ts, ...)
  schemas/           ← 4 schemas Zod + renderizadores
  services/
    ai-generation.ts ← callOpenRouterAPI + verifyAndRepair
    docx.ts          ← createWordDocument
    pdf.ts           ← Puppeteer PDF
  routes/
    documents.ts     ← CRUD /api/documents
    generation.ts    ← /api/generate-document, /api/preview-document
  routes.ts          ← orquestrador < 150 linhas
```

## Success Criteria

- **SC-001**: `server/routes.ts` com menos de 150 linhas após refatoração.
- **SC-002**: Nenhum endpoint existente retorna status diferente do pré-refatoração (smoke test manual ou automatizado).
- **SC-003**: `npm run check` (tsc) passa sem erros novos.
- **SC-004**: Build (`vite build + esbuild`) passa.
- **SC-005**: Suíte de testes unitários continua 100% passando.
- **SC-006**: `getOpenRouterApiKey` aparece em exatamente 1 arquivo.

## Assumptions

- A refatoração é puramente estrutural — sem mudança de comportamento.
- Testes de smoke nas rotas principais devem existir antes do início (pré-condição).
- Migração incremental: cada domínio em commit separado, nunca big-bang.
- O arquivo `pdfTemplate.ts` existente permanece; `pdf.ts` o importa.
