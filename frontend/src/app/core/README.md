# `core/` — Infrastructure et singletons

Services techniques **instanciés une seule fois** au démarrage de l'application.

## Contenu

| Sous-dossier | Rôle |
|---|---|
| `guards/` | Route guards (auth, role, onboarding) |
| `interceptors/` | HTTP interceptors (auth token, error, refresh) |
| `services/` | Services infra : logger, monitoring, secureStorage, geolocation, biometric, haptic, theme, toast, notification dispatcher |
| `stores/` | Stores globaux non-domaine (`authStore`) |

## Règles de dépendance

| Peut importer | Ne peut PAS importer |
|---|---|
| `shared/utils`, `shared/pipes` | `domains/` |
| Autres modules `core/` | `features/` |
| | `shared/ui`, `shared/layout` |

## Critère "core ou pas ?"

Un service va dans `core/` s'il vérifie **tous** ces points :

1. C'est un singleton (un seul état pour toute l'app).
2. Il n'a pas de modèle métier propre — il manipule des primitives, des DOM/storage, ou des objets génériques.
3. Plusieurs domaines pourraient en dépendre.

Contre-exemple : `notificationsApi.service.ts` (CRUD sur notifications utilisateur)
n'est **pas** dans `core/`, il va dans `domains/notifications/`. Mais le **dispatcher**
WebSocket/Push qui *route* les notifications entrantes reste dans `core/notifications/`.
