# 🤖 Guide Claude Code - AI Agents RepairFone

## Utilisation rapide

### Charger un agent spécifique

Copiez-collez ces commandes dans Claude Code :

---

### 🎨 Frontend - Angular Expert

```
Lis E:\angular_project\RepairFone\.ai-agents\agents\frontend\angular-expert.md et utilise ce contexte.

Puis : [VOTRE DEMANDE]
```

**Exemples :**
- "Crée un composant RepairCardComponent avec Signals"
- "Crée un formulaire de création de demande multi-étapes"
- "Crée un service de notifications avec WebSocket"

---

### ⚙️ Backend - NestJS Expert

```
Lis E:\angular_project\RepairFone\.ai-agents\agents\backend\nestjs-expert.md et utilise ce contexte.

Puis : [VOTRE DEMANDE]
```

**Exemples :**
- "Crée un module CRUD pour les favoris"
- "Crée un WebSocket Gateway pour le chat"
- "Intègre Stripe pour les paiements"

---

### 🗄️ Database Expert

```
Lis E:\angular_project\RepairFone\.ai-agents\agents\backend\database-expert.md et utilise ce contexte.

Puis : [VOTRE DEMANDE]
```

**Exemples :**
- "Optimise cette requête SQL qui prend 3 secondes"
- "Crée l'entity Favorite avec relations"
- "Crée une migration pour ajouter la table reviews"

---

### 🔒 Security Expert

```
Lis E:\angular_project\RepairFone\.ai-agents\agents\quality\security-expert.md et utilise ce contexte.

Puis : [VOTRE DEMANDE]
```

**Exemples :**
- "Audit le système d'authentification"
- "Vérifie la sécurité du PaymentController"
- "Analyse les vulnérabilités OWASP"

---

### 🧪 Test Strategist

```
Lis E:\angular_project\RepairFone\.ai-agents\agents\quality\test-strategist.md et utilise ce contexte.

Puis : [VOTRE DEMANDE]
```

**Exemples :**
- "Crée les tests pour RepairCardComponent"
- "Crée les tests E2E du flux de paiement"
- "Génère les tests du FavoritesService"

---

### ✅ Code Reviewer

```
Lis E:\angular_project\RepairFone\.ai-agents\agents\quality\code-reviewer.md et utilise ce contexte.

Puis : Review le fichier [CHEMIN DU FICHIER]
```

---

### 🚀 DevOps SRE

```
Lis E:\angular_project\RepairFone\.ai-agents\agents\operations\devops-sre.md et utilise ce contexte.

Puis : [VOTRE DEMANDE]
```

**Exemples :**
- "Crée le pipeline CI/CD GitHub Actions"
- "Crée le docker-compose de production"

---

### 📚 Technical Writer

```
Lis E:\angular_project\RepairFone\.ai-agents\agents\documentation\technical-writer.md et utilise ce contexte.

Puis : [VOTRE DEMANDE]
```

**Exemples :**
- "Documente l'API Payments en OpenAPI"
- "Crée le README du module Chat"

---

## 🔄 Workflow Multi-Agents avec Validation

Pour un workflow complet avec orchestration et validation :

```
Lis ces fichiers dans l'ordre :
1. E:\angular_project\RepairFone\.ai-agents\agents\_meta\orchestrator.md
2. E:\angular_project\RepairFone\.ai-agents\agents\_meta\collaboration-protocols.md

Tu es maintenant l'Orchestrator du projet RepairFone.

Pour la demande suivante, exécute ce workflow :
- Agents : nestjs-expert → database-expert → security-expert → test-strategist
- Pour chaque agent, lis son fichier .md et exécute sa tâche
- Valide chaque output (score /5)
- Si score < 4, demande des corrections avant de passer au suivant
- Vérifie la cohérence entre les agents

DEMANDE : Crée une API de gestion des favoris
```

---

## 📝 Workflow prêts à copier-coller

### Workflow API Backend

