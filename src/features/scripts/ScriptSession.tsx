import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { SCRIPT_LESSONS, type ScriptLesson } from '../../content/scripts/data';
import { UnlockedList } from '../achievements/AchievementParts';
import { levelFromXp } from '../../domain/gamification';
import type { ProgressRoot } from '../../domain/progress';
import {
  answerScript,
  buildScriptLesson,
  buildScriptPractice,
  lessonPool,
  nextScript,
  nextScriptLesson,
  retask,
  SCRIPT_BY_ID,
  SCRIPTS_COURSE_ID,
  scriptScore,
  solidNew,
  startScriptSession,
  type GradedScriptTask,
  type ScriptSessionState,
} from '../../domain/scriptCourse';
import { useLang, useT } from '../../i18n';
import { useProgress } from '../../store/progressStore';
import { Button } from '../../ui/primitives';
import { ScriptCard, ScriptText } from './ScriptParts';
import { sampleSignFor, showsSign } from '../../domain/signs';
import { SignStage } from '../signs/Sign';
import { useSignView } from '../signs/SignViewToggle';
import './scripts.css';
import { QuitDialog, type ResultAction, ResultActions } from '../session/SessionParts';

/** Route for /scripts/lesson/:lessonId and /scripts/practice (?ids=… for exactly these scripts). */
export default function ScriptSessionRoute() {
  const location = useLocation();
  return <ScriptSession key={location.key + location.pathname + location.search} />;
}

interface Done {
  state: ScriptSessionState;
  before: ProgressRoot;
  after: ProgressRoot;
  unlocked: string[];
}

