import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';

// Sous-ensemble de la réponse Nominatim/OSM réellement consommé ici.
interface NominatimAddress {
  suburb?: string;
  neighbourhood?: string;
  hamlet?: string;
  village?: string;
  city_district?: string;
  city?: string;
  town?: string;
  municipality?: string;
  state?: string;
  country?: string;
  road?: string;
  street?: string;
  house_number?: string;
}
interface NominatimReverseResponse {
  address?: NominatimAddress;
  display_name?: string;
}

interface GeocodingResult {
  address: string;
  city: string;
  quarter?: string;
  commune?: string;
  country: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

@Controller('geocoding')
export class GeocodingController {
  private readonly logger = new Logger(GeocodingController.name);
  /**
   * Reverse geocode coordinates to address
   * GET /geocoding/reverse?lat=5.3289&lon=-4.0593
   */
  @Public()
  @Get('reverse')
  async reverseGeocode(
    @Query('lat') lat: string,
    @Query('lon') lon: string,
  ): Promise<GeocodingResult> {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new HttpException('Invalid coordinates', HttpStatus.BAD_REQUEST);
    }

    try {
      // Call Nominatim from server side (no CORS issues)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'fr',
            'User-Agent': 'RepairFone/1.0 (contact@repairfone.ci)',
          },
        },
      );

      if (!response.ok) {
        throw new Error('Nominatim request failed');
      }

      const data = (await response.json()) as NominatimReverseResponse;
      const addr: NominatimAddress = data.address ?? {};

      // Extract address components for Côte d'Ivoire
      const quarter =
        addr.suburb || addr.neighbourhood || addr.hamlet || addr.village || '';
      const commune = addr.city_district || addr.suburb || '';
      const city =
        addr.city || addr.town || addr.municipality || addr.state || 'Abidjan';
      const country = addr.country || "Côte d'Ivoire";
      const road = addr.road || addr.street || '';
      const houseNumber = addr.house_number || '';

      // Build formatted address
      const formattedParts: string[] = [];
      if (quarter) formattedParts.push(quarter);
      if (commune && commune !== quarter) formattedParts.push(commune);
      if (city && city !== commune) formattedParts.push(city);

      const formattedAddress =
        formattedParts.length > 0
          ? formattedParts.join(', ')
          : `${latitude.toFixed(4)}°N, ${Math.abs(longitude).toFixed(4)}°W`;

      // Build street address
      let address = '';
      if (road) {
        address = houseNumber ? `${houseNumber} ${road}` : road;
      } else if (quarter) {
        address = quarter;
      } else {
        address = data.display_name?.split(',')[0] || 'Position détectée';
      }

      return {
        address,
        city,
        quarter: quarter || undefined,
        commune: commune || undefined,
        country,
        latitude,
        longitude,
        formattedAddress,
      };
    } catch (error) {
      this.logger.error(
        'Reverse geocoding error',
        error instanceof Error ? error.stack : String(error),
      );
      // Return fallback with coordinates
      return {
        address: 'Position détectée',
        city: 'Abidjan',
        country: "Côte d'Ivoire",
        latitude,
        longitude,
        formattedAddress: `${latitude.toFixed(4)}°N, ${Math.abs(longitude).toFixed(4)}°W`,
      };
    }
  }
}
