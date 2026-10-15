import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/geist';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/inter';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/nav.css';
import { App } from './App';
import { installFlushHandlers } from './store/persistence';
import { useProgress } from './store/progressStore';
import { startSync } from './sync/syncStore';
import { startPresence } from './sync/presenceStore';
import { startPwa } from './pwa/pwaStore';

// The page language right away (the HTML says "en" until the app knows better).
document.documentElement.lang = useProgress.getState().root.settings.uiLang;
installFlushHandlers();
startSync();
startPresence();
startPwa();

// After a new deployment the file names change. A tab that still runs the old
// version then requests files that no longer exist (404): reload once to get
// the new version instead of failing.
window.addEventListener('vite:preloadError', (event) => {
  const key = 'sylareads.reloadedAt';
  let last = 0;
  try {
    last = Number(sessionStorage.getItem(key)) || 0;
    sessionStorage.setItem(key, String(Date.now()));
  } catch {
    /* storage blocked: reload anyway */
  }
  // Offline the reload would only show the browser's error page: the app shows "Nochmal versuchen" instead.
  if (navigator.onLine !== false && Date.now() - last > 10000) {
    event.preventDefault();
    window.location.reload();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
