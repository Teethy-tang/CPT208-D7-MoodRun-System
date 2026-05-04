interface VoiceCommandListenerOptions {
  onStatus?: (status: VoiceCommandStatus) => void;
  onTranscript: (transcript: string) => void;
}

interface VoiceCommandStatus {
  message: string;
  tone: 'error' | 'info' | 'ready' | 'warning';
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  abort: () => void;
  start: () => void;
  stop: () => void;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onstart: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function createVoiceCommandListener({ onStatus, onTranscript }: VoiceCommandListenerOptions) {
  let recognition: SpeechRecognitionLike | null = null;
  let active = false;
  let listening = false;
  let restartTimerId: number | null = null;

  function getRecognitionConstructor() {
    if (typeof window === 'undefined') return null;
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }

  function isSupported() {
    return !!getRecognitionConstructor();
  }

  function start() {
    if (active || !isSupported()) return false;

    active = true;
    recognition = createRecognition();
    startRecognition();
    return true;
  }

  function stop() {
    active = false;
    listening = false;
    clearRestartTimer();

    if (!recognition) return;

    recognition.onend = null;
    recognition.onerror = null;
    recognition.onresult = null;
    recognition.onstart = null;
    recognition.stop();
    recognition = null;
  }

  function isListening() {
    return listening;
  }

  function createRecognition() {
    const Recognition = getRecognitionConstructor();
    if (!Recognition) {
      throw new Error('Speech recognition is not available in this browser.');
    }

    const nextRecognition = new Recognition();
    nextRecognition.continuous = true;
    nextRecognition.interimResults = false;
    nextRecognition.lang = getRecognitionLanguage();
    nextRecognition.maxAlternatives = 1;

    nextRecognition.onstart = () => {
      listening = true;
      onStatus?.({ message: 'Voice control is listening.', tone: 'ready' });
    };

    nextRecognition.onresult = (event) => {
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (!result?.isFinal) continue;

        const transcript = result[0]?.transcript?.trim();
        if (transcript) onTranscript(transcript);
      }
    };

    nextRecognition.onerror = (event) => {
      listening = false;

      if (event.error === 'no-speech') return;

      const tone = event.error === 'not-allowed' || event.error === 'service-not-allowed' ? 'error' : 'warning';
      onStatus?.({ message: getRecognitionErrorMessage(event.error), tone });
    };

    nextRecognition.onend = () => {
      listening = false;
      if (active) scheduleRestart();
    };

    return nextRecognition;
  }

  function startRecognition() {
    if (!active || !recognition) return;

    try {
      recognition.start();
    } catch (error) {
      onStatus?.({ message: 'Voice control could not start listening.', tone: 'warning' });
      scheduleRestart();
    }
  }

  function scheduleRestart() {
    clearRestartTimer();
    restartTimerId = window.setTimeout(() => {
      if (!active) return;
      startRecognition();
    }, 450);
  }

  function clearRestartTimer() {
    if (restartTimerId === null) return;
    window.clearTimeout(restartTimerId);
    restartTimerId = null;
  }

  return {
    isListening,
    isSupported,
    start,
    stop,
  };
}

function getRecognitionLanguage() {
  const language = navigator.language || 'en-US';
  return language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US';
}

function getRecognitionErrorMessage(error: string) {
  if (error === 'not-allowed' || error === 'service-not-allowed') {
    return 'Microphone permission is blocked. Allow microphone access to use voice control.';
  }

  if (error === 'audio-capture') {
    return 'No microphone was found for voice control.';
  }

  if (error === 'network') {
    return 'Voice control needs the browser speech service, but the network is unavailable.';
  }

  return 'Voice control paused. I will try listening again.';
}
