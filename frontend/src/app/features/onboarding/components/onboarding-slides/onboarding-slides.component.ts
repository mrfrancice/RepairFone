import { Component, signal, inject, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SecureStorageService } from '../../../../core/services/secure-storage.service';
import { trigger, transition, style, animate, state } from '@angular/animations';

interface OnboardingSlide {
  id: number;
  icon: string;
  title: string;
  description: string;
  illustration: string;
}

@Component({
  selector: 'app-onboarding-slides',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('500ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ]),
    trigger('splashFade', [
      state('visible', style({ opacity: 1 })),
      state('hidden', style({ opacity: 0 })),
      transition('visible => hidden', animate('500ms ease-out'))
    ])
  ],
  template: `
    <!-- Splash Screen -->
    @if (showSplash()) {
      <div class="splash-screen" [@splashFade]="showSplash() ? 'visible' : 'hidden'">
        <div class="splash-content">
          <div class="splash-logo" [@scaleIn]>
            <div class="logo-circle">
              <svg viewBox="0 0 64 64" fill="none" class="logo-svg">
                <path d="M32 8C18.745 8 8 18.745 8 32s10.745 24 24 24 24-10.745 24-24S45.255 8 32 8z" fill="#FF6B35"/>
                <path d="M40 22l-4 4m0 0l-4-4m4 4v12m-8 4h16M24 28c0 4.418 3.582 8 8 8s8-3.582 8-8" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="32" cy="20" r="3" fill="white"/>
              </svg>
            </div>
            <h1 class="splash-title">RepairFone</h1>
          </div>
          <p class="splash-tagline">Trouvez un réparateur fiable près de vous</p>
          <div class="splash-loader">
            <div class="loader-bar"></div>
          </div>
        </div>
        <div class="splash-footer">
          <span class="made-in">Made with love in Cote d'Ivoire</span>
        </div>
      </div>
    }

    <!-- Onboarding Slides -->
    @if (!showSplash()) {
      <div class="onboarding-container" [@fadeSlide]>
        <!-- Background decoration -->
        <div class="bg-decoration">
          <div class="circle circle-1"></div>
          <div class="circle circle-2"></div>
          <div class="circle circle-3"></div>
        </div>

        <!-- Skip button -->
        @if (currentSlide() < slides.length - 1) {
          <button class="skip-btn" (click)="skip()">
            Passer
          </button>
        }

        <!-- Logo -->
        <div class="logo-small">
          <svg viewBox="0 0 32 32" fill="none" class="logo-icon-small">
            <path d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4z" fill="#FF6B35"/>
            <path d="M20 11l-2 2m0 0l-2-2m2 2v6m-4 2h8" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="logo-text-small">RepairFone</span>
        </div>

        <!-- Slides Container -->
        <div class="slides-wrapper">
          <div
            class="slides-track"
            [style.transform]="'translateX(-' + (currentSlide() * 100) + '%)'"
          >
            @for (slide of slides; track slide.id) {
              <div class="slide">
                <div class="slide-illustration">
                  <div class="illustration-bg" [style.background]="getIllustrationBg(slide.id)">
                    <span class="illustration-icon">{{ slide.illustration }}</span>
                  </div>
                </div>
                <div class="slide-content">
                  <div class="slide-icon-badge">{{ slide.icon }}</div>
                  <h2 class="slide-title">{{ slide.title }}</h2>
                  <p class="slide-description">{{ slide.description }}</p>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Pagination Dots -->
        <div class="pagination">
          @for (slide of slides; track slide.id; let i = $index) {
            <button
              class="dot"
              [class.active]="i === currentSlide()"
              (click)="goToSlide(i)"
              [attr.aria-label]="'Aller au slide ' + (i + 1)"
            >
              @if (i === currentSlide()) {
                <span class="dot-progress" [style.animation-duration]="autoPlayDuration + 'ms'"></span>
              }
            </button>
          }
        </div>

        <!-- Navigation Buttons -->
        <div class="navigation">
          @if (currentSlide() < slides.length - 1) {
            <button class="nav-btn nav-btn-secondary" (click)="previous()" [disabled]="currentSlide() === 0">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button class="nav-btn nav-btn-primary" (click)="next()">
              Suivant
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          } @else {
            <!-- Final slide: Multiple options -->
            <div class="final-actions">
              <button class="nav-btn nav-btn-start" (click)="start()">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M17.5 17.5L13.875 13.875M15.833 9.167A6.667 6.667 0 112.5 9.167a6.667 6.667 0 0113.333 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Trouver un réparateur
              </button>
              <div class="auth-options">
                <span class="auth-divider">ou</span>
                <div class="auth-buttons">
                  <button class="auth-btn auth-btn-login" (click)="goToLogin()">
                    Se connecter
                  </button>
                  <button class="auth-btn auth-btn-register" (click)="goToRegister()">
                    Créer un compte
                  </button>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Features highlight -->
        <div class="features-bar">
          <div class="feature">
            <span class="feature-icon">100+</span>
            <span class="feature-text">Reparateurs</span>
          </div>
          <div class="feature-divider"></div>
          <div class="feature">
            <span class="feature-icon">4.8</span>
            <span class="feature-text">Note moyenne</span>
          </div>
          <div class="feature-divider"></div>
          <div class="feature">
            <span class="feature-icon">24h</span>
            <span class="feature-text">Delai moyen</span>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    /* ============================================
       SPLASH SCREEN
    ============================================ */
    .splash-screen {
      position: fixed;
      inset: 0;
      background: linear-gradient(135deg, #FF6B35 0%, #E85A24 50%, #CC4A14 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 100;
    }

    .splash-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .splash-logo {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .logo-circle {
      width: 120px;
      height: 120px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
      animation: pulse-glow 2s ease-in-out infinite;
    }

    @keyframes pulse-glow {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
      }
      50% {
        box-shadow: 0 0 0 20px rgba(255, 255, 255, 0);
      }
    }

    .logo-svg {
      width: 80px;
      height: 80px;
    }

    .splash-title {
      font-size: 2.5rem;
      font-weight: 800;
      color: white;
      margin: 0;
      letter-spacing: -0.02em;
    }

    .splash-tagline {
      font-size: 1.125rem;
      color: rgba(255, 255, 255, 0.9);
      margin: 0;
    }

    .splash-loader {
      width: 200px;
      height: 4px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 2px;
      margin-top: 3rem;
      overflow: hidden;
    }

    .loader-bar {
      width: 100%;
      height: 100%;
      background: white;
      border-radius: 2px;
      animation: loading 1s ease-out forwards;
    }

    @keyframes loading {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(0); }
    }

    .splash-footer {
      position: absolute;
      bottom: calc(2rem + env(safe-area-inset-bottom, 0));
    }

    .made-in {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.7);
    }

    /* ============================================
       ONBOARDING CONTAINER
    ============================================ */
    .onboarding-container {
      min-height: 100vh;
      min-height: 100dvh;
      background: linear-gradient(180deg, #FFF5F0 0%, #FFFFFF 50%, #FFF8F5 100%);
      display: flex;
      flex-direction: column;
      padding: 1.5rem;
      padding-top: calc(1.5rem + env(safe-area-inset-top, 0));
      padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0));
      position: relative;
      overflow: hidden;
    }

    /* Background decoration */
    .bg-decoration {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
    }

    .circle {
      position: absolute;
      border-radius: 50%;
      opacity: 0.5;
    }

    .circle-1 {
      width: 300px;
      height: 300px;
      background: linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 107, 53, 0.05) 100%);
      top: -100px;
      right: -100px;
    }

    .circle-2 {
      width: 200px;
      height: 200px;
      background: linear-gradient(135deg, rgba(255, 107, 53, 0.08) 0%, rgba(255, 107, 53, 0.02) 100%);
      bottom: 100px;
      left: -80px;
    }

    .circle-3 {
      width: 150px;
      height: 150px;
      background: linear-gradient(135deg, rgba(255, 107, 53, 0.06) 0%, rgba(255, 107, 53, 0.01) 100%);
      top: 40%;
      right: -50px;
    }

    /* Skip button */
    .skip-btn {
      position: absolute;
      top: calc(1.5rem + env(safe-area-inset-top, 0));
      right: 1.5rem;
      background: transparent;
      border: none;
      color: #6B7280;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      transition: all 0.2s;
      z-index: 10;
    }

    .skip-btn:hover {
      background: rgba(0, 0, 0, 0.05);
      color: #374151;
    }

    /* Logo small */
    .logo-small {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .logo-icon-small {
      width: 32px;
      height: 32px;
    }

    .logo-text-small {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1F2937;
    }

    /* ============================================
       SLIDES
    ============================================ */
    .slides-wrapper {
      flex: 1;
      overflow: hidden;
      margin: 0 -1.5rem;
    }

    .slides-track {
      display: flex;
      height: 100%;
      transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .slide {
      min-width: 100%;
      display: flex;
      flex-direction: column;
      padding: 0 1.5rem;
    }

    /* Illustration */
    .slide-illustration {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 0;
    }

    .illustration-bg {
      width: 220px;
      height: 220px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      animation: float 4s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-15px); }
    }

    .illustration-icon {
      font-size: 6rem;
      filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.1));
    }

    /* Slide content */
    .slide-content {
      text-align: center;
      padding-bottom: 1rem;
    }

    .slide-icon-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #FF6B35 0%, #E85A24 100%);
      border-radius: 16px;
      font-size: 1.5rem;
      margin-bottom: 1rem;
      box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
    }

    .slide-title {
      font-size: 1.625rem;
      font-weight: 700;
      color: #1F2937;
      margin: 0 0 0.75rem;
      line-height: 1.3;
    }

    .slide-description {
      font-size: 1rem;
      color: #6B7280;
      margin: 0;
      line-height: 1.6;
      max-width: 320px;
      margin-left: auto;
      margin-right: auto;
    }

    /* ============================================
       PAGINATION
    ============================================ */
    .pagination {
      display: flex;
      justify-content: center;
      gap: 0.75rem;
      padding: 1.5rem 0;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 5px;
      border: none;
      background: #E5E7EB;
      cursor: pointer;
      padding: 0;
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .dot.active {
      width: 32px;
      background: rgba(255, 107, 53, 0.2);
    }

    .dot-progress {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      background: #FF6B35;
      border-radius: 5px;
      animation: progress linear forwards;
    }

    @keyframes progress {
      0% { width: 0; }
      100% { width: 100%; }
    }

    /* ============================================
       NAVIGATION
    ============================================ */
    .navigation {
      display: flex;
      gap: 1rem;
      padding: 0.5rem 0;
    }

    .nav-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem 1.5rem;
      border-radius: 16px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }

    .nav-btn-secondary {
      width: 56px;
      padding: 1rem;
      background: #F3F4F6;
      color: #374151;
    }

    .nav-btn-secondary:hover:not(:disabled) {
      background: #E5E7EB;
    }

    .nav-btn-secondary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .nav-btn-primary {
      flex: 1;
      background: linear-gradient(135deg, #FF6B35 0%, #E85A24 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
    }

    .nav-btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(255, 107, 53, 0.4);
    }

    .nav-btn-start {
      flex: 1;
      background: linear-gradient(135deg, #FF6B35 0%, #E85A24 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
      animation: pulse-btn 2s ease-in-out infinite;
    }

    @keyframes pulse-btn {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }

    .nav-btn-start:hover {
      animation: none;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(255, 107, 53, 0.4);
    }

    /* Final Actions */
    .final-actions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      width: 100%;
    }

    .auth-options {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }

    .auth-divider {
      font-size: 0.875rem;
      color: #9CA3AF;
      font-weight: 500;
    }

    .auth-buttons {
      display: flex;
      gap: 0.75rem;
      width: 100%;
    }

    .auth-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.875rem 1rem;
      border-radius: 12px;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }

    .auth-btn-login {
      background: #F3F4F6;
      color: #374151;
    }

    .auth-btn-login:hover {
      background: #E5E7EB;
    }

    .auth-btn-register {
      background: transparent;
      color: #FF6B35;
      border: 2px solid #FF6B35;
    }

    .auth-btn-register:hover {
      background: rgba(255, 107, 53, 0.1);
    }

    /* ============================================
       FEATURES BAR
    ============================================ */
    .features-bar {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: white;
      border-radius: 16px;
      margin-top: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .feature {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
    }

    .feature-icon {
      font-size: 1.125rem;
      font-weight: 700;
      color: #FF6B35;
    }

    .feature-text {
      font-size: 0.6875rem;
      color: #6B7280;  /* WCAG AA compliant */
    }

    .feature-divider {
      width: 1px;
      height: 24px;
      background: #E5E7EB;
    }

    /* ============================================
       RESPONSIVE
    ============================================ */
    @media (min-width: 640px) {
      .illustration-bg {
        width: 280px;
        height: 280px;
      }

      .illustration-icon {
        font-size: 7rem;
      }

      .slide-title {
        font-size: 2rem;
      }

      .slide-description {
        font-size: 1.125rem;
        max-width: 400px;
      }

      .features-bar {
        gap: 2rem;
      }
    }

    @media (max-height: 700px) {
      .illustration-bg {
        width: 160px;
        height: 160px;
      }

      .illustration-icon {
        font-size: 4rem;
      }

      .slide-illustration {
        padding: 1rem 0;
      }
    }
  `],
})
export class OnboardingSlidesComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly storage = inject(SecureStorageService);

  readonly showSplash = signal(true);
  readonly currentSlide = signal(0);

  readonly autoPlayDuration = 5000; // 5 seconds per slide
  private autoPlayInterval?: ReturnType<typeof setInterval>;
  private splashTimeout?: ReturnType<typeof setTimeout>;

  readonly slides: OnboardingSlide[] = [
    {
      id: 1,
      icon: '✓',
      title: 'Réparateurs vérifiés & notés',
      description: 'Tous nos réparateurs sont vérifiés et évalués par de vrais clients. Consultez les avis et choisissez en toute confiance.',
      illustration: '🔧',
    },
    {
      id: 2,
      icon: '💰',
      title: 'Prix, délais et devis clairs',
      description: 'Obtenez des estimations de prix transparentes et des délais réalistes avant de confier votre appareil.',
      illustration: '📋',
    },
    {
      id: 3,
      icon: '🔒',
      title: 'Paiement sécurisé & assistance',
      description: 'Payez en toute sécurité via Orange Money, MTN ou Wave. Notre équipe vous accompagne en cas de problème.',
      illustration: '🛡️',
    },
  ];

  ngOnInit(): void {
    // Hide splash after animation (reduced for faster loading)
    this.splashTimeout = setTimeout(() => {
      this.showSplash.set(false);
      this.startAutoPlay();
    }, 1200);
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
    if (this.splashTimeout) {
      clearTimeout(this.splashTimeout);
    }
  }

  private startAutoPlay(): void {
    this.autoPlayInterval = setInterval(() => {
      if (this.currentSlide() < this.slides.length - 1) {
        this.currentSlide.update((v) => v + 1);
      } else {
        this.stopAutoPlay();
      }
    }, this.autoPlayDuration);
  }

  private stopAutoPlay(): void {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = undefined;
    }
  }

  goToSlide(index: number): void {
    this.stopAutoPlay();
    this.currentSlide.set(index);
    if (index < this.slides.length - 1) {
      this.startAutoPlay();
    }
  }

  previous(): void {
    if (this.currentSlide() > 0) {
      this.stopAutoPlay();
      this.currentSlide.update((v) => v - 1);
      this.startAutoPlay();
    }
  }

  next(): void {
    if (this.currentSlide() < this.slides.length - 1) {
      this.stopAutoPlay();
      this.currentSlide.update((v) => v + 1);
      if (this.currentSlide() < this.slides.length - 1) {
        this.startAutoPlay();
      }
    }
  }

  skip(): void {
    this.completeOnboarding();
  }

  start(): void {
    this.completeOnboarding();
  }

  goToLogin(): void {
    this.completeOnboarding('/auth/login');
  }

  goToRegister(): void {
    this.completeOnboarding('/auth/register');
  }

  private async completeOnboarding(redirectTo: string = '/home'): Promise<void> {
    this.stopAutoPlay();
    try {
      await this.storage.set('rf_onboarding_completed', true);
      this.router.navigate([redirectTo]);
    } catch {
      // Navigate anyway as this is not critical
      this.router.navigate([redirectTo]);
    }
  }

  getIllustrationBg(slideId: number): string {
    const colors = [
      'linear-gradient(135deg, rgba(255, 107, 53, 0.15) 0%, rgba(255, 107, 53, 0.05) 100%)',
      'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
      'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(37, 99, 235, 0.05) 100%)',
    ];
    return colors[slideId - 1] || colors[0];
  }
}
