# 🔀 Matrice de Routage - RepairFone

## Routage par mots-clés

### Frontend (Angular)

| Mots-clés | Agent | Priorité |
|-----------|-------|----------|
| component, composant | angular-expert | 1 |
| service angular | angular-expert | 1 |
| signal, computed | angular-expert | 1 |
| form, formulaire, reactive | angular-expert | 1 |
| material, mat- | angular-expert | 1 |
| tailwind, css, style | angular-expert | 1 |
| routing, route, guard angular | angular-expert | 1 |
| @if, @for, @switch | angular-expert | 1 |
| standalone | angular-expert | 1 |
| inject, injection | angular-expert | 2 |

### Backend (NestJS)

| Mots-clés | Agent | Priorité |
|-----------|-------|----------|
| controller, endpoint | nestjs-expert | 1 |
| service nestjs | nestjs-expert | 1 |
| module nest | nestjs-expert | 1 |
| dto, validation | nestjs-expert | 1 |
| guard, interceptor | nestjs-expert | 1 |
| websocket, gateway, socket | nestjs-expert | 1 |
| swagger, api | nestjs-expert | 1 |
| stripe, paiement, payment | nestjs-expert | 1 |

### Base de données

| Mots-clés | Agent | Priorité |
|-----------|-------|----------|
| entity, entité | database-expert | 1 |
| typeorm, repository | database-expert | 1 |
| query, requête sql | database-expert | 1 |
| migration | database-expert | 1 |
| index, performance db | database-expert | 1 |
| relation, jointure, join | database-expert | 1 |
| transaction | database-expert | 1 |
| postgresql, postgres | database-expert | 1 |

### Qualité

| Mots-clés | Agent | Priorité |
|-----------|-------|----------|
| review, pr, pull request | code-reviewer | 1 |
| refactor, améliorer | code-reviewer | 1 |
| qualité, convention | code-reviewer | 1 |
| test, spec | test-strategist | 1 |
| jasmine, karma | test-strategist | 1 |
| jest | test-strategist | 1 |
| coverage, couverture | test-strategist | 1 |
| e2e | test-strategist | 1 |

### Sécurité

| Mots-clés | Agent | Priorité |
|-----------|-------|----------|
| security, sécurité | security-expert | 1 |
| owasp, vulnérabilité | security-expert | 1 |
| jwt, token, auth | security-expert | 1 |
| xss, injection, csrf | security-expert | 1 |
| permission, autorisation | security-expert | 1 |
| audit | security-expert | 1 |

---

## Routage par type de requête

### Création (Build)

| Demande | Agent principal | Agent secondaire |
|---------|-----------------|------------------|
| "Crée un composant..." | angular-expert | test-strategist |
| "Crée un service Angular..." | angular-expert | test-strategist |
| "Crée un controller..." | nestjs-expert | test-strategist |
| "Crée un endpoint..." | nestjs-expert | security-expert |
| "Crée une entité..." | database-expert | nestjs-expert |
| "Crée une migration..." | database-expert | - |
| "Crée des tests..." | test-strategist | - |

### Review

| Demande | Agent principal | Agent secondaire |
|---------|-----------------|------------------|
| "Review ce code..." | code-reviewer | security-expert |
| "Review ce composant..." | code-reviewer | angular-expert |
| "Review ce controller..." | code-reviewer | nestjs-expert |
| "Audit de sécurité..." | security-expert | code-reviewer |

### Optimisation

| Demande | Agent principal | Agent secondaire |
|---------|-----------------|------------------|
| "Optimise cette requête..." | database-expert | - |
| "Optimise ce composant..." | angular-expert | code-reviewer |
| "Améliore les performances..." | database-expert | code-reviewer |

### Debug

| Demande | Agent principal | Agent secondaire |
|---------|-----------------|------------------|
| "Pourquoi cette erreur..." | code-reviewer | (selon contexte) |
| "Bug dans le formulaire..." | angular-expert | code-reviewer |
| "Erreur TypeORM..." | database-expert | nestjs-expert |

---

## Workflows multi-agents

### Nouvelle feature complète

```
1. angular-expert / nestjs-expert  → Implémentation
2. test-strategist                 → Tests
3. code-reviewer                   → Review qualité
4. security-expert                 → Audit sécurité (si sensible)
```

### Nouvelle API avec paiement

```
1. nestjs-expert                   → Controller/Service
2. database-expert                 → Entités/Migration
3. security-expert                 → Audit sécurité
4. test-strategist                 → Tests
5. code-reviewer                   → Review finale
```

### Optimisation performance

```
1. database-expert                 → Analyse requêtes
2. code-reviewer                   → Review code
3. test-strategist                 → Benchmarks
```

---

## Règles de priorité

1. **Sécurité d'abord** : Si la requête mentionne paiement, auth, ou données sensibles → inclure `security-expert`

2. **Tests obligatoires** : Si du code est créé → proposer `test-strategist` en follow-up

3. **Review systématique** : Si complexité > simple → terminer par `code-reviewer`

4. **Pas de sur-engineering** : Requête simple → un seul agent

---

## Résolution de conflits

| Conflit | Règle |
|---------|-------|
| angular-expert vs code-reviewer | Si création → angular-expert, si review → code-reviewer |
| nestjs-expert vs database-expert | Si entity/migration → database-expert, sinon nestjs-expert |
| security-expert vs code-reviewer | Si sécurité explicite → security-expert, sinon code-reviewer |

---

## Escalades

| Depuis | Vers | Quand |
|--------|------|-------|
| angular-expert | code-reviewer | Refactoring complexe |
| nestjs-expert | database-expert | Optimisation requêtes |
| nestjs-expert | security-expert | Endpoints sensibles |
| test-strategist | code-reviewer | Couverture insuffisante |
| code-reviewer | security-expert | Vulnérabilité détectée |
