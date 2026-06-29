import fs from 'fs';
import path from 'path';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  requestId?: string;
  action?: string;
  fileType?: string;
  fileSize?: number;
  fileName?: string;
  rowCount?: number;
  status?: string;
  userId?: string;
  error?: string;
}

class Logger {
  private logFilePath: string;

  constructor() {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    this.logFilePath = path.join(logsDir, 'app.log');
  }

  private sanitizeMetadata(data: any): any {
    if (!data) return data;
    if (typeof data === 'string') {
      // Mascarar chaves de API ou segredos se vazarem na string
      let sanitized = data.replace(/(sk-[A-Za-z0-9_-]{20,})/g, 'sk-***');
      sanitized = sanitized.replace(/(xox[bapts]-[A-Za-z0-9-]{10,})/g, 'xox-***');
      // Truncar strings longas para evitar vazamento de anexos/demandas
      if (sanitized.length > 1000) {
        return sanitized.substring(0, 500) + '... [TRUNCADO POR SEGURANÇA DE PRODUÇÃO]';
      }
      return sanitized;
    }
    if (typeof data === 'object') {
      if (Array.isArray(data)) {
        return data.map(item => this.sanitizeMetadata(item));
      }
      const copy = { ...data };
      const keysToMask = ['demand', 'content', 'extractedText', 'text', 'originalDemand', 'original_demand', 'apiKey', 'mistralKey'];
      for (const key of Object.keys(copy)) {
        const lowerKey = key.toLowerCase();
        if (keysToMask.includes(key) || lowerKey.includes('key') || lowerKey.includes('token') || lowerKey.includes('secret')) {
          copy[key] = '*** [REMOVIDO POR SEGURANÇA DE LOGS EM PRODUÇÃO]';
        } else {
          copy[key] = this.sanitizeMetadata(copy[key]);
        }
      }
      return copy;
    }
    return data;
  }

  private writeLog(entry: LogEntry): void {
    const sanitizedEntry = this.sanitizeMetadata(entry);
    const logEntry = JSON.stringify(sanitizedEntry) + '\n';
    fs.appendFileSync(this.logFilePath, logEntry);
  }

  info(message: string, metadata?: Omit<LogEntry, 'level' | 'message' | 'timestamp'>): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      ...metadata
    });
  }

  warn(message: string, metadata?: Omit<LogEntry, 'level' | 'message' | 'timestamp'>): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      ...metadata
    });
  }

  error(message: string, metadata?: Omit<LogEntry, 'level' | 'message' | 'timestamp'>): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      ...metadata
    });
  }

  debug(message: string, metadata?: Omit<LogEntry, 'level' | 'message' | 'timestamp'>): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'debug',
      message,
      ...metadata
    });
  }
}

export const logger = new Logger();