function ScriptSession() {
  const { lessonId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const t = useT();
  const [before] = useState(() => useProgress.getState().root);
  const [done, setDone] = useState<Done | null>(null);
  const finishLesson = useProgress((s) => s.finishLesson);
  const finishPractice = useProgress((s) => s.finishPractice);

  const setup = useMemo(() => {
    const items = before.courses[SCRIPTS_COURSE_ID]?.items ?? {};
    const rng = Math.random;
    const lesson = lessonId ? SCRIPT_LESSONS.find((l) => l.id === lessonId) : undefined;
    if (lesson) {
      const pool = lessonPool(lesson, items);
      return { lesson, tasks: buildScriptLesson(lesson, items, rng), again: (task: GradedScriptTask) => retask(task, pool, rng) };
    }
    const ids = (params.get('ids') ?? '').split(',').filter(Boolean);
    const tasks = buildScriptPractice(items, ids.length ? Math.min(20, Math.max(8, ids.length * 2)) : 20, rng, undefined, ids);
    const pool = new Set([...Object.keys(items).filter((id) => (items[id]?.box ?? 0) >= 1), ...ids]);
    return { lesson: undefined, tasks, again: (task: GradedScriptTask) => retask(task, pool, rng) };
    // built once per session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const back = () => navigate('/scripts');

  const onDone = useCallback(
    (s: ScriptSessionState) => {
      const score = scriptScore(s);
      const unlocked = setup.lesson
        ? finishLesson(SCRIPTS_COURSE_ID, setup.lesson.id, { ...score, newItems: solidNew(s, setup.lesson.newIds) }, null)
        : finishPractice(SCRIPTS_COURSE_ID, s.answers.length, null);
      setDone({ state: s, before, after: useProgress.getState().root, unlocked });
    },
    [before, finishLesson, finishPractice, setup.lesson],
  );

  if (!setup.tasks.length) {
    return (
      <main className="session-done empty-state">
        <p>{t('scripts.practiceEmpty')}</p>
        <div className="actions">
          <Button variant="primary" onClick={back}>
            {t('common.back')}
          </Button>
        </div>
      </main>
    );
  }

  if (done) {
    const nextLesson = nextScriptLesson(done.after.courses[SCRIPTS_COURSE_ID]?.lessons);
    const wrong = [...new Set(done.state.answers.filter((a) => a.result === 'W').map((a) => a.itemId))];
    const actions = [
      ...(nextLesson && setup.lesson ? [{ label: t('home.continue'), onClick: () => navigate(`/scripts/lesson/${nextLesson.id}`, { replace: true }) }] : []),
      ...(!setup.lesson ? [{ label: t('complete.practiceAgain'), onClick: () => navigate(`/scripts/practice${params.toString() ? `?${params.toString()}` : ''}`, { replace: true }) }] : []),
      ...(wrong.length ? [{ label: t('mistakes.practise'), onClick: () => navigate(`/scripts/practice?ids=${wrong.join(',')}`, { replace: true }) }] : []),
      { label: t('scripts.backToCourse'), onClick: back, variant: 'ghost' as const },
    ];
    return (
      <main className="session-done">
        <ScriptResult lesson={setup.lesson} done={done} wrong={wrong} actions={actions} />
      </main>
    );
  }

  return <ScriptRunner tasks={setup.tasks} again={setup.again} lesson={setup.lesson} onDone={onDone} onQuit={back} />;
}

function ScriptRunner({
  tasks,
  again,
  lesson,
  onDone,
  onQuit,
}: {
  tasks: ReturnType<typeof buildScriptLesson>;
  again: (t: GradedScriptTask) => GradedScriptTask;
  lesson?: ScriptLesson;
  onDone: (s: ScriptSessionState) => void;
  onQuit: () => void;
}) {
  const t = useT();
  const lang = useLang();
  const record = useProgress((s) => s.answer);
  const intro = useProgress((s) => s.intro);
  const [state, setState] = useState(() => startScriptSession(tasks));
  const [quitOpen, setQuitOpen] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const quitRef = useRef(quitOpen);
  quitRef.current = quitOpen;
  const task = state.tasks[state.index];
  const newIds = useMemo(() => new Set(lesson?.newIds ?? []), [lesson]);
  const signView = useSignView();

  const choose = useCallback(
    (picked: string) => {
      const s = stateRef.current;
      const tk = s.tasks[s.index];
      if (!tk || tk.kind === 'intro' || s.phase !== 'answer') return;
      const after = answerScript(s, picked, again);
      const a = after.answers[after.answers.length - 1];
      record(SCRIPTS_COURSE_ID, {
        itemId: a.itemId,
        result: a.result,
        // new scripts of a lesson are settled at its end; elsewhere the first answer counts
        applySrs: !s.first[a.itemId] && !newIds.has(a.itemId),
        confusedWith: a.pickedId,
      });
      setState(after);
    },
    [again, newIds, record],
  );

  const next = useCallback(() => {
    const s = stateRef.current;
    const tk = s.tasks[s.index];
    if (tk?.kind === 'intro') intro(SCRIPTS_COURSE_ID, tk.itemId);
    else if (s.phase !== 'feedback') return;
    const after = nextScript(s);
    setState(after);
    if (after.phase === 'done') onDone(after);
  }, [intro, onDone]);

  // Right answers move on by themselves.
  const last = state.answers[state.answers.length - 1];
  useEffect(() => {
    if (state.phase !== 'feedback' || last?.result !== 'C') return;
    const id = setTimeout(next, 700);
    return () => clearTimeout(id);
  }, [last, next, state.phase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (quitRef.current) return;
      const s = stateRef.current;
      const tk = s.tasks[s.index];
      if (!tk) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        setQuitOpen(true);
      } else if (e.key === 'Enter' && !e.repeat && (tk.kind === 'intro' || s.phase === 'feedback')) {
        e.preventDefault();
        next();
      } else if (tk.kind !== 'intro' && s.phase === 'answer' && /^[1-4]$/.test(e.key)) {
        const opt = tk.kind === 'where' ? tk.options[Number(e.key) - 1] : tk.options[Number(e.key) - 1]?.itemId;
        if (opt) {
          e.preventDefault();
          choose(opt);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [choose, next]);

  if (!task) return null;
  const graded = state.answers.length;
  const total = state.plannedGraded + state.reasked.length;
  const feedback = state.phase === 'feedback';
  const target = SCRIPT_BY_ID.get(task.itemId)!;
  const sign = task.kind === 'where' && !newIds.has(task.itemId) && showsSign(signView, task.key) ? sampleSignFor(task.itemId, task.sample.native, task.sample.latin, task.key) : null;

  return (
    <div className="session">
      <header className="session-bar">
        <h1 className="sr-only">{t('scripts.title')}</h1>
        <button type="button" className="icon-btn" aria-label={t('session.quitTitle')} onClick={() => setQuitOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>
        <div className="session-progress" role="progressbar" aria-label={t('session.progress')} aria-valuemin={0} aria-valuemax={total} aria-valuenow={graded}>
          <div className="session-progress-fill" style={{ width: `${total ? (graded / total) * 100 : 0}%` }} />
        </div>
        <span className="session-count tabular">
          {graded} / {state.plannedGraded}
          {state.reasked.length > 0 && <span className="muted"> +{state.reasked.length}</span>}
        </span>
      </header>

      <main className="session-main" key={task.key}>
        {task.kind === 'intro' ? (
          <>
            <ScriptCard entry={target} eyebrow={t('scripts.introEyebrow')} />
            <div className="session-actions">
              <Button variant="primary" block onClick={next} autoFocus>
                {t('session.continue')}
                <kbd>{t('session.enterHint')}</kbd>
              </Button>
            </div>
          </>
        ) : (
          <>
            {task.kind === 'where' ? (
              <>
                <p className="task-prompt">{t('scripts.where')}</p>
                {sign ? (
                  <div className={`sf-${target.font}`}>
                    <SignStage spec={sign} revealed={feedback} />
                  </div>
                ) : (
                  <div className="script-sign">
                    <ScriptText entry={target} className={`script-sign-text${Array.from(task.sample.native).length > 10 ? ' is-long' : ''}`}>
                      {task.sample.native}
                    </ScriptText>
                  </div>
                )}
                <div className="choices script-options" role="group" aria-label={t('scripts.where')}>
                  {task.options.map((id, i) => {
                    const e = SCRIPT_BY_ID.get(id)!;
                    const isRight = id === task.itemId;
                    const picked = feedback && state.lastPicked === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        className={`choice${feedback && isRight ? ' is-correct' : ''}${picked && !isRight ? ' is-wrong' : ''}`}
                        disabled={feedback}
                        onClick={() => choose(id)}
                      >
                        <kbd aria-hidden="true">{i + 1}</kbd>
                        <span className="script-option-where">{e.where[lang]}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <p className="task-prompt">{t('scripts.pick', { where: target.where[lang] })}</p>
                <div className="choices script-options script-options-pick" role="group" aria-label={t('scripts.pick', { where: target.where[lang] })}>
                  {task.options.map((o, i) => {
                    const e = SCRIPT_BY_ID.get(o.itemId)!;
                    const isRight = o.itemId === task.itemId;
                    const picked = feedback && state.lastPicked === o.itemId;
                    return (
                      <button
                        key={o.itemId}
                        type="button"
                        className={`choice${feedback && isRight ? ' is-correct' : ''}${picked && !isRight ? ' is-wrong' : ''}`}
                        disabled={feedback}
                        onClick={() => choose(o.itemId)}
                      >
                        <kbd aria-hidden="true">{i + 1}</kbd>
                        <ScriptText entry={e} className="script-option-sample">
                          {o.sample.native}
                        </ScriptText>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <div className="session-response" aria-live="polite">
              {feedback && last && <Feedback task={task} picked={state.lastPicked} correct={last.result === 'C'} />}
            </div>
            {feedback && last?.result === 'W' && (
              <div className="session-actions">
                <Button variant="primary" block onClick={next} autoFocus>
                  {t('session.continue')}
                  <kbd>{t('session.enterHint')}</kbd>
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      <QuitDialog open={quitOpen} onStay={() => setQuitOpen(false)} onQuit={() => onQuit()} />
    </div>
  );
}

/** After an answer: the right place and, after a mistake, the clue that gives it away. */
function Feedback({ task, picked, correct }: { task: GradedScriptTask; picked: string | null; correct: boolean }) {
  const t = useT();
  const lang = useLang();
  const target = SCRIPT_BY_ID.get(task.itemId)!;
  const chosen = picked ? SCRIPT_BY_ID.get(picked) : undefined;
  const clue = target.features.find((f) => f.mark) ?? target.features[0];
  const sample = task.kind === 'where' ? task.sample : task.options.find((o) => o.itemId === task.itemId)!.sample;
  return (
    <div className={`script-feedback${correct ? ' is-correct' : ' is-wrong'}`}>
      <p className="script-feedback-title">
        {correct ? t('scripts.right') : t('scripts.wrong')}
      </p>
      <p className="muted">
        <ScriptText entry={target}>{sample.native}</ScriptText> = {sample.latin} · {target.where[lang]} ({target.name[lang]})
      </p>
      {!correct && (
        <>
          {chosen && chosen.id !== target.id && <p className="muted small">{t('scripts.youPicked', { where: chosen.where[lang], name: chosen.name[lang] })}</p>}
          <p className="script-feedback-hint">
            {clue.mark && (
              <ScriptText entry={target} className="script-feature-mark">
                {clue.mark}
              </ScriptText>
            )}
            <span className={target.font === 'thai' || target.font === 'bengali' ? undefined : `sf-${target.font}`}>{clue.text[lang]}</span>
          </p>
        </>
      )}
    </div>
  );
}

function ScriptResult({
  lesson,
  done,
  wrong,
  actions,
}: {
  lesson?: ScriptLesson;
  done: Done;
  wrong: string[];
  actions: ResultAction[];
}) {
  const t = useT();
  const lang = useLang();
  const score = scriptScore(done.state);
  const xp = done.after.profile.xp - done.before.profile.xp;
  const levelAfter = levelFromXp(done.after.profile.xp);
  return (
    <div className="complete">
      <h1 className="complete-title">{lesson ? t('complete.lesson') : t('complete.practice')}</h1>
      <p className="muted">
        {t('scripts.title')}
        {lesson && ` · ${t('learn.lesson', { n: lesson.number })} · ${lesson.title[lang]}`}
      </p>
      <p className="complete-score tabular">{t('complete.correct', { c: score.correct, t: score.total })}</p>
      <ul className="complete-facts">
        {xp > 0 && <li className="accent tabular">{t('complete.xp', { n: xp })}</li>}
        {levelAfter > levelFromXp(done.before.profile.xp) && <li className="accent">{t('complete.levelUp', { n: levelAfter })}</li>}
      </ul>
      {wrong.length > 0 && (
        <section className="complete-block">
          <h2 className="card-label">{t('scripts.mistakes')}</h2>
          <ul className="tempo-slow">
            {wrong.map((id) => {
              const e = SCRIPT_BY_ID.get(id)!;
              return (
                <li key={id}>
                  <ScriptText entry={e} className="native">
                    {e.samples[0].native}
                  </ScriptText>
                  <span className="muted">{e.where[lang]}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      <UnlockedList ids={done.unlocked} />
      <ResultActions actions={actions} />
    </div>
  );
}
