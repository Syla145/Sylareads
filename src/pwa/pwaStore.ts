import { create } from 'zustand';
import { SW_FILE } from './serviceWorker';

/**
 * App und offline in the browser: registers the service worker, notices when
 * everything is stored for offline use, when a new version waits, whether the
 * browser offers "install", and whether the device is online.
 */

/** Chrome/Edge/Android: the event behind "App installieren". Not in the DOM typings. */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallWay = 'installed' | 'prompt' | 'ios' | 'menu';

interface PwaState {
  /** The browser can keep Sylareads offline. */
  supported: boolean;
  /** Every file is stored: Sylareads works without network. */
  offlineReady: boolean;
  /** A new version is downloaded and waits for a reload. */
  updateReady: boolean;
  online: boolean;
  /** Running as an installed app (own window, no browser bar). */
  standalone: boolean;
  promptEvent: InstallPromptEvent | null;
  install: () => Promise<void>;
  applyUpdate: () => void;
}

const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

/** iPhone and iPad (iPadOS reports itself as a Mac with touch). */
const isIos = () =>
  typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

/** How this device can install the app. */
export function installWay(s: Pick<PwaState, 'standalone' | 'promptEvent'>, ios = isIos()): InstallWay {
  if (s.standalone) return 'installed';
  if (s.promptEvent) return 'prompt';
  return ios ? 'ios' : 'menu';
}

let waiting: ServiceWorker | null = null;

export const usePwa = create<PwaState>((set, get) => ({
  supported: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
  offlineReady: false,
  updateReady: false,
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  standalone: isStandalone(),
  promptEvent: null,
  install: async () => {
    const ev = get().promptEvent;
    if (!ev) return;
    await ev.prompt();
    const { outcome } = await ev.userChoice;
    set({ promptEvent: null });
    if (outcome === 'accepted') void keepStorage();
  },
  applyUpdate: () => {
    if (!waiting) return window.location.reload();
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
    waiting.postMessage({ type: 'skip-waiting' });
  },
}));

/** Ask the browser not to clear Sylareads' storage under pressure (progress lives there). */
async function keepStorage() {
  try {
    await navigator.storage?.persist?.();
  } catch {
    /* not supported */
  }
}

function watchWaiting(reg: ServiceWorkerRegistration) {
  const mark = (w: ServiceWorker | null) => {
    // Only an update waits: on the first install there is no controller yet.
    if (w && navigator.serviceWorker.controller) {
      waiting = w;
      usePwa.setState({ updateReady: true });
    }
  };
  mark(reg.waiting);
  reg.addEventListener('updatefound', () => {
    const w = reg.installing;
    w?.addEventListener('statechange', () => {
      if (w.state === 'installed') mark(w);
    });
  });
}

/** Call once at app start. Does nothing in development and in the single-file build. */
export function startPwa() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    usePwa.setState({ promptEvent: e as InstallPromptEvent });
  });
  window.addEventListener('appinstalled', () => {
    usePwa.setState({ promptEvent: null, standalone: true });
    void keepStorage();
  });
  window.addEventListener('online', () => usePwa.setState({ online: true }));
  window.addEventListener('offline', () => usePwa.setState({ online: false }));
  if (isStandalone()) void keepStorage();

  if (!import.meta.env.PROD || import.meta.env.MODE === 'single' || !usePwa.getState().supported) return;
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register(`./${SW_FILE}`);
      watchWaiting(reg);
      await navigator.serviceWorker.ready;
      usePwa.setState({ offlineReady: true });
      // Look for a new version now and then while the app stays open.
      setInterval(() => void reg.update().catch(() => {}), 60 * 60_000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void reg.update().catch(() => {});
      });
    } catch {
      usePwa.setState({ supported: false });
    }
  });
}
