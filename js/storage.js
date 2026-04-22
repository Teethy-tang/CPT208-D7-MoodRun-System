const HISTORY_KEY = 'moodrun_history';

export function loadRunHistory() {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    } catch (error) {
        console.warn('Could not read saved run history.', error);
        return [];
    }
}

export function saveRunHistory(history) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}
