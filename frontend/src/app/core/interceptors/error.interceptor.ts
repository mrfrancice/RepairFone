import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthStore } from '../stores/auth.store';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authStore = inject(AuthStore);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Only redirect to login if user was previously authenticated
        // This prevents redirecting unauthenticated users on public pages
        if (authStore.isAuthenticated()) {
          authStore.logout();
          router.navigate(['/auth/login']);
        }
      }

      let errorMessage = 'Une erreur est survenue';

      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 0) {
        errorMessage = 'Impossible de se connecter au serveur';
      } else if (error.status === 404) {
        errorMessage = 'Ressource non trouvée';
      } else if (error.status >= 500) {
        errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
      }

      return throwError(() => new Error(errorMessage));
    })
  );
};
