import type { PositionLike, TrackingResult } from '../../types/moodrun';
import { wgs84ToGcj02 } from './coordTransform';

declare global {
  interface Window {
    AMap?: any;
    _AMapSecurityConfig?: {
      securityJsCode?: string;
    };
  }
}

const MAP_SCRIPT_ID = 'moodrun-amap-script';
const DEFAULT_CENTER: [number, number] = [121.4737, 31.2304];
const DEFAULT_ZOOM = 16;
const MAX_ACCURACY_CIRCLE_METERS = 120;

type LngLatTuple = [number, number];

interface SyncOptions {
  accepted: boolean;
  reason: TrackingResult['reason'];
  accuracy: number | null;
}

let amapPromise: Promise<any> | null = null;

export function createRunMap(containerId = 'runLiveMap', messageId = 'runMapMessage') {
  let map: any = null;
  let polyline: any = null;
  let startMarker: any = null;
  let currentMarker: any = null;
  let accuracyCircle: any = null;
  let initPromise: Promise<void> | null = null;
  let routePath: LngLatTuple[] = [];
  let previewPosition: LngLatTuple | null = null;
  let lastAcceptedPosition: LngLatTuple | null = null;
  let currentAccuracy: number | null = null;
  let pendingViewportSync = true;
  let destroyed = false;

  async function reset() {
    destroyed = false;
    routePath = [];
    previewPosition = null;
    lastAcceptedPosition = null;
    currentAccuracy = null;
    pendingViewportSync = true;
    setMessage('LIVE MAP LOADING...');

    try {
      await ensureMapReady();
      clearOverlays();
      render();
    } catch (error) {
      reportMapError(error);
    }
  }

  function syncPosition(position: PositionLike, options: SyncOptions) {
    const converted = toGcjLngLat(position);
    currentAccuracy = options.accuracy;

    if (options.accepted) {
      routePath = routePath.concat([converted]);
      lastAcceptedPosition = converted;
      previewPosition = converted;
      pendingViewportSync = true;
    } else if (!routePath.length && options.reason !== 'speed') {
      previewPosition = converted;
      pendingViewportSync = true;
    }

    void renderAsync();
  }

  function destroy() {
    destroyed = true;
    initPromise = null;
    if (map) {
      map.destroy();
      map = null;
    }
    polyline = null;
    startMarker = null;
    currentMarker = null;
    accuracyCircle = null;
  }

  async function renderAsync() {
    try {
      await ensureMapReady();
      render();
    } catch (error) {
      reportMapError(error);
    }
  }

  async function ensureMapReady() {
    if (destroyed) return;
    if (map) {
      map.resize();
      return;
    }

    if (!initPromise) {
      initPromise = (async () => {
        const AMap = await loadAMap();
        if (destroyed) return;

        const container = document.getElementById(containerId);
        if (!container) {
          throw new Error('Run map container was not found.');
        }

        map = new AMap.Map(container, {
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          resizeEnable: true,
          dragEnable: true,
          zoomEnable: true,
          doubleClickZoom: false,
          jogEnable: false,
        });

        polyline = new AMap.Polyline({
          path: [],
          strokeColor: '#f993be',
          strokeWeight: 5,
          strokeOpacity: 0.95,
          strokeStyle: 'solid',
          lineJoin: 'round',
          lineCap: 'round',
          showDir: true,
        });

        startMarker = new AMap.Marker({
          content: '<div class="run-map-start-pin" aria-hidden="true"></div>',
          offset: new AMap.Pixel(-6, -6),
          zIndex: 120,
        });

        currentMarker = new AMap.Marker({
          content: '<div class="run-map-runner-pin" aria-hidden="true"></div>',
          offset: new AMap.Pixel(-12, -12),
          zIndex: 130,
        });

        accuracyCircle = new AMap.Circle({
          radius: 0,
          strokeColor: '#79e1d6',
          strokeOpacity: 0.45,
          strokeWeight: 2,
          fillColor: '#79e1d6',
          fillOpacity: 0.12,
          bubble: true,
          zIndex: 90,
        });

        map.add([polyline, startMarker, currentMarker, accuracyCircle]);
        setMessage('');
      })();
    }

    await initPromise;
  }

  function clearOverlays() {
    if (!polyline || !startMarker || !currentMarker || !accuracyCircle) return;

    polyline.setPath([]);
    polyline.hide();
    startMarker.hide();
    currentMarker.hide();
    accuracyCircle.hide();

    if (map) {
      map.setZoomAndCenter(DEFAULT_ZOOM, DEFAULT_CENTER);
    }
  }

  function render() {
    if (!map || !polyline || !startMarker || !currentMarker || !accuracyCircle || destroyed) {
      return;
    }

    const focusPosition = lastAcceptedPosition ?? previewPosition;

    if (routePath.length > 1) {
      polyline.setPath(routePath);
      polyline.show();
    } else {
      polyline.setPath([]);
      polyline.hide();
    }

    if (routePath.length > 0) {
      startMarker.setPosition(routePath[0]);
      startMarker.show();
    } else {
      startMarker.hide();
    }

    if (focusPosition) {
      currentMarker.setPosition(focusPosition);
      currentMarker.show();
    } else {
      currentMarker.hide();
    }

    if (focusPosition && Number.isFinite(currentAccuracy) && (currentAccuracy as number) <= MAX_ACCURACY_CIRCLE_METERS) {
      accuracyCircle.setCenter(focusPosition);
      accuracyCircle.setRadius(Math.max(currentAccuracy as number, 5));
      accuracyCircle.show();
    } else {
      accuracyCircle.hide();
    }

    if (!pendingViewportSync) {
      return;
    }

    if (routePath.length > 1) {
      map.setFitView([polyline, startMarker, currentMarker], false, [28, 28, 28, 28], 17);
    } else if (focusPosition) {
      map.setZoomAndCenter(DEFAULT_ZOOM, focusPosition);
    } else {
      map.setZoomAndCenter(DEFAULT_ZOOM, DEFAULT_CENTER);
    }

    pendingViewportSync = false;
  }

  function reportMapError(error: unknown) {
    console.warn('Could not initialize the live run map.', error);
    setMessage('LIVE MAP UNAVAILABLE');
  }

  function setMessage(message: string) {
    const element = document.getElementById(messageId);
    if (!element) return;

    element.textContent = message;
    element.hidden = !message;
  }

  return {
    reset,
    syncPosition,
    destroy,
  };
}

