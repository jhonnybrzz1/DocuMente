# Relatório de Avaliação E2E - Geração de Documentos

*Executado em: 28/06/2026, 17:11:42*

## 📊 Métricas Consolidadas

| Métrica | Valor |
|---|---|
| **Total de Casos** | 5 |
| **Taxa de Sucesso (Determinístico + Juiz)** | **100.0%** (5/5) |
| **Score Médio da Rubrica** | **96.8/100** |
| **Latência p50** | 49644ms |
| **Latência p95** | 51653ms |
| **Documentos com Bloqueadores de Release** | 0 |

## 🧪 Resumo por Caso de Teste

| Caso | Tipo | Latência | Score | Status | Bloqueado de Release |
|---|---|---|---|---|---|
| **apidoc-orders-query** | `APIDOC` | 50532ms | 100/100 | ✅ PASSOU | Não ✅ |
| **prd-csv-export-injection** | `PRD` | 42577ms | 100/100 | ✅ PASSOU | Não ✅ |
| **prd-simple-sales-status** | `PRD` | 21790ms | 100/100 | ✅ PASSOU | Não ✅ |
| **techspec-webhook-payments** | `TECHSPEC` | 49644ms | 100/100 | ✅ PASSOU | Não ✅ |
| **userstories-risk-compliance** | `USERSTORIES` | 51653ms | 84/100 | ✅ PASSOU | Não ✅ |

## 🔍 Detalhes Individuais

### Caso: apidoc-orders-query
- **Tipo**: `APIDOC`
- **Latência**: 50532ms
- **Score da Rubrica**: 100/100
- **Release**: ✅ LIBERADA

**Checagens Determinísticas (Sem LLM):**
- [✅] **Ausência de Placeholders**: Nenhum placeholder detectado.
- [✅] **Estrutura e Seções Obrigatórias**: Todas as seções obrigatórias presentes.
- [✅] **Preservação de Regras Críticas (Required)**: Todas as regras obrigatórias atendidas.
- [✅] **Inexistência de Regras Proibidas (Forbidden)**: Nenhum termo proibido gerado.
- [✅] **Limite de Tamanho do Output**: Tamanho: 1953 caracteres.

**Notas Ponderadas da Rubrica (1 a 5):**
- **Fidelidade**: 5/5 - *Nota: 5/5. Preserva perfeitamente todas as regras, valores, prazos e exceções.*
- **Completude**: 5/5 - *Nota: 5/5. Cobre com excelência todos os requisitos, exceções e fluxos relevantes.*
- **Aderência ao Formato**: 5/5 - *Nota: 5/5. Estrutura 100% correta e pronta para uso.*
- **Acionabilidade**: 5/5 - *Nota: 5/5. Claro, verificável e imediatamente executável.*
- **Clareza**: 5/5 - *Nota: 5/5. Direto, organizado e consistente.*

---

### Caso: prd-csv-export-injection
- **Tipo**: `PRD`
- **Latência**: 42577ms
- **Score da Rubrica**: 100/100
- **Release**: ✅ LIBERADA

**Checagens Determinísticas (Sem LLM):**
- [✅] **Ausência de Placeholders**: Nenhum placeholder detectado.
- [✅] **Estrutura e Seções Obrigatórias**: Todas as seções obrigatórias presentes.
- [✅] **Preservação de Regras Críticas (Required)**: Todas as regras obrigatórias atendidas.
- [✅] **Inexistência de Regras Proibidas (Forbidden)**: Nenhum termo proibido gerado.
- [✅] **Limite de Tamanho do Output**: Tamanho: 3354 caracteres.

**Notas Ponderadas da Rubrica (1 a 5):**
- **Fidelidade**: 5/5 - *Nota: 5/5. O documento preserva perfeitamente todas as regras, valores, prazos e exceções, como o limite de 50.000 linhas e o uso de ponto e vírgula como separador padrão.*
- **Completude**: 5/5 - *Nota: 5/5. O documento cobre com excelência todos os requisitos, exceções e fluxos relevantes, incluindo funcionalidades essenciais e desejáveis, além de critérios de aceite claros.*
- **Aderência ao Formato**: 5/5 - *Nota: 5/5. A estrutura do documento está 100% correta e pronta para uso, seguindo o formato esperado para um PRD.*
- **Acionabilidade**: 5/5 - *Nota: 5/5. O documento é claro, verificável e imediatamente executável, com detalhes suficientes para orientar a implementação.*
- **Clareza**: 5/5 - *Nota: 5/5. O documento é direto, organizado e consistente, facilitando a compreensão das informações.*

---

### Caso: prd-simple-sales-status
- **Tipo**: `PRD`
- **Latência**: 21790ms
- **Score da Rubrica**: 100/100
- **Release**: ✅ LIBERADA

