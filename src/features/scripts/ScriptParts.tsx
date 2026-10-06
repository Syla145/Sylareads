import type { ReactNode } from 'react';
import type { ScriptEntry } from '../../content/scripts/data';
import { useLang, useT } from '../../i18n';

/** Text in the script's own font and direction. */
export function ScriptText({ entry, children, className = '' }: { entry: ScriptEntry; children: ReactNode; className?: string }) {
  return (
    <span className={`sf-${entry.font} ${className}`} dir={entry.rtl ? 'rtl' : undefined}>
      {children}
    </span>
  );
}

/** Intro and reference card: name, where, how to spot it, examples from signs. */
export function ScriptCard({ entry, eyebrow, head = true }: { entry: ScriptEntry; eyebrow?: string; head?: boolean }) {
  const t = useT();
  const lang = useLang();
  return (
    <div className="script-card">
      {head && (
        <div className="script-card-head">
          {eyebrow && <span className="script-card-eyebrow">{eyebrow}</span>}
          <h2 className="script-card-name">{entry.where[lang]}</h2>
          <p className="muted">{entry.name[lang]}</p>
        </div>
      )}
      <section>
        <h3 className="script-sub">{t('scripts.features')}</h3>
        <ul className="script-features">
          {entry.features.map((f, i) => (
            <li key={i}>
              {f.mark ? (
                <ScriptText entry={entry} className="script-feature-mark">
                  {f.mark}
                </ScriptText>
              ) : (
                <span />
              )}
              {/* Latin text falls back to the UI font; script letters inside use the script's font */}
              <span className={entry.font === 'thai' || entry.font === 'bengali' ? undefined : `sf-${entry.font}`}>{f.text[lang]}</span>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="script-sub">{t('scripts.samples')}</h3>
        <ul className="script-samples">
          {entry.samples.map((s) => (
            <li key={s.native}>
              <ScriptText entry={entry} className="sample-native">
                {s.native}
              </ScriptText>
              <span className="sample-latin">{s.latin}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
