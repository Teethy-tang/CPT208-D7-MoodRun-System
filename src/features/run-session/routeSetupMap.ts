import type { PlannedRoute, RoutePlanPoint, RoutePlanSource } from '../../types/moodrun';
import { wgs84ToGcj02 } from './coordTransform';
import { loadAMap } from './runMap';

const DEFAULT_CENTER = { latitude: 31.2304, longitude: 121.4737, label: 'Default start' };
const DEFAULT_ZOOM = 14;

interface RouteSetupMapOptions {
  containerId?: string;
  targetDistanceKm?: number;
  onRouteChange?: (route: PlannedRoute) => void;
  onStatus?: (message: string) => void;
}

type LngLatTuple = [number, number];
type RoutePointKind = 'start' | 'end';

export interface RouteSetupMapHandle {
  init: () => Promise<void>;
  setTargetDistance: (distanceKm: number) => void;
  resetPickMode: () => void;
  searchManualPoint: (input: string) => Promise<RoutePlanPoint[]>;
  selectManualPoint: (kind: RoutePointKind, point: RoutePlanPoint) => Promise<void>;
  applyManualRoute: (startInput: string, endInput: string) => Promise<void>;
  generateRandomRoute: () => Promise<void>;
}

export function createRouteSetupMap({
  containerId = 'routeSetupMap',
  targetDistanceKm = 4,
  onRouteChange,
  onStatus,
}: RouteSetupMapOptions = {}): RouteSetupMapHandle {
  let AMap: any = null;
  let map: any = null;
  let currentLocationMarker: any = null;
  let startMarker: any = null;
  let endMarker: any = null;
  let routeLine: any = null;
  let geocoder: any = null;
  let selectedStart: RoutePlanPoint | null = null;
  let selectedEnd: RoutePlanPoint | null = null;
  let pickStep: 'start' | 'end' = 'start';
  let randomTargetDistanceKm = targetDistanceKm;

  async function init() {
    AMap = await loadAMap();

    if (!map) {
      const container = document.getElementById(containerId);
      if (!container) throw new Error('Route setup map container was not found.');

      map = new AMap.Map(container, {
        center: toLngLatTuple(DEFAULT_CENTER),
        zoom: DEFAULT_ZOOM,
        resizeEnable: true,
        dragEnable: true,
        zoomEnable: true,
      });

      currentLocationMarker = new AMap.Marker({
        content: '<div class="route-current-marker"><span></span></div>',
        offset: new AMap.Pixel(-13, -13),
        zIndex: 130,
      });

      startMarker = new AMap.Marker({
        content: '<div class="route-setup-pin route-setup-pin-start"><span>S</span></div>',
        offset: new AMap.Pixel(-13, -28),
        zIndex: 120,
      });

      endMarker = new AMap.Marker({
        content: '<div class="route-setup-pin route-setup-pin-end"><span>E</span></div>',
        offset: new AMap.Pixel(-13, -28),
        zIndex: 121,
      });

      routeLine = new AMap.Polyline({
        strokeColor: '#f993be',
        strokeWeight: 6,
        strokeOpacity: 0.92,
        strokeStyle: 'solid',
        lineJoin: 'round',
        lineCap: 'round',
        showDir: true,
        zIndex: 110,
      });

      map.add([routeLine, currentLocationMarker, startMarker, endMarker]);
      map.on('click', handleMapClick);
    }

    map.resize();
    resetPickMode();
    await centerOnCurrentLocation();
  }

  function resetPickMode() {
    selectedStart = null;
    selectedEnd = null;
    pickStep = 'start';
    clearRoute();
    setStatus('MAP PICK: choose a start point.');
  }

  function setTargetDistance(distanceKm: number) {
    randomTargetDistanceKm = distanceKm;
  }

  async function applyManualRoute(startInput: string, endInput: string) {
    const start = selectedStart ?? (await resolvePoint(startInput, 'Manual start'));
    const end = selectedEnd ?? (await resolvePoint(endInput, 'Manual finish'));
    await commitRoute(start, end, 'manual');
  }

  async function searchManualPoint(input: string) {
    return searchPoints(input);
  }

  async function selectManualPoint(kind: RoutePointKind, point: RoutePlanPoint) {
    if (kind === 'start') {
      selectedStart = point;
      selectedEnd = selectedEnd ?? null;
      pickStep = 'end';
    } else {
      selectedEnd = point;
      pickStep = 'start';
    }

    if (selectedStart && selectedEnd) {
      await commitRoute(selectedStart, selectedEnd, 'manual');
      return;
    }

    previewManualPoint(kind, point);
    setStatus(kind === 'start' ? 'START SET. Add a finish point.' : 'FINISH SET. Add a start point.');
  }

  async function generateRandomRoute() {
    setStatus('Finding your current area...');
    const origin = await getCurrentMapPoint();
    const routeDistance = Math.max(0.8, Math.min(randomTargetDistanceKm || 4, 8));
    const bearing = Math.random() * Math.PI * 2;
    const finish = destinationPoint(origin, routeDistance, bearing);
    const namedOrigin = await namePoint(origin, 'Current area');
    const namedFinish = await namePoint(finish, 'Random finish');

    await commitRoute(namedOrigin, namedFinish, 'random');
  }

  async function handleMapClick(event: any) {
    setStatus('Resolving selected place...');
    const point = await namePoint(
      pointFromLngLat(event.lnglat, pickStep === 'start' ? 'Map start' : 'Map finish'),
      pickStep === 'start' ? 'Map start' : 'Map finish',
    );

    if (pickStep === 'start') {
      selectedStart = point;
      selectedEnd = null;
      drawPartialRoute();
      pickStep = 'end';
      setStatus('START SET. Choose the finish point.');
      return;
    }

    selectedEnd = point;
    if (selectedStart) {
      await commitRoute(selectedStart, selectedEnd, 'map');
    }
  }

  async function commitRoute(start: RoutePlanPoint, end: RoutePlanPoint, source: RoutePlanSource) {
    selectedStart = start;
    selectedEnd = end;
    pickStep = 'start';

    const path = [toLngLatTuple(start), toLngLatTuple(end)];
    const distanceKm = haversineDistanceKm(start, end);

    drawRoute(path, start, end);
    setStatus(`${source.toUpperCase()} ROUTE READY.`);
    onRouteChange?.({ start, end, distanceKm, source });
  }

  function drawPartialRoute() {
    if (!startMarker || !endMarker || !routeLine || !selectedStart) return;

    startMarker.setPosition(toLngLatTuple(selectedStart));
    startMarker.show();
    endMarker.hide();
    routeLine.hide();
    map.setZoomAndCenter(15, toLngLatTuple(selectedStart));
  }

  function previewManualPoint(kind: RoutePointKind, point: RoutePlanPoint) {
    const marker = kind === 'start' ? startMarker : endMarker;
    if (!marker || !routeLine) return;

    marker.setPosition(toLngLatTuple(point));
    marker.show();
    routeLine.hide();
    map.setZoomAndCenter(16, toLngLatTuple(point));
  }

  function drawRoute(path: LngLatTuple[], start: RoutePlanPoint, end: RoutePlanPoint) {
    startMarker.setPosition(toLngLatTuple(start));
    endMarker.setPosition(toLngLatTuple(end));
    routeLine.setPath(path);
    startMarker.show();
    endMarker.show();
    routeLine.show();
    map.setFitView([startMarker, endMarker, routeLine], false, [42, 42, 42, 42], 17);
  }

  function clearRoute() {
    if (!startMarker || !endMarker || !routeLine) return;

    startMarker.hide();
    endMarker.hide();
    routeLine.hide();
  }

  async function resolvePoint(input: string, fallbackLabel: string): Promise<RoutePlanPoint> {
    const matches = await searchPoints(input, fallbackLabel);
    if (!matches.length) throw new Error(`Could not find "${input.trim()}".`);
    return matches[0];
  }

  async function searchPoints(input: string, fallbackLabel = 'Manual point'): Promise<RoutePlanPoint[]> {
    const trimmed = input.trim();
    if (!trimmed) throw new Error('Please enter an address or coordinate.');

    const coordinate = parseCoordinate(trimmed);
    if (coordinate) {
      return [{ ...coordinate, label: trimmed }];
    }

    await ensureGeocoder();

    return new Promise((resolve, reject) => {
      geocoder.getLocation(trimmed, (status: string, result: any) => {
        const geocodes = result?.geocodes ?? [];

        if (status === 'complete' && geocodes.length) {
          resolve(
            geocodes
              .filter((item: any) => item.location)
              .slice(0, 5)
              .map((item: any) =>
                pointFromLngLat(
                  item.location,
                  item.formattedAddress || item.name || trimmed || fallbackLabel,
                ),
              ),
          );
          return;
        }

        reject(new Error(`Could not find "${trimmed}".`));
      });
    });
  }

  async function ensureGeocoder() {
    if (geocoder) return;

    await new Promise<void>((resolve) => {
      AMap.plugin(['AMap.Geocoder'], () => resolve());
    });

    geocoder = new AMap.Geocoder({});
  }

  async function namePoint(point: RoutePlanPoint, fallbackLabel: string): Promise<RoutePlanPoint> {
    await ensureGeocoder();

    return new Promise((resolve) => {
      const fallbackTimer = window.setTimeout(() => {
        resolve({
          ...point,
          label: `${fallbackLabel} ${formatCoordinateLabel(point)}`,
        });
      }, 5000);

      geocoder.getAddress(toLngLatTuple(point), (status: string, result: any) => {
        window.clearTimeout(fallbackTimer);
        const regeocode = result?.regeocode;
        const poiName = regeocode?.pois?.[0]?.name;
        const address = regeocode?.formattedAddress;
        const label = status === 'complete' && (poiName || address) ? poiName || address : `${fallbackLabel} ${formatCoordinateLabel(point)}`;

        resolve({
          ...point,
          label,
        });
      });
    });
  }

  async function getCurrentMapPoint(): Promise<RoutePlanPoint> {
    if (!('geolocation' in navigator)) return DEFAULT_CENTER;

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 30000,
        });
      });
      const converted = wgs84ToGcj02(position.coords.latitude, position.coords.longitude);
      return {
        latitude: converted.latitude,
        longitude: converted.longitude,
        label: 'Current area',
      };
    } catch {
      setStatus('Could not read location. Using a nearby default area.');
      return DEFAULT_CENTER;
    }
  }

  async function centerOnCurrentLocation() {
    const point = await getCurrentMapPoint();
    map.setZoomAndCenter(15, toLngLatTuple(point));

    if (point === DEFAULT_CENTER) {
      currentLocationMarker?.hide();
      setStatus('Using default area. Choose a start point.');
      return;
    }

    currentLocationMarker?.setPosition(toLngLatTuple(point));
    currentLocationMarker?.show();
    setStatus('Centered near you. Choose a start point.');
  }

  function setStatus(message: string) {
    onStatus?.(message);
  }

  return {
    init,
    setTargetDistance,
    resetPickMode,
    searchManualPoint,
    selectManualPoint,
    applyManualRoute,
    generateRandomRoute,
  };
}

