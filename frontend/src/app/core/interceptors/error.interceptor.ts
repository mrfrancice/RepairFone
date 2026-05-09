import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthStore } from '../stores/auth.store';
import { ToastService } from '../services/toast.service';
import { LoggerService } from '../services/logger.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authStore = inject(AuthStore);
  const toastService = inject(ToastService);
  const logger = inject(LoggerService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Log l'erreur pour le debugging
      logger.error('HttpInterceptor', `HTTP Error ${error.status}`, {
        url: req.url,
        method: req.method,
        status: error.status,
        message: error.message
      });

      if (error.status === 401) {
        // Only redirect to login if user was previously authenticated
        // This prevents redirecting unauthenticated users on public pages
        if (authStore.isAuthenticated()) {
          authStore.logout();
          router.navigate(['/auth/login']);
        }
        // Pas de toast pour 401 car c'est gere par la redirection
        return throwError(() => new Error('Session expirée'));
      }

      let errorMessage = 'Une erreur est survenue';

      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 0) {
        errorMessage = 'Impossible de se connecter au serveur';
      } else if (error.status === 403) {
        errorMessage = 'Accès non autorisé';
      } else if (error.status === 404) {
        errorMessage = 'Ressource non trouvée';
      } else if (error.status === 422) {
        errorMessage = 'Données invalides';
      } else if (error.status >= 500) {
        errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
      }

      // Afficher le toast d'erreur
      toastService.error(errorMessage);

      return throwError(() => new Error(errorMessage));
    })
  );
};
