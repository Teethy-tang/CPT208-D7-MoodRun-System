import { calorieAnalogies, moodPlans, paceDescriptions, wisdomQuotes } from './data.js';
import { initCursorGlow, initGravityGrid, initNavGlow, selectSound, showCelebration, startBreathing, startPixelFireworks, stopBreathing, stopPixelFireworks } from './effects.js';
import { createRouter } from './router.js';
import { formatPace, formatTime, makeRunRecord, startRunSimulation } from './runTracker.js';
import { loadRunHistory, saveRunHistory } from './storage.js';

const router = createRouter({
    cursorGlow: document.getElementById('cursorGlow')
});

const state = {
    currentMood: null,
    currentThought: '',
    selectedPlan: null,
    customPlans: [],
    runData: { distance: 0, pace: 0, time: 0, calories: 0 },
    runHistory: loadRunHistory(),
    musicEnabled: true,
    runInterval: null
};

const app = {
    ...state,

    showPage(pageId) {
        router.showPage(pageId);

        if (pageId !== 'summaryPage') {
            stopPixelFireworks();
        }

        if (pageId !== 'meditationPage') {
            stopBreathing();
        }
    },

    goHome() {
        this.showPage('homePage');
        router.updateNav('home');
    },

    goToMood() {
        this.showPage('moodPage');
        this.currentMood = null;
        this.currentThought = '';

        document.getElementById('thoughtInput').value = '';
        document.querySelectorAll('.mood-item').forEach(item => item.classList.remove('selected'));
        document.getElementById('moodNextBtn').disabled = true;
    },

    goToPlan() {
        if (!this.currentMood) return;

        this.currentThought = document.getElementById('thoughtInput').value;
        this.showPage('planPage');
        this.updateRecommendedPlan();
        this.selectedPlan = null;

        document.querySelectorAll('.plan-item').forEach(item => item.classList.remove('selected'));
        document.querySelectorAll('.recommended-plan').forEach(item => item.classList.remove('selected'));
        document.getElementById('planNextBtn').disabled = true;
    },

    goToCustomPlan() {
        this.showPage('customPlanPage');
        document.getElementById('customPlanName').value = '';
        document.getElementById('customPlanDistance').value = '';
        document.getElementById('customPlanPace').value = '';
        document.getElementById('paceRangeDisplay').textContent = 'Select a pace type to see details';
    },

    updatePaceDisplay() {
        const pace = document.getElementById('customPlanPace').value;
        document.getElementById('paceRangeDisplay').textContent = paceDescriptions[pace] || 'Select a pace type to see details';
    },

    goToMeditation() {
        this.showPage('meditationPage');
        startBreathing();
    },

    goToProfile() {
        this.showPage('profilePage');
        router.updateNav('profile');
        this.updateProfile();
    },

    goToWisdom() {
        this.showPage('wisdomPage');
        document.getElementById('wisdomThought').textContent = this.currentThought || 'No thoughts recorded.';
        document.getElementById('wisdomText').textContent = 'Click to reveal...';
        document.getElementById('revealBtn').disabled = false;
    },

    selectMood(mood) {
        this.currentMood = mood;
        document.querySelectorAll('.mood-item').forEach(item => item.classList.remove('selected'));
        document.querySelector(`[data-mood="${mood}"]`)?.classList.add('selected');
        document.getElementById('moodNextBtn').disabled = false;
    },

    updateRecommendedPlan() {
        const plan = moodPlans[this.currentMood] || moodPlans.neutral;

        document.getElementById('recPlanName').textContent = plan.name;
        document.getElementById('recPlanDesc').textContent = plan.desc;
        document.querySelector('.recommended-plan .plan-stats').innerHTML = `
            <span>TIME ${plan.time}</span>
            <span>DIST ${plan.dist}</span>
            <span>INT ${plan.intensity}</span>
        `;
    },

    selectPlan(planId) {
        this.selectedPlan = planId;

        document.querySelectorAll('.plan-item').forEach(item => item.classList.remove('selected'));
        document.querySelectorAll('.recommended-plan').forEach(item => item.classList.remove('selected'));

        if (planId === 'recommended') {
            document.getElementById('recommendedPlan').classList.add('selected');
        } else {
            document.querySelector(`[data-plan="${planId}"]`)?.classList.add('selected');
        }

        document.getElementById('planNextBtn').disabled = false;
    },

    saveCustomPlan() {
        const name = document.getElementById('customPlanName').value;
        const distance = document.getElementById('customPlanDistance').value;
        const pace = document.getElementById('customPlanPace').value;

        if (!name || !distance || !pace) {
            alert('Please fill in all fields!');
            return;
        }

        this.customPlans.push({ name, distance, pace });
        alert(`Custom plan "${name}" saved!`);
        this.goToPlan();
    },

    startRun() {
        if (this.runInterval) {
            clearInterval(this.runInterval);
        }

        this.showPage('runningPage');
        this.runData = { distance: 0, pace: 0, time: 0, calories: 0 };
        this.musicEnabled = true;

        const musicToggle = document.getElementById('musicToggle');
        musicToggle.classList.add('active');
        musicToggle.querySelector('span:last-child').textContent = 'ON';

        this.runInterval = startRunSimulation(this, { onCheckpoint: showCelebration });
    },

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;

        const button = document.getElementById('musicToggle');
        button.classList.toggle('active', this.musicEnabled);
        button.querySelector('span:last-child').textContent = this.musicEnabled ? 'ON' : 'OFF';
    },

    stopRun() {
        if (this.runInterval) {
            clearInterval(this.runInterval);
            this.runInterval = null;
        }

        this.saveRunToHistory();
        this.showSummary();
    },

    saveRunToHistory() {
        const run = makeRunRecord(this);
        this.runHistory.unshift(run);
        saveRunHistory(this.runHistory);
    },

    showSummary() {
        this.showPage('summaryPage');

        document.getElementById('summaryDistance').textContent = `${this.runData.distance.toFixed(2)} KM`;
        document.getElementById('summaryPace').textContent = `${formatPace(this.runData.pace)} /KM`;
        document.getElementById('summaryTime').textContent = formatTime(this.runData.time);

        const paceEl = document.getElementById('summaryPace');
        paceEl.className = 'summary-stat-value';
        if (this.runData.pace < 5) paceEl.classList.add('fast');
        else if (this.runData.pace < 6.5) paceEl.classList.add('medium');
        else paceEl.classList.add('slow');

        const analogy = calorieAnalogies.find(item => this.runData.calories <= item.cal) || calorieAnalogies[calorieAnalogies.length - 1];
        document.getElementById('calorieAnalogy').textContent = analogy.text;
        startPixelFireworks();
    },

    revealWisdom() {
        const quote = wisdomQuotes[Math.floor(Math.random() * wisdomQuotes.length)];
        document.getElementById('wisdomText').textContent = `"${quote}"`;
        document.getElementById('revealBtn').disabled = true;
    },

    updateProfile() {
        const totalRuns = this.runHistory.length;
        const totalDist = this.runHistory.reduce((sum, run) => sum + run.distance, 0);
        const historyList = document.getElementById('historyList');

        document.getElementById('totalRuns').textContent = totalRuns;
        document.getElementById('totalDistance').textContent = totalDist.toFixed(1);
        historyList.innerHTML = '';

        this.runHistory.slice(0, 10).forEach(run => {
            const date = new Date(run.date);
            const item = document.createElement('div');
            const thought = run.thought || 'No thought recorded';

            item.className = 'history-item';
            item.innerHTML = `
                <div class="history-left">
                    <div class="history-date">${date.toLocaleDateString()}</div>
                    <div class="history-mood">${thought.substring(0, 25)}${thought.length > 25 ? '...' : ''}</div>
                </div>
                <div class="history-right">
                    <div class="history-distance">${run.distance.toFixed(2)} KM</div>
                    <div class="history-time">${formatTime(run.time)}</div>
                </div>
            `;
            historyList.appendChild(item);
        });
    },

    selectSound
};

initCursorGlow(document.getElementById('cursorGlow'));
initGravityGrid(document.getElementById('gravityGrid'));
initNavGlow(document.querySelector('.bottom-nav'));
router.updateNav('home');
window.app = app;

window.addEventListener('beforeunload', () => {
    if (app.runInterval) clearInterval(app.runInterval);
    stopBreathing();
    stopPixelFireworks();
});
