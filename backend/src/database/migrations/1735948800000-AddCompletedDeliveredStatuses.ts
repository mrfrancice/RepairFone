import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompletedDeliveredStatuses1735948800000 implements MigrationInterface {
  name = 'AddCompletedDeliveredStatuses1735948800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new values to the repair_requests_status_enum
    await queryRunner.query(`
      ALTER TYPE "repair_requests_status_enum" ADD VALUE IF NOT EXISTS 'completed';
    `);
    await queryRunner.query(`
      ALTER TYPE "repair_requests_status_enum" ADD VALUE IF NOT EXISTS 'delivered';
    `);

    // Add new values to the request_status_history_status_enum
    await queryRunner.query(`
      ALTER TYPE "request_status_history_status_enum" ADD VALUE IF NOT EXISTS 'completed';
    `);
    await queryRunner.query(`
      ALTER TYPE "request_status_history_status_enum" ADD VALUE IF NOT EXISTS 'delivered';
    `);
  }

  public down(_queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL doesn't allow removing values from enums directly
    // To revert, you would need to recreate the enum and update all references
    // This is intentionally left empty as removing enum values is complex
    console.warn(
      'Removing enum values is not supported. Manual intervention required.',
    );
    return Promise.resolve();
  }
}