```
Tu es l'Orchestrator RepairFone. Exécute ce workflow API :

1. Lis E:\angular_project\RepairFone\.ai-agents\agents\backend\nestjs-expert.md
   → Crée le Controller et Service
   → Valide (score /5), corrige si < 4

2. Lis E:\angular_project\RepairFone\.ai-agents\agents\backend\database-expert.md  
   → Crée l'Entity et Migration
   → Vérifie cohérence avec l'étape 1
   → Valide, corrige si nécessaire

3. Lis E:\angular_project\RepairFone\.ai-agents\agents\quality\security-expert.md
   → Audit sécurité du code produit
   → Valide, corrige si vulnérabilités

4. Lis E:\angular_project\RepairFone\.ai-agents\agents\quality\test-strategist.md
   → Crée les tests
   → Valide la couverture

DEMANDE : [VOTRE DEMANDE ICI]
```

### Workflow Feature Frontend

```
Tu es l'Orchestrator RepairFone. Exécute ce workflow Feature :

1. Lis E:\angular_project\RepairFone\.ai-agents\agents\frontend\angular-expert.md
   → Crée le composant/service
   → Valide (score /5), corrige si < 4

2. Lis E:\angular_project\RepairFone\.ai-agents\agents\quality\test-strategist.md
   → Crée les tests unitaires
   → Valide la couverture

3. Lis E:\angular_project\RepairFone\.ai-agents\agents\quality\code-reviewer.md
   → Review le code produit
   → Suggère des améliorations

DEMANDE : [VOTRE DEMANDE ICI]
```

---

## 🎯 Exemples complets

### Exemple 1 : Créer une API de favoris

```
Tu es l'Orchestrator RepairFone.

Lis E:\angular_project\RepairFone\.ai-agents\agents\_meta\orchestrator.md pour le contexte projet.

Exécute le workflow API avec validation :

1. nestjs-expert : Crée FavoritesController et FavoritesService
2. database-expert : Crée l'entity Favorite avec contrainte unique
3. security-expert : Audit sécurité (ownership check)
4. test-strategist : Tests unitaires et E2E

Pour chaque étape :
- Lis le fichier agent correspondant
- Exécute la tâche
- Auto-évalue (score /5)
- Si < 4, corrige avant de continuer
- Vérifie la cohérence avec les étapes précédentes

DEMANDE : API REST pour gérer les favoris d'un utilisateur
- POST /favorites (ajouter un réparateur en favori)
- GET /favorites (liste de mes favoris)
- DELETE /favorites/:repairerId (retirer des favoris)
```

### Exemple 2 : Review de code

```
Lis E:\angular_project\RepairFone\.ai-agents\agents\quality\code-reviewer.md

Puis lis et review ce fichier :
E:\angular_project\RepairFone\backend\src\modules\payments\payment.service.ts

Donne un score /5 et liste les améliorations.
```

### Exemple 3 : Optimisation DB

```
Lis E:\angular_project\RepairFone\.ai-agents\agents\backend\database-expert.md

Optimise cette requête qui prend 3 secondes :

SELECT r.*, u.first_name, u.last_name,
  (SELECT COUNT(*) FROM quotes q WHERE q.request_id = r.id) as quote_count
FROM requests r
LEFT JOIN users u ON r.user_id = u.id  
WHERE r.status IN ('pending', 'quoted')
ORDER BY r.created_at DESC
LIMIT 50
```

---

## ⚡ Raccourci : Fichier de contexte global

Pour charger tout le contexte d'un coup :

```
Lis tous les fichiers de E:\angular_project\RepairFone\.ai-agents\agents\_meta\ pour comprendre le projet RepairFone.

Puis agis comme l'Orchestrator et aide-moi à : [VOTRE DEMANDE]
```

---

## 📁 Structure des fichiers agents

```
E:\angular_project\RepairFone\.ai-agents\
├── agents\
│   ├── _meta\
│   │   ├── orchestrator.md          ← Contexte projet global
│   │   ├── routing-matrix.md        ← Règles de routage
│   │   └── collaboration-protocols.md ← Protocoles validation
│   ├── frontend\
│   │   ├── angular-expert.md        ← Angular 20
│   │   └── ux-design-strategist.md  ← UX/UI
│   ├── backend\
│   │   ├── nestjs-expert.md         ← NestJS 11
│   │   └── database-expert.md       ← TypeORM/PostgreSQL
│   ├── quality\
│   │   ├── code-reviewer.md         ← Review
│   │   ├── test-strategist.md       ← Tests
│   │   └── security-expert.md       ← Sécurité
│   ├── operations\
│   │   └── devops-sre.md            ← CI/CD
│   └── documentation\
│       └── technical-writer.md      ← Documentation
```
