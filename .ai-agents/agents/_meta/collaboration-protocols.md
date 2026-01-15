# 🔄 Protocoles de Collaboration avec Validation - RepairFone v2.3

## Architecture de Validation

### Problème de l'approche linéaire

```
❌ APPROCHE ACTUELLE (Sans validation)

Agent 1 ──────▶ Agent 2 ──────▶ Agent 3 ──────▶ Résultat
   │              │              │
   └──────────────┴──────────────┴── Pas de feedback !
```

### Solution : Boucle de validation avec Orchestrator

```
✅ NOUVELLE APPROCHE (Avec validation)

                    ┌─────────────────────────┐
                    │      ORCHESTRATOR       │
                    │   (Agent Principal)     │
                    │                         │
                    │  • Distribue les tâches │
                    │  • Valide les outputs   │
                    │  • Gère les itérations  │
                    │  • Synthèse finale      │
                    └───────────┬─────────────┘
                                │
           ┌────────────────────┼────────────────────┐
           │                    │                    │
           ▼                    ▼                    ▼
    ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
    │   Agent 1   │      │   Agent 2   │      │   Agent 3   │
    └──────┬──────┘      └──────┬──────┘      └──────┬──────┘
           │                    │                    │
           │ Output + Report    │ Output + Report    │ Output + Report
           │                    │                    │
           └────────────────────┼────────────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │      VALIDATION         │
                    │                         │
                    │  ✅ Accepté → Continue  │
                    │  ⚠️ Partiel → Itération │
                    │  ❌ Rejeté → Refaire    │
                    └─────────────────────────┘
```

---

## Flux de Validation Détaillé

### Étape 1: Distribution par l'Orchestrator

```javascript
// L'Orchestrator analyse la requête et crée un plan
{
  "workflow": "api",
  "tasks": [
    { "agent": "nestjs-expert", "mission": "Créer controller", "validation_criteria": [...] },
    { "agent": "database-expert", "mission": "Créer entity", "validation_criteria": [...] },
    { "agent": "security-expert", "mission": "Audit", "validation_criteria": [...] }
  ],
  "max_iterations": 3,
  "quality_threshold": 0.8
}
```

### Étape 2: Exécution avec Report

Chaque agent retourne un **Completion Report** structuré :

```markdown
## COMPLETION REPORT

### Agent: nestjs-expert
### Task: Créer PaymentController

### Status: ✅ DONE | ⚠️ PARTIAL | ❌ BLOCKED

### Output
\```typescript
// Code généré...
\```

### Self-Assessment
| Critère | Score (1-5) | Commentaire |
|---------|-------------|-------------|
| Fonctionnalité complète | 5 | Tous les endpoints créés |
| Conventions respectées | 4 | Manque quelques JSDoc |
| Sécurité basique | 3 | Guards présents, mais audit recommandé |
| Testabilité | 4 | Services injectés |

### Score Global: 4.0/5

### Issues Identifiées
1. [MINOR] Ajouter JSDoc sur les méthodes publiques
2. [MAJOR] Validation du montant manquante dans DTO

### Dépendances
- Requiert: Entity Payment (database-expert)
- Suggère: Audit sécurité (security-expert)

### Questions pour Orchestrator
1. Doit-on gérer les remboursements partiels ?
2. Webhook Stripe en sync ou async ?
```

### Étape 3: Validation par l'Orchestrator

L'Orchestrator évalue le rapport :

```javascript
function validateOutput(report, criteria) {
  const validations = {
    // Critères automatiques
    hasCode: report.output.length > 0,
    selfScoreOK: report.globalScore >= criteria.minScore,
    noBlockers: !report.issues.some(i => i.severity === 'BLOCKER'),
    noCritical: !report.issues.some(i => i.severity === 'CRITICAL'),
    
    // Critères spécifiques au type
    hasTests: criteria.requireTests ? report.output.includes('.spec.') : true,
    hasTypes: criteria.requireTypes ? !report.output.includes(': any') : true,
    hasValidation: criteria.requireValidation ? report.output.includes('class-validator') : true
  };
  
  const score = Object.values(validations).filter(v => v).length / Object.keys(validations).length;
  
  return {
    passed: score >= criteria.threshold,
    score: score,
    failures: Object.entries(validations).filter(([k, v]) => !v).map(([k]) => k),
    action: score >= 0.9 ? 'ACCEPT' : score >= 0.6 ? 'ITERATE' : 'REJECT'
  };
}
```

### Étape 4: Actions selon résultat

