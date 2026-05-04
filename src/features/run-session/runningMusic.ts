type RunningPlaylist = 'fast' | 'mixed' | 'slow';

interface RunningMusicPlan {
  paceRange: number[];
}

const runningPlaylists: Record<RunningPlaylist, string[]> = {
  fast: [
    '/audio/running/playlists/fast/kontraa-hype-drill-music-438398.mp3',
    '/audio/running/playlists/fast/prettyjohn1-no-copyright-music-498106.mp3',
    '/audio/running/playlists/fast/studiokolomna-background-music-483818.mp3',
  ],
  mixed: [
    '/audio/running/playlists/mixed/loksii-no-copyright-music-211881.mp3',
    '/audio/running/playlists/mixed/sonican-lo-fi-music-loop-sentimental-jazzy-love-473154.mp3',
  ],
  slow: [
    '/audio/running/playlists/slow/music_for_video-just-relax-11157.mp3',
    '/audio/running/playlists/slow/prettyjohn1-background-music-505061.mp3',
  ],
};

export function getRunningPlaylistForPlan(plan: RunningMusicPlan): RunningPlaylist {
  const [fastEdge, slowEdge] = plan.paceRange;
  const targetPace = Number.isFinite(fastEdge) && Number.isFinite(slowEdge) ? (fastEdge + slowEdge) / 2 : 5.8;

  if (targetPace < 5) return 'fast';
  if (targetPace < 6.5) return 'mixed';
  return 'slow';
}

export function createRunningMusic() {
  let activeAudio: HTMLAudioElement | null = null;
  let activePlaylist: RunningPlaylist | null = null;
  let activeIndex = 0;
  let targetVolume = 0.68;

  function isSupported() {
    return typeof Audio !== 'undefined';
  }

  function getTracks(playlist: RunningPlaylist) {
    return runningPlaylists[playlist].filter(Boolean);
  }

  function cleanupAudio() {
    if (!activeAudio) return;

    activeAudio.removeEventListener('ended', playNextTrack);
    activeAudio.removeEventListener('error', playNextTrack);
    activeAudio.pause();
    activeAudio.removeAttribute('src');
    activeAudio.load();
    activeAudio = null;
  }

  function createAudio(src: string) {
    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.volume = targetVolume;
    audio.addEventListener('ended', playNextTrack);
    audio.addEventListener('error', playNextTrack);
    return audio;
  }

  async function playCurrentTrack() {
    if (!activePlaylist) return false;

    const tracks = getTracks(activePlaylist);
    if (tracks.length === 0) return false;

    activeIndex = ((activeIndex % tracks.length) + tracks.length) % tracks.length;
    cleanupAudio();
    activeAudio = createAudio(tracks[activeIndex]);

    try {
      await activeAudio.play();
      return true;
    } catch (error) {
      console.warn('Could not play running music.', error);
      cleanupAudio();
      return false;
    }
  }

  function playNextTrack() {
    if (!activePlaylist) return;

    activeIndex += 1;
    void playCurrentTrack();
  }

  async function playPlaylist(playlist: RunningPlaylist, options: { restart?: boolean } = {}) {
    if (!isSupported()) return false;

    if (activeAudio && activePlaylist === playlist && !options.restart) {
      try {
        await activeAudio.play();
        return true;
      } catch (error) {
        console.warn('Could not resume running music.', error);
        return false;
      }
    }

    activePlaylist = playlist;
    activeIndex = 0;
    return playCurrentTrack();
  }

  function playForPlan(plan: RunningMusicPlan, options: { restart?: boolean } = {}) {
    return playPlaylist(getRunningPlaylistForPlan(plan), options);
  }

  function pause() {
    activeAudio?.pause();
  }

  function isPlaying() {
    return !!activeAudio && !activeAudio.paused;
  }

  function stop() {
    activePlaylist = null;
    activeIndex = 0;
    cleanupAudio();
  }

  function setVolume(volume: number) {
    if (!Number.isFinite(volume)) return;

    targetVolume = Math.min(1, Math.max(0, volume));
    if (activeAudio) activeAudio.volume = targetVolume;
  }

  return {
    isPlaying,
    isSupported,
    pause,
    playForPlan,
    playPlaylist,
    setVolume,
    stop,
  };
}
