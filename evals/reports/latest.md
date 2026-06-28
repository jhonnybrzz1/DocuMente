# Relatório de Avaliação E2E - Geração de Documentos

*Executado em: 28/06/2026, 16:35:43*

## 📊 Métricas Consolidadas

| Métrica | Valor |
|---|---|
| **Total de Casos** | 5 |
| **Taxa de Sucesso (Determinístico + Juiz)** | **100.0%** (5/5) |
| **Score Médio da Rubrica** | **77.8/100** |
| **Latência p50** | 55441ms |
| **Latência p95** | 73902ms |
| **Documentos com Bloqueadores de Release** | 0 |

## 🧪 Resumo por Caso de Teste

| Caso | Tipo | Latência | Score | Status | Bloqueado de Release |
|---|---|---|---|---|---|
| **prd-simple-sales-status** | `PRD` | 73902ms | 78/100 | ✅ PASSOU | Não ✅ |
| **userstories-risk-compliance** | `USERSTORIES` | 37064ms | 68/100 | ✅ PASSOU | Não ✅ |
| **techspec-webhook-payments** | `TECHSPEC` | 45460ms | 100/100 | ✅ PASSOU | Não ✅ |
| **apidoc-orders-query** | `APIDOC` | 63799ms | 65/100 | ✅ PASSOU | Não ✅ |
| **prd-csv-export-injection** | `PRD` | 55441ms | 78/100 | ✅ PASSOU | Não ✅ |

## 🔍 Detalhes Individuais

### Caso: prd-simple-sales-status
- **Tipo**: `PRD`
- **Latência**: 73902ms
- **Score da Rubrica**: 78/100
- **Release**: ✅ LIBERADA

**Checagens Determinísticas (Sem LLM):**
- [✅] **Ausência de Placeholders**: Nenhum placeholder detectado.
- [✅] **Estrutura e Seções Obrigatórias**: Todas as seções obrigatórias presentes.
- [✅] **Preservação de Regras Críticas (Required)**: Todas as regras obrigatórias atendidas.
- [✅] **Inexistência de Regras Proibidas (Forbidden)**: Nenhum termo proibido gerado.
- [✅] **Limite de Tamanho do Output**: Tamanho: 3092 caracteres.

**Notas Ponderadas da Rubrica (1 a 5):**
- **Fidelidade**: 3/5 - *Nota: 3/5. Preserva a maioria das regras e valores, mas o prazo esperado está indefinido, o que é um detalhe importante.*
- **Completude**: 4/5 - *Nota: 4/5. Cobre o essencial, mas há lacunas como a falta de detalhes sobre a experiência do usuário ao utilizar os filtros.*
- **Aderência ao Formato**: 5/5 - *Nota: 5/5. A estrutura está correta e pronta para uso, sem placeholders pendentes.*
- **Acionabilidade**: 4/5 - *Nota: 4/5. O documento é claro e útil, mas exige retrabalho para definir o prazo esperado e detalhar a experiência do usuário.*
- **Clareza**: 5/5 - *Nota: 5/5. O documento é direto, organizado e consistente.*

---

### Caso: userstories-risk-compliance
- **Tipo**: `USERSTORIES`
- **Latência**: 37064ms
- **Score da Rubrica**: 68/100
- **Release**: ✅ LIBERADA

**Checagens Determinísticas (Sem LLM):**
- [✅] **Ausência de Placeholders**: Nenhum placeholder detectado.
- [✅] **Estrutura e Seções Obrigatórias**: Todas as seções obrigatórias presentes.
- [✅] **Preservação de Regras Críticas (Required)**: Todas as regras obrigatórias atendidas.
- [✅] **Inexistência de Regras Proibidas (Forbidden)**: Nenhum termo proibido gerado.
- [✅] **Limite de Tamanho do Output**: Tamanho: 3216 caracteres.

**Notas Ponderadas da Rubrica (1 a 5):**
- **Fidelidade**: 3/5 - *Nota: 3/5. Preserva as regras centrais (aprovação dupla para score >80, liberação automática para <30, revisão simples para 30-80). No entanto, perde detalhes: não define explicitamente o comportamento para os limites exatos (score igual a 30 ou 80), mencionando-os apenas como edge cases sem resolução clara.*
- **Completude**: 3/5 - *Nota: 3/5. Cobre os três fluxos principais de aprovação baseados no score. Apresenta lacunas: não detalha o que constitui uma 'revisão simples', não define o fluxo de aprovação dupla (sequência, paralela, timeout), e a dúvida sobre tempo máximo de aprovação indica requisito não coberto.*
- **Aderência ao Formato**: 5/5 - *Nota: 5/5. Estrutura 100% correta para User Stories: contexto claro, stories com formato 'Como/Eu quero/Para que', prioridade, estimativa, dependências, critérios de aceitação em Gherkin e cenários alternativos. Pronto para uso.*
- **Acionabilidade**: 3/5 - *Nota: 3/5. As stories são úteis e direcionam o desenvolvimento, mas exigem retrabalho: os critérios de aceitação não cobrem os limites exatos (30 e 80), a 'revisão simples' não é definida, e o mecanismo de aprovação dupla carece de detalhes operacionais.*
- **Clareza**: 4/5 - *Nota: 4/5. Direto, organizado e consistente. As stories são bem estruturadas e os critérios de aceitação são claros. Pequena perda de clareza apenas na definição dos limites e do que é 'revisão simples'.*

