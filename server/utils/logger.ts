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

  private writeLog(entry: LogEntry): void {
    const logEntry = JSON.stringify(entry) + '\n';
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