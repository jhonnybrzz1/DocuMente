# Relatório de Avaliação E2E - Geração de Documentos

*Executado em: 28/06/2026, 16:24:19*

## 📊 Métricas Consolidadas

| Métrica | Valor |
|---|---|
| **Total de Casos** | 5 |
| **Taxa de Sucesso (Determinístico + Juiz)** | **80.0%** (4/5) |
| **Score Médio da Rubrica** | **82.4/100** |
| **Latência p50** | 62804ms |
| **Latência p95** | 72010ms |
| **Documentos com Bloqueadores de Release** | 1 |

## 🧪 Resumo por Caso de Teste

| Caso | Tipo | Latência | Score | Status | Bloqueado de Release |
|---|---|---|---|---|---|
| **prd-simple-sales-status** | `PRD` | 21163ms | 100/100 | ✅ PASSOU | Não ✅ |
| **userstories-risk-compliance** | `USERSTORIES` | 62804ms | 82/100 | ✅ PASSOU | Não ✅ |
| **techspec-webhook-payments** | `TECHSPEC` | 69424ms | 65/100 | ❌ FALHOU | Sim ⚠️ |
| **apidoc-orders-query** | `APIDOC` | 72010ms | 100/100 | ✅ PASSOU | Não ✅ |
| **prd-csv-export-injection** | `PRD` | 47266ms | 65/100 | ✅ PASSOU | Não ✅ |

## 🔍 Detalhes Individuais

### Caso: prd-simple-sales-status
- **Tipo**: `PRD`
- **Latência**: 21163ms
- **Score da Rubrica**: 100/100
- **Release**: ✅ LIBERADA

**Checagens Determinísticas (Sem LLM):**
- [✅] **Ausência de Placeholders**: Nenhum placeholder detectado.
- [✅] **Estrutura e Seções Obrigatórias**: Todas as seções obrigatórias presentes.
- [✅] **Preservação de Regras Críticas (Required)**: Todas as regras obrigatórias atendidas.
- [✅] **Inexistência de Regras Proibidas (Forbidden)**: Nenhum termo proibido gerado.
- [✅] **Limite de Tamanho do Output**: Tamanho: 2936 caracteres.

**Notas Ponderadas da Rubrica (1 a 5):**
- **Fidelidade**: 5/5 - *Nota: 5/5. O documento preserva perfeitamente todas as regras, valores, prazos e exceções mencionadas, sem alterações ou invenções.*
- **Completude**: 5/5 - *Nota: 5/5. Cobre com excelência todos os requisitos, exceções e fluxos relevantes, incluindo funcionalidades essenciais e desejáveis.*
- **Aderência ao Formato**: 5/5 - *Nota: 5/5. A estrutura está 100% correta e pronta para uso, sem placeholders pendentes ou erros de formatação.*
- **Acionabilidade**: 5/5 - *Nota: 5/5. O documento é claro, verificável e imediatamente executável, com critérios de aceite bem definidos.*
- **Clareza**: 5/5 - *Nota: 5/5. O texto é direto, organizado e consistente, facilitando a compreensão.*

---

### Caso: userstories-risk-compliance
- **Tipo**: `USERSTORIES`
- **Latência**: 62804ms
- **Score da Rubrica**: 82/100
- **Release**: ✅ LIBERADA

**Checagens Determinísticas (Sem LLM):**
- [✅] **Ausência de Placeholders**: Nenhum placeholder detectado.
- [✅] **Estrutura e Seções Obrigatórias**: Todas as seções obrigatórias presentes.
- [✅] **Preservação de Regras Críticas (Required)**: Todas as regras obrigatórias atendidas.
- [✅] **Inexistência de Regras Proibidas (Forbidden)**: Nenhum termo proibido gerado.
- [✅] **Limite de Tamanho do Output**: Tamanho: 3198 caracteres.

**Notas Ponderadas da Rubrica (1 a 5):**
- **Fidelidade**: 5/5 - *Nota: 5/5. O documento preserva perfeitamente todas as regras de negócio definidas no contexto (faixas de score e suas respectivas ações), incluindo os limites exatos (30 e 80) e suas exceções nos critérios de aceitação.*
- **Completude**: 3/5 - *Nota: 3/5. Cobre os três fluxos principais baseados no score, mas omite detalhes sobre o que constitui uma 'revisão simples' (US-003) e não descreve o fluxo completo após a aprovação/revisão (ex: liberação final para câmbio).*
- **Aderência ao Formato**: 5/5 - *Nota: 5/5. Estrutura 100% correta para User Stories, com persona, ação, benefício, prioridade, estimativa, dependências e critérios de aceitação em Gherkin bem formatados.*
- **Acionabilidade**: 3/5 - *Nota: 3/5. US-001 e US-002 são claras e executáveis. US-003 é vaga ao definir 'revisão simples', exigindo retrabalho para detalhar as ações específicas desse processo.*
- **Clareza**: 4/5 - *Nota: 4/5. O documento é direto e organizado, com linguagem consistente. A única obscuridade está na definição de 'revisão simples' na US-003.*

---

### Caso: techspec-webhook-payments
- **Tipo**: `TECHSPEC`
- **Latência**: 69424ms
- **Score da Rubrica**: 65/100
- **Release**: ⚠️ BLOQUEADA

