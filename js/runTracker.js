import { celebrations } from './data.js';

export function startRunSimulation(state, { onCheckpoint }) {
    let lastCheckpoint = 0;

    resetRunDisplay();

    return setInterval(() => {
        state.runData.time++;
        state.runData.distance += 0.01 + Math.random() * 0.02;
        state.runData.pace = 4 + Math.random() * 3;
        state.runData.calories = Math.floor(state.runData.distance * 60);

        updateRunDisplay(state.runData);

        const distMeters = Math.floor(state.runData.distance * 1000);
        Object.keys(celebrations).forEach(checkpoint => {
            if (distMeters >= checkpoint && lastCheckpoint < checkpoint) {
                onCheckpoint(celebrations[checkpoint]);
            }
        });
        lastCheckpoint = distMeters;
    }, 1000);
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
        plan: state.selectedPlan
    };
}

export function formatPace(pace) {
    return `${Math.floor(pace)}:${String(Math.floor((pace % 1) * 60)).padStart(2, '0')}`;
}

export function formatTime(seconds) {
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function resetRunDisplay() {
    document.getElementById('distanceDisplay').textContent = '0.00';
    document.getElementById('paceDisplay').textContent = '--:--';
    document.getElementById('timeDisplay').textContent = '00:00';
    document.getElementById('calDisplay').textContent = '0';
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('progressPercent').textContent = '0%';
    document.querySelectorAll('.pace-zone').forEach(zone => zone.classList.remove('active'));
}

function updateRunDisplay(runData) {
    const targetDist = 5;
    const progress = Math.min((runData.distance / targetDist) * 100, 100);

    document.getElementById('distanceDisplay').textContent = runData.distance.toFixed(2);
    document.getElementById('paceDisplay').textContent = formatPace(runData.pace);
    document.getElementById('timeDisplay').textContent = formatTime(runData.time);
    document.getElementById('calDisplay').textContent = runData.calories;
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('progressPercent').textContent = `${Math.floor(progress)}%`;

    updateRunnerPosition(progress);
    updatePaceZone(runData.pace);
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
