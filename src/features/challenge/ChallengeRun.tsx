import { useEffect, useRef, useState } from 'react';
import { answerChallenge, currentId, isFinished, nextName, startChallenge, type ChallengeState } from '../../domain/challenge';
import type { CourseIndex } from '../../domain/courseIndex';
import type { PlaceItem } from '../../domain/types';
import { formatSeconds, placeNameLine, useLang, useT } from '../../i18n';
import { Button } from '../../ui/primitives';
import { QuitDialog } from '../session/SessionParts';

/**
 * One challenge: 10 names in the native script, the reading is typed, one
 * try each. The clock runs only while a name is visible.
 */
export function ChallengeRun({
  index,
  ids,
  title,
  onAnswer,
  onDone,
  onQuit,
}: {
  index: CourseIndex;
  ids: string[];
  title: string;
  onAnswer?: (s: ChallengeState) => void;
  onDone: (s: ChallengeState) => void;
  onQuit: (s: ChallengeState) => void;
}) {
  const t = useT();
  const lang = useLang();
  const [state, setState] = useState<ChallengeState>(() => startChallenge(ids, Date.now()));
  const [input, setInput] = useState('');
  const [quitOpen, setQuitOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const now = useNow(state.shownAt !== null);

  const id = currentId(state);
  const last = state.answers[state.answers.length - 1];
  const showing = id ? (index.byId.get(id) as PlaceItem) : null;
  const shownLast = !id && last ? (index.byId.get(last.id) as PlaceItem) : null;
  const elapsed = state.answers.reduce((s, a) => s + a.ms, 0) + (state.shownAt !== null ? Math.max(0, now - state.shownAt) : 0);

  useEffect(() => {
    inputRef.current?.focus();
  }, [state.shownAt, state.answers.length]);

  const submit = (giveUp = false) => {
    if (state.shownAt !== null) {
      if (!giveUp && !input.trim()) return;
      const next = answerChallenge(state, index, giveUp ? '' : input, Date.now());
      setState(next);
      onAnswer?.(next);
      return;
    }
    if (isFinished(state)) {
      onDone(state);
      return;
    }
    setInput('');
    setState(nextName(state, Date.now()));
  };

  return (
    <div className="session challenge">
      <header className="session-bar">
        <h1 className="sr-only">{title}</h1>
        <button type="button" className="icon-btn" aria-label={t('session.quitTitle')} onClick={() => setQuitOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>
        <div className="session-progress" role="progressbar" aria-label={t('session.progress')} aria-valuemin={0} aria-valuemax={ids.length} aria-valuenow={state.answers.length}>
          <div className="session-progress-fill" style={{ width: `${(state.answers.length / ids.length) * 100}%` }} />
        </div>
        <span className="session-count tabular">{formatSeconds(elapsed, lang)}</span>
      </header>

      <main className="session-main">
        <p className="task-prompt">{t('ch.prompt', { n: Math.min(state.answers.length + (id ? 1 : 0), ids.length), total: ids.length })}</p>
        <div className="plate">
          <span className="glyph glyph-l challenge-name" lang={index.content.id}>
            {(showing ?? shownLast)?.native}
          </span>
        </div>
        <form
          className="answer"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input
            ref={inputRef}
            className={`answer-input${!id && last ? (last.correct ? ' is-correct' : ' is-wrong') : ''}`}
            value={id ? input : (last?.input ?? '')}
            onChange={(e) => id && setInput(e.target.value)}
            readOnly={!id}
            placeholder={t('ch.placeholder')}
            aria-label={t('ch.placeholder')}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint={id ? 'go' : 'next'}
          />
        </form>
        {!id && last && shownLast && (
          <p className={`challenge-feedback ${last.correct ? 'is-correct' : 'is-wrong'}`} role="status">
            {last.correct ? t('ch.right') : t('ch.wrong')} <strong>{placeNameLine(shownLast, lang)}</strong>
            {!placeNameLine(shownLast, lang).toLowerCase().includes(shownLast.translit.toLowerCase()) && <span className="muted"> · {shownLast.translit}</span>}
          </p>
        )}
        <div className="session-actions">
          <Button variant="primary" block onClick={() => submit()} disabled={!!id && !input.trim()}>
            {id ? t('session.check') : isFinished(state) ? t('ch.toResult') : t('session.continue')}
            <kbd>{t('session.enterHint')}</kbd>
          </Button>
          {id && (
            <Button variant="ghost" block onClick={() => submit(true)}>
              {t('session.dontKnow')}
            </Button>
          )}
        </div>
      </main>

      <QuitDialog open={quitOpen} onStay={() => setQuitOpen(false)} onQuit={() => onQuit(state)} />
    </div>
  );
}

/** The current time, updated a few times per second while `running`. */
function useNow(running: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [running]);
  return running ? now : Date.now();
}
