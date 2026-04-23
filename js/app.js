import { calorieAnalogies, moodOutcomes, moodPlans, moodProfiles, paceDescriptions, wisdomQuotes } from './data.js';
import { avatarOptions, createAvatarSvg, getAvatarLabel, loadAvatar, randomAvatar, saveAvatar } from './avatar.js';
import { initCursorGlow, initGravityGrid, initNavGlow, selectSound, showCelebration, startBreathing, startPixelFireworks, stopBreathing, stopPixelFireworks } from './effects.js';
import { createRouter } from './router.js';
import { formatPace, formatTime, getActivePlan, makeRunRecord, startRunSimulation } from './runTracker.js';
import { loadRunHistory, saveRunHistory } from './storage.js';

const router = createRouter({
    cursorGlow: document.getElementById('cursorGlow')
});

const savedAvatar = loadAvatar();

const state = {
    currentMood: null,
    currentThought: '',
    aiSuggestedMood: null,
    selectedPlan: null,
    customPlans: [],
    runData: { distance: 0, pace: 0, time: 0, calories: 0 },
    runHistory: loadRunHistory(),
    lastMoodShift: null,
    avatar: savedAvatar,
    avatarDraft: { ...savedAvatar },
    musicEnabled: true,
    runInterval: null,
    runSaved: false
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
        this.aiSuggestedMood = null;
        resetMoodProfile();

        document.getElementById('thoughtInput').value = '';
        document.querySelectorAll('.mood-item').forEach(item => item.classList.remove('selected'));
        document.getElementById('moodNextBtn').disabled = true;
    },

    goToMoodAssistant() {
        this.currentThought = document.getElementById('thoughtInput').value.trim();
        this.aiSuggestedMood = null;
        resetMoodAssistant(this.currentThought);
        this.showPage('moodAiPage');
        window.setTimeout(() => document.getElementById('aiMoodInput')?.focus(), 80);
    },

    returnFromMoodAssistant() {
        this.showPage('moodPage');
        document.getElementById('thoughtInput').value = this.currentThought || '';
    },

    sendMoodAssistantMessage(event) {
        event?.preventDefault();

        const input = document.getElementById('aiMoodInput');
        const message = input?.value.trim() || '';

        if (!message) {
            setAiMessage('Give me a few words about what is happening inside.');
            return;
        }

        this.currentThought = message;
        if (input) input.value = '';

        const mood = inferMoodFromThought(message);
        this.aiSuggestedMood = mood;
        setAiMoodSuggestion(mood);

        const useButton = document.getElementById('aiUseMoodBtn');
        if (useButton) useButton.hidden = false;
    },

    acceptMoodAssistantSuggestion() {
        if (!this.aiSuggestedMood) return;

        this.showPage('moodPage');
        document.getElementById('thoughtInput').value = this.currentThought || '';
        this.selectMood(this.aiSuggestedMood);
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

    goToAvatar() {
        this.avatarDraft = { ...this.avatar };
        this.showPage('avatarPage');
        this.renderAvatarStudio();
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
        applyMoodProfile(mood);
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
        const activePlan = getActivePlan(this);

        this.runData = {
            distance: 0,
            pace: 0,
            time: 0,
            calories: 0,
            targetDistance: activePlan.targetDistance,
            planName: activePlan.name
        };
        this.musicEnabled = true;
        this.runSaved = false;
        this.lastMoodShift = moodOutcomes[this.currentMood] || moodOutcomes.neutral;

        const musicToggle = document.getElementById('musicToggle');
        musicToggle.classList.add('active');
        musicToggle.querySelector('span:last-child').textContent = 'ON';

        this.runInterval = startRunSimulation(this, {
            onCheckpoint: showCelebration,
            onComplete: () => this.finishRun()
        });
    },

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;

        const button = document.getElementById('musicToggle');
        button.classList.toggle('active', this.musicEnabled);
        button.querySelector('span:last-child').textContent = this.musicEnabled ? 'ON' : 'OFF';
    },

    stopRun() {
        this.finishRun();
    },

    finishRun() {
        if (this.runSaved) return;

        if (this.runInterval) {
            clearInterval(this.runInterval);
            this.runInterval = null;
        }

        this.saveRunToHistory();
        this.runSaved = true;
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

        const beforeMood = (this.currentMood || 'neutral').toUpperCase();
        const moodShift = this.lastMoodShift || moodOutcomes[this.currentMood] || moodOutcomes.neutral;
        document.getElementById('summaryMoodBefore').textContent = beforeMood;
        document.getElementById('summaryMoodAfter').textContent = moodShift.after;
        document.getElementById('summaryMoodInsight').textContent = moodShift.insight;
        document.getElementById('summaryPlanName').textContent = this.runData.planName || 'MOOD RUN';

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
        const quotes = wisdomQuotes[this.currentMood] || wisdomQuotes.neutral;
        const quote = quotes[Math.floor(Math.random() * quotes.length)];
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
            const mood = run.mood || 'neutral';
            const moodAfter = run.moodAfter || moodOutcomes[mood]?.after || moodOutcomes.neutral.after;
            const moodInsight = run.moodInsight || moodOutcomes[mood]?.insight || moodOutcomes.neutral.insight;
            const planName = run.planName || 'MOOD RUN';

            item.className = 'history-item';
            item.innerHTML = `
                <div class="history-left">
                    <div class="history-date">${date.toLocaleDateString()}</div>
                    <div class="history-plan">${escapeHtml(planName)}</div>
                    <div class="history-mood">${escapeHtml(mood.toUpperCase())} -> ${escapeHtml(moodAfter)}</div>
                    <div class="history-thought">${escapeHtml(thought.substring(0, 42))}${thought.length > 42 ? '...' : ''}</div>
                    <div class="history-insight">${escapeHtml(moodInsight)}</div>
                </div>
                <div class="history-right">
                    <div class="history-distance">${run.distance.toFixed(2)} KM</div>
                    <div class="history-time">${formatTime(run.time)}</div>
                </div>
            `;
            historyList.appendChild(item);
        });
    },

    renderCurrentAvatar() {
        const avatarMarkup = createAvatarSvg(this.avatar);
        const homeAvatar = document.getElementById('homeAvatar');
        const profileAvatar = document.getElementById('profileAvatar');

        if (homeAvatar) homeAvatar.innerHTML = avatarMarkup;
        if (profileAvatar) profileAvatar.innerHTML = createAvatarSvg(this.avatar, 'pixel-avatar profile-pixel-avatar');
    },

    renderAvatarStudio() {
        const preview = document.getElementById('avatarPreview');
        const controls = document.getElementById('avatarControls');

        if (preview) {
            preview.innerHTML = createAvatarSvg(this.avatarDraft, 'pixel-avatar avatar-preview');
        }

        if (!controls) return;

        controls.innerHTML = Object.entries(avatarOptions).map(([key, values]) => `
            <div class="avatar-control-group">
                <div class="avatar-control-title">${key.replace(/([A-Z])/g, ' $1').toUpperCase()}</div>
                <div class="avatar-option-row ${key.includes('Color') ? 'color-options' : ''}">
                    ${values.map(value => `
                        <button
                            type="button"
                            class="avatar-option ${this.avatarDraft[key] === value ? 'active' : ''}"
                            style="${key.includes('Color') ? `--swatch: ${value};` : ''}"
                            onclick="app.selectAvatarOption('${key}', '${value}')"
                            aria-label="${getAvatarLabel(key, value)}"
                        >
                            ${key.includes('Color') ? '<span class="avatar-swatch"></span>' : getAvatarLabel(key, value)}
                        </button>
                    `).join('')}
                </div>
            </div>
        `).join('');
    },

    selectAvatarOption(key, value) {
        this.avatarDraft = { ...this.avatarDraft, [key]: value };
        this.renderAvatarStudio();
    },

    randomizeAvatar() {
        this.avatarDraft = randomAvatar();
        this.renderAvatarStudio();
    },

    saveAvatarChoice() {
        this.avatar = { ...this.avatarDraft };
        saveAvatar(this.avatar);
        this.renderCurrentAvatar();
        this.goHome();
    },

    selectSound
};

