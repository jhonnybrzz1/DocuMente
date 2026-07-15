# Tasks: Cleanup Wave

- [ ] 1. Remover dependências não utilizadas confirmadas
  - Executar: `grep -r "react-icons\|framer-motion" client/ server/ --include="*.ts" --include="*.tsx"`
  - Se vazio: remover `react-icons` e `framer-motion` de `package.json`
  - Executar `npm install` e `npm run build` — verificar sucesso
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 1.1 Verificar e decidir sobre `ws`
  - Executar: `npm ls ws` para identificar se é direto ou transitivo
  - Executar: `grep -r "from 'ws'" server/ client/ --include="*.ts" --include="*.tsx"`
  - Se não importado diretamente: documentar e manter; se não usado de nenhuma forma: remover
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 2. Mapear todos os `console.*` em `server/`
  - Executar: `grep -rn "console\." server/ --include="*.ts" | grep -v "node_modules"`
  - Catalogar por arquivo: quais são de boot (antes do logger) e quais são de runtime
  - _Requirements: 3.1, 3.4_

- [ ] 2.1 Migrar `console.*` de runtime para `logger`
  - Substituir por arquivo: `console.log` → `logger.info`, `console.error` → `logger.error`, `console.warn` → `logger.warn`
  - Adicionar `import { logger } from "../utils/logger"` onde ausente
  - Manter `console.*` de boot com comentário `// boot: logger not yet initialized`
  - _Requirements: 3.1, 3.3, 3.4_

- [ ] 2.2 Habilitar `no-console` no ESLint para `server/`
  - Adicionar override em `.eslintrc.json`: `{ "files": ["server/**/*.ts"], "rules": { "no-console": "error" } }`
  - Executar `eslint server/` e resolver todas as violations restantes
  - _Requirements: 3.2_

- [ ] 3. Remover model routing por plano em `server/routes/ai.ts`
  - Remover: leitura de `X-User-Plan`, bloco `if free / else enterprise / else pro`
  - Substituir por: `const judgeModel = process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-flash"`
  - _Requirements: 4.1, 4.2_

- [ ] 3.1 Remover model routing em `server/routes.ts` (ou `generation.ts` se wave-5 executada)
  - Remover: `const userPlan = req.header("X-User-Plan") || "pro"` e uso derivado
  - _Requirements: 4.1, 4.3_

- [ ] 3.2 Remover `X-User-Plan` do frontend
  - Em `client/src/lib/queryClient.ts`: remover `"X-User-Plan": userPlan` de `apiRequest()` e `getQueryFn`
  - Remover leitura de `localStorage.getItem("docu_user_plan")`
  - _Requirements: 4.4_

- [ ] 4. Validação final das três fases
  - `npm run check` — zero erros TypeScript novos
  - `npm run build` — sucesso
  - `npm test` — 100% passando
  - `grep -rn "react-icons\|framer-motion" client/ server/` → vazio
  - `grep -rn "console\." server/ --include="*.ts"` → vazio (ou só boot documentados)
  - `grep -rn "X-User-Plan\|userPlan" server/ client/ --include="*.ts" --include="*.tsx"` → vazio
  - _Requirements: 1.4, 3.2, 4.2_
