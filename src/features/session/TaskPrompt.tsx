import type { RefObject } from 'react';
import type { CourseIndex } from '../../domain/courseIndex';
import type { SessionState } from '../../domain/sessionEngine';
import type { GradedTask } from '../../domain/tasks';
import type { PlaceItem } from '../../domain/types';
import { placeNames, useLang, useT } from '../../i18n';

/** Glyph size by length so long names never overflow and nothing jumps. */
export function sizeFor(text: string): 'xl' | 'l' | 'm' | 's' {
  const n = Array.from(text).length;
  if (n <= 2) return 'xl';
  if (n <= 9) return 'l';
  if (n <= 16) return 'm';
  return 's';
}

interface Props {
  index: CourseIndex;
  task: GradedTask;
  state: SessionState;
  input: string;
  setInput: (v: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  onChoose: (i: number) => void;
  onSubmit: () => void;
}

export function TaskPrompt({ index, task, state, input, setInput, inputRef, onChoose }: Props) {
  const t = useT();
  const lang = useLang();
  const item = index.byId.get(task.itemId);
  const feedback = state.phase === 'feedback';

  let prompt: string;
  if (task.kind === 'identify') prompt = item?.kind === 'region' ? t('session.identifyRegion') : t('session.identifyCity');
  else if (task.kind === 'meaning') prompt = t('session.meaning');
  else if (task.kind === 'read') prompt = item?.kind === 'letter' ? t('session.readLetter') : t('session.read');
  else if (task.question === 'reading') prompt = t('session.choiceReading');
  else if (task.question === 'glyph') prompt = t('session.choiceGlyph', { r: task.display });
  else if (task.question === 'function') prompt = t('session.choiceFunction');
  else prompt = t('session.scan', { name: placeNames(item as PlaceItem, lang)[0] });

  const isScan = task.kind === 'choice' && task.question === 'scan';
  const isGlyphChoice = task.kind === 'choice' && task.question === 'glyph';
  const display = task.kind === 'choice' && (isScan || isGlyphChoice) ? null : task.display;

  const inputState = feedback ? (state.lastResult === 'W' ? ' is-wrong' : ' is-correct') : '';
  const placeholder =
    task.kind === 'identify' ? t('session.placeholderPlace') : task.kind === 'meaning' ? t('session.placeholderMeaning') : t('session.placeholderRead');

  return (
    <div className="task">
      <p className="task-prompt">{prompt}</p>
      {display !== null && (
        <div className="plate">
          <span className={`glyph glyph-${sizeFor(display)}`} lang={index.content.id}>
            {display}
          </span>
        </div>
      )}
      {isGlyphChoice && (
        <div className="plate plate-latin">
          <span className="glyph glyph-l latin">{task.display}</span>
        </div>
      )}

      {task.kind === 'choice' ? (
        <div className={`choices${isScan ? ' choices-sign' : ''}${task.question === 'function' ? ' choices-text' : ''}`} role="group" aria-label={prompt}>
          {task.options.map((opt, i) => {
            const eliminated = state.eliminated.includes(i);
            const reveal = feedback && opt.correct;
            const chosenWrong = feedback && eliminated;
            const label = opt.l10n ? opt.l10n[lang] : opt.label ?? '';
            return (
              <button
                key={i}
                type="button"
                className={`choice${eliminated ? ' is-out' : ''}${reveal ? ' is-correct' : ''}${chosenWrong ? ' is-wrong' : ''}`}
                disabled={feedback || eliminated}
                onClick={() => onChoose(i)}
              >
                <kbd aria-hidden="true">{i + 1}</kbd>
                <span className={opt.l10n ? 'choice-text' : isScan || isGlyphChoice ? 'choice-native' : 'choice-latin'} lang={isScan || isGlyphChoice ? index.content.id : undefined}>
                  {label === '' ? '–' : label}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="answer">
          <input
            ref={inputRef}
            className={`answer-input${inputState}`}
            value={input}
            onChange={(e) => !feedback && setInput(e.target.value)}
            readOnly={feedback}
            placeholder={placeholder}
            aria-label={placeholder}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint={feedback ? 'next' : 'go'}
            inputMode="text"
          />
        </div>
      )}
    </div>
  );
}
