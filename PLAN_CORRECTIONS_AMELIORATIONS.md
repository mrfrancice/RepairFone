# Plan de Corrections et Améliorations - RepairFone

**Date**: 7 Janvier 2026
**Version**: 1.0
**Statut actuel**: 6.9/10 - Pré-production

---

## Vue d'ensemble des Phases

| Phase | Focus | Durée | Priorité |
|-------|-------|-------|----------|
| Phase 1 | Sécurité Critique | 1 semaine | 🔴 CRITIQUE |
| Phase 2 | Qualité Code | 1 semaine | 🟠 HAUTE |
| Phase 3 | Fonctionnalités Manquantes | 2 semaines | 🟡 MOYENNE |
| Phase 4 | UX/UI & Performance | 2 semaines | 🟢 NORMALE |
| Phase 5 | Production & DevOps | 1 semaine | 🟢 NORMALE |

**Durée totale estimée**: 7 semaines

---

## PHASE 1: Sécurité Critique (Semaine 1)

### 1.1 Correction Refresh Token 🔴
**Fichier**: `backend/src/modules/auth/auth.service.ts`
**Problème**: Utilise `bcrypt.hash()` au lieu de `bcrypt.compare()`

```typescript
// AVANT (CASSÉ)
const isValidToken = await bcrypt.hash(storedToken, 12) === storedToken;

// APRÈS (CORRIGÉ)
const isValidToken = await bcrypt.compare(refreshToken, user.refreshToken);
```

**Tâches**:
- [ ] Corriger la validation du refresh token
- [ ] Ajouter tests unitaires pour le flux de refresh
- [ ] Tester le cycle complet: login → access expire → refresh → nouveau token

---

### 1.2 Secrets JWT Sécurisés 🔴
**Fichier**: `backend/src/config/configuration.ts`

**Tâches**:
- [ ] Supprimer les valeurs par défaut hardcodées
- [ ] Ajouter validation au démarrage (throw si secrets manquants)
- [ ] Créer fichier `.env.example` avec toutes les variables requises
- [ ] Documenter la génération de secrets sécurisés

```typescript
// Validation au démarrage
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters');
}
```

---

### 1.3 Intégration SMS Provider 🔴
**Fichier**: `backend/src/modules/auth/auth.service.ts`

