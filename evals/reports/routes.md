# Relatório de Avaliação E2E - Rotas Auxiliares de IA

*Executado em: 28/06/2026, 16:24:27*

## 📊 Métricas das Rotas

| Métrica | Valor |
|---|---|
| **Total de Cenários** | 2 |
| **Taxa de Sucesso (Checks Determinísticos)** | **50.0%** (1/2) |
| **Latência p50** | 2653ms |
| **Latência p95** | 2653ms |

## 🧪 Resumo por Cenário

| Cenário | Tipo | Latência | Status |
|---|---|---|---|
| **quickaction-rewrite-limit-approval** | `QUICK-ACTION` | 1519ms | ✅ PASSOU |
| **chat-refine-eligibility-ambiguity** | `CHAT-REFINEMENT` | 2653ms | ❌ FALHOU |

## 🔍 Detalhes Individuais

### Cenário: quickaction-rewrite-limit-approval
- **Tipo**: `QUICK-ACTION`
- **Latência**: 1519ms
- **Resultado Final**: ✅ PASSOU

**Checagens Determinísticas executadas:**
- [✅] **Preservação de Regras Críticas (Required)**: Todas as regras requeridas estão presentes.
- [✅] **Ausência de Termos Proibidos (Forbidden)**: Nenhum termo proibido gerado.

---

### Cenário: chat-refine-eligibility-ambiguity
- **Tipo**: `CHAT-REFINEMENT`
- **Latência**: 2653ms
- **Resultado Final**: ❌ FALHOU

**Checagens Determinísticas executadas:**
- [❌] **Explicação/Esclarecimento de Ambiguidade (Required)**: Resposta não contém explicação de ambiguidade.
- [✅] **Prevenção de Inclusão Indevida (Forbidden)**: Nenhum termo proibido foi incluído incorretamente.

---

