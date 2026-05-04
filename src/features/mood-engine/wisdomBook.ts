import type { MoodId } from '../../types/moodrun';
import { moodOutcomes } from './data';

export interface WisdomContext {
  mood: MoodId | null;
  moodAfter?: string;
  thought?: string;
  distanceKm?: number;
  elapsedSec?: number;
}

export interface WisdomEntry {
  quote: string;
  arcLabel: string;
  sourceLabel: string;
}

type WisdomCandidate = {
  quote: string;
  sourceLabel: string;
};

const moodArcWisdom: Record<MoodId, string[]> = {
  stressed: [
    'Pressure gets smaller when the body remembers it can move.',
    'You did not solve everything; you changed the room inside yourself.',
    'A run cannot erase the load, but it can teach the load to loosen.',
    'The task list may remain, but your breath now has more space around it.',
    'When pressure turns into motion, it stops being the only voice in the room.',
    'You carried the weight into the route and returned with better hands.',
  ],
  anxious: [
    'Worry wanted a future; your feet gave it the present.',
    'A steady rhythm is a small promise kept again and again.',
    'You did not outrun the fear; you gave it something calmer to follow.',
    'The mind asks many doors to open. The body only needs the next step.',
    'Every measured breath is proof that the storm is not in charge.',
    'The route narrowed the noise until one step could be enough.',
  ],
  tired: [
    'Energy does not always arrive first; sometimes it meets you halfway.',
    'A gentle finish is still a finish the body can trust.',
    'You respected the low battery and moved without spending all of it.',
    'Recovery can look like motion when motion stays kind.',
    'The run did not demand more from you than today could give.',
    'Small effort becomes wisdom when it knows when to stay soft.',
  ],
  angry: [
    'Heat becomes useful when it learns a direction.',
    'You let the fire move without letting it choose the whole path.',
    'Power is safest when breath gets a vote.',
    'The route gave your anger a boundary, and the boundary made it clearer.',
    'You spent the spark without burning what you still need.',
    'Control is not the absence of heat; it is heat with a handle.',
  ],
  sad: [
    'You did not have to feel bright to choose care.',
    'A soft step can hold more courage than a loud victory.',
    'The heaviness came with you, and still you moved.',
    'Some days, wisdom is not rising above the feeling; it is staying near yourself.',
    'The route did not fix the sadness. It helped you keep company with it.',
    'Gentle motion is a way of saying: I am still here.',
  ],
  bored: [
    'Novelty often begins as one small change in direction.',
    'Flat days can still hide a door if you keep walking long enough.',
    'Curiosity is what happens when attention gets a new path.',
    'You broke the loop by giving the body a different question.',
    'The route reminded the day that it had more than one shape.',
    'When nothing feels new, movement can be the first new thing.',
  ],
  excited: [
    'A spark lasts longer when it learns rhythm.',
    'You gave the extra energy a line instead of letting it scatter.',
    'Focus is excitement with a destination.',
    'The run turned your bright charge into something you can carry.',
    'Fast feelings become stronger when they leave room for the finish.',
    'Momentum is a gift; pacing is how you keep it.',
  ],
  happy: [
    'Joy becomes memory when you give it a route.',
    'Good feelings deserve practice too.',
    'You carried brightness forward without needing to prove it.',
    'The run gave the happy mood a place to land.',
    'A good day can still become deeper when you move through it.',
    'You did not chase joy; you let it travel with you.',
  ],
  neutral: [
    'Balance is built in ordinary minutes.',
    'A steady step can reset the whole day.',
    'Not every run needs a storm before it becomes meaningful.',
    'The quiet mood still changed because you gave it motion.',
    'Ordinary energy becomes direction when it is used with care.',
    'A balanced beginning can still become a clearer ending.',
  ],
};

const outcomeWisdom: Partial<Record<string, string[]>> = {
  LIGHTER: [
    'Lighter does not mean empty; it means there is room to breathe.',
    'The pressure may still exist, but it no longer owns the whole room.',
    'You made space, and space is often the first repair.',
  ],
  STEADIER: [
    'Steady is not slow; steady is trust repeated.',
    'The mind can borrow rhythm from the body.',
    'You found a pace that the worry could not rush.',
  ],
  AWAKE: [
    'Awake is a gentle return, not a sudden demand.',
    'You found a little current under the tiredness.',
    'The body answered softly, and softly was enough.',
  ],
  CLEAR: [
    'Clear does not cancel intensity; it gives intensity a window.',
    'You kept the force, but lost some of the blur.',
    'The heat moved through a path instead of through everything.',
  ],
  HELD: [
    'Being held can start with not abandoning yourself.',
    'You stayed with the feeling and still chose motion.',
    'Care can be quiet and still count.',
  ],
  CURIOUS: [
    'Curiosity is a small light, but it changes the room.',
    'Newness returned because you gave it a place to enter.',
    'The day opened when the route stopped repeating itself.',
  ],
  FOCUSED: [
    'Focus is energy that learned where to stand.',
    'The spark became useful because you gave it a shape.',
    'Direction made the excitement easier to keep.',
  ],
  BRIGHTER: [
    'Brightness grows when it is carried with attention.',
    'You let joy move without asking it to hurry.',
    'A good feeling became stronger because you noticed it.',
  ],
  BALANCED: [
    'Balance is quiet evidence that something worked.',
    'The day has more shape now than when you began.',
    'Steady motion can turn ordinary time into a reset.',
  ],
};

