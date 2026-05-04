import { defineStore } from 'pinia';
import { loadAvatar } from '../../features/profile/avatar';
import { loadRunMapMode } from '../../features/run-session/runMapSettings';
import { loadRunHistory } from '../../services/storage/runHistory';
import type { CustomPlan, MoodOutcome, MoodRunState, RunData } from '../../types/moodrun';

function createInitialRunData(): RunData {
  return {
    distance: 0,
    pace: 0,
    currentPace: null,
    averagePace: null,
    time: 0,
    calories: 0,
    remainingDistance: 0,
    accuracy: null,
    hasLocationFix: false,
    routePointCount: 0,
    gpsQuality: 'SEARCHING',
    targetDistance: 0,
    planName: null,
    lastTrackingError: null,
  };
}

export const useMoodRunStore = defineStore('moodRun', {
  state: (): MoodRunState => {
    const savedAvatar = loadAvatar();

    return {
      currentPageId: 'homePage',
      currentMood: null,
      currentThought: '',
      aiSuggestedMood: null,
      selectedPlan: null,
      selectedRoute: null,
      routeDistanceMode: null,
      customPlans: [] as CustomPlan[],
      runData: createInitialRunData(),
      runHistory: loadRunHistory(),
      lastMoodShift: null as MoodOutcome | null,
      avatar: savedAvatar,
      avatarDraft: { ...savedAvatar },
      voiceControlEnabled: false,
      musicEnabled: true,
      meditationSound: 'rain',
      meditationAudioEnabled: false,
      meditationVolume: 0.65,
      voiceEnabled: true,
      runMapMode: loadRunMapMode(),
      runSession: null,
      runSaved: false,
    };
  },
  actions: {
    resetRunData(targetDistance = 0, planName: string | null = null) {
      this.runData = {
        ...createInitialRunData(),
        remainingDistance: targetDistance,
        targetDistance,
        planName,
      };
    },
  },
});
