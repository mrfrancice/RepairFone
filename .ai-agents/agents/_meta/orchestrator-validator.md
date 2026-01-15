# 🧠 Architecture avec Orchestrator Intelligent - RepairFone v3.0

## Comparaison des approches

### v2.3 (Actuelle) - Validation par règles

```
┌────────────────────────────────────────────────────────────┐
│                    VALIDATION v2.3                          │
│                  (Règles statiques)                         │
├────────────────────────────────────────────────────────────┤
│                                                             │
│   CLI (JavaScript)                                          │
│        │                                                    │
│        ▼                                                    │
│   Agent ──▶ Output ──▶ Regex/Checks ──▶ Score              │
│                        (hasCode?)                           │
│                        (hasDTO?)                            │
│                                                             │
│   ⚠️ Limites:                                               │
│   - Ne comprend PAS le code                                 │
│   - Vérifie la FORME, pas le FOND                          │
│   - Pas de détection de bugs logiques                      │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### v3.0 (Proposée) - Validation par Agent Orchestrator

```
┌────────────────────────────────────────────────────────────┐
│                    VALIDATION v3.0                          │
│              (Agent Orchestrator Intelligent)               │
├────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │            🧠 AGENT ORCHESTRATOR                     │  │
│   │           (Claude avec prompt spécialisé)            │  │
│   │                                                      │  │
│   │   Capacités:                                         │  │
│   │   ✓ Comprend le code sémantiquement                 │  │
│   │   ✓ Détecte les incohérences                        │  │
│   │   ✓ Valide la logique métier                        │  │
│   │   ✓ Vérifie la cohérence inter-agents               │  │
│   │   ✓ Génère des feedbacks intelligents               │  │
│   └─────────────────────────────────────────────────────┘  │
│                          │                                  │
│            ┌─────────────┼─────────────┐                   │
│            │             │             │                    │
│            ▼             ▼             ▼                    │
│       ┌────────┐   ┌────────┐   ┌────────┐                │
│       │Agent 1 │   │Agent 2 │   │Agent 3 │                │
│       └───┬────┘   └───┬────┘   └───┬────┘                │
│           │            │            │                       │
│           └────────────┴────────────┘                       │
│                        │                                    │
│                        ▼                                    │
│              ┌──────────────────┐                          │
│              │   ORCHESTRATOR   │                          │
│              │   valide avec    │                          │
│              │   compréhension  │                          │
│              │   du contexte    │                          │
│              └────────┬─────────┘                          │
│                       │                                     │
│         ┌─────────────┼─────────────┐                      │
│         │             │             │                       │
│         ▼             ▼             ▼                       │
│    ✅ ACCEPT    ⚠️ ITERATE    ❌ ESCALADE                  │
│    (compris +   (feedback     (demande                     │
│     correct)    intelligent)  clarification                │
│                               à l'utilisateur)             │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## Implémentation de l'Agent Orchestrator

### Fichier: agents/_meta/orchestrator-validator.md

```markdown
---
name: repairfone-orchestrator-validator
version: "3.0"
model: claude-sonnet-4-20250514
role: orchestrator
---

# Orchestrator Validator - RepairFone

## MISSION

Tu es l'Orchestrator principal du système multi-agents RepairFone.
Tu coordonnes les agents spécialisés et VALIDES leurs outputs.

## TES RESPONSABILITÉS

### 1. Distribution des tâches
- Analyser la requête utilisateur
- Identifier les agents nécessaires
- Définir l'ordre d'exécution

### 2. Validation des outputs
Pour chaque output d'agent, tu dois:

#### A. Comprendre le code
- Lire et analyser le code produit
- Vérifier qu'il répond à la demande
- Identifier les patterns utilisés

#### B. Vérifier la qualité
- Le code compile-t-il (syntaxe correcte) ?
- Les imports sont-ils corrects ?
- Les types sont-ils cohérents ?
- Y a-t-il des bugs logiques évidents ?

#### C. Vérifier les standards RepairFone
- Utilise Signals (pas de @Input/@Output legacy) ?
- Utilise la nouvelle syntaxe @if/@for ?
- DTOs avec class-validator ?
- Guards sur les endpoints sensibles ?

#### D. Vérifier la cohérence inter-agents
- Le Controller utilise-t-il le bon DTO ?
- L'Entity correspond-elle au DTO ?
- Les tests couvrent-ils le code produit ?

### 3. Génération de feedback

Si l'output n'est pas satisfaisant:

\```markdown
## 🔄 FEEDBACK ORCHESTRATOR

### Évaluation: X/5

### Problèmes détectés:
1. **[CRITIQUE]** Description du problème
   - Localisation: fichier/ligne
   - Impact: pourquoi c'est grave
   - Solution: comment corriger

2. **[MAJEUR]** ...

### Code à corriger:
\```typescript
// Ligne actuelle (incorrecte)
const result = data.map(x => x.value);

// Correction attendue
const result = data.map((x): number => x.value ?? 0);
\```

### Questions de clarification:
- [Si ambigu] Vouliez-vous X ou Y ?
\```

### 4. Synthèse finale

Une fois tous les agents validés:
- Consolider les outputs
- Vérifier la cohérence globale
- Produire un résumé pour l'utilisateur
```

---

## Flux de validation détaillé

### Étape 1: Requête utilisateur

```
User: "Crée une API de gestion des favoris"
```

### Étape 2: Orchestrator analyse et planifie

```
🧠 ORCHESTRATOR ANALYSE:

Requête: API de gestion des favoris
Type: CRUD API avec relation user-repairer

Plan d'exécution:
1. nestjs-expert → Controller + Service
2. database-expert → Entity + Migration  
3. security-expert → Audit
4. test-strategist → Tests

Critères de validation:
- Entity 'Favorite' avec user_id, repairer_id, created_at
- Contrainte unique (user_id, repairer_id)
- Endpoints: POST /favorites, DELETE /favorites/:id, GET /favorites
- Guard: utilisateur ne peut voir que SES favoris
```

### Étape 3: Agent 1 produit

```typescript
// nestjs-expert output
@Controller('favorites')
export class FavoritesController {
  @Post()
  @UseGuards(JwtAuthGuard)
  async addFavorite(@Body() dto: CreateFavoriteDto, @Request() req) {
    return this.favoritesService.create(dto, req.user.id);
  }
  
  @Get()
  @UseGuards(JwtAuthGuard) 
  async getFavorites(@Request() req) {
    return this.favoritesService.findByUser(req.user.id);
  }
  
  // ... DELETE endpoint
}
```

### Étape 4: Orchestrator valide Agent 1

```
🧠 ORCHESTRATOR VALIDATION (nestjs-expert):

✅ Points positifs:
- Structure correcte du controller
- Guards JWT présents
- Injection du user.id

⚠️ Problèmes détectés:
1. [MAJEUR] CreateFavoriteDto non montré - impossible de valider
2. [MINEUR] Pas de @ApiTags pour Swagger
3. [MINEUR] Pas de gestion d'erreur si favori existe déjà

📊 Score: 3.5/5 → ITERATE

📝 Feedback à l'agent:
"Montre le CreateFavoriteDto avec validation.
 Ajoute gestion de l'erreur ConflictException si favori existe.
 Ajoute @ApiTags('favorites')."
```

### Étape 5: Agent 1 corrige

```typescript
// nestjs-expert output v2
export class CreateFavoriteDto {
  @IsUUID()
  @ApiProperty({ description: 'ID du réparateur' })
  repairerId: string;
}

@ApiTags('favorites')
@Controller('favorites')
export class FavoritesController {
  @Post()
  @UseGuards(JwtAuthGuard)
  async addFavorite(@Body() dto: CreateFavoriteDto, @Request() req) {
    const existing = await this.favoritesService.findOne(req.user.id, dto.repairerId);
    if (existing) {
      throw new ConflictException('Déjà en favoris');
    }
    return this.favoritesService.create(dto.repairerId, req.user.id);
  }
  // ...
}
```

### Étape 6: Orchestrator re-valide

```
🧠 ORCHESTRATOR VALIDATION (nestjs-expert v2):

✅ Tous les critères satisfaits:
- DTO avec validation class-validator
- Gestion ConflictException
- Swagger tags
- Guards présents

📊 Score: 4.5/5 → ACCEPT ✅

Contexte pour database-expert:
- DTO attend repairerId (UUID)
- Service a besoin de: create(repairerId, userId), findOne(userId, repairerId), findByUser(userId)
```

### Étape 7: Validation cohérence inter-agents

Après database-expert:

```
🧠 ORCHESTRATOR - VALIDATION COHÉRENCE:

Vérifie que Entity correspond au Controller:

Controller attend: repairerId, userId
Entity a: 
  @Column() user_id: string ✅
  @Column() repairer_id: string ✅
  @CreateDateColumn() created_at ✅
  @Unique(['user_id', 'repairer_id']) ✅

✅ Cohérent!
```

---

## Implémentation JavaScript

```javascript
// orchestrator-validator.js

async function orchestratorValidate(client, agentOutput, context) {
  const validationPrompt = `
Tu es l'Orchestrator Validator de RepairFone.

## Contexte de la tâche
${context.originalQuery}

## Plan établi
${context.plan}

## Output de l'agent ${context.currentAgent}
\`\`\`
${agentOutput}
\`\`\`

## Outputs précédents (pour cohérence)
${context.previousOutputs.map(o => `### ${o.agent}\n${o.summary}`).join('\n')}

## Ta mission
1. Analyse cet output en profondeur
2. Vérifie qu'il répond à la demande
3. Vérifie la qualité du code
4. Vérifie la cohérence avec les outputs précédents
5. Donne un score /5 et une décision

## Format de réponse
{
  "score": X.X,
  "decision": "ACCEPT|ITERATE|REJECT|ESCALATE",
  "analysis": {
    "positives": ["..."],
    "issues": [
      {"severity": "CRITICAL|MAJOR|MINOR", "description": "...", "fix": "..."}
    ],
    "coherenceCheck": "OK|ISSUES",
    "coherenceIssues": ["..."]
  },
  "feedback": "Message à renvoyer à l'agent si ITERATE",
  "contextForNext": "Résumé pour le prochain agent"
}
`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: validationPrompt }]
  });

  return JSON.parse(response.content[0].text);
}

async function runWorkflowWithOrchestrator(client, workflow, query) {
  // 1. Orchestrator planifie
  const plan = await orchestratorPlan(client, query, workflow);
  
  const context = {
    originalQuery: query,
    plan: plan,
    previousOutputs: []
  };
  
  // 2. Pour chaque agent
  for (const agentId of workflow.agents) {
    let iteration = 0;
    let accepted = false;
    
    while (!accepted && iteration < 3) {
      iteration++;
      
      // 2a. Agent produit
      const agentOutput = await callAgent(client, agentId, query, context);
      
      // 2b. Orchestrator valide (APPEL API SUPPLÉMENTAIRE)
      context.currentAgent = agentId;
      const validation = await orchestratorValidate(client, agentOutput, context);
      
      console.log(`📊 Orchestrator: ${validation.score}/5 - ${validation.decision}`);
      
      if (validation.decision === 'ACCEPT') {
        accepted = true;
        context.previousOutputs.push({
          agent: agentId,
          output: agentOutput,
          summary: validation.contextForNext
        });
      } else if (validation.decision === 'ITERATE') {
        // Ajouter feedback au contexte pour retry
        context.feedback = validation.feedback;
      } else if (validation.decision === 'ESCALATE') {
        // Demander clarification à l'utilisateur
        console.log('❓ Clarification nécessaire:', validation.feedback);
        // ... attendre input utilisateur
      }
    }
  }
  
  // 3. Orchestrator synthèse finale
  return await orchestratorSynthesize(client, context);
}
```

---

## Coût et performance

### v2.3 (Validation par règles)
- **Appels API**: 1 par agent
- **Coût**: N appels (N = nombre d'agents)
- **Temps**: ~30s par agent

### v3.0 (Orchestrator intelligent)
- **Appels API**: 2-3 par agent (agent + orchestrator + retry éventuel)
- **Coût**: 2N à 3N appels
- **Temps**: ~60s par agent
- **Qualité**: Significativement meilleure

### Recommandation

| Cas d'usage | Version recommandée |
|-------------|---------------------|
| Prototypage rapide | v2.3 (règles) |
| Code production | v3.0 (orchestrator) |
| Budget limité | v2.3 (règles) |
| Qualité critique | v3.0 (orchestrator) |

---

## Résumé des différences

| Aspect | v2.3 (Règles) | v3.0 (Orchestrator) |
|--------|---------------|---------------------|
| Validation | Regex/checks | Compréhension IA |
| Détecte bugs logiques | ❌ Non | ✅ Oui |
| Cohérence inter-agents | ❌ Non | ✅ Oui |
| Feedback intelligent | ⚠️ Basique | ✅ Contextuel |
| Coût API | 1x | 2-3x |
| Qualité output | Bonne | Excellente |

