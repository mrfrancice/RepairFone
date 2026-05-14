import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { LoggerService } from '../../../core/services/logger.service';
import { GeolocationService } from '../../../core/services/geolocation.service';

export interface RepairerProfile {
  id: string;
  businessName?: string;
  description?: string;
  latitude: number;
  longitude: number;
  address?: string;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  specialties?: string[];
  isVerified?: boolean;
  responseTime?: number;
  estimatedPrice?: number;
  completedRepairs?: number;
  yearsOfExperience?: number;
  acceptanceRate?: number;
  serviceRadius?: number;
}

export interface Repairer {
  id: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  avatarUrl?: string;
  repairerProfile: RepairerProfile;
  distance?: number;
}

export interface RepairerReview {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  client: {
    id: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
  request?: {
    device?: {
      brand: string;
      model: string;
    };
    serviceType?: {
      name: string;
    };
  };
}

export interface SearchParams {
  latitude: number;
  longitude: number;
  radius?: number;
  deviceId?: string;
  serviceTypeId?: string;
  page?: number;
  limit?: number;
}

export interface LocationDetails {
  address: string;
  city: string;
  quarter?: string;
  country?: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

export interface SearchResult {
  data: Repairer[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly geolocation = inject(GeolocationService);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  // ==========================================
  // API METHODS
  // ==========================================
  // NB : getDevices/getDeviceBrands/getDeviceCategories/getDevice/getServiceTypes
  // ont migre vers @app/domains/devices (DevicesService) — Phase 2.1 du refactor.

  async searchRepairers(params: SearchParams): Promise<SearchResult> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const result = await firstValueFrom(
        this.api.get<SearchResult>('/repairers', params)
      );
      return result;
    } finally {
      this.isLoading.set(false);
    }
  }

  async getRepairer(id: string): Promise<Repairer> {
    return firstValueFrom(this.api.get<Repairer>(`/repairers/${id}`));
  }

  async getRepairerReviews(repairerId: string, page = 1, limit = 10): Promise<{
    data: RepairerReview[];
    total: number;
    average: number;
  }> {
    return firstValueFrom(
      this.api.get<{ data: RepairerReview[]; total: number; average: number }>(
        `/reviews/repairer/${repairerId}`,
        { page, limit }
      )
    );
  }

  /**
   * Wrapper retro-compatible autour de GeolocationService.getCurrentPosition.
   * Retourne le format `GeolocationPosition` natif pour ne pas casser les
   * appelants existants (search-home, new-request) qui accedent a
   * `position.coords.latitude`. Pour du nouveau code, prefere injecter
   * directement GeolocationService et utiliser `Coordinates`.
   */
  async getCurrentPosition(): Promise<GeolocationPosition> {
    const coords = await this.geolocation.getCurrentPosition();
    return {
      coords: {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy ?? 0,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        toJSON() { return this; },
      },
      timestamp: Date.now(),
      toJSON() { return this; },
    } as GeolocationPosition;
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<LocationDetails> {
    try {
      // Use OpenStreetMap Nominatim API (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'fr',
            'User-Agent': 'RepairFone/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const data = await response.json();
      const addr = data.address || {};

      // Extract address components
      const quarter = addr.suburb || addr.neighbourhood || addr.hamlet || addr.village || '';
      const city = addr.city || addr.town || addr.municipality || addr.state || 'Abidjan';
      const country = addr.country || 'Côte d\'Ivoire';
      const road = addr.road || addr.street || '';
      const houseNumber = addr.house_number || '';

      // Build formatted address
      let formattedParts: string[] = [];
      if (quarter) formattedParts.push(quarter);
      if (city && city !== quarter) formattedParts.push(city);

      const formattedAddress = formattedParts.length > 0
        ? formattedParts.join(', ')
        : `${latitude.toFixed(4)}°N, ${Math.abs(longitude).toFixed(4)}°W`;

      // Build street address
      let streetAddress = '';
      if (road) {
        streetAddress = houseNumber ? `${houseNumber} ${road}` : road;
      } else if (quarter) {
        streetAddress = quarter;
      } else {
        streetAddress = data.display_name?.split(',')[0] || 'Position détectée';
      }

      return {
        address: streetAddress,
        city,
        quarter: quarter || undefined,
        country,
        latitude,
        longitude,
        formattedAddress,
      };
    } catch (error) {
      this.logger.error('SearchService', 'Reverse geocoding error', error);
      // Return fallback with coordinates
      return {
        address: 'Position détectée',
        city: 'Abidjan',
        country: 'Côte d\'Ivoire',
        latitude,
        longitude,
        formattedAddress: `${latitude.toFixed(4)}°N, ${Math.abs(longitude).toFixed(4)}°W`,
      };
    }
  }
}
