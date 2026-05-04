import type { MoodId, RunData } from '../../types/moodrun';
import type { EmotionalRunCue, EmotionalRunState } from '../run-session/emotionalStateEngine';

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

interface RunCommandVoiceOptions {
  mood: MoodId;
  runData: RunData;
}

interface EmotionalCueVoiceOptions {
  cue: EmotionalRunCue;
  mood: MoodId;
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

const emotionalCueVoiceLines: Record<MoodId, Record<EmotionalRunState, string[]>> = {
  stressed: {
    fading: [
      'The pace is dipping, and that is okay. Release the hands first, then choose one steady minute.',
      'If the pressure is heavy, make the next thirty seconds simple: breathe out, step forward.',
    ],
    paused: [
      'You have paused. Use this moment to unclench your jaw and come back gently.',
      'Stillness counts too. Let the shoulders drop before you move again.',
    ],
    recovered: [
      'You found the rhythm again. Let that be enough for now.',
      'Good reset. Keep the effort clean, not clenched.',
    ],
    rerouting: [
      'The route is messy, but the run is still yours. Slow the decision down and choose the safe line.',
      'You are off the route again. No rush. Reorient first, then keep moving.',
    ],
    rushing: [
      'You may be pushing the pressure through your legs. Ease back slightly and soften the breath.',
      'A little rush is showing up. Let the next few steps be less clenched.',
    ],
    settled: [
      'This rhythm is working. Say less, carry less, keep going.',
      'You have found a steadier lane. Stay here and let the pressure thin out.',
    ],
  },
  anxious: {
    fading: [
      'The pace is dropping a little. No alarm. Make the next step smaller, then the next one.',
      'If worry is pulling at you, come back to one breath and one step.',
    ],
    paused: [
      'You have paused. That is fine. Feel both feet, look around, and restart only when it feels safe.',
      'Still moment. Let the breath lead before the legs do.',
    ],
    recovered: [
      'You are back in rhythm. Let that prove the moment can settle.',
      'Good. The body found a steadier signal again.',
    ],
    rerouting: [
      'The route is uncertain, but you do not need to solve it fast. Choose the safest next turn.',
      'Off route again. Stay calm, slow the decision, and let the map help.',
    ],
    rushing: [
      'You may be rushing a little. Let the breath lead for the next thirty seconds.',
      'A faster rhythm showed up. Try softer steps and a longer exhale.',
    ],
    settled: [
      'This is the steady zone. You do not have to chase the whole run.',
      'The rhythm is holding. Stay with breath, step, breath, step.',
    ],
  },
  tired: {
    fading: [
      'Energy is dipping. That does not mean you failed. Shorten the stride and keep it kind.',
      'You are fading a little. Choose easy form over force.',
    ],
    paused: [
      'A pause is allowed. Take a few calm breaths and restart softly if you want to.',
      'Rest moment. Let energy arrive late if it wants to.',
    ],
    recovered: [
      'There it is. A little rhythm came back.',
      'Good return. Keep it light, not heroic.',
    ],
    rerouting: [
      'Route trouble costs energy. Keep the choice simple and safe.',
      'Off route again. No need to push through confusion; reset gently.',
    ],
    rushing: [
      'You may be spending energy too early. Let the pace soften.',
      'A quick burst showed up. Save some for later.',
    ],
    settled: [
      'This pace is enough. Keep the run easy and real.',
      'You have found a sustainable rhythm. Stay gentle.',
    ],
  },
  angry: {
    fading: [
      'The drive is dropping. Keep control, not punishment. Reset the form.',
      'If the heat is cooling, do not force it back. Choose clean strength.',
    ],
    paused: [
      'Pause detected. Let the heat settle before you move again.',
      'Stillness can be control too. Restart when the line is clear.',
    ],
    recovered: [
      'You pulled it back together. Strong and controlled.',
      'Good reset. The power has direction again.',
    ],
    rerouting: [
      'Route is breaking up. Do not fight it. Choose the safe path and keep control.',
      'Off route again. Slow the reaction; keep the power yours.',
    ],
    rushing: [
      'Strong pace. Keep the power, soften the shoulders.',
      'The heat is speeding you up. Hold the strength, drop the fight.',
    ],
    settled: [
      'This is controlled power. Stay here.',
      'Good. Strong legs, clear head.',
    ],
  },
  sad: {
    fading: [
      'The pace is softening. You are still moving, and that still counts.',
      'A slower patch is okay. Let the road carry a little.',
    ],
    paused: [
      'You have paused. Be gentle with this moment. You can restart softly.',
      'Stillness is not giving up. Stay with yourself for a breath.',
    ],
    recovered: [
      'You came back to the rhythm. Quietly strong.',
      'Good. The next step found you again.',
    ],
    rerouting: [
      'The route is uncertain. Keep it simple and safe; the run still counts.',
      'Off route again. No blame. Reorient gently.',
    ],
    rushing: [
      'No need to outrun the feeling. Let the pace soften enough to hold you.',
      'A rush appeared. You can slow down and still be brave.',
    ],
    settled: [
      'This quiet rhythm is holding you. Stay with it.',
      'Gentle and steady. This is care in motion.',
    ],
  },
  bored: {
    fading: [
      'The pattern is flattening. Try ten lighter steps, then notice one new detail.',
      'Energy dipped. Side quest: find a new color before the next corner.',
    ],
    paused: [
      'Pause moment. Look around and pick one tiny route detail before restarting.',
      'Still for a second. Let curiosity choose the next step.',
    ],
    recovered: [
      'Pattern changed. Nice. Keep the route a little curious.',
      'Good reset. The run has a new texture now.',
    ],
    rerouting: [
      'Off route again. Treat it like a route remix, but choose the safe option.',
      'The route changed on you. Keep it curious, not chaotic.',
    ],
    rushing: [
      'Fast mode unlocked. Bring it back just enough to make the game last.',
      'You sped up. Nice spark; now make it smooth.',
    ],
    settled: [
      'Good rhythm. Side quest: notice one shape you did not expect.',
      'This pace is working. Keep the route interesting with your eyes up.',
    ],
  },
  excited: {
    fading: [
      'The spark is dipping. Bring back focus, not panic.',
      'Energy is changing. Smooth the next minute and let it rebuild.',
    ],
    paused: [
      'Pause detected. Let the excitement settle into focus before restarting.',
      'Still moment. Keep the spark, choose the line.',
    ],
    recovered: [
      'Nice. The spark has a clean line again.',
      'Good reset. Fast can still be smooth.',
    ],
    rerouting: [
      'Route is off again. Do not let excitement choose too fast; pick the safe line.',
      'Reroute moment. Focus first, speed second.',
    ],
    rushing: [
      'Plenty of energy. Smooth it out so it lasts.',
      'You are surging. Keep the spark, but choose the line.',
    ],
    settled: [
      'This is focused energy. Stay smooth.',
      'Good rhythm. The excitement has direction now.',
    ],
  },
  happy: {
    fading: [
      'The rhythm is easing. Keep it light; the good feeling can move slowly too.',
      'A softer patch is fine. Smile at the next easy step.',
    ],
    paused: [
      'Pause moment. Keep the good feeling with you, then restart when it is safe.',
      'Stillness can hold the joy for a second.',
    ],
    recovered: [
      'Nice return. The good rhythm came back.',
      'Good reset. Keep the bright feeling moving.',
    ],
    rerouting: [
      'The route is wandering. Keep the mood, choose the safe path.',
      'Off route again. No problem; let it become part of the run.',
    ],
    rushing: [
      'Joy does not need to sprint away. Ease back and enjoy the route.',
      'A little rush showed up. Let the good feeling last.',
    ],
    settled: [
      'Lovely rhythm. Save this feeling.',
      'This pace suits the mood. Keep it bright and easy.',
    ],
  },
  neutral: {
    fading: [
      'The pace is dropping a little. Reset gently and keep the shape of the run.',
      'A slower patch is information, not failure. Adjust and continue.',
    ],
    paused: [
      'Pause detected. Take a moment, then restart when it is safe.',
      'Still moment. Use it to reset your form.',
    ],
    recovered: [
      'You are back in rhythm. Good adjustment.',
      'Nice reset. Keep it steady.',
    ],
    rerouting: [
      'Off route again. Reorient calmly and choose the safe path.',
      'Route changed. Keep the run steady while you reset.',
    ],
    rushing: [
      'You are speeding up a little. Ease back toward the plan.',
      'A small surge showed up. Smooth it out.',
    ],
    settled: [
      'You are settled now. Keep this steady rhythm.',
      'Good balance. Let the run stay simple.',
    ],
  },
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

export function getEmotionalCueVoice({ cue, mood }: EmotionalCueVoiceOptions) {
  const lines = emotionalCueVoiceLines[mood][cue.state];
  const index = Math.abs(Math.floor(cue.elapsedSec / 45)) % lines.length;
  return lines[index];
}

export function getRunStatusCommandVoice({ mood, runData }: RunCommandVoiceOptions) {
  const paceText = formatPaceSpeech(runData.currentPace ?? runData.averagePace);
  const progress = getProgressPercent(runData);
  const closer = pickMetricCloser(mood, runData.time / 300);

  if (!runData.hasLocationFix && runData.distance <= 0) {
    return 'GPS is still getting ready. Keep the app open and start moving when it locks.';
  }

  return `${formatDistanceSpeech(runData.distance)} done, ${formatElapsedSpeech(runData.time)} in. ${
    paceText ? `Current pace ${paceText}. ` : ''
  }${progress}% complete. ${formatDistanceSpeech(runData.remainingDistance)} left. ${closer}`;
}

export function getDistanceCommandVoice(runData: RunData) {
  if (!runData.hasLocationFix && runData.distance <= 0) {
    return 'No distance yet. GPS is still getting ready.';
  }

  return `${formatDistanceSpeech(runData.distance)} done. ${formatDistanceSpeech(runData.remainingDistance)} left.`;
}

export function getPaceCommandVoice(runData: RunData) {
  const currentPace = formatPaceSpeech(runData.currentPace);
  const averagePace = formatPaceSpeech(runData.averagePace);

  if (currentPace && averagePace) {
    return `Current pace ${currentPace}. Average pace ${averagePace}.`;
  }

  if (averagePace) {
    return `Average pace ${averagePace}. Keep moving to get a live pace.`;
  }

  return 'Pace is not ready yet. Keep moving for a little longer.';
}

export function getTimeCommandVoice(runData: RunData) {
  return `Run time ${formatElapsedSpeech(runData.time)}.`;
}

export function getStopRunConfirmationVoice() {
  return 'To stop this run, say confirm stop.';
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

function getProgressPercent(runData: RunData) {
  if (!Number.isFinite(runData.targetDistance) || runData.targetDistance <= 0) return 0;
  return Math.min(100, Math.floor((runData.distance / runData.targetDistance) * 100));
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
