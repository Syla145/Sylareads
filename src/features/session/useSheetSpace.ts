import { useEffect, type RefObject } from 'react';

/**
 * While the feedback sheet is open, the session gets two CSS variables:
 * `--sheet-h` (room under the task, so nothing hides behind the sheet) and
 * `--kb-inset` (height of the phone keyboard, so the sheet sits above it;
 * iOS keeps fixed elements at the bottom of the layout viewport otherwise).
 */
export function useSheetSpace(root: RefObject<HTMLElement | null>, sheet: RefObject<HTMLElement | null>, open: boolean) {
  useEffect(() => {
    const el = root.current;
    const sh = sheet.current;
    if (!el || !sh || !open) return;
    const vv = window.visualViewport;
    const update = () => {
      const inset = vv ? Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)) : 0;
      el.style.setProperty('--kb-inset', `${inset}px`);
      el.style.setProperty('--sheet-h', `${Math.ceil(sh.getBoundingClientRect().height) + inset}px`);
    };
    update();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    ro?.observe(sh);
    vv?.addEventListener('resize', update);
    vv?.addEventListener('scroll', update);
    return () => {
      ro?.disconnect();
      vv?.removeEventListener('resize', update);
      vv?.removeEventListener('scroll', update);
      el.style.removeProperty('--kb-inset');
      el.style.removeProperty('--sheet-h');
    };
  }, [root, sheet, open]);
}
