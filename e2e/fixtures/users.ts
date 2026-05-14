/**
 * Comptes utilisés par les tests E2E.
 *
 * Source : `backend/src/database/seeders/seeder.service.ts`.
 * Le mot de passe est commun à tous les comptes seedés : `Password123!`.
 *
 * Le frontend nettoie les espaces du téléphone avant l'envoi à /auth/login.
 * Stockage DB et tests utilisent le format compact (sans espaces).
 */
export const SEED_USERS = {
  admin: {
    phone: '0700000000',
    email: 'admin@repairfone.ci',
    password: 'Password123!',
  },
  client: {
    phone: '0711111111',
    email: 'client@test.ci',
    password: 'Password123!',
  },
  repairer: {
    phone: '0722222222',
    email: 'jean.kouame@repair.ci',
    password: 'Password123!',
  },
} as const;
