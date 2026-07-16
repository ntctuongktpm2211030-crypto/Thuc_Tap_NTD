type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  requestId?: string;
  data?: Record<string, unknown>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getConfiguredLevel(): LogLevel {
  const env = (process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevel;
  if (env in LOG_LEVELS) return env;
  return 'info';
}

class StructuredLogger {
  private level: LogLevel = getConfiguredLevel();

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  private format(entry: LogEntry): string {
    const parts: string[] = [
      entry.timestamp,
      `[${entry.level.toUpperCase()}]`,
      `[${entry.module}]`,
    ];
    if (entry.requestId) {
      parts.push(`[req:${entry.requestId}]`);
    }
    parts.push(entry.message);
    if (entry.data && Object.keys(entry.data).length > 0) {
      try {
        parts.push(JSON.stringify(entry.data));
      } catch {
        parts.push('[Circular data]');
      }
    }
    return parts.join(' ');
  }

  debug(module: string, message: string, data?: Record<string, unknown>, requestId?: string): void {
    if (!this.shouldLog('debug')) return;
    console.log(this.format({ timestamp: new Date().toISOString(), level: 'debug', module, message, requestId, data }));
  }

  info(module: string, message: string, data?: Record<string, unknown>, requestId?: string): void {
    if (!this.shouldLog('info')) return;
    console.log(this.format({ timestamp: new Date().toISOString(), level: 'info', module, message, requestId, data }));
  }

  warn(module: string, message: string, data?: Record<string, unknown>, requestId?: string): void {
    if (!this.shouldLog('warn')) return;
    console.warn(this.format({ timestamp: new Date().toISOString(), level: 'warn', module, message, requestId, data }));
  }

  error(module: string, message: string, data?: Record<string, unknown>, requestId?: string): void {
    if (!this.shouldLog('error')) return;
    console.error(this.format({ timestamp: new Date().toISOString(), level: 'error', module, message, requestId, data }));
  }

  /** Update log level at runtime */
  setLevel(level: LogLevel): void {
    this.level = level;
  }
}

export const logger = new StructuredLogger();
export type { LogLevel };
