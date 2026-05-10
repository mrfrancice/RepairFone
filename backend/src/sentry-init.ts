/**
 * Initialisation Sentry précoce.
 *
 * Ce fichier DOIT être importé en TOUT PREMIER dans main.ts, avant
 * NestFactory et tout autre module. Sentry instrumente le runtime
 * Node au chargement — toute init tardive perd des traces.
 *
 * Compatible Sentry SaaS et GlitchTip (open source).
 * Lit la config directement via process.env (pas ConfigService car
 * Nest n'existe pas encore à ce stade).
 */
import * as Sentry from '@sentry/nestjs';
import * as dotenv from 'dotenv';

dotenv.config();

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    release: process.env.APP_VERSION,
    beforeSend(event, hint) {
      // Ne pas remonter les 4xx (erreurs utilisateur, pas bugs)
      const error = hint?.originalException as { status?: number } | undefined;
      if (error?.status && error.status >= 400 && error.status < 500) {
        return null;
      }
      return event;
    },
  });
  // eslint-disable-next-line no-console
  console.log(`[Sentry] Initialisé (env=${process.env.NODE_ENV})`);
}
