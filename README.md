# DocuMente - Plataforma de Documentação de Produtos

## 🎯 Visão Geral

**DocuMente** é uma plataforma de geração automática de documentação de produtos usando Inteligência Artificial. Transforme suas ideias e requisitos em documentos profissionais e estruturados em segundos, utilizando a API da OpenAI.

### Por que usar o DocuMente?

- ⚡ **Rápido**: Gere documentos completos em segundos
- 🎨 **Profissional**: Documentos formatados em Word (.docx) prontos para uso
- 🤖 **Inteligente**: Utiliza IA avançada da OpenAI para criar conteúdo estruturado
- 📚 **Versátil**: 9 tipos de documentos diferentes
- 🔒 **Seguro**: API key configurada apenas no servidor (não exposta no frontend)
- 💾 **Histórico**: Acompanhe todos os documentos gerados

---

## ✨ Funcionalidades

- ✅ Geração de documentos com IA (OpenAI)
- ✅ 9 tipos de documentos suportados
- ✅ Export em formato Word (.docx) profissional
- ✅ Histórico de documentos com busca
- ✅ Preview antes de gerar
- ✅ Interface moderna e responsiva
- ✅ API key gerenciada no servidor (segurança)
- ✅ Formatação automática com estilos profissionais

---

## 🛠️ Tecnologias

### Frontend
- **React 18** - Framework UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **TailwindCSS** - Estilização
- **shadcn/ui** - Componentes UI
- **Radix UI** - Primitivas acessíveis
- **React Query** - Gerenciamento de estado servidor
- **Wouter** - Roteamento leve

### Backend
- **Node.js** - Runtime
- **Express** - Framework web
- **TypeScript** - Tipagem estática
- **Drizzle ORM** - ORM type-safe
- **Neon Database** - PostgreSQL serverless
- **docx** - Geração de documentos Word

### IA
- **OpenAI** - Modelo de linguagem
- **Modelo**: `gpt-5.4-nano`
- **API configurada no servidor** - Maior segurança
- **Especializado** em documentação de produtos

---