const moodMotionClasses = Object.values(moodProfiles).map(profile => `mood-motion-${profile.motion}`);

function applyMoodProfile(mood) {
    const profile = moodProfiles[mood] || moodProfiles.neutral;
    const moodPage = document.getElementById('moodPage');
    const response = document.getElementById('moodResponse');
    const responseTone = document.getElementById('moodResponseTone');
    const responseText = document.getElementById('moodResponseText');

    if (moodPage) {
        moodPage.dataset.activeMood = mood;
        moodPage.classList.remove(...moodMotionClasses);
        moodPage.classList.add(`mood-motion-${profile.motion}`);
        moodPage.style.setProperty('--mood-primary', profile.primary);
        moodPage.style.setProperty('--mood-accent', profile.accent);
        moodPage.style.setProperty('--mood-soft', profile.soft);
        moodPage.style.setProperty('--mood-shadow', profile.shadow);
    }

    if (response) {
        response.hidden = false;
        response.style.animation = 'none';
        void response.offsetWidth;
        response.style.animation = '';
    }

    if (responseTone) responseTone.textContent = profile.tone;
    if (responseText) responseText.textContent = profile.response;
}

function resetMoodProfile() {
    const moodPage = document.getElementById('moodPage');
    const response = document.getElementById('moodResponse');

    if (moodPage) {
        delete moodPage.dataset.activeMood;
        moodPage.classList.remove(...moodMotionClasses);
        moodPage.style.removeProperty('--mood-primary');
        moodPage.style.removeProperty('--mood-accent');
        moodPage.style.removeProperty('--mood-soft');
        moodPage.style.removeProperty('--mood-shadow');
    }

    if (response) response.hidden = true;
}

