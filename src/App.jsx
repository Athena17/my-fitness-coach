import { lazy, Suspense } from 'react';
import { useApp } from './context/useApp.js';
import { useAuth } from './context/useAuth.js';
import { VIEWS } from './context/constants.js';
import Auth from './views/Auth.jsx';
import PasswordReset from './views/PasswordReset.jsx';
import Onboarding from './views/Onboarding.jsx';
import NavBar from './components/NavBar.jsx';
import GoalBar from './components/GoalBar.jsx';
import UpdateToast from './components/UpdateToast.jsx';
import OfflineBanner from './components/OfflineBanner.jsx';
import './App.css';

const Dashboard = lazy(() => import('./views/Dashboard.jsx'));
const Today = lazy(() => import('./views/Today.jsx'));
const Profile = lazy(() => import('./views/Profile.jsx'));

const ViewFallback = (
  <div className="app-loading" style={{ minHeight: 'auto', flex: 1 }}>
    <div className="app-loading-spinner" />
  </div>
);

function App() {
  const { user, loading: authLoading, recoveryMode } = useAuth();
  const { state, loading: dataLoading } = useApp();

  if (authLoading || dataLoading) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (recoveryMode) {
    return <PasswordReset />;
  }

  if (!state.targets.onboardingComplete) {
    return <Onboarding />;
  }

  const renderView = () => {
    switch (state.currentView) {
      case VIEWS.DASHBOARD:
        return <Dashboard />;
      case VIEWS.DAILY_LOG:
        return <Today />;
      case VIEWS.PROFILE:
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <GoalBar />
      </header>
      <main className="app-main">
        <Suspense fallback={ViewFallback}>
          {renderView()}
        </Suspense>
      </main>
      <NavBar />
      <UpdateToast />
      <OfflineBanner />
    </div>
  );
}

export default App;
