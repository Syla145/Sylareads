import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { COUNTRIES, COURSES } from '../../content/registry';
import type { CourseIndex } from '../../domain/courseIndex';
import { courseStats } from '../../domain/stats';
import type { CourseMeta } from '../../domain/types';
import { formatPercent, useLang, useT } from '../../i18n';
import { useProgress } from '../../store/progressStore';
import { Button, ButtonLink, ProgressBar } from '../../ui/primitives';
import { TopBar } from '../../ui/TopBar';
import { loadCourseIndex } from '../course/useCourse';
import { recommendedPath } from '../dashboard/recommend';
import { mapGoalCounts, mapLayer } from '../map/layer';
import { useSync } from '../../sync/syncStore';
import { SCRIPT_ENTRIES } from '../../content/scripts/data';
import { PlayersStrip } from '../players/PlayersPage';
import { nextScriptLesson, SCRIPTS_COURSE_ID, scriptsKnown, scriptsStarted } from '../../domain/scriptCourse';
import type { CourseProgress } from '../../domain/progress';

/** The cross-script course: which script, which country. */
function ScriptsCourseCard() {
  const t = useT();
  const navigate = useNavigate();
  const items = useProgress((s) => s.root.courses[SCRIPTS_COURSE_ID]?.items);
  const total = SCRIPT_ENTRIES.length;
  const started = items ? scriptsStarted(items) : 0;
  const known = items ? scriptsKnown(items) : 0;
  return (
    <article className="course-card font-native-latin">
      <div className="course-card-glyphs" aria-hidden="true">
        Ж Ω ก অ
      </div>
      <div className="course-card-body">
        <h2 className="course-card-title">
          <Link to="/scripts">{t('scripts.title')}</Link>
        </h2>
        <p className="course-card-countries">{t('scripts.card', { n: total })}</p>
        {started > 0 && (
          <div className="course-card-progress">
            <ProgressBar value={known / total} size="sm" label={t('scripts.known', { n: known, total })} />
            <span className="course-card-facts">{t('scripts.known', { n: known, total })}</span>
          </div>
        )}
      </div>
      <div className="course-card-actions">
        <Button variant="primary" onClick={() => navigate('/scripts')}>
          {started ? t('home.continue') : t('home.startLearning')}
        </Button>
        {started > 0 && <Button onClick={() => navigate('/scripts/practice')}>{t('home.practice')}</Button>}
      </div>
    </article>
  );
}

function CourseCard({ meta }: { meta: CourseMeta }) {
  const t = useT();
  const lang = useLang();
  const navigate = useNavigate();
  const cp = useProgress((s) => s.root.courses[meta.id]);
  const [index, setIndex] = useState<CourseIndex | null>(null);
  const started = !!cp && (Object.keys(cp.items).length > 0 || Object.keys(cp.lessons).length > 0);

  useEffect(() => {
    if (meta.status === 'available' && started) loadCourseIndex(meta).then(setIndex);
  }, [meta, started]);

  const stats = index && started ? courseStats(index, cp) : null;
  const map = index?.map && cp ? mapGoalCounts(index, cp.items) : null;
  const countries = meta.countryIds.map((id) => COUNTRIES[id].name[lang]).join(' · ');
  const soon = meta.status !== 'available';

  return (
    <article className={`course-card ${meta.fontClass}${soon ? ' is-soon' : ''}`}>
      <div className="course-card-glyphs" aria-hidden="true">
        {meta.sampleGlyphs}
      </div>
      <div className="course-card-body">
        <h2 className="course-card-title">
          {soon ? meta.name[lang] : <Link to={`/${meta.slug}`}>{meta.name[lang]}</Link>}
        </h2>
        <p className="course-card-countries">{countries}</p>
        {stats && (
          <div className="course-card-progress">
            <ProgressBar value={stats.mastery} size="sm" label={t('home.mastery', { n: formatPercent(stats.mastery) })} />
            <span>{t('home.mastery', { n: formatPercent(stats.mastery) })}</span>
            <span className="course-card-facts">
              {t('home.lessonsDone', { n: stats.completedLessons, total: index!.content.lessons.length })}
              {map && ` · ${t('home.mapGoal', { n: map.sure, total: map.total, what: t(`map.what.${mapLayer(index!)}`) })}`}
            </span>
          </div>
        )}
      </div>
      <div className="course-card-actions">
        {soon ? (
          <span className="badge">{t('home.soon')}</span>
        ) : started ? (
          <>
            <Button variant="primary" onClick={() => navigate(index ? recommendedPath(meta, index, cp) : `/${meta.slug}`)}>
              {t('home.continue')}
            </Button>
            <Button onClick={() => navigate(`/${meta.slug}/practice/run?mode=smart`)}>{t('home.practice')}</Button>
          </>
        ) : (
          <Button variant="primary" onClick={() => navigate(`/${meta.slug}`)}>
            {t('home.startLearning')}
          </Button>
        )}
      </div>
    </article>
  );
}

