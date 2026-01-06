import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type HapticIntensity = 'light' | 'medium' | 'heavy';

export interface HapticPattern {
  vibrate: number;
  pause?: number;
}

/**
 * HapticService - Provides haptic feedback using the Vibration API
 * Offers light, medium, and heavy haptic feedback patterns
 * Falls back gracefully on browsers that don't support vibration
 * Respects user preferences and system settings
 */
@Injectable({ providedIn: 'root' })
export class HapticService {
  private readonly STORAGE_KEY = 'rf_haptic_enabled';
  private readonly platformId = inject(PLATFORM_ID);

  /**
   * Haptic patterns in milliseconds for different intensities
   */
  private readonly patterns: Record<HapticIntensity, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: [30, 10, 30],
  };

  /**
   * Whether haptic feedback is enabled by the user
   */
  readonly isEnabled = signal<boolean>(true);

  /**
   * Whether the browser supports the Vibration API
   */
  readonly isSupported = signal<boolean>(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkSupport();
      this.loadPreference();
    }
  }

  /**
   * Check if the Vibration API is supported
   */
  private checkSupport(): void {
    const supported =
      typeof window !== 'undefined' &&
      'vibrate' in navigator &&
      typeof navigator.vibrate === 'function';

    this.isSupported.set(supported);
  }

  /**
   * Load user preference from localStorage
   */
  private loadPreference(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored !== null) {
        this.isEnabled.set(stored === 'true');
      }
    } catch (error) {
      console.warn('HapticService: Failed to load preference', error);
    }
  }

  /**
   * Save user preference to localStorage
   */
  private savePreference(enabled: boolean): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, enabled.toString());
      this.isEnabled.set(enabled);
    } catch (error) {
      console.warn('HapticService: Failed to save preference', error);
    }
  }

  /**
   * Trigger vibration with the given pattern
   */
  private vibrate(pattern: number | number[]): boolean {
    if (
      !isPlatformBrowser(this.platformId) ||
      !this.isSupported() ||
      !this.isEnabled()
    ) {
      return false;
    }

    try {
      return navigator.vibrate(pattern);
    } catch (error) {
      console.warn('HapticService: Vibration failed', error);
      return false;
    }
  }

  /**
   * Trigger light haptic feedback (10ms)
   * Use for subtle interactions like button taps, toggle switches
   */
  light(): boolean {
    return this.vibrate(this.patterns.light);
  }

  /**
   * Trigger medium haptic feedback (20ms)
   * Use for confirmations, selections, scroll boundaries
   */
  medium(): boolean {
    return this.vibrate(this.patterns.medium);
  }

  /**
   * Trigger heavy haptic feedback (30ms-10ms-30ms pattern)
   * Use for important actions, errors, success notifications
   */
  heavy(): boolean {
    return this.vibrate(this.patterns.heavy);
  }

  /**
   * Trigger haptic feedback with custom pattern
   * Pattern can be a single duration or an array of vibrate/pause durations
   */
  custom(pattern: number | number[]): boolean {
    return this.vibrate(pattern);
  }

  /**
   * Trigger haptic feedback with a specific intensity
   */
  impact(intensity: HapticIntensity = 'medium'): boolean {
    return this.vibrate(this.patterns[intensity]);
  }

  /**
   * Trigger a notification haptic pattern
   * Three quick pulses for notifications and alerts
   */
  notification(): boolean {
    return this.vibrate([10, 50, 10, 50, 10]);
  }

  /**
   * Trigger a success haptic pattern
   * Two quick pulses for successful operations
   */
  success(): boolean {
    return this.vibrate([10, 50, 15]);
  }

  /**
   * Trigger an error haptic pattern
   * Three strong pulses for errors and warnings
   */
  error(): boolean {
    return this.vibrate([30, 50, 30, 50, 30]);
  }

  /**
   * Trigger a warning haptic pattern
   * Two medium pulses for warnings
   */
  warning(): boolean {
    return this.vibrate([20, 50, 20]);
  }

  /**
   * Cancel any ongoing vibration
   */
  cancel(): boolean {
    if (!isPlatformBrowser(this.platformId) || !this.isSupported()) {
      return false;
    }

    try {
      return navigator.vibrate(0);
    } catch (error) {
      console.warn('HapticService: Cancel vibration failed', error);
      return false;
    }
  }

  /**
   * Enable haptic feedback
   */
  enable(): void {
    this.savePreference(true);
  }

  /**
   * Disable haptic feedback
   */
  disable(): void {
    this.savePreference(false);
    this.cancel();
  }

  /**
   * Toggle haptic feedback on/off
   */
  toggle(): void {
    const newState = !this.isEnabled();
    this.savePreference(newState);

    if (!newState) {
      this.cancel();
    }
  }
}
