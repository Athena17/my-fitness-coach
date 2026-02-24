import { useState, useEffect } from 'react';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 'max(4px, env(safe-area-inset-top))',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '6px 16px',
      borderRadius: '50px',
      fontSize: '0.7rem',
      fontWeight: 600,
      fontFamily: 'var(--font-sans)',
      color: 'var(--color-warning)',
      background: 'var(--color-surface)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid var(--color-border)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
      zIndex: 9999,
      whiteSpace: 'nowrap',
    }}>
      Offline — changes will sync later
    </div>
  );
}
