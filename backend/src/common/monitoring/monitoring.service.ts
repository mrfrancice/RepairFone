import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/nestjs';

/**
 * Service de monitoring backend (Sentry-compatible).
 *
 * Activation : définir SENTRY_DSN dans .env. Compatible avec :
 * - Sentry SaaS (https://sentry.io)
 * - GlitchTip self-hosted (open source, SDK Sentry compatible)
 *
 * Si SENTRY_DSN est vide, le service ne fait rien (no-op silencieux).
 *
 * IMPORTANT : init() doit être appelé AVANT toute autre instrumentation
 * (au tout début de main.ts) pour que Sentry capture correctement les
 * traces NestJS.
 */
@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private initialized = false;

  constructor(private readonly config: ConfigService) {}

  init(): void {
    const dsn = this.config.get<string>('SENTRY_DSN');
    if (!dsn || this.initialized) {
      this.logger.log('Sentry désactivé (SENTRY_DSN non défini)');
      return;
    }

    Sentry.init({
      dsn,
      environment: this.config.get<string>('NODE_ENV') || 'development',
      // Échantillonnage : 100% en dev, 10% en prod (limite la facture)
      tracesSampleRate:
        this.config.get<string>('NODE_ENV') === 'production' ? 0.1 : 1.0,
      // Capture release : utile pour corréler erreurs et déploiements
      release: this.config.get<string>('APP_VERSION'),
      // Filtre des erreurs : on n'envoie pas les HTTP 4xx (ce sont des erreurs utilisateur)
      beforeSend(event, hint) {
        const error = hint?.originalException as any;
        if (error?.status && error.status >= 400 && error.status < 500) {
          return null;
        }
        return event;
      },
    });

    this.initialized = true;
    this.logger.log(`Sentry initialisé (env=${this.config.get('NODE_ENV')})`);
  }

  captureException(error: unknown, context?: Record<string, unknown>): void {
    if (!this.initialized) {
      this.logger.error('captureException (Sentry non-init)', {
        error,
        context,
      });
      return;
    }
    Sentry.captureException(error, { extra: context });
  }

  captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
    if (!this.initialized) return;
    Sentry.captureMessage(message, level);
  }
}
