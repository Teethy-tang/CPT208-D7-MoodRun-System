import type { AvatarConfig, MoodId, PlannedRoute, PositionLike, RunMapMode, TrackingResult } from '../../types/moodrun';
import { createAvatarSvg } from '../profile/avatar';
import { wgs84ToGcj02 } from './coordTransform';
import { normalizeRunMapMode, RUN_MAP_MODE_CHANGE_EVENT } from './runMapSettings';

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

interface RunMapOptions {
  avatar?: Partial<AvatarConfig>;
  mode?: RunMapMode;
  mood?: MoodId | null;
}

interface RunMapTheme {
  accuracyColor: string;
  avatarStrideMs: number;
  features: string[];
  glowColor: string;
  gridColor: string;
  mapStyle: string;
  onColor: string;
  plannedColor: string;
  plannedOpacity: number;
  plannedStyle: 'dashed' | 'solid';
  plannedWeight: number;
  routeColor: string;
  routeOpacity: number;
  routeWeight: number;
  showLabels: boolean;
  tone: MoodId | 'classic';
  washColor: string;
}

const CLASSIC_FEATURES = ['bg', 'point', 'road', 'building'];
const MOOD_FEATURES = ['bg', 'road'];

let amapPromise: Promise<any> | null = null;

const classicMapTheme: RunMapTheme = {
  accuracyColor: '#4f7eff',
  avatarStrideMs: 620,
  features: CLASSIC_FEATURES,
  glowColor: 'rgba(79, 126, 255, 0.2)',
  gridColor: 'rgba(79, 126, 255, 0.08)',
  mapStyle: 'amap://styles/normal',
  onColor: '#ffffff',
  plannedColor: '#00b9aa',
  plannedOpacity: 0.88,
  plannedStyle: 'solid',
  plannedWeight: 6,
  routeColor: '#4f7eff',
  routeOpacity: 0.95,
  routeWeight: 5,
  showLabels: true,
  tone: 'classic',
  washColor: 'rgba(253, 251, 246, 0)',
};

