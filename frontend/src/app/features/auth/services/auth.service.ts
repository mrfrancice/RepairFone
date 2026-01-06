import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthStore, User } from '../../../core/stores/auth.store';

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

  async login(phone: string, password: string): Promise<void> {
    const response = await firstValueFrom(
      this.api.post<LoginResponse>('/auth/login', { phone, password })
    );

    // Store tokens BEFORE calling /users/me
    this.authStore.setToken(response.accessToken);
    if (response.refreshToken) {
      this.authStore.setRefreshToken(response.refreshToken);
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

  async sendOtp(phone: string): Promise<{ devCode?: string }> {
    return firstValueFrom(
      this.api.post<{ message: string; devCode?: string }>('/auth/send-otp', { phone })
    );
  }

  async verifyOtp(phone: string, code: string): Promise<void> {
    const response = await firstValueFrom(
      this.api.post<LoginResponse>('/auth/verify-otp', { phone, code })
    );

    // Store tokens BEFORE calling /users/me
    this.authStore.setToken(response.accessToken);
    if (response.refreshToken) {
      this.authStore.setRefreshToken(response.refreshToken);
    }

    // Get user info (now with valid token in interceptor)
    const user = await firstValueFrom(
      this.api.get<User>('/users/me')
    );

    this.authStore.loginSuccess(user, response.accessToken);
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.api.post('/auth/logout', {}));
    } finally {
      this.authStore.logout();
    }
  }

  // Password reset methods
  async requestPasswordReset(phone: string): Promise<void> {
    await firstValueFrom(
      this.api.post('/auth/forgot-password', { phone })
    );
  }

  async verifyResetOtp(phone: string, code: string): Promise<{ token: string }> {
    return firstValueFrom(
      this.api.post<{ token: string }>('/auth/verify-reset-otp', { phone, code })
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await firstValueFrom(
      this.api.post('/auth/reset-password', { token, newPassword })
    );
  }

  // Refresh token
  async refreshToken(): Promise<void> {
    const refreshToken = this.authStore.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    const response = await firstValueFrom(
      this.api.post<LoginResponse>('/auth/refresh', { refreshToken })
    );

    this.authStore.setToken(response.accessToken);
    if (response.refreshToken) {
      this.authStore.setRefreshToken(response.refreshToken);
    }
  }
}
