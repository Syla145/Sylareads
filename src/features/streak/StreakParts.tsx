import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { dayKey } from '../../domain/dates';
import { missionsFinished, weekMissions, type MissionStatus } from '../../domain/missions';
import type { ProgressRoot } from '../../domain/progress';
import { SHIELD_MAX, streakAtRisk, streakView, type DayMark, type StreakView } from '../../domain/streak';
import { useLang, useT, type TKey } from '../../i18n';
import { useProgress } from '../../store/progressStore';
import { ProgressBar } from '../../ui/primitives';
import './streak.css';

/** The streak of today, recomputed when the progress changes. */
export function useStreak(): StreakView {
  const profile = useProgress((s) => s.root.profile);
  const today = dayKey();
  return useMemo(() => streakView(profile, today), [profile, today]);
}

export const STREAK_LINK = '/profile?s=serie';

export function FlameIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M12 2c1 3.5-1.5 5.5-1.5 8 0 1.4 1 2.5 2.3 2.5 1.6 0 2.4-1.4 2.2-3.3C17.6 11 19 13.2 19 15.5 19 19.6 15.9 22 12 22s-7-2.4-7-6.3C5 10.4 10.4 7.8 12 2z" />
    </svg>
  );
}

export function ShieldIcon({ size = 16, empty = false }: { size?: number; empty?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={empty ? 'shield-empty' : 'shield-full'}>
      <path
        d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z"
        fill={empty ? 'none' : 'currentColor'}
        stroke="currentColor"
        strokeWidth={empty ? 1.8 : 0}
        strokeDasharray={empty ? '3 3' : undefined}
      />
    </svg>
  );
}

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

