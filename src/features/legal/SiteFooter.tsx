import { Link } from 'react-router-dom';
import { FEEDBACK_URL } from '../../content/legal';
import { useT } from '../../i18n';
import './legal.css';

/** Links to the legal pages on every main page (the pages themselves load on demand). */
export function SiteFooter() {
  const t = useT();
  return (
    <footer className="site-footer">
      <nav aria-label={t('legal.footer')}>
        <Link to="/about">{t('legal.about')}</Link>
        <Link to="/privacy">{t('legal.privacy')}</Link>
        <Link to="/impressum">{t('legal.impressum')}</Link>
        <Link to="/credits">{t('legal.credits')}</Link>
        <a href={FEEDBACK_URL} target="_blank" rel="noreferrer">
          {t('legal.feedback')}
        </a>
      </nav>
      <p>{t('legal.notAffiliated')}</p>
    </footer>
  );
}
