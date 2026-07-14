---
inclusion: always
---

# DocuMente — Steering de Projeto

## Stack canônica
- **Runtime**: Node.js 20 + TypeScript 5.6 (ESM)
- **Frontend**: React 18 + Vite 5 + Tailwind CSS 3 + shadcn/ui (Radix)
- **Backend**: Express 4 + Drizzle ORM + PostgreSQL (Neon serverless ou local)
- **IA**: OpenRouter API (modelo padrão `deepseek/deepseek-flash`)
- **Testes**: Vitest (unit) + evals customizadas em `evals/`
- **Deploy primário**: Replit (free tier); também funciona localmente

## Convenções de código
- Todo endpoint Express **deve** validar input com Zod antes de tocar no storage
- Erros `ZodError` → 400; erros inesperados → 500 com mensagem genérica
- Queries ao banco **sempre** via Drizzle — zero SQL string concatenation
- Nunca usar `fs.writeFileSync` / `fs.appendFileSync` fora do boot (event loop)
- `DOMPurify.sanitize()` obrigatório antes de qualquer `dangerouslySetInnerHTML`
- CORS gerenciado em `server/index.ts` via allowlist (env `CORS_ALLOWED_ORIGINS`)

## Estrutura de pastas relevante
```
server/
  index.ts          ← CORS, rate limit, middlewares globais
  routes.ts         ← MONOLITO (débito técnico — ver wave-5)
  routes/
    ai.ts           ← rotas /api/ai/*
    documents-extra.ts ← PATCH meta, share, push GitHub/Jira
    upload.ts       ← upload de arquivos
  services/
    openrouter.ts   ← chatCompletion, extractJson
  storage.ts        ← DatabaseStorage + MemStorage
  utils/
    cache.ts        ← cache semântico cosine similarity
    logger.ts       ← write queue assíncrono
    helpers.ts      ← maskPII, extractJsonObject, etc.
shared/
  schema.ts         ← tabelas Drizzle + schemas Zod + documentTypes (fonte da verdade)
client/src/
  pages/            ← home, share, stats, templates
  components/       ← UI components
  lib/queryClient.ts ← staleTime 5min
```

## Regras de segurança
- `EXTERNAL_API_KEY` **nunca** tem fallback hardcoded — retornar 500 se ausente
- Inputs `repo` (GitHub) e `domain` (Jira) validados com regex antes de construir URL
- `parentDocumentId` usa FK com `onDelete: set null` no schema
- Rotas CRUD `/api/documents` **ainda sem auth** — ver spec wave-4

## Pendências conhecidas (não fazer sem spec aprovada)
- Auth nas rotas CRUD (wave-4)
- Desmembramento de `routes.ts` (wave-5)
- Limpeza de dependências e console.log (wave-6)
