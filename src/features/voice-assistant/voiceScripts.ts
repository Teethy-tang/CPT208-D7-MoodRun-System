import type { MoodId } from '../../types/moodrun';

interface RunStartVoiceOptions {
  mood: MoodId;
  planName: string;
  targetDistanceKm: number;
}

interface MetricsVoiceOptions {
  averagePace: number | null;
  distanceKm: number;
  elapsedSec: number;
  mood: MoodId;
  type: 'distance' | 'time';
}

type PaceFeedbackStatus = 'onTarget' | 'tooFast' | 'tooSlow';

interface PaceFeedbackVoiceOptions {
  currentPace: number | null;
  mood: MoodId;
  paceRange: number[];
  status: PaceFeedbackStatus;
}

interface VoiceStyle {
  pitch: number;
  rate: number;
  volume: number;
}

const moodVoiceStyles: Record<MoodId, VoiceStyle> = {
  stressed: { pitch: 0.98, rate: 0.88, volume: 0.92 },
  anxious: { pitch: 0.94, rate: 0.82, volume: 0.9 },
  tired: { pitch: 0.92, rate: 0.84, volume: 0.88 },
  angry: { pitch: 0.96, rate: 0.9, volume: 0.92 },
  sad: { pitch: 0.9, rate: 0.8, volume: 0.86 },
  bored: { pitch: 1.02, rate: 0.94, volume: 0.92 },
  excited: { pitch: 1.02, rate: 0.95, volume: 0.92 },
  happy: { pitch: 1.04, rate: 0.94, volume: 0.92 },
  neutral: { pitch: 1, rate: 0.9, volume: 0.9 },
};

const startVoiceLines: Record<MoodId, string> = {
  stressed: 'Pressure can move now. Keep your shoulders loose and let the run take some of the load.',
  anxious: 'We are starting gently. Find the next step, then the next breath.',
  tired: 'Easy start. You do not need a huge burst, just a steady first minute.',
  angry: 'Bring the heat, but keep control. Strong legs, clear head.',
  sad: 'Soft start. Every step counts, even the quiet ones.',
  bored: 'Pattern break begins now. Let the route give your mind something new.',
  excited: 'Good spark. Keep it smooth so the energy lasts.',
  happy: 'Carry the good feeling forward. Let the run give it a rhythm.',
  neutral: 'Balanced run starting. Settle in and let the pace arrive.',
};

const checkpointVoiceLines: Record<MoodId, string[]> = {
  stressed: [
    'The pressure is moving out. Keep the jaw soft.',
    'Shake the shoulders loose. You are making room inside.',
    'You are lighter than when you started. Stay with this rhythm.',
  ],
  anxious: [
    'Match breath to footsteps. You only need this step.',
    'One step, one smaller worry. The rhythm is holding.',
    'You have stayed steady. Let the road keep carrying the noise down.',
  ],
  tired: [
    'Wake up slowly. Small energy is still energy.',
    'Energy is coming online. Keep it comfortable.',
    'Small run, real win. Let the finish come to you.',
  ],
  angry: [
    'Turn heat into speed, but keep the shoulders soft.',
    'Control the fire. Power works best with direction.',
    'Clear head, strong legs. You are spending the heat well.',
  ],
  sad: [
    'Gentle steps still count. You are here with yourself.',
    'Let the road carry a little. No need to force brightness.',
    'You stayed with it. That is care in motion.',
  ],
  bored: [
    'New route energy unlocked. Notice one detail around you.',
    'Change the pattern. Let the next minute feel different.',
    'Adventure mode is working. Finish the loop with curiosity.',
  ],
  excited: [
    'Focus the spark. Fast can still be smooth.',
    'Keep the energy pointed forward. Smooth is strong.',
    'Energy with direction. Hold this clean line.',
  ],
  happy: [
    'Joy has a rhythm. Keep it easy and bright.',
    'Keep the good moment moving. Save this feeling.',
    'You are carrying the mood well. Bring it home.',
  ],
  neutral: [
    'Steady start. Balance is building.',
    'You have found the middle rhythm. Stay there.',
    'Finish the loop. Ordinary minutes can still reset the day.',
  ],
};

const completionVoiceLines: Record<MoodId, string> = {
  stressed: 'Target complete. You turned pressure into motion.',
  anxious: 'Target complete. You gave the worry a rhythm to follow.',
  tired: 'Target complete. A gentle start became a real finish.',
  angry: 'Target complete. You spent the heat without letting it steer.',
  sad: 'Target complete. You moved gently and stayed with yourself.',
  bored: 'Target complete. You changed the pattern and made the route new.',
  excited: 'Target complete. You turned extra energy into direction.',
  happy: 'Target complete. You carried the good mood forward.',
  neutral: 'Target complete. A steady run gave the day a shape.',
};

