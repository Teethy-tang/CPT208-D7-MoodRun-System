import type { MoodId } from '../../types/moodrun';

export type MoodIntensity = 'low' | 'medium' | 'high';

export interface MoodAnalysis {
  mood: MoodId;
  confidence: number;
  intensity: MoodIntensity;
  secondaryMood?: MoodId;
  reply: string;
  reasons: string[];
  supportLevel?: 'crisis';
}

type MoodScore = Record<MoodId, number>;

interface MoodSignal {
  mood: MoodId;
  terms: string[];
  weight: number;
  reason: string;
}

const moodIds: MoodId[] = ['stressed', 'anxious', 'tired', 'angry', 'sad', 'bored', 'excited', 'happy', 'neutral'];

const crisisTerms = [
  'kill myself',
  'suicide',
  'end it all',
  'do not want to live',
  "don't want to live",
  'want to die',
  '不想活',
  '想死',
  '自杀',
  '结束生命',
  '活不下去',
];

const moodSignals: MoodSignal[] = [
  {
    mood: 'angry',
    terms: [
      'angry',
      'mad',
      'rage',
      'furious',
      'annoyed',
      'irritated',
      'pissed',
      'frustrated',
      'fed up',
      'livid',
      'resentful',
      'sick of',
      'had enough',
      'so done',
      'done with this',
      'want to scream',
      'feel attacked',
      'hate',
      'unfair',
      'fuming',
      '生气',
      '愤怒',
      '火大',
      '气死',
      '烦死',
      '烦躁',
      '很烦',
      '恼火',
      '暴躁',
      '想骂',
      '不公平',
      '忍不了',
      '受够了',
      '气炸',
      '气疯',
      '窝火',
      '来气',
      '憋屈',
      '火冒三丈',
      '炸了',
    ],
    weight: 2.4,
    reason: 'anger or heat language',
  },
  {
    mood: 'anxious',
    terms: [
      'anxious',
      'worry',
      'worried',
      'panic',
      'nervous',
      'afraid',
      'scared',
      'overthinking',
      'what if',
      "can't breathe",
      'uneasy',
      'on edge',
      'tense',
      'spiraling',
      'freaking out',
      'freaked out',
      'stressed about',
      'worried about',
      'feel unsafe',
      'uncertain',
      'dread',
      'dreading',
      '焦虑',
      '担心',
      '害怕',
      '紧张',
      '心慌',
      '慌',
      '胡思乱想',
      '睡不着',
      '怎么办',
      '不安',
      '忐忑',
      '发慌',
      '慌张',
      '心里没底',
      '没底',
      '担忧',
      '害怕出错',
      '怕',
      '恐慌',
      '恐惧',
    ],
    weight: 2.25,
    reason: 'worry or threat language',
  },
  {
    mood: 'stressed',
    terms: [
      'stress',
      'stressed',
      'pressure',
      'overwhelmed',
      'too much',
      'busy',
      'crushed',
      'deadline',
      'workload',
      'exam',
      'assignment',
      'under pressure',
      "can't handle this",
      'cannot handle this',
      'too many things',
      'too much work',
      'behind schedule',
      'running out of time',
      'no time',
      'packed schedule',
      'swamped',
      'overloaded',
      'snowed under',
      'mental load',
      '压力',
      '压垮',
      '任务',
      'ddl',
      '考试',
      '作业',
      '太多事',
      '忙',
      '太忙',
      '忙不过来',
      '崩溃',
      '撑不住',
      '顶不住',
      '来不及',
      '赶不完',
      '没时间',
      '事情太多',
      '脑子很乱',
      '负担',
      '被任务压住',
      '被压',
    ],
    weight: 2.15,
    reason: 'pressure or workload language',
  },
  {
    mood: 'sad',
    terms: [
      'sad',
      'down',
      'lonely',
      'empty',
      'cry',
      'hurt',
      'heavy',
      'miss',
      'depressed',
      'heartbroken',
      'hopeless',
      'unhappy',
      'not happy',
      'feel bad',
      'bad',
      'awful',
      'terrible',
      'miserable',
      'rough',
      'not okay',
      'not ok',
      'feel low',
      'low mood',
      'blue',
      'gloomy',
      'devastated',
      'disappointed',
      'let down',
      'rejected',
      'ignored',
      'worthless',
      'not enough',
      'feel small',
      'feel alone',
      'feel empty',
      'feel like crying',
      '难过',
      '伤心',
      '孤独',
      '孤单',
      '空',
      '想哭',
      '哭',
      '委屈',
      '失落',
      '沮丧',
      '抑郁',
      '低落',
      '心酸',
      '失望',
      '被忽视',
      '没人懂',
      '没人理解',
      '丧',
      '破防',
      '想家',
      '委靡',
      '心情不好',
      '不好受',
      '糟糕',
      '很糟',
      '难受',
      '心碎',
      '想念',
      '不开心',
      '不快乐',
    ],
    weight: 2.2,
    reason: 'sadness or heaviness language',
  },
  {
    mood: 'tired',
    terms: [
      'tired',
      'sleepy',
      'exhausted',
      'drained',
      'no energy',
      'burned out',
      'burnt out',
      'weak',
      'fatigue',
      'worn out',
      'worn down',
      'low energy',
      'sleep deprived',
      'need sleep',
      'need rest',
      'out of energy',
      'zero energy',
      'running on empty',
      'body feels heavy',
      "can't focus",
      'cannot focus',
      'brain fog',
      '累',
      '疲惫',
      '困',
      '没力气',
      '没能量',
      '精疲力尽',
      '没睡',
      '睡眠不足',
      '想睡',
      '需要休息',
      '身体沉',
      '脑袋昏',
      '脑雾',
      '没精神',
      '没状态',
      '乏力',
      '躺平',
      '虚',
    ],
    weight: 2,
    reason: 'low-energy body language',
  },
  {
    mood: 'bored',
    terms: [
      'bored',
      'flat',
      'nothing',
      'same',
      'dull',
      'stuck',
      'boring',
      'meh',
      'numb',
      'unmotivated',
      'uninspired',
      'lost interest',
      'no interest',
      'tired of this',
      'same old',
      'nothing new',
      'pointless',
      'monotony',
      'monotonous',
      'checked out',
      'zone out',
      '无聊',
      '没意思',
      '无趣',
      '麻木',
      '空转',
      '卡住',
      '提不起劲',
      '没动力',
      '没兴趣',
      '没劲',
      '乏味',
      '单调',
      '腻了',
      '厌倦',
      '没有新鲜感',
      '发空',
      '平淡',
      '不知道干嘛',
      '发呆',
    ],
    weight: 1.85,
    reason: 'flatness or low-motivation language',
  },
  {
    mood: 'excited',
    terms: [
      'excited',
      'hyped',
      'restless',
      'ready',
      'energy',
      "can't wait",
      'thrilled',
      'pumped',
      'eager',
      'hopeful',
      'motivated',
      'inspired',
      'amped',
      'buzzing',
      'fired up',
      'looking forward',
      'ready to go',
      'full of energy',
      'big energy',
      'energized',
      '兴奋',
      '激动',
      '期待',
      '迫不及待',
      '冲',
      '有劲',
      '有动力',
      '来劲',
      '热血',
      '燃起来',
      '跃跃欲试',
      '干劲',
      '上头',
      '带劲',
      'high',
      '嗨',
    ],
    weight: 2.1,
    reason: 'high-energy positive language',
  },
  {
    mood: 'happy',
    terms: [
      'happy',
      'good',
      'great',
      'joy',
      'grateful',
      'proud',
      'smile',
      'calm',
      'peaceful',
      'relieved',
      'not bad',
      'feel good',
      'feel great',
      'content',
      'glad',
      'cheerful',
      'delighted',
      'optimistic',
      'safe',
      'loved',
      'supported',
      'confident',
      'satisfied',
      '开心',
      '快乐',
      '高兴',
      '舒服',
      '轻松',
      '感谢',
      '感恩',
      '骄傲',
      '满意',
      '不错',
      '还不错',
      '爽',
      '安心',
      '踏实',
      '被支持',
      '有信心',
      '满足',
      '愉快',
      '乐观',
      '被爱',
      '释然',
    ],
    weight: 1.95,
    reason: 'positive or relieved language',
  },
  {
    mood: 'neutral',
    terms: [
      'okay',
      'fine',
      'normal',
      'ordinary',
      'alright',
      'neutral',
      'so so',
      'same as usual',
      'nothing special',
      'even',
      'steady',
      'calm enough',
      '还好',
      '一般',
      '普通',
      '没什么',
      '还行',
      '正常',
      '稳定',
      '平静',
      '平稳',
      '和平时一样',
      '没啥',
      '就那样',
    ],
    weight: 1.25,
    reason: 'steady or ordinary language',
  },
];

