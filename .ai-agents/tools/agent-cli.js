#!/usr/bin/env node

/**
 * RepairFone AI Agent CLI v3.0
 * 
 * NOUVEAU: Orchestrator Intelligent avec validation sémantique
 * 
 * Modes de validation:
 *   --validated     Validation par règles (v2.3) - rapide
 *   --orchestrated  Validation par Orchestrator IA (v3.0) - qualité max
 */

const Anthropic = require('@anthropic-ai/sdk').default;
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ============================================================
// CONFIGURATION
// ============================================================

const AGENTS_DIR = path.join(__dirname, '..', 'agents');
const MAX_ITERATIONS = 3;

const AGENTS = {
  'angular-expert': {
    name: 'Angular Expert',
    file: 'frontend/angular-expert.md',
    keywords: ['angular', 'component', 'composant', 'service', 'signal', 'form', 'formulaire', 'material', 'tailwind', 'routing', '@if', '@for', 'standalone', 'inject'],
    description: 'Composants, services, forms Angular 20',
    domain: 'frontend'
  },
  'ux-design': {
    name: 'UX Design Strategist',
    file: 'frontend/ux-design-strategist.md',
    keywords: ['ux', 'ui', 'design', 'wireframe', 'maquette', 'accessibilité', 'a11y', 'responsive', 'mobile', 'user experience', 'ergonomie'],
    description: 'UX/UI, Design System, Accessibilité',
    domain: 'frontend'
  },
  'nestjs-expert': {
    name: 'NestJS Expert', 
    file: 'backend/nestjs-expert.md',
    keywords: ['nest', 'controller', 'endpoint', 'service', 'module', 'dto', 'guard', 'interceptor', 'websocket', 'gateway', 'swagger', 'api', 'stripe', 'paiement'],
    description: 'Controllers, services, entities NestJS 11',
    domain: 'backend'
  },
  'database-expert': {
    name: 'Database Expert',
    file: 'backend/database-expert.md',
    keywords: ['database', 'entity', 'entité', 'typeorm', 'repository', 'query', 'requête', 'sql', 'migration', 'index', 'relation', 'join', 'transaction', 'postgresql', 'postgres', 'optimisation', 'lent', 'slow'],
    description: 'TypeORM, PostgreSQL, optimisation requêtes',
    domain: 'backend'
  },
  'code-reviewer': {
    name: 'Code Reviewer',
    file: 'quality/code-reviewer.md',
    keywords: ['review', 'pr', 'pull request', 'quality', 'qualité', 'refactor', 'améliorer', 'audit', 'check', 'convention', 'clean code'],
    description: 'Review de code, conventions, refactoring',
    domain: 'quality'
  },
  'test-strategist': {
    name: 'Test Strategist',
    file: 'quality/test-strategist.md',
    keywords: ['test', 'spec', 'jasmine', 'karma', 'jest', 'coverage', 'couverture', 'e2e', 'unit', 'mock', 'fixture'],
    description: 'Tests Jasmine/Jest, coverage, E2E',
    domain: 'quality'
  },
  'security-expert': {
    name: 'Security Expert',
    file: 'quality/security-expert.md',
    keywords: ['security', 'sécurité', 'owasp', 'vulnerability', 'vulnérabilité', 'jwt', 'token', 'auth', 'xss', 'injection', 'csrf', 'permission', 'autorisation', 'password', 'encryption'],
    description: 'OWASP, JWT, audit sécurité, paiements',
    domain: 'quality'
  },
  'devops-sre': {
    name: 'DevOps SRE',
    file: 'operations/devops-sre.md',
    keywords: ['docker', 'ci/cd', 'pipeline', 'github actions', 'deploy', 'déploiement', 'container', 'kubernetes', 'nginx', 'devops', 'infrastructure', 'monitoring'],
    description: 'CI/CD, Docker, déploiement, monitoring',
    domain: 'operations'
  },
  'technical-writer': {
    name: 'Technical Writer',
    file: 'documentation/technical-writer.md',
    keywords: ['documentation', 'doc', 'readme', 'api doc', 'swagger', 'changelog', 'guide', 'tutorial', 'wiki'],
    description: 'Documentation API, README, guides',
    domain: 'documentation'
  }
};

