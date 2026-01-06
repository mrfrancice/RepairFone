import { Injectable, signal, computed, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark' | 'system';

/**
 * ThemeService - Manages application theme (light/dark/system)
 * Uses Angular signals for reactive theme state management
 * Persists user preference to localStorage
 * Listens to system preference changes via prefers-color-scheme
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'rf_theme';
  private readonly platformId = inject(PLATFORM_ID);
  private mediaQuery: MediaQueryList | null = null;

  /**
   * Current theme setting ('light', 'dark', or 'system')
   */
  readonly theme = signal<Theme>('system');

  /**
   * Whether the system prefers dark mode
   */
  readonly systemPrefersDark = signal<boolean>(false);

  /**
   * Computed: Whether dark mode is currently active
   * Takes into account both explicit theme choice and system preference
   */
  readonly isDark = computed(() => {
    const currentTheme = this.theme();
    if (currentTheme === 'system') {
      return this.systemPrefersDark();
    }
    return currentTheme === 'dark';
  });

  /**
   * Computed: The effective theme being applied ('light' or 'dark')
   */
  readonly effectiveTheme = computed<'light' | 'dark'>(() => {
    return this.isDark() ? 'dark' : 'light';
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeMediaQuery();
      this.loadTheme();
      this.setupThemeEffect();
    }
  }

  /**
   * Initialize system preference media query listener
   */
  private initializeMediaQuery(): void {
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.systemPrefersDark.set(this.mediaQuery.matches);

    // Listen for system preference changes
    this.mediaQuery.addEventListener('change', this.handleSystemThemeChange.bind(this));
  }

  /**
   * Handle system theme preference changes
   */
  private handleSystemThemeChange(event: MediaQueryListEvent): void {
    this.systemPrefersDark.set(event.matches);
  }

  /**
   * Load theme from localStorage or default to 'system'
   */
  private loadTheme(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored && this.isValidTheme(stored)) {
        this.theme.set(stored as Theme);
      }
    } catch (error) {
      console.warn('ThemeService: Failed to load theme from storage', error);
    }
  }

  /**
   * Setup effect to apply theme to document and persist to storage
   */
  private setupThemeEffect(): void {
    effect(() => {
      const isDarkMode = this.isDark();
      this.applyThemeToDocument(isDarkMode);
    });

    effect(() => {
      const currentTheme = this.theme();
      this.persistTheme(currentTheme);
    });
  }

  /**
   * Apply dark class to document.documentElement
   */
  private applyThemeToDocument(isDark: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }

  /**
   * Persist theme preference to localStorage
   */
  private persistTheme(theme: Theme): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, theme);
    } catch (error) {
      console.warn('ThemeService: Failed to persist theme to storage', error);
    }
  }

  /**
   * Validate if a string is a valid theme value
   */
  private isValidTheme(value: string): value is Theme {
    return ['light', 'dark', 'system'].includes(value);
  }

  /**
   * Set the theme
   */
  setTheme(theme: Theme): void {
    this.theme.set(theme);
  }

  /**
   * Toggle between light and dark themes
   * If system mode, switch to opposite of current effective theme
   */
  toggleTheme(): void {
    const current = this.theme();
    if (current === 'system') {
      // Switch to explicit opposite of system preference
      this.theme.set(this.systemPrefersDark() ? 'light' : 'dark');
    } else if (current === 'light') {
      this.theme.set('dark');
    } else {
      this.theme.set('light');
    }
  }

  /**
   * Cycle through themes: light -> dark -> system -> light
   */
  cycleTheme(): void {
    const current = this.theme();
    const themes: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(current);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.theme.set(themes[nextIndex]);
  }

  /**
   * Cleanup on service destroy
   */
  ngOnDestroy(): void {
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.handleSystemThemeChange.bind(this));
    }
  }
}
