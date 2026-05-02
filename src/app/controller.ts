import { nextTick } from 'vue';
import type { Router } from 'vue-router';
import {
  calorieAnalogies,
  moodOutcomes,
  moodPlans,
  moodProfiles,
  paceDescriptions,
  wisdomQuotes,
} from '../features/mood-engine/data';
import {
  avatarOptions,
  createAvatarSvg,
  getAvatarLabel,
  randomAvatar,
  saveAvatar,
} from '../features/profile/avatar';
import {
  formatPace,
  formatTime,
  getActivePlan,
  makeRunRecord,
  startRunTracking,
} from '../features/run-session/runTracker';
import { defaultPageByRoute, pageRouteMap } from './router';
import { useMoodRunStore } from './stores/moodRun';
import { loadRunHistory, saveRunHistory } from '../services/storage/runHistory';
import {
  initCursorGlow,
  initGravityGrid,
  initNavGlow,
  selectSound,
  showCelebration,
  startBreathing,
  startPixelFireworks,
  stopBreathing,
  stopPixelFireworks,
} from '../services/ui/effects';
import type { AvatarConfig, MoodId, MoodRunState, PageId, RouteGroupName } from '../types/moodrun';

type MoodRunStore = ReturnType<typeof useMoodRunStore>;

export interface MoodRunController {
  init: () => Promise<void>;
  syncRoute: () => Promise<void>;
  showPage: (pageId: PageId) => Promise<void>;
  goHome: () => Promise<void>;
  goToMood: () => Promise<void>;
  goToMoodAssistant: () => Promise<void>;
  returnFromMoodAssistant: () => Promise<void>;
  sendMoodAssistantMessage: (event?: Event) => void;
  acceptMoodAssistantSuggestion: () => Promise<void>;
  goToPlan: () => Promise<void>;
  goToCustomPlan: () => Promise<void>;
  updatePaceDisplay: () => void;
  goToMeditation: () => Promise<void>;
  goToAvatar: () => Promise<void>;
  goToProfile: () => Promise<void>;
  goToWisdom: () => Promise<void>;
  selectMood: (mood: MoodId) => void;
  updateRecommendedPlan: () => void;
  selectPlan: (planId: string) => void;
  saveCustomPlan: () => Promise<void>;
  startRun: () => Promise<void>;
  toggleMusic: () => void;
  toggleRunTestMode: () => Promise<void>;
  stopRun: () => Promise<void>;
  finishRun: () => Promise<void>;
  showSummary: () => Promise<void>;
  revealWisdom: () => void;
  updateProfile: () => void;
  renderCurrentAvatar: () => void;
  renderAvatarStudio: () => void;
  selectAvatarOption: (key: keyof AvatarConfig, value: string) => void;
  randomizeAvatar: () => void;
  saveAvatarChoice: () => Promise<void>;
  renderRunModeToggle: () => void;
  selectSound: (sound: string) => void;
}

declare global {
  interface Window {
    app: MoodRunController;
  }
}

const moodMotionClasses = Object.values(moodProfiles).map((profile) => `mood-motion-${profile.motion}`);

let controllerSingleton: MoodRunController | null = null;

export function initMoodRunController(store: MoodRunStore, router: Router) {
  if (!controllerSingleton) {
    controllerSingleton = createMoodRunController(store, router);
  }

  return controllerSingleton;
}

export function getMoodRunController() {
  if (!controllerSingleton) {
    throw new Error('MoodRun controller has not been initialized yet.');
  }

  return controllerSingleton;
}

