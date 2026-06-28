# 🔌 API do DocuMente (Integração Headless para Agentes e Automações)

O **DocuMente** oferece uma API REST externa e protegida para que agentes de IA autônomos (Telegram bots, Slack bots, instâncias de agentes locais), plataformas no-code (n8n, Make, LangFlow) ou scripts externos possam gerar especificações de produtos (PRD, Épicos, Stories, etc.) programaticamente.

---

## 🔐 Autenticação

Para realizar chamadas na API pública, você deve fornecer a chave de acesso no cabeçalho HTTP da requisição.

* **Cabeçalho:** `X-API-Key` ou via Token Bearer `Authorization: Bearer <SUA_CHAVE>`
* **Chave Padrão (Ambiente de Dev):** `documente_dev_key`
* **Configuração em Produção:** Defina a variável de ambiente `EXTERNAL_API_KEY` no seu arquivo `.env` para a chave secreta de sua preferência.

---

## 🚀 Endpoints

### 1. Gerar Documento (Headless)
Gera uma especificação técnica ou de produto a partir de uma demanda de texto puro, salva-a no histórico do banco de dados local do DocuMente e retorna o Markdown do documento formatado. Opcionalmente, pode rodar o **Juiz de Qualidade (Xiaomi MiMo 2.5 Pro)** para auditar e pontuar o documento na mesma chamada.

* **Rota:** `POST /api/external/generate`
* **Content-Type:** `application/json`

#### 📥 Parâmetros do Corpo (JSON)

| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `title` | `string` | **Sim** | O título que será salvo para o documento no histórico. |
| `type` | `string` | **Sim** | O tipo de template a usar. Valores aceitos: `prd`, `epic`, `userstories`, `roadmap`, `releasenote`, `pitch`, `techspec`, `testplan`, `apidoc`. |
| `demand` | `string` | **Sim** | A transcrição da reunião, código ou ideia inicial que serve de demanda para a IA. |
| `tags` | `string[]` | Não | Array de tags para classificar o documento no histórico (ex: `["checkout", "v2"]`). |
| `extractedText` | `string` | Não | Texto extraído de arquivos complementares anexados para dar contexto adicional à IA. |
| `calculateQuality` | `boolean` | Não | Se `true`, roda reativamente a auditoria de qualidade do Juiz de IA e anexa o score e parecer no JSON de retorno. |

---

### 📝 Exemplos de Requisição

#### Exemplo com `curl` (Geração Simples):
```bash
curl -X POST http://localhost:5000/api/external/generate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: documente_dev_key" \
  -d '{
    "title": "Integração Stripe checkout",
    "type": "prd",
    "demand": "Precisamos criar um fluxo de checkout com a Stripe aceitando cartão de crédito nacional e internacional. O usuário deve ver o feedback de sucesso instantâneo e receber um e-mail de confirmação."
  }'
```

#### Exemplo de Resposta (Sucesso):
```json
{
  "success": true,
  "document": {
    "id": 14,
    "title": "Integração Stripe checkout",
    "type": "prd",
    "content": "# Requisitos do Produto: Integração Stripe checkout\n\n## 1. Visão Geral...\n[Conteúdo em Markdown gerado pelo DeepSeek]",
    "tags": [],
    "createdAt": "2026-06-27T23:05:00.000Z"
  }
}
```

---

#### Exemplo de Requisição com Auditoria de Qualidade (`calculateQuality: true`):
```bash
curl -X POST http://localhost:5000/api/external/generate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: documente_dev_key" \
  -d '{
    "title": "API de Notificação Push",
    "type": "techspec",
    "demand": "Definir rota POST /api/notify aceitando tokens do Firebase Cloud Messaging para enviar pushes. Retornar status 202 accepted.",
    "calculateQuality": true
  }'
```

#### Exemplo de Resposta (Sucesso + Auditoria):
```json
{
  "success": true,
  "document": {
    "id": 15,
    "title": "API de Notificação Push",
    "type": "techspec",
    "content": "# Tech Spec: API de Notificação Push\n\n## 1. Arquitetura...",
    "tags": [],
    "createdAt": "2026-06-27T23:07:00.000Z"
  },
  "qualityAudit": {
    "score": 92,
    "positives": [
      "Especificação técnica bem detalhada seguindo o formato solicitado",
      "Modelos de payloads de entrada e saída claramente exemplificados"
    ],
    "improvements": [
      "Adicionar documentação sobre políticas de tratamento de falhas e rate limiting da API"
    ]
  }
}
```

---

## 🤖 Integração com Agentes de IA (Autônomos)

Se você estiver construindo um Agente de IA (ex: no LangChain, CrewAI ou AutoGen) e quer equipá-lo com a habilidade de gerar especificações de produtos, você pode expor este endpoint como uma **Tool (Ferramenta)**.

### Exemplo de Definição de Tool para Agente (JSON Schema):
```json
{
  "name": "generate_product_document",
  "description": "Gera documentos estruturados de produtos (PRD, Épicos, Stories, Specs Técnicas) a partir de uma demanda usando a IA do DocuMente.",
  "parameters": {
    "type": "object",
    "properties": {
      "title": {
        "type": "string",
        "description": "Título claro para o documento gerado."
      },
      "type": {
        "type": "string",
        "enum": ["prd", "epic", "userstories", "roadmap", "releasenote", "pitch", "techspec", "testplan", "apidoc"],
        "description": "O tipo do template a ser gerado (ex: prd para Documento de Requisitos de Produto, epic para Épicos, techspec para especificações técnicas)."
      },
      "demand": {
        "type": "string",
        "description": "A descrição ou notas da reunião que definem o que precisa ser documentado."
      },
      "calculateQuality": {
        "type": "boolean",
        "description": "Se verdadeiro, ativa o modelo juiz Xiaomi MiMo 2.5 Pro para avaliar e pontuar a qualidade da entrega."
      }
    },
    "required": ["title", "type", "demand"]
  }
}
```
