import { useRegisterSW } from 'virtual:pwa-register/react';
import './UpdateToast.css';

export default function UpdateToast() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="update-toast">
      <span className="update-toast-text">New version available</span>
      <button
        className="update-toast-btn"
        onClick={() => updateServiceWorker(true)}
      >
        Update
      </button>
    </div>
  );
}