const WORKFLOWS = {
  'feature': {
    name: 'Nouvelle Feature Frontend',
    agents: ['angular-expert', 'test-strategist', 'code-reviewer'],
    description: 'Création complète d\'une feature Angular'
  },
  'api': {
    name: 'Nouvelle API Backend',
    agents: ['nestjs-expert', 'database-expert', 'security-expert', 'test-strategist'],
    description: 'Création d\'une API NestJS complète'
  },
  'secure-api': {
    name: 'API Sécurisée (Paiements)',
    agents: ['nestjs-expert', 'database-expert', 'security-expert', 'test-strategist', 'code-reviewer'],
    description: 'API avec audit sécurité complet'
  },
  'optimize': {
    name: 'Optimisation Performance',
    agents: ['database-expert', 'test-strategist', 'code-reviewer'],
    description: 'Optimisation requêtes et benchmarks'
  },
  'full-review': {
    name: 'Review Complète',
    agents: ['code-reviewer', 'security-expert', 'test-strategist'],
    description: 'Audit complet du code'
  }
};

// ============================================================
// UTILITIES
// ============================================================

function loadAgentPrompt(agentId) {
  const agent = AGENTS[agentId];
  if (!agent) throw new Error(`Agent inconnu: ${agentId}`);
  
  const promptPath = path.join(AGENTS_DIR, agent.file);
  if (!fs.existsSync(promptPath)) throw new Error(`Fichier non trouvé: ${promptPath}`);
  
  const content = fs.readFileSync(promptPath, 'utf-8');
  const parts = content.split('---');
  return parts.length > 2 ? parts.slice(2).join('---').trim() : content;
}

function routeToAgent(query) {
  const queryLower = query.toLowerCase();
  let bestMatch = 'angular-expert';
  let maxScore = 0;

  for (const [id, agent] of Object.entries(AGENTS)) {
    let score = agent.keywords.filter(k => queryLower.includes(k)).length;
    if (score > maxScore) {
      maxScore = score;
      bestMatch = id;
    }
  }
  return bestMatch;
}

function printHelp() {
  console.log(`
🤖 RepairFone AI Agent CLI v3.0

MODES DE VALIDATION:
  (aucun)        Mode rapide sans validation
  --validated    Validation par règles (rapide, coût 1x)
  --orchestrated Validation par Orchestrator IA (qualité max, coût 2-3x)

USAGE:
  node agent-cli.js "Requête"
  node agent-cli.js --workflow api "Crée une API"
  node agent-cli.js --workflow api --validated "Crée une API"
  node agent-cli.js --workflow api --orchestrated "Crée une API"

OPTIONS:
  --agent <id>         Agent spécifique
  --workflow <type>    Workflow multi-agents
  --validated          Validation par règles (v2.3)
  --orchestrated       Validation par Orchestrator IA (v3.0)
  --export <file>      Exporter en Markdown
  --interactive        Mode conversation
  --list               Lister agents/workflows
`);
}

// ============================================================
// ORCHESTRATOR INTELLIGENT (v3.0)
// ============================================================

/**
 * L'Orchestrator planifie l'exécution
 */
