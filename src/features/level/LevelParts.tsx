import { useState } from 'react';
import { levelProgress } from '../../domain/gamification';
import { pseudonym } from '../../domain/presence';
import { EMOJIS, effectiveLook, emojiOf, FRAMES, MAX_LEVEL, rewardsAt, TITLES, titleOf, frameOf, type Look } from '../../domain/rewards';
import { useLang, useT } from '../../i18n';
import { useProgress } from '../../store/progressStore';
import { useSync } from '../../sync/syncStore';
import { ProgressBar } from '../../ui/primitives';
import { Avatar } from '../players/PlayerParts';
import './frames.css';
import './level.css';

/** Level, title and the board of all 100 levels with what each brings. */
export function LevelCard() {
  const t = useT();
  const lang = useLang();
  const profile = useProgress((s) => s.root.profile);
  const uid = useSync((s) => s.user?.uid ?? 'me');
  const lp = levelProgress(profile.xp);
  const look = effectiveLook(profile.look, lp.level);
  const max = lp.span === 0;

  // The next three rewards, so there is always something in sight.
  const upcoming: string[] = [];
  for (let l = lp.level + 1; l <= MAX_LEVEL && upcoming.length < 3; l++) {
    const r = rewardsAt(l);
    if (r.frame) upcoming.push(t('level.nextFrame', { n: l, x: r.frame[lang] }));
    else if (r.title) upcoming.push(t('level.nextTitle', { n: l, x: r.title[lang] }));
    else if (upcoming.length === 0) upcoming.push(t('level.nextEmoji', { n: l, x: r.emoji }));
  }

  return (
    <section className="level-card" aria-labelledby="level-title">
      <div className="level-top">
        <Avatar uid={uid} name="?" size="l" emoji={look.emoji} frame={look.frame} />
        <div className="level-head">
          <p className="level-kicker">{t('level.of', { n: lp.level, total: MAX_LEVEL })}</p>
          <h2 id="level-title" className="level-name">
            {titleOf(look.title)?.name[lang]}
          </h2>
          <ProgressBar value={max ? 1 : lp.into / lp.span} label={max ? t('level.max') : t('profile.xpToNext', { n: lp.span - lp.into, l: lp.level + 1 })} />
          <p className="level-xp">
            <span className="tabular">{profile.xp.toLocaleString(lang)} XP</span> · {max ? t('level.max') : t('profile.xpToNext', { n: lp.span - lp.into, l: lp.level + 1 })} · {t('profile.answers', { n: profile.totalAnswers })}
          </p>
        </div>
      </div>

      <ol className="level-board" aria-label={t('level.board', { n: lp.level, total: MAX_LEVEL })}>
        {EMOJIS.map((emoji, i) => {
          const l = i + 1;
          const r = rewardsAt(l);
          const state = l < lp.level ? 'is-done' : l === lp.level ? 'is-now' : 'is-locked';
          const label = [t('level.short', { n: l }), emoji, r.title && t('level.titleIs', { x: r.title[lang] }), r.frame && t('level.frameIs', { x: r.frame[lang] })].filter(Boolean).join(' · ');
          return (
            <li key={l} className={`lv ${state}${r.frame ? ' has-frame' : r.title ? ' has-title' : ''}`} title={label} aria-hidden="true">
              <span className="lv-emoji">{emoji}</span>
              {(r.title || r.frame) && <span className="lv-num tabular">{l}</span>}
            </li>
          );
        })}
      </ol>
      <p className="level-legend">
        <span className="lv-key has-title" aria-hidden="true" /> {t('level.legendTitle')} <span className="lv-key has-frame" aria-hidden="true" /> {t('level.legendFrame')}
      </p>
      {upcoming.length > 0 && <p className="level-next">{upcoming.join(' · ')}</p>}
    </section>
  );
}

type Tab = 'emoji' | 'title' | 'frame';

