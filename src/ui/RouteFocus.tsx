import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { COURSES } from '../content/registry';
import { useLang, useT } from '../i18n';

/**
 * After every page change: the browser tab (and the app switcher) names the
 * page – "Karte · Bengali – Sylareads" – and keyboard and screen-reader users
 * land on the page heading instead of the top of the document.
 *
 * The title follows the page's h1, which can arrive later (course content is
 * loaded on demand), so it is kept up to date while the page is shown.
 */
export function RouteFocus() {
  const { pathname } = useLocation();
  const lang = useLang();
  const t = useT();
  const first = useRef(true);

  useEffect(() => {
    const slug = pathname.split('/')[1] ?? '';
    const course = COURSES.find((c) => c.slug === slug);
    const area = course ? course.name[lang] : slug === 'scripts' ? t('scripts.title') : undefined;

    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const head = document.querySelector('h1')?.textContent?.trim();
        const parts = [head, area].filter((x, i, all): x is string => !!x && x !== 'Sylareads' && all.indexOf(x) === i);
        const title = parts.length ? `${parts.join(' · ')} – Sylareads` : 'Sylareads';
        if (document.title !== title) document.title = title;
      });
    };
    update();
    const watch = new MutationObserver(update);
    watch.observe(document.body, { childList: true, subtree: true, characterData: true });

    // Not on the first load (the page starts at the top anyway), and never
    // when the page already put the focus somewhere (e.g. the answer field).
    const isFirst = first.current;
    first.current = false;
    const timer = isFirst
      ? undefined
      : window.setTimeout(() => {
          const active = document.activeElement;
          if (active && active !== document.body && document.body.contains(active)) return;
          const h1 = document.querySelector('h1') as HTMLElement | null;
          if (!h1) return;
          if (!h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1');
          h1.focus({ preventScroll: true });
        }, 60);

    return () => {
      watch.disconnect();
      cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
    };
  }, [pathname, lang, t]);

  return null;
}
