import { useLayoutEffect, useRef, type ReactNode } from 'react';
import type { SignKind, SignSpec } from '../../domain/signs';
import './signs.css';

/**
 * Road and shop signs drawn with CSS (no photos, no original artwork): colours,
 * shapes and layout in the style of each country. The Latin line of a
 * bilingual sign would give the answer away, so it stays covered until the
 * task is answered (`revealed`).
 */

export type SignContent = Omit<SignSpec, 'kind'>;

interface Props extends SignContent {
  kind: SignKind;
  revealed?: boolean;
  /** Language tag / font class for the native text. */
  lang?: string;
  className?: string;
}

function Arrow({ dir }: { dir: 'left' | 'right' | 'up' }) {
  const rot = dir === 'left' ? 180 : dir === 'up' ? -90 : 0;
  return (
    <svg className="sign-arrow" viewBox="0 0 40 40" aria-hidden="true" style={{ transform: `rotate(${rot}deg)` }}>
      <path d="M4 16h20V7l13 13-13 13v-9H4z" fill="currentColor" />
    </svg>
  );
}

function Latin({ text, revealed }: { text?: string; revealed?: boolean }) {
  if (!text) return null;
  return (
    <span className={`sign-latin${revealed ? '' : ' is-covered'}`} aria-hidden={!revealed}>
      {text}
    </span>
  );
}

/**
 * A name on one line, like on a real sign: starts at the CSS size and shrinks
 * step by step until it fits the sign (re-checked when the width changes).
 */
function FitName({ text, className, lang }: { text: string; className: string; lang?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.fontSize = '';
      let size = parseFloat(getComputedStyle(el).fontSize);
      while (el.scrollWidth > el.clientWidth + 1 && size > 14) {
        size -= 1;
        el.style.fontSize = `${size}px`;
      }
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (el.parentElement) ro.observe(el.parentElement);
    return () => ro.disconnect();
  }, [text]);
  return (
    <span ref={ref} className={className} lang={lang}>
      {text}
    </span>
  );
}

export function Sign({ kind, native, latin, km, arrow, road, sideKm, shop, revealed = false, lang, className = '' }: Props) {
  const name = (extra = ''): ReactNode => <FitName text={native} className={`sign-native${extra}`} lang={lang} />;
  const base = `sign sign-${kind} ${className}`;

  switch (kind) {
    case 'ru-direction':
    case 'ru-motorway':
    case 'th-direction':
      return (
        <div className={base}>
          <div className="sign-inner">
            {arrow && <Arrow dir={arrow} />}
            <span className="sign-names">
              {name()}
              <Latin text={latin} revealed={revealed} />
            </span>
            {km !== undefined && <span className="sign-km tabular">{km}</span>}
          </div>
        </div>
      );
    case 'ru-town':
    case 'ru-town-end':
      return (
        <div className={base}>
          <div className="sign-inner">{name()}</div>
          {kind === 'ru-town-end' && <span className="sign-strike" aria-hidden="true" />}
        </div>
      );
    case 'gr-direction':
      return (
        <div className={base}>
          <div className="sign-plate">
            <span className="sign-names">
              {name()}
              <Latin text={latin} revealed={revealed} />
            </span>
            {km !== undefined && <span className="sign-km tabular">{km}</span>}
          </div>
        </div>
      );
    case 'gr-town':
      return (
        <div className={base}>
          <span className="sign-band" aria-hidden="true" />
          <span className="sign-names">
            {name()}
            <Latin text={latin} revealed={revealed} />
          </span>
          <span className="sign-band" aria-hidden="true" />
        </div>
      );
    case 'th-kmstone':
      return (
        <div className={base}>
          <div className="kmstone">
            <span className="kmstone-cap" aria-hidden="true" />
            <div className="kmstone-body">
              <div className="kmstone-front">
                <span className="kmstone-shield tabular" aria-hidden="true">
                  {road ?? 1}
                </span>
                <span className="kmstone-km" lang="th">
                  กม.
                </span>
                <span className="kmstone-num tabular">{km ?? 0}</span>
              </div>
              <div className="kmstone-side">
                {name(' kmstone-name')}
                {sideKm !== undefined && <span className="kmstone-num tabular">{sideKm}</span>}
              </div>
            </div>
          </div>
        </div>
      );
    case 'bd-shop':
      return (
        <div className={base} lang="bn">
          <div className="shop-top">
            <span className="shop-name">{shop?.name ?? native}</span>
            {shop?.offer && <span className="shop-offer">{shop.offer}</span>}
          </div>
          <div className="shop-bottom">
            {shop && <span className="shop-owner">{shop.owner}</span>}
            <span className="shop-address">{shop ? shop.address : native}</span>
            {shop && <span className="shop-phone tabular">{shop.phone}</span>}
          </div>
        </div>
      );
  }
}

/** A sign in front of a bit of sky and road, as seen from the car. */
export function SignStage({ spec, revealed, lang, compact = false }: { spec: SignSpec; revealed: boolean; lang?: string; compact?: boolean }) {
  return (
    <div className={`sign-stage${compact ? ' is-compact' : ''}`}>
      <Sign {...spec} revealed={revealed} lang={lang} />
    </div>
  );
}
