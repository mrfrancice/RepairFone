import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUrgencyToRepairRequests1735844400000 implements MigrationInterface {
  name = 'AddUrgencyToRepairRequests1735844400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "repair_requests"
      ADD COLUMN IF NOT EXISTS "urgency" varchar(20) NOT NULL DEFAULT 'normal'
    `);

    await queryRunner.query(`
      ALTER TABLE "repair_requests"
      ADD COLUMN IF NOT EXISTS "urgency_supplement" decimal(10,2) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "repair_requests" DROP COLUMN IF EXISTS "urgency_supplement"
    `);

    await queryRunner.query(`
      ALTER TABLE "repair_requests" DROP COLUMN IF EXISTS "urgency"
    `);
  }
}
