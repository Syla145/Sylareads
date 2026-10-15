import { COUNTRIES } from '../../content/registry';
import { letterGlyphs, readingOf, type CourseIndex } from '../../domain/courseIndex';
import type { SessionState } from '../../domain/sessionEngine';
import type { GradedTask } from '../../domain/tasks';
import type { PlaceItem } from '../../domain/types';
import { placeNameLine, useLang, useT } from '../../i18n';
import { layerOfItem, mapGroupOf } from '../map/layer';
import { MapView } from '../map/MapView';
import { ClickedLine, ConfusionLine } from './SessionRunner';
import { NoteEditor, NoteHint } from '../notes/NoteParts';

/**
 * Feedback after every graded answer. For places it always shows the full
 * chain: original script → transliteration → known names (UI language first)
 * → country, whichever form the learner typed (spec sections 7 and 8).
 */
export function FeedbackPanel({ index, task, state }: { index: CourseIndex; task: GradedTask; state: SessionState }) {
  const t = useT();
  const lang = useLang();
  const item = index.byId.get(task.itemId);
  if (!item) return null;
  const result = state.lastResult;
  const tone = feedbackTone(task, state);
  const ok = tone !== 'wrong';
  const guessed = tone === 'retry';
  const title = result === 'C' ? t('session.correct') : guessed ? t('session.correctRetryChoice') : result === 'R' ? t('session.correctRetry') : t('session.wrong');
  const typed = task.kind !== 'choice' && task.kind !== 'locate';
  const mapShown = task.kind === 'locate' || (task.kind === 'choice' && task.question === 'map');

  return (
    <div className={`feedback is-${tone}`}>
      <p className="feedback-title">
        <span className="fb-icon" aria-hidden="true">
          <ToneIcon tone={tone} />
        </span>
        {title}
      </p>

      {item.kind === 'letter' && (
        <div className="fb-body">
          <div className="fb-native">
            <span lang={index.content.id} className="glyph glyph-m">
              {letterGlyphs(item)}
            </span>
            <span className="fb-reading">{item.reading || t('session.noSound')}</span>
          </div>
          {(!ok || task.kind === 'choice') && <p className="fb-note">{item.mnemonic[lang]}</p>}
          {item.note && <p className="fb-note muted">{item.note[lang]}</p>}
        </div>
      )}

      {item.kind === 'combo' && (
        <div className="fb-body">
          <div className="fb-native">
            <span lang={index.content.id} className="glyph glyph-m">{item.native}</span>
            <span className="fb-reading">{item.reading}</span>
          </div>
          {item.note && <p className="fb-note">{item.note[lang]}</p>}
        </div>
      )}

      {(item.kind === 'word' || item.kind === 'term' || item.kind === 'element') && (
        <div className="fb-body">
          <div className="fb-native">
            <span lang={index.content.id} className={`glyph glyph-${item.native.length > 10 ? 's' : 'm'}`}>{item.native}</span>
            <span className="fb-reading">{readingOf(index, item)}</span>
          </div>
          <dl className="fb-facts">
            <div>
              <dt>{t('session.meaningLabel')}</dt>
              <dd>{item.meaning[lang][0]}</dd>
            </div>
            {item.abbr && (
              <div>
                <dt>{t('session.abbr')}</dt>
                <dd lang={index.content.id} className="native">{item.abbr.join('  ')}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {(item.kind === 'city' || item.kind === 'region') && <PlaceFacts index={index} place={item} withMap={!mapShown} />}

      <NoteEditor
        courseId={index.content.id}
        itemId={item.id}
        invite={ok ? 'none' : state.evaluation?.confusedWith ? 'mistake' : 'hard'}
        suggestion={index.content.noteHints?.[item.id]?.[lang]}
      />

      {!ok && typed && state.evaluation?.confusedWith && <ConfusionLine index={index} input={state.lastInput} otherId={state.evaluation.confusedWith} />}
      {!ok && state.evaluation?.confusedWith && <NoteHint courseId={index.content.id} itemId={state.evaluation.confusedWith} label={t('notes.otherLabel')} />}
      {!ok && task.kind === 'locate' && state.lastInput && <ClickedLine index={index} id={state.lastInput} />}
      {!ok && task.kind === 'choice' && (task.question === 'scan' || task.question === 'map') && <ScanMiss index={index} state={state} task={task} />}
    </div>
  );
}

/**
 * How an answer felt: right at once (or typed right on the second try), a
 * second pick out of the few choices left (close to a guess: neutral), or wrong.
 */
export function feedbackTone(task: GradedTask, state: SessionState): 'correct' | 'retry' | 'wrong' {
  const result = state.lastResult;
  if (result === 'W') return 'wrong';
  return result === 'R' && task.kind === 'choice' ? 'retry' : 'correct';
}

export function ToneIcon({ tone }: { tone: 'correct' | 'retry' | 'wrong' }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      {tone === 'correct' ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : tone === 'wrong' ? <path d="M7 7l10 10M17 7L7 17" /> : <path d="M19 12a7 7 0 1 1-2.05-4.95M19 4v4h-4" />}
    </svg>
  );
}

function PlaceFacts({ index, place, withMap }: { index: CourseIndex; place: PlaceItem; withMap: boolean }) {
  const t = useT();
  const lang = useLang();
  const region = place.regionId ? (index.byId.get(place.regionId) as PlaceItem | undefined) : undefined;
  const onMap = withMap && index.map && index.mapShapes.has(place.id);
  const group = !region && index.mapShapes.has(place.id) ? mapGroupOf(index, place.id) : undefined;
  return (
    <div className={`fb-body fb-place${onMap ? ' has-map' : ''}`}>
      {onMap && <MapView index={index} label={t('map.label')} marks={{ [place.id]: 'correct' }} focus={[place.id]} minFrame={0.55} className="map-mini" />}
      <span lang={index.content.id} className={`glyph glyph-${place.native.length > 14 ? 's' : 'm'}`}>{place.native}</span>
      <p className="fb-names">{placeNameLine(place, lang)}</p>
      <dl className="fb-facts">
        <div>
          <dt>{t('session.transliteration')}</dt>
          <dd>{place.translit}</dd>
        </div>
        <div>
          <dt>{t('session.country')}</dt>
          <dd>{COUNTRIES[place.countryId].name[lang]}</dd>
        </div>
        {region && (
          <div>
            <dt>{t('session.region')}</dt>
            <dd>{lang === 'de' ? region.names.de : region.names.en}</dd>
          </div>
        )}
        {group?.name && (
          <div>
            <dt>{t(`map.group.${layerOfItem(place)}`)}</dt>
            <dd>{group.name[lang]}</dd>
          </div>
        )}
      </dl>
      {place.hint && <p className="fb-note">{place.hint[lang]}</p>}
    </div>
  );
}

function ScanMiss({ index, state, task }: { index: CourseIndex; state: SessionState; task: Extract<GradedTask, { kind: 'choice' }> }) {
  const lang = useLang();
  const chosen = state.eliminated.map((i) => task.options[i]).find((o) => !o.correct);
  const other = chosen?.itemId ? (index.byId.get(chosen.itemId) as PlaceItem | undefined) : undefined;
  if (!other) return null;
  return (
    <p className="confusion">
      <span lang={index.content.id} className="native">{other.native}</span> = {other.translit} ({lang === 'de' ? other.names.de : other.names.en})
    </p>
  );
}
