import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const GUARD = 'sylareadsGuard';
const isGuard = (state: unknown) => !!(state && typeof state === 'object' && (state as Record<string, unknown>)[GUARD]);

/**
 * Keeps the browser's back button and the iPhone's swipe-back from ending a
 * running session without asking. While `active`, one extra history entry
 * (same address) sits on top; going back lands on the entry below, the
 * guard puts its entry back and calls `onBack` (which opens the quit dialog).
 *
 * Returns `leave(go)`: removes the guard entry first, then runs `go` (the
 * navigation after "Beenden"), so going back afterwards works as usual.
 * When the session ends normally (inactive or unmounted), the entry is
 * removed again.
 */
export function useBackGuard(active: boolean, onBack: () => void): (go: () => void) => void {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;
  const armed = useRef(false);

  useEffect(() => {
    if (!active) return;
    if (!armed.current) {
      window.history.pushState({ ...(window.history.state ?? {}), [GUARD]: true }, '');
      armed.current = true;
    }
    const onPop = (e: PopStateEvent) => {
      // Landing on a guard entry is not leaving (a leftover entry from a double start).
      if (!armed.current || isGuard(e.state)) return;
      window.history.pushState({ ...(window.history.state ?? {}), [GUARD]: true }, '');
      onBackRef.current();
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [active]);

  // Finished or left by other means: take the guard entry away again.
  useEffect(() => {
    if (active || !armed.current) return;
    armed.current = false;
    if (isGuard(window.history.state)) window.history.back();
  }, [active]);
  useEffect(
    () => () => {
      if (armed.current && isGuard(window.history.state)) {
        armed.current = false;
        window.history.back();
      }
    },
    [],
  );

  return useCallback((go: () => void) => {
    if (!armed.current || !isGuard(window.history.state)) {
      armed.current = false;
      go();
      return;
    }
    armed.current = false;
    const after = () => {
      window.removeEventListener('popstate', after);
      go();
    };
    window.addEventListener('popstate', after);
    window.history.back();
  }, []);
}

/**
 * "Back to where you came from" after quitting a session: one step back in
 * the history, or the given page when the session was opened directly by a
 * link (nothing of this app before it).
 */
export function useGoBack(fallback: string): () => void {
  const navigate = useNavigate();
  const { key } = useLocation();
  return useCallback(() => (key !== 'default' ? navigate(-1) : navigate(fallback, { replace: true })), [fallback, key, navigate]);
}