/** Pick emoji, title and frame for the "Wer ist da" card, with a live preview. */
export function LookCard() {
  const t = useT();
  const lang = useLang();
  const profile = useProgress((s) => s.root.profile);
  const setLook = useProgress((s) => s.setLook);
  const uid = useSync((s) => s.user?.uid ?? 'me');
  const [tab, setTab] = useState<Tab>('emoji');
  const level = levelProgress(profile.xp).level;
  const chosen: Look | undefined = profile.look;
  const look = effectiveLook(chosen, level);
  const shareName = profile.share?.on ? profile.share.name : '';
  const name = shareName || (uid !== 'me' ? pseudonym(uid) : t('level.you'));

  const tabs: { id: Tab; label: string }[] = [
    { id: 'emoji', label: t('level.tab.emoji') },
    { id: 'title', label: t('level.tab.title') },
    { id: 'frame', label: t('level.tab.frame') },
  ];

  return (
    <section className="look-card" aria-labelledby="look-title">
      <h2 id="look-title" className="look-heading">
        {t('level.lookTitle')}
      </h2>
      <p className="muted small">{profile.share?.on ? t('level.lookShared') : t('level.lookNotShared')}</p>

      <div className={`look-preview${look.frame ? ` has-frame frame-${look.frame}` : ''}`}>
        <span className="sr-only">{t('level.preview')}: </span>
        <Avatar uid={uid} name={name} emoji={look.emoji} frame={look.frame} />
        <span className="look-preview-text">
          <span className="look-preview-name">{name}</span>
          <span className="player-title">{titleOf(look.title)?.name[lang]}</span>
        </span>
        <span className="chip">{t('who.level', { n: level })}</span>
      </div>

      <div className="look-tabs" role="group" aria-label={t('level.tabs')}>
        {tabs.map((x) => (
          <button key={x.id} type="button" className={`look-tab${tab === x.id ? ' is-active' : ''}`} aria-pressed={tab === x.id} onClick={() => setTab(x.id)}>
            {x.label}
          </button>
        ))}
      </div>

      {tab === 'emoji' && (
        <fieldset className="look-pick is-emoji">
          <legend className="sr-only">{t('level.tab.emoji')}</legend>
          <Choice name="emoji" checked={chosen?.emoji === undefined} onPick={() => setLook('emoji', undefined)} label={t('level.auto')} wide />
          {EMOJIS.map((e, i) => {
            const l = i + 1;
            const open = l <= level;
            return (
              <Choice key={l} name="emoji" checked={chosen?.emoji === l} disabled={!open} onPick={() => setLook('emoji', l)} label={open ? t('level.emojiLabel', { x: e, n: l }) : t('level.locked', { n: l })}>
                <span className="pick-emoji">{e}</span>
                {!open && <span className="pick-lock tabular">{l}</span>}
              </Choice>
            );
          })}
        </fieldset>
      )}

      {tab === 'title' && (
        <fieldset className="look-pick is-list">
          <legend className="sr-only">{t('level.tab.title')}</legend>
          <Choice name="title" checked={chosen?.title === undefined} onPick={() => setLook('title', undefined)} label={t('level.auto')} wide>
            {t('level.auto')}
          </Choice>
          {TITLES.map((x) => {
            const open = x.level <= level;
            return (
              <Choice key={x.level} name="title" checked={chosen?.title === x.level} disabled={!open} onPick={() => setLook('title', x.level)} label={open ? x.name[lang] : `${x.name[lang]}, ${t('level.locked', { n: x.level })}`} wide>
                <span>{x.name[lang]}</span>
                <span className="pick-level tabular">{open ? '' : t('level.from', { n: x.level })}</span>
              </Choice>
            );
          })}
        </fieldset>
      )}

      {tab === 'frame' && (
        <fieldset className="look-pick is-frames">
          <legend className="sr-only">{t('level.tab.frame')}</legend>
          <Choice name="frame" checked={chosen?.frame === undefined} onPick={() => setLook('frame', undefined)} label={t('level.auto')}>
            <span className="pick-frame-none">{t('level.autoShort')}</span>
          </Choice>
          <Choice name="frame" checked={chosen?.frame === 0} onPick={() => setLook('frame', 0)} label={t('level.noFrame')}>
            <span className="pick-frame-none">{t('level.noFrameShort')}</span>
          </Choice>
          {FRAMES.map((f) => {
            const open = f.level <= level;
            return (
              <Choice key={f.level} name="frame" checked={chosen?.frame === f.level} disabled={!open} onPick={() => setLook('frame', f.level)} label={open ? f.name[lang] : `${f.name[lang]}, ${t('level.locked', { n: f.level })}`}>
                <span className={`look-ring frame-${f.level}`}>
                  <span className="player-avatar is-emoji is-s">{emojiOf(look.emoji)}</span>
                </span>
                <span className="pick-frame-name">{open ? frameOf(f.level)!.name[lang] : t('level.from', { n: f.level })}</span>
              </Choice>
            );
          })}
        </fieldset>
      )}
    </section>
  );
}

function Choice({
  name,
  checked,
  disabled = false,
  onPick,
  label,
  wide = false,
  children,
}: {
  name: string;
  checked: boolean;
  disabled?: boolean;
  onPick: () => void;
  label: string;
  wide?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <label className={`pick${checked ? ' is-checked' : ''}${disabled ? ' is-locked' : ''}${wide ? ' is-wide' : ''}`} title={label}>
      <input type="radio" name={`look-${name}`} checked={checked} disabled={disabled} onChange={onPick} aria-label={label} />
      {children ?? <span>{label}</span>}
    </label>
  );
}
