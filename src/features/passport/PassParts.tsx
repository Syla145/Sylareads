import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { COUNTRIES, COURSES } from '../../content/registry';
import type { CourseIndex } from '../../domain/courseIndex';
import { countryPage, newStamps, stampLook, type Stamp } from '../../domain/passport';
import type { ProgressRoot } from '../../domain/progress';
import type { CourseMeta, L10n } from '../../domain/types';
import { useLang, useT } from '../../i18n';
import { useProgress } from '../../store/progressStore';
import './pass.css';

/** "Division Dhaka" → "Dhaka", "Föderationskreis Zentralrussland" → "Zentralrussland". */
export function shortName(name: L10n, lang: 'de' | 'en'): string {
  return name[lang].replace(/^(Division|Föderationskreis)\s+/, '').replace(/\s+(Division|Federal District)$/, '');
}

/** Word parts of long compound names: a soft hyphen before them lets the name wrap nicely. */
const PARTS = ['russland', 'makedonien', 'griechenland', 'thailand', 'kaukasus', 'thrakien'];

/** "Zentralmakedonien" → "Zentral\u00ADmakedonien" (wraps as "Zentral-/makedonien" when needed). */
export function softHyphens(text: string): string {
  return text
    .split(' ')
    .map((w) => {
      const lower = w.toLowerCase();
      const part = PARTS.find((p) => lower.endsWith(p) && lower.length - p.length >= 3);
      return part ? `${w.slice(0, w.length - part.length)}\u00AD${w.slice(w.length - part.length)}` : w;
    })
    .join(' ');
}

/** Long words shrink so they fit the round stamp (hyphenation is not available everywhere). */
function fit(text: string, fits: number): number {
  const longest = Math.max(...text.split(/[\s()/\u00AD-]+/).map((w) => w.length));
  return Math.min(1, fits / Math.max(1, longest));
}

const SEEN_KEY = 'sylareads.passSeen';

function readSeen(): Set<string> | null {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : null;
  } catch {
    return null;
  }
}

/**
 * Stamps earned since this device last showed the pass: they are pressed
 * onto the page once (animation). The first visit shows everything as is.
 */
export function useNewStamps(stamps: Stamp[]): Set<string> {
  const doneIds = stamps.filter((s) => s.done).map((s) => s.id);
  const key = doneIds.join('|');
  const [fresh] = useState(() => {
    const seen = readSeen();
    return new Set(seen ? doneIds.filter((id) => !seen.has(id)) : []);
  });
  useEffect(() => {
    try {
      const seen = readSeen() ?? new Set<string>();
      for (const id of key.split('|')) if (id) seen.add(id);
      window.localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
    } catch {
      /* storage blocked: no animation next time either */
    }
  }, [key]);
  return fresh;
}

/** One stamp: pressed (native name, Latin name, tilted, coloured ink) or still an empty dashed space. */
export function StampView({ stamp, index, lang, fresh = false, native }: { stamp: Stamp; index: number; lang?: string; fresh?: boolean; native?: ReactNode }) {
  const t = useT();
  const ui = useLang();
  const name = softHyphens(shortName(stamp.name, ui));
  if (!stamp.done) {
    return (
      <div className="stamp is-empty">
        <span className="stamp-name" style={{ fontSize: `${0.625 * fit(name, 12)}rem` }}>
          {name}
        </span>
        {stamp.total > 1 && <span className="stamp-progress tabular">{stamp.sure}/{stamp.total}</span>}
        <span className="sr-only">{t('pass.notYet')}</span>
      </div>
    );
  }
  const look = stampLook(stamp.id, index);
  return (
    <div className={`stamp is-done shape-${look.shape} ink-${index % 8}${fresh ? ' is-new' : ''}`} style={{ ['--rot' as string]: `${look.rotate}deg` }}>
      <span className="stamp-native" lang={native ? undefined : lang}>
        {native ?? stamp.native}
      </span>
      <span className="stamp-latin" style={{ fontSize: `${0.5625 * fit(name, 9)}rem` }}>
        {name}
      </span>
      <span className="sr-only">{t('pass.stamped')}</span>
    </div>
  );
}

/** Small card on the course page: stamps of this country, link to the pass. */
export function PassMini({ meta, index }: { meta: CourseMeta; index: CourseIndex }) {
  const t = useT();
  const lang = useLang();
  const items = useProgress((s) => s.root.courses[meta.id]?.items);
  const page = useMemo(() => countryPage(index, items ?? {}), [index, items]);
  const done = page.stamps.filter((s) => s.done).length;
  const sureAreas = page.areas.filter((a) => a.sure).length;
  return (
    <Link to={`/pass?c=${meta.slug}`} className="pass-mini">
      <span className="pass-mini-book" aria-hidden="true">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <circle cx="12" cy="11" r="3" />
          <path d="M9 17h6" />
        </svg>
      </span>
      <span className="pass-mini-text">
        <span className="pass-mini-title">{t('pass.title')}</span>
        <span className="pass-mini-sub">
          {COUNTRIES[page.countryId]?.name[lang]} · {t('pass.miniStamps', { n: done, total: page.stamps.length })} · {t('pass.of', { n: sureAreas, total: page.areas.length })} {t(`pass.area.${page.areaKind}`)}
        </span>
      </span>
      <span className="pass-mini-go" aria-hidden="true">
        ›
      </span>
    </Link>
  );
}

/** Profile: the way to the pass (counts need every course, they are on the pass itself). */
export function PassLink() {
  const t = useT();
  return (
    <Link to="/pass" className="pass-mini">
      <span className="pass-mini-book" aria-hidden="true">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <circle cx="12" cy="11" r="3" />
          <path d="M9 17h6" />
        </svg>
      </span>
      <span className="pass-mini-text">
        <span className="pass-mini-title">{t('pass.title')}</span>
        <span className="pass-mini-sub">{t('pass.linkSub')}</span>
      </span>
      <span className="pass-mini-go" aria-hidden="true">
        ›
      </span>
    </Link>
  );
}

/** Result screens: stamps earned in this session. */
export function NewStampsList({ index, before, after }: { index: CourseIndex; before: ProgressRoot; after: ProgressRoot }) {
  const t = useT();
  const lang = useLang();
  const id = index.content.id;
  const gained = useMemo(
    () => newStamps(countryPage(index, before.courses[id]?.items ?? {}).stamps, countryPage(index, after.courses[id]?.items ?? {}).stamps),
    [index, before, after, id],
  );
  if (!gained.length) return null;
  return (
    <section className="complete-block pass-gained">
      <h2 className="card-label">{t('pass.newStamp')}</h2>
      <ul>
        {gained.map((s) => (
          <li key={s.id}>
            <Link to={`/pass?c=${COURSES.find((c) => c.id === id)?.slug ?? ''}`}>{shortName(s.name, lang)}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
