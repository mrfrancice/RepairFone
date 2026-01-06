import { Injectable } from '@angular/core';

/**
 * Secure storage service with basic obfuscation
 * Note: For production, consider using a proper encryption library
 * and secure key management. This provides basic protection against
 * casual inspection of localStorage.
 */
@Injectable({ providedIn: 'root' })
export class SecureStorageService {
  private readonly APP_PREFIX = 'rf_';

  /**
   * Store data with basic encoding
   */
  set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      const encoded = this.encode(serialized);
      localStorage.setItem(this.APP_PREFIX + key, encoded);
    } catch (error) {
      console.error('SecureStorage: Failed to store data', error);
    }
  }

  /**
   * Retrieve and decode stored data
   */
  get<T>(key: string): T | null {
    try {
      const encoded = localStorage.getItem(this.APP_PREFIX + key);
      if (!encoded) return null;

      const decoded = this.decode(encoded);
      return JSON.parse(decoded) as T;
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
   * Basic encoding (Base64 + simple transformation)
   * This is NOT encryption - just obfuscation
   */
  private encode(data: string): string {
    try {
      // Add timestamp for basic rotation
      const payload = {
        d: data,
        t: Date.now(),
      };

      const jsonStr = JSON.stringify(payload);
      // Simple character shift before base64
      const shifted = this.shiftChars(jsonStr, 3);
      return btoa(shifted);
    } catch {
      return btoa(data);
    }
  }

  /**
   * Decode the obfuscated data
   */
  private decode(encoded: string): string {
    try {
      const shifted = atob(encoded);
      const unshifted = this.shiftChars(shifted, -3);
      const payload = JSON.parse(unshifted);

      // Check for expiration (30 days)
      const maxAge = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - payload.t > maxAge) {
        throw new Error('Data expired');
      }

      return payload.d;
    } catch {
      // Fallback for old format
      return atob(encoded);
    }
  }

  /**
   * Simple character shift (Caesar cipher-like)
   */
  private shiftChars(str: string, shift: number): string {
    return str
      .split('')
      .map(char => String.fromCharCode(char.charCodeAt(0) + shift))
      .join('');
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
