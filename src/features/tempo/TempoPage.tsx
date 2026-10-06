import { useNavigate } from 'react-router-dom';
import type { CourseIndex } from '../../domain/courseIndex';
import type { ItemProgress } from '../../domain/srs';
import { bestBlitz, clampFlash, clampSeconds, TEMPO, tempoContents, tempoOverview, tempoPool, type TempoContent, type TempoMode } from '../../domain/tempo';
import type { Item } from '../../domain/types';
import { formatSeconds, useLang, useT } from '../../i18n';
import { DEFAULT_TEMPO, useProgress } from '../../store/progressStore';
import { Button, Card } from '../../ui/primitives';
import { useCourse } from '../course/useCourse';
import { itemAnswer } from './labels';

const NO_ITEMS: Record<string, ItemProgress> = {};

/** Content shown first: the saved choice, else the first one with enough learned items (map before names before letters). */
export function defaultContent(index: CourseIndex, items: Record<string, ItemProgress | undefined>, saved?: TempoContent): TempoContent {
  const contents = tempoContents(index);
  if (saved && contents.includes(saved)) return saved;
  const ready = (['map', 'places', 'letters'] as TempoContent[]).find((c) => contents.includes(c) && tempoPool(index, c, items).length >= TEMPO.minPool);
  return ready ?? 'letters';
}

export function tempoRunQuery(mode: TempoMode, content: TempoContent, opts: { seconds: number; flashMs: number; ids?: string[] }): string {
  const p = new URLSearchParams({ m: mode, c: content });
  if (mode === 'timer') p.set('s', String(opts.seconds));
  if (mode === 'flash') p.set('f', String(opts.flashMs));
  if (opts.ids?.length) p.set('ids', opts.ids.join(','));
  return p.toString();
}

