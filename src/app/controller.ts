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
import { createMeditationAudio } from '../features/meditation/ambientAudio';
import {
  formatPace,
  formatTime,
  getActivePlan,
  makeRunRecord,
  startRunTracking,
} from '../features/run-session/runTracker';
import { createRunningMusic } from '../features/run-session/runningMusic';
import { normalizeRunMapMode, RUN_MAP_MODE_CHANGE_EVENT, saveRunMapMode } from '../features/run-session/runMapSettings';
import { createRouteSetupMap, type RouteSetupMapHandle } from '../features/run-session/routeSetupMap';
import { createVoiceAssistant } from '../features/voice-assistant/voiceAssistant';
import {
  getCompletionVoice,
  getDistanceCommandVoice,
  getEmotionalCueVoice,
  getGpsStatusVoice,
  getMetricsVoice,
  getMoodVoiceStyle,
  getPaceCommandVoice,
  getRouteGuidanceVoice,
  getRunStartVoice,
  getRunStatusCommandVoice,
  getStopRunConfirmationVoice,
  getTimeCommandVoice,
} from '../features/voice-assistant/voiceScripts';
import { createVoiceCommandListener } from '../features/voice-assistant/voiceCommandListener';
import { parseVoiceRunCommand, type VoiceRunCommand } from '../features/voice-assistant/voiceCommands';
import { defaultPageByRoute, pageRouteMap } from './router';
import { useMoodRunStore } from './stores/moodRun';
import { loadRunHistory, saveRunHistory } from '../services/storage/runHistory';
import {
  initCursorGlow,
  initGravityGrid,
  initNavGlow,
  selectSound as renderSelectedSound,
  showCelebration,
  startBreathing,
  startPixelFireworks,
  stopBreathing,
  stopPixelFireworks,
} from '../services/ui/effects';
import type {
  AvatarConfig,
  MeditationSound,
  MoodId,
  MoodRunState,
  PageId,
  PlannedRoute,
  RouteDistanceMode,
  RouteGroupName,
  RoutePlanPoint,
  RunMapMode,
} from '../types/moodrun';

