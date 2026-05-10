import React, { useState, useEffect } from 'react';
import { C, font } from '../theme';
import { Badge, TopBar, PageWrap } from '../components/UI';
import { scheduleApi, platformApi } from '../api';

export default function ReportsPage() {
  const [reports,    setReports]    = useState([]);
  const [platforms,  setPlatforms]  = useState([]);
  const [platformId, setPlatformId] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [filter,     setFilter]     = useState('all');

  useEffect(() => {
    platformApi.list(0, 100, 'ACTIVE').then(d => {
      const list = d.content || [];
      setPlatforms(list);
      if (list.length > 0) setPlatformId(list[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => { if (platformId) load(); }, [platformId, filter]);

  const load = async () => {
    setLoading(true);
    try {
      const active = filter === 'active' ? true : filter === 'paused' ? false : null;
      const data = await scheduleApi.list(platformId, active, 0, 50);
      setReports(data.content || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handlePause  = async id => { try { await scheduleApi.pause(id);  load(); } catch(e) { alert(e.message); } };
  const handleResume = async id => { try { await scheduleApi.resume(id); load(); } catch(e) { alert(e.message); } };
  const handleDelete = async id => {
    if (!window.confirm('Delete this scheduled report?')) return;
    try { await scheduleApi.delete(id); load(); } catch(e) { alert(e.message); }
  };
  const handleRunNow = async id => {
    try { await scheduleApi.runNow(id); alert('Report queued for immediate execution.'); } catch(e) { alert(e.message); }
  };

  const active = reports.filter(r => r.active).length;
  const paused = reports.filter(r => !r.active).length;

  return (
    <>
      <TopBar title="Scheduled Reports" subtitle="Manage all configured report schedules" />
      <PageWrap>
        {/* Platform selector */}
        {platforms.length > 1 && (
          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: font.sans }}>Platform</span>
            <select value={platformId} onChange={e => setPlatformId(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 3, border: '1.5px solid ' + C.border, fontSize: 13, fontFamily: font.sans, color: C.navyD, background: C.white, outline: 'none' }}>
              {platforms.map(p => <option key={p.id} value={p.id}>{p.platformName}</option>)}
            </select>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
          {[['Total', reports.length, C.navy], ['Active', active, C.green], ['Paused', paused, C.amber]].map(([label, val, color]) => (
            <div key={label} style={{ background: C.white, border: '1px solid ' + C.border, borderLeft: '4px solid ' + color, borderRadius: 4, padding: '16px 20px', boxShadow: '0 1px 8px #1B3A5C08' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: C.muted, textTransform: 'uppercase', fontFamily: font.sans }}>{label}</div>
              <div style={{ fontSize: 30, fontWeight: 700, color: C.navyD, fontFamily: font.serif, marginTop: 4 }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {[['all','All'],['active','Active'],['paused','Paused']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} style={{ padding: '7px 16px', borderRadius: 2, fontSize: 12.5, fontWeight: 600, fontFamily: font.sans, cursor: 'pointer', background: filter === val ? C.navy : '#F8FAFC', color: filter === val ? C.white : C.slate, border: '1.5px solid ' + (filter === val ? C.navy : C.border) }}>{label}</button>
          ))}
        </div>

        <div style={{ background: C.white, border: '1px solid ' + C.border, borderRadius: 4, boxShadow: '0 1px 8px #1B3A5C08' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {['Report Name','Category','Frequency','Format','Next Run','Status','Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: C.muted, textTransform: 'uppercase', fontFamily: font.sans, borderBottom: '1px solid ' + C.border, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: C.muted, fontFamily: font.sans }}>Loading…</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: C.muted, fontFamily: font.sans }}>No scheduled reports. Create one via Schedule Report.</td></tr>
              ) : reports.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: '1px solid ' + C.border, background: i%2===0 ? C.white : '#FAFBFC' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: C.navyD, fontFamily: font.sans }}>{r.reportName}</div>
                    <div style={{ fontSize: 11.5, color: C.muted, fontFamily: font.sans, marginTop: 2 }}>{(r.recipients||[]).length} recipient{(r.recipients||[]).length !== 1 ? 's' : ''}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: C.slate, fontFamily: font.sans }}>{(r.category||'').replace(/_/g,' ')}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: C.slate, fontFamily: font.sans }}>{(r.frequency||'').replace(/_/g,' ')}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: C.slate, fontFamily: font.sans }}>{r.outputFormat}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: C.slateL, fontFamily: font.mono, whiteSpace: 'nowrap' }}>
                    {r.nextRunAt ? new Date(r.nextRunAt).toLocaleString('en-GB', { dateStyle:'short', timeStyle:'short' }) : r.frequency === 'ONE_TIME' ? (r.runDatetime ? new Date(r.runDatetime).toLocaleString('en-GB',{dateStyle:'short',timeStyle:'short'}) : '—') : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}><Badge color={r.active ? 'green' : 'amber'}>{r.active ? 'Active' : 'Paused'}</Badge></td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleRunNow(r.id)} title="Run Now" style={{ padding: '4px 9px', fontSize: 11.5, borderRadius: 2, cursor: 'pointer', fontFamily: font.sans, fontWeight: 600, background: C.blueL, color: C.blue, border: '1px solid ' + C.blueB }}>▶</button>
                      {r.active
                        ? <button onClick={() => handlePause(r.id)}  style={{ padding: '4px 9px', fontSize: 11.5, borderRadius: 2, cursor: 'pointer', fontFamily: font.sans, fontWeight: 600, background: C.amberL, color: C.amber, border: '1px solid #FDE68A' }}>Pause</button>
                        : <button onClick={() => handleResume(r.id)} style={{ padding: '4px 9px', fontSize: 11.5, borderRadius: 2, cursor: 'pointer', fontFamily: font.sans, fontWeight: 600, background: C.greenL, color: C.green, border: '1px solid ' + C.greenB }}>Resume</button>
                      }
                      <button onClick={() => handleDelete(r.id)} style={{ padding: '4px 9px', fontSize: 11.5, borderRadius: 2, cursor: 'pointer', fontFamily: font.sans, fontWeight: 600, background: C.redL, color: C.red, border: '1px solid ' + C.redB }}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageWrap>
    </>
  );
}
