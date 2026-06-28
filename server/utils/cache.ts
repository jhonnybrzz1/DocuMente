import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

interface CacheEntry {
  value: any;
  expiry: number;
  prefix?: string;
  version?: string;
  semanticText?: string;
}

class SimpleMemoryCache {
  private cache = new Map<string, CacheEntry>();
  private cacheFilePath = path.resolve(process.cwd(), 'cache/app-cache.json');

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      const cacheDir = path.dirname(this.cacheFilePath);
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      if (fs.existsSync(this.cacheFilePath)) {
        const data = fs.readFileSync(this.cacheFilePath, 'utf-8');
        const parsed = JSON.parse(data);
        for (const [key, val] of Object.entries(parsed)) {
          const entry = val as CacheEntry;
          if (Date.now() < entry.expiry) {
            this.cache.set(key, entry);
          }
        }
        console.log(`[cache] Carregados ${this.cache.size} itens de cache do disco.`);
      }
    } catch (err) {
      console.warn('[cache] Falha ao carregar cache do disco:', err);
    }
  }

  private async saveToDisk() {
    try {
      const cacheDir = path.dirname(this.cacheFilePath);
      if (!fs.existsSync(cacheDir)) {
        await fs.promises.mkdir(cacheDir, { recursive: true });
      }
      const obj: Record<string, any> = {};
      for (const [key, val] of Array.from(this.cache.entries())) {
        if (Date.now() < val.expiry) {
          obj[key] = val;
        }
      }
      await fs.promises.writeFile(this.cacheFilePath, JSON.stringify(obj, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[cache] Falha ao persistir cache no disco:', err);
    }
  }

  private normalizeData(data: any): any {
    if (typeof data === 'string') {
      return data.trim().replace(/\s+/g, ' ');
    }
    if (data && Array.isArray(data)) {
      return data.map(item => this.normalizeData(item));
    }
    if (data && typeof data === 'object') {
      const copy = { ...data };
      for (const key of Object.keys(copy)) {
        copy[key] = this.normalizeData(copy[key]);
      }
      return copy;
    }
    return data;
  }

  private getHash(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  private extractSemanticText(prefix: string, data: any): string | null {
    if (!data) return null;
    if (prefix === "suggest-title") return data.demand || null;
    if (prefix === "quick-action") return data.text || null;
    if (prefix === "quality-score") return data.content || null;
    if (prefix === "generate-document" || prefix === "preview-document") {
      return `${data.demand || ''} ${data.extractedText || ''}`.trim() || null;
    }
    return null;
  }

  private calculateCosineSimilarity(str1: string, str2: string): number {
    const stopwords = new Set([
      'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
      'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
      'para', 'com', 'por', 'que', 'e', 'ao', 'aos', 'seu', 'sua'
    ]);

    const tokenize = (text: string): string[] => {
      const normalized = text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      const rawTokens = normalized.match(/\b\w+\b/g) || [];
      return rawTokens.filter(t => !stopwords.has(t));
    };

    const words1 = tokenize(str1);
    const words2 = tokenize(str2);

    if (words1.length === 0 || words2.length === 0) return 0;

    const freq1: Record<string, number> = {};
    const freq2: Record<string, number> = {};
    const allWords = new Set<string>();

    for (const word of words1) {
      freq1[word] = (freq1[word] || 0) + 1;
      allWords.add(word);
    }
    for (const word of words2) {
      freq2[word] = (freq2[word] || 0) + 1;
      allWords.add(word);
    }

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (const word of Array.from(allWords)) {
      const f1 = freq1[word] || 0;
      const f2 = freq2[word] || 0;
      dotProduct += f1 * f2;
    }

    for (const word of Object.keys(freq1)) {
      magnitude1 += freq1[word] ** 2;
    }
    for (const word of Object.keys(freq2)) {
      magnitude2 += freq2[word] ** 2;
    }

    const norm1 = Math.sqrt(magnitude1);
    const norm2 = Math.sqrt(magnitude2);

    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (norm1 * norm2);
  }

  get(prefix: string, data: any, version: string = 'v1'): any | null {
    const key = prefix + ":" + JSON.stringify(this.normalizeData(data)) + ":" + version;
    const hash = this.getHash(key);
    const cached = this.cache.get(hash);
    
    if (cached) {
      if (Date.now() > cached.expiry) {
        this.cache.delete(hash);
        this.saveToDisk();
        return null;
      }
      return cached.value;
    }

    // Se falhar no exact match, tentar o lookup semântico por similaridade de cosseno
    const semanticText = this.extractSemanticText(prefix, data);
    if (!semanticText || semanticText.length < 15) return null; // Ignora textos muito curtos

    for (const [existingHash, entry] of Array.from(this.cache.entries())) {
      if (entry.prefix === prefix && entry.version === version && entry.semanticText) {
        if (Date.now() > entry.expiry) {
          this.cache.delete(existingHash);
          continue;
        }

        // Calcula similaridade de cosseno entre o texto pesquisado e o do cache
        const sim = this.calculateCosineSimilarity(semanticText, entry.semanticText);
        if (sim >= 0.85) {
          console.log(`[semantic-cache] Cache hit aproximado (similaridade: ${(sim * 100).toFixed(1)}%) para o prefixo ${prefix}.`);
          return entry.value;
        }
      }
    }
    
    return null;
  }

  set(prefix: string, data: any, value: any, ttlSeconds: number = 3600, version: string = 'v1') {
    const key = prefix + ":" + JSON.stringify(this.normalizeData(data)) + ":" + version;
    const hash = this.getHash(key);
    const semanticText = this.extractSemanticText(prefix, data);
    
    this.cache.set(hash, {
      value,
      expiry: Date.now() + (ttlSeconds * 1000),
      prefix,
      version,
      semanticText: semanticText || undefined
    });
    this.saveToDisk();
  }

  clear() {
    this.cache.clear();
    try {
      if (fs.existsSync(this.cacheFilePath)) {
        fs.unlinkSync(this.cacheFilePath);
      }
    } catch (err) {
      console.warn('[cache] Falha ao limpar cache do disco:', err);
    }
  }
}

export const appCache = new SimpleMemoryCache();