function resetMoodAssistant(prefill = '') {
    const chatLog = document.getElementById('aiChatLog');
    const input = document.getElementById('aiMoodInput');
    const useButton = document.getElementById('aiUseMoodBtn');

    if (chatLog) {
        chatLog.innerHTML = '';
        setAiMessage(prefill
            ? 'I can sit with that. Send it when you are ready, and I will name the closest mood.'
            : 'Tell me what you are carrying. I will help name the mood.'
        );
    }

    if (input) input.value = prefill;
    if (useButton) useButton.hidden = true;
}

function setAiMessage(text) {
    const chatLog = document.getElementById('aiChatLog');
    if (!chatLog) return;

    const message = document.createElement('div');
    message.className = 'ai-message assistant';
    message.textContent = text;
    chatLog.innerHTML = '';
    chatLog.appendChild(message);
}

function setAiMoodSuggestion(mood) {
    const chatLog = document.getElementById('aiChatLog');
    const profile = moodProfiles[mood] || moodProfiles.neutral;
    if (!chatLog) return;

    const message = document.createElement('div');
    const label = document.createElement('strong');
    const detail = document.createElement('span');

    message.className = 'ai-message assistant';
    label.textContent = `MOOD: ${mood.toUpperCase()}`;
    detail.textContent = ` ${profile.response}`;
    message.append(label, document.createElement('br'), detail);
    chatLog.innerHTML = '';
    chatLog.appendChild(message);
}

function inferMoodFromThought(value) {
    const text = value.toLowerCase();
    const signals = [
        {
            mood: 'angry',
            words: ['angry', 'mad', 'rage', 'furious', 'annoyed', 'hate', 'unfair', 'pissed', '生气', '愤怒', '烦死', '火大']
        },
        {
            mood: 'anxious',
            words: ['anxious', 'worry', 'worried', 'panic', 'nervous', 'afraid', 'scared', 'overthinking', 'deadline', '焦虑', '担心', '紧张', '害怕', '慌']
        },
        {
            mood: 'stressed',
            words: ['stress', 'stressed', 'pressure', 'overwhelmed', 'too much', 'busy', 'crushed', 'exam', 'workload', '压力', '压抑', '忙', '崩溃']
        },
        {
            mood: 'sad',
            words: ['sad', 'down', 'lonely', 'empty', 'cry', 'hurt', 'heavy', 'miss', 'depressed', '难过', '伤心', '孤独', '低落', '想哭']
        },
        {
            mood: 'tired',
            words: ['tired', 'sleepy', 'exhausted', 'drained', 'no energy', 'burned out', 'weak', '累', '困', '疲惫', '没力气', '没精神']
        },
        {
            mood: 'bored',
            words: ['bored', 'flat', 'nothing', 'same', 'dull', 'stuck', 'boring', '无聊', '麻木', '没意思', '卡住']
        },
        {
            mood: 'excited',
            words: ['excited', 'hyped', 'restless', 'ready', 'energy', 'can\'t wait', '激动', '兴奋', '期待', '坐不住']
        },
        {
            mood: 'happy',
            words: ['happy', 'good', 'great', 'joy', 'grateful', 'proud', 'smile', '开心', '快乐', '高兴', '满足']
        }
    ];

    const scores = signals.map(signal => ({
        mood: signal.mood,
        score: signal.words.reduce((sum, word) => sum + (text.includes(word) ? 1 : 0), 0)
    }));
    const best = scores.sort((a, b) => b.score - a.score)[0];

    if (best?.score > 0) return best.mood;
    if (text.length < 18) return 'neutral';
    if (/[?!]{2,}/.test(text)) return 'anxious';
    return 'neutral';
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

initCursorGlow(document.getElementById('cursorGlow'));
initGravityGrid(document.getElementById('gravityGrid'));
initNavGlow(document.querySelector('.bottom-nav'));
app.renderCurrentAvatar();
router.updateNav('home');
window.app = app;

window.addEventListener('beforeunload', () => {
    if (app.runInterval) clearInterval(app.runInterval);
    stopBreathing();
    stopPixelFireworks();
});
