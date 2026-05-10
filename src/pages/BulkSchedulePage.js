import React, { useState, useEffect, useRef } from 'react';
import { C, font, FREQS, FMTS, RTYPES } from '../theme';
import { platformApi, templateApi, schemaApi, bulkApi, sftpApi } from '../api';
import FileNamePatternBuilder from '../components/FileNamePatternBuilder';

const D = {
  bg0:'#F5F7FA', bg1:'#FFFFFF', bg2:'#F0F2F5',
  border:'#DDE3EC', text:'#1A2332', dim:'#4A5568', faint:'#8A97A8',
  blue:'#0066CC', green:'#00A651', red:'#D0021B', amber:'#F5A623', purple:'#7C3AED',
};
const F = { sans: font.sans, serif: font.serif, mono: font.mono };

function Label({ children }) {
  return (
    <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase',
                  color:C.slateL, fontFamily:F.sans, marginBottom:5 }}>
      {children}
    </div>
  );
}
function Inp({ value, onChange, placeholder, type='text', disabled }) {
  return (
    <input value={value} onChange={onChange} placeholder={placeholder} type={type}
      disabled={disabled}
      style={{ width:'100%', padding:'9px 12px', borderRadius:3, outline:'none',
               border:'1.5px solid '+C.border, fontSize:13, fontFamily:F.sans,
               color:C.navyD, background:disabled?'#f8fafc':C.white, boxSizing:'border-box' }} />
  );
}
function Sel({ value, onChange, children }) {
  return (
    <select value={value} onChange={onChange}
      style={{ width:'100%', padding:'9px 12px', borderRadius:3, outline:'none',
               border:'1.5px solid '+C.border, fontSize:13, fontFamily:F.sans,
               color:C.navyD, background:C.white }}>
      {children}
    </select>
  );
}
function Pills({ options, value, onChange }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)}
          style={{ padding:'5px 12px', borderRadius:2, fontSize:12.5, fontWeight:600,
                   fontFamily:F.sans, cursor:'pointer', transition:'all 0.12s',
                   background: value===o ? C.navy : '#F8FAFC',
                   color: value===o ? C.white : C.slate,
                   border:'1.5px solid '+(value===o ? C.navy : C.border) }}>
          {o.replace(/_/g,' ')}
        </button>
      ))}
    </div>
  );
}
function Section({ title, accent, children }) {
  return (
    <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:4,
                  marginBottom:20, boxShadow:'0 1px 8px #1B3A5C08', position:'relative', overflow:'hidden' }}>
      <div style={{ height:3, background:accent||C.navy, position:'absolute', top:0, left:0, right:0 }} />
      <div style={{ padding:'20px 24px 4px', borderBottom:'1px solid '+C.border }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.navyD, fontFamily:F.serif }}>{title}</div>
      </div>
      <div style={{ padding:'16px 24px 20px' }}>{children}</div>
    </div>
  );
}

