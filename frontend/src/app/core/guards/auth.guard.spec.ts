import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard, adminGuard, clientOnlyGuard } from './auth.guard';
import { AuthStore } from '../stores/auth.store';

describe('auth guards', () => {
  let router: jasmine.SpyObj<Router>;
  // Les selectors `isAuthenticated`/`isAdmin`/`isRepairer` du store sont des
  // `Signal<boolean>` (computed). Pour les mocker on stocke des Spy bruts dans
  // un objet plat ; le cast `as unknown as AuthStore` evite que TS se plaigne
  // de la signature speciale `& { [SIGNAL]: unknown }`.
  let isAuthenticatedSpy: jasmine.Spy<() => boolean>;
  let isAdminSpy: jasmine.Spy<() => boolean>;
  let isRepairerSpy: jasmine.Spy<() => boolean>;

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    isAuthenticatedSpy = jasmine.createSpy('isAuthenticated').and.returnValue(false);
    isAdminSpy = jasmine.createSpy('isAdmin').and.returnValue(false);
    isRepairerSpy = jasmine.createSpy('isRepairer').and.returnValue(false);
    const authStoreMock = {
      isAuthenticated: isAuthenticatedSpy,
      isAdmin: isAdminSpy,
      isRepairer: isRepairerSpy,
    } as unknown as AuthStore;
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthStore, useValue: authStoreMock },
      ],
    });
  });

  describe('authGuard', () => {
    it('autorise si authentifié', () => {
      isAuthenticatedSpy.and.returnValue(true);
      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as ActivatedRouteSnapshot, { url: '/x' } as RouterStateSnapshot),
      );
      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('redirige vers /auth/login avec returnUrl si non authentifié', () => {
      isAuthenticatedSpy.and.returnValue(false);
      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as ActivatedRouteSnapshot, { url: '/protected' } as RouterStateSnapshot),
      );
      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(
        ['/auth/login'],
        { queryParams: { returnUrl: '/protected' } },
      );
    });
  });

  describe('adminGuard', () => {
    it('redirige vers login si non authentifié', () => {
      isAuthenticatedSpy.and.returnValue(false);
      const result = TestBed.runInInjectionContext(() =>
        adminGuard({} as ActivatedRouteSnapshot, { url: '/admin' } as RouterStateSnapshot),
      );
      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], jasmine.any(Object));
    });

    it('autorise si admin authentifié', () => {
      isAuthenticatedSpy.and.returnValue(true);
      isAdminSpy.and.returnValue(true);
      const result = TestBed.runInInjectionContext(() =>
        adminGuard({} as ActivatedRouteSnapshot, { url: '/admin' } as RouterStateSnapshot),
      );
      expect(result).toBe(true);
    });

    it('redirige vers /home si authentifié mais pas admin', () => {
      isAuthenticatedSpy.and.returnValue(true);
      isAdminSpy.and.returnValue(false);
      const result = TestBed.runInInjectionContext(() =>
        adminGuard({} as ActivatedRouteSnapshot, { url: '/admin' } as RouterStateSnapshot),
      );
      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });
  });

  describe('clientOnlyGuard', () => {
    it('redirige les repairer vers /repairer', () => {
      isRepairerSpy.and.returnValue(true);
      const result = TestBed.runInInjectionContext(() =>
        clientOnlyGuard({} as ActivatedRouteSnapshot, { url: '/search' } as RouterStateSnapshot),
      );
      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/repairer']);
    });

    it('autorise les non-repairer', () => {
      isRepairerSpy.and.returnValue(false);
      const result = TestBed.runInInjectionContext(() =>
        clientOnlyGuard({} as ActivatedRouteSnapshot, { url: '/search' } as RouterStateSnapshot),
      );
      expect(result).toBe(true);
    });
  });
});