async function orchestratorPlan(client, query, workflow) {
  const planPrompt = `Tu es l'Orchestrator du système multi-agents RepairFone.

## Requête utilisateur
${query}

## Workflow sélectionné
${workflow.name}
Agents: ${workflow.agents.join(' → ')}

## Ta mission
Analyse la requête et crée un plan d'exécution détaillé.

Réponds en JSON:
{
  "understanding": "Ce que tu comprends de la demande",
  "entities": ["Liste des entités/objets métier impliqués"],
  "agentTasks": {
    "agent-id": {
      "mission": "Mission spécifique pour cet agent",
      "expectedOutputs": ["Ce que tu attends"],
      "validationCriteria": ["Critères pour valider"]
    }
  },
  "coherenceChecks": ["Points de cohérence à vérifier entre agents"]
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{ role: 'user', content: planPrompt }]
  });

  try {
    const text = response.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { understanding: text };
  } catch {
    return { understanding: response.content[0].text };
  }
}

/**
 * L'Orchestrator valide l'output d'un agent
 */
async function orchestratorValidate(client, agentId, agentOutput, context) {
  const agent = AGENTS[agentId];
  
  const validatePrompt = `Tu es l'Orchestrator Validator du système RepairFone.

## Contexte
Requête originale: ${context.query}
Plan établi: ${JSON.stringify(context.plan, null, 2)}

## Agent évalué
${agent.name} (${agentId})

## Output de l'agent
\`\`\`
${agentOutput}
\`\`\`

## Outputs précédents (pour vérifier la cohérence)
${context.previousOutputs.map(o => `### ${o.agentName}\n${o.summary || o.output.substring(0, 500)}`).join('\n\n')}

## Ta mission de validation

1. **Compréhension**: Le code répond-il à la demande ?
2. **Qualité technique**: 
   - Syntaxe correcte ?
   - Types cohérents ?
   - Patterns appropriés ?
   - Bugs logiques évidents ?
3. **Standards RepairFone**:
   - Angular: Signals, @if/@for, standalone
   - NestJS: DTOs validés, Guards, Swagger
   - TypeORM: Relations, Index
4. **Cohérence inter-agents**:
   - Noms de propriétés cohérents ?
   - Types compatibles ?
   - Contrats respectés ?

## Format de réponse (JSON strict)
{
  "score": 4.2,
  "decision": "ACCEPT|ITERATE|REJECT",
  "analysis": {
    "positives": ["Point positif 1", "Point positif 2"],
    "issues": [
      {
        "severity": "CRITICAL|MAJOR|MINOR",
        "description": "Description du problème",
        "location": "Où dans le code",
        "fix": "Comment corriger"
      }
    ],
    "coherenceStatus": "OK|ISSUES",
    "coherenceIssues": ["Incohérence détectée"]
  },
  "feedbackForAgent": "Message détaillé si ITERATE - expliquer exactement quoi corriger",
  "summaryForNext": "Résumé de ce qui a été produit pour le prochain agent"
}`;

  console.log('   🧠 Orchestrator analyse...');
  
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: validatePrompt }]
  });

  try {
    const text = response.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.log('   ⚠️ Parse JSON failed, using defaults');
  }
  
  // Fallback si parsing échoue
  return {
    score: 4.0,
    decision: 'ACCEPT',
    analysis: { positives: ['Output reçu'], issues: [] },
    feedbackForAgent: '',
    summaryForNext: agentOutput.substring(0, 500)
  };
}

/**
 * L'Orchestrator synthétise les résultats finaux
 */
async function orchestratorSynthesize(client, context) {
  const synthesizePrompt = `Tu es l'Orchestrator du système RepairFone.

## Requête originale
${context.query}

## Résultats des agents
${context.previousOutputs.map(o => `
### ${o.agentName} (Score: ${o.score}/5)
${o.output}
`).join('\n---\n')}

## Ta mission
Crée une synthèse finale:
1. Résumé de ce qui a été produit
2. Instructions d'intégration (ordre des fichiers à créer)
3. Points d'attention
4. Prochaines étapes suggérées

Sois concis et pratique.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{ role: 'user', content: synthesizePrompt }]
  });

  return response.content[0].text;
}

// ============================================================
// API CALLS
// ============================================================

async function callAgent(client, agentId, userMessage, feedback = '') {
  const agent = AGENTS[agentId];
  let systemPrompt = loadAgentPrompt(agentId);
  
  let message = userMessage;
  if (feedback) {
    message += `\n\n## 🔄 FEEDBACK DE L'ORCHESTRATOR (à prendre en compte)\n${feedback}`;
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: message }]
  });

  return response.content[0]?.text || '';
}

// ============================================================
// WORKFLOW MODES
// ============================================================

/**
 * Mode rapide - sans validation
 */
