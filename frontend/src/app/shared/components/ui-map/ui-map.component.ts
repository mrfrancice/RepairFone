import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
  AfterViewInit,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';

// Declare Leaflet types
declare const L: any;

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  icon?: 'default' | 'user' | 'repairer' | 'destination';
  popup?: string;
}

export interface MapRoute {
  start: { latitude: number; longitude: number };
  end: { latitude: number; longitude: number };
  color?: string;
}

@Component({
  selector: 'ui-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-wrapper" [style.height]="height">
      @if (isLoading()) {
        <div class="map-loading">
          <div class="spinner"></div>
          <p>Chargement de la carte...</p>
        </div>
      }
      @if (error()) {
        <div class="map-error">
          <p>{{ error() }}</p>
          <button (click)="retry()">Réessayer</button>
        </div>
      }
      <div #mapContainer class="map-container" [class.hidden]="isLoading() || error()"></div>

      @if (showControls) {
        <div class="map-controls">
          <button class="control-btn" (click)="centerOnUser()" title="Ma position">
            +
          </button>
          <button class="control-btn" (click)="fitAllMarkers()" title="Voir tout">
            -
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .map-wrapper {
      position: relative;
      width: 100%;
      border-radius: 12px;
      overflow: hidden;
      background: #f3f4f6;
    }

    .map-container {
      width: 100%;
      height: 100%;
    }

    .map-container.hidden {
      visibility: hidden;
    }

    .map-loading,
    .map-error {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #f9fafb;
      gap: 1rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .map-loading p,
    .map-error p {
      color: #6b7280;
      margin: 0;
    }

    .map-error button {
      padding: 0.5rem 1rem;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }

    .map-controls {
      position: absolute;
      right: 10px;
      top: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 1000;
    }

    .control-btn {
      width: 36px;
      height: 36px;
      background: white;
      border: none;
      border-radius: 8px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      transition: background 0.2s;
    }

    .control-btn:hover {
      background: #f3f4f6;
    }

    /* Override Leaflet default styles */
    :host ::ng-deep .leaflet-control-zoom {
      display: none;
    }

    :host ::ng-deep .leaflet-popup-content-wrapper {
      border-radius: 8px;
    }

    :host ::ng-deep .leaflet-popup-content {
      margin: 12px;
      font-size: 14px;
    }
  `]
})
export class UiMapComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  @Input() height = '250px';
  @Input() zoom = 14;
  @Input() centerLat = 5.3600; // Abidjan default
  @Input() centerLng = -4.0083;
  @Input() markers: MapMarker[] = [];
  @Input() route?: MapRoute;
  @Input() showControls = true;
  @Input() interactive = true;

  @Output() markerClick = new EventEmitter<MapMarker>();
  @Output() mapClick = new EventEmitter<{ lat: number; lng: number }>();

  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

  private map: any;
  private markerLayer: any;
  private routeLayer: any;
  private leafletLoaded = false;

  ngOnInit(): void {
    this.loadLeaflet();
  }

  ngAfterViewInit(): void {
    if (this.leafletLoaded) {
      this.initMap();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) return;

    if (changes['markers']) {
      this.updateMarkers();
    }
    if (changes['route']) {
      this.updateRoute();
    }
    if (changes['centerLat'] || changes['centerLng']) {
      this.map.setView([this.centerLat, this.centerLng], this.zoom);
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private async loadLeaflet(): Promise<void> {
    try {
      // Check if Leaflet is already loaded
      if (typeof L !== 'undefined') {
        this.leafletLoaded = true;
        if (this.mapContainer) {
          this.initMap();
        }
        return;
      }

      // Load Leaflet CSS
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(cssLink);

      // Load Leaflet JS
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Leaflet'));
        document.head.appendChild(script);
      });

      this.leafletLoaded = true;
      if (this.mapContainer) {
        this.initMap();
      }
    } catch (err) {
      this.error.set('Impossible de charger la carte');
      this.isLoading.set(false);
    }
  }

  private initMap(): void {
    if (!this.leafletLoaded || !this.mapContainer?.nativeElement) return;

    try {
      // Initialize map
      this.map = L.map(this.mapContainer.nativeElement, {
        zoomControl: false,
        dragging: this.interactive,
        touchZoom: this.interactive,
        scrollWheelZoom: this.interactive,
        doubleClickZoom: this.interactive
      }).setView([this.centerLat, this.centerLng], this.zoom);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
      }).addTo(this.map);

      // Initialize layers
      this.markerLayer = L.layerGroup().addTo(this.map);
      this.routeLayer = L.layerGroup().addTo(this.map);

      // Add click handler
      if (this.interactive) {
        this.map.on('click', (e: any) => {
          this.mapClick.emit({ lat: e.latlng.lat, lng: e.latlng.lng });
        });
      }

      // Add markers and route
      this.updateMarkers();
      this.updateRoute();

      this.isLoading.set(false);
    } catch (err) {
      this.error.set('Erreur lors de l\'initialisation de la carte');
      this.isLoading.set(false);
    }
  }

  private updateMarkers(): void {
    if (!this.markerLayer) return;

    this.markerLayer.clearLayers();

    this.markers.forEach(marker => {
      const icon = this.createIcon(marker.icon || 'default');
      const leafletMarker = L.marker([marker.latitude, marker.longitude], { icon })
        .addTo(this.markerLayer);

      if (marker.popup) {
        leafletMarker.bindPopup(marker.popup);
      }

      leafletMarker.on('click', () => {
        this.markerClick.emit(marker);
      });
    });
  }

  private updateRoute(): void {
    if (!this.routeLayer) return;

    this.routeLayer.clearLayers();

    if (this.route) {
      const polyline = L.polyline(
        [
          [this.route.start.latitude, this.route.start.longitude],
          [this.route.end.latitude, this.route.end.longitude]
        ],
        {
          color: this.route.color || '#2563eb',
          weight: 4,
          opacity: 0.8,
          dashArray: '10, 10'
        }
      ).addTo(this.routeLayer);
    }
  }

  private createIcon(type: string): any {
    const iconConfigs: Record<string, { color: string; symbol: string }> = {
      default: { color: '#2563eb', symbol: '' },
      user: { color: '#10b981', symbol: '' },
      repairer: { color: '#f59e0b', symbol: '' },
      destination: { color: '#dc2626', symbol: '' }
    };

    const config = iconConfigs[type] || iconConfigs['default'];

    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 32px;
          height: 32px;
          background: ${config.color};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        ">
          <span style="
            transform: rotate(45deg);
            font-size: 14px;
          ">${config.symbol}</span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  }

  centerOnUser(): void {
    if (!this.map) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.map.setView(
            [position.coords.latitude, position.coords.longitude],
            this.zoom
          );
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }

  fitAllMarkers(): void {
    if (!this.map || this.markers.length === 0) return;

    const bounds = L.latLngBounds(
      this.markers.map(m => [m.latitude, m.longitude])
    );
    this.map.fitBounds(bounds, { padding: [50, 50] });
  }

  retry(): void {
    this.error.set(null);
    this.isLoading.set(true);
    this.loadLeaflet();
  }

  // Public method to update center programmatically
  setCenter(lat: number, lng: number, zoom?: number): void {
    if (this.map) {
      this.map.setView([lat, lng], zoom || this.zoom);
    }
  }
}
