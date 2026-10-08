import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { UnlockedList } from '../achievements/AchievementParts';
import type { CourseIndex } from '../../domain/courseIndex';
import { levelFromXp } from '../../domain/gamification';
import type { ProgressRoot } from '../../domain/progress';
import {
  answerTempo,
  buildTempoTasks,
  clampFlash,
  clampSeconds,
  contentOfItem,
  currentTempoTask,
  endTempo,
  nextTempo,
  pickTempoItems,
  startTempo,
  summarizeTempo,
  TEMPO,
  tempoPool,
  tempoTask,
  type TempoContent,
  type TempoMode,
  type TempoState,
  type TempoTask,
} from '../../domain/tempo';
import type { Item } from '../../domain/types';
import { formatSeconds, useLang, useT } from '../../i18n';
import { DEFAULT_TEMPO, useProgress } from '../../store/progressStore';
import { Button, ButtonLink } from '../../ui/primitives';
import { useCourse } from '../course/useCourse';
import { MapLabelToggle, useMapLabels } from '../map/MapLabelToggle';
import { isWideMap } from '../map/layer';
import { MapView, type Mark } from '../map/MapView';
import { sizeFor } from '../session/TaskPrompt';
import { itemAnswer, itemNative } from './labels';
import { tempoRunQuery } from './TempoPage';
import { showsSign, signFor } from '../../domain/signs';
import { SignStage } from '../signs/Sign';
import { useSignView } from '../signs/SignViewToggle';
import { QuitDialog, type ResultAction, ResultActions } from '../session/SessionParts';

interface TempoRequest {
  mode: TempoMode;
  content: TempoContent;
  limitMs: number;
  flashMs: number;
  ids: string[];
}

function parseTempo(params: URLSearchParams): TempoRequest {
  const m = params.get('m');
  const c = params.get('c');
  return {
    mode: m === 'blitz' || m === 'flash' ? m : 'timer',
    content: c === 'letters' || c === 'map' ? c : 'places',
    limitMs: clampSeconds(Number(params.get('s')) || DEFAULT_TEMPO.seconds) * 1000,
    flashMs: clampFlash(Number(params.get('f')) || DEFAULT_TEMPO.flashMs),
    ids: (params.get('ids') ?? '').split(',').filter(Boolean),
  };
}

export function TempoRoute() {
  const location = useLocation();
  return <TempoSession key={location.key + location.search} />;
}

interface Finished {
  state: TempoState;
  before: ProgressRoot;
  after: ProgressRoot;
  unlocked: string[];
  newBest: boolean;
  prevBest: number;
}