const intensifiers = [
  'very',
  'really',
  'so ',
  'extremely',
  'totally',
  'completely',
  'unbearable',
  'always',
  'never',
  'all day',
  '很',
  '非常',
  '特别',
  '超',
  '太',
  '快要',
  '完全',
  '一直',
  '受不了',
  '顶不住',
  '要命',
];

const softeners = ['a little', 'kind of', 'slightly', 'maybe', 'sort of', '有点', '稍微', '一点', '还好', '还行'];

const negativeMoods = new Set<MoodId>(['stressed', 'anxious', 'tired', 'angry', 'sad', 'bored']);
const positiveMoods = new Set<MoodId>(['happy', 'excited']);

const moodReplies: Record<MoodId, Record<MoodIntensity, string>> = {
  stressed: {
    low: 'I hear some pressure in this. A simple steady run can give the day a cleaner edge.',
    medium: 'This sounds like real pressure, not just background noise. Let the run move some of it out of your body.',
    high: 'That sounds heavy and urgent. Start controlled, keep the route simple, and let the first few minutes lower the pressure.',
  },
  anxious: {
    low: 'There is a little worry in the signal. A calm pace can help your thoughts stop sprinting ahead.',
    medium: 'Your words carry worry and alertness. A steady rhythm may help make the next thing feel smaller.',
    high: 'This sounds like your mind is running hot. Keep the run gentle and let breathing lead the pace.',
  },
  tired: {
    low: 'I hear low energy here. Keep it light and let movement wake you up slowly.',
    medium: 'This sounds like real tiredness. A short, soft run is enough; the goal is to return with more energy than you spend.',
    high: 'Your body sounds drained. Treat this as recovery movement, not a test.',
  },
  angry: {
    low: 'There is some heat in this. A controlled run can give it somewhere useful to go.',
    medium: 'This sounds heated. Use the run to channel it, with enough control that the mood does not drive the pace.',
    high: 'That is a lot of heat. Start slower than you want to, then let speed arrive only after your breathing settles.',
  },
  sad: {
    low: 'There is some heaviness in this. A gentle route can make the feeling less stuck.',
    medium: 'This sounds tender and heavy. You do not need a heroic run; just a kind one.',
    high: 'That sounds deeply heavy. Keep close to safe places, move gently, and let this be care rather than performance.',
  },
  bored: {
    low: 'I hear a flat note in this. A small route change may be enough to wake things up.',
    medium: 'This sounds like stuck energy. A varied run can break the pattern without asking too much of you.',
    high: 'The flatness sounds strong today. Pick a route with small changes so your attention has something to meet.',
  },
  excited: {
    low: 'There is a spark here. A focused run can give it a clean line.',
    medium: 'You sound energized and ready. Use that momentum, but keep the first minutes controlled.',
    high: 'That is a big spark. Let the run hold the energy without burning it all at once.',
  },
  happy: {
    low: 'There is a good feeling in this. Let the run carry it forward.',
    medium: 'This sounds bright. A balanced run can help you keep the mood without rushing it.',
    high: 'That joy has real lift. Enjoy the pace, and leave a little energy for the finish.',
  },
  neutral: {
    low: 'The signal feels pretty steady. A balanced run can still give the day a useful shape.',
    medium: 'This reads as mostly even, with a little movement underneath. A steady route fits it well.',
    high: 'Even steady moods can hold a lot. Keep the run balanced and let the rhythm sort the details.',
  },
};

