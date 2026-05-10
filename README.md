# RepairFone

Plateforme de mise en relation entre clients et réparateurs de smartphones / ordinateurs en Côte d'Ivoire.

## 🏗 Stack

- **Frontend** : Angular 20 (standalone components + signals) · Tailwind CSS · Material Design 3 · PWA
- **Backend** : NestJS 11 · TypeORM · PostgreSQL 16 · JWT auth + refresh tokens
- **Infra** : Docker · GitHub Actions

## 📁 Structure

```
RepairFone/
├── backend/          # API NestJS + PostgreSQL
├── frontend/         # SPA Angular + PWA
├── docker-compose.yml
├── .github/workflows # CI : lint + build + test
└── ROADMAP.md        # Phases de développement
```

## 🚀 Démarrage rapide

### Pré-requis

- **Node.js 20+** et **npm 10+**
- **PostgreSQL 16+** (ou Docker)
- **Git**

### Option 1 — Tout-en-un avec Docker (recommandé)

```bash
# Cloner le repo
git clone https://github.com/mrfrancice/RepairFone.git
cd RepairFone

# Configurer les variables (au minimum JWT_SECRET et JWT_REFRESH_SECRET)
cp backend/.env.example backend/.env
# Éditer backend/.env avec vos valeurs

# Lancer postgres + backend + frontend
docker compose up -d --build

# L'app est accessible sur http://localhost:4200
# L'API sur http://localhost:3000/api/v1
```

### Option 2 — Dev local (hors Docker)

```bash
# Backend
cd backend
cp .env.example .env   # éditer DB_* et JWT_* au minimum
npm install
npm run start:dev      # http://localhost:3000

# Frontend (autre terminal)
cd frontend
npm install
npm start              # http://localhost:4200
```

## 🔐 Comptes de test (générés par les seeders au premier démarrage)

| Rôle | Téléphone | Mot de passe |
|---|---|---|
| Admin | `0700000000` | `Password123!` |
| Client | `0711111111` | `Password123!` |
| Réparateur | `0722222222` | `Password123!` |
| Réparateur | `0733333333` | `Password123!` |
| Réparateur | `0744444444` | `Password123!` |
| Réparateur | `0755555555` | `Password123!` |
| Expert | `0766666666` à `0799999999` | `Password123!` |

## 🛠 Commandes utiles

| Commande | Action |
|---|---|
| `docker compose up -d` | Démarrer tous les services |
| `docker compose logs -f backend` | Suivre les logs backend |
| `docker compose down -v` | Arrêter et supprimer les volumes (reset DB) |
| `cd backend && npm test` | Tests backend |
| `cd backend && npm run start:dev` | Dev backend (hot reload) |
| `cd frontend && npm test` | Tests frontend |
| `cd frontend && npm run build` | Build production frontend |

## 🩺 Health checks

- `GET /api/v1/health` — liveness (200 si l'app tourne)
- `GET /api/v1/health/db` — readiness (200 si DB répond, 503 sinon)

## 📚 Documentation

- API : Swagger UI sur `http://localhost:3000/api/docs` (en mode dev uniquement)
- Frontend : voir `frontend/README.md`
- Backend : voir `backend/README.md`
- Roadmap : voir [ROADMAP.md](./ROADMAP.md)

## 🤝 Contribuer

1. Forker le projet
2. Créer une branche depuis `RepairFoneDev` (`git checkout -b feature/ma-feature RepairFoneDev`)
3. Commits descriptifs (`feat:`, `fix:`, `chore:`, etc. — convention Conventional Commits)
4. Pousser et ouvrir une PR vers `RepairFoneDev`
5. Le CI doit passer (lint + build + tests)

## 📄 Licence

Privé — usage interne RepairFone.
