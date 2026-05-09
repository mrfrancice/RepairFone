import { Component, inject, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CustomValidators, getErrorMessage } from '../../../../shared/validators/custom-validators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppLogoComponent } from '../../../../shared/components/app-logo/app-logo.component';

type Step = 'phone' | 'otp' | 'password' | 'success';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AppLogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-logo">
          <app-logo size="md" variant="gradient" />
        </div>

        @if (currentStep() !== 'success') {
          <button class="back-btn" (click)="goBack()">
            ← Retour
          </button>
        }

        <!-- Step 1: Enter Phone -->
        @if (currentStep() === 'phone') {
          <h1 class="auth-title">Mot de passe oublié</h1>
          <p class="auth-subtitle">
            Entrez votre numéro de téléphone pour recevoir un code de vérification
          </p>

          @if (error()) {
            <div class="alert alert-error">
              <span class="alert-icon">!</span>
              {{ error() }}
            </div>
          }

          <form [formGroup]="phoneForm" (ngSubmit)="submitPhone()">
            <div class="form-group">
              <label for="phone">Numéro de téléphone</label>
              <div class="input-wrapper">
                <span class="country-code">+225</span>
                <input
                  type="tel"
                  id="phone"
                  formControlName="phone"
                  placeholder="07 XX XX XX XX"
                  class="form-input with-prefix"
                  [class.input-error]="isFieldInvalid('phone', phoneForm)"
                  (input)="formatPhoneInput($event)"
                />
              </div>
              @if (isFieldInvalid('phone', phoneForm)) {
                <span class="field-error">{{ getFieldError('phone', phoneForm) }}</span>
              }
            </div>

            <button
              type="submit"
              class="btn btn-primary btn-block"
              [disabled]="isLoading() || phoneForm.invalid"
            >
              @if (isLoading()) {
                <span class="spinner"></span>
                Envoi en cours...
              } @else {
                Envoyer le code
              }
            </button>
          </form>
        }

        <!-- Step 2: Verify OTP -->
        @if (currentStep() === 'otp') {
          <h1 class="auth-title">Vérification</h1>
          <p class="auth-subtitle">
            Entrez le code à 6 chiffres envoyé au {{ maskedPhone() }}
          </p>

          @if (error()) {
            <div class="alert alert-error">
              <span class="alert-icon">!</span>
              {{ error() }}
            </div>
          }

          <form [formGroup]="otpForm" (ngSubmit)="submitOtp()">
            <div class="form-group">
              <div class="otp-inputs">
                @for (i of [0,1,2,3,4,5]; track i) {
                  <input
                    type="text"
                    maxlength="1"
                    class="otp-input"
                    [class.filled]="otpDigits()[i]"
                    (input)="onOtpInput($event, i)"
                    (keydown)="onOtpKeydown($event, i)"
                    (paste)="onOtpPaste($event)"
                    #otpInput
                  />
                }
              </div>
            </div>

            <button
              type="submit"
              class="btn btn-primary btn-block"
              [disabled]="isLoading() || !isOtpComplete()"
            >
              @if (isLoading()) {
                <span class="spinner"></span>
                Vérification...
              } @else {
                Vérifier
              }
            </button>

            <div class="resend-section">
              @if (canResend()) {
                <button type="button" class="resend-btn" (click)="resendCode()">
                  Renvoyer le code
                </button>
              } @else {
                <span class="resend-timer">
                  Renvoyer dans {{ resendCountdown() }}s
                </span>
              }
            </div>
          </form>
        }

        <!-- Step 3: New Password -->
        @if (currentStep() === 'password') {
          <h1 class="auth-title">Nouveau mot de passe</h1>
          <p class="auth-subtitle">
            Créez un nouveau mot de passe sécurisé
          </p>

          @if (error()) {
            <div class="alert alert-error">
              <span class="alert-icon">!</span>
              {{ error() }}
            </div>
          }

          <form [formGroup]="passwordForm" (ngSubmit)="submitPassword()">
            <div class="form-group">
              <label for="password">Nouveau mot de passe</label>
              <div class="input-wrapper">
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  id="password"
                  formControlName="password"
                  placeholder="Min. 8 caractères"
                  class="form-input"
                  [class.input-error]="isFieldInvalid('password', passwordForm)"
                />
                <button
                  type="button"
                  class="toggle-password"
                  (click)="togglePassword()"
                >
                  {{ showPassword() ? 'Cacher' : 'Voir' }}
                </button>
              </div>
              @if (isFieldInvalid('password', passwordForm)) {
                <span class="field-error">{{ getFieldError('password', passwordForm) }}</span>
              }

              <!-- Password strength -->
              <div class="password-strength">
                <div class="strength-bars">
                  @for (i of [1,2,3,4]; track i) {
                    <div
                      class="bar"
                      [class.active]="passwordStrength() >= i"
                      [class.weak]="passwordStrength() === 1 && i === 1"
                      [class.medium]="passwordStrength() === 2 && i <= 2"
                      [class.strong]="passwordStrength() >= 3"
                    ></div>
                  }
                </div>
                <span class="strength-label">{{ getPasswordStrengthLabel() }}</span>
              </div>
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirmer le mot de passe</label>
              <input
                type="password"
                id="confirmPassword"
                formControlName="confirmPassword"
                placeholder="Confirmez le mot de passe"
                class="form-input"
                [class.input-error]="passwordMismatch()"
              />
              @if (passwordMismatch()) {
                <span class="field-error">Les mots de passe ne correspondent pas</span>
              }
            </div>

            <button
              type="submit"
              class="btn btn-primary btn-block"
              [disabled]="isLoading() || passwordForm.invalid || passwordMismatch()"
            >
              @if (isLoading()) {
                <span class="spinner"></span>
                Mise à jour...
              } @else {
                Mettre à jour le mot de passe
              }
            </button>
          </form>
        }

        <!-- Step 4: Success -->
        @if (currentStep() === 'success') {
          <div class="success-state">
            <div class="success-icon">OK</div>
            <h1 class="auth-title">Mot de passe mis à jour</h1>
            <p class="auth-subtitle">
              Votre mot de passe a été modifié avec succès.
              Vous pouvez maintenant vous connecter.
            </p>

            <a routerLink="/auth/login" class="btn btn-primary btn-block">
              Se connecter
            </a>
          </div>
        }

        @if (currentStep() !== 'success') {
          <p class="auth-footer">
            <a routerLink="/auth/login">Retour à la connexion</a>
          </p>
        }
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
      border-radius: 16px;
      padding: 2rem;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }

    .auth-logo {
      text-align: center;
      margin-bottom: 1rem;
    }

    .logo-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800) 0%, var(--color-ocean, #1565C0) 100%);
      border-radius: 12px;
      font-size: 1.5rem;
      color: white;
    }

    .back-btn {
      background: none;
      border: none;
      color: #6b7280;
      font-size: 0.875rem;
      cursor: pointer;
      padding: 0;
      margin-bottom: 1rem;
    }

    .back-btn:hover {
      color: var(--color-primary-500, #FF9800);
    }

    .auth-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 0.5rem;
      text-align: center;
    }

    .auth-subtitle {
      color: #6b7280;
      text-align: center;
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .country-code {
      position: absolute;
      left: 1rem;
      color: #6b7280;
      font-weight: 500;
    }

    .form-input {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 2px solid #EEEEEE;
      border-radius: 12px;
      font-size: 1rem;
      transition: all 0.2s;
      background: #FAFAFA;
    }

    .form-input.with-prefix {
      padding-left: 3.5rem;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--color-primary-500, #FF9800);
      background: white;
      box-shadow: 0 0 0 4px rgba(255, 152, 0, 0.1);
    }

    .form-input.input-error {
      border-color: var(--color-terracotta, #C62828);
      background: #FFEBEE;
    }

    .toggle-password {
      position: absolute;
      right: 1rem;
      background: none;
      border: none;
      color: #6b7280;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .field-error {
      display: block;
      color: var(--color-terracotta, #C62828);
      font-size: 0.75rem;
      margin-top: 0.375rem;
    }

    /* OTP Inputs */
    .otp-inputs {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
    }

    .otp-input {
      width: 48px;
      height: 56px;
      text-align: center;
      font-size: 1.5rem;
      font-weight: 600;
      border: 2px solid #EEEEEE;
      border-radius: 12px;
      background: #FAFAFA;
      transition: all 0.2s;
    }

    .otp-input:focus {
      outline: none;
      border-color: var(--color-primary-500, #FF9800);
      background: white;
      box-shadow: 0 0 0 4px rgba(255, 152, 0, 0.1);
    }

    .otp-input.filled {
      border-color: var(--color-primary-500, #FF9800);
      background: #E3F2FD;
    }

    .resend-section {
      text-align: center;
      margin-top: 1.5rem;
    }

    .resend-btn {
      background: none;
      border: none;
      color: var(--color-primary-500, #FF9800);
      font-weight: 500;
      cursor: pointer;
    }

    .resend-timer {
      color: #6b7280;
      font-size: 0.875rem;
    }

    /* Password Strength */
    .password-strength {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    .strength-bars {
      display: flex;
      gap: 4px;
      flex: 1;
    }

    .bar {
      height: 4px;
      flex: 1;
      background: #EEEEEE;
      border-radius: 2px;
      transition: all 0.3s;
    }

    .bar.active.weak { background: var(--color-terracotta, #C62828); }
    .bar.active.medium { background: var(--color-mustard, #FFC107); }
    .bar.active.strong { background: var(--color-secondary, #4CAF50); }

    .strength-label {
      font-size: 0.75rem;
      color: #6b7280;
      min-width: 50px;
    }

    /* Success State */
    .success-state {
      text-align: center;
      padding: 1rem 0;
    }

    .success-icon {
      width: 80px;
      height: 80px;
      background: var(--color-secondary, #4CAF50);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      margin: 0 auto 1.5rem;
    }

    /* Buttons */
    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 1rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800) 0%, var(--color-primary-900, #E65100) 100%);
      color: white;
      box-shadow: 0 4px 14px rgba(255, 152, 0, 0.3);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(255, 152, 0, 0.4);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
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

    .alert {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border-radius: 12px;
      margin-bottom: 1.25rem;
    }

    .alert-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      flex-shrink: 0;
      background: var(--color-terracotta, #C62828);
      color: white;
    }

    .alert-error {
      background: #FFEBEE;
      color: #991b1b;
      border: 1px solid #FFCDD2;
    }

    .auth-footer {
      text-align: center;
      margin-top: 1.5rem;
      color: #6b7280;
    }

    .auth-footer a {
      color: var(--color-primary-500, #FF9800);
      font-weight: 600;
      text-decoration: none;
    }
  `]
})
export class ForgotPasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly currentStep = signal<Step>('phone');
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly passwordStrength = signal(0);
  readonly otpDigits = signal<string[]>(['', '', '', '', '', '']);
  readonly canResend = signal(false);
  readonly resendCountdown = signal(60);

  private phone = '';
  private resetToken = '';
  private resendTimer?: ReturnType<typeof setInterval>;

  phoneForm: FormGroup = this.fb.group({
    phone: ['', [Validators.required, CustomValidators.phoneNumber()]]
  });

  otpForm: FormGroup = this.fb.group({
    otp: ['', [Validators.required, CustomValidators.otpCode()]]
  });

  passwordForm: FormGroup = this.fb.group({
    password: ['', [Validators.required, CustomValidators.strongPassword()]],
    confirmPassword: ['', [Validators.required]]
  });

  constructor() {
    this.passwordForm.get('password')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.updatePasswordStrength(value);
      });
  }

  isFieldInvalid(fieldName: string, form: FormGroup): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string, form: FormGroup): string {
    const field = form.get(fieldName);
    if (!field) return '';
    return getErrorMessage(field) || '';
  }

  formatPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');

    if (value.startsWith('225')) {
      value = value.slice(3);
    }

    if (value.length > 2) value = value.slice(0, 2) + ' ' + value.slice(2);
    if (value.length > 5) value = value.slice(0, 5) + ' ' + value.slice(5);
    if (value.length > 8) value = value.slice(0, 8) + ' ' + value.slice(8);
    if (value.length > 11) value = value.slice(0, 11) + ' ' + value.slice(11);
    if (value.length > 14) value = value.slice(0, 14);

    input.value = value;
    this.phoneForm.patchValue({ phone: value }, { emitEvent: false });
  }

  maskedPhone(): string {
    if (!this.phone) return '';
    const clean = this.phone.replace(/\s/g, '');
    return `+225 ${clean.slice(0, 2)} ** ** ** ${clean.slice(-2)}`;
  }

  // OTP input handling
  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');

    const digits = [...this.otpDigits()];
    digits[index] = value.slice(0, 1);
    this.otpDigits.set(digits);
    this.otpForm.patchValue({ otp: digits.join('') });

    // Auto-focus next input
    if (value && index < 5) {
      const inputs = document.querySelectorAll('.otp-input');
      (inputs[index + 1] as HTMLInputElement)?.focus();
    }
  }

  onOtpKeydown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;

    if (event.key === 'Backspace' && !input.value && index > 0) {
      const inputs = document.querySelectorAll('.otp-input');
      (inputs[index - 1] as HTMLInputElement)?.focus();
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const paste = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6);

    if (paste) {
      const digits = paste.split('');
      while (digits.length < 6) digits.push('');
      this.otpDigits.set(digits);
      this.otpForm.patchValue({ otp: paste });

      const inputs = document.querySelectorAll('.otp-input');
      inputs.forEach((input, i) => {
        (input as HTMLInputElement).value = digits[i];
      });

      // Focus last filled or first empty
      const focusIndex = Math.min(paste.length, 5);
      (inputs[focusIndex] as HTMLInputElement)?.focus();
    }
  }

  isOtpComplete(): boolean {
    return this.otpDigits().every(d => d !== '');
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  updatePasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength.set(0);
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    this.passwordStrength.set(Math.min(strength, 4));
  }

  getPasswordStrengthLabel(): string {
    const strength = this.passwordStrength();
    if (strength === 0) return '';
    if (strength === 1) return 'Faible';
    if (strength === 2) return 'Moyen';
    if (strength === 3) return 'Bon';
    return 'Fort';
  }

  passwordMismatch(): boolean {
    const password = this.passwordForm.get('password')?.value;
    const confirm = this.passwordForm.get('confirmPassword')?.value;
    return confirm && password !== confirm;
  }

  startResendTimer(): void {
    this.canResend.set(false);
    this.resendCountdown.set(60);

    if (this.resendTimer) clearInterval(this.resendTimer);

    this.resendTimer = setInterval(() => {
      this.resendCountdown.update(c => c - 1);
      if (this.resendCountdown() <= 0) {
        this.canResend.set(true);
        if (this.resendTimer) clearInterval(this.resendTimer);
      }
    }, 1000);
  }

  async submitPhone(): Promise<void> {
    if (this.phoneForm.invalid) return;

    this.error.set(null);
    this.isLoading.set(true);

    try {
      this.phone = this.phoneForm.value.phone.replace(/\s/g, '');
      await this.authService.requestPasswordReset(this.phone);
      this.currentStep.set('otp');
      this.startResendTimer();
    } catch (err: any) {
      this.error.set(err.message || 'Erreur lors de l\'envoi du code');
    } finally {
      this.isLoading.set(false);
    }
  }

  async submitOtp(): Promise<void> {
    if (!this.isOtpComplete()) return;

    this.error.set(null);
    this.isLoading.set(true);

    try {
      const otp = this.otpDigits().join('');
      const result = await this.authService.verifyResetOtp(this.phone, otp);
      this.resetToken = result.token;
      this.currentStep.set('password');
    } catch (err: any) {
      this.error.set(err.message || 'Code invalide');
    } finally {
      this.isLoading.set(false);
    }
  }

  async submitPassword(): Promise<void> {
    if (this.passwordForm.invalid || this.passwordMismatch()) return;

    this.error.set(null);
    this.isLoading.set(true);

    try {
      const password = this.passwordForm.value.password;
      await this.authService.resetPassword(this.resetToken, password);
      this.currentStep.set('success');
    } catch (err: any) {
      this.error.set(err.message || 'Erreur lors de la mise à jour');
    } finally {
      this.isLoading.set(false);
    }
  }

  async resendCode(): Promise<void> {
    this.error.set(null);
    this.isLoading.set(true);

    try {
      await this.authService.requestPasswordReset(this.phone);
      this.startResendTimer();
      // Reset OTP inputs
      this.otpDigits.set(['', '', '', '', '', '']);
      this.otpForm.reset();
    } catch (err: any) {
      this.error.set(err.message || 'Erreur lors du renvoi');
    } finally {
      this.isLoading.set(false);
    }
  }

  goBack(): void {
    const step = this.currentStep();
    if (step === 'phone') {
      this.router.navigate(['/auth/login']);
    } else if (step === 'otp') {
      this.currentStep.set('phone');
    } else if (step === 'password') {
      this.currentStep.set('otp');
    }
  }
}
