# PRD: SAYGO Vision - Sprint 1 (UX Redesign + Visão 2032)

**Versão:** 1.0
**Data:** Abril 2026
**Autor:** Product Manager
**Status:** Em Revisão

---

## 1. Sumário Executivo

O SAYGO Vision é uma plataforma de gestão de comércio exterior (comex) que busca se tornar a infraestrutura padrão do mercado até 2032. Este PRD define o escopo da **Sprint 1 (Semanas 1-4)** focada em dois trilhos paralelos:

1. **UX Redesign**: Entregar valor visível ao cliente atual através de melhorias no Dashboard, Kanban de Importações, Câmbio e Monitoramento
2. **Visão 2032**: Iniciar construção das capacidades que viabilizarão Open Finance para comex

**Valor principal:** Transformar o produto de uma ferramenta de relatórios em uma torre de controle inteligente com score proprietário (IEI), alertas proativos e economia comprovada.

**Indicadores-chave de sucesso:**
- NPS do produto ≥ 50
- Retenção de clientes ≥ 95%
- Tempo médio no dashboard +40%

---

## 2. Declaração do Problema

### Problema Principal
Empresas de comércio exterior operam com sistemas fragmentados, sem visão consolidada de suas operações, exposição cambial e oportunidades de economia. O produto atual do Vision entrega relatórios, mas não **narra valor** de forma clara ao usuário.

### Dores do Usuário
- **Falta de visibilidade consolidada:** Usuário precisa navegar por múltiplos relatórios para entender sua operação
- **Decisões reativas:** Sem alertas proativos, problemas são descobertos tarde demais
- **Valor invisível:** Cliente não consegue quantificar a economia que o Vision proporciona
- **UX fragmentada:** 17 módulos organizados de forma confusa na sidebar

### Evidências
- Churn motivado por "não entendo o valor que estou recebendo"
- Baixo tempo de permanência no dashboard atual
- Feedback recorrente sobre complexidade de navegação

### Impacto de NÃO Resolver
- Cancelamentos por percepção de baixo valor
- Incapacidade de justificar renovação
- Perda de competitividade para soluções pontuais mais simples

---

## 3. Usuários-Alvo (Proto-Personas)

### Persona 1: Gestor de Importação (Primária)
| Atributo | Descrição |
|----------|-----------|
| **Perfil** | Coordenador/Gerente de supply chain em indústria média-grande |
| **Idade** | 35-50 anos |
| **Objetivos** | Visibilidade total das importações, controle de custos, evitar surpresas |
| **Frustrações** | Múltiplas planilhas, informação fragmentada, descobrir problemas tarde |
| **Contexto de uso** | Acessa diariamente pela manhã para verificar status das operações |
| **Quote** | "Preciso saber em 30 segundos se tenho algum problema hoje" |

### Persona 2: CFO / Diretor Financeiro (Secundária)
| Atributo | Descrição |
|----------|-----------|
| **Perfil** | Decisor financeiro responsável por exposição cambial |
| **Idade** | 40-55 anos |
| **Objetivos** | Minimizar risco cambial, otimizar timing de fechamento de câmbio |
| **Frustrações** | Não sabe sua exposição total, depende de relatórios manuais |
| **Contexto de uso** | Acessa semanalmente para visão estratégica |
| **Quote** | "Quanto estou exposto ao dólar hoje? E quanto deveria estar?" |

### Persona 3: Contador/Despachante Parceiro (Canal 2 - Futuro)
| Atributo | Descrição |
|----------|-----------|
| **Perfil** | Contador ou despachante que gerencia múltiplos clientes |
| **Idade** | 30-50 anos |
| **Objetivos** | Dashboard único para todos os clientes, certificação de expertise |
| **Frustrações** | Precisa acessar sistema de cada cliente individualmente |
| **Contexto de uso** | Acesso diário gerenciando carteira de clientes |

---

## 4. Contexto Estratégico

### Alinhamento com Objetivos de Negócio
| Objetivo | Como este PRD contribui |
|----------|------------------------|
| Reduzir churn | Dashboard com valor visível (economia comprovada, IEI Score) |
| Aumentar receita por cliente | Base para upsell de módulos premium (Hedge, APIs) |
| Criar moat competitivo | Scoring proprietário (IEI) difícil de replicar |
| Viabilizar Canal 2 | Dashboard multi-RADAR para parceiros |

