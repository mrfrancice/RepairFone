# Audit E2E navigateur — 2026-05-10

**Auteur** : Claude (assistant IA)
**Branche** : `RepairFoneDev`
**Outils** : MCP Chrome DevTools, parcours en live sur `http://localhost:4200` avec API `http://localhost:3000`
**Commits livrés** : `89b3e10`, `b2cb0c3`

---

## 1. Méthodologie

Audit réalisé en navigateur réel via `chrome-devtools` MCP. Trois sessions successives :

1. **Client** (`Awa Koné`, `0711111111` / `Password123!`)
2. **Réparateur** (`Kouamé`, `0722222222` / `Password123!`)
3. **Admin** (`Admin`, `0700000000` / `Password123!`)

Pour chaque rôle :
- Login + navigation vers toutes les pages accessibles
- Tests des formulaires (saisie + soumission + retour serveur)
- Vérification des routes (toutes celles déclarées + URL spéculatives)
- Capture des `console.error` et requêtes 4xx/5xx
- Tests des filtres / tri / pagination / drawers / modales sur les écrans admin

---

## 2. Périmètre testé

### Client
| Page | API testée | Statut |
|---|---|---|
| `/auth/login` | `POST /auth/login` | ✅ 200 |
| `/home` | `/repairers`, `/requests/my`, `/settings` | ✅ |
| `/requests` | `/requests/my`, `/requests/stats` | ✅ |
| `/requests/new` (sans repairerId) | — | ⚠️ redirection silencieuse vers `/search` |
| `/quotes` | `/quotes/my` | ✅ |
| `/payments` | `/payments/my` | ✅ |
| `/chat` | `/chat/conversations` | ✅ |
| `/notifications` | `/notifications` | ✅ |
| `/profile` | `/users/me` | ✅ |
| `/profile/edit` (PUT submit) | `PUT /users/me` | ✅ 200 |
| `/search` (wizard 3 étapes) | `/devices/categories`, `/devices/brands`, `/devices` | ✅ |

### Réparateur
| Page | API testée | Statut |
|---|---|---|
| `/repairer` (dashboard) | `/repairers/profile/me`, `/requests/stats`, `/requests/my` | ✅ |
| `/repairer/requests` | `/requests/my?page=1&limit=10` | ✅ |
| `/quotes` (partagé client) | `/quotes/my` | ✅ |
| `/payments` (partagé client) | `/payments/my` | ✅ |
| `/disputes` (partagé client) | `/disputes/my` | ✅ |

### Admin
| Page | API testée | Statut |
|---|---|---|
| `/admin` | `/admin/dashboard` | ✅ |
| `/admin/users` (filtres + tri + search) | `/admin/users?role=repairer&sort=firstName&order=asc&search=Kouame` | ✅ |
| `/admin/repairers` | `/admin/repairers?page=1&limit=20` | ✅ |
| `/admin/payments` (filtres) | `/admin/payments?status=refunded`, `/admin/payments/stats` | ✅ |
| `/admin/disputes` (filtres) | `/admin/disputes`, `/admin/disputes/stats` | ✅ |
| Drawer detail payment | `/admin/payments/:id` | ✅ |
| Action `block` / `unblock` / `refund` payment | `PATCH /admin/payments/:id/block`, `unblock`, `POST /:id/refund` | ✅ |
| Action `add note` dispute | `POST /admin/disputes/:id/note` | ✅ 201 |
| Action `resolve` dispute (refund_partial 5000) | `PATCH /admin/disputes/:id/resolve` | ✅ 200 |

---

## 3. Bugs identifiés (13)

### 🔴 CRITIQUE — corrigé

| # | Localisation | Description | Commit |
|---|---|---|---|
| **#10** | `shared/components/ui-data-grid/ui-data-grid.component.ts` | `computed()` de `sortedData`/`paginatedData` lisent `this.data` (Input non-signal). Une fois mémoïsé, le computed ne réagit plus quand le parent rebind `[data]`. En mode `serverSide` (où le parent recharge à chaque filtre/tri), la grille reste figée sur le 1er payload reçu. Découvert sur `/admin/payments` : filtre "Remboursés" retournait 3 lignes (1 OK + 2 stale `processing`). | [`89b3e10`](https://github.com/mrfrancice/RepairFone/commit/89b3e10) |

### 🟠 BUGS FONCTIONNELS — corrigés

| # | Localisation | Description | Commit |
|---|---|---|---|
| **#3** | `features/profile/components/profile-view`, `profile-edit` | Téléphone affiché `+225 0711111111` (préfixe accolé au numéro). Pipe `PhoneFormatPipe` existait déjà mais non câblé. Fix : pipe étendu pour préfixer `+225 ` sur les numéros 10 chiffres, et appliqué dans les 2 composants. Rendu : `+225 07 11 11 11 11`. | [`b2cb0c3`](https://github.com/mrfrancice/RepairFone/commit/b2cb0c3) |
| **#8** | `backend/src/modules/admin/admin.service.ts:371-376` | Dashboard admin affichait "25 Utilisateurs" total mais répartition "Clients 8 + Réparateurs 16 = 24". L'admin était inclus dans le total mais exclu des sous-comptes (cohérent avec `/admin/users` qui filtre `WHERE role != 'admin'`). Fix : aligner le total sur la même convention (admin exclu partout). | `b2cb0c3` |
| **#9** | `features/admin/components/dashboard/admin-dashboard.component.ts` | Tous les labels du dashboard sans accents : `Verifier`, `Gerer`, `Acceder`, `Repartition utilisateurs`, `Statuts reparateurs`, `En revision`, `Verifies`, `Rejetes`. Fix : restauration des diacritiques. | `b2cb0c3` |
| **#12** | `features/repairer/components/request-management/request-management.component.ts:1469-1475` | Stats réparateur "0 en cours / 0 terminées" alors que 4 demandes affichées (`delivered` + `rejected`). Bug : `getCompletedCount()` filtrait seulement `status === 'completed'`, ignorant `delivered`. Fix : inclure `accepted/in_progress/awaiting_parts` dans "En cours" et `completed/delivered` dans "Terminées". | `b2cb0c3` |

