import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LoggerService } from './logger.service';

export interface BiometricCredential {
  id: string;
  publicKey: ArrayBuffer;
  createdAt: Date;
}

/**
 * BiometricService - Handles biometric authentication using WebAuthn API
 * Provides fingerprint, face recognition, and other biometric authentication
 * Falls back gracefully on browsers that don't support WebAuthn
 * Persists user preference to localStorage
 */
@Injectable({ providedIn: 'root' })
export class BiometricService {
  private readonly STORAGE_KEY = 'rf_biometric_enabled';
  private readonly CREDENTIAL_KEY = 'rf_biometric_credential';
  private readonly platformId = inject(PLATFORM_ID);
  private readonly logger = inject(LoggerService);

  /**
   * Whether biometric authentication is enabled by the user
   */
  readonly isEnabled = signal<boolean>(false);

  /**
   * Whether the browser supports WebAuthn
   */
  readonly isSupported = signal<boolean>(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkSupport();
      this.loadPreference();
    }
  }

  /**
   * Check if WebAuthn is supported in the current browser
   */
  private checkSupport(): void {
    const supported =
      typeof window !== 'undefined' &&
      window.PublicKeyCredential !== undefined &&
      typeof window.PublicKeyCredential === 'function';

    this.isSupported.set(supported);
  }

  /**
   * Load user preference from localStorage
   */
  private loadPreference(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored === 'true') {
        this.isEnabled.set(true);
      }
    } catch (error) {
      console.warn('BiometricService: Failed to load preference', error);
    }
  }

  /**
   * Persist preference to localStorage
   */
  private savePreference(enabled: boolean): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, enabled.toString());
      this.isEnabled.set(enabled);
    } catch (error) {
      console.warn('BiometricService: Failed to save preference', error);
    }
  }

  /**
   * Register a new biometric credential for the user
   * This creates a new public key credential that can be used for authentication
   */
  async register(userId: string, userName: string): Promise<boolean> {
    if (!isPlatformBrowser(this.platformId) || !this.isSupported()) {
      console.warn('BiometricService: WebAuthn not supported');
      return false;
    }

    try {
      const challenge = this.generateChallenge();

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions =
        {
          challenge,
          rp: {
            name: 'RepairFone',
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(userId),
            name: userName,
            displayName: userName,
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' }, // ES256
            { alg: -257, type: 'public-key' }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 60000,
          attestation: 'none',
        };

      const credential = (await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      })) as PublicKeyCredential | null;

      if (credential) {
        this.saveCredential(credential.id);
        this.savePreference(true);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('BiometricService', 'Registration failed', error);
      return false;
    }
  }

  /**
   * Authenticate the user using biometric credentials
   * Returns true if authentication succeeds, false otherwise
   */
  async authenticate(): Promise<boolean> {
    if (!isPlatformBrowser(this.platformId) || !this.isSupported()) {
      console.warn('BiometricService: WebAuthn not supported');
      return false;
    }

    if (!this.isEnabled()) {
      console.warn('BiometricService: Biometric authentication not enabled');
      return false;
    }

    try {
      const credentialId = this.getStoredCredentialId();
      if (!credentialId) {
        console.warn('BiometricService: No credential found');
        return false;
      }

      const challenge = this.generateChallenge();

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions =
        {
          challenge,
          allowCredentials: [
            {
              id: this.base64ToBuffer(credentialId),
              type: 'public-key',
            },
          ],
          timeout: 60000,
          userVerification: 'required',
        };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      });

      return assertion !== null;
    } catch (error) {
      this.logger.error('BiometricService', 'Authentication failed', error);
      return false;
    }
  }

  /**
   * Enable biometric authentication
   * User must register first if not already registered
   */
  async enable(userId: string, userName: string): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    const credentialId = this.getStoredCredentialId();
    if (credentialId) {
      this.savePreference(true);
      return true;
    }

    return await this.register(userId, userName);
  }

  /**
   * Disable biometric authentication
   */
  disable(): void {
    this.savePreference(false);
  }

  /**
   * Clear stored credentials and preferences
   */
  clearCredentials(): void {
    try {
      localStorage.removeItem(this.CREDENTIAL_KEY);
      localStorage.removeItem(this.STORAGE_KEY);
      this.isEnabled.set(false);
    } catch (error) {
      console.warn('BiometricService: Failed to clear credentials', error);
    }
  }

  /**
   * Generate a random challenge for WebAuthn
   */
  private generateChallenge(): ArrayBuffer {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    return challenge.buffer as ArrayBuffer;
  }

  /**
   * Save credential ID to localStorage
   */
  private saveCredential(credentialId: string): void {
    try {
      localStorage.setItem(this.CREDENTIAL_KEY, credentialId);
    } catch (error) {
      console.warn('BiometricService: Failed to save credential', error);
    }
  }

  /**
   * Get stored credential ID from localStorage
   */
  private getStoredCredentialId(): string | null {
    try {
      return localStorage.getItem(this.CREDENTIAL_KEY);
    } catch (error) {
      console.warn('BiometricService: Failed to get credential', error);
      return null;
    }
  }

  /**
   * Convert base64 string to ArrayBuffer
   */
  private base64ToBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
