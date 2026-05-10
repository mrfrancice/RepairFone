# 🗺 Roadmap RepairFone

État au démarrage de cette roadmap : audit complet effectué, Phase 1 (correctifs critiques) + Phase 2 (stabilisation) + Phase 3 (dette technique) traitées en grande partie. Ce document liste **ce qui reste** des phases 4 à 6 sous forme de tickets actionnables.

> ✅ Phase 1 — Correctifs critiques : **terminée**
> 🟢 Phase 2 — Stabilisation prod : **bases posées** (Docker, CI, README, health endpoints, tests squelettes)
> 🟢 Phase 3 — Dette technique : **partiellement** (orphelins audités, constantes partagées, pagination DataGrid)
> 🟡 Phase 4 — Fonctionnel manquant : **à faire**
> 🟡 Phase 5 — Scalabilité : **à faire**
> 🟡 Phase 6 — Croissance : **à planifier**

---

## 🟡 Phase 4 — Fonctionnel manquant

### P4.1 — TODOs production résiduels

#### Ticket #P4.1.1 — Génération PDF reçu de paiement
**Fichier impacté** : `frontend/src/app/features/payment/components/payment-detail/payment-detail.component.ts:~350` (TODO marqué)
**Effort** : 1 jour
**Stratégie** :
1. Backend : nouvel endpoint `GET /api/v1/payments/:id/receipt` qui :
   - Vérifie l'auth + autorisation
   - Génère un PDF avec `pdfkit` ou `puppeteer-core` (template HTML → PDF)
   - Renvoie `Content-Type: application/pdf`
2. Frontend : bouton "Télécharger reçu" qui appelle l'endpoint via `HttpClient` avec `responseType: 'blob'` et déclenche un download
3. Test : générer un reçu dans un test e2e ou unitaire (snapshot du PDF)

**Critère d'acceptation** : depuis `/payment/:id`, un bouton télécharge un PDF lisible avec logo, montant, date, méthode, parties, référence.

---

#### Ticket #P4.1.2 — Upload de fichiers dans le chat
**Fichiers impactés** :
- `frontend/src/app/features/conseils/components/conseil-chat/conseil-chat.component.ts:~200`
- `frontend/src/app/features/chat/components/chat-room/chat-room.component.ts`

**Effort** : 2 jours
**Stratégie** :
1. Backend : endpoint `POST /api/v1/uploads/chat-attachment` (multer disk storage en dev, S3/MinIO en prod). Valide MIME types (images, PDF). Renvoie l'URL.
2. Frontend : input file caché + bouton trombone, preview avant envoi. Appel upload puis envoi message avec `attachments: [url]`.
3. Stockage : décider local/S3/Cloudinary selon budget infra.

**Critère d'acceptation** : un client peut envoyer une photo dans `/chat/:id` ou `/conseils/sessions/:id`, le réparateur la voit immédiatement (avec WebSocket en P5) ou au prochain refresh.

---

#### Ticket #P4.1.3 — Appel masqué / chat repairer
**Fichier impacté** : `frontend/src/app/features/search/components/repairer-detail/repairer-detail.component.ts:~600` (TODO marqué)
**Effort** : 1-2 jours
**Stratégie A (chat)** : rediriger vers `/chat` en créant une conversation entre client et réparateur si elle n'existe pas. Plus simple, déjà supporté par le backend.
**Stratégie B (Twilio Programmable Voice)** : intégrer Twilio Proxy pour appel masqué via numéros virtuels. Plus complexe et payant, mais permet l'appel direct.

**Décision recommandée** : Stratégie A en MVP, B plus tard si demande forte du marché.

**Critère d'acceptation** : depuis la page d'un réparateur, le bouton "Contacter" ouvre la conversation existante ou en crée une.

---

### P4.2 — Fonctionnalités utilisateur attendues

#### Ticket #P4.2.1 — Reset password complet
**Effort** : 1 jour
**État actuel** : composant `forgot-password.component.ts` existe, à vérifier que le flow complet fonctionne (email/SMS → OTP → nouveau mot de passe).
**Backend** : ajouter endpoints `POST /auth/forgot-password` (envoi OTP), `POST /auth/reset-password` (validation OTP + new password) si pas déjà présents.

#### Ticket #P4.2.2 — Vérification email
**Effort** : 0.5 jour
**État actuel** : champ `isEmailVerified` existe en DB, mais aucun flow d'envoi de mail de vérification visible.
**Stratégie** : envoyer un email avec lien de vérification (`POST /auth/send-email-verification` + `GET /auth/verify-email?token=...`). Service mail à brancher (SendGrid, Mailgun, SES).

#### Ticket #P4.2.3 — Avatar upload côté profil
**Effort** : 0.5 jour
**État actuel** : endpoint backend `POST /users/me/avatar` existe et le composant `<ui-image-upload>` existe.
**Action** : brancher le composant dans `profile-edit.component.ts` (s'il ne l'est pas déjà), ajouter preview + crop optionnel.

