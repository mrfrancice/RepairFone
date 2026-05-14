import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { refreshTokenInterceptor } from './refresh-token.interceptor';
import { AuthStore } from '../stores/auth.store';
import { LoggerService } from '../services/logger.service';
import { SecureStorageService } from '../services/secure-storage.service';
import { environment } from '../../../environments/environment';

/**
 * Tests refreshTokenInterceptor. Cible les 4 scenarios principaux + le
 * happy path (401 → refresh → retry).
 *
 * NB : `isRefreshing` et `refreshTokenSubject` sont du state global au
 * module (module-level let/const). En theorie ca peut polluer entre
 * tests, mais l'interceptor remet `isRefreshing = false` dans tous les
 * chemins (succes + erreur + handleRefreshError), donc l'isolation est
 * correcte en pratique tant qu'on attend la fin de chaque flow.
 */
describe('refreshTokenInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let routerMock: jasmine.SpyObj<Router>;
  let authStoreMock: jasmine.SpyObj<Pick<AuthStore, 'getRefreshToken' | 'setToken' | 'setRefreshToken' | 'logout' | 'isAuthenticated'>>;

  beforeEach(() => {
    routerMock = jasmine.createSpyObj<Router>('Router', ['navigate']);
    authStoreMock = jasmine.createSpyObj('AuthStore', [
      'getRefreshToken', 'setToken', 'setRefreshToken', 'logout', 'isAuthenticated',
    ]);
    authStoreMock.setRefreshToken.and.returnValue(Promise.resolve());
    authStoreMock.isAuthenticated.and.returnValue(true);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([refreshTokenInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerMock },
        { provide: AuthStore, useValue: authStoreMock },
        { provide: LoggerService, useValue: jasmine.createSpyObj('LoggerService', ['debug', 'info', 'warn', 'error']) },
        // SecureStorageService est injecte par AuthStore (ici mocke) mais
        // certains DI paths peuvent y faire reference — fournir un stub safe.
        { provide: SecureStorageService, useValue: jasmine.createSpyObj('SecureStorage', ['get', 'set', 'remove', 'clear', 'has']) },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('laisse passer les endpoints /auth/login sans tenter de refresh', () => {
    http.post(`${environment.apiUrl}/auth/login`, {}).subscribe({
      error: () => { /* expected */ },
    });
    const req = httpTesting.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush('unauthorized', { status: 401, statusText: 'Unauthorized' });
    // Verifie qu'aucun appel /auth/refresh n'a ete fait
    expect(authStoreMock.getRefreshToken).not.toHaveBeenCalled();
  });

  it('laisse passer les endpoints /auth/refresh sans loop infini', () => {
    http.post(`${environment.apiUrl}/auth/refresh`, {}).subscribe({
      error: () => { /* expected */ },
    });
    const req = httpTesting.expectOne(`${environment.apiUrl}/auth/refresh`);
    req.flush('expired', { status: 401, statusText: 'Unauthorized' });
    expect(authStoreMock.getRefreshToken).not.toHaveBeenCalled();
  });

  it('401 sans refresh token stocke → erreur propagee, pas de refresh', (done) => {
    authStoreMock.getRefreshToken.and.returnValue(Promise.resolve(null));

    http.get(`${environment.apiUrl}/users/me`).subscribe({
      next: () => fail('should not succeed'),
      error: (err) => {
        expect(err.status).toBe(401);
        done();
      },
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/users/me`);
    req.flush('unauthorized', { status: 401, statusText: 'Unauthorized' });
  });

  it('200 OK → laisse passer sans intervention', (done) => {
    http.get<{ ok: boolean }>(`${environment.apiUrl}/health`).subscribe({
      next: (body) => {
        expect(body.ok).toBe(true);
        expect(authStoreMock.getRefreshToken).not.toHaveBeenCalled();
        done();
      },
    });
    const req = httpTesting.expectOne(`${environment.apiUrl}/health`);
    req.flush({ ok: true });
  });

  it('erreur 500 (non-401) → propagee sans tenter de refresh', (done) => {
    http.get(`${environment.apiUrl}/anything`).subscribe({
      error: (err) => {
        expect(err.status).toBe(500);
        expect(authStoreMock.getRefreshToken).not.toHaveBeenCalled();
        done();
      },
    });
    const req = httpTesting.expectOne(`${environment.apiUrl}/anything`);
    req.flush('boom', { status: 500, statusText: 'Internal Server Error' });
  });

  // ─────────────────────────────────────────────────────────────────────
  // Happy path : 401 → POST /auth/refresh → setToken + retry
  // ─────────────────────────────────────────────────────────────────────

  it('401 avec refresh token OK → POST /auth/refresh → retry requete avec nouveau token', (done) => {
    authStoreMock.getRefreshToken.and.returnValue(Promise.resolve('old-refresh'));

    http.get<{ ok: boolean }>(`${environment.apiUrl}/users/me`).subscribe({
      next: (body) => {
        // Le retry a reussi : on recoit le body final
        expect(body.ok).toBe(true);
        // Le nouveau access token a ete propage dans le store
        expect(authStoreMock.setToken).toHaveBeenCalledWith('new-access');
        expect(authStoreMock.setRefreshToken).toHaveBeenCalledWith('new-refresh');
        done();
      },
      error: (err) => fail(`should retry successfully, got error: ${err.message}`),
    });

    // 1. La requete originale est interceptee, le backend repond 401
    const original = httpTesting.expectOne(`${environment.apiUrl}/users/me`);
    original.flush('unauthorized', { status: 401, statusText: 'Unauthorized' });

    // 2. L'interceptor lit le refresh token (async via Promise) puis appelle
    //    POST /auth/refresh. setTimeout(0) laisse la microtask Promise se
    //    resoudre avant qu'on flush la requete suivante.
    setTimeout(() => {
      const refresh = httpTesting.expectOne(`${environment.apiUrl}/auth/refresh`);
      expect(refresh.request.method).toBe('POST');
      expect(refresh.request.body).toEqual({ refreshToken: 'old-refresh' });
      refresh.flush({ accessToken: 'new-access', refreshToken: 'new-refresh' });

      // 3. La requete originale est rejouee avec le nouveau token
      setTimeout(() => {
        const retry = httpTesting.expectOne(`${environment.apiUrl}/users/me`);
        expect(retry.request.headers.get('Authorization')).toBe('Bearer new-access');
        retry.flush({ ok: true });
      }, 0);
    }, 0);
  });

  it('refresh fail → logout + redirect /auth/login', (done) => {
    authStoreMock.getRefreshToken.and.returnValue(Promise.resolve('old-refresh'));

    http.get(`${environment.apiUrl}/users/me`).subscribe({
      next: () => fail('should not succeed'),
      error: () => {
        expect(authStoreMock.logout).toHaveBeenCalled();
        expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login']);
        done();
      },
    });

    const original = httpTesting.expectOne(`${environment.apiUrl}/users/me`);
    original.flush('unauthorized', { status: 401, statusText: 'Unauthorized' });

    setTimeout(() => {
      const refresh = httpTesting.expectOne(`${environment.apiUrl}/auth/refresh`);
      refresh.flush('refresh expired', { status: 401, statusText: 'Unauthorized' });
    }, 0);
  });
});
