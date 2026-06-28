import crypto from 'crypto';

class SimpleMemoryCache {
  private cache = new Map<string, { value: any; expiry: number }>();

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
  }

  clear() {
    this.cache.clear();
  }
}

export const appCache = new SimpleMemoryCache();
