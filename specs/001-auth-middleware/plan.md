# Implementation Plan: Auth Middleware

**Branch**: `001-auth-middleware` | **Date**: 2026-07-14 | **Spec**: `specs/001-auth-middleware/spec.md`

## Summary

Adicionar middleware de API Key em `server/middlewares/auth.ts`, aplicá-lo globalmente com exceções para rotas públicas, propagar o header no frontend, validar na inicialização do servidor e remover 5 dependências de session nunca usadas.

## Technical Context

**Language/Version**: TypeScript + Node.js 20, ESM

**Primary Dependencies**: Express 4 (sem novas dependências)

**Storage**: Nenhuma mudança de banco — chave vive apenas em `.env` e `localStorage`

**Testing**: Vitest

**Target Platform**: Local + Replit free tier

**Performance Goals**: Overhead do middleware < 0.1 ms por request (comparação de string)

**Constraints**: Zero novas dependências; não quebrar rotas públicas existentes

**Scale/Scope**: 4 arquivos de servidor + 2 de cliente + package.json + .env.example

## Constitution Check

- [x] TypeScript estrito — nenhum `any` novo
- [x] Vitest acompanha cada comportamento novo
- [x] Nenhum segredo logado — comparação e log separados
- [x] Sem mudança de banco, schema ou frontend além do header
- [x] Implementação em commits reversíveis

## Project Structure

```text
server/
  middlewares/
    auth.ts              ← NOVO — middleware requireAppKey
  index.ts               ← MODIFICAR — validação na inicialização + app.use
client/src/lib/
  queryClient.ts         ← MODIFICAR — adicionar X-App-Key em apiRequest e getQueryFn
tests/unit/
  auth-middleware.test.ts ← NOVO
package.json             ← MODIFICAR — remover 5 dependências
.env.example             ← MODIFICAR — documentar APP_SECRET_KEY
```

## Implementation Sequence

1. Criar `server/middlewares/auth.ts` com `requireAppKey` e testes unitários.
2. Adicionar validação de `APP_SECRET_KEY` na inicialização em `server/index.ts`.
3. Registrar `app.use("/api/", requireAppKey)` com bypass das rotas isentas.
4. Atualizar `queryClient.ts` para incluir `X-App-Key` e tratar 401.
5. Remover dependências mortas do `package.json` e rodar `npm install`.
6. Atualizar `.env.example` com documentação.
7. Rodar `npm run check`, build e suíte completa.

## Rollback

`git revert` no commit do middleware. Nenhuma mudança de banco envolvida.
