interface SpeakOptions {
  force?: boolean;
  interrupt?: boolean;
  key?: string;
  minIntervalMs?: number;
  pitch?: number;
  rate?: number;
  volume?: number;
}

const DEFAULT_MIN_INTERVAL_MS = 9000;

export function createVoiceAssistant() {
  let enabled = true;
  const lastSpokenAt = new Map<string, number>();

  function getSynth() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    return window.speechSynthesis;
  }

  function isSupported() {
    return !!getSynth() && typeof SpeechSynthesisUtterance !== 'undefined';
  }

  function setEnabled(nextEnabled: boolean) {
    enabled = nextEnabled;

    if (!enabled) {
      stop();
    }
  }

  function speak(text: string, options: SpeakOptions = {}) {
    const synth = getSynth();
    const trimmedText = normalizeSpeechText(text);

    if (!enabled || !trimmedText || !synth || !isSupported()) return false;

    const now = Date.now();
    const key = options.key || trimmedText;
    const minIntervalMs = options.minIntervalMs ?? DEFAULT_MIN_INTERVAL_MS;
    const lastSpoken = lastSpokenAt.get(key) || 0;

    if (!options.force && now - lastSpoken < minIntervalMs) {
      return false;
    }

    lastSpokenAt.set(key, now);

    if (options.interrupt) {
      synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(trimmedText);
    utterance.lang = 'en-US';
    utterance.rate = options.rate ?? 0.92;
    utterance.pitch = options.pitch ?? 1;
    utterance.volume = options.volume ?? 0.92;
    synth.speak(utterance);

    return true;
  }

  function stop() {
    getSynth()?.cancel();
  }

  function resetMemory() {
    lastSpokenAt.clear();
  }

  return {
    isSupported,
    resetMemory,
    setEnabled,
    speak,
    stop,
  };
}

function normalizeSpeechText(text: string) {
  return text
    .replace(/\bKM\b/g, 'kilometers')
    .replace(/\bKMS\b/g, 'kilometers')
    .replace(/\bM\b/g, 'meters')
    .replace(/\s+/g, ' ')
    .trim();
}
