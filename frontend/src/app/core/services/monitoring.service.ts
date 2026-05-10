import { Injectable, ErrorHandler } from '@angular/core';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';

/**
 * Service de monitoring (Sentry-ready).
 *
 * Activation : remplir `environment.sentry.dsn` puis :
 *   1. `npm install @sentry/angular`
 *   2. Décommenter les blocs marqués `// Sentry:` ci-dessous
 *   3. Dans `app.config.ts`, fournir le ErrorHandler global :
 *        { provide: ErrorHandler, useClass: SentryErrorHandler }
 *
 * Tant que dsn est vide, le service est un no-op (aucune dépendance
 * runtime ajoutée — pas d'impact sur le bundle).
 */
@Injectable({ providedIn: 'root' })
export class MonitoringService {
  private initialized = false;

  constructor(private readonly logger: LoggerService) {}

  init(): void {
    const dsn = environment.sentry?.dsn;
    if (!dsn || this.initialized) return;

    // Sentry: import('@sentry/angular').then(Sentry => {
    // Sentry:   Sentry.init({
    // Sentry:     dsn,
    // Sentry:     environment: environment.sentry.environment,
    // Sentry:     tracesSampleRate: environment.sentry.tracesSampleRate,
    // Sentry:     integrations: [Sentry.browserTracingIntegration()],
    // Sentry:   });
    // Sentry:   this.initialized = true;
    // Sentry: });

    this.logger.log('MonitoringService', 'Sentry DSN configured but SDK not installed yet');
  }

  captureException(error: unknown, context?: Record<string, unknown>): void {
    this.logger.error('MonitoringService', 'captureException', { error, context });
    // Sentry: import('@sentry/angular').then(S => S.captureException(error, { extra: context }));
  }

  setUser(user: { id: string; phone?: string; role?: string } | null): void {
    // Sentry: import('@sentry/angular').then(S => S.setUser(user));
  }
}

/**
 * ErrorHandler global Sentry-aware.
 * Branchez-le dans app.config.ts uniquement quand le SDK Sentry est installé.
 */
@Injectable()
export class SentryErrorHandler implements ErrorHandler {
  constructor(private readonly monitoring: MonitoringService) {}

  handleError(error: unknown): void {
    this.monitoring.captureException(error);
    console.error(error);
  }
}