---

### Caso: techspec-webhook-payments
- **Tipo**: `TECHSPEC`
- **Latência**: 45460ms
- **Score da Rubrica**: 100/100
- **Release**: ✅ LIBERADA

**Checagens Determinísticas (Sem LLM):**
- [✅] **Ausência de Placeholders**: Nenhum placeholder detectado.
- [✅] **Estrutura e Seções Obrigatórias**: Todas as seções obrigatórias presentes.
- [✅] **Preservação de Regras Críticas (Required)**: Todas as regras obrigatórias atendidas.
- [✅] **Inexistência de Regras Proibidas (Forbidden)**: Nenhum termo proibido gerado.
- [✅] **Limite de Tamanho do Output**: Tamanho: 4180 caracteres.

**Notas Ponderadas da Rubrica (1 a 5):**
- **Fidelidade**: 5/5 - *Nota: 5/5. Preserva perfeitamente todas as regras, valores, prazos e exceções.*
- **Completude**: 5/5 - *Nota: 5/5. Cobre com excelência todos os requisitos, exceções e fluxos relevantes.*
- **Aderência ao Formato**: 5/5 - *Nota: 5/5. Estrutura 100% correta e pronta para uso.*
- **Acionabilidade**: 5/5 - *Nota: 5/5. Claro, verificável e imediatamente executável.*
- **Clareza**: 5/5 - *Nota: 5/5. Direto, organizado e consistente.*

---

### Caso: apidoc-orders-query
- **Tipo**: `APIDOC`
- **Latência**: 63799ms
- **Score da Rubrica**: 65/100
- **Release**: ✅ LIBERADA

**Checagens Determinísticas (Sem LLM):**
- [✅] **Ausência de Placeholders**: Nenhum placeholder detectado.
- [✅] **Estrutura e Seções Obrigatórias**: Todas as seções obrigatórias presentes.
- [✅] **Preservação de Regras Críticas (Required)**: Todas as regras obrigatórias atendidas.
- [✅] **Inexistência de Regras Proibidas (Forbidden)**: Nenhum termo proibido gerado.
- [✅] **Limite de Tamanho do Output**: Tamanho: 1660 caracteres.

**Notas Ponderadas da Rubrica (1 a 5):**
- **Fidelidade**: 3/5 - *Nota: 3/5. Preserva a maioria das regras, mas omite detalhes como exemplos completos de respostas e descrições mais detalhadas dos campos.*
- **Completude**: 3/5 - *Nota: 3/5. Cobre o essencial, mas falta detalhes como exemplos completos de respostas, descrições mais detalhadas dos campos e possíveis exceções.*
- **Aderência ao Formato**: 4/5 - *Nota: 4/5. A estrutura está quase correta, mas falta detalhes como exemplos completos de respostas e descrições mais detalhadas dos campos.*
- **Acionabilidade**: 3/5 - *Nota: 3/5. Útil, mas exige retrabalho para ser completamente implementável devido à falta de detalhes.*
- **Clareza**: 4/5 - *Nota: 4/5. Direto e organizado, mas poderia ser mais claro com exemplos completos de respostas e descrições mais detalhadas dos campos.*

---

### Caso: prd-csv-export-injection
- **Tipo**: `PRD`
- **Latência**: 55441ms
- **Score da Rubrica**: 78/100
- **Release**: ✅ LIBERADA

**Checagens Determinísticas (Sem LLM):**
- [✅] **Ausência de Placeholders**: Nenhum placeholder detectado.
- [✅] **Estrutura e Seções Obrigatórias**: Todas as seções obrigatórias presentes.
- [✅] **Preservação de Regras Críticas (Required)**: Todas as regras obrigatórias atendidas.
- [✅] **Inexistência de Regras Proibidas (Forbidden)**: Nenhum termo proibido gerado.
- [✅] **Limite de Tamanho do Output**: Tamanho: 3611 caracteres.

**Notas Ponderadas da Rubrica (1 a 5):**
- **Fidelidade**: 3/5 - *Nota: 3/5. Preserva a maioria das regras e requisitos, mas omite detalhes importantes como o prazo esperado e o responsável pelo documento.*
- **Completude**: 4/5 - *Nota: 4/5. Cobre o essencial, mas há lacunas como a falta de detalhes sobre a interface de usuário e a integração com o sistema de relatórios existente.*
- **Aderência ao Formato**: 5/5 - *Nota: 5/5. A estrutura está correta e pronta para uso, sem placeholders pendentes.*
- **Acionabilidade**: 4/5 - *Nota: 4/5. O documento é útil e claro, mas exige retrabalho para detalhar a interface de usuário e as integrações necessárias.*
- **Clareza**: 5/5 - *Nota: 5/5. O documento é direto, organizado e consistente, facilitando a compreensão.*

---

