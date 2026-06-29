# Checklist de Melhorias e Auditoria de IA — DocuMente

Este documento apresenta a auditoria técnica e o checklist de conformidade dos fluxos de Inteligência Artificial do **DocuMente**, com base nas recomendações do relatório técnico.

---

## 📊 1. Resumo Executivo e Prioridades Recomendadas

| ID | Recomendação | Status | Detalhes Técnicos / Arquivos |
| :--- | :--- | :---: | :--- |
| **1.1** | Telemetria de LLM detalhada por chamada (modelo, provider, latência, tokens, custo, status, retries). | **COMPLETED** | Implementado no logger de telemetria em [openrouter.ts](file:///Users/josejonathanalvesdeazevedo/documente/server/services/openrouter.ts) e exposto via API no [routes/ai.ts](file:///Users/josejonathanalvesdeazevedo/documente/server/routes/ai.ts#L305) com persistência em disco. |
| **1.2** | Verificação e reparo de fidelidade adaptativa (não obrigatória para todos os cenários). | **COMPLETED** | Lógica adaptativa condicional baseada em tamanho de contexto (>8.000 chars) e tipo de documento configurada no [routes.ts](file:///Users/josejonathanalvesdeazevedo/documente/server/routes.ts#L1736-L1760). |
| **1.3** | Reduzir e estruturar contexto de entrada (anexos e extrações compressores). | **COMPLETED** | Implementação de compressores de prompt dinâmicos para anexos no [routes.ts](file:///Users/josejonathanalvesdeazevedo/documente/server/routes.ts#L1900-L1925). |
| **1.4** | Matriz de Roteamento (Model Tiering) por complexidade de tarefa e plano do usuário. | **COMPLETED** | Roteamento baseado nos planos Free, Pro e Enterprise configurado no [routes.ts](file:///Users/josejonathanalvesdeazevedo/documente/server/routes.ts#L1800-L1820) e [routes/ai.ts](file:///Users/josejonathanalvesdeazevedo/documente/server/routes/ai.ts#L310-L325). |
| **1.5** | Criar suíte de avaliação com demandas fixas e asserções automáticas determinísticas. | **COMPLETED** | Suíte de testes E2E executada na porta `5099`/`3000` via [run-evaluation.ts](file:///Users/josejonathanalvesdeazevedo/documente/tests/run-evaluation.ts) validando 7 casos de negócio de forma 100% determinística. |

---

## 🛠️ 2. Auditoria da Arquitetura e Mitigação de Riscos

| Risco Identificado | Status | Solução Implementada | Arquivos Relacionados |
| :--- | :--- | :--- | :--- |
| **Multi-chamadas Excessivas** | **Resolvido** | A verificação de fidelidade adaptativa e o cache semântico evitam chamadas redundantes para o mesmo conteúdo. | [routes.ts](file:///Users/josejonathanalvesdeazevedo/documente/server/routes.ts#L1736) |
| **Falta de Telemetria de Custo** | **Resolvido** | Telemetria real por requisição gravada em Winston JSON em `logs/telemetry.jsonl` com cálculo dinâmico de tokens. | [openrouter.ts](file:///Users/josejonathanalvesdeazevedo/documente/server/services/openrouter.ts#L213-L230) |
| **Anexos longos no Prompt** | **Resolvido** | Redução do system prompt estático de comrpressão de anexos de ~600 para 200 tokens. | [routes.ts](file:///Users/josejonathanalvesdeazevedo/documente/server/routes.ts#L1900) |
| **Chamadas manuais sem Wrapper** | **Resolvido** | Todas as rotas de verificação e reparo de fidelidade usam o wrapper unificado `chatCompletion`. | [routes.ts](file:///Users/josejonathanalvesdeazevedo/documente/server/routes.ts#L1784) |
| **Timeout e Circuit Breaker** | **Resolvido** | Uso de `AbortController` integrado com timeouts sob medida (10s a 60s) e retries apenas para erros transientes de rede. | [openrouter.ts](file:///Users/josejonathanalvesdeazevedo/documente/server/services/openrouter.ts#L110-L125) |
| **Inexistência de Cache** | **Resolvido** | Cache de similaridade aproximada (cosseno >= 0.85) com remoção de stopwords persitido localmente em disco. | [cache.ts](file:///Users/josejonathanalvesdeazevedo/documente/server/utils/cache.ts#L165-L185) |

---

## 🎯 3. Melhorias de Precisão (Fidelidade & Qualidade)

- [x] **3.1 Contrato de Saída Verificável**
  - Implementação de schemas Zod estruturados para PRD (`prdJsonSchema`), User Stories e API Docs no backend.
  - A renderização final em Markdown é isolada da IA, garantindo que as seções obrigatórias exigidas pelos testes (como `## Modelos de Dados`) nunca sejam corrompidas ou omitidas.
- [x] **3.2 Classificação Pré-Geração**
  - Integração de um pré-processador de requisitos para extração estruturada de fatos e regras a partir da demanda de entrada.
- [x] **3.3 Verificador de Fidelidade Enriquecido**
  - Retorno de issues estruturadas contendo severidade (`critical`/`warning`), trecho da fonte, trecho gerado incorreto e instruções explícitas de correção.
- [x] **3.4 Modelo Juiz Inteligente**
  - Roteamento inteligente para o `mimo-2.5-pro` (juiz) no perfil Pro/Enterprise apenas para rotas complexas, reservando o `deepseek-flash` para avaliações simples.
- [x] **3.5 Suíte E2E Determinística**
  - Execução estável contra o servidor com taxa de sucesso consolidada em **100.0%** (7 de 7 casos passando perfeitamente).

---

## ⚡ 4. Melhorias de Performance & Custo

- [x] **4.1 Timeout de Rede Customizado**:
  - `suggest-title`: 10s
  - `quick-action`: 20s
  - `chat`: 30s
  - `generation`: 60s
  - `verification` / `repair`: 45s
- [x] **4.2 Proteção contra Prompt Injection**:
  - Blindagem do prompt de reparo do sistema contra ataques baseados em injeção adversarial nos anexos fonte (Caso 5 de teste passando com sucesso).
- [x] **4.3 Robustez de Parsing (JSON Resiliente)**:
  - Extrator de JSON tolerante a ruídos de IA: resolve comentários, vírgulas duplicadas/pendentes e chaves ou colchetes não fechados devido a truncagem de tokens.
- [x] **4.4 Medição de Custos no Frontend**:
  - Exposição de telemetria analítica com painel de estatísticas de custos consumido diretamente pelo dashboard de gerenciamento da plataforma.
