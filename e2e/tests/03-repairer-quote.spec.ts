import { test } from '@playwright/test';

/**
 * Parcours réparateur : envoyer un devis sur une demande reçue.
 *
 * Étapes à scripter :
 *   1. Login en tant que réparateur seedé (Jean Kouamé)
 *   2. Navigation /repairer/requests → liste des demandes
 *   3. Ouverture d'une demande pending
 *   4. Bouton "Envoyer un devis" → modal/écran de saisie
 *   5. Renseigner prix, délai, description, lignes
 *   6. Submit → assert devis créé + status demande passe en `quoted`
 *   7. Notification reçue côté client (vérifier via API ou UI)
 */
test.describe('03 — Réparateur : envoi de devis', () => {
  test.fixme(
    'flow complet envoi devis depuis une demande pending',
    async () => {
      // À implémenter après stabilisation du modal de saisie devis.
    },
  );
});
