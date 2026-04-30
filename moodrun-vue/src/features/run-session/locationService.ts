import type { PositionLike } from '../../types/moodrun';

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0,
};

const MOCK_STEP_INTERVAL_MS = 1000;
const MOCK_ROUTE = [
  { latOffset: 0, lonOffset: 0 },
  { latOffset: 0.00006, lonOffset: 0.00002 },
  { latOffset: 0.00012, lonOffset: 0.00005 },
  { latOffset: 0.00018, lonOffset: 0.0001 },
  { latOffset: 0.00023, lonOffset: 0.00017 },
  { latOffset: 0.00028, lonOffset: 0.00025 },
  { latOffset: 0.00033, lonOffset: 0.00034 },
  { latOffset: 0.00037, lonOffset: 0.00043 },
  { latOffset: 0.0004, lonOffset: 0.00052 },
  { latOffset: 0.00042, lonOffset: 0.00062 },
  { latOffset: 0.00043, lonOffset: 0.00073 },
  { latOffset: 0.00042, lonOffset: 0.00084 },
];

interface StatusPayload {
  message: string;
  tone: string;
}

interface ErrorPayload {
  message: string;
  error?: unknown;
}

interface MockOrigin {
  latitude: number;
  longitude: number;
}

interface LocationServiceOptions {
  onPosition?: (position: PositionLike) => void;
  onStatus?: (payload: StatusPayload) => void;
  onError?: (payload: ErrorPayload) => void;
  useMock?: boolean;
}

export function createLocationService({
  onPosition,
  onStatus,
  onError,
  useMock = false,
}: LocationServiceOptions = {}) {
  let watchId: number | null = null;
  let active = false;
  let mockTimerId: number | null = null;
  let mockStepIndex = 0;
  let mockOrigin: MockOrigin | null = null;

  function emitStatus(message: string, tone = 'info') {
    onStatus?.({ message, tone });
  }

  function emitError(message: string, error?: unknown) {
    onError?.({ message, error });
  }

  function handleSuccess(position: GeolocationPosition) {
    onPosition?.({
      coords: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      },
      timestamp: position.timestamp,
    });
  }

  function handleError(error: GeolocationPositionError) {
    const message = getGeolocationErrorMessage(error);
    emitStatus(message, 'warning');
    emitError(message, error);
  }

  function start() {
    if (active) return;

    if (useMock) {
      startMockTracking();
      return;
    }

    if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      emitStatus('Secure context required. Open the app with HTTPS to use GPS.', 'warning');
      emitError('Secure context required for geolocation in this browser.');
      return;
    }

    if (!('geolocation' in navigator)) {
      emitStatus('Geolocation is not available in this browser.', 'warning');
      emitError('Geolocation is not available in this browser.');
      return;
    }

    emitStatus('Requesting GPS access...', 'info');
    active = true;
    watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, DEFAULT_OPTIONS);
  }

  function startMockTracking() {
    emitStatus('Desktop test mode active. Simulating route data.', 'test');
    active = true;

    mockOrigin = { latitude: 31.2304, longitude: 121.4737 };
    mockStepIndex = 0;
    emitMockPosition();
    mockTimerId = window.setInterval(emitMockPosition, MOCK_STEP_INTERVAL_MS);
  }

  function emitMockPosition() {
    if (!mockOrigin) return;

    const step = MOCK_ROUTE[Math.min(mockStepIndex, MOCK_ROUTE.length - 1)];
    const timestamp = Date.now();

    onPosition?.({
      coords: {
        latitude: mockOrigin.latitude + step.latOffset,
        longitude: mockOrigin.longitude + step.lonOffset,
        accuracy: 6,
      },
      timestamp,
    });

    if (mockStepIndex < MOCK_ROUTE.length - 1) {
      mockStepIndex += 1;
    }
  }

  function stop() {
    if (!active) return;

    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }

    if (mockTimerId !== null) {
      window.clearInterval(mockTimerId);
      mockTimerId = null;
    }

    active = false;
  }

  return {
    start,
    stop,
  };
}

function getGeolocationErrorMessage(error: GeolocationPositionError) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location permission was denied. Allow GPS access to track the run.';
    case error.POSITION_UNAVAILABLE:
      return 'GPS signal is unavailable right now. Move to a clearer area and keep the app open.';
    case error.TIMEOUT:
      return 'GPS is taking too long to respond. Hold still for a moment and wait for a lock.';
    default:
      return 'Location tracking ran into an unexpected problem.';
  }
}