function createMoodRunController(store: MoodRunStore, router: Router): MoodRunController {
  const state = store as unknown as MoodRunState;
  let initialized = false;

  async function init() {
    if (initialized) return;
    initialized = true;

    initCursorGlow(document.getElementById('cursorGlow'));
    initGravityGrid(document.getElementById('gravityGrid') as HTMLCanvasElement | null);
    initNavGlow(document.querySelector('.bottom-nav') as HTMLElement | null);
    renderCurrentAvatar();
    renderRunModeToggle();
    window.app = controller;

    await syncRoute();

    window.addEventListener('beforeunload', () => {
      if (state.runSession) state.runSession.stop();
      stopBreathing();
      stopPixelFireworks();
    });
  }

  async function syncRoute() {
    const routeName = (router.currentRoute.value.name as RouteGroupName | undefined) || 'home';
    const targetPage = pageRouteMap[state.currentPageId] === routeName ? state.currentPageId : defaultPageByRoute[routeName];

    state.currentPageId = targetPage;
    await nextTick();
    activateMountedPage(targetPage);

    if (routeName === 'profile') {
      updateNav('profile');
      renderCurrentAvatar();
      if (targetPage === 'profilePage') {
        updateProfile();
      }
      if (targetPage === 'avatarPage') {
        renderAvatarStudio();
      }
      return;
    }

    if (routeName === 'home') {
      updateNav('home');
    }

    if (targetPage === 'homePage') {
      renderCurrentAvatar();
    }
  }

  async function showPage(pageId: PageId) {
    state.currentPageId = pageId;
    const targetRoute = pageRouteMap[pageId];

    if (router.currentRoute.value.name !== targetRoute) {
      await router.push({ name: targetRoute });
    }

    await nextTick();
    activateMountedPage(pageId);

    if (pageId !== 'summaryPage') {
      stopPixelFireworks();
    }

    if (pageId !== 'meditationPage') {
      stopBreathing();
    }
  }

  function activateMountedPage(pageId: PageId) {
    document.querySelectorAll('.page').forEach((page) => page.classList.remove('active'));
    document.getElementById(pageId)?.classList.add('active');
    document.getElementById('cursorGlow')?.classList.toggle('home-visible', pageId === 'homePage');
    document.querySelector('.bottom-nav')?.classList.toggle('run-hidden', pageId === 'runningPage');
  }

  function updateNav(active: 'home' | 'profile') {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach((item) => item.classList.remove('active', 'nav-bump'));

    const activate = (item: Element | undefined) => {
      if (!item || !(item instanceof HTMLElement)) return;
      window.clearTimeout((item as HTMLElement & { navBumpTimer?: number }).navBumpTimer);
      void item.offsetWidth;
      item.classList.add('active', 'nav-bump');
      (item as HTMLElement & { navBumpTimer?: number }).navBumpTimer = window.setTimeout(() => {
        item.classList.remove('nav-bump');
      }, 260);
    };

    if (active === 'home') {
      activate(navItems[0]);
    }

    if (active === 'profile') {
      activate(navItems[1]);
    }
  }

  async function goHome() {
    await showPage('homePage');
    updateNav('home');
  }

  async function goToMood() {
    await showPage('moodPage');
    state.currentMood = null;
    state.currentThought = '';
    state.aiSuggestedMood = null;
    resetMoodProfile();

    const thoughtInput = document.getElementById('thoughtInput') as HTMLTextAreaElement | null;
    if (thoughtInput) thoughtInput.value = '';
    document.querySelectorAll('.mood-item').forEach((item) => item.classList.remove('selected'));

    const nextButton = document.getElementById('moodNextBtn') as HTMLButtonElement | null;
    if (nextButton) nextButton.disabled = true;
  }

  async function goToMoodAssistant() {
    const thoughtInput = document.getElementById('thoughtInput') as HTMLTextAreaElement | null;
    state.currentThought = thoughtInput?.value.trim() || '';
    state.aiSuggestedMood = null;
    resetMoodAssistant(state.currentThought);
    await showPage('moodAiPage');
    window.setTimeout(() => (document.getElementById('aiMoodInput') as HTMLInputElement | null)?.focus(), 80);
  }

  async function returnFromMoodAssistant() {
    await showPage('moodPage');
    const thoughtInput = document.getElementById('thoughtInput') as HTMLTextAreaElement | null;
    if (thoughtInput) thoughtInput.value = state.currentThought || '';
  }

  function sendMoodAssistantMessage(event?: Event) {
    event?.preventDefault();

    const input = document.getElementById('aiMoodInput') as HTMLInputElement | null;
    const message = input?.value.trim() || '';

    if (!message) {
      setAiMessage('Give me a few words about what is happening inside.');
      return;
    }

    state.currentThought = message;
    if (input) input.value = '';

    const mood = inferMoodFromThought(message);
    state.aiSuggestedMood = mood;
    setAiMoodSuggestion(mood);

    const useButton = document.getElementById('aiUseMoodBtn') as HTMLButtonElement | null;
    if (useButton) useButton.hidden = false;
  }

  async function acceptMoodAssistantSuggestion() {
    if (!state.aiSuggestedMood) return;

    await showPage('moodPage');
    const thoughtInput = document.getElementById('thoughtInput') as HTMLTextAreaElement | null;
    if (thoughtInput) thoughtInput.value = state.currentThought || '';
    selectMood(state.aiSuggestedMood);
  }

  async function goToPlan() {
    if (!state.currentMood) return;

    const thoughtInput = document.getElementById('thoughtInput') as HTMLTextAreaElement | null;
    state.currentThought = thoughtInput?.value || '';
    await showPage('planPage');
    updateRecommendedPlan();
    state.selectedPlan = null;

    document.querySelectorAll('.plan-item').forEach((item) => item.classList.remove('selected'));
    document.querySelectorAll('.recommended-plan').forEach((item) => item.classList.remove('selected'));

    const nextButton = document.getElementById('planNextBtn') as HTMLButtonElement | null;
    if (nextButton) nextButton.disabled = true;
  }

  async function goToCustomPlan() {
    await showPage('customPlanPage');
    const nameInput = document.getElementById('customPlanName') as HTMLInputElement | null;
    const distanceInput = document.getElementById('customPlanDistance') as HTMLInputElement | null;
    const paceInput = document.getElementById('customPlanPace') as HTMLSelectElement | null;
    const paceRangeDisplay = document.getElementById('paceRangeDisplay');

    if (nameInput) nameInput.value = '';
    if (distanceInput) distanceInput.value = '';
    if (paceInput) paceInput.value = '';
    if (paceRangeDisplay) paceRangeDisplay.textContent = 'Select a pace type to see details';
  }

  function updatePaceDisplay() {
    const pace = (document.getElementById('customPlanPace') as HTMLSelectElement | null)?.value || '';
    const paceRangeDisplay = document.getElementById('paceRangeDisplay');
    if (paceRangeDisplay) {
      paceRangeDisplay.textContent = paceDescriptions[pace as keyof typeof paceDescriptions] || 'Select a pace type to see details';
    }
  }

  async function goToMeditation() {
    await showPage('meditationPage');
    startBreathing();
  }

  async function goToAvatar() {
    state.avatarDraft = { ...state.avatar };
    await showPage('avatarPage');
    renderAvatarStudio();
  }

  async function goToProfile() {
    await showPage('profilePage');
    updateNav('profile');
    renderCurrentAvatar();
    updateProfile();
  }

  async function goToWisdom() {
    await showPage('wisdomPage');
    const wisdomThought = document.getElementById('wisdomThought');
    const wisdomText = document.getElementById('wisdomText');
    const revealButton = document.getElementById('revealBtn') as HTMLButtonElement | null;

    if (wisdomThought) wisdomThought.textContent = state.currentThought || 'No thoughts recorded.';
    if (wisdomText) wisdomText.textContent = 'Click to reveal...';
    if (revealButton) revealButton.disabled = false;
  }

  function selectMood(mood: MoodId) {
    state.currentMood = mood;
    document.querySelectorAll('.mood-item').forEach((item) => item.classList.remove('selected'));
    document.querySelector(`[data-mood="${mood}"]`)?.classList.add('selected');
    applyMoodProfile(mood);

    const nextButton = document.getElementById('moodNextBtn') as HTMLButtonElement | null;
    if (nextButton) nextButton.disabled = false;
  }

  function updateRecommendedPlan() {
    const plan = moodPlans[state.currentMood || 'neutral'];
    const name = document.getElementById('recPlanName');
    const description = document.getElementById('recPlanDesc');
    const stats = document.querySelector('.recommended-plan .plan-stats');

    if (name) name.textContent = plan.name;
    if (description) description.textContent = plan.desc;
    if (stats) {
      stats.innerHTML = `
            <span>TIME ${plan.time}</span>
            <span>DIST ${plan.dist}</span>
            <span>INT ${plan.intensity}</span>
        `;
    }
  }

  function selectPlan(planId: string) {
    state.selectedPlan = planId;

    document.querySelectorAll('.plan-item').forEach((item) => item.classList.remove('selected'));
    document.querySelectorAll('.recommended-plan').forEach((item) => item.classList.remove('selected'));

    if (planId === 'recommended') {
      document.getElementById('recommendedPlan')?.classList.add('selected');
    } else {
      document.querySelector(`[data-plan="${planId}"]`)?.classList.add('selected');
    }

    const nextButton = document.getElementById('planNextBtn') as HTMLButtonElement | null;
    if (nextButton) nextButton.disabled = false;
  }

  async function saveCustomPlan() {
    const name = (document.getElementById('customPlanName') as HTMLInputElement | null)?.value || '';
    const distance = (document.getElementById('customPlanDistance') as HTMLInputElement | null)?.value || '';
    const pace = (document.getElementById('customPlanPace') as HTMLSelectElement | null)?.value || '';

    if (!name || !distance || !pace) {
      alert('Please fill in all fields!');
      return;
    }

    state.customPlans.push({ name, distance, pace });
    alert(`Custom plan "${name}" saved!`);
    await goToPlan();
  }

  async function startRun() {
    if (state.runSession) {
      state.runSession.stop();
    }

    await showPage('runningPage');
    const activePlan = getActivePlan(state);

    state.runData = {
      distance: 0,
      pace: 0,
      currentPace: null,
      averagePace: null,
      time: 0,
      calories: 0,
      remainingDistance: activePlan.targetDistance,
      accuracy: null,
      targetDistance: activePlan.targetDistance,
      planName: activePlan.name,
      hasLocationFix: false,
      routePointCount: 0,
      gpsQuality: 'SEARCHING',
      lastTrackingError: null,
    };
    state.musicEnabled = true;
    state.runSaved = false;
    state.lastMoodShift = moodOutcomes[state.currentMood || 'neutral'];

    const musicToggle = document.getElementById('musicToggle');
    if (musicToggle) {
      musicToggle.classList.add('active');
      const text = musicToggle.querySelector('span:last-child');
      if (text) text.textContent = 'ON';
    }
    renderRunModeToggle();

    state.runSession = startRunTracking(state, {
      onCheckpoint: showCelebration,
      onComplete: () => {
        void finishRun();
      },
    });
  }

  function toggleMusic() {
    state.musicEnabled = !state.musicEnabled;

    const button = document.getElementById('musicToggle');
    if (!button) return;

    button.classList.toggle('active', state.musicEnabled);
    const label = button.querySelector('span:last-child');
    if (label) label.textContent = state.musicEnabled ? 'ON' : 'OFF';
  }

  async function toggleRunTestMode() {
    state.runTestMode = !state.runTestMode;
    renderRunModeToggle();

    if (document.getElementById('runningPage')?.classList.contains('active') && !state.runSaved) {
      if (state.runSession) {
        state.runSession.stop();
        state.runSession = null;
      }

      await startRun();
    }
  }

  async function stopRun() {
    await finishRun();
  }

  async function finishRun() {
    if (state.runSaved) return;

    if (state.runSession) {
      state.runSession.stop();
      state.runSession = null;
    }

    saveRunToHistory();
    state.runSaved = true;
    await showSummary();
  }

  function saveRunToHistory() {
    if (!state.runData.hasLocationFix && state.runData.distance <= 0) {
      return;
    }

    const run = makeRunRecord(state);
    const nextHistory = [run, ...loadRunHistory()];
    state.runHistory = nextHistory;
    saveRunHistory(nextHistory);
  }

  async function showSummary() {
    await showPage('summaryPage');

    const summaryDistance = document.getElementById('summaryDistance');
    const summaryPace = document.getElementById('summaryPace');
    const summaryTime = document.getElementById('summaryTime');
    const summaryMoodBefore = document.getElementById('summaryMoodBefore');
    const summaryMoodAfter = document.getElementById('summaryMoodAfter');
    const summaryMoodInsight = document.getElementById('summaryMoodInsight');
    const summaryPlanName = document.getElementById('summaryPlanName');
    const calorieAnalogy = document.getElementById('calorieAnalogy');

    if (summaryDistance) summaryDistance.textContent = `${state.runData.distance.toFixed(2)} KM`;
    if (summaryPace) summaryPace.textContent = `${formatPace(state.runData.averagePace ?? state.runData.pace)} /KM`;
    if (summaryTime) summaryTime.textContent = formatTime(state.runData.time);

    const beforeMood = (state.currentMood || 'neutral').toUpperCase();
    const moodShift = state.lastMoodShift || moodOutcomes[state.currentMood || 'neutral'];
    if (summaryMoodBefore) summaryMoodBefore.textContent = beforeMood;
    if (summaryMoodAfter) summaryMoodAfter.textContent = moodShift.after;
    if (summaryMoodInsight) summaryMoodInsight.textContent = moodShift.insight;
    if (summaryPlanName) summaryPlanName.textContent = state.runData.planName || 'MOOD RUN';

    if (summaryPace) {
      summaryPace.className = 'summary-stat-value';
      const summaryPaceValue = state.runData.averagePace ?? state.runData.pace;
      if (Number.isFinite(summaryPaceValue)) {
        if ((summaryPaceValue as number) < 5) summaryPace.classList.add('fast');
        else if ((summaryPaceValue as number) < 6.5) summaryPace.classList.add('medium');
        else summaryPace.classList.add('slow');
      }
    }

    const analogy =
      calorieAnalogies.find((item) => state.runData.calories <= item.cal) ||
      calorieAnalogies[calorieAnalogies.length - 1];
    if (calorieAnalogy) calorieAnalogy.textContent = analogy.text;
    startPixelFireworks();
  }

  function revealWisdom() {
    const quotes = wisdomQuotes[state.currentMood || 'neutral'];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    const wisdomText = document.getElementById('wisdomText');
    const revealButton = document.getElementById('revealBtn') as HTMLButtonElement | null;

    if (wisdomText) wisdomText.textContent = `"${quote}"`;
    if (revealButton) revealButton.disabled = true;
  }

  function updateProfile() {
    state.runHistory = loadRunHistory();

    const totalRuns = state.runHistory.length;
    const totalDist = state.runHistory.reduce((sum, run) => sum + run.distance, 0);
    const historyList = document.getElementById('historyList');
    const totalRunsElement = document.getElementById('totalRuns');
    const totalDistanceElement = document.getElementById('totalDistance');

    if (totalRunsElement) totalRunsElement.textContent = String(totalRuns);
    if (totalDistanceElement) totalDistanceElement.textContent = totalDist.toFixed(1);
    if (!historyList) return;

    historyList.innerHTML = '';

    state.runHistory.slice(0, 10).forEach((run) => {
      const date = new Date(run.date);
      const item = document.createElement('div');
      const thought = run.thought || 'No thought recorded';
      const mood = run.mood || 'neutral';
      const moodAfter = run.moodAfter || moodOutcomes[mood].after;
      const moodInsight = run.moodInsight || moodOutcomes[mood].insight;
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
  }

  function renderCurrentAvatar() {
    const homeAvatar = document.getElementById('homeAvatar');
    const profileAvatar = document.getElementById('profileAvatar');

    if (homeAvatar) homeAvatar.innerHTML = createAvatarSvg(state.avatar);
    if (profileAvatar) {
      profileAvatar.innerHTML = createAvatarSvg(state.avatar, 'pixel-avatar profile-pixel-avatar');
    }
  }

  function renderAvatarStudio() {
    const preview = document.getElementById('avatarPreview');
    const controls = document.getElementById('avatarControls');

    if (preview) {
      preview.innerHTML = createAvatarSvg(state.avatarDraft, 'pixel-avatar avatar-preview');
    }

    if (!controls) return;

    controls.innerHTML = Object.entries(avatarOptions)
      .map(([key, values]) => {
        const avatarKey = key as keyof AvatarConfig;
        return `
            <div class="avatar-control-group">
                <div class="avatar-control-title">${key.replace(/([A-Z])/g, ' $1').toUpperCase()}</div>
                <div class="avatar-option-row ${key.includes('Color') ? 'color-options' : ''}">
                    ${values
                      .map(
                        (value) => `
                        <button
                            type="button"
                            class="avatar-option ${state.avatarDraft[avatarKey] === value ? 'active' : ''}"
                            style="${key.includes('Color') ? `--swatch: ${value};` : ''}"
                            onclick="app.selectAvatarOption('${key}', '${value}')"
                            aria-label="${getAvatarLabel(avatarKey, value)}"
                        >
                            ${key.includes('Color') ? '<span class="avatar-swatch"></span>' : getAvatarLabel(avatarKey, value)}
                        </button>
                    `,
                      )
                      .join('')}
                </div>
            </div>
        `;
      })
      .join('');
  }

  function selectAvatarOption(key: keyof AvatarConfig, value: string) {
    state.avatarDraft = { ...state.avatarDraft, [key]: value };
    renderAvatarStudio();
  }

  function randomizeAvatarChoice() {
    state.avatarDraft = randomAvatar();
    renderAvatarStudio();
  }

  async function saveAvatarChoice() {
    state.avatar = { ...state.avatarDraft };
    saveAvatar(state.avatar);
    renderCurrentAvatar();
    await goHome();
  }

  function renderRunModeToggle() {
    const modeToggle = document.getElementById('runModeToggle');
    if (!modeToggle) return;

    modeToggle.classList.toggle('active', state.runTestMode);
    modeToggle.textContent = state.runTestMode ? 'TEST' : 'LIVE';
    modeToggle.setAttribute(
      'aria-label',
      state.runTestMode ? 'Switch to live GPS tracking' : 'Switch to desktop test mode',
    );
  }

  const controller: MoodRunController = {
    init,
    syncRoute,
    showPage,
    goHome,
    goToMood,
    goToMoodAssistant,
    returnFromMoodAssistant,
    sendMoodAssistantMessage,
    acceptMoodAssistantSuggestion,
    goToPlan,
    goToCustomPlan,
    updatePaceDisplay,
    goToMeditation,
    goToAvatar,
    goToProfile,
    goToWisdom,
    selectMood,
    updateRecommendedPlan,
    selectPlan,
    saveCustomPlan,
    startRun,
    toggleMusic,
    toggleRunTestMode,
    stopRun,
    finishRun,
    showSummary,
    revealWisdom,
    updateProfile,
    renderCurrentAvatar,
    renderAvatarStudio,
    selectAvatarOption,
    randomizeAvatar: randomizeAvatarChoice,
    saveAvatarChoice,
    renderRunModeToggle,
    selectSound,
  };

  return controller;
}

function applyMoodProfile(mood: MoodId) {
  const profile = moodProfiles[mood];
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
    (response as HTMLElement).style.animation = 'none';
    void (response as HTMLElement).offsetWidth;
    (response as HTMLElement).style.animation = '';
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
  const input = document.getElementById('aiMoodInput') as HTMLInputElement | null;
  const useButton = document.getElementById('aiUseMoodBtn') as HTMLButtonElement | null;

  if (chatLog) {
    chatLog.innerHTML = '';
    setAiMessage(
      prefill
        ? 'I can sit with that. Send it when you are ready, and I will name the closest mood.'
        : 'Tell me what you are carrying. I will help name the mood.',
    );
  }

  if (input) input.value = prefill;
  if (useButton) useButton.hidden = true;
}

function setAiMessage(text: string) {
  const chatLog = document.getElementById('aiChatLog');
  if (!chatLog) return;

  const message = document.createElement('div');
  message.className = 'ai-message assistant';
  message.textContent = text;
  chatLog.innerHTML = '';
  chatLog.appendChild(message);
}

function setAiMoodSuggestion(mood: MoodId) {
  const chatLog = document.getElementById('aiChatLog');
  const profile = moodProfiles[mood];
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

function inferMoodFromThought(value: string): MoodId {
  const text = value.toLowerCase();
  const signals: Array<{ mood: MoodId; words: string[] }> = [
    {
      mood: 'angry',
      words: ['angry', 'mad', 'rage', 'furious', 'annoyed', 'hate', 'unfair', 'pissed'],
    },
    {
      mood: 'anxious',
      words: ['anxious', 'worry', 'worried', 'panic', 'nervous', 'afraid', 'scared', 'overthinking', 'deadline'],
    },
    {
      mood: 'stressed',
      words: ['stress', 'stressed', 'pressure', 'overwhelmed', 'too much', 'busy', 'crushed', 'exam', 'workload'],
    },
    {
      mood: 'sad',
      words: ['sad', 'down', 'lonely', 'empty', 'cry', 'hurt', 'heavy', 'miss', 'depressed'],
    },
    {
      mood: 'tired',
      words: ['tired', 'sleepy', 'exhausted', 'drained', 'no energy', 'burned out', 'weak'],
    },
    {
      mood: 'bored',
      words: ['bored', 'flat', 'nothing', 'same', 'dull', 'stuck', 'boring'],
    },
    {
      mood: 'excited',
      words: ['excited', 'hyped', 'restless', 'ready', 'energy', "can't wait"],
    },
    {
      mood: 'happy',
      words: ['happy', 'good', 'great', 'joy', 'grateful', 'proud', 'smile'],
    },
  ];

  const scores = signals.map((signal) => ({
    mood: signal.mood,
    score: signal.words.reduce((sum, word) => sum + (text.includes(word) ? 1 : 0), 0),
  }));
  const best = scores.sort((a, b) => b.score - a.score)[0];

  if (best?.score > 0) return best.mood;
  if (text.length < 18) return 'neutral';
  if (/[?!]{2,}/.test(text)) return 'anxious';
  return 'neutral';
}

function escapeHtml(value: string) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
