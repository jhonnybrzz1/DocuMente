# DocuMente - Plataforma de Documentação de Produtos

## 🎯 Visão Geral

**DocuMente** é uma plataforma de geração automática de documentação de produtos usando Inteligência Artificial. Transforme suas ideias e requisitos em documentos profissionais e estruturados em segundos, refine com IA conversacional, avalie a qualidade automaticamente e compartilhe via link público — tudo em um só lugar.

### Por que usar o DocuMente?

- ⚡ **Rápido**: Gere documentos completos em segundos
- 🎨 **Profissional**: Documentos formatados em Word (.docx), PDF, Markdown e texto
- 🤖 **Inteligente**: IA via OpenRouter pra gerar, refinar, resumir, expandir, traduzir e validar
- 📚 **Versátil**: 9 tipos de documentos (PRD, Épico, User Stories, Roadmap, etc.)
- 🔒 **Seguro**: API key configurada apenas no servidor (não exposta no frontend)
- 💾 **Histórico + versões**: Toda edição cria uma versão; compare diffs e restaure
- 🔗 **Compartilhável**: Link público read-only, revogável a qualquer momento
- 📊 **Métricas**: Dashboard de estatísticas com tempo economizado e top tags

---

## ✨ Funcionalidades

### Geração de documentos
- ✅ 9 tipos de documentos profissionais com templates especializados
- ✅ Auto-sugestão de título com IA (5 sugestões clicáveis)
- ✅ Tags customizadas com filtro rápido na sidebar
- ✅ Upload de arquivos (PDF, DOCX, XLSX, PPTX, CSV, TXT) como contexto
- ✅ Preview interativo antes de gerar
- ✅ Export em Word (.docx), PDF, Markdown e texto

### Refinamento com IA
- ✅ **Ações rápidas no editor**: Resumir, Expandir, Reescrever, Corrigir gramática, Traduzir EN, Validar INVEST
  - Funciona em trecho selecionado ou no documento inteiro
  - Botão de **Desfazer** pra reverter ações
- ✅ **Chat de refinamento**: conversa iterativa pra ajustar o doc ("encurte", "adicione exemplos", "mude o tom")
  - IA propõe novo conteúdo; você aplica com 1 clique
- ✅ **Score de qualidade**: avaliação 0-100 com dimensões específicas por tipo de documento + sugestões concretas

### Histórico e colaboração
- ✅ Histórico com busca, filtro por tipo e por tags
- ✅ **Versionamento automático**: cada edição cria uma versão
- ✅ **Diff visual** entre versões com markup verde/vermelho (LCS line-by-line)
- ✅ **Compartilhamento via link público**: gere/revogue token único, página read-only em `/share/:token`
- ✅ Favoritos persistidos no navegador

### Insights
- ✅ **Dashboard `/stats`**: KPIs (total, semana, mês, compartilhados, tempo economizado), gráfico pizza por tipo, evolução mensal, top tags
- ✅ Frequência semanal estimada e tamanho médio dos documentos

### Plataforma
- ✅ Dark mode (next-themes)
- ✅ Interface responsiva mobile-first
- ✅ Rate limiting nas APIs sensíveis
- ✅ API key gerenciada apenas no servidor

---

## 🛠️ Tecnologias

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **TailwindCSS** + **shadcn/ui** + **Radix UI**
- **TanStack Query** — gerenciamento de estado servidor
- **Wouter** — roteamento leve
- **Recharts** — gráficos do dashboard
- **DOMPurify** + **marked** — render seguro de markdown

### Backend
- **Node.js** + **Express** + **TypeScript**
- **Drizzle ORM** sobre PostgreSQL (Neon ou local)
- **Fallback em memória** quando `DATABASE_URL` não está configurado
- **docx** — geração de Word
- **puppeteer** — geração de PDF com template profissional
- **express-rate-limit** — proteção de endpoints

### IA
- **OpenRouter** com modelo padrão `deepseek/deepseek-flash`
- API key apenas no servidor (`OPENROUTER_API_KEY`)
- Endpoints especializados: `/api/ai/suggest-title`, `/quick-action`, `/chat`, `/quality-score`

---