/** "Lesen auf Zeit": pick what to read and a mode; see how your reading time develops. */
export function TempoPage() {
  const { meta, index } = useCourse();
  const t = useT();
  const lang = useLang();
  const navigate = useNavigate();
  const items = useProgress((s) => s.root.courses[meta.id]?.items) ?? NO_ITEMS;
  const tempo = useProgress((s) => s.root.courses[meta.id]?.tempo);
  const settings = useProgress((s) => s.root.settings.tempo) ?? DEFAULT_TEMPO;
  const setSettings = useProgress((s) => s.setTempoSettings);

  const content = defaultContent(index, items, settings.content);
  const contents = tempoContents(index);
  const pools = Object.fromEntries(contents.map((c) => [c, tempoPool(index, c, items)])) as Record<TempoContent, Item[]>;
  const pool = pools[content];
  const ready = pool.length >= TEMPO.minPool;
  const overview = tempoOverview(pool, tempo, content);
  const best = bestBlitz(tempo, content);
  const base = `/${meta.slug}/tempo/run?`;
  const start = (mode: TempoMode, ids?: string[]) => navigate(base + tempoRunQuery(mode, content, { seconds: settings.seconds, flashMs: settings.flashMs, ids }));

  return (
    <div className="tempo-page">
      <header className="section-head">
        <h1 className="page-title">{t('tempo.title')}</h1>
        <p className="muted">{t('tempo.subtitle')}</p>
      </header>

      <section aria-labelledby="tempo-content">
        <h2 id="tempo-content" className="section-label">
          {t('tempo.content')}
        </h2>
        <div className="tempo-contents" role="radiogroup" aria-labelledby="tempo-content">
          {contents.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={c === content}
              className={`mode-tile tempo-content${c === content ? ' is-on' : ''}`}
              onClick={() => setSettings({ content: c })}
            >
              <span className="mode-title">{t(`tempo.content.${c}`)}</span>
              <span className="muted small">{t(`tempo.contentDesc.${c}`)}</span>
              <span className="mode-count tabular">{t('tempo.learned', { n: pools[c].length })}</span>
            </button>
          ))}
        </div>
        {!ready && <p className="notice">{t('tempo.tooFew', { n: TEMPO.minPool })}</p>}
      </section>

      <div className="tempo-modes">
        <Card className="tempo-mode">
          <h2 className="card-title">{t('tempo.mode.timer')}</h2>
          <p className="muted small">{t('tempo.modeDesc.timer', { n: TEMPO.count })}</p>
          <label className="tempo-range">
            <span className="tempo-range-head">
              <span>{t('tempo.seconds')}</span>
              <output className="tabular">{settings.seconds} s</output>
            </span>
            <input
              type="range"
              min={TEMPO.minS}
              max={TEMPO.maxS}
              step={1}
              value={settings.seconds}
              onChange={(e) => setSettings({ seconds: clampSeconds(Number(e.target.value)) })}
            />
          </label>
          <Button variant="primary" block disabled={!ready} onClick={() => start('timer')}>
            {t('practice.start')}
          </Button>
        </Card>

        <Card className="tempo-mode">
          <h2 className="card-title">{t('tempo.mode.blitz')}</h2>
          <p className="muted small">{t('tempo.modeDesc.blitz')}</p>
          <p className="tempo-best">{best > 0 ? t('tempo.best', { n: best }) : <span className="muted">{t('tempo.noBest')}</span>}</p>
          <Button variant="primary" block disabled={!ready} onClick={() => start('blitz')}>
            {t('practice.start')}
          </Button>
        </Card>

        <Card className="tempo-mode">
          <h2 className="card-title">{t('tempo.mode.flash')}</h2>
          <p className="muted small">{t('tempo.modeDesc.flash')}</p>
          <label className="tempo-range">
            <span className="tempo-range-head">
              <span>{t('tempo.flashTime')}</span>
              <output className="tabular">{formatSeconds(settings.flashMs, lang)}</output>
            </span>
            <input
              type="range"
              min={TEMPO.flashMin}
              max={TEMPO.flashMax}
              step={TEMPO.flashStep}
              value={settings.flashMs}
              onChange={(e) => setSettings({ flashMs: clampFlash(Number(e.target.value)) })}
            />
          </label>
          <Button variant="primary" block disabled={!ready} onClick={() => start('flash')}>
            {t('practice.start')}
          </Button>
        </Card>
      </div>

      <Card className="tempo-stats">
        <h2 className="card-label">
          {t('tempo.stats')} · {t(`tempo.content.${content}`)}
        </h2>
        {overview.avgMs === null ? (
          <p className="muted">{t('tempo.noData')}</p>
        ) : (
          <>
            <div className="tempo-figure">
              <span className="tempo-figure-value tabular">{formatSeconds(overview.avgMs, lang)}</span>
              <span className="muted">
                {t('tempo.avg')} · {t('tempo.measured', { n: overview.measured, total: pool.length })}
              </span>
            </div>
            {overview.trend.length >= 2 && <Trend trend={overview.trend} />}
            <h3 className="tempo-sub">{t('tempo.slowest')}</h3>
            <ul className="tempo-slow">
              {overview.slowest.map(({ id, ms }) => {
                const it = index.byId.get(id)!;
                return (
                  <li key={id}>
                    <span className="native" lang={index.content.id}>
                      {it.kind === 'letter' ? `${it.upper} ${it.lower}` : it.native}
                    </span>
                    <span className="muted">{itemAnswer(it, lang)}</span>
                    <span className="tabular">{formatSeconds(ms, lang)}</span>
                  </li>
                );
              })}
            </ul>
            <Button onClick={() => start('timer', overview.slowest.map((s) => s.id))}>{t('tempo.practiceSlowest')}</Button>
          </>
        )}
      </Card>
    </div>
  );
}

/** Bars of the daily mean reading time (shorter is better), first and last value named. */
function Trend({ trend }: { trend: { day: string; ms: number }[] }) {
  const t = useT();
  const lang = useLang();
  const max = Math.max(...trend.map((d) => d.ms));
  const first = trend[0];
  const last = trend[trend.length - 1];
  const day = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'short' });
  return (
    <figure className="tempo-trend">
      <figcaption className="muted small">
        {t('tempo.trend')}: {formatSeconds(first.ms, lang)} → {formatSeconds(last.ms, lang)}
      </figcaption>
      <div className="tempo-bars" role="img" aria-label={`${formatSeconds(first.ms, lang)} → ${formatSeconds(last.ms, lang)}`}>
        {trend.map((d) => (
          <span key={d.day} className="tempo-bar" style={{ height: `${Math.max(8, (d.ms / max) * 100)}%` }} title={`${day(d.day)}: ${formatSeconds(d.ms, lang)}`} />
        ))}
      </div>
      <div className="tempo-bars-axis muted small">
        <span>{day(first.day)}</span>
        <span>{day(last.day)}</span>
      </div>
    </figure>
  );
}
