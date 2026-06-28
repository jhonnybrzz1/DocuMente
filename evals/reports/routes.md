# Relatório de Avaliação E2E - Rotas Auxiliares de IA

*Executado em: 28/06/2026, 16:30:03*

## 📊 Métricas das Rotas

| Métrica | Valor |
|---|---|
| **Total de Cenários** | 2 |
| **Taxa de Sucesso (Checks Determinísticos)** | **100.0%** (2/2) |
| **Latência p50** | 4987ms |
| **Latência p95** | 4987ms |

## 🧪 Resumo por Cenário

| Cenário | Tipo | Latência | Status |
|---|---|---|---|
| **quickaction-rewrite-limit-approval** | `QUICK-ACTION` | 1977ms | ✅ PASSOU |
| **chat-refine-eligibility-ambiguity** | `CHAT-REFINEMENT` | 4987ms | ✅ PASSOU |

## 🔍 Detalhes Individuais

### Cenário: quickaction-rewrite-limit-approval
- **Tipo**: `QUICK-ACTION`
- **Latência**: 1977ms
- **Resultado Final**: ✅ PASSOU

**Checagens Determinísticas executadas:**
- [✅] **Preservação de Regras Críticas (Required)**: Todas as regras requeridas estão presentes.
- [✅] **Ausência de Termos Proibidos (Forbidden)**: Nenhum termo proibido gerado.

---

### Cenário: chat-refine-eligibility-ambiguity
- **Tipo**: `CHAT-REFINEMENT`
- **Latência**: 4987ms
- **Resultado Final**: ✅ PASSOU

**Checagens Determinísticas executadas:**
- [✅] **Explicação/Esclarecimento de Ambiguidade (Required)**: Explicação/esclarecimento correto de ambiguidade presente.
- [✅] **Prevenção de Inclusão Indevida (Forbidden)**: Nenhum termo proibido foi incluído incorretamente.

---

