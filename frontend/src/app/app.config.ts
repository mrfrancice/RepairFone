import {
  ApplicationConfig,
  ErrorHandler,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  provideAppInitializer,
  inject,
  isDevMode,
  LOCALE_ID
} from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { refreshTokenInterceptor } from './core/interceptors/refresh-token.interceptor';
import { AuthStore } from './core/stores/auth.store';
import { MonitoringService, SentryErrorHandler } from './core/services/monitoring.service';

registerLocaleData(localeFr, 'fr-FR');

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'fr-FR' },
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimationsAsync(),
    // Init Sentry tôt (no-op si dsn vide). Doit précéder hydrate() pour
    // capturer aussi les erreurs du démarrage.
    provideAppInitializer(() => inject(MonitoringService).init()),
    // Hydrate AuthStore before any guard runs — fixes session loss on first navigation
    provideAppInitializer(() => inject(AuthStore).hydrate()),
    // ErrorHandler global : envoie les erreurs non capturées à Sentry
    { provide: ErrorHandler, useClass: SentryErrorHandler },
    provideRouter(routes, withViewTransitions()),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, refreshTokenInterceptor, errorInterceptor])
    ),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
