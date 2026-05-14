import { TestBed } from '@angular/core/testing';
import { GeolocationService, GeolocationError } from './geolocation.service';

describe('GeolocationService', () => {
  let service: GeolocationService;
  let originalGeolocation: Geolocation | undefined;

  function makePosition(lat: number, lng: number, accuracy = 10): GeolocationPosition {
    return {
      coords: {
        latitude: lat, longitude: lng, accuracy,
        altitude: null, altitudeAccuracy: null, heading: null, speed: null,
        toJSON() { return this; },
      },
      timestamp: Date.now(),
      toJSON() { return this; },
    } as GeolocationPosition;
  }

  function makeError(code: number): GeolocationPositionError {
    return {
      code,
      message: 'mock error',
      PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3,
    } as GeolocationPositionError;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [GeolocationService] });
    service = TestBed.inject(GeolocationService);
    originalGeolocation = navigator.geolocation;
  });

  afterEach(() => {
    if (originalGeolocation) {
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: originalGeolocation,
      });
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('isSupported() returns true when navigator.geolocation exists', () => {
    expect(service.isSupported()).toBe(true);
  });

  it('throws NOT_SUPPORTED when geolocation is missing', async () => {
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: undefined });
    await expectAsync(service.getCurrentPosition()).toBeRejectedWith(
      jasmine.objectContaining({ code: 'NOT_SUPPORTED' }),
    );
  });

  it('resolves with Coordinates on success', async () => {
    const fakeGeo = {
      getCurrentPosition: (success: PositionCallback) => success(makePosition(5.36, -4.0)),
    } as unknown as Geolocation;
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: fakeGeo });

    const coords = await service.getCurrentPosition();
    expect(coords.latitude).toBe(5.36);
    expect(coords.longitude).toBe(-4.0);
    expect(service.lastPosition()).toEqual(jasmine.objectContaining({ latitude: 5.36 }));
  });

  it('maps PERMISSION_DENIED to GeolocationError with FR message', async () => {
    const fakeGeo = {
      getCurrentPosition: (_s: PositionCallback, err: PositionErrorCallback) => err(makeError(1)),
    } as unknown as Geolocation;
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: fakeGeo });

    await expectAsync(service.getCurrentPosition({ retryLowAccuracyOnFailure: false }))
      .toBeRejectedWith(jasmine.objectContaining({
        code: 'PERMISSION_DENIED',
        message: jasmine.stringMatching(/refusé|autorisez/i),
      }));
  });

  it('retries with low-accuracy when high-accuracy times out', async () => {
    let callCount = 0;
    const fakeGeo = {
      getCurrentPosition: (
        success: PositionCallback,
        errorCb: PositionErrorCallback,
        opts?: PositionOptions,
      ) => {
        callCount++;
        if (callCount === 1 && opts?.enableHighAccuracy) {
          errorCb(makeError(3)); // TIMEOUT
        } else {
          success(makePosition(1, 2));
        }
      },
    } as unknown as Geolocation;
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: fakeGeo });

    const coords = await service.getCurrentPosition();
    expect(callCount).toBe(2);
    expect(coords).toEqual(jasmine.objectContaining({ latitude: 1, longitude: 2 }));
  });

  it('does NOT retry on PERMISSION_DENIED', async () => {
    let callCount = 0;
    const fakeGeo = {
      getCurrentPosition: (_s: PositionCallback, errorCb: PositionErrorCallback) => {
        callCount++;
        errorCb(makeError(1));
      },
    } as unknown as Geolocation;
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: fakeGeo });

    await expectAsync(service.getCurrentPosition()).toBeRejected();
    expect(callCount).toBe(1);
  });

  it('GeolocationError extends Error', () => {
    const err = new GeolocationError('TIMEOUT', 'délai dépassé');
    expect(err instanceof Error).toBe(true);
    expect(err.code).toBe('TIMEOUT');
    expect(err.name).toBe('GeolocationError');
  });
});
