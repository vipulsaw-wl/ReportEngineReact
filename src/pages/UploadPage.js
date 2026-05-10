import React, { useState, useRef, useEffect } from 'react';
import { C, font } from '../theme';
import { PrimaryBtn, ErrBox, Badge, TopBar, PageWrap } from '../components/UI';
import { templateApi, platformApi } from '../api';

function DownloadBtn({ label, icon, color, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 11px', borderRadius: 2, cursor: 'pointer', fontSize: 12, fontFamily: font.sans, fontWeight: 600, border: '1px solid ' + color, background: hov ? color : 'transparent', color: hov ? C.white : color, transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
      <span style={{ fontSize: 12 }}>{icon}</span>{label}
    </button>
  );
}

// Sample data for download previews
const SAMPLE = {
  'PL_STATEMENT': { headers: ['Account','Description','Jan 2026','Feb 2026','YTD'], rows: [['4000','Revenue – Sales','312,400','298,750','611,150'],['5000','Cost of Goods','187,040','179,250','366,290'],['7000','Net Profit','65,660','69,000','134,660']] },
  'BALANCE_SHEET': { headers: ['Code','Account','Current','Prior','Variance'], rows: [['1000','Cash','1,240,500','1,108,200','132,300'],['1100','Receivables','487,300','512,800','-25,500'],['3000','Retained Earnings','3,542,900','3,414,900','128,000']] },
  'AR_AGING':      { headers: ['Customer','Invoice #','Current','31-60','61-90','90+'], rows: [['Acme Corp','INV-0341','42,500','0','0','0'],['GlobalTech','INV-0298','0','31,200','0','0']] },
  'CUSTOM':        { headers: ['ID','Field 1','Field 2','Value'], rows: [['001','Sample A','Category X','10,000'],['002','Sample B','Category Y','20,000']] },
};

function getSample(type) { return SAMPLE[type] || SAMPLE['CUSTOM']; }

