import React, { useState, useEffect } from 'react';
import { C, font } from '../theme';
import { platformApi, schemaApi } from '../api';

const D = {
  bg0:'#F5F7FA', bg1:'#FFFFFF', bg2:'#F0F2F5',
  border:'#DDE3EC', text:'#1A2332', dim:'#4A5568', faint:'#8A97A8',
  blue:'#0066CC', green:'#00A651', red:'#D0021B', amber:'#F5A623', purple:'#7C3AED',
};

/* ── Stat card ─────────────────────────────────────────────────────── */
function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ background:D.bg2, border:'1px solid '+D.border,
                  borderLeft:'3px solid '+color, borderRadius:4,
                  padding:'14px 18px', display:'flex', alignItems:'center', gap:14 }}>
      <span style={{ fontSize:24 }}>{icon}</span>
      <div>
        <div style={{ fontSize:10.5, fontWeight:700, color:D.dim, textTransform:'uppercase',
                      letterSpacing:'0.1em', fontFamily:font.sans, marginBottom:3 }}>{label}</div>
        <div style={{ fontSize:22, fontWeight:700, color, fontFamily:font.serif }}>{value}</div>
      </div>
    </div>
  );
}

/* ── Column picker modal ────────────────────────────────────────────── */
function ColumnPickerModal({ columns, tableName, onPick, onClose }) {
  return (
    <div onClick={onClose}
      style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(6,14,24,0.85)',
               backdropFilter:'blur(4px)', display:'flex', alignItems:'center',
               justifyContent:'center', padding:24 }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background:D.bg2, border:'1px solid '+D.border, borderRadius:4,
                 width:'100%', maxWidth:400, boxShadow:'0 24px 64px #0005', overflow:'hidden' }}>
        <div style={{ height:3, background:'linear-gradient(90deg,'+D.blue+','+D.green+')' }} />
        <div style={{ padding:'18px 22px 14px', borderBottom:'1px solid '+D.border }}>
          <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:'#1A2332', fontFamily:font.serif }}>
            Choose ID Column
          </h3>
          <p style={{ margin:'4px 0 0', fontSize:12.5, color:D.dim, fontFamily:font.sans }}>
            Select which column from <code style={{ color:D.blue, fontFamily:font.mono,
              background:D.bg1, padding:'1px 6px', borderRadius:2 }}>{tableName}</code> to use as the filter
          </p>
        </div>
        <div style={{ maxHeight:320, overflowY:'auto' }}>
          {columns.map(col => (
            <button key={col} onClick={() => onPick(col)}
              style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                       width:'100%', padding:'11px 22px', border:'none',
                       borderBottom:'1px solid '+D.faint+'33', background:'transparent',
                       cursor:'pointer', transition:'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background = D.bg1}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span style={{ fontSize:13.5, fontFamily:font.mono, color:D.text }}>{col}</span>
              {/id|_id|key|code/i.test(col) && (
                <span style={{ fontSize:10.5, padding:'2px 7px', borderRadius:2,
                               background:D.blue+'22', color:D.blue,
                               fontFamily:font.sans, fontWeight:700 }}>suggested</span>
              )}
            </button>
          ))}
        </div>
        <div style={{ padding:'14px 22px', borderTop:'1px solid '+D.border,
                      display:'flex', justifyContent:'flex-end' }}>
          <button onClick={onClose}
            style={{ padding:'8px 18px', borderRadius:3, border:'1px solid '+D.border,
                     background:'transparent', color:D.dim, cursor:'pointer',
                     fontSize:13, fontFamily:font.sans }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ── Schedule Modal (single or multi-row) ───────────────────────────── */
function ScheduleRowModal({ rows, columns, idColumn, tableName, platformId, platformName, onSchedule, onClose }) {
  const isMulti     = rows.length > 1;
  const [pickedCol, setPickedCol]  = useState(idColumn);
  const [showPicker, setShowPicker] = useState(!idColumn);

  if (showPicker) return (
    <ColumnPickerModal columns={columns} tableName={tableName}
      onPick={col => { setPickedCol(col); setShowPicker(false); }}
      onClose={onClose} />
  );

  // Collect unique values from the selected rows for the picked column
  const idValues = [...new Set(rows.map(r => r[pickedCol]).filter(v => v != null).map(String))];

  const buildSql = () => {
    if (isMulti) {
      const vals = idValues.map(v => `'${v}'`).join(', ');
      return `SELECT *\nFROM ${tableName}\nWHERE ${pickedCol} IN (${vals})`;
    }
    return `SELECT *\nFROM ${tableName}\nWHERE ${pickedCol} = '${idValues[0]}'`;
  };

  const handleSchedule = () => {
    onSchedule({
      platformId,
      platformName,
      tableName,
      idColumn:  pickedCol,
      idValue:   isMulti ? idValues.join(', ') : idValues[0],
      idValues,
      isMulti,
      rows,
      columns,
    });
  };

  return (
    <div onClick={onClose}
      style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(6,14,24,0.85)',
               backdropFilter:'blur(4px)', display:'flex', alignItems:'center',
               justifyContent:'center', padding:24 }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background:D.bg2, border:'1px solid '+D.border, borderRadius:4,
                 width:'100%', maxWidth:560, boxShadow:'0 24px 64px #0005', overflow:'hidden' }}>
        <div style={{ height:3, background:'linear-gradient(90deg,#1B3A5C,'+D.blue+')' }} />
        <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid '+D.border }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
            <div>
              <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:'#1A2332', fontFamily:font.serif }}>
                📅 Schedule Report {isMulti ? `for ${rows.length} Records` : 'for this Record'}
              </h3>
              <p style={{ margin:'4px 0 0', fontSize:12.5, color:D.dim, fontFamily:font.sans }}>
                The schedule form will be pre-filled with a SQL query filtered to {isMulti ? 'the selected records' : 'this record'}
              </p>
            </div>
            <button onClick={onClose}
              style={{ background:'none', border:'none', cursor:'pointer',
                       fontSize:18, color:D.faint, padding:'0 0 0 12px' }}>✕</button>
          </div>
        </div>

        <div style={{ padding:'16px 24px' }}>
          {/* Selected records summary */}
          <div style={{ background:D.bg1, border:'1px solid '+D.border, borderRadius:3,
                        padding:'12px 16px', marginBottom:14 }}>
            <div style={{ fontSize:10.5, fontWeight:700, color:D.dim, textTransform:'uppercase',
                          letterSpacing:'0.1em', fontFamily:font.sans, marginBottom:8 }}>
              {isMulti ? `${rows.length} Records Selected` : 'Selected Record'}
            </div>
            {isMulti ? (
              /* multi: show scrollable list of id values */
              <div style={{ maxHeight:100, overflowY:'auto', display:'flex',
                            flexWrap:'wrap', gap:6 }}>
                {idValues.map((v, i) => (
                  <code key={i} style={{ fontSize:12, fontFamily:font.mono, color:D.blue,
                                         background:D.bg2, padding:'2px 8px', borderRadius:2,
                                         border:'1px solid '+D.border }}>
                    {v}
                  </code>
                ))}
              </div>
            ) : (
              /* single: show field grid */
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px 16px' }}>
                {columns.slice(0,8).map(col => (
                  <div key={col} style={{ display:'flex', gap:8, alignItems:'baseline' }}>
                    <span style={{ fontSize:11, color:D.faint, fontFamily:font.mono,
                                   whiteSpace:'nowrap', flexShrink:0 }}>{col}:</span>
                    <span style={{ fontSize:12.5, fontFamily:font.mono, overflow:'hidden',
                                   textOverflow:'ellipsis', whiteSpace:'nowrap',
                                   color: col===pickedCol ? D.blue : D.text,
                                   fontWeight: col===pickedCol ? 700 : 400 }}>
                      {rows[0][col]==null ? 'null' : String(rows[0][col])}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filter column */}
          <div style={{ background:'#E6F5ED', border:'1px solid #14532d', borderRadius:3,
                        padding:'12px 16px', marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:10.5, fontWeight:700, color:'#00A651',
                             textTransform:'uppercase', letterSpacing:'0.1em', fontFamily:font.sans }}>
                Filter Column
              </span>
              <button onClick={() => setShowPicker(true)}
                style={{ fontSize:11.5, color:D.blue, background:'none', border:'none',
                         cursor:'pointer', fontFamily:font.sans, padding:0, textDecoration:'underline' }}>
                change
              </button>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
              <code style={{ fontSize:14, fontFamily:font.mono, color:D.blue,
                             background:D.bg1, padding:'4px 10px', borderRadius:2,
                             border:'1px solid '+D.border }}>{pickedCol}</code>
              <span style={{ color:D.faint }}>{isMulti ? 'IN' : '='}</span>
              {isMulti ? (
                <span style={{ fontSize:12.5, color:'#00A651', fontFamily:font.mono }}>
                  ({idValues.length} values)
                </span>
              ) : (
                <code style={{ fontSize:14, fontFamily:font.mono, color:'#00A651',
                               background:D.bg1, padding:'4px 10px', borderRadius:2,
                               border:'1px solid #14532d' }}>{idValues[0]}</code>
              )}
            </div>
          </div>

          {/* SQL preview */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:10.5, fontWeight:700, color:D.dim, textTransform:'uppercase',
                          letterSpacing:'0.1em', fontFamily:font.sans, marginBottom:6 }}>
              SQL pre-fill
            </div>
            <pre style={{ margin:0, padding:'12px 14px', background:'#F0F2F5',
                          border:'1px solid '+D.border, borderRadius:3, overflowX:'auto',
                          fontSize:12.5, fontFamily:font.mono, color:'#1A2332', lineHeight:1.6 }}>
              {buildSql()}
            </pre>
          </div>
        </div>

        <div style={{ padding:'0 24px 20px', display:'flex', gap:10 }}>
          <button onClick={handleSchedule}
            style={{ flex:1, padding:'11px 0', borderRadius:3, fontSize:14, fontWeight:700,
                     fontFamily:font.sans, cursor:'pointer', background:C.navy,
                     color:'#fff', border:'none', display:'flex', alignItems:'center',
                     justifyContent:'center', gap:8 }}>
            📅 Go to Schedule Form →
          </button>
          <button onClick={onClose}
            style={{ padding:'11px 18px', borderRadius:3, fontSize:13, fontFamily:font.sans,
                     cursor:'pointer', background:'transparent', color:D.dim,
                     border:'1px solid '+D.border }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ── Data grid with multi-select + select all ───────────────────────── */
function DataGrid({ columns, rows, emptyMsg, onRowSchedule, tableName }) {
  const [pg,           setPg]          = useState(1);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showModal,    setShowModal]    = useState(false);
  const [idColumn,     setIdColumn]     = useState(null);
  const PG = 50;

  useEffect(() => { setPg(1); setSelectedRows(new Set()); }, [columns, rows]);

  // Auto-detect ID column
  useEffect(() => {
    if (!columns || !columns.length) return;
    const idCol = columns.find(c => /^id$|_id$|^merchant_id$|^bank_id$/i.test(c))
               || columns.find(c => /id|key|code/i.test(c))
               || columns[0];
    setIdColumn(idCol || null);
  }, [columns]);

  if (!columns || columns.length === 0) {
    return (
      <div style={{ padding:40, textAlign:'center', color:D.faint,
                    fontFamily:font.sans, fontSize:14 }}>{emptyMsg}</div>
    );
  }

  const total      = rows.length;
  const pages      = Math.ceil(total / PG);
  const slice      = rows.slice((pg-1)*PG, pg*PG);
  const allSelected = selectedRows.size === total && total > 0;
  const someSelected = selectedRows.size > 0 && !allSelected;
  const selectedList = rows.filter((_, i) => selectedRows.has(i));

  const toggleRow = (absIdx) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      next.has(absIdx) ? next.delete(absIdx) : next.add(absIdx);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(rows.map((_, i) => i)));
    }
  };

  const togglePage = () => {
    const pageIndices = slice.map((_, ri) => (pg-1)*PG + ri);
    const allPageSelected = pageIndices.every(i => selectedRows.has(i));
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (allPageSelected) pageIndices.forEach(i => next.delete(i));
      else                  pageIndices.forEach(i => next.add(i));
      return next;
    });
  };

  const TH = {
    padding:'9px 14px', fontSize:11, fontWeight:700, letterSpacing:'0.08em',
    textAlign:'left', textTransform:'uppercase', whiteSpace:'nowrap',
    borderBottom:'1px solid '+D.border, fontFamily:font.sans,
    background:D.bg2, color:D.blue, position:'sticky', top:0, zIndex:2,
  };

  const pageIndices      = slice.map((_, ri) => (pg-1)*PG + ri);
  const allPageSelected  = pageIndices.length > 0 && pageIndices.every(i => selectedRows.has(i));
  const somePageSelected = pageIndices.some(i => selectedRows.has(i));

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0 }}>
      {/* Schedule modal */}
      {showModal && selectedList.length > 0 && (
        <ScheduleRowModal
          rows={selectedList}
          columns={columns}
          idColumn={idColumn}
          tableName={tableName}
          platformId={onRowSchedule.platformId}
          platformName={onRowSchedule.platformName}
          onSchedule={ctx => { setShowModal(false); onRowSchedule.fn(ctx); }}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Selection toolbar */}
      <div style={{ padding:'7px 14px', background:'#EAECF0',
                    borderBottom:'1px solid '+D.border, flexShrink:0,
                    display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>

        {/* Select all / page toggles */}
        <button onClick={toggleAll}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px',
                   borderRadius:2, fontSize:12.5, fontFamily:font.sans, fontWeight:600,
                   cursor:'pointer', transition:'all 0.15s',
                   background: allSelected ? D.blue+'33' : D.bg2,
                   color: allSelected ? D.blue : D.dim,
                   border:'1px solid '+(allSelected ? D.blue : D.border) }}>
          <span style={{ fontSize:14, lineHeight:1 }}>{allSelected ? '☑' : someSelected ? '⊟' : '☐'}</span>
          {allSelected ? `All ${total} selected` : `Select All (${total})`}
        </button>

        <button onClick={togglePage}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px',
                   borderRadius:2, fontSize:12.5, fontFamily:font.sans, fontWeight:600,
                   cursor:'pointer', transition:'all 0.15s',
                   background: allPageSelected ? D.green+'22' : D.bg2,
                   color: allPageSelected ? D.green : D.dim,
                   border:'1px solid '+(allPageSelected ? D.green : D.border) }}>
          <span style={{ fontSize:14, lineHeight:1 }}>{allPageSelected ? '☑' : somePageSelected ? '⊟' : '☐'}</span>
          {allPageSelected ? 'Page deselected' : `Select Page (${slice.length})`}
        </button>

        {selectedRows.size > 0 && (
          <button onClick={() => setSelectedRows(new Set())}
            style={{ padding:'5px 10px', borderRadius:2, fontSize:12, fontFamily:font.sans,
                     cursor:'pointer', background:'transparent', color:D.faint,
                     border:'1px solid '+D.border }}>
            ✕ Clear
          </button>
        )}

        {/* Selection count + schedule button */}
        {selectedRows.size > 0 ? (
          <>
            <span style={{ fontSize:12.5, color:D.green, fontFamily:font.sans, fontWeight:700 }}>
              ✓ {selectedRows.size} row{selectedRows.size !== 1 ? 's' : ''} selected
              {idColumn && selectedRows.size === 1 && (
                <span style={{ color:D.dim, fontWeight:400 }}>
                  {' '}— {idColumn}:{' '}
                  <strong style={{ color:D.blue, fontFamily:font.mono }}>
                    {String(selectedList[0]?.[idColumn] ?? '')}
                  </strong>
                </span>
              )}
            </span>
            <button onClick={() => setShowModal(true)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 16px',
                       borderRadius:3, background:C.navy, color:'#fff', border:'none',
                       cursor:'pointer', fontSize:12.5, fontFamily:font.sans, fontWeight:700,
                       marginLeft:4 }}>
              📅 Schedule Report for {selectedRows.size === 1 ? 'this Record' : `${selectedRows.size} Records`} →
            </button>
          </>
        ) : (
          <span style={{ fontSize:11.5, color:D.faint, fontFamily:font.sans }}>
            Click rows or use checkboxes to select, then schedule a filtered report
          </span>
        )}
      </div>

      {/* Table */}
      <div style={{ flex:1, overflowX:'auto', overflowY:'auto' }}>
        <table style={{ borderCollapse:'collapse', width:'100%',
                        minWidth: columns.length * 130 }}>
          <thead>
            <tr>
              {/* Header checkbox */}
              <th style={{ ...TH, width:44, textAlign:'center', cursor:'pointer' }}
                  onClick={togglePage} title="Toggle page selection">
                <span style={{ fontSize:15 }}>
                  {allPageSelected ? '☑' : somePageSelected ? '⊟' : '☐'}
                </span>
              </th>
              <th style={{ ...TH, width:44, color:D.faint, textAlign:'center' }}>#</th>
              {columns.map(c => (
                <th key={c} style={{ ...TH, color: c === idColumn ? '#F5A623' : D.blue }}
                    title={c === idColumn ? 'ID column (used for filtering)' : ''}>
                  {c === idColumn ? '🔑 ' : ''}{c}
                </th>
              ))}
              <th style={{ ...TH, width:56 }}></th>
            </tr>
          </thead>
          <tbody>
            {slice.map((row, ri) => {
              const absIdx    = (pg-1)*PG + ri;
              const isSelected = selectedRows.has(absIdx);
              return (
                <tr key={ri}
                  onClick={() => toggleRow(absIdx)}
                  style={{ background: isSelected ? '#00A99D' : ri%2===0 ? D.bg0 : D.bg1,
                           cursor:'pointer', transition:'background 0.1s',
                           outline: isSelected ? '2px solid '+D.blue : 'none',
                           outlineOffset:'-1px' }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background='#E6F0FF'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background=ri%2===0?D.bg0:D.bg1; }}>
                  {/* Checkbox cell */}
                  <td onClick={e => { e.stopPropagation(); toggleRow(absIdx); }}
                    style={{ padding:'7px 14px', textAlign:'center', fontSize:15,
                             color: isSelected ? D.blue : D.faint,
                             borderBottom:'1px solid #0d1c2e', cursor:'pointer' }}>
                    {isSelected ? '☑' : '☐'}
                  </td>
                  {/* Row number */}
                  <td style={{ padding:'7px 14px', textAlign:'center', fontSize:11.5,
                               color: isSelected ? D.blue : D.faint,
                               fontFamily:font.mono, borderBottom:'1px solid #0d1c2e' }}>
                    {absIdx + 1}
                  </td>
                  {/* Data cells */}
                  {columns.map(c => (
                    <td key={c}
                      style={{ padding:'7px 14px', fontSize:12.5,
                               color: c===idColumn ? '#F5A623' : row[c]==null ? D.faint : D.text,
                               fontFamily:font.mono, borderBottom:'1px solid #0d1c2e',
                               fontWeight: c===idColumn ? 700 : 400,
                               whiteSpace:'nowrap', maxWidth:200,
                               overflow:'hidden', textOverflow:'ellipsis' }}
                      title={row[c]==null ? '' : String(row[c])}>
                      {row[c]==null
                        ? <em style={{ fontStyle:'italic', color:D.faint }}>null</em>
                        : String(row[c])}
                    </td>
                  ))}
                  {/* Quick schedule button */}
                  <td style={{ padding:'4px 8px', borderBottom:'1px solid #0d1c2e', textAlign:'center' }}>
                    <button
                      onClick={e => { e.stopPropagation(); setSelectedRows(new Set([absIdx])); setShowModal(true); }}
                      title="Schedule report for this record"
                      style={{ padding:'3px 8px', borderRadius:2, background:D.bg1,
                               color:D.blue, border:'1px solid '+D.border,
                               cursor:'pointer', fontSize:12, fontFamily:font.sans }}>
                      📅
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ padding:'8px 16px', background:D.bg2, borderTop:'1px solid '+D.border,
                      display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          {[['«',1],['‹',pg-1]].map(([l,to]) => (
            <button key={l} onClick={() => setPg(Math.max(1,to))} disabled={pg===1}
              style={{ padding:'3px 9px', borderRadius:2, background:D.bg1,
                       color:pg===1?D.faint:D.blue, border:'1px solid '+D.border,
                       cursor:pg===1?'not-allowed':'pointer', fontFamily:font.mono }}>
              {l}
            </button>
          ))}
          <span style={{ fontSize:12, color:D.dim, fontFamily:font.sans, padding:'0 6px' }}>
            Page <strong style={{ color:D.blue }}>{pg}</strong> / <strong style={{ color:D.blue }}>{pages}</strong>
          </span>
          {[['›',pg+1],['»',pages]].map(([l,to]) => (
            <button key={l} onClick={() => setPg(Math.min(pages,to))} disabled={pg===pages}
              style={{ padding:'3px 9px', borderRadius:2, background:D.bg1,
                       color:pg===pages?D.faint:D.blue, border:'1px solid '+D.border,
                       cursor:pg===pages?'not-allowed':'pointer', fontFamily:font.mono }}>
              {l}
            </button>
          ))}
          <span style={{ marginLeft:'auto', fontSize:11.5, color:D.faint, fontFamily:font.sans }}>
            {(pg-1)*PG+1}–{Math.min(pg*PG,total)} of <strong style={{ color:D.dim }}>{total}</strong>
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Schema Sidebar ─────────────────────────────────────────────────── */
function SchemaSidebar({ tables, loading, selected, onSelect }) {
  const [q, setQ] = useState('');
  const lower = q.toLowerCase();
  const filtered = tables.filter(t => !lower || t.tableName.toLowerCase().includes(lower));
  const isMerchant = n => ['merchant','vendor','retailer','seller','shop','store','partner'].some(k=>n.toLowerCase().includes(k));
  const isBank     = n => ['bank','banking','lender','acquirer','issuer','clearing'].some(k=>n.toLowerCase().includes(k));
  const merchants  = filtered.filter(t => isMerchant(t.tableName));
  const banks      = filtered.filter(t => isBank(t.tableName) && !isMerchant(t.tableName));
  const others     = filtered.filter(t => !isMerchant(t.tableName) && !isBank(t.tableName));

  const TableBtn = ({ t }) => (
    <button onClick={() => onSelect(t.tableName)}
      style={{ display:'block', width:'100%', padding:'7px 14px', textAlign:'left',
               border:'none', borderBottom:'1px solid #0d1c2e',
               background: selected===t.tableName ? '#00A99D' : 'transparent',
               cursor:'pointer', transition:'background 0.12s' }}
      onMouseEnter={e=>{ if(selected!==t.tableName) e.currentTarget.style.background=D.bg2; }}
      onMouseLeave={e=>{ if(selected!==t.tableName) e.currentTarget.style.background='transparent'; }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:6 }}>
        <span style={{ fontSize:12.5, fontFamily:font.mono, overflow:'hidden',
                       textOverflow:'ellipsis', whiteSpace:'nowrap',
                       color: selected===t.tableName ? D.blue : D.text }}>
          {t.tableType==='VIEW'?'👁 ':'📋 '}{t.tableName}
        </span>
        {t.rowEstimate!=null && (
          <span style={{ fontSize:10, color:D.faint, fontFamily:font.sans, flexShrink:0 }}>
            ~{Number(t.rowEstimate).toLocaleString()}
          </span>
        )}
      </div>
    </button>
  );

  const Group = ({ icon, label, color, items }) => !items.length ? null : (
    <>
      <div style={{ padding:'5px 14px 3px', fontSize:10, fontWeight:700,
                    letterSpacing:'0.12em', textTransform:'uppercase', color,
                    fontFamily:font.sans, background:'#EAECF0',
                    borderBottom:'1px solid #0d1c2e', position:'sticky', top:0 }}>
        {icon} {label} ({items.length})
      </div>
      {items.map(t => <TableBtn key={t.tableName} t={t} />)}
    </>
  );

  return (
    <div style={{ width:232, flexShrink:0, background:D.bg0,
                  borderRight:'1px solid '+D.border,
                  display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ padding:'10px 12px', borderBottom:'1px solid '+D.border, flexShrink:0 }}>
        <div style={{ fontSize:10.5, fontWeight:700, color:D.dim, textTransform:'uppercase',
                      letterSpacing:'0.1em', fontFamily:font.sans, marginBottom:7 }}>
          Schema Browser
        </div>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Filter tables…"
          style={{ width:'100%', padding:'6px 10px', borderRadius:2, outline:'none',
                   border:'1px solid '+D.border, background:D.bg2, color:D.text,
                   fontSize:12, fontFamily:font.mono, boxSizing:'border-box' }} />
      </div>
      <div style={{ flex:1, overflowY:'auto' }}>
        {loading
          ? <div style={{ padding:20, textAlign:'center', color:D.faint,
                          fontSize:13, fontFamily:font.sans }}>Loading…</div>
          : <>
              <Group icon="🏪" label="Merchants" color={D.green} items={merchants} />
              <Group icon="🏦" label="Banks"     color={D.blue}  items={banks} />
              <Group icon="📋" label="Tables"    color={D.dim}   items={others} />
            </>
        }
      </div>
    </div>
  );
}

/* ── Export helpers ─────────────────────────────────────────────────── */
function toCSV(cols, rows) {
  const e = v => '"'+String(v??'').replace(/"/g,'""')+'"';
  return [cols.map(e).join(','), ...rows.map(r=>cols.map(c=>e(r[c])).join(','))].join('\n');
}
function toXLS(cols, rows) {
  const ths = cols.map(c=>`<th>${c}</th>`).join('');
  const trs = rows.map(r=>'<tr>'+cols.map(c=>`<td>${r[c]??''}</td>`).join('')+'</tr>').join('');
  return `<html><head><meta charset="utf-8"/></head><body><table><tr>${ths}</tr>${trs}</table></body></html>`;
}
function dlFile(name, content, mime) {
  const a = Object.assign(document.createElement('a'),
    { href:URL.createObjectURL(new Blob([content],{type:mime})), download:name });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════ */
export default function MerchantBankPage({ onScheduleReport, onBulkSchedule }) {
  const [platforms,  setPlatforms]  = useState([]);
  const [platformId, setPlatformId] = useState('');
  const [tables,     setTables]     = useState([]);
  const [tablesLoad, setTablesLoad] = useState(false);
  const [selTable,   setSelTable]   = useState('');
  const [result,     setResult]     = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [activeTab,  setActiveTab]  = useState('merchants');
  const [maxRows,    setMaxRows]    = useState(200);
  const [manualMt,   setManualMt]   = useState('');
  const [manualBt,   setManualBt]   = useState('');
  const [manual,     setManual]     = useState(false);
  const [err,        setErr]        = useState('');

  useEffect(() => {
    platformApi.list(0,100,'ACTIVE').then(d=>{
      const list = d.content||[];
      setPlatforms(list);
      if (list.length>0) setPlatformId(list[0].id);
    }).catch(()=>{});
  }, []);

  const loadTables = (pid) => {
    if (!pid) return;
    setTables([]); setTablesLoad(true);
    schemaApi.listTables(pid)
      .then(data => setTables(Array.isArray(data)?data:[]))
      .catch(e => console.warn('Schema load:', e.message))
      .finally(() => setTablesLoad(false));
  };

  const discover = async () => {
    if (!platformId) return;
    if (tables.length===0) loadTables(platformId);
    setLoading(true); setErr(''); setResult(null);
    try {
      const data = manual && (manualMt.trim()||manualBt.trim())
        ? await schemaApi.queryNamedTables(platformId, manualMt.trim()||null, manualBt.trim()||null, maxRows)
        : await schemaApi.getMerchantsAndBanks(platformId, maxRows);
      setResult(data);
      if (data.errorMessage) setErr(data.errorMessage);
      else {
        setActiveTab(data.merchantCount>0?'merchants':'banks');
        if (data.merchantTable) setManualMt(data.merchantTable);
        if (data.bankTable)     setManualBt(data.bankTable);
      }
    } catch(e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  const platform = platforms.find(p=>p.id===platformId);
  const activeCols  = result ? ((activeTab==='merchants'?result.merchantColumns:result.bankColumns)||[]) : [];
  const activeRows  = result ? ((activeTab==='merchants'?result.merchants:result.banks)||[]) : [];
  const activeTable = result ? (activeTab==='merchants'?result.merchantTable:result.bankTable) : null;

  const scheduleCallback = {
    platformId,
    platformName: platform?.platformName || '',
    fn: (ctx) => {
      if (ctx.isMulti && onBulkSchedule) {
        // Multiple rows → go to Bulk Schedule page
        onBulkSchedule({
          platformId,
          platformName: platform?.platformName || '',
          sourceTable: ctx.tableName,
          idColumn:    ctx.idColumn,
          idValues:    ctx.idValues,
          tableName:   ctx.tableName,
        });
      } else if (onScheduleReport) {
        // Single row → go to regular Schedule page
        onScheduleReport(ctx);
      }
    },
  };

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column',
                  height:'100vh', background:D.bg0, overflow:'hidden' }}>

      {/* Header */}
      <div style={{ padding:'13px 24px', background:D.bg1,
                    borderBottom:'1px solid '+D.border,
                    display:'flex', alignItems:'center', gap:14, flexShrink:0 }}>
        <div style={{ flex:1 }}>
          <h1 style={{ margin:0, fontSize:17, fontWeight:700, color:'#1A2332', fontFamily:font.serif }}>
            Merchants &amp; Banks
          </h1>
          <p style={{ margin:'2px 0 0', fontSize:12, color:D.dim, fontFamily:font.sans }}>
            Discover records → click any row → schedule a filtered report
          </p>
        </div>
        <label style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:10.5, color:D.dim, fontFamily:font.sans,
                         fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>Platform</span>
          <select value={platformId} onChange={e=>{setPlatformId(e.target.value);setResult(null);setTables([]);}}
            style={{ padding:'7px 11px', borderRadius:3, border:'1px solid '+D.border,
                     background:D.bg2, color:'#1A2332', fontSize:13, fontFamily:font.sans,
                     outline:'none', cursor:'pointer', minWidth:200 }}>
            {platforms.map(p=><option key={p.id} value={p.id}>{p.platformName}</option>)}
          </select>
        </label>
        <label style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:10.5, color:D.dim, fontFamily:font.sans,
                         fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>Rows</span>
          <select value={maxRows} onChange={e=>setMaxRows(Number(e.target.value))}
            style={{ padding:'7px 10px', borderRadius:3, border:'1px solid '+D.border,
                     background:D.bg2, color:'#1A2332', fontSize:13, fontFamily:font.mono,
                     outline:'none', cursor:'pointer', width:80 }}>
            {[50,100,200,500,1000].map(n=><option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <button onClick={discover} disabled={loading||!platformId}
          style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 22px', borderRadius:3,
                   background:loading||!platformId?D.bg2:C.navy,
                   color:loading||!platformId?D.faint:'#fff',
                   border:'1.5px solid '+(loading||!platformId?D.border:C.navyL),
                   cursor:loading||!platformId?'not-allowed':'pointer',
                   fontSize:13, fontFamily:font.sans, fontWeight:700 }}>
          <span>{loading?'⏳':'🔍'}</span>{loading?'Scanning…':'Discover'}
        </button>
      </div>

      {/* Manual override bar */}
      <div style={{ padding:'7px 24px', background:'#EAECF0',
                    borderBottom:'1px solid '+D.border,
                    display:'flex', alignItems:'center', gap:14, flexShrink:0 }}>
        <div onClick={()=>setManual(m=>!m)}
          style={{ display:'flex', alignItems:'center', gap:7, cursor:'pointer', userSelect:'none' }}>
          <div style={{ width:32, height:18, borderRadius:9,
                        background:manual?C.navyL:D.border, position:'relative', transition:'background 0.2s' }}>
            <div style={{ position:'absolute', top:2, left:manual?16:2, width:14, height:14,
                          borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
          </div>
          <span style={{ fontSize:12, color:manual?D.blue:D.dim, fontFamily:font.sans, fontWeight:600 }}>
            Manual table names
          </span>
        </div>
        {manual && <>
          <input value={manualMt} onChange={e=>setManualMt(e.target.value)}
            placeholder="🏪 Merchant table"
            style={{ padding:'5px 10px', borderRadius:2, border:'1px solid '+D.border,
                     background:D.bg2, color:D.text, fontSize:12.5, fontFamily:font.mono,
                     outline:'none', width:200 }} />
          <input value={manualBt} onChange={e=>setManualBt(e.target.value)}
            placeholder="🏦 Bank table"
            style={{ padding:'5px 10px', borderRadius:2, border:'1px solid '+D.border,
                     background:D.bg2, color:D.text, fontSize:12.5, fontFamily:font.mono,
                     outline:'none', width:200 }} />
        </>}
        {err && <span style={{ fontSize:12.5, color:D.red, fontFamily:font.sans, marginLeft:'auto' }}>⚠ {err}</span>}
      </div>

      {/* Body */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        <SchemaSidebar tables={tables} loading={tablesLoad} selected={selTable}
          onSelect={t=>{ setSelTable(t); setManualMt(t); setManual(true); }} />

        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {/* Empty state */}
          {!result && !loading && (
            <div style={{ flex:1, display:'flex', flexDirection:'column',
                          alignItems:'center', justifyContent:'center', gap:16, padding:40 }}>
              <div style={{ fontSize:52 }}>🏪 🏦</div>
              <div style={{ fontSize:18, fontWeight:700, color:D.dim, fontFamily:font.serif }}>
                Discover Merchants &amp; Banks
              </div>
              <div style={{ fontSize:13.5, color:D.faint, fontFamily:font.sans,
                            textAlign:'center', maxWidth:440, lineHeight:1.7 }}>
                Click <strong style={{ color:D.blue }}>Discover</strong> to load records from{' '}
                <strong style={{ color:D.blue }}>{platform?.platformName||'the selected platform'}</strong>.
                <br />
                Then <strong style={{ color:D.green }}>click any row</strong> to schedule a report filtered to that record.
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ flex:1, display:'flex', flexDirection:'column',
                          alignItems:'center', justifyContent:'center', gap:14 }}>
              <div style={{ width:40, height:40, borderRadius:'50%',
                            border:'3px solid '+D.border, borderTopColor:D.blue,
                            animation:'mbspin 0.8s linear infinite' }} />
              <style>{`@keyframes mbspin{to{transform:rotate(360deg)}}`}</style>
              <span style={{ fontSize:13.5, color:D.dim, fontFamily:font.sans }}>
                Scanning {platform?.platformName||''}…
              </span>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
              {/* Stats */}
              <div style={{ padding:'12px 20px', background:'#EAECF0',
                            borderBottom:'1px solid '+D.border, flexShrink:0 }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:10 }}>
                  <StatCard icon="🏪" label="Merchants"  value={result.merchantCount??0} color={D.green} />
                  <StatCard icon="🏦" label="Banks"      value={result.bankCount??0}     color={D.blue} />
                  <StatCard icon="🗄️"  label="Source DB"  value={result.dbName||'—'}       color={D.purple} />
                  <StatCard icon="⚡" label="Query Time" value={(result.executionMs||0)+'ms'} color={D.amber} />
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:16,
                              fontSize:12.5, fontFamily:font.sans }}>
                  {result.merchantTable
                    ? <span style={{ color:D.dim }}>🏪 <code style={{ color:D.green, fontFamily:font.mono, background:'#E6F5ED', padding:'1px 7px', borderRadius:2 }}>{result.merchantTable}</code></span>
                    : <span style={{ color:D.faint }}>🏪 No merchant table found</span>}
                  {result.bankTable
                    ? <span style={{ color:D.dim }}>🏦 <code style={{ color:D.blue, fontFamily:font.mono, background:D.bg1, padding:'1px 7px', borderRadius:2 }}>{result.bankTable}</code></span>
                    : <span style={{ color:D.faint }}>🏦 No bank table found</span>}
                </div>
              </div>

              {/* Tabs + export */}
              <div style={{ display:'flex', background:'#EAECF0',
                            borderBottom:'1px solid '+D.border, flexShrink:0 }}>
                {[['merchants','🏪 Merchants',result.merchantCount,D.green],
                  ['banks','🏦 Banks',result.bankCount,D.blue]].map(([key,label,count,color])=>(
                  <button key={key} onClick={()=>setActiveTab(key)}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 22px',
                             border:'none', cursor:'pointer', fontSize:13.5, fontFamily:font.sans,
                             fontWeight:700, transition:'all 0.15s',
                             background: activeTab===key?D.bg1:'transparent',
                             color: activeTab===key?color:D.dim,
                             borderBottom: activeTab===key?'2px solid '+color:'2px solid transparent' }}>
                    {label}
                    <span style={{ padding:'1px 8px', borderRadius:10, fontSize:11, fontWeight:700,
                                   background: activeTab===key?color+'22':D.bg0,
                                   color: activeTab===key?color:D.faint }}>
                      {count??0}
                    </span>
                  </button>
                ))}
                {activeCols.length>0 && (
                  <div style={{ marginLeft:'auto', display:'flex',
                                alignItems:'center', gap:8, padding:'0 16px' }}>
                    <span style={{ fontSize:10.5, color:D.faint, fontFamily:font.sans,
                                   fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>Export</span>
                    <button onClick={()=>dlFile((activeTable||activeTab)+'.csv',toCSV(activeCols,activeRows),'text/csv')}
                      style={{ padding:'5px 12px', borderRadius:2, border:'1px solid '+D.border,
                               background:D.bg2, color:D.blue, cursor:'pointer',
                               fontSize:12, fontFamily:font.sans, fontWeight:700 }}>📄 CSV</button>
                    <button onClick={()=>dlFile((activeTable||activeTab)+'.xls',toXLS(activeCols,activeRows),'application/vnd.ms-excel')}
                      style={{ padding:'5px 12px', borderRadius:2, border:'1px solid '+D.border,
                               background:D.bg2, color:D.green, cursor:'pointer',
                               fontSize:12, fontFamily:font.sans, fontWeight:700 }}>📊 Excel</button>
                  </div>
                )}
              </div>

              {/* Data grid */}
              <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
                <DataGrid
                  columns={activeCols} rows={activeRows}
                  tableName={activeTable}
                  onRowSchedule={scheduleCallback}
                  emptyMsg={activeTable
                    ? `No rows in "${activeTable}".`
                    : 'No table detected. Enable Manual mode.'}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
