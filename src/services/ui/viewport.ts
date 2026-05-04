export function initMobileViewport() {
  const root = document.documentElement;
  const standaloneQuery = window.matchMedia('(display-mode: standalone)');
  const coarsePointerQuery = window.matchMedia('(pointer: coarse)');

  const syncViewportHeight = () => {
    const height = window.visualViewport?.height ?? window.innerHeight;
    root.style.setProperty('--app-height', `${Math.round(height)}px`);
    root.style.setProperty('--layout-viewport-height', `${window.innerHeight}px`);
  };

  const syncInputMode = () => {
    const visualHeight = window.visualViewport?.height ?? window.innerHeight;
    const keyboardOpen = window.innerHeight - visualHeight > 120;
    root.classList.toggle('keyboard-open', keyboardOpen);
  };

  const syncDisplayMode = () => {
    root.classList.toggle('standalone-app', standaloneQuery.matches);
  };

  const syncPointerMode = () => {
    root.classList.toggle('touch-device', coarsePointerQuery.matches);
  };

  const syncAll = () => {
    syncViewportHeight();
    syncInputMode();
    syncDisplayMode();
    syncPointerMode();
  };

  syncAll();

  window.addEventListener('resize', syncAll, { passive: true });
  window.addEventListener('orientationchange', syncAll, { passive: true });
  window.visualViewport?.addEventListener('resize', syncAll);
  window.visualViewport?.addEventListener('scroll', syncInputMode);

  if ('addEventListener' in standaloneQuery) {
    standaloneQuery.addEventListener('change', syncDisplayMode);
  }

  if ('addEventListener' in coarsePointerQuery) {
    coarsePointerQuery.addEventListener('change', syncPointerMode);
  }
}

export function registerMoodRunServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;

  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker.register(swUrl).catch((error) => {
      console.warn('MoodRun service worker registration failed.', error);
    });
  });
}
