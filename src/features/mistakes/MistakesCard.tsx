import { dayKey } from '../../domain/dates';
import { reviewList } from '../../domain/mistakes';
import { useLang, useT } from '../../i18n';
import { useProgress } from '../../store/progressStore';
import { ButtonLink, Card } from '../../ui/primitives';
import { useCourse } from '../course/useCourse';
import { itemAnswer, itemNative } from '../tempo/labels';

const SHOWN = 8;

/** Practice link for exactly these items: still-wrong ones first. */
export const mistakesPracticePath = (slug: string, ids: string[]) => `/${slug}/practice/run?ids=${ids.join(',')}`;

/**
 * Fehler-Review: "Heute falsch" with a button to practise exactly these items.
 * Shows yesterday's list in the morning, before anything went wrong today.
 * Renders nothing when there is nothing to review.
 */
export function MistakesCard({ className = '' }: { className?: string }) {
  const { meta, index } = useCourse();
  const t = useT();
  const lang = useLang();
  const log = useProgress((s) => s.root.courses[meta.id]?.mistakes);
  const list = reviewList(log, dayKey());
  if (!list) return null;
  const items = list.items.filter((m) => index.byId.has(m.id));
  if (!items.length) return null;
  const open = items.filter((m) => !m.fixed).length;
  const fixed = items.length - open;

  return (
    <Card className={`mistakes-card ${className}`}>
      <div className="mistakes-head">
        <h2 className="card-label">{list.when === 'today' ? t('mistakes.today', { n: items.length }) : t('mistakes.yesterday', { n: items.length })}</h2>
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
              <span className="mistakes-mark small">
                {m.fixed ? (
                  <span className="mistakes-fixed" title={t('mistakes.fixed')} aria-label={t('mistakes.fixed')}>
                    <span aria-hidden="true">✓</span>
                    <span className="mistakes-fixed-label"> {t('mistakes.fixed')}</span>
                  </span>
                ) : m.n > 1 ? (
                  <span className="tabular">{m.n}×</span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
      {items.length > SHOWN && <p className="muted small">{t('mistakes.more', { n: items.length - SHOWN })}</p>}
      <div className="actions">
        <ButtonLink variant="primary" to={mistakesPracticePath(meta.slug, items.map((m) => m.id))}>
          {t('mistakes.practise')}
        </ButtonLink>
        {open > 0 && fixed > 0 && <ButtonLink to={mistakesPracticePath(meta.slug, items.filter((m) => !m.fixed).map((m) => m.id))}>{t('mistakes.practiseOpen', { n: open })}</ButtonLink>}
      </div>
    </Card>
  );
}
