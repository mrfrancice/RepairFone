# Tests E2E RepairFone (Playwright)

Suite de tests bout-en-bout pour valider les parcours principaux de l'application.

## Installation (une fois)

```bash
cd e2e
npm install
npx playwright install --with-deps chromium webkit
```

> `--with-deps` installe les dépendances système Linux. Sur Windows, omettez `--with-deps`.

## Prérequis avant de lancer un run

1. **Base de données** seedée :
   ```bash
   cd backend
   npm run seed
   ```
2. **Backend** lancé sur `http://localhost:3000` :
   ```bash
   cd backend
   npm run start:dev
   ```
3. **Frontend** lancé sur `http://localhost:4200` :
   ```bash
   cd frontend
   npm start
   ```

## Lancer les tests

```bash
# Tous les tests, headless
npm test

# Avec UI Playwright (mode debug interactif)
npm run test:ui

# Avec navigateur visible
npm run test:headed

# Un seul fichier
npx playwright test tests/01-auth-flow.spec.ts

# Un seul projet (ex: chromium uniquement)
npx playwright test --project=chromium
```

## Comptes seedés utilisés (cf. `fixtures/users.ts`)

| Rôle       | Téléphone     | Mot de passe   |
|------------|---------------|----------------|
| Admin      | `0700000000`  | `Password123!` |
| Client     | `0711111111`  | `Password123!` |
| Réparateur | `0722222222`  | `Password123!` |

## État des parcours

| # | Parcours                          | État            |
|---|-----------------------------------|-----------------|
| 1 | Auth (anonyme + login + logout)   | ✅ partiel (anonyme + login client OK, logout à scripter) |
| 2 | Client : nouvelle demande         | ⏳ `test.fixme` |
| 3 | Réparateur : envoi de devis       | ⏳ `test.fixme` |
| 4 | Paiement + reçu PDF               | ⏳ `test.fixme` |
| 5 | Chat client/réparateur            | ⏳ `test.fixme` |
| 6 | Smoke navigation (routes principales) | ✅ 4 tests : onboarding, login, client (/home, /notifications, /quotes, /payments, /chat), repairer (/repairer) |

Les tests `fixme` sont des squelettes documentant le scénario à scripter — ils
ne sont **pas** exécutés tant qu'ils n'ont pas été convertis en `test(...)`.

**État de la suite** : 6 tests actifs (6 PASS, 5 fixme skipped) en ~15 sec sur chromium.

## Stratégie

- **Sériel par défaut** (`workers: 1`, `fullyParallel: false`) parce que
  plusieurs parcours partagent l'état utilisateur seedé. Pour paralléliser, il
  faudra créer des users dédiés par worker.
- **Pas de webServer auto** dans `playwright.config.ts` : on veut garder les
  watchers backend/frontend actifs et voir leurs logs.
- **Trace et vidéo** uniquement à l'échec pour ne pas saturer le disque.
- **Locale `fr-FR`** + **timezone Abidjan** : les tests doivent être
  reproductibles indépendamment du fuseau de la machine.

## Avant d'ajouter un test

1. Ajoute des `data-testid` aux éléments visés côté Angular (plus stable que
   les sélecteurs CSS ou de texte qui changent au gré des copies).
2. Utilise `page.getByTestId(...)` plutôt que `page.locator(...)`.
3. Si le test dépend d'un état DB précis, prépare-le via l'API backend
   plutôt que via l'UI (plus rapide et déterministe).
