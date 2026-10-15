import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDateTime, useLang, useT, type TKey } from '../i18n';
import { Button, Card } from '../ui/primitives';
import { useSync } from './syncStore';

/** Profile card: sign in with Google and keep progress in the cloud. Hidden when sync is not configured. */
export function SyncCard() {
  const t = useT();
  const lang = useLang();
  const { status, user, lastSyncAt, error, signIn, signOut, syncNow, prepare, deleteAccount, resolveOwner } = useSync();
  const [confirm, setConfirm] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [deleted, setDeleted] = useState(false);
  useEffect(() => {
    if (status === 'signed-out') prepare();
  }, [status, prepare]);
  if (status === 'unconfigured') return null;

  const statusLine =
    status === 'syncing'
      ? t('sync.syncing')
      : status === 'offline'
        ? t('sync.offline')
        : status === 'error'
          ? t('sync.error')
          : lastSyncAt
            ? t('sync.savedAt', { d: formatDateTime(lastSyncAt, lang) })
            : null;

  return (
    <Card className="sync-card">
      <h2 className="card-label">{t('sync.title')}</h2>
      {user ? (
        <>
          <p>
            {t('sync.signedInAs')} <strong>{user.name ?? user.email}</strong>
            {user.name && user.email && <span className="muted"> · {user.email}</span>}
          </p>
          {statusLine && (
            <p className={`small sync-status is-${status}`} role="status">
              <span className="sync-dot" aria-hidden="true" /> {statusLine}
            </p>
          )}
          {status === 'choose' ? (
            <div className="notice notice-accent" role="alert">
              <p>
                <strong>{t('sync.choose.title')}</strong>
              </p>
              <p className="small">{t('sync.choose.body')}</p>
              <div className="actions">
                <Button variant="primary" onClick={() => void resolveOwner('merge')}>
                  {t('sync.choose.merge')}
                </Button>
                <Button onClick={() => void resolveOwner('online')}>{t('sync.choose.online')}</Button>
                <Button variant="ghost" onClick={() => void signOut()}>
                  {t('sync.signOut')}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="muted small">{t('sync.howItWorks')}</p>
              <div className="actions">
                <Button onClick={() => void syncNow()} disabled={status === 'syncing'}>
                  {t('sync.now')}
                </Button>
                <Button variant="ghost" onClick={() => setLeaving(true)}>
                  {t('sync.signOut')}
                </Button>
              </div>
              {leaving && (
                <div className="notice">
                  <p>{t('sync.signOutAsk')}</p>
                  <div className="actions">
                    <Button
                      onClick={() => {
                        setLeaving(false);
                        void signOut();
                      }}
                    >
                      {t('sync.signOutKeep')}
                    </Button>
                    <Button variant="danger" onClick={() => void signOut(true)}>
                      {t('sync.signOutWipe')}
                    </Button>
                    <Button variant="ghost" onClick={() => setLeaving(false)}>
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
          <div className="danger-zone">
            {!confirm ? (
              <button type="button" className="link-danger" onClick={() => setConfirm(true)}>
                {t('sync.delete')}
              </button>
            ) : (
              <div className="notice notice-error">
                <p>{t('sync.deleteConfirm')}</p>
                <div className="actions">
                  <Button
                    variant="danger"
                    disabled={status === 'syncing'}
                    onClick={async () => {
                      if (await deleteAccount()) setDeleted(true);
                      setConfirm(false);
                    }}
                  >
                    {t('sync.deleteFinal')}
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirm(false)}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="muted">{t('sync.intro')}</p>
          <div className="actions">
            <Button variant="primary" onClick={() => void signIn()} disabled={status === 'syncing'}>
              {t('sync.signIn')}
            </Button>
          </div>
          <p className="small">
            <Link to="/privacy">{t('sync.privacyLink')}</Link>
          </p>
        </>
      )}
      {deleted && !user && (
        <p className="notice" role="status">
          {t('sync.deleted')}
        </p>
      )}
      {error && (
        <p className="notice notice-error" role="alert">
          {errorText(t, error)}
        </p>
      )}
    </Card>
  );
}

function errorText(t: ReturnType<typeof useT>, code: string): string {
  const known: Record<string, TKey> = {
    'auth/unauthorized-domain': 'sync.err.domain',
    'auth/popup-blocked': 'sync.err.popup',
    'auth/popup-closed-by-user': 'sync.err.closed',
    'auth/cancelled-popup-request': 'sync.err.closed',
    'auth/operation-not-allowed': 'sync.err.provider',
    'permission-denied': 'sync.err.rules',
    'resource-exhausted': 'sync.err.quota',
    'newer-version': 'sync.err.newer',
  };
  // For the operator: what to fix in the Firebase console (players only see a plain message).
  const fix: Record<string, string> = {
    'auth/unauthorized-domain': 'Firebase: add this domain under Authentication → Settings → Authorized domains.',
    'auth/operation-not-allowed': 'Firebase: enable Google under Authentication → Sign-in method.',
    'permission-denied': 'Firestore refused access: compare the published rules with firestore.rules.',
  };
  if (fix[code]) console.warn(fix[code]);
  return known[code] ? t(known[code]) : t('sync.err.other', { code });
}
