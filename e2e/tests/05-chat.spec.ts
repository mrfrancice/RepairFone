import { test } from '@playwright/test';

/**
 * Parcours chat : client et réparateur échangent autour d'une demande.
 *
 * Étapes à scripter (2 navigateurs en parallèle) :
 *   1. Contexte A : login client, ouvre /chat/:conversationId
 *   2. Contexte B : login réparateur, ouvre la même conversation
 *   3. A envoie un message texte → assert présent dans B (polling REST,
 *      le WebSocket n'est pas encore live en P5.2)
 *   4. B répond → assert visible chez A
 *   5. A upload une image (P4.1.2) → assert présence en preview puis envoi
 *   6. Marquage comme lu → assert unreadCount = 0
 */
test.describe('05 — Chat client / réparateur', () => {
  test.fixme(
    'échange bidirectionnel texte + image',
    async () => {
      // À implémenter en utilisant 2 BrowserContext distincts
      // (un par utilisateur) pour la concurrence.
    },
  );
});
