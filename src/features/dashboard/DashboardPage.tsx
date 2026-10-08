import { useNavigate } from 'react-router-dom';
import { letterGlyphs, nativeOf } from '../../domain/courseIndex';
import { courseStats } from '../../domain/stats';
import type { Category } from '../../domain/types';
import { formatPercent, useLang, useT } from '../../i18n';
import { useProgress } from '../../store/progressStore';
import { Button, ButtonLink, Card, MasteryBar, MasteryLegend } from '../../ui/primitives';
import { useCourse } from '../course/useCourse';
import { MapGoal } from '../map/MapPage';
import { PlacementCard } from '../placement/PlacementOptions';
import { MistakesCard } from '../mistakes/MistakesCard';
import { NextGoals } from '../achievements/AchievementParts';
import { recommendedPath } from './recommend';

const BAR_ORDER: Category[] = ['letters', 'combos', 'words', 'terms', 'cities', 'regions'];

export function DashboardPage() {
  const { meta, index } = useCourse();
  const t = useT();
  const lang = useLang();
  const navigate = useNavigate();
  const cp = useProgress((s) => s.root.courses[meta.id]);
  const stats = courseStats(index, cp);
  const base = `/${meta.slug}`;
  const firstLesson = index.content.lessons[0];

  if (!stats.started) {
    return (
      <div className="dashboard">
        <header className="dash-head">
          <h1 className="page-title">{meta.name[lang]}</h1>
        </header>
        <Card className="first-run">
          <div className="first-run-glyphs" aria-hidden="true">
            {index.content.lessons[0].newIds.map((id) => nativeOf(index.byId.get(id)!)).join(' ')}
          </div>
          <div>
            <p className="eyebrow-quiet">
              {t('learn.lesson', { n: 1 })} · {t('common.minutes', { n: 4 })}
            </p>
            <h2 className="card-title">{firstLesson.title[lang]}</h2>
            <p className="muted">{firstLesson.goal[lang]}</p>
            <div className="actions">
              <ButtonLink variant="primary" to={`${base}/lesson/${firstLesson.id}`}>
                {t('dash.startLesson1')}
              </ButtonLink>
              <ButtonLink to={`${base}/learn`}>{t('dash.allLessons')}</ButtonLink>
            </div>
          </div>
        </Card>
        <PlacementCard />
        <MapGoal />
      </div>
    );
  }

  const rec = stats.recommendation;
  const recLesson = rec.kind === 'lesson' ? index.content.lessons.find((l) => l.id === rec.lessonId) : undefined;
  const nextLesson = index.content.lessons.find((l) => !cp?.lessons[l.id]);
  const weakItems = stats.weakIds.slice(0, 8).map((id) => index.byId.get(id)!);
  const recPath = recommendedPath(meta, index, cp);
  const recTitle = recLesson
    ? `${t('learn.lesson', { n: recLesson.number })} · ${recLesson.title[lang]}`
    : rec.kind === 'review'
      ? t('dash.rec.review', { n: rec.due })
      : rec.kind === 'weak'
        ? t('dash.rec.weak', { n: rec.count })
        : t('dash.rec.mixed');
  const recWhy = recLesson ? recLesson.goal[lang] : rec.kind === 'review' ? t('dash.rec.reviewWhy') : rec.kind === 'weak' ? t('dash.rec.weakWhy') : t('dash.rec.mixedWhy');
  const recButton = recLesson ? t('dash.btn.lesson') : rec.kind === 'review' ? t('dash.btn.review') : rec.kind === 'weak' ? t('dash.trainWeak') : t('dash.btn.mixed');
  // Second choice: the next lesson when a review comes first, otherwise free practice.
  const second =
    rec.kind !== 'lesson' && nextLesson
      ? { label: t('dash.btn.nextLesson', { n: nextLesson.number }), to: `${base}/lesson/${nextLesson.id}` }
      : { label: t('dash.practice'), to: `${base}/practice` };

  return (
    <div className="dashboard">
      <header className="dash-head">
        <h1 className="page-title">{meta.name[lang]}</h1>
        <div className="dash-hero">
          <div className="big-number">
            {formatPercent(stats.mastery)}
            <span className="big-number-unit">%</span>
          </div>
          <div className="big-number-label">{t('dash.mastery')}</div>
        </div>
        <ul className="dash-facts">
          <li>{t('dash.lettersLearned', { n: stats.lettersLearned, total: stats.lettersTotal })}</li>
          <li>{t('dash.lessons', { n: stats.completedLessons, total: index.content.lessons.length })}</li>
          <li>{t('dash.readable', { n: stats.citiesReadable, total: stats.citiesTotal })}</li>
          <li>{t('dash.citiesRecognized', { n: stats.citiesRecognized })}</li>
        </ul>
      </header>

      <div className="dash-layout">
        <div className="dash-col">
          <Card className="card-recommended">
            <h2 className="card-label">{t('dash.recommended')}</h2>
            <p className="rec-title">{recTitle}</p>
            <p className="muted">{recWhy}</p>
            <div className="actions">
              <Button variant="primary" onClick={() => navigate(recPath)}>
                {recButton}
              </Button>
              <ButtonLink to={second.to}>{second.label}</ButtonLink>
            </div>
          </Card>
          <MistakesCard />
          <MapGoal />
        </div>
        <div className="dash-col">
          <NextGoals courseId={meta.id} index={index} />
          <Card>
            <h2 className="card-label">{t('dash.weak')}</h2>
            {weakItems.length ? (
              <>
                <div className="chip-row">
                  {weakItems.map((it) => (
                    <span key={it.id} className="glyph-chip">
                      {it.kind === 'letter' ? letterGlyphs(it) : nativeOf(it)}
                    </span>
                  ))}
                </div>
                <ButtonLink to={`${base}/practice/run?mode=weak`}>{t('dash.trainWeak')}</ButtonLink>
              </>
            ) : (
              <p className="muted">{t('dash.weakEmpty')}</p>
            )}
          </Card>
        </div>

        <Card className="card-progress">
          <h2 className="card-label">{t('dash.progress')}</h2>
          <ul className="progress-list">
            {BAR_ORDER.map((cat) => {
              const s = stats.categories[cat];
              return (
                <li key={cat}>
                  <div className="progress-row-head">
                    <span>{t(`cat.${cat}`)}</span>
                    <span className="muted tabular">
                      {s.expert + s.mastered + s.familiar + s.learning} / {s.total}
                    </span>
                  </div>
                  <MasteryBar total={s.total} expert={s.expert} mastered={s.mastered} familiar={s.familiar} learning={s.learning} label={t(`cat.${cat}`)} />
                </li>
              );
            })}
          </ul>
          <MasteryLegend withNew={false} />
        </Card>
      </div>
    </div>
  );
}
