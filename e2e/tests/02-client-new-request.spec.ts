import { test } from '@playwright/test';

/**
 * Parcours client : créer une nouvelle demande de réparation.
 *
 * Étapes à scripter :
 *   1. Login en tant que client seedé (Awa Koné)
 *   2. Navigation /home → sélection d'un réparateur
 *   3. /repairer/:id → bouton "Faire une demande"
 *   4. Wizard /requests/new : marque, modèle, panne, photos, localisation
 *   5. Submit → assert demande créée en DB + redirect /requests
 *   6. Assert la demande apparaît dans la liste avec status pending
 */
test.describe('02 — Client : nouvelle demande', () => {
  test.fixme(
    'wizard complet de création de demande',
    async () => {
      // À implémenter après ajout de data-testid sur les composants
      // critiques du wizard (sélection device, picker location, upload photos).
    },
  );
});