### Prioridade: **ALTA**
- Sprint 1 é crítica para demonstrar velocidade de execução
- Clientes atuais precisam ver valor imediato
- Base técnica para features de 2027+

### Riscos Estratégicos
| Risco | Mitigação |
|-------|-----------|
| Redesign não ser percebido como melhoria | Comunicação prévia + onboarding no novo dashboard |
| Features de Visão 2032 distraírem do UX | Dois trilhos com equipes distintas |
| Complexidade regulatória de Ativos Virtuais | Parceria com advogado regulatório desde já |

---

## 5. Visão Geral da Solução

### Sprint 1 - Entregas

#### Trilho 1: UX Redesign
| Feature | Descrição |
|---------|-----------|
| **Dashboard IEI Score** | Painel central com score de eficiência de importação, economia comprovada e alertas críticos |
| **Sidebar Reagrupada** | 5 contextos ao invés de 17 itens soltos: Visão Geral, Operações, Câmbio, Compliance, Configurações |
| **Alertas Proativos** | Barra fixa superior com alertas priorizados por urgência |
| **Câmbio Redesign** | Benchmark de taxa + visualização de exposição total |
| **Monitoramento RADAR** | Torre de controle visual das operações em andamento |
| **Kanban Importações** | Jornada completa da importação em formato kanban populado |

#### Trilho 2: Visão 2032 (Início)
| Feature | Descrição |
|---------|-----------|
| **Framework Governança** | Documentação inicial do framework publicável |
| **Ativos Virtuais (Discovery)** | Análise regulatória com advogado parceiro |

### Fluxo Principal (Happy Path)
```
1. Usuário acessa Vision
2. Dashboard IEI aparece com score consolidado
3. Alerta vermelho indica DI com problema
4. Clica no alerta → vai direto para o Kanban da DI
5. Resolve problema com contexto completo na tela
6. Volta ao dashboard → score atualiza em tempo real
```

### Edge Cases
- Usuário sem DIs ativas → Mostra onboarding + dados de demonstração
- Múltiplos alertas críticos → Priorização automática por impacto financeiro
- Primeiro acesso → Tour guiado das novas features

---

## 6. Métricas de Sucesso

### KPIs Primários (Negócio)
| Métrica | Baseline | Target S1 | Como Medir |
|---------|----------|-----------|------------|
| Net Promoter Score (NPS) | 35 | 45 | Survey trimestral |
| Churn mensal | 3.5% | 2.5% | Sistema de assinaturas |
| Expansão de receita | - | +5% | Upsell de módulos |

### KPIs Secundários (Produto)
| Métrica | Baseline | Target S1 | Como Medir |
|---------|----------|-----------|------------|
| Tempo no Dashboard | 2 min | 4 min | Analytics (Mixpanel/Amplitude) |
| Alertas resolvidos mesmo dia | 40% | 70% | Log de ações |
| Adoção do Kanban | 0% | 60% | % usuários ativos usando |
| Cliques na sidebar | 15/sessão | 8/sessão | Analytics |

### Critério de Sucesso da Sprint 1
Sprint 1 será considerada sucesso se:
- [ ] Dashboard IEI em produção com dados reais
- [ ] ≥70% dos usuários ativos acessaram novo dashboard
- [ ] NPS pontual ≥40 (medição rápida pós-launch)
- [ ] Zero bugs críticos em produção após 1 semana

---

## 7. User Stories

### US-001: Dashboard IEI Score
**Resumo:** Visualizar saúde geral das importações em um único score

#### Caso de Uso:
- **Como** Gestor de Importação
- **Eu quero** ver um score consolidado (IEI) da eficiência das minhas importações
- **Para que** eu saiba em segundos se preciso agir em algo urgente

#### Critérios de Aceitação:
- **Cenário:** Gestor visualiza IEI Score ao entrar no sistema
- **Dado que** tenho importações ativas no último mês
- **e Dado que** estou autenticado no Vision
- **Quando** acesso o Dashboard
- **Então** vejo o IEI Score (0-100) com cores (verde ≥70, amarelo 50-69, vermelho <50)

---

