import { Component, Input, Output, EventEmitter, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/stores/auth.store';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';

@Component({
  selector: 'ui-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, NotificationBellComponent],
  template: `
    <header class="header">
      <div class="header-top">
        <div class="header-left">
          @if (showBack) {
            @if (backRoute) {
              <a [routerLink]="backRoute" class="back-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </a>
            } @else {
              <button class="back-btn" (click)="goBack()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            }
          }
          @if (showIcon) {
            <div class="header-icon">
              <ng-content select="[header-icon]"></ng-content>
            </div>
          }
          <div class="header-titles">
            <h1 class="app-title">{{ title }}</h1>
            @if (subtitle) {
              <p class="welcome-msg">{{ subtitle }}</p>
            }
          </div>
        </div>
        <div class="header-right">
          <ng-content select="[header-actions]"></ng-content>

          @if (showProfile) {
            @if (authStore.isAuthenticated()) {
              <app-notification-bell />
              <button class="profile-btn" (click)="goToProfile()">
                @if (authStore.user()?.avatarUrl) {
                  <img [src]="authStore.user()?.avatarUrl" alt="Profil" />
                } @else {
                  <div class="profile-placeholder">
                    {{ userInitials() }}
                  </div>
                }
              </button>
            } @else {
              <button class="login-btn" (click)="goToLogin()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Connexion
              </button>
            }
          }
        </div>
      </div>
      <ng-content></ng-content>
    </header>
  `,
  styles: [`
    .header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      background: linear-gradient(135deg, #FF6B35 0%, #E85A24 100%);
      padding: 1.25rem 1.25rem 1.75rem;
      padding-top: calc(1.25rem + env(safe-area-inset-top, 0));
      border-radius: 0 0 24px 24px;
      box-shadow: 0 4px 20px rgba(255, 107, 53, 0.3);
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .back-btn {
      min-width: 44px;
      min-height: 44px;
      background: rgba(255, 255, 255, 0.15);
      border: none;
      color: white;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
    }

    .back-btn:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    .back-btn:focus-visible {
      outline: 2px solid white;
      outline-offset: 2px;
    }

    .header-icon {
      min-width: 44px;
      min-height: 44px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .header-titles {
      display: flex;
      flex-direction: column;
    }

    .app-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: white;
      margin: 0;
      line-height: 1.2;
    }

    .welcome-msg {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.9);
      margin: 0;
    }

    /* Profile Button */
    .profile-btn {
      min-width: 44px;
      min-height: 44px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.1);
      overflow: hidden;
      cursor: pointer;
      padding: 0;
      transition: all 0.2s;
    }

    .profile-btn:hover {
      border-color: rgba(255, 255, 255, 0.5);
      transform: scale(1.05);
    }

    .profile-btn:focus-visible {
      outline: 2px solid white;
      outline-offset: 2px;
    }

    .profile-btn img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .profile-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 0.875rem;
      background: rgba(255, 255, 255, 0.15);
    }

    /* Login Button */
    .login-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      padding: 0.5rem 0.875rem;
      min-height: 44px;
      background: rgba(255, 255, 255, 0.15);
      border: none;
      border-radius: 20px;
      color: white;
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .login-btn:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    .login-btn:focus-visible {
      outline: 2px solid white;
      outline-offset: 2px;
    }
  `]
})
export class UiHeaderComponent {
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  @Input() title = '';
  @Input() subtitle?: string;
  @Input() showBack = false;
  @Input() backRoute?: string;
  @Input() showIcon = false;
  @Input() showProfile = false;

  @Output() onBack = new EventEmitter<void>();

  readonly userInitials = computed(() => {
    const user = this.authStore.user();
    if (!user) return 'U';
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  });

  goBack(): void {
    if (this.onBack.observed) {
      this.onBack.emit();
    } else {
      this.location.back();
    }
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
