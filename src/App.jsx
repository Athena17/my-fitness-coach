import { useApp } from './context/useApp.js';
import { useAuth } from './context/useAuth.js';
import { VIEWS } from './context/constants.js';
import Auth from './views/Auth.jsx';
import Onboarding from './views/Onboarding.jsx';
import Dashboard from './views/Dashboard.jsx';
import Today from './views/Today.jsx';
import Kitchen from './views/Kitchen.jsx';
import Profile from './views/Profile.jsx';
import NavBar from './components/NavBar.jsx';
import GoalBar from './components/GoalBar.jsx';
import './App.css';

function App() {
  const { user, loading: authLoading } = useAuth();
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

  if (!state.targets.onboardingComplete) {
    return <Onboarding />;
  }

  const renderView = () => {
    switch (state.currentView) {
      case VIEWS.DASHBOARD:
        return <Dashboard />;
      case VIEWS.DAILY_LOG:
        return <Today />;
      case VIEWS.KITCHEN:
        return <Kitchen />;
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
      <main className="app-main">{renderView()}</main>
      <NavBar />
    </div>
  );
}

export default App;