const moodMapThemes: Record<MoodId, RunMapTheme> = {
  stressed: {
    accuracyColor: '#00d4c0',
    avatarStrideMs: 720,
    features: MOOD_FEATURES,
    glowColor: 'rgba(255, 63, 143, 0.24)',
    gridColor: 'rgba(255, 63, 143, 0.1)',
    mapStyle: 'amap://styles/whitesmoke',
    onColor: '#ffffff',
    plannedColor: '#00d4c0',
    plannedOpacity: 0.54,
    plannedStyle: 'dashed',
    plannedWeight: 4,
    routeColor: '#ff3f8f',
    routeOpacity: 0.92,
    routeWeight: 7,
    showLabels: false,
    tone: 'stressed',
    washColor: 'rgba(255, 238, 246, 0.34)',
  },
  anxious: {
    accuracyColor: '#8f7bff',
    avatarStrideMs: 760,
    features: MOOD_FEATURES,
    glowColor: 'rgba(128, 216, 209, 0.3)',
    gridColor: 'rgba(143, 123, 255, 0.08)',
    mapStyle: 'amap://styles/whitesmoke',
    onColor: '#1b2340',
    plannedColor: '#8f7bff',
    plannedOpacity: 0.5,
    plannedStyle: 'dashed',
    plannedWeight: 4,
    routeColor: '#00d4c0',
    routeOpacity: 0.92,
    routeWeight: 7,
    showLabels: false,
    tone: 'anxious',
    washColor: 'rgba(232, 252, 249, 0.38)',
  },
  tired: {
    accuracyColor: '#b7f0dc',
    avatarStrideMs: 860,
    features: MOOD_FEATURES,
    glowColor: 'rgba(126, 136, 168, 0.22)',
    gridColor: 'rgba(183, 240, 220, 0.08)',
    mapStyle: 'amap://styles/whitesmoke',
    onColor: '#ffffff',
    plannedColor: '#b7f0dc',
    plannedOpacity: 0.46,
    plannedStyle: 'dashed',
    plannedWeight: 4,
    routeColor: '#7e88a8',
    routeOpacity: 0.86,
    routeWeight: 6,
    showLabels: false,
    tone: 'tired',
    washColor: 'rgba(247, 244, 232, 0.42)',
  },
  angry: {
    accuracyColor: '#ffb347',
    avatarStrideMs: 520,
    features: MOOD_FEATURES,
    glowColor: 'rgba(255, 77, 95, 0.34)',
    gridColor: 'rgba(255, 179, 71, 0.12)',
    mapStyle: 'amap://styles/macaron',
    onColor: '#ffffff',
    plannedColor: '#ffb347',
    plannedOpacity: 0.58,
    plannedStyle: 'dashed',
    plannedWeight: 5,
    routeColor: '#ff4d5f',
    routeOpacity: 0.98,
    routeWeight: 8,
    showLabels: false,
    tone: 'angry',
    washColor: 'rgba(255, 238, 230, 0.34)',
  },
  sad: {
    accuracyColor: '#9beee6',
    avatarStrideMs: 880,
    features: MOOD_FEATURES,
    glowColor: 'rgba(79, 126, 255, 0.22)',
    gridColor: 'rgba(155, 238, 230, 0.08)',
    mapStyle: 'amap://styles/whitesmoke',
    onColor: '#ffffff',
    plannedColor: '#9beee6',
    plannedOpacity: 0.48,
    plannedStyle: 'dashed',
    plannedWeight: 4,
    routeColor: '#4f7eff',
    routeOpacity: 0.86,
    routeWeight: 6,
    showLabels: false,
    tone: 'sad',
    washColor: 'rgba(237, 244, 255, 0.42)',
  },
  bored: {
    accuracyColor: '#ffd84d',
    avatarStrideMs: 640,
    features: MOOD_FEATURES,
    glowColor: 'rgba(255, 216, 77, 0.26)',
    gridColor: 'rgba(138, 146, 173, 0.1)',
    mapStyle: 'amap://styles/macaron',
    onColor: '#ffffff',
    plannedColor: '#ffd84d',
    plannedOpacity: 0.5,
    plannedStyle: 'dashed',
    plannedWeight: 4,
    routeColor: '#8a92ad',
    routeOpacity: 0.95,
    routeWeight: 7,
    showLabels: false,
    tone: 'bored',
    washColor: 'rgba(255, 250, 221, 0.34)',
  },
  excited: {
    accuracyColor: '#ff7fca',
    avatarStrideMs: 500,
    features: MOOD_FEATURES,
    glowColor: 'rgba(255, 216, 77, 0.36)',
    gridColor: 'rgba(255, 127, 202, 0.12)',
    mapStyle: 'amap://styles/macaron',
    onColor: '#1b2340',
    plannedColor: '#ff7fca',
    plannedOpacity: 0.58,
    plannedStyle: 'dashed',
    plannedWeight: 5,
    routeColor: '#ffd84d',
    routeOpacity: 0.98,
    routeWeight: 8,
    showLabels: false,
    tone: 'excited',
    washColor: 'rgba(255, 250, 221, 0.38)',
  },
  happy: {
    accuracyColor: '#79e1d6',
    avatarStrideMs: 600,
    features: MOOD_FEATURES,
    glowColor: 'rgba(249, 147, 190, 0.3)',
    gridColor: 'rgba(121, 225, 214, 0.1)',
    mapStyle: 'amap://styles/macaron',
    onColor: '#1b2340',
    plannedColor: '#79e1d6',
    plannedOpacity: 0.54,
    plannedStyle: 'dashed',
    plannedWeight: 4,
    routeColor: '#ffe36d',
    routeOpacity: 0.95,
    routeWeight: 7,
    showLabels: false,
    tone: 'happy',
    washColor: 'rgba(255, 246, 251, 0.36)',
  },
  neutral: {
    accuracyColor: '#f993be',
    avatarStrideMs: 620,
    features: MOOD_FEATURES,
    glowColor: 'rgba(143, 160, 196, 0.24)',
    gridColor: 'rgba(121, 225, 214, 0.1)',
    mapStyle: 'amap://styles/macaron',
    onColor: '#ffffff',
    plannedColor: '#f993be',
    plannedOpacity: 0.52,
    plannedStyle: 'dashed',
    plannedWeight: 4,
    routeColor: '#8fa0c4',
    routeOpacity: 0.94,
    routeWeight: 7,
    showLabels: false,
    tone: 'neutral',
    washColor: 'rgba(246, 249, 255, 0.36)',
  },
};

