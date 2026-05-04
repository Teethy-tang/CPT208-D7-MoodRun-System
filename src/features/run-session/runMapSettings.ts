import type { RunMapMode } from '../../types/moodrun';

const RUN_MAP_MODE_KEY = 'moodrun_run_map_mode';

export const RUN_MAP_MODE_CHANGE_EVENT = 'moodrun:run-map-mode-change';
export const runMapModes: RunMapMode[] = ['mood', 'classic'];

export function normalizeRunMapMode(value: unknown): RunMapMode {
  return runMapModes.includes(value as RunMapMode) ? (value as RunMapMode) : 'mood';
}

export function loadRunMapMode() {
  try {
    return normalizeRunMapMode(localStorage.getItem(RUN_MAP_MODE_KEY));
  } catch (error) {
    console.warn('Could not read saved run map mode.', error);
    return 'mood';
  }
}

export function saveRunMapMode(mode: RunMapMode) {
  try {
    localStorage.setItem(RUN_MAP_MODE_KEY, normalizeRunMapMode(mode));
  } catch (error) {
    console.warn('Could not save run map mode.', error);
  }
}
