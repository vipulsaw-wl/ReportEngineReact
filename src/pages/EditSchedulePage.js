import React, { useState, useEffect } from 'react';
import { C, font, FREQS, FMTS, RTYPES } from '../theme';
import { TInput, Field, PrimaryBtn, GhostBtn, Pills, ErrBox, Divider, SelectInput } from '../components/UI';
import { scheduleApi, templateApi } from '../api';
import FileNamePatternBuilder from '../components/FileNamePatternBuilder';

const POI_DEFAULT = '__poi_default__';

export default function EditSchedulePage({ reportId, onSaved, onCancel }) {
  const [templates,   setTemplates]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [err,         setErr]         = useState('');
  const [tpl,         setTpl]         = useState(POI_DEFAULT);
  const [name,        setName]        = useState('');
  const [category,    setCategory]    = useState('CUSTOM');
  const [frequency,   setFrequency]   = useState('DAILY');
  const [runTime,     setRunTime]     = useState('07:00');
  const [runDate,     setRunDate]     = useState('');
  const [cron,        setCron]        = useState('');
  const [outputFormat,setOutputFormat]= useState('EXCEL');
  const [recipients,  setRecipients]  = useState('');
  const [sqlQuery,    setSqlQuery]    = useState('');
  const [notes,       setNotes]       = useState('');
  const [fileNaming,  setFileNaming]  = useState('{REPORT_NAME}_{DATETIME}');
  const [localPath,   setLocalPath]   = useState('');
  const [multiSheet,  setMultiSheet]  = useState(false);
  const [sheets,      setSheets]      = useState([{ sheetName:'Sheet 1', sqlQuery:'' }]);
  const [sqlFocus,    setSqlFocus]    = useState(false);
  const [platformId,  setPlatformId]  = useState('');

  const addSheet    = ()       => setSheets(s => [...s, { sheetName:'Sheet '+(s.length+1), sqlQuery:'' }]);
  const removeSheet = i        => setSheets(s => s.filter((_,idx)=>idx!==i));
  const updSheet    = (i,k,v)  => setSheets(s => s.map((sh,idx)=>idx===i?{...sh,[k]:v}:sh));

  useEffect(() => {
    if (!reportId) return;
    scheduleApi.get(reportId)
      .then(r => {
        setPlatformId(r.platformId || '');
        setTpl(r.templateId || POI_DEFAULT);
        setName(r.reportName || '');
        setCategory(r.category || 'CUSTOM');
        setFrequency(r.frequency || 'DAILY');
        setRunTime(r.runTime || '07:00');
        setRunDate(r.runDatetime ? new Date(r.runDatetime).toISOString().slice(0,16) : '');
        setCron(r.cronExpression || '');
        setOutputFormat(r.outputFormat || 'EXCEL');
        setRecipients((r.recipients||[]).join(', '));
        setNotes(r.notes || '');
        setFileNaming(r.fileNamingPattern || '{REPORT_NAME}_{DATETIME}');
        setLocalPath(r.localOutputPath || '');
        if (r.sheets && r.sheets.length > 0) { setMultiSheet(true); setSheets(r.sheets); }
        else { setSqlQuery(r.sqlQuery || ''); }
        return templateApi.list(r.platformId, 0, 100);
      })
      .then(d => setTemplates(d?.content || d || []))
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [reportId]);

  const submit = async () => {
    if (!name.trim()) return setErr('Report name is required.');
    if (frequency==='ONE_TIME' && !runDate) return setErr('Select a run date and time.');
    if (frequency==='CUSTOM_CRON' && !cron.trim()) return setErr('Cron expression is required.');
    const rcpts = recipients.split(',').map(e=>e.trim()).filter(Boolean);
    if (rcpts.some(e=>!e.includes('@'))) return setErr('One or more email addresses are invalid.');
    setErr(''); setSaving(true);
    try {
      await scheduleApi.update(reportId, {
        templateId:        tpl===POI_DEFAULT ? undefined : tpl,
        reportName:        name, category, frequency,
        runTime:           frequency!=='ONE_TIME'&&frequency!=='CUSTOM_CRON' ? runTime : undefined,
        runDatetime:       frequency==='ONE_TIME' ? new Date(runDate).toISOString() : undefined,
        cronExpression:    frequency==='CUSTOM_CRON' ? cron : undefined,
        outputFormat, recipients: rcpts,
        sqlQuery:          !multiSheet && sqlQuery.trim() ? sqlQuery.trim() : undefined,
        sheets:            multiSheet ? sheets.filter(s=>s.sqlQuery.trim()).map((s,i)=>({...s,sheetIndex:i})) : undefined,
        notes:             notes || undefined,
        fileNamingPattern: fileNaming || undefined,
        localOutputPath:   localPath  || undefined,
      });
      onSaved && onSaved();
    } catch(e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const lineCount = (sqlQuery||'\n').split('\n').length;

  if (loading) return (
    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
                  color:C.muted, fontFamily:font.sans, fontSize:14 }}>
      Loading schedule…
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden', fontFamily:font.sans }}>

      {/* ── Breadcrumb bar ── */}
      <div style={{ background:'#fff', borderBottom:'2px solid #00A99D', padding:'10px 24px',
                    display:'flex', alignItems:'center', gap:12, flexShrink:0,
                    boxShadow:'0 2px 8px rgba(0,0,0,0.08)' }}>
        <button onClick={onCancel}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:3,
                   border:'1.5px solid #00A99D', background:'#E6F7F6', color:'#007A72',
                   fontFamily:font.sans, fontSize:13, fontWeight:700, cursor:'pointer' }}>
          ← Reports
        </button>
        <span style={{ color:'#8A97A8', fontSize:13 }}>/</span>
        <span style={{ color:'#1A2332', fontSize:13, fontWeight:600 }}>
          Edit: {name || '…'}
        </span>
      </div>

      {/* ── Scrollable body ── */}
      <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:20, maxWidth:1200 }}>

          {/* Main form */}
          <div style={{ background:'#fff', border:'1px solid #DDE3EC', borderRadius:4,
                        padding:'24px 28px', boxShadow:'0 1px 6px #1B3A5C06' }}>

            <Divider label="Report Identity" />
            <Field label="Template" hint="Optional — POI Default for Excel/CSV without template">
              <SelectInput value={tpl} onChange={e=>setTpl(e.target.value)}>
                <option value={POI_DEFAULT}>📊 Default — Excel / CSV  (no template)</option>
                {templates.map(t=><option key={t.id} value={t.id}>{t.originalName||t.templateName}</option>)}
              </SelectInput>
            </Field>
            <Field label="Report Name">
              <TInput value={name} onChange={e=>setName(e.target.value)} placeholder="Report name" />
            </Field>
            <Field label="Category">
              <Pills options={RTYPES} value={category} onChange={setCategory} />
            </Field>

            <Divider label="Datasource" />
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div onClick={()=>setMultiSheet(!multiSheet)}
                style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', userSelect:'none' }}>
                <div style={{ width:36, height:20, borderRadius:10, transition:'background 0.2s',
                              background:multiSheet?'#1A2332':'#DDE3EC', position:'relative' }}>
                  <div style={{ position:'absolute', top:3, left:multiSheet?18:3, width:14, height:14,
                                borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
                </div>
                <span style={{ fontSize:13, fontWeight:700, color:multiSheet?'#1A2332':'#6B7A8D' }}>
                  📑 Multi-Sheet Excel
                </span>
              </div>
            </div>

            {multiSheet ? (
              <div>
                {sheets.map((sh,i)=>(
                  <div key={i} style={{ border:'1.5px solid #DDE3EC', borderRadius:3, marginBottom:12, overflow:'hidden' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px',
                                  background:'#F8FAFC', borderBottom:'1px solid #DDE3EC' }}>
                      <span style={{ fontSize:12, fontWeight:700, color:'#00A99D', minWidth:18 }}>#{i+1}</span>
                      <input value={sh.sheetName} maxLength={31}
                        onChange={e=>updSheet(i,'sheetName',e.target.value)}
                        style={{ flex:1, padding:'4px 8px', border:'1px solid #DDE3EC', borderRadius:3,
                                 fontSize:13, fontFamily:font.sans, outline:'none' }} />
                      {sheets.length>1&&<button onClick={()=>removeSheet(i)}
                        style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#8A97A8' }}>✕</button>}
                    </div>
                    <textarea value={sh.sqlQuery} rows={5}
                      onChange={e=>updSheet(i,'sqlQuery',e.target.value)}
                      placeholder="SELECT * FROM table WHERE ..."
                      style={{ display:'block', width:'100%', padding:'10px 12px', background:'#0a1520',
                               color:'#E2E8F0', border:'none', outline:'none', resize:'vertical',
                               fontFamily:font.mono, fontSize:13, boxSizing:'border-box' }} />
                  </div>
                ))}
                <button onClick={addSheet}
                  style={{ width:'100%', padding:'8px', borderRadius:3, fontSize:13, fontWeight:600,
                           border:'1.5px dashed #DDE3EC', background:'#F8FAFC', color:'#1A2332', cursor:'pointer' }}>
                  + Add Sheet
                </button>
              </div>
            ) : (
              <Field label="SQL Query" hint="Optional — leave empty for static templates">
                <div style={{ position:'relative', border:'1.5px solid '+(sqlFocus?'#00A99D':'#DDE3EC'),
                              borderRadius:3, background:'#F0F2F5', overflow:'hidden', transition:'border 0.15s' }}>
                  <div aria-hidden="true" style={{ position:'absolute', top:0, left:0, bottom:0, width:36,
                                                   borderRight:'1px solid #1e3550', padding:'10px 0',
                                                   pointerEvents:'none', userSelect:'none', zIndex:1 }}>
                    {Array.from({length:lineCount},(_,i)=>(
                      <div key={i} style={{ height:21, lineHeight:'21px', textAlign:'right', paddingRight:8,
                                            fontSize:11.5, color:'#8A97A8', fontFamily:font.mono }}>{i+1}</div>
                    ))}
                  </div>
                  <textarea value={sqlQuery} onFocus={()=>setSqlFocus(true)} onBlur={()=>setSqlFocus(false)}
                    onChange={e=>setSqlQuery(e.target.value)} spellCheck={false} rows={8}
                    placeholder="SELECT * FROM table WHERE ..."
                    style={{ display:'block', width:'100%', padding:'10px 12px 10px 46px',
                             background:'transparent', color:'#1A2332', border:'none', outline:'none',
                             resize:'vertical', fontFamily:font.mono, fontSize:13, lineHeight:'21px',
                             boxSizing:'border-box', minHeight:160 }} />
                </div>
              </Field>
            )}

            <Divider label="Schedule" />
            <Field label="Frequency">
              <Pills options={FREQS} value={frequency} onChange={v=>{setFrequency(v);setErr('');}} />
            </Field>
            {frequency==='ONE_TIME' && (
              <Field label="Run Date & Time" hint="UTC">
                <TInput value={runDate} onChange={e=>setRunDate(e.target.value)} type="datetime-local" />
              </Field>
            )}
            {frequency!=='ONE_TIME'&&frequency!=='CUSTOM_CRON' && (
              <Field label="Run Time (UTC)">
                <TInput value={runTime} onChange={e=>setRunTime(e.target.value)} type="time" />
              </Field>
            )}
            {frequency==='CUSTOM_CRON' && (
              <Field label="Cron Expression" hint="e.g. 0 7 * * 1-5">
                <TInput value={cron} onChange={e=>setCron(e.target.value)} placeholder="0 7 * * *" />
              </Field>
            )}

            <Divider label="Delivery" />
            <Field label="Output Format">
              <Pills options={FMTS} value={outputFormat} onChange={setOutputFormat} />
            </Field>
            <Field label="Recipients" hint="Optional — comma-separated emails">
              <TInput value={recipients} onChange={e=>setRecipients(e.target.value)}
                placeholder="finance@company.com  (optional)" />
            </Field>
            <FileNamePatternBuilder
              value={fileNaming} onChange={setFileNaming}
              ext={outputFormat==='PDF'?'.pdf':outputFormat==='EXCEL'?'.xlsx':outputFormat==='HTML'?'.html':'.csv'}
              localOutputPath={localPath} onLocalOutputPathChange={setLocalPath}
            />
            <Field label="Notes (optional)">
              <TInput value={notes} onChange={e=>setNotes(e.target.value)} rows={2}
                placeholder="Scope or delivery notes…" />
            </Field>

            <ErrBox msg={err} />
            <div style={{ display:'flex', gap:10, marginTop:8 }}>
              <PrimaryBtn onClick={submit} loading={saving}>💾 Save Changes</PrimaryBtn>
              <GhostBtn onClick={onCancel}>Cancel</GhostBtn>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:4,
                        padding:'18px 20px', height:'fit-content', position:'sticky', top:0 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#1D4ED8', fontFamily:font.sans, marginBottom:12 }}>
              Edit Summary
            </div>
            {[
              ['Template',  tpl===POI_DEFAULT?'📊 POI Default':(templates.find(t=>t.id===tpl)?.originalName||'—')],
              ['Report',    name||'—'],
              ['Category',  category.replace(/_/g,' ')],
              ['Frequency', frequency.replace(/_/g,' ')],
              ['Format',    outputFormat],
              ['Source',    multiSheet?'📑 '+sheets.length+' sheet(s)':sqlQuery.trim()?'📋 SQL':'—'],
              ['Email',     recipients.trim()?recipients.split(',').filter(Boolean).length+' recipient(s)':'Not set'],
            ].map(([k,v])=>(
              <div key={k} style={{ display:'flex', justifyContent:'space-between', marginBottom:8,
                                    fontSize:12.5, fontFamily:font.sans }}>
                <span style={{ color:'#3B82F6', fontWeight:600 }}>{k}</span>
                <span style={{ color:'#1E3A5F', fontWeight:700, maxWidth:130, overflow:'hidden',
                               textOverflow:'ellipsis', whiteSpace:'nowrap', textAlign:'right' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