#### Ticket #P4.2.4 — Notifications push mobile (FCM)
**Effort** : 2 jours
**Stratégie** :
1. Frontend : intégrer Firebase Messaging (déjà en deps). Subscribe au token, l'envoyer au backend.
2. Backend : endpoint `POST /notifications/register-device` qui stocke le FCM token. Service `firebase-admin` pour envoyer (déjà partiellement présent via firebase-auth).
3. Hooks : déclencher push sur événements (nouvelle demande pour repairer, devis reçu pour client, paiement reçu, etc.)

---

### P4.3 — Mocks vs réel

#### Ticket #P4.3.1 — Encadrer `simulate-success` payments
**Effort** : 30 min
**Action** : ajouter un guard `@Roles(UserRole.ADMIN)` ou `if (process.env.NODE_ENV !== 'production')` sur `POST /payments/:id/simulate-success` pour éviter l'usage en prod.

#### Ticket #P4.3.2 — Intégrer un vrai gateway de paiement
**Effort** : 3-5 jours
**Options** :
- **PayDunya** : gateway populaire en Afrique de l'Ouest, supporte Orange Money / MTN Money / Wave / Moov / Free / cartes
- **CinetPay** : alternative similaire
- **Wave API directe** : pour paiements Wave uniquement (plus simple si volume Wave dominant)

**Action** :
1. Choisir le gateway selon volume + frais
2. Implémenter le webhook de notification (`POST /payments/webhook/:provider`)
3. Persister `transactionId`, `gatewayResponse`, etc. (déjà partiellement en place)
4. Tester en sandbox avant prod

---

## 🟡 Phase 5 — Scalabilité

### P5.1 — Cache (3-5 jours)

#### Ticket #P5.1.1 — Redis cache pour endpoints publics
- Cibles : `/locations/*` (hierarchy), `/settings/*` (référentiels), `/devices` (catalogue)
- TTL : 1 heure pour locations/settings, 1 jour pour devices
- Lib : `@nestjs/cache-manager` + `cache-manager-redis-yet`

#### Ticket #P5.1.2 — Headers HTTP cache
- `Cache-Control: public, max-age=3600` sur les mêmes endpoints
- `ETag` ou `Last-Modified` pour éviter le re-download

#### Ticket #P5.1.3 — Service worker stale-while-revalidate
- Configurer `ngsw-config.json` pour mettre en cache les appels API publics avec stratégie SWR

---

### P5.2 — Temps réel (1 semaine)

#### Ticket #P5.2.1 — WebSocket Gateway pour chat
- Lib : `@nestjs/websockets` + `socket.io` (déjà installé probablement)
- Events : `message:new`, `message:read`, `typing:start`, `typing:stop`
- Auth : valider JWT au handshake

#### Ticket #P5.2.2 — WebSocket pour notifications in-app
- Event : `notification:new` push depuis backend dès que créée en DB
- Frontend : update du `NotificationStore` en temps réel, badge unread mis à jour

#### Ticket #P5.2.3 — WebSocket pour mise à jour des demandes
- Events : `request:status-changed`, `quote:received`, `payment:completed`
- Permet au client de voir le statut de sa demande sans refresh

---

### P5.3 — Background jobs (3-4 jours)

#### Ticket #P5.3.1 — Setup Bull/BullMQ
- Lib : `@nestjs/bull` + Redis comme broker
- Modules concernés : auth (cleanup OTP), payments (retry), notifications (batch)

#### Ticket #P5.3.2 — Tâches périodiques
- **OTP cleanup** : supprimer OTP expirés > 24h (cron quotidien)
- **Lockout reset** : reset `failedLoginAttempts` après expiration `lockedUntil`
- **Auto-cancel devis** : devis non répondus > 7 jours passent en `expired`
- **Digest emails** : récap hebdo des notifications non lues

---

### P5.4 — Performance frontend (2-3 jours)

#### Ticket #P5.4.1 — Bundle analysis
- `npx webpack-bundle-analyzer dist/frontend/stats.json`
- Identifier les paquets lourds (firebase est massif, importer uniquement les sous-modules utilisés)

#### Ticket #P5.4.2 — Virtual scrolling
- Utiliser `@angular/cdk/scrolling` `ScrollingModule` sur les listes potentiellement longues (notifications, search-results)

#### Ticket #P5.4.3 — Image optimization
- Convertir les assets en WebP/AVIF
- Responsive images via `srcset`
- Lazy loading natif `loading="lazy"`

#### Ticket #P5.4.4 — Preconnect / dns-prefetch
- Ajouter dans `index.html` : preconnect vers le CDN d'images, le backend, Firebase

---

### P5.5 — Database (2-3 jours)

#### Ticket #P5.5.1 — Index DB ✅ partiellement fait
Index composites ajoutés via migration `1736800000000-AddPerformanceIndexes.ts` :
- `idx_users_role_status`, `idx_users_created_at`
- `idx_repair_requests_(status|client|repairer)_created`
- `idx_payments_(status|client|repairer)_created`

