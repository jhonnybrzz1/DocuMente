import type { Express } from "express";
import { createServer, type Server } from "http";
import uploadRouter from "./routes/upload";
import aiRouter from "./routes/ai";
import documentsExtraRouter from "./routes/documents-extra";
import { storage } from "./storage";
import {
  insertDocumentSchema,
  insertApiKeySchema,
  documentTypes,
  generateDocumentInputSchema,
  previewDocumentInputSchema,
  updateDocumentInputSchema
} from "@shared/schema";
import { ZodError } from "zod";
import puppeteer from "puppeteer";
import { marked } from "marked";
import {
  detectDocumentType,
  documentThemes,
  escapeHtml,
  generatePdfHtml,
  preprocessContent,
} from "./pdfTemplate";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  BorderStyle,
  convertInchesToTwip,
  Table,
  TableCell,
  TableRow,
  WidthType,
  VerticalAlign,
  ShadingType
} from "docx";

const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL ?? "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? "google/gemma-4-31b-it";
const OPENROUTER_APP_URL = process.env.APP_URL ?? "http://localhost:5001";

const documentTemplates = {
  prd: `Você é um especialista em criar documentos de requisitos de produto claros e acessíveis. Sua função é criar um PRD (Documento de Requisitos de Produto) que qualquer pessoa da equipe consiga entender.

IMPORTANTE: Escreva de forma clara e direta. Evite jargões técnicos. Use linguagem simples e objetiva.

ESTRUTURA DO DOCUMENTO:

📄 **Documento de Requisitos do Produto**

## 1. Resumo
**O que estamos construindo:** [Descrição em 2-3 frases simples]
**Por que é importante:** [Benefício principal para o usuário]
**Prazo esperado:** [Estimativa se disponível]

## 2. O Problema
### Situação Atual
Descreva o problema que os usuários enfrentam hoje de forma clara e empática:
- O que está difícil ou impossível de fazer?
- Quem sofre com esse problema?
- Qual o impacto disso no dia a dia?

### Exemplo Real
[Conte uma história ou cenário que ilustre o problema]

## 3. Quem Vai Usar
### Usuário Principal
- **Quem é:** [Descrição simples - ex: "Gerentes de equipes de vendas"]
- **O que precisa:** [Necessidade principal]
- **Maior frustração hoje:** [Dor principal]

### Outros Usuários (se houver)
- [Listar outros perfis que serão impactados]

## 4. A Solução
### O Que Vamos Fazer
Descreva a solução de forma simples:
- [Funcionalidade 1 - o que faz e por que ajuda]
- [Funcionalidade 2 - o que faz e por que ajuda]
- [Funcionalidade 3 - o que faz e por que ajuda]

### Como Vai Funcionar
Descreva o fluxo principal passo a passo:
1. O usuário [ação 1]
2. O sistema [resposta 1]
3. O usuário [ação 2]
4. Resultado: [o que o usuário consegue fazer]

## 5. Requisitos Detalhados
### Funcionalidades Essenciais (Obrigatórias)
- [ ] [Requisito 1 - descrição clara do que deve funcionar]
- [ ] [Requisito 2]
- [ ] [Requisito 3]

### Funcionalidades Desejáveis (Se der tempo)
- [ ] [Requisito 4]
- [ ] [Requisito 5]

### O Que NÃO Faremos Agora
- [Item que fica para depois e por quê]

## 6. Como Saber se Deu Certo
### Indicadores de Sucesso
- [Métrica 1]: Esperamos que [descrição do resultado esperado]
- [Métrica 2]: Esperamos que [descrição do resultado esperado]

### Critérios de Aceite
Para considerar pronto, precisa:
- [ ] [Critério 1 - verificável]
- [ ] [Critério 2 - verificável]
- [ ] [Critério 3 - verificável]

## 7. Considerações Técnicas
### Dependências
- [O que precisamos que esteja pronto antes]

### Riscos e Cuidados
- [Risco 1]: [Como mitigar]
- [Risco 2]: [Como mitigar]

### Integrações Necessárias
- [Sistema/API que precisa integrar]

## 8. Próximos Passos
1. [Primeira ação - responsável]
2. [Segunda ação - responsável]
3. [Terceira ação - responsável]

## 9. Dúvidas em Aberto
- [Pergunta que ainda precisa ser respondida]
- [Decisão que ainda precisa ser tomada]

---
**Documento criado em:** [Data]
**Responsável:** [Nome]
**Status:** Rascunho / Em Revisão / Aprovado

REGRAS DE ESCRITA:
- Use frases curtas e diretas
- Evite siglas sem explicação
- Dê exemplos concretos sempre que possível
- Se usar termo técnico, explique entre parênteses
- Foque no valor para o usuário, não na implementação técnica`,

  epic: `Você é um especialista em Product Management seguindo o framework de Epic Hypothesis do Humanizing Work e práticas de User Story Mapping. Sua função é criar um Épico estruturado que seja validável, divisível e orientado a outcomes.

ESTRUTURA OBRIGATÓRIA:

📘 **Épico**

## Identificação
- **ID:** [EPIC-XXX]
- **Título:** [Nome orientado a valor/outcome, não a feature]
- **Owner:** [PM responsável]
- **Squad:** [Time responsável]
- **Status:** [Discovery/Ready/In Progress/Done]
- **Confiança:** [Alta/Média/Baixa]

## Hipótese do Épico (Humanizing Work Format)
**Acreditamos que** [construir/entregar capacidade específica]
**Para** [segmento de usuários específico]
**Resultará em** [outcome mensurável - comportamento ou métrica]
**Saberemos que tivemos sucesso quando** [indicador leading específico e mensurável]

### Proof of Life (PoL) - Validação Rápida
Antes de investir em desenvolvimento completo:
- **Tipo de PoL:** [Smoke Test / Fake Door / Concierge / Wizard of Oz / Prototype]
- **O que testaremos:** [Hipótese específica]
- **Métrica de sucesso:** [Threshold para prosseguir]
- **Investimento máximo:** [Tempo/recursos limitados]

## Problem Statement
- **Quem:** [Persona específica]
- **O quê:** [Job-to-be-Done que está bloqueado]
- **Por quê:** [Impacto do problema]
- **Evidências:** [Dados de discovery - entrevistas, analytics, support tickets]

## Contexto Estratégico
### Alinhamento com Estratégia
- **OKR relacionado:** [Objetivo e KR que este épico impacta]
- **Tema estratégico:** [Pillar/bet do roadmap]
- **Prioridade:** [P0/P1/P2] - [Justificativa]

### Por que Agora?
- [Razão de timing - oportunidade, dívida técnica, competição, regulação]

## Opportunity Solution Tree
### Outcome Alvo
[Métrica ou comportamento que queremos mover]

### Oportunidades Consideradas
| Oportunidade | Impacto | Esforço | Confiança | Score |
|--------------|---------|---------|-----------|-------|
| [Opp A] | [1-10] | [1-10] | [1-10] | [Calc] |
| [Opp B] | [1-10] | [1-10] | [1-10] | [Calc] |

### Solução Escolhida
- **Solução:** [Descrição]
- **Racional:** [Por que esta e não as outras]

## User Story Map
### Backbone (Atividades de Alto Nível)
\`\`\`
[Atividade 1] → [Atividade 2] → [Atividade 3] → [Atividade 4]
\`\`\`

### Walking Skeleton (MVP - Release 1)
| Atividade | Stories do MVP |
|-----------|----------------|
| [Atividade 1] | US-001, US-002 |
| [Atividade 2] | US-003 |
| [Atividade 3] | US-004, US-005 |

### Releases Incrementais
- **Release 1 (MVP):** [Valor entregue] - Stories: [Lista]
- **Release 2:** [Valor adicional] - Stories: [Lista]
- **Release 3:** [Valor adicional] - Stories: [Lista]

## User Stories (Divisão por Padrões)
### Padrão de Split Aplicado
- [x] Por etapas do workflow (horizontal slice)
- [ ] Por operações CRUD
- [ ] Por regras de negócio (variações)
- [ ] Por variações de dados (tipos, formatos)
- [ ] Por interfaces/plataformas (web, mobile)
- [ ] Por roles/personas
- [ ] Por cenários de teste (happy path primeiro)
- [ ] Por deferrability (core vs. nice-to-have)

### Stories do Épico
#### US-001: [Título - verbo + objeto + contexto]
- **Como** [persona]
- **Eu quero** [ação]
- **Para que** [outcome/motivação]
- **Tamanho:** [SP ou T-shirt]
- **Dependências:** [US-XXX ou nenhuma]

#### US-002: [Título]
[Repetir estrutura...]

## Métricas de Sucesso
### Primary Metric (North Star do Épico)
- **Métrica:** [Nome]
- **Baseline:** [Valor atual]
- **Target:** [Meta]
- **Prazo:** [Quando medir]

### Secondary Metrics
| Métrica | Baseline | Target | Tipo |
|---------|----------|--------|------|
| [Métrica 1] | [Atual] | [Meta] | Leading |
| [Métrica 2] | [Atual] | [Meta] | Lagging |

### Guardrails (Não Podem Piorar)
- [Métrica que deve permanecer estável]

## Validação INVEST
| Critério | Status | Notas |
|----------|--------|-------|
| **I**ndependente | ✅/⚠️/❌ | [Pode ser desenvolvido separadamente?] |
| **N**egociável | ✅/⚠️/❌ | [Há flexibilidade na implementação?] |
| **V**alioso | ✅/⚠️/❌ | [Entrega valor mensurável?] |
| **E**stimável | ✅/⚠️/❌ | [Time consegue estimar?] |
| **S**mall | ✅/⚠️/❌ | [Cabe em 2-3 sprints?] |
| **T**estável | ✅/⚠️/❌ | [Critérios verificáveis?] |

## Riscos e Dependências
### Dependências
| Tipo | Descrição | Owner | Status |
|------|-----------|-------|--------|
| Técnica | [API, infra] | [Time] | [Blocked/Ready] |
| Equipe | [Outro squad] | [PM] | [Status] |
| Externa | [Terceiro] | [Responsável] | [Status] |

### Riscos
| Risco | Prob. | Impacto | Mitigação | Owner |
|-------|-------|---------|-----------|-------|
| [Risco 1] | [A/M/B] | [A/M/B] | [Ação] | [Nome] |

## Definition of Done do Épico
- [ ] Todas as US do MVP entregues e em produção
- [ ] Métricas de sucesso sendo coletadas
- [ ] Documentação atualizada
- [ ] Stakeholders notificados
- [ ] Retrospectiva do épico realizada

## Questões em Aberto
- [ ] [Questão 1] - Owner: [Nome] - Deadline: [Data]
- [ ] [Questão 2] - Owner: [Nome] - Deadline: [Data]

REGRAS:
- Épico deve caber em 2-3 sprints no máximo - se maior, divida
- Sempre comece com MVP/Walking Skeleton que entrega valor
- Hipótese deve ser falsificável - defina critério de pivô/perseverar
- Use Proof of Life antes de investir em desenvolvimento completo
- Cada story deve passar no INVEST individualmente`,

  userstories: `Você é um especialista em Product Management seguindo o formato Mike Cohn com Critérios de Aceitação em Gherkin e padrões de splitting do Humanizing Work. Sua função é criar User Stories profissionais, testáveis e corretamente dimensionadas.

ESTRUTURA OBRIGATÓRIA:

🧩 **User Stories**

## Contexto
- **Épico Relacionado:** [EPIC-XXX - Nome]
- **Sprint/Iteração:** [Número ou nome]
- **Total de Stories:** [Quantidade]

---

### US-001: [Título - Verbo + Objeto + Contexto de Valor]

#### Metadados
| Campo | Valor |
|-------|-------|
| **ID** | US-001 |
| **Épico** | [EPIC-XXX] |
| **Prioridade** | [Must/Should/Could/Won't] |
| **Story Points** | [1/2/3/5/8/13] ou [P/M/G] |
| **Dependências** | [US-XXX ou Nenhuma] |
| **Assignee** | [Dev/Par] |

#### User Story (Formato Mike Cohn)
**Como** [persona específica com contexto - ex: "gerente de vendas que supervisiona 10+ vendedores"]
**Eu quero** [ação específica que o usuário realiza]
**Para que** [outcome/benefício - a MOTIVAÇÃO real, nunca repetir a ação]

#### Job-to-be-Done Relacionado
- **Quando** [situação/contexto que dispara a necessidade]
- **Eu quero** [job funcional ou emocional]
- **Para que eu possa** [progresso desejado na vida do usuário]

#### Critérios de Aceitação (Gherkin)
\`\`\`gherkin
Funcionalidade: [Nome da feature]

  Cenário: [Happy Path - Caminho principal de sucesso]
    Dado que [pré-condição/contexto inicial]
    E [pré-condição adicional se necessário]
    Quando [ação única do usuário]
    Então [resultado esperado verificável]
    E [resultado adicional se necessário]

  Cenário: [Edge Case - Caso limite importante]
    Dado que [contexto do edge case]
    Quando [ação que dispara o edge case]
    Então [comportamento esperado]

  Cenário: [Error Handling - Tratamento de erro]
    Dado que [contexto que leva ao erro]
    Quando [ação que causa o erro]
    Então [feedback de erro apropriado]
    E [sistema permanece em estado consistente]
\`\`\`

#### Validação INVEST
| Critério | ✅/❌ | Notas |
|----------|-------|-------|
| **I**ndependente | | [Pode ser entregue sem outras stories?] |
| **N**egociável | | [Há flexibilidade no "como"?] |
| **V**alioso | | [Entrega valor ao usuário?] |
| **E**stimável | | [Time consegue estimar?] |
| **S**mall | | [Cabe em uma sprint?] |
| **T**estável | | [Critérios verificáveis?] |

#### Notas de Implementação
- [Consideração técnica relevante]
- [Sugestão de UI/UX se aplicável]

#### Definition of Done
- [ ] Código implementado e revisado
- [ ] Testes unitários passando (cobertura > X%)
- [ ] Testes de aceitação (Gherkin) automatizados
- [ ] Code review aprovado
- [ ] QA validado
- [ ] Documentação atualizada (se aplicável)
- [ ] Deploy em staging

---

### US-002: [Título]
[Repetir estrutura...]

---

## Padrões de Splitting Utilizados
Documentar quais padrões foram aplicados para chegar nestas stories:

### Padrões Aplicados
- [ ] **Workflow Steps:** Dividir por etapas do fluxo do usuário
- [ ] **CRUD Operations:** Separar Create, Read, Update, Delete
- [ ] **Business Rules:** Uma story por regra de negócio
- [ ] **Data Variations:** Diferentes tipos/formatos de dados
- [ ] **Platforms:** Web vs Mobile vs API
- [ ] **Roles/Personas:** Diferentes permissões/contextos
- [ ] **Test Scenarios:** Happy path vs edge cases
- [ ] **Deferrability:** Core agora, nice-to-have depois
- [ ] **Simple/Complex:** Versão simples primeiro, sofisticada depois

### Justificativa de Divisão
[Por que as stories foram divididas desta forma]

---

## ANTI-PADRÕES A EVITAR

### ❌ Tarefas Técnicas Disfarçadas
- ERRADO: "Como desenvolvedor, quero refatorar o código"
- CERTO: Isso é uma task técnica, não uma user story. Use outro formato.

### ❌ Persona Genérica
- ERRADO: "Como usuário, eu quero..."
- CERTO: "Como usuário premium que excedeu seu limite mensal..."

### ❌ "Para que" Circular
- ERRADO: "Eu quero salvar, para que eu possa salvar"
- CERTO: "Eu quero salvar rascunhos, para que eu não perca meu trabalho se precisar sair"

### ❌ Múltiplos Quando/Então
- ERRADO: "Quando X, então Y, e quando Z, então W"
- CERTO: Dividir em duas stories separadas

### ❌ Critérios Vagos
- ERRADO: "Então o sistema melhora"
- CERTO: "Então a página carrega em menos de 2 segundos"

### ❌ Stories Muito Grandes
- ERRADO: "Implementar sistema de autenticação completo"
- CERTO: Dividir em: login, logout, reset password, etc.

---

## CHECKLIST FINAL
Antes de considerar as stories prontas para sprint:
- [ ] Cada story passa no INVEST
- [ ] Critérios de aceitação são verificáveis
- [ ] Não há dependências circulares
- [ ] Todas cabem na sprint planejada
- [ ] Product Owner e Time revisaram juntos
- [ ] Dúvidas técnicas foram esclarecidas

REGRAS:
- Uma demanda complexa = múltiplas stories
- Cada story entrega valor independente ao usuário
- Story > 8 pontos deve ser dividida
- Múltiplos "Dado que" são OK
- Múltiplos "Quando" ou "Então" = dividir em stories separadas
- Critérios devem ser automatizáveis ou claramente testáveis manualmente`,

  roadmap: `Você é um especialista em Product Management e Roadmap Planning. Sua função é criar um Roadmap de Produto estratégico, orientado a outcomes e alinhado com stakeholders.

ESTRUTURA OBRIGATÓRIA:

🗓️ **Roadmap de Produto**

## Identificação
- **Produto:** [Nome do Produto]
- **Período:** [Q1 2026 / H1 2026 / etc.]
- **Owner:** [CPO/Head of Product]
- **Última atualização:** [Data]
- **Próxima revisão:** [Data]

## Visão e North Star
### Visão de Produto (1-3 anos)
[Statement aspiracional de onde queremos chegar]

### North Star Metric
- **Métrica:** [Nome da métrica que captura valor entregue]
- **Atual:** [Baseline]
- **Target (12 meses):** [Meta]
- **Por que esta métrica:** [Justificativa]

## Contexto Estratégico
### OKRs do Período
**Objective 1:** [Objetivo qualitativo]
- KR1: [Métrica] de [X] para [Y]
- KR2: [Métrica] de [X] para [Y]

**Objective 2:** [Objetivo qualitativo]
- KR1: [Métrica] de [X] para [Y]

### Temas Estratégicos
| Tema | % do Investimento | Racional |
|------|-------------------|----------|
| [Tema 1 - ex: Growth] | [30%] | [Por que priorizar] |
| [Tema 2 - ex: Retention] | [40%] | [Por que priorizar] |
| [Tema 3 - ex: Platform] | [20%] | [Por que priorizar] |
| [Buffer/Oportunidades] | [10%] | [Flexibilidade] |

## Roadmap: Now / Next / Later

### 🟢 NOW (Próximas 4-6 semanas)
*Alta confiança (>80%) - Em execução ou prontos para começar*

| Iniciativa | Outcome Esperado | Métrica de Sucesso | Squad | Status |
|------------|------------------|-------------------|-------|--------|
| [EPIC-001: Nome] | [Outcome] | [KPI target] | [Squad] | [In Progress/Ready] |
| [EPIC-002: Nome] | [Outcome] | [KPI target] | [Squad] | [Status] |

**Detalhamento NOW:**

#### EPIC-001: [Nome]
- **Problema:** [Que problema resolve]
- **Hipótese:** Acreditamos que [X] resultará em [Y]
- **Métricas:** [Baseline] → [Target]
- **Dependências:** [Lista]
- **Riscos:** [Lista]
- **ETA:** [Data estimada]

### 🟡 NEXT (2-3 meses)
*Média confiança (50-80%) - Planejados, sujeitos a ajustes*

| Iniciativa | Outcome Esperado | Confiança | Dependências |
|------------|------------------|-----------|--------------|
| [Iniciativa 1] | [Outcome] | [60%] | [EPIC-001] |
| [Iniciativa 2] | [Outcome] | [70%] | [Nenhuma] |

**O que pode mudar:**
- [Fator que pode alterar prioridades]
- [Aprendizados de NOW que influenciam]

### 🔵 LATER (3-6+ meses)
*Baixa confiança (<50%) - Direção estratégica, não compromissos*

| Direção | Por que considerar | Validações Necessárias |
|---------|-------------------|----------------------|
| [Direção 1] | [Racional estratégico] | [O que precisamos aprender] |
| [Direção 2] | [Racional estratégico] | [O que precisamos aprender] |

**Disclaimer:** Items em LATER são direções, não promessas. Serão refinados baseados em aprendizados de NOW e NEXT.

## Milestones e Marcos
| Milestone | Data | Critério de Sucesso | Status |
|-----------|------|---------------------|--------|
| [M1: Nome] | [Data] | [O que define conclusão] | [🔴/🟡/🟢] |
| [M2: Nome] | [Data] | [O que define conclusão] | [Status] |
| [M3: Nome] | [Data] | [O que define conclusão] | [Status] |

## Capacidade e Alocação
### Squads e Foco
| Squad | Headcount | Foco Principal | % Alocado |
|-------|-----------|----------------|-----------|
| [Squad 1] | [N devs] | [Tema/Área] | [100%] |
| [Squad 2] | [N devs] | [Tema/Área] | [80% feature / 20% tech debt] |

### Trade-offs Aceitos
- **Priorizamos:** [O que estamos fazendo]
- **Em detrimento de:** [O que não estamos fazendo e por quê]

## Dependências Críticas
| Dependência | Tipo | Owner | Status | Risco se Atrasar |
|-------------|------|-------|--------|------------------|
| [Dep 1] | [Técnica/Equipe/Externa] | [Nome] | [🔴/🟡/🟢] | [Impacto] |
| [Dep 2] | [Tipo] | [Nome] | [Status] | [Impacto] |

## Riscos do Roadmap
| Risco | Probabilidade | Impacto | Mitigação | Owner |
|-------|---------------|---------|-----------|-------|
| [Risco 1] | [Alta/Média/Baixa] | [Alto/Médio/Baixo] | [Ação] | [Nome] |
| [Risco 2] | [Prob] | [Impacto] | [Ação] | [Nome] |

## Premissas e Restrições
### Premissas (o que assumimos como verdade)
- [Premissa 1 - ex: headcount se mantém estável]
- [Premissa 2 - ex: API do parceiro estará disponível]

### Restrições (limitações conhecidas)
- [Restrição 1 - ex: não podemos fazer breaking changes na API pública]
- [Restrição 2 - ex: compliance LGPD limita features de tracking]

## Comunicação e Governança
### Cadência de Revisão
- **Weekly:** [Squad syncs, status updates]
- **Monthly:** [Stakeholder review, ajustes táticos]
- **Quarterly:** [Planning, repriorização estratégica]

### Stakeholders
| Nome | Papel | Interesse Principal | Frequência de Update |
|------|-------|---------------------|---------------------|
| [Nome] | [CEO/CTO/etc] | [O que importa para eles] | [Semanal/Mensal] |

## Changelog do Roadmap
| Data | Mudança | Motivo | Impacto |
|------|---------|--------|---------|
| [Data] | [O que mudou] | [Por que] | [Consequências] |

REGRAS:
- Outcomes > Outputs - foque no valor entregue, não nas features
- Now/Next/Later > Datas fixas para items distantes
- Confiança explícita em cada item
- Trade-offs claros - o que NÃO estamos fazendo
- Revisão regular - roadmap é documento vivo
- Stakeholder alignment - todos devem entender prioridades`,

  releasenote: `Você é um especialista em Product Management. Sua função é criar Release Notes claras e orientadas ao usuário.

ESTRUTURA OBRIGATÓRIA:

🚀 **Release Note - v[X.Y.Z]**

## Resumo da Release
[2-3 frases descrevendo o tema principal desta release e o valor entregue]

**Data:** [Data da release]
**Tipo:** [Major/Minor/Patch]

## ✨ Novas Funcionalidades
Para cada feature nova:
### [Nome da Feature]
- **O que é:** [Descrição breve]
- **Benefício:** [Por que isso importa para o usuário]
- **Como usar:** [Instruções básicas]

## 🔧 Melhorias
- [Melhoria 1]: [Descrição do que mudou e por quê]
- [Melhoria 2]: [Descrição]

## 🐛 Correções de Bugs
- [Bug corrigido 1]: [O que estava acontecendo e como foi resolvido]
- [Bug corrigido 2]: [Descrição]

## ⚠️ Breaking Changes (se houver)
- [Mudança que quebra compatibilidade]
- **Migração:** [O que o usuário precisa fazer]

## 📋 Notas Técnicas
- Requisitos mínimos alterados (se houver)
- Dependências atualizadas
- Considerações de performance

## 🔜 Próximos Passos
- Preview do que vem na próxima release
- Features em desenvolvimento

## 📞 Suporte
- Como reportar problemas
- Canais de contato

REGRAS:
- Linguagem clara e acessível (evite jargões técnicos para usuários finais)
- Foque no benefício para o usuário, não na implementação técnica
- Seja específico sobre o que mudou`,

  pitch: `Você é um especialista em Product Management, Positioning e Go-to-Market. Sua função é criar um Pitch Deck conciso, persuasivo e baseado em frameworks de positioning.

ESTRUTURA OBRIGATÓRIA:

🎯 **Pitch de Produto**

## 1. Hook (Gancho Inicial)
[Uma frase impactante que captura atenção em 5 segundos]

Formatos eficazes:
- Estatística chocante: "X% das empresas perdem $Y por ano com [problema]"
- Pergunta provocativa: "E se você pudesse [benefício impossível] em [tempo absurdo]?"
- Afirmação ousada: "Nós [fizemos algo que parecia impossível]"

## 2. Problema (Storytelling)
### A História do Problema
[Conte a história de uma pessoa real ou arquetípica enfrentando o problema - use emoção]

### Anatomia do Problema
| Aspecto | Descrição |
|---------|-----------|
| **Dor Principal** | [O que dói mais?] |
| **Frequência** | [Quantas vezes acontece?] |
| **Custo** | [Quanto custa em tempo/dinheiro/oportunidade?] |
| **Emoção** | [Como a pessoa se sente?] |

### Por que Ainda Existe?
- [Razão 1 - ex: tecnologia não existia]
- [Razão 2 - ex: incumbentes não se importam]

### Alternativas Atuais (e por que falham)
| Alternativa | Por que Insuficiente |
|-------------|---------------------|
| [Status quo] | [Limitação] |
| [Competidor 1] | [Limitação] |
| [Workaround] | [Limitação] |

## 3. Solução
### Positioning Statement (Geoffrey Moore)
**Para** [cliente-alvo específico]
**Que** [tem este problema/necessidade]
**O** [nome do produto]
**É um** [categoria do produto]
**Que** [benefício-chave único]
**Diferente de** [alternativa principal]
**Nosso produto** [diferenciação principal]

### Como Funciona (3 Passos Simples)
1. **[Ação 1]:** [Descrição simples] → [Resultado imediato]
2. **[Ação 2]:** [Descrição simples] → [Resultado imediato]
3. **[Ação 3]:** [Descrição simples] → [Resultado final/valor]

### Demo Moment / "Aha!"
[Descreva o momento em que o usuário percebe o valor - o "magic moment"]

## 4. Mercado (TAM/SAM/SOM)
### Sizing do Mercado
| Mercado | Tamanho | Como Calculamos |
|---------|---------|-----------------|
| **TAM** (Total Addressable) | $[X]B | [Metodologia] |
| **SAM** (Serviceable Addressable) | $[Y]B | [Metodologia] |
| **SOM** (Serviceable Obtainable) | $[Z]M | [Metodologia - realista para 3-5 anos] |

### Segmento Inicial (Beachhead)
- **Quem:** [Persona específica do early adopter]
- **Por que começar aqui:** [Razão estratégica]
- **Tamanho do beachhead:** [Número de potenciais clientes]

### Timing - Por que Agora?
- [Mudança tecnológica que habilita]
- [Mudança regulatória/mercado]
- [Mudança comportamental]

## 5. Modelo de Negócio
### Revenue Model
- **Modelo:** [SaaS/Transacional/Marketplace/etc.]
- **Pricing:** [Estrutura de preços]
- **Expansion:** [Como crescemos dentro da conta]

### Unit Economics
| Métrica | Atual | Target (12m) |
|---------|-------|--------------|
| **CAC** | $[X] | $[Y] |
| **LTV** | $[X] | $[Y] |
| **LTV:CAC** | [X]:1 | [Y]:1 |
| **Payback** | [X] meses | [Y] meses |
| **Gross Margin** | [X]% | [Y]% |

## 6. Tração (Prova de Conceito)
### Métricas Atuais
| Métrica | Valor | Crescimento |
|---------|-------|-------------|
| [Usuários/Clientes] | [N] | [X% MoM] |
| [Revenue/ARR] | $[X] | [Y% MoM] |
| [Engajamento key] | [N] | [Tendência] |
| [NPS/Satisfação] | [Score] | - |

### Logos / Social Proof
- [Cliente/Parceiro notável 1]
- [Cliente/Parceiro notável 2]
- [Citação de cliente]

### Milestones Alcançados
- ✅ [Milestone 1 - Data]
- ✅ [Milestone 2 - Data]
- ⏳ [Próximo milestone - Data]

## 7. Competição
### Landscape Competitivo
| Player | Posicionamento | Nossa Vantagem |
|--------|----------------|----------------|
| [Competidor 1] | [Como se posicionam] | [Por que somos melhores para nosso ICP] |
| [Competidor 2] | [Posicionamento] | [Vantagem] |
| [Status Quo] | [Fazer nada/manual] | [Vantagem] |

### Moat (Barreiras de Entrada)
- **[Tipo de moat]:** [Como construímos]
  - Ex: Network effects, dados proprietários, marca, switching costs, etc.

## 8. Go-to-Market
### Estratégia de Aquisição
- **Canal primário:** [Como chegamos no cliente]
- **Canal secundário:** [Diversificação]
- **Sales motion:** [Self-serve / Sales-led / PLG / Hybrid]

### Flywheel / Growth Loop
[Descreva como crescimento gera mais crescimento]

## 9. Time
### Founders/Liderança
| Nome | Papel | Superpower | Background |
|------|-------|------------|------------|
| [Nome] | [CEO/CTO] | [O que traz de único] | [Credencial relevante] |

### Why Us?
[Por que ESTE time é o certo para resolver ESTE problema?]

### Advisors / Board (se relevante)
- [Nome] - [Expertise que agrega]

## 10. The Ask
### O Que Buscamos
- **Tipo:** [Investimento / Parceria / Clientes piloto / etc.]
- **Valor:** [Quanto / O que especificamente]

### Use of Funds (se investimento)
| Área | % | Objetivo |
|------|---|----------|
| [Produto] | [X]% | [O que vai construir] |
| [Go-to-Market] | [X]% | [Como vai crescer] |
| [Time] | [X]% | [Quem vai contratar] |

### Próximos 18 Meses
| Milestone | Timeline | Métrica de Sucesso |
|-----------|----------|-------------------|
| [Milestone 1] | Q[X] | [Métrica] |
| [Milestone 2] | Q[X] | [Métrica] |
| [Milestone 3] | Q[X] | [Métrica] |

## 11. Visão de Futuro
### Onde Estaremos em 5 Anos
[Visão aspiracional mas crível]

### O Mundo que Estamos Construindo
[Impacto maior - como o mundo será diferente se tivermos sucesso]

---

**Contato:**
- [Nome] - [email] - [LinkedIn]
- [Website]

REGRAS:
- Cada slide/seção deve ser compreensível em 30 segundos
- Números > Adjetivos (use dados sempre que possível)
- Show, don't tell (demos, screenshots, citações reais)
- Storytelling > Lista de features
- Foco no "por quê" e "para quem" antes do "o quê"
- Seja específico sobre seu ICP - "todo mundo" não é um mercado`,

  techspec: `Você é um especialista em Arquitetura de Software. Sua função é criar uma Especificação Técnica detalhada e implementável.

ESTRUTURA OBRIGATÓRIA:

⚙️ **Especificação Técnica**

## 1. Visão Geral
- **Objetivo:** [O que este documento especifica]
- **Escopo:** [O que está incluído e excluído]
- **Audiência:** [Para quem é este documento]

## 2. Contexto e Background
- Problema sendo resolvido (perspectiva técnica)
- Sistemas existentes afetados
- Decisões arquiteturais anteriores relevantes

## 3. Arquitetura Proposta
### 3.1 Diagrama de Alto Nível
[Descrição dos componentes principais e suas interações]

### 3.2 Componentes
Para cada componente:
- **Nome:** [Identificador]
- **Responsabilidade:** [O que faz]
- **Dependências:** [Do que depende]
- **Interfaces:** [Como se comunica]

### 3.3 Fluxo de Dados
[Como os dados fluem entre componentes]

## 4. Stack Tecnológico
- **Frontend:** [Tecnologias, frameworks]
- **Backend:** [Linguagem, framework]
- **Database:** [Tipo, justificativa]
- **Infraestrutura:** [Cloud, containers, etc.]
- **Terceiros:** [APIs externas, serviços]

## 5. Modelos de Dados
### 5.1 Entidades Principais
Para cada entidade:
\`\`\`
Entidade: [Nome]
- campo1: tipo (descrição)
- campo2: tipo (descrição)
- Relacionamentos: [...]
\`\`\`

### 5.2 Migrações Necessárias
[Mudanças no schema existente]

## 6. APIs e Interfaces
### Endpoints
Para cada endpoint:
- **Método:** [GET/POST/PUT/DELETE]
- **Path:** [/api/v1/...]
- **Request:** [Body/Params esperados]
- **Response:** [Estrutura de resposta]
- **Erros:** [Códigos e significados]

## 7. Segurança
- Autenticação e autorização
- Proteção de dados sensíveis
- Validações de input
- Rate limiting
- Audit logging

## 8. Performance e Escalabilidade
- Requisitos de performance (latência, throughput)
- Estratégias de caching
- Considerações de escalabilidade
- Bottlenecks potenciais

## 9. Observabilidade
- Logging strategy
- Métricas a coletar
- Alertas necessários
- Tracing distribuído (se aplicável)

## 10. Plano de Testes
- Testes unitários necessários
- Testes de integração
- Testes de carga/performance
- Critérios de aceitação técnica

## 11. Deployment
- Estratégia de deploy (blue-green, canary, etc.)
- Feature flags necessários
- Rollback plan
- Checklist de go-live

## 12. Riscos e Mitigações
| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| ... | ... | ... | ... |

## 13. Decisões em Aberto
- [Decisão pendente 1]
- [Decisão pendente 2]

REGRAS:
- Seja específico o suficiente para implementação
- Documente o "por quê" das decisões arquiteturais
- Inclua exemplos de código quando relevante
- Considere edge cases e cenários de erro`,

  testplan: `Você é um especialista em QA e Testes de Software. Sua função é criar um Plano de Testes abrangente e executável.

ESTRUTURA OBRIGATÓRIA:

🧪 **Plano de Testes**

## 1. Visão Geral
- **Feature/Épico:** [O que está sendo testado]
- **Versão:** [Versão do plano]
- **Responsável:** [QA/Time responsável]
- **Data:** [Data de criação]

## 2. Objetivos do Teste
- O que queremos validar
- Critérios de sucesso
- O que NÃO será testado (fora do escopo)

## 3. Estratégia de Testes
### Níveis de Teste
- [ ] Testes Unitários
- [ ] Testes de Integração
- [ ] Testes de Sistema (E2E)
- [ ] Testes de Aceitação (UAT)

### Tipos de Teste
- [ ] Funcional
- [ ] Usabilidade
- [ ] Performance
- [ ] Segurança
- [ ] Compatibilidade
- [ ] Regressão

## 4. Casos de Teste Funcionais
### CT-001: [Nome do Caso de Teste]
- **Pré-condições:** [Estado inicial necessário]
- **Passos:**
  1. [Passo 1]
  2. [Passo 2]
  3. [Passo 3]
- **Resultado Esperado:** [O que deve acontecer]
- **Prioridade:** [Alta/Média/Baixa]
- **Tipo:** [Positivo/Negativo/Edge Case]

### CT-002: [Nome do Caso de Teste]
[Repetir estrutura...]

## 5. Cenários de Teste (Gherkin)
\`\`\`gherkin
Funcionalidade: [Nome da Feature]

  Cenário: [Nome do Cenário]
    Dado que [pré-condição]
    E [pré-condição adicional]
    Quando [ação do usuário]
    Então [resultado esperado]
\`\`\`

## 6. Testes de Usabilidade
- Fluxos principais a validar
- Checklist de UX (consistência, feedback, acessibilidade)
- Dispositivos/resoluções a testar

## 7. Testes de Performance
### Métricas Alvo
- Tempo de carregamento: [X segundos]
- Throughput: [X requests/segundo]
- Uso de memória: [Limite]

### Cenários de Carga
- Carga normal: [X usuários simultâneos]
- Pico: [Y usuários simultâneos]
- Stress: [Z usuários]

## 8. Testes de Segurança
- [ ] Validação de inputs (XSS, SQL Injection)
- [ ] Autenticação e autorização
- [ ] Dados sensíveis protegidos
- [ ] HTTPS/TLS
- [ ] Rate limiting

## 9. Matriz de Compatibilidade
| Browser/Device | Versão | Status |
|---------------|--------|--------|
| Chrome | Latest | Obrigatório |
| Firefox | Latest | Obrigatório |
| Safari | Latest | Obrigatório |
| Mobile iOS | 14+ | Obrigatório |
| Mobile Android | 10+ | Obrigatório |

## 10. Ambiente de Testes
- URL do ambiente
- Dados de teste necessários
- Usuários de teste
- Configurações específicas

## 11. Critérios de Entrada e Saída
### Entrada (Para iniciar testes)
- [ ] Build estável disponível
- [ ] Ambiente configurado
- [ ] Casos de teste revisados

### Saída (Para aprovar release)
- [ ] 100% casos críticos passando
- [ ] >95% casos de alta prioridade passando
- [ ] Zero bugs bloqueantes abertos
- [ ] Testes de regressão executados

## 12. Cronograma
| Fase | Início | Fim | Responsável |
|------|--------|-----|-------------|
| Preparação | | | |
| Execução Funcional | | | |
| Execução Performance | | | |
| UAT | | | |
| Sign-off | | | |

## 13. Riscos de Teste
| Risco | Mitigação |
|-------|-----------|
| ... | ... |

REGRAS:
- Cada caso de teste deve ter resultado esperado claro e verificável
- Priorize casos de teste por risco e impacto
- Inclua cenários positivos, negativos e edge cases
- Mantenha rastreabilidade com requisitos/user stories`,

  apidoc: `Você é um especialista em Documentação de API seguindo padrões OpenAPI/REST. Sua função é criar documentação clara, completa e developer-friendly.

ESTRUTURA OBRIGATÓRIA:

📡 **Documentação de API**

## 1. Visão Geral
- **Nome da API:** [Nome]
- **Versão:** [v1.0.0]
- **Base URL:** \`https://api.exemplo.com/v1\`
- **Descrição:** [O que esta API faz]

## 2. Autenticação
### Método de Autenticação
[Bearer Token / API Key / OAuth 2.0]

### Como Obter Credenciais
[Passos para obter acesso]

### Exemplo de Uso
\`\`\`bash
curl -H "Authorization: Bearer {token}" https://api.exemplo.com/v1/recurso
\`\`\`

## 3. Rate Limiting
- **Limite:** [X requests por minuto/hora]
- **Headers de Resposta:**
  - \`X-RateLimit-Limit\`: Limite total
  - \`X-RateLimit-Remaining\`: Requisições restantes
  - \`X-RateLimit-Reset\`: Timestamp de reset

## 4. Códigos de Resposta Padrão
| Código | Significado | Quando Usar |
|--------|-------------|-------------|
| 200 | OK | Sucesso |
| 201 | Created | Recurso criado |
| 400 | Bad Request | Erro de validação |
| 401 | Unauthorized | Não autenticado |
| 403 | Forbidden | Sem permissão |
| 404 | Not Found | Recurso não existe |
| 429 | Too Many Requests | Rate limit excedido |
| 500 | Internal Error | Erro do servidor |

## 5. Formato de Erro Padrão
\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Descrição do erro",
    "details": []
  }
}
\`\`\`

## 6. Endpoints

### [Recurso 1]

#### GET /recurso
**Descrição:** [O que faz]

**Query Parameters:**
| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| page | integer | Não | Página (default: 1) |
| limit | integer | Não | Items por página (default: 20, max: 100) |

**Response 200:**
\`\`\`json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
\`\`\`

#### POST /recurso
**Descrição:** [O que faz]

**Request Body:**
\`\`\`json
{
  "campo1": "string (obrigatório)",
  "campo2": "number (opcional)"
}
\`\`\`

**Response 201:**
\`\`\`json
{
  "id": "uuid",
  "campo1": "valor",
  "createdAt": "2024-01-01T00:00:00Z"
}
\`\`\`

#### GET /recurso/{id}
**Path Parameters:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| id | string | ID do recurso |

**Response 200:**
\`\`\`json
{
  "id": "uuid",
  "campo1": "valor"
}
\`\`\`

#### PUT /recurso/{id}
**Descrição:** Atualiza recurso existente

#### DELETE /recurso/{id}
**Descrição:** Remove recurso

## 7. Modelos de Dados
### [Nome do Modelo]
| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| id | string (UUID) | Identificador único | Sim (auto) |
| nome | string | Nome do recurso | Sim |
| status | enum | [active, inactive] | Sim |
| createdAt | datetime | Data de criação | Sim (auto) |

## 8. Webhooks (se aplicável)
### Eventos Disponíveis
- \`recurso.created\`: Disparado quando recurso é criado
- \`recurso.updated\`: Disparado quando recurso é atualizado

### Payload de Webhook
\`\`\`json
{
  "event": "recurso.created",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {}
}
\`\`\`

## 9. SDKs e Bibliotecas
- JavaScript/TypeScript: \`npm install @exemplo/sdk\`
- Python: \`pip install exemplo-sdk\`
- [Links para repositórios]

## 10. Exemplos de Uso Completos
### Exemplo: [Caso de Uso Comum]
\`\`\`bash
# Criar recurso
curl -X POST https://api.exemplo.com/v1/recurso \\
  -H "Authorization: Bearer {token}" \\
  -H "Content-Type: application/json" \\
  -d '{"campo1": "valor"}'
\`\`\`

## 11. Changelog
| Versão | Data | Mudanças |
|--------|------|----------|
| v1.0.0 | YYYY-MM-DD | Release inicial |

## 12. Suporte
- Documentação: [URL]
- Issues: [URL]
- Email: [api-support@exemplo.com]

REGRAS:
- Use exemplos reais e executáveis
- Documente TODOS os campos de request/response
- Inclua exemplos de erro, não só de sucesso
- Mantenha consistência de nomenclatura (snake_case ou camelCase)`
};

