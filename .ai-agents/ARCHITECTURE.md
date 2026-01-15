# 🏗️ Architecture - AI Agents RepairFone v2.3

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SYSTÈME AI AGENTS REPAIRFONE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   COUCHE 1: INTERFACES D'UTILISATION                                        │
│   ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐              │
│   │   CLI Local     │ │ Claude Projects │ │  GitHub Actions │              │
│   │  (agent-cli.js) │ │   (claude.ai)   │ │  (ai-review.yml)│              │
│   └────────┬────────┘ └────────┬────────┘ └────────┬────────┘              │
│            │                   │                    │                       │
│            └───────────────────┼────────────────────┘                       │
│                                │                                            │
│   COUCHE 2: ORCHESTRATION + VALIDATION                                      │
│   ┌─────────────────────────────────────────────────────────────┐          │
│   │                      ORCHESTRATOR                            │          │
│   │                                                              │          │
│   │  ┌───────────────┐ ┌───────────────┐ ┌───────────────────┐ │          │
│   │  │   Routage     │ │  Distribution │ │    VALIDATION     │ │          │
│   │  │  (keywords)   │ │    tâches     │ │   + FEEDBACK      │ │          │
│   │  └───────────────┘ └───────────────┘ └───────────────────┘ │          │
│   │                                              │               │          │
│   │                            ┌─────────────────┘               │          │
│   │                            ▼                                 │          │
│   │                    ┌───────────────┐                        │          │
│   │                    │ ✅ ACCEPT     │ → Agent suivant        │          │
│   │                    │ ⚠️ ITERATE    │ → Feedback + Retry     │          │
│   │                    │ ❌ REJECT     │ → Escalade/Skip        │          │
│   │                    └───────────────┘                        │          │
│   └─────────────────────────────────────────────────────────────┘          │
│                                │                                            │
│   COUCHE 3: AGENTS SPÉCIALISÉS ▼                                            │
│   ┌─────────────────────────────────────────────────────────────┐          │
│   │  FRONTEND          BACKEND           QUALITY                │          │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │          │
│   │  │angular-expert│  │nestjs-expert │  │code-reviewer │      │          │
│   │  │  (min 4.0/5) │  │  (min 4.0/5) │  │  (min 3.5/5) │      │          │
│   │  └──────────────┘  └──────────────┘  └──────────────┘      │          │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │          │
│   │  │  ux-design   │  │database-expert │security-expert│      │          │
│   │  │  (min 3.5/5) │  │  (min 4.0/5) │  │  (min 4.5/5) │      │          │
│   │  └──────────────┘  └──────────────┘  └──────────────┘      │          │
│   │                                      ┌──────────────┐      │          │
│   │  OPERATIONS        DOCUMENTATION     │test-strategist     │          │
│   │  ┌──────────────┐  ┌──────────────┐  │  (min 4.0/5) │      │          │
│   │  │  devops-sre  │  │technical-    │  └──────────────┘      │          │
│   │  │  (min 4.0/5) │  │  writer      │                        │          │
│   │  └──────────────┘  │  (min 3.5/5) │                        │          │
│   │                    └──────────────┘                        │          │
│   └─────────────────────────────────────────────────────────────┘          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Système de Validation (NOUVEAU v2.3)

### Pourquoi la validation ?

L'approche précédente (linéaire sans feedback) avait des limites :
- Pas de contrôle qualité sur les outputs
- Pas de correction des erreurs
- Résultats inconsistants

### Architecture de validation

