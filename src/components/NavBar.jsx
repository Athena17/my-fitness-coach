import { useApp } from '../context/useApp.js';
import { VIEWS } from '../context/constants.js';
import './NavBar.css';

function DashboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function DailyLogIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="9" y1="4" x2="9" y2="10" />
      <line x1="15" y1="4" x2="15" y2="10" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 1 0-16 0" />
    </svg>
  );
}

const tabs = [
  { view: VIEWS.DASHBOARD, label: 'Dashboard', icon: <DashboardIcon /> },
  { view: VIEWS.DAILY_LOG, label: 'Daily Log', icon: <DailyLogIcon /> },
  { view: VIEWS.HISTORY, label: 'History', icon: <HistoryIcon /> },
  { view: VIEWS.SETTINGS, label: 'Settings', icon: <SettingsIcon /> },
];

export default function NavBar() {
  const { state, dispatch } = useApp();
  const { currentView } = state;

  return (
    <div className="navbar-wrapper">
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
    </div>
  );
}
