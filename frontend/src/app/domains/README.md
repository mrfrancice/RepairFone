# `domains/` — Logique métier réutilisable

Chaque dossier représente un **domaine métier** (entité + règles + accès données).

## Contenu typique d'un domaine

```
domains/<name>/
├── types.ts              # Interfaces, types, enums du domaine
├── <name>.service.ts     # Accès API (HTTP)
├── <name>.store.ts       # État partagé (signals)
├── index.ts              # Surface publique du domaine
└── README.md             # (optionnel) règles métier non triviales
```

## Règles de dépendance

| Peut importer | Ne peut PAS importer |
|---|---|
| `core/` (services infra) | `features/` |
| `shared/utils`, `shared/pipes` | `shared/ui`, `shared/layout` |
| Un autre domaine **uniquement** via son `index.ts` (surface publique) | Le détail interne d'un autre domaine |

## Pourquoi cette couche existe

- Casser le god-file `shared/models/index.ts` : chaque domaine porte ses propres types.
- Permettre à plusieurs `features/` de partager la même logique métier sans duplication
  (ex. : `features/client/requests/` et `features/repairer/requests/` consomment tous deux
  `domains/requests/`).
- Préparer une extraction éventuelle en library Nx sans réécriture.

## Ce qui ne va PAS dans un domaine

- Composants UI (→ `shared/ui/` ou `features/`)
- Routes ou pages (→ `features/`)
- Services techniques transverses : logger, storage, theme, geoloc (→ `core/`)
