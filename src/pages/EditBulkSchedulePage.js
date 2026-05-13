import React, { useState, useEffect } from 'react';
import { C, font, FREQS, FMTS } from '../theme';
import { TInput, Field, PrimaryBtn, GhostBtn, ErrBox, Divider, Pills, SelectInput } from '../components/UI';
import { bulkApi, templateApi } from '../api';
import FileNamePatternBuilder from '../components/FileNamePatternBuilder';

const POI_DEFAULT = '__poi_default__';
const CATS = ['TRANSACTION','BALANCE','STATEMENT','RECONCILIATION','CUSTOM'];

export default function EditBulkSchedulePage({ scheduleId, onSaved, onCancel }) {
  const [templates,  setTemplates]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [err,        setErr]        = useState('');
  const [tpl,        setTpl]        = useState(POI_DEFAULT);
  const [schName,    setSchName]    = useState('');
  const [category,   setCategory]   = useState('CUSTOM');
  const [frequency,  setFrequency]  = useState('MONTHLY');
  const [runTime,    setRunTime]    = useState('07:00');
  const [outputFmt,  setOutputFmt]  = useState('EXCEL');
  const [recipients, setRecipients] = useState('');
  const [notes,      setNotes]      = useState('');
  const [fileNaming, setFileNaming] = useState('{REPORT_NAME}_{ENTITY_ID}_{DATE}');
  const [localPath,  setLocalPath]  = useState('');
  const [srcTable,   setSrcTable]   = useState('');
  const [idColumn,   setIdColumn]   = useState('');
  const [idValues,   setIdValues]   = useState('');
  const [baseSql,    setBaseSql]    = useState('');
  const [autoDisc,   setAutoDisc]   = useState(false);
  const [instQuery,  setInstQuery]  = useState('');
  const [paramMap,   setParamMap]   = useState('{}');

  useEffect(() => {
    if (!scheduleId) return;
    bulkApi.get(scheduleId)
      .then(r => {
        setTpl(r.templateId || POI_DEFAULT);
        setSchName(r.scheduleName || '');
        setCategory(r.category || 'CUSTOM');
        setFrequency(r.frequency || 'MONTHLY');
        setRunTime(r.runTime || '07:00');
        setOutputFmt(r.outputFormat || 'EXCEL');
        setRecipients((r.recipients||[]).join(', '));
        setNotes(r.notes || '');
        setFileNaming(r.fileNamingPattern || '{REPORT_NAME}_{ENTITY_ID}_{DATE}');
        setLocalPath(r.localOutputPath || '');
        setSrcTable(r.sourceTable || '');
        setIdColumn(r.idColumn || '');
        setIdValues((r.idValues||[]).join(', '));
        setBaseSql(r.baseSql || '');
        setAutoDisc(r.autoDiscover || false);
        setInstQuery(r.institutionQuery || '');
        setParamMap(r.jrxmlParamMap || '{}');
        return templateApi.list(r.platformId, 0, 100);
      })
      .then(d => setTemplates(d?.content || d || []))
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [scheduleId]);

  const submit = async () => {
    if (!schName.trim()) return setErr('Schedule name is required.');
    if (!baseSql.trim()) return setErr('Base SQL is required.');
    const rcpts = recipients.split(',').map(e=>e.trim()).filter(Boolean);
    if (rcpts.some(e=>!e.includes('@'))) return setErr('One or more email addresses are invalid.');
    let parsedParam = null;
    try { parsedParam = JSON.parse(paramMap); } catch { return setErr('JRXML Param Map must be valid JSON.'); }
    setErr(''); setSaving(true);
    try {
      await bulkApi.update(scheduleId, {
        templateId:       tpl===POI_DEFAULT ? undefined : tpl,
        scheduleName:     schName, category, frequency,
        runTime:          frequency!=='ONE_TIME' ? runTime : undefined,
        outputFormat:     outputFmt, recipients: rcpts,
        sourceTable:      srcTable||undefined, idColumn:idColumn||undefined,
        idValues:         idValues.split(',').map(v=>v.trim()).filter(Boolean),
        baseSql, autoDiscover: autoDisc,
        institutionQuery: autoDisc ? instQuery : undefined,
        jrxmlParamMap:    JSON.stringify(parsedParam),
        fileNamingPattern:fileNaming||undefined,
        localOutputPath:  localPath||undefined,
        notes:            notes||undefined,
      });
      onSaved && onSaved();
    } catch(e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const monoArea = {
    display:'block', width:'100%', padding:'10px 12px', background:'#0a1520',
    color:'#E2E8F0', border:'none', outline:'none', resize:'vertical',
    fontFamily:font.mono, fontSize:13, lineHeight:'21px', boxSizing:'border-box',
    border:'1.5px solid #1e3550', borderRadius:3,
  };

  if (loading) return (
    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
                  color:C.muted, fontFamily:font.sans, fontSize:14 }}>
      Loading bulk schedule…
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
          ← Bulk Schedules
        </button>
        <span style={{ color:'#8A97A8', fontSize:13 }}>/</span>
        <span style={{ color:'#1A2332', fontSize:13, fontWeight:600 }}>
          Edit: {schName || '…'}
        </span>
      </div>

      {/* ── Scrollable body ── */}
      <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:20, maxWidth:1200 }}>

          {/* Main form */}
          <div style={{ background:'#fff', border:'1px solid #DDE3EC', borderRadius:4,
                        padding:'24px 28px', boxShadow:'0 1px 6px #1B3A5C06' }}>

            <Divider label="Schedule Identity" />
            <Field label="Template" hint="Optional">
              <SelectInput value={tpl} onChange={e=>setTpl(e.target.value)}>
                <option value={POI_DEFAULT}>📊 Default — Excel / CSV  (no template)</option>
                {templates.map(t=><option key={t.id} value={t.id}>{t.originalName||t.templateName}</option>)}
              </SelectInput>
            </Field>
            <Field label="Schedule Name">
              <TInput value={schName} onChange={e=>setSchName(e.target.value)}
                placeholder="e.g. All Institution Transaction Reports" />
            </Field>
            <Field label="Category">
              <SelectInput value={category} onChange={e=>setCategory(e.target.value)}>
                {CATS.map(c=><option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
              </SelectInput>
            </Field>

            <Divider label="Entity Selection" />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Source Table">
                <TInput value={srcTable} onChange={e=>setSrcTable(e.target.value)} placeholder="institution_master" />
              </Field>
              <Field label="ID Column">
                <TInput value={idColumn} onChange={e=>setIdColumn(e.target.value)} placeholder="institution_code" />
              </Field>
            </div>
            <Field label="Entity IDs (comma-separated)">
              <TInput value={idValues} onChange={e=>setIdValues(e.target.value)}
                placeholder="STP001, HDFC01, ICICI01" />
            </Field>

            {/* Auto-discover */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, cursor:'pointer' }}
              onClick={()=>setAutoDisc(!autoDisc)}>
              <div style={{ width:36, height:20, borderRadius:10, transition:'background 0.2s', flexShrink:0,
                            background:autoDisc?'#1A2332':'#DDE3EC', position:'relative' }}>
                <div style={{ position:'absolute', top:3, left:autoDisc?18:3, width:14, height:14,
                              borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
              </div>
              <span style={{ fontSize:13, fontWeight:700, color:autoDisc?'#1A2332':'#6B7A8D' }}>
                🔍 Auto-discover entities at run time
              </span>
            </div>
            {autoDisc && (
              <Field label="Institution Query">
                <textarea value={instQuery} rows={4} onChange={e=>setInstQuery(e.target.value)}
                  placeholder="SELECT institution_code, institution_name FROM institution_master"
                  style={monoArea} />
              </Field>
            )}

            <Divider label="Report SQL" />
            <Field label="Base SQL" hint="Use {{ENTITY_ID}} as placeholder for each entity">
              <textarea value={baseSql} rows={10} onChange={e=>setBaseSql(e.target.value)}
                placeholder={"SELECT *\nFROM transactions\nWHERE inst_code = '{{ENTITY_ID}}'"}
                style={monoArea} />
            </Field>
            <Field label="JRXML Parameter Map (JSON)">
              <textarea value={paramMap} rows={5} onChange={e=>setParamMap(e.target.value)}
                style={{ ...monoArea, fontSize:12 }} />
            </Field>

            <Divider label="Schedule" />
            <Field label="Frequency">
              <Pills options={FREQS} value={frequency} onChange={setFrequency} />
            </Field>
            {frequency!=='ONE_TIME'&&frequency!=='CUSTOM_CRON' && (
              <Field label="Run Time (UTC)">
                <TInput value={runTime} onChange={e=>setRunTime(e.target.value)} type="time" />
              </Field>
            )}

            <Divider label="Delivery" />
            <Field label="Output Format">
              <Pills options={FMTS} value={outputFmt} onChange={setOutputFmt} />
            </Field>
            <Field label="Recipients" hint="Optional — comma-separated">
              <TInput value={recipients} onChange={e=>setRecipients(e.target.value)}
                placeholder="finance@company.com  (optional)" />
            </Field>
            <FileNamePatternBuilder
              value={fileNaming} onChange={setFileNaming}
              ext={outputFmt==='PDF'?'.pdf':outputFmt==='EXCEL'?'.xlsx':'.csv'}
              localOutputPath={localPath} onLocalOutputPathChange={setLocalPath}
            />
            <Field label="Notes (optional)">
              <TInput value={notes} onChange={e=>setNotes(e.target.value)} rows={2}
                placeholder="Schedule scope or delivery notes…" />
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
              ['Schedule',   schName||'—'],
              ['Category',   category.replace(/_/g,' ')],
              ['Frequency',  frequency.replace(/_/g,' ')],
              ['Format',     outputFmt],
              ['Auto-disc.', autoDisc?'✅ On':'⚪ Off'],
              ['Template',   tpl===POI_DEFAULT?'📊 POI Default':(templates.find(t=>t.id===tpl)?.originalName||'—')],
              ['Email',      recipients.trim()?recipients.split(',').filter(Boolean).length+' recipient(s)':'Not set'],
            ].map(([k,v])=>(
              <div key={k} style={{ display:'flex', justifyContent:'space-between', marginBottom:8,
                                    fontSize:12.5, fontFamily:font.sans }}>
                <span style={{ color:'#3B82F6', fontWeight:600 }}>{k}</span>
                <span style={{ color:'#1E3A5F', fontWeight:700, maxWidth:130, overflow:'hidden',
                               textOverflow:'ellipsis', whiteSpace:'nowrap', textAlign:'right' }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop:14, padding:'10px 12px', background:'#DBEAFE',
                          borderRadius:3, fontSize:12, color:'#1D4ED8', fontFamily:font.sans }}>
              💡 Use <code>{'{{ENTITY_ID}}'}</code> in SQL to substitute each entity ID.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
