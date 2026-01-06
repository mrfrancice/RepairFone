# PLAN DE CORRECTIONS - REPAIRFONE

**Date** : 6 Janvier 2026
**Version** : 1.0

---

## CHECKLIST ACTIONNABLE

Ce document fournit une checklist priorisée pour corriger tous les problèmes identifiés dans l'audit.

---

## PHASE 1 - CRITIQUE (Semaine 1-2)

### Sécurité - À corriger IMMÉDIATEMENT

- [ ] **SEC-001** : Corriger validation refresh token
  - **Fichier** : `backend/src/modules/auth/auth.service.ts:257-278`
  - **Action** : Remplacer `bcrypt.hash()` par boucle avec `bcrypt.compare()`
  - **Référence** : [01_AUDIT_SECURITE.md#22](./01_AUDIT_SECURITE.md#22-mécanisme-de-refresh-token-cassé)
  - **Assigné** : Backend Dev
  - **Estimé** : 2h

- [ ] **SEC-002** : Supprimer secrets hardcodés
  - **Fichier** : `backend/src/config/configuration.ts:14-18`
  - **Action** : Supprimer fallbacks, lever erreur si ENV manquantes
  - **Référence** : [01_AUDIT_SECURITE.md#23](./01_AUDIT_SECURITE.md#23-secrets-hardcodés-dans-la-configuration)
  - **Assigné** : Backend Dev
  - **Estimé** : 1h

- [ ] **SEC-003** : Implémenter encryption tokens
  - **Fichier** : `frontend/src/app/core/services/secure-storage.service.ts`
  - **Action** : Remplacer obfuscation par Web Crypto API AES-GCM
  - **Référence** : [01_AUDIT_SECURITE.md#21](./01_AUDIT_SECURITE.md#21-stockage-de-tokens-non-sécurisé)
  - **Assigné** : Frontend Dev
  - **Estimé** : 4h

- [ ] **SEC-004** : Ajouter authorization checks
  - **Fichiers** : Tous les controllers (`*.controller.ts`)
  - **Action** : Vérifier ownership/role sur chaque endpoint
  - **Référence** : [01_AUDIT_SECURITE.md#24](./01_AUDIT_SECURITE.md#24-broken-object-level-authorization-bola)
  - **Assigné** : Backend Dev
  - **Estimé** : 8h

- [ ] **SEC-005** : Corriger compteur OTP
  - **Fichier** : `backend/src/modules/auth/auth.service.ts:237-240`
  - **Action** : Incrémenter attempts AVANT vérification
  - **Référence** : [01_AUDIT_SECURITE.md#33](./01_AUDIT_SECURITE.md#33-compteur-de-tentatives-otp-non-incrémenté)
  - **Assigné** : Backend Dev
  - **Estimé** : 1h

---

### Logique Métier - Critique

- [ ] **BIZ-001** : Aligner RequestStatus enum
  - **Fichiers** :
    - `backend/src/modules/requests/entities/repair-request.entity.ts`
    - `frontend/src/app/shared/models/index.ts`
  - **Action** : Ajouter `IN_PROGRESS`, `AWAITING_PARTS`, `CANCELLED`, `DISPUTED` au backend
  - **Référence** : [04_AUDIT_LOGIQUE_METIER.md#22](./04_AUDIT_LOGIQUE_METIER.md#22-critique---désalignement-status-enum)
  - **Assigné** : Fullstack Dev
  - **Estimé** : 2h

- [ ] **BIZ-002** : Aligner PaymentStatus enum
  - **Fichiers** : Backend + Frontend
  - **Action** : Unifier `COMPLETED` vs `paid`, supprimer `released`
  - **Référence** : [04_AUDIT_LOGIQUE_METIER.md#22](./04_AUDIT_LOGIQUE_METIER.md#22-critique---désalignement-status-enum)
  - **Assigné** : Fullstack Dev
  - **Estimé** : 1h

- [ ] **BIZ-003** : Découpler quote de request acceptance
  - **Fichier** : `backend/src/modules/quotes/quotes.service.ts:161-165`
  - **Action** : Créer endpoint `acceptQuote` séparé
  - **Référence** : [04_AUDIT_LOGIQUE_METIER.md#32](./04_AUDIT_LOGIQUE_METIER.md#32-critique---quote-auto-accepte-request)
  - **Assigné** : Backend Dev
  - **Estimé** : 4h

- [ ] **BIZ-004** : Corriger review status check
  - **Fichier** : `backend/src/modules/reviews/reviews.service.ts:84-85`
  - **Action** : Permettre reviews sur `COMPLETED` et `DELIVERED`
  - **Référence** : [04_AUDIT_LOGIQUE_METIER.md#33](./04_AUDIT_LOGIQUE_METIER.md#33-reviews-sur-mauvais-status)
  - **Assigné** : Backend Dev
  - **Estimé** : 30min

---

## PHASE 2 - HAUTE PRIORITE (Semaine 3-4)

### Sécurité - Haute

- [ ] **SEC-006** : Rate limiting auth endpoints
  - **Fichier** : `backend/src/modules/auth/auth.controller.ts`
  - **Action** : Ajouter `@Throttle()` sur login, send-otp, verify-otp
  - **Référence** : [01_AUDIT_SECURITE.md#31](./01_AUDIT_SECURITE.md#31-rate-limiting-absent-sur-endpoints-authentification)
  - **Assigné** : Backend Dev
  - **Estimé** : 2h

- [ ] **SEC-007** : Politique mot de passe forte
  - **Fichier** : DTOs d'authentification
  - **Action** : Créer validateur custom `@IsStrongPassword()`
  - **Référence** : [01_AUDIT_SECURITE.md#32](./01_AUDIT_SECURITE.md#32-politique-de-mot-de-passe-insuffisante)
  - **Assigné** : Backend Dev
  - **Estimé** : 2h

- [ ] **SEC-008** : Encrypter phone remember me
  - **Fichier** : `frontend/src/app/features/auth/components/login/login.component.ts:523-528`
  - **Action** : Utiliser SecureStorageService ou stocker hash uniquement
  - **Référence** : [01_AUDIT_SECURITE.md#34](./01_AUDIT_SECURITE.md#34-numéro-de-téléphone-en-clair-dans-remember-me)
  - **Assigné** : Frontend Dev
  - **Estimé** : 1h

---

### Qualité Code - Haute

- [ ] **CODE-001** : Supprimer tous les console.log
  - **Fichiers** : 34 fichiers, 90+ occurrences
  - **Action** : Rechercher/remplacer, créer LoggerService
  - **Référence** : [02_AUDIT_CODE_QUALITY.md#62](./02_AUDIT_CODE_QUALITY.md#62-code-mort---console-logs)
  - **Assigné** : Tous les devs
  - **Estimé** : 4h

- [ ] **CODE-002** : Créer LoggerService
  - **Fichier** : Nouveau `frontend/src/app/core/services/logger.service.ts`
  - **Action** : Service avec niveaux (log, warn, error, debug)
  - **Référence** : [02_AUDIT_CODE_QUALITY.md#62](./02_AUDIT_CODE_QUALITY.md#62-code-mort---console-logs)
  - **Assigné** : Frontend Dev
  - **Estimé** : 2h

- [ ] **CODE-003** : Ajouter OnPush change detection
  - **Fichiers** : Tous les 50+ composants
  - **Action** : Ajouter `changeDetection: ChangeDetectionStrategy.OnPush`
  - **Référence** : [02_AUDIT_CODE_QUALITY.md#21](./02_AUDIT_CODE_QUALITY.md#21-change-detection-strategy)
  - **Assigné** : Frontend Dev
  - **Estimé** : 8h

- [ ] **CODE-004** : Implémenter takeUntilDestroyed
  - **Fichiers** : 8 fichiers avec subscriptions
  - **Action** : Remplacer patterns manuels par `takeUntilDestroyed()`
  - **Référence** : [02_AUDIT_CODE_QUALITY.md#22](./02_AUDIT_CODE_QUALITY.md#22-lifecycle-hooks---fuites-mémoire)
  - **Assigné** : Frontend Dev
  - **Estimé** : 4h

- [ ] **CODE-005** : Corriger types `any`
  - **Fichiers** : 36 fichiers identifiés
  - **Action** : Remplacer par types stricts
  - **Référence** : [02_AUDIT_CODE_QUALITY.md#31](./02_AUDIT_CODE_QUALITY.md#31-type-safety)
  - **Assigné** : Frontend Dev
  - **Estimé** : 8h

---

### Logique Métier - Haute

- [ ] **BIZ-005** : Ajouter transactions DB
  - **Fichiers** : `payments.service.ts`, `quotes.service.ts`
  - **Action** : Wrapper operations critiques dans QueryRunner transactions
  - **Référence** : [04_AUDIT_LOGIQUE_METIER.md#51](./04_AUDIT_LOGIQUE_METIER.md#51-critique---pas-de-transactions-db)
  - **Assigné** : Backend Dev
  - **Estimé** : 4h

- [ ] **BIZ-006** : Ajouter validation DTOs
  - **Fichiers** : Tous les DTOs sans décorateurs
  - **Action** : Ajouter `@IsUUID()`, `@IsEnum()`, `@IsString()`, etc.
  - **Référence** : [04_AUDIT_LOGIQUE_METIER.md#41](./04_AUDIT_LOGIQUE_METIER.md#41-validations-manquantes)
  - **Assigné** : Backend Dev
  - **Estimé** : 4h

---

### UX/UI - Haute

- [ ] **UX-001** : Corriger contraste couleurs WCAG
  - **Fichier** : `frontend/tailwind.config.js`
  - **Action** : Orange #FF9800 → #E67700, Vert #4CAF50 → #2E7D32
  - **Référence** : [03_AUDIT_UX_UI.md#52](./03_AUDIT_UX_UI.md#52-problème-critique---contraste-des-couleurs)
  - **Assigné** : Frontend Dev
  - **Estimé** : 2h

- [ ] **UX-002** : Ajouter ARIA labels navigation
  - **Fichiers** : `bottom-nav.component.ts`, `ui-header.component.ts`
  - **Action** : Ajouter `aria-label`, `aria-current`
  - **Référence** : [03_AUDIT_UX_UI.md#53](./03_AUDIT_UX_UI.md#53-aria-labels-manquants)
  - **Assigné** : Frontend Dev
  - **Estimé** : 2h

- [ ] **UX-003** : Implémenter focus trap modals
  - **Fichier** : `frontend/src/app/shared/components/ui-modal/ui-modal.component.ts`
  - **Action** : Utiliser Angular CDK FocusTrapFactory
  - **Référence** : [03_AUDIT_UX_UI.md#54](./03_AUDIT_UX_UI.md#54-focus-trap-manquant-dans-modals)
  - **Assigné** : Frontend Dev
  - **Estimé** : 2h

- [ ] **UX-004** : Ajouter skip link
  - **Fichiers** : `index.html`, `app.component.ts`
  - **Action** : Ajouter lien "Aller au contenu principal"
  - **Référence** : [03_AUDIT_UX_UI.md#55](./03_AUDIT_UX_UI.md#55-skip-link-manquant)
  - **Assigné** : Frontend Dev
  - **Estimé** : 1h

- [ ] **UX-005** : Auto-save formulaires
  - **Fichier** : `frontend/src/app/features/requests/components/new-request/new-request.component.ts`
  - **Action** : Sauvegarder brouillon dans localStorage à chaque étape
  - **Référence** : [03_AUDIT_UX_UI.md#31](./03_AUDIT_UX_UI.md#31-flow-de-demande-de-réparation)
  - **Assigné** : Frontend Dev
  - **Estimé** : 3h

---

## PHASE 3 - MOYENNE PRIORITE (Mois 2)

### Sécurité

- [ ] **SEC-009** : Ajouter CSP headers
  - **Fichier** : `backend/src/main.ts`
  - **Action** : Configurer Helmet avec CSP personnalisé
  - **Estimé** : 2h

- [ ] **SEC-010** : Réduire body size limits
  - **Fichier** : `backend/src/main.ts:12-14`
  - **Action** : 50MB → 10MB, implémenter multipart pour fichiers
  - **Estimé** : 2h

- [ ] **SEC-011** : Headers sécurité frontend
  - **Fichier** : `frontend/src/index.html`
  - **Action** : Ajouter meta tags sécurité
  - **Estimé** : 30min

---

### Tests

- [ ] **TEST-001** : Tests services core
  - **Fichiers** : `auth.service.spec.ts`, `api.service.spec.ts`
  - **Action** : Créer tests unitaires
  - **Estimé** : 16h

- [ ] **TEST-002** : Tests stores
  - **Fichiers** : `auth.store.spec.ts`, `search.store.spec.ts`
  - **Action** : Créer tests unitaires
  - **Estimé** : 8h

- [ ] **TEST-003** : Tests guards/interceptors
  - **Fichiers** : `auth.guard.spec.ts`, `error.interceptor.spec.ts`
  - **Action** : Créer tests unitaires
  - **Estimé** : 4h

- [ ] **TEST-004** : Tests composants prioritaires
  - **Fichiers** : `login.component.spec.ts`, `search-home.component.spec.ts`
  - **Action** : Créer tests unitaires
  - **Estimé** : 16h

---

### Code Organization

- [ ] **CODE-006** : Créer barrel exports
  - **Fichiers** : Nouveaux `index.ts` dans core/, shared/, features/
  - **Action** : Exporter services, stores, guards
  - **Estimé** : 4h

- [ ] **CODE-007** : Configurer path aliases
  - **Fichier** : `tsconfig.json`
  - **Action** : Ajouter `@app/core`, `@app/shared`
  - **Estimé** : 1h

- [ ] **CODE-008** : Séparer DTOs backend
  - **Fichiers** : Créer `dto/` folders dans chaque module
  - **Action** : Déplacer DTOs des services vers fichiers dédiés
  - **Estimé** : 4h

---

### UX/UI

- [ ] **UX-006** : Skeleton loaders uniformes
  - **Fichier** : Créer `ui-skeleton.component.ts`
  - **Action** : Remplacer spinners par skeletons
  - **Estimé** : 4h

- [ ] **UX-007** : Indicateur offline
  - **Fichier** : Créer `network-status.component.ts`
  - **Action** : Afficher bannière quand hors ligne
  - **Estimé** : 3h

- [ ] **UX-008** : Optimistic UI updates
  - **Fichiers** : Services de mutation
  - **Action** : Implémenter pattern optimistic
  - **Estimé** : 8h

---

### Logique Métier

- [ ] **BIZ-007** : Aligner interfaces QuotePart
  - **Fichiers** : Backend entity + Frontend model
  - **Action** : Unifier noms de champs
  - **Estimé** : 1h

- [ ] **BIZ-008** : Job expiration devis
  - **Fichier** : Créer `quotes.scheduled.ts`
  - **Action** : Cron job pour expirer devis automatiquement
  - **Estimé** : 3h

- [ ] **BIZ-009** : Pattern Events cross-entity
  - **Fichiers** : Services avec mutations cross-entity
  - **Action** : Utiliser EventEmitter2
  - **Estimé** : 4h

---

## PHASE 4 - BASSE PRIORITE (Backlog)

### Sécurité
- [ ] **SEC-012** : Verrouillage compte après échecs
- [ ] **SEC-013** : Monitoring sécurité (audit logs)
- [ ] **SEC-014** : Rotation secrets
- [ ] **SEC-015** : Scanning sécurité CI/CD

### UX/UI
- [ ] **UX-009** : Dark mode complet
- [ ] **UX-010** : Login biométrique
- [ ] **UX-011** : Pull-to-refresh
- [ ] **UX-012** : Swipe gestures
- [ ] **UX-013** : Haptic feedback

### Code
- [ ] **CODE-009** : Extraire constantes dupliquées
- [ ] **CODE-010** : Refactor WebSocket vers RxJS

### Logique Métier
- [ ] **BIZ-010** : Gérer réparateur bloqué avec réparations actives
- [ ] **BIZ-011** : Lock pessimiste acceptation devis
- [ ] **BIZ-012** : Séquence DB numéros demande

---

## RECAPITULATIF PAR ROLE

### Backend Developer

| Phase | Tâches | Temps Total |
|-------|--------|-------------|
| 1 | SEC-001, SEC-002, SEC-004, SEC-005, BIZ-003, BIZ-004 | ~18h |
| 2 | SEC-006, SEC-007, BIZ-005, BIZ-006 | ~12h |
| 3 | SEC-009, SEC-010, TEST-001 (partiel), BIZ-008, BIZ-009 | ~15h |

### Frontend Developer

| Phase | Tâches | Temps Total |
|-------|--------|-------------|
| 1 | SEC-003 | ~4h |
| 2 | SEC-008, CODE-001 à 005, UX-001 à 005 | ~30h |
| 3 | SEC-011, TEST-001 à 004 (partiel), CODE-006, CODE-007, UX-006 à 008 | ~40h |

### Fullstack Developer

| Phase | Tâches | Temps Total |
|-------|--------|-------------|
| 1 | BIZ-001, BIZ-002 | ~3h |
| 3 | CODE-008, BIZ-007 | ~5h |

---

## METRIQUES DE VALIDATION

### Critères de Succès Phase 1
- [ ] Tous les tests de sécurité manuels passent
- [ ] Refresh token fonctionne correctement
- [ ] Aucun secret dans le code source
- [ ] Authorization checks sur 100% des endpoints

### Critères de Succès Phase 2
- [ ] 0 console.log en production build
- [ ] Lighthouse Performance > 80
- [ ] Lighthouse Accessibility > 80
- [ ] Tous les composants en OnPush

### Critères de Succès Phase 3
- [ ] Test coverage > 60%
- [ ] 0 violations WCAG AA critiques
- [ ] Expérience offline fonctionnelle

---

## OUTILS RECOMMANDES

### Audit Automatisé
```bash
# Sécurité
npm audit
npx snyk test

# Accessibilité
npx pa11y http://localhost:4200
npx axe-cli http://localhost:4200

# Performance
npx lighthouse http://localhost:4200 --output=json

# Code Quality
npx eslint . --ext .ts
npx tsc --noEmit
```

### CI/CD Integration
```yaml
# .github/workflows/audit.yml
jobs:
  security:
    - npm audit --audit-level=high
    - npx snyk test

  accessibility:
    - npx pa11y-ci

  quality:
    - npm run lint
    - npm run test:coverage
```

---

## CONTACTS

| Role | Responsabilité |
|------|----------------|
| Tech Lead | Validation architecture, merge PRs |
| Backend Lead | Revue sécurité, logique métier |
| Frontend Lead | Revue UX/UI, performance |
| QA | Validation tests, accessibilité |

---

*Plan de corrections créé le 6 Janvier 2026*
*Prochaine revue : Semaine 2*
