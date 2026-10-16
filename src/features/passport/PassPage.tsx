import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { COUNTRIES, COURSES } from '../../content/registry';
import { SCRIPT_ENTRIES } from '../../content/scripts/data';
import type { CourseIndex } from '../../domain/courseIndex';
import { alphabetStamp, countryPage, passSummary, scriptStamps, type CountryPage, type Stamp } from '../../domain/passport';
import { SCRIPT_BY_ID, SCRIPTS_COURSE_ID } from '../../domain/scriptCourse';
import type { CourseMeta } from '../../domain/types';
import { useLang, useT, type TKey } from '../../i18n';
import { useProgress } from '../../store/progressStore';
import { Button } from '../../ui/primitives';
import { TopBar } from '../../ui/TopBar';
import { loadCourseIndex } from '../course/useCourse';
import { SiteFooter } from '../legal/SiteFooter';
import { ScriptText } from '../scripts/ScriptParts';
import '../scripts/scripts.css';
import { StampView, useNewStamps } from './PassParts';
import './pass.css';

/** The script of a course alphabet in "Schriften erkennen" (counted once on the cover). */
const SCRIPT_OF: Record<string, string> = { Cyrl: 'scripts:cyrillic', Grek: 'scripts:greek', Beng: 'scripts:bengali', Thai: 'scripts:thai' };
const SCRIPTS_TAB = 'scripts';

const available = COURSES.filter((c) => c.status === 'available');

/** All course indexes (content and maps): the cover counts every country. */
function useAllIndexes(): { indexes: Map<string, CourseIndex>; failed: boolean; retry: () => void } {
  const [indexes, setIndexes] = useState(() => new Map<string, CourseIndex>());
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    setFailed(false);
    for (const c of available) {
      loadCourseIndex(c).then(
        (index) => alive && setIndexes((m) => new Map(m).set(c.id, index)),
        () => alive && setFailed(true),
      );
    }
    return () => {
      alive = false;
    };
  }, [attempt]);
  return { indexes, failed, retry: () => setAttempt((n) => n + 1) };
}

