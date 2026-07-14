# Implementation Plan: Cleanup Wave

**Branch**: `003-cleanup-wave` | **Date**: 2026-07-14 | **Spec**: `specs/003-cleanup-wave/spec.md`

## Summary

Três limpezas independentes em paralelo: (1) remover `react-icons` e `framer-motion` após confirmar zero imports; (2) migrar 87 `console.*` em `server/` para `logger` estruturado e habilitar `no-console: error` no ESLint; (3) eliminar lógica de model routing por plano (FREE/PRO/ENTERPRISE) e simplificar para modelo único via env.

## Technical Context

**Language/Version**: TypeScript + Node.js 20

**Primary Dependencies**: Nenhuma nova — apenas remoções e substituições

**Storage**: Sem mudança de banco

**Testing**: Vitest

**Target Platform**: Local + Replit

**Performance Goals**: Redução de ~3MB no bundle após remoção das dependências não usadas

**Constraints**: Não alterar comportamento de geração de documentos; manter compatibilidade de API

**Scale/Scope**: package.json + ~87 console statements em server/ + ~3 arquivos com model routing

## Constitution Check

- [x] TypeScript estrito — nenhum `any` novo
- [x] Sem mudança de banco ou schema
- [x] Logger assíncrono já existente em `server/utils/logger.ts`
- [x] Commits por fase, reversíveis independentemente

## Implementation Sequence

### Fase 1 — Dependências (baixo risco, 30 min)
1. Confirmar zero imports de `react-icons` e `framer-motion`.
2. Remover do `package.json` + `npm install`.
3. Build de verificação.

### Fase 2 — Console → Logger (mecânica, 2-3h)
1. Mapear todos os `console.*` por arquivo.
2. Substituir arquivo por arquivo, confirmando build entre cada.
3. Habilitar `no-console: error` no ESLint.
4. Resolver qualquer violation residual.

### Fase 3 — Model Routing (cirúrgica, 1h)
1. Mapear todos os pontos com `X-User-Plan` / `userPlan`.
2. Substituir switches por `process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-flash"`.
3. Remover header do frontend.
4. Verificar zero uso residual.

## Rollback

Cada fase tem seu próprio rollback via `git revert`. Fases são independentes entre si.
