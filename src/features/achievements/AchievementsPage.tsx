import { useState } from 'react';
import { COURSES } from '../../content/registry';
import { achievementTitle, ACHIEVEMENTS, type AchievementDef } from '../../domain/achievements';
import { formatDate, useLang, useT } from '../../i18n';
import { useProgress } from '../../store/progressStore';
import { TopBar } from '../../ui/TopBar';
import { SiteFooter } from '../legal/SiteFooter';
import './achievements.css';

const GROUPS = [...new Set(ACHIEVEMENTS.map((a) => a.group))];

/** Erfolge: one badge per family (with its tiers), filtered by course. */
export default function AchievementsPage() {
  const t = useT();
  const lang = useLang();
  const got = useProgress((s) => s.root.profile.achievements);
  const [group, setGroup] = useState<string>('all');
  const done = ACHIEVEMENTS.filter((a) => got[a.id]).length;

  const groupName = (g: string) =>
    g === 'general' ? t('ach.general') : g === 'secret' ? t('ach.secret') : g === 'scripts' ? t('scripts.title') : (COURSES.find((c) => c.id === g)?.name[lang] ?? g);

  const shown = GROUPS.filter((g) => group === 'all' || g === group);

  return (
    <div className="app-shell">
      <TopBar />
      <main className="page ach-page">
        <header className="section-head">
          <h1 className="page-title">{t('profile.achievements')}</h1>
          <p className="muted">{t('ach.pageSub', { n: done, total: ACHIEVEMENTS.length })}</p>
        </header>

        <div className="ach-filter" role="group" aria-label={t('ach.filter')}>
          {['all', ...GROUPS].map((g) => {
            const defs = ACHIEVEMENTS.filter((a) => g === 'all' || a.group === g);
            const have = defs.filter((a) => got[a.id]).length;
            return (
              <button key={g} type="button" className={`ach-chip${group === g ? ' is-active' : ''}`} aria-pressed={group === g} onClick={() => setGroup(g)}>
                {g === 'all' ? t('ach.all') : groupName(g)}
                {g !== 'secret' && <span className="ach-chip-count tabular">{have}/{defs.length}</span>}
              </button>
            );
          })}
        </div>

        {shown.map((g) => {
          const defs = ACHIEVEMENTS.filter((a) => a.group === g);
          const families = [...new Set(defs.map((a) => a.family))];
          return (
            <section key={g} className="ach-section" aria-labelledby={`ach-${g}`}>
              <h2 id={`ach-${g}`} className="ach-section-title">
                {groupName(g)}
              </h2>
              <ul className="ach-grid">
                {families.map((f) => (
                  <Badge key={f} tiers={defs.filter((a) => a.family === f)} got={got} secret={g === 'secret'} />
                ))}
              </ul>
            </section>
          );
        })}
      </main>
      <SiteFooter />
    </div>
  );
}

function Badge({ tiers, got, secret }: { tiers: AchievementDef[]; got: Record<string, number>; secret: boolean }) {
  const t = useT();
  const lang = useLang();
  const reached = tiers.filter((a) => got[a.id]);
  const next = tiers.find((a) => !got[a.id]);
  const top = reached[reached.length - 1];
  const last = reached.length ? Math.max(...reached.map((a) => got[a.id])) : 0;
  const tier = top?.tier ?? (reached.length ? 3 : 0);
  const title = secret && !reached.length ? '?' : tiers[0].title[lang];
  const line = secret ? (reached.length ? t('ach.secretFound') : t('ach.secretHint')) : next ? `${next.tier ? `${t('ach.next')}: ` : ''}${next.description[lang]}` : t('ach.allTiers');
  return (
    <li className={`ach-badge${reached.length ? ' is-on' : ''}${!next ? ' is-complete' : ''}`}>
      <span className={`ach-big-medal tier-${tier}`} aria-hidden="true">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
          <path d="M8 3h8l-2 6h-4z" />
          <circle cx="12" cy="15" r="5" />
        </svg>
      </span>
      <span className="ach-badge-title">{top ? achievementTitle(top, lang) : title}</span>
      {tiers.length > 1 && (
        <span className="ach-tiers" role="img" aria-label={t('ach.tiersOf', { n: reached.length, total: tiers.length })}>
          {tiers.map((a) => (
            <span key={a.id} className={`ach-tier-dot tier-${a.tier ?? 0}${got[a.id] ? ' is-on' : ''}`} />
          ))}
        </span>
      )}
      <span className="ach-badge-line">{line}</span>
      {last > 0 && <span className="ach-badge-date">{formatDate(last, lang)}</span>}
    </li>
  );
}
