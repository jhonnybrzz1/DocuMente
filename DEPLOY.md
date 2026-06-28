# 🚀 Guia de Deploy - DocuMente

## Deploy no Render.com

### Passo 1: Preparar o Repositório

1. Certifique-se de que o código está commitado e pushed:
```bash
git add .
git commit -m "Preparar para deploy"
git push origin main
```

### Passo 2: Configurar no Render

1. Acesse [render.com](https://render.com)
2. Faça login ou crie uma conta
3. Clique em **"New +"** → **"Web Service"**
4. Conecte seu repositório GitHub
5. Selecione o repositório `DocuMente`

### Passo 3: Configurar o Build

Configure da seguinte forma:

- **Name**: `documente` (ou o nome que preferir)
- **Environment**: `Node`
- **Region**: Escolha a região mais próxima
- **Branch**: `backup-before-rollback-main` (ou `main`)
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### Passo 4: ⚠️ IMPORTANTE - Configurar Variáveis de Ambiente

**Este é o passo mais crítico!**

Na seção **Environment Variables**, adicione:

| Key | Value | Descrição |
|-----|-------|-----------|
| `OPENROUTER_API_KEY` | `sua_chave_completa_aqui` | **OBRIGATÓRIO** - Chave da API OpenRouter |
| `OPENROUTER_MODEL` | `google/gemma-4-31b-it` | Modelo Gemma usado via OpenRouter |
| `NODE_ENV` | `production` | Ambiente de produção |
| `PORT` | `5000` | Porta (opcional, Render usa 10000 por padrão) |
| `DATABASE_URL` | `postgresql://...` | Opcional - Para persistência de dados |

#### Como obter a chave da OpenRouter:

1. Acesse [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys)
2. Faça login ou crie uma conta
3. Vá em **Keys**
4. Clique em **"Create key"**
5. Copie a chave COMPLETA
6. Cole no campo `OPENROUTER_API_KEY` no Render

**IMPORTANTE**:
- A chave deve ser colada COMPLETA, sem truncar
- A chave geralmente tem este formato: `abc123def456ghi789jkl012mno345pqr678stu901vwx234`
- Verifique se não há espaços no início ou fim

### Passo 5: Deploy

1. Clique em **"Create Web Service"**
2. Aguarde o build e deploy (3-5 minutos)
3. Acesse a URL fornecida pelo Render

---

## ✅ Verificar se o Deploy Funcionou

### 1. Verificar Logs

No painel do Render, vá em **Logs** e procure por:

```
✅ BOM: serving on port 10000
✅ BOM: [express] GET /api/api-keys/active 200
```

```
❌ RUIM: WARNING: OPENROUTER_API_KEY is not set
❌ RUIM: Error: OpenRouter API Error: 401 - {"error": ...}
```

### 2. Testar API Key

Abra o browser e acesse:
```
https://seu-app.onrender.com/api/api-keys/active
```

**Resposta esperada:**
```json
{
  "configured": true,
  "provider": "OpenRouter",
  "model": "google/gemma-4-31b-it",
  "mistralKey": "abc12345...xyz9"
}
```

Se `configured: false`, a chave não está configurada!

### 3. Testar Geração de Documento

1. Abra o site
2. Digite uma demanda de teste
3. Selecione um tipo de documento
4. Clique em "Gerar Preview"
5. Se funcionar, clique em "Gerar Documento"

---

## 🐛 Resolver Problemas Comuns

### Erro 401 Unauthorized

**Sintoma**:
```
Generate document error: Error: OpenRouter API Error: 401 - {"error": ...}
```

**Causas Possíveis**:

1. ❌ **Chave não configurada**
   - Solução: Adicione `OPENROUTER_API_KEY` nas variáveis de ambiente

2. ❌ **Chave truncada/incompleta**
   - Solução: Verifique se a chave completa foi copiada
   - A chave deve estar completa, exatamente como gerada

3. ❌ **Chave inválida ou expirada**
   - Solução: Gere uma nova chave no dashboard da OpenRouter

4. ❌ **Build antigo sendo usado**
   - Solução: Force um novo deploy
   - No Render: **Manual Deploy** → **Deploy latest commit**

### Verificar Variável de Ambiente

No Render, vá em:
1. **Environment** (menu lateral)
2. Procure por `OPENROUTER_API_KEY`
3. Clique em "👁️" para revelar o valor
4. Verifique se está completo (não deve terminar em "...")

### Rebuild Forçado

Se as variáveis estão corretas mas ainda não funciona:

1. Vá em **Manual Deploy**
2. Clique em **"Clear build cache & deploy"**
3. Aguarde o novo build

---

## 🔄 Atualizar Deploy Após Mudanças

Quando você fizer alterações no código:

1. **Commit e Push**:
```bash
git add .
git commit -m "Sua mensagem"
git push origin backup-before-rollback-main
```

2. **Deploy Automático**:
   - O Render detecta automaticamente e faz o deploy
   - Aguarde 3-5 minutos

3. **Deploy Manual** (se necessário):
   - No painel do Render
   - **Manual Deploy** → **Deploy latest commit**

---

## 📊 Monitorar a Aplicação

### Logs em Tempo Real

No painel do Render:
1. Vá em **Logs**
2. Ative **Auto-scroll**
3. Monitore requisições e erros

### Métricas

1. **Events**: Histórico de deploys
2. **Metrics**: CPU, Memória, Requisições
3. **Shell**: Terminal para debug (plano pago)

---

## 💰 Custos

### Plano Free (Gratuito)

- ✅ 750 horas/mês grátis
- ⚠️ "Dorme" após 15min de inatividade (cold start ~50s)
- ⚠️ Limitado a 1 instância

### Plano Starter ($7/mês)

- ✅ Sem cold starts
- ✅ Sempre ativo
- ✅ Mais memória e CPU

---

## 🔐 Segurança em Produção

### Checklist de Segurança

- [x] `OPENROUTER_API_KEY` configurada como variável de ambiente
- [x] Arquivo `.env` está no `.gitignore`
- [x] Nunca commitar chaves no código
- [x] HTTPS ativado (automático no Render)
- [x] Validação de inputs no backend
- [x] Rate limiting configurado

---

## 🆘 Suporte

### Logs de Erro

Se o deploy falhar, verifique os logs:

1. **Build Logs**: Erros durante `npm install` ou `npm run build`
2. **Deploy Logs**: Erros ao iniciar o servidor
3. **Runtime Logs**: Erros durante execução

### Comandos de Debug

No terminal local, teste o build:

```bash
# Simular build de produção
npm run build

# Testar build
npm start

# Verificar tipos
npm run check
```

---

## ✅ Deploy Bem-Sucedido

Você saberá que funcionou quando:

1. ✅ Build completa sem erros
2. ✅ Servidor inicia: `serving on port 10000`
3. ✅ Site carrega no navegador
4. ✅ API key está configurada: `/api/api-keys/active` retorna `configured: true`
5. ✅ Preview de documento funciona
6. ✅ Download de documento funciona

---

## 📚 Recursos Adicionais

- [Documentação do Render](https://render.com/docs)
- [OpenRouter Docs](https://openrouter.ai/docs)
- [Troubleshooting Render](https://render.com/docs/troubleshooting)

---

**Última atualização**: Novembro 2025
