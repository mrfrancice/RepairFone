import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStepRatingsTable1736106000000 implements MigrationInterface {
  name = 'CreateStepRatingsTable1736106000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer le type enum pour les étapes de notation (if not exists)
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "rating_step_enum" AS ENUM (
          'quote_accepted',
          'in_progress',
          'completed',
          'delivered'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Créer le type enum pour les catégories de notation (if not exists)
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "rating_category_enum" AS ENUM (
          'communication',
          'quality',
          'timeliness',
          'price',
          'overall'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Créer la table step_ratings (if not exists)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "step_ratings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "request_id" uuid NOT NULL,
        "client_id" uuid NOT NULL,
        "repairer_id" uuid NOT NULL,
        "step" "rating_step_enum" NOT NULL,
        "category" "rating_category_enum" NOT NULL,
        "rating" smallint NOT NULL,
        "comment" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_step_ratings" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_step_ratings_request_step_category" UNIQUE ("request_id", "step", "category")
      )
    `);

    // Créer les index (if not exists)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_step_ratings_request_id" ON "step_ratings" ("request_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_step_ratings_repairer_id" ON "step_ratings" ("repairer_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_step_ratings_client_id" ON "step_ratings" ("client_id")`);

    // Ajouter les clés étrangères (if not exists)
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "step_ratings"
        ADD CONSTRAINT "FK_step_ratings_request" FOREIGN KEY ("request_id")
        REFERENCES "repair_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "step_ratings"
        ADD CONSTRAINT "FK_step_ratings_client" FOREIGN KEY ("client_id")
        REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "step_ratings"
        ADD CONSTRAINT "FK_step_ratings_repairer" FOREIGN KEY ("repairer_id")
        REFERENCES "repairer_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Ajouter une colonne is_blocked au profil réparateur si elle n'existe pas
    await queryRunner.query(`
      ALTER TABLE "repairer_profiles"
      ADD COLUMN IF NOT EXISTS "is_blocked" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE "repairer_profiles"
      ADD COLUMN IF NOT EXISTS "blocked_at" TIMESTAMP WITH TIME ZONE
    `);

    await queryRunner.query(`
      ALTER TABLE "repairer_profiles"
      ADD COLUMN IF NOT EXISTS "blocked_reason" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les colonnes de blocage
    await queryRunner.query(`ALTER TABLE "repairer_profiles" DROP COLUMN IF EXISTS "blocked_reason"`);
    await queryRunner.query(`ALTER TABLE "repairer_profiles" DROP COLUMN IF EXISTS "blocked_at"`);
    await queryRunner.query(`ALTER TABLE "repairer_profiles" DROP COLUMN IF EXISTS "is_blocked"`);

    // Supprimer les clés étrangères
    await queryRunner.query(`ALTER TABLE "step_ratings" DROP CONSTRAINT IF EXISTS "FK_step_ratings_repairer"`);
    await queryRunner.query(`ALTER TABLE "step_ratings" DROP CONSTRAINT IF EXISTS "FK_step_ratings_client"`);
    await queryRunner.query(`ALTER TABLE "step_ratings" DROP CONSTRAINT IF EXISTS "FK_step_ratings_request"`);

    // Supprimer les index
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_step_ratings_client_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_step_ratings_repairer_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_step_ratings_request_id"`);

    // Supprimer la table
    await queryRunner.query(`DROP TABLE IF EXISTS "step_ratings"`);

    // Supprimer les types enum
    await queryRunner.query(`DROP TYPE IF EXISTS "rating_category_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "rating_step_enum"`);
  }
}
