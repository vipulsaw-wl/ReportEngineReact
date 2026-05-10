import React, { useState, useMemo } from 'react';
import { C, font } from '../theme';

// ── Token definitions ─────────────────────────────────────────────────────────
const STATIC_TOKENS = [
  { token:'{REPORT_NAME}', label:'Report Name',  desc:'Name of the schedule',          group:'Report' },
  { token:'{ENTITY_ID}',   label:'Entity ID',    desc:'Merchant/Bank ID (bulk only)',   group:'Report' },
  { token:'{PLATFORM}',    label:'Platform',     desc:'Platform name',                  group:'Report' },
  { token:'{CATEGORY}',    label:'Category',     desc:'Report category',                group:'Report' },
  { token:'{FORMAT}',      label:'Format',       desc:'Output format (PDF, CSV…)',      group:'Report' },
  { token:'{DATETIME}',    label:'DateTime',     desc:'yyyyMMdd_HHmmss',                group:'Date' },
  { token:'{DATE}',        label:'Date',         desc:'yyyyMMdd',                       group:'Date' },
  { token:'{TIME}',        label:'Time',         desc:'HHmmss',                         group:'Date' },
  { token:'{YYYY}',        label:'Year',         desc:'4-digit year',                   group:'Date' },
  { token:'{MM}',          label:'Month',        desc:'2-digit month',                  group:'Date' },
  { token:'{DD}',          label:'Day',          desc:'2-digit day',                    group:'Date' },
  { token:'{HH}',          label:'Hour',         desc:'24h hour',                       group:'Date' },
];

const QUICK_TEMPLATES = [
  { label:'Default',              pattern:'{REPORT_NAME}_{DATETIME}' },
  { label:'By Date',              pattern:'{REPORT_NAME}_{YYYY}-{MM}-{DD}' },
  { label:'By Entity + Date',     pattern:'{ENTITY_ID}_{REPORT_NAME}_{DATE}' },
  { label:'With Column Value',    pattern:'{REPORT_NAME}_{merchant_name}_{DATETIME}' },
  { label:'Platform + Month',     pattern:'{PLATFORM}_{REPORT_NAME}_{YYYY}_{MM}' },
  { label:'Detailed',             pattern:'{REPORT_NAME}_{ENTITY_ID}_{YYYY}-{MM}-{DD}_{HH}{mm}' },
];

