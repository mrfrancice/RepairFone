import { Injectable } from '@angular/core';

/**
 * ThemeService - Service minimal pour la gestion du thème
 * L'application utilise uniquement le mode clair
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = false;
  readonly effectiveTheme = 'light' as const;
}
