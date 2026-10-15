import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { nativeOf } from '../../domain/courseIndex';
import { knownLettersFor, knownUnits, isDecodable } from '../../domain/lessonBuilder';
import { placementScope } from '../../domain/placement';
import type { Lesson, PhaseDef } from '../../domain/types';
import { useLang, useT } from '../../i18n';
import { useProgress } from '../../store/progressStore';
import { Button, ButtonLink, Modal } from '../../ui/primitives';
import { useCourse } from '../course/useCourse';
import { PlacementOptions } from '../placement/PlacementOptions';
import { SubNav } from '../../ui/SubNav';
import { LessonWay } from './LessonWay';

export function LearnPage() {
  const { meta, index } = useCourse();
  const t = useT();
  const lang = useLang();
  const navigate = useNavigate();
  const cp = useProgress((s) => s.root.courses[meta.id]);
  const [ahead, setAhead] = useState<Lesson | null>(null);
  const [placing, setPlacing] = useState<PhaseDef | null>(null);
  const lessons = index.content.lessons;
  const phases = index.content.phases.filter((p) => lessons.some((l) => l.phaseId === p.id));
  const next = lessons.find((l) => !cp?.lessons[l.id]);
  const base = `/${meta.slug}`;

  /** A lesson is "ahead" if it needs letters that are neither known nor taught in it. */
  const isAhead = (lesson: Lesson) => {
    if (!next || lesson.number <= next.number) return false;
    const known = knownUnits(index, cp?.items ?? {});
    const taughtHere = lesson.type === 'letters' ? knownLettersFor(index, lesson, cp?.items ?? {}) : known;
    const ids = lesson.newIds.length ? lesson.newIds : lesson.reviewIds ?? [];
    return ids.some((id) => !isDecodable(index, id, lesson.type === 'letters' ? taughtHere : known));
  };

  const open = (lesson: Lesson) => {
    if (lesson.type !== 'letters' ? isAhead(lesson) : lesson.number > (next?.number ?? 0) + 1) {
      setAhead(lesson);
      return;
    }
    navigate(`${base}/lesson/${lesson.id}`);
  };

  const preview = (lesson: Lesson) =>
    (lesson.newIds.length ? lesson.newIds : lesson.reviewIds ?? [])
      .slice(0, 6)
      .map((id) => {
        const it = index.byId.get(id)!;
        return it.kind === 'letter' ? (lesson.lowercase ? it.lower : it.upper) : nativeOf(it);
      });

  return (
    <div className="learn">
      <SubNav label={t('nav.learn')} items={[{ to: `/${meta.slug}/learn`, label: t('nav.path') }, { to: `/${meta.slug}/script`, label: t('nav.script') }]} />
      <header className="section-head">
        <h1 className="page-title">{t('learn.title')}</h1>
        <p className="muted">{t('learn.subtitle')}</p>
      </header>

      {phases.map((phase, pi) => {
        const list = lessons.filter((l) => l.phaseId === phase.id);
        const canPlace = list.some((l) => !cp?.lessons[l.id]) && !!placementScope(index, phase.id);
        const doneCount = list.filter((l) => cp?.lessons[l.id]).length;
        const way = (
          <LessonWay
            scrollToNext={list.some((l) => l.id === next?.id)}
            onOpen={(id) => open(list.find((l) => l.id === id)!)}
            stops={list.map((lesson) => {
              const rec = cp?.lessons[lesson.id];
              const glyphs = preview(lesson);
              const short = lesson.type === 'letters' || lesson.type === 'review';
              return {
                id: lesson.id,
                number: lesson.number,
                title: lesson.title[lang],
                preview: glyphs.join(short ? ' ' : ' · '),
                mark: short ? glyphs[0] : undefined,
                lang: index.content.id,
                done: !!rec,
                next: next?.id === lesson.id,
                status: rec ? (rec.placed ? t('learn.placed') : t('learn.best', { c: rec.bestCorrect, t: rec.bestTotal })) : undefined,
              };
            })}
          />
        );
        // Finished sections fold into a milestone sign, so the recommended lesson is close to the top.
        if (doneCount === list.length) {
          return (
            <details key={phase.id} className="way-milestone">
              <summary>
                <span className="way-milestone-inner">
                  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                    <path d="M5 21V3M5 4h12l-2.5 4 2.5 4H5" />
                  </svg>
                  <span className="way-milestone-text">
                    <h2>{phase.title[lang]}</h2>
                    <span className="way-milestone-note">{t('learn.milestone', { n: list.length })}</span>
                  </span>
                  <span className="way-milestone-chevron" aria-hidden="true" />
                </span>
              </summary>
              {way}
            </details>
          );
        }
        return (
          <section key={phase.id} className="way-phase">
            <div className="way-phase-head">
              <div>
                <div className="way-phase-kicker">{t('learn.section', { n: pi + 1, total: phases.length, d: doneCount, l: list.length })}</div>
                <h2 className="way-phase-title">{phase.title[lang]}</h2>
              </div>
              {canPlace && (
                <button type="button" className="phase-place" onClick={() => { setAhead(null); setPlacing(phase); }}>
                  {t('placement.phaseButton')}
                </button>
              )}
            </div>
            <div className="way-phase-bar" aria-hidden="true">
              <span style={{ width: `${(doneCount / list.length) * 100}%` }} />
            </div>
            {way}
          </section>
        );
      })}

      <Modal open={!!placing} onClose={() => setPlacing(null)} title={placing ? t('placement.phaseTitle', { phase: placing.title[lang] }) : ''}>
        {placing && (
          <>
            <p className="muted">{t('placement.phaseBody')}</p>
            <PlacementOptions scopeId={placing.id} />
            <div className="actions">
              <Button variant="ghost" onClick={() => setPlacing(null)}>
                {t('common.cancel')}
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={!!(ahead && next)} onClose={() => setAhead(null)} title={next ? t('learn.aheadHint', { n: next.number }) : ''}>
        {ahead && next && (
          <div className="actions">
            <ButtonLink variant="primary" to={`${base}/lesson/${next.id}`}>
              {t('learn.goRecommended', { n: next.number })}
            </ButtonLink>
            <Button onClick={() => navigate(`${base}/lesson/${ahead.id}`)}>{t('learn.startAnyway')}</Button>
            <Button variant="ghost" onClick={() => setAhead(null)}>
              {t('common.cancel')}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
