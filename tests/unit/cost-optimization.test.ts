import { vi, describe, it, expect, beforeEach } from 'vitest';
import { callOpenRouterAPI, verifyAndRepairGeneratedDocument } from '../../server/routes';
import { chatCompletion } from '../../server/services/openrouter';
import { appCache } from '../../server/utils/cache';

// Mock do módulo de serviços OpenRouter para evitar chamadas de rede reais
vi.mock('../../server/services/openrouter', async () => {
  const original = await vi.importActual<any>('../../server/services/openrouter');
  return {
    ...original,
    chatCompletion: vi.fn(),
  };
});

describe('Cost Optimization & Model Routing Tests (Plano de Testes)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appCache.clear();
  });

  // =========================================================================
  // CT-001: Verificação do Model Routing por Complexidade de Tarefa
  // =========================================================================
  describe('CT-001: Model Routing por Complexidade e Plano', () => {
    it('deve usar deepseek-flash para reparo no perfil FREE mesmo com demanda longa', async () => {
      // Mock da verificação indicando falha de fidelidade (passed: false) para disparar o reparo
      vi.mocked(chatCompletion)
        .mockResolvedValueOnce(JSON.stringify({
          passed: false,
          issues: [{ severity: 'critical', type: 'changed_rule', fix_instruction: 'Corrigir valor', source_excerpt: 'R$ 100', generated_excerpt: 'R$ 200' }]
        })) // Retorno da verificação
        .mockResolvedValueOnce('Documento reparado no Free'); // Retorno do reparo

      const longDemand = 'A'.repeat(6000); // Demanda longa (>5000 chars)

      // Usamos 'techspec' e passamos anexo para garantir que a verificação adaptativa rode obrigatoriamente
      const result = await verifyAndRepairGeneratedDocument(
        'mock-api-key',
        'Prompt de escrita',
        longDemand,
        'anexo de apoio obrigatório para testes',
        'Documento gerado inicial',
        'techspec', 
        'free' // Plano do usuário
      );

      expect(result).toBe('Documento reparado no Free');
      
      // Inspeciona a segunda chamada de chatCompletion (que é a do reparo)
      expect(chatCompletion).toHaveBeenCalledTimes(2);
      const repairOptions = vi.mocked(chatCompletion).mock.calls[1][1];
      expect(repairOptions?.model).toBe('deepseek/deepseek-flash'); // Forçado para flash no FREE
    });

    it('deve usar mimo-2.5-pro para reparo no perfil PRO com demanda longa (>5000 chars)', async () => {
      vi.mocked(chatCompletion)
        .mockResolvedValueOnce(JSON.stringify({
          passed: false,
          issues: [{ severity: 'critical', type: 'changed_rule', fix_instruction: 'Corrigir valor', source_excerpt: 'R$ 100', generated_excerpt: 'R$ 200' }]
        }))
        .mockResolvedValueOnce('Documento reparado no PRO');

      const longDemand = 'A'.repeat(5050); // Demanda longa (>5000 chars)

      const result = await verifyAndRepairGeneratedDocument(
        'mock-api-key',
        'Prompt de escrita',
        longDemand,
        'anexo de apoio obrigatório para testes',
        'Documento gerado inicial',
        'techspec',
        'pro' // Plano do usuário (PRO/Default)
      );

      expect(result).toBe('Documento reparado no PRO');
      expect(chatCompletion).toHaveBeenCalledTimes(2);
      
      const repairOptions = vi.mocked(chatCompletion).mock.calls[1][1];
      expect(repairOptions?.model).toBe('mimo-2.5-pro'); // Roteado para modelo forte no PRO/Long
    });

    it('deve usar mimo-2.5-pro para reparo no perfil ENTERPRISE mesmo com demanda curta', async () => {
      vi.mocked(chatCompletion)
        .mockResolvedValueOnce(JSON.stringify({
          passed: false,
          issues: [{ severity: 'critical', type: 'changed_rule', fix_instruction: 'Corrigir valor', source_excerpt: 'R$ 100', generated_excerpt: 'R$ 200' }]
        }))
        .mockResolvedValueOnce('Documento reparado no Enterprise');

      const result = await verifyAndRepairGeneratedDocument(
        'mock-api-key',
        'Prompt de escrita',
        'Demanda curta',
        'anexo de apoio obrigatório para testes',
        'Documento gerado inicial',
        'techspec',
        'enterprise' // Plano do usuário (Enterprise)
      );

      expect(result).toBe('Documento reparado no Enterprise');
      expect(chatCompletion).toHaveBeenCalledTimes(2);
      
      const repairOptions = vi.mocked(chatCompletion).mock.calls[1][1];
      expect(repairOptions?.model).toBe('mimo-2.5-pro'); // Sempre mimo no Enterprise
    });
  });

  // =========================================================================
  // CT-002: Cache Semântico para Verification e Quality-Score
  // =========================================================================
  describe('CT-002: Cache Semântico aproximado', () => {
    it('deve usar hit de cache semântico aproximado para demandas similares', () => {
      const prefix = 'generate-document';
      // Termos similares com distância curta para garantir similaridade de cosseno >0.85
      const keyOriginal = { type: 'prd', demand: 'Gerar um plano de ação detalhado para diminuir os custos com IA do DocuMente', templateVersion: 'v1' };
      const keySimilar = { type: 'prd', demand: 'Gerar plano de ação detalhado para reduzir custos com IA no DocuMente', templateVersion: 'v1' };

      appCache.set(prefix, keyOriginal, 'documento-otimizado-cache', 60);

      // Busca usando a chave similar
      const cached = appCache.get(prefix, keySimilar);
      expect(cached).toBe('documento-otimizado-cache'); // Hit semântico aproximado
    });
  });

  // =========================================================================
  // CT-003: Fix max_tokens em Todas as Chamadas
  // =========================================================================
  describe('CT-003: Fix max_tokens nas chamadas auxiliares', () => {
    it('deve passar maxTokens: 1000 na chamada de verificação de fidelidade', async () => {
      vi.mocked(chatCompletion).mockResolvedValueOnce(JSON.stringify({ passed: true, issues: [] }));

      await verifyAndRepairGeneratedDocument(
        'mock-api-key',
        'Prompt de escrita',
        'Demanda teste',
        'anexo de apoio obrigatório para testes',
        'Documento gerado inicial',
        'techspec',
        'pro'
      );

      expect(chatCompletion).toHaveBeenCalledTimes(1);
      const verificationOptions = vi.mocked(chatCompletion).mock.calls[0][1];
      expect(verificationOptions?.maxTokens).toBe(1000); // maxTokens da verificação fixado em 1000
    });
  });
});
