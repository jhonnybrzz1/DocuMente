# Requirements: Routes Split

## Introduction

`server/routes.ts` tem 3.467 linhas e concentra nove templates de prompt (≈1.140 linhas), quatro schemas Zod com renderizadores, toda a orquestração de chamadas à IA, geração de DOCX, geração de PDF via Puppeteer e quinze ou mais handlers de rota. Qualquer alteração em um template pode quebrar um handler; qualquer bug na geração Word pode corromper a lógica de roteamento. O arquivo é intrinsecamente intetável de forma isolada. Esta spec define a extração incremental desse monolito em módulos por domínio, sem alterar comportamento externo.

## Requirements

### Requirement 1 — Templates de prompt isolados

**User Story:** As a desenvolvedor, I want each document type prompt to live in its own file under `server/prompts/`, so that I can edit a PRD template without opening a 3.500-line file.

#### Acceptance Criteria

1. WHEN `server/prompts/prd.ts` is imported THEN the system SHALL export the complete prompt string used by the generation handler.
2. WHEN any of the nine document types is generated THEN the system SHALL load its template from the corresponding `server/prompts/{type}.ts` module.
3. IF a prompts file is missing THEN the TypeScript compiler SHALL report an error before runtime.

---

### Requirement 2 — Schemas Zod e renderizadores isolados

**User Story:** As a desenvolvedor, I want structured generation schemas and their markdown renderers co-located in `server/schemas/`, so that adding a new output field does not require searching a monolithic file.

#### Acceptance Criteria

1. WHEN `server/schemas/prd.ts` is imported THEN the system SHALL export `prdJsonSchema` and `renderPrdMarkdown` with identical signatures to the current inline definitions.
2. WHEN `server/schemas/userstories.ts` is imported THEN the system SHALL export `userStoriesJsonSchema` and `renderUserStoriesMarkdown`.
3. WHEN `server/schemas/apidoc.ts` is imported THEN the system SHALL export `apiDocJsonSchema` and `renderApiDocMarkdown`.
4. WHEN `server/schemas/techspec.ts` is imported THEN the system SHALL export `techSpecJsonSchema` and `renderTechSpecMarkdown`.

---

### Requirement 3 — Serviços de geração isolados

**User Story:** As a desenvolvedor, I want AI orchestration, DOCX generation, and PDF generation in separate service files, so that a bug fix in the Word exporter cannot affect route handlers.

#### Acceptance Criteria

1. WHEN `server/services/ai-generation.ts` is imported THEN the system SHALL export `callOpenRouterAPI`, `verifyAndRepairGeneratedDocument`, and `getOpenRouterApiKey` with identical signatures.
2. WHEN `server/services/docx.ts` is imported THEN the system SHALL export `createWordDocument` with identical signature.
3. WHEN `server/services/pdf.ts` is imported THEN the system SHALL export the PDF generation function including the existing `try/finally` Puppeteer cleanup.
4. IF `getOpenRouterApiKey` is defined in more than one file THEN the TypeScript compiler or a grep assertion SHALL fail.

---

### Requirement 4 — Rotas por domínio

**User Story:** As a desenvolvedor, I want CRUD and generation handlers in separate router files, so that adding a field to `GET /api/documents` requires editing only one focused file.

#### Acceptance Criteria

1. WHEN `server/routes/documents.ts` is registered THEN the system SHALL expose `GET /api/documents`, `POST /api/documents`, `GET /api/documents/:id`, `PUT /api/documents/:id`, and `DELETE /api/documents/:id`.
2. WHEN `server/routes/generation.ts` is registered THEN the system SHALL expose `POST /api/generate-document`, `POST /api/preview-document`, and `POST /api/external/generate`.
3. WHEN any existing endpoint is called after refactoring THEN the system SHALL return the same status code and response shape as before refactoring.

---

### Requirement 5 — Orquestrador enxuto

**User Story:** As a desenvolvedor, I want `server/routes.ts` to be a thin orchestrator under 150 lines, so that onboarding a new contributor takes minutes instead of hours.

#### Acceptance Criteria

1. WHEN `wc -l server/routes.ts` is executed after refactoring THEN the output SHALL be less than 150.
2. WHEN `server/routes.ts` is read THEN it SHALL contain only imports, router registrations, and the exported `registerRoutes` function — no business logic.

---

### Requirement 6 — Zero regressão e migração incremental

**User Story:** As a desenvolvedor, I want each extraction committed separately with a passing build, so that a broken step can be reverted without discarding subsequent work.

#### Acceptance Criteria

1. WHEN each extraction commit is made THEN `npm run check` SHALL pass with zero new TypeScript errors.
2. WHEN each extraction commit is made THEN `npm run build` SHALL complete successfully.
3. WHEN smoke tests are run after each commit THEN all existing routes SHALL return expected responses.
4. IF smoke tests do not exist before extraction begins THEN the developer SHALL create them as the first task.
