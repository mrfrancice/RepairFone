// ============================================
// SHARED MODELS — Barrel de retro-compatibilite
// ============================================
//
// DEPRECATED : ce fichier est un re-export temporaire des types metier.
// Pendant la migration (Phase 1 -> Phase 4), il permet aux imports existants
// `import { ... } from '@app/models'` de continuer a fonctionner.
//
// NOUVEAU CODE : importer directement depuis le domaine concerne, par exemple :
//   import { User } from '@app/domains/users';
//   import { RepairRequest } from '@app/domains/requests';
//
// Sera supprime a la Phase 4 du refactor.

// Types HTTP generiques (restent dans shared)
export * from './api';
// Helpers UI generiques (restent dans shared)
export * from './ui';

// Types metier (re-export depuis les domaines)
export * from '@app/domains/users';
export * from '@app/domains/devices';
export * from '@app/domains/repairers';
export * from '@app/domains/requests';
export * from '@app/domains/reviews';
export * from '@app/domains/quotes';
export * from '@app/domains/payments';
export * from '@app/domains/disputes';
export * from '@app/domains/chat';
export * from '@app/domains/conseils';
export * from '@app/domains/notifications';
