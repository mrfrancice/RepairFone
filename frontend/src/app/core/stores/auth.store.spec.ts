import { TestBed } from '@angular/core/testing';
import { AuthStore, User } from './auth.store';
import { SecureStorageService, StorageKeys } from '../services/secure-storage.service';
import { LoggerService } from '../services/logger.service';

describe('AuthStore', () => {
  let store: AuthStore;
  let storageMock: jasmine.SpyObj<SecureStorageService>;
  let loggerMock: jasmine.SpyObj<LoggerService>;

  function createStore(): AuthStore {
    storageMock = jasmine.createSpyObj<SecureStorageService>(
      'SecureStorageService',
      ['get', 'set', 'remove', 'clear', 'has'],
    );
    storageMock.get.and.returnValue(Promise.resolve(null));
    storageMock.set.and.returnValue(Promise.resolve());

    loggerMock = jasmine.createSpyObj<LoggerService>('LoggerService', [
      'debug', 'info', 'warn', 'error',
    ]);

    TestBed.configureTestingModule({
      providers: [
        AuthStore,
        { provide: SecureStorageService, useValue: storageMock },
        { provide: LoggerService, useValue: loggerMock },
      ],
    });

    return TestBed.inject(AuthStore);
  }

  beforeEach(() => {
    store = createStore();
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('starts unauthenticated when storage is empty', async () => {
    await store.hydrate();
    expect(store.isAuthenticated()).toBe(false);
    expect(store.user()).toBeNull();
    expect(store.token()).toBeNull();
  });

  it('hydrates from storage when AUTH key contains valid payload', async () => {
    const fakeUser: User = {
      id: '1',
      phone: '0700000000',
      role: 'client',
      firstName: 'Test',
    };

    // Re-create the store with storage armed BEFORE injection
    TestBed.resetTestingModule();
    const hydratedStore = createStore();
    storageMock.get.and.returnValue(
      Promise.resolve({ token: 'jwt-token', user: fakeUser }),
    );

    await hydratedStore.hydrate();

    expect(hydratedStore.isAuthenticated()).toBe(true);
    expect(hydratedStore.user()?.phone).toBe('0700000000');
    expect(hydratedStore.isClient()).toBe(true);
    expect(hydratedStore.isRepairer()).toBe(false);
  });

  it('exposes role-based selectors', async () => {
    await store.hydrate();
    store.loginSuccess(
      { id: '1', phone: '0700000000', role: 'admin' },
      'token',
    );
    expect(store.isAdmin()).toBe(true);
    expect(store.isClient()).toBe(false);
    expect(store.userRole()).toBe('admin');
  });

  it('clears state on logout', async () => {
    await store.hydrate();
    store.loginSuccess(
      { id: '1', phone: '0700000000', role: 'client' },
      'token',
    );
    expect(store.isAuthenticated()).toBe(true);

    store.logout();
    expect(store.isAuthenticated()).toBe(false);
    expect(store.user()).toBeNull();
    expect(store.token()).toBeNull();
  });

  it('returns the correct redirect URL per role', () => {
    store.loginSuccess({ id: '1', phone: '0700000000', role: 'admin' }, 't');
    expect(store.getDefaultRedirectUrl()).toBe('/admin');

    store.loginSuccess({ id: '2', phone: '0711111111', role: 'repairer' }, 't');
    expect(store.getDefaultRedirectUrl()).toBe('/repairer/requests');

    store.loginSuccess({ id: '3', phone: '0722222222', role: 'client' }, 't');
    expect(store.getDefaultRedirectUrl()).toBe('/home');
  });
});
