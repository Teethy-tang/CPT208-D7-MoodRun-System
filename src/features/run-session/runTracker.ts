import { moodCheckpoints, moodPlans, runPlanOptions } from '../mood-engine/data';
import { createLocationService } from './locationService';
import { createRunMap } from './runMap';
import { createRunMetrics } from './metricsEngine';
import { wgs84ToGcj02 } from './coordTransform';
import type { MoodRunState, PlannedRoute, PositionLike, RoutePlanPoint, RunRecord, RunSessionHandle } from '../../types/moodrun';

interface TrackingCallbacks {
  onCheckpoint: (text: string) => void;
  onComplete: () => void;
}

const START_DISTANCE_WARNING_METERS = 300;
const OFF_ROUTE_WARNING_METERS = 120;
const BACK_ON_ROUTE_METERS = 80;

export function startRunTracking(state: MoodRunState, { onCheckpoint, onComplete }: TrackingCallbacks): RunSessionHandle {
  const plan = getActivePlan(state);
  const checkpoints = moodCheckpoints[state.currentMood || 'neutral'];
  const metrics = createRunMetrics({ targetDistanceKm: plan.targetDistance });
  const liveMap = createRunMap();
  let nextCheckpointIndex = 0;
  let completed = false;
  let stopped = false;

  resetRunDisplay(plan);
  updateRunStatus('Requesting GPS access...', 'info');
  void liveMap.reset(state.selectedRoute);

  const syncFromSnapshot = (snapshot: ReturnType<typeof metrics.tick>) => {
    const livePace = snapshot.currentPace ?? snapshot.averagePace;

    state.runData = {
      ...state.runData,
      distance: snapshot.distanceKm,
      pace: snapshot.averagePace ?? 0,
      currentPace: livePace ?? null,
      averagePace: snapshot.averagePace ?? null,
      time: snapshot.elapsedSec,
      calories: snapshot.calories,
      remainingDistance: snapshot.remainingDistanceKm,
      accuracy: snapshot.currentAccuracy,
      targetDistance: plan.targetDistance,
      planName: plan.name,
      hasLocationFix: snapshot.hasLocationFix,
      routePointCount: snapshot.routePointCount,
      gpsQuality: snapshot.gpsQuality,
      lastTrackingError: state.runData.lastTrackingError,
    };

    const progress = updateRunDisplay(state.runData, plan);
    triggerCheckpoints(progress);
    triggerCompletion(progress);
  };

  const locationService = createLocationService({
    useMock: !!state.runTestMode,
    onStatus: ({ message, tone }) => {
      updateRunStatus(message, tone);
    },
    onError: ({ message }) => {
      state.runData.lastTrackingError = message;
    },
    onPosition: (position) => {
      const result = metrics.addPosition(position);
      liveMap.syncPosition(position, {
        accepted: result.accepted,
        reason: result.reason,
        accuracy: result.snapshot.currentAccuracy,
      });
      updateRouteGuidance(state.selectedRoute, position, result.snapshot.routePointCount);
      updateTrackingFeedback(result, state.runTestMode);
      syncFromSnapshot(result.snapshot);
    },
  });

  const timerId = window.setInterval(() => {
    syncFromSnapshot(metrics.tick());
  }, 1000);

  function triggerCheckpoints(progress: number) {
    const nextCheckpoint = checkpoints[nextCheckpointIndex];
    if (nextCheckpoint && progress >= nextCheckpoint.progress) {
      onCheckpoint(nextCheckpoint.text);
      nextCheckpointIndex += 1;
    }
  }

  function triggerCompletion(progress: number) {
    if (completed || progress < 100) return;

    completed = true;
    stopTracking();
    onCheckpoint('TARGET COMPLETE!');
    window.setTimeout(onComplete, 850);
  }

  function stopTracking() {
    if (stopped) return;
    stopped = true;
    window.clearInterval(timerId);
    locationService.stop();
    liveMap.destroy();
  }

  locationService.start();
  syncFromSnapshot(metrics.tick());

  return {
    stop() {
      stopTracking();
    },
  };
}

export function makeRunRecord(state: MoodRunState): RunRecord {
  return {
    date: new Date().toISOString(),
    mood: state.currentMood,
    thought: state.currentThought,
    distance: state.runData.distance,
    pace: state.runData.averagePace ?? state.runData.pace ?? 0,
    currentPace: state.runData.currentPace ?? null,
    time: state.runData.time,
    calories: state.runData.calories,
    plan: state.selectedPlan,
    planName: state.runData.planName,
    moodAfter: state.lastMoodShift?.after,
    moodInsight: state.lastMoodShift?.insight,
  };
}

