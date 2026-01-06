import { Injectable } from '@angular/core';

/**
 * Secure storage service with AES-GCM encryption
 * Uses Web Crypto API for proper cryptographic protection of sensitive data
 * stored in localStorage.
 */
@Injectable({ providedIn: 'root' })
export class SecureStorageService {
  private readonly APP_PREFIX = 'rf_';
  private readonly ENCRYPTION_KEY_NAME = 'rf_enc_key';
  private encryptionKey: CryptoKey | null = null;

  constructor() {
    this.initializeEncryptionKey();
  }

  /**
   * Initialize or retrieve the encryption key from IndexedDB
   * In a production environment, consider using a key derivation function
   * with a user-specific password or server-provided key
   */
  private async initializeEncryptionKey(): Promise<void> {
    try {
      // Try to retrieve existing key from IndexedDB
      const storedKey = await this.getStoredKey();
      if (storedKey) {
        this.encryptionKey = storedKey;
        return;
      }

      // Generate new key if none exists
      this.encryptionKey = await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256,
        },
        true, // extractable
        ['encrypt', 'decrypt']
      );

      // Store the key for future use
      await this.storeKey(this.encryptionKey);
    } catch (error) {
      console.error('SecureStorage: Failed to initialize encryption key', error);
    }
  }

  /**
   * Store data with AES-GCM encryption
   */
  async set<T>(key: string, value: T): Promise<void> {
    try {
      await this.ensureKeyInitialized();

      const serialized = JSON.stringify({
        d: value,
        t: Date.now(),
      });

      const encrypted = await this.encrypt(serialized);
      localStorage.setItem(this.APP_PREFIX + key, encrypted);
    } catch (error) {
      console.error('SecureStorage: Failed to store data', error);
      throw error;
    }
  }

  /**
   * Retrieve and decrypt stored data
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      await this.ensureKeyInitialized();

      const encrypted = localStorage.getItem(this.APP_PREFIX + key);
      if (!encrypted) return null;

      const decrypted = await this.decrypt(encrypted);
      const payload = JSON.parse(decrypted);

      // Check for expiration (30 days)
      const maxAge = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - payload.t > maxAge) {
        this.remove(key);
        return null;
      }

      return payload.d as T;
    } catch (error) {
      console.error('SecureStorage: Failed to retrieve data', error);
      this.remove(key);
      return null;
    }
  }

  /**
   * Remove stored item
   */
  remove(key: string): void {
    localStorage.removeItem(this.APP_PREFIX + key);
  }

  /**
   * Clear all app-related storage
   */
  clear(): void {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.APP_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return localStorage.getItem(this.APP_PREFIX + key) !== null;
  }

  /**
   * Encrypt data using AES-GCM
   * Returns base64-encoded string with IV prepended
   */
  private async encrypt(data: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    // Generate a random IV (Initialization Vector)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Convert string to ArrayBuffer
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // Encrypt the data
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      this.encryptionKey,
      dataBuffer
    );

    // Combine IV and encrypted data
    const encryptedArray = new Uint8Array(encryptedBuffer);
    const combined = new Uint8Array(iv.length + encryptedArray.length);
    combined.set(iv, 0);
    combined.set(encryptedArray, iv.length);

    // Convert to base64 for storage
    return this.arrayBufferToBase64(combined);
  }

  /**
   * Decrypt data using AES-GCM
   * Expects base64-encoded string with IV prepended
   */
  private async decrypt(encryptedData: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    // Decode from base64
    const combined = this.base64ToArrayBuffer(encryptedData);

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedBuffer = combined.slice(12);

    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      this.encryptionKey,
      encryptedBuffer
    );

    // Convert ArrayBuffer to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  }

  /**
   * Ensure encryption key is initialized before operations
   */
  private async ensureKeyInitialized(): Promise<void> {
    if (!this.encryptionKey) {
      await this.initializeEncryptionKey();
    }
    if (!this.encryptionKey) {
      throw new Error('Failed to initialize encryption key');
    }
  }

  /**
   * Store encryption key in IndexedDB
   */
  private async storeKey(key: CryptoKey): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SecureStorageDB', 1);

      request.onerror = () => reject(request.error);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('keys')) {
          db.createObjectStore('keys');
        }
      };

      request.onsuccess = async () => {
        const db = request.result;
        try {
          const exportedKey = await crypto.subtle.exportKey('jwk', key);
          const transaction = db.transaction(['keys'], 'readwrite');
          const store = transaction.objectStore('keys');
          store.put(exportedKey, this.ENCRYPTION_KEY_NAME);

          transaction.oncomplete = () => {
            db.close();
            resolve();
          };
          transaction.onerror = () => reject(transaction.error);
        } catch (error) {
          db.close();
          reject(error);
        }
      };
    });
  }

  /**
   * Retrieve encryption key from IndexedDB
   */
  private async getStoredKey(): Promise<CryptoKey | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SecureStorageDB', 1);

      request.onerror = () => reject(request.error);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('keys')) {
          db.createObjectStore('keys');
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['keys'], 'readonly');
        const store = transaction.objectStore('keys');
        const getRequest = store.get(this.ENCRYPTION_KEY_NAME);

        getRequest.onsuccess = async () => {
          db.close();
          if (!getRequest.result) {
            resolve(null);
            return;
          }

          try {
            const key = await crypto.subtle.importKey(
              'jwk',
              getRequest.result,
              {
                name: 'AES-GCM',
                length: 256,
              },
              true,
              ['encrypt', 'decrypt']
            );
            resolve(key);
          } catch (error) {
            console.error('Failed to import key:', error);
            resolve(null);
          }
        };

        getRequest.onerror = () => {
          db.close();
          reject(getRequest.error);
        };
      };
    });
  }

  /**
   * Convert ArrayBuffer or Uint8Array to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}

/**
 * Storage keys enum for type safety
 */
export enum StorageKeys {
  AUTH = 'auth',
  REFRESH_TOKEN = 'refresh',
  USER_PREFERENCES = 'prefs',
  RECENT_SEARCHES = 'searches',
  DEVICE_ID = 'device',
}