function toGcjLngLat(position: PositionLike): LngLatTuple {
  const converted = wgs84ToGcj02(position.coords.latitude, position.coords.longitude);
  return [converted.longitude, converted.latitude];
}

async function loadAMap() {
  if (window.AMap) {
    return window.AMap;
  }

  if (amapPromise) {
    return amapPromise;
  }

  amapPromise = new Promise((resolve, reject) => {
    const key = import.meta.env.VITE_AMAP_KEY;
    const securityCode = import.meta.env.VITE_AMAP_SECURITY_CODE;

    if (!key) {
      reject(new Error('Missing VITE_AMAP_KEY.'));
      return;
    }

    if (securityCode) {
      window._AMapSecurityConfig = {
        securityJsCode: securityCode,
      };
    }

    const existingScript = document.getElementById(MAP_SCRIPT_ID) as HTMLScriptElement | null;
    const handleLoad = () => {
      if (window.AMap) {
        resolve(window.AMap);
        return;
      }

      reject(new Error('AMap loaded without exposing window.AMap.'));
    };
    const handleError = () => reject(new Error('Failed to load the AMap Web SDK.'));

    if (existingScript) {
      existingScript.addEventListener('load', handleLoad, { once: true });
      existingScript.addEventListener('error', handleError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = MAP_SCRIPT_ID;
    script.async = true;
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}`;
    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
    document.head.appendChild(script);
  }).catch((error) => {
    amapPromise = null;
    throw error;
  });

  return amapPromise;
}
