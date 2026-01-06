import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class InitialSchema1704067200000 implements MigrationInterface {
  name = 'InitialSchema1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ========================================
    // 1. USERS TABLE
    // ========================================
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'phone', type: 'varchar', length: '20', isUnique: true },
          { name: 'email', type: 'varchar', length: '255', isNullable: true, isUnique: true },
          { name: 'password_hash', type: 'varchar', length: '255' },
          { name: 'first_name', type: 'varchar', length: '100', isNullable: true },
          { name: 'last_name', type: 'varchar', length: '100', isNullable: true },
          { name: 'avatar_url', type: 'varchar', length: '500', isNullable: true },
          {
            name: 'role',
            type: 'enum',
            enum: ['client', 'repairer', 'admin'],
            default: "'client'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'active', 'suspended', 'deactivated'],
            default: "'pending'",
          },
          { name: 'is_phone_verified', type: 'boolean', default: false },
          { name: 'is_email_verified', type: 'boolean', default: false },
          { name: 'preferred_language', type: 'varchar', length: '5', default: "'fr'" },
          { name: 'last_login_at', type: 'timestamp', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex('users', new TableIndex({ name: 'IDX_users_phone', columnNames: ['phone'] }));
    await queryRunner.createIndex('users', new TableIndex({ name: 'IDX_users_email', columnNames: ['email'] }));
    await queryRunner.createIndex('users', new TableIndex({ name: 'IDX_users_role', columnNames: ['role'] }));

    // ========================================
    // 2. REPAIRER PROFILES TABLE
    // ========================================
    await queryRunner.createTable(
      new Table({
        name: 'repairer_profiles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'user_id', type: 'uuid', isUnique: true },
          { name: 'business_name', type: 'varchar', length: '255', isNullable: true },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'address', type: 'varchar', length: '500', isNullable: true },
          { name: 'city', type: 'varchar', length: '100', isNullable: true },
          { name: 'commune', type: 'varchar', length: '100', isNullable: true },
          { name: 'latitude', type: 'decimal', precision: 10, scale: 8, isNullable: true },
          { name: 'longitude', type: 'decimal', precision: 11, scale: 8, isNullable: true },
          {
            name: 'verification_status',
            type: 'enum',
            enum: ['pending', 'under_review', 'verified', 'rejected', 'suspended'],
            default: "'pending'",
          },
          { name: 'certifications', type: 'jsonb', isNullable: true },
          { name: 'working_hours', type: 'jsonb', isNullable: true },
          { name: 'rating_avg', type: 'decimal', precision: 3, scale: 2, default: 0 },
          { name: 'rating_count', type: 'integer', default: 0 },
          { name: 'total_repairs', type: 'integer', default: 0 },
          { name: 'completion_rate', type: 'decimal', precision: 5, scale: 2, default: 0 },
          { name: 'accepts_home_service', type: 'boolean', default: false },
          { name: 'home_service_radius_km', type: 'integer', default: 10 },
          { name: 'is_available', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'repairer_profiles',
      new TableForeignKey({
        name: 'FK_repairer_profiles_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex('repairer_profiles', new TableIndex({ name: 'IDX_repairer_profiles_city', columnNames: ['city'] }));

    // ========================================
    // 3. DEVICES TABLE
    // ========================================
    await queryRunner.createTable(
      new Table({
        name: 'devices',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'brand', type: 'varchar', length: '100' },
          { name: 'model', type: 'varchar', length: '150' },
          {
            name: 'category',
            type: 'enum',
            enum: ['smartphone', 'tablet', 'computer', 'laptop', 'smartwatch', 'other'],
          },
          { name: 'image_url', type: 'varchar', length: '500', isNullable: true },
          { name: 'release_year', type: 'integer', isNullable: true },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex('devices', new TableIndex({ name: 'IDX_devices_brand', columnNames: ['brand'] }));
    await queryRunner.createIndex('devices', new TableIndex({ name: 'IDX_devices_category', columnNames: ['category'] }));

    // ========================================
    // 4. SERVICE TYPES TABLE
    // ========================================
    await queryRunner.createTable(
      new Table({
        name: 'service_types',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'device_id', type: 'uuid' },
          { name: 'name', type: 'varchar', length: '150' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'base_price', type: 'decimal', precision: 10, scale: 2 },
          { name: 'estimated_duration', type: 'integer', default: 60 },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'service_types',
      new TableForeignKey({
        name: 'FK_service_types_device',
        columnNames: ['device_id'],
        referencedTableName: 'devices',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // ========================================
    // 5. REPAIR REQUESTS TABLE
    // ========================================
    await queryRunner.createTable(
      new Table({
        name: 'repair_requests',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'request_number', type: 'varchar', length: '20', isUnique: true },
          { name: 'client_id', type: 'uuid' },
          { name: 'repairer_id', type: 'uuid', isNullable: true },
          { name: 'device_id', type: 'uuid', isNullable: true },
          { name: 'service_type_id', type: 'uuid', isNullable: true },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'accepted', 'rejected', 'in_progress', 'awaiting_parts', 'completed', 'cancelled', 'disputed'],
            default: "'pending'",
          },
          {
            name: 'delivery_mode',
            type: 'enum',
            enum: ['in_shop', 'at_home', 'postal'],
            default: "'in_shop'",
          },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'device_brand', type: 'varchar', length: '100', isNullable: true },
          { name: 'device_model', type: 'varchar', length: '150', isNullable: true },
          { name: 'device_serial_number', type: 'varchar', length: '100', isNullable: true },
          { name: 'images', type: 'jsonb', isNullable: true },
          { name: 'estimated_price', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'final_price', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'currency', type: 'varchar', length: '3', default: "'XOF'" },
          { name: 'preferred_date', type: 'date', isNullable: true },
          { name: 'preferred_time', type: 'varchar', length: '20', isNullable: true },
          { name: 'scheduled_at', type: 'timestamp', isNullable: true },
          { name: 'client_address', type: 'varchar', length: '500', isNullable: true },
          { name: 'client_latitude', type: 'decimal', precision: 10, scale: 8, isNullable: true },
          { name: 'client_longitude', type: 'decimal', precision: 11, scale: 8, isNullable: true },
          { name: 'estimated_duration', type: 'integer', isNullable: true },
          { name: 'started_at', type: 'timestamp', isNullable: true },
          { name: 'completed_at', type: 'timestamp', isNullable: true },
          { name: 'cancelled_at', type: 'timestamp', isNullable: true },
          { name: 'cancelled_by', type: 'uuid', isNullable: true },
          { name: 'cancellation_reason', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'repair_requests',
      new TableForeignKey({
        name: 'FK_repair_requests_client',
        columnNames: ['client_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'repair_requests',
      new TableForeignKey({
        name: 'FK_repair_requests_repairer',
        columnNames: ['repairer_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'repair_requests',
      new TableForeignKey({
        name: 'FK_repair_requests_device',
        columnNames: ['device_id'],
        referencedTableName: 'devices',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'repair_requests',
      new TableForeignKey({
        name: 'FK_repair_requests_service_type',
        columnNames: ['service_type_id'],
        referencedTableName: 'service_types',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createIndex('repair_requests', new TableIndex({ name: 'IDX_repair_requests_status', columnNames: ['status'] }));
    await queryRunner.createIndex('repair_requests', new TableIndex({ name: 'IDX_repair_requests_client', columnNames: ['client_id'] }));
    await queryRunner.createIndex('repair_requests', new TableIndex({ name: 'IDX_repair_requests_repairer', columnNames: ['repairer_id'] }));

    // ========================================
    // 6. REQUEST STATUS HISTORY TABLE
    // ========================================
    await queryRunner.createTable(
      new Table({
        name: 'request_status_history',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'request_id', type: 'uuid' },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'accepted', 'rejected', 'in_progress', 'awaiting_parts', 'completed', 'cancelled', 'disputed'],
          },
          { name: 'comment', type: 'text', isNullable: true },
          { name: 'changed_by', type: 'uuid', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'request_status_history',
      new TableForeignKey({
        name: 'FK_request_status_history_request',
        columnNames: ['request_id'],
        referencedTableName: 'repair_requests',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // ========================================
    // 7. REVIEWS TABLE
    // ========================================
    await queryRunner.createTable(
      new Table({
        name: 'reviews',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'request_id', type: 'uuid', isUnique: true },
          { name: 'client_id', type: 'uuid' },
          { name: 'repairer_id', type: 'uuid' },
          { name: 'overall_rating', type: 'integer' },
          { name: 'quality_rating', type: 'integer', isNullable: true },
          { name: 'communication_rating', type: 'integer', isNullable: true },
          { name: 'timeliness_rating', type: 'integer', isNullable: true },
          { name: 'comment', type: 'text', isNullable: true },
          { name: 'response', type: 'text', isNullable: true },
          { name: 'response_at', type: 'timestamp', isNullable: true },
          { name: 'is_visible', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'reviews',
      new TableForeignKey({
        name: 'FK_reviews_request',
        columnNames: ['request_id'],
        referencedTableName: 'repair_requests',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'reviews',
      new TableForeignKey({
        name: 'FK_reviews_client',
        columnNames: ['client_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'reviews',
      new TableForeignKey({
        name: 'FK_reviews_repairer',
        columnNames: ['repairer_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex('reviews', new TableIndex({ name: 'IDX_reviews_repairer', columnNames: ['repairer_id'] }));

    // ========================================
    // 8. OTP CODES TABLE
    // ========================================
    await queryRunner.createTable(
      new Table({
        name: 'otp_codes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'phone', type: 'varchar', length: '20' },
          { name: 'code', type: 'varchar', length: '6' },
          { name: 'expires_at', type: 'timestamp' },
          { name: 'is_used', type: 'boolean', default: false },
          { name: 'attempts', type: 'integer', default: 0 },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex('otp_codes', new TableIndex({ name: 'IDX_otp_codes_phone', columnNames: ['phone'] }));

    // ========================================
    // 9. REFRESH TOKENS TABLE
    // ========================================
    await queryRunner.createTable(
      new Table({
        name: 'refresh_tokens',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'user_id', type: 'uuid' },
          { name: 'token_hash', type: 'varchar', length: '255' },
          { name: 'expires_at', type: 'timestamp' },
          { name: 'is_revoked', type: 'boolean', default: false },
          { name: 'device_info', type: 'jsonb', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'refresh_tokens',
      new TableForeignKey({
        name: 'FK_refresh_tokens_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    console.log('✅ Initial schema migration completed successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.dropTable('refresh_tokens', true);
    await queryRunner.dropTable('otp_codes', true);
    await queryRunner.dropTable('reviews', true);
    await queryRunner.dropTable('request_status_history', true);
    await queryRunner.dropTable('repair_requests', true);
    await queryRunner.dropTable('service_types', true);
    await queryRunner.dropTable('devices', true);
    await queryRunner.dropTable('repairer_profiles', true);
    await queryRunner.dropTable('users', true);

    console.log('✅ Initial schema rollback completed');
  }
}
