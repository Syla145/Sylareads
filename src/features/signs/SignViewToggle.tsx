import type { SignView } from '../../domain/signs';
import { useT } from '../../i18n';
import { useProgress } from '../../store/progressStore';

export function useSignView(): SignView {
  return useProgress((s) => s.root.settings.signView) ?? 'mixed';
}

const OPTIONS: SignView[] = ['off', 'mixed', 'always'];

/** Schildansicht: Aus / Gemischt / Immer (per device). */
export function SignViewToggle() {
  const t = useT();
  const value = useSignView();
  const set = useProgress((s) => s.setSignView);
  return (
    <div className="ltoggle sign-toggle" role="radiogroup" aria-label={t('signs.view')}>
      <span className="ltoggle-label">{t('signs.view')}</span>
      {OPTIONS.map((o) => (
        <button key={o} type="button" role="radio" aria-checked={value === o} className={`ltoggle-btn${value === o ? ' is-on' : ''}`} onClick={() => set(o)}>
          {t(`signs.view.${o}`)}
        </button>
      ))}
    </div>
  );
}