const thoughtSignalWisdom = [
  {
    sourceLabel: 'THOUGHT: PRESSURE',
    terms: ['deadline', 'exam', 'assignment', 'workload', 'pressure', 'ddl', 'task'],
    quotes: [
      'The deadline did not disappear, but your body found a little room beside it.',
      'When the mind stacks tasks, one physical rhythm can unstack the breath.',
    ],
  },
  {
    sourceLabel: 'THOUGHT: UNCERTAINTY',
    terms: ['what if', 'maybe', 'worry', 'worried', 'afraid', 'why', 'how'],
    quotes: [
      'Uncertainty gets less sharp when one action is already complete.',
      'You answered the unknown with a step you could actually take.',
    ],
  },
  {
    sourceLabel: 'THOUGHT: LOW ENERGY',
    terms: ['tired', 'exhausted', 'sleepy', 'drained', 'burned out', 'no energy'],
    quotes: [
      'Low energy still has wisdom when it chooses the right size of effort.',
      'You moved without pretending to be more rested than you were.',
    ],
  },
  {
    sourceLabel: 'THOUGHT: STUCK',
    terms: ['bored', 'stuck', 'nothing', 'same', 'dull', 'flat', 'unmotivated'],
    quotes: [
      'The stuck feeling changed when your path did.',
      'A different route can remind attention how to wake up.',
    ],
  },
  {
    sourceLabel: 'THOUGHT: GRATITUDE',
    terms: ['happy', 'grateful', 'proud', 'good', 'great', 'relieved', 'smile'],
    quotes: [
      'Gratitude becomes steadier when the body helps remember it.',
      'You gave the good feeling a rhythm, and rhythm helps it stay.',
    ],
  },
];

const effortWisdom = {
  short: [
    'A short run can still change the emotional weather.',
    'Small distance is not small care.',
  ],
  long: [
    'You stayed long enough for the mood to learn a new shape.',
    'Endurance is attention stretched kindly over time.',
  ],
};

export function selectWisdomEntry(context: WisdomContext): WisdomEntry {
  const mood = context.mood || 'neutral';
  const moodAfter = normalizeMoodAfter(context.moodAfter || moodOutcomes[mood].after);
  const arcLabel = `${mood.toUpperCase()} -> ${moodAfter}`;
  const candidates = buildCandidates(context, mood, moodAfter);
  const seed = `${arcLabel}|${context.thought || ''}|${context.distanceKm?.toFixed(2) || '0'}|${context.elapsedSec || 0}`;
  const selected = pickCandidate(candidates, seed);

  return {
    quote: selected.quote,
    arcLabel,
    sourceLabel: selected.sourceLabel,
  };
}

function buildCandidates(context: WisdomContext, mood: MoodId, moodAfter: string): WisdomCandidate[] {
  const candidates: WisdomCandidate[] = [
    ...toCandidates(moodArcWisdom[mood], 'MOOD ARC'),
    ...toCandidates(outcomeWisdom[moodAfter] || [], `AFTER: ${moodAfter}`),
    ...getThoughtCandidates(context.thought || ''),
    ...getEffortCandidates(context.distanceKm || 0, context.elapsedSec || 0),
  ];

  return dedupeCandidates(candidates.length > 0 ? candidates : toCandidates(moodArcWisdom.neutral, 'MOOD ARC'));
}

function toCandidates(quotes: string[], sourceLabel: string): WisdomCandidate[] {
  return quotes.map((quote) => ({ quote, sourceLabel }));
}

function getThoughtCandidates(thought: string): WisdomCandidate[] {
  const text = thought.trim().toLowerCase();
  if (!text) return [];

  return thoughtSignalWisdom.flatMap((signal) => {
    if (!signal.terms.some((term) => text.includes(term))) return [];
    return toCandidates(signal.quotes, signal.sourceLabel);
  });
}

function getEffortCandidates(distanceKm: number, elapsedSec: number): WisdomCandidate[] {
  if (distanceKm > 0 && distanceKm < 1.2) return toCandidates(effortWisdom.short, 'RUN: SHORT RESET');
  if (distanceKm >= 5 || elapsedSec >= 30 * 60) return toCandidates(effortWisdom.long, 'RUN: ENDURANCE');
  return [];
}

function dedupeCandidates(candidates: WisdomCandidate[]) {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    if (seen.has(candidate.quote)) return false;
    seen.add(candidate.quote);
    return true;
  });
}

function pickCandidate(candidates: WisdomCandidate[], seed: string) {
  const index = Math.abs(hashString(seed)) % candidates.length;
  return candidates[index];
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}

function normalizeMoodAfter(value: string) {
  return value.trim().toUpperCase() || 'BALANCED';
}
