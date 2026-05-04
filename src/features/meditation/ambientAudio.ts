import type { MeditationSound } from '../../types/moodrun';

const audioPath = (path: string) => `${import.meta.env.BASE_URL}${path}`;

const meditationTrackUrls: Record<MeditationSound, string> = {
  rain: audioPath('audio/meditation/rain.mp3'),
  ocean: audioPath('audio/meditation/ocean.mp3'),
  forest: audioPath('audio/meditation/forest.mp3'),
  wind: audioPath('audio/meditation/wind.mp3'),
};

const FADE_STEP_MS = 30;
const FADE_DURATION_MS = 420;

export function createMeditationAudio() {
  let activeAudio: HTMLAudioElement | null = null;
  let activeSound: MeditationSound | null = null;
  let targetVolume = 0.65;
  const fadeTimers = new WeakMap<HTMLAudioElement, number>();

  function isSupported() {
    return typeof Audio !== 'undefined';
  }

  function clampVolume(volume: number) {
    if (!Number.isFinite(volume)) return targetVolume;
    return Math.min(1, Math.max(0, volume));
  }

  function clearFade(audio: HTMLAudioElement) {
    const timer = fadeTimers.get(audio);
    if (timer !== undefined) {
      window.clearInterval(timer);
      fadeTimers.delete(audio);
    }
  }

  function fadeAudio(audio: HTMLAudioElement, volume: number, onDone?: () => void) {
    clearFade(audio);

    const from = audio.volume;
    const to = clampVolume(volume);
    const steps = Math.max(1, Math.round(FADE_DURATION_MS / FADE_STEP_MS));
    let step = 0;

    const timer = window.setInterval(() => {
      step += 1;
      const progress = Math.min(1, step / steps);
      audio.volume = from + (to - from) * progress;

      if (progress >= 1) {
        clearFade(audio);
        onDone?.();
      }
    }, FADE_STEP_MS);

    fadeTimers.set(audio, timer);
  }

  function disposeAudio(audio: HTMLAudioElement) {
    clearFade(audio);
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }

  function createAudio(sound: MeditationSound) {
    const audio = new Audio(meditationTrackUrls[sound]);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0;
    return audio;
  }

  async function play(sound: MeditationSound, volume = targetVolume) {
    if (!isSupported()) return false;

    targetVolume = clampVolume(volume);

    if (activeAudio && activeSound === sound) {
      try {
        await activeAudio.play();
        fadeAudio(activeAudio, targetVolume);
        return true;
      } catch (error) {
        console.warn('Could not play meditation audio.', error);
        return false;
      }
    }

    const previousAudio = activeAudio;
    const nextAudio = createAudio(sound);
    activeAudio = nextAudio;
    activeSound = sound;

    if (previousAudio) {
      fadeAudio(previousAudio, 0, () => disposeAudio(previousAudio));
    }

    try {
      await nextAudio.play();
      fadeAudio(nextAudio, targetVolume);
      return true;
    } catch (error) {
      disposeAudio(nextAudio);
      activeAudio = null;
      console.warn('Could not play meditation audio.', error);
      return false;
    }
  }

  function pause() {
    if (!activeAudio) return;
    const audio = activeAudio;
    fadeAudio(audio, 0, () => audio.pause());
  }

  function stop(options: { fade?: boolean } = {}) {
    if (!activeAudio) return;

    const audio = activeAudio;
    activeAudio = null;
    activeSound = null;

    if (options.fade === false) {
      disposeAudio(audio);
      return;
    }

    fadeAudio(audio, 0, () => disposeAudio(audio));
  }

  function setVolume(volume: number) {
    targetVolume = clampVolume(volume);

    if (activeAudio && !activeAudio.paused) {
      fadeAudio(activeAudio, targetVolume);
    }
  }

  function preload(sound: MeditationSound) {
    if (!isSupported() || activeAudio) return;

    const audio = createAudio(sound);
    audio.load();
    activeAudio = audio;
    activeSound = sound;
  }

  function isPlaying() {
    return !!activeAudio && !activeAudio.paused;
  }

  return {
    isSupported,
    isPlaying,
    play,
    pause,
    stop,
    setVolume,
    preload,
  };
}
