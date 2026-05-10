import React, { useState, useRef, useEffect } from 'react';
import { C, font } from '../theme';
import { PrimaryBtn, GhostBtn, ErrBox, Divider } from '../components/UI';
import { platformApi, queryApi } from '../api';




// ── SQL keyword highlighter ───────────────────────────────────────────────────
const SQL_KW = /\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|FULL|CROSS|ON|AND|OR|NOT|IN|IS|NULL|AS|GROUP\s+BY|ORDER\s+BY|HAVING|LIMIT|OFFSET|DISTINCT|COUNT|SUM|AVG|MIN|MAX|CASE|WHEN|THEN|ELSE|END|INSERT|UPDATE|DELETE|WITH|UNION|ALL|TOP|BETWEEN|LIKE|EXISTS|BY|ASC|DESC|INTO|VALUES|SET|CREATE|DROP|ALTER|TABLE|INDEX|VIEW|TRUNCATE|CAST|CONVERT|COALESCE|NULLIF|IIF|ISNULL|IFNULL|NOW|CURRENT_DATE|CURRENT_TIMESTAMP)\b/gi;


// ── Helpers ───────────────────────────────────────────────────────────────────
function toCSV(cols, rows) {
  const esc = v => '"' + String(v).replace(/"/g,'""') + '"';
  return [cols.map(esc).join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n');
}

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], {type: mime});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function exportExcel(cols, rows) {
  // Simple XLS via HTML table (universally supported)
  const header = '<tr>' + cols.map(c => `<th>${c}</th>`).join('') + '</tr>';
  const body   = rows.map(r => '<tr>' + cols.map(c => `<td>${r[c]}</td>`).join('') + '</tr>').join('');
  const html   = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"/></head><body><table>${header}${body}</table></body></html>`;
  downloadFile('query_result.xls', html, 'application/vnd.ms-excel');
}

// ── Line-number gutter editor ─────────────────────────────────────────────────
function SqlEditor({ value, onChange, onRun, running }) {
  const taRef     = useRef(null);
  const gutterRef = useRef(null);
  const lines     = value.split('\n').length || 1;

  const syncScroll = () => {
    if (gutterRef.current && taRef.current)
      gutterRef.current.scrollTop = taRef.current.scrollTop;
  };

  const handleKeyDown = (e) => {
    // Tab → 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = taRef.current;
      const s = el.selectionStart, en = el.selectionEnd;
      const next = value.slice(0,s) + '  ' + value.slice(en);
      onChange(next);
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 2; });
    }
    // Ctrl/Cmd+Enter → run
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); onRun(); }
  };

  return (
    <div style={{ position:'relative', display:'flex', borderRadius:3, overflow:'hidden', border:'1.5px solid #1e3550', background:'#0a1520', height:'100%' }}>
      {/* Gutter */}
      <div ref={gutterRef} style={{ width:44, background:'#0F1B2D', borderRight:'1px solid #1e3550', padding:'12px 0', overflowY:'hidden', flexShrink:0, userSelect:'none', pointerEvents:'none', height:'100%', boxSizing:'border-box' }}>
        {Array.from({length: lines}, (_,i) => (
          <div key={i} style={{ height:21, display:'flex', alignItems:'center', justifyContent:'flex-end', paddingRight:10, fontSize:12, fontFamily:font.mono, color:'#2e5070', lineHeight:'21px' }}>{i+1}</div>
        ))}
      </div>
      {/* Textarea */}
      <textarea
        ref={taRef}
        value={value}
        onChange={e => { onChange(e.target.value); syncScroll(); }}
        onScroll={syncScroll}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        placeholder={'-- Write your SQL query here\n-- Ctrl+Enter to run\n\nSELECT * FROM gl_accounts\nWHERE posting_date >= \'2026-01-01\'\nORDER BY posting_date DESC\nLIMIT 100'}
        style={{
          flex:1, padding:'12px 16px', background:'transparent',
          color:'#E2E8F0', fontSize:13.5, fontFamily:font.mono,
          lineHeight:'21px', border:'none', outline:'none',
          resize:'none',
          height:'100%',
          caretColor:'#60A5FA',
          overflowY:'auto',
        }}
      />
      {/* Run hint */}
      {!running && value.trim() && (
        <div style={{ position:'absolute', bottom:10, right:12, fontSize:11, color:'#2e5070', fontFamily:font.sans, pointerEvents:'none' }}>
          Ctrl+Enter to run
        </div>
      )}
    </div>
  );
}

