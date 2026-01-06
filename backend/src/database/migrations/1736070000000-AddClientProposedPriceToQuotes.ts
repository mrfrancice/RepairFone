import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClientProposedPriceToQuotes1736070000000 implements MigrationInterface {
  name = 'AddClientProposedPriceToQuotes1736070000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "quotes"
      ADD COLUMN IF NOT EXISTS "client_proposed_price" DECIMAL(10,2) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "quotes"
      DROP COLUMN IF EXISTS "client_proposed_price"
    `);
  }
}
