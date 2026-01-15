# 💡 Exemples d'utilisation - AI Agents RepairFone

Collection d'exemples pratiques pour chaque agent et workflow.

---

## 🎨 Frontend - Angular Expert

### Créer un composant avec Signals

```bash
node agent-cli.js --agent angular-expert "Crée un composant RepairCard:
- Input: repair avec id, title, status, date, amount, repairer
- Badge de status coloré (pending=jaune, in_progress=bleu, completed=vert)
- Avatar du réparateur
- Boutons: Voir détails, Contacter réparateur
- Animation hover
- Utilise Signals, Tailwind et Angular Material"
```

### Créer un formulaire réactif complet

```bash
node agent-cli.js --agent angular-expert "Crée CreateRequestForm:
- Étape 1: Sélection appareil (mat-select avec recherche)
- Étape 2: Description problème (textarea 500 chars max)
- Étape 3: Photos (drag & drop, max 5, preview)
- Étape 4: Urgence + Localisation
- Navigation entre étapes avec validation
- Submit avec loading state"
```

### Créer un service avec state management

```bash
node agent-cli.js --agent angular-expert "Crée NotificationService:
- State: notifications[], unreadCount, isLoading
- BehaviorSubject pour le state
- WebSocket pour temps réel
- Méthodes: loadAll(), markAsRead(id), markAllAsRead()
- Gestion erreurs avec retry"
```

---

## ⚙️ Backend - NestJS Expert

### Créer un module CRUD complet

```bash
node agent-cli.js --agent nestjs-expert "Crée le module Disputes:
- Entity: id, payment_id, reason, status, resolution, timestamps
- DTOs: CreateDisputeDto, UpdateDisputeDto
- Controller REST complet
- Service avec pagination
- Guards: ownership check
- Swagger documentation"
```

### Créer un WebSocket Gateway

```bash
node agent-cli.js --agent nestjs-expert "Crée ChatGateway:
- Namespace: /chat
- Auth JWT sur handleConnection
- Events: joinConversation, sendMessage, typing, markRead
- Broadcast vers rooms
- Persistance via ChatService"
```

### Intégrer Stripe

```bash
node agent-cli.js --agent nestjs-expert "Crée PaymentService avec Stripe:
- createPaymentIntent(quoteId, userId)
- handleWebhook(event)
- getPaymentStatus(paymentId)
- refundPayment(paymentId, reason)
- Idempotence pour webhooks"
```

---

## 🗄️ Backend - Database Expert

### Optimiser une requête lente

```bash
node agent-cli.js --agent database-expert "Optimise cette requête qui prend 2s:

SELECT r.*, u.first_name, u.last_name, d.brand, d.model,
       (SELECT COUNT(*) FROM quotes q WHERE q.request_id = r.id) as quote_count
FROM requests r
LEFT JOIN users u ON r.user_id = u.id
LEFT JOIN devices d ON r.device_id = d.id
WHERE r.status IN ('pending', 'quoted')
ORDER BY r.created_at DESC
LIMIT 50"
```

### Créer une migration complexe

```bash
node agent-cli.js --agent database-expert "Crée une migration pour:
1. Table 'favorites' (user_id, repairer_id, created_at)
2. Colonne 'average_rating' sur 'repairers'
3. Trigger pour mettre à jour average_rating
4. Index appropriés"
```

---

## ✅ Quality - Code Reviewer

### Review d'un fichier

```bash
node agent-cli.js --review ../frontend/src/app/features/requests/request-list.component.ts
```

### Review avec export

```bash
node agent-cli.js --review ../backend/src/modules/payments/payment.service.ts --export review-payment.md
```

---

## 🧪 Quality - Test Strategist

### Générer des tests composant

```bash
node agent-cli.js --agent test-strategist "Crée les tests pour RepairCardComponent:
- Affiche les données correctement
- Badge couleur selon status
- Bouton 'Voir détails' émet event
- Loading state
- Gestion erreur"
```

### Tests E2E

```bash
node agent-cli.js --agent test-strategist "Crée tests E2E flux de paiement:
1. Login client
2. Aller sur demande avec devis
3. Payer avec Stripe test
4. Vérifier confirmation
Utilise Cypress"
```

---

## 🔒 Quality - Security Expert

### Audit authentification

```bash
node agent-cli.js --agent security-expert "Audit complet du système d'auth:
- Login email/password
- JWT access + refresh tokens
- Rate limiting
- Vérifie OWASP, brute force, token leakage"
```

### Audit endpoint

