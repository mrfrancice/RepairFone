import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiService } from './api.service';
import { LoggerService } from './logger.service';
import { Observable, tap, map, of, catchError } from 'rxjs';

export interface Quarter {
  id: string;
  name: string;
}

export interface Commune {
  id: string;
  name: string;
  quarters: Quarter[];
}

export interface City {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  communes: Commune[];
}

export interface LocationHierarchy {
  cities: City[];
}

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  // Cache for location data
  private readonly _locationData = signal<LocationHierarchy | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Public signals
  readonly locationData = this._locationData.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed signals for easy access
  readonly cities = computed(() => this._locationData()?.cities ?? []);

  /**
   * Load full location hierarchy from the backend
   * This caches the data for efficient access
   */
  loadLocationData(): Observable<LocationHierarchy> {
    // Return cached data if available
    const cached = this._locationData();
    if (cached) {
      return of(cached);
    }

    this._loading.set(true);
    this._error.set(null);

    return this.api.get<LocationHierarchy>('/locations/full/hierarchy').pipe(
      tap((data) => {
        this._locationData.set(data);
        this._loading.set(false);
      }),
      catchError((err) => {
        this._error.set('Erreur lors du chargement des localisations');
        this._loading.set(false);
        this.logger.error('LocationService', 'Error loading locations', err);
        // Return empty data structure on error
        return of({ cities: [] });
      })
    );
  }

  /**
   * Get all cities
   */
  getCities(): Observable<City[]> {
    return this.loadLocationData().pipe(
      map((data) => data.cities)
    );
  }

  /**
   * Get communes for a specific city by ID
   */
  getCommunesByCityId(cityId: string): Commune[] {
    const data = this._locationData();
    if (!data) return [];

    const city = data.cities.find((c) => c.id === cityId);
    return city?.communes ?? [];
  }

  /**
   * Get communes for a specific city by name
   */
  getCommunesByCityName(cityName: string): Commune[] {
    const data = this._locationData();
    if (!data) return [];

    const city = data.cities.find((c) => c.name === cityName);
    return city?.communes ?? [];
  }

  /**
   * Get quarters for a specific commune by ID
   */
  getQuartersByCommuneId(communeId: string): Quarter[] {
    const data = this._locationData();
    if (!data) return [];

    for (const city of data.cities) {
      const commune = city.communes.find((c) => c.id === communeId);
      if (commune) {
        return commune.quarters;
      }
    }
    return [];
  }

  /**
   * Get quarters for a specific commune by name
   */
  getQuartersByCommuneName(communeName: string, cityName?: string): Quarter[] {
    const data = this._locationData();
    if (!data) return [];

    if (cityName) {
      const city = data.cities.find((c) => c.name === cityName);
      if (city) {
        const commune = city.communes.find((c) => c.name === communeName);
        return commune?.quarters ?? [];
      }
    } else {
      // Search all cities for the commune
      for (const city of data.cities) {
        const commune = city.communes.find((c) => c.name === communeName);
        if (commune) {
          return commune.quarters;
        }
      }
    }
    return [];
  }

  /**
   * Find a city by ID
   */
  getCityById(cityId: string): City | undefined {
    const data = this._locationData();
    return data?.cities.find((c) => c.id === cityId);
  }

  /**
   * Find a commune by ID
   */
  getCommuneById(communeId: string): Commune | undefined {
    const data = this._locationData();
    if (!data) return undefined;

    for (const city of data.cities) {
      const commune = city.communes.find((c) => c.id === communeId);
      if (commune) return commune;
    }
    return undefined;
  }

  /**
   * Find a quarter by ID
   */
  getQuarterById(quarterId: string): Quarter | undefined {
    const data = this._locationData();
    if (!data) return undefined;

    for (const city of data.cities) {
      for (const commune of city.communes) {
        const quarter = commune.quarters.find((q) => q.id === quarterId);
        if (quarter) return quarter;
      }
    }
    return undefined;
  }

  /**
   * Clear the cache (useful for refreshing data)
   */
  clearCache(): void {
    this._locationData.set(null);
    this._error.set(null);
  }
}
