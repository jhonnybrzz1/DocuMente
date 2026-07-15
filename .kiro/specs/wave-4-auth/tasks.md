# Tasks: Auth Middleware

- [ ] 1. Criar middleware e validação de boot
  - Criar `server/middlewares/auth.ts` com função `requireAppKey`
  - Implementar bypass para `/share/` e `/external/generate`
  - Retornar 401 com mensagens em pt-BR para header ausente e inválido
  - Nunca logar o valor da chave recebida
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3_

- [ ] 1.1 Adicionar validação de boot em `server/index.ts`
  - Verificar `APP_SECRET_KEY` antes de `registerRoutes(app)`
  - Se ausente ou vazia: `console.error(...)` + `process.exit(1)`
  - Registrar `app.use("/api/", requireAppKey)` após validação
  - _Requirements: 1.1, 1.2_

- [ ] 2. Criar testes unitários do middleware
  - Criar `tests/unit/auth-middleware.test.ts`
  - Cobrir: sem header, header incorreto, header correto, rotas isentas, chave vazia
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2_

- [ ] 3. Atualizar frontend para enviar a chave automaticamente
  - Adicionar `"X-App-Key": localStorage.getItem("docu_app_key") ?? ""` em `apiRequest()` em `client/src/lib/queryClient.ts`
  - Adicionar o mesmo header em `getQueryFn`
  - _Requirements: 4.1_

- [ ] 3.1 Tratar respostas 401 no frontend
  - Em `throwIfResNotOk`: detectar status 401 e disparar toast "Sessão expirada — configure sua chave de acesso"
  - _Requirements: 4.2_

- [ ] 4. Remover dependências de session não utilizadas
  - Confirmar zero imports: `grep -r "passport\|express-session\|connect-pg\|memorystore" server/ client/`
  - Remover de `dependencies`: `passport`, `passport-local`, `express-session`, `connect-pg-simple`, `memorystore`
  - Remover de `devDependencies`: `@types/passport`, `@types/passport-local`, `@types/express-session`, `@types/connect-pg-simple`
  - Executar `npm install` e verificar sucesso
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 5. Documentar variável de ambiente e validar build
  - Adicionar `APP_SECRET_KEY=` com comentário `# Gere com: openssl rand -hex 32` em `.env.example`
  - Executar `npm run check` (tsc) — zero erros novos
  - Executar `npm run build` — sucesso
  - Executar suíte de testes — 100% passando
  - _Requirements: 6.1_
