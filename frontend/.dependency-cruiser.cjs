/**
 * dependency-cruiser — règles d'architecture RepairFone frontend
 *
 * Couches :
 *   features → domains → core
 *   features → shared (utils/pipes/ui)
 *   shared, core : ne dépendent PAS de domains ni features
 *
 * Toutes les règles sont en `severity: warn` pendant la migration.
 * Bascule en `error` à la Phase 4 (cf. ROADMAP refactor).
 */
module.exports = {
  forbidden: [
    // ─────────────────────────────────────────────────────────────────────
    // RÈGLES MÉTIER : couches
    // ─────────────────────────────────────────────────────────────────────
    {
      name: 'core-cannot-import-domains',
      comment:
        "core/ contient l'infrastructure singleton et ne doit pas connaître les domaines métier. " +
        'Si un service core a besoin de types métier, déplace-le dans le domain concerné.',
      severity: 'warn',
      from: { path: '^src/app/core/' },
      to: { path: '^src/app/domains/' },
    },
    {
      name: 'core-cannot-import-features',
      comment: "core/ est instancié avant les features et ne doit jamais en dépendre.",
      severity: 'warn',
      from: { path: '^src/app/core/' },
      to: { path: '^src/app/features/' },
    },
    {
      name: 'shared-cannot-import-domains',
      comment:
        "shared/ est une boîte à outils générique sans métier. Si tu vois un import depuis " +
        'domains/, c\'est que le code partagé est en réalité métier — déplace-le dans le domain.',
      severity: 'warn',
      from: { path: '^src/app/shared/' },
      to: { path: '^src/app/domains/' },
    },
    {
      name: 'shared-cannot-import-features',
      comment: "shared/ ne dépend jamais d'une feature spécifique.",
      severity: 'warn',
      from: { path: '^src/app/shared/' },
      to: { path: '^src/app/features/' },
    },
    {
      name: 'domains-cannot-import-features',
      comment:
        "Les domaines exposent la logique métier ; les features la consomment. L'inverse crée un cycle.",
      severity: 'warn',
      from: { path: '^src/app/domains/' },
      to: { path: '^src/app/features/' },
    },
    {
      name: 'domain-cannot-import-other-domain-internals',
      comment:
        "Un domaine ne peut importer un autre domaine QUE via son index.ts (surface publique). " +
        'Importer des fichiers internes crée un couplage fragile.',
      severity: 'warn',
      from: { path: '^src/app/domains/([^/]+)/' },
      to: {
        path: '^src/app/domains/(?!\\1/)([^/]+)/(?!index\\.ts$).+',
        pathNot: '^src/app/domains/\\1/',
      },
    },

    // ─────────────────────────────────────────────────────────────────────
    // RÈGLES GÉNÉRIQUES (recommandations standard de dependency-cruiser)
    // ─────────────────────────────────────────────────────────────────────
    {
      name: 'no-circular',
      severity: 'warn',
      comment: 'Pas de dépendance circulaire — premier signe de mauvaise séparation.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      severity: 'info',
      comment: 'Fichier orphelin : aucun import vers lui. Candidat à la suppression.',
      from: {
        orphan: true,
        pathNot: [
          '(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|json)$', // dotfiles
          '\\.d\\.ts$',
          '(^|/)tsconfig\\.[^/]+\\.json$',
          '(^|/)src/(main|polyfills|test)\\.ts$',
          '(^|/)src/app/app\\.(routes|config|ts|html|scss)$',
          '\\.spec\\.ts$',
          '(^|/)environments/',
        ],
      },
      to: {},
    },
  ],

  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: 'node_modules|\\.spec\\.ts$|e2e/' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
      mainFields: ['module', 'main', 'types', 'typings'],
    },
    reporterOptions: {
      text: { highlightFocused: true },
    },
  },
};
