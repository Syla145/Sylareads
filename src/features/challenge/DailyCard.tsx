import { canResume, type ChallengeScore } from '../../domain/challenge';
import { dayKey } from '../../domain/dates';
import { formatSeconds, useLang, useT } from '../../i18n';
import { useProgress } from '../../store/progressStore';
import { ButtonLink, Card } from '../../ui/primitives';
import { useCourse } from '../course/useCourse';

export const scoreText = (s: ChallengeScore, lang: 'de' | 'en') => `${s.c}/${s.n} · ${formatSeconds(s.ms, lang)}`;

/** Dashboard card of the Tagesaufgabe; the pages themselves are loaded on demand. */
export function DailyCard({ ready = true }: { ready?: boolean }) {
  const { meta } = useCourse();
  const t = useT();
  const lang = useLang();
  const today = dayKey();
  const record = useProgress((s) => s.root.courses[meta.id]?.daily?.[today]);
  const played = useProgress((s) => Object.keys(s.root.courses[meta.id]?.daily ?? {}).length > 0);
  const base = `/${meta.slug}`;
  // Ten city names are no fun before one can read some: shown once enough cities are readable
  // (or after the first one was played).
  if (!ready && !record && !played) return null;
  if (canResume(record, record?.n ?? 10)) {
    return (
      <Card className="daily-card">
        <h2 className="card-label">{t('ch.dailyTitle')}</h2>
        <p className="muted">{t('ch.dailyPaused', { n: record.ans.length, total: record.n })}</p>
        <div className="actions">
          <ButtonLink variant="primary" to={`${base}/daily`}>
            {t('ch.resume', { n: record.ans.length, total: record.n })}
          </ButtonLink>
        </div>
      </Card>
    );
  }
  return (
    <Card className="daily-card">
      <h2 className="card-label">{t('ch.dailyTitle')}</h2>
      {record ? (
        <p>
          {t('ch.todayResult')} <strong className="tabular">{scoreText(record, lang)}</strong>
        </p>
      ) : (
        <p className="muted">{t('ch.dailyTeaser')}</p>
      )}
      <div className="actions">
        <ButtonLink to={`${base}/daily`}>
          {record ? t('ch.seeBoard') : t('ch.start')}
        </ButtonLink>
        <ButtonLink to={`${base}/duel`}>{t('ch.challengeFriend')}</ButtonLink>
      </div>
    </Card>
  );
}