function parseCoordinate(input: string): RoutePlanPoint | null {
  const parts = input
    .split(/[,\s]+/)
    .map((part) => Number(part))
    .filter((value) => Number.isFinite(value));

  if (parts.length < 2) return null;

  const [first, second] = parts;
  const longitude = Math.abs(first) > 90 ? first : second;
  const latitude = Math.abs(first) > 90 ? second : first;

  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;

  return {
    latitude,
    longitude,
    label: `${longitude.toFixed(5)}, ${latitude.toFixed(5)}`,
  };
}

function pointFromLngLat(lnglat: any, label: string): RoutePlanPoint {
  const longitude = typeof lnglat.getLng === 'function' ? lnglat.getLng() : lnglat.lng;
  const latitude = typeof lnglat.getLat === 'function' ? lnglat.getLat() : lnglat.lat;

  return {
    latitude,
    longitude,
    label,
  };
}

function toLngLatTuple(point: RoutePlanPoint): LngLatTuple {
  return [point.longitude, point.latitude];
}

function formatCoordinateLabel(point: RoutePlanPoint) {
  return `(${point.longitude.toFixed(5)}, ${point.latitude.toFixed(5)})`;
}

function destinationPoint(origin: RoutePlanPoint, distanceKm: number, bearingRadians: number): RoutePlanPoint {
  const northMeters = Math.cos(bearingRadians) * distanceKm * 1000;
  const eastMeters = Math.sin(bearingRadians) * distanceKm * 1000;
  const latitude = origin.latitude + northMeters / 110540;
  const longitude = origin.longitude + eastMeters / (111320 * Math.cos((origin.latitude * Math.PI) / 180));

  return {
    latitude,
    longitude,
    label: 'Random finish',
  };
}

function haversineDistanceKm(start: RoutePlanPoint, end: RoutePlanPoint) {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(end.latitude - start.latitude);
  const deltaLon = toRadians(end.longitude - start.longitude);
  const lat1 = toRadians(start.latitude);
  const lat2 = toRadians(end.latitude);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
