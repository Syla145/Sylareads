import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  compareScores,
  dailySeed,
  duelQuery,
  newDuelSeed,
  parseDuel,
  pickChallenge,
  scoreOf,
  type ChallengeScore,
  type ChallengeState,
} from '../../domain/challenge';
import type { CourseIndex } from '../../domain/courseIndex';
import { dayKey } from '../../domain/dates';
import { effectiveShare } from '../../domain/presence';
import type { CourseMeta, PlaceItem } from '../../domain/types';
import { formatSeconds, placeNameLine, useLang, useT } from '../../i18n';
import { useProgress } from '../../store/progressStore';
import { reportNow } from '../../sync/presenceStore';
import { useSync } from '../../sync/syncStore';
import { Button, ButtonLink, Card } from '../../ui/primitives';
import { useCourse } from '../course/useCourse';
import { Avatar, usePlayers } from '../players/PlayerParts';
import { ResultActions } from '../session/SessionParts';
import { ChallengeRun } from './ChallengeRun';
import './challenge.css';

export const scoreText = (s: ChallengeScore, lang: 'de' | 'en') => `${s.c}/${s.n} · ${formatSeconds(s.ms, lang)}`;

/* ---------- Daily Challenge ---------- */

/** One try a day per course: same 10 names for everybody. */
export function DailyRoute() {
  const { meta, index } = useCourse();
  const t = useT();
  const lang = useLang();
  const navigate = useNavigate();
  const today = dayKey();
  const ids = useMemo(() => pickChallenge(index, dailySeed(meta.id, today)), [index, meta.id, today]);
  const record = useProgress((s) => s.root.courses[meta.id]?.daily?.[today]);
  const saveDaily = useProgress((s) => s.saveDaily);
  const [stage, setStage] = useState<'intro' | 'run' | 'done'>(record ? 'done' : 'intro');
  const [finished, setFinished] = useState<ChallengeState | null>(null);
  const back = () => navigate(`/${meta.slug}`);

  if (stage === 'run') {
    return (
      <ChallengeRun
        index={index}
        ids={ids}
        title={t('ch.dailyTitle')}
        onAnswer={(s) => saveDaily(meta.id, today, scoreOf(s), false)}
        onDone={(s) => {
          saveDaily(meta.id, today, scoreOf(s), true);
          void reportNow();
          setFinished(s);
          setStage('done');
        }}
        onQuit={(s) => {
          saveDaily(meta.id, today, scoreOf(s), true);
          void reportNow();
          back();
        }}
      />
    );
  }

  if (stage === 'intro') {
    return (
      <main className="session-done challenge-intro">
        <p className="eyebrow-quiet">{meta.name[lang]}</p>
        <h1 className="complete-title">{t('ch.dailyTitle')}</h1>
        <p className="muted">{t('ch.dailyIntro', { n: ids.length })}</p>
        <ul className="challenge-rules">
          <li>{t('ch.rule1')}</li>
          <li>{t('ch.rule2')}</li>
          <li>{t('ch.rule3')}</li>
        </ul>
        <ResultActions
          actions={[
            { label: t('ch.start'), onClick: () => setStage('run') },
            { label: t('ch.back'), onClick: back, variant: 'ghost' },
          ]}
        />
      </main>
    );
  }

  const score: ChallengeScore = finished ? scoreOf(finished) : record ? { c: record.c, n: record.n, ms: record.ms } : { c: 0, n: ids.length, ms: 0 };
  return (
    <main className="session-done">
      <div className="complete">
        <h1 className="complete-title">{t('ch.dailyTitle')}</h1>
        <p className="muted">{finished ? t('ch.dailyDone') : t('ch.dailyAlready')}</p>
        <ScoreLine score={score} />
        {finished && <AnswerList index={index} state={finished} />}
        <DailyBoard meta={meta} day={today} own={score} />
        <ResultActions
          actions={[
            { label: t('ch.challengeFriend'), onClick: () => navigate(`/${meta.slug}/duel`) },
            { label: t('ch.toCourse'), onClick: back, variant: 'secondary' },
          ]}
        />
      </div>
    </main>
  );
}

function ScoreLine({ score }: { score: ChallengeScore }) {
  const t = useT();
  const lang = useLang();
  return (
    <p className="complete-score tabular">
      {t('ch.score', { c: score.c, n: score.n })} <span className="challenge-time">{formatSeconds(score.ms, lang)}</span>
    </p>
  );
}

