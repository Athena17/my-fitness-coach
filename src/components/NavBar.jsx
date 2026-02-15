import { useApp } from '../context/useApp.js';
import { VIEWS } from '../context/constants.js';
import './NavBar.css';

function TodayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function ProgressIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="9" y1="4" x2="9" y2="10" />
      <line x1="15" y1="4" x2="15" y2="10" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 1 0-16 0" />
    </svg>
  );
}

const tabs = [
  { view: VIEWS.TODAY, label: 'Today', icon: <TodayIcon /> },
  { view: VIEWS.HISTORY, label: 'Progress', icon: <ProgressIcon /> },
  { view: VIEWS.SETTINGS, label: 'Profile', icon: <ProfileIcon /> },
];

export default function NavBar() {
  const { state, dispatch } = useApp();
  const { currentView } = state;

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
