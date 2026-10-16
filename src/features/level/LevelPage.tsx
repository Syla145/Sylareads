import { useT } from '../../i18n';
import { TopBar } from '../../ui/TopBar';
import { SiteFooter } from '../legal/SiteFooter';
import { ShareCard } from '../players/PlayerParts';
import { LevelCard, LookCard } from './LevelParts';
import './level.css';

/** Level & Belohnungen: the 100 levels, then everything others see of you on "Wer ist da". */
export default function LevelPage() {
  const t = useT();
  return (
    <div className="app-shell">
      <TopBar />
      <main className="page level-page">
        <header className="section-head">
          <h1 className="page-title">{t('level.pageTitle')}</h1>
          <p className="muted">{t('level.pageSub')}</p>
        </header>
        <LevelCard />
        <LookCard />
        <ShareCard withLink />
      </main>
      <SiteFooter />
    </div>
  );
}