Reste à ajouter :
- `quotes.requestId`, `quotes.repairerId`, `quotes.status`
- `notifications.userId`, `notifications.isRead`

#### Ticket #P5.5.2 — Migrations TypeORM versionnées ✅ partiellement fait
- ✅ `synchronize` forcé à `false` en production (`database.config.ts`)
- ✅ `migrationsRun: true` en prod (exécution automatique au boot)
- ⏳ Reste : basculer dev sur `synchronize: false` une fois la migration initiale stabilisée et les seeders alignés
- Setup `npm run migration:run` dans le pipeline de déploiement (CI)

#### Ticket #P5.5.3 — Connection pooling
- Configurer `extra.max` (pool size) sur la datasource selon la charge attendue

---

## 🟡 Phase 6 — Croissance

### P6.1 — Internationalisation (2-3 semaines)

- Lib : `@angular/localize` (officielle) ou `ngx-translate` (plus dynamique)
- Locales prioritaires : **FR** (existant), **EN** (cible internationale)
- Plus tard : **Wolof** / **Bambara** pour Afrique de l'Ouest
- Backend : retourner les libellés (status, motifs litiges, types paiement) avec leur clé i18n + texte FR par défaut

### P6.2 — Multi-pays (3-4 semaines)

- **Multi-currency** : ajouter `currency` sur Payment, RepairerProfile (XOF / XAF / GNF / USD)
- **Locations** : étendre seeder à SN, ML, BF
- **Préfixes téléphone** : remplacer hardcode `+225` par sélecteur de pays
- **KYC réglementaire** : règles différentes selon pays (carte d'identité, RCCM)

### P6.3 — Analytics & growth (1-2 semaines)

- **Mixpanel** ou **PostHog** (open source, self-hostable)
- **Events** : signup, request_created, quote_received, quote_accepted, payment_succeeded, dispute_opened, review_left, expert_consulted
- **Funnels** : signup → first_request → first_payment → first_review
- **A/B testing** : LaunchDarkly OSS ou GrowthBook

### P6.4 — Programme fidélité (1 mois)

- **Badges réparateurs** : déjà préparé via `BadgeType` settings ("100 réparations", "Réponse rapide", "Top 10 ville")
- **Système de points client** : 1 réparation = X points → réductions sur prochaines réparations
- **Programme de parrainage** : code unique par utilisateur, bonus pour parrain et filleul
- **Niveaux** : Bronze / Silver / Gold / Platinum selon volume

### P6.5 — Marketplace pièces détachées (2-3 mois — projet à part)

- Module distinct avec entités propres (Product, Inventory, Order)
- Réutilise auth/users/payments/notifications existants
- Fournisseurs B2B + livraison client final
- Intégration logistique (DHL, GIG, GoZem, …)

---

## 🎯 Métriques de succès

| Métrique | Aujourd'hui | Cible 3 mois | Cible 6 mois |
|---|---|---|---|
| Couverture tests backend | 4 specs (~15%) | 60% | 80% |
| Couverture tests frontend | 2 specs squelettes | 40% | 60% |
| Bugs critiques ouverts | 0 | 0 | 0 |
| Composants > 1500 LOC | 4 | 1 | 0 |
| Tests E2E | 0 | 5 parcours | 15 parcours |
| Déploiement staging | Manuel via docker compose | Automatique sur push CI | Automatique + smoke tests |
| Lighthouse Performance | À mesurer | > 80 mobile | > 90 mobile |
| Sentry erreurs/jour prod | À installer | < 50 | < 10 |
| MAU (Monthly Active Users) | Pré-prod | 1000 | 5000 |

---

## 📌 Ordre de priorité recommandé pour les prochains sprints

**Sprint 1 (semaines 1-2)** — clore P2 + P4.1
- Étoffer les tests squelettes en tests réels (services critiques)
- Implémenter PDF receipts (P4.1.1)
- Implémenter upload chat (P4.1.2)
- Brancher Sentry (frontend + backend)

**Sprint 2 (semaines 3-4)** — P3 résiduel + P4.2
- Refactor `request-detail.component.ts` (3494 LOC) en sous-composants
- Implémenter reset password complet (P4.2.1)
- Implémenter notifications push (P4.2.4)
- Pagination serveur sur 1 page admin (POC)

**Sprint 3 (semaines 5-6)** — P5 démarrage
- Cache Redis sur endpoints publics (P5.1)
- WebSocket chat (P5.2.1)
- Index DB + migrations (P5.5.1, P5.5.2)

**Sprint 4 (semaines 7-8)** — Intégration paiement réel
- Choisir gateway (PayDunya / CinetPay / Wave)
- Implémenter webhook + persistence
- Tests sandbox + bascule prod

**Sprints 9+** — Phase 6 selon priorités business (i18n, multi-pays, programme fidélité, etc.)
