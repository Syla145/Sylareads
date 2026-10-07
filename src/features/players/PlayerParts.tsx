import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { COURSES } from '../../content/registry';
import { activityOf, cleanName, NAME_MAX, suggestName, type Activity, type PlayerCard as Card } from '../../domain/presence';
import { SCRIPTS_COURSE_ID } from '../../domain/scriptCourse';
import { useLang, useT } from '../../i18n';
import { useProgress } from '../../store/progressStore';
import { usePresence, watchPlayers } from '../../sync/presenceStore';
import { useSync } from '../../sync/syncStore';
import { Button, Card as Panel, ProgressBar } from '../../ui/primitives';
import { FlameIcon } from '../../ui/TopBar';
import './players.css';

const AVATAR_COLORS = ['var(--state-learning)', 'var(--state-familiar)', 'var(--state-mastered)', 'var(--state-expert)', 'var(--accent)', 'var(--error)'];

function hash(s: string): number {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

export function Avatar({ uid, name, size = 'm' }: { uid: string; name: string; size?: 's' | 'm' }) {
  const initial = [...name][0]?.toUpperCase() ?? '?';
  return (
    <span className={`player-avatar is-${size}`} style={{ ['--avatar' as string]: AVATAR_COLORS[hash(uid) % AVATAR_COLORS.length] }} aria-hidden="true">
      {initial}
    </span>
  );
}

/** "gerade aktiv", "vor 12 Min.", "vor 3 Std.", "gestern", "vor 4 Tagen". */
function useSeenText() {
  const t = useT();
  return (seen: number, now: number) => {
    const ago = Math.max(0, now - seen);
    const act = activityOf(seen, now);
    if (act === 'now') return t('who.seenNow');
    if (ago < 3600_000) return t('who.seenMin', { n: Math.max(1, Math.round(ago / 60_000)) });
    if (act === 'today') return t('who.seenHours', { n: Math.max(1, Math.floor(ago / 3600_000)) });
    const days = Math.max(1, Math.round((startOfDay(now) - startOfDay(seen)) / 86_400_000));
    return days === 1 ? t('who.seenYesterday') : t('who.seenDays', { n: days });
  };
}

const startOfDay = (ts: number) => {
  const d = new Date(ts);
  d.setHours(12, 0, 0, 0);
  return d.getTime();
};

function useCourseName() {
  const t = useT();
  const lang = useLang();
  return (id: string) => (id === SCRIPTS_COURSE_ID ? t('scripts.title') : (COURSES.find((c) => c.id === id)?.name[lang] ?? id));
}

/** One player: who, when, what they learn and how far. */
export function PlayerCard({ card, me, now }: { card: Card; me: boolean; now: number }) {
  const t = useT();
  const seenText = useSeenText();
  const courseName = useCourseName();
  const act = activityOf(card.seen, now);
  const main = card.courses[card.course] ? card.course : (Object.keys(card.courses)[0] ?? '');
  const c = card.courses[main];
  const others = Object.entries(card.courses).filter(([id]) => id !== main);
  return (
    <article className={`player-card${me ? ' is-me' : ''}`}>
      <header className="player-head">
        <Avatar uid={card.uid} name={card.name} />
        <span className="player-who">
          <span className="player-name-line">
            <span className="player-name">{card.name}</span>
            {me && <span className="badge badge-accent">{t('who.you')}</span>}
          </span>
          <span className={`player-seen${act === 'now' ? ' is-now' : ''}`}>
            {act === 'now' && <span className="player-dot" aria-hidden="true" />}
            {seenText(card.seen, now)}
          </span>
        </span>
      </header>
      {c ? (
        <div className="player-course">
          <p className="player-course-line">
            <span className="muted">{t('who.learns')}</span> <strong>{courseName(main)}</strong>
            <span className="player-pct tabular">{c.m} %</span>
          </p>
          <ProgressBar value={c.m / 100} size="sm" label={`${courseName(main)} ${c.m} %`} />
          <p className="muted small">
            {t('who.lessons', { n: c.l, total: c.lt })}
            {c.ct ? ` · ${t('who.cities', { n: c.c ?? 0, total: c.ct })}` : ''}
          </p>
        </div>
      ) : (
        <p className="muted small">{t('who.noCourse')}</p>
      )}
      <footer className="player-foot">
        <span className={`chip chip-streak${card.streak > 0 ? ' is-on' : ''}`} title={t('who.streakTitle', { n: card.streak })}>
          <FlameIcon />
          {card.streak}
        </span>
        <span className="chip">{t('who.level', { n: card.level })}</span>
        {others.map(([id, o]) => (
          <span key={id} className="chip player-other">
            {courseName(id)} <span className="tabular">{o.m} %</span>
          </span>
        ))}
      </footer>
    </article>
  );
}

/** Loads the list while mounted; returns the cards and a clock that ticks with each refresh. */
export function usePlayers() {
  const signedIn = useSync((s) => !!s.user);
  const { cards, status, loadedAt } = usePresence();
  useEffect(() => (signedIn ? watchPlayers() : undefined), [signedIn]);
  return { cards, status, now: loadedAt ?? Date.now(), signedIn };
}

export const groupOf = (card: Card, now: number): Activity => activityOf(card.seen, now) ?? 'week';

/** Opt-in for the own card: switch and display name. Shown in the profile and on the list page. */
export function ShareCard({ withLink = false }: { withLink?: boolean }) {
  const t = useT();
  const user = useSync((s) => s.user);
  const status = useSync((s) => s.status);
  const share = useProgress((s) => s.root.profile.share);
  const setShare = useProgress((s) => s.setShare);
  const [name, setName] = useState(share?.name || suggestName(user?.name));
  const [error, setError] = useState(false);
  useEffect(() => {
    if (share?.name) setName(share.name);
  }, [share?.name]);
  useEffect(() => {
    if (!share?.name && user?.name) setName((n) => n || suggestName(user.name));
  }, [user?.name, share?.name]);
  if (status === 'unconfigured') return null;

  const on = !!share?.on;
  const clean = cleanName(name);
  const toggle = () => {
    if (!on && !clean) return setError(true);
    setError(false);
    setShare(!on, clean || share?.name || '');
  };
  const save = () => {
    if (!clean) return setError(true);
    setError(false);
    setShare(on, clean);
  };

  return (
    <Panel className="share-card">
      <h2 className="card-label">{t('who.share.title')}</h2>
      <p className="muted small">{t('who.share.intro')}</p>
      {user ? (
        <>
          <label className="switch share-switch">
            <input type="checkbox" role="switch" checked={on} onChange={toggle} />
            <span className="switch-track" aria-hidden="true" />
            <span>{t('who.share.toggle')}</span>
          </label>
          <label className="share-name">
            <span className="small">{t('who.share.name')}</span>
            <span className="share-name-row">
              <input
                className="text-input"
                value={name}
                maxLength={NAME_MAX + 8}
                autoComplete="nickname"
                onChange={(e) => {
                  setName(e.target.value);
                  setError(false);
                }}
                onKeyDown={(e) => e.key === 'Enter' && save()}
              />
              {clean !== (share?.name ?? '') && clean && <Button onClick={save}>{t('who.share.save')}</Button>}
            </span>
          </label>
          {error && (
            <p className="notice notice-error" role="alert">
              {t('who.share.needName')}
            </p>
          )}
          <p className={`small share-state${on ? ' is-on' : ''}`} role="status">
            {on ? t('who.share.on') : t('who.share.off')}
            {withLink && (
              <>
                {' '}
                <Link to="/players">{t('who.share.toList')}</Link>
              </>
            )}
          </p>
        </>
      ) : (
        <p className="notice">{t('who.share.signIn')}</p>
      )}
    </Panel>
  );
}
