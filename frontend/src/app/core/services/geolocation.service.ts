import { Injectable, signal } from '@angular/core';

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export type GeolocationErrorCode =
  | 'PERMISSION_DENIED'
  | 'POSITION_UNAVAILABLE'
  | 'TIMEOUT'
  | 'NOT_SUPPORTED';

/**
 * Erreur de geolocalisation avec un code stable et un message traduit FR.
 * Etend Error pour rester compatible avec `throw`/`catch`/`logger.error`.
 */
export class GeolocationError extends Error {
  constructor(public readonly code: GeolocationErrorCode, message: string) {
    super(message);
    this.name = 'GeolocationError';
  }
}

export interface GetCurrentPositionOptions {
  /** defaut: true — passe a false pour le retry interne. */
  enableHighAccuracy?: boolean;
  /** defaut: 10000 ms */
  timeout?: number;
  /** defaut: 60000 ms (cache 1 min) */
  maximumAge?: number;
  /**
   * defaut: true — si la 1ere tentative high-accuracy echoue avec
   * TIMEOUT ou POSITION_UNAVAILABLE, retente avec enableHighAccuracy:false
   * et un cache plus large (5 min). Utile en zone a couverture GPS faible.
   */
  retryLowAccuracyOnFailure?: boolean;
}

/**
 * Service unifie pour la geolocalisation navigateur.
 *
 * Remplace 9 implementations inline qui re-utilisaient
 * `navigator.geolocation.getCurrentPosition()` avec des options et des
 * messages d'erreur divergents (souvent par copy/paste, pas par design).
 *
 * Reste dans core/ : c'est de l'infra navigateur, sans dependance metier.
 * Le reverse-geocoding (Nominatim) vit dans features/search/SearchService
 * car couple a l'UX search ; un consommateur qui en a besoin peut soit
 * injecter SearchService.reverseGeocode, soit appeler Nominatim
 * directement.
 */
@Injectable({ providedIn: 'root' })
export class GeolocationService {
  private readonly _lastPosition = signal<Coordinates | null>(null);
  readonly lastPosition = this._lastPosition.asReadonly();

  isSupported(): boolean {
    // `'geolocation' in navigator` est vrai meme si la valeur est undefined
    // (iframe sandboxed, polyfill, etc.). Tester la valeur reelle.
    return typeof navigator !== 'undefined' && !!navigator.geolocation;
  }

  /**
   * Recupere la position courante. Retourne `Coordinates` (latitude,
   * longitude, accuracy?) — pas le `GeolocationPosition` natif, pour
   * isoler les consommateurs de l'API browser.
   *
   * @throws GeolocationError avec un message FR pret a afficher.
   */
  async getCurrentPosition(options?: GetCurrentPositionOptions): Promise<Coordinates> {
    if (!this.isSupported()) {
      throw new GeolocationError(
        'NOT_SUPPORTED',
        'La géolocalisation n\'est pas supportée par votre navigateur.',
      );
    }

    const enableHighAccuracy = options?.enableHighAccuracy ?? true;
    const timeout = options?.timeout ?? 10_000;
    const maximumAge = options?.maximumAge ?? 60_000;
    const retryLowAccuracy = options?.retryLowAccuracyOnFailure ?? true;

    try {
      const coords = await this.requestPosition({ enableHighAccuracy, timeout, maximumAge });
      this._lastPosition.set(coords);
      return coords;
    } catch (err) {
      if (!(err instanceof GeolocationError)) throw err;

      // Retry low-accuracy uniquement pour TIMEOUT/POSITION_UNAVAILABLE.
      // PERMISSION_DENIED ne se retentera jamais (l'utilisateur a refuse).
      const canRetry =
        retryLowAccuracy &&
        enableHighAccuracy &&
        (err.code === 'TIMEOUT' || err.code === 'POSITION_UNAVAILABLE');

      if (!canRetry) throw err;

      const coords = await this.requestPosition({
        enableHighAccuracy: false,
        timeout: 15_000,
        maximumAge: 300_000,
      });
      this._lastPosition.set(coords);
      return coords;
    }
  }

  private requestPosition(opts: PositionOptions): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
        (err) => reject(this.toGeolocationError(err)),
        opts,
      );
    });
  }

  private toGeolocationError(err: GeolocationPositionError): GeolocationError {
    switch (err.code) {
      case err.PERMISSION_DENIED:
        return new GeolocationError(
          'PERMISSION_DENIED',
          'Accès à la position refusé. Autorisez la géolocalisation dans les paramètres de votre navigateur.',
        );
      case err.POSITION_UNAVAILABLE:
        return new GeolocationError(
          'POSITION_UNAVAILABLE',
          'Position indisponible. Vérifiez que le GPS est activé.',
        );
      case err.TIMEOUT:
        return new GeolocationError(
          'TIMEOUT',
          'Délai d\'attente dépassé. Réessayez.',
        );
      default:
        return new GeolocationError(
          'POSITION_UNAVAILABLE',
          'Erreur de géolocalisation. Réessayez.',
        );
    }
  }
}