```
┌─────────────────────────────────────────────────────────────┐
│                    BOUCLE DE VALIDATION                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────────┐                                          │
│   │   AGENT      │ ──────────▶ Output + Self-Assessment     │
│   └──────────────┘                      │                   │
│          ▲                              │                   │
│          │                              ▼                   │
│          │                    ┌──────────────────┐          │
│          │                    │   VALIDATION     │          │
│          │                    │                  │          │
│          │                    │  • Parse output  │          │
│          │                    │  • Check criteria│          │
│          │                    │  • Calculate %   │          │
│          │                    └────────┬─────────┘          │
│          │                             │                    │
│          │              ┌──────────────┼──────────────┐     │
│          │              │              │              │     │
│          │              ▼              ▼              ▼     │
│          │         ┌────────┐    ┌────────┐    ┌────────┐  │
│          │         │≥90%    │    │60-89%  │    │<60%    │  │
│          │         │ACCEPT  │    │ITERATE │    │REJECT  │  │
│          │         └────┬───┘    └────┬───┘    └────┬───┘  │
│          │              │             │             │       │
│          │              │             │             │       │
│          │              ▼             │             ▼       │
│          │         Next Agent    ◀────┘        Escalade    │
│          │                                                  │
│          └──────────── Feedback ────────────────────────────┘
│                        (max 3x)                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Critères de validation par agent

| Agent | Score min | Critères vérifiés |
|-------|-----------|-------------------|
| angular-expert | 4.0/5 | hasCode, noAnyType, usesSignals, hasTypes |
| ux-design | 3.5/5 | hasRecommendations, hasAccessibility |
| nestjs-expert | 4.0/5 | hasCode, hasDTO, hasValidation, hasErrorHandling |
| database-expert | 4.0/5 | hasCode, hasEntity, hasMigration |
| code-reviewer | 3.5/5 | hasReview, hasRecommendations |
| test-strategist | 4.0/5 | hasTests, hasAssertions, hasMocks |
| security-expert | **4.5/5** | hasAudit, noVulnerabilities, hasRecommendations |
| devops-sre | 4.0/5 | hasConfig, hasDockerfile, hasCI |
| technical-writer | 3.5/5 | hasDocumentation, hasExamples |

### Self-Assessment de l'agent

Chaque agent inclut une auto-évaluation :

```markdown
### Auto-évaluation
- Score: 4.2/5
- Issues:
  - [MINOR] Manque JSDoc sur méthodes publiques
  - [MAJOR] Validation DTO incomplète
```

### Décision de l'Orchestrator

```javascript
// Algorithme de validation
function validate(parsedResponse, agentCriteria) {
  let passedChecks = 0;
  
  // 1. Vérifier score minimum
  if (response.selfScore >= criteria.minScore) passedChecks++;
  
  // 2. Vérifier chaque critère
  for (const check of criteria.checks) {
    if (response[check]) passedChecks++;
  }
  
  // 3. Vérifier absence d'issues critiques
  const hasCritical = response.issues.some(i => i.severity === 'CRITICAL');
  
  // 4. Calculer score final
  const score = passedChecks / totalChecks;
  
  // 5. Décision
  if (score >= 0.9 && !hasCritical) return 'ACCEPT';
  if (score >= 0.6) return 'ITERATE';
  return 'REJECT';
}
```

---

## Flux détaillés

### Mode rapide (sans validation)

```
User ──▶ CLI ──▶ Agent 1 ──▶ Agent 2 ──▶ Agent 3 ──▶ Output
                    │           │           │
                    └───────────┴───────────┴── Contexte transmis
```

**Commande** : `node agent-cli.js --workflow api "Crée une API"`

### Mode validé (avec feedback loop)

```
User ──▶ CLI ──▶ Orchestrator
                     │
                     ├──▶ Agent 1 ◀──┐
                     │       │       │ Iteration (max 3x)
                     │       ▼       │
                     │   Validate ───┘
                     │       │
                     │       ▼ (ACCEPT)
                     │
                     ├──▶ Agent 2 ◀──┐
                     │       │       │ Iteration
                     │       ▼       │
                     │   Validate ───┘
                     │       │
                     │       ▼ (ACCEPT)
                     │
                     └──▶ Rapport Final ──▶ Output
```

**Commande** : `node agent-cli.js --workflow api --validated "Crée une API"`

---

## Exemple concret de validation

### Scénario : Création d'une API de reviews

```
📋 Workflow: api
📝 Query: "Crée une API de gestion des avis"
🔒 Mode: Validé