### US-002: Barra de Alertas Proativos
**Resumo:** Notificações prioritárias sempre visíveis

#### Caso de Uso:
- **Como** Gestor de Importação
- **Eu quero** ser alertado proativamente sobre problemas críticos
- **Para que** eu não descubra problemas tarde demais

#### Critérios de Aceitação:
- **Cenário:** Alerta de DI com atraso aparece automaticamente
- **Dado que** existe uma DI com previsão de atraso >3 dias
- **e Dado que** estou em qualquer tela do sistema
- **Quando** o sistema detecta o atraso
- **Então** aparece alerta vermelho na barra fixa superior com link direto para a DI

---

### US-003: Sidebar Reorganizada (5 Contextos)
**Resumo:** Navegação simplificada por contexto

#### Caso de Uso:
- **Como** Usuário do Vision
- **Eu quero** encontrar funcionalidades agrupadas por contexto de uso
- **Para que** eu navegue com menos cliques e menos confusão

#### Critérios de Aceitação:
- **Cenário:** Usuário navega para módulo de Câmbio
- **Dado que** estou na sidebar
- **Quando** clico em "Câmbio"
- **Então** vejo submenu com: Benchmark, Exposição, Contratos

---

### US-004: Kanban de Importações
**Resumo:** Visualizar jornada completa das importações em kanban

#### Caso de Uso:
- **Como** Gestor de Importação
- **Eu quero** ver todas as minhas DIs em um kanban com status visual
- **Para que** eu tenha visão clara de onde cada importação está no processo

#### Critérios de Aceitação:
- **Cenário:** Gestor arrasta card de DI para próximo status
- **Dado que** estou no Kanban de Importações
- **e Dado que** uma DI mudou de status
- **Quando** o sistema recebe atualização do SISCOMEX
- **Então** o card move automaticamente para a coluna correta

---

### US-005: Torre de Controle RADAR
**Resumo:** Monitoramento visual consolidado de todas as operações

#### Caso de Uso:
- **Como** Gestor de Importação
- **Eu quero** ver um "radar" visual das operações em andamento
- **Para que** eu identifique rapidamente anomalias e gargalos

#### Critérios de Aceitação:
- **Cenário:** Operação com problema aparece destacada no RADAR
- **Dado que** existe uma operação com alerta ativo
- **Quando** acesso a Torre de Controle RADAR
- **Então** a operação aparece pulsando em vermelho no radar visual

---

### US-006: Benchmark de Câmbio
**Resumo:** Comparar taxa de câmbio praticada com mercado

#### Caso de Uso:
- **Como** CFO
- **Eu quero** saber se estou fechando câmbio em taxa competitiva
- **Para que** eu negocie melhor ou troque de instituição financeira

#### Critérios de Aceitação:
- **Cenário:** CFO compara sua taxa média com benchmark do mercado
- **Dado que** fechei contratos de câmbio no último mês
- **Quando** acesso o módulo Câmbio > Benchmark
- **Então** vejo gráfico comparando minha taxa média vs. taxa de mercado no mesmo período

---

## 8. Fora do Escopo (Sprint 1)

### NÃO será feito nesta Sprint:
| Item | Motivo | Quando |
|------|--------|--------|
| Vision IA Contextual | Depende de infra de ML | Sprint 2 |
| Pagamentos / Cashflow | Menor prioridade que Dashboard | Sprint 2 |
| NCM Alertas Tributários | Complexidade de dados | Sprint 3 |
| Vision APIs (Open Finance) | Trilho 2 só inicia discovery | 2027 |
| Módulo Ativos Virtuais | Análise regulatória primeiro | 2026 H2 |
| Notificações Push | Infra de push não existe | Sprint 3 |

### Limitações Aceitas:
- IEI Score v1 usa algoritmo simplificado (refinamento em sprints futuras)
- RADAR visual estático (animações em sprint 2)
- Integração SISCOMEX pode ter delay de até 4h (melhoria futura)

---

## 9. Dependências e Riscos

### Dependências Técnicas
| Dependência | Responsável | Status |
|-------------|-------------|--------|
| API SISCOMEX estável | Integração existente | ✅ OK |
| Design System atualizado | UX Designer | 🟡 Em andamento |
| Infraestrutura de analytics | DevOps | 🟡 Configurar Mixpanel |

