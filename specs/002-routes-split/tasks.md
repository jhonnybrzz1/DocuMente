# Tasks: Routes Split

## Pré-condição obrigatória

- [ ] **T000** Criar smoke tests mínimos antes de qualquer extração
  - `tests/unit/routes-smoke.test.ts` cobrindo: POST `/api/generate-document` (mock), GET `/api/documents`, POST `/api/documents`, PUT `/api/documents/:id`, DELETE `/api/documents/:id`, POST `/api/preview-document`
  - Estes testes são a rede de segurança da migração
  - _Requirements: FR-011, FR-012_

## Phase 1 — Prompts (templates)

- [ ] **T001 [FR-001]** Criar `server/prompts/` e extrair os 9 templates
  - Um arquivo por tipo: `prd.ts`, `epic.ts`, `userstories.ts`, `roadmap.ts`, `releasenote.ts`, `pitch.ts`, `techspec.ts`, `testplan.ts`, `apidoc.ts`
  - Cada arquivo: `export const template = \`...\``
  - Substituir em `routes.ts`: `const documentTemplates = { prd: (await import("./prompts/prd")).template, ... }`
  - Verificar: `wc -l server/routes.ts` diminuiu ~1.140 linhas
  - _Requirements: FR-001_

- [ ] **T002** Commit 1: build verde + smoke tests passando

## Phase 2 — Schemas e renderizadores

- [ ] **T003 [FR-005, FR-006]** Criar `server/schemas/` e extrair 4 schemas Zod
  - `server/schemas/prd.ts` → exporta `prdJsonSchema` + `renderPrdMarkdown`
  - `server/schemas/userstories.ts` → exporta `userStoriesJsonSchema` + `renderUserStoriesMarkdown`
  - `server/schemas/apidoc.ts` → exporta `apiDocJsonSchema` + `renderApiDocMarkdown`
  - `server/schemas/techspec.ts` → exporta `techSpecJsonSchema` + `renderTechSpecMarkdown`
  - Substituir imports em `routes.ts`
  - _Requirements: FR-005, FR-006_

- [ ] **T004** Commit 2: build verde + smoke tests passando

## Phase 3 — Serviço de IA

- [ ] **T005 [FR-002, FR-010]** Criar `server/services/ai-generation.ts`
  - Mover: `callOpenRouterAPI` (~470 linhas), `verifyAndRepairGeneratedDocument` (~130 linhas)
  - Consolidar: encontrar e remover a definição duplicada de `getOpenRouterApiKey` — manter apenas em `ai-generation.ts`
  - Exportar: `callOpenRouterAPI`, `verifyAndRepairGeneratedDocument`, `getOpenRouterApiKey`
  - Atualizar imports em `routes.ts`
  - _Requirements: FR-002, FR-010_

- [ ] **T006** Commit 3: build verde + `grep -r "getOpenRouterApiKey" server/ | wc -l` == arquivos importadores apenas

## Phase 4 — Serviços Word e PDF

- [ ] **T007 [FR-003]** Criar `server/services/docx.ts`
  - Mover `createWordDocument` (~300 linhas) com todos os imports de `docx`
  - Exportar `createWordDocument`
  - _Requirements: FR-003_

- [ ] **T008 [FR-004]** Criar `server/services/pdf.ts`
  - Mover bloco Puppeteer + `convertMarkdownToHtml` para `server/services/pdf.ts`
  - Manter `try/finally` de cleanup já existente
  - Importar `pdfTemplate.ts` existente
  - _Requirements: FR-004_

- [ ] **T009** Commit 4: build verde + smoke tests passando

## Phase 5 — Rotas de documentos

- [ ] **T010 [FR-007]** Criar `server/routes/documents.ts`
  - Mover handlers: `GET /api/documents`, `POST /api/documents`, `GET /api/documents/:id`, `PUT /api/documents/:id`, `DELETE /api/documents/:id`
  - Exportar `Router` Express
  - _Requirements: FR-007_

- [ ] **T011** Commit 5: build verde + smoke tests de CRUD passando

## Phase 6 — Rotas de geração

- [ ] **T012 [FR-008]** Criar `server/routes/generation.ts`
  - Mover handlers: `POST /api/generate-document`, `POST /api/preview-document`, `POST /api/external/generate`
  - Exportar `Router` Express
  - _Requirements: FR-008_

- [ ] **T013** Commit 6: build verde + smoke tests de geração passando

## Phase 7 — Limpeza final

- [ ] **T014 [FR-009]** Reduzir `server/routes.ts` para orquestrador puro
  - Importar e montar: `documentsRouter`, `generationRouter`, `aiRouter`, `documentsExtraRouter`, `uploadRouter`
  - Verificar: `wc -l server/routes.ts` ≤ 150
  - _Requirements: FR-009_

- [ ] **T015** Commit 7 final: `npm run check` + `npm run build` + suíte completa de testes
  - Verificar: zero erros TypeScript novos
  - Verificar: build bem-sucedido
  - Verificar: 100% dos testes passando
  - Verificar: `wc -l server/routes.ts` ≤ 150

## Dependencies

T000 → T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009 → T010 → T011 → T012 → T013 → T014 → T015

## Rollback

`git revert` em qualquer commit incremental. A estrutura original é restaurada passo a passo sem afetar o banco de dados.