════════════════════════════════════════════════════════════

🔄 nestjs-expert - Iteration 1/3
   
   [Agent génère le code...]
   
   📊 Self-Assessment: 3.8/5
   ⚠️ Issues:
      [MAJOR] Validation manquante sur rating (1-5)
      [MINOR] Swagger incomplet
   
   🔍 Validation Orchestrator:
      ✓ hasCode: true
      ✓ hasDTO: true
      ✗ hasValidation: false  ← Problème
      ✓ hasErrorHandling: true
      Score: 75% → ITERATE

────────────────────────────────────────────────────────────

🔄 nestjs-expert - Iteration 2/3
   
   📨 Feedback envoyé:
   "Corrige: Ajouter @Min(1) @Max(5) sur rating dans CreateReviewDto"
   
   [Agent corrige...]
   
   📊 Self-Assessment: 4.6/5
   ✅ Issues résolues
   
   🔍 Validation Orchestrator:
      ✓ hasCode: true
      ✓ hasDTO: true
      ✓ hasValidation: true  ← Corrigé!
      ✓ hasErrorHandling: true
      Score: 94% → ACCEPT

════════════════════════════════════════════════════════════

[Passe à database-expert...]
[Passe à security-expert...]
[Passe à test-strategist...]

════════════════════════════════════════════════════════════

📊 RAPPORT FINAL

| Agent | Iter | Score | Status |
|-------|------|-------|--------|
| nestjs-expert | 2 | 94% | ✅ |
| database-expert | 1 | 91% | ✅ |
| security-expert | 2 | 96% | ✅ |
| test-strategist | 1 | 88% | ✅ |

📈 Score Global: 92%
```

---

## Structure des fichiers

```
E:\angular_project\RepairFone\.ai-agents\
│
├── agents/
│   ├── _meta/
│   │   ├── orchestrator.md              # Config projet
│   │   ├── routing-matrix.md            # Règles routage
│   │   └── collaboration-protocols.md   # 🆕 Validation + Feedback
│   │
│   ├── frontend/
│   │   ├── angular-expert.md            # min 4.0/5
│   │   └── ux-design-strategist.md      # min 3.5/5
│   │
│   ├── backend/
│   │   ├── nestjs-expert.md             # min 4.0/5
│   │   └── database-expert.md           # min 4.0/5
│   │
│   ├── quality/
│   │   ├── code-reviewer.md             # min 3.5/5
│   │   ├── test-strategist.md           # min 4.0/5
│   │   └── security-expert.md           # min 4.5/5 (strict)
│   │
│   ├── operations/
│   │   └── devops-sre.md                # min 4.0/5
│   │
│   └── documentation/
│       └── technical-writer.md          # min 3.5/5
│
├── tools/
│   └── agent-cli.js                     # 🆕 v2.3 avec validation
│
├── examples/
│   └── EXAMPLES.md
│
├── README.md
├── USAGE-GUIDE.md
├── ARCHITECTURE.md                      # Ce fichier
└── INTEGRATION_REPORT.md
```

---

## Commandes CLI v2.3

```bash
# Mode rapide (sans validation)
node agent-cli.js --workflow api "Crée une API"

# Mode validé (avec boucle feedback)
node agent-cli.js --workflow api --validated "Crée une API"

# Mode interactif
node agent-cli.js --interactive
# Puis: /workflow api "..."      (rapide)
# Ou:   /workflow! api "..."     (validé)
```

---

## Métriques de qualité

| Métrique | Cible | Description |
|----------|-------|-------------|
| Validation 1ère itération | > 70% | Agents acceptés sans retry |
| Iterations moyennes | < 1.5 | Nombre moyen de tentatives |
| Taux d'escalade | < 10% | Agents échouant après 3x |
| Score moyen final | > 85% | Qualité globale |

---

**Version**: 2.3.0  
**Mise à jour**: 9 janvier 2026