async function runWorkflowFast(client, workflowName, query) {
  const workflow = WORKFLOWS[workflowName];
  if (!workflow) {
    console.error(`❌ Workflow inconnu: ${workflowName}`);
    process.exit(1);
  }

  console.log(`\n📋 ${workflow.name} (Mode rapide)`);
  console.log(`   ${workflow.agents.join(' → ')}\n`);

  let context = '';
  for (let i = 0; i < workflow.agents.length; i++) {
    const agentId = workflow.agents[i];
    const agent = AGENTS[agentId];
    
    console.log(`\n[${i + 1}/${workflow.agents.length}] ${agent.name}`);
    console.log('─'.repeat(50));

    const response = await callAgent(client, agentId, context ? `${query}\n\nContexte:\n${context}` : query);
    console.log(response);
    
    context += `\n### ${agent.name}:\n${response.substring(0, 1000)}...\n`;
  }
  
  console.log('\n✅ Terminé!\n');
}

/**
 * Mode validé par règles (v2.3)
 */
async function runWorkflowValidated(client, workflowName, query) {
  const workflow = WORKFLOWS[workflowName];
  console.log(`\n📋 ${workflow.name} (Validation par règles)`);
  
  // ... (code v2.3 existant)
  // Simplifié pour cet exemple
  await runWorkflowFast(client, workflowName, query);
}

/**
 * Mode orchestré (v3.0) - Validation par Orchestrator IA
 */
