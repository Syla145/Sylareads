import { useEffect, useRef, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ACHIEVEMENTS } from '../../domain/achievements';
import { levelProgress } from '../../domain/gamification';
import { effectiveLook, emojiOf, MAX_LEVEL, titleOf } from '../../domain/rewards';
import { useLang, useT } from '../../i18n';
import { useProgress } from '../../store/progressStore';
import { useSync } from '../../sync/syncStore';
import { ProgressBar } from '../../ui/primitives';
import { TopBar } from '../../ui/TopBar';
import { SiteFooter } from '../legal/SiteFooter';
import { Avatar } from '../players/PlayerParts';
import { MissionsCard, ShieldCard, StreakCard } from '../streak/StreakParts';
import './profile.css';

/** Profile: who you are (level, title), this week (streak, missions) and your collections. */
export function ProfilePage() {
  const t = useT();
  const lang = useLang();
  const profile = useProgress((s) => s.root.profile);
  const uid = useSync((s) => s.user?.uid ?? 'me');
  const lp = levelProgress(profile.xp);
  const look = effectiveLook(profile.look, lp.level);
  const name = profile.share?.name || t('profile.title');
  const got = ACHIEVEMENTS.filter((a) => profile.achievements[a.id]).length;

  const weekRef = useRef<HTMLElement>(null);
  const [params] = useSearchParams();
  // From the flame in the top bar: straight to the streak.
  useEffect(() => {
    if (params.get('s') !== 'serie') return;
    const el = weekRef.current;
    if (!el) return;
    el.scrollIntoView({ block: 'start' });
    el.focus({ preventScroll: true });
  }, [params]);

  return (
    <div className="app-shell">
      <TopBar />
      <main className="page profile">
        <header className="profile-hero">
          <Avatar uid={uid} name={name} size="l" emoji={look.emoji} frame={look.frame} />
          <div className="profile-who">
            <h1 className="profile-name">{name}</h1>
            <p className="profile-title">{titleOf(look.title)?.name[lang]}</p>
            <Link to="/level" className="profile-level">
              <span className="profile-level-line">
                <span>{t('level.of', { n: lp.level, total: MAX_LEVEL })}</span>
                <span className="tabular">{lp.span ? t('profile.xpShort', { n: lp.span - lp.into }) : t('level.max')}</span>
              </span>
              <ProgressBar value={lp.span ? lp.into / lp.span : 1} size="sm" label={t('level.of', { n: lp.level, total: MAX_LEVEL })} />
            </Link>
          </div>
          <Link to="/settings" className="profile-gear" aria-label={t('settings.title')} title={t('settings.title')}>
            <GearIcon />
          </Link>
        </header>

        <section className="profile-week" ref={weekRef} tabIndex={-1} aria-labelledby="week-title">
          <h2 id="week-title" className="profile-section-title">
            {t('profile.week')}
          </h2>
          <StreakCard />
          <ShieldCard />
          <MissionsCard />
        </section>

        <section aria-labelledby="collections-title">
          <h2 id="collections-title" className="profile-section-title">
            {t('profile.collections')}
          </h2>
          <div className="collection-tiles">
            <Tile to="/pass" tone="pass" icon={<PassIcon />} title={t('pass.title')} value={t('profile.passValue')} />
            <Tile to="/achievements" tone="ach" icon={<MedalIcon />} title={t('profile.achievements')} value={t('pass.of', { n: got, total: ACHIEVEMENTS.length })} />
            <Tile to="/level" tone="level" icon={<span className="tile-emoji">{emojiOf(look.emoji)}</span>} title={t('profile.levelTile')} value={t('pass.of', { n: lp.level, total: MAX_LEVEL })} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Tile({ to, tone, icon, title, value }: { to: string; tone: string; icon: ReactNode; title: string; value: string }) {
  return (
    <Link to={to} className={`collection-tile is-${tone}`}>
      <span className="tile-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="tile-title">{title}</span>
      <span className="tile-value tabular">{value}</span>
    </Link>
  );
}

const GearIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);

const PassIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <circle cx="12" cy="11" r="3" />
    <path d="M9 17h6" />
  </svg>
);

const MedalIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
    <path d="M8 3h8l-2 6h-4z" />
    <circle cx="12" cy="15" r="5" />
    <path d="M12 12.5l.8 1.6 1.7.2-1.2 1.2.3 1.7-1.6-.8-1.6.8.3-1.7-1.2-1.2 1.7-.2z" fill="currentColor" stroke="none" />
  </svg>
);