export function analyzeMoodThought(value: string): MoodAnalysis {
  const rawText = value.trim();
  const text = normalizeThought(value);

  if (!text) {
    return {
      mood: 'neutral',
      confidence: 0.32,
      intensity: 'low',
      reply: 'I need a few words before I can read the mood. Right now this looks neutral.',
      reasons: ['empty input'],
    };
  }

  if (containsAny(text, crisisTerms)) {
    return {
      mood: 'sad',
      confidence: 0.95,
      intensity: 'high',
      reply:
        'This sounds serious and painful. Before running, please reach out to someone you trust or local emergency support if you might be in danger.',
      reasons: ['crisis language detected', 'high emotional risk'],
      supportLevel: 'crisis',
    };
  }

  const scores = createEmptyScores();
  const reasons = new Map<MoodId, Set<string>>();
  const matchedTerms = new Map<MoodId, string[]>();
  const matchedNeutralPhrases = getMatchedNeutralPhrases(text);

  for (const signal of moodSignals) {
    for (const term of signal.terms) {
      if (signal.mood !== 'neutral' && isCoveredByNeutralPhrase(matchedNeutralPhrases, term)) continue;

      const matchIndex = findTermIndex(text, term);
      if (matchIndex === -1) continue;
      if (hasLongerMatchedTerm(matchedTerms, signal.mood, term)) continue;

      const negated = isNegated(text, matchIndex, term);
      if (negated && positiveMoods.has(signal.mood)) {
        scores.sad += signal.weight * 0.58;
        addReason(reasons, 'sad', 'negated positive feeling');
        rememberMatchedTerm(matchedTerms, 'sad', term);
        continue;
      }

      if (negated && negativeMoods.has(signal.mood)) {
        scores.neutral += 0.35;
        addReason(reasons, 'neutral', `negated ${signal.mood} cue`);
        rememberMatchedTerm(matchedTerms, 'neutral', term);
        continue;
      }

      scores[signal.mood] += signal.weight;
      addReason(reasons, signal.mood, signal.reason);
      rememberMatchedTerm(matchedTerms, signal.mood, term);
    }
  }

  applyExpressionSignals(text, rawText, scores, reasons);

  const explicitNeutralScore = scores.neutral;
  const emotionalScores = moodIds
    .filter((mood) => mood !== 'neutral')
    .map((mood) => ({ mood, score: scores[mood] }))
    .sort((a, b) => b.score - a.score);

  const best = emotionalScores[0];
  const second = emotionalScores[1];
  const bestMood = chooseBestMood(best, explicitNeutralScore, text);
  const bestScore = scores[bestMood];
  const secondMood = getSecondaryMood(bestMood, second, scores);
  const intensity = getIntensity(bestScore, text);
  const confidence = getConfidence(bestMood, bestScore, scores, explicitNeutralScore, text);
  const reasonList = getReasonList(bestMood, reasons, secondMood);

  return {
    mood: bestMood,
    confidence,
    intensity,
    secondaryMood: secondMood,
    reply: buildReply(bestMood, intensity, secondMood, confidence),
    reasons: reasonList,
  };
}

