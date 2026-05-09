import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthStore } from '../../../../core/stores/auth.store';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="logo-section">
          <div class="logo">RF</div>
          <h1 class="auth-title">Vérification</h1>
        </div>

        <p class="auth-subtitle">
          Code envoyé au <strong class="phone-display">+225 {{ formatPhoneDisplay() }}</strong>
        </p>

        @if (error()) {
          <div class="alert alert-error">
            <span class="alert-icon">⚠</span>
            {{ error() }}
          </div>
        }

        @if (success()) {
          <div class="alert alert-success">
            <span class="alert-icon">✓</span>
            {{ success() }}
          </div>
        }

        @if (devCode()) {
          <div class="alert alert-dev">
            <strong>Mode DEV:</strong> Code OTP: <code>{{ devCode() }}</code>
          </div>
        }

        <form (ngSubmit)="onSubmit()">
          <div class="otp-inputs">
            @for (i of [0, 1, 2, 3, 4, 5]; track i) {
              <input
                type="tel"
                inputmode="numeric"
                maxlength="1"
                class="otp-input"
                [value]="otpDigits()[i] || ''"
                (input)="onDigitInput($event, i)"
                (keydown)="onKeyDown($event, i)"
                (paste)="onPaste($event)"
                #otpInput
              />
            }
          </div>

          @if (showNameInput()) {
            <div class="name-input-section">
              <label for="name" class="optional-label">
                Votre nom (optionnel)
                <span class="badge">Recommandé</span>
              </label>
              <input
                type="text"
                id="name"
                [(ngModel)]="userName"
                name="userName"
                placeholder="Ex: Kouassi Jean"
                class="form-input"
              />
              <p class="hint">Pour faciliter vos échanges avec les réparateurs</p>
            </div>
          }

          <button
            type="submit"
            class="btn btn-primary btn-block"
            [disabled]="isLoading() || otpDigits().join('').length !== 6"
          >
            @if (isLoading()) {
              <span class="spinner"></span>
              Vérification...
            } @else {
              Vérifier et Continuer
            }
          </button>
        </form>

        <div class="resend-section">
          @if (resendCooldown() > 0) {
            <p class="cooldown-text">
              Renvoyer le code dans <strong>{{ resendCooldown() }}s</strong>
            </p>
          } @else {
            <button
              type="button"
              class="btn-link"
              (click)="resendOtp()"
            >
              <span class="icon">↻</span>
              Renvoyer le code
            </button>
          }
        </div>

        <div class="info-box">
          <span class="icon">ℹ</span>
          <p>Un mini-profil sera créé automatiquement pour suivre vos réparations</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      padding-bottom: calc(1rem + var(--bottom-nav-height, 80px) + var(--safe-area-bottom, 0px));
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800) 0%, var(--color-gold-800, #F9A825) 100%);
    }

    .auth-card {
      background: white;
      border-radius: 20px;
      padding: 2rem 1.5rem;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 20px 60px rgba(255, 152, 0, 0.2);
    }

    .logo-section {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .logo {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 70px;
      height: 70px;
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800) 0%, var(--color-gold-800, #F9A825) 100%);
      border-radius: 20px;
      font-size: 1.75rem;
      font-weight: 900;
      color: white;
      margin-bottom: 1rem;
      box-shadow: 0 8px 20px rgba(255, 152, 0, 0.3);
    }

    .auth-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1f2937;
      margin: 0;
    }

    .auth-subtitle {
      color: #6b7280;
      text-align: center;
      margin-bottom: 2rem;
      font-size: 0.9375rem;
      line-height: 1.5;
    }

    .phone-display {
      color: var(--color-primary-500, #FF9800);
      font-weight: 600;
    }

    .otp-inputs {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
      margin-bottom: 2rem;
    }

    .otp-input {
      width: 48px;
      height: 56px;
      text-align: center;
      font-size: 1.5rem;
      font-weight: 700;
      border: 2px solid #EEEEEE;
      border-radius: 12px;
      transition: all 0.2s;
      background: #FAFAFA;
      color: #1f2937;
    }

    .otp-input:focus {
      outline: none;
      border-color: var(--color-primary-500, #FF9800);
      background: white;
      box-shadow: 0 0 0 4px rgba(255, 152, 0, 0.1);
      transform: scale(1.05);
    }

    .name-input-section {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 12px;
      border: 2px dashed #EEEEEE;
    }

    .optional-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .badge {
      background: #4CAF50;
      color: white;
      font-size: 0.625rem;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      font-weight: 600;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid #EEEEEE;
      border-radius: 12px;
      font-size: 1rem;
      transition: all 0.2s;
      background: white;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--color-primary-500, #FF9800);
      box-shadow: 0 0 0 4px rgba(255, 152, 0, 0.1);
    }

    .hint {
      margin: 0.5rem 0 0 0;
      font-size: 0.75rem;
      color: #6b7280;
      font-style: italic;
    }

    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 1rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800) 0%, var(--color-gold-800, #F9A825) 100%);
      color: white;
      box-shadow: 0 4px 14px rgba(255, 152, 0, 0.4);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 152, 0, 0.5);
    }

    .btn-primary:active:not(:disabled) {
      transform: translateY(0);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .btn-block {
      width: 100%;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .btn-link {
      background: none;
      border: none;
      color: var(--color-primary-500, #FF9800);
      font-weight: 600;
      cursor: pointer;
      padding: 0.5rem 1rem;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9375rem;
      border-radius: 12px;
      transition: all 0.2s;
    }

    .btn-link:hover {
      background: #FFF3E0;
    }

    .btn-link .icon {
      font-size: 1.25rem;
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border-radius: 12px;
      margin-bottom: 1.25rem;
    }

    .alert-icon {
      font-size: 1.125rem;
      flex-shrink: 0;
    }

    .alert-error {
      background: #FFEBEE;
      color: #991b1b;
      border: 2px solid #FFCDD2;
    }

    .alert-success {
      background: #E8F5E9;
      color: #166534;
      border: 2px solid #4CAF50;
    }

    .alert-success .alert-icon {
      color: #4CAF50;
    }

    .alert-dev {
      background: #FFF8E1;
      color: #92400e;
      border: 2px solid #fcd34d;
    }

    .alert-dev code {
      background: var(--color-mustard, #FFC107);
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-size: 1.25rem;
      font-weight: bold;
      letter-spacing: 0.2em;
    }

    .resend-section {
      text-align: center;
      margin-top: 1.5rem;
    }

    .cooldown-text {
      color: #6b7280;
      font-size: 0.875rem;
      margin: 0;
    }

    .cooldown-text strong {
      color: var(--color-primary-500, #FF9800);
    }

    .info-box {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      background: #E3F2FD;
      border-radius: 12px;
      margin-top: 1.5rem;
      border: 1px solid #E3F2FD;
    }

    .info-box .icon {
      font-size: 1.25rem;
      color: var(--color-ocean, #1565C0);
      flex-shrink: 0;
    }

    .info-box p {
      margin: 0;
      font-size: 0.8125rem;
      color: var(--color-ocean, #1565C0);
      line-height: 1.5;
    }

    @media (max-width: 480px) {
      .auth-card {
        padding: 1.5rem 1rem;
      }

      .otp-inputs {
        gap: 0.375rem;
      }

      .otp-input {
        width: 42px;
        height: 50px;
        font-size: 1.25rem;
      }
    }
  `],
})
export class VerifyOtpComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  phone = '';
  userName = '';
  readonly otpDigits = signal<string[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly devCode = signal<string | null>(null);
  readonly resendCooldown = signal(0);
  readonly showNameInput = signal(false);
  readonly usingFirebase = signal(false);
  private returnUrl: string | null = null;
  private isRepairerRegistration = false;

  private cooldownInterval?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    this.phone = params['phone'] || '';
    const devCodeParam = params['devCode'];
    const useFirebaseParam = params['useFirebase'];

    if (devCodeParam) {
      this.devCode.set(devCodeParam);
    }
    if (useFirebaseParam === 'true') {
      this.usingFirebase.set(true);
    }
    if (params['returnUrl']) {
      this.returnUrl = params['returnUrl'];
    }
    if (params['role'] === 'repairer') {
      this.isRepairerRegistration = true;
    }
    if (!this.phone) {
      this.toast.info("Veuillez d'abord saisir vos informations d'inscription.");
      this.router.navigate(['/auth/register']);
    }
  }

  onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/[^0-9]/g, '');

    const digits = [...this.otpDigits()];
    digits[index] = value;
    this.otpDigits.set(digits);

    // Auto-focus next input
    if (value && index < 5) {
      const inputs = document.querySelectorAll('.otp-input');
      (inputs[index + 1] as HTMLInputElement)?.focus();
    }

    // Show name input when all digits are entered
    if (digits.filter(d => d).length === 6) {
      this.showNameInput.set(true);
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.otpDigits()[index] && index > 0) {
      const inputs = document.querySelectorAll('.otp-input');
      (inputs[index - 1] as HTMLInputElement)?.focus();
    }
  }

  async onSubmit(): Promise<void> {
    const code = this.otpDigits().join('');
    if (code.length !== 6) return;

    this.error.set(null);
    this.isLoading.set(true);

    try {
      // Pass display name for Firebase auth if provided
      const displayName = this.userName.trim() || undefined;
      await this.authService.verifyOtp(this.phone, code, displayName);

      // Determine redirect URL
      if (this.isRepairerRegistration && this.authStore.isRepairer()) {
        // New repairer - redirect to profile setup
        this.router.navigate(['/repairer/profile/setup']);
      } else if (this.returnUrl) {
        // Return to original page
        this.router.navigateByUrl(this.returnUrl);
      } else {
        // Default redirect based on role
        const defaultUrl = this.authStore.getDefaultRedirectUrl();
        this.router.navigate([defaultUrl]);
      }
    } catch (err: any) {
      this.error.set(err.message || 'Code invalide');
    } finally {
      this.isLoading.set(false);
    }
  }

  async resendOtp(): Promise<void> {
    this.error.set(null);
    this.success.set(null);
    this.devCode.set(null);

    try {
      const response = await this.authService.sendOtp(this.phone);
      this.success.set('Nouveau code envoyé !');
      if (response.devCode) {
        this.devCode.set(response.devCode);
      }
      if (response.useFirebase) {
        this.usingFirebase.set(true);
      }
      this.startCooldown();
    } catch (err: any) {
      this.error.set(err.message || 'Erreur lors de l\'envoi');
    }
  }

  private startCooldown(): void {
    this.resendCooldown.set(60);
    this.cooldownInterval = setInterval(() => {
      const current = this.resendCooldown();
      if (current <= 1) {
        clearInterval(this.cooldownInterval);
        this.resendCooldown.set(0);
      } else {
        this.resendCooldown.set(current - 1);
      }
    }, 1000);
  }

  formatPhoneDisplay(): string {
    if (!this.phone) return '';
    const cleaned = this.phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
    }
    return this.phone;
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const digits = pastedText.replace(/\D/g, '').slice(0, 6).split('');
    this.otpDigits.set(digits);

    if (digits.length === 6) {
      setTimeout(() => this.onSubmit(), 100);
    }
  }
}
