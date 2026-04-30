import type { RunRecord } from '../../types/moodrun';

export const HISTORY_KEY = 'moodrun_history';

export function loadRunHistory(): RunRecord[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') as RunRecord[];
  } catch (error) {
    console.warn('Could not read saved run history.', error);
    return [];
  }
}

export function saveRunHistory(history: RunRecord[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}