export function formatPace(pace: number | null) {
  if (!Number.isFinite(pace) || (pace as number) <= 0) {
    return '--:--';
  }

  const safePace = pace as number;
  const minutes = Math.floor(safePace);
  const seconds = Math.round((safePace % 1) * 60);
  const normalizedMinutes = seconds === 60 ? minutes + 1 : minutes;
  const normalizedSeconds = seconds === 60 ? 0 : seconds;

  return `${normalizedMinutes}:${String(normalizedSeconds).padStart(2, '0')}`;
}

export function formatTime(seconds: number) {
  const totalSeconds = Math.max(0, Math.floor(seconds || 0));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainder = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

export function getActivePlan(
  state: Pick<MoodRunState, 'currentMood' | 'selectedPlan'> &
    Partial<Pick<MoodRunState, 'selectedRoute' | 'routeDistanceMode'>>,
) {
  const basePlan =
    state.selectedPlan === 'recommended'
      ? moodPlans[state.currentMood || 'neutral']
      : runPlanOptions[state.selectedPlan as keyof typeof runPlanOptions] || moodPlans[state.currentMood || 'neutral'];

  if (state.routeDistanceMode === 'route' && state.selectedRoute?.distanceKm) {
    const routeDistance = Math.max(0.1, state.selectedRoute.distanceKm);
    return {
      ...basePlan,
      name: `${basePlan.name} ROUTE`,
      dist: `${routeDistance.toFixed(2)}KM`,
      targetDistance: routeDistance,
    };
  }

  return basePlan;
}

function resetRunDisplay(plan: ReturnType<typeof getActivePlan>) {
  setText('distanceDisplay', '0.00');
  setText('paceDisplay', '--:--');
  setText('avgPaceDisplay', '--:--');
  setText('timeDisplay', '00:00');
  setText('calDisplay', '0');
  setText('remainingDistanceDisplay', `${plan.targetDistance.toFixed(2)} KM LEFT`);
  setText('routePointCount', '0 PTS');
  setText('gpsQualityLabel', 'SEARCHING');
  resetRouteGuidance();
  setWidth('progressFill', '0%');
  setText('progressPercent', '0%');
  setText('runTargetLabel', `TARGET ${plan.dist}`);
  document.querySelectorAll('.pace-zone').forEach((zone) => zone.classList.remove('active'));

  const runActionBtn = document.getElementById('runActionBtn');
  if (runActionBtn) runActionBtn.textContent = 'STOP RUN';
}

function updateRunDisplay(runData: MoodRunState['runData'], plan: ReturnType<typeof getActivePlan>) {
  const progress = Math.min((runData.distance / plan.targetDistance) * 100, 100);

  setText('distanceDisplay', runData.distance.toFixed(2));
  setText('paceDisplay', formatPace(runData.currentPace));
  setText('avgPaceDisplay', formatPace(runData.averagePace));
  setText('timeDisplay', formatTime(runData.time));
  setText('calDisplay', String(runData.calories));
  setText('remainingDistanceDisplay', `${runData.remainingDistance.toFixed(2)} KM LEFT`);
  setText('routePointCount', `${runData.routePointCount} PTS`);
  setText('gpsQualityLabel', runData.gpsQuality || 'SEARCHING');
  setWidth('progressFill', `${progress}%`);
  setText('progressPercent', `${Math.floor(progress)}%`);

  updatePaceZone(runData.currentPace ?? runData.averagePace);

  if (progress >= 100) {
    const runActionBtn = document.getElementById('runActionBtn');
    if (runActionBtn) runActionBtn.textContent = 'FINISHING...';
  }

  return progress;
}

function updateRunStatus(_message: string, _tone = 'info') {
  // Kept as a callback bridge for the tracker while the visible GPS status bar is hidden.
}

function resetRouteGuidance() {
  const pill = document.getElementById('routeGuidancePill') as HTMLElement | null;
  if (pill) pill.hidden = true;
}

function updateRouteGuidance(route: PlannedRoute | null, position: PositionLike, routePointCount: number) {
  if (!route) {
    resetRouteGuidance();
    return;
  }

  const current = toGcjPoint(position);
  const startDistance = haversineDistanceMeters(current, route.start);
  const routeDistance = distanceToRouteMeters(current, route);

  if (routePointCount <= 1 && startDistance > START_DISTANCE_WARNING_METERS) {
    setRouteGuidance(
      'START POINT AWAY',
      `${formatMeters(startDistance)} to route start. Head there, or begin from here.`,
      'warning',
    );
    return;
  }

  if (routeDistance > OFF_ROUTE_WARNING_METERS) {
    setRouteGuidance('OFF ROUTE', `${formatMeters(routeDistance)} from recommended route. Free run continues.`, 'offroute');
    return;
  }

  if (routeDistance <= BACK_ON_ROUTE_METERS) {
    resetRouteGuidance();
    return;
  }

  resetRouteGuidance();
}

function setRouteGuidance(title: string, detail: string, tone: string) {
  const pill = document.getElementById('routeGuidancePill') as HTMLElement | null;
  if (!pill) return;

  pill.hidden = false;
  pill.dataset.tone = tone;
  setText('routeGuidanceTitle', title);
  setText('routeGuidanceDetail', detail);
}

function updateTrackingFeedback(result: ReturnType<ReturnType<typeof createRunMetrics>['addPosition']>, isTestMode: boolean) {
  const accuracy = result.snapshot.currentAccuracy;
  const roundedAccuracy = Number.isFinite(accuracy) ? Math.round(accuracy as number) : null;

  if (isTestMode) {
    updateRunStatus('Desktop test route active. Simulated movement is feeding the tracker.', 'test');
    return;
  }

  if (result.accepted && result.snapshot.routePointCount > 1) {
    updateRunStatus(
      roundedAccuracy !== null ? `Tracking live. Current accuracy ${roundedAccuracy}m.` : 'Tracking live.',
      'ready',
    );
    return;
  }

  if (result.accepted && result.snapshot.routePointCount === 1) {
    updateRunStatus(
      roundedAccuracy !== null
        ? `Location captured at ${roundedAccuracy}m accuracy. Start moving to build distance.`
        : 'Location captured. Start moving to build distance.',
      'ready',
    );
    return;
  }

  if (result.reason === 'accuracy') {
    updateRunStatus(
      roundedAccuracy !== null
        ? `Location found, but accuracy is still ${roundedAccuracy}m. Waiting for a clearer fix.`
        : 'Location found, but accuracy is still weak. Waiting for a clearer fix.',
      'warning',
    );
    return;
  }

  if (result.reason === 'jitter') {
    updateRunStatus('Position is stable. Start moving to begin distance tracking.', 'info');
    return;
  }

  if (result.reason === 'speed') {
    updateRunStatus('A large GPS jump was ignored. Waiting for a stable position update.', 'warning');
  }
}

function updatePaceZone(pace: number | null) {
  document.querySelectorAll('.pace-zone').forEach((zone) => zone.classList.remove('active'));

  if (!Number.isFinite(pace)) return;

  if ((pace as number) < 5) {
    document.getElementById('zoneFast')?.classList.add('active');
  } else if ((pace as number) < 6.5) {
    document.getElementById('zoneMixed')?.classList.add('active');
  } else {
    document.getElementById('zoneAerobic')?.classList.add('active');
  }
}

function toGcjPoint(position: PositionLike): RoutePlanPoint {
  const converted = wgs84ToGcj02(position.coords.latitude, position.coords.longitude);
  return {
    latitude: converted.latitude,
    longitude: converted.longitude,
    label: 'Current position',
  };
}

function distanceToRouteMeters(point: RoutePlanPoint, route: PlannedRoute) {
  const start = projectToLocalMeters(route.start, route.start);
  const end = projectToLocalMeters(route.end, route.start);
  const current = projectToLocalMeters(point, route.start);
  const segmentX = end.x - start.x;
  const segmentY = end.y - start.y;
  const segmentLengthSq = segmentX * segmentX + segmentY * segmentY;

  if (segmentLengthSq <= 0) {
    return haversineDistanceMeters(point, route.start);
  }

  const t = Math.max(0, Math.min(1, ((current.x - start.x) * segmentX + (current.y - start.y) * segmentY) / segmentLengthSq));
  const nearestX = start.x + t * segmentX;
  const nearestY = start.y + t * segmentY;
  const dx = current.x - nearestX;
  const dy = current.y - nearestY;

  return Math.sqrt(dx * dx + dy * dy);
}

function projectToLocalMeters(point: RoutePlanPoint, reference: RoutePlanPoint) {
  const meanLat = toRadians((point.latitude + reference.latitude) / 2);
  return {
    x: (point.longitude - reference.longitude) * 111320 * Math.cos(meanLat),
    y: (point.latitude - reference.latitude) * 110540,
  };
}

function haversineDistanceMeters(pointA: RoutePlanPoint, pointB: RoutePlanPoint) {
  const earthRadiusMeters = 6371000;
  const lat1 = toRadians(pointA.latitude);
  const lat2 = toRadians(pointB.latitude);
  const deltaLat = lat2 - lat1;
  const deltaLon = toRadians(pointB.longitude - pointA.longitude);
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMeters * c;
}

function formatMeters(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}KM`;
  return `${Math.round(value)}M`;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function setText(id: string, value: string) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function setWidth(id: string, value: string) {
  const element = document.getElementById(id);
  if (element instanceof HTMLElement) {
    element.style.width = value;
  }
}
