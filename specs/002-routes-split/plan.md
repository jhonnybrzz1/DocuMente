# Implementation Plan: Routes Split

**Branch**: `002-routes-split` | **Date**: 2026-07-14 | **Spec**: `specs/002-routes-split/spec.md`

## Summary

Desmembrar `server/routes.ts` (3.467 linhas) em módulos por domínio sem alterar comportamento. Migração incremental: extrair templates → schemas → serviços → rotas. Cada extração é um commit separado com build verde.

## Technical Context

**Language/Version**: TypeScript + Node.js 20, ESM

**Primary Dependencies**: Express 4, Drizzle ORM, Zod, Puppeteer, docx — nenhuma nova dependência

**Storage**: Nenhuma mudança de banco

**Testing**: Vitest + smoke tests manuais por rota

**Target Platform**: Local + Replit

**Performance Goals**: Nenhuma mudança de runtime — apenas reorganização de arquivos

**Constraints**: Zero regressão funcional; cada commit deve ter build verde; sem big-bang

**Scale/Scope**: ~3.467 linhas distribuídas em ~12 arquivos novos

## Constitution Check

- [x] TypeScript estrito — nenhum `any` novo
- [x] Nenhuma mudança de comportamento externo
- [x] Sem mudança de banco, schema ou frontend
- [x] Commits incrementais e reversíveis

## Migration Sequence (incremental, commit por commit)

### Commit 1 — Prompts (templates)
Extrair as 9 strings de template para `server/prompts/{type}.ts`. Substituir em `routes.ts` por imports. Build e testes verdes.

### Commit 2 — Schemas e renderizadores
Extrair `prdJsonSchema`, `userStoriesJsonSchema`, `apiDocJsonSchema`, `techSpecJsonSchema` e respectivos `render*Markdown` para `server/schemas/{type}.ts`. Build verde.

### Commit 3 — Serviço de IA
Mover `callOpenRouterAPI`, `verifyAndRepairGeneratedDocument` e `getOpenRouterApiKey` para `server/services/ai-generation.ts`. Consolidar duplicata de `getOpenRouterApiKey`. Build verde.

### Commit 4 — Serviços Word e PDF
Mover `createWordDocument` para `server/services/docx.ts` e bloco Puppeteer para `server/services/pdf.ts`. Build verde.

### Commit 5 — Rotas de documentos
Mover handlers CRUD para `server/routes/documents.ts`. Build e smoke tests verdes.

### Commit 6 — Rotas de geração
Mover handlers de geração para `server/routes/generation.ts`. Build verde.

### Commit 7 — Limpeza final
Reduzir `server/routes.ts` para orquestrador < 150 linhas. Verificar `wc -l server/routes.ts < 150`. Build + testes completos + `npm run check`.

## Rollback

`git revert` de qualquer commit incremental. Estrutura original preservada até o último commit.
