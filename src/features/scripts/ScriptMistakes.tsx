import { dayKey } from '../../domain/dates';
import { reviewList } from '../../domain/mistakes';
import { SCRIPT_BY_ID, SCRIPTS_COURSE_ID } from '../../domain/scriptCourse';
import { useLang, useT } from '../../i18n';
import { useProgress } from '../../store/progressStore';
import { ButtonLink, Card } from '../../ui/primitives';
import { ScriptText } from './ScriptParts';
import { MistakeMark } from '../mistakes/MistakesCard';

/** Fehler-Review for the scripts course: today's (or yesterday's) confused scripts. */
export function MistakesList() {
  const t = useT();
  const lang = useLang();
  const log = useProgress((s) => s.root.courses[SCRIPTS_COURSE_ID]?.mistakes);
  const list = reviewList(log, dayKey());
  const items = (list?.items ?? []).filter((m) => SCRIPT_BY_ID.has(m.id));
  if (!list || !items.length) return null;
  const fixed = items.filter((m) => m.fixed).length;
  return (
    <Card className="mistakes-card">
      <div className="mistakes-head">
        <h2 className="card-label">{list.when === 'today' ? t('mistakes.today', { n: items.length }) : t('mistakes.yesterday', { n: items.length })}</h2>
        {fixed > 0 && <span className="muted small">{t('mistakes.fixedCount', { n: fixed })}</span>}
      </div>
      <ul className="mistakes-list">
        {items.slice(0, 8).map((m) => {
          const e = SCRIPT_BY_ID.get(m.id)!;
          return (
            <li key={m.id} className={m.fixed ? 'is-fixed' : ''}>
              <ScriptText entry={e} className="native">
                {e.samples[0].native}
              </ScriptText>
              <span className="muted">{e.where[lang]}</span>
              <MistakeMark fixed={m.fixed} n={m.n} />
            </li>
          );
        })}
      </ul>
      <div className="actions">
        <ButtonLink variant="primary" to={`/scripts/practice?ids=${items.map((m) => m.id).join(',')}`}>
          {t('mistakes.practise')}
        </ButtonLink>
      </div>
    </Card>
  );
}
