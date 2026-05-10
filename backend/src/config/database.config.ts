import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const nodeEnv = configService.get<string>('nodeEnv');
  const isProd = nodeEnv === 'production';

  return {
    type: 'postgres',
    host: configService.get<string>('database.host'),
    port: configService.get<number>('database.port'),
    username: configService.get<string>('database.username'),
    password: configService.get<string>('database.password'),
    database: configService.get<string>('database.database'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    // SÉCURITÉ : synchronize est interdit en production (risque de perte de données).
    // En dev, on garde le comportement actuel (auto-création) jusqu'à la bascule
    // complète vers les migrations. Voir ROADMAP : T28.bis.
    synchronize: !isProd && nodeEnv === 'development',
    migrationsRun: isProd, // exécute les migrations au boot en prod
    logging: nodeEnv === 'development',
    extra: {
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      // Force UTF-8 to avoid double-encoding on Windows (locale default is WIN1252)
      client_encoding: 'UTF8',
    },
  };
};
