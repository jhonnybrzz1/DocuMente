# Requirements: Auth Middleware

## Introduction

O DocuMente roda no Replit free tier com URL pública exposta. Todas as rotas `/api/documents`, `/api/api-keys` e `/api/generate-document` estão atualmente sem autenticação — qualquer pessoa com acesso à URL pode ler documentos, consumir créditos de IA e deletar dados. Esta feature adiciona um middleware de API Key simples, consistente com o modelo já existente em `/api/external/generate`, e remove 5 dependências de session que nunca foram configuradas (`passport`, `express-session`, `connect-pg-simple`, `memorystore`, `passport-local`).

## Requirements

### Requirement 1 — Validação na inicialização

**User Story:** As a operador, I want the server to refuse to start if `APP_SECRET_KEY` is not configured, so that there is no accidental passwordless mode in production.

#### Acceptance Criteria

1. WHEN `APP_SECRET_KEY` is absent or empty in the environment THEN the system SHALL log a clear error message and exit with code 1 before accepting any requests.
2. WHEN `APP_SECRET_KEY` is present and non-empty THEN the system SHALL start normally.

---

### Requirement 2 — Middleware de autenticação por API Key

**User Story:** As a dono da aplicação, I want all protected routes to require a valid `X-App-Key` header, so that no unauthorized external access can read or modify my documents.

#### Acceptance Criteria

1. WHEN a request arrives at any `/api/` route without the `X-App-Key` header THEN the system SHALL return `401` with body `{ "message": "Autenticação necessária." }`.
2. WHEN a request arrives with an incorrect `X-App-Key` value THEN the system SHALL return `401` with body `{ "message": "Chave de API inválida." }`.
3. WHEN a request arrives with the correct `X-App-Key` value THEN the system SHALL pass the request to the route handler.
4. IF `APP_SECRET_KEY` is defined as an empty string THEN the system SHALL treat it as absent and return 500 on startup.
5. WHEN the middleware compares the key THEN the system SHALL never log the received key value at any log level.

---

### Requirement 3 — Rotas isentas de autenticação

**User Story:** As a external user who received a share link, I want to access `GET /api/share/:token` without a key, so that publicly shared documents continue to work.

#### Acceptance Criteria

1. WHEN a request arrives at `GET /api/share/:token` without a header THEN the system SHALL pass it through without authentication.
2. WHEN a request arrives at `POST /api/external/generate` THEN the system SHALL skip the `requireAppKey` middleware (this route has its own `EXTERNAL_API_KEY` authentication).
3. WHEN an `OPTIONS` preflight request arrives THEN the system SHALL respond without triggering authentication (CORS must not break).

---

### Requirement 4 — Frontend transparente

**User Story:** As a usuário do app, I want all frontend actions to work automatically after configuring the key once, so that I never have to re-enter it per action.

#### Acceptance Criteria

1. WHEN the frontend makes any API request THEN the system SHALL include the `X-App-Key` header read from `localStorage` key `docu_app_key` in both `apiRequest()` and `getQueryFn`.
2. WHEN the server returns `401` THEN the system SHALL display a toast "Sessão expirada — configure sua chave de acesso" and redirect to the key configuration screen.

---

### Requirement 5 — Remoção de dependências mortas

**User Story:** As a mantenedor, I want unused session packages removed from `package.json`, so that the install surface and attack surface are reduced.

#### Acceptance Criteria

1. WHEN `npm install` runs after removal THEN the system SHALL complete without errors.
2. WHEN `vite build && esbuild` runs after removal THEN the system SHALL complete without errors.
3. IF any import of `passport`, `passport-local`, `express-session`, `connect-pg-simple`, or `memorystore` exists in any `.ts` or `.tsx` file THEN the build SHALL fail (grep confirms zero results before removal).

---

### Requirement 6 — Documentação da variável de ambiente

**User Story:** As a operador, I want `.env.example` to document `APP_SECRET_KEY` with generation instructions, so that any new deployment knows how to configure the secret.

#### Acceptance Criteria

1. WHEN `.env.example` is read THEN it SHALL contain `APP_SECRET_KEY=` with an inline comment instructing generation via `openssl rand -hex 32`.
