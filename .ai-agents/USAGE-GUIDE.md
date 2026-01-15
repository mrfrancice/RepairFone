# 📖 Guide d'Utilisation Complet - AI Agents RepairFone v2.1

## Table des matières

1. [Installation](#-installation)
2. [Configuration](#-configuration)
3. [Agents disponibles](#-agents-disponibles)
4. [Commandes CLI](#-commandes-cli)
5. [Workflows](#-workflows)
6. [Exemples pratiques](#-exemples-pratiques)
7. [Claude Projects](#-claude-projects)
8. [GitHub Actions](#-github-actions)
9. [Bonnes pratiques](#-bonnes-pratiques)
10. [Dépannage](#-dépannage)

---

## 🚀 Installation

### Prérequis

- Node.js 18+ ([nodejs.org](https://nodejs.org))
- Clé API Anthropic ([console.anthropic.com](https://console.anthropic.com))

### Setup rapide

```bash
# Depuis la racine du projet RepairFone
cd .ai-agents/tools
npm install
```

---

## ⚙️ Configuration

### Variable d'environnement

```bash
# Windows CMD
set ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx

# Windows PowerShell
$env:ANTHROPIC_API_KEY="sk-ant-api03-xxxxxxxxxxxxx"

# Linux/Mac
export ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
```

### Configuration permanente (recommandé)

Créer un fichier `.env` dans `.ai-agents/tools/` :

```env
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
```

---

## 🤖 Agents disponibles

### Vue d'ensemble

| Domaine | Agent | Description |
|---------|-------|-------------|
| **Frontend** | `angular-expert` | Components, Signals, Forms Angular 20 |
| **Frontend** | `ux-design` | UX/UI, Design System, Accessibilité |
| **Backend** | `nestjs-expert` | Controllers, Services, Guards NestJS 11 |
| **Backend** | `database-expert` | TypeORM, PostgreSQL, Migrations |
| **Quality** | `code-reviewer` | Review, Conventions, Refactoring |
| **Quality** | `test-strategist` | Tests Jasmine/Jest, Coverage |
| **Quality** | `security-expert` | OWASP, JWT, Stripe, Audit |
| **Operations** | `devops-sre` | CI/CD, Docker, Déploiement |

### Détail par agent

#### 🎨 Frontend

**`angular-expert`** - Expert Angular 20+
- Standalone Components
- Signals et computed()
- Control flow (@if, @for)
- Reactive Forms
- Angular Material + Tailwind

**`ux-design`** - UX Design Strategist
- Design System RepairFone
- Accessibilité WCAG 2.1
- Responsive mobile-first
- Parcours utilisateur

#### ⚙️ Backend

**`nestjs-expert`** - Expert NestJS 11+
- Controllers REST
- Services et DTOs
- Guards et Interceptors
- WebSocket Gateways
- Swagger documentation

**`database-expert`** - Expert Base de données
- Entités TypeORM
- Migrations
- Optimisation requêtes
- Index et performance

#### ✅ Quality

**`code-reviewer`** - Code Reviewer Senior
- Review selon conventions
- Détection code smells
- Suggestions refactoring

**`test-strategist`** - Expert Tests
- Tests Jasmine (Angular)
- Tests Jest (NestJS)
- Tests E2E
- Coverage

**`security-expert`** - Expert Sécurité
- OWASP Top 10
- JWT et authentification
- Sécurité paiements Stripe
- Audit vulnérabilités

#### 🚀 Operations

**`devops-sre`** - DevOps/SRE
- GitHub Actions CI/CD
- Docker et Docker Compose
- Configuration Nginx
- Monitoring

---

## 💻 Commandes CLI

### Syntaxe générale

```bash
node agent-cli.js [OPTIONS] [REQUÊTE]
```

### Options

| Option | Description |
|--------|-------------|
| `--agent <id>` | Utiliser un agent spécifique |
| `--review <file>` | Review un fichier |
| `--workflow <type>` | Exécuter un workflow multi-agents |
| `--interactive` | Mode conversation |
| `--list` | Lister agents et workflows |
| `--help` | Afficher l'aide |

### Exemples de commandes

```bash
# Routage automatique (le CLI choisit l'agent)
node agent-cli.js "Crée un composant de carte de réparation"

# Agent spécifique
node agent-cli.js --agent angular-expert "Crée un formulaire de demande"
node agent-cli.js --agent nestjs-expert "Crée un endpoint de validation de devis"
node agent-cli.js --agent database-expert "Optimise cette requête SQL"
node agent-cli.js --agent security-expert "Audit l'authentification JWT"
node agent-cli.js --agent ux-design "Améliore l'UX de ce formulaire"
node agent-cli.js --agent devops-sre "Configure le pipeline CI/CD"

# Review de fichier
node agent-cli.js --review ../frontend/src/app/features/auth/login.component.ts
node agent-cli.js --review ../backend/src/modules/payments/payment.service.ts

# Workflow multi-agents
node agent-cli.js --workflow feature "Crée un module de notifications"
node agent-cli.js --workflow api "Crée une API de gestion des avis"
node agent-cli.js --workflow secure-api "Crée une API de paiement Stripe"

# Mode interactif
node agent-cli.js --interactive

# Aide
node agent-cli.js --list
```

---

## 📋 Workflows

### Workflows disponibles

| Workflow | Agents | Usage |
|----------|--------|-------|
| `feature` | angular → test → review | Nouvelle feature Angular |
| `api` | nestjs → db → security → test | Nouvelle API NestJS |
| `secure-api` | + review finale | API sensible (paiements) |
| `optimize` | db → test → review | Optimisation performance |
| `full-review` | review → security → test | Audit complet |
| `ux-feature` | ux → angular → test | Feature avec focus UX |
| `deploy` | devops → security | Préparation déploiement |

### Utilisation

```bash
# Syntaxe
node agent-cli.js --workflow <type> "<requête>"

# Exemples
node agent-cli.js --workflow feature "Crée un dashboard réparateur avec stats"
node agent-cli.js --workflow api "Crée une API de gestion des disputes"
node agent-cli.js --workflow secure-api "Intègre Stripe pour les paiements"
node agent-cli.js --workflow optimize "Optimise les requêtes de recherche"
```

---

## 💡 Exemples pratiques

### Frontend Angular

```bash
# Composant avec Signals
node agent-cli.js --agent angular-expert "Crée un composant RepairCard:
- Input: repair (id, title, status, date, amount)
- Badge de status coloré
- Bouton voir détails
- Utilise Signals et Tailwind"

# Formulaire réactif
node agent-cli.js --agent angular-expert "Crée CreateRequestForm:
- Sélection appareil (mat-select avec recherche)
- Description (textarea avec compteur)
- Upload photos (max 5, preview)
- Urgence (radio buttons)
- Validation complète avec messages"

# Service avec state
node agent-cli.js --agent angular-expert "Crée NotificationService:
- State avec BehaviorSubject
- WebSocket pour temps réel
- Méthodes: getAll, markAsRead, markAllAsRead
- Compteur non-lus"
```

### Backend NestJS

```bash
# Controller REST
node agent-cli.js --agent nestjs-expert "Crée QuotesController:
- GET /quotes (liste paginée avec filtres)
- GET /quotes/:id
- POST /quotes (réparateur crée devis)
- PUT /quotes/:id/accept (client accepte)
- PUT /quotes/:id/reject
- Documentation Swagger complète"

# Service métier
node agent-cli.js --agent nestjs-expert "Crée DisputeService:
- openDispute(paymentId, reason)
- resolveDispute(id, resolution)
- getDisputesByUser(userId)
- Notifications automatiques"

# WebSocket
node agent-cli.js --agent nestjs-expert "Crée ChatGateway:
- Auth JWT sur connexion
- Rooms par conversation
- sendMessage avec persistence
- Typing indicator
- Read receipts"
```

### Base de données

```bash
# Optimisation requête
node agent-cli.js --agent database-expert "Optimise:
SELECT r.*, u.first_name, u.last_name, d.model
FROM requests r
JOIN users u ON r.user_id = u.id
JOIN devices d ON r.device_id = d.id
WHERE r.status = 'pending'
ORDER BY r.created_at DESC
LIMIT 20"

# Nouvelle entité
node agent-cli.js --agent database-expert "Crée l'entité Dispute:
- id (uuid)
- payment_id (relation)
- reason (enum)
- status (enum: open, investigating, resolved)
- resolution_notes (text nullable)
- created_at, updated_at, resolved_at"

# Migration
node agent-cli.js --agent database-expert "Crée migration pour:
- Ajouter colonne average_rating sur repairers
- Index sur requests(user_id, status)
- Contrainte check sur quotes(amount > 0)"
```

### Sécurité

```bash
# Audit endpoint
node agent-cli.js --agent security-expert "Audit ce PaymentController:
[coller le code]"

# Vérification auth
node agent-cli.js --agent security-expert "Vérifie la sécurité de l'auth:
- Login avec rate limiting
- JWT refresh token rotation
- Password reset flow
- Logout et invalidation"
```

### UX Design

```bash
# Amélioration formulaire
node agent-cli.js --agent ux-design "Améliore l'UX du formulaire de demande:
- Progressive disclosure
- Validation temps réel
- États loading/success/error
- Accessibilité"

# Design parcours
node agent-cli.js --agent ux-design "Design le parcours de paiement:
- Étapes claires
- Récapitulatif avant paiement
- Confirmation et next steps"
```

### DevOps

```bash
# Pipeline CI/CD
node agent-cli.js --agent devops-sre "Configure GitHub Actions:
- Lint + Tests frontend
- Lint + Tests backend
- Build Docker images
- Deploy staging automatique"

# Docker
node agent-cli.js --agent devops-sre "Crée docker-compose.yml:
- PostgreSQL avec volume
- Redis pour sessions
- Backend NestJS
- Frontend Angular (Nginx)
- Adminer pour dev"
```

---

## 🌐 Claude Projects

Alternative sans CLI - utilisation via claude.ai.

### Configuration

1. Aller sur [claude.ai](https://claude.ai)
2. Créer un nouveau **Project** "RepairFone Dev"
3. Dans "Project Knowledge", uploader :
   - `agents/frontend/angular-expert.md`
   - `agents/backend/nestjs-expert.md`
   - `agents/quality/*.md`
   - `agents/operations/devops-sre.md`
4. Commencer à coder avec contexte automatique

### Avantages

- ✅ Pas d'installation
- ✅ Interface web conviviale
- ✅ Historique des conversations
- ✅ Partage avec l'équipe

---

## 🔄 GitHub Actions

Review automatique des PRs.

### Configuration

1. GitHub → Settings → Secrets → Actions
2. Ajouter `ANTHROPIC_API_KEY`

### Fonctionnement

- Déclenché sur chaque PR touchant `*.ts`
- Review code automatique
- Audit sécurité si fichiers sensibles
- Commentaire posté sur la PR

### Personnalisation

Modifier `.github/workflows/ai-review.yml` pour :
- Changer les fichiers surveillés
- Ajuster le nombre de fichiers reviewés
- Modifier le format des commentaires

---

## ✨ Bonnes pratiques

### 1. Contexte riche

```bash
# ❌ Trop vague
node agent-cli.js "Crée un formulaire"

# ✅ Contexte complet
node agent-cli.js --agent angular-expert "Crée CreateQuoteForm pour réparateur:
- Inputs: amount, description, estimated_days
- Validation: amount > 0, description min 20 chars
- Submit désactivé si invalide
- Loading state pendant soumission"
```

### 2. Itération

```bash
# 1. Créer le code
node agent-cli.js --agent angular-expert "Crée QuoteListComponent"

# 2. Créer les tests
node agent-cli.js --agent test-strategist "Tests pour QuoteListComponent"

# 3. Review
node agent-cli.js --agent code-reviewer "Review QuoteListComponent"
```

### 3. Workflows pour les features complètes

```bash
# Plutôt que 3 commandes séparées, utiliser un workflow
node agent-cli.js --workflow feature "Crée un module de favoris"
```

### 4. Review systématique

```bash
# Avant chaque commit important
node agent-cli.js --review ./path/to/file.ts
```

---

## ❓ Dépannage

### Erreurs courantes

| Erreur | Solution |
|--------|----------|
| `ANTHROPIC_API_KEY non définie` | Configurer la variable d'environnement |
| `Agent inconnu: xxx` | Vérifier avec `--list` |
| `Fichier non trouvé` | Utiliser chemin relatif depuis `tools/` |
| `Rate limit exceeded` | Attendre quelques secondes, réessayer |
| `Réponse tronquée` | Diviser la requête en parties |

### Debug

```bash
# Mode verbose
DEBUG=true node agent-cli.js "requête"

# Tester la connexion API
node -e "const A = require('@anthropic-ai/sdk').default; new A().messages.create({model:'claude-sonnet-4-20250514',max_tokens:10,messages:[{role:'user',content:'test'}]}).then(r=>console.log('OK')).catch(e=>console.log('Error:',e.message))"
```

### Support

- Documentation Anthropic: [docs.anthropic.com](https://docs.anthropic.com)
- API Reference: [docs.anthropic.com/en/api](https://docs.anthropic.com/en/api)

---

## 📁 Structure complète

```
.ai-agents/
├── agents/
│   ├── _meta/
│   │   ├── orchestrator.md           # Configuration et routage
│   │   ├── routing-matrix.md         # Matrice de décision
│   │   └── collaboration-protocols.md # Protocoles multi-agents
│   ├── frontend/
│   │   ├── angular-expert.md         # Angular 20
│   │   └── ux-design-strategist.md   # UX/UI
│   ├── backend/
│   │   ├── nestjs-expert.md          # NestJS 11
│   │   └── database-expert.md        # TypeORM/PostgreSQL
│   ├── quality/
│   │   ├── code-reviewer.md          # Review
│   │   ├── test-strategist.md        # Tests
│   │   └── security-expert.md        # Sécurité
│   └── operations/
│       └── devops-sre.md             # CI/CD, Docker
├── tools/
│   ├── agent-cli.js                  # CLI v2.1
│   └── package.json
├── README.md
├── USAGE-GUIDE.md                    # Ce fichier
└── INTEGRATION_REPORT.md
```

---

**Version**: 2.1.0  
**Dernière mise à jour**: 9 janvier 2026
