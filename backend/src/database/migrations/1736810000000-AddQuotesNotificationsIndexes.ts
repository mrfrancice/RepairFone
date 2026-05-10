import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Index composites pour quotes et notifications.
 *
 * Complète la migration 1736800000000-AddPerformanceIndexes :
 * - quotes : tableaux de bord réparateur (mes devis filtrés par statut),
 *            détail demande (tous les devis associés).
 * - notifications : badge compteur "non lues" + centre de notifications.
 *
 * Toutes les commandes utilisent IF NOT EXISTS pour rester idempotentes,
 * même si la DB a été initialement créée via TypeORM synchronize.
 */
export class AddQuotesNotificationsIndexes1736810000000 implements MigrationInterface {
  name = 'AddQuotesNotificationsIndexes1736810000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Quotes : "mes devis" filtrés par statut côté réparateur
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_quotes_repairer_status"
       ON "quotes" ("repairer_id", "status")`,
    );
    // Quotes : listings triés date (admin, historique)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_quotes_status_created"
       ON "quotes" ("status", "created_at")`,
    );
    // Quotes : tri date sur devis d'une demande
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_quotes_request_created"
       ON "quotes" ("request_id", "created_at")`,
    );

    // Notifications : compteur de non-lues (clé chaude UI)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_notifications_user_read"
       ON "notifications" ("user_id", "is_read")`,
    );
    // Notifications : flux trié date par utilisateur
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_notifications_user_created"
       ON "notifications" ("user_id", "created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notifications_user_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notifications_user_read"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_quotes_request_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_quotes_status_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_quotes_repairer_status"`);
  }
}
