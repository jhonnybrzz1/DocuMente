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
});
