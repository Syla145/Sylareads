import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SCRIPT_ENTRIES, SCRIPT_LESSONS, type ScriptEntry } from '../../content/scripts/data';
import { nextScriptLesson, SCRIPT_BY_ID, SCRIPTS_COURSE_ID, scriptsKnown, scriptsStarted } from '../../domain/scriptCourse';
import { masteryState } from '../../domain/srs';
import { useLang, useT } from '../../i18n';
import { useProgress } from '../../store/progressStore';
import { Button, Card, MasteryLegend, Modal, ProgressBar, StateDot } from '../../ui/primitives';
import { TopBar } from '../../ui/TopBar';
import { MistakesList } from './ScriptMistakes';
import { NextGoals } from '../achievements/AchievementParts';
import { ScriptCard, ScriptText } from './ScriptParts';
import './scripts.css';
import { SignViewToggle } from '../signs/SignViewToggle';

const NO_ITEMS = {};

/** Course page of „Schriften erkennen“: progress, lessons and a reference of all scripts. */
export default function ScriptsHome() {
  const t = useT();
  const lang = useLang();
  const navigate = useNavigate();
  const cp = useProgress((s) => s.root.courses[SCRIPTS_COURSE_ID]);
  const items = cp?.items ?? NO_ITEMS;
  const [open, setOpen] = useState<ScriptEntry | null>(null);
  const syncAchievements = useProgress((s) => s.syncAchievements);
  useEffect(() => syncAchievements(SCRIPTS_COURSE_ID, null), [syncAchievements]);
  const next = nextScriptLesson(cp?.lessons);
  const known = scriptsKnown(items);
  const started = scriptsStarted(items);
  const total = SCRIPT_ENTRIES.length;

  return (
    <div className="app-shell">
      <TopBar />
      <main className="page scripts-page">
        <header className="section-head">
          <h1 className="page-title">{t('scripts.title')}</h1>
          <p className="muted">{t('scripts.subtitle')}</p>
          <SignViewToggle />
        </header>

        <Card className="scripts-summary">
          <ProgressBar value={known / total} label={t('scripts.known', { n: known, total })} />
          <p className="muted small">
            {t('scripts.known', { n: known, total })} · {t('scripts.started', { n: started })}
          </p>
          <div className="actions">
            {next ? (
              <Button variant="primary" onClick={() => navigate(`/scripts/lesson/${next.id}`)}>
                {started ? t('home.continue') : t('scripts.startHere')}
              </Button>
            ) : null}
            <Button variant={next ? 'secondary' : 'primary'} disabled={started === 0} onClick={() => navigate('/scripts/practice')}>
              {t('home.practice')}
            </Button>
          </div>
        </Card>

        <MistakesList />
        <NextGoals courseId={SCRIPTS_COURSE_ID} index={null} />

        <section className="scripts-lessons">
          <h2 className="section-label">{t('scripts.lessons')}</h2>
          <ol className="lesson-list">
            {SCRIPT_LESSONS.map((l) => {
              const rec = cp?.lessons[l.id];
              const isNext = next?.id === l.id;
              return (
                <li key={l.id} className={`lesson-row${isNext ? ' is-next' : ''}${rec ? ' is-done' : ''}`}>
                  <button type="button" className="lesson-row-btn" onClick={() => navigate(`/scripts/lesson/${l.id}`)}>
                    <span className="lesson-num tabular">{l.number}</span>
                    <span className="lesson-main">
                      <span className="lesson-title">{l.title[lang]}</span>
                      <span className="lesson-preview">
                        {l.newIds.map((id) => {
                          const e = SCRIPT_BY_ID.get(id)!;
                          return (
                            <ScriptText key={id} entry={e}>
                              {e.samples[0].native}
                            </ScriptText>
                          );
                        })}
                      </span>
                    </span>
                    <span className="lesson-status">
                      {isNext && <span className="badge badge-accent">{t('learn.recommended')}</span>}
                      {rec && <span className="muted small">{t('learn.done', { c: rec.bestCorrect, t: rec.bestTotal })}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>

        <section>
          <h2 className="section-label">{t('scripts.all')}</h2>
          <p className="muted small scripts-hint">{t('scripts.allHint')}</p>
          <MasteryLegend />
          <div className="scripts-grid">
            {SCRIPT_ENTRIES.map((e) => (
              <button key={e.id} type="button" className="script-tile" onClick={() => setOpen(e)}>
                <ScriptText entry={e} className="script-tile-sample">
                  {e.samples[0].native}
                </ScriptText>
                <span className="script-tile-name">
                  <StateDot state={masteryState(items[e.id])} /> {e.name[lang]}
                </span>
                <span className="script-tile-where">{e.where[lang]}</span>
              </button>
            ))}
          </div>
        </section>
      </main>

      <Modal open={!!open} onClose={() => setOpen(null)} title={open ? `${open.where[lang]} · ${open.name[lang]}` : ''}>
        {open && <ScriptCard entry={open} head={false} />}
        <div className="actions">
          <Button variant="primary" onClick={() => setOpen(null)}>
            {t('common.close')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
