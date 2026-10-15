import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { COURSES } from '../content/registry';
import { dayKey } from '../domain/dates';
import { displayedStreak, levelFromXp } from '../domain/gamification';
import type { CourseMeta } from '../domain/types';
import { useLang, useT } from '../i18n';
import { useProgress } from '../store/progressStore';
import { OfflineChip, UpdateBanner } from '../pwa/PwaParts';

/** The globe with the Я (same drawing as the app icon, see tools/ and public/icons/). */
export function LogoMark() {
  return (
    <svg className="wordmark-logo" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <g transform="rotate(-20 32 32)" fill="none">
        <circle cx="32" cy="32" r="22" fill="var(--surface-2)" stroke="var(--accent)" strokeWidth="2.6" />
        <ellipse cx="32" cy="32" rx="9" ry="22" stroke="var(--accent)" strokeOpacity=".5" strokeWidth="1.6" />
        <ellipse cx="32" cy="32" rx="17" ry="22" stroke="var(--accent)" strokeOpacity=".3" strokeWidth="1.4" />
        <path d="M10 32h44M13.5 21h37M13.5 43h37" stroke="var(--accent)" strokeOpacity=".5" strokeWidth="1.6" />
      </g>
      <text x="32" y="41.5" textAnchor="middle" fill="var(--surface-2)" stroke="var(--surface-2)" strokeWidth="3.6" strokeLinejoin="round">
        Я
      </text>
      <text x="32" y="41.5" textAnchor="middle" fill="var(--accent)">
        Я
      </text>
    </svg>
  );
}

export function LangToggle() {
  const lang = useLang();
  const setLang = useProgress((s) => s.setLang);
  return (
    <div className="lang-toggle" role="group" aria-label="Language / Sprache">
      {(['de', 'en'] as const).map((l) => (
        <button key={l} type="button" className={lang === l ? 'is-active' : ''} aria-pressed={lang === l} onClick={() => setLang(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function FlameIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 2c1 3.5-1.5 5.5-1.5 8 0 1.4 1 2.5 2.3 2.5 1.6 0 2.4-1.4 2.2-3.3C17.6 11 19 13.2 19 15.5 19 19.6 15.9 22 12 22s-7-2.4-7-6.3C5 10.4 10.4 7.8 12 2z" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.75" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** The course menu closes with Escape, when the focus leaves it and after a choice. */
function CourseSwitch({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const close = (refocus: boolean) => {
    const d = ref.current;
    if (!d?.open) return;
    d.open = false;
    if (refocus) d.querySelector('summary')?.focus();
  };
  return (
    <details
      ref={ref}
      className="course-switch"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          close(true);
        }
      }}
      onBlur={(e) => {
        if (!ref.current?.contains(e.relatedTarget as Node | null)) close(false);
      }}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('a')) close(false);
      }}
    >
      {children}
    </details>
  );
}

export function TopBar({ course }: { course?: CourseMeta }) {
  const t = useT();
  const lang = useLang();
  const profile = useProgress((s) => s.root.profile);
  const streak = displayedStreak(profile.streak, dayKey());
  const level = levelFromXp(profile.xp);

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="topbar-left">
          <Link to="/" className="wordmark" aria-label={t('nav.home')}>
            <LogoMark />
            <span className="wordmark-text">Sylareads</span>
          </Link>
          {course && (
            <CourseSwitch>
              <summary aria-label={`${course.name[lang]} – ${t('nav.switchCourse')}`}>
                <span>{course.name[lang]}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </summary>
              <div className="course-switch-menu">
                {COURSES.map((c) =>
                  c.status === 'available' ? (
                    <Link key={c.id} to={`/${c.slug}`} className={c.id === course.id ? 'is-active' : ''}>
                      {c.name[lang]}
                    </Link>
                  ) : (
                    <span key={c.id} className="is-disabled">
                      {c.name[lang]} · {t('home.soon')}
                    </span>
                  ),
                )}
                <Link to="/scripts">{t('scripts.title')}</Link>
              </div>
            </CourseSwitch>
          )}
        </div>
        <div className="topbar-right">
          <OfflineChip />
          <span className={`chip chip-streak${streak > 0 ? ' is-on' : ''}`} title={t('chip.streak', { n: streak })}>
            <FlameIcon />
            <span aria-hidden="true">{streak}</span>
            <span className="sr-only">{t('chip.streak', { n: streak })}</span>
          </span>
          <span className="chip" title={t('chip.level', { n: level })}>
            <span aria-hidden="true">Lv {level}</span>
            <span className="sr-only">{t('chip.level', { n: level })}</span>
          </span>
          <LangToggle />
          <NavLink to="/profile" className="icon-btn" aria-label={t('nav.profile')} title={t('nav.profile')}>
            <ProfileIcon />
          </NavLink>
        </div>
      </div>
      <UpdateBanner />
    </header>
  );
}

export function CourseTabs({ course }: { course: CourseMeta }) {
  const t = useT();
  const base = `/${course.slug}`;
  const lang = useLang();
  const { pathname } = useLocation();
  const inner = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState(false);
  // Narrow phones: the active tab is always scrolled into view.
  useEffect(() => {
    const el = inner.current;
    if (!el) return;
    const check = () => setScrollable(el.scrollWidth > el.clientWidth + 1);
    check();
    const active = el.querySelector('a.active') as HTMLElement | null;
    if (active && el.scrollWidth > el.clientWidth) el.scrollLeft = Math.max(0, active.offsetLeft - (el.clientWidth - active.offsetWidth) / 2);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [pathname]);
  return (
    <nav className="course-tabs" aria-label={t('nav.courseSections', { course: course.name[lang] })}>
      <div className={`course-tabs-inner${scrollable ? ' is-scrollable' : ''}`} ref={inner}>
        <NavLink end to={base}>
          {t('nav.overview')}
        </NavLink>
        <NavLink to={`${base}/learn`}>{t('nav.learn')}</NavLink>
        <NavLink end to={`${base}/practice`}>
          {t('nav.practice')}
        </NavLink>
        <NavLink end to={`${base}/tempo`}>
          {t('nav.tempo')}
        </NavLink>
        <NavLink to={`${base}/script`}>{t('nav.script')}</NavLink>
        {course.hasMap && <NavLink to={`${base}/map`}>{t('nav.map')}</NavLink>}
      </div>
    </nav>
  );
}