### 🟡 UX / ergonomie — corrigés

| # | Localisation | Description | Commit |
|---|---|---|---|
| **#4** | `features/search/components/search-home/search-home.component.ts` | Bouton "Voir les réparateurs" restait disabled sans message quand `canSearch()` retournait `false` à cause de `!hasLocation()`. Fix : ajout d'un hint contextuel "📍 Activez votre localisation ci-dessus pour voir les réparateurs proches." quand catégorie + problème sélectionnés mais localisation absente. | `b2cb0c3` |
| **#14** | `shared/components/bottom-nav/bottom-nav.component.ts` | Bottom-nav client n'avait que 3 entrées : Recherche / Demandes / Profil. Pas d'accès direct à Devis, Messages. Fix : ajout des 2 entrées. | `b2cb0c3` |
| **#15** | `shared/components/bottom-nav/bottom-nav.component.ts` | Bottom-nav réparateur n'avait que 2 entrées : Demandes / Profil. Fix : ajout Devis + Messages. | `b2cb0c3` |

### 🟢 Faux positifs — pas de bug

| # | Description |
|---|---|
| **#5** | "Cards Réparateurs proches sur `/home` non-cliquables" — le code a déjà `(click)="viewRepairer(repairer.id)"` + `cursor: pointer`. Mon test JS direct (`element.click()`) ne déclenchait pas correctement le binding Angular ; un click utilisateur réel fonctionne. |
| **#6** | "Save profile n'appelle pas le backend" — invalidé après reproduction propre via `form.requestSubmit()` : `PUT /users/me` 200 OK observé. Mon clic précédent avait perdu le binding form. |
| **#7** | "Cards `/repairer/requests` non-cliquables" — même cause que #5, le `(click)` Angular fonctionne en clic réel. |

### 🟡 Reportés au ROADMAP (non corrigés)

| # | Description | Raison |
|---|---|---|
| **#11** | "Tech Repair Pro" + "Tatou Ange" affichés à `0 m` sur `/home` ; "Vision++" et "Tatou Ange" listés avec 0 avis (pas filtrés) | Problème de seed (coordonnées 0,0 dupliquées), pas un bug code. À corriger via enrichissement seeder. |
| **#13** | Distance `? km` sur toutes les demandes côté réparateur | Calcul Haversine pas câblé sur les requests (manque la query SQL backend pour calculer la distance à partir des coordonnées client + réparateur). Sortie de scope audit. |
| **#16** | `/requests/new` (URL directe sans `?repairerId=`) redirige silencieusement vers `/search` | By-design (le composant exige un `repairerId`), mais mériterait un toast d'info "Choisissez d'abord un réparateur". |

---

## 4. Validation post-fix

Re-test E2E complet après commits `89b3e10` et `b2cb0c3` :

| Vérification | Résultat |
|---|---|
| `/admin/payments` filtre "Remboursés" | 1 ligne `Remboursé` (auparavant 3 avec 2 stales) |
| `/admin/payments` filtre "En cours" | 2 lignes `En cours` |
| `/admin/payments` filtre "Tous" | 3 lignes |
| Dashboard admin — accents | "Vérifier", "Gérer", "Accéder", "Répartition", "Statuts", "En révision", "Vérifiés", "Rejetés" tous corrects |
| Dashboard admin — total cohérent | 24 = 8 (clients) + 16 (réparateurs) |
| `/profile` téléphone | `+225 07 11 11 11 11` |
| Bottom-nav client | 5 entrées (Recherche/Demandes/Devis/Messages/Profil) |
| Bottom-nav réparateur | 4 entrées (Demandes/Devis/Messages/Profil) |
| Stats réparateur "Terminées" | 3 (compte correctement `delivered`) |
| `/search` hint UX | "📍 Activez votre localisation..." affiché quand catégorie+problème sélectionnés mais pas de localisation |
| `/admin/disputes` filtre Résolus | 1 ligne (cohérent avec stat "Résolus 1") |
| Console errors | 0 sur toutes les pages testées |

---

## 5. État final

- **Branche** : `RepairFoneDev` à jour avec `origin/RepairFoneDev`
- **Working tree** : propre
- **Bugs livrés** : 9 corrigés + 3 invalides + 3 reportés au ROADMAP
- **Régressions détectées** : 0
- **Builds backend + frontend** : ✅

## 6. Recommandations restantes (ROADMAP)

### Court terme (~30 min)
- **#16** : Toast "Choisissez d'abord un réparateur" sur redirect `/requests/new` → `/search`.
- **#11** : Enrichir `seeder.service.ts` avec des coordonnées variées (Abidjan : Cocody, Plateau, Yopougon) et filtrer les réparateurs 0 avis dans "Réparateurs proches".

### Moyen terme (~1 jour)
- **#13** : Implémenter le calcul Haversine sur `/requests/my` côté backend pour retourner la distance réelle. Nécessite que les réparateurs aient des coordonnées seedées.
- Filtre par date sur listings admin (paiements/disputes par période — utile pour audit comptable).
- Export CSV des paiements/disputes (compta).

### Sortie de scope audit (déjà tracés ailleurs)
- Conformité RGPD / CGU
- Tests E2E automatisés (Playwright)
- Migration vers `synchronize: false` en dev
- Audit log formel (table `admin_audit_log` au lieu de `metadata` JSONB)
