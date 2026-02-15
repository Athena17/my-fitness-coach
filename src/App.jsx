import { useApp } from './context/useApp.js';
import { VIEWS } from './context/constants.js';
import Onboarding from './views/Onboarding.jsx';
import Today from './views/Today.jsx';
import History from './views/History.jsx';
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
      case VIEWS.HISTORY:
        return <History />;
      case VIEWS.SETTINGS:
        return <Settings />;
      case VIEWS.TODAY:
      default:
        return <Today />;
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
