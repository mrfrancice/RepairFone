import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom, catchError, of } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface Device {
  id: string;
  brand: string;
  model: string;
  category: string;
  imageUrl?: string;
  serviceTypes?: ServiceType[];
}

export interface ServiceType {
  id: string;
  deviceId: string;
  name: string;
  description?: string;
  basePrice: number;
  estimatedDuration: number;
}

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

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  // ==========================================
  // API METHODS
  // ==========================================

  async getDevices(params?: {
    brand?: string;
    category?: string;
    search?: string;
  }): Promise<{ data: Device[]; total: number }> {
    return firstValueFrom(
      this.api.get<{ data: Device[]; total: number }>('/devices', params)
    );
  }

  async getDeviceBrands(category?: string): Promise<string[]> {
    return firstValueFrom(
      this.api.get<string[]>('/devices/brands', category ? { category } : undefined)
    );
  }

  async getDeviceCategories(): Promise<string[]> {
    return firstValueFrom(
      this.api.get<string[]>('/devices/categories')
    );
  }

  async getDevice(id: string): Promise<Device> {
    return firstValueFrom(this.api.get<Device>(`/devices/${id}`));
  }

  async getServiceTypes(deviceId: string): Promise<ServiceType[]> {
    return firstValueFrom(
      this.api.get<ServiceType[]>(`/service-types/device/${deviceId}`)
    );
  }

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

  async getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('La géolocalisation n\'est pas supportée par votre navigateur'));
        return;
      }

      // First try with high accuracy
      navigator.geolocation.getCurrentPosition(
        resolve,
        (error) => {
          // If high accuracy fails, try with low accuracy
          if (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) {
            navigator.geolocation.getCurrentPosition(
              resolve,
              (fallbackError) => {
                reject(this.getGeolocationError(fallbackError));
              },
              {
                enableHighAccuracy: false,
                timeout: 15000,
                maximumAge: 300000, // Accept cached position up to 5 minutes
              }
            );
          } else {
            reject(this.getGeolocationError(error));
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }

  private getGeolocationError(error: GeolocationPositionError): Error {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return new Error('Accès à la position refusé. Veuillez autoriser la géolocalisation dans les paramètres de votre navigateur.');
      case error.POSITION_UNAVAILABLE:
        return new Error('Position indisponible. Vérifiez que le GPS est activé.');
      case error.TIMEOUT:
        return new Error('Délai d\'attente dépassé. Réessayez ou utilisez la position par défaut.');
      default:
        return new Error('Erreur de géolocalisation. Réessayez.');
    }
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
      console.error('Reverse geocoding error:', error);
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
