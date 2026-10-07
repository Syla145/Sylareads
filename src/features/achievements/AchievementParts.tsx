import { COURSES } from '../../content/registry';
import { achievementById, achievementTitle, ACHIEVEMENTS, nextGoals, type AchievementDef, type Tier } from '../../domain/achievements';
import type { CourseIndex } from '../../domain/courseIndex';
import { formatDate, useLang, useT } from '../../i18n';
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

const groupTitle = (group: string, lang: 'de' | 'en', t: ReturnType<typeof useT>) => {
  if (group === 'general') return t('ach.general');
  if (group === 'secret') return t('ach.secret');
  if (group === 'scripts') return t('scripts.title');
  return COURSES.find((c) => c.id === group)?.name[lang] ?? group;
};

/** Profile: all achievements by group; one row per family with its three tiers. */
export function AchievementsOverview() {
  const t = useT();
  const lang = useLang();
  const got = useProgress((s) => s.root.profile.achievements);
  const groups = [...new Set(ACHIEVEMENTS.map((a) => a.group))];
  const total = ACHIEVEMENTS.length;
  const done = ACHIEVEMENTS.filter((a) => got[a.id]).length;
  return (
    <Card className="ach-card">
      <h2 className="card-label">
        {t('profile.achievements')} · {done} / {total}
      </h2>
      {groups.map((g) => {
        const defs = ACHIEVEMENTS.filter((a) => a.group === g);
        const families = [...new Set(defs.map((a) => a.family))];
        const have = defs.filter((a) => got[a.id]).length;
        const open = g === 'general' || have > 0;
        return (
          <details key={g} className="ach-group" open={open}>
            <summary className="ach-group-title">
              <span>{groupTitle(g, lang, t)}</span>
              {g !== 'secret' && (
                <span className="muted small tabular">
                  {have} / {defs.length}
                </span>
              )}
            </summary>
            <ul className="achievement-list">
              {families.map((f) => {
                const tiers = defs.filter((a) => a.family === f);
                const reached = tiers.filter((a) => got[a.id]);
                const next = tiers.find((a) => !got[a.id]);
                const shown = next ?? tiers[tiers.length - 1];
                const last = reached.length ? Math.max(...reached.map((a) => got[a.id])) : 0;
                const all = !next;
                return (
                  <li key={f} className={reached.length ? 'is-unlocked' : ''}>
                    <span className="ach-medals">
                      {tiers.map((a) => (
                        <Medal key={a.id} tier={a.tier} on={!!got[a.id]} />
                      ))}
                    </span>
                    <span>
                      <strong>{tiers[0].title[lang]}</strong>
                      <span className="muted small">
                        {g === 'secret' ? (all ? t('ach.secretFound') : '?') : `${shown.tier && !all ? `${t('ach.next')}: ` : ''}${shown.description[lang]}`}
                      </span>
                    </span>
                    {last > 0 && <span className="muted small">{formatDate(last, lang)}</span>}
                  </li>
                );
              })}
            </ul>
          </details>
        );
      })}
    </Card>
  );
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