// ── Result table ──────────────────────────────────────────────────────────────
function ResultTable({ result, page, setPage, pageSize }) {
  const totalPages = Math.ceil(result.rows.length / pageSize);
  const visRows    = result.rows.slice((page-1)*pageSize, page*pageSize);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Table scroll area */}
      <div style={{ flex:1, overflowX:'auto', overflowY:'auto' }}>
        <table style={{ borderCollapse:'collapse', width:'100%', minWidth: result.cols.length * 120 }}>
          <thead style={{ position:'sticky', top:0, zIndex:2 }}>
            <tr>
              <th style={{ ...thStyle, background:'#0F1B2D', color:'#4a7fa5', width:52 }}>#</th>
              {result.cols.map(c => (
                <th key={c} style={{ ...thStyle, background:'#0F1B2D', color:'#60A5FA', whiteSpace:'nowrap' }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visRows.map((row, ri) => (
              <tr key={ri} style={{ background: ri%2===0 ? '#0a1520' : '#0d1c2e' }}
                onMouseEnter={e => e.currentTarget.style.background='#1B3A5C'}
                onMouseLeave={e => e.currentTarget.style.background = ri%2===0 ? '#0a1520' : '#0d1c2e'}
              >
                <td style={{ ...tdStyle, color:'#2e5070', textAlign:'center', userSelect:'none' }}>{(page-1)*pageSize + ri + 1}</td>
                {result.cols.map(c => (
                  <td key={c} style={{ ...tdStyle, whiteSpace:'nowrap' }}>{row[c]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ padding:'10px 16px', background:'#0F1B2D', borderTop:'1px solid #1e3550', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <button onClick={() => setPage(1)}          disabled={page===1}          style={pgBtn(page===1)}>«</button>
          <button onClick={() => setPage(p=>p-1)}     disabled={page===1}          style={pgBtn(page===1)}>‹</button>
          <span style={{ fontSize:12.5, color:'#4a7fa5', fontFamily:font.sans, padding:'0 8px' }}>
            Page <strong style={{ color:'#60A5FA' }}>{page}</strong> of <strong style={{ color:'#60A5FA' }}>{totalPages}</strong>
          </span>
          <button onClick={() => setPage(p=>p+1)}     disabled={page===totalPages} style={pgBtn(page===totalPages)}>›</button>
          <button onClick={() => setPage(totalPages)} disabled={page===totalPages} style={pgBtn(page===totalPages)}>»</button>
          <span style={{ marginLeft:'auto', fontSize:12, color:'#2e5070', fontFamily:font.sans }}>
            Showing rows {(page-1)*pageSize+1}–{Math.min(page*pageSize, result.rows.length)} of {result.rows.length}
          </span>
        </div>
      )}
    </div>
  );
}

const thStyle = { padding:'9px 14px', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textAlign:'left', textTransform:'uppercase', borderBottom:'1px solid #1e3550', fontFamily:font.sans };
const tdStyle = { padding:'7px 14px', fontSize:12.5, color:'#CBD5E1', fontFamily:font.mono, borderBottom:'1px solid #0d1c2e', transition:'background 0.1s' };
const pgBtn = (dis) => ({ padding:'4px 9px', borderRadius:2, fontSize:13, background:'#1e3550', color: dis?'#1a3050':'#60A5FA', border:'1px solid #1e3550', cursor: dis?'not-allowed':'pointer', fontFamily:font.mono });

// ── HISTORY ITEM ─────────────────────────────────────────────────────────────
function HistoryItem({ item, onRestore }) {
  return (
    <div
      style={{ padding:'10px 14px', borderBottom:'1px solid #1e3550', cursor:'pointer', transition:'background 0.15s' }}
      onClick={() => onRestore(item)}
      onMouseEnter={e=>e.currentTarget.style.background='#0F1B2D'}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
    >
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:3 }}>
        <span style={{ fontSize:11.5, color: item.ok ? '#4ade80' : '#f87171', fontFamily:font.sans, fontWeight:700 }}>
          {item.ok ? '✓' : '✗'} {item.platform}
        </span>
        <span style={{ fontSize:11, color:'#2e5070', fontFamily:font.mono }}>{item.time}</span>
      </div>
      <div style={{ fontSize:12, color:'#60A5FA', fontFamily:font.mono, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {item.sql}
      </div>
      {item.ok && <div style={{ fontSize:11, color:'#2e5070', fontFamily:font.sans, marginTop:2 }}>{item.rowCount} rows · {item.ms}ms</div>}
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 50;

export default function QueryRunnerPage() {
  const [platforms,  setPlatforms]  = useState([]);
  const [platformId, setPlatformId] = useState('');
  const [sql,        setSql]        = useState('');
  const [running,    setRunning]    = useState(false);
  const [result,     setResult]     = useState(null);
  const [err,        setErr]        = useState('');
  const [page,       setPage]       = useState(1);
  const [history,    setHistory]    = useState([]);
  const [showHistory,setShowHistory]= useState(true);
  const [exporting,  setExporting]  = useState('');

  const platform = platforms.find(p => p.id === platformId) || platforms[0] || {};

  // Load registered platforms from API
  useEffect(() => {
    platformApi.list(0, 100, 'ACTIVE').then(d => {
      const list = d.content || [];
      setPlatforms(list);
      if (list.length > 0) setPlatformId(list[0].id);
    }).catch(() => setErr('Failed to load platforms.'));
  }, []);

  const runQuery = async () => {
    if (!sql.trim()) return setErr('Write a SQL query first.');
    if (!platformId)  return setErr('Select a platform first.');
    setErr(''); setRunning(true); setResult(null); setPage(1);
    const start = Date.now();
    try {
      const res = await queryApi.execute(platformId, sql, 500);
      const ms  = Date.now() - start;
      const rows = res.rows || [];
      const cols = res.columns || (rows.length > 0 ? Object.keys(rows[0]) : []);
      const ok   = { ok:true, rows, cols, rowCount: res.rowCount ?? rows.length, ms,
                     platform: platform.platformName, db: platform.dbName || '' };
      setResult(ok);
      const now  = new Date();
      const time = now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
      setHistory(h => [{ sql: sql.slice(0,80).replace(/\s+/g,' '), platform: platform.platformName,
                          time, ok:true, rowCount: ok.rowCount, ms, fullSql:sql, platformId },
                       ...h.slice(0,29)]);
    } catch (e) {
      const ms = Date.now() - start;
      const msg = e.message || 'Query execution failed.';
      setResult({ ok:false, msg });
      const now  = new Date();
      const time = now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
      setHistory(h => [{ sql: sql.slice(0,80).replace(/\s+/g,' '), platform: platform.platformName,
                          time, ok:false, rowCount:0, ms, fullSql:sql, platformId },
                       ...h.slice(0,29)]);
    } finally {
      setRunning(false);
    }
  };

  const clearAll = () => { setSql(''); setResult(null); setErr(''); setPage(1); };

  const handleExportCSV = () => {
    if (!result || !result.ok) return;
    setExporting('csv');
    setTimeout(() => {
      downloadFile('query_result.csv', toCSV(result.cols, result.rows), 'text/csv');
      setExporting('');
    }, 200);
  };

  const handleExportExcel = () => {
    if (!result || !result.ok) return;
    setExporting('xls');
    setTimeout(() => {
      exportExcel(result.cols, result.rows);
      setExporting('');
    }, 200);
  };

  const restoreFromHistory = (item) => {
    setSql(item.fullSql);
    setPlatformId(item.platformId);
    setResult(null); setErr(''); setPage(1);
  };

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', height:'100vh', background:C.bg, overflow:'hidden' }}>

      {/* ── Top bar ── */}
      <div style={{ padding:'16px 24px', background:C.white, borderBottom:'1px solid '+C.border, display:'flex', alignItems:'center', gap:16, flexShrink:0 }}>
        <div style={{ flex:1 }}>
          <h1 style={{ margin:0, fontSize:18, fontWeight:700, color:C.navyD, fontFamily:font.serif }}>Query Runner</h1>
          <p style={{ margin:'2px 0 0', fontSize:12.5, color:C.slateL, fontFamily:font.sans }}>Execute SQL against registered platforms and export results</p>
        </div>
        {/* Platform selector */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:11.5, color:C.muted, fontFamily:font.sans, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>Platform</span>
          <select
            value={platformId}
            onChange={e => { setPlatformId(e.target.value); setResult(null); setErr(''); }}
            style={{ padding:'8px 12px', borderRadius:3, border:'1.5px solid '+C.border, fontSize:13, fontFamily:font.sans, color:C.navyD, background:C.white, outline:'none', cursor:'pointer', minWidth:200 }}
          >
            {platforms.length === 0
              ? <option value="">Loading platforms…</option>
              : platforms.map(p => (
                  <option key={p.id} value={p.id}>{p.platformName}</option>
                ))
            }
          </select>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:C.green }} />
          <span style={{ fontSize:12, color:C.green, fontFamily:font.sans, fontWeight:700 }}>Connected</span>
        </div>
      </div>

      {/* ── Body: Editor | History sidebar ── */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* ── Main panel ── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', padding:'20px 24px', gap:16 }}>

          {/* Editor card — fixed 280px, results panel fills the rest */}
          <div style={{ background:'#0a1520', border:'1px solid #1e3550', borderRadius:4, display:'flex', flexDirection:'column', height:280, flexShrink:0, boxShadow:'0 2px 12px #0003' }}>
            {/* Editor toolbar */}
            <div style={{ padding:'10px 16px', borderBottom:'1px solid #1e3550', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:11.5, color:'#4a7fa5', fontFamily:font.sans, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', flex:1 }}>
                SQL Editor — {platform.dbType || 'No platform'} · {platform.dbName || ''}
              </span>
              <button onClick={clearAll} style={{ padding:'4px 10px', fontSize:12, background:'transparent', color:'#4a7fa5', border:'1px solid #1e3550', borderRadius:2, cursor:'pointer', fontFamily:font.sans }}>Clear</button>
              <button
                onClick={runQuery}
                disabled={running || !sql.trim()}
                style={{
                  display:'flex', alignItems:'center', gap:6, padding:'6px 18px', borderRadius:2,
                  background: running||!sql.trim() ? '#1a2a3a' : C.navy,
                  color:      running||!sql.trim() ? '#2e5070' : C.white,
                  border:    '1.5px solid ' + (running||!sql.trim() ? '#1e3550' : C.navyL),
                  cursor:     running||!sql.trim() ? 'not-allowed' : 'pointer',
                  fontSize:13, fontFamily:font.sans, fontWeight:700, letterSpacing:'0.06em',
                }}
              >
                <span style={{ fontSize:14 }}>{running ? '⏳' : '▶'}</span>
                {running ? 'Running…' : 'Run Query'}
              </button>
            </div>

            <div style={{ flex:1, overflow:'hidden', minHeight:0 }}><SqlEditor value={sql} onChange={v => { setSql(v); setErr(''); }} onRun={runQuery} running={running} /></div>

            {/* Quick templates */}
            <div style={{ padding:'8px 16px', borderTop:'1px solid #0d1c2e', display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
              <span style={{ fontSize:11, color:'#2e5070', fontFamily:font.sans, marginRight:4 }}>Templates:</span>
              {[
                ['GL Accounts',  "SELECT * FROM gl_accounts WHERE posting_date >= '2026-01-01' ORDER BY posting_date DESC LIMIT 100"],
                ['AR Aging',     "SELECT customer_name, invoice_no, due_date, outstanding, aging_bucket\nFROM ar_aging\nWHERE aging_bucket != 'Current'\nORDER BY outstanding DESC"],
                ['P&L Summary',  "SELECT line_item, budget, actual,\n       (actual - budget) AS variance\nFROM pl_summary\nWHERE period = 'Q1-26'\nORDER BY actual DESC"],
                ['Cash Flow',    "SELECT activity_type, description, inflow, outflow, net_cashflow\nFROM cashflow\nWHERE period = 'Jan-26'"],
              ].map(([label, q]) => (
                <button key={label} onClick={() => { setSql(q); setResult(null); setErr(''); }} style={{ padding:'3px 9px', fontSize:11.5, background:'#0F1B2D', color:'#4a7fa5', border:'1px solid #1e3550', borderRadius:2, cursor:'pointer', fontFamily:font.sans, transition:'all 0.15s' }}
                  onMouseEnter={e=>{e.target.style.color='#60A5FA';e.target.style.borderColor='#2E6DA4';}}
                  onMouseLeave={e=>{e.target.style.color='#4a7fa5';e.target.style.borderColor='#1e3550';}}
                >{label}</button>
              ))}
            </div>
          </div>

          {/* Error */}
          {err && <ErrBox msg={err} />}

          {/* Results panel */}
          {result && (
            <div style={{ flex:1, background:'#0a1520', border:'1px solid #1e3550', borderRadius:4, display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 2px 12px #0003', minHeight:0 }}>

              {/* Results toolbar */}
              <div style={{ padding:'10px 16px', borderBottom:'1px solid #1e3550', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                {result.ok ? (
                  <>
                    <span style={{ fontSize:14 }}>✅</span>
                    <div style={{ flex:1 }}>
                      <span style={{ fontSize:13.5, fontWeight:700, color:'#4ade80', fontFamily:font.sans }}>
                        {result.rowCount.toLocaleString()} rows returned
                      </span>
                      <span style={{ fontSize:12, color:'#2e5070', fontFamily:font.mono, marginLeft:12 }}>
                        {result.ms}ms · {result.cols.length} columns · {result.db}
                      </span>
                    </div>
                    {/* Export buttons */}
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:11.5, color:'#4a7fa5', fontFamily:font.sans, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>Export</span>
                      <button
                        onClick={handleExportCSV}
                        disabled={exporting==='csv'}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:2, background:exporting==='csv'?'#1a2a3a':'#0F1B2D', color:exporting==='csv'?'#2e5070':'#60A5FA', border:'1.5px solid '+(exporting==='csv'?'#1e3550':'#2E6DA4'), cursor:exporting==='csv'?'not-allowed':'pointer', fontSize:12.5, fontFamily:font.sans, fontWeight:700 }}
                      >
                        <span>📄</span>{exporting==='csv'?'Exporting…':'CSV'}
                      </button>
                      <button
                        onClick={handleExportExcel}
                        disabled={exporting==='xls'}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:2, background:exporting==='xls'?'#14532d':'#0a1f12', color:exporting==='xls'?'#2e5070':'#4ade80', border:'1.5px solid '+(exporting==='xls'?'#1e3550':'#166534'), cursor:exporting==='xls'?'not-allowed':'pointer', fontSize:12.5, fontFamily:font.sans, fontWeight:700 }}
                      >
                        <span>📊</span>{exporting==='xls'?'Exporting…':'Excel (.xls)'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize:14 }}>❌</span>
                    <span style={{ fontSize:13.5, fontWeight:700, color:'#f87171', fontFamily:font.sans, flex:1 }}>Query Error</span>
                  </>
                )}
              </div>

              {/* Result content */}
              {result.ok ? (
                <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', minHeight:0 }}>
                  <ResultTable result={result} page={page} setPage={setPage} pageSize={PAGE_SIZE} />
                </div>
              ) : (
                <div style={{ padding:'24px 20px' }}>
                  <div style={{ background:'#1f0a0a', border:'1px solid #7f1d1d', borderRadius:3, padding:'14px 18px' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#f87171', fontFamily:font.sans, marginBottom:6 }}>Execution Error</div>
                    <div style={{ fontSize:13, color:'#fca5a5', fontFamily:font.mono }}>{result.msg}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!result && !running && (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:10, background:'#0a1520', border:'1px solid #1e3550', borderRadius:4, minHeight:160 }}>
              <span style={{ fontSize:32 }}>🔍</span>
              <span style={{ fontSize:14, color:'#2e5070', fontFamily:font.sans }}>Write a query and press Run to see results here</span>
            </div>
          )}

          {running && (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, background:'#0a1520', border:'1px solid #1e3550', borderRadius:4, minHeight:160 }}>
              <div style={{ width:36, height:36, borderRadius:'50%', border:'3px solid #1e3550', borderTopColor:'#60A5FA', animation:'spin 0.8s linear infinite' }} />
              <span style={{ fontSize:13.5, color:'#4a7fa5', fontFamily:font.sans }}>Executing query on <strong style={{ color:'#60A5FA' }}>{platform.name}</strong>…</span>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}
        </div>

        {/* ── History sidebar ── */}
        <div style={{ width: showHistory ? 280 : 36, background:'#0a1520', borderLeft:'1px solid #1e3550', display:'flex', flexDirection:'column', flexShrink:0, transition:'width 0.2s', overflow:'hidden' }}>
          {/* Sidebar toggle */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{ padding:'12px', background:'transparent', border:'none', borderBottom:'1px solid #1e3550', cursor:'pointer', color:'#4a7fa5', fontSize:16, display:'flex', alignItems:'center', justifyContent: showHistory ? 'flex-end' : 'center', gap:8, flexShrink:0 }}
          >
            {showHistory && <span style={{ fontSize:11, color:'#4a7fa5', fontFamily:font.sans, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>Query History</span>}
            <span style={{ fontSize:14 }}>{showHistory ? '»' : '«'}</span>
          </button>

          {showHistory && (
            <div style={{ flex:1, overflowY:'auto' }}>
              {history.length === 0 ? (
                <div style={{ padding:20, textAlign:'center', color:'#2e5070', fontSize:12.5, fontFamily:font.sans }}>
                  No queries run yet.<br />Queries appear here after execution.
                </div>
              ) : history.map((h,i) => (
                <HistoryItem key={i} item={h} onRestore={restoreFromHistory} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
