# Tasks: Auth Middleware

## Phase 1 — Middleware de servidor

- [ ] **T001 [FR-001, FR-002]** Criar `server/middlewares/auth.ts`
  - Exportar função `requireAppKey(req, res, next)`
  - Ler chave de `process.env.APP_SECRET_KEY`
  - Retornar 401 `{ message: "Autenticação necessária." }` se header ausente
  - Retornar 401 `{ message: "Chave de API inválida." }` se chave incorreta
  - Chamar `next()` se chave correta
  - _Requirements: FR-002, FR-003, FR-004_

- [ ] **T002 [FR-001]** Adicionar validação na inicialização em `server/index.ts`
  - Antes de `registerRoutes(app)`, verificar `process.env.APP_SECRET_KEY`
  - Se ausente ou vazia: `console.error(...)` + `process.exit(1)`
  - _Requirements: FR-001_

- [ ] **T003 [FR-005, FR-006]** Registrar middleware em `server/index.ts`
  - Adicionar `app.use("/api/", requireAppKey)` antes de `registerRoutes`
  - Adicionar bypass para `OPTIONS` (já tratado antes pelo CORS)
  - Adicionar bypass inline para `/api/share/` e `/api/external/generate`
  - _Requirements: FR-005, FR-006_

- [ ] **T004** Criar `tests/unit/auth-middleware.test.ts`
  - Testar: sem header → 401 "Autenticação necessária."
  - Testar: header incorreto → 401 "Chave inválida."
  - Testar: header correto → `next()` chamado
  - Testar: `APP_SECRET_KEY` vazia → trata como ausente
  - _Requirements: FR-002, FR-003, FR-004_

## Phase 2 — Frontend

- [ ] **T005 [FR-007]** Atualizar `client/src/lib/queryClient.ts`
  - Em `apiRequest()`: adicionar `"X-App-Key": localStorage.getItem("docu_app_key") ?? ""` nos headers
  - Em `getQueryFn`: mesmo header
  - _Requirements: FR-007_

- [ ] **T006 [FR-008]** Tratar 401 no frontend
  - Em `throwIfResNotOk`: se status 401, disparar toast "Sessão expirada — configure sua chave de acesso"
  - Redirecionar para `/` com flag de abertura do modal de configuração
  - _Requirements: FR-008_

## Phase 3 — Limpeza de dependências

- [ ] **T007 [FR-009]** Remover dependências mortas
  - Remover de `dependencies`: `passport`, `passport-local`, `express-session`, `connect-pg-simple`, `memorystore`
  - Remover de `devDependencies`: `@types/passport`, `@types/passport-local`, `@types/express-session`, `@types/connect-pg-simple`
  - Confirmar zero imports desses pacotes: `grep -r "passport\|express-session\|connect-pg\|memorystore" server/ client/`
  - Executar `npm install` e verificar que não há erros
  - _Requirements: FR-009_

## Phase 4 — Documentação e variáveis de ambiente

- [ ] **T008 [FR-010]** Atualizar `.env.example`
  - Adicionar `APP_SECRET_KEY=` com comentário: `# Gere com: openssl rand -hex 32`
  - _Requirements: FR-010_

## Phase 5 — Validação

- [ ] **T009** Executar `npm run check` (tsc) e garantir zero erros novos
- [ ] **T010** Executar `npm run build` e garantir sucesso
- [ ] **T011** Executar suíte de testes unitários e garantir 100% passando
- [ ] **T012** Verificar que nenhum log imprime o valor de `APP_SECRET_KEY`

## Dependencies

T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009/T010/T011/T012

## Rollback

`git revert` no commit do middleware. Nenhuma mudança de banco envolvida. Para restaurar dependências removidas: `npm install passport express-session connect-pg-simple memorystore passport-local`.
