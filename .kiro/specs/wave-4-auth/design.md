# Design: Auth Middleware

## Overview

Adicionar autenticação por API Key ao DocuMente com o menor número possível de arquivos novos e zero novas dependências. O modelo escolhido é API Key por header (`X-App-Key`), consistente com o padrão já existente em `/api/external/generate` (que usa `X-API-Key` + `EXTERNAL_API_KEY`). Sem JWT, sem sessions, sem cookies — o projeto é single-user pessoal.

## Architecture

```
Request
  │
  ▼
CORS Middleware (index.ts) ← OPTIONS bypass aqui
  │
  ▼
app.use("/api/", requireAppKey) ← NOVO — bloqueia antes das rotas
  │                ↓ bypass explícito
  │         /api/share/:token
  │         /api/external/generate
  │
  ▼
Route Handlers (routes.ts, routes/*)
```

A validação de `APP_SECRET_KEY` ocorre **antes** de `registerRoutes(app)`, no IIFE de inicialização em `server/index.ts`. Se ausente, `process.exit(1)` antes de qualquer bind de porta.

## Components and Interfaces

### `server/middlewares/auth.ts` (NOVO)

```typescript
import type { Request, Response, NextFunction } from "express";

export function requireAppKey(req: Request, res: Response, next: NextFunction): void {
  // Rotas isentas verificadas antes de qualquer comparação
  if (
    req.path.startsWith("/share/") ||
    req.path === "/external/generate"
  ) {
    return next();
  }

  const provided = req.header("X-App-Key");
  const expected = process.env.APP_SECRET_KEY; // validado no boot

  if (!provided) {
    res.status(401).json({ message: "Autenticação necessária." });
    return;
  }

  if (provided !== expected) {
    res.status(401).json({ message: "Chave de API inválida." });
    return;
  }

  next();
}
```

### `server/index.ts` — modificação na inicialização

```typescript
// Antes de registerRoutes:
const appKey = process.env.APP_SECRET_KEY;
if (!appKey || appKey.trim() === "") {
  console.error("[FATAL] APP_SECRET_KEY não está definida. Configure a variável de ambiente.");
  process.exit(1);
}
app.use("/api/", requireAppKey);
```

### `client/src/lib/queryClient.ts` — modificação

```typescript
// Em apiRequest() e getQueryFn:
"X-App-Key": localStorage.getItem("docu_app_key") ?? "",
```

### Resposta 401 no frontend

Em `throwIfResNotOk`: se `res.status === 401`, dispara toast e redireciona. Implementado em `queryClient.ts` sem novo componente.

## Data Models

Nenhuma mudança de banco. A chave vive exclusivamente em:
- Servidor: `process.env.APP_SECRET_KEY` (arquivo `.env`)
- Cliente: `localStorage["docu_app_key"]`

## Error Handling

| Cenário | Comportamento |
|---------|---------------|
| `APP_SECRET_KEY` ausente no boot | `process.exit(1)` com log claro |
| Header ausente na request | `401` com mensagem pt-BR |
| Header incorreto | `401` com mensagem pt-BR |
| Rota isenta sem header | `next()` transparente |
| Chave correta | `next()` transparente |

O valor da chave **nunca** é incluído em logs — nem no Winston, nem no `console.error` do boot (loga ausência, não valor).

## Testing Strategy

Arquivo: `tests/unit/auth-middleware.test.ts`

Cenários cobertos por Vitest:
1. Sem header → 401 "Autenticação necessária."
2. Header incorreto → 401 "Chave inválida."
3. Header correto → `next()` chamado, sem response
4. Path `/share/abc` sem header → `next()` chamado
5. Path `/external/generate` sem header → `next()` chamado
6. `APP_SECRET_KEY` vazia → tratada como ausente

Validação de remoção de dependências:
```bash
grep -r "passport\|express-session\|connect-pg\|memorystore" server/ client/ --include="*.ts" --include="*.tsx"
# deve retornar vazio
```
