import { useApp } from './context/useApp.js';
import { VIEWS } from './context/constants.js';
import Onboarding from './views/Onboarding.jsx';
import Dashboard from './views/Dashboard.jsx';
import FoodLog from './views/FoodLog.jsx';
import Settings from './views/Settings.jsx';
import NavBar from './components/NavBar.jsx';
import './App.css';

function App() {
  const { state } = useApp();

  if (!state.targets.onboardingComplete) {
    return <Onboarding />;
  }

  const renderView = () => {
    switch (state.currentView) {
      case VIEWS.FOOD_LOG:
        return <FoodLog />;
      case VIEWS.SETTINGS:
        return <Settings />;
      case VIEWS.DASHBOARD:
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-shell">
      <main className="app-main">{renderView()}</main>
      <NavBar />
    </div>
  );
}

export default App;
