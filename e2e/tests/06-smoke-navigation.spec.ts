import { test, expect } from '@playwright/test';
import { SEED_USERS } from '../fixtures/users';

/**
 * Smoke navigation : verifie que chaque ecran principal charge sans erreur
 * console critique et avec le bon document title. Ne couvre PAS les flows
 * metier — juste l'integration routing + lazy-loading + injection des
 * composants migres (refactor domains-driven).
 *
 * Tres rapide et stable : pas de submit form, pas de wait sur reseau,
 * juste navigation + assert title + 0 erreur console.
 */
test.describe('06 — Smoke navigation (routes principales)', () => {
  // Listener errors capture sur chaque page
  const ignoredConsoleErrors = [
    /X-Frame-Options may only be set via an HTTP header/, // meta retiree mais le warning peut reapparaitre, non bloquant
    /Failed to load resource.*X-Frame-Options/,
  ];

  async function withConsoleAssertion(page: import('@playwright/test').Page, fn: () => Promise<void>) {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      if (ignoredConsoleErrors.some((re) => re.test(text))) return;
      errors.push(text);
    });
    await fn();
    expect(errors, `console errors detected:\n${errors.join('\n')}`).toEqual([]);
  }

  test('public : /onboarding charge avec le titre attendu', async ({ page }) => {
    await withConsoleAssertion(page, async () => {
      await page.goto('/onboarding');
      await expect(page).toHaveTitle(/Bienvenue|RepairFone/);
    });
  });

  test('public : /auth/login charge sans erreur', async ({ page }) => {
    await withConsoleAssertion(page, async () => {
      await page.goto('/auth/login');
      await expect(page).toHaveTitle(/Connexion/);
      // Verifie la presence du formulaire (input phone et password)
      await expect(page.locator('input[placeholder*="XX XX"]').first()).toBeVisible();
      await expect(page.locator('input[type="password"]').first()).toBeVisible();
    });
  });

  test('authentifie client : /home + /notifications + /quotes + /payments + /chat chargent', async ({ page }) => {
    // Login d'abord (reutilise le pattern du parcours 01)
    await page.goto('/auth/login');
    await page.locator('input[placeholder*="XX XX"]').first().fill(SEED_USERS.client.phone);
    await page.locator('input[type="password"]').first().fill(SEED_USERS.client.password);
    await page.getByRole('button', { name: /Continuer|Connexion/ }).first().click();
    await page.waitForURL((url) => !url.pathname.startsWith('/auth/login'), { timeout: 10_000 });

    // Smoke navigation
    const routes = [
      { url: '/home', titleRe: /Accueil/ },
      { url: '/notifications', titleRe: /Notifications/ },
      { url: '/quotes', titleRe: /RepairFone/ }, // titre generique acceptable
      { url: '/payments', titleRe: /RepairFone/ },
      { url: '/chat', titleRe: /RepairFone/ },
    ];

    for (const { url, titleRe } of routes) {
      await page.goto(url);
      await expect(page, `page title at ${url}`).toHaveTitle(titleRe);
    }
  });

  test('authentifie repairer : /repairer (dashboard) charge', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('input[placeholder*="XX XX"]').first().fill(SEED_USERS.repairer.phone);
    await page.locator('input[type="password"]').first().fill(SEED_USERS.repairer.password);
    await page.getByRole('button', { name: /Continuer|Connexion/ }).first().click();

    await page.waitForURL(/\/repairer/, { timeout: 10_000 });
    // /repairer/requests est la destination par defaut post-login repairer
    await expect(page).toHaveTitle(/Demandes|Tableau de bord|RepairFone Pro/);
  });
});