### Dependências de Outras Equipes
| Equipe | Dependência | Criticidade |
|--------|-------------|-------------|
| Comercial | Comunicação de mudanças aos clientes | Alta |
| Suporte | Treinamento nas novas features | Média |
| Legal | Revisão de termos (se necessário) | Baixa |

### Riscos Identificados
| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Designer não entrega wireframes a tempo | Média | Alto | Iniciar com protótipos low-fi |
| Rejeição dos usuários ao novo layout | Baixa | Alto | A/B test com grupo beta |
| Performance do Dashboard com muitos dados | Média | Médio | Paginação + cache agressivo |
| Atraso na contratação de Frontend Dev | Alta | Alto | Freelancer como backup |

---

## 10. Questões em Aberto

### Decisões Pendentes
| Questão | Responsável | Deadline |
|---------|-------------|----------|
| Fórmula exata do IEI Score | PM + Data | Semana 1 |
| Cores e threshold dos alertas | UX | Semana 1 |
| Frequência de atualização do RADAR | Backend | Semana 2 |
| Nome final dos 5 contextos da sidebar | PM + UX | Semana 1 |

### Informações Necessárias
- Benchmark de mercado para taxa de câmbio (fonte de dados?)
- SLA de integração SISCOMEX atual
- Volume de dados históricos para IEI Score

### Pontos que Precisam de Alinhamento
- [ ] Aprovação do C-level sobre priorização do Trilho 2
- [ ] Budget para contratação de UX Designer
- [ ] Parceria com advogado para Ativos Virtuais

---

## Anexos

### A. Inventário de Módulos (17 atuais)
| Módulo | Ação | Sprint |
|--------|------|--------|
| Dashboard | Redesenhar | S1 |
| Relatórios > Controle | Manter + Melhorar | S2 |
| Relatórios > DI/Duimp | Redesenhar | S1 |
| Relatórios > Contratos Câmbio | Redesenhar | S1 |
| Relatórios > Pagamentos | Redesenhar | S1 |
| Relatórios > Abertura Itens | Melhorar | S2 |
| NCM > Benchmark | Melhorar | S2 |
| NCM > Análise por NCM | Melhorar | S3 |
| Importações (Kanban) | Redesenhar | S1 |
| Câmbio | Redesenhar | S1 |
| Numerários | Criar onboarding | S2 |
| Rastreio | Redesenhar | S2 |
| Usuários | Manter | S3 |
| Monitoramento | Redesenhar | S1 |
| Vision IA (banner) | Transformar | S2 |
| Suporte | Melhorar | S3 |
| Notificações | CRIAR NOVO | S3 |

### B. Timeline Visão 2032
- **2026 H1:** Dashboard IEI, Sidebar nova, Framework publicado
- **2026 H2:** Câmbio redesign, Portal Contador, Ativos Virtuais
- **2027:** Vision IA, APIs Open Finance, SDK Embedded v1
- **2028-29:** Hedge como Serviço, 500+ parceiros
- **2030-32:** Banco de Câmbio, Standard de mercado

### C. Equipe Necessária
| Papel | Por quê | Quando | Trilho |
|-------|---------|--------|--------|
| UX/UI Designer | Redesign 17 telas | Agora | UX |
| Frontend Dev (React) | Implementar redesign | Agora | UX |
| Backend Dev (APIs) | Vision API Gateway, scoring | 2026 H2 | Visão |
| Pessoa Canal 2 (hunter B2B) | Prospectar parceiros | Agora | Comercial |
| Product Manager | Priorizar backlog | Agora | Ambos |
| Data Engineer | Motor de scoring | 2027 | Visão |
| Advogado regulatório | Ativos virtuais, CTVM | Agora (parceria) | Visão |

---

**Próximos Passos:**
1. [ ] Validar PRD com stakeholders
2. [ ] Aprovar contratação de UX Designer e Frontend Dev
3. [ ] Iniciar wireframes do Dashboard IEI
4. [ ] Configurar analytics (Mixpanel)
5. [ ] Definir grupo beta para A/B test

---

*Documento gerado com metodologia PRD Development + Skills de Product Management*
*"O produto de hoje precisa narrar valor agora. O produto de amanhã precisa ser infraestrutura do mercado."*
