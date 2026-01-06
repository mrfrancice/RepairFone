import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { fromPromise } from 'rxjs/internal/observable/innerFrom';
import { AuthStore } from '../stores/auth.store';
import { ApiService } from '../services/api.service';

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const refreshTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authStore = inject(AuthStore);
  const api = inject(ApiService);

  // Skip refresh for auth endpoints
  if (req.url.includes('/auth/login') ||
      req.url.includes('/auth/register') ||
      req.url.includes('/auth/refresh') ||
      req.url.includes('/auth/forgot-password')) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && authStore.getRefreshToken()) {
        return handleTokenRefresh(req, next, authStore, api, router);
      }

      return throwError(() => error);
    })
  );
};

function handleTokenRefresh(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authStore: AuthStore,
  api: ApiService,
  router: Router
) {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const refreshToken = authStore.getRefreshToken();
    if (!refreshToken) {
      return handleRefreshError(authStore, router);
    }

    return fromPromise(
      api.post<TokenResponse>('/auth/refresh', { refreshToken }).toPromise()
    ).pipe(
      switchMap((response) => {
        isRefreshing = false;

        if (response?.accessToken) {
          authStore.setToken(response.accessToken);
          if (response.refreshToken) {
            authStore.setRefreshToken(response.refreshToken);
          }
          refreshTokenSubject.next(response.accessToken);

          // Retry the original request with new token
          return next(addTokenToRequest(req, response.accessToken));
        }

        return handleRefreshError(authStore, router);
      }),
      catchError(() => {
        isRefreshing = false;
        return handleRefreshError(authStore, router);
      })
    );
  }

  // Wait for the token to be refreshed
  return refreshTokenSubject.pipe(
    filter(token => token !== null),
    take(1),
    switchMap(token => next(addTokenToRequest(req, token!)))
  );
}

function addTokenToRequest(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

function handleRefreshError(authStore: AuthStore, router: Router) {
  isRefreshing = false;
  authStore.logout();
  router.navigate(['/auth/login']);
  return throwError(() => new Error('Session expirée. Veuillez vous reconnecter.'));
}
