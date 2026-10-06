import { Link } from 'react-router-dom';
import { LETTERS_SCOPE, passMark, PLACEMENT, placementScope } from '../../domain/placement';
import { useT } from '../../i18n';
import { Card } from '../../ui/primitives';
import { useCourse } from '../course/useCourse';
import { placementPath } from './PlacementRoute';

/** The two ways to take over prior knowledge for a scope (all letters, or one phase of the learning path). */
export function PlacementOptions({ scopeId, letters = false }: { scopeId: string; letters?: boolean }) {
  const { meta, index } = useCourse();
  const t = useT();
  const scope = placementScope(index, scopeId);
  if (!scope) return null;
  const n = scope.itemIds.length;
  const testN = Math.min(PLACEMENT.testSize, n);
  if (n <= PLACEMENT.testSize) {
    // Small sections: the test already asks everything, so one way is enough.
    return (
      <div className="placement-options is-single">
        <Link className="mode-tile placement-option" to={placementPath(meta.slug, scopeId, 'test')}>
          <span className="mode-title">{t('placement.phaseCheck')}</span>
          <span className="muted small">{t('placement.phaseCheckDesc', { n, need: passMark(n) })}</span>
        </Link>
      </div>
    );
  }
  return (
    <div className="placement-options">
      <Link className="mode-tile placement-option" to={placementPath(meta.slug, scopeId, 'review')}>
        <span className="mode-title">{letters ? t('placement.review') : t('placement.phaseReview')}</span>
        <span className="muted small">{letters ? t('placement.reviewDesc', { n }) : t('placement.phaseReviewDesc', { n })}</span>
      </Link>
      <Link className="mode-tile placement-option" to={placementPath(meta.slug, scopeId, 'test')}>
        <span className="mode-title">{letters ? t('placement.test') : t('placement.phaseTest')}</span>
        <span className="muted small">{letters ? t('placement.testDesc', { n: testN }) : t('placement.phaseTestDesc', { n: testN, need: passMark(testN) })}</span>
      </Link>
    </div>
  );
}

/** First visit of a course: "Do you already know this script?" next to lesson 1. */
export function PlacementCard() {
  const { index } = useCourse();
  const t = useT();
  if (!placementScope(index, LETTERS_SCOPE)) return null;
  return (
    <Card className="placement-card">
      <h2 className="card-title">{t('placement.question')}</h2>
      <p className="muted">{t('placement.questionBody')}</p>
      <PlacementOptions scopeId={LETTERS_SCOPE} letters />
    </Card>
  );
}