**Checagens Determinísticas (Sem LLM):**
- [✅] **Ausência de Placeholders**: Nenhum placeholder detectado.
- [✅] **Estrutura e Seções Obrigatórias**: Todas as seções obrigatórias presentes.
- [❌] **Preservação de Regras Críticas (Required)**: Requisitos não encontrados: [x-signature]
- [✅] **Inexistência de Regras Proibidas (Forbidden)**: Nenhum termo proibido gerado.
- [✅] **Limite de Tamanho do Output**: Tamanho: 3580 caracteres.

**Bloqueadores Detectados:**
- ❌ Documento sem critérios de aceite completos quando o tipo de documento exige

**Notas Ponderadas da Rubrica (1 a 5):**
- **Fidelidade**: 3/5 - *Nota: 3/5. Preserva a maioria das regras e valores, mas omite detalhes importantes como critérios de aceitação completos e especificações de performance.*
- **Completude**: 3/5 - *Nota: 3/5. Cobre o essencial, mas há lacunas em seções como performance, escalabilidade, e detalhes de implementação específicos.*
- **Aderência ao Formato**: 4/5 - *Nota: 4/5. A estrutura está quase correta, mas algumas seções estão incompletas ou com placeholders implícitos.*
- **Acionabilidade**: 3/5 - *Nota: 3/5. Útil, mas exige retrabalho em várias áreas para ser completamente implementável, como detalhes de performance e escalabilidade.*
- **Clareza**: 4/5 - *Nota: 4/5. Direto e organizado, mas algumas seções poderiam ser mais detalhadas para melhorar a clareza.*

---

### Caso: apidoc-orders-query
- **Tipo**: `APIDOC`
- **Latência**: 72010ms
- **Score da Rubrica**: 100/100
- **Release**: ✅ LIBERADA

**Checagens Determinísticas (Sem LLM):**
- [✅] **Ausência de Placeholders**: Nenhum placeholder detectado.
- [✅] **Estrutura e Seções Obrigatórias**: Todas as seções obrigatórias presentes.
- [✅] **Preservação de Regras Críticas (Required)**: Todas as regras obrigatórias atendidas.
- [✅] **Inexistência de Regras Proibidas (Forbidden)**: Nenhum termo proibido gerado.
- [✅] **Limite de Tamanho do Output**: Tamanho: 2225 caracteres.

**Notas Ponderadas da Rubrica (1 a 5):**
- **Fidelidade**: 5/5 - *Nota: 5/5. O documento preserva perfeitamente todas as regras, valores, prazos e exceções.*
- **Completude**: 5/5 - *Nota: 5/5. Cobre com excelência todos os requisitos, exceções e fluxos relevantes.*
- **Aderência ao Formato**: 5/5 - *Nota: 5/5. Estrutura 100% correta e pronta para uso.*
- **Acionabilidade**: 5/5 - *Nota: 5/5. Claro, verificável e imediatamente executável.*
- **Clareza**: 5/5 - *Nota: 5/5. Direto, organizado e consistente.*

---

### Caso: prd-csv-export-injection
- **Tipo**: `PRD`
- **Latência**: 47266ms
- **Score da Rubrica**: 65/100
- **Release**: ✅ LIBERADA

**Checagens Determinísticas (Sem LLM):**
- [✅] **Ausência de Placeholders**: Nenhum placeholder detectado.
- [✅] **Estrutura e Seções Obrigatórias**: Todas as seções obrigatórias presentes.
- [✅] **Preservação de Regras Críticas (Required)**: Todas as regras obrigatórias atendidas.
- [✅] **Inexistência de Regras Proibidas (Forbidden)**: Nenhum termo proibido gerado.
- [✅] **Limite de Tamanho do Output**: Tamanho: 3050 caracteres.

**Notas Ponderadas da Rubrica (1 a 5):**
- **Fidelidade**: 3/5 - *Nota: 3/5. O documento preserva as regras principais (seleção de período, colunas, separador e limite de 50.000 linhas), mas não detalha aspectos como formatos de separador disponíveis, validações de período ou comportamento em caso de erro.*
- **Completude**: 3/5 - *Nota: 3/5. Cobre os requisitos essenciais, mas apresenta lacunas importantes como: não especifica os formatos de separador disponíveis, não define validações para o período, não detalha o comportamento do sistema em caso de erro ou limite excedido, e não menciona aspectos de performance e escalabilidade.*
- **Aderência ao Formato**: 4/5 - *Nota: 4/5. Estrutura geral correta com seções bem organizadas (Resumo, Problema, Usuários, Solução, Requisitos, Critérios de Aceite, Considerações Técnicas). Poderia melhorar com mais detalhamento em algumas seções.*
- **Acionabilidade**: 3/5 - *Nota: 3/5. Os requisitos são úteis para implementação, mas exigem retrabalho para definir detalhes como: opções específicas de separador, validações de entrada, tratamento de erros e mensagens ao usuário.*
- **Clareza**: 4/5 - *Nota: 4/5. Documento é direto, organizado e fácil de entender. A linguagem é clara e as seções estão bem estruturadas, facilitando a compreensão dos requisitos.*

---

