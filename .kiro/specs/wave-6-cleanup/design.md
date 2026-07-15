# Design: Cleanup Wave

## Overview

Três limpezas independentes executadas em fases separadas. Cada fase tem seu próprio commit e rollback. Nenhuma altera comportamento de API, schema de banco ou contratos públicos.

## Architecture

Nenhuma mudança arquitetural. Todas as alterações são remoções ou substituições de chamadas dentro de arquivos existentes.

```
Fase 1 — Dependências
  package.json → remover react-icons, framer-motion (e ws se confirmado não-usado)

Fase 2 — Console → Logger
  server/**/*.ts → substituir console.* por logger.*
  .eslintrc.json → habilitar "no-console": "error" para server/

Fase 3 — Model Routing
  server/routes/ai.ts       → remover switch por X-User-Plan no quality-score
  server/routes.ts (ou generation.ts após wave-5) → remover leitura de userPlan
  client/src/lib/queryClient.ts → remover header X-User-Plan
```

## Components and Interfaces

### Fase 1 — Dependências

Nenhuma interface alterada. Apenas `package.json` e `package-lock.json`.

Verificação antes da remoção:
```bash
grep -r "react-icons\|framer-motion" client/ server/ --include="*.ts" --include="*.tsx"
# deve retornar vazio
npm ls ws  # identificar se é direto ou transitivo
```

### Fase 2 — Logger

`server/utils/logger.ts` já exporta instância `logger` com métodos `info`, `warn`, `error`, `debug` e write queue assíncrono (implementado na wave-2). O mapeamento é direto:

| Chamada atual | Substituição |
|---------------|-------------|
| `console.log(...)` | `logger.info(...)` |
| `console.error(...)` | `logger.error(...)` |
| `console.warn(...)` | `logger.warn(...)` |

Exceções documentadas (manter `console.*` com comentário):
- Qualquer `console.*` em `server/index.ts` antes da linha de `registerRoutes` — o logger não está inicializado nesse ponto de boot.

Configuração ESLint após migração:
```json
{
  "overrides": [{
    "files": ["server/**/*.ts"],
    "rules": { "no-console": "error" }
  }]
}
```

### Fase 3 — Model Routing

**`server/routes/ai.ts` — bloco quality-score atual:**
```typescript
// REMOVER:
const userPlan = (req.header("X-User-Plan") || "pro").toLowerCase();
if (userPlan === "free") { judgeModel = "deepseek/deepseek-flash"; }
else if (userPlan === "enterprise") { judgeModel = "mimo-2.5-pro"; }
else { judgeModel = isComplex ? "mimo-2.5-pro" : "deepseek/deepseek-flash"; }

// SUBSTITUIR POR:
const judgeModel = process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-flash";
```

**`server/routes.ts` (ou `generation.ts` se wave-5 já executada):**
```typescript
// REMOVER qualquer leitura de:
const userPlan = (req.header("X-User-Plan") || "pro").toLowerCase();
```

**`client/src/lib/queryClient.ts`:**
```typescript
// REMOVER de apiRequest() e getQueryFn:
"X-User-Plan": userPlan,
// e a leitura:
const userPlan = localStorage.getItem("docu_user_plan") || "pro";
```

## Data Models

Nenhuma mudança de banco.

## Error Handling

- Fase 1: se `npm install` falhar após remoção, `git revert` e investigar dependência transitiva.
- Fase 2: se ESLint reportar violations após migração, corrigir antes de commitar. Nunca desabilitar a regra para mascarar o problema.
- Fase 3: se testes quebrarem após remoção de `X-User-Plan`, verificar se algum teste mockava esse header explicitamente e atualizar o mock.

## Testing Strategy

### Fase 1
```bash
npm run build   # valida que nenhum import de react-icons/framer-motion existia
```

### Fase 2
```bash
eslint server/ --rule '{"no-console": "error"}'   # zero violations
npm run check                                      # zero erros TypeScript
```

### Fase 3
```bash
grep -rn "X-User-Plan\|userPlan.*plan\|judgeModel.*plan" server/ client/ --include="*.ts" --include="*.tsx"
# deve retornar vazio
npm run check
npm run build
npm test
```
