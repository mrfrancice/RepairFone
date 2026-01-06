import { Injectable, signal } from '@angular/core';

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  // Alias for browser GeolocationPosition compatibility
  coords?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
}

export interface GeocodedAddress {
  address: string;
  display_name?: string;
  city?: string;
  country?: string;
  postalCode?: string;
}

export interface GeolocationError {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  private readonly _currentPosition = signal<Coordinates | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<GeolocationError | null>(null);

  readonly currentPosition = this._currentPosition.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  private watchId: number | null = null;

  /**
   * Check if geolocation is supported
   */
  isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Get current position once
   */
  async getCurrentPosition(options?: PositionOptions): Promise<Coordinates> {
    if (!this.isSupported()) {
      const error: GeolocationError = {
        code: 'NOT_SUPPORTED',
        message: 'La géolocalisation n\'est pas supportée par votre navigateur',
      };
      this._error.set(error);
      throw error;
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
          ...options,
        });
      });

      const coords: Coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      this._currentPosition.set(coords);
      return coords;
    } catch (err: any) {
      const error = this.parseGeolocationError(err);
      this._error.set(error);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Start watching position changes
   */
  watchPosition(
    onSuccess: (coords: Coordinates) => void,
    onError?: (error: GeolocationError) => void,
    options?: PositionOptions
  ): void {
    if (!this.isSupported()) {
      const error: GeolocationError = {
        code: 'NOT_SUPPORTED',
        message: 'La géolocalisation n\'est pas supportée',
      };
      onError?.(error);
      return;
    }

    this.stopWatching();

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        this._currentPosition.set(coords);
        onSuccess(coords);
      },
      (err) => {
        const error = this.parseGeolocationError(err);
        this._error.set(error);
        onError?.(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
        ...options,
      }
    );
  }

  /**
   * Stop watching position
   */
  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Reverse geocode coordinates to address using Nominatim (OpenStreetMap)
   */
  async reverseGeocode(coords: Coordinates): Promise<GeocodedAddress> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=18&addressdetails=1`;

    try {
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'fr',
        },
      });

      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const data = await response.json();

      return {
        address: data.display_name || '',
        city: data.address?.city || data.address?.town || data.address?.village,
        country: data.address?.country,
        postalCode: data.address?.postcode,
      };
    } catch {
      return {
        address: `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`,
      };
    }
  }

  /**
   * Calculate distance between two points in meters (Haversine formula)
   */
  calculateDistance(from: Coordinates, to: Coordinates): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (from.latitude * Math.PI) / 180;
    const φ2 = (to.latitude * Math.PI) / 180;
    const Δφ = ((to.latitude - from.latitude) * Math.PI) / 180;
    const Δλ = ((to.longitude - from.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Format distance for display
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    const km = meters / 1000;
    return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
  }

  private parseGeolocationError(err: GeolocationPositionError): GeolocationError {
    switch (err.code) {
      case err.PERMISSION_DENIED:
        return {
          code: 'PERMISSION_DENIED',
          message: 'L\'accès à la localisation a été refusé',
        };
      case err.POSITION_UNAVAILABLE:
        return {
          code: 'POSITION_UNAVAILABLE',
          message: 'La position n\'est pas disponible',
        };
      case err.TIMEOUT:
        return {
          code: 'TIMEOUT',
          message: 'La demande de localisation a expiré',
        };
      default:
        return {
          code: 'POSITION_UNAVAILABLE',
          message: 'Erreur de géolocalisation',
        };
    }
  }
}
