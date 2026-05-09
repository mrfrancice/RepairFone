import { Controller, Get, Query } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SpecialtyCategory } from './entities';
import { Public } from '../../common/decorators/public.decorator';

@Controller('settings')
@Public()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getAllSettings() {
    return this.settingsService.getAllSettings();
  }

  @Get('specialties')
  async getSpecialties(@Query('category') category?: SpecialtyCategory) {
    if (category) {
      return this.settingsService.getSpecialtiesByCategory(category);
    }
    return this.settingsService.getSpecialties();
  }

  @Get('problem-categories')
  async getProblemCategories() {
    return this.settingsService.getProblemCategories();
  }

  @Get('business-types')
  async getBusinessTypes() {
    return this.settingsService.getBusinessTypes();
  }

  @Get('experience-ranges')
  async getExperienceRanges() {
    return this.settingsService.getExperienceRanges();
  }

  @Get('id-document-types')
  async getIdDocumentTypes() {
    return this.settingsService.getIdDocumentTypes();
  }

  @Get('badge-types')
  async getBadgeTypes() {
    return this.settingsService.getBadgeTypes();
  }

  @Get('app-configs')
  async getAppConfigs(@Query('category') category?: string) {
    return this.settingsService.getAppConfigs(category);
  }
}