export function createRunMap(containerId = 'runLiveMap', messageId = 'runMapMessage', options: RunMapOptions = {}) {
  let map: any = null;
  let polyline: any = null;
  let plannedPolyline: any = null;
  let plannedStartMarker: any = null;
  let plannedEndMarker: any = null;
  let startMarker: any = null;
  let currentMarker: any = null;
  let accuracyCircle: any = null;
  let initPromise: Promise<void> | null = null;
  let routePath: LngLatTuple[] = [];
  let plannedRoutePath: LngLatTuple[] = [];
  let previewPosition: LngLatTuple | null = null;
  let lastAcceptedPosition: LngLatTuple | null = null;
  let currentAccuracy: number | null = null;
  let pendingViewportSync = true;
  let destroyed = false;
  let activeMode = normalizeRunMapMode(options.mode);
  const activeMood = options.mood || 'neutral';
  const avatar = options.avatar || {};
  const handleMapResize = () => {
    if (!map || destroyed) return;

    map.resize();
    render();
  };
  const handleModeChange = (event: Event) => {
    const nextMode = normalizeRunMapMode((event as CustomEvent<{ mode?: RunMapMode }>).detail?.mode);
    if (nextMode === activeMode) return;

    activeMode = nextMode;
    pendingViewportSync = true;
    void rebuildMapForMode();
  };

  window.addEventListener(RUN_MAP_MODE_CHANGE_EVENT, handleModeChange);

  async function reset(plannedRoute: PlannedRoute | null = null) {
    destroyed = false;
    routePath = [];
    plannedRoutePath = plannedRoute ? [toLngLatTuple(plannedRoute.start), toLngLatTuple(plannedRoute.end)] : [];
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
    window.removeEventListener('moodrun:map-resize', handleMapResize);
    window.removeEventListener(RUN_MAP_MODE_CHANGE_EVENT, handleModeChange);
    disposeMapInstance();
  }

  async function renderAsync() {
    try {
      await ensureMapReady();
      render();
    } catch (error) {
      reportMapError(error);
    }
  }

  async function rebuildMapForMode() {
    setMessage('LIVE MAP LOADING...');
    disposeMapInstance();

    try {
      await ensureMapReady();
      render();
    } catch (error) {
      reportMapError(error);
    }
  }

  function disposeMapInstance() {
    initPromise = null;
    window.removeEventListener('moodrun:map-resize', handleMapResize);

    if (map) {
      map.destroy();
      map = null;
    }

    polyline = null;
    plannedPolyline = null;
    plannedStartMarker = null;
    plannedEndMarker = null;
    startMarker = null;
    currentMarker = null;
    accuracyCircle = null;
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
          features: getActiveTheme().features,
          mapStyle: getActiveTheme().mapStyle,
          resizeEnable: true,
          dragEnable: true,
          zoomEnable: true,
          doubleClickZoom: false,
          jogEnable: false,
          showLabel: getActiveTheme().showLabels,
        });

        polyline = new AMap.Polyline({
          strokeColor: getActiveTheme().routeColor,
          strokeWeight: getActiveTheme().routeWeight,
          strokeOpacity: getActiveTheme().routeOpacity,
          strokeStyle: 'solid',
          lineJoin: 'round',
          lineCap: 'round',
          showDir: true,
        });

        plannedPolyline = new AMap.Polyline({
          strokeColor: getActiveTheme().plannedColor,
          strokeWeight: getActiveTheme().plannedWeight,
          strokeOpacity: getActiveTheme().plannedOpacity,
          strokeStyle: getActiveTheme().plannedStyle,
          lineJoin: 'round',
          lineCap: 'round',
          showDir: true,
          zIndex: 105,
        });

        plannedStartMarker = new AMap.Marker({
          content: '<div class="run-map-planned-pin run-map-planned-start">S</div>',
          offset: new AMap.Pixel(-12, -12),
          zIndex: 112,
        });

        plannedEndMarker = new AMap.Marker({
          content: '<div class="run-map-planned-pin run-map-planned-end">E</div>',
          offset: new AMap.Pixel(-12, -12),
          zIndex: 113,
        });

        startMarker = new AMap.Marker({
          content: '<div class="run-map-start-pin" aria-hidden="true"></div>',
          offset: new AMap.Pixel(-6, -6),
          zIndex: 120,
        });

        currentMarker = new AMap.Marker({
          content: createRunnerMarkerContent(avatar),
          offset: new AMap.Pixel(-21, -42),
          zIndex: 130,
        });

        accuracyCircle = new AMap.Circle({
          radius: 0,
          strokeColor: getActiveTheme().accuracyColor,
          strokeOpacity: 0.45,
          strokeWeight: 2,
          fillColor: getActiveTheme().accuracyColor,
          fillOpacity: 0.12,
          bubble: true,
          zIndex: 90,
        });

        map.add([plannedPolyline, plannedStartMarker, plannedEndMarker, polyline, startMarker, currentMarker, accuracyCircle]);
        window.addEventListener('moodrun:map-resize', handleMapResize);
        applyModeTheme();
        setMessage('');
      })();
    }

    await initPromise;
  }

  function clearOverlays() {
    if (!polyline || !plannedPolyline || !plannedStartMarker || !plannedEndMarker || !startMarker || !currentMarker || !accuracyCircle) {
      return;
    }

    polyline.hide();
    plannedPolyline.hide();
    plannedStartMarker.hide();
    plannedEndMarker.hide();
    startMarker.hide();
    currentMarker.hide();
    accuracyCircle.hide();

    if (map) {
      map.setZoomAndCenter(DEFAULT_ZOOM, DEFAULT_CENTER);
    }
  }

  function render() {
    if (
      !map ||
      !polyline ||
      !plannedPolyline ||
      !plannedStartMarker ||
      !plannedEndMarker ||
      !startMarker ||
      !currentMarker ||
      !accuracyCircle ||
      destroyed
    ) {
      return;
    }

    const focusPosition = lastAcceptedPosition ?? previewPosition;
    const plannedOverlays = renderPlannedRoute();

    if (routePath.length > 1) {
      polyline.setPath(routePath);
      polyline.show();
    } else {
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
      map.setFitView([polyline, startMarker, currentMarker].concat(plannedOverlays), false, [28, 28, 28, 28], 17);
    } else if (plannedOverlays.length) {
      map.setFitView(plannedOverlays.concat(focusPosition ? [currentMarker] : []), false, [28, 28, 28, 28], 17);
    } else if (focusPosition) {
      map.setZoomAndCenter(DEFAULT_ZOOM, focusPosition);
    } else {
      map.setZoomAndCenter(DEFAULT_ZOOM, DEFAULT_CENTER);
    }

    pendingViewportSync = false;
  }

  function renderPlannedRoute() {
    if (!plannedPolyline || !plannedStartMarker || !plannedEndMarker || plannedRoutePath.length < 2) {
      plannedPolyline?.hide();
      plannedStartMarker?.hide();
      plannedEndMarker?.hide();
      return [];
    }

    plannedPolyline.setPath(plannedRoutePath);
    plannedStartMarker.setPosition(plannedRoutePath[0]);
    plannedEndMarker.setPosition(plannedRoutePath[plannedRoutePath.length - 1]);
    plannedPolyline.show();
    plannedStartMarker.show();
    plannedEndMarker.show();

    return [plannedPolyline, plannedStartMarker, plannedEndMarker];
  }

  function applyModeTheme() {
    const theme = getActiveTheme();
    const moodTheme = moodMapThemes[activeMood];
    const canvas = document.getElementById(containerId);
    const frame = (canvas?.closest('.map-container') as HTMLElement | null) || null;
    const page = (frame?.closest('.running-page') as HTMLElement | null) || null;

    canvas?.setAttribute('data-run-map-mode', activeMode);
    canvas?.setAttribute('data-run-map-mood', moodTheme.tone);
    frame?.setAttribute('data-map-mood', moodTheme.tone);
    page?.setAttribute('data-run-mood', moodTheme.tone);
    applyMoodThemeVars(frame, moodTheme);
    applyMoodThemeVars(page, moodTheme);
    map?.setMapStyle?.(theme.mapStyle);
    applyMapFeatures(theme);
    applyMapStatus(theme);
    polyline?.setOptions?.({
      strokeColor: theme.routeColor,
      strokeOpacity: theme.routeOpacity,
      strokeWeight: theme.routeWeight,
    });
    plannedPolyline?.setOptions?.({
      strokeColor: theme.plannedColor,
      strokeOpacity: theme.plannedOpacity,
      strokeStyle: theme.plannedStyle,
      strokeWeight: theme.plannedWeight,
    });
    accuracyCircle?.setOptions?.({
      fillColor: theme.accuracyColor,
      strokeColor: theme.accuracyColor,
    });
  }

  function applyMoodThemeVars(element: HTMLElement | null, theme: RunMapTheme) {
    if (!element) return;

    element.style.setProperty('--run-map-glow-color', theme.glowColor);
    element.style.setProperty('--run-map-grid-color', theme.gridColor);
    element.style.setProperty('--run-map-on-color', theme.onColor);
    element.style.setProperty('--run-map-planned-color', theme.plannedColor);
    element.style.setProperty('--run-map-route-color', theme.routeColor);
    element.style.setProperty('--run-map-stride-duration', `${theme.avatarStrideMs}ms`);
    element.style.setProperty('--run-map-wash-color', theme.washColor);
  }

  function getActiveTheme() {
    return activeMode === 'classic' ? classicMapTheme : moodMapThemes[activeMood];
  }

  function applyMapStatus(theme: RunMapTheme) {
    try {
      map?.setStatus?.({ showIndoorMap: activeMode === 'classic', showLabel: theme.showLabels });
    } catch (error) {
      console.warn('Could not update map status for run map mode.', error);
    }
  }

  function applyMapFeatures(theme: RunMapTheme) {
    try {
      map?.setFeatures?.(theme.features);
    } catch (error) {
      console.warn('Could not update map features for run map mode.', error);
    }
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

function toLngLatTuple(point: PlannedRoute['start']): LngLatTuple {
  return [point.longitude, point.latitude];
}

function createRunnerMarkerContent(avatar: Partial<AvatarConfig>) {
  return `
        <div class="run-map-runner-avatar" aria-hidden="true">
            <span class="run-map-runner-shadow"></span>
            ${createAvatarSvg(avatar, 'pixel-avatar run-map-avatar-svg')}
        </div>
    `;
}

export async function loadAMap() {
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
