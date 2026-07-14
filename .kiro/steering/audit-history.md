---
inclusion: manual
---

# Histórico de Auditoria e Correções

## Wave 1 — Críticos Imediatos (14/07/2026)
| # | Item | Status |
|---|------|--------|
| C1 | XSS via dangerouslySetInnerHTML | ✅ Já estava corrigido (DOMPurify aplicado) |
| C2 | API key hardcoded `"documente_dev_key"` | ✅ Removido — retorna 500 se env ausente |
| C3 | Puppeteer sem cleanup em erro | ✅ `try/finally` adicionado |
| C4 | God object `routes.ts` 3.434 linhas | ⏳ Pendente — ver spec wave-5 |

## Wave 2 — Alta/Média Prioridade (14/07/2026)
| # | Item | Status |
|---|------|--------|
| 5 | CORS wildcard `*` | ✅ Allowlist com env `CORS_ALLOWED_ORIGINS` |
| 6 | Sem auth nas rotas CRUD | ⏳ Pendente — ver spec wave-4 |
| 7 | `getDocumentStats` SELECT * | ✅ 7 queries SQL com agregação |
| 8 | I/O síncrono (writeFileSync) | ✅ Write queue debounce + fs.promises |
| 9 | Sem React Error Boundary | ✅ `ErrorBoundary` por rota + global |
| 10 | `staleTime: Infinity` | ✅ Ajustado para 5 min |
| 11 | Puppeteer desnecessário | ✅ Estava em uso — premissa errada |
| 12 | `documentTypes` em 3 lugares | ✅ DRY via `shared/schema.ts` |
| 13 | Dependências não utilizadas | ⏳ Parcial — ver spec wave-6 |
| 14 | Componentes shadcn não usados | ✅ Não fazer — tree-shaking resolve |
| 15 | Código morto | ✅ `document-input.tsx` deletado |
| 16 | 154 console.log sem logger | ⏳ Pendente — ver spec wave-6 |
| 17 | Features excessivas uso pessoal | ⏳ Avaliação pendente — ver spec wave-6 |
| 18 | FK ausente em parentDocumentId | ✅ `foreignKey()` self-referential |
| 19 | DELETE route ausente | ✅ `DELETE /api/documents/:id` adicionado |
| 20 | SSRF GitHub/Jira | ✅ Regex de validação aplicada |

## Wave 3 — Inovações (14/07/2026)
| # | Feature | Status |
|---|---------|--------|
| I1 | Markdown Preview split pane | ✅ ResizablePanelGroup no PreviewModal |
| I2 | Smart Auto-Tagging | ✅ Rota `/api/ai/suggest-tags` + botão no input |
| I3 | Document Chaining | ✅ Rotas `/api/ai/chain-document` + UI na sidebar |

## Pendentes para Waves 4-6
Ver specs em `.kiro/specs/`
