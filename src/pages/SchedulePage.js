import React, { useState, useEffect } from 'react';
import { C, font, FREQS, FMTS, RTYPES } from '../theme';
import { TInput, Field, PrimaryBtn, GhostBtn, Pills, ErrBox, Divider, TopBar, PageWrap, SelectInput } from '../components/UI';
import { scheduleApi, templateApi, sftpApi, platformApi } from '../api';
import FileNamePatternBuilder from '../components/FileNamePatternBuilder';

const POI_DEFAULT = '__poi_default__';

// ── SQL mode toggle ──────────────────────────────────────────────────────────
const SQL_MODES = [
  { value: 'query',     label: '📋 SQL Query'        },
  { value: 'procedure', label: '⚙ Stored Procedure'  },
];

function ModeTab({ modes, value, onChange }) {
  return (
    <div style={{ display:'flex', border:'1.5px solid '+C.border, borderRadius:3,
                  overflow:'hidden', width:'fit-content', marginBottom:12 }}>
      {modes.map((m, i) => (
        <button key={m.value} onClick={() => onChange(m.value)}
          style={{ padding:'7px 16px', fontSize:12.5, fontFamily:font.sans, fontWeight:700,
                   cursor:'pointer', border:'none', outline:'none', transition:'all 0.15s',
                   background: value === m.value ? C.navy : C.white,
                   color:      value === m.value ? C.white : C.slate,
                   borderRight: i < modes.length - 1 ? '1px solid '+C.border : 'none' }}>
          {m.label}
        </button>
      ))}
    </div>
  );
}

function ProcedureBuilder({ value, onChange }) {
  const parseName = v => { const m = v.match(/(?:CALL|EXEC(?:UTE)?)\s+(\w+)/i); return m ? m[1] : ''; };
  const parseArgs = v => { const m = v.match(/\(([^)]*)\)/); return m ? m[1] : ''; };
  const parseJdbc = v => v.trim().startsWith('{');

  const [procName, setProcName] = useState(() => parseName(value));
  const [args,     setArgs]     = useState(() => parseArgs(value));
  const [useJdbc,  setUseJdbc]  = useState(() => parseJdbc(value));

  const rebuild = (name, argsStr, jdbc) => {
    const call = `CALL ${name}(${argsStr})`;
    onChange(jdbc ? `{${call}}` : call);
  };

  return (
    <div style={{ background:'#F8FAFC', border:'1.5px solid '+C.border, borderRadius:3, padding:'14px 16px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        <div>
          <label style={lbl}>Procedure Name</label>
          <TInput value={procName} placeholder="e.g. sp_generate_report"
            onChange={e => { setProcName(e.target.value); rebuild(e.target.value, args, useJdbc); }} />
        </div>
        <div>
          <label style={lbl}>Arguments (comma-separated)</label>
          <TInput value={args} placeholder="'00045', 'DAILY', NULL"
            onChange={e => { setArgs(e.target.value); rebuild(procName, e.target.value, useJdbc); }} />
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, cursor:'pointer', userSelect:'none' }}
        onClick={() => { setUseJdbc(!useJdbc); rebuild(procName, args, !useJdbc); }}>
        <div style={{ width:30, height:18, borderRadius:9,
                      background:useJdbc ? C.navyL : C.border, position:'relative', transition:'background 0.2s' }}>
          <div style={{ position:'absolute', top:2, left:useJdbc ? 14 : 2, width:14, height:14,
                        borderRadius:'50%', background:C.white, transition:'left 0.2s' }} />
        </div>
        <span style={{ fontSize:12.5, fontWeight:600, fontFamily:font.sans, color:useJdbc ? C.navyL : C.muted }}>
          JDBC escape {'{CALL …}'} — required for some drivers
        </span>
      </div>
      <div style={{ padding:'9px 12px', background:'#0F1B2D', borderRadius:3,
                    fontFamily:font.mono, fontSize:13, color:'#C8E6E4', wordBreak:'break-all' }}>
        {value || <span style={{ color:'#4A6080' }}>Enter procedure name above…</span>}
      </div>
      <div style={{ marginTop:8, fontSize:12, color:C.muted, fontFamily:font.sans, lineHeight:1.5 }}>
        💡 Use <code style={{ fontFamily:font.mono, background:C.bg, padding:'1px 5px', borderRadius:2 }}>
          {'$P{param}'}
        </code> to pass JRXML parameters as procedure arguments.
      </div>
    </div>
  );
}

