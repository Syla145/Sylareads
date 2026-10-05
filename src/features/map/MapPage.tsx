import { useState } from 'react';
import { COUNTRIES } from '../../content/registry';
import { placeLayer } from '../../domain/courseIndex';
import { masteryState } from '../../domain/srs';
import type { PlaceItem } from '../../domain/types';
import { placeNameLine, useLang, useT } from '../../i18n';
import { useProgress } from '../../store/progressStore';
import { ButtonLink, Card, StateDot } from '../../ui/primitives';
import { useCourse } from '../course/useCourse';
import { MapLabelToggle, useMapLabels } from './MapLabelToggle';
import { MapView } from './MapView';

const NO_ITEMS = {};

/** Explore the course map: labels in original or Latin script, tap an area for its names. */
export function MapPage() {
  const { meta, index } = useCourse();
  const t = useT();
  const lang = useLang();
  const labels = useMapLabels('mapLabels');
  const items = useProgress((s) => s.root.courses[meta.id]?.items) ?? NO_ITEMS;
  const [selected, setSelected] = useState<string | null>(null);
  if (!index.map) return null;

  const place = selected ? (index.byId.get(selected) as PlaceItem | undefined) : undefined;
  const group = place?.regionId ? (index.byId.get(place.regionId) as PlaceItem | undefined) : undefined;
  // Legend in the course's order of divisions; the tint follows the map's group order.
  const tintOf = new Map(index.map.groups.map((g, i) => [g.id, i]));
  const groups = index.byKind.region.filter((r) => tintOf.has(r.id)) as PlaceItem[];

  return (
    <div className="map-page">
      <header className="section-head">
        <h1 className="page-title">{t('map.title')}</h1>
        <p className="muted">{t('map.subtitle', { n: index.mapShapes.size })}</p>
      </header>
      <div className="map-page-tools">
        <MapLabelToggle which="mapLabels" />
        <ButtonLink to={`/${meta.slug}/practice/run?${districtPracticeQuery()}`}>{t('map.practice')}</ButtonLink>
      </div>
      <div className="map-page-body">
        <MapView
          index={index}
          label={t('map.label')}
          labels={labels}
          marks={selected ? { [selected]: 'selected' } : undefined}
          onPick={(id) => setSelected((s) => (s === id ? null : id))}
          zoomable
          className="map-explore"
        />
        <aside className="map-side">
          {place ? (
            <Card className="map-info">
              <span className="glyph glyph-m native">{place.native}</span>
              <p className="map-info-translit">{place.translit}</p>
              <p className="muted">{placeNameLine(place, lang)}</p>
              <dl className="fb-facts">
                {group && (
                  <div>
                    <dt>{t('map.division')}</dt>
                    <dd>
                      <span className="native">{group.native}</span> · {lang === 'de' ? group.names.de : group.names.en}
                    </dd>
                  </div>
                )}
                <div>
                  <dt>{t('session.country')}</dt>
                  <dd>{COUNTRIES[place.countryId].name[lang]}</dd>
                </div>
                <div>
                  <dt>{t('map.state')}</dt>
                  <dd className="map-info-state">
                    <StateDot state={masteryState(items[place.id])} /> {t(`state.${masteryState(items[place.id])}`)}
                  </dd>
                </div>
              </dl>
            </Card>
          ) : (
            <p className="muted map-hint">{t('map.tapHint')}</p>
          )}
          <ul className="map-legend">
            {groups.map((g) => (
              <li key={g.id}>
                <span className={`map-swatch map-tint-${tintOf.get(g.id)! % 8}`} aria-hidden="true" />
                <span className="native">{g.core ?? g.native}</span>
                <span className="muted">{lang === 'de' ? g.names.de : g.names.en}</span>
                <span className="muted tabular">
                  {index.map!.shapes.filter((s) => s.group === g.id).length}
                </span>
              </li>
            ))}
          </ul>
          <p className="muted small map-source">
            {t('map.source')}{' '}
            <a href="https://www.geoboundaries.org" target="_blank" rel="noreferrer">
              geoBoundaries
            </a>{' '}
            (CC BY 4.0)
          </p>
        </aside>
      </div>
    </div>
  );
}

/** Practice only the map areas (districts), smart selection over all of them. */
export function districtPracticeQuery(count = 20): string {
  return `c=regions&scope=all&weak=1&n=${count}&layer=district`;
}

/** Goal card on the dashboard: how many districts are recognised reliably. */
export function DistrictGoal() {
  const { meta, index } = useCourse();
  const t = useT();
  const items = useProgress((s) => s.root.courses[meta.id]?.items) ?? NO_ITEMS;
  if (!index.map) return null;
  const ids = index.items.filter((it) => placeLayer(it) === 'district').map((it) => it.id);
  const sure = ids.filter((id) => ((items as Record<string, { box: number }>)[id]?.box ?? 0) >= 3).length;
  const seen = ids.filter((id) => (items as Record<string, unknown>)[id]).length;
  const base = `/${meta.slug}`;
  return (
    <Card className="goal-card">
      <h2 className="card-label">{t('map.goalTitle', { n: ids.length })}</h2>
      <div className="goal-bar" role="progressbar" aria-valuemin={0} aria-valuemax={ids.length} aria-valuenow={sure}>
        <div className="goal-bar-seen" style={{ width: `${(seen / ids.length) * 100}%` }} />
        <div className="goal-bar-sure" style={{ width: `${(sure / ids.length) * 100}%` }} />
      </div>
      <p className="muted small">{t('map.goalBody', { sure, seen })}</p>
      <div className="actions">
        <ButtonLink variant="primary" to={`${base}/practice/run?${districtPracticeQuery()}`}>
          {t('map.practice')}
        </ButtonLink>
        <ButtonLink to={`${base}/map`}>{t('map.open')}</ButtonLink>
      </div>
    </Card>
  );
}
