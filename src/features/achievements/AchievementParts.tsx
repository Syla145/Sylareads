import { achievementById, achievementTitle, nextGoals, type AchievementDef, type Tier } from '../../domain/achievements';
import type { CourseIndex } from '../../domain/courseIndex';
import { useLang, useT } from '../../i18n';
import { useProgress } from '../../store/progressStore';
import { Card, ProgressBar } from '../../ui/primitives';
import './achievements.css';

/** Freshly unlocked achievements at the end of a session. */
export function UnlockedList({ ids }: { ids: string[] }) {
  const t = useT();
  const lang = useLang();
  const defs = ids.map(achievementById).filter((a): a is AchievementDef => !!a);
  if (!defs.length) return null;
  return (
    <section className="complete-block achievement-toast" role="status">
      <h2 className="card-label">{t('complete.achievement')}</h2>
      {defs.map((a) => (
        <p key={a.id} className="ach-toast-row">
          <Medal tier={a.tier} on />
          <strong>{achievementTitle(a, lang)}</strong> <span className="muted">{a.description[lang]}</span>
        </p>
      ))}
    </section>
  );
}

function Medal({ tier, on }: { tier?: Tier; on: boolean }) {
  return <span className={`ach-medal ach-medal-${tier ?? 0}${on ? ' is-on' : ''}`} aria-hidden="true" />;
}

/** Course overview: the closest achievements with a progress bar. */
export function NextGoals({ courseId, index }: { courseId: string; index: CourseIndex | null }) {
  const t = useT();
  const lang = useLang();
  const root = useProgress((s) => s.root);
  const goals = nextGoals(root, courseId, index);
  if (!goals.length) return null;
  return (
    <Card className="ach-next">
      <h2 className="card-label">{t('ach.nextTitle')}</h2>
      <ul className="ach-next-list">
        {goals.map(({ def, value, target }) => (
          <li key={def.id}>
            <span className="ach-next-head">
              <Medal tier={def.tier} on={false} />
              <strong>{achievementTitle(def, lang)}</strong>
              <span className="muted small tabular">
                {value} / {target}
              </span>
            </span>
            <ProgressBar value={value / target} size="sm" label={def.description[lang]} />
            <span className="muted small">{def.description[lang]}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