```
┌─────────────────────────────────────────────────────────┐
│                   DÉCISION MATRIX                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Score ≥ 90%  ──────▶  ✅ ACCEPT                        │
│                        • Passer à l'agent suivant        │
│                        • Inclure output dans contexte    │
│                                                          │
│  60% ≤ Score < 90%  ──▶  ⚠️ ITERATE                     │
│                        • Feedback spécifique à l'agent   │
│                        • Max 2 itérations                │
│                        • Si échec → escalade ou skip     │
│                                                          │
│  Score < 60%  ──────▶  ❌ REJECT                        │
│                        • Reformuler la mission           │
│                        • Ou escalader à agent supérieur  │
│                        • Ou demander clarification user  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Boucle d'Itération

### Exemple : Agent retourne code incomplet

```
Iteration 1:
┌──────────────────────────────────────────────────────────┐
│ Orchestrator → nestjs-expert                             │
│ "Crée PaymentController avec endpoints CRUD"             │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│ nestjs-expert → Orchestrator                             │
│ Score: 3.5/5                                             │
│ Issues: [MAJOR] Pas de validation DTO                    │
│         [MAJOR] Manque gestion erreurs Stripe            │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│ VALIDATION: ⚠️ ITERATE (70%)                             │
│ Failures: hasValidation, errorHandling                   │
└──────────────────────────────────────────────────────────┘

Iteration 2:
┌──────────────────────────────────────────────────────────┐
│ Orchestrator → nestjs-expert                             │
│ "ITERATION REQUEST:                                      │
│  Ton code précédent a les problèmes suivants:            │
│  1. Ajouter validation class-validator sur CreatePaymentDto│
│  2. Ajouter try/catch avec StripeException               │
│                                                          │
│  Code précédent: [...]                                   │
│  Corrige uniquement ces points."                         │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│ nestjs-expert → Orchestrator                             │
│ Score: 4.5/5                                             │
│ Issues: [MINOR] JSDoc manquant                           │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│ VALIDATION: ✅ ACCEPT (92%)                              │
│ → Passer à database-expert                               │
└──────────────────────────────────────────────────────────┘
```

---

## Implémentation CLI avec Validation

### Nouveau flux dans agent-cli.js

```javascript
async function runWorkflowWithValidation(client, workflowName, query) {
  const workflow = WORKFLOWS[workflowName];
  const MAX_ITERATIONS = 3;
  const QUALITY_THRESHOLD = 0.8;
  
  let context = { query, previousOutputs: [] };
  const finalResults = [];
  
  for (const agentId of workflow.agents) {
    let iteration = 0;
    let validated = false;
    let lastOutput = null;
    
    while (!validated && iteration < MAX_ITERATIONS) {
      iteration++;
      console.log(`\n🔄 ${agentId} - Iteration ${iteration}/${MAX_ITERATIONS}`);
      
      // Construire le prompt avec feedback si itération > 1
      let prompt = buildAgentPrompt(agentId, query, context, lastOutput?.feedback);
      
      // Appeler l'agent
      const response = await callAgentWithReport(client, agentId, prompt);
      lastOutput = response;
      
      // Valider la réponse
      const validation = validateAgentOutput(response, workflow.criteria[agentId]);
      
      if (validation.action === 'ACCEPT') {
        validated = true;
        context.previousOutputs.push({
          agent: agentId,
          output: response.output,
          score: validation.score
        });
        finalResults.push({ agent: agentId, output: response.output, status: '✅' });
        console.log(`✅ Validé (${Math.round(validation.score * 100)}%)`);
        
      } else if (validation.action === 'ITERATE') {
        console.log(`⚠️ Itération requise (${Math.round(validation.score * 100)}%)`);
        console.log(`   Problèmes: ${validation.failures.join(', ')}`);
        lastOutput.feedback = generateFeedback(validation);
        
      } else {
        console.log(`❌ Rejeté - Escalade ou skip`);
        break;
      }
    }
    
    if (!validated) {
      console.log(`⚠️ ${agentId} n'a pas atteint le seuil après ${MAX_ITERATIONS} itérations`);
      // Option: continuer quand même ou arrêter
    }
  }
  
  // Synthèse finale par l'Orchestrator
  return synthesizeResults(finalResults, query);
}
```

---

## Critères de Validation par Agent

### angular-expert

```javascript
{
  minScore: 4.0,
  criteria: {
    hasStandaloneComponent: true,
    usesSignals: true,
    hasInputOutput: 'if_needed',
    noAnyType: true,
    hasAccessibility: true,
    usesControlFlow: true  // @if, @for au lieu de *ngIf
  }
}
```

### nestjs-expert

```javascript
{
  minScore: 4.0,
  criteria: {
    hasController: true,
    hasService: true,
    hasDTO: true,
    hasValidation: true,
    hasSwagger: true,
    hasErrorHandling: true,
    hasGuards: 'if_sensitive'
  }
}
```

### database-expert

```javascript
{
  minScore: 4.0,
  criteria: {
    hasEntity: true,
    hasRelations: 'if_needed',
    hasIndexes: true,
    hasMigration: true,
    noNPlusOne: true,
    hasTransactions: 'if_needed'
  }
}
```

### security-expert

```javascript
{
  minScore: 4.5,  // Plus strict pour la sécurité
  criteria: {
    noInjection: true,
    noXSS: true,
    hasInputValidation: true,
    hasOutputEncoding: true,
    hasAuthCheck: true,
    hasRateLimiting: 'if_public',
    noSensitiveDataLeak: true
  }
}
```

### test-strategist

```javascript
{
  minScore: 4.0,
  criteria: {
    hasUnitTests: true,
    coversHappyPath: true,
    coversEdgeCases: true,
    hasMocks: true,
    isIsolated: true,
    hasAssertions: true
  }
}
```

---

## Communication de Feedback

### Template de feedback pour itération

```markdown
## 🔄 ITERATION REQUEST

