import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fix foreign key on repair_requests.repairer_id to reference repairer_profiles instead of users
 * This is needed because the RepairRequest entity defines repairer as ManyToOne to RepairerProfile
 */
export class FixRepairerForeignKeys1736715000000 implements MigrationInterface {
  name = 'FixRepairerForeignKeys1736715000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the old foreign key exists and drop it
    await queryRunner.query(`
      ALTER TABLE "repair_requests"
      DROP CONSTRAINT IF EXISTS "FK_repair_requests_repairer"
    `);

    // Also drop any auto-generated FK constraint by TypeORM
    await queryRunner.query(`
      DO $$
      DECLARE
        constraint_name text;
      BEGIN
        FOR constraint_name IN
          SELECT tc.constraint_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_name = 'repair_requests'
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name = 'repairer_id'
        LOOP
          EXECUTE 'ALTER TABLE "repair_requests" DROP CONSTRAINT IF EXISTS "' || constraint_name || '"';
        END LOOP;
      END $$;
    `);

    // Create new foreign key referencing repairer_profiles
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "repair_requests"
        ADD CONSTRAINT "FK_repair_requests_repairer"
        FOREIGN KEY ("repairer_id")
        REFERENCES "repairer_profiles"("id")
        ON DELETE SET NULL;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert: Drop the new foreign key
    await queryRunner.query(`
      ALTER TABLE "repair_requests"
      DROP CONSTRAINT IF EXISTS "FK_repair_requests_repairer"
    `);

    // Recreate the old foreign key referencing users
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "repair_requests"
        ADD CONSTRAINT "FK_repair_requests_repairer"
        FOREIGN KEY ("repairer_id")
        REFERENCES "users"("id")
        ON DELETE SET NULL;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
  }
}
