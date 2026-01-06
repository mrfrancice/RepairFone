import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  ChangeDetectionStrategy,
  inject,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-network-status',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showBanner()) {
      <div
        class="network-banner"
        [class.offline]="!isOnline()"
        [class.online]="isOnline() && showOnlineMessage()"
        role="alert"
        [attr.aria-live]="isOnline() ? 'polite' : 'assertive'"
      >
        <span class="network-icon">
          @if (isOnline()) {
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
              <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
              <line x1="12" y1="20" x2="12.01" y2="20"/>
            </svg>
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="1" y1="1" x2="23" y2="23"/>
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
              <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
              <path d="M10.71 5.05A16 16 0 0 1 22.58 9"/>
              <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
              <line x1="12" y1="20" x2="12.01" y2="20"/>
            </svg>
          }
        </span>
        <span class="network-message">
          {{ isOnline() ? 'Connexion retablie' : 'Vous etes hors ligne' }}
        </span>
      </div>
    }
  `,
  styles: [`
    .network-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      animation: slideDown 0.3s ease-out;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .network-banner.offline {
      background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);
      color: white;
    }

    .network-banner.online {
      background: linear-gradient(135deg, #22c55e 0%, #10b981 100%);
      color: white;
      animation: slideDown 0.3s ease-out, fadeOut 0.3s ease-in 2.7s forwards;
    }

    .network-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .network-icon svg {
      width: 20px;
      height: 20px;
    }

    .network-message {
      letter-spacing: 0.01em;
    }

    @keyframes slideDown {
      from {
        transform: translateY(-100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    @keyframes fadeOut {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }
  `]
})
export class NetworkStatusComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  isOnline = signal(true);
  showOnlineMessage = signal(false);

  private onlineHandler: (() => void) | null = null;
  private offlineHandler: (() => void) | null = null;
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;

  showBanner = computed(() => {
    return !this.isOnline() || this.showOnlineMessage();
  });

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isOnline.set(navigator.onLine);

      this.onlineHandler = () => this.handleOnline();
      this.offlineHandler = () => this.handleOffline();

      window.addEventListener('online', this.onlineHandler);
      window.addEventListener('offline', this.offlineHandler);
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      if (this.onlineHandler) {
        window.removeEventListener('online', this.onlineHandler);
      }
      if (this.offlineHandler) {
        window.removeEventListener('offline', this.offlineHandler);
      }
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
      }
    }
  }

  private handleOnline(): void {
    this.isOnline.set(true);
    this.showOnlineMessage.set(true);

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    this.hideTimeout = setTimeout(() => {
      this.showOnlineMessage.set(false);
    }, 3000);
  }

  private handleOffline(): void {
    this.isOnline.set(false);
    this.showOnlineMessage.set(false);

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }
}