### Agent: {agent_id}
### Iteration: {n}/{max}

### Évaluation précédente
- **Score**: {score}%
- **Status**: {action}

### Problèmes identifiés

{foreach failure}
#### ❌ {failure.name}
**Attendu**: {failure.expected}
**Trouvé**: {failure.found}
**Comment corriger**: {failure.fix_hint}
{/foreach}

### Code précédent (à améliorer)
\```typescript
{previous_code}
\```

### Mission mise à jour
Corrige UNIQUEMENT les problèmes listés ci-dessus.
Ne modifie pas le reste du code.
Retourne le code complet corrigé.
```

---

## Escalade et Résolution de Conflits

### Quand escalader

| Situation | Action |
|-----------|--------|
| Agent échoue après 3 itérations | Escalade vers agent senior ou user |
| Conflit entre agents | Orchestrator tranche selon priorités |
| Question ambiguë | Demander clarification à l'utilisateur |
| Dépendance bloquante | Réordonner le workflow |

### Hiérarchie de décision

```
                    ┌─────────────┐
                    │    USER     │  ← Dernier recours
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │ ORCHESTRATOR│  ← Arbitre principal
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│security-expert│  │ code-reviewer │  │ Autres agents │
│  (Sécurité    │  │  (Qualité     │  │               │
│   prioritaire)│  │   code)       │  │               │
└───────────────┘  └───────────────┘  └───────────────┘
```

### Priorités de décision

1. **Sécurité** - Toujours prioritaire
2. **Fonctionnalité** - Doit marcher
3. **Performance** - Si impact utilisateur
4. **Maintenabilité** - Qualité code
5. **Style** - Conventions, préférences

---

## Métriques de Qualité

### KPIs du système de validation

| Métrique | Cible | Calcul |
|----------|-------|--------|
| Taux de validation 1ère itération | > 70% | Validés iter 1 / Total |
| Iterations moyennes | < 1.5 | Somme iterations / Tâches |
| Taux d'escalade | < 10% | Escalades / Total |
| Score moyen final | > 85% | Moyenne scores acceptés |
| Temps par workflow | < 2min | Temps total / Workflows |

---

## Exemple Complet : Workflow API avec Validation

```
📋 Workflow: api
📝 Query: "Crée une API de gestion des avis (reviews)"

════════════════════════════════════════════════════════════

🔄 nestjs-expert - Iteration 1/3
   Mission: Créer ReviewController et ReviewService
   
   ⏳ Processing...
   
   📊 Self-Assessment: 3.8/5
   ⚠️ Issues:
      [MAJOR] Validation manquante sur rating (1-5)
      [MINOR] Swagger incomplet
   
   🔍 Validation: 72% - ITERATE
   
🔄 nestjs-expert - Iteration 2/3
   Mission: Corriger validation rating + Swagger
   
   ⏳ Processing...
   
   📊 Self-Assessment: 4.6/5
   ✅ Issues résolues
   
   🔍 Validation: 94% - ACCEPT
   
────────────────────────────────────────────────────────────

🔄 database-expert - Iteration 1/3
   Mission: Créer Review entity avec relations
   Context: Controller créé, endpoints définis
   
   ⏳ Processing...
   
   📊 Self-Assessment: 4.5/5
   
   🔍 Validation: 91% - ACCEPT
   
────────────────────────────────────────────────────────────

🔄 security-expert - Iteration 1/3
   Mission: Audit sécurité
   Context: Controller + Entity créés
   
   ⏳ Processing...
   
   📊 Self-Assessment: 4.2/5
   ⚠️ Issues:
      [CRITICAL] Pas de vérification ownership avant update/delete
   
   🔍 Validation: 65% - ITERATE
   
🔄 security-expert - Iteration 2/3
   Mission: Ajouter vérification ownership
   
   ⏳ Processing...
   
   📊 Self-Assessment: 4.8/5
   
   🔍 Validation: 96% - ACCEPT

────────────────────────────────────────────────────────────

🔄 test-strategist - Iteration 1/3
   Mission: Tests unitaires + E2E
   
   ⏳ Processing...
   
   📊 Self-Assessment: 4.4/5
   
   🔍 Validation: 88% - ACCEPT

════════════════════════════════════════════════════════════

📊 RÉSUMÉ WORKFLOW

| Agent | Iterations | Score Final | Status |
|-------|------------|-------------|--------|
| nestjs-expert | 2 | 94% | ✅ |
| database-expert | 1 | 91% | ✅ |
| security-expert | 2 | 96% | ✅ |
| test-strategist | 1 | 88% | ✅ |

📈 Score Global: 92%
⏱️ Temps total: 1m 42s
🔄 Iterations totales: 6

✅ Workflow complété avec succès!
```

---

**Version**: 2.3.0  
**Mise à jour**: 9 janvier 2026