## 📦 Instalação

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta na [OpenRouter](https://openrouter.ai) (chave API)
- (Opcional) PostgreSQL local ou conta no [Neon](https://neon.tech)

### Clonar e instalar

```bash
git clone https://github.com/jhonnybrzz1/DocuMente.git
cd DocuMente
npm install
```

---

## ⚙️ Configuração

### 1. Variáveis de ambiente

Crie um `.env` na raiz:

```env
# OpenRouter (obrigatório)
OPENROUTER_API_KEY=sua_chave_openrouter_aqui

# Modelo (opcional)
OPENROUTER_MODEL=deepseek/deepseek-flash

# Provider routing (opcional - defaults otimizados via análise da skill openrouter-models)
# DeepInfra: 493ms p50 latência · 99.5% uptime
# SiliconFlow estava degradado (37% uptime) durante a análise
OPENROUTER_PREFERRED_PROVIDERS=DeepInfra
OPENROUTER_IGNORED_PROVIDERS=SiliconFlow
OPENROUTER_ALLOW_FALLBACKS=true
# Use "none" pra desabilitar cada lista. Ex: OPENROUTER_PREFERRED_PROVIDERS=none

# URL pública (usada nos headers da OpenRouter)
APP_URL=http://localhost:5000

# Database (opcional - usa in-memory se não configurado)
DATABASE_URL=postgresql://usuario:senha@host/database

# Porta do servidor (opcional, default 5000)
PORT=5000

# Ambiente
NODE_ENV=development
```

### 2. Obter chave da OpenRouter

1. Acesse [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys)
2. Crie uma conta ou faça login
3. Gere uma nova chave e cole no `.env`

### 3. Database (opcional, mas recomendado)

Por padrão usa armazenamento em memória (dados perdidos ao reiniciar). Pra persistência:

```bash
# Configure DATABASE_URL no .env
npm run db:push
```

A migração cria as tabelas `documents`, `document_versions` e `api_keys`.

---

## 🚀 Uso

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start

# Verificar tipos
npm run check
```

Acesse `http://localhost:5000`

---

## 📄 Tipos de Documentos

| Tipo | Descrição |
|------|-----------|
| 📄 **PRD** | Product Requirements Document |
| 📘 **Épico** | Hipótese testável + story map |
| 🧩 **User Stories** | Mike Cohn + Gherkin + INVEST |
| 🗓️ **Roadmap** | Now / Next / Later orientado a outcomes |
| 🚀 **Release Note** | Notas de versão |
| 🎯 **Pitch** | Pitch executivo de produto |
| ⚙️ **Tech Spec** | Especificação técnica |
| 🧪 **Test Plan** | Plano de testes |
| 📡 **API Doc** | Documentação de API |

---

## 🏗️ Arquitetura

```
DocuMente/
├── client/                       # Frontend React
│   └── src/
│       ├── components/
│       │   ├── ai-quick-actions.tsx       # Dropdown de ações de IA
│       │   ├── refine-chat.tsx            # Chat de refinamento
│       │   ├── quality-score-panel.tsx    # Score 0-100 por dimensões
│       │   ├── share-dialog.tsx           # Compartilhamento público
│       │   ├── tag-input.tsx              # Tags com chips
│       │   ├── version-history-modal.tsx  # Histórico + diff visual
│       │   └── ...
│       └── pages/
│           ├── home.tsx
│           ├── templates.tsx
│           ├── stats.tsx                  # Dashboard de métricas
│           └── share.tsx                  # Página pública /share/:token
├── server/
│   ├── index.ts
│   ├── routes.ts                          # Rotas legadas + geração
│   ├── routes/
│   │   ├── upload.ts                      # Upload e extração de arquivos
│   │   ├── ai.ts                          # Endpoints de IA (suggest-title, quick-action, chat, quality-score)
│   │   └── documents-extra.ts             # Meta, share, stats, versions
│   ├── services/
│   │   ├── openrouter.ts                  # Wrapper centralizado pra OpenRouter
│   │   └── file-processor.ts              # Extração de PDF/DOCX/XLSX/PPTX/CSV
│   ├── pdfTemplate.ts                     # Templates de PDF profissionais
│   └── storage.ts                         # IStorage + DatabaseStorage + MemStorage
├── shared/
│   └── schema.ts                          # Drizzle + Zod schemas
└── ...
```

---

## 🔧 API Endpoints

### Geração

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/preview-document` | Gera preview sem salvar |
| `POST` | `/api/generate-document` | Gera, salva, retorna doc com `id` |
| `GET`  | `/api/documents/:id/download` | Baixa Word (.docx) |
| `GET`  | `/api/documents/:id/download/pdf` | Baixa PDF |
| `GET`  | `/api/documents/:id/download/markdown` | Baixa Markdown |
| `GET`  | `/api/documents/:id/download/text` | Baixa texto plano |

### IA (refinamento e análise)

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/ai/suggest-title` | Sugere 5 títulos baseados na demanda |
| `POST` | `/api/ai/quick-action` | Aplica ação (resumir, expandir, reescrever, etc.) num texto |
| `POST` | `/api/ai/chat` | Chat de refinamento com histórico de conversa |
| `POST` | `/api/ai/quality-score` | Score 0-100 + dimensões + sugestões |

### Documentos e metadata

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET`    | `/api/documents` | Lista (suporta `?search=`, `?type=`, `?tags=tag1,tag2`) |
| `GET`    | `/api/documents/:id` | Recupera documento |
| `PUT`    | `/api/documents/:id` | Atualiza conteúdo (cria versão automaticamente) |
| `PATCH`  | `/api/documents/:id/meta` | Atualiza título, tags, parentDocumentId |
| `GET`    | `/api/documents/:id/versions` | Lista versões |
| `GET`    | `/api/documents/:id/generate-prompt` | Gera prompt pra usar em outras IAs |

### Compartilhamento público

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST`   | `/api/documents/:id/share` | Cria/regenera token de compartilhamento |
| `DELETE` | `/api/documents/:id/share` | Revoga token |
| `GET`    | `/api/share/:token` | **Público** — retorna documento read-only |

### Estatísticas

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/stats` | Total, por tipo, por mês, top tags, tempo economizado |

---

## 🔐 Segurança da API Key

A chave da OpenRouter **NÃO** é solicitada no frontend. Toda chamada à IA passa pelo backend:

```
Frontend (sem chave)
    ↓
Backend (lê OPENROUTER_API_KEY do .env)
    ↓
OpenRouter API
```

**Benefícios:**
- ✅ API key nunca exposta no navegador
- ✅ Logs e auditoria centralizados
- ✅ Rate limit controlado pelo servidor
- ✅ Você controla o uso

---

## 🌐 Deploy

Configure as variáveis de ambiente em qualquer plataforma:

```env
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=deepseek/deepseek-flash
APP_URL=https://seu-dominio.com
NODE_ENV=production
DATABASE_URL=...   # recomendado em produção
PORT=5000
```

### Render.com (recomendado)
1. Crie um Web Service conectado ao repositório
2. Configure as variáveis de ambiente
3. Build: `npm run build` · Start: `npm start`

### Outras opções
- **Vercel**: `vercel --prod`
- **Railway**: `railway up`
- **Docker**: `docker build -t documente . && docker run -p 5000:5000 -e OPENROUTER_API_KEY=... documente`

---

## 🧪 Verificação local

```bash
# Type check
npm run check

# Build de produção
npm run build

# Smoke test com servidor rodando
curl http://localhost:5000/api/stats
curl http://localhost:5000/api/documents
```

---

## 🐛 Problemas conhecidos

### "API key is not configured"
Verifique se `OPENROUTER_API_KEY` está no `.env` e se o servidor foi reiniciado após colocar a chave.

### Documentos somem ao reiniciar
Você está em modo MemStorage. Configure `DATABASE_URL` no `.env` e rode `npm run db:push`.

### Score de qualidade não aparece
O endpoint depende da OpenRouter. Confira o console do servidor pra erros — pode ser timeout ou rate limit.

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/MinhaFeature`
3. Commit: `git commit -m 'feat: adiciona MinhaFeature'`
4. Push: `git push origin feature/MinhaFeature`
5. Abra um Pull Request

**Nunca** commite arquivos `.env`.

---

## 📝 Changelog

### v2.0 — Refinamento com IA, tags, compartilhamento e diff
- ✅ Auto-sugestão de título com IA
- ✅ Ações rápidas no editor (Resumir, Expandir, Reescrever, Corrigir, Traduzir, Validar INVEST)
- ✅ Chat de refinamento conversacional com aplicação direta de mudanças
- ✅ Score de qualidade 0-100 com dimensões específicas por tipo
- ✅ Tags customizadas com filtros rápidos no histórico
- ✅ Compartilhamento via link público read-only
- ✅ Página `/stats` com dashboard de métricas
- ✅ Versionamento automático em cada edição
- ✅ Diff visual entre versões (LCS line-by-line)
- ✅ Schema atualizado: `tags`, `parentDocumentId`, `shareToken`, `qualityScore`, `updatedAt`, tabela `document_versions`

### v1.0 — Stable
- ✅ Geração de 9 tipos de documentos
- ✅ Export em Word, PDF, Markdown, texto
- ✅ Histórico com busca
- ✅ API key apenas no servidor
- ✅ Dark mode + interface responsiva

---

## 📄 Licença

MIT — veja [LICENSE](LICENSE).

---

## 👤 Autor

**Jonathan Alves** · GitHub: [@jhonnybrzz1](https://github.com/jhonnybrzz1)

---

<div align="center">

**Feito com ❤️ e IA**

[Reportar bug](https://github.com/jhonnybrzz1/DocuMente/issues) · [Solicitar feature](https://github.com/jhonnybrzz1/DocuMente/issues)

</div>
