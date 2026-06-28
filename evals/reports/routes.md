# Relatório de Avaliação E2E - Rotas Auxiliares de IA

*Executado em: 28/06/2026, 17:11:47*

## 📊 Métricas das Rotas

| Métrica | Valor |
|---|---|
| **Total de Cenários** | 2 |
| **Taxa de Sucesso (Checks Determinísticos)** | **100.0%** (2/2) |
| **Latência p50** | 2072ms |
| **Latência p95** | 2072ms |

## 🧪 Resumo por Cenário

| Cenário | Tipo | Latência | Status |
|---|---|---|---|
| **chat-refine-eligibility-ambiguity** | `CHAT-REFINEMENT` | 2072ms | ✅ PASSOU |
| **quickaction-rewrite-limit-approval** | `QUICK-ACTION` | 1359ms | ✅ PASSOU |

## 🔍 Detalhes Individuais

### Cenário: chat-refine-eligibility-ambiguity
- **Tipo**: `CHAT-REFINEMENT`
- **Latência**: 2072ms
- **Resultado Final**: ✅ PASSOU

**Checagens Determinísticas executadas:**
- [✅] **Explicação/Esclarecimento de Ambiguidade (Required)**: Explicação/esclarecimento correto de ambiguidade presente.
- [✅] **Prevenção de Inclusão Indevida (Forbidden)**: Nenhum termo proibido foi incluído incorretamente.

---

### Cenário: quickaction-rewrite-limit-approval
- **Tipo**: `QUICK-ACTION`
- **Latência**: 1359ms
- **Resultado Final**: ✅ PASSOU

**Checagens Determinísticas executadas:**
- [✅] **Preservação de Regras Críticas (Required)**: Todas as regras requeridas estão presentes.
- [✅] **Ausência de Termos Proibidos (Forbidden)**: Nenhum termo proibido gerado.

---

