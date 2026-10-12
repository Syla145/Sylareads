import { Component, type ReactNode } from 'react';
import { useT } from '../i18n';
import { downloadText, storedProgressText } from './download';

/**
 * Catches an error while a page is drawn, so the app never ends on an empty
 * white page (the installed iPhone app has no reload button of its own).
 * The progress is stored separately and is not touched.
 */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey: string }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  /** Another page: try again. */
  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  componentDidCatch(error: Error) {
    console.error('Sylareads:', error);
  }

  render() {
    return this.state.error ? <ErrorScreen error={this.state.error} /> : this.props.children;
  }
}

function ErrorScreen({ error }: { error: Error }) {
  const t = useT();
  const saved = storedProgressText();
  return (
    <main className="page page-narrow error-screen" role="alert">
      <h1 className="page-title">{t('error.title')}</h1>
      <p>{t('error.body')}</p>
      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          {t('error.reload')}
        </button>
        <a className="btn btn-secondary" href="#/" onClick={() => setTimeout(() => window.location.reload(), 0)}>
          {t('common.toHome')}
        </a>
        {saved && (
          <button type="button" className="btn btn-ghost" onClick={() => downloadText('sylareads-progress.json', saved)}>
            {t('error.export')}
          </button>
        )}
      </div>
      <p className="muted small error-detail">{error.message}</p>
    </main>
  );
}
