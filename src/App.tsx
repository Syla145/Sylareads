import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Link, Route, Routes } from 'react-router-dom';
import { CourseGate } from './features/course/CourseLayout';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { HomePage } from './features/home/HomePage';
import { LearnPage } from './features/learn/LearnPage';
import { MapPage } from './features/map/MapPage';
import { PracticeHub } from './features/practice/PracticeHub';
import { ProfilePage } from './features/profile/ProfilePage';
import { ScriptPage } from './features/script/ScriptPage';
import { LessonRoute } from './features/session/LessonRoute';
import { PracticeRoute } from './features/session/PracticeRoute';
import { useLang, useT } from './i18n';
import { TopBar } from './ui/TopBar';
import { TempoPage } from './features/tempo/TempoPage';
import { TempoRoute } from './features/tempo/TempoRun';
import { PlacementRoute } from './features/placement/PlacementRoute';

// The scripts course brings its own fonts; load it only when it is opened.
const ScriptsHome = lazy(() => import('./features/scripts/ScriptsHome'));
const ScriptSession = lazy(() => import('./features/scripts/ScriptSession'));
const SignsPreview = lazy(() => import('./features/signs/SignsPreview'));

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
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/scripts" element={lazyPage(<ScriptsHome />)} />
        <Route path="/schilder" element={lazyPage(<SignsPreview />)} />
        <Route path="/scripts/lesson/:lessonId" element={lazyPage(<div className="focus-shell"><ScriptSession /></div>)} />
        <Route path="/scripts/practice" element={lazyPage(<div className="focus-shell"><ScriptSession /></div>)} />
        <Route path="/:slug" element={<CourseGate />}>
          <Route index element={<DashboardPage />} />
          <Route path="learn" element={<LearnPage />} />
          <Route path="practice" element={<PracticeHub />} />
          <Route path="tempo" element={<TempoPage />} />
          <Route path="script" element={<ScriptPage />} />
          <Route path="map" element={<MapPage />} />
        </Route>
        <Route path="/:slug" element={<CourseGate focus />}>
          <Route path="lesson/:lessonId" element={<LessonRoute />} />
          <Route path="practice/run" element={<PracticeRoute />} />
          <Route path="tempo/run" element={<TempoRoute />} />
          <Route path="placement" element={<PlacementRoute />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  );
}
