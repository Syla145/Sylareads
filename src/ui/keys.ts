/**
 * Keyboard shortcuts in sessions (Enter = check/continue, 1–4 = pick) must not
 * take keys away from a focused control: Enter on a focused button presses
 * that button, typing in a text field types.
 */

const el = (target: EventTarget | null) => (target && (target as HTMLElement).tagName ? (target as HTMLElement) : null);

/** Text is being typed here (other than the session's own answer field). */
export function isTyping(target: EventTarget | null): boolean {
  const e = el(target);
  if (!e) return false;
  if (e.isContentEditable || e.tagName === 'TEXTAREA' || e.tagName === 'SELECT') return true;
  return e.tagName === 'INPUT' && !e.classList.contains('answer-input');
}

/** Enter belongs to the focused element (a button, link or text field), not to the session. */
export function ownsEnter(target: EventTarget | null): boolean {
  const e = el(target);
  if (!e) return false;
  if (isTyping(e)) return true;
  if (e.tagName === 'BUTTON' || e.tagName === 'A' || e.tagName === 'SUMMARY') return true;
  return !!e.closest('[role="button"], dialog, .note-editor');
}
