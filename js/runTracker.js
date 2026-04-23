import { moodCheckpoints, moodPlans, runPlanOptions } from './data.js';

export function startRunSimulation(state, { onCheckpoint, onComplete }) {
    const plan = getActivePlan(state);
    const checkpoints = moodCheckpoints[state.currentMood] || moodCheckpoints.neutral;
    let nextCheckpointIndex = 0;
    let completed = false;

    resetRunDisplay(plan);

    const timer = setInterval(() => {
        state.runData.time++;
        state.runData.targetDistance = plan.targetDistance;
        state.runData.planName = plan.name;
        state.runData.pace = randomBetween(plan.paceRange[0], plan.paceRange[1]);
        state.runData.distance = Math.min(
            plan.targetDistance,
            state.runData.distance + getDemoStep(plan)
        );
        state.runData.calories = Math.floor(state.runData.distance * 60);

        const progress = updateRunDisplay(state.runData, plan);

        const nextCheckpoint = checkpoints[nextCheckpointIndex];
        if (nextCheckpoint && progress >= nextCheckpoint.progress) {
            onCheckpoint(nextCheckpoint.text);
            nextCheckpointIndex++;
        }

        if (!completed && progress >= 100) {
            completed = true;
            clearInterval(timer);
            onCheckpoint('TARGET COMPLETE!');
            window.setTimeout(onComplete, 850);
        }
    }, 1000);

    return timer;
}

export function makeRunRecord(state) {
    return {
        date: new Date().toISOString(),
        mood: state.currentMood,
        thought: state.currentThought,
        distance: state.runData.distance,
        pace: state.runData.pace,
        time: state.runData.time,
        calories: state.runData.calories,
        plan: state.selectedPlan,
        planName: state.runData.planName,
        moodAfter: state.lastMoodShift?.after,
        moodInsight: state.lastMoodShift?.insight
    };
}

export function formatPace(pace) {
    return `${Math.floor(pace)}:${String(Math.floor((pace % 1) * 60)).padStart(2, '0')}`;
}

export function formatTime(seconds) {
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export function getActivePlan(state) {
    if (state.selectedPlan === 'recommended') {
        return moodPlans[state.currentMood] || moodPlans.neutral;
    }

    return runPlanOptions[state.selectedPlan] || moodPlans[state.currentMood] || moodPlans.neutral;
}

function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}

function getDemoStep(plan) {
    const baseStep = plan.targetDistance / plan.demoDuration;
    return baseStep * randomBetween(0.82, 1.18);
}

function resetRunDisplay(plan) {
    document.getElementById('distanceDisplay').textContent = '0.00';
    document.getElementById('paceDisplay').textContent = '--:--';
    document.getElementById('timeDisplay').textContent = '00:00';
    document.getElementById('calDisplay').textContent = '0';
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('progressPercent').textContent = '0%';
    document.getElementById('runTargetLabel').textContent = `TARGET ${plan.dist}`;
    document.querySelectorAll('.pace-zone').forEach(zone => zone.classList.remove('active'));

    const runActionBtn = document.getElementById('runActionBtn');
    if (runActionBtn) runActionBtn.textContent = 'STOP RUN';
}

function updateRunDisplay(runData, plan) {
    const progress = Math.min((runData.distance / plan.targetDistance) * 100, 100);

    document.getElementById('distanceDisplay').textContent = runData.distance.toFixed(2);
    document.getElementById('paceDisplay').textContent = formatPace(runData.pace);
    document.getElementById('timeDisplay').textContent = formatTime(runData.time);
    document.getElementById('calDisplay').textContent = runData.calories;
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('progressPercent').textContent = `${Math.floor(progress)}%`;

    updateRunnerPosition(progress);
    updatePaceZone(runData.pace);

    if (progress >= 100) {
        const runActionBtn = document.getElementById('runActionBtn');
        if (runActionBtn) runActionBtn.textContent = 'FINISHING...';
    }

    return progress;
}

function updateRunnerPosition(progress) {
    const runnerPos = document.getElementById('runnerPosition');
    if (!runnerPos) return;

    const pathProgress = Math.min(progress / 100, 1);
    const startX = 20;
    const startY = 120;
    const endX = 280;
    const endY = 40;
    const currentX = startX + (endX - startX) * pathProgress;
    const currentY = startY + (endY - startY) * pathProgress - Math.sin(pathProgress * Math.PI) * 40;

    runnerPos.setAttribute('cx', currentX);
    runnerPos.setAttribute('cy', currentY);
}

function updatePaceZone(pace) {
    document.querySelectorAll('.pace-zone').forEach(zone => zone.classList.remove('active'));

    if (pace < 5) {
        document.getElementById('zoneFast').classList.add('active');
    } else if (pace < 6.5) {
        document.getElementById('zoneMixed').classList.add('active');
    } else {
        document.getElementById('zoneAerobic').classList.add('active');
    }
}