export default function SchedulePage({ onScheduled, scheduleContext, onContextConsumed }) {
  const [platforms,   setPlatforms]  = useState([]);
  const [platformId,  setPlatformId] = useState('');
  const [templates,   setTemplates]  = useState([]);
  const [tpl,         setTpl]        = useState(POI_DEFAULT);
  const [name,        setName]       = useState('');
  const [rtype,       setRtype]      = useState('CUSTOM');
  const [freq,        setFreq]       = useState('ONE_TIME');
  const [time,        setTime]       = useState('07:00');
  const [runDate,     setRunDate]    = useState('');
  const [cron,        setCron]       = useState('');
  const [fmt,         setFmt]        = useState('EXCEL');
  const [rcpt,        setRcpt]       = useState('');
  const [notes,       setNotes]      = useState('');
  const [fileNamingPattern, setFileNamingPattern] = useState('{REPORT_NAME}_{DATETIME}');
  const [localOutputPath,   setLocalOutputPath]   = useState('');
  const [sqlMode,     setSqlMode]    = useState('query');
  // Multi-sheet support
  const [multiSheet,  setMultiSheet] = useState(false);
  const [sheets,      setSheets]     = useState([
    { sheetName: 'Sheet 1', sqlQuery: '' }
  ]);
  const addSheet = () => setSheets(s => [...s, { sheetName: 'Sheet '+(s.length+1), sqlQuery: '' }]);
  const removeSheet = i => setSheets(s => s.filter((_,idx) => idx !== i));
  const updateSheet = (i, field, val) => setSheets(s => s.map((sh,idx) => idx===i?{...sh,[field]:val}:sh));
  const [sql,         setSql]        = useState('');
  const [err,         setErr]        = useState('');
  const [done,        setDone]       = useState(false);
  const [doneMsg,     setDoneMsg]    = useState('');
  const [loading,     setLoad]       = useState(false);
  const [sqlFocus,    setSqlFocus]   = useState(false);
  // SFTP
  const [sftpEnabled,   setSftpEnabled]   = useState(false);
  const [sftpHost,      setSftpHost]      = useState('');
  const [sftpPort,      setSftpPort]      = useState('22');
  const [sftpUser,      setSftpUser]      = useState('');
  const [sftpPw,        setSftpPw]        = useState('');
  const [showSftpPw,    setShowSftpPw]    = useState(false);
  const [sftpBasePath,  setSftpBasePath]  = useState('/reports');
  const [sftpSubfolder, setSftpSubfolder] = useState('');
  const [sftpDynamic,   setSftpDynamic]   = useState(false);
  const [sftpTesting,   setSftpTesting]   = useState(false);
  const [sftpTestRes,   setSftpTestRes]   = useState(null);

  useEffect(() => {
    platformApi.list(0, 100, 'ACTIVE').then(d => {
      const list = d.content || [];
      setPlatforms(list);
      if (list.length > 0) setPlatformId(list[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (platformId)
      templateApi.list(platformId).then(d => setTemplates(d.content || d || [])).catch(() => {});
  }, [platformId]);

  useEffect(() => {
    if (!scheduleContext) return;
    const { platformId: ctxPid, tableName, idColumn, idValue, idValues, isMulti } = scheduleContext;
    if (ctxPid) setPlatformId(ctxPid);
    setName(isMulti
      ? `${tableName || 'Records'} Report — ${idValues?.length || 1} entities`
      : `${tableName || 'Record'} Report — ${idColumn}: ${idValue}`);
    setSql(isMulti && idValues?.length > 1
      ? `SELECT *\nFROM ${tableName || 'source_table'}\nWHERE ${idColumn} IN (${idValues.map(v=>`'${v}'`).join(', ')})`
      : `SELECT *\nFROM ${tableName || 'source_table'}\nWHERE ${idColumn} = '${idValue}'`);
    if (onContextConsumed) onContextConsumed();
  }, [scheduleContext]);

  const reset = () => {
    setTpl(POI_DEFAULT); setName(''); setRcpt(''); setNotes('');
    setSql(''); setSqlMode('query'); setFileNamingPattern('{REPORT_NAME}_{DATETIME}');
    setLocalOutputPath(''); setDone(false); setErr(''); setRunDate('');
    setSftpEnabled(false); setSftpHost(''); setSftpPort('22'); setSftpUser('');
    setSftpPw(''); setSftpBasePath('/reports'); setSftpSubfolder(''); setSftpTestRes(null);
  };

  const sftpFinalPath = () => {
    const base = sftpBasePath.replace(/\/$/, '');
    if (sftpDynamic) { const n = new Date(); return `${base}/${n.getFullYear()}/${String(n.getMonth()+1).padStart(2,'0')}`; }
    return sftpSubfolder.trim() ? base + '/' + sftpSubfolder.replace(/^\//, '') : base;
  };

  const testSftp = async () => {
    setSftpTesting(true); setSftpTestRes(null);
    try {
      const r = await sftpApi.testInline({ platformId, label:'Test', sftpHost, sftpPort:parseInt(sftpPort),
        sftpUsername:sftpUser, sftpPassword:sftpPw, basePath:sftpBasePath,
        subfolder:sftpSubfolder, dynamicSubfolder:sftpDynamic });
      setSftpTestRes(r);
    } catch (e) { setSftpTestRes({ ok:false, message:e.message }); }
    finally { setSftpTesting(false); }
  };

  const submit = async () => {
    if (!name.trim()) return setErr('Report name is required.');
    if (freq === 'ONE_TIME' && !runDate) return setErr('Select a run date and time.');
    if (freq === 'CUSTOM_CRON' && !cron.trim()) return setErr('Cron expression is required.');
    if (sftpEnabled && (!sftpHost || !sftpUser || !sftpPw))
      return setErr('SFTP: fill host, username and password.');
    // Email optional — only validate format if provided
    const emails = rcpt.split(',').map(e => e.trim()).filter(Boolean);
    if (emails.some(e => !e.includes('@'))) return setErr('One or more email addresses are invalid.');
    setErr(''); setLoad(true);
    try {
      const result = await scheduleApi.create({
        platformId,
        templateId:      tpl === POI_DEFAULT ? undefined : tpl,
        reportName:      name,
        category:        rtype,
        frequency:       freq,
        runTime:         (freq !== 'ONE_TIME' && freq !== 'CUSTOM_CRON') ? time : undefined,
        runDatetime:     freq === 'ONE_TIME' ? new Date(runDate).toISOString() : undefined,
        cronExpression:  freq === 'CUSTOM_CRON' ? cron : undefined,
        outputFormat:    fmt,
        recipients:      emails,
        sqlQuery:        (!multiSheet && sql.trim()) ? sql.trim() : undefined,
        sheets:          multiSheet ? sheets.filter(s=>s.sqlQuery.trim()).map((s,i)=>({...s, sheetIndex:i})) : undefined,
        notes:           notes || undefined,
        fileNamingPattern: fileNamingPattern || undefined,
        localOutputPath:   localOutputPath || undefined,
        sftpEnabled,
        inlineSftpConfig: sftpEnabled ? { platformId, sftpHost, sftpPort:parseInt(sftpPort),
          sftpUsername:sftpUser, sftpPassword:sftpPw, basePath:sftpBasePath,
          subfolder:sftpSubfolder, dynamicSubfolder:sftpDynamic } : undefined,
      });
      setDoneMsg(result.reportName || name);
      setDone(true);
      onScheduled && onScheduled(result);
    } catch (e) { setErr(e.message); }
    finally { setLoad(false); }
  };

  const lineCount = (sql || '\n').split('\n').length;

  if (done) return (
    <>
      <TopBar title="Schedule Report" subtitle="Configure automated delivery" />
      <PageWrap>
        <div style={{ maxWidth:520, margin:'40px auto', textAlign:'center', background:C.white,
                      border:'1px solid '+C.border, borderRadius:4, padding:'48px 40px',
                      boxShadow:'0 1px 8px #1B3A5C08' }}>
          <div style={{ width:64, height:64, borderRadius:'50%', background:C.greenL,
                        border:'2px solid '+C.greenB, display:'flex', alignItems:'center',
                        justifyContent:'center', fontSize:30, margin:'0 auto 20px' }}>✓</div>
          <h2 style={{ fontFamily:font.serif, fontSize:22, color:C.navyD, margin:'0 0 12px' }}>
            Report Scheduled Successfully
          </h2>
          <p style={{ color:C.slateL, fontSize:14, fontFamily:font.sans, lineHeight:1.7, margin:'0 0 24px' }}>
            <strong style={{ color:C.navy }}>{doneMsg}</strong><br />
            {rtype.replace(/_/g,' ')} · {fmt} · {freq.replace(/_/g,' ')}
            {freq !== 'ONE_TIME' && freq !== 'CUSTOM_CRON' ? ' at '+time+' UTC' : ''}
          </p>
          <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
            <PrimaryBtn onClick={reset}>Schedule Another</PrimaryBtn>
            <GhostBtn onClick={reset}>Done</GhostBtn>
          </div>
        </div>
      </PageWrap>
    </>
  );

  return (
    <>
      <TopBar title="Schedule Report" subtitle="Configure automated delivery for financial reports" />
      <PageWrap>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:24 }}>
          <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:4,
                        padding:'28px 32px', boxShadow:'0 1px 8px #1B3A5C08' }}>

            {/* Identity */}
            <Divider label="Report Identity" />
            <Field label="Platform">
              <SelectInput value={platformId} onChange={e => setPlatformId(e.target.value)}>
                {platforms.map(p => <option key={p.id} value={p.id}>{p.platformName}</option>)}
              </SelectInput>
            </Field>
            <Field label="Template" hint="Optional — leave on POI Default to auto-generate Excel/CSV">
              <SelectInput value={tpl} onChange={e => setTpl(e.target.value)}>
                <option value={POI_DEFAULT}>📊 Default — Excel / CSV  (no template)</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.originalName || t.templateName}</option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Report Name">
              <TInput value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Monthly P&L – North America" />
            </Field>
            <Field label="Report Category">
              <Pills options={RTYPES} value={rtype} onChange={setRtype} />
            </Field>

            {/* Datasource */}
            <Divider label="Datasource" />
            <ModeTab modes={SQL_MODES} value={sqlMode}
              onChange={v => { setSqlMode(v); setSql(''); }} />

            {/* Multi-sheet toggle */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div onClick={()=>setMultiSheet(!multiSheet)}
                style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', userSelect:'none' }}>
                <div style={{ width:36, height:20, borderRadius:10,
                              background:multiSheet?C.navy:C.border, position:'relative',
                              transition:'background 0.2s', flexShrink:0 }}>
                  <div style={{ position:'absolute', top:3, left:multiSheet?18:3, width:14, height:14,
                                borderRadius:'50%', background:C.white, transition:'left 0.2s' }} />
                </div>
                <span style={{ fontSize:13, fontWeight:700, fontFamily:font.sans,
                               color:multiSheet?C.navy:C.slate }}>
                  📑 Multi-Sheet Excel
                </span>
              </div>
              {multiSheet && (
                <span style={{ fontSize:12, color:C.muted, fontFamily:font.sans }}>
                  Each sheet runs its own SQL — one tab per query
                </span>
              )}
            </div>

            {multiSheet ? (
              <div>
                {sheets.map((sh, i) => (
                  <div key={i} style={{ border:'1.5px solid '+C.border, borderRadius:3,
                                        marginBottom:12, overflow:'hidden' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px',
                                  background:C.bg, borderBottom:'1px solid '+C.border }}>
                      <span style={{ fontSize:12, fontWeight:700, color:C.navyL,
                                     fontFamily:font.sans, minWidth:16 }}>#{i+1}</span>
                      <input value={sh.sheetName}
                        onChange={e => updateSheet(i, 'sheetName', e.target.value)}
                        placeholder="Sheet name (max 31 chars)"
                        maxLength={31}
                        style={{ flex:1, padding:'5px 10px', border:'1px solid '+C.border,
                                 borderRadius:3, fontSize:13, fontFamily:font.sans,
                                 color:C.navyD, outline:'none', background:C.white }} />
                      {sheets.length > 1 && (
                        <button onClick={() => removeSheet(i)}
                          style={{ background:'none', border:'none', cursor:'pointer',
                                   fontSize:16, color:C.muted, padding:'0 4px' }}>✕</button>
                      )}
                    </div>
                    <textarea value={sh.sqlQuery}
                      onChange={e => updateSheet(i, 'sqlQuery', e.target.value)}
                      rows={5} placeholder="SELECT * FROM table WHERE ..."
                      style={{ display:'block', width:'100%', padding:'10px 12px',
                               background:'#0a1520', color:'#E2E8F0', border:'none',
                               outline:'none', resize:'vertical', fontFamily:font.mono,
                               fontSize:13, lineHeight:'21px', boxSizing:'border-box' }} />
                  </div>
                ))}
                <button onClick={addSheet}
                  style={{ padding:'7px 16px', borderRadius:3, fontSize:13,
                           fontFamily:font.sans, fontWeight:600, cursor:'pointer',
                           border:'1.5px dashed '+C.border, background:C.bg,
                           color:C.navy, width:'100%' }}>
                  + Add Sheet
                </button>
              </div>
            ) : (<>
            {sqlMode === 'query' ? (
              <Field label="SQL Query" hint="Optional — leave empty for parameterless static templates">
                <div style={{ position:'relative', border:'1.5px solid '+(sqlFocus?'#00A99D':'#DDE3EC'),
                              borderRadius:3, background:'#F0F2F5', transition:'border 0.18s', overflow:'hidden' }}>
                  <div aria-hidden="true" style={{ position:'absolute', top:0, left:0, bottom:0, width:36,
                                                   borderRight:'1px solid #1e3550', padding:'10px 0',
                                                   pointerEvents:'none', userSelect:'none', zIndex:1 }}>
                    {Array.from({ length:lineCount }, (_,i) => (
                      <div key={i} style={{ height:21, lineHeight:'21px', textAlign:'right',
                                            paddingRight:8, fontSize:11.5, color:'#8A97A8',
                                            fontFamily:font.mono }}>{i+1}</div>
                    ))}
                  </div>
                  <textarea value={sql} onFocus={()=>setSqlFocus(true)} onBlur={()=>setSqlFocus(false)}
                    onChange={e=>setSql(e.target.value)} spellCheck={false} rows={8}
                    placeholder={"SELECT\n  account_code,\n  SUM(amount) AS total\nFROM transactions\nWHERE period = '2026-04'"}
                    style={{ display:'block', width:'100%', padding:'10px 12px 10px 46px',
                             background:'transparent', color:'#1A2332', border:'none', outline:'none',
                             resize:'vertical', fontFamily:font.mono, fontSize:13, lineHeight:'21px',
                             boxSizing:'border-box', minHeight:168, caretColor:'#0066CC' }} />
                </div>
                {!sql.trim() && (
                  <div style={{ marginTop:5, fontSize:12, color:C.muted, fontFamily:font.sans }}>
                    Leave empty if the template uses a static or pre-defined datasource.
                  </div>
                )}
              </Field>
            ) : (
              <Field label="Stored Procedure"
                hint="Calls a stored procedure — result set used as the report datasource">
                <ProcedureBuilder value={sql} onChange={setSql} />
              </Field>
            )}
            </>
            )}
            {/* Schedule */}
            <Divider label="Schedule" />
            <Field label="Run Frequency">
              <Pills options={FREQS} value={freq} onChange={v => { setFreq(v); setErr(''); }} />
            </Field>
            {freq === 'ONE_TIME' && (
              <Field label="Run Date & Time" hint="One-time execution at this UTC date and time">
                <TInput value={runDate} onChange={e=>setRunDate(e.target.value)} type="datetime-local" />
                {runDate && (
                  <div style={{ marginTop:5, fontSize:12, color:C.green, fontFamily:font.sans }}>
                    ✓ {new Date(runDate).toLocaleString('en-GB', { dateStyle:'full', timeStyle:'short' })} UTC
                  </div>
                )}
              </Field>
            )}
            {freq !== 'ONE_TIME' && freq !== 'CUSTOM_CRON' && (
              <Field label="Run Time" hint="UTC">
                <TInput value={time} onChange={e=>setTime(e.target.value)} type="time" />
              </Field>
            )}
            {freq === 'CUSTOM_CRON' && (
              <Field label="Cron Expression" hint="e.g. 0 7 1 * * = 07:00 on 1st of every month">
                <TInput value={cron} onChange={e=>setCron(e.target.value)} placeholder="0 7 * * 1-5" />
              </Field>
            )}

            {/* Delivery */}
            <Divider label="Delivery" />
            {/* Output format — always visible for ALL frequencies including ONE_TIME & CUSTOM_CRON */}
            <Field label="Output Format">
              <Pills options={FMTS} value={fmt} onChange={setFmt} />
            </Field>
            <Field label="Recipients" hint="Optional — comma-separated. Leave empty to save to disk only.">
              <TInput value={rcpt} onChange={e=>setRcpt(e.target.value)}
                placeholder="cfo@company.com, finance@company.com  (optional)" />
            </Field>
            <FileNamePatternBuilder
              value={fileNamingPattern} onChange={setFileNamingPattern}
              ext={fmt==='PDF'?'.pdf':fmt==='EXCEL'?'.xlsx':fmt==='HTML'?'.html':'.csv'}
              localOutputPath={localOutputPath} onLocalOutputPathChange={setLocalOutputPath}
            />
            <Field label="Notes (optional)">
              <TInput value={notes} onChange={e=>setNotes(e.target.value)} rows={2}
                placeholder="Scope, fiscal period, or delivery instructions…" />
            </Field>

            {/* SFTP */}
            <div style={{ marginBottom:20 }}>
              <div onClick={()=>{ setSftpEnabled(!sftpEnabled); setSftpTestRes(null); }}
                style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer',
                         marginBottom:sftpEnabled?14:0, userSelect:'none' }}>
                <div style={{ width:38, height:22, borderRadius:11,
                              background:sftpEnabled?C.navy:C.border, position:'relative',
                              transition:'background 0.2s', flexShrink:0 }}>
                  <div style={{ position:'absolute', top:3, left:sftpEnabled?19:3, width:16, height:16,
                                borderRadius:'50%', background:C.white, transition:'left 0.2s',
                                boxShadow:'0 1px 3px #0003' }} />
                </div>
                <span style={{ fontSize:13, fontWeight:700, fontFamily:font.sans,
                               color:sftpEnabled?C.navy:C.slate }}>📂 Deliver via SFTP</span>
              </div>
              {sftpEnabled && (
                <div style={{ background:C.bg, border:'1px solid '+C.border, borderRadius:3, padding:'18px 20px' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 88px', gap:12, marginBottom:14 }}>
                    <div><label style={lbl}>SFTP Host</label>
                      <TInput value={sftpHost} onChange={e=>{setSftpHost(e.target.value);setSftpTestRes(null);}} placeholder="sftp.company.com" /></div>
                    <div><label style={lbl}>Port</label>
                      <TInput value={sftpPort} onChange={e=>{setSftpPort(e.target.value);setSftpTestRes(null);}} /></div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                    <div><label style={lbl}>Username</label>
                      <TInput value={sftpUser} onChange={e=>{setSftpUser(e.target.value);setSftpTestRes(null);}} placeholder="sftp_user" /></div>
                    <div><label style={lbl}>Password</label>
                      <div style={{ position:'relative' }}>
                        <TInput value={sftpPw} type={showSftpPw?'text':'password'}
                          onChange={e=>{setSftpPw(e.target.value);setSftpTestRes(null);}} placeholder="••••••••••" />
                        <button onClick={()=>setShowSftpPw(!showSftpPw)}
                          style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                                   background:'none', border:'none', cursor:'pointer', fontSize:14,
                                   color:C.muted, padding:0 }}>{showSftpPw?'🙈':'👁'}</button>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginBottom:14 }}><label style={lbl}>Base Path</label>
                    <TInput value={sftpBasePath} onChange={e=>setSftpBasePath(e.target.value)} placeholder="/reports" /></div>
                  <div style={{ marginBottom:14 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                      <label style={lbl}>Subfolder</label>
                      <div onClick={()=>setSftpDynamic(!sftpDynamic)}
                        style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', userSelect:'none' }}>
                        <div style={{ width:30, height:18, borderRadius:9,
                                      background:sftpDynamic?C.navyL:C.border, position:'relative',
                                      transition:'background 0.2s' }}>
                          <div style={{ position:'absolute', top:2, left:sftpDynamic?14:2, width:14, height:14,
                                        borderRadius:'50%', background:C.white, transition:'left 0.2s' }} />
                        </div>
                        <span style={{ fontSize:11.5, color:sftpDynamic?C.navyL:C.muted,
                                       fontFamily:font.sans, fontWeight:600 }}>Dynamic YYYY/MM</span>
                      </div>
                    </div>
                    {sftpDynamic
                      ? <div style={{ padding:'9px 12px', background:C.blueL, border:'1px solid '+C.blueB,
                                      borderRadius:3, fontSize:12.5, fontFamily:font.mono, color:C.blue }}>
                          {sftpBasePath.replace(/\/$/, '')}/{'{YYYY}/{MM}'}
                        </div>
                      : <TInput value={sftpSubfolder} onChange={e=>setSftpSubfolder(e.target.value)}
                          placeholder="e.g. finance/monthly" />
                    }
                  </div>
                  <div style={{ padding:'8px 12px', background:'#F0F2F5', border:'1px solid #1e3550',
                                borderRadius:3, marginBottom:14 }}>
                    <code style={{ fontSize:12.5, color:'#0066CC', fontFamily:font.mono }}>
                      {sftpUser||'user'}@{sftpHost||'host'}:{sftpPort}{sftpFinalPath()}
                    </code>
                  </div>
                  <button onClick={testSftp} disabled={sftpTesting||!sftpHost||!sftpUser||!sftpPw}
                    style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:3,
                             background:sftpTesting||!sftpHost?'#E0ECF8':'#F0F2F5',
                             color:sftpTesting||!sftpHost?'#8A97A8':'#0066CC',
                             border:'1.5px solid '+(sftpTesting||!sftpHost?'#DDE3EC':'#00A99D'),
                             cursor:sftpTesting||!sftpHost||!sftpUser||!sftpPw?'not-allowed':'pointer',
                             fontSize:13, fontFamily:font.sans, fontWeight:700,
                             marginBottom:sftpTestRes?8:0 }}>
                    <span>{sftpTesting?'⏳':'🔌'}</span>{sftpTesting?'Connecting…':'Test SFTP'}
                  </button>
                  {sftpTestRes && (
                    <div style={{ padding:'10px 12px', borderRadius:3,
                                  background:sftpTestRes.ok?'#0a1f0a':'#1f0a0a',
                                  border:'1px solid '+(sftpTestRes.ok?'#B2EFC5':'#7f1d1d') }}>
                      {sftpTestRes.ok
                        ? <span style={{ fontSize:13, fontWeight:700, color:'#00A651', fontFamily:font.sans }}>✅ SFTP connected · {sftpTestRes.ms}ms</span>
                        : <span style={{ fontSize:13, fontWeight:700, color:'#D0021B', fontFamily:font.sans }}>❌ {sftpTestRes.message}</span>
                      }
                    </div>
                  )}
                </div>
              )}
            </div>

            <ErrBox msg={err} />
            <div style={{ display:'flex', gap:10 }}>
              <PrimaryBtn onClick={submit} loading={loading}>
                {freq === 'ONE_TIME' ? '⚡ Generate Report' : 'Confirm & Schedule'}
              </PrimaryBtn>
              <GhostBtn onClick={reset}>Clear Form</GhostBtn>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div style={{ background:C.blueL, border:'1px solid '+C.blueB, borderRadius:4,
                          padding:'20px 22px', marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.blue, fontFamily:font.serif,
                            marginBottom:12 }}>Configuration Preview</div>
              {[
                ['Template',  tpl===POI_DEFAULT ? '📊 POI Default' : (templates.find(t=>t.id===tpl)?.originalName||'—')],
                ['Report',    name||'—'],
                ['Category',  rtype.replace(/_/g,' ')],
                ['Frequency', freq.replace(/_/g,' ')],
                ['Time',      freq==='ONE_TIME'?(runDate?new Date(runDate).toLocaleString('en-GB',{dateStyle:'short',timeStyle:'short'}):'—'):freq==='CUSTOM_CRON'?(cron||'—'):time],
                ['Format',    fmt],
                ['Source',    multiSheet ? '📑 '+sheets.length+' sheet(s)' : sqlMode==='procedure'?'⚙ Procedure':sql.trim()?'📋 SQL':'—'],
                ['Email',     rcpt.trim() ? rcpt.split(',').filter(Boolean).length+' recipient(s)' : 'Optional / not set'],
              ].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', marginBottom:8,
                                      fontSize:13, fontFamily:font.sans }}>
                  <span style={{ color:C.slateL, fontWeight:600 }}>{k}</span>
                  <span style={{ color:C.navyD, fontWeight:700, textAlign:'right',
                                 maxWidth:160, overflow:'hidden', textOverflow:'ellipsis',
                                 whiteSpace:'nowrap' }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Procedure reference */}
            {sqlMode === 'procedure' && (
              <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:4,
                            padding:'16px 18px', marginBottom:16 }}>
                <div style={{ fontSize:12, color:C.green, fontFamily:font.sans, fontWeight:700,
                              marginBottom:8 }}>⚙ Procedure Syntax Reference</div>
                {[
                  ['PostgreSQL',  "CALL sp_report('00045')"],
                  ['SQL Server',  "EXEC sp_report @code='00045'"],
                  ['Oracle',      "BEGIN sp_report('00045'); END;"],
                  ['JDBC escape', "{CALL sp_report('00045')}"],
                ].map(([db, ex]) => (
                  <div key={db} style={{ marginBottom:8 }}>
                    <div style={{ fontSize:10.5, color:C.muted, fontFamily:font.sans,
                                  fontWeight:700, textTransform:'uppercase', marginBottom:2 }}>{db}</div>
                    <code style={{ fontSize:11.5, fontFamily:font.mono, color:'#166534',
                                   background:'#DCFCE7', padding:'2px 6px', borderRadius:2,
                                   display:'block', wordBreak:'break-all' }}>{ex}</code>
                  </div>
                ))}
              </div>
            )}

            {sqlMode === 'query' && (
              <div style={{ background:'#F0F2F5', border:'1px solid #1e3550', borderRadius:4,
                            padding:'16px 18px', marginBottom:16 }}>
                <div style={{ fontSize:12, color:'#4A5568', fontFamily:font.sans, fontWeight:700,
                              marginBottom:10, letterSpacing:'0.08em', textTransform:'uppercase' }}>
                  💡 JasperReports Syntax
                </div>
                {[['$P{param}','Named parameter'],['$F{field}','Report field'],
                  ['$V{variable}','Report variable'],['$P!{param}','Inline SQL param']].map(([tok,desc]) => (
                  <div key={tok} style={{ display:'flex', gap:10, marginBottom:7, alignItems:'center' }}>
                    <code style={{ fontSize:11.5, color:'#0066CC', fontFamily:font.mono,
                                   background:'#DDE3EC', padding:'2px 7px', borderRadius:2,
                                   whiteSpace:'nowrap' }}>{tok}</code>
                    <span style={{ fontSize:12, color:'#4A5568', fontFamily:font.sans }}>{desc}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background:C.amberL, border:'1px solid #FDE68A', borderRadius:4, padding:'16px 18px' }}>
              <div style={{ fontSize:12.5, color:C.amber, fontFamily:font.sans, fontWeight:700, marginBottom:6 }}>
                📌 Compliance Reminder
              </div>
              <div style={{ fontSize:12.5, color:'#92400E', fontFamily:font.sans, lineHeight:1.6 }}>
                All recipients must have authorised access under your data governance policy.
              </div>
            </div>
          </div>
        </div>
      </PageWrap>
    </>
  );
}

const lbl = {
  display:'block', marginBottom:5, fontSize:11, fontWeight:700,
  letterSpacing:'0.1em', color:'#6B7A8D', textTransform:'uppercase', fontFamily:font.sans,
};
