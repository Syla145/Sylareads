import { useT } from '../../i18n';
import { Button, Modal } from '../../ui/primitives';

/** A button on a result screen; the first one is the main action unless it says otherwise. */
export interface ResultAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
}

/** The buttons under every result screen (lesson, practice, tempo, placement, scripts). */
export function ResultActions({ actions }: { actions: ResultAction[] }) {
  return (
    <div className="complete-actions">
      {actions.map((a, i) => (
        <Button key={a.label} variant={a.variant ?? (i === 0 ? 'primary' : 'secondary')} block onClick={a.onClick} autoFocus={i === 0}>
          {a.label}
        </Button>
      ))}
    </div>
  );
}

/** "Really quit?" during a session. Staying is the main action. */
export function QuitDialog({ open, onStay, onQuit }: { open: boolean; onStay: () => void; onQuit: () => void }) {
  const t = useT();
  return (
    <Modal open={open} onClose={onStay} title={t('session.quitTitle')}>
      <p className="muted">{t('session.quitBody')}</p>
      <div className="actions">
        <Button variant="primary" onClick={onStay}>
          {t('session.quitCancel')}
        </Button>
        <Button
          onClick={() => {
            onStay();
            onQuit();
          }}
        >
          {t('session.quitConfirm')}
        </Button>
      </div>
    </Modal>
  );
}
