import { useLayoutEffect } from 'react';

/**
 * Every new task starts at the top: after scrolling down to "Weiter", the next
 * character must not be out of view.
 */
export function useScrollTop(key: unknown) {
  useLayoutEffect(() => {
    if (window.scrollY > 0) window.scrollTo({ top: 0 });
  }, [key]);
}
