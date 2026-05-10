import { TestBed } from '@angular/core/testing';
import { AuthStore } from './auth.store';
import { SecureStorageService, StorageKeys } from '../services/secure-storage.service';
import { LoggerService } from '../services/logger.service';

/**
 * Squelette de tests AuthStore.
 *
 * À étoffer avec :
 *   - Hydration depuis localStorage au démarrage
 *   - setAuth() / clearAuth() / setUser()
 *   - Computed selectors (isClient, isRepairer, isAdmin)
 *   - Effets de bord sur SecureStorage
 */
describe('AuthStore', () => {
  let store: AuthStore;
  let storageMock: jest.Mocked<SecureStorageService>;

  beforeEach(() => {
    storageMock = {
      get: jest.fn().mockReturnValue(null),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    } as unknown as jest.Mocked<SecureStorageService>;

    TestBed.configureTestingModule({
      providers: [
        AuthStore,
        { provide: SecureStorageService, useValue: storageMock },
        { provide: LoggerService, useValue: { log: jest.fn(), error: jest.fn(), warn: jest.fn() } },
      ],
    });

    store = TestBed.inject(AuthStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('starts unauthenticated when storage is empty', () => {
    expect(store.isAuthenticated()).toBe(false);
    expect(store.user()).toBeNull();
  });

  it('hydrates from storage when token + user are present', () => {
    const fakeUser = { id: '1', phone: '0700000000', role: 'client' as const };
    const fakeToken = 'jwt-token';
    storageMock.get.mockImplementation((key: string) => {
      if (key === StorageKeys.AUTH_TOKEN) return fakeToken;
      if (key === StorageKeys.USER) return JSON.stringify(fakeUser);
      return null;
    });

    // Re-créer le store après avoir armé le storage
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthStore,
        { provide: SecureStorageService, useValue: storageMock },
        { provide: LoggerService, useValue: { log: jest.fn(), error: jest.fn(), warn: jest.fn() } },
      ],
    });
    const hydratedStore = TestBed.inject(AuthStore);

    expect(hydratedStore.isAuthenticated()).toBe(true);
    expect(hydratedStore.user()?.phone).toBe('0700000000');
    expect(hydratedStore.isClient()).toBe(true);
  });
});
