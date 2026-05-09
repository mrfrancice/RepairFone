import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { LoggerService } from './logger.service';
import { AuthStore } from '../stores/auth.store';

export type SpecialtyCategory = 'brand' | 'device_type' | 'repair_type';

export interface Specialty {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  category: SpecialtyCategory;
  sortOrder: number;
  isActive: boolean;
}

export interface ProblemCategory {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  color: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface BusinessType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  requiresRccm: boolean;
  requiresTaxId: boolean;
  sortOrder: number;
  isActive: boolean;
}

export interface ExperienceRange {
  id: string;
  code: string;
  label: string;
  minYears: number | null;
  maxYears: number | null;
  sortOrder: number;
  isActive: boolean;
}

export interface IdDocumentType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface BadgeType {
  id: string;
  code: string;
  label: string;
  icon: string | null;
  color: string | null;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface AppConfig {
  id: string;
  key: string;
  value: string;
  type: string;
  description: string | null;
  category: string;
  isActive: boolean;
}

export interface AllSettings {
  specialties: Specialty[];
  problemCategories: ProblemCategory[];
  businessTypes: BusinessType[];
  experienceRanges: ExperienceRange[];
  idDocumentTypes: IdDocumentType[];
  badgeTypes: BadgeType[];
  appConfigs: AppConfig[];
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly authStore = inject(AuthStore);

  // Cached settings
  private readonly _specialties = signal<Specialty[]>([]);
  private readonly _problemCategories = signal<ProblemCategory[]>([]);
  private readonly _businessTypes = signal<BusinessType[]>([]);
  private readonly _experienceRanges = signal<ExperienceRange[]>([]);
  private readonly _idDocumentTypes = signal<IdDocumentType[]>([]);
  private readonly _badgeTypes = signal<BadgeType[]>([]);
  private readonly _appConfigs = signal<AppConfig[]>([]);
  private readonly _isLoaded = signal(false);
  private readonly _isLoading = signal(false);

  // Public read-only signals
  readonly specialties = this._specialties.asReadonly();
  readonly problemCategories = this._problemCategories.asReadonly();
  readonly businessTypes = this._businessTypes.asReadonly();
  readonly experienceRanges = this._experienceRanges.asReadonly();
  readonly idDocumentTypes = this._idDocumentTypes.asReadonly();
  readonly badgeTypes = this._badgeTypes.asReadonly();
  readonly appConfigs = this._appConfigs.asReadonly();
  readonly isLoaded = this._isLoaded.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  async loadAllSettings(): Promise<AllSettings> {
    if (this._isLoaded() || this._isLoading()) {
      return this.getCurrentSettings();
    }

    this._isLoading.set(true);

    // Endpoint /settings protégé par JWT : pour un visiteur, on évite l'appel
    // et on charge directement le jeu de données statique de secours.
    if (!this.authStore.isAuthenticated()) {
      this.loadFallbackData();
      this._isLoading.set(false);
      return this.getCurrentSettings();
    }

    try {
      const settings = await firstValueFrom(
        this.api.get<AllSettings>('/settings')
      );

      this._specialties.set(settings.specialties);
      this._problemCategories.set(settings.problemCategories);
      this._businessTypes.set(settings.businessTypes);
      this._experienceRanges.set(settings.experienceRanges);
      this._idDocumentTypes.set(settings.idDocumentTypes);
      this._badgeTypes.set(settings.badgeTypes);
      this._appConfigs.set(settings.appConfigs);
      this._isLoaded.set(true);

      return settings;
    } catch (error) {
      this.logger.warn('SettingsService', 'Falling back to static settings', error);
      this.loadFallbackData();
      return this.getCurrentSettings();
    } finally {
      this._isLoading.set(false);
    }
  }

  private getCurrentSettings(): AllSettings {
    return {
      specialties: this._specialties(),
      problemCategories: this._problemCategories(),
      businessTypes: this._businessTypes(),
      experienceRanges: this._experienceRanges(),
      idDocumentTypes: this._idDocumentTypes(),
      badgeTypes: this._badgeTypes(),
      appConfigs: this._appConfigs(),
    };
  }