type MoodRunStore = ReturnType<typeof useMoodRunStore>;
type RoutePointKind = 'start' | 'end';
const ROUTE_DISTANCE_WARNING_RATIO = 0.2;

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
  goToRouteSetup: () => Promise<void>;
  returnToPlanFromRoute: () => Promise<void>;
  resetRouteMapPick: () => void;
  previewManualRoutePoint: (kind: RoutePointKind) => Promise<void>;
  selectRouteSuggestion: (kind: RoutePointKind, index: number) => Promise<void>;
  chooseRouteDistanceMode: (mode: RouteDistanceMode) => void;
  applyManualRoute: () => Promise<void>;
  generateRandomRoute: () => Promise<void>;
  saveCustomPlan: () => Promise<void>;
  startRun: () => Promise<void>;
  toggleMusic: () => void;
  toggleVoice: () => void;
  toggleVoiceControl: () => void;
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
  renderVoiceToggle: () => void;
  renderVoiceControlToggle: () => void;
  getRunMapMode: () => RunMapMode;
  selectRunMapMode: (mode: RunMapMode) => RunMapMode;
  selectSound: (sound: MeditationSound) => Promise<void>;
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
  let routeSetupMap: RouteSetupMapHandle | null = null;
  let routePointSuggestions: Record<RoutePointKind, RoutePlanPoint[]> = { start: [], end: [] };
  let routeManualPoints: Record<RoutePointKind, RoutePlanPoint | null> = { start: null, end: null };
  let stopRunConfirmationExpiresAt = 0;
  const meditationAudio = createMeditationAudio();
  const runningMusic = createRunningMusic();
  const voiceAssistant = createVoiceAssistant();
  const voiceCommandListener = createVoiceCommandListener({
    onStatus: handleVoiceControlStatus,
    onTranscript: handleVoiceTranscript,
  });

  async function init() {
    if (initialized) return;
    initialized = true;

    initCursorGlow(document.getElementById('cursorGlow'));
    initGravityGrid(document.getElementById('gravityGrid') as HTMLCanvasElement | null);
    initNavGlow(document.querySelector('.bottom-nav') as HTMLElement | null);
    renderCurrentAvatar();
    renderVoiceToggle();
    renderVoiceControlToggle();
    window.app = controller;

    await syncRoute();

    window.addEventListener('beforeunload', () => {
      if (state.runSession) state.runSession.stop();
      runningMusic.stop();
      voiceCommandListener.stop();
      voiceAssistant.stop();
      meditationAudio.stop({ fade: false });
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

    if (pageId !== 'runningPage') {
      runningMusic.stop();
    }

    if (pageId !== 'meditationPage') {
      stopBreathing();
      state.meditationAudioEnabled = false;
      meditationAudio.stop();
      renderMeditationSoundState();
    }
  }

  function activateMountedPage(pageId: PageId) {
    document.querySelectorAll('.page').forEach((page) => page.classList.remove('active'));
    document.getElementById(pageId)?.classList.add('active');
    document.getElementById('cursorGlow')?.classList.toggle('home-visible', pageId === 'homePage');
    const shouldShowBottomNav = pageId === 'homePage' || pageId === 'profilePage';
    document.querySelector('.bottom-nav')?.classList.toggle('run-hidden', !shouldShowBottomNav);
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
    state.selectedRoute = null;

    document.querySelectorAll('.plan-item').forEach((item) => item.classList.remove('selected'));
    document.querySelectorAll('.recommended-plan').forEach((item) => item.classList.remove('selected'));

    const nextButton = document.getElementById('planNextBtn') as HTMLButtonElement | null;
    if (nextButton) nextButton.disabled = true;
  }

  async function returnToPlanFromRoute() {
    await showPage('planPage');
    updateRecommendedPlan();
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
    meditationAudio.preload(state.meditationSound);
    renderMeditationSoundState();
  }

  async function selectSound(sound: MeditationSound) {
    if (state.meditationAudioEnabled && state.meditationSound === sound && meditationAudio.isPlaying()) {
      state.meditationAudioEnabled = false;
      meditationAudio.stop();
      renderMeditationSoundState();
      return;
    }

    state.meditationSound = sound;
    const isPlaying = await meditationAudio.play(sound, state.meditationVolume);
    state.meditationAudioEnabled = isPlaying;
    renderMeditationSoundState();
  }

  function getRunMapMode() {
    return state.runMapMode;
  }

  function selectRunMapMode(mode: RunMapMode) {
    state.runMapMode = normalizeRunMapMode(mode);
    saveRunMapMode(state.runMapMode);
    window.dispatchEvent(new CustomEvent(RUN_MAP_MODE_CHANGE_EVENT, { detail: { mode: state.runMapMode } }));
    return state.runMapMode;
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
    state.selectedRoute = null;
    state.routeDistanceMode = null;

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

  async function goToRouteSetup() {
    if (!state.selectedPlan) {
      alert('Choose a run plan first.');
      return;
    }

    state.selectedRoute = null;
    state.routeDistanceMode = null;
    await showPage('routeSetupPage');
    resetRouteSetupDisplay();
    await initRouteSetupMap();
  }

  async function initRouteSetupMap() {
    const activePlan = getActivePlan(state);
    if (!routeSetupMap) {
      routeSetupMap = createRouteSetupMap({
        targetDistanceKm: activePlan.targetDistance,
        onRouteChange: handleRouteSelected,
        onStatus: updateRouteSetupStatus,
      });
    }

    routeSetupMap.setTargetDistance(activePlan.targetDistance);

    try {
      await routeSetupMap.init();
    } catch (error) {
      updateRouteSetupStatus('Map could not load. Manual input still needs the map service.');
      console.warn('Could not initialize route setup map.', error);
    }
  }

  function resetRouteSetupDisplay() {
    setText('routeSetupStatus', 'MAP PICK: choose a start point.');
    setText('routeStartSummary', 'START --');
    setText('routeEndSummary', 'FINISH --');
    setText('routePlanSummary', `PLAN ${getBasePlan().targetDistance.toFixed(2)} KM`);
    setText('routeDistanceSummary', 'ROUTE -- KM');
    setText('routeDeltaSummary', 'DIFF -- KM');
    setText('routeDistanceModeSummary', 'TARGET --');
    setRouteConflictVisible(false);

    const startInput = document.getElementById('routeStartInput') as HTMLInputElement | null;
    const endInput = document.getElementById('routeEndInput') as HTMLInputElement | null;
    const startButton = document.getElementById('routeStartBtn') as HTMLButtonElement | null;

    routePointSuggestions = { start: [], end: [] };
    routeManualPoints = { start: null, end: null };
    state.routeDistanceMode = null;
    if (startInput) startInput.value = '';
    if (endInput) endInput.value = '';
    if (startButton) startButton.disabled = true;
    renderRouteSuggestions('start', []);
    renderRouteSuggestions('end', []);
  }

  function resetRouteMapPick() {
    state.selectedRoute = null;
    state.routeDistanceMode = null;
    resetRouteSetupDisplay();
    routeSetupMap?.resetPickMode();
  }

  async function previewManualRoutePoint(kind: RoutePointKind) {
    const input = getRouteInput(kind);
    const value = input?.value.trim() || '';

    state.selectedRoute = null;
    state.routeDistanceMode = null;
    routeManualPoints[kind] = null;
    renderRouteSuggestions(kind, []);
    setRouteStartEnabled(false);

    if (!value) return;

    try {
      updateRouteSetupStatus(`Searching ${kind.toUpperCase()}...`);
      const suggestions = (await routeSetupMap?.searchManualPoint(value)) ?? [];
      routePointSuggestions[kind] = suggestions;

      if (suggestions.length === 1) {
        await selectRouteSuggestion(kind, 0);
        return;
      }

      renderRouteSuggestions(kind, suggestions);
      updateRouteSetupStatus(`${suggestions.length} ${kind.toUpperCase()} matches. Pick one.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : `Could not find that ${kind} point.`;
      updateRouteSetupStatus(message);
    }
  }

  async function selectRouteSuggestion(kind: RoutePointKind, index: number) {
    const point = routePointSuggestions[kind][index];
    if (!point) return;

    routeManualPoints[kind] = point;
    const input = getRouteInput(kind);
    if (input) input.value = point.label;
    renderRouteSuggestions(kind, []);

    await routeSetupMap?.selectManualPoint(kind, point);

    if (!state.selectedRoute) {
      setText(kind === 'start' ? 'routeStartSummary' : 'routeEndSummary', `${kind === 'start' ? 'START' : 'FINISH'} ${point.label}`);
      setText('routeDistanceSummary', 'ROUTE -- KM');
      setText('routeDeltaSummary', 'DIFF -- KM');
      setText('routeDistanceModeSummary', 'TARGET --');
      setRouteConflictVisible(false);
      setRouteStartEnabled(false);
    }
  }

  async function applyManualRoute() {
    const startInput = getRouteInput('start')?.value || '';
    const endInput = getRouteInput('end')?.value || '';

    try {
      updateRouteSetupStatus('Checking typed points...');

      if (!routeManualPoints.start) {
        await previewManualRoutePoint('start');
      }

      if (!routeManualPoints.end) {
        await previewManualRoutePoint('end');
      }

      if (!routeManualPoints.start || !routeManualPoints.end) {
        updateRouteSetupStatus('Choose one match for START and FINISH.');
        return;
      }

      await routeSetupMap?.applyManualRoute(startInput, endInput);
      scrollRouteSetupPageToTop();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not mark that route.';
      updateRouteSetupStatus(message);
    }
  }

  async function generateRandomRoute() {
    try {
      updateRouteSetupStatus('Generating a route near you...');
      await routeSetupMap?.generateRandomRoute();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not generate a route.';
      updateRouteSetupStatus(message);
    }
  }

  function handleRouteSelected(route: PlannedRoute) {
    state.selectedRoute = route;
    state.routeDistanceMode = null;
    setRouteInputValue('start', route.start.label);
    setRouteInputValue('end', route.end.label);
    setText('routeStartSummary', `START ${route.start.label}`);
    setText('routeEndSummary', `FINISH ${route.end.label}`);
    updateRouteDistanceDecision(route);
  }

  function chooseRouteDistanceMode(mode: RouteDistanceMode) {
    if (!state.selectedRoute) return;

    state.routeDistanceMode = mode;
    updateRouteDistanceDecision(state.selectedRoute);
    updateRouteSetupStatus(mode === 'route' ? 'ROUTE DISTANCE WILL BE THE TARGET.' : 'PLAN DISTANCE WILL STAY AS TARGET.');
  }

  function updateRouteSetupStatus(message: string) {
    setText('routeSetupStatus', message);
  }

  function scrollRouteSetupPageToTop() {
    const routePage = document.getElementById('routeSetupPage');
    if (!routePage) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    routePage.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });

    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('moodrun:map-resize'));
    }, prefersReducedMotion ? 0 : 360);
  }

  function setText(id: string, value: string) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function getRouteInput(kind: RoutePointKind) {
    return document.getElementById(kind === 'start' ? 'routeStartInput' : 'routeEndInput') as HTMLInputElement | null;
  }

  function setRouteInputValue(kind: RoutePointKind, value: string) {
    const input = getRouteInput(kind);
    if (input) input.value = value;
  }

  function setRouteStartEnabled(enabled: boolean) {
    const startButton = document.getElementById('routeStartBtn') as HTMLButtonElement | null;
    if (startButton) startButton.disabled = !enabled;
  }

  function setRouteConflictVisible(visible: boolean) {
    const panel = document.getElementById('routeDistanceChoice');
    if (panel) panel.hidden = !visible;
  }

  function getBasePlan() {
    return getActivePlan({
      currentMood: state.currentMood,
      selectedPlan: state.selectedPlan,
    });
  }

  function updateRouteDistanceDecision(route: PlannedRoute) {
    const plan = getBasePlan();
    const planDistance = plan.targetDistance;
    const routeDistance = route.distanceKm;
    const delta = routeDistance - planDistance;
    const ratio = planDistance > 0 ? Math.abs(delta) / planDistance : 0;
    const needsChoice = ratio > ROUTE_DISTANCE_WARNING_RATIO;

    setText('routePlanSummary', `PLAN ${planDistance.toFixed(2)} KM`);
    setText('routeDistanceSummary', `ROUTE ${routeDistance.toFixed(2)} KM`);
    setText('routeDeltaSummary', `DIFF ${delta >= 0 ? '+' : ''}${delta.toFixed(2)} KM`);
    setRouteConflictVisible(needsChoice);

    if (!needsChoice && !state.routeDistanceMode) {
      state.routeDistanceMode = 'plan';
    }

    renderRouteDistanceMode();
    setRouteStartEnabled(!!state.routeDistanceMode);

    updateRouteSetupStatus(
      needsChoice && !state.routeDistanceMode
        ? 'ROUTE DISTANCE DIFFERS FROM PLAN. Choose a target mode.'
        : 'ROUTE READY. Start when you are ready.',
    );
  }

  function renderRouteDistanceMode() {
    const mode = state.routeDistanceMode;
    const planButton = document.getElementById('routeKeepPlanBtn');
    const routeButton = document.getElementById('routeUseRouteBtn');

    planButton?.classList.toggle('selected', mode === 'plan');
    routeButton?.classList.toggle('selected', mode === 'route');

    if (mode === 'route' && state.selectedRoute) {
      setText('routeDistanceModeSummary', `TARGET ROUTE ${state.selectedRoute.distanceKm.toFixed(2)} KM`);
      return;
    }

    if (mode === 'plan') {
      setText('routeDistanceModeSummary', `TARGET PLAN ${getBasePlan().targetDistance.toFixed(2)} KM`);
      return;
    }

    setText('routeDistanceModeSummary', 'TARGET NEEDS CHOICE');
  }

  function renderRouteSuggestions(kind: RoutePointKind, suggestions: RoutePlanPoint[]) {
    const element = document.getElementById(kind === 'start' ? 'routeStartSuggestions' : 'routeEndSuggestions');
    if (!element) return;

    element.innerHTML = suggestions
      .map(
        (point, index) => `
          <button type="button" class="route-suggestion-btn" onclick="app.selectRouteSuggestion('${kind}', ${index})">
            <span>${escapeHtml(point.label)}</span>
            <small>${point.longitude.toFixed(5)}, ${point.latitude.toFixed(5)}</small>
          </button>
        `,
      )
      .join('');
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
    if (state.selectedRoute && !state.routeDistanceMode) {
      alert('Choose whether this run should follow the plan distance or route distance.');
      return;
    }

    if (state.runSession) {
      state.runSession.stop();
    }
    runningMusic.stop();

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
    const runMusicStart = runningMusic.playForPlan(activePlan, { restart: true });

    await showPage('runningPage');

    renderMusicToggle();
    renderVoiceToggle();
    renderVoiceControlToggle();
    void runMusicStart.then((isPlaying) => {
      state.musicEnabled = isPlaying;
      renderMusicToggle();

      if (!isPlaying) {
        console.warn('Running music could not start for this session.');
      }
    });

    stopRunConfirmationExpiresAt = 0;
    voiceAssistant.resetMemory();
    voiceAssistant.setEnabled(state.voiceEnabled);
    syncVoiceControlListening();
    speakRunVoice(
      getRunStartVoice({
        mood: state.currentMood || 'neutral',
        planName: activePlan.name,
        targetDistanceKm: activePlan.targetDistance,
      }),
      { force: true, interrupt: true, key: 'run-start', minIntervalMs: 0 },
    );

    state.runSession = startRunTracking(state, {
      onCheckpoint: (text) => {
        showCelebration(text);

        const mood = state.currentMood || 'neutral';
        const isComplete = text === 'TARGET COMPLETE!';
        if (!isComplete) return;

        const voiceText = getCompletionVoice(mood);

        speakRunVoice(voiceText, {
          force: isComplete,
          interrupt: isComplete,
          key: 'run-complete',
          minIntervalMs: 0,
        });
      },
      onComplete: () => {
        void finishRun();
      },
      onEmotionalCue: (cue) => {
        const mood = state.currentMood || 'neutral';

        speakRunVoice(getEmotionalCueVoice({ cue, mood }), {
          interrupt: cue.state === 'paused' || cue.state === 'rerouting',
          key: `emotion-${cue.state}`,
          minIntervalMs: 0,
        });
      },
      onMetricsMilestone: (milestone) => {
        const milestoneId =
          milestone.type === 'distance' ? Math.floor(milestone.distanceKm) : Math.floor(milestone.elapsedSec / 300);

        speakRunVoice(getMetricsVoice({ ...milestone, mood: state.currentMood || 'neutral' }), {
          key: `metrics-${milestone.type}-${milestoneId}`,
          minIntervalMs: 0,
        });
      },
      onRouteGuidance: ({ detail, title, tone }) => {
        speakRunVoice(getRouteGuidanceVoice(title, detail), {
          interrupt: tone === 'offroute',
          key: `route-${title}`,
          minIntervalMs: tone === 'offroute' ? 45000 : 60000,
        });
      },
      onStatus: ({ message, tone }) => {
        const voiceText = getGpsStatusVoice(message, tone);
        if (!voiceText) return;

        speakRunVoice(voiceText, {
          interrupt: tone === 'warning',
          key: `gps-${tone}-${voiceText}`,
          minIntervalMs: tone === 'ready' ? 900000 : 60000,
        });
      },
    });
  }

  function toggleMusic() {
    state.musicEnabled = !state.musicEnabled;

    if (!state.musicEnabled) {
      runningMusic.pause();
      renderMusicToggle();
      return;
    }

    const activePlan = getActivePlan(state);
    void runningMusic.playForPlan(activePlan).then((isPlaying) => {
      state.musicEnabled = isPlaying;
      renderMusicToggle();
    });
    renderMusicToggle();
  }

  function renderMusicToggle() {
    const button = document.getElementById('musicToggle');
    if (!button) return;

    const isPlaying = state.musicEnabled && runningMusic.isPlaying();
    button.classList.toggle('active', isPlaying);
    button.setAttribute('aria-label', isPlaying ? 'Pause running music' : 'Play running music');
    button.setAttribute('aria-pressed', String(isPlaying));
  }

  function toggleVoice() {
    if (!voiceAssistant.isSupported()) {
      state.voiceEnabled = false;
      renderVoiceToggle();
      return;
    }

    state.voiceEnabled = !state.voiceEnabled;
    voiceAssistant.setEnabled(state.voiceEnabled);
    renderVoiceToggle();

    if (state.voiceEnabled) {
      speakRunVoice('Voice coach is on.', {
        force: true,
        interrupt: true,
        key: 'voice-on',
        minIntervalMs: 0,
      });
    }
  }

  function toggleVoiceControl() {
    if (!voiceCommandListener.isSupported()) {
      state.voiceControlEnabled = false;
      renderVoiceControlToggle();
      speakRunVoice('Voice control is not available in this browser.', {
        force: true,
        interrupt: true,
        key: 'voice-control-unavailable',
        minIntervalMs: 0,
      });
      return;
    }

    state.voiceControlEnabled = !state.voiceControlEnabled;
    stopRunConfirmationExpiresAt = 0;
    syncVoiceControlListening();
    renderVoiceControlToggle();

    if (state.voiceControlEnabled) {
      speakRunVoice('Voice control is listening.', {
        force: true,
        interrupt: true,
        key: 'voice-control-on',
        minIntervalMs: 0,
      });
    }
  }

  function speakRunVoice(text: string, options: Parameters<typeof voiceAssistant.speak>[1] = {}) {
    const mood = state.currentMood || 'neutral';

    return voiceAssistant.speak(text, {
      ...getMoodVoiceStyle(mood),
      ...options,
    });
  }

  function syncVoiceControlListening() {
    if (!state.voiceControlEnabled || state.currentPageId !== 'runningPage' || state.runSaved) {
      voiceCommandListener.stop();
      renderVoiceControlToggle();
      return;
    }

    if (!voiceCommandListener.isSupported()) {
      state.voiceControlEnabled = false;
      renderVoiceControlToggle();
      return;
    }

    voiceCommandListener.start();
    renderVoiceControlToggle();
  }

  function handleVoiceTranscript(transcript: string) {
    const command = parseVoiceRunCommand(transcript);
    if (command === 'unknown') return;

    handleVoiceRunCommand(command);
  }

  function handleVoiceRunCommand(command: VoiceRunCommand) {
    if (state.currentPageId !== 'runningPage' || state.runSaved) return;

    const now = Date.now();
    const waitingForStopConfirmation = stopRunConfirmationExpiresAt > now;

    if (waitingForStopConfirmation && command === 'confirmStop') {
      stopRunConfirmationExpiresAt = 0;
      speakRunVoice('Stopping run.', {
        force: true,
        interrupt: true,
        key: 'voice-stop-confirmed',
        minIntervalMs: 0,
      });
      window.setTimeout(() => {
        void finishRun();
      }, 650);
      return;
    }

    if (waitingForStopConfirmation && command === 'cancelStop') {
      stopRunConfirmationExpiresAt = 0;
      speakRunVoice('Okay. Run continues.', {
        force: true,
        interrupt: true,
        key: 'voice-stop-cancelled',
        minIntervalMs: 0,
      });
      return;
    }

    if (command !== 'confirmStop' && command !== 'cancelStop') {
      stopRunConfirmationExpiresAt = 0;
    }

    if (command === 'status') {
      speakRunVoice(getRunStatusCommandVoice({ mood: state.currentMood || 'neutral', runData: state.runData }), {
        force: true,
        interrupt: true,
        key: 'voice-command-status',
        minIntervalMs: 0,
      });
      return;
    }

    if (command === 'distance') {
      speakRunVoice(getDistanceCommandVoice(state.runData), {
        force: true,
        interrupt: true,
        key: 'voice-command-distance',
        minIntervalMs: 0,
      });
      return;
    }

    if (command === 'pace') {
      speakRunVoice(getPaceCommandVoice(state.runData), {
        force: true,
        interrupt: true,
        key: 'voice-command-pace',
        minIntervalMs: 0,
      });
      return;
    }

    if (command === 'time') {
      speakRunVoice(getTimeCommandVoice(state.runData), {
        force: true,
        interrupt: true,
        key: 'voice-command-time',
        minIntervalMs: 0,
      });
      return;
    }

    if (command === 'muteVoice') {
      state.voiceEnabled = false;
      voiceAssistant.setEnabled(false);
      renderVoiceToggle();
      return;
    }

    if (command === 'resumeVoice') {
      state.voiceEnabled = true;
      voiceAssistant.setEnabled(true);
      renderVoiceToggle();
      speakRunVoice('Voice coach is back on.', {
        force: true,
        interrupt: true,
        key: 'voice-command-resume',
        minIntervalMs: 0,
      });
      return;
    }

    if (command === 'stopRun') {
      stopRunConfirmationExpiresAt = Date.now() + 10000;
      speakRunVoice(getStopRunConfirmationVoice(), {
        force: true,
        interrupt: true,
        key: 'voice-command-stop-prompt',
        minIntervalMs: 0,
      });
    }
  }

  function handleVoiceControlStatus(status: { message: string; tone: string }) {
    renderVoiceControlToggle();

    if (status.tone === 'error' || status.tone === 'warning') {
      speakRunVoice(status.message, {
        force: true,
        interrupt: status.tone === 'error',
        key: `voice-control-${status.tone}`,
        minIntervalMs: 60000,
      });
    }
  }

  async function stopRun() {
    voiceAssistant.stop();
    await finishRun();
  }

  async function finishRun() {
    if (state.runSaved) return;

    if (state.runSession) {
      state.runSession.stop();
      state.runSession = null;
    }

    runningMusic.stop();
    voiceCommandListener.stop();
    state.voiceControlEnabled = false;
    stopRunConfirmationExpiresAt = 0;
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
      profileAvatar.innerHTML = createAvatarSvg(state.avatar, 'pixel-avatar profile-pixel-avatar', true);
      profileAvatar.closest<HTMLElement>('.profile-avatar')?.style.setProperty('--avatar-background', state.avatar.backgroundColor);
    }
  }

  function renderAvatarStudio() {
    const preview = document.getElementById('avatarPreview');
    const controls = document.getElementById('avatarControls');

    if (preview) {
      preview.innerHTML = createAvatarSvg(state.avatarDraft, 'pixel-avatar avatar-preview', true);
      preview.closest<HTMLElement>('.avatar-preview-frame')?.style.setProperty('--avatar-background', state.avatarDraft.backgroundColor);
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

  function renderVoiceToggle() {
    const voiceToggle = document.getElementById('voiceToggle');
    if (!voiceToggle) return;

    const supported = voiceAssistant.isSupported();
    const active = supported && state.voiceEnabled;
    voiceToggle.classList.toggle('active', active);
    voiceToggle.classList.toggle('unsupported', !supported);
    voiceToggle.setAttribute(
      'aria-label',
      supported ? (active ? 'Turn voice coach off' : 'Turn voice coach on') : 'Voice coach is unavailable in this browser',
    );

    const label = voiceToggle.querySelector('span:last-child');
    if (label) label.textContent = supported ? (active ? 'ON' : 'OFF') : 'N/A';
  }

  function renderVoiceControlToggle() {
    const micToggle = document.getElementById('voiceControlToggle');
    if (!micToggle) return;

    const supported = voiceCommandListener.isSupported();
    const active = supported && state.voiceControlEnabled;
    micToggle.classList.toggle('active', active);
    micToggle.classList.toggle('unsupported', !supported);
    micToggle.classList.toggle('listening', active && voiceCommandListener.isListening());
    micToggle.setAttribute(
      'aria-label',
      supported ? (active ? 'Turn voice control off' : 'Turn voice control on') : 'Voice control is unavailable in this browser',
    );

    const label = micToggle.querySelector('span:last-child');
    if (label) label.textContent = supported ? (active ? 'ON' : 'OFF') : 'N/A';
  }

  function renderMeditationSoundState() {
    const activeSound = state.meditationAudioEnabled && meditationAudio.isPlaying() ? state.meditationSound : null;
    renderSelectedSound(activeSound);
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
    goToRouteSetup,
    returnToPlanFromRoute,
    resetRouteMapPick,
    previewManualRoutePoint,
    selectRouteSuggestion,
    chooseRouteDistanceMode,
    applyManualRoute,
    generateRandomRoute,
    saveCustomPlan,
    startRun,
    toggleMusic,
    toggleVoice,
    toggleVoiceControl,
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
    renderVoiceToggle,
    renderVoiceControlToggle,
    getRunMapMode,
    selectRunMapMode,
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