```bash
node agent-cli.js --agent security-expert "Audit ce PaymentController:

@Post('intent')
@UseGuards(JwtAuthGuard)
async createIntent(@Request() req, @Body() dto: CreateIntentDto) {
  const quote = await this.quoteService.findOne(dto.quoteId);
  return this.paymentService.createIntent(quote.amount, req.user.id);
}"
```

---

## 🚀 Operations - DevOps SRE

### Pipeline CI/CD

```bash
node agent-cli.js --agent devops-sre "Crée workflow GitHub Actions:
- Trigger: push main/develop, PR
- Jobs: lint, test, build parallèles
- PostgreSQL pour tests backend
- Build Docker images
- Deploy staging auto"
```

### Docker Compose production

```bash
node agent-cli.js --agent devops-sre "Crée docker-compose.prod.yml:
- PostgreSQL persistant
- Redis cache
- Backend (2 replicas)
- Frontend Nginx SSL
- Healthchecks"
```

---

## 📚 Documentation - Technical Writer

### Documenter une API

```bash
node agent-cli.js --agent technical-writer "Documente l'API Quotes:
- POST /quotes
- GET /quotes/:id
- PUT /quotes/:id/accept
- PUT /quotes/:id/reject
Format OpenAPI avec exemples"
```

### Créer un README

```bash
node agent-cli.js --agent technical-writer "Crée README pour module Chat:
- Description fonctionnelle
- Architecture
- Installation
- Exemples client
- Events WebSocket"
```

---

## 🎨 UX Design

### Améliorer un formulaire

```bash
node agent-cli.js --agent ux-design "Améliore l'UX du formulaire de demande:
- Progressive disclosure
- Validation temps réel
- États loading/success/error
- Accessibilité WCAG 2.1"
```

### Parcours utilisateur

```bash
node agent-cli.js --agent ux-design "Design le parcours de paiement:
- Étapes claires avec progress
- Récapitulatif avant paiement
- Confirmation avec next steps
- Gestion erreurs"
```

---

## 📋 Workflows multi-agents

### Feature complète

```bash
node agent-cli.js --workflow feature "Système de favoris:
- Liste réparateurs favoris
- Bouton ajouter/retirer
- Compteur sur profil"
```

### API sécurisée

```bash
node agent-cli.js --workflow secure-api "API de gestion des litiges:
- Client ouvre litige
- Admin résout
- Notifications"
```

### Optimisation

```bash
node agent-cli.js --workflow optimize "Optimise recherche réparateurs:
- Requête 3s actuellement
- Filtres multiples
- Pagination 20/page"
```

### Documentation

```bash
node agent-cli.js --workflow document "Documente le module Payment:
- API endpoints
- Flux Stripe
- Webhooks
- Exemples"
```

---

## 💾 Export des résultats

```bash
# Export simple
node agent-cli.js --export composant.md "Crée un composant de filtres"

# Export workflow
node agent-cli.js --workflow api --export api-disputes.md "API disputes"

# Export review
node agent-cli.js --review ../backend/src/auth.service.ts --export review-auth.md
```

---

## 🔄 Mode interactif

```bash
node agent-cli.js --interactive

# Commandes disponibles:
@angular-expert     # Changer d'agent
/list               # Voir agents
/workflow api ...   # Lancer workflow
/export fichier.md  # Export prochaine réponse
/help               # Aide
exit                # Quitter
```

### Session exemple

```
You: @angular-expert
✅ Agent: Angular Expert

You: Crée un badge de notification
[... réponse ...]

You: /export badge.md

You: Ajoute animation pulse
[... réponse exportée vers badge.md ...]

You: @test-strategist
✅ Agent: Test Strategist

You: Tests pour ce badge
[... réponse ...]

You: exit
👋 Au revoir!
```

---

## 📁 Scripts batch (exemples)

### review-all.sh - Review tous les fichiers modifiés

```bash
#!/bin/bash
cd .ai-agents/tools

for file in $(git diff --name-only HEAD~1 | grep '\.ts$' | grep -v '\.spec\.ts$'); do
  echo "Reviewing: $file"
  node agent-cli.js --review "../../$file" --export "reviews/$(basename $file .ts)-review.md"
done
```

### generate-docs.sh - Générer documentation

```bash
#!/bin/bash
cd .ai-agents/tools

node agent-cli.js --workflow document --export ../docs/api-auth.md "Documente module Auth"
node agent-cli.js --workflow document --export ../docs/api-payments.md "Documente module Payments"
node agent-cli.js --workflow document --export ../docs/api-requests.md "Documente module Requests"
```
