export type MoodId =
  | 'stressed'
  | 'anxious'
  | 'tired'
  | 'angry'
  | 'sad'
  | 'bored'
  | 'excited'
  | 'happy'
  | 'neutral';

export type PlanId = 'recommended' | 'sprint' | 'aerobic' | 'scenic';

export type PageId =
  | 'homePage'
  | 'meditationPage'
  | 'moodPage'
  | 'moodAiPage'
  | 'planPage'
  | 'routeSetupPage'
  | 'customPlanPage'
  | 'runningPage'
  | 'summaryPage'
  | 'wisdomPage'
  | 'profilePage'
  | 'avatarPage';

export type MeditationSound = 'rain' | 'ocean' | 'forest' | 'wind';

export type RouteGroupName = 'home' | 'mood' | 'run' | 'summary' | 'profile';

export interface MoodOutcome {
  after: string;
  insight: string;
}

export interface CustomPlan {
  name: string;
  distance: string;
  pace: string;
}

export type RoutePlanSource = 'map' | 'manual' | 'random';
export type RouteDistanceMode = 'plan' | 'route';

export interface RoutePlanPoint {
  latitude: number;
  longitude: number;
  label: string;
}

export interface PlannedRoute {
  start: RoutePlanPoint;
  end: RoutePlanPoint;
  distanceKm: number;
  source: RoutePlanSource;
}

export interface RunData {
  distance: number;
  pace: number;
  currentPace: number | null;
  averagePace: number | null;
  time: number;
  calories: number;
  remainingDistance: number;
  accuracy: number | null;
  hasLocationFix: boolean;
  routePointCount: number;
  gpsQuality: string;
  targetDistance: number;
  planName: string | null;
  lastTrackingError: string | null;
}

export interface RunRecord {
  date: string;
  mood: MoodId | null;
  thought: string;
  distance: number;
  pace: number;
  currentPace: number | null;
  time: number;
  calories: number;
  plan: string | null;
  planName: string | null;
  voiceControlEnabled?: boolean;
  voiceEnabled?: boolean;
  moodAfter?: string;
  moodInsight?: string;
}

export interface PositionLike {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  timestamp: number;
}

export interface RoutePoint {
  x: number;
  y: number;
}

export interface RoutePreview {
  polyline: string;
  start: RoutePoint | null;
  current: RoutePoint | null;
}

export interface RunSnapshot {
  elapsedSec: number;
  distanceKm: number;
  averagePace: number | null;
  currentPace: number | null;
  calories: number;
  remainingDistanceKm: number;
  progressPercent: number;
  currentAccuracy: number | null;
  hasLocationFix: boolean;
  gpsQuality: string;
  routePointCount: number;
  routePreview: RoutePreview;
}

export interface TrackingResult {
  accepted: boolean;
  reason: 'invalid' | 'accuracy' | 'seed' | 'jitter' | 'speed' | 'accepted';
  snapshot: RunSnapshot;
}

export interface AvatarConfig {
  body: string;
  backgroundColor: string;
  bodyColor: string;
  shadowColor: string;
  eyes: string;
  antenna: string;
  arms: string;
  feet: string;
  accessory: string;
}

export interface RunSessionHandle {
  stop: () => void;
}

export interface MoodRunState {
  currentPageId: PageId;
  currentMood: MoodId | null;
  currentThought: string;
  aiSuggestedMood: MoodId | null;
  selectedPlan: string | null;
  selectedRoute: PlannedRoute | null;
  routeDistanceMode: RouteDistanceMode | null;
  customPlans: CustomPlan[];
  runData: RunData;
  runHistory: RunRecord[];
  lastMoodShift: MoodOutcome | null;
  avatar: AvatarConfig;
  avatarDraft: AvatarConfig;
  voiceControlEnabled: boolean;
  musicEnabled: boolean;
  meditationSound: MeditationSound;
  meditationAudioEnabled: boolean;
  meditationVolume: number;
  voiceEnabled: boolean;
  runSession: RunSessionHandle | null;
  runSaved: boolean;
}
