import React, { useState, useEffect } from 'react';
import { C } from './theme';
import { token as tokenStore, setSessionExpiredHandler } from './api';
import Sidebar          from './components/Sidebar';
import LoginPage        from './pages/LoginPage';
import PlatformRegPage  from './pages/PlatformRegPage';
import DashboardPage    from './pages/DashboardPage';
import UploadPage       from './pages/UploadPage';
import SchedulePage     from './pages/SchedulePage';
import ReportsPage      from './pages/ReportsPage';
import HistoryPage      from './pages/HistoryPage';
import SettingsPage     from './pages/SettingsPage';
import QueryRunnerPage  from './pages/QueryRunnerPage';
import MerchantBankPage  from './pages/MerchantBankPage';
import BulkSchedulePage  from './pages/BulkSchedulePage';

export default function App() {
  const [user,            setUser]           = useState(null);
  const [screen,          setScreen]         = useState('loading');
  const [page,            setPage]           = useState('dashboard');
  // Carries pre-fill context from MerchantBankPage → SchedulePage
  const [scheduleContext, setScheduleContext] = useState(null);
  const [bulkContext,     setBulkContext]     = useState(null);

  useEffect(() => {
    const t     = tokenStore.get();
    const saved = localStorage.getItem('finreport_user');
    if (t && saved) {
      try { setUser(JSON.parse(saved)); setScreen('app'); }
      catch { tokenStore.clear(); setScreen('login'); }
    } else {
      setScreen('login');
    }
    setSessionExpiredHandler(() => {
      setUser(null);
      setScreen('login');
      setPage('dashboard');
      setScheduleContext(null);
      setBulkContext(null);
    });
  }, []);

  const handleLogin = (u) => {
    setUser(u);
    localStorage.setItem('finreport_user', JSON.stringify(u));
    setScreen('app');
    setPage('dashboard');
  };

  const handleLogout = () => {
    tokenStore.clear();
    setUser(null);
    setScreen('login');
    setPage('dashboard');
    setScheduleContext(null);
    setBulkContext(null);
  };

  // Navigate to Schedule page with pre-filled merchant/bank context
  const goScheduleWithContext = (ctx) => {
    setScheduleContext(ctx);
    setPage('schedule');
  };

  // Navigate to Bulk Schedule page with entity context
  const goBulkWithContext = (ctx) => {
    setBulkContext(ctx);
    setPage('bulkschedule');
  };

  if (screen === 'loading') return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex',
                  alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:40, height:40, borderRadius:'50%',
                    border:'3px solid #E2E8F0', borderTopColor:'#00A99D',
                    animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (screen === 'register') return <PlatformRegPage onBack={() => setScreen('login')} />;
  if (screen === 'login' || !user) return (
    <LoginPage onLogin={handleLogin} onRegister={() => setScreen('register')} />
  );

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:C.bg }}>
      <Sidebar page={page} setPage={p => { setPage(p); if (p !== 'schedule') setScheduleContext(null); if (p !== 'bulkschedule') setBulkContext(null); }}
               user={user} onLogout={handleLogout} />
      <div style={{ flex:1, display:'flex', flexDirection:'column',
                    minHeight:'100vh', overflow:'hidden' }}>
        {page === 'dashboard'    && <DashboardPage setPage={setPage} />}
        {page === 'upload'       && <UploadPage />}
        {page === 'schedule'     && (
          <SchedulePage
            scheduleContext={scheduleContext}
            onContextConsumed={() => setScheduleContext(null)}
          />
        )}
        {page === 'reports'      && <ReportsPage />}
        {page === 'history'      && <HistoryPage />}
        {page === 'settings'     && <SettingsPage />}
        {page === 'platforms'    && <PlatformRegPage onBack={() => setPage('dashboard')} />}
        {page === 'queryrun'     && <QueryRunnerPage />}
        {page === 'merchantbank' && (
          <MerchantBankPage onScheduleReport={goScheduleWithContext} onBulkSchedule={goBulkWithContext} />
        )}
        {page === 'bulkschedule' && (
          <BulkSchedulePage
            bulkContext={bulkContext}
            onContextConsumed={() => setBulkContext(null)}
          />
        )}
      </div>
    </div>
  );
}