export function HomePage() {
  const t = useT();
  // Signed in: who is around comes first; otherwise a short hint below the courses.
  const signedIn = useSync((s) => !!s.user);
  const courses = useProgress((s) => s.root.courses);
  const entries = homeEntries(courses);
  const started = entries.filter((e) => e.started).sort((a, b) => b.lastAt - a.lastAt);
  const fresh = entries.filter((e) => !e.started);
  const [latest, ...others] = started;

  return (
    <div className="app-shell">
      <TopBar />
      <main className="page home">
        <section className={`hero${latest ? ' hero-compact' : ''}`}>
          <h1 className="hero-title">Sylareads</h1>
          <p className="hero-claim">{t('claim')}</p>
          <p className="hero-sub">{t('subline')}</p>
        </section>
        {signedIn && <PlayersStrip />}
        {latest ? (
          <>
            <ContinueCard entry={latest} />
            {others.length > 0 && (
              <section aria-labelledby="home-mine">
                <h2 id="home-mine" className="section-label">
                  {t('home.yourCourses')}
                </h2>
                <ul className="course-rows">
                  {others.map((e) => (
                    <CourseRow key={e.id} entry={e} />
                  ))}
                </ul>
              </section>
            )}
            {fresh.length > 0 && (
              <section aria-labelledby="home-more">
                <h2 id="home-more" className="section-label">
                  {t('home.moreCourses')}
                </h2>
                <ul className="course-rows">
                  {fresh.map((e) => (
                    <CourseRow key={e.id} entry={e} />
                  ))}
                </ul>
              </section>
            )}
          </>
        ) : (
          <section className="course-grid" aria-label="Courses">
            {COURSES.map((c) => (
              <CourseCard key={c.id} meta={c} />
            ))}
            <ScriptsCourseCard />
          </section>
        )}
        {!signedIn && <PlayersStrip />}
        <StorageNote />
      </main>
    </div>
  );
}

/** One course on the home page: a language course (with content to load) or the scripts course. */
type HomeEntry = { id: string; started: boolean; lastAt: number; meta: CourseMeta | null };

function homeEntries(courses: Record<string, CourseProgress>): HomeEntry[] {
  const begun = (cp: CourseProgress | undefined) => !!cp && (Object.keys(cp.items).length > 0 || Object.keys(cp.lessons).length > 0);
  const list: HomeEntry[] = COURSES.filter((m) => m.status === 'available').map((meta) => ({
    id: meta.id,
    meta,
    started: begun(courses[meta.id]),
    lastAt: courses[meta.id]?.lastSessionAt ?? courses[meta.id]?.startedAt ?? 0,
  }));
  const sc = courses[SCRIPTS_COURSE_ID];
  list.push({ id: SCRIPTS_COURSE_ID, meta: null, started: begun(sc), lastAt: sc?.lastSessionAt ?? sc?.startedAt ?? 0 });
  return list;
}

/** Everything a home entry shows: name, sample glyphs, progress and where "continue" leads. */
interface EntryView {
  name: string;
  glyphs: string;
  fontClass: string;
  overview: string;
  pct: number | null;
  facts: string;
  next: { title: string; path: string; button: string } | null;
}

