import { test } from '@playwright/test';

/**
 * Parcours paiement : client accepte un devis et paie.
 *
 * Étapes à scripter :
 *   1. Login client (Awa Koné) avec une demande ayant un devis reçu
 *   2. Navigation /quotes → ouverture devis
 *   3. Bouton "Accepter" → confirmation
 *   4. Redirection /payments/:id avec méthode Mock activée
 *   5. POST /payments/:id/simulate-success (env dev uniquement)
 *   6. Assert payment status = COMPLETED + status demande passe en `paid`
 *   7. Téléchargement du reçu PDF — vérifier Content-Type application/pdf
 */
test.describe('04 — Paiement et reçu', () => {
  test.fixme(
    'flow complet acceptation devis → paiement → reçu',
    async () => {
      // À implémenter quand le mock payment gateway est stable + l'endpoint
      // simulate-success bien intégré dans le flow front.
    },
  );
});