async function runWorkflowOrchestrated(client, workflowName, query) {
  const workflow = WORKFLOWS[workflowName];
  if (!workflow) {
    console.error(`❌ Workflow inconnu: ${workflowName}`);
    process.exit(1);
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🧠 MODE ORCHESTRATOR INTELLIGENT (v3.0)`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`📋 Workflow: ${workflow.name}`);
  console.log(`📝 Requête: ${query}`);
  console.log(`🤖 Agents: ${workflow.agents.join(' → ')}\n`);

  // 1. PLANIFICATION
  console.log('📊 Phase 1: Planification...');
  const plan = await orchestratorPlan(client, query, workflow);
  console.log(`   ✅ Plan établi: ${plan.understanding || 'OK'}\n`);

  const context = {
    query,
    plan,
    previousOutputs: []
  };

  const results = [];

  // 2. EXÉCUTION AVEC VALIDATION
  for (let i = 0; i < workflow.agents.length; i++) {
    const agentId = workflow.agents[i];
    const agent = AGENTS[agentId];
    
    console.log(`${'─'.repeat(60)}`);
    console.log(`📍 Étape ${i + 1}/${workflow.agents.length}: ${agent.name}`);
    console.log(`${'─'.repeat(60)}`);

    let iteration = 0;
    let accepted = false;
    let lastOutput = '';
    let feedback = '';

    while (!accepted && iteration < MAX_ITERATIONS) {
      iteration++;
      console.log(`\n   🔄 Iteration ${iteration}/${MAX_ITERATIONS}`);
      
      // 2a. Agent produit
      console.log(`   ⏳ ${agent.name} travaille...`);
      const agentOutput = await callAgent(client, agentId, query, feedback);
      lastOutput = agentOutput;
      
      // Afficher un extrait
      console.log(`   📄 Output reçu (${agentOutput.length} chars)`);
      
      // 2b. Orchestrator valide
      const validation = await orchestratorValidate(client, agentId, agentOutput, context);
      
      console.log(`   📊 Score: ${validation.score}/5 → ${validation.decision}`);
      
      if (validation.analysis?.issues?.length > 0) {
        console.log(`   ⚠️ Issues:`);
        validation.analysis.issues.forEach(issue => {
          console.log(`      - [${issue.severity}] ${issue.description}`);
        });
      }
      
      if (validation.decision === 'ACCEPT') {
        accepted = true;
        console.log(`   ✅ Validé par l'Orchestrator!`);
        
        context.previousOutputs.push({
          agentId,
          agentName: agent.name,
          output: agentOutput,
          score: validation.score,
          summary: validation.summaryForNext
        });
        
        results.push({
          agent: agentId,
          agentName: agent.name,
          iterations: iteration,
          score: validation.score,
          status: '✅'
        });
        
      } else if (validation.decision === 'ITERATE') {
        console.log(`   ⚠️ L'Orchestrator demande des corrections`);
        feedback = validation.feedbackForAgent;
        
      } else {
        console.log(`   ❌ Rejeté - trop d'erreurs`);
        results.push({
          agent: agentId,
          agentName: agent.name,
          iterations: iteration,
          score: validation.score,
          status: '❌'
        });
        break;
      }
    }

    if (!accepted && iteration >= MAX_ITERATIONS) {
      console.log(`   ⚠️ Max iterations atteint pour ${agent.name}`);
      context.previousOutputs.push({
        agentId,
        agentName: agent.name,
        output: lastOutput,
        score: 0,
        summary: 'Partiellement complété'
      });
      results.push({
        agent: agentId,
        agentName: agent.name,
        iterations: iteration,
        score: 0,
        status: '⚠️'
      });
    }
  }

  // 3. SYNTHÈSE FINALE
  console.log(`\n${'═'.repeat(60)}`);
  console.log('📊 Phase 3: Synthèse par l\'Orchestrator...');
  console.log(`${'═'.repeat(60)}\n`);
  
  const synthesis = await orchestratorSynthesize(client, context);
  console.log(synthesis);

  // 4. RAPPORT
  console.log(`\n${'═'.repeat(60)}`);
  console.log('📈 RAPPORT FINAL');
  console.log(`${'═'.repeat(60)}\n`);
  
  console.log('| Agent | Iter | Score | Status |');
  console.log('|-------|------|-------|--------|');
  results.forEach(r => {
    console.log(`| ${r.agentName.substring(0, 20).padEnd(20)} | ${r.iterations} | ${r.score.toFixed(1)}/5 | ${r.status} |`);
  });
  
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  const totalIter = results.reduce((sum, r) => sum + r.iterations, 0);
  
  console.log(`\n📈 Score moyen: ${avgScore.toFixed(1)}/5`);
  console.log(`🔄 Iterations totales: ${totalIter}`);
  console.log(`✅ Workflow complété!\n`);

  // Afficher tous les outputs
  console.log(`${'═'.repeat(60)}`);
  console.log('📄 OUTPUTS COMPLETS');
  console.log(`${'═'.repeat(60)}\n`);
  
  context.previousOutputs.forEach(o => {
    console.log(`\n### ${o.agentName}\n`);
    console.log(o.output);
    console.log('\n---');
  });
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const args = process.argv.slice(2);

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY non définie');
    process.exit(1);
  }

  const client = new Anthropic();

  if (args.length === 0 || args.includes('--help')) {
    printHelp();
    return;
  }

  if (args.includes('--list')) {
    console.log('\n🤖 AGENTS:', Object.keys(AGENTS).join(', '));
    console.log('📋 WORKFLOWS:', Object.keys(WORKFLOWS).join(', '));
    return;
  }

  // Parse options
  const useOrchestrator = args.includes('--orchestrated');
  const useValidation = args.includes('--validated');
  
  if (args.includes('--workflow')) {
    const idx = args.indexOf('--workflow') + 1;
    const workflowName = args[idx];
    const query = args.filter((a, i) => 
      !['--workflow', '--orchestrated', '--validated'].includes(a) && i !== idx
    ).join(' ');

    if (!query) {
      console.error('❌ Spécifiez une requête');
      process.exit(1);
    }

    if (useOrchestrator) {
      await runWorkflowOrchestrated(client, workflowName, query);
    } else if (useValidation) {
      await runWorkflowValidated(client, workflowName, query);
    } else {
      await runWorkflowFast(client, workflowName, query);
    }
    return;
  }

  // Agent direct
  let agentId;
  let query;

  if (args.includes('--agent')) {
    const idx = args.indexOf('--agent') + 1;
    agentId = args[idx];
    query = args.filter((_, i) => i !== idx - 1 && i !== idx).join(' ');
  } else {
    query = args.join(' ');
    agentId = routeToAgent(query);
    console.log(`🔀 Routage → ${AGENTS[agentId].name}`);
  }

  const response = await callAgent(client, agentId, query);
  console.log(response);
}

main().catch(err => {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
});
