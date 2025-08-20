type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  data?: unknown;
}

interface Logger {
  debug: (message: string, data?: unknown) => void;
  info: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, error?: unknown) => void;
  getLogs: () => LogEntry[];
  clearLogs: () => void;
}

export function createLogger(context: string): Logger {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const logs: LogEntry[] = [];
  const maxLogs = 1000;

  const getStyle = (level: LogLevel): string => {
    const styles = {
      debug: 'color: #888; font-weight: normal',
      info: 'color: #2196F3; font-weight: normal',
      warn: 'color: #FF9800; font-weight: bold',
      error: 'color: #F44336; font-weight: bold',
    };
    return styles[level];
  };

  const log = (level: LogLevel, message: string, data?: unknown) => {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      data,
    };

    // Store log
    logs.push(entry);
    if (logs.length > maxLogs) {
      logs.shift();
    }

    // Console output in development
    if (isDevelopment) {
      const prefix = `[${context}]`;
      const style = getStyle(level);

      console.log(`%c${prefix}%c ${message}`, style, 'color: inherit', data || '');
    }
  };

  return {
    debug: (message: string, data?: unknown) => {
      log('debug', message, data);
    },
    info: (message: string, data?: unknown) => {
      log('info', message, data);
    },
    warn: (message: string, data?: unknown) => {
      log('warn', message, data);
    },
    error: (message: string, error?: unknown) => {
      const errorData =
        error instanceof Error ? { message: error.message, stack: error.stack } : error;
      log('error', message, errorData);
    },
    getLogs: () => [...logs],
    clearLogs: () => {
      logs.length = 0;
    },
  };
}