const weekday = (day: string, lang: string) =>
  new Intl.DateTimeFormat(lang, { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${day}T12:00:00Z`)).replace('.', '');

const MARK_LABEL: Record<DayMark, TKey> = {
  done: 'streak.mark.done',
  shield: 'streak.mark.shield',
  missed: 'streak.mark.missed',
  today: 'streak.mark.today',
  future: 'streak.mark.future',
  none: 'streak.mark.none',
};

/** Big streak card: days in a row, the week from Monday, what today needs. */
export function StreakCard({ id }: { id?: string }) {
  const t = useT();
  const lang = useLang();
  const v = useStreak();
  const today = dayKey();
  const hint = v.todayDone
    ? t('streak.hint.done')
    : streakAtRisk(v, today)
      ? t('streak.hint.keep', { n: v.current + 1 })
      : t('streak.hint.start');
  return (
    <section className={`streak-card${v.current > 0 ? ' is-on' : ''}`} id={id} aria-labelledby="streak-title">
      <div className="streak-top">
        <span className="streak-flame">
          <FlameIcon size={52} />
        </span>
        <div>
          <h2 id="streak-title" className="streak-n">
            <span className="tabular">{v.current}</span>
            <span className="sr-only"> {t('streak.title')}</span>
          </h2>
          <p className="streak-sub">
            {t('streak.inRow', { n: v.current })} · {t('streak.record', { n: v.longest })}
          </p>
        </div>
      </div>
      <ol className="streak-week" aria-label={t('streak.week')}>
        {v.week.map((d) => (
          <li key={d.day} className={`is-${d.mark}`}>
            <span className="streak-wd" aria-hidden="true">
              {weekday(d.day, lang)}
            </span>
            <span className="streak-dot" aria-hidden="true">
              {d.mark === 'done' ? <Check /> : d.mark === 'shield' ? <ShieldIcon size={15} /> : null}
            </span>
            <span className="sr-only">
              {weekday(d.day, lang)}: {t(MARK_LABEL[d.mark])}
            </span>
          </li>
        ))}
      </ol>
      <p className="streak-hint">{hint}</p>
    </section>
  );
}

/** Shields: how many, what they do, when the next one comes. */
export function ShieldCard() {
  const t = useT();
  const v = useStreak();
  return (
    <section className="shield-card" aria-labelledby="shield-title">
      <div className="shield-icons" aria-hidden="true">
        {Array.from({ length: SHIELD_MAX }, (_, i) => (
          <ShieldIcon key={i} size={30} empty={i >= v.shields} />
        ))}
      </div>
      <div className="shield-text">
        <h2 id="shield-title" className="shield-title">
          {t('streak.shields', { n: v.shields })}
        </h2>
        <p>{t('streak.shieldRule')}</p>
        <p className="shield-next">{v.nextShieldIn === null ? t('streak.shieldMax') : t('streak.shieldNext', { n: v.nextShieldIn })}</p>
      </div>
    </section>
  );
}

function MissionRow({ m, shieldsFull }: { m: MissionStatus; shieldsFull: boolean }) {
  const t = useT();
  const title = t(`mission.${m.def.id}` as TKey, { n: m.def.goal });
  return (
    <li className={`mission${m.done ? ' is-done' : ''}`}>
      {m.done && (
        <span className="mission-check" aria-hidden="true">
          <Check />
        </span>
      )}
      <div className="mission-body">
        <div className="mission-head">
          <span className="mission-title">{title}</span>
          {!m.done && (
            <span className={`mission-reward${m.def.xp ? '' : ' is-shield'}`}>
              {m.def.xp ? (
                t('mission.xp', { n: m.def.xp })
              ) : (
                <>
                  <ShieldIcon size={13} /> {t('mission.shield')}
                </>
              )}
            </span>
          )}
        </div>
        {m.done ? (
          <p className="mission-done">
            {m.def.xp ? t('mission.doneXp', { n: m.def.xp }) : shieldsFull ? t('mission.doneShieldFull') : t('mission.doneShield')}
          </p>
        ) : (
          <div className="mission-progress">
            <ProgressBar value={m.progress / m.def.goal} size="sm" label={`${title}: ${m.progress} / ${m.def.goal}`} />
            <span className="mission-count tabular" aria-hidden="true">
              {m.progress}/{m.def.goal}
            </span>
          </div>
        )}
      </div>
    </li>
  );
}

/** This week's three missions. `compact` adds the streak line and a link to the full view. */
export function MissionsCard({ compact = false, id }: { compact?: boolean; id?: string }) {
  const t = useT();
  const daily = useProgress((s) => s.root.profile.daily);
  const today = dayKey();
  const wm = useMemo(() => weekMissions(daily, today), [daily, today]);
  const v = useStreak();
  const done = wm.missions.filter((m) => m.done).length;
  return (
    <section className={`missions-card${compact ? ' is-compact' : ''}`} id={id} aria-labelledby={`missions-title${compact ? '-c' : ''}`}>
      <div className="missions-head">
        <h2 id={`missions-title${compact ? '-c' : ''}`} className={compact ? 'card-label' : 'missions-title'}>
          {t('mission.title')}
          {compact && <span className="missions-count tabular"> · {done}/3</span>}
        </h2>
        <span className="missions-meta">{t('mission.left', { n: wm.daysLeft })}</span>
      </div>
      {compact && (
        <p className="missions-streak">
          <span className={`missions-flame${v.current > 0 ? ' is-on' : ''}`}>
            <FlameIcon size={15} /> {t('streak.inRowShort', { n: v.current })}
          </span>
          <span className="missions-shields">
            <ShieldIcon size={14} /> {v.shields}
            <span className="sr-only"> {t('streak.shields', { n: v.shields })}</span>
          </span>
        </p>
      )}
      <ul className="missions-list">
        {wm.missions.map((m) => (
          <MissionRow key={m.def.id} m={m} shieldsFull={v.shields >= SHIELD_MAX} />
        ))}
      </ul>
      {compact && (
        <Link className="missions-more" to={STREAK_LINK}>
          {t('mission.more')}
        </Link>
      )}
    </section>
  );
}

/** Result screens: missions finished and shields earned in this session. */
export function RewardsList({ before, after }: { before: ProgressRoot; after: ProgressRoot }) {
  const t = useT();
  const today = dayKey();
  const finished = missionsFinished(before.profile.daily, after.profile.daily, today);
  const gained = streakView(after.profile, today).shields > streakView(before.profile, today).shields;
  const shieldViaMission = finished.some((m) => m.def.xp === 0);
  if (!finished.length && !gained) return null;
  return (
    <section className="complete-block rewards">
      <h2 className="card-label">{t('mission.rewards')}</h2>
      <ul className="rewards-list">
        {finished.map((m) => (
          <li key={m.def.id}>
            <span className="rewards-icon" aria-hidden="true">
              <Check />
            </span>
            <span>
              {t('mission.finished', { m: t(`mission.${m.def.id}` as TKey, { n: m.def.goal }) })}
              <strong className="rewards-gain">{m.def.xp ? ` · ${t('mission.xp', { n: m.def.xp })}` : gained ? ` · ${t('mission.shieldGained')}` : ''}</strong>
            </span>
          </li>
        ))}
        {gained && !shieldViaMission && (
          <li>
            <span className="rewards-icon is-shield" aria-hidden="true">
              <ShieldIcon size={16} />
            </span>
            <span>{t('streak.shieldEarned')}</span>
          </li>
        )}
      </ul>
    </section>
  );
}
