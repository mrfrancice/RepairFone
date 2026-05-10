# 🗺 Roadmap RepairFone

État au démarrage de cette roadmap : audit complet effectué, Phase 1 (correctifs critiques) + Phase 2 (stabilisation) + Phase 3 (dette technique) traitées en grande partie. Ce document liste **ce qui reste** des phases 4 à 6 sous forme de tickets actionnables.

> ✅ Phase 1 — Correctifs critiques : **terminée**
> 🟢 Phase 2 — Stabilisation prod : **bases posées** (Docker, CI, README, health endpoints, tests squelettes)
> 🟢 Phase 3 — Dette technique : **partiellement** (orphelins audités, constantes partagées, pagination DataGrid)
> 🟡 Phase 4 — Fonctionnel manquant : **à faire**
> 🟡 Phase 5 — Scalabilité : **à faire**
> 🟡 Phase 6 — Croissance : **à planifier**

---

## 🔌 Services externes : recommandations open source / gratuits

État au moment de cette session :
- ✅ **Monitoring** : Sentry SDK installé (backend + frontend), compatible Sentry SaaS free tier OU **GlitchTip** (clone open source self-hostable). DSN à remplir dans `.env` côté back et `environment.ts` côté front.
- ✅ **Push notifications** : Web Push API W3C (VAPID) installé. `npm install web-push` + endpoints `/push/*`. Pas de Firebase requis.
- ⏳ **SMS / OTP** : Mock seul. Voir options ci-dessous.
- ⏳ **Email** : Mock seul. Voir options ci-dessous.
- ⏳ **Paiement** : Mock + CinetPay/PayDunya câblés (sandbox prêt, credentials prod requis).

### Sentry / GlitchTip
- **Sentry SaaS** : free tier 5k erreurs/mois — démarrage immédiat (juste un DSN).
- **GlitchTip** : open source, self-hostable (Docker), API compatible Sentry SDK — **aucun changement de code** entre Sentry et GlitchTip. Hébergement gratuit possible (Hetzner, OVH VPS) ~5€/mois.
- Variables d'env : `SENTRY_DSN` (backend) + `environment.sentry.dsn` (frontend).

### Web Push
- Génération des clés VAPID : `node -e "console.log(JSON.stringify(require('web-push').generateVAPIDKeys()))"`.
- Variables d'env backend : `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT=mailto:admin@repairfone.ci`.
- En dev (`ng serve`), le service worker Angular n'est PAS enregistré → push désactivé. Pour tester en local : `ng build --configuration=development` puis servir le dist.

### SMS / OTP (le maillon faible)
**Constat honnête** : il n'existe pas vraiment d'option SMS open source pour la Côte d'Ivoire — les SMS passent forcément par un opérateur ou un agrégateur payant.

