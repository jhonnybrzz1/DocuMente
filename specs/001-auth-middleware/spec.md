# Feature Specification: Auth Middleware

**Feature Branch**: `001-auth-middleware`

**Created**: 2026-07-14

**Status**: Ready

**Origin**: Issue 6 da Auditoria Wave 2 — todas as rotas `/api/documents`, `/api/api-keys` e `/api/generate-document` estão públicas. O DocuMente roda no Replit free tier com URL pública exposta.

## User Scenarios & Testing

### User Story 1 — Proteção das rotas CRUD (Priority: P1)

Como dono da aplicação, quando um request não autorizado tenta acessar `/api/documents`, quero que o servidor recuse com 401, para que nenhum acesso externo consiga ler ou modificar meus documentos.

**Why this priority**: O projeto fica exposto em URL pública no Replit. Qualquer pessoa pode hoje consumir créditos de IA e deletar documentos.

**Independent Test**: Fazer request sem header `X-App-Key` e verificar 401. Fazer request com chave correta e verificar 200.

**Acceptance Scenarios**:

1. **Given** um request para `GET /api/documents` sem header, **When** o middleware executa, **Then** retorna `401` com `{ "message": "Autenticação necessária." }`.
2. **Given** um request com `X-App-Key` correto, **When** o middleware executa, **Then** a requisição passa para o handler.
3. **Given** um request com `X-App-Key` inválido, **When** o middleware executa, **Then** retorna `401` com `{ "message": "Chave de API inválida." }`.

---

### User Story 2 — Rotas públicas não bloqueadas (Priority: P1)

Como usuário externo que recebeu um link de compartilhamento, quero acessar `GET /api/share/:token` sem precisar de chave, para que documentos compartilhados publicamente continuem funcionando.

**Acceptance Scenarios**:

1. **Given** um request para `GET /api/share/abc123` sem header, **When** o middleware executa, **Then** a requisição passa sem bloquear.
2. **Given** um request `POST /api/external/generate` com `X-API-Key` válida, **When** o middleware executa, **Then** a requisição passa (rota tem auth própria).
3. **Given** um preflight `OPTIONS *`, **When** o middleware executa, **Then** retorna sem bloquear (CORS não quebra).

---

### User Story 3 — Frontend transparente (Priority: P1)

Como usuário do app, quero que todas as ações do frontend funcionem automaticamente após eu configurar a chave uma vez, sem precisar inserir em cada ação.

**Acceptance Scenarios**:

1. **Given** chave configurada no app, **When** o frontend faz qualquer request, **Then** o header `X-App-Key` é incluído automaticamente via `apiRequest()` e `getQueryFn`.
2. **Given** uma resposta 401, **When** o frontend recebe, **Then** exibe toast "Sessão expirada" e redireciona para tela de configuração.

---

### User Story 4 — Servidor não sobe sem chave configurada (Priority: P1)

Como operador, quero que o servidor recuse inicializar se `APP_SECRET_KEY` não estiver definida, para que não exista modo "sem senha" acidental em produção.

**Acceptance Scenarios**:

1. **Given** `APP_SECRET_KEY` ausente no ambiente, **When** o servidor inicia, **Then** loga erro claro e encerra o processo (exit 1).
2. **Given** `APP_SECRET_KEY` presente, **When** o servidor inicia, **Then** sobe normalmente.

---

### Edge Cases

- `APP_SECRET_KEY` definida como string vazia — tratar como ausente.
- Request com múltiplos headers `X-App-Key` — usar o primeiro.
- Chave com espaços ou caracteres especiais — comparação deve ser byte-exact.
- O valor da chave nunca deve aparecer em logs mesmo em nível debug.
- Remover `passport`, `express-session`, `connect-pg-simple`, `memorystore` sem quebrar build.

## Requirements

### Functional Requirements

- **FR-001**: O servidor MUST encerrar na inicialização se `APP_SECRET_KEY` for ausente ou vazia.
- **FR-002**: O middleware `requireAppKey` MUST ler a chave de `process.env.APP_SECRET_KEY`.
- **FR-003**: Requests sem o header `X-App-Key` MUST receber `401 { "message": "Autenticação necessária." }`.
- **FR-004**: Requests com chave incorreta MUST receber `401 { "message": "Chave de API inválida." }`.
- **FR-005**: O middleware MUST ser aplicado via `app.use("/api/", requireAppKey)` antes do registro de rotas.
- **FR-006**: `GET /api/share/:token`, `POST /api/external/generate` e `OPTIONS *` MUST estar isentos.
- **FR-007**: `apiRequest()` e `getQueryFn` MUST incluir `X-App-Key` lido do `localStorage` em todos os requests.
- **FR-008**: Respostas `401` no frontend MUST exibir toast e redirecionar para configuração de chave.
- **FR-009**: Os pacotes `passport`, `passport-local`, `express-session`, `connect-pg-simple` e `memorystore` MUST ser removidos do `package.json`.
- **FR-010**: `.env.example` MUST documentar `APP_SECRET_KEY` com instrução de geração via `openssl rand -hex 32`.

### Key Entities

- **requireAppKey**: Middleware Express em `server/middlewares/auth.ts`.
- **APP_SECRET_KEY**: Variável de ambiente que define a chave aceita.
- **docu_app_key**: Chave do `localStorage` onde o frontend armazena a chave.

## Success Criteria

- **SC-001**: Requests sem header recebem 401 — testado por Vitest.
- **SC-002**: Requests com chave correta passam — testado por Vitest.
- **SC-003**: `/api/share/:token` e `/api/external/generate` sem header passam — testado.
- **SC-004**: `npm run check` (tsc) passa após remoção das dependências.
- **SC-005**: Build (`vite build + esbuild`) passa sem erros.
- **SC-006**: Nenhum log contém o valor de `APP_SECRET_KEY`.

## Assumptions

- Projeto é single-user pessoal — não há multi-tenancy nem gestão de sessões.
- A chave é gerada uma vez e armazenada em `.env` local e no `localStorage` do browser.
- Autenticação por session/JWT está fora de escopo para este projeto.
