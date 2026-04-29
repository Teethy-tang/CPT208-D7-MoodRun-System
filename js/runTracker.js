import { moodCheckpoints, moodPlans, runPlanOptions } from './data.js';
import { createLocationService } from './locationService.js';
import { createRunMetrics } from './metricsEngine.js';

export function startRunTracking(state, { onCheckpoint, onComplete }) {
    const plan = getActivePlan(state);
    const checkpoints = moodCheckpoints[state.currentMood] || moodCheckpoints.neutral;
    const metrics = createRunMetrics({ targetDistanceKm: plan.targetDistance });
    let nextCheckpointIndex = 0;
    let completed = false;
    let stopped = false;

    resetRunDisplay(plan);
    updateRunStatus('Requesting GPS access...', 'info');

    const syncFromSnapshot = snapshot => {
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
            gpsQuality: snapshot.gpsQuality
        };

        const progress = updateRunDisplay(state.runData, plan, snapshot.routePreview);
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
        onPosition: position => {
            const result = metrics.addPosition(position);
            updateTrackingFeedback(result, state.runTestMode);
            const { snapshot } = result;
            syncFromSnapshot(snapshot);
        }
    });

    const timerId = window.setInterval(() => {
        syncFromSnapshot(metrics.tick());
    }, 1000);

    function triggerCheckpoints(progress) {
        const nextCheckpoint = checkpoints[nextCheckpointIndex];
        if (nextCheckpoint && progress >= nextCheckpoint.progress) {
            onCheckpoint(nextCheckpoint.text);
            nextCheckpointIndex++;
        }
    }

    function triggerCompletion(progress) {
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
    }

    locationService.start();
    syncFromSnapshot(metrics.tick());

    return {
        stop() {
            stopTracking();
        }
    };
}

export function makeRunRecord(state) {
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
        moodInsight: state.lastMoodShift?.insight
    };
}

export function formatPace(pace) {
    if (!Number.isFinite(pace) || pace <= 0) {
        return '--:--';
    }

    const minutes = Math.floor(pace);
    const seconds = Math.round((pace % 1) * 60);
    const normalizedMinutes = seconds === 60 ? minutes + 1 : minutes;
    const normalizedSeconds = seconds === 60 ? 0 : seconds;

    return `${normalizedMinutes}:${String(normalizedSeconds).padStart(2, '0')}`;
}