function normalizeThought(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function createEmptyScores(): MoodScore {
  return moodIds.reduce((scores, mood) => {
    scores[mood] = 0;
    return scores;
  }, {} as MoodScore);
}

function containsAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function findTermIndex(text: string, term: string) {
  if (!isLatinTerm(term)) return text.indexOf(term);

  const escapedTerm = escapeRegExp(term).replace(/\s+/g, '\\s+');
  const pattern = new RegExp(`(^|[^a-z0-9'])(${escapedTerm})(?=$|[^a-z0-9'])`, 'i');
  const match = pattern.exec(text);

  return match ? match.index + match[1].length : -1;
}

function isLatinTerm(term: string) {
  return /^[a-z0-9' -]+$/i.test(term);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getMatchedNeutralPhrases(text: string) {
  const neutralSignal = moodSignals.find((signal) => signal.mood === 'neutral');
  return (neutralSignal?.terms || []).filter((term) => term.length > 4 && findTermIndex(text, term) !== -1);
}

function isCoveredByNeutralPhrase(matchedNeutralPhrases: string[], term: string) {
  return matchedNeutralPhrases.some((phrase) => phrase.length > term.length && phrase.includes(term));
}

function addReason(reasons: Map<MoodId, Set<string>>, mood: MoodId, reason: string) {
  if (!reasons.has(mood)) reasons.set(mood, new Set());
  reasons.get(mood)?.add(reason);
}

function rememberMatchedTerm(matchedTerms: Map<MoodId, string[]>, mood: MoodId, term: string) {
  const terms = matchedTerms.get(mood) || [];
  terms.push(term);
  matchedTerms.set(mood, terms);
}

function hasLongerMatchedTerm(matchedTerms: Map<MoodId, string[]>, mood: MoodId, term: string) {
  return (matchedTerms.get(mood) || []).some((matchedTerm) => matchedTerm.length > term.length && matchedTerm.includes(term));
}

function isNegated(text: string, matchIndex: number, term: string) {
  const before = text.slice(Math.max(0, matchIndex - 32), matchIndex);
  const latinNegation =
    /\b(no|not|never|dont|don't|isnt|isn't|wasnt|wasn't|cannot|can't|cant)\s+(?:feel|feeling|felt|am|are|is|was|were|be|being|get|getting|seem|seems|seemed)?\s*$/.test(
      before,
    ) ||
    /\b(do not|does not|did not)\s+(?:feel|feeling|felt|be|get|seem)?\s*$/.test(before);
  const chineseNegation = /(不|没|没有|无|不是|并不|别)$/.test(before);

  if (!latinNegation && !chineseNegation) return false;
  if (term === "can't wait" || term === 'not happy' || term === 'not bad') return false;
  if (term.startsWith('不') || term.startsWith('没')) return false;

  return true;
}

function applyExpressionSignals(text: string, rawText: string, scores: MoodScore, reasons: Map<MoodId, Set<string>>) {
  const hasHighPunctuation = /[!?！？]{2,}/.test(text);
  const hasQuestionPressure = /[?？]/.test(text) && containsAny(text, ['what if', '怎么办', 'why', '为什么']);
  const hasUppercasePressure = getUppercaseRatio(rawText) > 0.62;
  const intensityMultiplier = getIntensityMultiplier(text);

  for (const mood of moodIds) {
    scores[mood] *= intensityMultiplier;
  }

  if (hasHighPunctuation) {
    const leadingMood = getLeadingMood(scores);
    if (leadingMood === 'happy') {
      scores.excited += 0.65;
      addReason(reasons, 'excited', 'high-energy punctuation');
    } else if (leadingMood === 'angry' || leadingMood === 'anxious' || leadingMood === 'stressed' || leadingMood === 'excited') {
      scores[leadingMood] += 0.55;
      addReason(reasons, leadingMood, 'high-intensity punctuation');
    } else {
      scores.anxious += 0.35;
      addReason(reasons, 'anxious', 'uncertain punctuation');
    }
  }

  if (hasQuestionPressure) {
    scores.anxious += 0.65;
    addReason(reasons, 'anxious', 'question-based uncertainty');
  }

  if (hasUppercasePressure) {
    scores.angry += 0.4;
    scores.stressed += 0.25;
    addReason(reasons, 'angry', 'all-caps intensity');
  }
}

function getIntensityMultiplier(text: string) {
  const hasIntensifier = containsAny(text, intensifiers);
  const hasSoftener = containsAny(text, softeners);

  if (hasIntensifier && !hasSoftener) return 1.22;
  if (hasSoftener && !hasIntensifier) return 0.78;
  return 1;
}

function getUppercaseRatio(text: string) {
  const letters = text.match(/[a-z]/gi) || [];
  if (letters.length < 8) return 0;
  const uppercase = letters.filter((letter) => letter === letter.toUpperCase()).length;
  return uppercase / letters.length;
}

function getLeadingMood(scores: MoodScore): MoodId {
  return moodIds
    .filter((mood) => mood !== 'neutral')
    .map((mood) => ({ mood, score: scores[mood] }))
    .sort((a, b) => b.score - a.score)[0].mood;
}

function chooseBestMood(best: { mood: MoodId; score: number }, explicitNeutralScore: number, text: string): MoodId {
  if (best.score <= 0 && explicitNeutralScore > 0) return 'neutral';
  if (best.score <= 0) return inferFallbackMood(text);
  if (explicitNeutralScore >= best.score * 1.25 && best.score < 2.6) return 'neutral';
  return best.mood;
}

function inferFallbackMood(text: string): MoodId {
  if (/[?？]{2,}/.test(text)) return 'anxious';
  if (/[!！]{2,}/.test(text)) return 'excited';
  if (/\.{3,}|…/.test(text)) return 'bored';
  if (text.length < 18) return 'neutral';
  return 'neutral';
}

function getSecondaryMood(bestMood: MoodId, second: { mood: MoodId; score: number } | undefined, scores: MoodScore) {
  if (!second || second.mood === bestMood || second.mood === 'neutral') return undefined;
  if (scores[second.mood] >= 1.2 && scores[second.mood] >= scores[bestMood] * 0.45) return second.mood;
  return undefined;
}

function getIntensity(score: number, text: string): MoodIntensity {
  if (score >= 4.2 || containsAny(text, ['崩溃', '受不了', '顶不住', 'extremely', 'unbearable']) || /[!?！？]{3,}/.test(text)) {
    return 'high';
  }

  if (score >= 2 || containsAny(text, ['很', 'very', 'really', '太'])) return 'medium';
  return 'low';
}

function getConfidence(bestMood: MoodId, bestScore: number, scores: MoodScore, explicitNeutralScore: number, text: string) {
  if (bestMood === 'neutral' && explicitNeutralScore <= 0) {
    return text.length < 18 ? 0.36 : 0.44;
  }

  const sortedScores = moodIds
    .filter((mood) => mood !== bestMood)
    .map((mood) => scores[mood])
    .sort((a, b) => b - a);
  const margin = Math.max(0, bestScore - (sortedScores[0] || 0));
  const confidence = 0.46 + Math.min(bestScore, 6) * 0.065 + Math.min(margin, 3) * 0.055;

  return clamp(Number(confidence.toFixed(2)), 0.34, 0.95);
}

function getReasonList(bestMood: MoodId, reasons: Map<MoodId, Set<string>>, secondMood?: MoodId) {
  const bestReasons = Array.from(reasons.get(bestMood) || []);
  const secondaryReasons = secondMood ? Array.from(reasons.get(secondMood) || []) : [];
  const merged = [...bestReasons, ...secondaryReasons].slice(0, 3);

  if (merged.length > 0) return merged;
  if (bestMood === 'neutral') return ['no strong emotional cue detected'];
  return ['expression pattern matched'];
}

function buildReply(mood: MoodId, intensity: MoodIntensity, secondaryMood: MoodId | undefined, confidence: number) {
  const base = moodReplies[mood][intensity];
  const mixed = secondaryMood ? ` I also hear some ${secondaryMood} underneath.` : '';
  const unsure = confidence < 0.52 ? ' This is a low-confidence read, so treat it as the closest fit.' : '';

  return `${base}${mixed}${unsure}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