**Checagens Determinísticas (Sem LLM):**
- [✅] **Ausência de Placeholders**: Nenhum placeholder detectado.
- [✅] **Estrutura e Seções Obrigatórias**: Todas as seções obrigatórias presentes.
- [✅] **Preservação de Regras Críticas (Required)**: Todas as regras obrigatórias atendidas.
- [✅] **Inexistência de Regras Proibidas (Forbidden)**: Nenhum termo proibido gerado.
- [✅] **Limite de Tamanho do Output**: Tamanho: 3158 caracteres.

**Notas Ponderadas da Rubrica (1 a 5):**
- **Fidelidade**: 5/5 - *Nota: 5/5. O documento preserva perfeitamente todas as regras, valores, prazos e exceções, sem alterações ou invenções de regras importantes.*
- **Completude**: 5/5 - *Nota: 5/5. O documento cobre com excelência todos os requisitos, exceções e fluxos relevantes, sem omissões de requisitos centrais.*
- **Aderência ao Formato**: 5/5 - *Nota: 5/5. A estrutura do documento está 100% correta e pronta para uso, sem placeholders pendentes ou estrutura errada.*
- **Acionabilidade**: 5/5 - *Nota: 5/5. O documento é claro, verificável e imediatamente executável, sem ser genérico ou exigir retrabalho.*
- **Clareza**: 5/5 - *Nota: 5/5. O documento é direto, organizado e consistente, sem ser confuso ou prolixo.*

---

### Caso: techspec-webhook-payments
- **Tipo**: `TECHSPEC`
- **Latência**: 49644ms
- **Score da Rubrica**: 100/100
- **Release**: ✅ LIBERADA

**Checagens Determinísticas (Sem LLM):**
- [✅] **Ausência de Placeholders**: Nenhum placeholder detectado.
- [✅] **Estrutura e Seções Obrigatórias**: Todas as seções obrigatórias presentes.
- [✅] **Preservação de Regras Críticas (Required)**: Todas as regras obrigatórias atendidas.
- [✅] **Inexistência de Regras Proibidas (Forbidden)**: Nenhum termo proibido gerado.
- [✅] **Limite de Tamanho do Output**: Tamanho: 4497 caracteres.

**Notas Ponderadas da Rubrica (1 a 5):**
- **Fidelidade**: 5/5 - *Nota: 5/5. Preserva perfeitamente todas as regras, valores, prazos e exceções.*
- **Completude**: 5/5 - *Nota: 5/5. Cobre com excelência todos os requisitos, exceções e fluxos relevantes.*
- **Aderência ao Formato**: 5/5 - *Nota: 5/5. Estrutura 100% correta e pronta para uso.*
- **Acionabilidade**: 5/5 - *Nota: 5/5. Claro, verificável e imediatamente executável.*
- **Clareza**: 5/5 - *Nota: 5/5. Direto, organizado e consistente.*

---

### Caso: userstories-risk-compliance
- **Tipo**: `USERSTORIES`
- **Latência**: 51653ms
- **Score da Rubrica**: 84/100
- **Release**: ✅ LIBERADA

**Checagens Determinísticas (Sem LLM):**
- [✅] **Ausência de Placeholders**: Nenhum placeholder detectado.
- [✅] **Estrutura e Seções Obrigatórias**: Todas as seções obrigatórias presentes.
- [✅] **Preservação de Regras Críticas (Required)**: Todas as regras obrigatórias atendidas.
- [✅] **Inexistência de Regras Proibidas (Forbidden)**: Nenhum termo proibido gerado.
- [✅] **Limite de Tamanho do Output**: Tamanho: 2554 caracteres.

**Notas Ponderadas da Rubrica (1 a 5):**
- **Fidelidade**: 5/5 - *Nota: 5/5. O documento preserva perfeitamente todas as regras, valores e exceções mencionadas no contexto, como as faixas de score (acima de 80, abaixo de 30, entre 30 e 80) e os perfis de aprovação.*
- **Completude**: 3/5 - *Nota: 3/5. Cobre o essencial das três faixas de score, mas apresenta lacunas importantes: não detalha o que constitui uma 'revisão simples' (US-003), não define o fluxo exato de aprovação manual (ex: sequência, rejeição) e não inclui cenários de exceção nos critérios de aceitação.*
- **Aderência ao Formato**: 5/5 - *Nota: 5/5. Estrutura 100% correta e pronta para uso, com formato padrão de User Story (Como, Eu quero, Para que), campos de prioridade, estimativa, dependências e critérios de aceitação em Gherkin, sem placeholders.*
- **Acionabilidade**: 3/5 - *Nota: 3/5. As stories são úteis e testáveis, mas exigem retrabalho para serem imediatamente executáveis. A falta de detalhes sobre 'revisão simples' e o fluxo de aprovação manual pode gerar ambiguidade na implementação.*
- **Clareza**: 5/5 - *Nota: 5/5. O documento é direto, organizado e consistente, com linguagem clara e estrutura lógica que facilita a compreensão.*

---