const paceFeedbackVoiceLines: Record<MoodId, Record<PaceFeedbackStatus, string>> = {
  stressed: {
    onTarget: 'Good. You are back in the planned rhythm. Let the pressure keep draining out.',
    tooFast: 'You are running a little hot. Ease the shoulders and let the pace come down.',
    tooSlow: 'You are below the target rhythm. If your body feels okay, add a small push for the next minute.',
  },
  anxious: {
    onTarget: 'That is the steady zone. Stay with breath, step, breath, step.',
    tooFast: 'A little fast. Slow the breath first, then let the legs follow.',
    tooSlow: 'A little slow. No panic. Lift the rhythm by one small notch.',
  },
  tired: {
    onTarget: 'Nice. This is enough effort. Keep it comfortable.',
    tooFast: 'You can save some energy. Let the pace soften now.',
    tooSlow: 'You are moving gently. If you have it, add a tiny bit of lift.',
  },
  angry: {
    onTarget: 'Strong and controlled. Keep the power pointed forward.',
    tooFast: 'Strong pace. Keep the power, soften the shoulders.',
    tooSlow: 'Bring a little more drive, but keep it clean and controlled.',
  },
  sad: {
    onTarget: 'This pace is kind to you. Stay with the quiet rhythm.',
    tooFast: 'No need to chase. Let the run stay soft enough to hold you.',
    tooSlow: 'Still moving. If it feels okay, gently lengthen the next few steps.',
  },
  bored: {
    onTarget: 'Good rhythm. Side quest: notice one new color before the next cue.',
    tooFast: 'Fast mode unlocked, but bring it back a little. Save some spark for later.',
    tooSlow: 'The pattern is getting flat. Try ten lighter steps, then settle again.',
  },
  excited: {
    onTarget: 'Nice control. The spark has a clean line now.',
    tooFast: 'Plenty of energy. Smooth it out so it lasts.',
    tooSlow: 'You have more spark available. Add a little focus to the next minute.',
  },
  happy: {
    onTarget: 'Lovely rhythm. Keep the good feeling moving.',
    tooFast: 'Joy does not need to sprint away. Ease back and enjoy the route.',
    tooSlow: 'A touch more rhythm could feel good here. Lift lightly.',
  },
  neutral: {
    onTarget: 'You are in the target zone. Keep this steady shape.',
    tooFast: 'A little quick. Ease back toward the target pace.',
    tooSlow: 'A little slow. Add a small push if it feels safe.',
  },
};

const metricMoodClosers: Record<MoodId, string[]> = {
  stressed: ['Drop the jaw. Let one more bit of pressure leave.', 'Keep the effort clean, not clenched.'],
  anxious: ['Come back to the next breath.', 'Small steps are enough right now.'],
  tired: ['Keep it easy. Finishing gently still counts.', 'Let energy arrive late if it wants to.'],
  angry: ['Strong, but not reckless.', 'Power with direction.'],
  sad: ['You are still here. That matters.', 'No need to force brightness.'],
  bored: ['Side quest: find a new shape on the route.', 'Change the pattern with ten lighter steps.'],
  excited: ['Keep the spark, choose the line.', 'Fast can still be smooth.'],
  happy: ['Save this feeling.', 'Let the route remember this mood.'],
  neutral: ['Stay balanced.', 'Let the steady rhythm do its quiet work.'],
};

export function getMoodVoiceStyle(mood: MoodId) {
  return moodVoiceStyles[mood];
}

export function getRunStartVoice({ mood, planName, targetDistanceKm }: RunStartVoiceOptions) {
  return `${startVoiceLines[mood]} ${formatPlanName(planName)} is set for ${formatDistanceSpeech(targetDistanceKm)}. Eyes up; I will handle the cues.`;
}

export function getCheckpointVoice(mood: MoodId, checkpointIndex: number, fallbackText: string) {
  return checkpointVoiceLines[mood][checkpointIndex] || sentenceCase(fallbackText);
}

export function getCompletionVoice(mood: MoodId) {
  return completionVoiceLines[mood];
}

