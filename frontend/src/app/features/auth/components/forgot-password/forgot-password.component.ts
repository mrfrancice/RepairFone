import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AppLogoComponent } from '../../../../shared/components/app-logo/app-logo.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AppLogoComponent],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-logo">
          <app-logo size="md" variant="gradient" />
        </div>

        @if (!sent()) {
          <h1 class="auth-title">Mot de passe oublié</h1>
          <p class="auth-subtitle">
            Entrez votre téléphone ou votre email. Nous vous enverrons un lien
            pour définir un nouveau mot de passe.
          </p>

          @if (error()) {
            <div class="alert alert-error">{{ error() }}</div>
          }

          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="form-group">
              <label for="identifier">Téléphone ou email</label>
              <input
                id="identifier"
                type="text"
                formControlName="identifier"
                placeholder="0711111111 ou nom@exemple.com"
                class="form-input"
                [disabled]="loading()"
                autocomplete="username"
              />
            </div>

            <button
              type="submit"
              class="btn btn-primary btn-block"
              [disabled]="form.invalid || loading()"
            >
              @if (loading()) {
                Envoi en cours...
              } @else {
                Envoyer le lien
              }
            </button>
          </form>

          <p class="auth-footer">
            <a routerLink="/auth/login">← Retour à la connexion</a>
          </p>
        } @else {
          <!-- État succès : message générique pour ne pas leaker l'existence du compte -->
          <div class="success-icon">✉️</div>
          <h1 class="auth-title">Vérifiez votre boîte mail</h1>
          <p class="auth-subtitle">
            Si un compte existe avec ces informations, un lien de réinitialisation
            vient d'être envoyé. Il expire dans 1 heure.
          </p>

          @if (devToken()) {
            <div class="alert alert-info dev-banner">
              <strong>[DEV ONLY]</strong> Token retourné par l'API :
              <a [href]="'/auth/reset-password?token=' + devToken()" class="dev-link">
                Ouvrir le lien de reset
              </a>
            </div>
          }

          <a routerLink="/auth/login" class="btn btn-outline btn-block">
            Retour à la connexion
          </a>
        }
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      padding: 1rem; background: #FAFAFA;
    }
    .auth-card {
      width: 100%; max-width: 420px;
      background: white; border-radius: 20px;
      padding: 2rem;
      box-shadow: 0 8px 30px rgba(0,0,0,0.08);
    }
    .auth-logo { display: flex; justify-content: center; margin-bottom: 1.5rem; }
    .auth-title { font-size: 1.5rem; font-weight: 700; color: #1f2937; margin-bottom: 0.5rem; text-align: center; }
    .auth-subtitle { color: #6b7280; font-size: 0.875rem; margin-bottom: 1.5rem; text-align: center; line-height: 1.5; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem; }
    .form-input {
      width: 100%; padding: 0.875rem;
      border: 2px solid #EEEEEE; border-radius: 12px;
      font-size: 0.9375rem;
    }
    .form-input:focus { outline: none; border-color: var(--color-primary-500, #FF9800); }

    .btn { display: block; width: 100%; padding: 0.875rem; border-radius: 12px; font-weight: 600; cursor: pointer; border: none; font-size: 0.9375rem; text-align: center; text-decoration: none; transition: all 0.2s; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-primary { background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825)); color: white; }
    .btn-outline { background: white; border: 2px solid #EEEEEE; color: #374151; }
    .btn-block { width: 100%; }

    .alert { padding: 0.75rem 1rem; border-radius: 10px; font-size: 0.875rem; margin-bottom: 1rem; }
    .alert-error { background: #FFEBEE; color: #C62828; }
    .alert-info { background: #E3F2FD; color: #1565C0; }
    .dev-banner { font-size: 0.8125rem; word-break: break-all; }
    .dev-link { color: #FF6F00; font-weight: 600; display: block; margin-top: 0.5rem; }

    .success-icon { font-size: 3.5rem; text-align: center; margin-bottom: 1rem; }
    .auth-footer { margin-top: 1.5rem; text-align: center; font-size: 0.875rem; }
    .auth-footer a { color: var(--color-primary-500, #FF9800); text-decoration: none; }
    .auth-footer a:hover { text-decoration: underline; }
  `],
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly form = this.fb.nonNullable.group({
    identifier: ['', [Validators.required, Validators.minLength(4)]],
  });

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly sent = signal(false);
  readonly devToken = signal<string | null>(null);

  async submit(): Promise<void> {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.authService.requestPasswordReset(this.form.value.identifier!);
      this.sent.set(true);
      if (result.devToken) this.devToken.set(result.devToken);
    } catch (err: any) {
      this.error.set(err?.error?.message || err?.message || 'Erreur réseau');
    } finally {
      this.loading.set(false);
    }
  }
}
