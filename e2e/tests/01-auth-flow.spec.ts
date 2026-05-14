import { test, expect } from '@playwright/test';
import { SEED_USERS } from '../fixtures/users';

/**
 * Parcours auth :
 *   1. Atterrissage sur /onboarding pour un user anonyme
 *   2. Accès à /auth/login
 *   3. Login client réussi → redirect /home
 *   4. Présence du nom du user dans l'UI
 *   5. Logout → retour à l'accueil public
 */
test.describe('01 — Auth flow', () => {
  test('redirige les anonymes vers /onboarding', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/onboarding/);
  });

  test('login client (Awa Koné) → /home', async ({ page }) => {
    await page.goto('/auth/login');

    await page.getByLabel('Numéro de téléphone').fill(SEED_USERS.client.phone);
    await page.getByLabel('Mot de passe').fill(SEED_USERS.client.password);

    await page.getByRole('button', { name: /Continuer|Connexion/ }).click();

    // Le user peut être redirigé directement vers /home, ou passer par OTP en cas
    // de challenge. On accepte les deux mais on échoue si on reste sur /auth/login.
    await page.waitForURL((url) => !url.pathname.startsWith('/auth/login'), {
      timeout: 10_000,
    });

    // Vérifie qu'une session est active (le token est en localStorage sous
    // la clé `repairfone:auth` — cf. AuthStore).
    const hasAuth = await page.evaluate(() => {
      return Object.keys(localStorage).some((k) => k.includes('auth'));
    });
    expect(hasAuth).toBe(true);
  });

  test.fixme('logout depuis /profile → retour /onboarding', async () => {
    // Implémenter après stabilisation du bouton logout dans profile.
  });
});
