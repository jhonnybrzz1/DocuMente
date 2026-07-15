# Tasks: Routes Split

- [ ] 1. Criar smoke tests antes de qualquer extração
  - Criar `tests/unit/routes-smoke.test.ts` com mocks para os 6 endpoints principais
  - Confirmar que todos passam no estado atual do repositório
  - Este arquivo é a rede de segurança de todos os commits seguintes
  - _Requirements: 6.4_

- [ ] 2. Extrair templates de prompt (Commit 1)
  - Criar `server/prompts/` com um arquivo por tipo: `prd.ts`, `epic.ts`, `userstories.ts`, `roadmap.ts`, `releasenote.ts`, `pitch.ts`, `techspec.ts`, `testplan.ts`, `apidoc.ts`
  - Cada arquivo: `export const {type}Template = \`...\``
  - Substituir `documentTemplates` em `routes.ts` por imports dos 9 módulos
  - Verificar: `npm run check` + `npm run build` + smoke tests verdes
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 3. Extrair schemas Zod e renderizadores (Commit 2)
  - Criar `server/schemas/prd.ts`, `server/schemas/userstories.ts`, `server/schemas/apidoc.ts`, `server/schemas/techspec.ts`
  - Cada arquivo exporta o schema Zod + a função `render*Markdown` correspondente
  - Substituir definições inline em `routes.ts` por imports
  - Verificar: `npm run check` + `npm run build` + smoke tests verdes
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 4. Extrair serviço de IA (Commit 3)
  - Criar `server/services/ai-generation.ts`
  - Mover: `callOpenRouterAPI`, `verifyAndRepairGeneratedDocument`, `getOpenRouterApiKey`
  - Consolidar: confirmar que `getOpenRouterApiKey` existe em exatamente 1 arquivo após extração
  - Substituir chamadas em `routes.ts` por imports
  - Verificar: `npm run check` + `grep -r "getOpenRouterApiKey" server/ | wc -l` (só importadores)
  - _Requirements: 3.1, 3.4_

- [ ] 5. Extrair serviços DOCX e PDF (Commit 4)
  - Criar `server/services/docx.ts` com `createWordDocument` e todos os imports do pacote `docx`
  - Criar `server/services/pdf.ts` com bloco Puppeteer + `convertMarkdownToHtml` (mantendo `try/finally`)
  - Substituir blocos inline em `routes.ts` por imports
  - Verificar: `npm run check` + `npm run build` + smoke tests verdes
  - _Requirements: 3.2, 3.3_

- [ ] 6. Extrair rotas CRUD de documentos (Commit 5)
  - Criar `server/routes/documents.ts` como Express Router
  - Mover handlers: `GET /api/documents`, `POST /api/documents`, `GET /api/documents/:id`, `PUT /api/documents/:id`, `DELETE /api/documents/:id`
  - Registrar em `routes.ts` via `app.use("/api", documentsRouter)`
  - Verificar: `npm run check` + `npm run build` + smoke tests CRUD verdes
  - _Requirements: 4.1, 4.3_

- [ ] 7. Extrair rotas de geração (Commit 6)
  - Criar `server/routes/generation.ts` como Express Router
  - Mover handlers: `POST /api/generate-document`, `POST /api/preview-document`, `POST /api/external/generate`
  - Registrar em `routes.ts` via `app.use("/api", generationRouter)`
  - Verificar: `npm run check` + `npm run build` + smoke tests de geração verdes
  - _Requirements: 4.2, 4.3_

- [ ] 8. Reduzir routes.ts para orquestrador final (Commit 7)
  - Remover todo código de negócio restante em `routes.ts`
  - Manter apenas imports, registros de routers e `registerRoutes`
  - Verificar: `wc -l server/routes.ts` retorna valor menor que 150
  - Executar suíte completa: `npm run check` + `npm run build` + `npm test`
  - _Requirements: 5.1, 5.2, 6.1, 6.2, 6.3_
