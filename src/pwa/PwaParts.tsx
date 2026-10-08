import { useState } from 'react';
import { useT } from '../i18n';
import { Button, Card } from '../ui/primitives';
import { installWay, usePwa } from './pwaStore';
import './pwa.css';

/** Profile: install the app and see whether it works offline. */
export function AppCard() {
  const t = useT();
  const s = usePwa();
  const way = installWay(s);
  return (
    <Card className="app-card">
      <h2 className="card-label">{t('pwa.title')}</h2>
      {way === 'installed' ? (
        <p>{t('pwa.installed')}</p>
      ) : (
        <>
          <p className="muted">{t('pwa.why')}</p>
          {way === 'prompt' && (
            <div className="actions">
              <Button variant="primary" onClick={() => void s.install()}>
                {t('pwa.install')}
              </Button>
            </div>
          )}
          {way === 'ios' && <p className="small">{t('pwa.ios')}</p>}
          {way === 'menu' && <p className="small">{t('pwa.menu')}</p>}
        </>
      )}
      <p className={`pwa-status small${s.offlineReady ? ' is-ready' : ''}`} role="status">
        {s.offlineReady ? t('pwa.offlineReady') : s.supported ? t('pwa.preparing') : t('pwa.unsupported')}
      </p>
    </Card>
  );
}

const HINT_KEY = 'sylareads.installHint';

/** Home: a short, dismissible tip to install the app (only where installing is possible and not done yet). */
export function InstallHint() {
  const t = useT();
  const s = usePwa();
  const way = installWay(s);
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(HINT_KEY) === 'off';
    } catch {
      return false;
    }
  });
  if (hidden || way === 'installed' || way === 'menu') return null;
  const close = () => {
    setHidden(true);
    try {
      localStorage.setItem(HINT_KEY, 'off');
    } catch {
      /* storage blocked: hide for this visit */
    }
  };
  return (
    <aside className="install-hint" aria-label={t('pwa.title')}>
      <p>
        <strong>{t('pwa.hintTitle')}</strong> {way === 'ios' ? t('pwa.ios') : t('pwa.why')}
      </p>
      <div className="install-hint-actions">
        {way === 'prompt' && (
          <Button variant="primary" onClick={() => void s.install()}>
            {t('pwa.install')}
          </Button>
        )}
        <Button variant="ghost" onClick={close}>
          {t('pwa.hintClose')}
        </Button>
      </div>
    </aside>
  );
}

/** Top bar: a new version is ready. */
export function UpdateBanner() {
  const t = useT();
  const ready = usePwa((s) => s.updateReady);
  const apply = usePwa((s) => s.applyUpdate);
  if (!ready) return null;
  return (
    <div className="update-banner" role="status">
      <span>{t('pwa.update')}</span>
      <Button variant="primary" onClick={apply}>
        {t('pwa.reload')}
      </Button>
    </div>
  );
}

/** Top bar: no network right now. */
export function OfflineChip() {
  const t = useT();
  const online = usePwa((s) => s.online);
  if (online) return null;
  return (
    <span className="chip chip-offline" title={t('pwa.offlineChipTitle')}>
      {t('pwa.offlineChip')}
    </span>
  );
}
