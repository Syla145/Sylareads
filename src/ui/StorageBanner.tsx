import { useState } from 'react';
import { useT } from '../i18n';
import { corruptCopy, exportJson } from '../store/persistence';
import { useProgress } from '../store/progressStore';
import { useSync } from '../sync/syncStore';
import { downloadText } from './download';

/**
 * A problem with the progress stored on this device, shown on every page:
 * storage full (nothing is saved any more), an unreadable copy, or progress
 * from a newer app version (this old one must not overwrite it).
 */
export function StorageBanner() {
  const t = useT();
  const problem = useProgress((s) => s.storageProblem);
  const signedIn = useSync((s) => !!s.user);
  const [hidden, setHidden] = useState<string | null>(null);
  if (!problem || hidden === problem) return null;

  if (problem === 'newer') {
    return (
      <div className="storage-banner notice notice-error" role="alert">
        <p>{t('storage.newer')}</p>
        <div className="actions">
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
            {t('error.reload')}
          </button>
        </div>
      </div>
    );
  }
  if (problem === 'full') {
    return (
      <div className="storage-banner notice notice-error" role="alert">
        <p>{t('storage.full')}</p>
        <div className="actions">
          <button type="button" className="btn btn-primary" onClick={() => downloadText('sylareads-progress.json', exportJson(useProgress.getState().root))}>
            {t('profile.export')}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setHidden(problem)}>
            {t('storage.hide')}
          </button>
        </div>
      </div>
    );
  }
  const copy = corruptCopy();
  return (
    <div className="storage-banner notice" role="status">
      <p>
        {t('storage.corrupt')} {signedIn && t('storage.corruptOnline')}
      </p>
      <div className="actions">
        {copy && (
          <button type="button" className="btn btn-secondary" onClick={() => downloadText(`sylareads-unreadable-${copy.at}.json`, copy.text)}>
            {t('storage.downloadCopy')}
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={() => setHidden(problem)}>
          {t('storage.hide')}
        </button>
      </div>
    </div>
  );
}
