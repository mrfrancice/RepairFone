import { Injectable, signal, computed } from '@angular/core';
import { Device, ServiceType, Repairer, SearchParams, LocationDetails } from '../services/search.service';

export type ServiceMode = 'shop' | 'home';

export interface SearchState {
  selectedDevice: Device | null;
  selectedServiceType: ServiceType | null;
  userLocation: { latitude: number; longitude: number } | null;
  locationDetails: LocationDetails | null;
  searchResults: Repairer[];
  totalResults: number;
  currentPage: number;
  searchRadius: number;
  serviceMode: ServiceMode;
  selectedProblem: string | null;
  availableToday: boolean;
}

@Injectable({ providedIn: 'root' })
export class SearchStore {
  // State signals
  private readonly _selectedDevice = signal<Device | null>(null);
  private readonly _selectedServiceType = signal<ServiceType | null>(null);
  private readonly _userLocation = signal<{ latitude: number; longitude: number } | null>(null);
  private readonly _locationDetails = signal<LocationDetails | null>(null);
  private readonly _searchResults = signal<Repairer[]>([]);
  private readonly _totalResults = signal(0);
  private readonly _currentPage = signal(1);
  private readonly _searchRadius = signal(10); // km
  private readonly _serviceMode = signal<ServiceMode>('shop');
  private readonly _selectedProblem = signal<string | null>(null);
  private readonly _availableToday = signal(false);

  // Public readonly selectors
  readonly selectedDevice = this._selectedDevice.asReadonly();
  readonly selectedServiceType = this._selectedServiceType.asReadonly();
  readonly userLocation = this._userLocation.asReadonly();
  readonly locationDetails = this._locationDetails.asReadonly();
  readonly searchResults = this._searchResults.asReadonly();
  readonly totalResults = this._totalResults.asReadonly();
  readonly currentPage = this._currentPage.asReadonly();
  readonly searchRadius = this._searchRadius.asReadonly();
  readonly serviceMode = this._serviceMode.asReadonly();
  readonly selectedProblem = this._selectedProblem.asReadonly();
  readonly availableToday = this._availableToday.asReadonly();

  // Computed values
  readonly hasLocation = computed(() => this._userLocation() !== null);
  readonly hasDevice = computed(() => this._selectedDevice() !== null);
  readonly hasResults = computed(() => this._searchResults().length > 0);

  readonly searchParams = computed<SearchParams | null>(() => {
    const location = this._userLocation();
    if (!location) return null;

    return {
      latitude: location.latitude,
      longitude: location.longitude,
      radius: this._searchRadius(),
      deviceId: this._selectedDevice()?.id,
      serviceTypeId: this._selectedServiceType()?.id,
      page: this._currentPage(),
      limit: 20,
    };
  });

  // Actions
  setDevice(device: Device | null): void {
    this._selectedDevice.set(device);
    this._selectedServiceType.set(null);
    this.resetResults();
  }

  setServiceType(serviceType: ServiceType | null): void {
    this._selectedServiceType.set(serviceType);
    this.resetResults();
  }

  setUserLocation(latitude: number, longitude: number): void {
    this._userLocation.set({ latitude, longitude });
  }

  setLocationDetails(details: LocationDetails | null): void {
    this._locationDetails.set(details);
  }

  setSearchResults(results: Repairer[], total: number): void {
    this._searchResults.set(results);
    this._totalResults.set(total);
  }

  appendSearchResults(results: Repairer[]): void {
    this._searchResults.update((current) => [...current, ...results]);
  }

  setPage(page: number): void {
    this._currentPage.set(page);
  }

  setSearchRadius(radius: number): void {
    this._searchRadius.set(radius);
    this.resetResults();
  }

  setServiceMode(mode: ServiceMode): void {
    this._serviceMode.set(mode);
  }

  setSelectedProblem(problem: string | null): void {
    this._selectedProblem.set(problem);
  }

  setAvailableToday(available: boolean): void {
    this._availableToday.set(available);
    this.resetResults();
  }

  resetResults(): void {
    this._searchResults.set([]);
    this._totalResults.set(0);
    this._currentPage.set(1);
  }

  reset(): void {
    this._selectedDevice.set(null);
    this._selectedServiceType.set(null);
    this.resetResults();
    this._searchRadius.set(10);
  }
}
