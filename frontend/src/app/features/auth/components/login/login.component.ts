import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthStore } from '../../../../core/stores/auth.store';
import { SecureStorageService, StorageKeys } from '../../../../core/services/secure-storage.service';
import { CustomValidators, getErrorMessage } from '../../../../shared/validators/custom-validators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-logo">
          <div class="logo">
            <span class="logo-text">RepairFone</span>
          </div>
        </div>
        <h1 class="auth-title">Connexion</h1>
        <p class="auth-subtitle">Accédez à votre espace</p>

        @if (error()) {
          <div class="alert alert-error">
            <span class="alert-icon">!</span>
            {{ error() }}
          </div>
        }

        @if (successMessage()) {
          <div class="alert alert-success">
            <span class="alert-icon">OK</span>
            {{ successMessage() }}
          </div>
        }

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
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
                [class.input-error]="isFieldInvalid('phone')"
                (input)="formatPhoneInput($event)"
              />
            </div>
            @if (isFieldInvalid('phone')) {
              <span class="field-error">{{ getFieldError('phone') }}</span>
            }
          </div>

          <div class="form-group">
            <label for="password">Mot de passe</label>
            <div class="input-wrapper">
              <span class="input-icon">P</span>
              <input
                [type]="showPassword() ? 'text' : 'password'"
                id="password"
                formControlName="password"
                placeholder="Votre mot de passe"
                class="form-input with-icon"
                [class.input-error]="isFieldInvalid('password')"
              />
              <button
                type="button"
                class="toggle-password"
                (click)="togglePassword()"
                tabindex="-1"
              >
                {{ showPassword() ? 'Cacher' : 'Voir' }}
              </button>
            </div>
            @if (isFieldInvalid('password')) {
              <span class="field-error">{{ getFieldError('password') }}</span>
            }
          </div>

          <div class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="rememberMe" />
              <span class="checkbox-custom"></span>
              Se souvenir de moi
            </label>
            <a routerLink="/auth/forgot-password" class="forgot-link">Mot de passe oublié ?</a>
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-block"
            [disabled]="isLoading() || loginForm.invalid"
          >
            @if (isLoading()) {
              <span class="spinner"></span>
              Connexion...
            } @else {
              Continuer
            }
          </button>
        </form>

        <p class="auth-footer">
          Pas de compte ?
          <a routerLink="/auth/register" class="create-account-link">Créer un compte</a>
        </p>
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
      background: linear-gradient(135deg, #FF6B35 0%, #FF9800 100%);
    }

    .auth-card {
      background: white;
      border-radius: 20px;
      padding: 2.5rem 2rem;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 20px 60px rgba(255, 107, 53, 0.2);
    }

    .auth-logo {
      text-align: center;
      margin-bottom: 2rem;
    }

    .logo {
      display: inline-block;
      padding: 1rem 1.5rem;
      background: linear-gradient(135deg, #FF6B35 0%, #FF9800 100%);
      border-radius: 16px;
      box-shadow: 0 8px 20px rgba(255, 107, 53, 0.3);
    }

    .logo-text {
      font-size: 1.5rem;
      font-weight: 900;
      color: white;
      letter-spacing: -0.5px;
    }

    .auth-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 0.5rem;
      text-align: center;
    }

    .auth-subtitle {
      color: #6b7280;
      text-align: center;
      margin-bottom: 2rem;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
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
      font-weight: 600;
      font-size: 0.9375rem;
    }

    .form-input {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-size: 1rem;
      transition: all 0.2s;
      background: #f9fafb;
    }

    .form-input.with-prefix {
      padding-left: 3.75rem;
    }

    .form-input:focus {
      outline: none;
      border-color: #FF6B35;
      background: white;
      box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.1);
    }

    .form-input.input-error {
      border-color: #dc2626;
      background: #fef2f2;
    }

    .form-input.input-error:focus {
      box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.1);
    }

    .toggle-password {
      position: absolute;
      right: 1rem;
      background: none;
      border: none;
      color: #6b7280;
      cursor: pointer;
      font-size: 0.875rem;
      padding: 0;
    }

    .toggle-password:hover {
      color: #2563eb;
    }

    .field-error {
      display: block;
      color: #dc2626;
      font-size: 0.75rem;
      margin-top: 0.375rem;
    }

    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-size: 0.875rem;
      color: #4b5563;
      position: relative;
      padding-left: 1.75rem;
    }

    .checkbox-label input {
      position: absolute;
      opacity: 0;
    }

    .checkbox-custom {
      position: absolute;
      left: 0;
      width: 18px;
      height: 18px;
      border: 2px solid #d1d5db;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .checkbox-label input:checked ~ .checkbox-custom {
      background: #4CAF50;
      border-color: #4CAF50;
    }

    .checkbox-custom:after {
      content: '';
      position: absolute;
      display: none;
      left: 5px;
      top: 1px;
      width: 5px;
      height: 10px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }

    .checkbox-label input:checked ~ .checkbox-custom:after {
      display: block;
    }

    .forgot-link {
      font-size: 0.875rem;
      color: #FF6B35;
      text-decoration: none;
      font-weight: 500;
    }

    .forgot-link:hover {
      text-decoration: underline;
    }

    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      border-radius: 10px;
      font-weight: 600;
      font-size: 1rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: linear-gradient(135deg, #FF6B35 0%, #FF9800 100%);
      color: white;
      box-shadow: 0 4px 14px rgba(255, 107, 53, 0.4);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 107, 53, 0.5);
    }

    .btn-primary:disabled {
      opacity: 0.6;
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

    .alert {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border-radius: 10px;
      margin-bottom: 1.25rem;
    }

    .alert-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      font-size: 0.75rem;
      flex-shrink: 0;
    }

    .alert-error {
      background: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }

    .alert-error .alert-icon {
      background: #dc2626;
      color: white;
    }

    .alert-success {
      background: #f0fdf4;
      color: #166534;
      border: 2px solid #4CAF50;
    }

    .alert-success .alert-icon {
      background: #4CAF50;
      color: white;
    }

    .auth-footer {
      text-align: center;
      margin-top: 1.5rem;
      color: #6b7280;
      font-size: 0.9375rem;
    }

    .create-account-link {
      display: inline-block;
      margin-top: 0.5rem;
      color: #FF6B35;
      font-weight: 600;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      transition: all 0.2s;
    }

    .create-account-link:hover {
      background: #fff5f0;
    }

    @media (max-width: 480px) {
      .auth-card {
        padding: 2rem 1.5rem;
      }

      .logo-text {
        font-size: 1.25rem;
      }
    }
  `],
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly secureStorage = inject(SecureStorageService);

  readonly isLoading = this.authStore.isLoading;
  readonly error = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly showPassword = signal(false);

  loginForm: FormGroup = this.fb.group({
    phone: ['', [Validators.required, CustomValidators.phoneNumber()]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false]
  });

  async ngOnInit(): Promise<void> {
    // Check for success message from registration
    const message = this.route.snapshot.queryParams['message'];
    if (message) {
      this.successMessage.set(message);
    }

    // Load remembered phone number from secure storage
    await this.loadRememberedPhone();
  }

  private async loadRememberedPhone(): Promise<void> {
    try {
      const rememberedPhone = await this.secureStorage.get<string>(StorageKeys.REMEMBER_PHONE);
      if (rememberedPhone) {
        // Format the phone number for display (XX XX XX XX XX)
        let formatted = rememberedPhone;
        if (formatted.length === 10) {
          formatted = formatted.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
        }
        this.loginForm.patchValue({
          phone: formatted,
          rememberMe: true
        });
      }
    } catch (error) {
      console.error('Failed to load remembered phone:', error);
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (!field) return '';
    return getErrorMessage(field) || '';
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  formatPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');

    // Remove country code if present
    if (value.startsWith('225')) {
      value = value.slice(3);
    }

    // Format as XX XX XX XX XX
    if (value.length > 2) {
      value = value.slice(0, 2) + ' ' + value.slice(2);
    }
    if (value.length > 5) {
      value = value.slice(0, 5) + ' ' + value.slice(5);
    }
    if (value.length > 8) {
      value = value.slice(0, 8) + ' ' + value.slice(8);
    }
    if (value.length > 11) {
      value = value.slice(0, 11) + ' ' + value.slice(11);
    }

    // Limit to 14 chars (XX XX XX XX XX)
    if (value.length > 14) {
      value = value.slice(0, 14);
    }

    input.value = value;
    this.loginForm.patchValue({ phone: value }, { emitEvent: false });
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.error.set(null);
    this.successMessage.set(null);
    this.authStore.setLoading(true);

    try {
      const { phone, password, rememberMe } = this.loginForm.value;
      // Clean phone number
      const cleanPhone = phone.replace(/\s/g, '');

      await this.authService.login(cleanPhone, password);

      // Handle remember me with encrypted storage
      if (rememberMe) {
        await this.secureStorage.set(StorageKeys.REMEMBER_PHONE, cleanPhone);
      } else {
        this.secureStorage.remove(StorageKeys.REMEMBER_PHONE);
      }

      // Navigate to return URL or default based on role
      const returnUrl = this.route.snapshot.queryParams['returnUrl'];
      if (returnUrl) {
        this.router.navigate([returnUrl]);
      } else {
        // Redirect based on user role
        const defaultUrl = this.authStore.getDefaultRedirectUrl();
        this.router.navigate([defaultUrl]);
      }
    } catch (err: any) {
      this.error.set(err.message || 'Identifiants incorrects');
      this.authStore.setLoading(false);
    }
  }
}
