/**
 * AppWL.js — Worldline ServiceNow-themed App shell
 * Replaces App.js with the WL enterprise theme.
 */
import React, { useState, useEffect } from 'react';
import { WL, WF } from './theme-wl';
import { WL_LOGO_B64, APP_NAME, APP_VERSION, COPYRIGHT } from './wl-brand';
import { WLTopBar, WLSidebar, WLFooter } from './components/WLLayout';
import { token as tokenStore, setSessionExpiredHandler } from './api';

// Pages
import LoginPage        from './pages/LoginPage';
import PlatformRegPage  from './pages/PlatformRegPage';
import DashboardPage    from './pages/DashboardPageWL';
import UploadPage       from './pages/UploadPage';
import SchedulePage     from './pages/SchedulePage';
import ReportsPage      from './pages/ReportsPageWL';
import EditSchedulePage    from './pages/EditSchedulePage';
import EditBulkSchedulePage from './pages/EditBulkSchedulePage';
import HistoryPage      from './pages/HistoryPageWL';
import SettingsPage     from './pages/SettingsPage';
import QueryRunnerPage  from './pages/QueryRunnerPage';
import MerchantBankPage from './pages/MerchantBankPage';
import BulkSchedulePage from './pages/BulkSchedulePage';

const NAV_ITEMS = [
  { key:'dashboard',    label:'Dashboard',          icon:'⊞',  time:'' },
  { key:'platforms',    label:'Platforms',           icon:'🏢',  time:'' },
  { key:'upload',       label:'Upload Template',     icon:'⬆',  time:'' },
  { key:'schedule',     label:'Schedule Report',     icon:'📅', time:'' },
  { key:'reports',      label:'Scheduled Reports',   icon:'📋', time:'' },
  { key:'history',      label:'Run History',         icon:'📜', time:'' },
  { key:'merchantbank', label:'Merchants & Banks',   icon:'🏪', time:'' },
  { key:'bulkschedule', label:'Bulk Schedules',      icon:'📦', time:'' },
  { key:'queryrun',     label:'Query Runner',        icon:'⚡', time:'' },
  { key:'settings',     label:'Settings',            icon:'⚙',  time:'' },
];

const PAGE_TITLES = {
  // injected dynamically for edit pages — see WLTopBar title logic below
  dashboard:    'Dashboard',
  platforms:    'Platform Registry',
  upload:       'Template Upload',
  schedule:     'Schedule Report',
  reports:      'Scheduled Reports',
  history:      'Run History',
  merchantbank: 'Merchants & Banks',
  bulkschedule: 'Bulk Report Schedules',
  queryrun:     'Query Runner',
  settings:     'Settings',
};

export default function AppWL() {
  const [user,            setUser]           = useState(null);
  const [screen,          setScreen]         = useState('loading');
  const [page,            setPage]           = useState('dashboard');
  const [scheduleContext, setScheduleContext] = useState(null);
  const [editScheduleId,  setEditScheduleId]  = useState(null);
  const [editBulkId,      setEditBulkId]      = useState(null);
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
      setUser(null); setScreen('login'); setPage('dashboard');
      setScheduleContext(null); setBulkContext(null);
    });
  }, []);

  const handleLogin = (u) => {
    setUser(u);
    localStorage.setItem('finreport_user', JSON.stringify(u));
    setScreen('app'); setPage('dashboard');
  };

  const handleLogout = () => {
    tokenStore.clear();
    setUser(null); setScreen('login'); setPage('dashboard');
    setScheduleContext(null); setBulkContext(null);
  };

  const goScheduleWithContext = (ctx) => {
    setScheduleContext(ctx); setPage('schedule');
  };
  const goBulkWithContext = (ctx) => {
    setBulkContext(ctx); setPage('bulkschedule');
  };

  // Nav items for sidebar (recent items style)
  const sidebarItems = NAV_ITEMS.map(n => ({
    ...n, sub: '',
    type: 'nav',
  }));

  // Loading
  if (screen === 'loading') return (
    <div style={{
      minHeight: '100vh', background: WL.teal,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 40, height: 40, border: '3px solid rgba(255,255,255,0.3)',
        borderTopColor: '#fff', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (screen === 'register') return <PlatformRegPage onBack={() => setScreen('login')} />;
  if (screen === 'login' || !user) return (
    <LoginPage onLogin={handleLogin} onRegister={() => setScreen('register')} />
  );

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', overflow: 'hidden',
      fontFamily: WF.sans, background: WL.contentBg,
    }}>
      {/* Top bar */}
      <WLTopBar
        title={
          editScheduleId ? 'Edit Scheduled Report' :
          editBulkId     ? 'Edit Bulk Schedule'    :
          PAGE_TITLES[page]
        }
        user={user}
        onLogout={handleLogout}
      />

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar */}
        <WLSidebar
          items={sidebarItems}
          selected={editScheduleId ? 'reports' : editBulkId ? 'bulkschedule' : page}
          onSelect={p => {
            setPage(p);
            setEditScheduleId(null);   // exit edit mode on nav
            setEditBulkId(null);
            if (p !== 'schedule') setScheduleContext(null);
            if (p !== 'bulkschedule') setBulkContext(null);
          }}
          user={user}
        />

        {/* Main content */}
        <div style={{
          flex: 1, overflow: 'auto',
          background: WL.contentBg,
          display: 'flex', flexDirection: 'column',
        }}>
          {/* ── Full-page edit views — render above main content area ── */}
          {editScheduleId && (
            <EditSchedulePage
              reportId={editScheduleId}
              onSaved={() => { setEditScheduleId(null); setPage('reports'); }}
              onCancel={() => { setEditScheduleId(null); setPage('reports'); }}
            />
          )}
          {editBulkId && (
            <EditBulkSchedulePage
              scheduleId={editBulkId}
              onSaved={() => { setEditBulkId(null); setPage('bulkschedule'); }}
              onCancel={() => { setEditBulkId(null); setPage('bulkschedule'); }}
            />
          )}
          {!editScheduleId && !editBulkId && (
          <>
          {page === 'dashboard'    && <DashboardPage  setPage={setPage} />}
          {page === 'upload'       && <UploadPage />}
          {page === 'schedule'     && (
            <SchedulePage
              scheduleContext={scheduleContext}
              onContextConsumed={() => setScheduleContext(null)}
            />
          )}
          {page === 'reports'      && <ReportsPage onEditSchedule={id => setEditScheduleId(id)} />}
          {page === 'history'      && <HistoryPage />}
          {page === 'settings'     && <SettingsPage />}
          </>
          )}
          {page === 'platforms'    && <PlatformRegPage onBack={() => setPage('dashboard')} />}
          {page === 'queryrun'     && <QueryRunnerPage />}
          {page === 'merchantbank' && (
            <MerchantBankPage
              onScheduleReport={goScheduleWithContext}
              onBulkSchedule={goBulkWithContext}
            />
          )}
          {page === 'bulkschedule' && (
            <BulkSchedulePage onEditBulkSchedule={id => setEditBulkId(id)}
              bulkContext={bulkContext}
              onContextConsumed={() => setBulkContext(null)}
            />
          )}
        </div>
      </div>
      <WLFooter />
    </div>
  );
}

