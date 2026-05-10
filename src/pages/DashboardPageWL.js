import React, { useState, useEffect, useCallback } from 'react';
import { WL, WF } from '../theme-wl';
import { WLPanel, WLBadge, WLAlert } from '../components/WLLayout';
import { platformApi, scheduleApi, historyApi, templateApi, bulkApi } from '../api';

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, trend, color, loading }) {
  return (
    <div style={{ background:WL.white, border:'1px solid '+WL.border, borderRadius:4,
                  padding:'16px 20px', borderTop:'3px solid '+color,
                  boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', color:WL.textMuted,
                    textTransform:'uppercase', fontFamily:WF.sans, marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:32, fontWeight:700, color:WL.textPrimary, fontFamily:WF.sans,
                    marginBottom:4, lineHeight:1 }}>
        {loading ? <span style={{ fontSize:18, color:WL.textMuted }}>—</span> : value}
      </div>
      <div style={{ fontSize:12.5, color:WL.textSec, fontFamily:WF.sans }}>{trend || ' '}</div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'
  });
}

function fmtRelative(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const TD = { padding:'9px 12px', fontSize:13, fontFamily:WF.sans,
             borderBottom:'1px solid '+WL.borderLight, color:WL.textSec, verticalAlign:'middle' };
const TH = { padding:'8px 12px', textAlign:'left', fontSize:11, fontWeight:700,
             color:WL.textMuted, textTransform:'uppercase', letterSpacing:'0.06em',
             background:WL.contentBg, borderBottom:'2px solid '+WL.border };

export default function DashboardPageWL({ setPage }) {
  const [platforms,   setPlatforms]   = useState([]);
  const [platformId,  setPlatformId]  = useState('');
  const [loading,     setLoading]     = useState(true);
  const [stats,       setStats]       = useState(null);
  const [recentRuns,  setRecentRuns]  = useState([]);
  const [schedules,   setSchedules]   = useState([]);
  const [templates,   setTemplates]   = useState([]);
  const [bulkCount,   setBulkCount]   = useState(null);
  const [err,         setErr]         = useState('');
  const [toast,       setToast]       = useState('');
  const [retriggering,setRetriggering]= useState(null);

  // Load platforms once
  useEffect(() => {
    platformApi.list(0, 100, 'ACTIVE').then(d => {
      const list = d.content || [];
      setPlatforms(list);
      if (list.length > 0) setPlatformId(list[0].id);
    }).catch(() => {});
  }, []);

  // Load all data when platform changes
  const loadAll = useCallback(async (pid) => {
    if (!pid) return;
    setLoading(true);
    try {
      const [summary, history, sched, tpls, bulk] = await Promise.allSettled([
        historyApi.summary(pid),
        historyApi.list(pid, null, 0, 10),
        scheduleApi.list(pid, null, 0, 100),
        templateApi.list(pid, 0, 100),
        bulkApi.list(pid, 0, 100),
      ]);

      if (summary.status === 'fulfilled') setStats(summary.value);
      if (history.status === 'fulfilled') setRecentRuns(history.value.content || []);
      if (sched.status === 'fulfilled')   setSchedules(sched.value.content || sched.value || []);
      if (tpls.status === 'fulfilled')    setTemplates(tpls.value.content || tpls.value || []);
      if (bulk.status === 'fulfilled')    setBulkCount((bulk.value.content || bulk.value || []).length);
    } catch (e) {
      setErr('Failed to load dashboard data: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (platformId) loadAll(platformId); }, [platformId, loadAll]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleRetrigger = async (runId) => {
    setRetriggering(runId);
    try {
      await historyApi.retrigger(runId);
      showToast('▶ Report retriggered — check Run History for progress.');
      loadAll(platformId);
    } catch (e) {
      setErr('Retrigger failed: ' + e.message);
    } finally {
      setRetriggering(null);
    }
  };

  // Derived stats
  const activeSchedules  = schedules.filter(s => s.active).length;
  const failedRuns       = stats?.failed   ?? 0;
  const successRuns      = stats?.success  ?? 0;
  const totalRuns        = stats?.total    ?? 0;
  const avgDuration      = stats?.avgDurationMs ? Math.round(stats.avgDurationMs / 1000) : null;
  const successRate      = totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : null;

  return (
    <div style={{ padding:'20px 24px', maxWidth:1300, fontFamily:WF.sans }}>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:20, right:24, zIndex:2000, padding:'12px 20px',
                      background:'#0F2D1F', color:'#fff', borderRadius:4, fontSize:13,
                      fontFamily:WF.sans, boxShadow:'0 4px 16px rgba(0,0,0,0.25)' }}>
          {toast}
        </div>
      )}

      {/* Failure alert */}
      {failedRuns > 0 && !loading && (
        <WLAlert type="warning"
          message={`${failedRuns} report run${failedRuns > 1 ? 's' : ''} failed — review Run History for details.`}
          onClose={() => setErr('')} />
      )}
      {err && (
        <WLAlert type="error" message={err} onClose={() => setErr('')} />
      )}

      {/* Platform selector */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h1 style={{ margin:0, fontSize:20, fontWeight:700, color:WL.textPrimary, fontFamily:WF.sans }}>
            Dashboard
          </h1>
          <p style={{ margin:'3px 0 0', fontSize:13, color:WL.textSec }}>
            Report engine overview for the selected platform
          </p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <select value={platformId} onChange={e => setPlatformId(e.target.value)}
            style={{ padding:'7px 12px', borderRadius:3, border:'1px solid '+WL.border,
                     fontSize:13, fontFamily:WF.sans, color:WL.textPrimary,
                     background:WL.white, outline:'none', cursor:'pointer' }}>
            {platforms.map(p => <option key={p.id} value={p.id}>{p.platformName}</option>)}
          </select>
          <button onClick={() => loadAll(platformId)}
            style={{ padding:'7px 14px', borderRadius:3, border:'1px solid '+WL.border,
                     background:WL.white, fontSize:13, fontFamily:WF.sans,
                     cursor:'pointer', color:WL.textSec }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
        <StatCard label="Active Schedules" value={activeSchedules}
          trend={`${schedules.length} total (${schedules.length - activeSchedules} paused)`}
          color={WL.teal} loading={loading} />
        <StatCard label="Total Runs" value={totalRuns}
          trend={successRate !== null ? `${successRate}% success rate` : 'No runs yet'}
          color={WL.green} loading={loading} />
        <StatCard label="Templates" value={templates.length}
          trend={bulkCount !== null ? `${bulkCount} bulk schedule${bulkCount !== 1 ? 's' : ''}` : ''}
          color={WL.blue} loading={loading} />
        <StatCard label="Failed Runs" value={failedRuns}
          trend={failedRuns > 0 ? '⚠ Requires attention' : avgDuration !== null ? `Avg ${avgDuration}s/run` : 'All runs healthy'}
          color={failedRuns > 0 ? WL.red : WL.green} loading={loading} />
      </div>

      {/* Recent runs table */}
      <WLPanel title="Recent Report Runs">
        {loading ? (
          <div style={{ padding:'32px', textAlign:'center', color:WL.textMuted, fontSize:13 }}>
            Loading…
          </div>
        ) : recentRuns.length === 0 ? (
          <div style={{ padding:'32px', textAlign:'center', color:WL.textMuted }}>
            <div style={{ fontSize:28, marginBottom:8 }}>📋</div>
            <div style={{ fontSize:14, fontWeight:600, color:WL.textSec }}>No runs yet</div>
            <div style={{ fontSize:12.5, marginTop:4 }}>
              Schedule a report and run it to see history here.
            </div>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Report Name','Format','Status','Duration','Started',''].map(h => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentRuns.map(r => (
                <tr key={r.id}
                  onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ ...TD, fontWeight:600, color:WL.textLink }}>{r.reportName}</td>
                  <td style={TD}>
                    <span style={{ padding:'2px 7px', borderRadius:2, fontSize:11.5,
                                   background:WL.fieldBg, color:WL.textSec,
                                   fontFamily:'monospace', fontWeight:600 }}>
                      {r.outputFormat}
                    </span>
                  </td>
                  <td style={TD}>
                    <WLBadge status={
                      r.status === 'SUCCESS'    ? 'Active'  :
                      r.status === 'FAILED'     ? 'Failed'  :
                      r.status === 'RUNNING'    ? 'Running' :
                      r.status === 'QUEUED'     ? 'Pending' : r.status
                    } />
                  </td>
                  <td style={{ ...TD, fontFamily:'monospace', fontSize:12 }}>
                    {r.durationMs ? (r.durationMs / 1000).toFixed(1) + 's' : '—'}
                  </td>
                  <td style={{ ...TD, fontSize:12, color:WL.textMuted }}>
                    {fmtRelative(r.startedAt || r.createdAt)}
                  </td>
                  <td style={TD}>
                    {r.status === 'FAILED' && r.scheduledReportId && (
                      <button
                        onClick={() => handleRetrigger(r.id)}
                        disabled={retriggering === r.id}
                        style={{ padding:'4px 10px', borderRadius:3, fontSize:12,
                                 border:'1px solid '+WL.border, background:WL.white,
                                 cursor: retriggering === r.id ? 'not-allowed' : 'pointer',
                                 color:WL.textSec, fontFamily:WF.sans,
                                 opacity: retriggering === r.id ? 0.6 : 1 }}>
                        {retriggering === r.id ? '⏳' : '▶ Re-run'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div style={{ marginTop:12, display:'flex', justifyContent:'space-between',
                      alignItems:'center' }}>
          {!loading && totalRuns > 0 && (
            <span style={{ fontSize:12.5, color:WL.textMuted, fontFamily:WF.sans }}>
              Showing latest {recentRuns.length} of {totalRuns} total runs
            </span>
          )}
          <div style={{ marginLeft:'auto' }}>
            <button onClick={() => setPage('history')}
              style={{ padding:'7px 16px', borderRadius:3, fontSize:13,
                       border:'1px solid '+WL.teal, background:WL.tealL,
                       cursor:'pointer', color:WL.tealD, fontFamily:WF.sans, fontWeight:600 }}>
              View Full History →
            </button>
          </div>
        </div>
      </WLPanel>

      {/* Active schedules summary */}
      {!loading && schedules.length > 0 && (
        <WLPanel title="Active Schedules">
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Report Name','Frequency','Format','Next Run','Status'].map(h => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedules.slice(0, 8).map(s => (
                <tr key={s.id}
                  onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ ...TD, fontWeight:600, color:WL.textPrimary }}>{s.reportName}</td>
                  <td style={TD}>{(s.frequency || '').replace(/_/g, ' ')}</td>
                  <td style={TD}>
                    <span style={{ padding:'2px 7px', borderRadius:2, fontSize:11.5,
                                   background:'#EFF6FF', color:'#2563EB',
                                   fontFamily:'monospace', fontWeight:700 }}>
                      {s.outputFormat}
                    </span>
                  </td>
                  <td style={{ ...TD, fontSize:12, color:WL.textMuted }}>
                    {s.nextRunAt ? fmtDate(s.nextRunAt) : '—'}
                  </td>
                  <td style={TD}><WLBadge status={s.active ? 'Active' : 'Paused'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {schedules.length > 8 && (
            <div style={{ marginTop:10, textAlign:'right' }}>
              <button onClick={() => setPage('reports')}
                style={{ padding:'6px 14px', borderRadius:3, fontSize:12.5,
                         border:'1px solid '+WL.border, background:WL.white,
                         cursor:'pointer', color:WL.textSec, fontFamily:WF.sans }}>
                View all {schedules.length} schedules →
              </button>
            </div>
          )}
        </WLPanel>
      )}

      {/* Quick actions */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
        {[
          { label:'Schedule New Report', icon:'📅', page:'schedule',
            desc:'Set up a new automated report for a platform' },
          { label:'Browse Merchants & Banks', icon:'🏪', page:'merchantbank',
            desc:'Discover entities from source DB and schedule reports' },
          { label:'Bulk Schedule', icon:'📦', page:'bulkschedule',
            desc:'Generate reports for multiple entities in one job' },
        ].map(a => (
          <div key={a.label} onClick={() => setPage(a.page)}
            style={{ background:WL.white, border:'1px solid '+WL.border, borderRadius:4,
                     padding:'18px 20px', cursor:'pointer', transition:'all 0.15s',
                     boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = WL.teal; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,169,157,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = WL.border; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; }}>
            <div style={{ fontSize:26, marginBottom:8 }}>{a.icon}</div>
            <div style={{ fontSize:14, fontWeight:700, color:WL.textPrimary,
                          fontFamily:WF.sans, marginBottom:4 }}>{a.label}</div>
            <div style={{ fontSize:12.5, color:WL.textSec, fontFamily:WF.sans }}>{a.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
