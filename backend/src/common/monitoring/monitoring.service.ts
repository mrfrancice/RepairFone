import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Service de monitoring backend (Sentry-ready).
 *
 * Activation :
 *   1. `npm install @sentry/nestjs`
 *   2. Définir SENTRY_DSN dans .env
 *   3. Décommenter les blocs marqués `// Sentry:` ci-dessous
 *   4. Dans main.ts, après `await app.listen(...)` :
 *        const monitoring = app.get(MonitoringService);
 *        monitoring.init();
 *
 * Tant que SENTRY_DSN est vide, le service est un no-op.
 */
@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private initialized = false;

  constructor(private readonly config: ConfigService) {}

  init(): void {
    const dsn = this.config.get<string>('SENTRY_DSN');
    if (!dsn || this.initialized) return;

    // Sentry: const Sentry = require('@sentry/nestjs');
    // Sentry: Sentry.init({
    // Sentry:   dsn,
    // Sentry:   environment: this.config.get('NODE_ENV'),
    // Sentry:   tracesSampleRate: 0.1,
    // Sentry: });
    // Sentry: this.initialized = true;

    this.logger.log('Sentry DSN configured but SDK not installed yet');
  }

  captureException(error: unknown, context?: Record<string, unknown>): void {
    this.logger.error('captureException', { error, context });
    // Sentry: require('@sentry/nestjs').captureException(error, { extra: context });
  }
}
