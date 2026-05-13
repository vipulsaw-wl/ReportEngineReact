import React, { useState, useEffect, useCallback } from 'react';
import { WL, WF } from '../theme-wl';
import { WLPanel, WLBadge, WLAlert } from '../components/WLLayout';
import { scheduleApi, platformApi } from '../api';

const FREQS    = ['DAILY','WEEKLY','MONTHLY','ONE_TIME','END_OF_QUARTER','CUSTOM_CRON'];
const CATS     = ['TRANSACTION','BALANCE','STATEMENT','RECONCILIATION','CUSTOM'];
const FMTS     = ['EXCEL','PDF','CSV'];

// ── Small reusable components ────────────────────────────────────────────────
function Btn({ onClick, disabled, children, variant = 'default', loading }) {
  const base = {
    padding: '5px 11px', borderRadius: 3, fontSize: 12.5,
    fontFamily: WF.sans, cursor: disabled || loading ? 'not-allowed' : 'pointer',
    fontWeight: 600, border: 'none', transition: 'opacity 0.15s',
    opacity: disabled || loading ? 0.55 : 1,
  };
  const variants = {
    default: { background: WL.white, color: WL.textSec,
                border: '1px solid ' + WL.border },
    primary: { background: WL.teal,  color: '#fff' },
    danger:  { background: '#FEF2F2', color: '#DC2626',
                border: '1px solid #FECACA' },
    warning: { background: '#FFFBEB', color: '#92400E',
                border: '1px solid #FDE68A' },
  };
  return (
    <button onClick={onClick} disabled={disabled || loading}
      style={{ ...base, ...variants[variant] }}>
      {loading ? '⏳' : children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', marginBottom: 5, fontSize: 11,
                       fontWeight: 700, color: WL.textMuted, fontFamily: WF.sans,
                       textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Inp({ value, onChange, type = 'text', placeholder, rows }) {
  const style = {
    width: '100%', padding: '8px 11px', borderRadius: 3, outline: 'none',
    border: '1.5px solid ' + WL.border, fontSize: 13, fontFamily: WF.sans,
    color: WL.textPrimary, background: WL.white, boxSizing: 'border-box',
  };
  if (rows)
    return <textarea value={value} onChange={onChange} rows={rows}
             placeholder={placeholder} style={{ ...style, resize: 'vertical', fontFamily: 'monospace' }} />;
  return <input value={value} onChange={onChange} type={type}
           placeholder={placeholder} style={style} />;
}

function Sel({ value, onChange, options }) {
  return (
    <select value={value} onChange={onChange}
      style={{ width: '100%', padding: '8px 11px', borderRadius: 3,
               border: '1.5px solid ' + WL.border, fontSize: 13,
               fontFamily: WF.sans, color: WL.textPrimary,
               background: WL.white, outline: 'none', boxSizing: 'border-box' }}>
      {options.map(o => (
        <option key={typeof o === 'string' ? o : o.value}
                value={typeof o === 'string' ? o : o.value}>
          {typeof o === 'string' ? o.replace(/_/g, ' ') : o.label}
        </option>
      ))}
    </select>
  );
}


// ── Main Page ────────────────────────────────────────────────────────────────
export default function ReportsPageWL({ onEditSchedule }) {
  const [platforms,   setPlatforms]  = useState([]);
  const [platformId,  setPlatformId] = useState('');
  const [reports,     setReports]    = useState([]);
  const [loading,     setLoading]    = useState(false);
  const [err,         setErr]        = useState('');
  const [toast,       setToast]      = useState('');
  const [page,        setPage]       = useState(0);
  const [runningId,   setRunningId]  = useState(null);
  const [togglingId,  setTogglingId] = useState(null);
  const [deletingId,  setDeletingId] = useState(null);
  const [confirmDel,  setConfirmDel] = useState(null);

  // Load platforms
  useEffect(() => {
    platformApi.list(0, 100, 'ACTIVE').then(d => {
      const list = d.content || [];
      setPlatforms(list);
      if (list.length > 0) setPlatformId(list[0].id);
    }).catch(() => {});
  }, []);

  // Load reports
  const loadReports = useCallback(() => {
    if (!platformId) return;
    setLoading(true);
    scheduleApi.list(platformId, null, page, 20)
      .then(d => setReports(d.content || d || []))
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [platformId, page]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleRun = async (id, name) => {
    setRunningId(id);
    try {
      await scheduleApi.runNow(id);
      showToast(`▶ "${name}" triggered — check Run History for output.`);
    } catch (e) {
      setErr('Run failed: ' + e.message);
    } finally {
      setRunningId(null);
    }
  };

  const handleToggle = async (report) => {
    setTogglingId(report.id);
    try {
      if (report.active) {
        await scheduleApi.pause(report.id);
        showToast(`⏸ "${report.reportName}" paused.`);
      } else {
        await scheduleApi.resume(report.id);
        showToast(`▶ "${report.reportName}" resumed.`);
      }
      loadReports();
    } catch (e) {
      setErr('Toggle failed: ' + e.message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id, name) => {
    setDeletingId(id);
    try {
      await scheduleApi.delete(id);
      showToast(`🗑 "${name}" deleted.`);
      loadReports();
    } catch (e) {
      setErr('Delete failed: ' + e.message);
    } finally {
      setDeletingId(null);
      setConfirmDel(null);
    }
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const TH = {
    padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700,
    color: WL.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em',
    background: WL.contentBg, borderBottom: '2px solid ' + WL.border,
    fontFamily: WF.sans, whiteSpace: 'nowrap',
  };
  const TD = {
    padding: '10px 14px', fontSize: 13, fontFamily: WF.sans,
    borderBottom: '1px solid ' + WL.borderLight, color: WL.textSec,
    verticalAlign: 'middle',
  };


  return (
    <div style={{ padding: '20px 24px', fontFamily: WF.sans }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 24, zIndex: 2000,
                      padding: '12px 20px', background: '#0F2D1F',
                      color: '#fff', borderRadius: 4, fontSize: 13,
                      fontFamily: WF.sans, boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                      maxWidth: 400 }}>
          {toast}
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmDel && (
        <div onClick={() => setConfirmDel(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000,
                   background: 'rgba(0,0,0,0.4)',
                   display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: WL.white, borderRadius: 5, padding: 28,
                     maxWidth: 400, width: '100%',
                     boxShadow: '0 16px 48px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: WL.textPrimary,
                          fontFamily: WF.sans, marginBottom: 10 }}>
              Delete Schedule?
            </div>
            <div style={{ fontSize: 13, color: WL.textSec, fontFamily: WF.sans,
                          marginBottom: 20 }}>
              <strong>"{confirmDel.name}"</strong> will be permanently deleted.
              This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Btn onClick={() => setConfirmDel(null)}>Cancel</Btn>
              <Btn onClick={() => handleDelete(confirmDel.id, confirmDel.name)}
                   variant="danger" loading={deletingId === confirmDel.id}>
                🗑 Delete
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700,
                        color: WL.textPrimary, fontFamily: WF.sans }}>
            Scheduled Reports
          </h1>
          <p style={{ margin: '3px 0 0', fontSize: 13, color: WL.textSec }}>
            {reports.length > 0
              ? `${reports.length} schedule${reports.length !== 1 ? 's' : ''} — click ▶ Run to trigger immediately`
              : 'Active report schedules for the selected platform'}
          </p>
        </div>
        <select value={platformId} onChange={e => { setPlatformId(e.target.value); setPage(0); }}
          style={{ padding: '7px 12px', borderRadius: 3,
                   border: '1px solid ' + WL.border, fontSize: 13,
                   fontFamily: WF.sans, color: WL.textPrimary,
                   background: WL.white, outline: 'none', cursor: 'pointer' }}>
          {platforms.map(p => (
            <option key={p.id} value={p.id}>{p.platformName}</option>
          ))}
        </select>
      </div>

      {err && <WLAlert type="error" message={err} onClose={() => setErr('')} />}

      <WLPanel>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: WL.textMuted }}>
            Loading…
          </div>
        ) : reports.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: WL.textSec, marginBottom: 6 }}>
              No scheduled reports
            </div>
            <div style={{ fontSize: 13, color: WL.textMuted }}>
              Go to <strong>Schedule Report</strong> to create one.
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Report Name','Category','Frequency','Format','Last Run','Next Run','Status','Actions']
                  .map(h => <th key={h} style={TH}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id}
                  onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                  {/* Report name */}
                  <td style={{ ...TD, fontWeight: 600, color: WL.textLink }}>
                    {r.reportName}
                    {r.notes && (
                      <div style={{ fontSize: 11.5, color: WL.textMuted,
                                    fontWeight: 400, marginTop: 2 }}>
                        {r.notes.slice(0, 60)}{r.notes.length > 60 ? '…' : ''}
                      </div>
                    )}
                  </td>

                  {/* Category */}
                  <td style={TD}>
                    <span style={{ padding: '2px 7px', borderRadius: 2, fontSize: 11.5,
                                   background: WL.fieldBg, color: WL.textSec, fontWeight: 600 }}>
                      {(r.category || '').replace(/_/g, ' ')}
                    </span>
                  </td>

                  {/* Frequency */}
                  <td style={TD}>
                    {(r.frequency || '').replace(/_/g, ' ')}
                    {r.runTime && (
                      <div style={{ fontSize: 11.5, color: WL.textMuted, marginTop: 2 }}>
                        @ {r.runTime} UTC
                      </div>
                    )}
                  </td>

                  {/* Format */}
                  <td style={TD}>
                    <span style={{ padding: '2px 7px', borderRadius: 2, fontSize: 11.5,
                                   background: '#EFF6FF', color: '#2563EB', fontWeight: 700,
                                   fontFamily: 'monospace' }}>
                      {r.outputFormat}
                    </span>
                  </td>

                  {/* Last run */}
                  <td style={{ ...TD, fontSize: 12, color: WL.textMuted }}>
                    {r.lastRunAt ? new Date(r.lastRunAt).toLocaleString() : '—'}
                  </td>

                  {/* Next run */}
                  <td style={{ ...TD, fontSize: 12, color: WL.textMuted }}>
                    {r.nextRunAt ? new Date(r.nextRunAt).toLocaleString() : '—'}
                  </td>

                  {/* Status badge */}
                  <td style={TD}>
                    <WLBadge status={r.active ? 'Active' : 'Paused'} />
                  </td>

                  {/* Action buttons */}
                  <td style={{ ...TD, whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>

                      {/* Run Now */}
                      <Btn
                        onClick={() => handleRun(r.id, r.reportName)}
                        loading={runningId === r.id}
                        variant="primary"
                        disabled={!r.active}>
                        ▶ Run
                      </Btn>

                      {/* Edit */}
                      <Btn onClick={() => onEditSchedule && onEditSchedule(r.id)}>
                        ✎ Edit
                      </Btn>

                      {/* Pause / Resume */}
                      <Btn
                        onClick={() => handleToggle(r)}
                        loading={togglingId === r.id}
                        variant={r.active ? 'warning' : 'default'}>
                        {r.active ? '⏸' : '▶'} {r.active ? 'Pause' : 'Resume'}
                      </Btn>

                      {/* Delete */}
                      <Btn
                        onClick={() => setConfirmDel({ id: r.id, name: r.reportName })}
                        variant="danger"
                        loading={deletingId === r.id}>
                        🗑
                      </Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </WLPanel>
    </div>
  );
}
