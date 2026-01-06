import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * BIZ-012: Create PostgreSQL sequence for request numbers
 *
 * This migration creates a database sequence to generate unique, sequential
 * request numbers. Using a database sequence ensures:
 * 1. Thread-safety: No race conditions when multiple requests are created simultaneously
 * 2. Uniqueness: Guaranteed unique numbers even under high concurrency
 * 3. Performance: Much faster than counting existing records
 * 4. Reliability: Numbers are never reused even if requests are deleted
 */
export class CreateRequestNumberSequence1736200000000 implements MigrationInterface {
  name = 'CreateRequestNumberSequence1736200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the sequence for request numbers
    // Starting from 1, incrementing by 1, no maximum (will cycle if needed)
    await queryRunner.query(`
      CREATE SEQUENCE IF NOT EXISTS request_number_seq
        START WITH 1
        INCREMENT BY 1
        NO MINVALUE
        NO MAXVALUE
        CACHE 1
    `);

    // Get the current maximum request number to initialize the sequence properly
    // This ensures we do not generate duplicate numbers for existing requests
    const result = await queryRunner.query(`
      SELECT COALESCE(
        MAX(
          CASE
            WHEN request_number ~ '^RF[0-9]{6}[0-9]+$'
            THEN CAST(SUBSTRING(request_number FROM 7) AS INTEGER)
            ELSE 0
          END
        ),
        0
      ) as max_seq
      FROM repair_requests
      WHERE request_number IS NOT NULL
    `);

    const maxSeq = result[0]?.max_seq || 0;

    // If there are existing requests, set the sequence to continue from there
    if (maxSeq > 0) {
      await queryRunner.query(`
        SELECT setval('request_number_seq', ${maxSeq}, true)
      `);
    }

    // Create an index on request_number for faster lookups (if not exists)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_repair_requests_request_number
        ON repair_requests(request_number)
    `);

    // Add a comment to document the sequence purpose
    await queryRunner.query(`
      COMMENT ON SEQUENCE request_number_seq IS
        'BIZ-012: Generates unique sequential numbers for repair requests. Format: RF{YYMM}{SEQ}'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the comment
    await queryRunner.query(`
      COMMENT ON SEQUENCE request_number_seq IS NULL
    `);

    // Drop the index (optional, keep if it improves performance)
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_repair_requests_request_number
    `);

    // Drop the sequence
    await queryRunner.query(`
      DROP SEQUENCE IF EXISTS request_number_seq
    `);
  }
}
