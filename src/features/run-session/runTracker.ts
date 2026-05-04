import { moodCheckpoints, moodPlans, runPlanOptions } from '../mood-engine/data';
import { createLocationService } from './locationService';
import { createRunMap } from './runMap';
import { createRunMetrics } from './metricsEngine';
import { createEmotionalStateEngine, type EmotionalRunCue } from './emotionalStateEngine';
import { wgs84ToGcj02 } from './coordTransform';
import type { MoodRunState, PlannedRoute, PositionLike, RoutePlanPoint, RunRecord, RunSessionHandle } from '../../types/moodrun';

interface TrackingStatus {
  message: string;
  tone: string;
}

interface RouteGuidanceFeedback {
  detail: string;
  title: string;
  tone: string;
}

interface MetricsMilestone {
  averagePace: number | null;
  distanceKm: number;
  elapsedSec: number;
  type: 'distance' | 'time';
}

type PaceFeedbackStatus = 'onTarget' | 'tooFast' | 'tooSlow';

interface PaceFeedback {
  averagePace: number | null;
  currentPace: number | null;
  elapsedSec: number;
  paceRange: number[];
  status: PaceFeedbackStatus;
}

interface TrackingCallbacks {
  onCheckpoint: (text: string, checkpointIndex: number) => void;
  onComplete: () => void;
  onEmotionalCue?: (cue: EmotionalRunCue) => void;
  onMetricsMilestone?: (milestone: MetricsMilestone) => void;
  onPaceFeedback?: (feedback: PaceFeedback) => void;
  onRouteGuidance?: (feedback: RouteGuidanceFeedback) => void;
  onStatus?: (status: TrackingStatus) => void;
}

const START_DISTANCE_WARNING_METERS = 300;
const OFF_ROUTE_WARNING_METERS = 120;
const BACK_ON_ROUTE_METERS = 80;
const PACE_FEEDBACK_MIN_DISTANCE_KM = 0.12;
const PACE_FEEDBACK_MIN_ELAPSED_SEC = 45;
const PACE_FEEDBACK_INTERVAL_SEC = 90;
const PACE_FEEDBACK_SWITCH_INTERVAL_SEC = 45;
const PACE_TOLERANCE_MIN_PER_KM = 0.25;

