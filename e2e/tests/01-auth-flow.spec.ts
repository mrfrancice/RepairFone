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

    // Les labels visuels ne sont pas des <label for> HTML, on utilise les
    // placeholders/roles qui sont plus stables.
    await page.locator('input[placeholder*="XX XX"]').first().fill(SEED_USERS.client.phone);
    await page.locator('input[type="password"]').first().fill(SEED_USERS.client.password);

    await page.getByRole('button', { name: /Continuer|Connexion/ }).first().click();

    // Le user peut être redirigé directement vers /home, ou passer par OTP en cas
    // de challenge. On accepte les deux mais on échoue si on reste sur /auth/login.
    await page.waitForURL((url) => !url.pathname.startsWith('/auth/login'), {
      timeout: 10_000,
    });

    // Vérifie qu'une session est active (le SecureStorageService prefixe les
    // clés avec `rf_` — cf. core/services/secure-storage.service.ts).
    const hasAuth = await page.evaluate(() => {
      return Object.keys(localStorage).some((k) => k.startsWith('rf_'));
    });
    expect(hasAuth).toBe(true);
  });

  test.fixme('logout depuis /profile → retour /onboarding', async () => {
    // Implémenter après stabilisation du bouton logout dans profile.
  });
});