function useEntryView(entry: HomeEntry): EntryView {
  const t = useT();
  const lang = useLang();
  const cp = useProgress((s) => s.root.courses[entry.id]);
  const [index, setIndex] = useState<CourseIndex | null>(null);
  const meta = entry.meta;
  useEffect(() => {
    if (meta && entry.started) loadCourseIndex(meta).then(setIndex);
  }, [meta, entry.started]);

  if (!meta) {
    const items = cp?.items ?? {};
    const known = scriptsKnown(items);
    const total = SCRIPT_ENTRIES.length;
    const lesson = nextScriptLesson(cp?.lessons);
    return {
      name: t('scripts.title'),
      glyphs: 'Ж Ω ก অ',
      fontClass: 'font-native-latin',
      overview: '/scripts',
      pct: entry.started ? Math.round((known / total) * 100) : null,
      facts: entry.started ? t('scripts.known', { n: known, total }) : t('scripts.card', { n: total }),
      next: lesson
        ? { title: `${t('learn.lesson', { n: lesson.number })} · ${lesson.title[lang]}`, path: `/scripts/lesson/${lesson.id}`, button: t('dash.btn.lesson') }
        : { title: t('dash.rec.mixed'), path: '/scripts/practice', button: t('home.practice') },
    };
  }
  const countries = meta.countryIds.map((id) => COUNTRIES[id].name[lang]).join(' · ');
  const view: EntryView = { name: meta.name[lang], glyphs: meta.sampleGlyphs, fontClass: meta.fontClass, overview: `/${meta.slug}`, pct: null, facts: countries, next: null };
  if (!index || !entry.started) return view;
  const stats = courseStats(index, cp);
  const rec = stats.recommendation;
  const recLesson = rec.kind === 'lesson' ? index.content.lessons.find((l) => l.id === rec.lessonId) : undefined;
  const map = index.map && cp ? mapGoalCounts(index, cp.items) : null;
  return {
    ...view,
    pct: formatPercent(stats.mastery),
    facts:
      t('home.lessonsDone', { n: stats.completedLessons, total: index.content.lessons.length }) +
      (map ? ` · ${t('home.mapGoal', { n: map.sure, total: map.total, what: t(`map.what.${mapLayer(index)}`) })}` : ''),
    next: {
      title: recLesson
        ? `${t('learn.lesson', { n: recLesson.number })} · ${recLesson.title[lang]}`
        : rec.kind === 'review'
          ? t('dash.rec.review', { n: rec.due })
          : rec.kind === 'weak'
            ? t('dash.rec.weak', { n: rec.count })
            : t('dash.rec.mixed'),
      path: recommendedPath(meta, index, cp),
      button: recLesson ? t('dash.btn.lesson') : rec.kind === 'review' ? t('dash.btn.review') : rec.kind === 'weak' ? t('dash.trainWeak') : t('dash.btn.mixed'),
    },
  };
}

/** The course of the last session, with its next step as the main button. */
function ContinueCard({ entry }: { entry: HomeEntry }) {
  const t = useT();
  const navigate = useNavigate();
  const v = useEntryView(entry);
  return (
    <article className={`continue-card ${v.fontClass}`} aria-labelledby="continue-title">
      <p className="card-label">{t('home.continueTitle')}</p>
      <div className="continue-head">
        <span className="continue-glyphs" aria-hidden="true">
          {v.glyphs}
        </span>
        <h2 id="continue-title" className="course-card-title">
          <Link to={v.overview}>{v.name}</Link>
        </h2>
        {v.pct !== null && <span className="continue-pct tabular">{v.pct} %</span>}
      </div>
      {v.pct !== null && <ProgressBar value={v.pct / 100} size="sm" label={t('home.mastery', { n: v.pct })} />}
      <p className="muted small">{v.facts}</p>
      {v.next && <p className="continue-next">{v.next.title}</p>}
      <div className="actions">
        <Button variant="primary" onClick={() => navigate(v.next?.path ?? v.overview)}>
          {v.next?.button ?? t('home.continue')}
        </Button>
        <ButtonLink to={v.overview}>{t('home.toOverview')}</ButtonLink>
      </div>
    </article>
  );
}

/** A course in one line: glyphs, name, progress; the whole row opens the course. */
function CourseRow({ entry }: { entry: HomeEntry }) {
  const t = useT();
  const v = useEntryView(entry);
  return (
    <li>
      <Link className={`course-row ${v.fontClass}`} to={v.overview}>
        <span className="course-row-glyphs" aria-hidden="true">
          {v.glyphs.split(' ').slice(0, 3).join(' ')}
        </span>
        <span className="course-row-main">
          <span className="course-row-name">{v.name}</span>
          {v.pct !== null ? <ProgressBar value={v.pct / 100} size="sm" label={t('home.mastery', { n: v.pct })} /> : <span className="muted small">{v.facts}</span>}
        </span>
        <span className="course-row-end tabular">{v.pct !== null ? `${v.pct} %` : t('home.startShort')}</span>
      </Link>
    </li>
  );
}

/** Where progress lives: this browser only, or online when signed in. */
function StorageNote() {
  const t = useT();
  const status = useSync((s) => s.status);
  const user = useSync((s) => s.user);
  const text = user
    ? t('home.storageOnline', { name: user.name ?? user.email ?? '' })
    : status === 'unconfigured'
      ? t('home.storageNote')
      : t('home.storageCanSync');
  return <p className="home-note">{text}</p>;
}
