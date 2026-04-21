import { useRouter } from 'next/router';
import { useState, useEffect, ReactNode, useCallback } from 'react';
import { setState, getState, applyTheme } from '@/lib/store';

interface LayoutProps {
  children: ReactNode;
  showTabs?: boolean;
  title?: string;
  actions?: ReactNode;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export default function Layout({ children, showTabs = true, title, actions }: LayoutProps) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const theme = getState().theme;
    applyTheme(theme);
  }, []);

  useEffect(() => {
    const handler = () => {
      const { theme } = getState();
      applyTheme(theme);
    };
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    (window as any).showToast = (msg: string) => {
      setToast(msg);
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => setToast(null), 2500);
    };
  }, []);

  const navigate = useCallback((page: string) => {
    router.push('/' + page);
  }, [router]);

  const tabs = [
    { page: 'dashboard', label: 'Panel', icon: <HomeIcon /> },
    { page: 'persons', label: 'Kişiler', icon: <PeopleIcon /> },
    { page: 'cards', label: 'Kartlar', icon: <CardIcon /> },
    { page: 'add', label: 'Harcama', icon: <PlusIcon />, center: true },
    { page: 'history', label: 'Geçmiş', icon: <HistoryIcon /> },
  ];

  return (
    <>
      <div className="navbar">
        <div className="navbar-title">
          {title && (
            <>
              <span>💳</span>
              <span>{title}</span>
            </>
          )}
        </div>
        <div className="navbar-actions">
          {actions || (
            <button className="btn btn-ghost btn-icon" onClick={() => navigate('settings')}>
              <SettingsIcon />
            </button>
          )}
        </div>
      </div>

      <main className="page">
        {children}
      </main>

      {showTabs && (
        <nav className="tab-bar">
          {tabs.map((tab) => (
            <button
              key={tab.page}
              className={`tab-btn${tab.center ? ' tab-btn-add' : ''}${router.pathname === '/' + tab.page ? ' active' : ''}`}
              onClick={() => navigate(tab.page)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

// Icons as inline SVGs
function HomeIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9"/><rect x="7" y="3" width="7" height="5"/><rect x="14" y="2" width="7" height="7"/><rect x="14" y="12" width="7" height="9"/><rect x="7" y="11" width="7" height="9"/></svg>;
}
function PeopleIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function CardIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>;
}
function PlusIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>;
}
function HistoryIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
function SettingsIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>;
}