function TempoSession() {
  const { meta, index } = useCourse();
  const t = useT();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const finishTempo = useProgress((s) => s.finishTempo);
  const [before] = useState(() => useProgress.getState().root);
  const [stage, setStage] = useState<'countdown' | 'run'>('countdown');
  const [done, setDone] = useState<Finished | null>(null);
  const base = `/${meta.slug}`;

  const setup = useMemo(() => {
    const req = parseTempo(params);
    const rng = Math.random;
    const cp = before.courses[meta.id];
    const items = cp?.items ?? {};
    const pool = tempoPool(index, req.content, items);
    const poolIds = new Set(pool.map((p) => p.id));
    let tasks: TempoTask[] = [];
    if (req.ids.length) {
      const list = req.ids.map((id) => index.byId.get(id)).filter((it): it is Item => !!it);
      const count = req.mode === 'blitz' ? TEMPO.blitzTasks : Math.min(TEMPO.count, Math.max(10, list.length * 2));
      tasks = pickTempoItems(list, cp?.tempo, count, rng).map((it) => tempoTask(index, it, contentOfItem(index, it, req.content === 'map'), poolIds, rng));
    } else if (pool.length >= TEMPO.minPool) {
      const count = req.mode === 'blitz' ? TEMPO.blitzTasks : TEMPO.count;
      tasks = buildTempoTasks(index, pickTempoItems(pool, cp?.tempo, count, rng), req.content, poolIds, rng);
    }
    return { req, tasks };
    // built once per session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const back = () => navigate(`${base}/tempo`);

  const onDone = useCallback(
    (state: TempoState) => {
      const r = finishTempo(meta.id, state, setup.req.content, index);
      setDone({ state, before, after: useProgress.getState().root, ...r });
    },
    [before, finishTempo, index, meta.id, setup.req.content],
  );

  if (!setup.tasks.length) {
    return (
      <main className="session-done empty-state">
        <p>{t('tempo.noTasks')}</p>
        <p className="muted">{t('tempo.tooFew', { n: TEMPO.minPool })}</p>
        <div className="actions">
          <ButtonLink variant="primary" to={`${base}/learn`}>
            {t('nav.learn')}
          </ButtonLink>
          <Link className="btn btn-ghost" to={`${base}/tempo`}>
            {t('common.back')}
          </Link>
        </div>
      </main>
    );
  }

  if (done) {
    const { req } = setup;
    const summary = summarizeTempo(done.state);
    const settings = useProgress.getState().root.settings.tempo ?? DEFAULT_TEMPO;
    const actions = [
      { label: t('tempo.again'), onClick: () => navigate(`${base}/tempo/run?${params.toString()}`, { replace: true }) },
      ...(summary.mistakes.length
        ? [
            {
              label: t('tempo.practiceMistakes'),
              onClick: () => navigate(`${base}/tempo/run?${tempoRunQuery('timer', req.content, { seconds: settings.seconds, flashMs: settings.flashMs, ids: summary.mistakes })}`, { replace: true }),
            },
          ]
        : []),
      { label: t('tempo.back'), onClick: back, variant: 'ghost' as const },
    ];
    return (
      <main className="session-done">
        <TempoResult index={index} req={req} done={done} actions={actions} />
      </main>
    );
  }

  if (stage === 'countdown') return <Countdown mode={setup.req.mode} onDone={() => setStage('run')} onQuit={back} />;

  return <TempoRunner index={index} tasks={setup.tasks} req={setup.req} onDone={onDone} onQuit={(s) => (s.answers.length ? onDone(endTempo(s)) : back())} />;
}

/** "Ready? 3 · 2 · 1" – the clock starts only when the first task appears. */
function Countdown({ mode, onDone, onQuit }: { mode: TempoMode; onDone: () => void; onQuit: () => void }) {
  const t = useT();
  const [n, setN] = useState(3);
  useEffect(() => {
    if (n === 0) {
      onDone();
      return;
    }
    const id = setTimeout(() => setN((x) => x - 1), 650);
    return () => clearTimeout(id);
  }, [n, onDone]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onQuit();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onQuit]);
  return (
    <main className="tempo-countdown" aria-live="assertive">
      <p className="muted">{t(`tempo.mode.${mode}`)}</p>
      <p className="tempo-countdown-title">{t('tempo.ready')}</p>
      <p className="tempo-countdown-n tabular" key={n}>
        {Math.max(n, 1)}
      </p>
    </main>
  );
}

interface RunnerProps {
  index: CourseIndex;
  tasks: TempoTask[];
  req: TempoRequest;
  onDone: (s: TempoState) => void;
  onQuit: (s: TempoState) => void;
}

/** Runs one tempo session. Keys: 1–4 pick, Enter continues, Esc asks to quit. */
function TempoRunner({ index, tasks, req, onDone, onQuit }: RunnerProps) {
  const t = useT();
  const lang = useLang();
  const { mode } = req;
  const [state, setState] = useState(() => startTempo(mode, tasks, performance.now(), { limitMs: req.limitMs }));
  const stateRef = useRef(state);
  stateRef.current = state;
  const [revealedAt, setRevealedAt] = useState(-1); // flash: index of the task whose name is already hidden again
  const [quitOpen, setQuitOpen] = useState(false);
  const quitRef = useRef(quitOpen);
  quitRef.current = quitOpen;
  const finished = useRef(false);
  const taskLabels = useMapLabels('taskMapLabels');
  const signView = useSignView();

  const finish = useCallback(
    (s: TempoState) => {
      if (finished.current) return;
      finished.current = true;
      onDone(s);
    },
    [onDone],
  );

  const answer = useCallback((picked: string | null) => {
    const s = stateRef.current;
    if (s.phase !== 'answer') return;
    setState(answerTempo(s, picked, performance.now()));
  }, []);

  const next = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== 'feedback') return;
    const after = nextTempo(s, performance.now());
    setState(after);
    if (after.phase === 'done') finish(after);
  }, [finish]);

  // Per task: the time limit (timer) and the moment the name disappears (flash).
  useEffect(() => {
    if (state.phase !== 'answer') return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const i = state.index;
    if (mode === 'flash') timers.push(setTimeout(() => setRevealedAt(i), req.flashMs));
    if (state.limitMs !== null) timers.push(setTimeout(() => answer(null), Math.max(0, state.limitMs - (performance.now() - state.shownAt))));
    return () => timers.forEach(clearTimeout);
  }, [answer, mode, req.flashMs, state.index, state.limitMs, state.phase, state.shownAt]);

  // Blitz: the round ends after 60 seconds, wherever it is.
  useEffect(() => {
    if (state.endsAt === null) return;
    const id = setTimeout(() => {
      const s = endTempo(stateRef.current);
      setState(s);
      finish(s);
    }, Math.max(0, state.endsAt - performance.now()));
    return () => clearTimeout(id);
  }, [finish, state.endsAt]);

  // After an answer: right answers move on by themselves; wrong ones wait (except in a Blitz round).
  const last = state.answers[state.answers.length - 1];
  useEffect(() => {
    if (state.phase !== 'feedback' || !last) return;
    const delay = last.correct ? (mode === 'blitz' ? 250 : 500) : mode === 'blitz' ? 1300 : null;
    if (delay === null) return;
    const id = setTimeout(next, delay);
    return () => clearTimeout(id);
  }, [last, mode, next, state.phase]);

  const task = currentTempoTask(state);
  const hidden = mode === 'flash' && state.phase === 'answer' && revealedAt === state.index;
  const optionsShown = mode !== 'flash' || revealedAt === state.index || state.phase === 'feedback';
  const optionsRef = useRef(optionsShown);
  optionsRef.current = optionsShown;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (quitRef.current) return;
      const s = stateRef.current;
      const tk = currentTempoTask(s);
      if (!tk) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        setQuitOpen(true);
        return;
      }
      if (e.key === 'Enter' && s.phase === 'feedback') {
        if (e.repeat) return;
        e.preventDefault();
        next();
        return;
      }
      if (s.phase === 'answer' && /^[1-4]$/.test(e.key) && tk.options.length && optionsRef.current) {
        e.preventDefault();
        const id = tk.options[Number(e.key) - 1];
        if (id) answer(id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answer, next]);

  if (!task) return null;
  const item = index.byId.get(task.itemId)!;
  const feedback = state.phase === 'feedback';
  const isMap = task.content === 'map';
  // Signs for place names (not in flash mode: there the name disappears).
  const sign = task.content !== 'letters' && mode !== 'flash' && showsSign(signView, task.key) ? signFor(index.content.id, item, task.key) : null;
  const shopPrompt = sign?.kind === 'bd-shop' ? (isMap ? t('signs.shopLocate') : item.kind === 'city' ? t('signs.shopCity') : t('signs.shopDistrict')) : null;
  const wide = isMap && isWideMap(index);
  const done = state.answers.length;
  const right = state.answers.filter((a) => a.correct).length;

  const marks: Record<string, Mark> = {};
  if (isMap && feedback && last) {
    if (last.pickedId && !last.correct) marks[last.pickedId] = 'wrong';
    marks[task.itemId] = last.correct ? 'correct' : 'target';
  }

  return (
    <div className="session tempo-session">
      <h1 className="sr-only">{t('tempo.title')}</h1>
      <header className="session-bar">
        <button type="button" className="icon-btn" aria-label={t('session.quitTitle')} onClick={() => setQuitOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>
        {mode === 'blitz' && state.endsAt !== null ? (
          <>
            <BlitzClock endsAt={state.endsAt} />
            <span className="session-count tabular tempo-score">{t('tempo.correctCount', { n: right })}</span>
          </>
        ) : (
          <>
            <div className="session-progress" role="progressbar" aria-label={t('session.progress')} aria-valuemin={0} aria-valuemax={tasks.length} aria-valuenow={done}>
              <div className="session-progress-fill" style={{ width: `${(done / tasks.length) * 100}%` }} />
            </div>
            <span className="session-count tabular">
              {done} / {tasks.length}
            </span>
          </>
        )}
      </header>

      <main className={`session-main tempo-main${wide ? ' is-wide' : ''}`} key={task.key}>
        {state.limitMs !== null && (
          <div className="tempo-timer" aria-hidden="true">
            <div className={`tempo-timer-fill${feedback ? ' is-paused' : ''}`} style={{ animationDuration: `${state.limitMs}ms` }} />
          </div>
        )}
        <p className="task-prompt">{hidden ? t('tempo.hidden') : shopPrompt ?? t(`tempo.prompt.${task.content}`)}</p>
        {sign && <SignStage spec={sign} revealed={feedback} lang={index.content.id} compact={isMap} />}
        <div className={`plate tempo-plate${isMap ? ' plate-compact' : ''}`} hidden={!!sign}>
          {/* The name stays in the layout while hidden, so nothing jumps when it disappears. */}
          <span className={`glyph glyph-${isMap && sizeFor(task.display) !== 's' ? 'm' : sizeFor(task.display)}${hidden ? ' is-hidden' : ''}`} lang={index.content.id} aria-hidden={hidden}>
            {task.display}
          </span>
          {hidden && (
            <span className="tempo-mask" aria-hidden="true">
              · · ·
            </span>
          )}
        </div>

        {isMap && index.map ? (
          <div className="task-map">
            <MapView
              index={index}
              label={t('map.label')}
              marks={marks}
              labels={taskLabels}
              hideLabels={feedback ? undefined : new Set([task.itemId])}
              onPick={feedback ? undefined : (id) => answer(id)}
              zoomable
            />
            <MapLabelToggle which="taskMapLabels" compact />
          </div>
        ) : (
          <div className={`choices tempo-choices${task.content === 'places' ? ' tempo-choices-names' : ''}`} role="group" aria-label={t(`tempo.prompt.${task.content}`)}>
            {task.options.map((id, i) => {
              const opt = index.byId.get(id)!;
              const isRight = id === task.itemId;
              const picked = feedback && last?.pickedId === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={`choice${feedback && isRight ? ' is-correct' : ''}${picked && !isRight ? ' is-wrong' : ''}${optionsShown ? '' : ' is-veiled'}`}
                  disabled={feedback || !optionsShown}
                  onClick={() => answer(id)}
                >
                  <kbd aria-hidden="true">{i + 1}</kbd>
                  <span className={task.content === 'letters' ? 'choice-latin' : 'choice-text'}>{optionsShown ? itemAnswer(opt, lang) : ' '}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="session-response tempo-response" aria-live="polite">
          {feedback && last && (
            <div className={`tempo-feedback${last.correct ? ' is-correct' : ' is-wrong'}`}>
              <p className="tempo-feedback-title">
                {last.correct ? t('tempo.right') : last.timeout ? t('tempo.timeout') : t('tempo.wrong')}
                {last.correct && mode !== 'flash' && <span className="tabular"> · {formatSeconds(last.ms, lang)}</span>}
              </p>
              {!last.correct && (
                <>
                  <p>
                    {t('tempo.answerWas', { name: `${itemNative(item)} = ${itemAnswer(item, lang)}` })}
                  </p>
                  {isMap && last.pickedId && index.byId.get(last.pickedId) && (
                    <p className="muted">{t('tempo.clicked', { name: itemAnswer(index.byId.get(last.pickedId)!, lang) })}</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {feedback && last && !last.correct && mode !== 'blitz' && (
          <div className="session-actions">
            <Button variant="primary" block onClick={next} autoFocus>
              {t('session.continue')}
              <kbd>{t('session.enterHint')}</kbd>
            </Button>
          </div>
        )}
      </main>

      <QuitDialog
        open={quitOpen}
        onStay={() => setQuitOpen(false)}
        onQuit={() => {
          finished.current = true;
          onQuit(stateRef.current);
        }}
      />
    </div>
  );
}

/** Remaining Blitz time ("0:42"), updated a few times per second. */
function BlitzClock({ endsAt }: { endsAt: number }) {
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    const id = setInterval(() => setNow(performance.now()), 200);
    return () => clearInterval(id);
  }, []);
  const left = Math.max(0, Math.ceil((endsAt - now) / 1000));
  const ratio = Math.max(0, Math.min(1, (endsAt - now) / TEMPO.blitzMs));
  return (
    <>
      <div className="session-progress tempo-clock-bar" aria-hidden="true">
        <div className={`session-progress-fill${left <= 10 ? ' is-low' : ''}`} style={{ width: `${ratio * 100}%` }} />
      </div>
      <span className={`tempo-clock tabular${left <= 10 ? ' is-low' : ''}`} role="timer">
        {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
      </span>
    </>
  );
}

function TempoResult({
  index,
  req,
  done,
  actions,
}: {
  index: CourseIndex;
  req: TempoRequest;
  done: Finished;
  actions: ResultAction[];
}) {
  const t = useT();
  const lang = useLang();
  const s = summarizeTempo(done.state);
  const xp = done.after.profile.xp - done.before.profile.xp;
  const levelUp = levelFromXp(done.after.profile.xp) > levelFromXp(done.before.profile.xp);
  const detail =
    req.mode === 'timer' ? t('tempo.perTask', { s: `${req.limitMs / 1000} s` }) : req.mode === 'flash' ? t('tempo.visibleFor', { s: formatSeconds(req.flashMs, lang) }) : t('tempo.blitzLength');
  const fastest = s.fastest ? index.byId.get(s.fastest.itemId) : undefined;

  return (
    <div className="complete">
      <h1 className="complete-title">{t(`tempo.mode.${req.mode}`)}</h1>
      <p className="muted">
        {t(`tempo.content.${req.content}`)} · {detail}
      </p>
      {req.mode === 'blitz' ? (
        <>
          <p className="complete-score tabular">{t('tempo.correctCount', { n: s.correct })}</p>
          {done.newBest ? <p className="accent tempo-newbest">{t('tempo.newBest')}</p> : done.prevBest > 0 && <p className="muted">{t('tempo.prevBest', { n: done.prevBest })}</p>}
        </>
      ) : (
        <p className="complete-score tabular">{t('tempo.resultCorrect', { c: s.correct, t: s.answered })}</p>
      )}

      <ul className="complete-facts">
        {xp > 0 && <li className="accent tabular">{t('complete.xp', { n: xp })}</li>}
        {s.avgMs !== null && <li>{t('tempo.resultAvg', { s: formatSeconds(s.avgMs, lang) })}</li>}
        {fastest && s.fastest && <li>{t('tempo.resultFastest', { name: itemNative(fastest), s: formatSeconds(s.fastest.ms, lang) })}</li>}
        {levelUp && <li className="accent">{t('complete.levelUp', { n: levelFromXp(done.after.profile.xp) })}</li>}
      </ul>

      {s.mistakes.length > 0 && (
        <section className="complete-block">
          <h2 className="card-label">{t('tempo.mistakes')}</h2>
          <ul className="tempo-slow">
            {s.mistakes.slice(0, 12).map((id) => {
              const it = index.byId.get(id)!;
              return (
                <li key={id}>
                  <span className="native" lang={index.content.id}>
                    {itemNative(it)}
                  </span>
                  <span className="muted">{itemAnswer(it, lang)}</span>
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
