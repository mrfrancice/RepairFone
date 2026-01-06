import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Configuration for the logger service
 */
export interface LoggerConfig {
  /** Minimum log level to output */
  minLevel: LogLevel;
  /** Whether to include timestamps in log output */
  includeTimestamp: boolean;
  /** Whether to include the context/tag in log output */
  includeContext: boolean;
}

/**
 * A structured logging service for the Angular frontend.
 *
 * Features:
 * - Log levels: debug, info, warn, error
 * - Development mode: outputs all logs to console
 * - Production mode: suppresses debug/info logs, only shows warn/error
 * - Includes timestamp and context/tag for each log
 *
 * @example
 * ```typescript
 * logger.debug('MyComponent', 'Initializing...');
 * logger.info('MyComponent', 'User logged in', { userId: '123' });
 * logger.warn('MyComponent', 'Deprecated API used');
 * logger.error('MyComponent', 'Failed to load data', error);
 * ```
 */
@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly config: LoggerConfig;

  constructor() {
    // Configure based on environment
    this.config = {
      minLevel: environment.production ? LogLevel.WARN : LogLevel.DEBUG,
      includeTimestamp: true,
      includeContext: true,
    };
  }

  /**
   * Log a debug message. Only shown in development mode.
   * @param context The component or service name for context
   * @param message The message to log
   * @param data Optional additional data to log
   */
  debug(context: string, message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, context, message, data);
  }

  /**
   * Log an info message. Only shown in development mode.
   * @param context The component or service name for context
   * @param message The message to log
   * @param data Optional additional data to log
   */
  info(context: string, message: string, data?: unknown): void {
    this.log(LogLevel.INFO, context, message, data);
  }

  /**
   * Log a warning message. Shown in both development and production.
   * @param context The component or service name for context
   * @param message The message to log
   * @param data Optional additional data to log
   */
  warn(context: string, message: string, data?: unknown): void {
    this.log(LogLevel.WARN, context, message, data);
  }

  /**
   * Log an error message. Shown in both development and production.
   * @param context The component or service name for context
   * @param message The message to log
   * @param data Optional additional data (usually an Error object)
   */
  error(context: string, message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, context, message, data);
  }

  /**
   * Check if a log level is enabled
   * @param level The log level to check
   * @returns True if the log level is enabled
   */
  isLevelEnabled(level: LogLevel): boolean {
    return level >= this.config.minLevel;
  }

  /**
   * Get the current minimum log level
   */
  getMinLevel(): LogLevel {
    return this.config.minLevel;
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, context: string, message: string, data?: unknown): void {
    // Check if this log level should be output
    if (!this.isLevelEnabled(level)) {
      return;
    }

    // Build the log prefix
    const prefix = this.buildPrefix(level, context);

    // Get the appropriate console method
    const consoleMethod = this.getConsoleMethod(level);

    // Output the log
    if (data !== undefined) {
      consoleMethod(`${prefix} ${message}`, data);
    } else {
      consoleMethod(`${prefix} ${message}`);
    }
  }

  /**
   * Build the log prefix with optional timestamp and context
   */
  private buildPrefix(level: LogLevel, context: string): string {
    const parts: string[] = [];

    // Add timestamp if enabled
    if (this.config.includeTimestamp) {
      parts.push(`[${this.formatTimestamp()}]`);
    }

    // Add log level
    parts.push(`[${this.getLevelName(level)}]`);

    // Add context if enabled
    if (this.config.includeContext && context) {
      parts.push(`[${context}]`);
    }

    return parts.join(' ');
  }

  /**
   * Format the current timestamp for logging
   */
  private formatTimestamp(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const millis = now.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${millis}`;
  }

  /**
   * Get the string name for a log level
   */
  private getLevelName(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return 'DEBUG';
      case LogLevel.INFO:
        return 'INFO';
      case LogLevel.WARN:
        return 'WARN';
      case LogLevel.ERROR:
        return 'ERROR';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Get the appropriate console method for the log level
   */
  private getConsoleMethod(level: LogLevel): (...args: unknown[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug.bind(console);
      case LogLevel.INFO:
        return console.info.bind(console);
      case LogLevel.WARN:
        return console.warn.bind(console);
      case LogLevel.ERROR:
        return console.error.bind(console);
      default:
        return console.log.bind(console);
    }
  }
}
