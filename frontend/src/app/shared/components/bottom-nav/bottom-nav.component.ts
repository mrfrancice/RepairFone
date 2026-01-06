import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../../core/stores/auth.store';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="bottom-nav">
      @if (!authStore.isAdmin()) {
        <a routerLink="/search" routerLinkActive="active" class="nav-item nav-cta">
          <span class="nav-icon-wrapper cta-search">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </span>
          <span class="nav-label">Recherche</span>
        </a>

        <a routerLink="/requests" routerLinkActive="active" class="nav-item nav-cta">
          <span class="nav-icon-wrapper cta-demande">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </span>
          <span class="nav-label">Demandes</span>
        </a>
      }

      @if (authStore.isAuthenticated()) {
        <a routerLink="/profile" routerLinkActive="active" class="nav-item">
          <span class="nav-icon-wrapper">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </span>
          <span class="nav-label">Profil</span>
        </a>
      } @else {
        <a routerLink="/auth/login" routerLinkActive="active" class="nav-item">
          <span class="nav-icon-wrapper">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </span>
          <span class="nav-label">Connexion</span>
        </a>
      }
    </nav>
  `,
  styles: [`
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 72px;
      background: white;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-around;
      align-items: center;
      padding-bottom: env(safe-area-inset-bottom, 0);
      z-index: 1000;
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      text-decoration: none;
      color: #9ca3af;
      font-size: 0.7rem;
      padding: 0.5rem 1rem;
      transition: all 0.3s ease;
    }

    .nav-item:hover {
      transform: translateY(-2px);
    }

    .nav-item.active {
      color: #FF6B35;
    }

    .nav-icon-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      border-radius: 14px;
      transition: all 0.3s ease;
    }

    /* CTA Buttons - Recherche & Demandes */
    .nav-cta .nav-icon-wrapper {
      background: linear-gradient(135deg, #FF6B35 0%, #E85A24 100%);
      color: white;
      box-shadow: 0 3px 12px rgba(255, 107, 53, 0.4);
    }

    .nav-cta:hover .nav-icon-wrapper {
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      color: white;
      box-shadow: 0 4px 16px rgba(16, 185, 129, 0.45);
      transform: scale(1.08);
    }

    .nav-cta.active .nav-icon-wrapper {
      background: linear-gradient(135deg, #FF6B35 0%, #E85A24 100%);
      color: white;
      box-shadow: 0 4px 16px rgba(255, 107, 53, 0.5);
    }

    .nav-cta .nav-label {
      color: #FF6B35;
      font-weight: 600;
    }

    .nav-cta:hover .nav-label {
      color: #10B981;
    }

    .nav-cta.active .nav-label {
      color: #E85A24;
    }

    /* Pulse animation for CTA */
    .cta-search,
    .cta-demande {
      animation: pulse-cta 2.5s ease-in-out infinite;
    }

    .cta-demande {
      animation-delay: 1.25s;
    }

    @keyframes pulse-cta {
      0%, 100% {
        box-shadow: 0 3px 12px rgba(255, 107, 53, 0.4);
      }
      50% {
        box-shadow: 0 3px 20px rgba(255, 107, 53, 0.6);
      }
    }

    .nav-cta:hover .nav-icon-wrapper,
    .nav-cta.active .nav-icon-wrapper {
      animation: none;
    }

    /* Regular nav item (Connexion/Profil) */
    .nav-item:not(.nav-cta) .nav-icon-wrapper {
      background: #f3f4f6;
      color: #6b7280;
    }

    .nav-item:not(.nav-cta):hover .nav-icon-wrapper {
      background: #e5e7eb;
      color: #374151;
    }

    .nav-item:not(.nav-cta).active .nav-icon-wrapper {
      background: #dbeafe;
      color: #2563eb;
    }

    .nav-item:not(.nav-cta).active .nav-label {
      color: #2563eb;
    }

    .nav-label {
      font-weight: 500;
      letter-spacing: 0.01em;
    }
  `],
})
export class BottomNavComponent {
  readonly authStore = inject(AuthStore);
}
