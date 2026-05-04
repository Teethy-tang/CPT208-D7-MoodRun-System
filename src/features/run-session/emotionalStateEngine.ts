import type { RunSnapshot } from '../../types/moodrun';

export type EmotionalRunState = 'fading' | 'paused' | 'recovered' | 'rerouting' | 'rushing' | 'settled';

export interface EmotionalRunCue {
  averagePace: number | null;
  currentPace: number | null;
  elapsedSec: number;
  state: EmotionalRunState;
}

interface EmotionalStateEngineOptions {
  paceRange: number[];
}

interface PaceSample {
  elapsedSec: number;
  pace: number;
}

interface RouteFeedbackLike {
  tone: string;
}

const MIN_CUE_ELAPSED_SEC = 55;
const MIN_CUE_DISTANCE_KM = 0.08;
const GLOBAL_CUE_GAP_SEC = 45;
const SAME_STATE_CUE_GAP_SEC = 180;
const PACE_SHIFT_MIN_DELTA = 0.48;
const STABLE_REQUIRED_SEC = 95;
const STABLE_PACE_SPREAD = 0.38;
const STATIONARY_CUE_SEC = 28;
const MOVING_DELTA_KM = 0.006;
const OFF_ROUTE_WINDOW_SEC = 210;
const OFF_ROUTE_REPEAT_COUNT = 2;

export function createEmotionalStateEngine({ paceRange }: EmotionalStateEngineOptions) {
  const paceSamples: PaceSample[] = [];
  const lastCueByState = new Map<EmotionalRunState, number>();
  const offRouteEvents: number[] = [];
  let lastCueAtSec = 0;
  let lastMovingDistanceKm = 0;
  let lastMovingAtSec = 0;
  let lastPaceStatus: 'fast' | 'slow' | 'steady' | null = null;

  function analyzeSnapshot(snapshot: RunSnapshot): EmotionalRunCue | null {
    if (!snapshot.hasLocationFix || snapshot.elapsedSec < MIN_CUE_ELAPSED_SEC) return null;

    updateMovement(snapshot);

    const stationaryCue = analyzeStationary(snapshot);
    if (stationaryCue) return stationaryCue;

    const pace = snapshot.currentPace ?? snapshot.averagePace;
    if (!Number.isFinite(pace) || snapshot.distanceKm < MIN_CUE_DISTANCE_KM) return null;

    recordPaceSample(snapshot.elapsedSec, pace as number);

    const paceShiftCue = analyzePaceShift(snapshot, pace as number);
    if (paceShiftCue) return paceShiftCue;

    return analyzeSettled(snapshot);
  }

  function recordRouteGuidance(feedback: RouteFeedbackLike, elapsedSec: number): EmotionalRunCue | null {
    if (feedback.tone !== 'offroute' || elapsedSec < MIN_CUE_ELAPSED_SEC) return null;

    offRouteEvents.push(elapsedSec);
    pruneOffRouteEvents(elapsedSec);

    if (offRouteEvents.length < OFF_ROUTE_REPEAT_COUNT) return null;

    return makeCue('rerouting', {
      averagePace: null,
      currentPace: null,
      elapsedSec,
    });
  }

  function updateMovement(snapshot: RunSnapshot) {
    if (snapshot.distanceKm - lastMovingDistanceKm >= MOVING_DELTA_KM) {
      lastMovingDistanceKm = snapshot.distanceKm;
      lastMovingAtSec = snapshot.elapsedSec;
    }
  }

  function analyzeStationary(snapshot: RunSnapshot) {
    if (snapshot.distanceKm < MIN_CUE_DISTANCE_KM) return null;

    const stationarySec = snapshot.elapsedSec - lastMovingAtSec;
    if (stationarySec < STATIONARY_CUE_SEC) return null;

    return makeCue('paused', {
      averagePace: snapshot.averagePace,
      currentPace: snapshot.currentPace,
      elapsedSec: snapshot.elapsedSec,
    });
  }

  function analyzePaceShift(snapshot: RunSnapshot, pace: number) {
    const [fastEdge, slowEdge] = paceRange;
    const status = pace < fastEdge - PACE_SHIFT_MIN_DELTA ? 'fast' : pace > slowEdge + PACE_SHIFT_MIN_DELTA ? 'slow' : 'steady';

    if (status === 'steady' && lastPaceStatus && lastPaceStatus !== 'steady') {
      lastPaceStatus = status;
      return makeCue('recovered', {
        averagePace: snapshot.averagePace,
        currentPace: snapshot.currentPace,
        elapsedSec: snapshot.elapsedSec,
      });
    }

    if (status === 'fast') {
      lastPaceStatus = status;
      return makeCue('rushing', {
        averagePace: snapshot.averagePace,
        currentPace: snapshot.currentPace,
        elapsedSec: snapshot.elapsedSec,
      });
    }

    if (status === 'slow') {
      lastPaceStatus = status;
      return makeCue('fading', {
        averagePace: snapshot.averagePace,
        currentPace: snapshot.currentPace,
        elapsedSec: snapshot.elapsedSec,
      });
    }

    lastPaceStatus = status;
    return null;
  }

  function analyzeSettled(snapshot: RunSnapshot) {
    const recentSamples = paceSamples.filter((sample) => snapshot.elapsedSec - sample.elapsedSec <= STABLE_REQUIRED_SEC);
    if (recentSamples.length < 5) return null;

    const coveredSec = recentSamples[recentSamples.length - 1].elapsedSec - recentSamples[0].elapsedSec;
    if (coveredSec < STABLE_REQUIRED_SEC - 12) return null;

    const values = recentSamples.map((sample) => sample.pace);
    const spread = Math.max(...values) - Math.min(...values);
    const [fastEdge, slowEdge] = paceRange;
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;

    if (spread > STABLE_PACE_SPREAD || average < fastEdge || average > slowEdge) return null;

    return makeCue('settled', {
      averagePace: snapshot.averagePace,
      currentPace: snapshot.currentPace,
      elapsedSec: snapshot.elapsedSec,
    });
  }

  function recordPaceSample(elapsedSec: number, pace: number) {
    paceSamples.push({ elapsedSec, pace });

    while (paceSamples.length > 0 && elapsedSec - paceSamples[0].elapsedSec > STABLE_REQUIRED_SEC + 20) {
      paceSamples.shift();
    }
  }

  function pruneOffRouteEvents(elapsedSec: number) {
    while (offRouteEvents.length > 0 && elapsedSec - offRouteEvents[0] > OFF_ROUTE_WINDOW_SEC) {
      offRouteEvents.shift();
    }
  }

  function makeCue(
    state: EmotionalRunState,
    base: Omit<EmotionalRunCue, 'state'>,
  ): EmotionalRunCue | null {
    if (base.elapsedSec - lastCueAtSec < GLOBAL_CUE_GAP_SEC) return null;

    const lastSameCueAt = lastCueByState.get(state) || 0;
    if (base.elapsedSec - lastSameCueAt < SAME_STATE_CUE_GAP_SEC) return null;

    lastCueAtSec = base.elapsedSec;
    lastCueByState.set(state, base.elapsedSec);
    return {
      ...base,
      state,
    };
  }

  return {
    analyzeSnapshot,
    recordRouteGuidance,
  };
}
