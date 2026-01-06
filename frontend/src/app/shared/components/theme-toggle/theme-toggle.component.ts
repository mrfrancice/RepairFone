import { Component, ChangeDetectionStrategy, inject, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, Theme } from '../../../core/services/theme.service';

/**
 * ThemeToggleComponent - Toggle button with sun/moon icons and dropdown
 * Allows users to switch between light, dark, and system theme modes
 */
@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="theme-toggle-container">
      <!-- Main toggle button -->
      <button
        type="button"
        class="theme-toggle-btn"
        [attr.aria-label]="'Current theme: ' + themeService.theme() + '. Click to toggle or expand menu.'"
        [attr.aria-expanded]="isDropdownOpen()"
        (click)="handleButtonClick($event)"
      >
        <span class="theme-icon">
          @if (themeService.effectiveTheme() === 'dark') {
            <!-- Moon icon -->
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          } @else {
            <!-- Sun icon -->
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          }
        </span>
        <!-- Dropdown arrow -->
        <span class="dropdown-arrow" [class.open]="isDropdownOpen()">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </button>

      <!-- Dropdown menu -->
      @if (isDropdownOpen()) {
        <div class="theme-dropdown" role="menu">
          <button
            type="button"
            class="theme-option"
            [class.active]="themeService.theme() === 'light'"
            role="menuitem"
            (click)="selectTheme('light')"
          >
            <span class="option-icon">
              <!-- Sun icon -->
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            </span>
            <span class="option-label">Light</span>
            @if (themeService.theme() === 'light') {
              <span class="check-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </span>
            }
          </button>

          <button
            type="button"
            class="theme-option"
            [class.active]="themeService.theme() === 'dark'"
            role="menuitem"
            (click)="selectTheme('dark')"
          >
            <span class="option-icon">
              <!-- Moon icon -->
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            </span>
            <span class="option-label">Dark</span>
            @if (themeService.theme() === 'dark') {
              <span class="check-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </span>
            }
          </button>

          <button
            type="button"
            class="theme-option"
            [class.active]="themeService.theme() === 'system'"
            role="menuitem"
            (click)="selectTheme('system')"
          >
            <span class="option-icon">
              <!-- Monitor icon -->
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            </span>
            <span class="option-label">System</span>
            @if (themeService.theme() === 'system') {
              <span class="check-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </span>
            }
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
      position: relative;
    }

    .theme-toggle-container {
      position: relative;
    }

    .theme-toggle-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.5rem 0.75rem;
      background: transparent;
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
      color: var(--text-color, #374151);
    }

    :host-context(.dark) .theme-toggle-btn {
      --border-color: #4b5563;
      --text-color: #e5e7eb;
    }

    .theme-toggle-btn:hover {
      background: var(--hover-bg, #f3f4f6);
    }

    :host-context(.dark) .theme-toggle-btn:hover {
      --hover-bg: #374151;
    }

    .theme-toggle-btn:focus {
      outline: 2px solid #E67700;
      outline-offset: 2px;
    }

    .theme-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .dropdown-arrow {
      display: flex;
      align-items: center;
      transition: transform 0.2s ease;
    }

    .dropdown-arrow.open {
      transform: rotate(180deg);
    }

    .theme-dropdown {
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0;
      min-width: 140px;
      background: var(--dropdown-bg, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 0.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      z-index: 1060;
      overflow: hidden;
      animation: dropdownFadeIn 0.15s ease-out;
    }

    :host-context(.dark) .theme-dropdown {
      --dropdown-bg: #1f2937;
      --border-color: #4b5563;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    @keyframes dropdownFadeIn {
      from {
        opacity: 0;
        transform: translateY(-0.5rem);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .theme-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.75rem 1rem;
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--text-color, #374151);
      font-size: 0.875rem;
      text-align: left;
      transition: background 0.15s ease;
    }

    :host-context(.dark) .theme-option {
      --text-color: #e5e7eb;
    }

    .theme-option:hover {
      background: var(--hover-bg, #f3f4f6);
    }

    :host-context(.dark) .theme-option:hover {
      --hover-bg: #374151;
    }

    .theme-option.active {
      color: #E67700;
    }

    .theme-option:focus {
      outline: none;
      background: var(--hover-bg, #f3f4f6);
    }

    :host-context(.dark) .theme-option:focus {
      --hover-bg: #374151;
    }

    .option-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.7;
    }

    .theme-option.active .option-icon {
      opacity: 1;
    }

    .option-label {
      flex: 1;
    }

    .check-icon {
      display: flex;
      align-items: center;
      color: #E67700;
    }
  `]
})
export class ThemeToggleComponent {
  readonly themeService = inject(ThemeService);
  readonly isDropdownOpen = signal(false);

  /**
   * Handle click outside to close dropdown
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('app-theme-toggle')) {
      this.isDropdownOpen.set(false);
    }
  }

  /**
   * Handle escape key to close dropdown
   */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.isDropdownOpen.set(false);
  }

  /**
   * Handle main button click - toggle dropdown
   */
  handleButtonClick(event: MouseEvent): void {
    event.stopPropagation();
    this.isDropdownOpen.update(open => !open);
  }

  /**
   * Select a theme from dropdown
   */
  selectTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
    this.isDropdownOpen.set(false);
  }
}