export function getMetricsVoice({ averagePace, distanceKm, elapsedSec, mood, type }: MetricsVoiceOptions) {
  const paceText = formatPaceSpeech(averagePace);
  const timeText = formatElapsedSpeech(elapsedSec);
  const closer = pickMetricCloser(mood, type === 'distance' ? distanceKm : elapsedSec / 300);

  if (type === 'distance') {
    return `${formatDistanceSpeech(distanceKm)} done. Time ${timeText}.${paceText ? ` Average pace ${paceText}.` : ''} ${closer}`;
  }

  return `${timeText} into the run. Distance ${formatDistanceSpeech(distanceKm)}.${paceText ? ` Average pace ${paceText}.` : ''} ${closer}`;
}

export function getPaceFeedbackVoice({ currentPace, mood, paceRange, status }: PaceFeedbackVoiceOptions) {
  const targetText = formatPaceRangeSpeech(paceRange);
  const currentText = formatPaceSpeech(currentPace);
  const statusLine = paceFeedbackVoiceLines[mood][status];

  if (status === 'onTarget') {
    return currentText ? `${statusLine} Current pace ${currentText}.` : statusLine;
  }

  return currentText
    ? `${statusLine} Current pace ${currentText}; target is ${targetText}.`
    : `${statusLine} Target is ${targetText}.`;
}

export function getGpsStatusVoice(message: string, tone: string) {
  const lowerMessage = message.toLowerCase();

  if (tone === 'test') {
    return 'Test route is active. Simulated movement is feeding the tracker.';
  }

  if (lowerMessage.includes('tracking live') || lowerMessage.includes('location captured')) {
    return 'GPS is locked. Your run is being tracked.';
  }

  if (tone === 'warning') {
    if (lowerMessage.includes('permission')) return 'Location permission is blocked. Allow GPS access to track this run.';
    if (lowerMessage.includes('secure context')) return 'GPS needs HTTPS or localhost in this browser.';
    if (lowerMessage.includes('accuracy')) return 'GPS signal is weak. Keep moving in an open area if you can.';
    if (lowerMessage.includes('unavailable')) return 'GPS signal is unavailable right now. Move to a clearer area.';
    if (lowerMessage.includes('too long')) return 'GPS is taking a while. Hold steady for a moment.';
    if (lowerMessage.includes('jump')) return 'A GPS jump was ignored. Waiting for a stable signal.';
    return message;
  }

  return null;
}

export function getRouteGuidanceVoice(title: string, detail: string) {
  const normalizedTitle = title.toLowerCase();

  if (normalizedTitle.includes('start point')) {
    return `Route start is away from you. ${detail}`;
  }

  if (normalizedTitle.includes('off route')) {
    return `You are off the recommended route. ${detail}`;
  }

  return `${title}. ${detail}`;
}

function formatPlanName(value: string) {
  return value
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(' ');
}

function formatDistanceSpeech(distanceKm: number) {
  const rounded = distanceKm >= 10 ? distanceKm.toFixed(1) : distanceKm.toFixed(2);
  return `${trimTrailingZeros(rounded)} ${Number(rounded) === 1 ? 'kilometer' : 'kilometers'}`;
}

function formatElapsedSpeech(seconds: number) {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainder = totalSeconds % 60;

  if (hours > 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  }

  if (minutes > 0) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ${remainder} ${remainder === 1 ? 'second' : 'seconds'}`;
  }

  return `${remainder} ${remainder === 1 ? 'second' : 'seconds'}`;
}

function formatPaceSpeech(pace: number | null) {
  if (!Number.isFinite(pace) || (pace as number) <= 0) return '';

  const minutes = Math.floor(pace as number);
  const seconds = Math.round(((pace as number) % 1) * 60);
  const normalizedMinutes = seconds === 60 ? minutes + 1 : minutes;
  const normalizedSeconds = seconds === 60 ? 0 : seconds;

  return `${normalizedMinutes} minutes ${normalizedSeconds} seconds per kilometer`;
}

function formatPaceRangeSpeech(paceRange: number[]) {
  const [fastEdge, slowEdge] = paceRange;
  const fastText = formatPaceSpeech(fastEdge);
  const slowText = formatPaceSpeech(slowEdge);

  return `${fastText} to ${slowText}`;
}

function pickMetricCloser(mood: MoodId, seed: number) {
  const lines = metricMoodClosers[mood];
  return lines[Math.abs(Math.floor(seed)) % lines.length];
}

function sentenceCase(value: string) {
  const lower = value.toLowerCase().replace(/[.!]+$/g, '');
  return `${lower.charAt(0).toUpperCase()}${lower.slice(1)}.`;
}

function trimTrailingZeros(value: string) {
  return value.replace(/\.0+$/g, '').replace(/(\.\d*[1-9])0+$/g, '$1');
}
