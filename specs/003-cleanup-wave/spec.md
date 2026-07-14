# Feature Specification: Cleanup Wave

**Feature Branch**: `003-cleanup-wave`

**Created**: 2026-07-14

**Status**: Ready

**Origin**: Issues 13, 16, 17 da Auditoria Wave 2 — dependências não usadas, 87 `console.*` no servidor sem logger estruturado, e features de model routing que não fazem sentido para uso pessoal.

## User Scenarios & Testing

### User Story 1 — Dependências mortas removidas (Priority: P1)

Como desenvolvedor, quando rodo `npm install`, quero que `react-icons` e `framer-motion` não sejam baixados, para reduzir o tempo de instalação e a superfície de ataque.

**Acceptance Scenarios**:

1. **Given** `package.json` sem `react-icons` e `framer-motion`, **When** `npm install` executa, **Then** nenhum erro é produzido.
2. **Given** build de produção (`vite build`), **When** executa, **Then** nenhum erro de import relacionado a esses pacotes.
3. **Given** busca por `react-icons` e `framer-motion` no código-fonte, **When** executada, **Then** zero resultados em `.tsx` e `.ts`.

---

### User Story 2 — Console.log migrado para logger (Priority: P2)

Como operador, quando ocorre um erro de geração de IA, quero ver o log no arquivo `logs/app.log` com timestamp e nível estruturado, para correlacionar com outras entradas sem escanear stdout.

**Acceptance Scenarios**:

1. **Given** um erro em qualquer handler de rota, **When** o erro é capturado, **Then** `logger.error()` é chamado (não `console.error()`).
2. **Given** `eslint` executado em `server/`, **When** a regra `no-console` está habilitada, **Then** zero violations.
3. **Given** informações de debug de geração de documento, **When** logadas, **Then** aparecem em `logs/app.log` com estrutura JSON.

---

### User Story 3 — Model routing simplificado (Priority: P3)

Como dono do app pessoal, quando o sistema roteia chamadas de IA, quero que use sempre `deepseek/deepseek-flash` sem lógica de plano FREE/PRO/ENTERPRISE, para eliminar código que nunca será usado.

**Acceptance Scenarios**:

1. **Given** qualquer request de geração, **When** o modelo é selecionado, **Then** usa `OPENROUTER_MODEL` do env (padrão `deepseek/deepseek-flash`) sem branching por `X-User-Plan`.
2. **Given** o header `X-User-Plan: enterprise`, **When** enviado, **Then** não altera o modelo selecionado (header ignorado para routing).
3. **Given** `quality-score` no `ai.ts`, **When** executa, **Then** usa modelo único configurável via env, sem switch por plano.

---

### Edge Cases

- `ws` pode ser dependência indireta do Vite dev server — verificar antes de remover.
- Alguns `console.log` podem ser em arquivos de boot onde `logger` ainda não está inicializado — manter nesses casos com comentário.
- Model routing pode estar em múltiplos arquivos — mapear todos antes de remover.

## Requirements

### Functional Requirements

- **FR-001**: `react-icons` MUST ser removido de `package.json` após confirmar zero imports.
- **FR-002**: `framer-motion` MUST ser removido de `package.json` após confirmar zero imports.
- **FR-003**: `ws` MUST ser removido somente se confirmado que não é usado por Vite dev server nem por nenhum import direto.
- **FR-004**: Os 87 `console.*` em `server/` MUST ser substituídos por `logger.info/error/warn/debug` correspondentes.
- **FR-005**: Após a migração, ESLint com `"no-console": "error"` MUST passar sem violations em `server/`.
- **FR-006**: A lógica de switch por `X-User-Plan` para seleção de modelo MUST ser removida de `server/routes/ai.ts` (quality-score) e de `server/routes.ts` (geração de documento).
- **FR-007**: O modelo padrão MUST vir de `process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-flash"` em um único ponto.
- **FR-008**: O header `X-User-Plan` MUST ser removido de `client/src/lib/queryClient.ts`.

### Key Entities

- **logger**: instância existente de `server/utils/logger.ts` com write queue assíncrono.
- **OPENROUTER_MODEL**: variável de ambiente que define o modelo padrão.

## Success Criteria

- **SC-001**: `grep -r "react-icons\|framer-motion" client/ server/` → zero resultados.
- **SC-002**: `npm run build` passa após remoção das dependências.
- **SC-003**: `grep -rn "console\." server/ --include="*.ts"` → zero resultados (exceto arquivos de boot documentados).
- **SC-004**: `eslint server/` com `no-console: error` → zero violations.
- **SC-005**: `grep -r "X-User-Plan\|userPlan\|FREE\|PRO\|ENTERPRISE" server/` relacionado a model routing → zero resultados.
- **SC-006**: `npm run check` (tsc) passa.

## Assumptions

- `ws` é usado internamente pelo Vite — deve ser verificado antes de remover.
- Alguns `console.log` em arquivos de configuração de boot (antes da inicialização do logger) são exceções aceitáveis com comentário explicativo.
- A remoção de model routing não afeta o comportamento para o único usuário do sistema.