function triggerDownload(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: filename });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function downloadSample(tpl, format) {
  const base = tpl.templateName || tpl.originalName?.replace(/\.(jasper|jrxml|jrpt)$/i, '');
  const { headers, rows } = getSample(tpl.category);
  const th = 'background:#1B3A5C;color:#fff;padding:8px 12px;text-align:left;font-size:12px;border:1px solid #0F2236;';
  const td = 'padding:7px 12px;font-size:12px;border:1px solid #E2E8F0;';
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${tpl.category}</title></head><body style="font-family:Arial;margin:32px;color:#0F2236"><h1 style="font-size:18px;color:#1B3A5C">${tpl.category} — Sample</h1><table style="border-collapse:collapse;width:100%"><thead><tr>${headers.map(h=>`<th style="${th}">${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r,i)=>`<tr>${r.map(c=>`<td style="${td}${i%2?'background:#F8FAFC;':''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`;
  if (format === 'CSV') {
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\r\n');
    triggerDownload(csv, base + '_sample.csv', 'text/csv');
  } else if (format === 'Excel') {
    triggerDownload(html, base + '_sample.xls', 'application/vnd.ms-excel');
  } else if (format === 'PDF') {
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    const win = window.open(url, '_blank');
    if (win) win.onload = () => setTimeout(() => { win.print(); URL.revokeObjectURL(url); }, 300);
  }
}

export default function UploadPage({ onTemplateAdded }) {
  const [file,       setFile]       = useState(null);
  const [drag,       setDrag]       = useState(false);
  const [err,        setErr]        = useState('');
  const [loading,    setLoading]    = useState(false);
  const [done,       setDone]       = useState(false);
  const [templates,  setTemplates]  = useState([]);
  const [expanded,   setExpanded]   = useState(null);
  const [platforms,  setPlatforms]  = useState([]);
  const [platformId, setPlatformId] = useState('');
  const [category,   setCategory]   = useState('CUSTOM');
  const [confirmDel, setConfirmDel] = useState(null); // {id, name}
  const [deleting,   setDeleting]   = useState(null);
  const [toast,      setToast]      = useState('');
  const ref = useRef();

  const CATEGORIES = ['CUSTOM','PL_STATEMENT','BALANCE_SHEET','CASH_FLOW','BUDGET_VS_ACTUAL','AR_AGING','GL_SUMMARY'];

  useEffect(() => {
    platformApi.list(0, 100, 'ACTIVE').then(d => {
      const list = d.content || [];
      setPlatforms(list);
      if (list.length > 0) setPlatformId(list[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (platformId) loadTemplates();
  }, [platformId]);

  const loadTemplates = async () => {
    try {
      const data = await templateApi.list(platformId);
      setTemplates(data.content || data || []);
    } catch (e) { console.error(e); }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleDelete = async (id, name) => {
    setDeleting(id);
    try {
      await templateApi.archive(id);
      setTemplates(ts => ts.filter(t => t.id !== id));
      setExpanded(null);
      showToast('🗑 "' + name + '" deleted.');
    } catch (e) {
      setErr('Delete failed: ' + e.message);
    } finally {
      setDeleting(null);
      setConfirmDel(null);
    }
  };

  const accept = f => {
    if (!f) return;
    const ok = ['.jasper','.jrxml','.jrpt'].some(e => f.name.toLowerCase().endsWith(e));
    if (!ok) return setErr('Invalid file type. Accepted: .jasper · .jrxml · .jrpt');
    if (f.size > 20 * 1024 * 1024) return setErr('File exceeds the 20 MB limit.');
    setErr(''); setFile(f); setDone(false);
  };

  const upload = async () => {
    if (!file)       return setErr('Please select a template file.');
    if (!platformId) return setErr('Please select a platform first.');
    setLoading(true);
    try {
      const tpl = await templateApi.upload(file, platformId, category);
      setTemplates(t => [tpl, ...t]);
      onTemplateAdded && onTemplateAdded(file);
      setLoading(false); setDone(true); setFile(null); setExpanded(0);
    } catch (e) { setErr(e.message); setLoading(false); }
  };

  return (
    <>
      {/* Toast notification */}
      {toast && (
        <div style={{ position:'fixed', top:20, right:24, zIndex:2000,
                      padding:'12px 20px', background:'#0F2D1F',
                      color:'#fff', borderRadius:4, fontSize:13,
                      fontFamily:font.sans, boxShadow:'0 4px 16px rgba(0,0,0,0.25)',
                      maxWidth:400 }}>
          {toast}
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDel && (
        <div onClick={() => setConfirmDel(null)}
          style={{ position:'fixed', inset:0, zIndex:1000,
                   background:'rgba(0,0,0,0.45)',
                   display:'flex', alignItems:'center', justifyContent:'center',
                   padding:24 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:C.white, borderRadius:5, padding:28,
                     maxWidth:400, width:'100%',
                     boxShadow:'0 16px 48px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize:15, fontWeight:700, color:C.navyD,
                          fontFamily:font.sans, marginBottom:10 }}>
              Delete Template?
            </div>
            <div style={{ fontSize:13, color:C.slateL, fontFamily:font.sans,
                          marginBottom:20 }}>
              <strong>"{confirmDel.name}"</strong> will be permanently deleted
              and cannot be used in future reports.
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setConfirmDel(null)}
                style={{ padding:'7px 16px', borderRadius:3, border:'1px solid '+C.border,
                         background:C.white, fontSize:13, fontFamily:font.sans,
                         cursor:'pointer', color:C.slateL }}>
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDel.id, confirmDel.name)}
                disabled={deleting === confirmDel.id}
                style={{ padding:'7px 16px', borderRadius:3, border:'none',
                         background:'#DC2626', color:'#fff',
                         fontSize:13, fontFamily:font.sans, fontWeight:700,
                         cursor: deleting === confirmDel.id ? 'not-allowed' : 'pointer',
                         opacity: deleting === confirmDel.id ? 0.6 : 1 }}>
                {deleting === confirmDel.id ? '⏳ Deleting…' : '🗑 Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <TopBar title="Upload Template" subtitle="Add a JasperReports template to the report engine" />
      <PageWrap>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Upload panel */}
          <div style={{ background: C.white, border: '1px solid ' + C.border, borderRadius: 4, padding: 28, boxShadow: '0 1px 8px #1B3A5C08', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,' + C.navy + ',' + C.navyL + ')', borderRadius: '4px 4px 0 0' }} />
            <h3 style={{ margin: '4px 0 6px', fontFamily: font.serif, color: C.navyD, fontSize: 17 }}>Upload New Template</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: C.slateL, fontFamily: font.sans }}>Upload .jasper, .jrxml, or .jrpt template files.</p>
            {done && <div style={{ padding: '10px 14px', background: C.greenL, border: '1px solid ' + C.greenB, borderRadius: 3, fontSize: 13, color: C.green, fontFamily: font.sans, marginBottom: 16, fontWeight: 600 }}>✓ Template uploaded successfully.</div>}

            {/* Platform selector */}
            {platforms.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: C.slateL, textTransform: 'uppercase', fontFamily: font.sans }}>Platform</label>
                <select value={platformId} onChange={e => setPlatformId(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 3, border: '1.5px solid ' + C.border, fontSize: 13, fontFamily: font.sans, color: C.navyD, background: C.white, outline: 'none' }}>
                  {platforms.map(p => <option key={p.id} value={p.id}>{p.platformName}</option>)}
                </select>
              </div>
            )}

            {/* Category selector */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 5, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: C.slateL, textTransform: 'uppercase', fontFamily: font.sans }}>Report Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 3, border: '1.5px solid ' + C.border, fontSize: 13, fontFamily: font.sans, color: C.navyD, background: C.white, outline: 'none' }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
              </select>
            </div>

            <div onClick={() => ref.current.click()} onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); accept(e.dataTransfer.files[0]); }}
              style={{ border: '2px dashed ' + (drag ? C.navyL : file ? C.navy : C.border), borderRadius: 3, padding: '32px 20px', textAlign: 'center', cursor: 'pointer', background: drag ? C.blueL : file ? '#F0F7FF' : C.bg, transition: 'all 0.2s', marginBottom: 16 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{file ? '📋' : '⬆️'}</div>
              {file ? (
                <div><div style={{ fontWeight: 700, color: C.navy, fontSize: 14, fontFamily: font.sans }}>{file.name}</div><div style={{ color: C.slateL, fontSize: 12, marginTop: 3, fontFamily: font.sans }}>{(file.size/1024).toFixed(1)} KB · Click to replace</div></div>
              ) : (
                <div><div style={{ color: C.slate, fontSize: 14, fontWeight: 600, fontFamily: font.sans }}>Drag & drop or <span style={{ color: C.navyL, textDecoration: 'underline' }}>browse</span></div><div style={{ color: C.muted, fontSize: 12, marginTop: 5, fontFamily: font.sans }}>.jasper · .jrxml · .jrpt · Max 20 MB</div></div>
              )}
              <input ref={ref} type="file" accept=".jasper,.jrxml,.jrpt" style={{ display: 'none' }} onChange={e => accept(e.target.files[0])} />
            </div>
            <ErrBox msg={err} />
            <PrimaryBtn onClick={upload} loading={loading} disabled={!file || !platformId}>Upload Template</PrimaryBtn>
          </div>

          {/* Template library */}
          <div style={{ background: C.white, border: '1px solid ' + C.border, borderRadius: 4, boxShadow: '0 1px 8px #1B3A5C08' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid ' + C.border }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.navyD, fontFamily: font.serif }}>Template Library</div>
              <div style={{ fontSize: 12.5, color: C.slateL, fontFamily: font.sans, marginTop: 2 }}>{templates.length} template{templates.length !== 1 ? 's' : ''} · Click to expand</div>
            </div>
            {templates.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center', color: C.muted, fontFamily: font.sans, fontSize: 13 }}>No templates yet. Upload one to get started.</div>
            )}
            {templates.map((t, i) => {
              const isOpen = expanded === i;
              return (
                <div key={t.id || i} style={{ borderBottom: i < templates.length - 1 ? '1px solid ' + C.border : 'none' }}>
                  <div onClick={() => setExpanded(isOpen ? null : i)} style={{ padding: '13px 22px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                    <div style={{ fontSize: 22, flexShrink: 0 }}>📄</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: C.navyD, fontFamily: font.sans, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.originalName}</div>
                      <div style={{ fontSize: 11.5, color: C.muted, fontFamily: font.sans, marginTop: 2, display: 'flex', gap: 12 }}>
                        <span>📦 {t.fileSizeKb} KB</span>
                        <span>📅 {t.uploadedAt ? new Date(t.uploadedAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—'}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <Badge color="navy">{t.category?.replace(/_/g,' ')}</Badge>
                      <span style={{ fontSize: 11, color: C.muted, fontFamily: font.mono }}>{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </div>
                  {isOpen && (
                    <div style={{ padding: '0 22px 16px 56px' }}>
                      <div style={{ fontSize: 12, color: C.slateL, fontFamily: font.sans, marginBottom: 10 }}>
                        Type: <strong style={{ color: C.navyD }}>{t.fileType}</strong> · Size: <strong style={{ color: C.navyD }}>{t.fileSizeKb} KB</strong>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:10 }}>
                        <span style={{ fontSize:12, color:C.muted, fontFamily:font.sans, marginRight:2 }}>Download sample:</span>
                        <DownloadBtn label="PDF"   icon="🔴" color="#DC2626" onClick={() => downloadSample(t, 'PDF')}   />
                        <DownloadBtn label="Excel" icon="🟢" color="#16A34A" onClick={() => downloadSample(t, 'Excel')} />
                        <DownloadBtn label="CSV"   icon="🔵" color="#0369A1" onClick={() => downloadSample(t, 'CSV')}   />
                      </div>
                      {/* Delete */}
                      <div style={{ borderTop:'1px solid '+C.borderLight, paddingTop:10, marginTop:4 }}>
                        <button
                          onClick={e => { e.stopPropagation(); setConfirmDel({ id:t.id, name:t.originalName||t.templateName }); }}
                          style={{ padding:'5px 12px', borderRadius:3, fontSize:12.5,
                                   fontFamily:font.sans, fontWeight:600, cursor:'pointer',
                                   background:'#FEF2F2', color:'#DC2626',
                                   border:'1px solid #FECACA' }}>
                          🗑 Delete Template
                        </button>
                        <span style={{ fontSize:11.5, color:C.muted, fontFamily:font.sans, marginLeft:10 }}>
                          This cannot be undone.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </PageWrap>
    </>
  );
}
