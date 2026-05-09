import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { SecureStorageService, StorageKeys } from '../services/secure-storage.service';
import { LoggerService } from '../services/logger.service';

export interface RepairerProfile {
  id: string;
  // Business info
  businessName?: string;
  businessType?: string;
  rccmNumber?: string;
  taxId?: string;
  businessPhone?: string;
  businessEmail?: string;
  yearsOfExperience?: string;
  description?: string;
  // Identity (read-only after verification)
  dateOfBirth?: string;
  idDocumentType?: string;
  nationalIdNumber?: string;
  // Location
  city?: string;
  commune?: string;
  quarter?: string;
  address?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  // Stats
  rating: number;
  reviewCount: number;
  // Availability
  isAvailable: boolean;
  acceptsHomeService?: boolean;
  homeServiceRadiusKm?: number;
  // Services
  specialties?: string[];
  // Photos
  shopPhotos?: string[];
}

export interface User {
  id: string;
  phone: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: 'client' | 'repairer' | 'admin';
  avatarUrl?: string;
  repairerProfile?: RepairerProfile;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly storage = inject(SecureStorageService);
  private readonly logger = inject(LoggerService);

  private readonly _state = signal<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  // Selectors
  readonly user = computed(() => this._state().user);
  readonly token = computed(() => this._state().token);
  readonly isAuthenticated = computed(() => this._state().isAuthenticated);
  readonly isLoading = computed(() => this._state().isLoading);
  readonly error = computed(() => this._state().error);
  readonly userRole = computed(() => this._state().user?.role ?? null);
  readonly isClient = computed(() => this._state().user?.role === 'client');
  readonly isRepairer = computed(() => this._state().user?.role === 'repairer');
  readonly isAdmin = computed(() => this._state().user?.role === 'admin');

  /**
   * Get the default redirect URL based on user role
   * - admin → /admin
   * - repairer → /repairer/requests (dashboard réparateur)
   * - client → /home
   */
  getDefaultRedirectUrl(): string {
    const role = this._state().user?.role;
    switch (role) {
      case 'admin':
        return '/admin';
      case 'repairer':
        return '/repairer/requests';
      case 'client':
      default:
        return '/home';
    }
  }

  private hydratePromise: Promise<void> | null = null;

  constructor() {
    // Persist to secure storage on changes (after the initial hydration to avoid clearing it on boot)
    effect(() => {
      const state = this._state();
      if (!this.hydrated) return; // skip writes until hydrated
      if (state.token && state.user) {
        this.storage.set(StorageKeys.AUTH, {
          token: state.token,
          user: state.user,
        }).catch(err => this.logger.error('AuthStore', 'Failed to save auth state', err));
      } else {
        this.storage.remove(StorageKeys.AUTH);
        this.storage.remove(StorageKeys.REFRESH_TOKEN);
      }
    });
  }

  private hydrated = false;

  /**
   * Hydrates the store from secure storage. Call this from APP_INITIALIZER so
   * route guards see the correct authenticated state on the very first navigation.
   */
  hydrate(): Promise<void> {
    if (!this.hydratePromise) {
      this.hydratePromise = this.loadFromStorage().finally(() => { this.hydrated = true; });
    }
    return this.hydratePromise;
  }

  setLoading(isLoading: boolean): void {
    this._state.update((s) => ({ ...s, isLoading, error: null }));
  }

  loginSuccess(user: User, token: string): void {
    this._state.set({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
  }

  loginFailure(error: string): void {
    this._state.update((s) => ({
      ...s,
      isLoading: false,
      error,
      isAuthenticated: false,
    }));
  }

  logout(): void {
    this._state.set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }

  updateUser(user: Partial<User>): void {
    this._state.update((s) => ({
      ...s,
      user: s.user ? { ...s.user, ...user } : null,
    }));
  }

  setToken(token: string): void {
    this._state.update((s) => ({ ...s, token }));
  }

  async setRefreshToken(refreshToken: string): Promise<void> {
    await this.storage.set(StorageKeys.REFRESH_TOKEN, refreshToken);
  }

  async getRefreshToken(): Promise<string | null> {
    return await this.storage.get<string>(StorageKeys.REFRESH_TOKEN);
  }

  clearError(): void {
    this._state.update((s) => ({ ...s, error: null }));
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const stored = await this.storage.get<{ token: string; user: User }>(StorageKeys.AUTH);
      if (stored?.token && stored?.user) {
        this._state.set({
          user: stored.user,
          token: stored.token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      }
    } catch {
      this.storage.remove(StorageKeys.AUTH);
    }
  }
}
