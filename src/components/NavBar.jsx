import { useApp } from '../context/useApp.js';
import { VIEWS } from '../context/constants.js';
import './NavBar.css';

export default function NavBar() {
  const { state, dispatch } = useApp();
  const { currentView } = state;

  const tabs = [
    { view: VIEWS.TODAY, label: 'Today', icon: '📊' },
    { view: VIEWS.HISTORY, label: 'History', icon: '📅' },
    { view: VIEWS.SETTINGS, label: 'Settings', icon: '⚙️' },
  ];

  return (
    <nav className="navbar">
      {tabs.map((tab) => (
        <button
          key={tab.view}
          className={`navbar-tab ${currentView === tab.view ? 'active' : ''}`}
          onClick={() => dispatch({ type: 'SET_VIEW', payload: tab.view })}
        >
          <span className="navbar-icon">{tab.icon}</span>
          <span className="navbar-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
