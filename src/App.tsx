import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { StorageBanner } from './ui/StorageBanner';
import { RouteFocus } from './ui/RouteFocus';
import { CourseGate } from './features/course/CourseLayout';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { HomePage } from './features/home/HomePage';
import { LearnPage } from './features/learn/LearnPage';
import { MapPage } from './features/map/MapPage';
import { PracticeHub } from './features/practice/PracticeHub';
import { ScriptPage } from './features/script/ScriptPage';
import { LessonRoute } from './features/session/LessonRoute';
import { PracticeRoute } from './features/session/PracticeRoute';
import { useLang, useT } from './i18n';
import { TopBar } from './ui/TopBar';
import { SiteFooter } from './features/legal/SiteFooter';

// The scripts course brings its own fonts; load it only when it is opened.
const ScriptsHome = lazy(() => import('./features/scripts/ScriptsHome'));
const ScriptSession = lazy(() => import('./features/scripts/ScriptSession'));
const SignsPreview = lazy(() => import('./features/signs/SignsPreview'));
// Pages that are opened less often load on demand, so the first visit stays small.
const named = <K extends string>(load: () => Promise<Record<K, React.ComponentType>>, name: K) => lazy(() => load().then((m) => ({ default: m[name] })));
const legal = () => import('./features/legal/LegalPages');
const AboutPage = named(legal, 'AboutPage');
const PrivacyPage = named(legal, 'PrivacyPage');
const ImpressumPage = named(legal, 'ImpressumPage');
const CreditsPage = named(legal, 'CreditsPage');
const ProfilePage = named(() => import('./features/profile/ProfilePage'), 'ProfilePage');
const PlayersPage = lazy(() => import('./features/players/PlayersPage'));
const PassPage = lazy(() => import('./features/passport/PassPage'));
const TempoPage = named(() => import('./features/tempo/TempoPage'), 'TempoPage');
const TempoRoute = named(() => import('./features/tempo/TempoRun'), 'TempoRoute');
const PlacementRoute = named(() => import('./features/placement/PlacementRoute'), 'PlacementRoute');
const challenge = () => import('./features/challenge/ChallengePages');
const DailyRoute = named(challenge, 'DailyRoute');
const DuelRoute = named(challenge, 'DuelRoute');

function Loading() {
  const t = useT();
  return (
    <div className="loading" role="status">
      {t('common.loading')}
    </div>
  );
}

const lazyPage = (node: React.ReactNode) => <Suspense fallback={<Loading />}>{node}</Suspense>;

function NotFound() {
  const t = useT();
  return (
    <div className="app-shell">
      <TopBar />
      <main className="page page-narrow empty-state">
        <p>{t('common.notFound')}</p>
        <Link to="/" className="btn btn-primary">
          {t('common.toHome')}
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}

export function App() {
  const lang = useLang();
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <HashRouter>
      <StorageBanner />
      <RouteFocus />
      <Pages />
    </HashRouter>
  );
}

/** All pages; an error on one page shows a way out and is forgotten on the next page. */
function Pages() {
  const { pathname } = useLocation();
  return (
    <ErrorBoundary resetKey={pathname}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={lazyPage(<ProfilePage />)} />
        <Route path="/players" element={lazyPage(<PlayersPage />)} />
        <Route path="/pass" element={lazyPage(<PassPage />)} />
        <Route path="/about" element={lazyPage(<AboutPage />)} />
        <Route path="/privacy" element={lazyPage(<PrivacyPage />)} />
        <Route path="/impressum" element={lazyPage(<ImpressumPage />)} />
        <Route path="/credits" element={lazyPage(<CreditsPage />)} />
        <Route path="/scripts" element={lazyPage(<ScriptsHome />)} />
        <Route path="/schilder" element={lazyPage(<SignsPreview />)} />
        <Route path="/scripts/lesson/:lessonId" element={lazyPage(<div className="focus-shell"><ScriptSession /></div>)} />
        <Route path="/scripts/practice" element={lazyPage(<div className="focus-shell"><ScriptSession /></div>)} />
        <Route path="/:slug" element={<CourseGate />}>
          <Route index element={<DashboardPage />} />
          <Route path="learn" element={<LearnPage />} />
          <Route path="practice" element={<PracticeHub />} />
          <Route path="tempo" element={lazyPage(<TempoPage />)} />
          <Route path="script" element={<ScriptPage />} />
          <Route path="map" element={<MapPage />} />
        </Route>
        <Route path="/:slug" element={<CourseGate focus />}>
          <Route path="lesson/:lessonId" element={<LessonRoute />} />
          <Route path="practice/run" element={<PracticeRoute />} />
          <Route path="tempo/run" element={lazyPage(<TempoRoute />)} />
          <Route path="placement" element={lazyPage(<PlacementRoute />)} />
          <Route path="daily" element={lazyPage(<DailyRoute />)} />
          <Route path="duel" element={lazyPage(<DuelRoute />)} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
}
