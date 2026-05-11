import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthStore, User } from '../../../core/stores/auth.store';
import { FirebaseAuthService } from '../../../core/services/firebase-auth.service';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface RegisterResponse {
  user: User;
  message: string;
  devCode?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly authStore = inject(AuthStore);
  private readonly firebaseAuth = inject(FirebaseAuthService);

  private firebaseInitialized = false;
  private useFirebase = false;

  /**
   * Initialize and check if Firebase is available
   */
  async initializeFirebase(): Promise<boolean> {
    if (this.firebaseInitialized) {
      return this.useFirebase;
    }

    this.useFirebase = await this.firebaseAuth.initialize();
    this.firebaseInitialized = true;
    return this.useFirebase;
  }

  /**
   * Check if Firebase Phone Auth is being used
   */
  isUsingFirebase(): boolean {
    return this.useFirebase && this.firebaseAuth.isAvailable();
  }

  /**
   * Setup reCAPTCHA for Firebase (call before sendOtp when using Firebase)
   */
  setupRecaptcha(buttonId: string): void {
    if (this.isUsingFirebase()) {
      this.firebaseAuth.setupRecaptcha(buttonId);
    }
  }

  async login(phone: string, password: string): Promise<void> {
    const response = await firstValueFrom(
      this.api.post<LoginResponse>('/auth/login', { phone, password })
    );

    // Store tokens BEFORE calling /users/me
    this.authStore.setToken(response.accessToken);
    if (response.refreshToken) {
      await this.authStore.setRefreshToken(response.refreshToken);
    }

    // Get user info (now with valid token in interceptor)
    const user = await firstValueFrom(
      this.api.get<User>('/users/me')
    );

    this.authStore.loginSuccess(user, response.accessToken);
  }

  async register(data: {
    phone: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  }): Promise<RegisterResponse> {
    return firstValueFrom(
      this.api.post<RegisterResponse>('/auth/register', data)
    );
  }

  /**
   * Send OTP - uses Firebase if available, otherwise falls back to backend SMS
   */
  async sendOtp(phone: string): Promise<{ devCode?: string; useFirebase?: boolean }> {
    await this.initializeFirebase();

    if (this.isUsingFirebase()) {
      try {
        await this.firebaseAuth.sendOtp(phone);
        return { useFirebase: true };
      } catch {
        // Fall through to backend OTP
      }
    }

    // Fallback to backend OTP
    const response = await firstValueFrom(
      this.api.post<{ message: string; devCode?: string }>('/auth/send-otp', { phone })
    );
    return { devCode: response.devCode, useFirebase: false };
  }

  /**
   * Verify OTP - uses Firebase or backend based on how OTP was sent
   */
  async verifyOtp(phone: string, code: string, displayName?: string): Promise<void> {
    if (this.isUsingFirebase() && this.firebaseAuth.isAvailable()) {
      try {
        await this.firebaseAuth.verifyOtp(code, displayName);
        return;
      } catch {
        // Try backend verification as fallback
      }
    }

    // Backend OTP verification
    const response = await firstValueFrom(
      this.api.post<LoginResponse>('/auth/verify-otp', { phone, code })
    );

    // Store tokens BEFORE calling /users/me
    this.authStore.setToken(response.accessToken);
    if (response.refreshToken) {
      await this.authStore.setRefreshToken(response.refreshToken);
    }

    // Get user info (now with valid token in interceptor)
    const user = await firstValueFrom(
      this.api.get<User>('/users/me')
    );

    this.authStore.loginSuccess(user, response.accessToken);
  }

  async logout(): Promise<void> {
    try {
      // Sign out from Firebase if using it
      if (this.isUsingFirebase()) {
        await this.firebaseAuth.signOut();
      }
      await firstValueFrom(this.api.post('/auth/logout', {}));
    } finally {
      this.authStore.logout();
    }
  }

  // Password reset (email-link based)
  /**
   * Demande un email de réinitialisation. Accepte téléphone OU email.
   * En dev, le backend renvoie `devToken` pour faciliter les tests.
   */
  async requestPasswordReset(identifier: string): Promise<{ message: string; devToken?: string }> {
    return firstValueFrom(
      this.api.post<{ message: string; devToken?: string }>('/auth/forgot-password', {
        identifier,
      }),
    );
  }

  /**
   * Applique le nouveau mot de passe avec le token reçu par email.
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return firstValueFrom(
      this.api.post<{ message: string }>('/auth/reset-password', { token, newPassword }),
    );
  }

  // Email verification
  async sendVerificationEmail(): Promise<{ message: string; devToken?: string }> {
    return firstValueFrom(
      this.api.post<{ message: string; devToken?: string }>('/auth/send-verification-email', {}),
    );
  }

  async verifyEmail(token: string): Promise<{ message: string; email: string }> {
    return firstValueFrom(
      this.api.post<{ message: string; email: string }>('/auth/verify-email', { token }),
    );
  }

  // Refresh token
  async refreshToken(): Promise<void> {
    const refreshToken = await this.authStore.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    const response = await firstValueFrom(
      this.api.post<LoginResponse>('/auth/refresh', { refreshToken })
    );

    this.authStore.setToken(response.accessToken);
    if (response.refreshToken) {
      await this.authStore.setRefreshToken(response.refreshToken);
    }
  }

  /**
   * Cleanup Firebase resources
   */
  cleanup(): void {
    this.firebaseAuth.cleanup();
  }
}
