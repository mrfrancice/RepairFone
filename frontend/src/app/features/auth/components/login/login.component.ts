import { Component, inject, signal, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { AuthStore } from '../../../../core/stores/auth.store';
import { SecureStorageService, StorageKeys } from '../../../../core/services/secure-storage.service';
import { CustomValidators, getErrorMessage } from '../../../../shared/validators/custom-validators';
import { UiInputComponent, UiButtonComponent, UiAlertComponent, UiCheckboxComponent } from '@app/shared';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, UiInputComponent, UiButtonComponent, UiAlertComponent, UiCheckboxComponent],
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
          <ui-alert type="error" [dismissible]="false">
            {{ error() }}
          </ui-alert>
        }

        @if (successMessage()) {
          <ui-alert type="success" [dismissible]="false">
            {{ successMessage() }}
          </ui-alert>
        }

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="phone-label">Numéro de téléphone</label>
            <div class="phone-input-wrapper">
              <span class="country-code">+225</span>
              <ui-input
                type="tel"
                formControlName="phone"
                placeholder="07 XX XX XX XX"
                [error]="isFieldInvalid('phone') ? getFieldError('phone') : undefined"
                class="phone-input"
                aria-label="Numéro de téléphone"
              />
            </div>
          </div>

          <ui-input
            type="password"
            label="Mot de passe"
            formControlName="password"
            placeholder="Votre mot de passe"
            [error]="isFieldInvalid('password') ? getFieldError('password') : undefined"
            [required]="true"
          />

          <div class="form-options">
            <ui-checkbox
              formControlName="rememberMe"
              label="Se souvenir de moi"
              size="sm"
            />
            <a routerLink="/auth/forgot-password" class="forgot-link">Mot de passe oublié ?</a>
          </div>

          <ui-button
            type="submit"
            variant="primary"
            size="lg"
            [block]="true"
            [disabled]="loginForm.invalid"
            [loading]="isLoading()"
          >
            {{ isLoading() ? 'Connexion...' : 'Continuer' }}
          </ui-button>
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
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800) 0%, var(--color-primary-700, #F57C00) 100%);
    }

    .auth-card {
      background: var(--color-surface, white);
      border-radius: var(--border-radius-xl, 20px);
      padding: 2.5rem 2rem;
      width: 100%;
      max-width: 420px;
      box-shadow: var(--shadow-lg, 0 20px 60px rgba(0, 0, 0, 0.15));
    }

    .auth-logo {
      text-align: center;
      margin-bottom: 2rem;
    }

    .logo {
      display: inline-block;
      padding: 1rem 1.5rem;
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800) 0%, var(--color-primary-700, #F57C00) 100%);
      border-radius: var(--border-radius-lg, 16px);
      box-shadow: var(--shadow-md, 0 8px 20px rgba(0, 0, 0, 0.15));
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
      color: var(--color-text-primary, #1f2937);
      margin-bottom: 0.5rem;
      text-align: center;
    }

    .auth-subtitle {
      color: var(--color-text-secondary, #6b7280);
      text-align: center;
      margin-bottom: 2rem;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .phone-input-wrapper {
      position: relative;
    }

    .country-code {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-text-secondary, #6b7280);
      font-weight: 600;
      font-size: 0.9375rem;
      z-index: 1;
      pointer-events: none;
    }

    .phone-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-text-primary, #1f2937);
      margin-bottom: 0.5rem;
    }

    .phone-input-wrapper ::ng-deep .input-field {
      padding-left: 3.75rem;
    }

    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .form-options ::ng-deep ui-checkbox {
      flex-shrink: 0;
    }

    .form-options ::ng-deep .checkbox-wrapper {
      min-width: 32px;
      min-height: 32px;
    }

    .forgot-link {
      font-size: 0.875rem;
      color: var(--color-primary-500, #FF9800);
      text-decoration: none;
      font-weight: 500;
    }

    .forgot-link:hover {
      text-decoration: underline;
    }

    /* Les styles de boutons et alertes sont gérés par les composants partagés */

    .auth-footer {
      text-align: center;
      margin-top: 1.5rem;
      color: var(--color-text-secondary, #6b7280);
      font-size: 0.9375rem;
    }

    .create-account-link {
      display: inline-block;
      margin-top: 0.5rem;
      color: var(--color-primary-500, #FF9800);
      font-weight: 600;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: var(--border-radius-md, 8px);
      transition: all 0.2s;
    }

    .create-account-link:hover {
      background: var(--color-primary-50, #FFF3E0);
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
export class LoginComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly secureStorage = inject(SecureStorageService);
  private readonly destroy$ = new Subject<void>();

  readonly isLoading = this.authStore.isLoading;
  readonly error = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  loginForm: FormGroup = this.fb.group({
    phone: ['', [Validators.required, CustomValidators.phoneNumber()]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false]
  });

  async ngOnInit(): Promise<void> {
    const message = this.route.snapshot.queryParams['message'];
    if (message) {
      this.successMessage.set(message);
    }

    await this.loadRememberedPhone();
    this.setupPhoneFormatting();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupPhoneFormatting(): void {
    this.loginForm.get('phone')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        if (!value) return;
        const formatted = this.formatPhoneNumber(value);
        if (formatted !== value) {
          this.loginForm.patchValue({ phone: formatted }, { emitEvent: false });
        }
      });
  }

  private formatPhoneNumber(value: string): string {
    let cleanValue = value.replace(/\D/g, '');

    if (cleanValue.startsWith('225')) {
      cleanValue = cleanValue.slice(3);
    }

    let formatted = '';
    if (cleanValue.length > 0) {
      formatted = cleanValue.slice(0, 2);
    }
    if (cleanValue.length > 2) {
      formatted += ' ' + cleanValue.slice(2, 4);
    }
    if (cleanValue.length > 4) {
      formatted += ' ' + cleanValue.slice(4, 6);
    }
    if (cleanValue.length > 6) {
      formatted += ' ' + cleanValue.slice(6, 8);
    }
    if (cleanValue.length > 8) {
      formatted += ' ' + cleanValue.slice(8, 10);
    }

    return formatted;
  }

  private async loadRememberedPhone(): Promise<void> {
    try {
      const rememberedPhone = await this.secureStorage.get<string>(StorageKeys.REMEMBER_PHONE);
      if (rememberedPhone) {
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
      const cleanPhone = phone.replace(/\s/g, '');

      await this.authService.login(cleanPhone, password);

      if (rememberMe) {
        await this.secureStorage.set(StorageKeys.REMEMBER_PHONE, cleanPhone);
      } else {
        this.secureStorage.remove(StorageKeys.REMEMBER_PHONE);
      }

      const returnUrl = this.route.snapshot.queryParams['returnUrl'];
      if (returnUrl) {
        // Use navigateByUrl to handle URLs with query params correctly
        this.router.navigateByUrl(returnUrl);
      } else {
        const defaultUrl = this.authStore.getDefaultRedirectUrl();
        this.router.navigate([defaultUrl]);
      }
    } catch (err: any) {
      this.error.set(err.message || 'Identifiants incorrects');
      this.authStore.setLoading(false);
    }
  }
}
