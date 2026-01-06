import { Controller, Get, Param, Query } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { Location } from './entities/location.entity';
import { Public } from '../../common/decorators/public.decorator';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  /**
   * Get all cities
   * GET /locations/cities
   */
  @Public()
  @Get('cities')
  async getCities(): Promise<Location[]> {
    return this.locationsService.getCities();
  }

  /**
   * Get communes by city ID
   * GET /locations/cities/:cityId/communes
   */
  @Public()
  @Get('cities/:cityId/communes')
  async getCommunesByCity(@Param('cityId') cityId: string): Promise<Location[]> {
    return this.locationsService.getCommunesByCity(cityId);
  }

  /**
   * Get communes by city name
   * GET /locations/communes?city=Abidjan
   */
  @Public()
  @Get('communes')
  async getCommunesByCityName(@Query('city') cityName: string): Promise<Location[]> {
    return this.locationsService.getCommunesByCityName(cityName);
  }

  /**
   * Get quarters by commune ID
   * GET /locations/communes/:communeId/quarters
   */
  @Public()
  @Get('communes/:communeId/quarters')
  async getQuartersByCommune(@Param('communeId') communeId: string): Promise<Location[]> {
    return this.locationsService.getQuartersByCommune(communeId);
  }

  /**
   * Get quarters by commune name (and optionally city name)
   * GET /locations/quarters?commune=Cocody&city=Abidjan
   */
  @Public()
  @Get('quarters')
  async getQuartersByCommuneName(
    @Query('commune') communeName: string,
    @Query('city') cityName?: string,
  ): Promise<Location[]> {
    return this.locationsService.getQuartersByCommuneName(communeName, cityName);
  }

  /**
   * Get full location hierarchy for frontend caching
   * GET /locations/full/hierarchy
   */
  @Public()
  @Get('full/hierarchy')
  async getFullLocationData(): Promise<{
    cities: Array<{
      id: string;
      name: string;
      latitude: number | null;
      longitude: number | null;
      communes: Array<{
        id: string;
        name: string;
        quarters: Array<{ id: string; name: string }>;
      }>;
    }>;
  }> {
    return this.locationsService.getFullLocationData();
  }

  /**
   * Get location by ID with parent and children
   * GET /locations/:id
   */
  @Public()
  @Get(':id')
  async getLocationById(@Param('id') id: string): Promise<Location | null> {
    return this.locationsService.getLocationById(id);
  }

  /**
   * Get location hierarchy from a specific location
   * GET /locations/:id/hierarchy
   */
  @Public()
  @Get(':id/hierarchy')
  async getLocationHierarchy(@Param('id') locationId: string): Promise<{
    country?: Location;
    city?: Location;
    commune?: Location;
    quarter?: Location;
  }> {
    return this.locationsService.getLocationHierarchy(locationId);
  }
}
