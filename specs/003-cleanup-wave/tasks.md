# Tasks: Cleanup Wave

## Phase 1 — Dependências não utilizadas

- [ ] **T001 [FR-001, FR-002]** Confirmar e remover `react-icons` e `framer-motion`
  - Executar: `grep -r "react-icons\|framer-motion" client/ server/ --include="*.ts" --include="*.tsx"`
  - Se zero resultados: remover de `package.json`
  - Executar `npm install` e verificar que não há erros
  - _Requirements: FR-001, FR-002_

- [ ] **T002 [FR-003]** Verificar e decidir sobre `ws`
  - Executar: `grep -r "from 'ws'\|require('ws')" server/ client/`
  - Verificar se Vite dev server usa `ws` como dependência implícita: `npm ls ws`
  - Se não usado diretamente: remover de `package.json`; se usado pelo Vite: manter e documentar
  - _Requirements: FR-003_

- [ ] **T003** Executar `npm run build` após remoções e confirmar sucesso

## Phase 2 — Migração de console.* para logger

- [ ] **T004 [FR-004]** Mapear todos os `console.*` em `server/`
  - Executar: `grep -rn "console\." server/ --include="*.ts" | grep -v "node_modules\|\.d\.ts"`
  - Catalogar por arquivo e tipo (log/error/warn)
  - Identificar exceções de boot (antes da inicialização do logger)
  - _Requirements: FR-004_

- [ ] **T005 [FR-004]** Migrar `console.*` em `server/routes.ts`
  - Substituir `console.log` → `logger.info`, `console.error` → `logger.error`, `console.warn` → `logger.warn`
  - Adicionar import de `logger` se ausente
  - _Requirements: FR-004_

- [ ] **T006 [FR-004]** Migrar `console.*` nos demais arquivos `server/`
  - Processar por arquivo: `server/routes/generation.ts`, `server/routes/documents.ts`, `server/routes/ai.ts`, `server/services/*.ts`
  - Manter comentário `// boot: logger não inicializado ainda` nas exceções de inicialização
  - _Requirements: FR-004_

- [ ] **T007 [FR-005]** Habilitar `"no-console": "error"` no ESLint para `server/`
  - Adicionar ou atualizar regra em `.eslintrc.json` para escopo `server/`
  - Adicionar overrides para arquivos de boot se necessário
  - Executar `eslint server/` e resolver todas as violations
  - _Requirements: FR-005_

## Phase 3 — Remoção de model routing por plano

- [ ] **T008 [FR-006, FR-007]** Mapear todos os pontos de routing por plano
  - Executar: `grep -rn "X-User-Plan\|userPlan\|FREE\|PRO\|ENTERPRISE\|judgeModel" server/ --include="*.ts"`
  - Listar todos os arquivos e linhas afetados
  - _Requirements: FR-006_

- [ ] **T009 [FR-006]** Simplificar `quality-score` em `server/routes/ai.ts`
  - Remover bloco `if (userPlan === "free") ... else if (userPlan === "enterprise") ... else`
  - Substituir por: `const judgeModel = process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-flash"`
  - _Requirements: FR-006, FR-007_

- [ ] **T010 [FR-006]** Simplificar routing em `server/routes.ts` (ou `server/routes/generation.ts` se já extraído)
  - Remover `const userPlan = req.header("X-User-Plan") || "pro"` e lógica derivada de model routing
  - Manter apenas `const model = process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-flash"`
  - _Requirements: FR-006, FR-007_

- [ ] **T011 [FR-008]** Remover `X-User-Plan` do frontend
  - Em `client/src/lib/queryClient.ts`: remover `"X-User-Plan": userPlan` de `apiRequest()` e `getQueryFn`
  - Remover leitura de `localStorage.getItem("docu_user_plan")`
  - _Requirements: FR-008_

## Phase 4 — Validação final

- [ ] **T012** Executar `npm run check` (tsc) e verificar zero erros novos
- [ ] **T013** Executar `npm run build` e verificar sucesso
- [ ] **T014** Executar suíte de testes e verificar 100% passando
- [ ] **T015** Executar critérios de sucesso do spec:
  - `grep -r "react-icons\|framer-motion" client/ server/` → zero
  - `grep -rn "console\." server/ --include="*.ts"` → zero (ou só exceções documentadas)
  - `grep -r "X-User-Plan\|userPlan.*plan\|FREE.*PRO" server/` → zero

## Dependencies

T001 → T002 → T003 (dependências)
T004 → T005 → T006 → T007 (console)
T008 → T009 → T010 → T011 (model routing)
T012 → T013 → T014 → T015 (validação — após todas as fases)

## Rollback

`git revert` por fase. Cada fase é independente das outras. Para restaurar dependências removidas: `npm install react-icons framer-motion`.