## 📦 Instalação

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta na [OpenAI Platform](https://platform.openai.com) (para chave API)
- Conta no [Neon Database](https://neon.tech) (opcional, para produção)

### Clone o repositório

```bash
git clone https://github.com/jhonnybrzz1/DocuMente.git
cd DocuMente
```

### Instale as dependências

```bash
npm install
```

---

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# OpenAI API Key (obrigatório)
OPENAI_API_KEY=sua_chave_openai_aqui

# Database (opcional - usa in-memory se não configurado)
DATABASE_URL=postgresql://usuario:senha@host/database

# Porta do servidor (opcional)
PORT=5000

# Ambiente
NODE_ENV=development
```

### 2. Obter Chave da OpenAI

1. Acesse [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Crie uma conta ou faça login
3. Vá em **API Keys**
4. Crie uma nova chave
5. Copie e cole no arquivo `.env`

### 3. Database (Opcional)

Por padrão, o projeto usa armazenamento em memória. Para persistência:

```bash
# Configure DATABASE_URL no .env
# Execute as migrações
npm run db:push
```

---

## 🚀 Uso

### Desenvolvimento

```bash
# Inicia o servidor de desenvolvimento
npm run dev
```

Acesse: `http://localhost:5000`

### Produção

```bash
# Build do projeto
npm run build

# Inicia o servidor de produção
npm start
```

### Verificar tipos

```bash
npm run check
```

---

## 🔐 Segurança da API Key

### Como funciona

**IMPORTANTE**: A chave da API OpenAI **NÃO é solicitada no frontend**. Esta é uma medida de segurança importante.

#### Configuração Segura

1. **Servidor**: A API key é configurada via variável de ambiente `OPENAI_API_KEY`
2. **Frontend**: Não tem acesso direto à chave
3. **Requisições**: Todas as chamadas à OpenAI são feitas pelo backend
4. **Proteção**: A chave nunca é exposta ao navegador do usuário

#### Fluxo de Segurança

```
┌─────────────┐
│  Frontend   │  (Não possui API key)
│   React     │
└──────┬──────┘
       │
       │ POST /api/preview-document
       │ POST /api/generate-document
       │
┌──────▼──────┐
│   Backend   │  (Possui API key no .env)
│   Express   │
└──────┬──────┘
       │
       │ Usa OPENAI_API_KEY
       │
┌──────▼──────┐
│   OpenAI    │
│     API     │
└─────────────┘
```

### Benefícios desta Abordagem

✅ **Segurança**: API key nunca exposta no código do cliente
✅ **Controle**: Todas as requisições passam pelo seu servidor
✅ **Custo**: Você controla o uso da API
✅ **Auditoria**: Logs centralizados no servidor

---

## 📄 Tipos de Documentos

O DocuMente suporta 9 tipos de documentos profissionais:

| Tipo | Descrição | Uso |
|------|-----------|-----|
| 📄 **PRD** | Product Requirements Document | Especificação completa de produto |
| 📘 **Epic** | Documentação de Épico | Grandes funcionalidades e objetivos |
| 🧩 **User Stories** | Histórias de Usuário | Requisitos do ponto de vista do usuário |
| 🗓️ **Roadmap** | Cronograma de Produto | Planejamento de entregas |
| 🚀 **Release Notes** | Notas de Versão | Comunicação de novas features |
| 🎯 **Pitch** | Pitch de Produto | Apresentação executiva (1 slide) |
| ⚙️ **Tech Spec** | Especificação Técnica | Detalhes de implementação |
| 🧪 **Test Plan** | Plano de Testes | Estratégia de qualidade |
| 📡 **API Doc** | Documentação de API | Especificação de APIs |

---

## 🏗️ Arquitetura

```
DocuMente/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── pages/         # Páginas
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilitários
│   │   └── main.tsx       # Entry point
│   └── index.html         # HTML template
├── server/                 # Backend Node.js
│   ├── index.ts           # Servidor Express
│   ├── routes.ts          # Rotas da API
│   └── storage.ts         # Camada de dados
├── shared/                 # Código compartilhado
│   └── schema.ts          # Schemas Zod
├── .env                    # Variáveis de ambiente (não commitar!)
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### Fluxo de Dados

```
┌─────────────┐
│   Cliente   │
│   (React)   │
└──────┬──────┘
       │
       │ POST /api/preview-document
       │ POST /api/generate-document
       │
┌──────▼──────┐
│   Express   │ ← OPENAI_API_KEY (env)
│   Routes    │
└──────┬──────┘
       │
       │ Valida e processa
       │
┌──────▼──────┐
│   OpenAI    │
│     API     │
└──────┬──────┘
       │
       │ Gera conteúdo
       │
┌──────▼──────┐
│   Storage   │
│  (Memory/DB)│
└──────┬──────┘
       │
       │ Word Document
       │
┌──────▼──────┐
│   Download  │
│    (.docx)  │
└─────────────┘
```

---

## 🌐 Deploy

### Variáveis de Ambiente Necessárias

Em **qualquer plataforma de deploy**, configure:

```env
OPENAI_API_KEY=sua_chave_aqui
NODE_ENV=production
DATABASE_URL=sua_url_do_banco (opcional)
```

### Render.com (Recomendado)

1. Crie um novo **Web Service**
2. Conecte seu repositório GitHub
3. Configure as variáveis de ambiente
4. Deploy automático!

### Vercel

```bash
npm i -g vercel
vercel --prod
```

### Railway

```bash
railway up
```

### Docker

```bash
docker build -t documente .
docker run -p 5000:5000 -e OPENAI_API_KEY=sua_chave documente
```

---

## 🔧 API Endpoints

### POST `/api/preview-document`

Gera preview do documento sem salvar.

**Body:**
```json
{
  "type": "prd",
  "demand": "Sistema de autenticação com login social"
}
```

**Response:**
```json
{
  "content": "📄 **PRD**...",
  "title": "Sistema de autenticação..."
}
```

### POST `/api/generate-document`

Gera e salva documento, retorna .docx

**Body:**
```json
{
  "type": "userstories",
  "demand": "Carrinho de compras com cupons"
}
```

**Response:** Arquivo `.docx` para download

### GET `/api/documents`

Lista todos os documentos gerados

**Response:**
```json
[
  {
    "id": 1,
    "title": "Sistema de autenticação",
    "type": "prd",
    "content": "...",
    "originalDemand": "...",
    "createdAt": "2025-11-05T10:30:00.000Z"
  }
]
```

---

## 🐛 Problemas Conhecidos

### API Key não encontrada

**Sintoma**: Erro "API key is not configured"

**Solução**: Verifique se `OPENAI_API_KEY` está no arquivo `.env` ou nas variáveis de ambiente do servidor

### Documentos não persistem

**Sintoma**: Documentos desaparecem ao reiniciar

**Solução**: Configure `DATABASE_URL` no `.env` e execute `npm run db:push`

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

### Diretrizes

- Siga o estilo de código existente
- Adicione testes quando aplicável
- Atualize a documentação
- Faça commits semânticos
- **Nunca commite arquivos `.env`**

---

## 📝 Changelog

### Versão Atual (Stable)
- ✅ API key gerenciada apenas no servidor (segurança)
- ✅ Interface sem campo de API key
- ✅ 9 tipos de documentos suportados
- ✅ Geração de documentos Word profissionais
- ✅ Histórico de documentos

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👤 Autor

**Jonathan Alves**
- GitHub: [@jhonnybrzz1](https://github.com/jhonnybrzz1)
- Email: jose.jonathan@hotmail.com

---

## 🙏 Agradecimentos

- [OpenAI](https://platform.openai.com) - API de IA
- [shadcn/ui](https://ui.shadcn.com) - Componentes UI
- [Neon](https://neon.tech) - Database PostgreSQL

---

## ⚠️ Notas Importantes

### Segurança

- ❌ **NUNCA** commite o arquivo `.env`
- ❌ **NUNCA** exponha a `OPENAI_API_KEY` no frontend
- ✅ **SEMPRE** configure a chave via variável de ambiente
- ✅ **SEMPRE** valide entradas do usuário no backend

### Produção

- Configure `DATABASE_URL` para persistência
- Use HTTPS
- Configure rate limiting
- Monitore custos da API OpenAI
- Faça backup regular do banco de dados

---

<div align="center">

**Feito com ❤️ e IA**

Se este projeto foi útil, considere dar uma ⭐!

[Reportar Bug](https://github.com/jhonnybrzz1/DocuMente/issues) • [Solicitar Feature](https://github.com/jhonnybrzz1/DocuMente/issues)

</div>
