import { Component, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { AuthStore } from '../../../core/stores/auth.store';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    @if (!hideNav()) {
    <nav class="bottom-nav" role="navigation" aria-label="Navigation principale">
      @if (!authStore.isAdmin() && !authStore.isRepairer()) {
        <a routerLink="/search"
           routerLinkActive="active"
           #searchLink="routerLinkActive"
           class="nav-item nav-cta"
           aria-label="Rechercher des réparateurs"
           [attr.aria-current]="searchLink.isActive ? 'page' : null">
          <span class="nav-icon-wrapper cta-search" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </span>
          <span class="nav-label">Recherche</span>
        </a>
      }

      @if (!authStore.isAdmin() && !authStore.isRepairer() && authStore.isAuthenticated()) {
        <!-- Client connecté : Mes demandes envoyées -->
        <a routerLink="/requests"
           routerLinkActive="active"
           #requestsLink="routerLinkActive"
           class="nav-item nav-cta"
           aria-label="Mes demandes de réparation"
           [attr.aria-current]="requestsLink.isActive ? 'page' : null">
          <span class="nav-icon-wrapper cta-demande" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </span>
          <span class="nav-label">Demandes</span>
        </a>

        <!-- Client connecté : Mes devis -->
        <a routerLink="/quotes"
           routerLinkActive="active"
           #quotesLink="routerLinkActive"
           class="nav-item"
           aria-label="Mes devis"
           [attr.aria-current]="quotesLink.isActive ? 'page' : null">
          <span class="nav-icon-wrapper" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 11H1l8-8 8 8h-8v8z" transform="rotate(45 12 12)"/>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <line x1="8" y1="13" x2="16" y2="13"/>
              <line x1="8" y1="17" x2="16" y2="17"/>
            </svg>
          </span>
          <span class="nav-label">Devis</span>
        </a>

        <!-- Client connecté : Messagerie -->
        <a routerLink="/chat"
           routerLinkActive="active"
           #chatLink="routerLinkActive"
           class="nav-item"
           aria-label="Messages"
           [attr.aria-current]="chatLink.isActive ? 'page' : null">
          <span class="nav-icon-wrapper" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </span>
          <span class="nav-label">Messages</span>
        </a>
      }

      @if (authStore.isRepairer()) {
        <!-- Repairer: Demandes reçues des clients -->
        <a routerLink="/repairer/requests"
           routerLinkActive="active"
           #repairerRequestsLink="routerLinkActive"
           class="nav-item nav-cta"
           aria-label="Demandes reçues"
           [attr.aria-current]="repairerRequestsLink.isActive ? 'page' : null">
          <span class="nav-icon-wrapper cta-demande" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </span>
          <span class="nav-label">Demandes</span>
        </a>

        <!-- Repairer: Mes devis envoyés -->
        <a routerLink="/quotes"
           routerLinkActive="active"
           #repairerQuotesLink="routerLinkActive"
           class="nav-item"
           aria-label="Mes devis"
           [attr.aria-current]="repairerQuotesLink.isActive ? 'page' : null">
          <span class="nav-icon-wrapper" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="8" y1="13" x2="16" y2="13"/>
              <line x1="8" y1="17" x2="16" y2="17"/>
            </svg>
          </span>
          <span class="nav-label">Devis</span>
        </a>

        <!-- Repairer: Messagerie -->
        <a routerLink="/chat"
           routerLinkActive="active"
           #repairerChatLink="routerLinkActive"
           class="nav-item"
           aria-label="Messages"
           [attr.aria-current]="repairerChatLink.isActive ? 'page' : null">
          <span class="nav-icon-wrapper" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </span>
          <span class="nav-label">Messages</span>
        </a>
      }

      @if (authStore.isAuthenticated()) {
        <a routerLink="/profile"
           routerLinkActive="active"
           #profileLink="routerLinkActive"
           class="nav-item"
           aria-label="Mon profil utilisateur"
           [attr.aria-current]="profileLink.isActive ? 'page' : null">
          <span class="nav-icon-wrapper" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </span>
          <span class="nav-label">Profil</span>
        </a>
      } @else {
        <a routerLink="/auth/login"
           routerLinkActive="active"
           #loginLink="routerLinkActive"
           class="nav-item"
           aria-label="Se connecter"
           [attr.aria-current]="loginLink.isActive ? 'page' : null">
          <span class="nav-icon-wrapper" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </span>
          <span class="nav-label">Connexion</span>
        </a>
      }
    </nav>
    }
  `,
  styles: [`
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 72px;
      background: white;
      border-top: 1px solid var(--color-neutral-200, #EEEEEE);
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
      color: var(--color-neutral-500, #6B7280);
      font-size: 0.7rem;
      padding: 0.5rem 1rem;
      transition: all 0.3s ease;
    }

    .nav-item:hover {
      transform: translateY(-2px);
    }

    .nav-item.active {
      color: var(--color-primary-500, #FF9800);
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

    /* CTA Buttons - Recherche & Demandes (charte: gradient Coucher africain) */
    .nav-cta .nav-icon-wrapper {
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800) 0%, var(--color-gold-800, #F9A825) 100%);
      color: white;
      box-shadow: var(--shadow-warm, 0 8px 24px rgba(255, 152, 0, 0.20));
    }

    .nav-cta:hover .nav-icon-wrapper {
      background: linear-gradient(135deg, var(--color-secondary, #4CAF50) 0%, var(--color-secondary-dark, #2E7D32) 100%);
      color: white;
      box-shadow: var(--shadow-success, 0 8px 24px rgba(76, 175, 80, 0.20));
      transform: scale(1.08);
    }

    .nav-cta.active .nav-icon-wrapper {
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800) 0%, var(--color-gold-800, #F9A825) 100%);
      color: white;
      box-shadow: 0 4px 16px rgba(255, 152, 0, 0.5);
    }

    .nav-cta .nav-label {
      color: var(--color-primary-500, #FF9800);
      font-weight: 600;
    }

    .nav-cta:hover .nav-label {
      color: var(--color-secondary-dark, #2E7D32);
    }

    .nav-cta.active .nav-label {
      color: var(--color-primary-900, #E65100);
    }

    /* Pulse animation for CTA (charte) */
    .cta-search,
    .cta-demande {
      animation: pulse-cta 2.5s ease-in-out infinite;
    }

    .cta-demande {
      animation-delay: 1.25s;
    }

    @keyframes pulse-cta {
      0%, 100% {
        box-shadow: 0 3px 12px rgba(255, 152, 0, 0.4);
      }
      50% {
        box-shadow: 0 3px 20px rgba(255, 152, 0, 0.6);
      }
    }

    .nav-cta:hover .nav-icon-wrapper,
    .nav-cta.active .nav-icon-wrapper {
      animation: none;
    }

    /* Regular nav item (Connexion/Profil) */
    .nav-item:not(.nav-cta) .nav-icon-wrapper {
      background: var(--color-neutral-100, #F5F5F5);
      color: var(--color-neutral-600, #4B5563);
    }

    .nav-item:not(.nav-cta):hover .nav-icon-wrapper {
      background: var(--color-neutral-200, #EEEEEE);
      color: var(--color-neutral-700, #374151);
    }

    .nav-item:not(.nav-cta).active .nav-icon-wrapper {
      background: var(--color-ocean-50, #E3F2FD);
      color: var(--color-ocean, #1565C0);
    }

    .nav-item:not(.nav-cta).active .nav-label {
      color: var(--color-ocean, #1565C0);
    }

    .nav-label {
      font-family: 'Inter', sans-serif;
      font-weight: 500;
      letter-spacing: 0.01em;
    }
  `],
})
export class BottomNavComponent {
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  readonly hideNav = computed(() => {
    const url = this.currentUrl();
    return url.startsWith('/auth') || url.startsWith('/onboarding');
  });
}
