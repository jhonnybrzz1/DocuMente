import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

class SimpleMemoryCache {
  private cache = new Map<string, { value: any; expiry: number }>();
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
          const entry = val as { value: any; expiry: number };
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

  private getHash(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  get(prefix: string, data: any, version: string = 'v1'): any | null {
    const key = prefix + ":" + JSON.stringify(data) + ":" + version;
    const hash = this.getHash(key);
    const cached = this.cache.get(hash);
    if (!cached) return null;
    if (Date.now() > cached.expiry) {
      this.cache.delete(hash);
      this.saveToDisk();
      return null;
    }
    return cached.value;
  }

  set(prefix: string, data: any, value: any, ttlSeconds: number = 3600, version: string = 'v1') {
    const key = prefix + ":" + JSON.stringify(data) + ":" + version;
    const hash = this.getHash(key);
    this.cache.set(hash, {
      value,
      expiry: Date.now() + (ttlSeconds * 1000)
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
