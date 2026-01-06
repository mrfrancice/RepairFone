import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import {
  Specialty,
  ProblemCategory,
  BusinessType,
  ExperienceRange,
  IdDocumentType,
  BadgeType,
  AppConfig,
} from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Specialty,
      ProblemCategory,
      BusinessType,
      ExperienceRange,
      IdDocumentType,
      BadgeType,
      AppConfig,
    ]),
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
