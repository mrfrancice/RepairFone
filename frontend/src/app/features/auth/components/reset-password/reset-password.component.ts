import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AppLogoComponent } from '../../../../shared/components/app-logo/app-logo.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AppLogoComponent],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-logo">
          <app-logo size="md" variant="gradient" />
        </div>

        @if (!token()) {
          <h1 class="auth-title">Lien invalide</h1>
          <p class="auth-subtitle">
            Le lien de réinitialisation est manquant ou incorrect.
            Demandez un nouveau lien depuis la page mot de passe oublié.
          </p>
          <a routerLink="/auth/forgot-password" class="btn btn-primary btn-block">
            Demander un nouveau lien
          </a>
        } @else if (success()) {
          <div class="success-icon">✅</div>
          <h1 class="auth-title">Mot de passe modifié</h1>
          <p class="auth-subtitle">
            Votre mot de passe a été mis à jour. Toutes vos sessions ont été
            déconnectées par sécurité.
          </p>
          <a routerLink="/auth/login" class="btn btn-primary btn-block">
            Se reconnecter
          </a>
        } @else {
          <h1 class="auth-title">Nouveau mot de passe</h1>
          <p class="auth-subtitle">
            Choisissez un nouveau mot de passe pour votre compte.
          </p>

          @if (error()) {
            <div class="alert alert-error">{{ error() }}</div>
          }

          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="form-group">
              <label for="password">Nouveau mot de passe</label>
              <input
                id="password"
                type="password"
                formControlName="password"
                placeholder="8 caractères minimum"
                class="form-input"
                [disabled]="loading()"
                autocomplete="new-password"
              />
              @if (form.controls.password.touched && form.controls.password.invalid) {
                <span class="field-error">
                  Le mot de passe doit contenir au moins 8 caractères.
                </span>
              }
            </div>

            <div class="form-group">
              <label for="confirm">Confirmer</label>
              <input
                id="confirm"
                type="password"
                formControlName="confirm"
                placeholder="Répétez le mot de passe"
                class="form-input"
                [disabled]="loading()"
                autocomplete="new-password"
              />
              @if (form.controls.confirm.touched && form.errors?.['mismatch']) {
                <span class="field-error">Les deux mots de passe ne correspondent pas.</span>
              }
            </div>

            <button
              type="submit"
              class="btn btn-primary btn-block"
              [disabled]="form.invalid || loading()"
            >
              @if (loading()) {
                Mise à jour...
              } @else {
                Mettre à jour
              }
            </button>
          </form>

          <p class="auth-footer">
            <a routerLink="/auth/login">← Retour à la connexion</a>
          </p>
        }
      </div>
    </div>
  `,
  styles: [`
    .auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem; background: #FAFAFA; }
    .auth-card { width: 100%; max-width: 420px; background: white; border-radius: 20px; padding: 2rem; box-shadow: 0 8px 30px rgba(0,0,0,0.08); }
    .auth-logo { display: flex; justify-content: center; margin-bottom: 1.5rem; }
    .auth-title { font-size: 1.5rem; font-weight: 700; color: #1f2937; margin-bottom: 0.5rem; text-align: center; }
    .auth-subtitle { color: #6b7280; font-size: 0.875rem; margin-bottom: 1.5rem; text-align: center; line-height: 1.5; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem; }
    .form-input { width: 100%; padding: 0.875rem; border: 2px solid #EEEEEE; border-radius: 12px; font-size: 0.9375rem; }
    .form-input:focus { outline: none; border-color: var(--color-primary-500, #FF9800); }
    .field-error { display: block; margin-top: 0.375rem; font-size: 0.75rem; color: #C62828; }
    .btn { display: block; width: 100%; padding: 0.875rem; border-radius: 12px; font-weight: 600; cursor: pointer; border: none; font-size: 0.9375rem; text-align: center; text-decoration: none; transition: all 0.2s; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-primary { background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825)); color: white; }
    .alert { padding: 0.75rem 1rem; border-radius: 10px; font-size: 0.875rem; margin-bottom: 1rem; }
    .alert-error { background: #FFEBEE; color: #C62828; }
    .success-icon { font-size: 3.5rem; text-align: center; margin-bottom: 1rem; }
    .auth-footer { margin-top: 1.5rem; text-align: center; font-size: 0.875rem; }
    .auth-footer a { color: var(--color-primary-500, #FF9800); text-decoration: none; }
    .auth-footer a:hover { text-decoration: underline; }
  `],
})
export class ResetPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly token = signal<string | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirm: ['', [Validators.required]],
    },
    { validators: [this.matchPasswords] },
  );

  ngOnInit(): void {
    this.token.set(this.route.snapshot.queryParamMap.get('token'));
  }

  matchPasswords(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirm = group.get('confirm')?.value;
    return password && confirm && password !== confirm ? { mismatch: true } : null;
  }

  async submit(): Promise<void> {
    const tk = this.token();
    if (!tk || this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.authService.resetPassword(tk, this.form.value.password!);
      this.success.set(true);
    } catch (err: any) {
      this.error.set(err?.error?.message || err?.message || 'Erreur réseau');
    } finally {
      this.loading.set(false);
    }
  }
}
