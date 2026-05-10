# RepairFone — API Backend

API REST NestJS pour la plateforme RepairFone.

## 🛠 Stack

- **NestJS 11** + TypeScript
- **PostgreSQL 16** + TypeORM
- **JWT** access + refresh tokens
- **Helmet** + **CORS** + rate limiting (Throttler)
- **Swagger** documentation auto-générée

## 📦 Installation

```bash
npm install
cp .env.example .env  # Renseigner toutes les variables
```

### Variables d'environnement (`.env`)

| Variable | Description | Défaut |
|---|---|---|
| `NODE_ENV` | `development` ou `production` | `development` |
| `PORT` | Port de l'API | `3000` |
| `API_PREFIX` | Préfixe global des routes | `api/v1` |
| `DB_HOST` | Hôte PostgreSQL | `localhost` |
| `DB_PORT` | Port PostgreSQL | `5432` |
| `DB_USERNAME` | Utilisateur DB | `postgres` |
| `DB_PASSWORD` | Mot de passe DB | — (requis) |
| `DB_DATABASE` | Nom de la DB | `fastRepair_bd` |
| `JWT_SECRET` | Secret signature access token | — (requis, ≥ 32 chars) |
| `JWT_EXPIRATION` | Durée de vie access token | `15m` |
| `JWT_REFRESH_SECRET` | Secret signature refresh token | — (requis, ≥ 32 chars) |
| `JWT_REFRESH_EXPIRATION` | Durée de vie refresh token | `7d` |
| `OTP_EXPIRATION_MINUTES` | Durée de vie OTP | `5` |
| `OTP_MAX_ATTEMPTS` | Nb max tentatives OTP | `3` |
| `SMS_PROVIDER` | `mock` / `twilio` / `orange` | `mock` |
| `ALLOWED_ORIGINS` | Origines CORS (séparées virgule) | `http://localhost:4200` |

## 🚀 Lancement

```bash
npm run start:dev      # mode dev avec hot reload
npm run start:debug    # avec debugger
npm run build          # compile dans dist/
npm run start:prod     # exécute dist/main.js
```

Au premier démarrage, les seeders créent automatiquement les comptes de test, devices et services. Voir [README racine](../README.md#comptes-de-test).

## 🧪 Tests

```bash
npm test               # tests unitaires
npm run test:watch     # mode watch
npm run test:cov       # couverture
npm run test:e2e       # tests end-to-end
```

État actuel : 4 specs (auth, requests, payments, quotes) — couverture à étoffer (cf. ROADMAP P2.1).

## 🌐 Documentation API

Swagger UI disponible en mode dev sur **`http://localhost:3000/api/docs`**.

## 🩺 Health checks

- `GET /api/v1/health` — liveness probe
- `GET /api/v1/health/db` — readiness probe (ping DB)

## 📁 Architecture

```
src/
├── common/           # Guards, interceptors, decorators, audit, health
├── config/           # Configuration TypeORM, env validation
├── database/         # Seeders auto-exécutés au boot
├── modules/          # 14 modules métier (auth, users, requests, quotes, ...)
└── main.ts           # Bootstrap
```

## 🔒 Sécurité

- **Authentication** : JWT Bearer dans header `Authorization`
- **Authorization** : décorateur `@Roles(UserRole.X)` + `RolesGuard`
- **Rate limiting** : 100 req/60s par défaut (override par endpoint via `@Throttle`)
- **Validation** : `ValidationPipe` global avec whitelist + forbidNonWhitelisted
- **CORS** : strict en prod (`ALLOWED_ORIGINS`), permissif en dev

## 🐳 Docker

```bash
docker build -t repairfone-api .
docker run -p 3000:3000 --env-file .env repairfone-api
```

Ou via le `docker-compose.yml` à la racine du projet.