  // Fallback data in case API is not available
  private loadFallbackData(): void {
    this._specialties.set([
      { id: '1', code: 'iphone', name: 'iPhone', icon: '📱', category: 'brand', sortOrder: 1, isActive: true },
      { id: '2', code: 'samsung', name: 'Samsung', icon: '📱', category: 'brand', sortOrder: 2, isActive: true },
      { id: '3', code: 'huawei', name: 'Huawei', icon: '📱', category: 'brand', sortOrder: 3, isActive: true },
      { id: '4', code: 'xiaomi', name: 'Xiaomi', icon: '📱', category: 'brand', sortOrder: 4, isActive: true },
      { id: '5', code: 'oppo', name: 'Oppo', icon: '📱', category: 'brand', sortOrder: 5, isActive: true },
      { id: '6', code: 'tecno', name: 'Tecno', icon: '📱', category: 'brand', sortOrder: 6, isActive: true },
      { id: '7', code: 'infinix', name: 'Infinix', icon: '📱', category: 'brand', sortOrder: 7, isActive: true },
      { id: '8', code: 'nokia', name: 'Nokia', icon: '📱', category: 'brand', sortOrder: 8, isActive: true },
      { id: '9', code: 'tablets', name: 'Tablettes', icon: '📲', category: 'device_type', sortOrder: 10, isActive: true },
      { id: '10', code: 'ipad', name: 'iPad', icon: '📲', category: 'device_type', sortOrder: 11, isActive: true },
      { id: '11', code: 'macbook', name: 'MacBook', icon: '💻', category: 'device_type', sortOrder: 12, isActive: true },
      { id: '12', code: 'laptops', name: 'Ordinateurs portables', icon: '💻', category: 'device_type', sortOrder: 13, isActive: true },
      { id: '13', code: 'screen', name: 'Écrans', icon: '📱', category: 'repair_type', sortOrder: 20, isActive: true },
      { id: '14', code: 'battery', name: 'Batteries', icon: '🔋', category: 'repair_type', sortOrder: 21, isActive: true },
      { id: '15', code: 'charging', name: 'Connecteurs de charge', icon: '🔌', category: 'repair_type', sortOrder: 22, isActive: true },
      { id: '16', code: 'camera', name: 'Caméras', icon: '📷', category: 'repair_type', sortOrder: 23, isActive: true },
      { id: '17', code: 'motherboard', name: 'Cartes mères', icon: '🔧', category: 'repair_type', sortOrder: 24, isActive: true },
      { id: '18', code: 'unlock', name: 'Déblocage', icon: '🔓', category: 'repair_type', sortOrder: 25, isActive: true },
      { id: '19', code: 'data_recovery', name: 'Récupération de données', icon: '💾', category: 'repair_type', sortOrder: 26, isActive: true },
    ]);

    this._problemCategories.set([
      { id: '1', code: 'screen', name: 'Écran cassé', icon: '📱', color: 'rgba(239, 68, 68, 0.1)', sortOrder: 1, isActive: true },
      { id: '2', code: 'battery', name: 'Batterie', icon: '🔋', color: 'rgba(34, 197, 94, 0.1)', sortOrder: 2, isActive: true },
      { id: '3', code: 'water', name: 'Oxydation', icon: '💧', color: 'rgba(147, 51, 234, 0.1)', sortOrder: 3, isActive: true },
      { id: '4', code: 'charging', name: 'Connecteur', icon: '🔌', color: 'rgba(59, 130, 246, 0.1)', sortOrder: 4, isActive: true },
      { id: '5', code: 'camera', name: 'Caméra', icon: '📷', color: 'rgba(245, 158, 11, 0.1)', sortOrder: 5, isActive: true },
      { id: '6', code: 'sound', name: 'Son', icon: '🔊', color: 'rgba(16, 185, 129, 0.1)', sortOrder: 6, isActive: true },
      { id: '7', code: 'power', name: 'Charge', icon: '⚡', color: 'rgba(234, 179, 8, 0.1)', sortOrder: 7, isActive: true },
      { id: '8', code: 'other', name: 'Autre', icon: '❓', color: 'rgba(107, 114, 128, 0.1)', sortOrder: 8, isActive: true },
    ]);

    this._businessTypes.set([
      { id: '1', code: 'individual', name: 'Particulier / Artisan', description: null, requiresRccm: false, requiresTaxId: false, sortOrder: 1, isActive: true },
      { id: '2', code: 'auto_entrepreneur', name: 'Auto-entrepreneur', description: null, requiresRccm: true, requiresTaxId: true, sortOrder: 2, isActive: true },
      { id: '3', code: 'company', name: 'Entreprise (SARL, SA...)', description: null, requiresRccm: true, requiresTaxId: true, sortOrder: 3, isActive: true },
    ]);

    this._experienceRanges.set([
      { id: '1', code: '0-1', label: "Moins d'1 an", minYears: 0, maxYears: 1, sortOrder: 1, isActive: true },
      { id: '2', code: '1-3', label: '1 à 3 ans', minYears: 1, maxYears: 3, sortOrder: 2, isActive: true },
      { id: '3', code: '3-5', label: '3 à 5 ans', minYears: 3, maxYears: 5, sortOrder: 3, isActive: true },
      { id: '4', code: '5-10', label: '5 à 10 ans', minYears: 5, maxYears: 10, sortOrder: 4, isActive: true },
      { id: '5', code: '10+', label: 'Plus de 10 ans', minYears: 10, maxYears: null, sortOrder: 5, isActive: true },
    ]);

    this._idDocumentTypes.set([
      { id: '1', code: 'cni', name: "Carte Nationale d'Identité", description: null, sortOrder: 1, isActive: true },
      { id: '2', code: 'passport', name: 'Passeport', description: null, sortOrder: 2, isActive: true },
      { id: '3', code: 'driver_license', name: 'Permis de conduire', description: null, sortOrder: 3, isActive: true },
    ]);

    this._badgeTypes.set([
      { id: '1', code: 'verified', label: 'Vérifié', icon: '✓', color: '#4CAF50', description: null, sortOrder: 1, isActive: true },
      { id: '2', code: 'fast_response', label: 'Réponse rapide', icon: '⚡', color: '#FFC107', description: null, sortOrder: 2, isActive: true },
      { id: '3', code: 'top_rated', label: 'Top noté', icon: '⭐', color: '#eab308', description: null, sortOrder: 3, isActive: true },
      { id: '4', code: 'expert', label: 'Expert', icon: '🏆', color: '#FF9800', description: null, sortOrder: 4, isActive: true },
    ]);

    this._isLoaded.set(true);
  }

