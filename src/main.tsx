import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource/noto-sans-bengali/400.css';
import '@fontsource/noto-sans-bengali/500.css';
import '@fontsource/noto-sans-thai-looped/400.css';
import '@fontsource/noto-sans-thai-looped/500.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import { App } from './App';
import { installFlushHandlers } from './store/persistence';
import { startSync } from './sync/syncStore';
import { startPresence } from './sync/presenceStore';
import { startPwa } from './pwa/pwaStore';

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
  if (Date.now() - last > 10000) {
    event.preventDefault();
    window.location.reload();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
