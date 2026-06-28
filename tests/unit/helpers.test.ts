import { describe, it, expect } from 'vitest';
import { maskPII, extractJsonObject, buildGenerationUserContent } from '../../server/utils/helpers';

describe('Helpers & PII Utilities Unit Tests', () => {
  describe('maskPII()', () => {
    it('deve identificar e mascarar CPF', () => {
      const input = 'O CPF do cliente é 123.456.789-00 para contato.';
      const res = maskPII(input);
      expect(res.hasPII).toBe(true);
      expect(res.detectedTypes).toContain('CPF');
      expect(res.maskedText).toBe('O CPF do cliente é [CPF_MASCARADO] para contato.');
    });

    it('deve identificar e mascarar CNPJ', () => {
      const input = 'Empresa com CNPJ 12.345.678/0001-99 cadastrada.';
      const res = maskPII(input);
      expect(res.hasPII).toBe(true);
      expect(res.detectedTypes).toContain('CNPJ');
      expect(res.maskedText).toBe('Empresa com CNPJ [CNPJ_MASCARADO] cadastrada.');
    });

    it('deve identificar e mascarar E-mail', () => {
      const input = 'Envie para jose.jonathan@unifesp.br agora.';
      const res = maskPII(input);
      expect(res.hasPII).toBe(true);
      expect(res.detectedTypes).toContain('EMAIL');
      expect(res.maskedText).toBe('Envie para [EMAIL_MASCARADO] agora.');
    });

    it('deve identificar e mascarar telefone brasileiro', () => {
      const input = 'Telefone de contato: +55 11 99999-8888 ou 4002-8922.';
      const res = maskPII(input);
      expect(res.hasPII).toBe(true);
      expect(res.detectedTypes).toContain('TELEFONE');
      expect(res.maskedText).toContain('[TELEFONE_MASCARADO]');
    });

    it('deve identificar e mascarar tokens de API sensíveis', () => {
      const input = 'Chave secreta sk-abc123xyz78901234567890123456789 para API.';
      const res = maskPII(input);
      expect(res.hasPII).toBe(true);
      expect(res.detectedTypes).toContain('API_TOKEN');
      expect(res.maskedText).toBe('Chave secreta [TOKEN_MASCARADO] para API.');
    });

    it('deve manter texto original inalterado se não houver dados sensíveis', () => {
      const input = 'Texto totalmente limpo de PII e dados sensíveis.';
      const res = maskPII(input);
      expect(res.hasPII).toBe(false);
      expect(res.detectedTypes.length).toBe(0);
      expect(res.maskedText).toBe(input);
    });
  });

  describe('extractJsonObject()', () => {
    it('deve parsear JSON puro simples', () => {
      const raw = '{"a": 1, "b": "texto"}';
      const parsed = extractJsonObject<{ a: number; b: string }>(raw);
      expect(parsed.a).toBe(1);
      expect(parsed.b).toBe('texto');
    });

    it('deve extrair e parsear JSON dentro de blocos de código markdown', () => {
      const raw = '```json\n{\n  "chave": "valor"\n}\n```';
      const parsed = extractJsonObject<{ chave: string }>(raw);
      expect(parsed.chave).toBe('valor');
    });

    it('deve tolerar textos externos fora das chaves principais do JSON', () => {
      const raw = 'Aqui está o JSON gerado pelo modelo: {\"sucesso\": true} Espero que ajude!';
      const parsed = extractJsonObject<{ sucesso: boolean }>(raw);
      expect(parsed.sucesso).toBe(true);
    });
  });

  describe('buildGenerationUserContent()', () => {
    it('deve montar conteúdo básico sem anexos', () => {
      const demand = 'Criar um PRD para sistema de login';
      const output = buildGenerationUserContent(demand);
      expect(output).toContain('<DEMANDA_USUARIO>');
      expect(output).toContain(demand);
      // Sem anexos, o output deve terminar com </DEMANDA_USUARIO>
      expect(output.endsWith('</DEMANDA_USUARIO>')).toBe(true);
    });

    it('deve montar conteúdo incluindo seção de anexos se fornecido', () => {
      const demand = 'Criar PRD';
      const extracted = 'Regra 1: Apenas CPF';
      const output = buildGenerationUserContent(demand, extracted);
      expect(output).toContain('<DEMANDA_USUARIO>');
      expect(output).toContain('<DOCUMENTOS_ANEXADOS_FONTE>');
      expect(output).toContain(extracted);
      // Com anexos, o output deve terminar com </DOCUMENTOS_ANEXADOS_FONTE>
      expect(output.endsWith('</DOCUMENTOS_ANEXADOS_FONTE>')).toBe(true);
    });
  });
});