// ── Live run progress bar ─────────────────────────────────────────────────────
function RunProgress({ status, onClose }) {
  if (!status) return null;
  const pct = status.total > 0 ? Math.round(((status.success + status.failed) / status.total) * 100) : 0;
  const done = status.queued === 0 && status.running === 0;
  return (
    <div style={{ position:'fixed', bottom:28, right:28, zIndex:1000, width:380,
                  background:D.bg2, border:'1px solid '+D.border, borderRadius:4,
                  boxShadow:'0 12px 40px #0008', overflow:'hidden' }}>
      <div style={{ height:3, background:done ? (status.failed>0?D.red:D.green) : D.blue,
                    width:pct+'%', transition:'width 0.4s' }} />
      <div style={{ padding:'14px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:13, fontWeight:700, color:'#1A2332', fontFamily:F.sans }}>
            {done ? (status.failed>0 ? 'Bulk run completed with errors' : 'Bulk run completed') : 'Running bulk reports…'}
          </span>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer',
                                              fontSize:16, color:D.faint, padding:0 }}>✕</button>
        </div>
        <div style={{ fontSize:12.5, color:D.dim, fontFamily:F.sans, marginBottom:10 }}>
          {status.scheduleName}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:10 }}>
          {[['Total',status.total,D.dim],['Queued',status.queued,D.amber],
            ['✓ Done',status.success,D.green],['✗ Failed',status.failed,D.red]].map(([l,v,c])=>(
            <div key={l} style={{ textAlign:'center' }}>
              <div style={{ fontSize:18, fontWeight:700, color:c, fontFamily:F.serif }}>{v}</div>
              <div style={{ fontSize:10, color:D.faint, fontFamily:F.sans, textTransform:'uppercase',
                            letterSpacing:'0.08em' }}>{l}</div>
            </div>
          ))}
        </div>
        {/* Per-entity list */}
        <div style={{ maxHeight:140, overflowY:'auto', display:'flex', flexDirection:'column', gap:3 }}>
          {(status.entities||[]).map((e,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'3px 0',
                                  borderBottom:'1px solid '+D.faint+'22' }}>
              <span style={{ fontSize:12, width:14,
                             color: e.status==='SUCCESS'?D.green:e.status==='FAILED'?D.red:e.status==='RUNNING'?D.blue:D.faint }}>
                {e.status==='SUCCESS'?'✓':e.status==='FAILED'?'✗':e.status==='RUNNING'?'⏳':'·'}
              </span>
              <span style={{ fontSize:11.5, fontFamily:F.mono, color:D.text, flex:1,
                             overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {e.entityId}
              </span>
              <span style={{ fontSize:10.5, color:D.faint, fontFamily:F.sans, flexShrink:0 }}>
                {e.durationMs ? e.durationMs+'ms' : ''}
              </span>
              {e.errorMessage && (
                <span style={{ fontSize:10, color:D.red, maxWidth:100, overflow:'hidden',
                               textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:F.mono }}
                      title={e.errorMessage}>
                  {e.errorMessage}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Bulk schedule list item ────────────────────────────────────────────────────
function ScheduleCard({ b, onRun, onPause, onResume, onDelete, onViewStatus, runStatus }) {
  const running = runStatus && (runStatus.running > 0 || runStatus.queued > 0);
  const done    = runStatus && runStatus.queued === 0 && runStatus.running === 0;
  return (
    <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:4,
                  padding:'16px 20px', boxShadow:'0 1px 8px #1B3A5C08',
                  borderLeft:'4px solid '+(b.active ? C.navy : C.border) }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <span style={{ fontSize:14.5, fontWeight:700, color:C.navyD, fontFamily:F.serif }}>
              {b.scheduleName}
            </span>
            <span style={{ fontSize:11, padding:'2px 7px', borderRadius:2, fontWeight:700,
                           fontFamily:F.sans, background: b.active ? '#ECFDF5' : '#F1F5F9',
                           color: b.active ? C.green : C.muted,
                           border:'1px solid '+(b.active ? C.greenB : C.border) }}>
              {b.active ? 'Active' : 'Paused'}
            </span>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'4px 16px', fontSize:12.5,
                        color:C.slateL, fontFamily:F.sans }}>
            <span>📋 {b.sourceTable} <span style={{ fontFamily:F.mono, color:C.navyL }}>({b.idColumn})</span></span>
            <span>👥 {b.entityCount} {b.entityCount === 1 ? 'entity' : 'entities'}</span>
            <span>🔄 {(b.frequency||'').replace(/_/g,' ')}</span>
            <span>📄 {b.outputFormat}</span>
          </div>
          {runStatus && (
            <div style={{ marginTop:8 }}>
              <div style={{ height:4, background:C.border, borderRadius:2, overflow:'hidden', width:200 }}>
                <div style={{ height:'100%', transition:'width 0.4s', borderRadius:2,
                              background: done&&runStatus.failed>0 ? '#B91C1C' : done ? C.green : C.navyL,
                              width: runStatus.total>0
                                ? Math.round(((runStatus.success+runStatus.failed)/runStatus.total)*100)+'%'
                                : '0%' }} />
              </div>
              <div style={{ fontSize:11.5, color:C.muted, fontFamily:F.sans, marginTop:3 }}>
                {running ? `Running… ${runStatus.success+runStatus.failed}/${runStatus.total}`
                         : `${runStatus.success} ✓ · ${runStatus.failed} ✗`}
              </div>
            </div>
          )}
        </div>
        <div style={{ display:'flex', gap:6, flexShrink:0, flexWrap:'wrap', justifyContent:'flex-end' }}>
          <button onClick={() => onRun(b.id)} disabled={running}
            style={{ padding:'6px 13px', fontSize:12.5, borderRadius:2, cursor:running?'not-allowed':'pointer',
                     fontFamily:F.sans, fontWeight:700,
                     background:running?'#F1F5F9':C.blueL, color:running?C.muted:C.blue,
                     border:'1px solid '+(running?C.border:C.blueB) }}>
            {running ? '⏳ Running…' : '▶ Run Now'}
          </button>
          {runStatus && (
            <button onClick={() => onViewStatus(b.id)}
              style={{ padding:'6px 13px', fontSize:12.5, borderRadius:2, cursor:'pointer',
                       fontFamily:F.sans, fontWeight:700, background:'#FFFBEB',
                       color:C.amber, border:'1px solid #FDE68A' }}>
              📊 Status
            </button>
          )}
          {b.active
            ? <button onClick={() => onPause(b.id)}
                style={{ padding:'6px 12px', fontSize:12.5, borderRadius:2, cursor:'pointer',
                         fontFamily:F.sans, fontWeight:700, background:'#FFFBEB',
                         color:C.amber, border:'1px solid #FDE68A' }}>Pause</button>
            : <button onClick={() => onResume(b.id)}
                style={{ padding:'6px 12px', fontSize:12.5, borderRadius:2, cursor:'pointer',
                         fontFamily:F.sans, fontWeight:700, background:'#ECFDF5',
                         color:C.green, border:'1px solid '+C.greenB }}>Resume</button>
          }
          <button onClick={() => { if(window.confirm('Delete this bulk schedule?')) onDelete(b.id); }}
            style={{ padding:'6px 12px', fontSize:12.5, borderRadius:2, cursor:'pointer',
                     fontFamily:F.sans, fontWeight:700, background:'#FEF2F2',
                     color:'#991B1B', border:'1px solid #FECACA' }}>✕</button>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_BASE_SQL = `SELECT
  rrn,
  to_char(txndate,'dd-MM-YYYY') as txndate,
  c.mask_customer_id as customerid,
  accountnumber,
  c.mask_card_number,
  t.txncurrencycode,
  amount,
  crdrflag,
  description,
  null as channel,
  merchantmcc as mcc,
  case txnstatus
    when 'U' then 'Unsettled'
    when 'S' then 'Settled'
    when 'M' then 'Mismatched'
    when 'PR' then 'Purged'
    when 'F' then 'Failed'
    when 'R' then 'Reversal'
    when 'V' then 'Void'
    else txnstatus
  end as txnstatus,
  respdescription as status,
  recondate as purgingdate
FROM transactiondetails t
LEFT JOIN cardmaster c ON t.ucrn = c.ucrn
WHERE 1=1
  AND inst_code = '{{ENTITY_ID}}'
  AND txndate::date BETWEEN CURRENT_DATE - INTERVAL '2 day' AND CURRENT_DATE
  AND txnstatus <> 'P'
ORDER BY txnid DESC`;

const DEFAULT_INST_QUERY = `SELECT inst_code,
       institution_name,
       product_name,
       card_type
FROM institutions
WHERE is_active = true
ORDER BY institution_name`;

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

// ── Bulk schedule stored procedure builder ───────────────────────────────────
function BulkProcedureBuilder({ value, onChange }) {
  const parseName = v => { const m = v.match(/(?:CALL|EXEC(?:UTE)?)\s+(\w+)/i); return m ? m[1] : ''; };
  const parseArgs = v => { const m = v.match(/\(([^)]*)\)/); return m ? m[1] : ''; };
  const [procName, setProcName] = React.useState(() => parseName(value));
  const [args,     setArgs]     = React.useState(() => parseArgs(value));
  const [useJdbc,  setUseJdbc]  = React.useState(() => value.trim().startsWith('{'));

  const rebuild = (name, argsStr, jdbc) => {
    // Support {{ENTITY_ID}} inside procedure args
    const call = `CALL ${name}(${argsStr})`;
    onChange(jdbc ? `{${call}}` : call);
  };

  return (
    <div style={{ background:'#F8FAFC', border:'1.5px solid '+D.border, borderRadius:3, padding:'14px 16px' }}>
      <div style={{ fontSize:12.5, color:D.dim, fontFamily:F.sans, marginBottom:10,
                    padding:'8px 12px', background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:3 }}>
        Use <code style={{ fontFamily:F.mono, background:'#DBEAFE', padding:'1px 5px',
                           borderRadius:2, color:D.blue, fontWeight:700 }}>{'{{ENTITY_ID}}'}</code> in
        procedure arguments — it gets replaced with each entity ID at run time.
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        <div>
          <Label>Procedure Name</Label>
          <Inp value={procName} placeholder="e.g. sp_generate_report"
            onChange={e => { setProcName(e.target.value); rebuild(e.target.value, args, useJdbc); }} />
        </div>
        <div>
          <Label>Arguments</Label>
          <Inp value={args} placeholder="'{{ENTITY_ID}}', 'MONTHLY', NULL"
            onChange={e => { setArgs(e.target.value); rebuild(procName, e.target.value, useJdbc); }} />
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10,
                    cursor:'pointer', userSelect:'none' }}
        onClick={() => { setUseJdbc(!useJdbc); rebuild(procName, args, !useJdbc); }}>
        <div style={{ width:30, height:18, borderRadius:9, transition:'background 0.2s',
                      background:useJdbc?D.blue:D.border, position:'relative' }}>
          <div style={{ position:'absolute', top:2, left:useJdbc?14:2, width:14, height:14,
                        borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
        </div>
        <span style={{ fontSize:12.5, fontWeight:600, fontFamily:F.sans, color:useJdbc?D.blue:D.faint }}>
          JDBC escape {'{CALL …}'} — for drivers that require it
        </span>
      </div>
      <div style={{ padding:'9px 12px', background:'#0F1B2D', borderRadius:3,
                    fontFamily:F.mono, fontSize:13, color:'#C8E6E4', wordBreak:'break-all',
                    marginBottom:8 }}>
        {value || <span style={{ color:'#4A6080' }}>Enter procedure name above…</span>}
      </div>
      {/* Syntax reference */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8 }}>
        {[['PostgreSQL',"CALL sp_report('{{ENTITY_ID}}')"],
          ['SQL Server',"EXEC sp_report @id='{{ENTITY_ID}}'"],
          ['Oracle',"BEGIN sp_report('{{ENTITY_ID}}'); END;"],
          ['JDBC',"{CALL sp_report('{{ENTITY_ID}}')}"]].map(([db,ex])=>(
          <div key={db} style={{ background:'#F0FDF4', border:'1px solid #BBF7D0',
                                 borderRadius:3, padding:'6px 10px' }}>
            <div style={{ fontSize:10, color:D.faint, fontFamily:F.sans, fontWeight:700,
                          textTransform:'uppercase', marginBottom:3 }}>{db}</div>
            <code style={{ fontSize:11, fontFamily:F.mono, color:'#166534',
                           wordBreak:'break-all' }}>{ex}</code>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BulkSchedulePage({ bulkContext }) {
  const [view,       setView]      = useState('list');   // 'list' | 'create'
  const [platforms,  setPlatforms] = useState([]);
  const [platformId, setPid]       = useState('');
  const [templates,  setTemplates] = useState([]);
  const [tables,     setTables]    = useState([]);
  const [columns,    setColumns]   = useState([]);
  const [schedules,  setSchedules] = useState([]);
  const [loading,    setLoading]   = useState(false);
  const [err,        setErr]       = useState('');
  const [runStatuses,setRunStatuses] = useState({});
  const [floatStatus,setFloatStatus] = useState(null);
  const pollRef = useRef(null);

  // Form state
  const [scheduleName, setScheduleName] = useState('');
  const [templateId,   setTemplateId]   = useState('');
  const [category,     setCategory]     = useState('CUSTOM');
  const [frequency,    setFrequency]    = useState('MONTHLY');
  const [runTime,      setRunTime]      = useState('07:00');
  const [runDate,      setRunDate]      = useState('');
  const [outputFormat, setOutputFormat] = useState('CSV');
  const [sourceTable,  setSourceTable]  = useState('');
  const [idColumn,     setIdColumn]     = useState('');
  const [idValues,     setIdValues]     = useState([]);  // array of selected IDs
  const [entityQueryMode, setEntityQueryMode] = useState(false); // false=table picker, true=SQL query
  const [entityQuery,     setEntityQuery]     = useState('');    // SQL to fetch entity IDs
  const [entityQryFocus,  setEntityQryFocus]  = useState(false);
  const [entityQryLoading,setEntityQryLoading]= useState(false);
  const [baseSql,      setBaseSql]      = useState('');
  const [sqlMode,      setSqlMode]      = useState('query');
  const [cron,         setCronExpr]     = useState(''); // 'query' | 'procedure'
  const [recipients,   setRecipients]   = useState('');
  const [notes,             setNotes]             = useState('');
  const [fileNamingPattern, setFileNamingPattern] = useState('{REPORT_NAME}_{ENTITY_ID}_{DATETIME}');
  const [localOutputPath,   setLocalOutputPath]   = useState('');
  const [sftpConfigId,      setSftpConfigId]      = useState('');
  const [sftpConfigs,       setSftpConfigs]       = useState([]);
  const [enableSftp,        setEnableSftp]        = useState(false);
  const [enableLocal,       setEnableLocal]       = useState(false);
  const [sqlFocus,       setSqlFocus]       = useState(false);
  const [colLoading,     setColLoading]     = useState(false);
  const [autoDiscover,   setAutoDiscover]   = useState(true);
  const [instQuery,      setInstQuery]      = useState('');
  const [jrxmlParamMap,  setJrxmlParamMap]  = useState(JSON.stringify({
    institutionName: 'institution_name',
    productName:     'product_name',
    cardType:        'card_type',
    ucrn:            'ucrn',
    reportPeriod:    'report_period',
  }, null, 2));
  const [instQueryFocus, setInstQueryFocus] = useState(false);
  const [instPreview,    setInstPreview]    = useState([]);
  const [instLoading,    setInstLoading]    = useState(false);

  // Load platforms
  useEffect(() => {
    platformApi.list(0,100,'ACTIVE').then(d => {
      const list = d.content||[];
      setPlatforms(list);
      if (list.length>0) setPid(list[0].id);
    }).catch(()=>{});
  }, []);

  // Load templates + schema + schedules when platform changes
  useEffect(() => {
    if (!platformId) return;
    templateApi.list(platformId).then(d => setTemplates(d.content||d||[])).catch(()=>{});
    schemaApi.listTables(platformId).then(d => setTables(Array.isArray(d)?d:[])).catch(()=>{});
    loadSchedules();
  }, [platformId]);

  // Load SFTP configs when platformId changes
  useEffect(() => {
    if (!platformId) return;
    sftpApi.list(platformId).then(r => setSftpConfigs(r.data||r||[])).catch(()=>{});
  }, [platformId]);

  // Load columns when sourceTable changes
  useEffect(() => {
    if (!platformId || !sourceTable) return;
    setColLoading(true);
    setColumns([]); setIdColumn('');
    schemaApi.listColumns(platformId, sourceTable).then(cols => {
      setColumns(cols||[]);
      // Auto-detect ID column
      const idCol = (cols||[]).find(c => /^id$|_id$|^merchant_id$|^bank_id$/i.test(c.columnName))
                 || (cols||[]).find(c => /id|key|code/i.test(c.columnName))
                 || (cols||[])[0];
      if (idCol) setIdColumn(idCol.columnName);
    }).catch(()=>{}).finally(()=>setColLoading(false));
  }, [platformId, sourceTable]);

  // Pre-fill from bulkContext (passed from MerchantBankPage)
  useEffect(() => {
    if (!bulkContext) return;
    const { platformId:ctxPid, sourceTable:st, idColumn:ic, idValues:iv, tableName } = bulkContext;
    if (ctxPid) setPid(ctxPid);
    if (tableName||st) setSourceTable(tableName||st);
    if (ic) setIdColumn(ic);
    if (iv && iv.length>0) setIdValues(iv);
    if (iv && iv.length>0) {
      const entityLabel = tableName||st||'entity';
      setScheduleName(`${entityLabel} — ${ic} report (${iv.length} records)`);
      // Generate default SQL with JOIN-friendly template
      const generatedSql =
        `SELECT t.*\nFROM ${tableName||st||'source_table'} t\n` +
        `-- Add JOINs below as needed:\n` +
        `-- JOIN transactions tx ON tx.${ic} = t.${ic}\n` +
        `-- JOIN accounts a ON a.id = tx.account_id\n` +
        `WHERE t.${ic} = '{{ENTITY_ID}}'`;
      setBaseSql(generatedSql);
    }
    setView('create');
  }, [bulkContext]);

  const loadSchedules = async () => {
    if (!platformId) return;
    try {
      const data = await bulkApi.list(platformId);
      setSchedules(data.content||[]);
    } catch(e) { /* non-fatal */ }
  };

  // Poll run status every 2s while any job is running
  const startPolling = (id) => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const status = await bulkApi.runStatus(id);
        if (status) {
          setRunStatuses(prev => ({ ...prev, [id]: status }));
          setFloatStatus(status);
          if (status.queued === 0 && status.running === 0) {
            clearInterval(pollRef.current);
          }
        }
      } catch(e) { clearInterval(pollRef.current); }
    }, 2000);
  };

  useEffect(() => () => clearInterval(pollRef.current), []);

  const handleRun = async (id) => {
    try {
      const status = await bulkApi.runNow(id);
      setRunStatuses(prev => ({ ...prev, [id]: status }));
      setFloatStatus(status);
      startPolling(id);
    } catch(e) { alert(e.message); }
  };

  const handleDelete = async (id) => {
    try { await bulkApi.delete(id); loadSchedules(); } catch(e) { alert(e.message); }
  };
  const handlePause  = async (id) => {
    try { await bulkApi.pause(id);  loadSchedules(); } catch(e) { alert(e.message); }
  };
  const handleResume = async (id) => {
    try { await bulkApi.resume(id); loadSchedules(); } catch(e) { alert(e.message); }
  };

  const resetForm = () => {
    setScheduleName(''); setTemplateId(''); setCategory('CUSTOM');
    setFrequency('MONTHLY'); setRunTime('07:00'); setRunDate('');
    setOutputFormat('CSV'); setSourceTable(''); setIdColumn('');
    setIdValues([]); setBaseSql(''); setRecipients(''); setNotes('');
    setFileNamingPattern('{REPORT_NAME}_{ENTITY_ID}_{DATETIME}'); setLocalOutputPath('');
    setSftpConfigId(''); setEnableSftp(false); setEnableLocal(false);
    setAutoDiscover(true); setInstQuery(''); setJrxmlParamMap('{}'); setInstPreview([]);
    setEntityQueryMode(false); setEntityQuery('');
    setErr('');
  };

  const handleSubmit = async () => {
    if (!scheduleName.trim()) return setErr('Schedule name is required.');
    if (!autoDiscover && !idColumn.trim()) return setErr('ID column is required.');
    if (autoDiscover && !instQuery.trim()) return setErr('Institution query is required when auto-discover is enabled.');
    if (!autoDiscover && idValues.length===0) return setErr('Select at least one entity ID.');
    if (!baseSql.includes('{{ENTITY_ID}}')) return setErr('SQL must contain {{ENTITY_ID}} placeholder.');
    const rcpts = recipients.split(',').map(e=>e.trim()).filter(Boolean);
    if (rcpts.some(e=>!e.includes('@'))) return setErr('One or more email addresses are invalid.');
    setErr(''); setLoading(true);
    try {
      await bulkApi.create({
        platformId, templateId: templateId||null,
        scheduleName, category, frequency,
        runTime: frequency!=='ONE_TIME'&&frequency!=='CUSTOM_CRON' ? runTime : undefined,
        runDatetime: frequency==='ONE_TIME' ? new Date(runDate).toISOString() : undefined,
        outputFormat, sourceTable, idColumn,
        idValues: autoDiscover ? undefined : (entityQueryMode ? [] : idValues),
        baseSql,
        recipients: rcpts, notes: notes||undefined,
        fileNamingPattern: fileNamingPattern||undefined,
        localOutputPath: enableLocal ? (localOutputPath||undefined) : undefined,
        sftpConfigId: enableSftp ? (sftpConfigId||undefined) : undefined,
        autoDiscover,
        institutionQuery: instQuery||undefined,
        jrxmlParamMap: jrxmlParamMap||undefined,
      });
      resetForm(); setView('list'); loadSchedules();
    } catch(e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  const lineCount = (baseSql||'\n').split('\n').length;
  const platform  = platforms.find(p=>p.id===platformId);

  // ── Render: List ────────────────────────────────────────────────────────────
  if (view==='list') return (
    <>
      <RunProgress status={floatStatus} onClose={() => setFloatStatus(null)} />
      <div style={{ padding:'20px 32px', background:C.white, borderBottom:'1px solid '+C.border,
                    display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ margin:0, fontSize:20, fontWeight:700, color:C.navyD, fontFamily:F.serif }}>
            Bulk Report Schedules
          </h1>
          <p style={{ margin:'3px 0 0', fontSize:13, color:C.slateL, fontFamily:F.sans }}>
            One schedule → one report per merchant / bank — runs in parallel
          </p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {platforms.length>1 && (
            <select value={platformId} onChange={e=>setPid(e.target.value)}
              style={{ padding:'8px 12px', borderRadius:3, border:'1.5px solid '+C.border,
                       fontSize:13, fontFamily:F.sans, color:C.navyD, background:C.white, outline:'none' }}>
              {platforms.map(p=><option key={p.id} value={p.id}>{p.platformName}</option>)}
            </select>
          )}
          <button onClick={() => { resetForm(); setView('create'); }}
            style={{ padding:'9px 20px', borderRadius:3, background:C.navy, color:C.white,
                     border:'none', cursor:'pointer', fontSize:13.5, fontFamily:F.sans, fontWeight:700 }}>
            + New Bulk Schedule
          </button>
        </div>
      </div>

      <div style={{ padding:'24px 32px', flex:1, overflowY:'auto', background:C.bg }}>
        {schedules.length===0 ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:C.muted, fontFamily:F.sans }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📦</div>
            <div style={{ fontSize:16, fontWeight:700, color:C.slate, marginBottom:8 }}>No bulk schedules yet</div>
            <div style={{ fontSize:13.5 }}>Create one to generate reports for all your merchants or banks in one go.</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {schedules.map(b => (
              <ScheduleCard key={b.id} b={b}
                onRun={handleRun} onPause={handlePause}
                onResume={handleResume} onDelete={handleDelete}
                onViewStatus={id => setFloatStatus(runStatuses[id]||null)}
                runStatus={runStatuses[b.id]||null} />
            ))}
          </div>
        )}
      </div>
    </>
  );

  // ── Render: Create form ─────────────────────────────────────────────────────
  return (
    <>
      <div style={{ padding:'18px 32px', background:C.white, borderBottom:'1px solid '+C.border,
                    display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ margin:0, fontSize:20, fontWeight:700, color:C.navyD, fontFamily:F.serif }}>
            New Bulk Schedule
          </h1>
          <p style={{ margin:'3px 0 0', fontSize:13, color:C.slateL, fontFamily:F.sans }}>
            One job generates one report per selected entity ({idValues.length} selected)
          </p>
        </div>
        <button onClick={() => { resetForm(); setView('list'); }}
          style={{ padding:'8px 18px', borderRadius:3, border:'1.5px solid '+C.border,
                   background:C.white, color:C.slate, cursor:'pointer',
                   fontSize:13, fontFamily:F.sans }}>← Back</button>
      </div>

      <div style={{ flex:1, overflowY:'auto', background:C.bg, padding:'24px 32px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20, maxWidth:1200 }}>
          <div>
            {/* Platform + Template */}
            <Section title="Platform & Template" accent="linear-gradient(90deg,#1B3A5C,#2E6DA4)">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <Label>Platform</Label>
                  <Sel value={platformId} onChange={e=>setPid(e.target.value)}>
                    {platforms.map(p=><option key={p.id} value={p.id}>{p.platformName}</option>)}
                  </Sel>
                </div>
                <div>
                  <Label>Template <span style={{fontWeight:400,color:C.slateL}}>(optional)</span></Label>
                  <Sel value={templateId} onChange={e=>setTemplateId(e.target.value)}>
                    <option value="">📊 Default — Excel / CSV  (no template)</option>
                    {templates.map(t=><option key={t.id} value={t.id}>{t.originalName||t.templateName}</option>)}
                  </Sel>
                </div>
              </div>
              <div style={{ marginTop:14 }}>
                <Label>Schedule Name</Label>
                <Inp value={scheduleName} onChange={e=>setScheduleName(e.target.value)}
                  placeholder="e.g. Monthly Merchant Statements — All Active" />
              </div>
              <div style={{ marginTop:14 }}>
                <Label>Report Category</Label>
                <Pills options={RTYPES} value={category} onChange={setCategory} />
              </div>
            </Section>

            {/* Source Table & Entity Selection */}
            <Section title="Source Table & Entity Selection" accent="linear-gradient(90deg,#059669,#2E6DA4)">

              {/* Mode toggle: Table picker vs SQL Query */}
              <div style={{ display:'flex', gap:0, marginBottom:16, borderRadius:3,
                            border:'1.5px solid '+C.border, overflow:'hidden', width:'fit-content' }}>
                {[
                  [false, '📋 Table Picker', 'Select table + column from schema'],
                  [true,  '⚡ SQL Query',   'Write SQL to fetch entity IDs'],
                ].map(([mode, label, hint]) => (
                  <button key={String(mode)} onClick={()=>setEntityQueryMode(mode)}
                    title={hint}
                    style={{ padding:'8px 18px', border:'none', cursor:'pointer',
                             fontSize:13, fontFamily:F.sans, fontWeight:700,
                             background: entityQueryMode===mode ? C.navy : C.white,
                             color: entityQueryMode===mode ? C.white : C.slate,
                             transition:'all 0.15s' }}>
                    {label}
                  </button>
                ))}
              </div>

              {!entityQueryMode ? (
                /* ── TABLE PICKER MODE ─────────────────────────────────── */
                <>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                    <div>
                      <Label>Source Table</Label>
                      <Sel value={sourceTable} onChange={e=>setSourceTable(e.target.value)}>
                        <option value="">— Choose table —</option>
                        {tables.map(t=><option key={t.tableName} value={t.tableName}>{t.tableName}</option>)}
                      </Sel>
                    </div>
                    <div>
                      <Label>ID Column {colLoading ? '(loading…)' : ''}</Label>
                      <Sel value={idColumn} onChange={e=>setIdColumn(e.target.value)} disabled={!columns.length}>
                        <option value="">— Choose column —</option>
                        {columns.map(c=><option key={c.columnName} value={c.columnName}>{c.columnName} ({c.dataType})</option>)}
                      </Sel>
                    </div>
                  </div>

                  {/* Entity ID chips */}
                  <Label>
                    Selected Entity IDs ({idValues.length} selected)
                    {idValues.length > 0 && (
                      <button onClick={()=>setIdValues([])}
                        style={{ marginLeft:10, fontSize:11, color:C.red, background:'none', border:'none',
                                 cursor:'pointer', fontFamily:F.sans, textDecoration:'underline' }}>
                        Clear all
                      </button>
                    )}
                  </Label>
                  {idValues.length > 0 ? (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10,
                                  padding:'10px', background:'#F0F9FF',
                                  border:'1.5px solid '+C.blueB, borderRadius:3,
                                  maxHeight:120, overflowY:'auto' }}>
                      {idValues.map((v,i) => (
                        <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:4,
                                               padding:'3px 9px', borderRadius:10, fontSize:12.5,
                                               background:C.blueL, color:C.blue,
                                               border:'1px solid '+C.blueB, fontFamily:F.mono }}>
                          {v}
                          <button onClick={()=>setIdValues(iv=>iv.filter((_,j)=>j!==i))}
                            style={{ background:'none', border:'none', cursor:'pointer',
                                     color:C.muted, fontSize:13, padding:0, lineHeight:1 }}>×</button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding:'14px', background:'#FFFBEB', border:'1px solid #FDE68A',
                                  borderRadius:3, fontSize:13, color:'#92400E', fontFamily:F.sans, marginBottom:10 }}>
                      ⚠ No entity IDs selected. Go to <strong>Merchants &amp; Banks</strong> page, select rows,
                      then click <strong>Schedule Report for N Records</strong>.
                    </div>
                  )}

                  {/* Add IDs manually */}
                  <Label>Add IDs manually (comma-separated)</Label>
                  <div style={{ display:'flex', gap:8 }}>
                    <input id="manualIds" placeholder="00023, 00045, 00067"
                      style={{ flex:1, padding:'9px 12px', borderRadius:3, outline:'none',
                               border:'1.5px solid '+C.border, fontSize:13, fontFamily:F.mono, color:C.navyD }}
                      onKeyDown={e => {
                        if (e.key==='Enter') {
                          const vals = e.target.value.split(',').map(v=>v.trim()).filter(Boolean);
                          setIdValues(prev => [...new Set([...prev,...vals])]);
                          e.target.value='';
                        }
                      }} />
                    <button onClick={() => {
                      const el = document.getElementById('manualIds');
                      const vals = el.value.split(',').map(v=>v.trim()).filter(Boolean);
                      setIdValues(prev => [...new Set([...prev,...vals])]);
                      el.value='';
                    }} style={{ padding:'9px 16px', borderRadius:3, background:C.navy, color:C.white,
                               border:'none', cursor:'pointer', fontSize:13, fontFamily:F.sans,
                               fontWeight:700, whiteSpace:'nowrap' }}>
                      + Add
                    </button>
                  </div>
                  <div style={{ fontSize:11.5, color:C.muted, fontFamily:F.sans, marginTop:4 }}>
                    Press Enter or click Add. Duplicates are ignored.
                  </div>
                </>
              ) : (
                /* ── SQL QUERY MODE ────────────────────────────────────── */
                <>
                  <div style={{ fontSize:13, color:C.slateL, fontFamily:F.sans, marginBottom:10,
                                padding:'10px 14px', background:'#EFF6FF',
                                border:'1px solid '+C.blueB, borderRadius:3 }}>
                    Write a SQL query whose <strong>first column</strong> is the entity ID
                    (e.g. <code style={{ fontFamily:F.mono, background:'#DBEAFE',
                    padding:'1px 6px', borderRadius:2 }}>inst_code</code>).
                    Click <strong>Run Query</strong> to extract entity IDs and preview results.
                    Supports any JOINs or WHERE conditions.
                  </div>

                  {/* ID Column field */}
                  <div style={{ marginBottom:12 }}>
                    <Label>ID Column Name</Label>
                    <Inp value={idColumn} onChange={e=>setIdColumn(e.target.value)}
                      placeholder="Column name returned as entity ID (e.g. inst_code)" />
                    <div style={{ fontSize:11.5, color:C.muted, fontFamily:F.sans, marginTop:4 }}>
                      Must match the first (or aliased) column in your query below.
                    </div>
                  </div>

                  {/* SQL editor */}
                  <Label>Entity Selection Query</Label>
                  <div style={{ position:'relative', border:'1.5px solid '+(entityQryFocus?C.navyL:C.border),
                                borderRadius:3, background:'#1E2A3A', overflow:'hidden',
                                transition:'border 0.18s', marginBottom:10 }}>
                    <textarea
                      value={entityQuery}
                      onChange={e=>setEntityQuery(e.target.value)}
                      onFocus={()=>setEntityQryFocus(true)}
                      onBlur={()=>setEntityQryFocus(false)}
                      rows={6} spellCheck={false}
                      placeholder={'SELECT inst_code, institution_name, product_name FROM institutions WHERE is_active = true ORDER BY institution_name'}
                      style={{ display:'block', width:'100%', padding:'10px 12px',
                               background:'transparent', color:'#C8E6E4', border:'none',
                               outline:'none', resize:'vertical', fontFamily:F.mono,
                               fontSize:13, lineHeight:'21px', boxSizing:'border-box',
                               minHeight:130, caretColor:'#00A99D' }}
                    />
                  </div>

                  {/* Run Query button + results */}
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                    <button
                      disabled={!platformId || !entityQuery.trim() || !idColumn.trim() || entityQryLoading}
                      onClick={async () => {
                        setEntityQryLoading(true);
                        setErr('');
                        try {
                          const { queryApi } = await import('../api');
                          const res = await queryApi.execute(platformId, entityQuery, 500);
                          if (!res.ok && res.errorMessage) {
                            setErr('Query error: ' + res.errorMessage);
                            return;
                          }
                          const rows = res.rows || [];
                          // Extract IDs from the idColumn
                          const ids = rows
                            .map(r => {
                              const val = r[idColumn] ?? Object.values(r)[0];
                              return val != null ? String(val).trim() : null;
                            })
                            .filter(Boolean);
                          setIdValues([...new Set(ids)]);
                          // Also set sourceTable from query if detectable
                          const match = entityQuery.match(/FROM\s+(\w+)/i);
                          if (match) setSourceTable(match[1]);
                        } catch(e) {
                          setErr('Query failed: ' + e.message);
                        } finally {
                          setEntityQryLoading(false);
                        }
                      }}
                      style={{ padding:'8px 20px', borderRadius:3, fontSize:13,
                               fontFamily:F.sans, fontWeight:700, cursor:'pointer',
                               background: entityQryLoading||!platformId||!entityQuery.trim()||!idColumn.trim()
                                 ? C.border : C.navy,
                               color: entityQryLoading||!platformId||!entityQuery.trim()||!idColumn.trim()
                                 ? C.muted : C.white,
                               border:'none' }}>
                      {entityQryLoading ? '⏳ Running…' : '▶ Run Query & Extract IDs'}
                    </button>

                    {idValues.length > 0 && (
                      <>
                        <span style={{ fontSize:13, color:C.green, fontFamily:F.sans, fontWeight:700 }}>
                          ✓ {idValues.length} entity ID{idValues.length !== 1 ? 's' : ''} extracted
                        </span>
                        <button onClick={()=>setIdValues([])}
                          style={{ fontSize:12, color:C.red, background:'none', border:'none',
                                   cursor:'pointer', fontFamily:F.sans, textDecoration:'underline',
                                   padding:0 }}>
                          Clear
                        </button>
                      </>
                    )}
                  </div>

                  {/* Extracted ID chips */}
                  {idValues.length > 0 && (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6, padding:'10px',
                                  background:'#F0F9FF', border:'1.5px solid '+C.blueB,
                                  borderRadius:3, maxHeight:110, overflowY:'auto', marginBottom:4 }}>
                      {idValues.map((v,i) => (
                        <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:4,
                                               padding:'3px 9px', borderRadius:10, fontSize:12.5,
                                               background:C.blueL, color:C.blue,
                                               border:'1px solid '+C.blueB, fontFamily:F.mono }}>
                          {v}
                          <button onClick={()=>setIdValues(iv=>iv.filter((_,j)=>j!==i))}
                            style={{ background:'none', border:'none', cursor:'pointer',
                                     color:C.muted, fontSize:13, padding:0, lineHeight:1 }}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize:11.5, color:C.muted, fontFamily:F.sans }}>
                    IDs are extracted from the <code style={{ fontFamily:F.mono }}>
                    {idColumn||'id_column'}</code> column.
                    You can remove individual IDs by clicking ×.
                  </div>
                </>
              )}
            </Section>

            {/* Institution Discovery */}
            <Section title="Institution Auto-Discovery" accent="linear-gradient(90deg,#059669,#00A99D)">
              {/* Auto-discover toggle */}
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16,
                            padding:'10px 14px', background:'#F0FDF4',
                            border:'1px solid #B2EFC5', borderRadius:3 }}>
                <div onClick={()=>setAutoDiscover(a=>!a)}
                  style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', userSelect:'none' }}>
                  <div style={{ width:38, height:20, borderRadius:10,
                                background:autoDiscover?C.green:'#CBD5E1', position:'relative',
                                transition:'background 0.2s', flexShrink:0 }}>
                    <div style={{ position:'absolute', top:2, left:autoDiscover?20:2, width:16, height:16,
                                  borderRadius:'50%', background:'#fff', transition:'left 0.2s',
                                  boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                  <span style={{ fontSize:13.5, fontWeight:700, color:C.navyD, fontFamily:F.sans }}>
                    Auto-discover all institutions at run time
                  </span>
                </div>
                <span style={{ fontSize:12.5, color:C.slateL, fontFamily:F.sans }}>
                  {autoDiscover
                    ? 'Run the Institution Query below — one report per institution found'
                    : 'Use the manually selected IDs above'}
                </span>
              </div>

              {autoDiscover && (<>
                {/* Institution SQL */}
                <div style={{ marginBottom:14 }}>
                  <Label>Institution Query</Label>
                  <div style={{ fontSize:12.5, color:C.slateL, fontFamily:F.sans,
                                marginBottom:8, padding:'8px 12px', background:'#EFF6FF',
                                border:'1px solid '+C.blueB, borderRadius:3 }}>
                    Query to fetch ALL institutions from the source database.
                    Must return the <code style={{ fontFamily:F.mono, background:'#DBEAFE',
                    padding:'1px 5px', borderRadius:2 }}>inst_code</code> column
                    plus any columns needed as JRXML parameters.
                  </div>
                  <div style={{ position:'relative', border:'1.5px solid '+(instQueryFocus?C.navyL:C.border),
                                borderRadius:3, background:'#1E2A3A', transition:'border 0.18s' }}>
                    <textarea value={instQuery}
                      onChange={e=>setInstQuery(e.target.value)}
                      onFocus={()=>setInstQueryFocus(true)}
                      onBlur={()=>setInstQueryFocus(false)}
                      rows={5} spellCheck={false}
                      placeholder={"SELECT inst_code, institution_name, product_name\n" +
                                   "FROM institutions\n" +
                                   "WHERE is_active = true\n" +
                                   "ORDER BY institution_name"}
                      style={{ display:'block', width:'100%', padding:'10px 12px',
                               background:'transparent', color:'#C8E6E4', border:'none',
                               outline:'none', resize:'vertical', fontFamily:F.mono,
                               fontSize:13, lineHeight:'21px', boxSizing:'border-box',
                               minHeight:110, caretColor:'#00A99D' }} />
                  </div>
                  <div style={{ marginTop:6, display:'flex', gap:8 }}>
                    <button onClick={async()=>{
                      if (!platformId||!instQuery.trim()) return;
                      setInstLoading(true);
                      try {
                        const { schemaApi: sa } = await import('../api');
                        // Use queryApi to preview
                        const { queryApi } = await import('../api');
                        const res = await queryApi.execute(platformId, instQuery, 20);
                        const rows = res.rows||[];
                        setInstPreview(rows);
                        // Auto-set idColumn to first column of institution query if not already set
                        if (rows.length > 0 && !idColumn.trim()) {
                          const firstCol = Object.keys(rows[0])[0];
                          setIdColumn(firstCol);
                        }
                      } catch(e){ setErr('Preview failed: '+e.message); }
                      finally{ setInstLoading(false); }
                    }} disabled={!platformId||!instQuery.trim()||instLoading}
                      style={{ padding:'6px 14px', borderRadius:3, fontSize:12.5,
                               fontFamily:F.sans, fontWeight:700, cursor:'pointer',
                               background:C.blueL, color:C.blue, border:'1px solid '+C.blueB }}>
                      {instLoading ? '⏳ Running…' : '▶ Preview Institutions'}
                    </button>
                    {instPreview.length>0 && (
                      <span style={{ fontSize:12.5, color:C.green, fontFamily:F.sans,
                                     alignSelf:'center', fontWeight:700 }}>
                        ✓ {instPreview.length} institution{instPreview.length!==1?'s':''} found
                      </span>
                    )}
                  </div>

                  {/* Preview table */}
                  {instPreview.length>0 && (
                    <div style={{ marginTop:10, border:'1px solid '+C.border, borderRadius:3,
                                  overflow:'hidden', maxHeight:200, overflowY:'auto' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5,
                                      fontFamily:F.mono }}>
                        <thead>
                          <tr style={{ background:C.bg }}>
                            {Object.keys(instPreview[0]).map(col=>(
                              <th key={col} style={{ padding:'6px 10px', textAlign:'left',
                                fontSize:11, fontWeight:700, color:C.slateL,
                                textTransform:'uppercase', letterSpacing:'0.06em',
                                borderBottom:'1px solid '+C.border, fontFamily:F.sans,
                                whiteSpace:'nowrap' }}>{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {instPreview.map((row,i)=>(
                            <tr key={i} style={{ borderBottom:'1px solid '+C.borderLight }}>
                              {Object.values(row).map((v,j)=>(
                                <td key={j} style={{ padding:'5px 10px', color:C.navyD }}>
                                  {v==null?<em style={{color:C.muted}}>null</em>:String(v)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* JRXML Parameter Mapping */}
                <div>
                  <Label>JRXML Parameter Mapping (JSON)</Label>
                  <div style={{ fontSize:12.5, color:C.slateL, fontFamily:F.sans,
                                marginBottom:8, lineHeight:1.5 }}>
                    Map each <strong>JRXML parameter name</strong> to the <strong>column name</strong> returned
                    by the Institution Query. These values are injected into the report template.
                  </div>
                  <textarea value={jrxmlParamMap}
                    onChange={e=>setJrxmlParamMap(e.target.value)}
                    rows={5} spellCheck={false}
                    placeholder={'{"institutionName":"institution_name","productName":"product_name","instCode":"inst_code"}'}
                    style={{ width:'100%', padding:'10px 12px', borderRadius:3,
                             border:'1.5px solid '+C.border, fontSize:13, fontFamily:F.mono,
                             color:C.navyD, background:C.white, outline:'none',
                             resize:'vertical', minHeight:120, boxSizing:'border-box',
                             lineHeight:1.6 }} />
                  <div style={{ marginTop:6, fontSize:12, color:C.muted, fontFamily:F.sans }}>
                    Example: <code style={{ fontFamily:F.mono, fontSize:11.5,
                    background:C.bg, padding:'1px 6px', borderRadius:2 }}>
                      {'{"institutionName":"institution_name","productName":"product_name"}'}
                    </code>
                    — the keys must exactly match your JRXML <code style={{ fontFamily:F.mono,
                    fontSize:11.5 }}>$P{'{param}'}</code> names.
                  </div>
                  {/* Quick-fill from preview columns */}
                  {instPreview.length>0 && (
                    <div style={{ marginTop:10 }}>
                      <div style={{ fontSize:11.5, color:C.slateL, fontFamily:F.sans,
                                    marginBottom:6, fontWeight:600 }}>
                        Quick-fill from institution query columns:
                      </div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                        {Object.keys(instPreview[0]).map(col=>(
                          <button key={col} onClick={()=>{
                            try {
                              const map = JSON.parse(jrxmlParamMap||'{}');
                              // Convert snake_case to camelCase for param name
                              const camel = col.replace(/_([a-z])/g,(_,c)=>c.toUpperCase());
                              map[camel] = col;
                              setJrxmlParamMap(JSON.stringify(map, null, 2));
                            } catch{ setJrxmlParamMap(prev=>prev); }
                          }} style={{ padding:'3px 10px', borderRadius:2, fontSize:12,
                            fontFamily:F.mono, cursor:'pointer',
                            background:'#F0FDF4', color:C.green,
                            border:'1px solid '+C.greenB, fontWeight:600 }}>
                            + {col}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>)}
            </Section>

            {/* SQL Template */}
            <Section title="Datasource" accent="linear-gradient(90deg,#0F1B2D,#2E6DA4)">
              {/* SQL Mode toggle */}
              <div style={{ display:'flex', border:'1.5px solid '+D.border, borderRadius:3,
                            overflow:'hidden', width:'fit-content', marginBottom:12 }}>
                {[{v:'query',l:'📋 SQL Query'},{v:'procedure',l:'⚙ Stored Procedure'}].map((m,i)=>(
                  <button key={m.v} onClick={()=>{setSqlMode(m.v);setBaseSql('');}}
                    style={{ padding:'7px 16px', fontSize:12.5, fontFamily:F.sans, fontWeight:700,
                             cursor:'pointer', border:'none', outline:'none',
                             background:sqlMode===m.v?D.blue:D.bg1,
                             color:sqlMode===m.v?'#fff':D.dim,
                             borderRight:i===0?'1px solid '+D.border:'none'}}>
                    {m.l}
                  </button>
                ))}
              </div>
              {sqlMode==='procedure' ? (
                <BulkProcedureBuilder value={baseSql} onChange={setBaseSql} />
              ) : (<>
              <div style={{ fontSize:13, color:C.slateL, fontFamily:F.sans, marginBottom:10,
                            padding:'10px 14px', background:C.blueL,
                            border:'1px solid '+C.blueB, borderRadius:3 }}>
                Use <code style={{ fontFamily:F.mono, background:'#DBEAFE', padding:'1px 5px', borderRadius:2,
                                   color:C.blue, fontWeight:700 }}>{'{{ENTITY_ID}}'}</code> as the placeholder
                — it gets replaced with each entity's ID value at run time. JOINs are fully supported.
              </div>
              <div style={{ position:'relative', border:'1.5px solid '+(sqlFocus?'#00A99D':'#DDE3EC'),
                            borderRadius:3, background:'#F0F2F5', overflow:'hidden', transition:'border 0.18s' }}>
                <div aria-hidden="true"
                  style={{ position:'absolute', top:0, left:0, bottom:0, width:36,
                           borderRight:'1px solid #1e3550', padding:'10px 0',
                           pointerEvents:'none', userSelect:'none', zIndex:1 }}>
                  {Array.from({length:lineCount},(_,i)=>(
                    <div key={i} style={{ height:21, lineHeight:'21px', textAlign:'right',
                                         paddingRight:8, fontSize:11.5,
                                         color:'#8A97A8', fontFamily:F.mono }}>{i+1}</div>
                  ))}
                </div>
                <textarea value={baseSql} rows={10} spellCheck={false}
                  onChange={e=>setBaseSql(e.target.value)}
                  onFocus={()=>setSqlFocus(true)} onBlur={()=>setSqlFocus(false)}
                  placeholder={
                    "SELECT\n" +
                    "  m.merchant_id, m.name, m.status,\n" +
                    "  SUM(t.amount) AS total_txn_amount,\n" +
                    "  COUNT(t.id)   AS txn_count\n" +
                    "FROM merchants m\n" +
                    "JOIN transactions t ON t.merchant_id = m.merchant_id\n" +
                    "LEFT JOIN accounts a ON a.id = m.account_id\n" +
                    "WHERE m.merchant_id = '{{ENTITY_ID}}'\n" +
                    "GROUP BY m.merchant_id, m.name, m.status"
                  }
                  style={{ display:'block', width:'100%', padding:'10px 12px 10px 46px',
                           background:'transparent', color:'#1A2332', border:'none',
                           outline:'none', resize:'vertical', fontFamily:F.mono,
                           fontSize:13, lineHeight:'21px', boxSizing:'border-box',
                           minHeight:210, caretColor:'#0066CC' }} />
              </div>
              <div style={{ marginTop:8, fontSize:12, color:C.muted, fontFamily:F.sans }}>
                The placeholder <code style={{ fontFamily:F.mono }}>{'{{ENTITY_ID}}'}</code> will be substituted
                for each entity ID in the list above. Result → one file per entity.
              </div>
              </>)}
            </Section>

            {/* Schedule */}
            {/* Output & Delivery */}
            <Section title="Output & Delivery" accent="linear-gradient(90deg,#7C3AED,#2E6DA4)">

              {/* File Naming Pattern */}
              <div style={{ marginBottom:18 }}>
                <Label>File Naming Pattern</Label>
                <div style={{ fontSize:12.5, color:C.slateL, fontFamily:F.sans, marginBottom:8, lineHeight:1.5 }}>
                  Available tokens:
                  {['{REPORT_NAME}','{ENTITY_ID}','{DATE}','{DATETIME}','{YYYY}','{MM}','{DD}','{institution_name}','{product_name}'].map(t => (
                    <button key={t} onClick={()=>setFileNamingPattern(p=>(p||'')+t)}
                      style={{ margin:'0 4px 4px 0', padding:'2px 8px', borderRadius:2,
                               fontSize:11.5, fontFamily:F.mono, cursor:'pointer',
                               background:C.blueL, color:C.blue, border:'1px solid '+C.blueB }}>
                      {t}
                    </button>
                  ))}
                </div>
                <Inp
                  value={fileNamingPattern}
                  onChange={e=>setFileNamingPattern(e.target.value)}
                  placeholder="{REPORT_NAME}_{ENTITY_ID}_{DATE}"
                />
                {fileNamingPattern && (
                  <div style={{ marginTop:6, fontSize:12, color:C.slateL, fontFamily:F.mono,
                                padding:'6px 10px', background:C.bg, borderRadius:2,
                                border:'1px solid '+C.border }}>
                    Preview: <strong style={{ color:C.navyD }}>
                      {fileNamingPattern
                        .replace('{REPORT_NAME}', scheduleName||'Report')
                        .replace('{ENTITY_ID}', '00023')
                        .replace('{DATETIME}', '20260406_070200')
                        .replace('{DATE}', '20260406')
                        .replace('{YYYY}', '2026').replace('{MM}', '04').replace('{DD}', '06')
                        .replace('{institution_name}', 'Shoppers_Stop')
                        .replace('{product_name}', 'Gold_Card')
                      }.{outputFormat==='EXCEL'?'xlsx':outputFormat==='PDF'?'pdf':'csv'}
                    </strong>
                  </div>
                )}
              </div>

              {/* Local Output Path */}
              <div style={{ marginBottom:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <div onClick={()=>setEnableLocal(v=>!v)}
                    style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', userSelect:'none' }}>
                    <div style={{ width:34, height:18, borderRadius:9,
                                  background:enableLocal?C.navy:'#CBD5E1', position:'relative', transition:'background 0.2s' }}>
                      <div style={{ position:'absolute', top:2, left:enableLocal?18:2, width:14, height:14,
                                    borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
                    </div>
                    <Label style={{ margin:0, cursor:'pointer' }}>Save to Local Directory</Label>
                  </div>
                </div>
                {enableLocal && (
                  <>
                    <Inp
                      value={localOutputPath}
                      onChange={e=>setLocalOutputPath(e.target.value)}
                      placeholder="/var/reports/bulk-output  (overrides global output-dir)"
                    />
                    <div style={{ fontSize:11.5, color:C.muted, fontFamily:F.sans, marginTop:4 }}>
                      Leave blank to use the global <code style={{ fontFamily:F.mono }}>app.report.output-dir</code> from application.yml
                    </div>
                  </>
                )}
              </div>

              {/* SFTP Delivery */}
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <div onClick={()=>setEnableSftp(v=>!v)}
                    style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', userSelect:'none' }}>
                    <div style={{ width:34, height:18, borderRadius:9,
                                  background:enableSftp?'#059669':'#CBD5E1', position:'relative', transition:'background 0.2s' }}>
                      <div style={{ position:'absolute', top:2, left:enableSftp?18:2, width:14, height:14,
                                    borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
                    </div>
                    <Label style={{ margin:0, cursor:'pointer' }}>Deliver via SFTP</Label>
                  </div>
                </div>
                {enableSftp && (
                  <div>
                    {sftpConfigs.length === 0 ? (
                      <div style={{ padding:'12px 14px', background:'#FFFBEB',
                                    border:'1px solid #FDE68A', borderRadius:3,
                                    fontSize:13, color:'#92400E', fontFamily:F.sans }}>
                        ⚠ No SFTP configurations found for this platform.
                        Go to <strong>Settings → SFTP Configs</strong> to add one.
                      </div>
                    ) : (
                      <>
                        <Sel value={sftpConfigId} onChange={e=>setSftpConfigId(e.target.value)}>
                          <option value="">— Select SFTP destination —</option>
                          {sftpConfigs.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.label || s.name || s.host} ({s.host}:{s.port}{s.remotePath})
                            </option>
                          ))}
                        </Sel>
                        {sftpConfigId && (
                          <div style={{ marginTop:8, fontSize:12.5, color:C.green,
                                        fontFamily:F.sans, fontWeight:600 }}>
                            ✓ Reports will be uploaded to the selected SFTP server after generation
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </Section>

            <Section title="Schedule & Delivery" accent={C.navyL}>
              <div style={{ marginBottom:14 }}>
                <Label>Frequency</Label>
                <Pills options={FREQS} value={frequency} onChange={setFrequency} />
              </div>
              {/* Output Format — always visible for all frequencies */}
              <div style={{ marginBottom:14 }}>
                <Label>Output Format</Label>
                <Pills options={FMTS} value={outputFormat} onChange={setOutputFormat} />
              </div>
              {frequency==='ONE_TIME' ? (
                <div style={{ marginBottom:14 }}>
                  <Label>Run Date & Time</Label>
                  <Inp value={runDate} onChange={e=>setRunDate(e.target.value)} type="datetime-local" />
                </div>
              ) : frequency==='CUSTOM_CRON' ? (
                <div style={{ marginBottom:14 }}>
                  <Label>Cron Expression</Label>
                  <Inp value={cron||''} onChange={e=>setCronExpr(e.target.value)} placeholder="0 7 1 * *" />
                </div>
              ) : (
                <div style={{ marginBottom:14 }}>
                  <Label>Run Time (UTC)</Label>
                  <Inp value={runTime} onChange={e=>setRunTime(e.target.value)} type="time" />
                </div>
              )}
              <div style={{ marginBottom:14 }}>
                <Label>Recipients <span style={{fontWeight:400,color:C.slateL}}>(optional — comma-separated)</span></Label>
                <Inp value={recipients} onChange={e=>setRecipients(e.target.value)}
                  placeholder="finance@company.com, reports@company.com  (optional)" />
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Inp value={notes} onChange={e=>setNotes(e.target.value)}
                  placeholder="e.g. Monthly statement run for all active merchants" />
              </div>
            </Section>

            {/* Error display */}
            {err && (
              <div style={{ padding:'12px 16px', background:'#FEF2F2',
                            border:'1px solid #FECACA', borderRadius:3,
                            marginBottom:16 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#991B1B',
                              fontFamily:F.sans, marginBottom: err.includes(';') ? 6 : 0 }}>
                  ⚠ {err.startsWith('Validation failed: ')
                      ? 'Form validation failed — check the fields below:'
                      : err}
                </div>
                {err.startsWith('Validation failed: ') && (
                  <ul style={{ margin:'4px 0 0 16px', padding:0,
                               fontSize:12.5, color:'#991B1B', fontFamily:F.sans }}>
                    {err.replace('Validation failed: ','').split(';').map((e,i) => (
                      <li key={i} style={{ marginBottom:2 }}>{e.trim()}</li>
                    ))}
                  </ul>
                )}
                {!err.startsWith('Validation failed') && err.includes(';') && (
                  <ul style={{ margin:'4px 0 0 16px', padding:0,
                               fontSize:12.5, color:'#991B1B', fontFamily:F.sans }}>
                    {err.split(';').map((e,i) => (
                      <li key={i} style={{ marginBottom:2 }}>{e.trim()}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div style={{ display:'flex', gap:12 }}>
              <button onClick={handleSubmit} disabled={loading}
                style={{ padding:'11px 28px', borderRadius:3, background:loading?C.border:C.navy,
                         color:loading?C.muted:C.white, border:'none', cursor:loading?'not-allowed':'pointer',
                         fontSize:14, fontFamily:F.sans, fontWeight:700 }}>
                {loading ? 'Creating…' : `📦 Create Bulk Schedule (${autoDiscover ? (instPreview.length || '?') : idValues.length} entities)`}
              </button>
              <button onClick={() => { resetForm(); setView('list'); }}
                style={{ padding:'11px 20px', borderRadius:3, border:'1.5px solid '+C.border,
                         background:C.white, color:C.slate, cursor:'pointer',
                         fontSize:13, fontFamily:F.sans }}>Cancel</button>
            </div>
          </div>

          {/* Summary sidebar */}
          <div>
            <div style={{ background:C.blueL, border:'1px solid '+C.blueB, borderRadius:4,
                          padding:'18px 20px', position:'sticky', top:20 }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.blue, fontFamily:F.serif, marginBottom:14 }}>
                Job Summary
              </div>
              {[
                ['Platform',     platform?.platformName || '—'],
                ['Mode', autoDiscover ? 'Auto-discover' : entityQueryMode ? 'SQL Query' : 'Table Picker'],
                ['Entities',     autoDiscover ? (instPreview.length ? `${instPreview.length} found` : 'Run preview') : (idValues.length ? `${idValues.length} selected` : '—')],
                ['ID Column',    idColumn || '—'],
                ['Output',       fileNamingPattern ? fileNamingPattern.slice(0,25)+'…' : 'Default'],
                ['SFTP',         enableSftp && sftpConfigId ? '✓ Enabled' : '—'],
                ['Local Path',   enableLocal && localOutputPath ? '✓ Custom' : 'Default'],
                ['Frequency',    frequency.replace(/_/g,' ')],
                ['Format',       outputFormat],
                ['Reports/Run',  idValues.length || 0],
              ].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between',
                                      marginBottom:9, fontSize:13, fontFamily:F.sans }}>
                  <span style={{ color:C.slateL, fontWeight:600 }}>{k}</span>
                  <span style={{ color:C.navyD, fontWeight:700, textAlign:'right', maxWidth:160,
                                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop:14, paddingTop:12, borderTop:'1px solid '+C.blueB }}>
                <div style={{ fontSize:12, color:C.slateL, fontFamily:F.sans,
                              marginBottom:6, fontWeight:600 }}>SQL placeholder check</div>
                {baseSql.includes('{{ENTITY_ID}}')
                  ? <div style={{ fontSize:12.5, color:C.green, fontFamily:F.sans, fontWeight:700 }}>
                      ✓ {'{{ENTITY_ID}}'} found
                    </div>
                  : <div style={{ fontSize:12.5, color:'#B91C1C', fontFamily:F.sans, fontWeight:700 }}>
                      ✗ Missing {'{{ENTITY_ID}}'}
                    </div>
                }
              </div>
              {idValues.length > 0 && baseSql.includes('{{ENTITY_ID}}') && (
                <div style={{ marginTop:12, padding:'10px 12px',
                              background:'#F0F2F5', borderRadius:3,
                              border:'1px solid #1e3550' }}>
                  <div style={{ fontSize:10.5, color:'#4A5568', fontFamily:F.sans,
                                fontWeight:700, marginBottom:6, textTransform:'uppercase',
                                letterSpacing:'0.08em' }}>First entity preview</div>
                  <pre style={{ margin:0, fontSize:11.5, fontFamily:F.mono, color:'#1A2332',
                                whiteSpace:'pre-wrap', lineHeight:1.5 }}>
                    {baseSql
                        .replace('{{ENTITY_ID}}', idValues[0]||'<entity_id>')
                        .replace(/\{\{(\w+)\}\}/g, (_, tok) => {
                          if (instPreview.length > 0) {
                            const val = instPreview[0][tok] || instPreview[0][tok.toUpperCase()];
                            return val ? String(val) : '<'+tok+'>';
                          }
                          return '<'+tok+'>';
                        })
                        .slice(0,300)}
                    {baseSql.length > 200 ? '…' : ''}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
