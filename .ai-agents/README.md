# 🤖 AI Agents - RepairFone v2.2

Collection complète d'agents IA spécialisés pour le développement du projet RepairFone (Angular 20 + NestJS 11).

## ✨ Fonctionnalités

- ✅ **9 agents spécialisés** couvrant tous les domaines
- ✅ **8 workflows prédéfinis** pour les tâches courantes
- ✅ **CLI complet** avec routage automatique
- ✅ **Export Markdown** des résultats
- ✅ **Review automatique** sur GitHub PRs
- ✅ **Documentation exhaustive** avec exemples

## 📁 Structure

```
.ai-agents/
├── agents/
│   ├── _meta/                        # Orchestration
│   │   ├── orchestrator.md           # Configuration projet
│   │   ├── routing-matrix.md         # Règles de routage
│   │   └── collaboration-protocols.md # Workflows multi-agents
│   ├── frontend/
│   │   ├── angular-expert.md         # Angular 20
│   │   └── ux-design-strategist.md   # UX/UI Design
│   ├── backend/
│   │   ├── nestjs-expert.md          # NestJS 11
│   │   └── database-expert.md        # TypeORM/PostgreSQL
│   ├── quality/
│   │   ├── code-reviewer.md          # Code Review
│   │   ├── test-strategist.md        # Tests
│   │   └── security-expert.md        # Sécurité OWASP
│   ├── operations/
│   │   └── devops-sre.md             # CI/CD, Docker
│   └── documentation/
│       └── technical-writer.md       # Documentation API
├── tools/
│   ├── agent-cli.js                  # CLI v2.2
│   └── package.json
├── examples/
│   └── EXAMPLES.md                   # Exemples pratiques
├── README.md
├── USAGE-GUIDE.md
├── ARCHITECTURE.md
└── INTEGRATION_REPORT.md
```

## 🚀 Installation

```bash
cd .ai-agents/tools
npm install

# Windows
set ANTHROPIC_API_KEY=sk-ant-api03-...

# Linux/Mac
export ANTHROPIC_API_KEY=sk-ant-api03-...
```

## 📖 Utilisation rapide

```bash
# Routage automatique
node agent-cli.js "Crée un composant de liste de réparations"

# Agent spécifique
node agent-cli.js --agent angular-expert "Crée un formulaire"
node agent-cli.js --agent nestjs-expert "Crée un endpoint"
node agent-cli.js --agent database-expert "Optimise la requête"
node agent-cli.js --agent security-expert "Audit l'auth"
node agent-cli.js --agent ux-design "Améliore l'UX"
node agent-cli.js --agent devops-sre "Configure CI/CD"
node agent-cli.js --agent technical-writer "Documente l'API"

# Review de fichier
node agent-cli.js --review ../frontend/src/app/features/auth/login.component.ts

# Workflow multi-agents
node agent-cli.js --workflow api "Crée une API de devis"

# Export résultat
node agent-cli.js --export resultat.md "Crée un composant"

# Mode interactif
node agent-cli.js --interactive

# Aide
node agent-cli.js --list
```

## 🤖 Agents

| Domaine | Agent | Spécialité |
|---------|-------|------------|
| Frontend | `angular-expert` | Components, Signals, Forms, Material |
| Frontend | `ux-design` | UX/UI, Accessibilité, Design System |
| Backend | `nestjs-expert` | Controllers, Services, Guards, WebSocket |
| Backend | `database-expert` | TypeORM, PostgreSQL, Migrations, Index |
| Quality | `code-reviewer` | Review, Conventions, Refactoring |
| Quality | `test-strategist` | Jasmine, Jest, Coverage, E2E |
| Quality | `security-expert` | OWASP, JWT, Stripe, Audit |
| Operations | `devops-sre` | CI/CD, Docker, Déploiement |
| Documentation | `technical-writer` | API docs, README, Guides |

## 📋 Workflows

| Workflow | Agents | Usage |
|----------|--------|-------|
| `feature` | angular → test → review | Feature Angular |
| `api` | nestjs → db → security → test | API NestJS |
| `secure-api` | + review finale | API sensible |
| `optimize` | db → test → review | Performance |
| `full-review` | review → security → test | Audit complet |
| `ux-feature` | ux → angular → test | Feature UX |
| `deploy` | devops → security | Déploiement |
| `document` | writer → review | Documentation |

## 🔄 GitHub Actions

Les PRs sont automatiquement reviewées avec audit sécurité si fichiers sensibles détectés.

**Configuration**: Ajouter `ANTHROPIC_API_KEY` dans GitHub Secrets.

## 📊 Couverture

| Domaine | Couverture |
|---------|------------|
| Frontend Angular | ████████████████████ 100% |
| Frontend UX/Design | ████████████████████ 100% |
| Backend NestJS | ████████████████████ 100% |
| Base de données | ████████████████████ 100% |
| Tests | ████████████████████ 100% |
| Sécurité | ████████████████████ 100% |
| Review | ████████████████████ 100% |
| DevOps/CI-CD | ████████████████████ 100% |
| Documentation | ████████████████████ 100% |

## 📚 Documentation

- **[USAGE-GUIDE.md](./USAGE-GUIDE.md)** - Guide d'utilisation complet
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture du système
- **[examples/EXAMPLES.md](./examples/EXAMPLES.md)** - Exemples pratiques
- **[INTEGRATION_REPORT.md](./INTEGRATION_REPORT.md)** - Rapport d'intégration

---

**Version**: 2.2.0  
**Dernière mise à jour**: 9 janvier 2026
