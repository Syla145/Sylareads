import { useState } from 'react';
import { letterGlyphs, nativeOf } from '../../domain/courseIndex';
import { dayKey } from '../../domain/dates';
import type { Item } from '../../domain/types';
import { reviewList } from '../../domain/mistakes';
import { useLang, useT } from '../../i18n';
import { useProgress } from '../../store/progressStore';
import { ButtonLink, Card } from '../../ui/primitives';
import { useCourse } from '../course/useCourse';
import { itemAnswer, itemNative } from '../tempo/labels';

const SHOWN = 8;

/** Practice link for exactly these items: still-wrong ones first. */
const mistakesPracticePath = (slug: string, ids: string[]) => `/${slug}/practice/run?ids=${ids.join(',')}`;

/**
 * Fehler-Review: "Heute falsch" with a button to practise exactly these items.
 * Shows yesterday's list in the morning, before anything went wrong today.
 * Renders nothing when there is nothing to review.
 */
export function MistakesCard({ className = '' }: { className?: string }) {
  const review = useReview();
  if (!review) return null;
  return (
    <Card className={`mistakes-card ${className}`}>
      <ReviewBody review={review} withTitle />
    </Card>
  );
}

type Review = NonNullable<ReturnType<typeof useReview>>;

/** Today's (or, in the morning, yesterday's) mistakes that still exist in the course. */
function useReview() {
  const { meta, index } = useCourse();
  const log = useProgress((s) => s.root.courses[meta.id]?.mistakes);
  const list = reviewList(log, dayKey());
  if (!list) return null;
  const items = list.items.filter((m) => index.byId.has(m.id));
  if (!items.length) return null;
  return { when: list.when, items };
}

function ReviewBody({ review, withTitle, primary = true }: { review: Review; withTitle: boolean; primary?: boolean }) {
  const { meta, index } = useCourse();
  const t = useT();
  const lang = useLang();
  const { items } = review;
  const open = items.filter((m) => !m.fixed).length;
  const fixed = items.length - open;
  return (
    <>
      <div className="mistakes-head">
        {withTitle && <h2 className="card-label">{review.when === 'today' ? t('mistakes.today', { n: items.length }) : t('mistakes.yesterday', { n: items.length })}</h2>}
        {fixed > 0 && <span className="muted small">{t('mistakes.fixedCount', { n: fixed })}</span>}
      </div>
      <ul className="mistakes-list">
        {items.slice(0, SHOWN).map((m) => {
          const it = index.byId.get(m.id)!;
          return (
            <li key={m.id} className={m.fixed ? 'is-fixed' : ''}>
              <span className="native" lang={index.content.id}>
                {itemNative(it)}
              </span>
              <span className="muted">{itemAnswer(it, lang)}</span>
              <MistakeMark fixed={m.fixed} n={m.n} />
            </li>
          );
        })}
      </ul>
      {items.length > SHOWN && <p className="muted small">{t('mistakes.more', { n: items.length - SHOWN })}</p>}
      <div className="actions">
        <ButtonLink variant={primary ? 'primary' : 'secondary'} to={mistakesPracticePath(meta.slug, items.map((m) => m.id))}>
          {t('mistakes.practise')}
        </ButtonLink>
        {open > 0 && fixed > 0 && <ButtonLink to={mistakesPracticePath(meta.slug, items.filter((m) => !m.fixed).map((m) => m.id))}>{t('mistakes.practiseOpen', { n: open })}</ButtonLink>}
      </div>
    </>
  );
}

/**
 * Dashboard: one card for everything that goes wrong – what went wrong today
 * (Fehler-Review) and what stays hard over days (weak items), with the
 * look-alike pairs as an extra button. Nothing to show: no card.
 */
export function ProblemsCard({ weakIds, confusers }: { weakIds: string[]; confusers: number }) {
  const { meta, index } = useCourse();
  const t = useT();
  const review = useReview();
  const weak = weakIds.slice(0, SHOWN).map((id) => index.byId.get(id)).filter((it): it is Item => !!it);
  const [tab, setTab] = useState<'today' | 'weak'>(review ? 'today' : 'weak');
  if (!review && !weak.length) return null;
  const shown = review && (tab === 'today' || !weak.length) ? 'today' : 'weak';
  const base = `/${meta.slug}`;
  return (
    <Card className="mistakes-card problems-card">
      <h2 className="card-label">{t('problems.title')}</h2>
      {review && weak.length > 0 && (
        <div className="segmented problems-tabs" role="tablist" aria-label={t('problems.title')}>
          <button type="button" role="tab" aria-selected={shown === 'today'} className={shown === 'today' ? 'is-on' : ''} onClick={() => setTab('today')}>
            {review.when === 'today' ? t('mistakes.today', { n: review.items.length }) : t('mistakes.yesterday', { n: review.items.length })}
          </button>
          <button type="button" role="tab" aria-selected={shown === 'weak'} className={shown === 'weak' ? 'is-on' : ''} onClick={() => setTab('weak')}>
            {t('problems.weakTab', { n: weakIds.length })}
          </button>
        </div>
      )}
      {shown === 'today' && review ? (
        <>
          <p className="muted small">{t('problems.todayHint')}</p>
          <ReviewBody review={review} withTitle={!weak.length} primary={false} />
        </>
      ) : (
        <>
          {!review && <p className="card-label-sub">{t('problems.weakTab', { n: weakIds.length })}</p>}
          <p className="muted small">{t('problems.weakHint')}</p>
          <div className="chip-row">
            {weak.map((it) => (
              <span key={it.id} className="glyph-chip" lang={index.content.id}>
                {it.kind === 'letter' ? letterGlyphs(it) : nativeOf(it)}
              </span>
            ))}
          </div>
          <div className="actions">
            <ButtonLink to={`${base}/practice/run?mode=weak`}>
              {t('dash.trainWeak')}
            </ButtonLink>
            {confusers >= 2 && <ButtonLink to={`${base}/practice/run?mode=confusers`}>{t('dash.trainConfusers')}</ButtonLink>}
          </div>
        </>
      )}
    </Card>
  );
}

/** "✓ wieder richtig" for a fixed mistake, "3×" for one made more than once. */
export function MistakeMark({ fixed, n }: { fixed: boolean; n: number }) {
  const t = useT();
  return (
    <span className="mistakes-mark small">
      {fixed ? (
        <span className="mistakes-fixed" title={t('mistakes.fixed')} aria-label={t('mistakes.fixed')}>
          <span aria-hidden="true">✓</span>
          <span className="mistakes-fixed-label"> {t('mistakes.fixed')}</span>
        </span>
      ) : n > 1 ? (
        <span className="tabular">{n}×</span>
      ) : null}
    </span>
  );
}
