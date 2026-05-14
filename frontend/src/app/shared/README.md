# `shared/` — Boîte à outils transverse, ZÉRO métier

Bibliothèque réutilisable de composants UI génériques, pipes, directives, utilitaires.

## Contenu

| Sous-dossier | Rôle |
|---|---|
| `components/` (à terme : `ui/`) | Composants UI génériques : `ui-button`, `ui-card`, `ui-modal`, `ui-input`... |
| `directives/` | Directives génériques (focus, click-outside, etc.) |
| `pipes/` | `currency-xof`, `phone-format`, `relative-time`... |
| `validators/` | Validators Angular Forms réutilisables |
| `utils/` | Fonctions pures (formatage, calcul, helpers) |
| `services/` | Services UI sans état métier (ex. `status-labels.service.ts`) |
| `models/` | **Déprécié** — barrel de re-export temporaire pendant la migration vers `domains/*/types.ts`. À supprimer en fin de Phase 4. |

## Règles de dépendance

| Peut importer | Ne peut PAS importer |
|---|---|
| Angular CDK, Material | `domains/` |
| Autres modules `shared/` | `features/` |
| | `core/` (sauf depuis `shared/utils` neutre) |

## Critère "shared ou pas ?"

Un composant/utilitaire va dans `shared/` s'il vérifie **tous** ces points :

1. Il n'a aucune référence à une entité métier (`User`, `RepairRequest`, `Quote`, etc.).
2. Il peut être copié-collé dans un autre projet Angular sans modification.
3. Au moins 2 features distinctes l'utilisent ou pourraient l'utiliser.

Si une dépendance métier apparaît → le composant est en réalité une **feature** ou
une partie d'un **domain**.
