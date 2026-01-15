import { Injectable, inject } from '@angular/core';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  Auth,
  PhoneAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';
import { AuthStore, User } from '../stores/auth.store';

interface FirebaseAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface FirebaseStatusResponse {
  enabled: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class FirebaseAuthService {
  private readonly api = inject(ApiService);
  private readonly authStore = inject(AuthStore);

  private app: FirebaseApp | null = null;
  private auth: Auth | null = null;
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private confirmationResult: ConfirmationResult | null = null;
  private isFirebaseEnabled = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize Firebase and check if it's enabled on the backend
   */
  async initialize(): Promise<boolean> {
    if (this.initPromise) {
      await this.initPromise;
      return this.isFirebaseEnabled;
    }

    this.initPromise = this.doInitialize();
    await this.initPromise;
    return this.isFirebaseEnabled;
  }

  private async doInitialize(): Promise<void> {
    try {
      // Check backend Firebase status first
      const status = await firstValueFrom(
        this.api.get<FirebaseStatusResponse>('/auth/firebase/status')
      );

      this.isFirebaseEnabled = status.enabled;

      if (!status.enabled) {
        return;
      }

      // Initialize Firebase app if not already done
      if (getApps().length === 0) {
        this.app = initializeApp(environment.firebase);
      } else {
        this.app = getApps()[0];
      }

      this.auth = getAuth(this.app);
    } catch {
      this.isFirebaseEnabled = false;
    }
  }

  /**
   * Check if Firebase Phone Auth is available
   */
  isAvailable(): boolean {
    return this.isFirebaseEnabled && this.auth !== null;
  }

  /**
   * Setup invisible reCAPTCHA verifier
   */
  setupRecaptcha(buttonId: string): void {
    if (!this.auth) {
      throw new Error('Firebase not initialized');
    }

    // Clear existing verifier
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
    }

    this.recaptchaVerifier = new RecaptchaVerifier(this.auth, buttonId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved - allow signInWithPhoneNumber
      },
      'expired-callback': () => {
        this.recaptchaVerifier?.clear();
        this.recaptchaVerifier = null;
      },
    });
  }

  /**
   * Send OTP via Firebase Phone Auth
   */
  async sendOtp(phoneNumber: string): Promise<void> {
    if (!this.auth || !this.recaptchaVerifier) {
      throw new Error('Firebase not properly initialized');
    }

    // Format phone number for Firebase (E.164 format)
    const formattedPhone = this.formatPhoneNumber(phoneNumber);

    this.confirmationResult = await signInWithPhoneNumber(
      this.auth,
      formattedPhone,
      this.recaptchaVerifier
    );
  }

  /**
   * Verify OTP and authenticate with backend
   */
  async verifyOtp(code: string, displayName?: string): Promise<void> {
    if (!this.confirmationResult) {
      throw new Error('No pending verification');
    }

    // Verify OTP with Firebase
    const credential = await this.confirmationResult.confirm(code);

    // Get the ID token
    const idToken = await credential.user.getIdToken();

    // Send to backend for authentication
    const response = await firstValueFrom(
      this.api.post<FirebaseAuthResponse>('/auth/firebase', {
        idToken,
        displayName,
      })
    );

    // Store tokens BEFORE calling /users/me
    this.authStore.setToken(response.accessToken);
    if (response.refreshToken) {
      await this.authStore.setRefreshToken(response.refreshToken);
    }

    // Get user info
    const user = await firstValueFrom(
      this.api.get<User>('/users/me')
    );

    this.authStore.loginSuccess(user, response.accessToken);
  }

  /**
   * Format phone number to E.164 format for Ivory Coast
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let digits = phone.replace(/\D/g, '');

    // If starts with 0, remove it and add country code
    if (digits.startsWith('0')) {
      digits = digits.substring(1);
    }

    // If doesn't have country code, add Ivory Coast code
    if (!digits.startsWith('225')) {
      digits = '225' + digits;
    }

    return '+' + digits;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = null;
    }
    this.confirmationResult = null;
  }

  /**
   * Sign out from Firebase
   */
  async signOut(): Promise<void> {
    if (this.auth) {
      await this.auth.signOut();
    }
    this.cleanup();
  }
}