export default function PassPage() {
  const t = useT();
  const lang = useLang();
  const root = useProgress((s) => s.root);
  const [params, setParams] = useSearchParams();
  const { indexes, failed, retry } = useAllIndexes();

  // Opened from a course: that country first; otherwise the course learned last.
  const lastCourse = [...available].sort((a, b) => (root.courses[b.id]?.lastSessionAt ?? 0) - (root.courses[a.id]?.lastSessionAt ?? 0))[0];
  const tab = params.get('c') === SCRIPTS_TAB ? SCRIPTS_TAB : (available.find((c) => c.slug === params.get('c'))?.slug ?? lastCourse.slug);

  const pages = useMemo(() => {
    const out = new Map<string, CountryPage>();
    for (const c of available) {
      const index = indexes.get(c.id);
      if (index) out.set(c.id, countryPage(index, root.courses[c.id]?.items ?? {}));
    }
    return out;
  }, [indexes, root.courses]);

  const alphabets = useMemo(
    () =>
      available.flatMap((c) => {
        const index = indexes.get(c.id);
        return index ? [{ course: c, stamp: alphabetStamp(index, root.courses[c.id]?.items ?? {}, c.name), scriptId: SCRIPT_OF[c.scriptId] ?? c.scriptId }] : [];
      }),
    [indexes, root.courses],
  );

  const scripts = useMemo(
    () =>
      scriptStamps(
        SCRIPT_ENTRIES.map((e) => ({ id: e.id, name: e.name, sample: e.samples[0]?.native })),
        root.courses[SCRIPTS_COURSE_ID]?.items ?? {},
      ),
    [root.courses],
  );

  const complete = pages.size === available.length;
  const summary = complete ? passSummary([...pages.values()], alphabets, scripts) : null;
  const holder = root.profile.share?.name || t('pass.holder');

  const tabs = [...available.map((c) => ({ id: c.slug, label: COUNTRIES[c.countryIds[0]].name[lang] })), { id: SCRIPTS_TAB, label: t('pass.scripts') }];
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const select = (id: string) => setParams({ c: id }, { replace: true });
  const onTabKey = (e: KeyboardEvent, i: number) => {
    const next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : null;
    if (next === null) return;
    e.preventDefault();
    const j = (next + tabs.length) % tabs.length;
    select(tabs[j].id);
    tabRefs.current[j]?.focus();
  };

  const course = available.find((c) => c.slug === tab);

  return (
    <div className="app-shell">
      <TopBar />
      <main className="page pass-page">
        <section className="pass-cover" aria-labelledby="pass-title">
          <span className="pass-ring pass-ring-1" aria-hidden="true" />
          <span className="pass-ring pass-ring-2" aria-hidden="true" />
          <h1 id="pass-title" className="pass-kicker">
            {t('pass.title')}
          </h1>
          <p className="pass-holder">{holder}</p>
          <dl className="pass-stats">
            <div>
              <dt>{t('pass.stamps')}</dt>
              <dd className="tabular">{summary ? summary.stamps : '–'}</dd>
            </div>
            <div>
              <dt>{t('pass.countries')}</dt>
              <dd className="tabular">{summary ? summary.countries : '–'}</dd>
            </div>
            <div>
              <dt>{t('pass.scriptsCount')}</dt>
              <dd className="tabular">{summary ? summary.scripts : '–'}</dd>
            </div>
          </dl>
        </section>

        <div className="pass-tabs" role="tablist" aria-label={t('pass.tabs')}>
          {tabs.map((x, i) => (
            <button
              key={x.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`pass-tab-${x.id}`}
              aria-selected={tab === x.id}
              aria-controls="pass-panel"
              tabIndex={tab === x.id ? 0 : -1}
              className={`pass-tab${tab === x.id ? ' is-active' : ''}`}
              onClick={() => select(x.id)}
              onKeyDown={(e) => onTabKey(e, i)}
            >
              {x.label}
            </button>
          ))}
        </div>

        <div id="pass-panel" role="tabpanel" aria-labelledby={`pass-tab-${tab}`} className="pass-paper">
          {failed && !complete ? (
            <div className="pass-loading">
              <p>{t('common.loadFailed')}</p>
              <Button onClick={retry}>{t('common.retry')}</Button>
            </div>
          ) : tab === SCRIPTS_TAB ? (
            <ScriptsPage alphabets={alphabets} scripts={scripts} />
          ) : course && pages.get(course.id) ? (
            <CountryPageView course={course} page={pages.get(course.id)!} />
          ) : (
            <p className="pass-loading" role="status">
              {t('pass.loading')}
            </p>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function CountryPageView({ course, page }: { course: CourseMeta; page: CountryPage }) {
  const t = useT();
  const done = page.stamps.filter((s) => s.done).length;
  const sureAreas = page.areas.filter((a) => a.sure).length;
  const fresh = useNewStamps(page.stamps);
  return (
    <div className={course.fontClass}>
      <div className="pass-section-head">
        <h2>{t(`pass.group.${page.groupKind}` as TKey)}</h2>
        <span className="tabular">{t('pass.of', { n: done, total: page.stamps.length })}</span>
      </div>
      <ul className="stamp-grid">
        {page.stamps.map((s, i) => (
          <li key={s.id}>
            <StampView stamp={s} index={i} lang={course.languageId} fresh={fresh.has(s.id)} />
          </li>
        ))}
      </ul>

      <div className="pass-section-head is-split">
        <h2>{t(`pass.area.${page.areaKind}` as TKey)}</h2>
        <span className="tabular">{t('pass.of', { n: sureAreas, total: page.areas.length })}</span>
      </div>
      <ul className="pass-dots" aria-label={t('pass.dotsLabel', { n: sureAreas, total: page.areas.length })}>
        {page.areas.map((a) => (
          <li key={a.id} className={a.sure ? `is-sure ink-${a.group % 8}` : undefined} aria-hidden="true" />
        ))}
      </ul>
      <p className="pass-rule">{t('pass.rule', { areas: t(`pass.area.${page.areaKind}` as TKey), group: t(`pass.groupOne.${page.groupKind}` as TKey) })}</p>
      <Link className="pass-go" to={`/${course.slug}/${course.hasMap ? 'map' : 'practice'}`}>
        {course.hasMap ? t('pass.toMap') : t('pass.toPractice')}
      </Link>
    </div>
  );
}

function ScriptsPage({ alphabets, scripts }: { alphabets: { course: CourseMeta; stamp: Stamp }[]; scripts: Stamp[] }) {
  const t = useT();
  const done = scripts.filter((s) => s.done).length;
  const fresh = useNewStamps([...alphabets.map((a) => a.stamp), ...scripts]);
  return (
    <div>
      <div className="pass-section-head">
        <h2>{t('pass.alphabets')}</h2>
        <span className="tabular">{t('pass.of', { n: alphabets.filter((a) => a.stamp.done).length, total: alphabets.length })}</span>
      </div>
      <ul className="stamp-grid">
        {alphabets.map((a, i) => (
          <li key={a.stamp.id} className={a.course.fontClass}>
            <StampView stamp={a.stamp} index={i} lang={a.course.languageId} fresh={fresh.has(a.stamp.id)} />
          </li>
        ))}
      </ul>
      <p className="pass-rule">{t('pass.alphabetRule')}</p>

      <div className="pass-section-head is-split">
        <h2>{t('scripts.title')}</h2>
        <span className="tabular">{t('pass.of', { n: done, total: scripts.length })}</span>
      </div>
      <ul className="stamp-grid">
        {scripts.map((s, i) => {
          const entry = SCRIPT_BY_ID.get(s.id)!;
          return (
            <li key={s.id}>
              <StampView stamp={s} index={i + 3} fresh={fresh.has(s.id)} native={<ScriptText entry={entry}>{s.native}</ScriptText>} />
            </li>
          );
        })}
      </ul>
      <p className="pass-rule">{t('pass.scriptRule')}</p>
      <Link className="pass-go" to="/scripts">
        {t('pass.toScripts')}
      </Link>
    </div>
  );
}
