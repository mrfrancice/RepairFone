import { Injectable, ErrorHandler, inject } from '@angular/core';
import * as Sentry from '@sentry/angular';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';

/**
 * Service de monitoring frontend (Sentry-compatible).
 *
 * Compatible avec :
 * - Sentry SaaS (https://sentry.io) — free tier 5k erreurs/mois
 * - GlitchTip self-hosted (open source, SDK Sentry compatible)
 *
 * Activation : remplir `environment.sentry.dsn`. Tant qu'il est vide,
 * le service est un no-op total (aucune init, aucune capture).
 */
@Injectable({ providedIn: 'root' })
export class MonitoringService {
  private readonly logger = inject(LoggerService);
  private initialized = false;

  init(): void {
    const dsn = environment.sentry?.dsn;
    if (!dsn || this.initialized) {
      this.logger.info('MonitoringService', 'Sentry désactivé (dsn vide)');
      return;
    }

    Sentry.init({
      dsn,
      environment: environment.sentry.environment,
      tracesSampleRate: environment.sentry.tracesSampleRate ?? 0.1,
      // BrowserTracing capture navigation + http
      integrations: [Sentry.browserTracingIntegration()],
      // Ne pas remonter les annulations de requêtes
      beforeSend(event, hint) {
        const error = hint?.originalException as { name?: string; status?: number } | undefined;
        if (error?.name === 'AbortError') return null;
        if (error?.status && error.status >= 400 && error.status < 500) return null;
        return event;
      },
    });

    this.initialized = true;
    this.logger.info('MonitoringService', `Sentry initialisé (env=${environment.sentry.environment})`);
  }

  captureException(error: unknown, context?: Record<string, unknown>): void {
    if (!this.initialized) {
      this.logger.error('MonitoringService', 'captureException (Sentry non-init)', { error, context });
      return;
    }
    Sentry.captureException(error, { extra: context });
  }

  setUser(user: { id: string; phone?: string; role?: string } | null): void {
    if (!this.initialized) return;
    Sentry.setUser(user);
  }
}

/**
 * ErrorHandler global Sentry-aware.
 * Branché dans app.config.ts via {provide: ErrorHandler, useClass: SentryErrorHandler}.
 * Si Sentry n'est pas init (dsn vide), tombe en console.error standard.
 */
@Injectable()
export class SentryErrorHandler implements ErrorHandler {
  private readonly monitoring = inject(MonitoringService);

  handleError(error: unknown): void {
    this.monitoring.captureException(error);
    // eslint-disable-next-line no-console
    console.error(error);
  }
}
