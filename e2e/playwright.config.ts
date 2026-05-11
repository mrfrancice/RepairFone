import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config pour RepairFone.
 *
 * Prérequis :
 *   1. Backend NestJS lancé sur http://localhost:3000/api/v1 (`npm run start:dev` dans backend/)
 *   2. Frontend Angular lancé sur http://localhost:4200 (`npm start` dans frontend/)
 *   3. Base de données seedée (`npm run seed` dans backend/)
 *
 * Le test runner ne démarre PAS le serveur (volontaire — vous voulez voir
 * les logs back/front pendant le run et garder les watchers actifs).
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // certains parcours partagent l'état (auth, requests)
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // sérialise pour éviter les courses sur le seed partagé
  reporter: process.env.CI ? [['github'], ['html']] : 'html',

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'fr-FR',
    timezoneId: 'Africa/Abidjan',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Mobile Safari pour valider le rendu mobile (cible primaire RepairFone)
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
});
