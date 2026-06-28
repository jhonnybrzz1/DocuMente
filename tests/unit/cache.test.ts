import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { appCache } from '../../server/utils/cache';
import fs from 'fs';
import path from 'path';

describe('SimpleMemoryCache Unit Tests', () => {
  const cacheFile = path.resolve(process.cwd(), 'cache/app-cache.json');

  beforeEach(() => {
    appCache.clear();
  });

  afterAll(() => {
    appCache.clear();
  });

  it('deve armazenar e recuperar dados simples', () => {
    appCache.set('test', { key: 'val' }, 'dados-de-teste', 10);
    const cached = appCache.get('test', { key: 'val' });
    expect(cached).toBe('dados-de-teste');
  });

  it('deve retornar null para chaves inexistentes ou dados diferentes', () => {
    appCache.set('test', { key: 'val' }, 'dados', 10);
    const cached = appCache.get('test', { key: 'outro' });
    expect(cached).toBeNull();
  });

  it('deve expirar chaves de acordo com o TTL', async () => {
    // Definimos TTL negativo (expirado no passado garantido)
    appCache.set('expire', 'dados', 'valor', -5);
    const cached = appCache.get('expire', 'dados');
    expect(cached).toBeNull();
  });

  it('deve persistir e carregar os dados do disco', async () => {
    appCache.set('disk', { id: 1 }, 'conteudo-persistido', 30);
    
    // Aguardar o salvamento assíncrono no disco
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(fs.existsSync(cacheFile)).toBe(true);
    
    const fileContent = fs.readFileSync(cacheFile, 'utf-8');
    expect(fileContent).toContain('conteudo-persistido');
  });

  it('deve recuperar valores via cache semântico aproximado (>95% similaridade)', () => {
    const inputOriginal = { demand: 'Gerar um plano de ação detalhado para diminuir os custos com IA do DocuMente' };
    const inputAproximado = { demand: 'Gerar plano de ação detalhado para reduzir custos com IA no DocuMente' };
    const inputDiferente = { demand: 'Escrever uma documentação de API para a rota de cadastro de clientes' };

    appCache.set('suggest-title', inputOriginal, 'titulo-sugerido', 60);

    // Exact Match
    const cachedExact = appCache.get('suggest-title', inputOriginal);
    expect(cachedExact).toBe('titulo-sugerido');

    // Semantic Match (Aproximado)
    const cachedSemantic = appCache.get('suggest-title', inputAproximado);
    expect(cachedSemantic).toBe('titulo-sugerido');

    // Diferente (Sem Match)
    const cachedDiff = appCache.get('suggest-title', inputDiferente);
    expect(cachedDiff).toBeNull();
  });
});
