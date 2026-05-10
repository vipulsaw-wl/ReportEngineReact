import React, { useState, useEffect } from 'react';
import { WL, WF } from '../theme-wl';
import { WL_LOGO_B64, APP_NAME, COPYRIGHT, APP_VERSION } from '../wl-brand';
import { WLPanel, WLBadge, WLAlert } from '../components/WLLayout';
import { historyApi, platformApi } from '../api';

const STATUS_OPTS = ['','SUCCESS','FAILED','RUNNING','QUEUED'];

export default function HistoryPageWL() {
  const [platforms,  setPlatforms]  = useState([]);
  const [platformId, setPlatformId] = useState('');
  const [status,     setStatus]     = useState('');
  const [history,    setHistory]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [err,        setErr]        = useState('');

  useEffect(() => {
    platformApi.list(0,100,'ACTIVE').then(d=>{
      const list = d.content||[];
      setPlatforms(list);
      if (list.length>0) setPlatformId(list[0].id);
    }).catch(()=>{});
  },[]);

  useEffect(() => {
    if (!platformId) return;
    setLoading(true);
    historyApi.list(platformId, status||null, 0, 50)
      .then(d => setHistory(d.content||d||[]))
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [platformId, status]);

  const statusColor = s => ({
    SUCCESS:'#00A651', FAILED:'#D0021B', RUNNING: WL.teal,
    QUEUED: WL.amber, PENDING: WL.amber,
  }[s] || WL.textMuted);

  const TH = { padding:'8px 14px', textAlign:'left', fontSize:11.5, fontWeight:700,
               color:WL.textMuted, textTransform:'uppercase', letterSpacing:'0.06em',
               background:WL.contentBg, borderBottom:'2px solid '+WL.border,
               fontFamily:WF.sans, whiteSpace:'nowrap' };
  const TD = { padding:'9px 14px', fontSize:13, fontFamily:WF.sans,
               borderBottom:'1px solid '+WL.borderLight, verticalAlign:'middle' };

  return (
    <div style={{ padding:'20px 24px', fontFamily:WF.sans }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h1 style={{ margin:0, fontSize:20, fontWeight:700, color:WL.textPrimary }}>Run History</h1>
          <p style={{ margin:'3px 0 0', fontSize:13, color:WL.textSec }}>All report execution records</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <select value={status} onChange={e=>setStatus(e.target.value)}
            style={{ padding:'7px 12px', borderRadius:3, border:'1px solid '+WL.border,
                     fontSize:13, fontFamily:WF.sans, color:WL.textPrimary,
                     background:WL.white, outline:'none' }}>
            {STATUS_OPTS.map(s=><option key={s} value={s}>{s||'All Statuses'}</option>)}
          </select>
          <select value={platformId} onChange={e=>setPlatformId(e.target.value)}
            style={{ padding:'7px 12px', borderRadius:3, border:'1px solid '+WL.border,
                     fontSize:13, fontFamily:WF.sans, color:WL.textPrimary,
                     background:WL.white, outline:'none' }}>
            {platforms.map(p=><option key={p.id} value={p.id}>{p.platformName}</option>)}
          </select>
        </div>
      </div>

      {err && <WLAlert type="error" message={err} onClose={()=>setErr('')} />}

      <WLPanel>
        {loading ? (
          <div style={{ padding:'40px', textAlign:'center', color:WL.textMuted }}>Loading…</div>
        ) : history.length===0 ? (
          <div style={{ padding:'48px', textAlign:'center' }}>
            <div style={{ fontSize:36, marginBottom:12 }}>📜</div>
            <div style={{ fontSize:15, fontWeight:700, color:WL.textSec }}>No run history yet</div>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Report Name','Status','Started','Duration','Format','Output','Actions']
                  .map(h=><th key={h} style={TH}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {history.map((h,i)=>(
                <tr key={h.id}
                  onMouseEnter={e=>e.currentTarget.style.background='#F8FAFC'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{ ...TD, fontWeight:600, color:WL.textPrimary }}>
                    {h.reportName}
                  </td>
                  <td style={TD}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:5,
                                   padding:'3px 9px', borderRadius:3, fontSize:12,
                                   fontWeight:700, fontFamily:WF.sans,
                                   background: h.status==='SUCCESS' ? WL.greenL
                                             : h.status==='FAILED'  ? WL.redL
                                             : WL.amberL,
                                   color: statusColor(h.status) }}>
                      {h.status==='SUCCESS'?'✓':h.status==='FAILED'?'✗':'⏳'} {h.status}
                    </span>
                  </td>
                  <td style={{ ...TD, fontFamily:'DM Mono,monospace', fontSize:12, color:WL.textSec }}>
                    {h.startedAt ? new Date(h.startedAt).toLocaleString() : '—'}
                  </td>
                  <td style={{ ...TD, fontFamily:'DM Mono,monospace', fontSize:12, color:WL.textSec }}>
                    {h.durationMs ? (h.durationMs/1000).toFixed(1)+'s' : '—'}
                  </td>
                  <td style={TD}>{h.outputFormat}</td>
                  <td style={{ ...TD, fontSize:12, color:WL.textSec, maxWidth:200,
                               overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
                      title={h.outputFilePath}>
                    {h.outputFilePath ? '📄 '+h.outputFilePath.split('/').pop() : '—'}
                  </td>
                  <td style={{ ...TD }}>
                    {h.status==='FAILED' && (
                      <button style={{ padding:'4px 10px', borderRadius:3, fontSize:12,
                                       border:'1px solid '+WL.border, background:WL.white,
                                       cursor:'pointer', color:WL.textSec, fontFamily:WF.sans }}>
                        ↺ Retry
                      </button>
                    )}
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