export function formatTime(seconds) {
    const totalSeconds = Math.max(0, Math.floor(seconds || 0));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainder = totalSeconds % 60;

    if (hours > 0) {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
    }

    return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

export function getActivePlan(state) {
    if (state.selectedPlan === 'recommended') {
        return moodPlans[state.currentMood] || moodPlans.neutral;
    }

    return runPlanOptions[state.selectedPlan] || moodPlans[state.currentMood] || moodPlans.neutral;
}

function resetRunDisplay(plan) {
    document.getElementById('distanceDisplay').textContent = '0.00';
    document.getElementById('paceDisplay').textContent = '--:--';
    document.getElementById('avgPaceDisplay').textContent = '--:--';
    document.getElementById('timeDisplay').textContent = '00:00';
    document.getElementById('calDisplay').textContent = '0';
    document.getElementById('remainingDistanceDisplay').textContent = `${plan.targetDistance.toFixed(2)} KM LEFT`;
    document.getElementById('routePointCount').textContent = '0 PTS';
    document.getElementById('gpsQualityLabel').textContent = 'SEARCHING';
    document.getElementById('runAccuracyDisplay').textContent = 'ACC --';
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('progressPercent').textContent = '0%';
    document.getElementById('runTargetLabel').textContent = `TARGET ${plan.dist}`;
    document.querySelectorAll('.pace-zone').forEach(zone => zone.classList.remove('active'));
    updateRoutePreview({ polyline: '', start: null, current: null });

    const runActionBtn = document.getElementById('runActionBtn');
    if (runActionBtn) runActionBtn.textContent = 'STOP RUN';
}

function updateRunDisplay(runData, plan, routePreview) {
    const progress = Math.min((runData.distance / plan.targetDistance) * 100, 100);

    document.getElementById('distanceDisplay').textContent = runData.distance.toFixed(2);
    document.getElementById('paceDisplay').textContent = formatPace(runData.currentPace);
    document.getElementById('avgPaceDisplay').textContent = formatPace(runData.averagePace);
    document.getElementById('timeDisplay').textContent = formatTime(runData.time);
    document.getElementById('calDisplay').textContent = runData.calories;
    document.getElementById('remainingDistanceDisplay').textContent = `${runData.remainingDistance.toFixed(2)} KM LEFT`;
    document.getElementById('routePointCount').textContent = `${runData.routePointCount} PTS`;
    document.getElementById('gpsQualityLabel').textContent = runData.gpsQuality || 'SEARCHING';
    document.getElementById('runAccuracyDisplay').textContent = Number.isFinite(runData.accuracy)
        ? `ACC ${Math.round(runData.accuracy)}M`
        : 'ACC --';
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('progressPercent').textContent = `${Math.floor(progress)}%`;

    updateRoutePreview(routePreview);
    updatePaceZone(runData.currentPace ?? runData.averagePace);

    if (progress >= 100) {
        const runActionBtn = document.getElementById('runActionBtn');
        if (runActionBtn) runActionBtn.textContent = 'FINISHING...';
    }

    return progress;
}

function updateRunStatus(message, tone = 'info') {
    const statusLabel = document.getElementById('runStatusLabel');
    if (!statusLabel) return;

    statusLabel.textContent = message;
    statusLabel.dataset.tone = tone;
}

function updateTrackingFeedback(result, isTestMode) {
    const accuracy = result.snapshot.currentAccuracy;
    const roundedAccuracy = Number.isFinite(accuracy) ? Math.round(accuracy) : null;

    if (isTestMode) {
        updateRunStatus('Desktop test route active. Simulated movement is feeding the tracker.', 'test');
        return;
    }

    if (result.accepted && result.snapshot.routePointCount > 1) {
        updateRunStatus(
            roundedAccuracy !== null
                ? `Tracking live. Current accuracy ${roundedAccuracy}m.`
                : 'Tracking live.',
            'ready'
        );
        return;
    }

    if (result.accepted && result.snapshot.routePointCount === 1) {
        updateRunStatus(
            roundedAccuracy !== null
                ? `Location captured at ${roundedAccuracy}m accuracy. Start moving to build distance.`
                : 'Location captured. Start moving to build distance.',
            'ready'
        );
        return;
    }

    if (result.reason === 'accuracy') {
        updateRunStatus(
            roundedAccuracy !== null
                ? `Location found, but accuracy is still ${roundedAccuracy}m. Waiting for a clearer fix.`
                : 'Location found, but accuracy is still weak. Waiting for a clearer fix.',
            'warning'
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

function updateRoutePreview(routePreview) {
    const routeTrail = document.getElementById('routeTrail');
    const routeStart = document.getElementById('routeStart');
    const runnerPos = document.getElementById('runnerPosition');

    if (routeTrail) {
        routeTrail.setAttribute('points', routePreview?.polyline || '');
    }

    if (routeStart && routePreview?.start) {
        routeStart.hidden = false;
        routeStart.setAttribute('cx', routePreview.start.x);
        routeStart.setAttribute('cy', routePreview.start.y);
    } else if (routeStart) {
        routeStart.hidden = true;
    }

    if (runnerPos && routePreview?.current) {
        runnerPos.setAttribute('cx', routePreview.current.x);
        runnerPos.setAttribute('cy', routePreview.current.y);
    } else if (runnerPos) {
        runnerPos.setAttribute('cx', '150');
        runnerPos.setAttribute('cy', '75');
    }
}

function updatePaceZone(pace) {
    document.querySelectorAll('.pace-zone').forEach(zone => zone.classList.remove('active'));

    if (!Number.isFinite(pace)) return;

    if (pace < 5) {
        document.getElementById('zoneFast').classList.add('active');
    } else if (pace < 6.5) {
        document.getElementById('zoneMixed').classList.add('active');
    } else {
        document.getElementById('zoneAerobic').classList.add('active');
    }
}
