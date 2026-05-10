# RepairFone — Frontend

Application web Angular 20 pour la plateforme RepairFone (clients, réparateurs, admin).

## 🛠 Stack

- **Angular 20** standalone components + signals + lazy-loading
- **Tailwind CSS** + **Material Design 3**
- **PWA** (service worker, manifest, offline-ready)
- **Signals** pour le state management (pas de NgRx)
- **TypeScript 5.9**

## 📦 Installation

```bash
npm install
```

## 🚀 Lancement

```bash
npm start              # dev sur http://localhost:4200 (avec proxy.conf.json vers le backend)
npm run build          # build prod dans dist/
npm run watch          # build dev avec watch mode
```

## 🧪 Tests

```bash
npm test               # Karma + Jasmine, ChromeHeadless
```

État actuel : 2 specs squelettes (`auth.store`, `ui-data-grid`) — couverture à étoffer.

## 📁 Structure

```
src/app/
├── core/               # Stores, services, guards, interceptors globaux
│   ├── stores/         # AuthStore, BaseListStore
│   ├── services/       # api, logger, toast, geolocation, secure-storage, ...
│   ├── guards/         # authGuard, adminGuard, ...
│   └── interceptors/   # auth, error, refresh-token
├── shared/
│   ├── components/     # 36 composants UI réutilisables (ui-*)
│   ├── pipes/          # initials, format-date
│   ├── directives/     # infinite-scroll, autofocus, ...
│   └── services/       # status-labels, ...
├── features/           # 18 features lazy-loadées
│   ├── auth/           # login, register, otp, forgot-password
│   ├── home/           # accueil
│   ├── requests/       # demandes de réparation
│   ├── quotes/         # devis
│   ├── payment/        # paiements
│   ├── disputes/       # litiges
│   ├── conseils/       # conseils experts
│   ├── chat/           # messagerie
│   ├── notifications/  # notifications + settings
│   ├── profile/        # profil utilisateur
│   ├── reviews/        # avis & évaluations
│   ├── admin/          # back-office (users + repairers verification)
│   ├── repairer/       # espace réparateur
│   ├── search/         # recherche réparateurs
│   ├── tracking/       # suivi de réparation
│   ├── legal/          # CGU / privacy
│   └── onboarding/     # slides d'introduction
├── styles/             # Design tokens, thème, layouts
└── environments/       # Configuration par environnement
```

## 🎨 Design system

Tout passe par les composants partagés `<ui-*>` dans `src/app/shared/components/`. Les principaux :

- **`<ui-header>`** : header sombre unifié avec slots (header-icon, header-extras, header-center, header-actions). Hauteur design 166px (variable `--header-height`).
- **`<ui-data-grid>`** + **`<ui-data-grid-column>`** : tableau réutilisable avec pagination (10 par défaut), tri, mode serveur/client, drawer, content-projection via `<ng-template let-row>`.
- **`<ui-card>`**, **`<ui-button>`**, **`<ui-tabs>`**, **`<ui-badge>`**, **`<ui-modal>`**, etc.

Voir [`README_DESIGN_SYSTEM.md`](./README_DESIGN_SYSTEM.md) pour le détail.

## 🔐 Auth & rôles

3 rôles : `client`, `repairer`, `admin`.

Guards principaux (cf. `src/app/core/guards/`) :
- `authGuard` : authentification requise (redirige vers `/auth/login`)
- `adminGuard` : admin seulement
- `noAdminGuard` : interdit aux admins
- `clientOnlyGuard` : interdit aux réparateurs

## 🌍 Variables d'environnement

`src/environments/environment.ts` :

```ts
{
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  wsUrl: 'http://localhost:3000',
  api: { maxLimit: 100, defaultPageSize: 10 },
  firebase: { ... }
}
```

⚠️ Les valeurs Firebase sont des placeholders — à renseigner si tu utilises Firebase Auth.

## 🐳 Docker

```bash
docker build -t repairfone-web .
docker run -p 4200:80 repairfone-web
```

L'image utilise nginx en runtime avec proxy `/api/` vers le backend (cf. `nginx.conf`).

## 📱 PWA

- Service worker actif en production (`ngsw-config.json`)
- Manifest dans `public/manifest.webmanifest`
- Mode hors-ligne basique (les pages déjà visitées restent accessibles)
