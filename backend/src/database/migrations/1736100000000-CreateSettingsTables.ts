import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSettingsTables1736100000000 implements MigrationInterface {
  name = 'CreateSettingsTables1736100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create specialty_category enum if not exists
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "specialty_category_enum" AS ENUM ('brand', 'device_type', 'repair_type');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create specialties table if not exists
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "specialties" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "code" character varying(100) NOT NULL,
        "name" character varying(150) NOT NULL,
        "icon" character varying(10),
        "category" "specialty_category_enum" NOT NULL DEFAULT 'repair_type',
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "UQ_specialties_code" UNIQUE ("code"),
        CONSTRAINT "PK_specialties" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_specialties_code" ON "specialties" ("code")`);

    // Create problem_categories table if not exists
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "problem_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "code" character varying(100) NOT NULL,
        "name" character varying(150) NOT NULL,
        "icon" character varying(10),
        "color" character varying(50),
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "UQ_problem_categories_code" UNIQUE ("code"),
        CONSTRAINT "PK_problem_categories" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_problem_categories_code" ON "problem_categories" ("code")`);

    // Create business_types table if not exists
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "business_types" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "code" character varying(50) NOT NULL,
        "name" character varying(150) NOT NULL,
        "description" text,
        "requires_rccm" boolean NOT NULL DEFAULT false,
        "requires_tax_id" boolean NOT NULL DEFAULT false,
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "UQ_business_types_code" UNIQUE ("code"),
        CONSTRAINT "PK_business_types" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_business_types_code" ON "business_types" ("code")`);

    // Create experience_ranges table if not exists
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "experience_ranges" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "code" character varying(20) NOT NULL,
        "label" character varying(100) NOT NULL,
        "min_years" integer,
        "max_years" integer,
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "UQ_experience_ranges_code" UNIQUE ("code"),
        CONSTRAINT "PK_experience_ranges" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_experience_ranges_code" ON "experience_ranges" ("code")`);

    // Create id_document_types table if not exists
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "id_document_types" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "code" character varying(50) NOT NULL,
        "name" character varying(150) NOT NULL,
        "description" text,
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "UQ_id_document_types_code" UNIQUE ("code"),
        CONSTRAINT "PK_id_document_types" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_id_document_types_code" ON "id_document_types" ("code")`);

    // Create badge_types table if not exists
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "badge_types" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "code" character varying(50) NOT NULL,
        "label" character varying(100) NOT NULL,
        "icon" character varying(10),
        "color" character varying(20),
        "description" text,
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "UQ_badge_types_code" UNIQUE ("code"),
        CONSTRAINT "PK_badge_types" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_badge_types_code" ON "badge_types" ("code")`);

    // Create app_configs table if not exists
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "app_configs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "key" character varying(100) NOT NULL,
        "value" text NOT NULL,
        "type" character varying(50) NOT NULL DEFAULT 'string',
        "description" text,
        "category" character varying(50) NOT NULL DEFAULT 'general',
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "UQ_app_configs_key" UNIQUE ("key"),
        CONSTRAINT "PK_app_configs" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_app_configs_key" ON "app_configs" ("key")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_app_configs_key"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "app_configs"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_badge_types_code"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "badge_types"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_id_document_types_code"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "id_document_types"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_experience_ranges_code"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "experience_ranges"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_business_types_code"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "business_types"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_problem_categories_code"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "problem_categories"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_specialties_code"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "specialties"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "specialty_category_enum"`);
  }
}
