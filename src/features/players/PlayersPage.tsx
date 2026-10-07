import { Link, useNavigate } from 'react-router-dom';
import type { Activity } from '../../domain/presence';
import { useT, type TKey } from '../../i18n';
import { useProgress } from '../../store/progressStore';
import { useSync } from '../../sync/syncStore';
import { Button, Card } from '../../ui/primitives';
import { TopBar } from '../../ui/TopBar';
import { Avatar, groupOf, PlayerCard, ShareCard, usePlayers } from './PlayerParts';

const GROUPS: { id: Activity; label: TKey }[] = [
  { id: 'now', label: 'who.now' },
  { id: 'today', label: 'who.today' },
  { id: 'week', label: 'who.week' },
];

/** "Wer ist da": everyone who shared their card this week, grouped by when they were last seen. */
export default function PlayersPage() {
  const t = useT();
  const navigate = useNavigate();
  const { cards, status, now, signedIn } = usePlayers();
  const me = useSync((s) => s.user?.uid ?? null);
  const sharing = useProgress((s) => !!s.root.profile.share?.on);
  const syncStatus = useSync((s) => s.status);

  return (
    <div className="app-shell">
      <TopBar />
      <main className="page players-page">
        <header className="section-head">
          <h1 className="page-title">{t('who.title')}</h1>
          <p className="muted">{t('who.subtitle')}</p>
        </header>

        {!signedIn || syncStatus === 'unconfigured' ? (
          <Card>
            <p>{t('who.signedOut')}</p>
            <div className="actions">
              <Button variant="primary" onClick={() => navigate('/profile')}>
                {t('who.toProfile')}
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {!sharing && <ShareCard />}
            {status === 'loading' && <p className="muted">{t('who.loading')}</p>}
            {status === 'error' && <p className="notice notice-error">{t('who.error')}</p>}
            {status === 'ready' && cards.length === 0 && <p className="muted">{t('who.empty')}</p>}
            {GROUPS.map((g) => {
              const list = cards.filter((c) => groupOf(c, now) === g.id);
              if (!list.length) return null;
              return (
                <section key={g.id} className="players-group" aria-label={t(g.label)}>
                  <h2 className="section-label">
                    {t(g.label)} <span className="muted tabular">· {list.length}</span>
                  </h2>
                  <div className="players-grid">
                    {list.map((c) => (
                      <PlayerCard key={c.uid} card={c} me={c.uid === me} now={now} />
                    ))}
                  </div>
                </section>
              );
            })}
            {sharing && <ShareCard />}
          </>
        )}
      </main>
    </div>
  );
}

/** Home page: who is around, in one line, with a link to the list. */
export function PlayersStrip() {
  const t = useT();
  const syncStatus = useSync((s) => s.status);
  const { cards: all, now, signedIn, status } = usePlayers();
  const me = useSync((s) => s.user?.uid ?? null);
  if (syncStatus === 'unconfigured') return null;
  // The strip shows the others; the own card is on the list page.
  const cards = all.filter((c) => c.uid !== me);
  if (!signedIn) {
    return (
      <Card className="players-strip">
        <div className="players-strip-head">
          <h2 className="card-label">{t('who.title')}</h2>
        </div>
        <p className="muted small">
          {t('who.signedOut')} <Link to="/profile">{t('who.toProfile')}</Link>
        </p>
      </Card>
    );
  }
  const active = cards.filter((c) => groupOf(c, now) === 'now');
  const shown = (active.length ? active : cards).slice(0, 8);
  return (
    <Card className="players-strip">
      <div className="players-strip-head">
        <h2 className="card-label">{t('who.title')}</h2>
        <span className="muted small">{active.length ? t('who.activeNow', { n: active.length }) : t('who.recent', { n: cards.length })}</span>
        <Link to="/players" className="players-strip-link small">
          {t('who.all')}
        </Link>
      </div>
      {shown.length > 0 ? (
        <ul className="players-strip-list">
          {shown.map((c) => (
            <li key={c.uid}>
              <Link to="/players" className="players-strip-item">
                <Avatar uid={c.uid} name={c.name} size="s" />
                <span className="players-strip-name">{c.name}</span>
                {groupOf(c, now) === 'now' && <span className="player-dot" aria-hidden="true" />}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted small">{status === 'ready' ? t('who.empty') : status === 'error' ? t('who.error') : t('who.loading')}</p>
      )}
    </Card>
  );
}