/** The 10 names with the right reading, the typed one and the time. */
function AnswerList({ index, state }: { index: CourseIndex; state: ChallengeState }) {
  const t = useT();
  const lang = useLang();
  return (
    <section className="complete-block">
      <h2 className="card-label">{t('ch.answers')}</h2>
      <ul className="challenge-answers">
        {state.answers.map((a) => {
          const p = index.byId.get(a.id) as PlaceItem;
          return (
            <li key={a.id} className={a.correct ? 'is-correct' : 'is-wrong'}>
              <span className="native" lang={index.content.id}>
                {p.native}
              </span>
              <span>
                {placeNameLine(p, lang)}
                {!a.correct && <span className="small challenge-typed">{a.input ? t('ch.yourAnswer', { a: a.input }) : t('ch.noAnswer')}</span>}
              </span>
              <span className="tabular muted small">{formatSeconds(a.ms, lang)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Today's results of everybody who shows their card (and your own). */
export function DailyBoard({ meta, day, own }: { meta: CourseMeta; day: string; own: ChallengeScore | null }) {
  const t = useT();
  const lang = useLang();
  const { cards, signedIn } = usePlayers();
  const me = useSync((s) => s.user?.uid ?? null);
  const rows = cards
    .filter((c) => c.tempo?.[meta.id]?.d === day && c.uid !== me)
    .map((c) => ({ uid: c.uid, name: c.name, score: c.tempo![meta.id] as ChallengeScore, me: false }));
  if (own) rows.push({ uid: me ?? 'me', name: t('who.you'), score: own, me: true });
  rows.sort((a, b) => compareScores(a.score, b.score));
  return (
    <section className="complete-block">
      <h2 className="card-label">{t('ch.board')}</h2>
      {rows.length > 0 && (
        <ol className="challenge-board">
          {rows.map((r, i) => (
            <li key={r.uid} className={r.me ? 'is-me' : ''}>
              <span className="tabular challenge-rank">{i + 1}.</span>
              <Avatar uid={r.uid} name={r.name} size="s" />
              <span className="challenge-board-name">{r.name}</span>
              <span className="tabular">{scoreText(r.score, lang)}</span>
            </li>
          ))}
        </ol>
      )}
      {!signedIn && <p className="muted small">{t('ch.boardSignIn')}</p>}
      {signedIn && rows.length <= 1 && <p className="muted small">{t('ch.boardEmpty')}</p>}
    </section>
  );
}

/* ---------- Duel ---------- */

const DUELS_KEY = 'sylareads.duels';

/** Duels played on this device: seed → own result (to show the comparison when a reply link comes back). */
function playedDuels(): Record<string, ChallengeScore> {
  try {
    return JSON.parse(localStorage.getItem(DUELS_KEY) ?? '{}') as Record<string, ChallengeScore>;
  } catch {
    return {};
  }
}

function rememberDuel(seed: string, score: ChallengeScore) {
  try {
    const all = { ...playedDuels(), [seed]: score };
    const keep = Object.fromEntries(Object.entries(all).slice(-30));
    localStorage.setItem(DUELS_KEY, JSON.stringify(keep));
  } catch {
    /* private mode: the comparison just needs another round */
  }
}

/** 1v1 by link: same 10 names for both, the sender's result travels in the link. */
export function DuelRoute() {
  const { meta, index } = useCourse();
  const t = useT();
  const lang = useLang();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const offer = useMemo(() => parseDuel(params), [params]);
  const [seed] = useState(() => offer?.seed ?? newDuelSeed());
  const ids = useMemo(() => pickChallenge(index, `duel:${seed}`), [index, seed]);
  const earlier = playedDuels()[seed];
  const [stage, setStage] = useState<'intro' | 'run' | 'done'>(earlier ? 'done' : 'intro');
  const [finished, setFinished] = useState<ChallengeState | null>(null);
  const back = () => navigate(`/${meta.slug}`);

  if (stage === 'run') {
    return (
      <ChallengeRun
        index={index}
        ids={ids}
        title={t('ch.duelTitle')}
        onDone={(s) => {
          rememberDuel(seed, scoreOf(s));
          setFinished(s);
          setStage('done');
        }}
        onQuit={back}
      />
    );
  }

  if (stage === 'intro') {
    const from = offer?.from;
    return (
      <main className="session-done challenge-intro">
        <h1 className="complete-title">{from ? t('ch.duelFrom', { name: from.name }) : t('ch.duelNew')}</h1>
        <p className="muted">{t('ch.duelIntro', { n: ids.length, course: meta.name[lang] })}</p>
        {from && (
          <p className="challenge-target">
            {from.name}: <strong className="tabular">{scoreText(from.score, lang)}</strong> · {t('ch.beatIt')}
          </p>
        )}
        <ul className="challenge-rules">
          <li>{t('ch.rule1')}</li>
          <li>{t('ch.rule2')}</li>
        </ul>
        <ResultActions
          actions={[
            { label: t('ch.startDuel'), onClick: () => setStage('run') },
            { label: t('ch.back'), onClick: back, variant: 'ghost' },
          ]}
        />
      </main>
    );
  }

  const mine = finished ? scoreOf(finished) : earlier;
  return (
    <main className="session-done">
      <div className="complete">
        <h1 className="complete-title">{t('ch.duelTitle')}</h1>
        {mine && <ScoreLine score={mine} />}
        {offer?.from && mine && <DuelVerdict mine={mine} theirs={offer.from.score} name={offer.from.name} />}
        {finished && <AnswerList index={index} state={finished} />}
        {mine && <ShareDuel meta={meta} seed={seed} score={mine} reply={!!offer?.from} />}
        <ResultActions
          actions={[
            { label: t('ch.rematch'), onClick: () => navigate(`/${meta.slug}/duel`, { replace: true }), variant: 'secondary' },
            { label: t('ch.toCourse'), onClick: back, variant: 'ghost' },
          ]}
        />
      </div>
    </main>
  );
}

function DuelVerdict({ mine, theirs, name }: { mine: ChallengeScore; theirs: ChallengeScore; name: string }) {
  const t = useT();
  const lang = useLang();
  const cmp = compareScores(mine, theirs);
  return (
    <div className={`challenge-verdict ${cmp < 0 ? 'is-win' : cmp > 0 ? 'is-loss' : 'is-tie'}`} role="status">
      <strong>{cmp < 0 ? t('ch.win') : cmp > 0 ? t('ch.loss', { name }) : t('ch.tie')}</strong>
      <span className="muted small tabular">
        {t('who.you')} {scoreText(mine, lang)} · {name} {scoreText(theirs, lang)}
      </span>
    </div>
  );
}

/** Name field and the link to send (Web Share on phones, copy elsewhere). */
function ShareDuel({ meta, seed, score, reply }: { meta: CourseMeta; seed: string; score: ChallengeScore; reply: boolean }) {
  const t = useT();
  const lang = useLang();
  const user = useSync((s) => s.user);
  const stored = useProgress((s) => s.root.profile.share);
  const [name, setName] = useState(() => (user && effectiveShare(stored).name) || localName());
  const [copied, setCopied] = useState(false);
  const link = `${location.origin}${location.pathname}#/${meta.slug}/duel?${duelQuery(seed, { name: name.trim() || t('ch.someone'), score })}`;
  const share = async () => {
    saveLocalName(name);
    const text = t('ch.shareText', { course: meta.name[lang], score: `${score.c}/${score.n}` });
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Sylareads', text, url: link });
        return;
      }
    } catch {
      /* cancelled: fall back to copying */
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      window.prompt(t('ch.copyPrompt'), link);
    }
  };
  return (
    <Card className="challenge-share">
      <h2 className="card-label">{reply ? t('ch.sendBack') : t('ch.sendTitle')}</h2>
      <label className="share-name">
        <span className="small">{t('ch.yourName')}</span>
        <input className="text-input" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} autoComplete="nickname" />
      </label>
      <div className="actions">
        <Button variant="primary" onClick={() => void share()}>
          {t('ch.share')}
        </Button>
      </div>
      {copied && (
        <p className="small share-state is-on" role="status">
          {t('ch.copied')}
        </p>
      )}
    </Card>
  );
}

const NAME_KEY = 'sylareads.duelName';
function localName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}
function saveLocalName(name: string) {
  try {
    localStorage.setItem(NAME_KEY, name.trim());
  } catch {
    /* ignore */
  }
}

/* ---------- Course overview card ---------- */

/** Dashboard: today's challenge (open or played) and the duel button. */
export function DailyCard() {
  const { meta } = useCourse();
  const t = useT();
  const lang = useLang();
  const today = dayKey();
  const record = useProgress((s) => s.root.courses[meta.id]?.daily?.[today]);
  const base = `/${meta.slug}`;
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
        <ButtonLink variant={record ? 'secondary' : 'primary'} to={`${base}/daily`}>
          {record ? t('ch.seeBoard') : t('ch.start')}
        </ButtonLink>
        <ButtonLink to={`${base}/duel`}>{t('ch.challengeFriend')}</ButtonLink>
      </div>
    </Card>
  );
}
