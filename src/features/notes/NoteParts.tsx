import { useEffect, useRef, useState } from 'react';
import { NOTE_MAX, noteOf } from '../../domain/notes';
import { useT } from '../../i18n';
import { useProgress } from '../../store/progressStore';
import './notes.css';

const useNote = (courseId: string, itemId: string) => useProgress((s) => noteOf(s.root.courses[courseId]?.notes, itemId));

/**
 * The player's own Eselsbrücke for an item: shown when there is one, editable
 * in place. `invite` shows the "add one" button when there is none (after a
 * mistake it is worded as a nudge).
 */
export function NoteEditor({
  courseId,
  itemId,
  invite = 'plain',
  suggestion,
}: {
  courseId: string;
  itemId: string;
  invite?: 'plain' | 'mistake' | 'hard' | 'none';
  /** A suggested Eselsbrücke from the course, offered while there is no own note. */
  suggestion?: string;
}) {
  const t = useT();
  const note = useNote(courseId, itemId);
  const setNote = useProgress((s) => s.setNote);
  const [editing, setEditing] = useState(false);
  // Until the first own note in this course, a suggestion is just shown; the choices open on request.
  const firstTime = useProgress((s) => !Object.values(s.root.courses[courseId]?.notes ?? {}).some((n) => n.t));
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState(note);
  const area = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) area.current?.focus();
  }, [editing]);

  const open = (text = note) => {
    setDraft(text);
    setEditing(true);
  };
  const save = () => {
    setNote(courseId, itemId, draft);
    setEditing(false);
  };

  if (editing) {
    return (
      <div
        className="note-editor"
        onKeyDown={(e) => {
          // The session reacts to Enter and Escape; while writing they belong to the note.
          e.stopPropagation();
          if (e.key === 'Escape') setEditing(false);
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save();
        }}
      >
        <label className="note-label" htmlFor={`note-${itemId}`}>
          {t('notes.title')}
        </label>
        <textarea
          id={`note-${itemId}`}
          ref={area}
          className="text-input note-input"
          value={draft}
          maxLength={NOTE_MAX}
          rows={3}
          placeholder={t('notes.placeholder')}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="note-actions">
          <button type="button" className="btn btn-primary" onClick={save}>
            {t('notes.save')}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>
            {t('common.cancel')}
          </button>
          {note && (
            <button
              type="button"
              className="btn btn-ghost note-delete"
              onClick={() => {
                setNote(courseId, itemId, '');
                setEditing(false);
              }}
            >
              {t('notes.delete')}
            </button>
          )}
          <span className="note-count muted small tabular">
            {[...draft].length}/{NOTE_MAX}
          </span>
        </div>
      </div>
    );
  }

  if (note) {
    return (
      <div className="note-view">
        <p className="note-label">{t('notes.title')}</p>
        <p className="note-text">{note}</p>
        <button type="button" className="note-link" onClick={() => open()}>
          {t('notes.edit')}
        </button>
      </div>
    );
  }

  if (invite === 'none') return null;
  const label = invite === 'mistake' ? t('notes.suggestionAfterMistake') : invite === 'hard' ? t('notes.suggestionHard') : t('notes.suggestion');
  if (suggestion && invite === 'plain' && firstTime && !expanded) {
    return (
      <div className="note-suggestion is-quiet">
        <p className="note-label">{label}</p>
        <p className="note-text">{suggestion}</p>
        <button type="button" className="note-link" onClick={() => setExpanded(true)}>
          <span aria-hidden="true">✎</span> {t('notes.keepOpen')}
        </button>
      </div>
    );
  }
  if (suggestion) {
    return (
      <div className="note-suggestion">
        <p className="note-label">{label}</p>
        <p className="note-text">{suggestion}</p>
        <div className="note-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setNote(courseId, itemId, suggestion)}>
            {t('notes.adopt')}
          </button>
          <button type="button" className="note-link" onClick={() => open(suggestion)}>
            {t('notes.adapt')}
          </button>
          <button type="button" className="note-link" onClick={() => open('')}>
            {t('notes.ownInstead')}
          </button>
        </div>
      </div>
    );
  }
  return (
    <button type="button" className={`note-add${invite === 'mistake' || invite === 'hard' ? ' is-nudge' : ''}`} onClick={() => open()}>
      <span aria-hidden="true">✎</span> {invite === 'mistake' ? t('notes.addAfterMistake') : invite === 'hard' ? t('notes.addHard') : t('notes.add')}
    </button>
  );
}

/** Read-only: the note of another item (e.g. the one it was mixed up with). */
export function NoteHint({ courseId, itemId, label }: { courseId: string; itemId: string; label: string }) {
  const note = useNote(courseId, itemId);
  if (!note) return null;
  return (
    <p className="note-hint">
      <span className="muted">{label}</span> {note}
    </p>
  );
}

/** Whether an item has a note (for small markers in lists). */
export const useHasNote = (courseId: string, itemId: string) => !!useNote(courseId, itemId);
