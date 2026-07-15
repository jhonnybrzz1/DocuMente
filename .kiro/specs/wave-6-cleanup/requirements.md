# Requirements: Cleanup Wave

## Introduction

Três limpezas independentes acumuladas nas auditorias anteriores: (1) `react-icons` e `framer-motion` nunca são importados em nenhum arquivo do projeto mas estão em `package.json`, adicionando peso à instalação sem benefício; (2) 87 `console.*` em `server/` emitem logs não estruturados enquanto `server/utils/logger.ts` com write queue assíncrono existe e está subutilizado; (3) a lógica de roteamento de modelo por plano (`X-User-Plan: free/pro/enterprise`) em `server/routes/ai.ts` e `server/routes.ts` não tem sentido em um projeto single-user pessoal — o usuário sempre é o mesmo e o modelo padrão é configurável via `OPENROUTER_MODEL`. As três limpezas são independentes e podem ser revertidas individualmente.

## Requirements

### Requirement 1 — Remover dependências não utilizadas confirmadas

**User Story:** As a desenvolvedor, I want unused npm packages removed from `package.json`, so that `npm install` is faster and the attack surface is smaller.

#### Acceptance Criteria

1. WHEN `grep -r "react-icons" client/ server/ --include="*.ts" --include="*.tsx"` is executed THEN the output SHALL be empty before removal is applied.
2. WHEN `grep -r "framer-motion" client/ server/ --include="*.ts" --include="*.tsx"` is executed THEN the output SHALL be empty before removal is applied.
3. WHEN `npm install` runs after removal THEN the system SHALL complete without errors.
4. WHEN `npm run build` runs after removal THEN the system SHALL complete without errors.

---

### Requirement 2 — Verificar e decidir sobre `ws`

**User Story:** As a desenvolvedor, I want to know whether `ws` is a direct dependency or only a transitive one, so that I can remove it safely if it is unused.

#### Acceptance Criteria

1. WHEN `grep -r "from 'ws'" server/ client/ --include="*.ts" --include="*.tsx"` is executed THEN the result SHALL determine whether `ws` is imported directly.
2. IF `ws` is not imported directly and is only a transitive dependency of Vite or Puppeteer THEN the system SHALL document this finding and leave the package in place.
3. IF `ws` is not imported at all, directly or transitively THEN the system SHALL remove it and verify `npm install` and `npm run build` pass.

---

### Requirement 3 — Migrar console.* para logger estruturado

**User Story:** As a operador, I want all server-side logs to use the structured logger, so that errors appear in `logs/app.log` with timestamp and level and can be correlated across requests.

#### Acceptance Criteria

1. WHEN any route handler catches an error THEN the system SHALL call `logger.error()` instead of `console.error()`.
2. WHEN `eslint server/` runs with `"no-console": "error"` enabled THEN the output SHALL show zero violations.
3. WHEN a document generation debug message is emitted THEN it SHALL appear in `logs/app.log` as a JSON entry with `level`, `timestamp`, and `message` fields.
4. IF a `console.*` call exists in a boot-time file before the logger is initialized THEN the system SHALL keep it with an inline comment `// boot: logger not yet initialized`.

---

### Requirement 4 — Remover model routing por plano

**User Story:** As a dono do app pessoal, I want the AI model selection to use a single configurable model from the environment, so that dead code for FREE/PRO/ENTERPRISE tiers is eliminated.

#### Acceptance Criteria

1. WHEN any document generation request is processed THEN the system SHALL use `process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-flash"` as the model, regardless of any request header.
2. WHEN `grep -rn "X-User-Plan\|userPlan\|judgeModel.*plan\|free.*pro.*enterprise" server/ --include="*.ts"` is executed after cleanup THEN the output SHALL be empty.
3. WHEN the `X-User-Plan` header is sent by any client THEN the system SHALL ignore it for model selection purposes.
4. WHEN `client/src/lib/queryClient.ts` is read THEN it SHALL not contain `X-User-Plan` header injection.