Options par ordre de pragmatisme :
1. **OTP par email** : 100% gratuit avec un provider email (cf. plus bas). Suffisant pour 80% des cas. Limitation : un user sans email actif est bloqué.
2. **OTP par WhatsApp** via [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api/) — **gratuit jusqu'à 1000 conversations/mois**. Excellente couverture en Côte d'Ivoire (~90% pénétration WhatsApp).
3. **OTP par Telegram bot** : 100% gratuit, sans limite. Limitation : l'utilisateur doit avoir Telegram (faible adoption en CI).
4. **Agrégateurs payants** si on veut du SMS : [Africa's Talking](https://africastalking.com/) (~5 FCFA/SMS), [LeTexto](https://letexto.com/) (CI), [Vonage](https://www.vonage.com/). Pas open source mais nécessaires en prod.

**Recommandation** : démarrer avec **WhatsApp Cloud API** + fallback email. Coût zéro jusqu'à 1k utilisateurs/mois.

### Email
Options gratuites avec free tier généreux :
| Provider | Free tier | API | GDPR |
|---|---|---|---|
| **Resend** | 3 000 emails/mois, 100/jour | Excellente (TypeScript natif) | ✅ |
| **Brevo** (ex-Sendinblue) | 300 emails/jour | Bonne (SMTP + REST) | ✅ (France) |
| **MailerSend** | 3 000 emails/mois | Bonne | ✅ |
| **Mailgun** | 100 emails/jour (3 mois gratuits) | Excellente | ✅ |
| **AWS SES** | 62k emails/mois (gratuit depuis EC2) | Bonne | ✅ |

**Vraiment open source / self-host** : [Postfix](http://www.postfix.org/) + [Mailcow](https://mailcow.email/) Docker — mais maintenance lourde (DKIM, SPF, reputation IP). Pas recommandé sauf si volume justifie.

**Recommandation** : **Resend** pour le démarrage (API moderne, 3k mails/mois gratuits, intégration NestJS triviale via `@nestjs-modules/mailer` + transport SMTP).

### Activation pas-à-pas — Resend (email)
1. Créer un compte gratuit sur [resend.com](https://resend.com) (3 000 mails/mois).
2. Générer une clé API (`Dashboard → API Keys → Create API Key`).
3. Tant qu'on n'a pas vérifié de domaine, utiliser `onboarding@resend.dev` comme `EMAIL_FROM` (limité à l'email du compte, suffisant pour les tests).
4. Pour la prod : vérifier `repairfone.ci` dans le dashboard Resend (ajouter SPF/DKIM via DNS) → permet d'envoyer depuis n'importe quelle adresse `@repairfone.ci`.
5. Dans `backend/.env` :
   ```
   EMAIL_PROVIDER=resend
   RESEND_API_KEY=re_xxxxx
   EMAIL_FROM=onboarding@resend.dev   # ou noreply@repairfone.ci après vérification domaine
   ```
6. Redémarrer le backend → log `Email provider: Resend initialized`.

### Activation pas-à-pas — OTP par email (fallback gratuit du SMS)
Câblé automatiquement : `AuthService.generateOtp()` envoie l'OTP par SMS + email si l'utilisateur a un email enregistré.
- Pas de config supplémentaire → ça marche dès que `EMAIL_PROVIDER` n'est pas `mock`.
- En mode `SMS_PROVIDER=mock`, l'email devient le canal effectif (le SMS log juste en console).
- Limite : un utilisateur sans email enregistré ne peut pas recevoir l'OTP → l'inscription doit demander l'email même s'il n'est pas "vérifié" au sens strict.

### Paiement (Côte d'Ivoire)
**Constat** : il n'existe **pas** d'option vraiment "gratuite" — un PSP prend toujours une commission par transaction (~2-3%). Mais l'intégration backend est gratuite, on ne paie qu'à l'usage.

Options actives en Côte d'Ivoire :
| Provider | Sandbox gratuit | Commission | Mobile Money supportés |
|---|---|---|---|
| **CinetPay** | ✅ | ~2.5% | Orange, MTN, Moov, Wave |
| **PayDunya** | ✅ | ~3% | Orange, MTN, Moov, Wave |
| **Wave** API directe | Contrat marchand requis | ~1% | Wave seulement |
| **Orange Money** API directe | Contrat marchand requis | Variable | Orange seulement |

**État dans le code** : `PaymentGatewayService` supporte déjà Mock, CinetPay et PayDunya. Pour passer en prod, il suffit de :
1. Créer un compte marchand chez PayDunya (gratuit, sandbox immédiat)
2. Renseigner `PAYMENT_PROVIDER=paydunya` + `PAYDUNYA_MASTER_KEY/PUBLIC_KEY/PRIVATE_KEY/TOKEN` dans `.env`

**Recommandation** : **PayDunya en mode test** pour démarrer (zéro commission tant qu'on est en sandbox), bascule en prod le jour du go-live.

### Activation pas-à-pas — PayDunya (sandbox → prod)
1. **Compte sandbox** (gratuit, instantané) : créer un compte sur [paydunya.com](https://paydunya.com) → aller dans `Intégration → Clés API` → onglet **TEST**.
2. Récupérer les 4 valeurs : `Master Key`, `Public Key`, `Private Key`, `Token`.
3. Dans `backend/.env` :
   ```
   PAYMENT_PROVIDER=paydunya
   PAYDUNYA_MODE=test
   PAYDUNYA_MASTER_KEY=...
   PAYDUNYA_PUBLIC_KEY=...
   PAYDUNYA_PRIVATE_KEY=...
   PAYDUNYA_TOKEN=...
   PAYMENT_RETURN_URL=https://app.repairfone.ci/payments/callback
   PAYMENT_NOTIFY_URL=https://api.repairfone.ci/api/v1/payments/webhook
   ```
4. Redémarrer le backend → log `Payment gateway: PayDunya initialized (test mode)`.
5. Tester un paiement réel en sandbox : utiliser n'importe quel numéro mobile money valide → PayDunya simule la confirmation.
6. **Passage en prod** : créer un compte marchand validé (RCCM, RIB, etc.), changer `PAYDUNYA_MODE=live` + clés live, vérifier les webhooks (HTTPS obligatoire).

---

## 🐛 Bugs reportés de l'audit E2E (2026-05-10)

Voir `docs/audit/05_AUDIT_E2E_BROWSER_2026-05-10.md` pour le rapport complet. 9 bugs corrigés en session (commits `89b3e10`, `b2cb0c3`). 3 bugs reportés :

### Ticket #AUDIT-11 — Seed enrichi (coordonnées + filtrage qualité)
**Symptôme** : Sur `/home`, "Tech Repair Pro" et "Tatou Ange" affichés tous deux à `0 m`. Vision++ et Tatou Ange listés dans "Réparateurs proches" malgré 0 avis.

**Cause** : Coordonnées seedées en `(0, 0)` pour plusieurs réparateurs → distance calculée à 0 m. Pas de filtre qualité côté backend.

**Fix** :
- `backend/src/database/seeders/seeder.service.ts` : doter chaque réparateur de coordonnées Abidjan réalistes (Cocody 5.347/-3.994, Plateau 5.327/-4.022, Yopougon 5.346/-4.124, Marcory 5.297/-3.985, Adjamé 5.367/-4.027).
- `backend/src/modules/users/repairers.service.ts` : optionnellement filtrer ou ranking — descendre `reviewCount === 0` en fin de liste plutôt que les exclure (sinon un nouveau réparateur ne serait jamais découvrable).

**Effort** : 30 min.

### Ticket #AUDIT-13 — Distance Haversine sur `/requests/my`
**Symptôme** : Toutes les demandes côté réparateur affichent `? km`.

**Cause** : Le calcul de distance n'est pas câblé sur le endpoint `/requests/my`. La distance dépend des coordonnées du client (lieu de réparation) ET du réparateur (boutique ou point de service).

**Fix** :
1. Ajouter la formule Haversine SQL dans le QueryBuilder de `RequestsService.findByUser` (mode réparateur uniquement) :
   ```sql
   6371 * acos(
     cos(radians(:repairerLat)) * cos(radians(request.latitude))
     * cos(radians(request.longitude) - radians(:repairerLng))
     + sin(radians(:repairerLat)) * sin(radians(request.latitude))
   ) AS distance_km
   ```
2. Renvoyer la valeur dans la response (champ `distance` calculé).
3. Pré-requis : les `repair_requests` doivent avoir `latitude`/`longitude` non-null (à seeder + valider à la création).

**Effort** : 2-3 h (back + tests + adaptation front).

### Ticket #AUDIT-16 — Feedback UX redirection `/requests/new`
**Symptôme** : Si l'utilisateur tape `/requests/new` sans `?repairerId=`, il est redirigé silencieusement vers `/search` sans aucun message.

**Cause** : `NewRequestComponent.loadData()` détecte l'absence de `repairerId` et fait `router.navigate(['/search'])` sans toast/snackbar.

**Fix** :
```ts
// frontend/src/app/features/requests/components/new-request/new-request.component.ts:~1267
if (!repairerId) {
  this.toastService.info(
    'Sélectionnez d\'abord un réparateur dans la liste pour créer votre demande.',
  );
  this.router.navigate(['/search']);
  return;
}
```

**Effort** : 5 min (un toast service existe déjà — confirmer via `grep ToastService` côté shared).

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

#### Ticket #P5.5.1 — Index DB ✅ fait
Index composites ajoutés via deux migrations idempotentes :
- `1736800000000-AddPerformanceIndexes.ts` :
  - `idx_users_role_status`, `idx_users_created_at`
  - `idx_repair_requests_(status|client|repairer)_created`
  - `idx_payments_(status|client|repairer)_created`
- `1736810000000-AddQuotesNotificationsIndexes.ts` :
  - `idx_quotes_(repairer_status|status_created|request_created)`
  - `idx_notifications_(user_read|user_created)`

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