export function startRunTracking(
  state: MoodRunState,
  {
    onCheckpoint,
    onComplete,
    onEmotionalCue,
    onMetricsMilestone,
    onPaceFeedback,
    onRouteGuidance,
    onStatus,
  }: TrackingCallbacks,
): RunSessionHandle {
  const plan = getActivePlan(state);
  const checkpoints = moodCheckpoints[state.currentMood || 'neutral'];
  const metrics = createRunMetrics({ targetDistanceKm: plan.targetDistance });
  const emotionalState = createEmotionalStateEngine({ paceRange: plan.paceRange });
  const liveMap = createRunMap('runLiveMap', 'runMapMessage', {
    avatar: state.avatar,
    mode: state.runMapMode,
    mood: state.currentMood,
  });
  let nextCheckpointIndex = 0;
  let nextDistanceMilestoneKm = 1;
  let nextTimeMilestoneSec = 300;
  let lastPaceFeedbackSec = 0;
  let lastPaceStatus: PaceFeedbackStatus | null = null;
  let completed = false;
  let stopped = false;

  resetRunDisplay(plan);
  reportRunStatus('Requesting GPS access...', 'info');
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
    triggerMetricMilestones(snapshot);
    triggerEmotionalCue(snapshot);
    triggerPaceFeedback(snapshot);
    triggerCheckpoints(progress);
    triggerCompletion(progress);
  };

  const locationService = createLocationService({
    onStatus: ({ message, tone }) => {
      reportRunStatus(message, tone);
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
      const routeFeedback = updateRouteGuidance(state.selectedRoute, position, result.snapshot.routePointCount);
      if (routeFeedback) {
        onRouteGuidance?.(routeFeedback);
        const routeCue = emotionalState.recordRouteGuidance(routeFeedback, result.snapshot.elapsedSec);
        if (routeCue) onEmotionalCue?.(routeCue);
      }
      updateTrackingFeedback(result, reportRunStatus);
      syncFromSnapshot(result.snapshot);
    },
  });

  const timerId = window.setInterval(() => {
    syncFromSnapshot(metrics.tick());
  }, 1000);

  function triggerCheckpoints(progress: number) {
    const nextCheckpoint = checkpoints[nextCheckpointIndex];
    if (nextCheckpoint && progress >= nextCheckpoint.progress) {
      onCheckpoint(nextCheckpoint.text, nextCheckpointIndex);
      nextCheckpointIndex += 1;
    }
  }

  function triggerMetricMilestones(snapshot: ReturnType<typeof metrics.tick>) {
    if (!snapshot.hasLocationFix) return;

    while (snapshot.distanceKm >= nextDistanceMilestoneKm) {
      onMetricsMilestone?.({
        averagePace: snapshot.averagePace,
        distanceKm: nextDistanceMilestoneKm,
        elapsedSec: snapshot.elapsedSec,
        type: 'distance',
      });
      nextDistanceMilestoneKm += 1;
    }

    if (snapshot.distanceKm < 0.05) return;

    while (snapshot.elapsedSec >= nextTimeMilestoneSec) {
      onMetricsMilestone?.({
        averagePace: snapshot.averagePace,
        distanceKm: snapshot.distanceKm,
        elapsedSec: snapshot.elapsedSec,
        type: 'time',
      });
      nextTimeMilestoneSec += 300;
    }
  }

  function triggerEmotionalCue(snapshot: ReturnType<typeof metrics.tick>) {
    const cue = emotionalState.analyzeSnapshot(snapshot);
    if (cue) onEmotionalCue?.(cue);
  }

  function triggerPaceFeedback(snapshot: ReturnType<typeof metrics.tick>) {
    if (!snapshot.hasLocationFix || snapshot.distanceKm < PACE_FEEDBACK_MIN_DISTANCE_KM) return;
    if (snapshot.elapsedSec < PACE_FEEDBACK_MIN_ELAPSED_SEC) return;

    const pace = snapshot.currentPace ?? snapshot.averagePace;
    if (!Number.isFinite(pace)) return;

    const [fastEdge, slowEdge] = plan.paceRange;
    let status: PaceFeedbackStatus | null = null;

    if ((pace as number) < fastEdge - PACE_TOLERANCE_MIN_PER_KM) {
      status = 'tooFast';
    } else if ((pace as number) > slowEdge + PACE_TOLERANCE_MIN_PER_KM) {
      status = 'tooSlow';
    } else if (lastPaceStatus && lastPaceStatus !== 'onTarget') {
      status = 'onTarget';
    }

    if (!status) return;

    const secondsSinceLastFeedback = snapshot.elapsedSec - lastPaceFeedbackSec;
    const requiredInterval =
      status === lastPaceStatus ? PACE_FEEDBACK_INTERVAL_SEC : PACE_FEEDBACK_SWITCH_INTERVAL_SEC;

    if (secondsSinceLastFeedback < requiredInterval) return;

    lastPaceFeedbackSec = snapshot.elapsedSec;
    lastPaceStatus = status;
    onPaceFeedback?.({
      averagePace: snapshot.averagePace,
      currentPace: snapshot.currentPace,
      elapsedSec: snapshot.elapsedSec,
      paceRange: plan.paceRange,
      status,
    });
  }

  function triggerCompletion(progress: number) {
    if (completed || progress < 100) return;

    completed = true;
    stopTracking();
    onCheckpoint('TARGET COMPLETE!', checkpoints.length);
    window.setTimeout(onComplete, 850);
  }

  function reportRunStatus(message: string, tone = 'info') {
    updateRunStatus(message, tone);
    onStatus?.({ message, tone });
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
    voiceControlEnabled: state.voiceControlEnabled,
    voiceEnabled: state.voiceEnabled,
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

function updateRouteGuidance(
  route: PlannedRoute | null,
  position: PositionLike,
  routePointCount: number,
): RouteGuidanceFeedback | null {
  if (!route) {
    resetRouteGuidance();
    return null;
  }

  const current = toGcjPoint(position);
  const startDistance = haversineDistanceMeters(current, route.start);
  const routeDistance = distanceToRouteMeters(current, route);

  if (routePointCount <= 1 && startDistance > START_DISTANCE_WARNING_METERS) {
    const feedback = {
      detail: `${formatMeters(startDistance)} to route start. Head there, or begin from here.`,
      title: 'START POINT AWAY',
      tone: 'warning',
    };
    setRouteGuidance(feedback.title, feedback.detail, feedback.tone);
    return feedback;
  }

  if (routeDistance > OFF_ROUTE_WARNING_METERS) {
    const feedback = {
      detail: `${formatMeters(routeDistance)} from recommended route. Free run continues.`,
      title: 'OFF ROUTE',
      tone: 'offroute',
    };
    setRouteGuidance(feedback.title, feedback.detail, feedback.tone);
    return feedback;
  }

  if (routeDistance <= BACK_ON_ROUTE_METERS) {
    resetRouteGuidance();
    return null;
  }

  resetRouteGuidance();
  return null;
}

function setRouteGuidance(title: string, detail: string, tone: string) {
  const pill = document.getElementById('routeGuidancePill') as HTMLElement | null;
  if (!pill) return;

  pill.hidden = false;
  pill.dataset.tone = tone;
  setText('routeGuidanceTitle', title);
  setText('routeGuidanceDetail', detail);
}

function updateTrackingFeedback(
  result: ReturnType<ReturnType<typeof createRunMetrics>['addPosition']>,
  reportRunStatus: (message: string, tone?: string) => void,
) {
  const accuracy = result.snapshot.currentAccuracy;
  const roundedAccuracy = Number.isFinite(accuracy) ? Math.round(accuracy as number) : null;

  if (result.accepted && result.snapshot.routePointCount > 1) {
    reportRunStatus(
      roundedAccuracy !== null ? `Tracking live. Current accuracy ${roundedAccuracy}m.` : 'Tracking live.',
      'ready',
    );
    return;
  }

  if (result.accepted && result.snapshot.routePointCount === 1) {
    reportRunStatus(
      roundedAccuracy !== null
        ? `Location captured at ${roundedAccuracy}m accuracy. Start moving to build distance.`
        : 'Location captured. Start moving to build distance.',
      'ready',
    );
    return;
  }

  if (result.reason === 'accuracy') {
    reportRunStatus(
      roundedAccuracy !== null
        ? `Location found, but accuracy is still ${roundedAccuracy}m. Waiting for a clearer fix.`
        : 'Location found, but accuracy is still weak. Waiting for a clearer fix.',
      'warning',
    );
    return;
  }

  if (result.reason === 'jitter') {
    reportRunStatus('Position is stable. Start moving to begin distance tracking.', 'info');
    return;
  }

  if (result.reason === 'speed') {
    reportRunStatus('A large GPS jump was ignored. Waiting for a stable position update.', 'warning');
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