  // Helper methods
  getSpecialtyNames(): string[] {
    return this._specialties().map(s => s.name);
  }

  getSpecialtiesByCategory(category: SpecialtyCategory): Specialty[] {
    return this._specialties().filter(s => s.category === category);
  }

  getAppConfigValue(key: string): string | null {
    const config = this._appConfigs().find(c => c.key === key);
    return config?.value || null;
  }

  getAppConfigNumber(key: string, defaultValue = 0): number {
    const value = this.getAppConfigValue(key);
    return value ? parseFloat(value) : defaultValue;
  }

  // For backward compatibility
  getDeviceSpecialties(): string[] {
    return this._specialties().map(s => s.name);
  }

  getAvailableSpecialties(): { id: string; label: string; icon: string }[] {
    return this._specialties()
      .filter(s => s.category === 'repair_type')
      .map(s => ({
        id: s.code,
        label: s.name,
        icon: s.icon || '🔧',
      }));
  }

  getProblemCategoriesForHome(): { id: string; icon: string; name: string }[] {
    return this._problemCategories().map(c => ({
      id: c.id,
      icon: c.icon || '❓',
      name: c.name,
    }));
  }

  getQuickFilters(): { id: string; icon: string; label: string; color: string }[] {
    return this._problemCategories().slice(0, 5).map(c => ({
      id: c.code,
      icon: c.icon || '❓',
      label: c.name,
      color: c.color || 'rgba(107, 114, 128, 0.1)',
    }));
  }
}
