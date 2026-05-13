# `features/` — Pages routées (présentation pure)

Chaque dossier de premier niveau correspond à une **route** ou à un **groupe d'audience**.

## Organisation cible (post-Phase 3)

```
features/
├── onboarding/          # avant connexion
├── auth-pages/          # login, register, OTP, forgot-password
├── home/                # dashboard d'accueil (selon rôle)
├── search/              # recherche réparateur (visiteurs + clients)
├── conseils/            # marketplace conseils
├── legal/               # CGU, mentions légales, RGPD
│
├── client/              # pages exclusives client (rôle CLIENT)
│   ├── requests/        # création + liste demandes
│   ├── tracking/        # suivi en cours
│   └── payments/        # historique paiements
│
├── repairer/            # pages exclusives réparateur (rôle REPAIRER)
│   ├── dashboard/
│   ├── requests/        # demandes reçues
│   └── quotes/          # créer/gérer devis
│
├── common/              # pages utilisées par les 2 rôles
│   ├── chat/
│   ├── profile/
│   └── notifications/
│
└── admin/               # back-office admin
```

## Règles de dépendance

| Peut importer | Ne peut PAS importer |
|---|---|
| `domains/*` (logique métier) | Une autre `feature/` (sauf modèles parent/enfant) |
| `core/` | |
| `shared/` | |

## Critère "feature ou pas ?"

Un dossier va dans `features/` s'il représente une **page routée** ou un **assemblage**
de composants/pages métier. Une feature consomme `domains/` mais ne contient pas
elle-même de logique d'accès données ni de définitions de types métier réutilisables.

Si du code dans une feature semble réutilisable par une autre feature → il doit migrer
vers `domains/` ou `shared/`.
