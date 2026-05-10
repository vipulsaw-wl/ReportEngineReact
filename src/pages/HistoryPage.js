import React, { useState, useEffect, useCallback } from 'react';
import { C, font } from '../theme';
import { TopBar, PageWrap } from '../components/UI';
import { platformApi, historyApi } from '../api';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function StatusBadge({ status }) {
  const cfg = {
    SUCCESS:     { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0', label: 'Success'     },
    FAILED:      { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', label: 'Failed'      },
    RUNNING:     { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE', label: 'Running'     },
    QUEUED:      { bg: '#FEFCE8', color: '#CA8A04', border: '#FDE68A', label: 'Queued'      },
    RETRIGGERED: { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE', label: 'Retriggered' },
  }[status] || { bg: '#F5F7FA', color: '#6B7A8D', border: '#DDE3EC', label: status };
  return (
    <span style={{ padding: '3px 9px', borderRadius: 3, fontSize: 11.5, fontWeight: 700,
                   fontFamily: font.sans, background: cfg.bg, color: cfg.color,
                   border: `1px solid ${cfg.border}` }}>
      {cfg.label}
    </span>
  );
}

export default function HistoryPage() {
  const [platforms,   setPlatforms]   = useState([]);
  const [platformId,  setPlatformId]  = useState('');
  const [rows,        setRows]        = useState([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(0);
  const [statusFilter,setStatusFilter]= useState('');
  const [loading,     setLoading]     = useState(false);
  const [err,         setErr]         = useState('');
  const [toast,       setToast]       = useState('');
  const [expanded,    setExpanded]    = useState(null);
  const [confirmId,   setConfirmId]   = useState(null);
  const [retriggering,setRetriggering]= useState(null);

  const PAGE_SIZE = 20;

  useEffect(() => {
    platformApi.list(0, 100, 'ACTIVE').then(d => {
      const list = d.content || [];
      setPlatforms(list);
      if (list.length > 0) setPlatformId(list[0].id);
    }).catch(() => {});
  }, []);

  const load = useCallback(() => {
    if (!platformId) return;
    setLoading(true);
    historyApi.list(platformId, statusFilter || null, page, PAGE_SIZE)
      .then(d => {
        setRows(d.content || d || []);
        setTotal(d.totalElements ?? (d.content || d || []).length);
      })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [platformId, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleRetrigger = async (runId) => {
    setRetriggering(runId);
    try {
      await historyApi.retrigger(runId);
      showToast('▶ Report retriggered — new run queued.');
      setConfirmId(null);
      load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setRetriggering(null);
    }
  };

  const STATUS_OPTS = ['', 'SUCCESS', 'FAILED', 'RUNNING', 'QUEUED', 'RETRIGGERED'];
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const TH = {
    padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700,
    color: C.slateL, textTransform: 'uppercase', letterSpacing: '0.07em',
    background: C.bg, borderBottom: '2px solid ' + C.border, fontFamily: font.sans,
    whiteSpace: 'nowrap',
  };
  const TD = {
    padding: '10px 14px', fontSize: 13, fontFamily: font.sans,
    borderBottom: '1px solid ' + C.borderLight, color: C.slate, verticalAlign: 'middle',
  };

  return (
    <>
      <TopBar title="Run History" subtitle="All report executions across scheduled and bulk jobs" />
      <PageWrap>

        {/* Toast */}
        {toast && (
          <div style={{ position: 'fixed', top: 20, right: 24, zIndex: 2000,
                        padding: '12px 20px', background: '#0F2D1F', color: '#fff',
                        borderRadius: 4, fontSize: 13, fontFamily: font.sans,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}>
            {toast}
          </div>
        )}

        {/* Confirm retrigger modal */}
        {confirmId && (
          <div onClick={() => setConfirmId(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 1000,
                     background: 'rgba(0,0,0,0.4)', display: 'flex',
                     alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div onClick={e => e.stopPropagation()}
              style={{ background: C.white, borderRadius: 5, padding: 28,
                       maxWidth: 400, width: '100%',
                       boxShadow: '0 16px 48px rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.navyD,
                            fontFamily: font.sans, marginBottom: 10 }}>
                Re-run this report?
              </div>
              <div style={{ fontSize: 13, color: C.slateL, fontFamily: font.sans,
                            marginBottom: 20 }}>
                A new run will be queued immediately using the same schedule configuration.
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setConfirmId(null)}
                  style={{ padding: '7px 16px', borderRadius: 3, fontSize: 13,
                           fontFamily: font.sans, cursor: 'pointer',
                           border: '1px solid ' + C.border, background: C.white,
                           color: C.slateL }}>
                  Cancel
                </button>
                <button onClick={() => handleRetrigger(confirmId)}
                  disabled={retriggering === confirmId}
                  style={{ padding: '7px 16px', borderRadius: 3, fontSize: 13,
                           fontFamily: font.sans, fontWeight: 700, cursor: 'pointer',
                           border: 'none', background: C.navy, color: C.white,
                           opacity: retriggering === confirmId ? 0.6 : 1 }}>
                  {retriggering === confirmId ? '⏳ Queueing…' : '▶ Re-run'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16,
                      alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={platformId} onChange={e => { setPlatformId(e.target.value); setPage(0); }}
            style={{ padding: '8px 12px', borderRadius: 3, border: '1px solid ' + C.border,
                     fontSize: 13, fontFamily: font.sans, color: C.navyD,
                     background: C.white, outline: 'none' }}>
            {platforms.map(p => <option key={p.id} value={p.id}>{p.platformName}</option>)}
          </select>

          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
            style={{ padding: '8px 12px', borderRadius: 3, border: '1px solid ' + C.border,
                     fontSize: 13, fontFamily: font.sans, color: C.navyD,
                     background: C.white, outline: 'none' }}>
            <option value="">All statuses</option>
            {STATUS_OPTS.filter(Boolean).map(s => (
              <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
            ))}
          </select>

          <button onClick={() => { setPage(0); load(); }}
            style={{ padding: '8px 14px', borderRadius: 3, fontSize: 13,
                     fontFamily: font.sans, cursor: 'pointer',
                     border: '1px solid ' + C.border, background: C.white, color: C.slate }}>
            ↻ Refresh
          </button>

          <span style={{ marginLeft: 'auto', fontSize: 13, color: C.muted, fontFamily: font.sans }}>
            {loading ? 'Loading…' : `${total} run${total !== 1 ? 's' : ''}`}
          </span>
        </div>

        {err && (
          <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA',
                        borderRadius: 3, marginBottom: 14, fontSize: 13, color: '#DC2626',
                        fontFamily: font.sans }}>
            ⚠ {err}
            <button onClick={() => setErr('')}
              style={{ float: 'right', background: 'none', border: 'none',
                       cursor: 'pointer', color: '#DC2626', fontSize: 14 }}>✕</button>
          </div>
        )}

        {/* Table */}
        <div style={{ background: C.white, border: '1px solid ' + C.border,
                      borderRadius: 4, overflow: 'hidden',
                      boxShadow: '0 1px 8px #1B3A5C08' }}>
          {loading && rows.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: C.muted,
                          fontSize: 13, fontFamily: font.sans }}>
              Loading run history…
            </div>
          ) : rows.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.slateL, marginBottom: 6 }}>
                No runs found
              </div>
              <div style={{ fontSize: 13, color: C.muted }}>
                {statusFilter ? `No ${statusFilter.toLowerCase()} runs for this platform.` : 'No report runs yet.'}
              </div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Report Name', 'Format', 'Status', 'Duration', 'Started', 'Completed', 'Triggered By', ''].map(h => (
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <React.Fragment key={r.id}>
                    <tr
                      onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                      onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={e => e.currentTarget.style.background =
                        expanded === r.id ? '#F0F9F8' : 'transparent'}
                      style={{ cursor: 'pointer',
                               background: expanded === r.id ? '#F0F9F8' : 'transparent' }}>
                      <td style={{ ...TD, fontWeight: 600, color: C.navyD }}>
                        {r.reportName}
                      </td>
                      <td style={TD}>
                        <span style={{ padding: '2px 7px', borderRadius: 2, fontSize: 11.5,
                                       background: '#EFF6FF', color: '#2563EB',
                                       fontFamily: 'monospace', fontWeight: 700 }}>
                          {r.outputFormat || '—'}
                        </span>
                      </td>
                      <td style={TD}><StatusBadge status={r.status} /></td>
                      <td style={{ ...TD, fontFamily: 'monospace', fontSize: 12, color: C.muted }}>
                        {r.durationMs ? (r.durationMs / 1000).toFixed(1) + 's' : '—'}
                      </td>
                      <td style={{ ...TD, fontSize: 12, color: C.muted }}>
                        {fmtDate(r.startedAt)}
                      </td>
                      <td style={{ ...TD, fontSize: 12, color: C.muted }}>
                        {fmtDate(r.completedAt)}
                      </td>
                      <td style={{ ...TD, fontSize: 12 }}>
                        <span style={{ padding: '2px 8px', borderRadius: 2, fontSize: 11,
                                       background: C.bg, color: C.slateL,
                                       fontFamily: font.sans, fontWeight: 600 }}>
                          {r.triggeredBy || 'SCHEDULER'}
                        </span>
                      </td>
                      <td style={{ ...TD, whiteSpace: 'nowrap' }}
                        onClick={e => e.stopPropagation()}>
                        {r.status === 'FAILED' && r.scheduledReportId && (
                          <button onClick={() => setConfirmId(r.id)}
                            style={{ padding: '4px 10px', borderRadius: 3, fontSize: 12,
                                     border: '1px solid ' + C.border, background: C.white,
                                     cursor: 'pointer', color: C.slate,
                                     fontFamily: font.sans, fontWeight: 600 }}>
                            ▶ Re-run
                          </button>
                        )}
                        <span style={{ marginLeft: 6, fontSize: 12, color: C.muted }}>
                          {expanded === r.id ? '▲' : '▼'}
                        </span>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {expanded === r.id && (
                      <tr>
                        <td colSpan={8} style={{ padding: '0 14px 14px',
                                                  background: '#F0F9F8',
                                                  borderBottom: '1px solid ' + C.border }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
                                        paddingTop: 12 }}>
                            {r.outputFilePath && (
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted,
                                              textTransform: 'uppercase', marginBottom: 4,
                                              fontFamily: font.sans }}>Output File</div>
                                <code style={{ fontSize: 12, fontFamily: 'monospace', color: C.navyD,
                                               wordBreak: 'break-all' }}>{r.outputFilePath}</code>
                              </div>
                            )}
                            {r.errorMessage && (
                              <div style={{ gridColumn: r.outputFilePath ? 'auto' : '1/-1' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#DC2626',
                                              textTransform: 'uppercase', marginBottom: 4,
                                              fontFamily: font.sans }}>Error</div>
                                <div style={{ fontSize: 12.5, fontFamily: 'monospace',
                                              color: '#DC2626', background: '#FEF2F2',
                                              padding: '8px 12px', borderRadius: 3,
                                              border: '1px solid #FECACA',
                                              wordBreak: 'break-word' }}>
                                  {r.errorMessage}
                                </div>
                              </div>
                            )}
                            {r.sftpDelivered && r.sftpPath && (
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted,
                                              textTransform: 'uppercase', marginBottom: 4,
                                              fontFamily: font.sans }}>SFTP Delivered</div>
                                <code style={{ fontSize: 12, fontFamily: 'monospace',
                                               color: '#16A34A' }}>✓ {r.sftpPath}</code>
                              </div>
                            )}
                            {r.recipients && r.recipients.length > 0 && (
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted,
                                              textTransform: 'uppercase', marginBottom: 4,
                                              fontFamily: font.sans }}>Recipients</div>
                                <div style={{ fontSize: 12.5, fontFamily: font.sans, color: C.navyD }}>
                                  {r.recipients.join(', ')}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center',
                        marginTop: 16, alignItems: 'center' }}>
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              style={{ padding: '6px 14px', borderRadius: 3, fontSize: 13,
                       fontFamily: font.sans, cursor: page === 0 ? 'not-allowed' : 'pointer',
                       border: '1px solid ' + C.border, background: C.white,
                       color: page === 0 ? C.muted : C.navyD,
                       opacity: page === 0 ? 0.5 : 1 }}>
              ← Prev
            </button>
            <span style={{ fontSize: 13, color: C.slateL, fontFamily: font.sans }}>
              Page {page + 1} of {totalPages}
            </span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
              style={{ padding: '6px 14px', borderRadius: 3, fontSize: 13,
                       fontFamily: font.sans,
                       cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                       border: '1px solid ' + C.border, background: C.white,
                       color: page >= totalPages - 1 ? C.muted : C.navyD,
                       opacity: page >= totalPages - 1 ? 0.5 : 1 }}>
              Next →
            </button>
          </div>
        )}

        <div style={{ marginTop: 12, textAlign: 'center', fontSize: 12,
                      color: C.muted, fontFamily: font.sans }}>
          Click any row to expand details · Failed runs linked to a schedule can be re-run
        </div>
      </PageWrap>
    </>
  );
}
