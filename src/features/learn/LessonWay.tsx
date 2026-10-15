import { useEffect, useRef, type ReactNode } from 'react';
import { useT } from '../../i18n';
import './way.css';
import { wayLayout } from './wayLayout';

export interface WayStop {
  id: string;
  number: number;
  title: string;
  /** Glyphs or names taught in the lesson (one line under the title). */
  preview?: ReactNode;
  /** Shown in the circle of the recommended stop (e.g. its first new letter). */
  mark?: ReactNode;
  /** Language of preview and mark, for screen readers and fonts. */
  lang?: string;
  done: boolean;
  next: boolean;
  /** A short line for finished stops (best result, placed). */
  status?: string;
}

/**
 * The learning path as a winding road: one circle per lesson, finished ones
 * yellow with a tick, the recommended one big and light. Nothing is locked.
 */
export function LessonWay({ stops, onOpen, scrollToNext }: { stops: WayStop[]; onOpen: (id: string) => void; scrollToNext?: boolean }) {
  const t = useT();
  const nextRef = useRef<HTMLButtonElement>(null);

  // Bring the recommended lesson into view if it is further down the page.
  useEffect(() => {
    if (!scrollToNext) return;
    const el = nextRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.bottom > window.innerHeight - 96) {
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      window.scrollBy({ top: r.top - window.innerHeight * 0.4, behavior: reduce ? 'auto' : 'smooth' });
    }
  }, [scrollToNext]);

  const { tops, heights, xs, total, travelled, ahead } = wayLayout(stops);

  return (
    <div className="way" style={{ height: total }}>
      <svg className="way-road" viewBox={`0 0 100 ${total}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
        {ahead && <path className="way-road-ahead" d={ahead} />}
        {travelled && <path className="way-road-done" d={travelled} />}
      </svg>
      <ol className="way-stops">
        {stops.map((s, i) => {
          return (
            <li key={s.id} className={`way-stop${s.done ? ' is-done' : ''}${s.next ? ' is-next' : ''}`} style={{ top: tops[i], height: heights[i], ['--x' as string]: `${xs[i]}%` }}>
              <button type="button" className="way-btn" onClick={() => onOpen(s.id)} ref={s.next ? nextRef : undefined}>
                <span className="way-node" aria-hidden="true">
                  {s.done ? (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  ) : s.next && s.mark ? (
                    <span lang={s.lang} className="way-mark">
                      {s.mark}
                    </span>
                  ) : (
                    <span className="way-num tabular">{s.number}</span>
                  )}
                </span>
                <span className="way-label">
                  <span className="way-kicker">
                    {t('learn.lesson', { n: s.number })}
                    {s.next && <> · {t('learn.recommended')}</>}
                  </span>
                  <span className="way-title">{s.title}</span>
                  {s.preview && (
                    <span lang={s.lang} className="way-preview">
                      {s.preview}
                    </span>
                  )}
                  {s.next ? <span className="way-go">{t('dash.btn.lesson')}</span> : s.status && <span className="way-status">{s.status}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
