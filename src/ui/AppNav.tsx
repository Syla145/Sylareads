import { Link, NavLink, useLocation } from 'react-router-dom';
import { COURSES, courseBySlug } from '../content/registry';
import type { CourseMeta } from '../domain/types';
import { useLang, useT } from '../i18n';
import { useProgress } from '../store/progressStore';
import { LogoMark } from './TopBar';

/**
 * The app's main navigation: a tab bar at the bottom on phones (thumb reach),
 * a sidebar on wide screens. Course pages point to the course in the address;
 * elsewhere to the course learned last.
 */
export function AppNav() {
  const t = useT();
  const lang = useLang();
  const { pathname } = useLocation();
  const { course, started } = useCurrentCourse(pathname);
  const base = `/${course.slug}`;
  const inCourse = pathname === base || pathname.startsWith(`${base}/`);
  const at = (...ps: string[]) => ps.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // Start is the course you are learning (its overview); before any course: the course list.
  const items: { to: string; label: string; icon: React.ReactNode; active: boolean }[] = [
    { to: started || inCourse ? base : '/', label: t('nav.start'), icon: <HomeIcon />, active: pathname === '/' || pathname === base },
    { to: `${base}/learn`, label: t('nav.learn'), icon: <PathIcon />, active: at(`${base}/learn`) || (course.hasMap ? at(`${base}/script`) : false) },
    { to: `${base}/practice`, label: t('nav.practice'), icon: <BoltIcon />, active: at(`${base}/practice`, `${base}/tempo`) },
    course.hasMap
      ? { to: `${base}/map`, label: t('nav.map'), icon: <MapIcon />, active: at(`${base}/map`) }
      : { to: `${base}/script`, label: t('nav.script'), icon: <GlyphIcon />, active: at(`${base}/script`) },
    { to: '/profile', label: t('nav.profile'), icon: <PersonIcon />, active: at('/profile') },
  ];

  return (
    <nav className="app-nav" aria-label={t('nav.main')}>
      <Link to="/" className="app-nav-brand">
        <LogoMark />
        <span>Sylareads</span>
      </Link>
      <ul className="app-nav-items">
        {items.map((it) => (
          <li key={it.to}>
            <Link to={it.to} className={`app-nav-item${it.active ? ' is-active' : ''}`} aria-current={it.active ? 'page' : undefined}>
              {it.icon}
              <span>{it.label}</span>
            </Link>
          </li>
        ))}
        {/* Only in the sidebar: on phones the pass is reached from the course page and the profile. */}
        <li className="app-nav-wide">
          <Link to="/pass" className={`app-nav-item${at('/pass') ? ' is-active' : ''}`} aria-current={at('/pass') ? 'page' : undefined}>
            <PassIcon />
            <span>{t('nav.pass')}</span>
          </Link>
        </li>
      </ul>
      <div className="app-nav-courses">
        <p className="app-nav-heading">{t('nav.courses')}</p>
        <ul>
          {COURSES.filter((c) => c.status === 'available').map((c) => (
            <li key={c.id}>
              <NavLink to={`/${c.slug}`} className={`app-nav-course${c.id === course.id && inCourse ? ' is-active' : ''}`}>
                <span className={`app-nav-glyph ${c.fontClass}`} aria-hidden="true">
                  {navGlyph(c.sampleGlyphs)}
                </span>
                {c.name[lang]}
              </NavLink>
            </li>
          ))}
          <li>
            <NavLink to="/scripts" className={({ isActive }) => `app-nav-course${isActive ? ' is-active' : ''}`}>
              <span className="app-nav-glyph" aria-hidden="true">
                ש
              </span>
              {t('scripts.title')}
            </NavLink>
          </li>
          <li>
            <NavLink to="/players" className={({ isActive }) => `app-nav-course${isActive ? ' is-active' : ''}`}>
              <span className="app-nav-glyph" aria-hidden="true">
                ●
              </span>
              {t('nav.players')}
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}

/** The course in the address, else the one learned last, else the first (`started`: any course begun). */
function useCurrentCourse(pathname: string): { course: CourseMeta; started: boolean } {
  const courses = useProgress((s) => s.root.courses);
  const available = COURSES.filter((c) => c.status === 'available');
  let best: CourseMeta | undefined;
  let bestAt = 0;
  for (const c of available) {
    const at = courses[c.id]?.lastSessionAt ?? 0;
    if (at > bestAt) {
      bestAt = at;
      best = c;
    }
  }
  const fromPath = courseBySlug(pathname.split('/')[1]);
  const course = fromPath && fromPath.status === 'available' ? fromPath : (best ?? available[0]);
  return { course, started: !!best };
}

const Svg = ({ children }: { children: React.ReactNode }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
const HomeIcon = () => (
  <Svg>
    <path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" />
  </Svg>
);
const MapIcon = () => (
  <Svg>
    <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
    <path d="M9 4v14M15 6v14" />
  </Svg>
);
const GlyphIcon = () => (
  <Svg>
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path d="M9 16l3-8 3 8M10.2 13h3.6" />
  </Svg>
);
const PathIcon = () => (
  <Svg>
    <path d="M7 18.5c0-3.5 10-3 10-6.5S7 9 7 5.5" />
    <circle cx="7" cy="19" r="2.2" fill="currentColor" stroke="none" />
    <circle cx="7" cy="5" r="2.2" fill="currentColor" stroke="none" />
  </Svg>
);
const PassIcon = () => (
  <Svg>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <circle cx="12" cy="11" r="3" />
    <path d="M9 17h6" />
  </Svg>
);
const BoltIcon = () => (
  <Svg>
    <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
  </Svg>
);
const PersonIcon = () => (
  <Svg>
    <circle cx="12" cy="8.5" r="3.8" />
    <path d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
  </Svg>
);

/** A sample glyph that does not look like a Latin letter (Б instead of А). */
function navGlyph(sample: string): string {
  const glyphs = sample.split(' ').filter(Boolean);
  return glyphs.find((g) => !/^[AАΑBВΒEЕΕKКΚMМΜHНΗOОΟPРΡCСTТΤXХΧYУΥIΙJ]$/u.test(g)) ?? glyphs[0] ?? '';
}
