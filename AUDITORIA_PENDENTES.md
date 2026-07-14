# Itens de Auditoria Não Abordados

**Data**: 14/07/2026
**Contexto**: Este documento registra os itens que **não foram corrigidos** nas rodadas 1 e 2 de auditoria, com a justificativa de cada decisão. Serve de base para a rodada 3.

---

## Rodada 1 — Itens Pendentes

### Crítico 4 — God Object `routes.ts` (~3.434 linhas)

**Por que não foi corrigido:**
Refatoração estrutural de alto risco. O arquivo concentra templates de documentos, schemas Zod, renderizadores markdown, toda a orquestração de IA e 15+ handlers de rota. Desmembrar isso sem cobertura de testes de integração nas rotas é receita para regressão silenciosa — uma rota pode parar de funcionar sem o compilador avisar. A estrutura de destino sugerida na auditoria é boa, mas requer:

1. Mapeamento completo de todas as dependências internas do arquivo (funções chamando funções, closures compartilhando estado)
2. Testes de integração nas rotas principais **antes** de mover qualquer coisa
3. Migração incremental por domínio, não big-bang

**Risco se deixado:** Qualquer mudança em templates pode quebrar handlers. Intr testável como unidade. Mantém débito técnico crescendo.

**Pré-requisito para atacar:** Ter pelo menos testes de smoke nas rotas `/api/generate-document`, `/api/documents` CRUD e `/api/external/generate` antes de tocar na estrutura.

---

## Rodada 2 — Itens Pendentes

### Issue 6 — Ausência de Autenticação nas Rotas CRUD

**Por que não foi corrigido:**
Adicionar autenticação requer uma decisão de produto que não cabe ao auditor tomar: qual modelo de auth? As opções têm trade-offs distintos:

- **API Key por header** (mais simples para uso pessoal/agentes) — consistente com o `/api/external/generate` já existente
- **Session/Cookie** — as dependências `passport`, `express-session`, `connect-pg-simple` já estão no `package.json`, mas nunca foram configuradas
- **JWT** — stateless, mas adiciona complexidade desnecessária para app pessoal

Implementar o modelo errado cria mais débito. O dono do projeto precisa decidir qual é o modelo antes de implementar.

**Risco se deixado:** Qualquer pessoa com acesso à rede pode ler, criar e modificar todos os documentos. Em ambiente local (Replit free tier com URL pública) isso é crítico.

**Para resolver na rodada 3:** Decidir entre API Key simples (recomendado para uso pessoal) ou session, então implementar como middleware único aplicado em `app.use("/api/", authMiddleware)` com exceções para `/api/share/:token` (pública) e `/api/external/generate` (já tem sua própria auth).

---

### Issue 11 — Puppeteer importado e ~300MB de Chromium

**Por que não foi corrigido:**
O relatório afirmava que "a geração de PDF já usa abordagem diferente (docx library)" e que Puppeteer não seria usado. Isso estava **incorreto** — Puppeteer está ativamente em uso na rota `GET /api/documents/:id/download/pdf` (corrigida na rodada 1 com `try/finally`). Remover seria uma regressão.

**Status real:** Puppeteer é necessário. O item da auditoria partiu de premissa errada. Sem ação necessária.

---

### Issue 13 — Dependências Não Utilizadas no `package.json`

**Por que não foi corrigido:**
Remoção de dependências tem risco não-óbvio: algumas podem ser `peerDependencies` de outras, ou ser importadas dinamicamente em caminhos não cobertos por busca estática. Requer verificação manual criteriosa antes de remover cada uma.

**Lista para revisar na rodada 3:**

| Pacote | Evidência de não-uso | Risco de remoção |
|--------|----------------------|------------------|
| `react-icons` | Zero imports encontrados | Baixo |
| `framer-motion` | Zero imports encontrados | Baixo |
| `passport` + `passport-local` | Auth nunca configurada | Médio — verificar se express-session depende |
| `connect-pg-simple` | Session não utilizada | Médio |
| `memorystore` | Session não utilizada | Médio |
| `express-session` | Session não utilizada | Médio — remover só se decidir não usar session (ver Issue 6) |
| `ws` | WebSocket não encontrado | Baixo — verificar se vite dev server usa |
| `@jridgewell/trace-mapping` | Dependência transitiva acidental | Não remover — gerenciado pelo npm |

**Processo recomendado:** remover um por vez, rodar build + testes, confirmar antes do próximo.

---

### Issue 14 — ~27 Componentes shadcn/ui Não Utilizados

**Por que não foi corrigido:**
Impacto em bundle size é real mas mitigado pelo tree-shaking do Vite — componentes não importados não entram no bundle de produção. O custo de remoção (verificar cada arquivo, garantir que nenhum é importado dinamicamente ou via barrel export) supera o benefício em app pessoal.

**Recomendação:** Deixar como está. Se bundle size se tornar problema, rodar `vite-bundle-visualizer` para confirmar antes de investir tempo.

---

### Issue 16 — ~154 `console.log` sem Usar Logger Estruturado

**Por que não foi corrigido:**
Mudança puramente cosmética/operacional. Não afeta corretude, segurança ou performance. O `Logger` estruturado existe e funciona — adotá-lo em todo o código é uma refatoração de baixo risco mas alto volume (154 ocorrências).

**Para resolver na rodada 3 (opcional):** Fazer um `find-and-replace` guiado, substituindo `console.log` por `logger.info`, `console.error` por `logger.error`, etc. Pode ser feito incrementalmente por arquivo.

---

### Issue 17 — Features Desnecessárias para Uso Pessoal

**Por que não foi corrigido:**
São decisões de produto, não bugs técnicos. Cada feature listada foi construída intencionalmente:

| Feature | Avaliação |
|---------|-----------|
| Rate limiting 3-tier | Útil mesmo para 1 usuário — protege contra loops acidentais de agentes |
| Cache semântico cosine similarity | O(n) é problema só acima de milhares de entradas. Para uso pessoal, ok |
| Model routing FREE/PRO/ENTERPRISE | Código morto funcional — remover se nunca for usar |
| Suite de evals | Útil para monitorar qualidade da IA ao longo do tempo |
| GitHub repo context fetcher | Avaliar se está em uso ativo |
| GitHub Issue push | Em uso, validado na rodada 2 |
| Jira Issue/Epic push | Em uso, validado na rodada 2 |

**Ação pendente:** Verificar se `model routing` baseado em plano (`X-User-Plan: free/pro/enterprise`) ainda faz sentido e se pode ser simplificado para um único modelo.

---

## Resumo de Prioridade para Rodada 3

| Prioridade | Item | Esforço estimado |
|-----------|------|-----------------|
| 🔴 Alta | **Issue 6** — Definir e implementar autenticação nas rotas CRUD | Médio (2-4h) |
| 🟡 Média | **Crítico 4** — Iniciar desmembramento de `routes.ts` com testes primeiro | Alto (1-2 dias) |
| 🟡 Média | **Issue 13** — Remover dependências não utilizadas confirmadas (`react-icons`, `framer-motion`) | Baixo (30min) |
| 🟢 Baixa | **Issue 16** — Migrar `console.log` para `logger` estruturado | Médio (mecânico) |
| 🟢 Baixa | **Issue 17** — Simplificar ou remover model routing por plano | Baixo |
| ✅ Não fazer | **Issue 14** — Remover componentes shadcn não usados | Custo > benefício |
| ✅ Não fazer | **Issue 11** — Remover Puppeteer | Premissa errada — está em uso |