**Options recommandées**:
1. **Twilio** (international, fiable)
2. **Orange SMS API** (local Côte d'Ivoire)
3. **AWS SNS** (scalable)

**Tâches**:
- [ ] Choisir provider SMS
- [ ] Créer `SmsService` dans `backend/src/common/services/`
- [ ] Implémenter envoi OTP réel
- [ ] Ajouter gestion des erreurs SMS
- [ ] Configurer templates SMS en français
- [ ] Ajouter rate limiting spécifique OTP

```typescript
// Structure SmsService
@Injectable()
export class SmsService {
  async sendOtp(phone: string, code: string): Promise<boolean>;
  async sendNotification(phone: string, message: string): Promise<boolean>;
}
```

---

### 1.4 Validation Variables d'Environnement 🔴
**Fichier**: `backend/src/config/configuration.ts`

**Tâches**:
- [ ] Créer schéma de validation avec Joi ou class-validator
- [ ] Valider toutes les variables au démarrage
- [ ] Logger warnings pour variables optionnelles manquantes
- [ ] Bloquer démarrage si variables critiques absentes

```typescript
// Variables critiques (blocage si absentes)
const requiredVars = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'DATABASE_URL',
  'SMS_API_KEY'
];

// Variables optionnelles (warning si absentes)
const optionalVars = [
  'SMTP_HOST',
  'MAPBOX_API_KEY'
];
```

---

### 1.5 Audit Sécurité Endpoints 🟠
**Fichiers**: Tous les controllers

**Tâches**:
- [ ] Vérifier ownership sur tous les GET par ID
- [ ] Vérifier autorisation sur tous les PATCH/PUT/DELETE
- [ ] Ajouter guards manquants
- [ ] Documenter matrice d'autorisation

| Endpoint | Auth | Owner Check | Admin |
|----------|------|-------------|-------|
| GET /requests/:id | ✅ | ✅ | ✅ |
| PATCH /requests/:id | ✅ | ✅ | ❌ |
| GET /quotes/:id | ✅ | ✅ | ✅ |
| ... | ... | ... | ... |

---

## PHASE 2: Qualité Code (Semaine 2)

### 2.1 Suite de Tests Unitaires 🟠
**Cible**: 60% coverage minimum

**Tâches**:
- [ ] Tests AuthService (login, register, OTP, refresh)
- [ ] Tests RequestsService (CRUD, status transitions)
- [ ] Tests QuotesService (create, accept, negotiate)
- [ ] Tests PaymentsService (create, confirm, refund)
- [ ] Tests ReviewsService (create, ratings calculation)
- [ ] Tests guards (JWT, Roles, Throttle)

**Structure des tests**:
```
backend/src/modules/
├── auth/
│   ├── auth.service.ts
│   └── auth.service.spec.ts  ← CRÉER
├── requests/
│   ├── requests.service.ts
│   └── requests.service.spec.ts  ← CRÉER
...
```

---

### 2.2 Nettoyage Console.log 🟠
**90+ instances à supprimer**

**Tâches**:
- [ ] Rechercher tous les `console.log` dans backend/
- [ ] Rechercher tous les `console.log` dans frontend/
- [ ] Remplacer par LoggerService (backend)
- [ ] Supprimer ou commenter (frontend)
- [ ] Ajouter règle ESLint `no-console`

```bash
# Commande pour trouver
grep -r "console.log" backend/src --include="*.ts" | wc -l
grep -r "console.log" frontend/src --include="*.ts" | wc -l
```

---

### 2.3 Correction Types TypeScript 🟠
**36 fichiers avec `: any`**

**Tâches**:
- [ ] Identifier tous les usages de `: any`
- [ ] Créer interfaces/types appropriés
- [ ] Remplacer par types stricts
- [ ] Activer `strict: true` dans tsconfig

**Fichiers prioritaires**:
```
backend/src/modules/requests/requests.service.ts
backend/src/modules/quotes/quotes.service.ts
frontend/src/app/core/services/api.service.ts
```

---

### 2.4 OnPush Change Detection 🟡
**50+ composants à optimiser**

**Tâches**:
- [ ] Lister tous les composants sans OnPush
- [ ] Ajouter `changeDetection: ChangeDetectionStrategy.OnPush`
- [ ] Convertir inputs vers signals où approprié
- [ ] Vérifier que les composants fonctionnent toujours

```typescript
@Component({
  selector: 'app-example',
  changeDetection: ChangeDetectionStrategy.OnPush, // AJOUTER
  ...
})
```

---

### 2.5 Gestion Subscriptions RxJS 🟡
**Prévention memory leaks**

**Tâches**:
- [ ] Auditer tous les `.subscribe()` sans cleanup
- [ ] Implémenter pattern `takeUntilDestroyed()`
- [ ] Utiliser `async` pipe où possible
- [ ] Ajouter DestroyRef aux composants

```typescript
// Pattern recommandé Angular 17+
export class MyComponent {
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.service.getData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => ...);
  }
}
```

---

## PHASE 3: Fonctionnalités Manquantes (Semaines 3-4)

### 3.1 Gateway Paiement Réel 🟡
**Fichier**: `backend/src/modules/payments/`

**Options pour Côte d'Ivoire**:
1. **CinetPay** (local, mobile money)
2. **PayDunya** (régional UEMOA)
3. **Stripe** (international, cartes)
4. **Orange Money API** (mobile money)

**Tâches**:
- [ ] Choisir provider(s) paiement
- [ ] Créer `PaymentGatewayService`
- [ ] Implémenter initiation paiement
- [ ] Implémenter webhook de confirmation
- [ ] Gérer les remboursements
- [ ] Ajouter logs de transaction
- [ ] Tester avec sandbox

```typescript
// Interface PaymentGateway
interface PaymentGateway {
  initiatePayment(amount: number, currency: string, metadata: any): Promise<PaymentIntent>;
  confirmPayment(transactionId: string): Promise<PaymentResult>;
  refundPayment(transactionId: string, amount?: number): Promise<RefundResult>;
}
```

---

### 3.2 Service Email 🟡
**Fichier**: `backend/src/common/services/email.service.ts`

**Tâches**:
- [ ] Créer EmailService avec Nodemailer
- [ ] Configurer SMTP (SendGrid, AWS SES, ou autre)
- [ ] Créer templates HTML pour:
  - [ ] Bienvenue / Confirmation inscription
  - [ ] Notification nouveau devis
  - [ ] Confirmation paiement
  - [ ] Rappel avis à laisser
  - [ ] Alerte litige
- [ ] Ajouter queue pour envoi asynchrone

---

### 3.3 Upload Fichiers / Documents 🟡
**Fichiers**: Multiples modules

**Tâches**:
- [ ] Choisir stockage (S3, Cloudinary, local)
- [ ] Créer `FileUploadService`
- [ ] Implémenter upload images réparation
- [ ] Implémenter upload documents réparateur
- [ ] Ajouter validation type/taille fichier
- [ ] Générer thumbnails pour images
- [ ] Nettoyer fichiers orphelins

```typescript
// Structure FileUploadService
@Injectable()
export class FileUploadService {
  async uploadImage(file: Express.Multer.File, folder: string): Promise<string>;
  async uploadDocument(file: Express.Multer.File, type: DocumentType): Promise<string>;
  async deleteFile(url: string): Promise<void>;
}
```

---

### 3.4 Notifications Push 🟡
**Fichier**: `backend/src/modules/notifications/`

**Tâches**:
- [ ] Intégrer Firebase Cloud Messaging (FCM)
- [ ] Stocker tokens FCM par utilisateur
- [ ] Implémenter envoi push notifications
- [ ] Créer notifications pour:
  - [ ] Nouveau devis reçu
  - [ ] Devis accepté
  - [ ] Réparation terminée
  - [ ] Nouveau message chat
  - [ ] Rappels

---

### 3.5 Export Données / Rapports 🟢
**Fichier**: `backend/src/modules/admin/`

**Tâches**:
- [ ] Export CSV des transactions
- [ ] Export PDF factures
- [ ] Tableau de bord statistiques
- [ ] Rapports périodiques

---

## PHASE 4: UX/UI & Performance (Semaines 5-6)

### 4.1 Accessibilité WCAG 🟡

**Tâches**:
- [ ] Audit avec axe-core ou Lighthouse
- [ ] Corriger contrastes couleurs insuffisants
- [ ] Ajouter ARIA labels manquants
- [ ] Améliorer navigation clavier
- [ ] Tester avec lecteur d'écran
- [ ] Ajouter skip links
- [ ] Focus visible sur tous éléments interactifs

**Corrections prioritaires**:
```scss
// Exemple correction contraste
.text-muted {
  color: #6b7280; // Avant: #9ca3af (trop clair)
}
```

---

### 4.2 Optimisation Performance Frontend 🟡

**Tâches**:
- [ ] Analyser bundle avec `ng build --stats-json`
- [ ] Identifier et lazy-loader modules lourds
- [ ] Implémenter virtual scrolling (listes longues)
- [ ] Optimiser images (WebP, lazy loading)
- [ ] Ajouter skeleton loaders partout
- [ ] Mettre en cache données statiques
- [ ] Preload routes critiques

**Cibles**:
- Bundle initial < 200KB gzipped
- First Contentful Paint < 1.5s
- Time to Interactive < 3s

---

### 4.3 Améliorations UX Formulaires 🟡

**Tâches**:
- [ ] Ajouter `autocomplete` sur tous les inputs
- [ ] Améliorer messages d'erreur (plus explicites)
- [ ] Ajouter validation temps réel
- [ ] Indicateurs de progression multi-étapes
- [ ] Sauvegarde brouillon automatique
- [ ] Confirmation avant quitter formulaire non sauvé

---

### 4.4 Feedback Utilisateur 🟢

**Tâches**:
- [ ] Repositionner toasts (au-dessus bottom nav)
- [ ] Ajouter animations micro-interactions
- [ ] Feedback haptic sur actions importantes
- [ ] États de chargement cohérents
- [ ] Messages succès plus visibles
- [ ] Confirmation actions destructives

---

### 4.5 Mode Hors-ligne PWA 🟢

**Tâches**:
- [ ] Définir stratégies cache (Network First, Cache First)
- [ ] Cacher données critiques (profil, demandes en cours)
- [ ] Afficher indicateur hors-ligne
- [ ] Queue actions pour sync ultérieure
- [ ] Tester scénarios déconnexion

---

## PHASE 5: Production & DevOps (Semaine 7)

### 5.1 Conteneurisation Docker 🟡

**Tâches**:
- [ ] Créer `Dockerfile` backend
- [ ] Créer `Dockerfile` frontend
- [ ] Créer `docker-compose.yml` (dev)
- [ ] Créer `docker-compose.prod.yml`
- [ ] Optimiser images (multi-stage builds)

```dockerfile
# Exemple Dockerfile backend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

---

### 5.2 CI/CD Pipeline 🟡

**Fichier**: `.github/workflows/ci.yml`

**Tâches**:
- [ ] Workflow lint + type check
- [ ] Workflow tests unitaires
- [ ] Workflow tests e2e
- [ ] Build et push images Docker
- [ ] Déploiement staging automatique
- [ ] Déploiement production (manuel)

---

### 5.3 Monitoring & Logging 🟡

**Tâches**:
- [ ] Intégrer service APM (Sentry, DataDog, ou autre)
- [ ] Centraliser logs (ELK, CloudWatch, ou autre)
- [ ] Configurer alertes (erreurs 5xx, latence élevée)
- [ ] Dashboard métriques business
- [ ] Health checks endpoints

---

### 5.4 Sécurité Production 🟡

**Tâches**:
- [ ] Configurer HTTPS obligatoire
- [ ] Ajouter headers sécurité manquants
- [ ] Configurer CSP strict
- [ ] Rate limiting par IP
- [ ] Protection DDoS (Cloudflare ou autre)
- [ ] Backup automatique base de données
- [ ] Rotation secrets périodique

---

### 5.5 Documentation Déploiement 🟢

**Tâches**:
- [ ] Guide installation serveur
- [ ] Procédure déploiement
- [ ] Runbook incidents
- [ ] Documentation API (Swagger complet)
- [ ] Guide contribution développeurs

---

## Checklist Pré-Production

### Sécurité
- [ ] Refresh token corrigé
- [ ] Secrets externalisés
- [ ] SMS fonctionnel
- [ ] Autorisation vérifiée partout
- [ ] Rate limiting actif
- [ ] HTTPS configuré

### Qualité
- [ ] Tests > 60% coverage
- [ ] Aucun console.log
- [ ] Types stricts
- [ ] Aucune erreur lint

### Fonctionnel
- [ ] Paiements réels testés
- [ ] Emails envoyés
- [ ] Uploads fonctionnels
- [ ] Notifications push actives

### Performance
- [ ] Bundle < 200KB gzipped
- [ ] Lighthouse > 80
- [ ] Temps réponse API < 200ms

### DevOps
- [ ] Docker images prêtes
- [ ] CI/CD configuré
- [ ] Monitoring actif
- [ ] Backups automatiques

---

## Résumé Planning

```
Semaine 1: Phase 1 - Sécurité Critique
Semaine 2: Phase 2 - Qualité Code
Semaine 3: Phase 3a - Paiements + Email
Semaine 4: Phase 3b - Upload + Notifications
Semaine 5: Phase 4a - Accessibilité + Performance
Semaine 6: Phase 4b - UX + PWA
Semaine 7: Phase 5 - Production & DevOps
```

**Date cible production**: Fin Février 2026

---

## Suivi d'Avancement

| Phase | Statut | Progression |
|-------|--------|-------------|
| Phase 1 | ⏳ En attente | 0% |
| Phase 2 | ⏳ En attente | 0% |
| Phase 3 | ⏳ En attente | 0% |
| Phase 4 | ⏳ En attente | 0% |
| Phase 5 | ⏳ En attente | 0% |

**Dernière mise à jour**: 7 Janvier 2026
