import type { PositionLike } from '../../types/moodrun';

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0,
};

interface StatusPayload {
  message: string;
  tone: string;
}

interface ErrorPayload {
  message: string;
  error?: unknown;
}

interface LocationServiceOptions {
  onPosition?: (position: PositionLike) => void;
  onStatus?: (payload: StatusPayload) => void;
  onError?: (payload: ErrorPayload) => void;
}

export function createLocationService({
  onPosition,
  onStatus,
  onError,
}: LocationServiceOptions = {}) {
  let watchId: number | null = null;
  let active = false;

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

  function stop() {
    if (!active) return;

    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
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