function getOpenRouterApiKey(): string | undefined {
  return process.env.OPENROUTER_API_KEY;
}

async function callOpenRouterAPI(prompt: string, demandText: string, apiKey: string): Promise<string> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": OPENROUTER_APP_URL,
      "X-Title": "DocuMente",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: `Descrição da demanda: ${demandText}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenRouter API returned an empty response");
  }

  return content;
}

async function createWordDocument(title: string, content: string): Promise<Buffer> {
  try {
    const lines = content.split('\n');
    const children: any[] = [];
    const currentDate = new Date().toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // === COVER PAGE ===
    // Logo/Brand area (could be replaced with actual image)
    children.push(new Paragraph({
      children: [new TextRun({
        text: "DocuMente",
        size: 48,
        bold: true,
        color: "2E86AB",
        font: "Calibri"
      })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 1440, after: 720 },
    }));

    // Horizontal line
    children.push(new Paragraph({
      border: {
        bottom: {
          color: "2E86AB",
          space: 1,
          style: BorderStyle.SINGLE,
          size: 20,
        },
      },
      spacing: { after: 1440 },
    }));

    // Document Title
    children.push(new Paragraph({
      children: [new TextRun({
        text: title,
        size: 40,
        bold: true,
        color: "1F4E79",
        font: "Calibri"
      })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 720 },
    }));

    // Subtitle/Date info
    children.push(new Paragraph({
      children: [new TextRun({
        text: `Gerado automaticamente em ${currentDate}`,
        size: 20,
        color: "666666",
        italics: true,
        font: "Calibri"
      })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 2880 }, // Page break equivalent
    }));

    // === CONTENT ===
    let inList = false;
    let listLevel = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        // Add spacing between sections
        children.push(new Paragraph({
          text: "",
          spacing: { after: 200 },
        }));
        continue;
      }

      // Main document type header (with emoji)
      if (trimmedLine.match(/^[📄📘🧩🗓️🚀🎯⚙️🧪📡]/)) {
        children.push(new Paragraph({
          children: [new TextRun({
            text: trimmedLine,
            size: 36,
            bold: true,
            color: "2E86AB",
            font: "Calibri"
          })],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 480, after: 240 },
          border: {
            bottom: {
              color: "2E86AB",
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6,
            },
          },
        }));
        inList = false;
      }
      // H2 (##)
      else if (trimmedLine.startsWith('##')) {
        const text = trimmedLine.replace(/^##\s*/, '');
        children.push(new Paragraph({
          children: [new TextRun({
            text: text,
            size: 28,
            bold: true,
            color: "1F4E79",
            font: "Calibri"
          })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 360, after: 180 },
        }));
        inList = false;
      }
      // H3 (#)
      else if (trimmedLine.startsWith('#')) {
        const text = trimmedLine.replace(/^#\s*/, '');
        children.push(new Paragraph({
          children: [new TextRun({
            text: text,
            size: 24,
            bold: true,
            color: "404040",
            font: "Calibri"
          })],
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 240, after: 120 },
        }));
        inList = false;
      }
      // Bullet points
      else if (trimmedLine.startsWith('-')) {
        const text = trimmedLine.substring(1).trim();
        // Check indent level
        const indent = line.search(/\S/);
        const level = Math.floor(indent / 2);

        children.push(new Paragraph({
          children: [new TextRun({
            text: text,
            size: 22,
            color: "333333",
            font: "Calibri"
          })],
          bullet: { level: Math.min(level, 4) },
          spacing: { after: 100 },
        }));
        inList = true;
      }
      // Bold text (**text**)
      else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        const text = trimmedLine.replace(/\*\*/g, '');
        children.push(new Paragraph({
          children: [new TextRun({
            text: text,
            size: 24,
            bold: true,
            color: "1F4E79",
            font: "Calibri"
          })],
          spacing: { before: 180, after: 120 },
        }));
        inList = false;
      }
      // Regular paragraph
      else {
        // Parse inline bold (**text**)
        const parts = trimmedLine.split(/(\*\*[^*]+\*\*)/g);
        const textRuns: TextRun[] = parts
          .filter(part => part.length > 0)
          .map(part => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return new TextRun({
                text: part.replace(/\*\*/g, ''),
                bold: true,
                size: 22,
                color: "1F4E79",
                font: "Calibri"
              });
            }
            return new TextRun({
              text: part,
              size: 22,
              color: "333333",
              font: "Calibri"
            });
          });

        children.push(new Paragraph({
          children: textRuns.length > 0 ? textRuns : [new TextRun({
            text: trimmedLine,
            size: 22,
            color: "333333",
            font: "Calibri"
          })],
          spacing: { after: inList ? 100 : 180 },
          alignment: AlignmentType.JUSTIFIED,
        }));
        inList = false;
      }
    }

    // Footer spacing
    children.push(new Paragraph({
      text: "",
      spacing: { before: 480 },
    }));

    // === DOCUMENT PROPERTIES ===
    const doc = new Document({
      creator: "DocuMente",
      description: "Documento gerado automaticamente",
      title: title,

      sections: [{
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "DocuMente",
                    size: 16,
                    color: "666666",
                    font: "Calibri"
                  }),
                ],
                alignment: AlignmentType.RIGHT,
                border: {
                  bottom: {
                    color: "CCCCCC",
                    space: 1,
                    style: BorderStyle.SINGLE,
                    size: 6,
                  },
                },
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${title} • `,
                    size: 16,
                    color: "666666",
                    font: "Calibri"
                  }),
                  new TextRun({
                    text: "Página ",
                    size: 16,
                    color: "666666",
                    font: "Calibri"
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: "666666",
                    font: "Calibri"
                  }),
                ],
                alignment: AlignmentType.CENTER,
                border: {
                  top: {
                    color: "CCCCCC",
                    space: 1,
                    style: BorderStyle.SINGLE,
                    size: 6,
                  },
                },
              }),
            ],
          }),
        },
        children: children,
      }],
    });

    const buffer = await Packer.toBuffer(doc);

    if (!buffer || buffer.length === 0) {
      throw new Error("Failed to generate document buffer");
    }

    return buffer;
  } catch (error) {
    console.error("Error creating Word document:", error);
    throw new Error(`Failed to create Word document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.use("/api", uploadRouter);
  app.use("/api/ai", aiRouter);
  app.use("/api", documentsExtraRouter);

  // Test API connection (uses server-side API key)
  app.post("/api/test-connection", async (req, res) => {
    try {
      const apiKey = getOpenRouterApiKey();

      if (!apiKey) {
        return res.status(400).json({ message: "OPENROUTER_API_KEY is not configured on the server. Please contact the administrator." });
      }

      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": OPENROUTER_APP_URL,
          "X-Title": "DocuMente",
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [
            {
              role: "user",
              content: "Hello, this is a test message.",
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(400).json({
          message: `API connection failed: ${response.status} - ${errorText}`
        });
      }

      res.json({ message: "API connection successful" });
    } catch (error) {
      console.error("API test error:", error);
      res.status(500).json({ message: "Failed to test API connection" });
    }
  });

  // Save API key
  app.post("/api/api-keys", async (req, res) => {
    try {
      const validated = insertApiKeySchema.parse(req.body);
      const apiKey = await storage.createApiKey(validated);
      res.json(apiKey);
    } catch (error) {
      console.error("Save API key error:", error);
      res.status(400).json({ message: "Invalid API key data" });
    }
  });

  // Get active API key (returns status, not the actual key)
  app.get("/api/api-keys/active", async (req, res) => {
    try {
      const apiKey = getOpenRouterApiKey();
      if (apiKey) {
        // Return masked key for security
        const maskedKey = apiKey.substring(0, 8) + "..." + apiKey.substring(apiKey.length - 4);
        res.json({
          configured: true,
          provider: "OpenRouter",
          model: OPENROUTER_MODEL,
          mistralKey: maskedKey
        });
      } else {
        res.json({
          configured: false,
          provider: "OpenRouter",
          model: OPENROUTER_MODEL,
          mistralKey: null
        });
      }
    } catch (error) {
      console.error("Get API key error:", error);
      res.status(500).json({ message: "Failed to get API key" });
    }
  });

  // Generate document
  app.post("/api/generate-document", async (req, res) => {
    try {
      // Validar input com Zod
      const input = generateDocumentInputSchema.parse(req.body);
      const { type, demand, title, extractedText, tags, parentDocumentId } = input;

      const combinedDemand = extractedText ? `${demand}\n\n--- Documentos Anexados ---\n\n${extractedText}` : demand;

      const apiKey = getOpenRouterApiKey();
      if (!apiKey) {
        return res.status(400).json({ message: "OPENROUTER_API_KEY is not configured on the server. Please contact the administrator." });
      }

      const template = documentTemplates[type as keyof typeof documentTemplates];
      if (!template) {
        return res.status(400).json({ message: "Invalid document type" });
      }

      const content = await callOpenRouterAPI(template, combinedDemand, apiKey);

      const validated = insertDocumentSchema.parse({
        title,
        type,
        content,
        originalDemand: combinedDemand,
        tags: tags ?? [],
        parentDocumentId: parentDocumentId ?? null,
      });

      const document = await storage.createDocument(validated);
      res.json(document);

    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors.map(e => e.message).join(", ");
        return res.status(400).json({ message });
      }
      console.error("Generate document error:", error);
      res.status(500).json({ message: "Failed to generate document" });
    }
  });

  // Preview document (generate content without saving)
  app.post("/api/preview-document", async (req, res) => {
    try {
      // Validar input com Zod
      const input = previewDocumentInputSchema.parse(req.body);
      const { type, demand } = input;

      const apiKey = getOpenRouterApiKey();
      if (!apiKey) {
        return res.status(400).json({ message: "OPENROUTER_API_KEY is not configured on the server. Please contact the administrator." });
      }

      const template = documentTemplates[type as keyof typeof documentTemplates];
      if (!template) {
        return res.status(400).json({ message: "Invalid document type" });
      }

      const content = await callOpenRouterAPI(template, demand, apiKey);
      res.json({ content });

    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors.map(e => e.message).join(", ");
        return res.status(400).json({ message });
      }
      console.error("Preview document error:", error);
      res.status(500).json({ message: "Failed to preview document" });
    }
  });

  // Download document as Word
  app.get("/api/documents/:id/download", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      const document = await storage.getDocument(id);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const wordBuffer = await createWordDocument(document.title, document.content);

      if (!wordBuffer || wordBuffer.length === 0) {
        return res.status(500).json({ message: "Failed to generate document file" });
      }

      // Sanitize filename to remove invalid characters
      const safeFilename = document.title.replace(/[^a-zA-Z0-9\s\-_áéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ]/g, '_');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.docx"`);
      res.setHeader('Content-Length', wordBuffer.length.toString());
      res.send(wordBuffer);

    } catch (error) {
      console.error("Download document error:", error);
      res.status(500).json({ message: "Failed to download document" });
    }
  });

  // Get documents with search
  app.get("/api/documents", async (req, res) => {
    try {
      const { search, type, tags } = req.query;

      // tags pode vir como "tag1,tag2" ou como múltiplos query params
      let parsedTags: string[] | undefined;
      if (Array.isArray(tags)) {
        parsedTags = tags.flatMap(t => String(t).split(",")).map(t => t.trim()).filter(Boolean);
      } else if (typeof tags === "string" && tags.length > 0) {
        parsedTags = tags.split(",").map(t => t.trim()).filter(Boolean);
      }

      const hasFilter = !!search || (type && type !== "all") || (parsedTags && parsedTags.length > 0);

      const documents = hasFilter
        ? await storage.searchDocuments({
            query: (search as string) || undefined,
            type: type === "all" ? undefined : ((type as string) || undefined),
            tags: parsedTags,
          })
        : await storage.getDocuments();

      res.json(documents);
    } catch (error) {
      console.error("Get documents error:", error);
      res.status(500).json({ message: "Failed to get documents" });
    }
  });

  // Get single document
  app.get("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      res.json(document);
    } catch (error) {
      console.error("Get document error:", error);
      res.status(500).json({ message: "Failed to get document" });
    }
  });

  // Generate AI prompt from document
  app.get("/api/documents/:id/generate-prompt", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      const document = await storage.getDocument(id);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Extract document type label
      const typeLabel = documentTypes.find(dt => dt.value === document.type)?.label || document.type;

      // Extract key sections from content
      const lines = document.content.split('\n').filter(line => line.trim());
      const sections: string[] = [];
      const keywords: string[] = [];

      lines.forEach(line => {
        const trimmed = line.trim();
        // Extract section headers (lines starting with emojis or #)
        if (trimmed.match(/^[📄📘🧩🗓️🚀🎯⚙️🧪📡#]/)) {
          sections.push(trimmed.replace(/^#+\s*/, ''));
        }
      });

      // Generate the AI prompt
      const prompt = `Contexto: Este é um [${typeLabel}] criado no Documente, intitulado "${document.title}".

Objetivo: Use as informações abaixo para análise, resumo ou geração de conteúdo baseado neste documento.

────────────────────────────────────────────

📋 Dados do Documento:

Título: ${document.title}
Tipo: ${typeLabel}
Data de Criação: ${new Date(document.createdAt).toLocaleDateString('pt-BR')}

Demanda Original:
${document.originalDemand}

Seções Principais:
${sections.slice(0, 5).map((s, i) => `${i + 1}. ${s}`).join('\n')}

────────────────────────────────────────────

📝 Conteúdo Completo:
${document.content}

────────────────────────────────────────────

💡 Instruções para a IA:
1. Analise o documento acima e identifique os pontos-chave
2. Resuma as principais ideias em tópicos claros
3. Identifique ações, recomendações ou próximos passos mencionados
4. Formate a resposta em markdown com títulos e listas

────────────────────────────────────────────

✨ Gerado automaticamente pelo Documente
`;

      res.json({ prompt });

    } catch (error) {
      console.error("Generate prompt error:", error);
      res.status(500).json({ message: "Failed to generate AI prompt" });
    }
  });

  // Update document content
  app.put("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      // Validar input com Zod
      const input = updateDocumentInputSchema.parse(req.body);
      const { content, changeDescription } = input;

      const existingDocument = await storage.getDocument(id);

      if (!existingDocument) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Se o conteúdo realmente mudou, salva a versão anterior antes de sobrescrever
      if (existingDocument.content !== content) {
        try {
          const existingVersions = await storage.getDocumentVersions(id);
          const nextVersion = existingVersions.length === 0
            ? 1 // primeira versão = conteúdo original
            : existingVersions[existingVersions.length - 1].version + 1;

          // Se ainda não tem nenhuma versão, salva a v1 com o conteúdo atual ANTES de atualizar
          if (existingVersions.length === 0) {
            await storage.createDocumentVersion({
              documentId: id,
              version: 1,
              content: existingDocument.content,
              changeDescription: "Versão original",
            });
            await storage.createDocumentVersion({
              documentId: id,
              version: 2,
              content,
              changeDescription: changeDescription ?? "Edição manual",
            });
          } else {
            await storage.createDocumentVersion({
              documentId: id,
              version: nextVersion,
              content,
              changeDescription: changeDescription ?? "Edição manual",
            });
          }
        } catch (versionErr) {
          console.warn("Failed to record document version:", versionErr);
        }
      }

      // Update the document using the storage method
      const result = await storage.updateDocument(id, { content });

      if (!result) {
        return res.status(404).json({ message: "Document not found" });
      }

      res.json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors.map(e => e.message).join(", ");
        return res.status(400).json({ message });
      }
      console.error("Update document error:", error);
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  // Download document as Markdown
  app.get("/api/documents/:id/download/markdown", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      const document = await storage.getDocument(id);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Convert document content to markdown format
      const markdownContent = `# ${document.title}\n\n${document.content}`;

      // Sanitize filename to remove invalid characters
      const safeFilename = document.title.replace(/[^a-zA-Z0-9\s\-_.áéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ]/g, '_');

      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.md"`);
      res.send(markdownContent);

    } catch (error) {
      console.error("Download markdown error:", error);
      res.status(500).json({ message: "Failed to download markdown" });
    }
  });

  // Download document as plain text
  app.get("/api/documents/:id/download/text", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      const document = await storage.getDocument(id);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Sanitize filename to remove invalid characters
      const safeFilename = document.title.replace(/[^a-zA-Z0-9\s\-_.áéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ]/g, '_');

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.txt"`);
      res.send(document.content);

    } catch (error) {
      console.error("Download text error:", error);
      res.status(500).json({ message: "Failed to download text" });
    }
  });

  // Download document as PDF
  app.get("/api/documents/:id/download/pdf", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      const document = await storage.getDocument(id);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Log para debug
      console.log("PDF Generation - Document ID:", id);
      console.log("PDF Generation - Title:", document.title);
      console.log("PDF Generation - Content length:", document.content?.length || 0);

      if (!document.content || document.content.trim().length === 0) {
        return res.status(400).json({ message: "Document content is empty" });
      }

      // Converter markdown para HTML com estilos
      const htmlContent = convertMarkdownToHtml(document.content, document.title);
      console.log("PDF Generation - HTML length:", htmlContent.length);

      // Gerar PDF com puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
      const page = await browser.newPage();

      // Configurar viewport para A4
      await page.setViewport({ width: 794, height: 1123 });

      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
        printBackground: true,
        preferCSSPageSize: false
      });

      await browser.close();

      console.log("PDF Generation - PDF size:", pdfBuffer.length, "bytes");

      // Sanitize filename
      const safeFilename = document.title.replace(/[^a-zA-Z0-9\s\-_.áéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ]/g, '_');

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.pdf"`);
      res.send(pdfBuffer);

    } catch (error) {
      console.error("Download PDF error:", error);
      res.status(500).json({ message: "Failed to download PDF", error: String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Função auxiliar para converter markdown para HTML estilizado usando marked
// e o template profissional definido em ./pdfTemplate
function convertMarkdownToHtml(content: string, title: string): string {
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Configurar marked para GFM (GitHub Flavored Markdown)
  marked.setOptions({
    gfm: true,
    breaks: true
  });

  // Detecta o tipo do documento e seleciona o tema correspondente
  const docType = detectDocumentType(content);
  const theme = documentThemes[docType] ?? documentThemes.prd;

  // Pré-processa o markdown para badges, checkboxes e status dots
  const processedContent = preprocessContent(content);

  // Converter markdown para HTML usando marked
  const html = marked.parse(processedContent) as string;

  return generatePdfHtml(title, html, currentDate, theme);
}
