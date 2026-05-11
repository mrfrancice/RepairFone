import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AppLogoComponent } from '../../../../shared/components/app-logo/app-logo.component';

/**
 * Page atterrissage du lien "Vérifier mon email" envoyé par email.
 * Lit ?token= dans l'URL, l'envoie au backend, affiche le résultat.
 */
@Component({
  selector: 'app-verify-email',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, AppLogoComponent],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-logo">
          <app-logo size="md" variant="gradient" />
        </div>

        @if (loading()) {
          <div class="state">
            <div class="spinner"></div>
            <p>Vérification en cours...</p>
          </div>
        } @else if (success()) {
          <div class="success-icon">✅</div>
          <h1 class="auth-title">Email vérifié</h1>
          <p class="auth-subtitle">
            Votre adresse <strong>{{ verifiedEmail() }}</strong> est maintenant vérifiée.
            Vous pouvez recevoir nos notifications par email.
          </p>
          <a routerLink="/home" class="btn btn-primary btn-block">Aller à l'accueil</a>
        } @else {
          <div class="error-icon">❌</div>
          <h1 class="auth-title">Vérification impossible</h1>
          <p class="auth-subtitle">{{ error() }}</p>
          <a routerLink="/profile" class="btn btn-outline btn-block">
            Renvoyer un email de vérification
          </a>
        }
      </div>
    </div>
  `,
  styles: [`
    .auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem; background: #FAFAFA; }
    .auth-card { width: 100%; max-width: 420px; background: white; border-radius: 20px; padding: 2rem; box-shadow: 0 8px 30px rgba(0,0,0,0.08); text-align: center; }
    .auth-logo { display: flex; justify-content: center; margin-bottom: 1.5rem; }
    .auth-title { font-size: 1.5rem; font-weight: 700; color: #1f2937; margin-bottom: 0.5rem; }
    .auth-subtitle { color: #6b7280; font-size: 0.875rem; margin-bottom: 1.5rem; line-height: 1.5; }
    .success-icon, .error-icon { font-size: 3.5rem; margin-bottom: 1rem; }
    .state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 2rem 0; color: #6b7280; }
    .spinner { width: 48px; height: 48px; border: 4px solid #FFE5D9; border-top-color: var(--color-primary-500, #FF9800); border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .btn { display: block; width: 100%; padding: 0.875rem; border-radius: 12px; font-weight: 600; cursor: pointer; border: none; font-size: 0.9375rem; text-decoration: none; }
    .btn-primary { background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825)); color: white; }
    .btn-outline { background: white; border: 2px solid #EEEEEE; color: #374151; }
  `],
})
export class VerifyEmailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  readonly loading = signal(true);
  readonly success = signal(false);
  readonly error = signal<string>('Lien invalide ou expiré.');
  readonly verifiedEmail = signal<string>('');

  async ngOnInit(): Promise<void> {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.loading.set(false);
      this.error.set('Aucun token de vérification fourni dans le lien.');
      return;
    }
    try {
      const result = await this.authService.verifyEmail(token);
      this.verifiedEmail.set(result.email);
      this.success.set(true);
    } catch (err: any) {
      this.error.set(err?.error?.message || err?.message || 'Erreur lors de la vérification.');
    } finally {
      this.loading.set(false);
    }
  }
}
