import { useCallback, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { UnlockedList } from '../achievements/AchievementParts';
import { letterGlyphs, nativeOf, type CourseIndex } from '../../domain/courseIndex';
import { LETTERS_SCOPE, passMark, PLACEMENT, placementOutcome, placementScope, placementTasks, type PlacementMode, type PlacementOutcome, type PlacementScope } from '../../domain/placement';
import type { ProgressRoot } from '../../domain/progress';
import type { SessionState } from '../../domain/sessionEngine';
import { retaskFor } from '../../domain/taskFactory';
import { useLang, useT } from '../../i18n';
import { useProgress } from '../../store/progressStore';
import { useCourse } from '../course/useCourse';
import { recommendedPath } from '../dashboard/recommend';
import { SessionRunner } from '../session/SessionRunner';
import { type ResultAction, ResultActions } from '../session/SessionParts';

export const placementPath = (slug: string, scope: string, mode: PlacementMode) => `/${slug}/placement?scope=${encodeURIComponent(scope)}&m=${mode}`;

export function PlacementRoute() {
  const location = useLocation();
  return <PlacementSession key={location.key + location.search} />;
}

interface Done {
  outcome: PlacementOutcome;
  before: ProgressRoot;
  after: ProgressRoot;
  unlocked: string[];
}

function PlacementSession() {
  const { meta, index } = useCourse();
  const t = useT();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const finishPlacement = useProgress((s) => s.finishPlacement);
  const [before] = useState(() => useProgress.getState().root);
  const [done, setDone] = useState<Done | null>(null);
  const base = `/${meta.slug}`;
  const back = () => (window.history.length > 1 ? navigate(-1) : navigate(base));

  const setup = useMemo(() => {
    const mode: PlacementMode = params.get('m') === 'test' ? 'test' : 'review';
    const scope = placementScope(index, params.get('scope') ?? LETTERS_SCOPE);
    const rng = Math.random;
    return {
      mode,
      scope,
      tasks: scope ? placementTasks(index, scope, mode, rng) : [],
      deps: { rng, retask: retaskFor(index, rng) },
      deferred: new Set(scope?.itemIds ?? []),
    };
    // built once per session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const scopeName = useScopeName(index, setup.scope);

  const onDone = useCallback(
    (s: SessionState) => {
      if (!setup.scope) return;
      const cp = useProgress.getState().root.courses[meta.id];
      const outcome = placementOutcome(setup.scope, setup.mode, s.first, (id) => cp?.items[id]?.box ?? 0);
      const unlocked = finishPlacement(meta.id, outcome, index);
      setDone({ outcome, before, after: useProgress.getState().root, unlocked });
    },
    [before, finishPlacement, index, meta.id, setup],
  );

  if (!setup.scope || !setup.tasks.length) {
    return (
      <main className="session-done empty-state">
        <p>{t('common.notFound')}</p>
        <Link className="btn btn-primary" to={base}>
          {t('common.back')}
        </Link>
      </main>
    );
  }

  if (done) {
    const cp = done.after.courses[meta.id];
    const actions = [
      { label: t('dash.continueLearning'), onClick: () => navigate(recommendedPath(meta, index, cp), { replace: true }) },
      ...(done.outcome.wrong.length
        ? [{ label: t('placement.learnNow'), onClick: () => navigate(`${base}/practice/run?ids=${done.outcome.wrong.join(',')}`, { replace: true }) }]
        : []),
      { label: t('complete.backDashboard'), onClick: () => navigate(base, { replace: true }), variant: 'ghost' as const },
    ];
    return (
      <main className="session-done">
        <PlacementResult index={index} courseId={meta.id} scopeName={scopeName} done={done} actions={actions} />
      </main>
    );
  }

  return (
    <SessionRunner
      courseId={meta.id}
      index={index}
      tasks={setup.tasks}
      mode="practice"
      deps={setup.deps}
      deferredIds={setup.deferred}
      noRepeat
      notice={`${t('placement.title')} · ${scopeName}`}
      onDone={onDone}
      onQuit={back}
    />
  );
}

function useScopeName(index: CourseIndex, scope: PlacementScope | null): string {
  const t = useT();
  const lang = useLang();
  if (!scope) return '';
  if (scope.id === LETTERS_SCOPE) return t('placement.scopeLetters');
  return index.content.phases.find((p) => p.id === scope.id)?.title[lang] ?? scope.id;
}

function PlacementResult({
  index,
  courseId,
  scopeName,
  done,
  actions,
}: {
  index: CourseIndex;
  courseId: string;
  scopeName: string;
  done: Done;
  actions: ResultAction[];
}) {
  const t = useT();
  const { outcome, before, after } = done;
  const boxBefore = (id: string) => before.courses[courseId]?.items[id]?.box ?? 0;
  const taken = Object.entries(outcome.boxes).filter(([id, box]) => box > boxBefore(id)).length;
  const skipped = outcome.placedLessons.filter((id) => !before.courses[courseId]?.lessons[id]).length;
  const xp = after.profile.xp - before.profile.xp;

  return (
    <div className="complete">
      <h1 className="complete-title">{t('placement.title')}</h1>
      <p className="muted">
        {scopeName} · {outcome.mode === 'review' ? t('placement.phaseReview') : outcome.total < PLACEMENT.testSize ? t('placement.phaseCheck') : t('placement.phaseTest')}
      </p>
      <p className="complete-score tabular">{t('placement.correct', { c: outcome.correct, t: outcome.total })}</p>
      {outcome.mode === 'test' && (
        <p className={outcome.passed ? 'placement-verdict accent' : 'placement-verdict muted'}>
          {outcome.passed ? t('placement.passed') : t('placement.notYet', { need: passMark(outcome.total), t: outcome.total })}
        </p>
      )}

      <ul className="complete-facts">
        {xp > 0 && <li className="accent tabular">{t('complete.xp', { n: xp })}</li>}
        <li>{t('placement.resultItems', { n: taken })}</li>
        <li>{t('placement.resultLessons', { n: skipped })}</li>
      </ul>

      {outcome.wrong.length > 0 && (
        <section className="complete-block">
          <h2 className="card-label">{outcome.passed ? t('placement.wrongSoon') : t('placement.wrongLearn')}</h2>
          <div className="chip-row">
            {outcome.wrong.slice(0, 16).map((id) => {
              const it = index.byId.get(id)!;
              return (
                <span key={id} className="glyph-chip" lang={index.content.id}>
                  {it.kind === 'letter' ? letterGlyphs(it) : nativeOf(it)}
                </span>
              );
            })}
            {outcome.wrong.length > 16 && <span className="muted small">+{outcome.wrong.length - 16}</span>}
          </div>
        </section>
      )}

      <UnlockedList ids={done.unlocked} />

      <ResultActions actions={actions} />
    </div>
  );
}
