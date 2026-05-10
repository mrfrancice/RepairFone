import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Index composites pour accélérer les listings paginés et filtrés.
 *
 * Cibles :
 * - /admin/users : filtres role+status, tri par createdAt
 * - /admin/repairers : filtre par verificationStatus + tri createdAt (déjà couvert par @Index ORM)
 * - /requests : filtre status + tri createdAt (client/repairer dashboards)
 * - /payments : filtre status + tri createdAt
 *
 * Toutes les commandes utilisent IF NOT EXISTS pour rester idempotentes,
 * même si la DB a été initialement créée via TypeORM synchronize.
 */
export class AddPerformanceIndexes1736800000000 implements MigrationInterface {
  name = 'AddPerformanceIndexes1736800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users : filtre admin role+status, tri createdAt
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_users_role_status" ON "users" ("role", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_users_created_at" ON "users" ("created_at")`,
    );

    // Repair requests : listings filtrés par statut puis triés date
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_repair_requests_status_created"
       ON "repair_requests" ("status", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_repair_requests_client_created"
       ON "repair_requests" ("client_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_repair_requests_repairer_created"
       ON "repair_requests" ("repairer_id", "created_at")`,
    );

    // Payments : my-payments + admin
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_payments_status_created"
       ON "payments" ("status", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_payments_client_created"
       ON "payments" ("client_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_payments_repairer_created"
       ON "payments" ("repairer_id", "created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_payments_repairer_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_payments_client_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_payments_status_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_repair_requests_repairer_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_repair_requests_client_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_repair_requests_status_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_role_status"`);
  }
}
