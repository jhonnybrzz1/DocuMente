# Wave 4 — Autenticação nas Rotas CRUD

## Contexto

Todas as rotas `/api/documents`, `/api/api-keys` e `/api/generate-document` estão atualmente públicas. Qualquer pessoa com acesso à rede pode criar, ler, modificar e deletar todos os documentos e consumir créditos de IA. O projeto roda no Replit free tier, que expõe uma URL pública.

A decisão tomada é usar **API Key por header** (`X-App-Key`), consistente com o modelo já existente em `/api/external/generate`. Não será usada session/cookie nem JWT — o projeto é de uso pessoal, sem multi-usuário.

As dependências `passport`, `passport-local`, `express-session`, `connect-pg-simple` e `memorystore` nunca foram configuradas e serão removidas como parte desta wave (Issue 6 + Issue 13 parcial).

---

## Requirements

### REQ-1: Middleware de autenticação por API Key
**User story**: Como dono da aplicação, quero que todas as rotas protegidas exijam um header `X-App-Key` válido, para que nenhum acesso externo não autorizado consiga ler ou modificar meus documentos.

**Critérios de aceite**:
- [ ] Existe um middleware `requireAppKey` em `server/middlewares/auth.ts`
- [ ] O middleware lê a chave da variável de ambiente `APP_SECRET_KEY`
- [ ] Se `APP_SECRET_KEY` não estiver definida no ambiente, o servidor **recusa iniciar** com erro claro no log (não silencia nem usa fallback)
- [ ] Requests sem o header `X-App-Key` recebem `401 Unauthorized` com body `{ "message": "Autenticação necessária." }`
- [ ] Requests com chave inválida recebem `401` com body `{ "message": "Chave de API inválida." }`
- [ ] O middleware **nunca loga** o valor da chave recebida

### REQ-2: Rotas protegidas
**User story**: Como dono da aplicação, quero que todas as rotas de dados fiquem por trás do middleware, sem precisar decorar cada handler individualmente.

**Critérios de aceite**:
- [ ] O middleware é aplicado via `app.use("/api/", requireAppKey)` **antes** do registro das rotas
- [ ] As seguintes rotas ficam **isentas** (sem auth):
  - `GET /api/share/:token` — link público de documento compartilhado
  - `POST /api/external/generate` — já tem sua própria autenticação por `EXTERNAL_API_KEY`
  - `OPTIONS *` — preflight CORS não deve ser bloqueado

### REQ-3: Frontend envia a chave automaticamente
**User story**: Como usuário do app, não quero ter que digitar a chave em cada ação — o app deve enviá-la automaticamente depois que eu configurar uma vez.

**Critérios de aceite**:
- [ ] O frontend armazena `APP_SECRET_KEY` em `localStorage` com chave `docu_app_key`
- [ ] `apiRequest()` em `client/src/lib/queryClient.ts` inclui o header `X-App-Key` em todos os requests
- [ ] O `getQueryFn` também inclui o header `X-App-Key`
- [ ] Existe um componente/tela de configuração onde o usuário insere a chave uma única vez
- [ ] Respostas `401` do servidor disparam um toast "Sessão expirada — configure sua chave de acesso" e redirecionam para a tela de configuração

### REQ-4: Remoção das dependências de session nunca usadas
**User story**: Como mantenedor, quero remover pacotes mortos do `package.json` para reduzir surface de ataque e tamanho da instalação.

**Critérios de aceite**:
- [ ] Removidos do `package.json` (e confirmados como não importados em nenhum arquivo):
  - `passport`
  - `passport-local`
  - `express-session`
  - `connect-pg-simple`
  - `memorystore`
- [ ] Removidos também os `@types` correspondentes em `devDependencies`
- [ ] `npm install` após remoção não produz erros
- [ ] Build (`vite build && esbuild ...`) passa sem erros após remoção

### REQ-5: Documentação da variável de ambiente
**Critérios de aceite**:
- [ ] `.env.example` inclui `APP_SECRET_KEY=` com comentário explicando como gerar (ex: `openssl rand -hex 32`)
- [ ] `AUDITORIA_PENDENTES.md` marca Issue 6 como resolvida