// ── Preview ────────────────────────────────────────────────────────────────────
function buildPreview(pattern, ext, sampleCols) {
  const now = new Date();
  const pad  = n => String(n).padStart(2,'0');
  const yyyy = now.getFullYear();
  const mm   = pad(now.getMonth()+1);
  const dd   = pad(now.getDate());
  const hh   = pad(now.getHours());
  const mn   = pad(now.getMinutes());
  const ss   = pad(now.getSeconds());

  let p = pattern || '{REPORT_NAME}_{DATETIME}';
  p = p
    .replace('{REPORT_NAME}', 'Monthly_P_L')
    .replace('{ENTITY_ID}',   'MRC_00142')
    .replace('{PLATFORM}',    'WorldlineFin')
    .replace('{CATEGORY}',    'PL_STATEMENT')
    .replace('{FORMAT}',      ext.replace('.','').toUpperCase())
    .replace('{DATETIME}',    `${yyyy}${mm}${dd}_${hh}${mn}${ss}`)
    .replace('{DATE}',        `${yyyy}${mm}${dd}`)
    .replace('{TIME}',        `${hh}${mn}${ss}`)
    .replace('{YYYY}',        String(yyyy))
    .replace('{MM}',          mm)
    .replace('{DD}',          dd)
    .replace('{HH}',          hh)
    .replace('{mm}',          mn)
    .replace('{ss}',          ss);

  // Replace any sample column tokens
  (sampleCols || []).forEach(col => {
    p = p.replace(new RegExp(`\\{${col.name}\\}`, 'g'), sanitize(col.sample));
  });

  // Strip remaining unknown tokens
  p = p.replace(/\{[^}]+}/g, '');
  p = p.replace(/[^a-zA-Z0-9._\-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  return (p || 'report') + ext;
}

function sanitize(v) {
  return String(v||'').replace(/[^a-zA-Z0-9._\-]/g,'_').replace(/_+/g,'_');
}

// ══════════════════════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════════════════════
export default function FileNamePatternBuilder({
  value,         // current pattern string
  onChange,      // (newPattern) => void
  ext = '.csv',  // file extension for preview
  sqlColumns,    // array of column names from the query (optional)
  localOutputPath,      // current local output path
  onLocalOutputPathChange, // (path) => void
}) {
  const [showBuilder, setShowBuilder] = useState(false);
  const [activeGroup, setActiveGroup] = useState('Date');

  // Sample column values for preview
  const sampleCols = useMemo(() =>
    (sqlColumns || []).map(c => ({
      name: c,
      sample: c.toLowerCase().includes('name') ? 'Acme_Corp'
            : c.toLowerCase().includes('id')   ? 'ID_001'
            : c.toLowerCase().includes('code')  ? 'CODE_01'
            : 'val',
    })), [sqlColumns]);

  const preview = useMemo(() =>
    buildPreview(value, ext, sampleCols), [value, ext, sampleCols]);

  const insertToken = (token) => {
    onChange((value || '') + token);
  };

  const groups = ['Report', 'Date'];

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Label + toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: 6 }}>
        <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                        textTransform: 'uppercase', color: C.slateL,
                        fontFamily: font.sans }}>
          File Naming Pattern
        </label>
        <button onClick={() => setShowBuilder(b => !b)}
          style={{ fontSize: 12, color: C.navyL, background: 'none', border: 'none',
                   cursor: 'pointer', fontFamily: font.sans, textDecoration: 'underline',
                   padding: 0 }}>
          {showBuilder ? 'Hide builder ▲' : 'Open builder ▼'}
        </button>
      </div>

      {/* Pattern input */}
      <input
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder="{REPORT_NAME}_{DATETIME}  (leave blank for default)"
        style={{ width: '100%', padding: '9px 12px', borderRadius: 3, outline: 'none',
                 border: '1.5px solid ' + C.border, fontSize: 13,
                 fontFamily: font.mono, color: C.navyD, boxSizing: 'border-box' }}
      />

      {/* Live preview */}
      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: C.muted, fontFamily: font.sans,
                       fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Preview:
        </span>
        <code style={{ fontSize: 12.5, fontFamily: font.mono, color: C.navyL,
                       background: C.blueL, padding: '2px 8px', borderRadius: 2,
                       border: '1px solid ' + C.blueB }}>
          {preview}
        </code>
      </div>

      {/* Builder panel */}
      {showBuilder && (
        <div style={{ marginTop: 10, border: '1px solid ' + C.border, borderRadius: 4,
                      background: C.white, overflow: 'hidden',
                      boxShadow: '0 2px 12px #1B3A5C10' }}>

          {/* Quick templates */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid ' + C.border,
                        background: C.bg }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted,
                          textTransform: 'uppercase', letterSpacing: '0.08em',
                          fontFamily: font.sans, marginBottom: 8 }}>
              Quick Templates
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {QUICK_TEMPLATES.map(qt => (
                <button key={qt.label} onClick={() => onChange(qt.pattern)}
                  style={{ padding: '4px 11px', borderRadius: 2, fontSize: 12,
                           fontFamily: font.sans, cursor: 'pointer',
                           background: value === qt.pattern ? C.navy : '#F1F5F9',
                           color: value === qt.pattern ? C.white : C.slate,
                           border: '1px solid ' + (value === qt.pattern ? C.navy : C.border),
                           fontWeight: 600, transition: 'all 0.12s' }}>
                  {qt.label}
                </button>
              ))}
              <button onClick={() => onChange('')}
                style={{ padding: '4px 11px', borderRadius: 2, fontSize: 12,
                         fontFamily: font.sans, cursor: 'pointer',
                         background: '#FEF2F2', color: '#991B1B',
                         border: '1px solid #FECACA', fontWeight: 600 }}>
                ✕ Clear
              </button>
            </div>
          </div>

          {/* Token tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid ' + C.border }}>
            {groups.map(g => (
              <button key={g} onClick={() => setActiveGroup(g)}
                style={{ padding: '8px 16px', border: 'none', cursor: 'pointer',
                         fontSize: 12.5, fontFamily: font.sans, fontWeight: 700,
                         background: activeGroup === g ? C.white : C.bg,
                         color: activeGroup === g ? C.navy : C.muted,
                         borderBottom: activeGroup === g
                           ? '2px solid ' + C.navy : '2px solid transparent' }}>
                {g} Tokens
              </button>
            ))}
            {sqlColumns && sqlColumns.length > 0 && (
              <button onClick={() => setActiveGroup('Column')}
                style={{ padding: '8px 16px', border: 'none', cursor: 'pointer',
                         fontSize: 12.5, fontFamily: font.sans, fontWeight: 700,
                         background: activeGroup === 'Column' ? C.white : C.bg,
                         color: activeGroup === 'Column' ? C.green : C.muted,
                         borderBottom: activeGroup === 'Column'
                           ? '2px solid ' + C.green : '2px solid transparent' }}>
                SQL Columns ({sqlColumns.length})
              </button>
            )}
          </div>

          {/* Token grid */}
          <div style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {activeGroup === 'Column' ? (
              // SQL column tokens
              (sqlColumns || []).map(col => (
                <button key={col} onClick={() => insertToken(`{${col}}`)}
                  title={`Insert column value: ${col}`}
                  style={{ padding: '5px 12px', borderRadius: 2, fontSize: 12.5,
                           fontFamily: font.mono, cursor: 'pointer',
                           background: '#F0FDF4', color: C.green,
                           border: '1px solid ' + C.greenB, fontWeight: 600,
                           display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 10 }}>+</span>
                  {`{${col}}`}
                </button>
              ))
            ) : (
              // Static tokens
              STATIC_TOKENS
                .filter(t => t.group === activeGroup)
                .map(t => (
                  <button key={t.token} onClick={() => insertToken(t.token)}
                    title={t.desc}
                    style={{ padding: '5px 12px', borderRadius: 2, fontSize: 12.5,
                             fontFamily: font.mono, cursor: 'pointer',
                             background: activeGroup === 'Date' ? '#EFF6FF' : '#F8FAFC',
                             color: activeGroup === 'Date' ? C.blue : C.navy,
                             border: '1px solid ' + (activeGroup === 'Date' ? C.blueB : C.border),
                             fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 10 }}>+</span>
                    <span>{t.token}</span>
                    <span style={{ fontSize: 10.5, color: C.muted, fontWeight: 400 }}>
                      {t.label}
                    </span>
                  </button>
                ))
            )}
          </div>

          {/* Pattern syntax reminder */}
          <div style={{ padding: '8px 16px', borderTop: '1px solid ' + C.border,
                        background: C.bg, fontSize: 12, color: C.muted,
                        fontFamily: font.sans }}>
            Click tokens to append them to the pattern. Combine freely:
            <code style={{ fontFamily: font.mono, color: C.navyL, marginLeft: 4 }}>
              {'{REPORT_NAME}_{YYYY}-{MM}_{merchant_name}'}
            </code>
          </div>
        </div>
      )}

      {/* Local output path */}
      {onLocalOutputPathChange && (
        <div style={{ marginTop: 14 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 700,
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                          color: C.slateL, fontFamily: font.sans }}>
            Local Output Folder (optional)
          </label>
          <input
            value={localOutputPath || ''}
            onChange={e => onLocalOutputPathChange(e.target.value)}
            placeholder="e.g. C:\Reports\Monthly  or  /mnt/reports/output  (blank = server default)"
            style={{ width: '100%', padding: '9px 12px', borderRadius: 3, outline: 'none',
                     border: '1.5px solid ' + C.border, fontSize: 13,
                     fontFamily: font.mono, color: C.navyD, boxSizing: 'border-box' }}
          />
          <div style={{ marginTop: 4, fontSize: 12, color: C.muted, fontFamily: font.sans }}>
            Absolute path on the server where the report file will be saved.
            Leave blank to use the server's default output directory
            (<code style={{ fontFamily: font.mono }}>app.report.output-dir</code>).
            SFTP delivery is configured separately above.
          </div>
        </div>
      )}
    </div>
  );
}
