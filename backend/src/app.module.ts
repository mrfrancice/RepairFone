import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import configuration from './config/configuration';
import { getDatabaseConfig } from './config/database.config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DevicesModule } from './modules/devices/devices.module';
import { RequestsModule } from './modules/requests/requests.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { ChatModule } from './modules/chat/chat.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ConseilsModule } from './modules/conseils/conseils.module';
import { LocationsModule } from './modules/locations/locations.module';
import { AdminModule } from './modules/admin/admin.module';
import { SettingsModule } from './modules/settings/settings.module';
import { SeederModule } from './database/seeders/seeder.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        throttlers: [{
          ttl: configService.get<number>('throttle.ttl') ?? 60000,
          limit: configService.get<number>('throttle.limit') ?? 100,
        }],
      }),
      inject: [ConfigService],
    }),

    // Feature Modules
    AuthModule,
    UsersModule,
    DevicesModule,
    RequestsModule,
    ReviewsModule,
    QuotesModule,
    ChatModule,
    NotificationsModule,
    DisputesModule,
    PaymentsModule,
    ConseilsModule,
    LocationsModule,
    AdminModule,
    SettingsModule,

    // Database Seeder
    SeederModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global Guards
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
