import { TestBed } from '@angular/core/testing';
import { SecureStorageService, StorageKeys } from './secure-storage.service';
import { LoggerService } from './logger.service';

/**
 * Tests SecureStorageService. Chrome headless fournit crypto.subtle (AES-GCM)
 * et indexedDB natifs, donc pas de polyfill necessaire.
 *
 * Chaque test reset :
 *   - localStorage (toutes les cles rf_*)
 *   - indexedDB (database `SecureStorageDB` qui contient la cle AES)
 *
 * Sans ce reset, des tests successifs partagent la meme cle AES et leurs
 * cipherTexts s'inter-decrypteraient (correct fonctionnellement mais cree
 * du couplage qu'on ne veut pas).
 */
describe('SecureStorageService', () => {
  let service: SecureStorageService;

  function clearLocalStorage(): void {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith('rf_')) toRemove.push(k);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  }

  function deleteEncryptionDb(): Promise<void> {
    return new Promise((resolve) => {
      const req = indexedDB.deleteDatabase('SecureStorageDB');
      req.onsuccess = () => resolve();
      req.onerror = () => resolve(); // ignore : la DB n'existait peut-etre pas
      req.onblocked = () => resolve();
    });
  }

  beforeEach(async () => {
    clearLocalStorage();
    await deleteEncryptionDb();
    TestBed.configureTestingModule({
      providers: [
        SecureStorageService,
        { provide: LoggerService, useValue: jasmine.createSpyObj('LoggerService', ['debug', 'info', 'warn', 'error']) },
      ],
    });
    service = TestBed.inject(SecureStorageService);
  });

  afterEach(async () => {
    clearLocalStorage();
    await deleteEncryptionDb();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('roundtrip : set puis get retourne la valeur originale (string)', async () => {
    await service.set('user', 'Awa Koné');
    const value = await service.get<string>('user');
    expect(value).toBe('Awa Koné');
  });

  it('roundtrip : set puis get retourne la valeur originale (objet)', async () => {
    const payload = { id: '1', phone: '0700000000', role: 'client' as const, nested: { a: 1, b: [true, false] } };
    await service.set('auth', payload);
    const value = await service.get<typeof payload>('auth');
    expect(value).toEqual(payload);
  });

  it('get sur cle inexistante retourne null', async () => {
    const value = await service.get('nope');
    expect(value).toBeNull();
  });

  it('remove + get retourne null', async () => {
    await service.set('temp', 'x');
    expect(await service.get('temp')).toBe('x');
    service.remove('temp');
    expect(await service.get('temp')).toBeNull();
  });

  it('has() reflete l\'etat de presence', async () => {
    expect(service.has('k')).toBe(false);
    await service.set('k', 1);
    expect(service.has('k')).toBe(true);
    service.remove('k');
    expect(service.has('k')).toBe(false);
  });

  it('clear() supprime toutes les cles rf_*', async () => {
    await service.set('a', 1);
    await service.set('b', 2);
    localStorage.setItem('not_rf_should_stay', 'untouched');

    service.clear();

    expect(await service.get('a')).toBeNull();
    expect(await service.get('b')).toBeNull();
    expect(localStorage.getItem('not_rf_should_stay')).toBe('untouched');

    localStorage.removeItem('not_rf_should_stay');
  });

  it('le payload chiffre n\'est pas lisible en clair dans localStorage', async () => {
    const secret = 'mySuperSecretToken12345';
    await service.set('jwt', secret);
    const raw = localStorage.getItem('rf_jwt');
    expect(raw).not.toBeNull();
    expect(raw).not.toContain(secret); // chiffrement effectif
    expect(raw).not.toContain('client'); // pas de fuite metadata non plus
  });

  it('IV different a chaque set (memes data) → cipherText different', async () => {
    await service.set('a', 'foo');
    const first = localStorage.getItem('rf_a');
    clearLocalStorage();
    await service.set('a', 'foo');
    const second = localStorage.getItem('rf_a');
    expect(first).not.toBe(second);
  });

  it('cipherText corrompu → get retourne null (et purge la cle)', async () => {
    await service.set('a', 'foo');
    // Corrompt le base64 stocke
    localStorage.setItem('rf_a', 'totally-not-valid-base64!!!');
    const value = await service.get('a');
    expect(value).toBeNull();
    // Le service doit avoir purge la cle corrompue
    expect(localStorage.getItem('rf_a')).toBeNull();
  });

  it('StorageKeys enum expose les cles standards', () => {
    expect(StorageKeys.AUTH).toBe('auth');
    expect(StorageKeys.REFRESH_TOKEN).toBe('refresh');
  });
});
