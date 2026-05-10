import React, { useState, useEffect } from 'react';
import { C, font } from '../theme';
import { TInput, Field, PrimaryBtn, GhostBtn, ErrBox, Divider } from '../components/UI';
import { platformApi } from '../api';

function PasswordStrength({ pw }) {
  if (!pw) return null;
  const checks = [pw.length >= 8, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)];
  const score = checks.filter(Boolean).length;
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['#B91C1C', C.amber, C.navyL, C.green];
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[0,1,2,3].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < score ? colors[score-1] : C.border, transition: 'background 0.2s' }} />)}
      </div>
      <span style={{ fontSize: 11, color: colors[score-1] || C.muted, fontFamily: font.sans }}>{score > 0 ? labels[score-1] : ''}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const active = status === 'ACTIVE';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 2, fontSize: 11.5, fontWeight: 700, fontFamily: font.sans, letterSpacing: '0.07em', textTransform: 'uppercase', background: active ? C.greenL : C.redL, color: active ? C.green : C.red, border: '1px solid ' + (active ? C.greenB : C.redB) }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: active ? C.green : C.red }} />
      {status}
    </span>
  );
}

const DB_TYPES = ['POSTGRESQL', 'MYSQL', 'MSSQL', 'ORACLE', 'MARIADB'];
const DEFAULT_PORT = { POSTGRESQL:'5432', MYSQL:'3306', MSSQL:'1433', ORACLE:'1521', MARIADB:'3306' };

export default function PlatformRegPage({ onBack }) {
  const [view,       setView]      = useState('list');
  const [platforms,  setPlatforms] = useState([]);
  const [total,      setTotal]     = useState(0);
  const [page,       setPage]      = useState(0);
  const [search,     setSearch]    = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [copiedKey,  setCopiedKey] = useState('');
  const [listLoading, setListLoading] = useState(false);

  // Form state
  const [platformName, setPlatformName] = useState('');
  const [contactName,  setContactName]  = useState('');
  const [email,        setEmail]        = useState('');
  const [designation,  setDesig]        = useState('');
  const [dbType,   setDbType]   = useState('POSTGRESQL');
  const [dbHost,   setDbHost]   = useState('');
  const [dbPort,   setDbPort]   = useState('5432');
  const [dbName,   setDbName]   = useState('');
  const [dbUser,   setDbUser]   = useState('');
  const [dbPw,     setDbPw]     = useState('');
  const [showDbPw, setShowDbPw] = useState(false);
  const [connStr,  setConnStr]  = useState('');
  const [err,      setErr]      = useState('');
  const [loading,  setLoading]  = useState(false);
  const [testing,  setTesting]  = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [newPlatform, setNewPlatform] = useState(null);

  useEffect(() => { if (view === 'list') loadPlatforms(); }, [view, page, statusFilter]);

  const loadPlatforms = async () => {
    setListLoading(true);
    try {
      const data = await platformApi.list(page, 20, statusFilter || undefined);
      setPlatforms(data.content || []);
      setTotal(data.totalElements || 0);
    } catch (e) { setErr(e.message); }
    finally { setListLoading(false); }
  };

  const resetForm = () => {
    setPlatformName(''); setContactName(''); setEmail(''); setDesig('');
    setDbType('POSTGRESQL'); setDbHost(''); setDbPort('5432'); setDbName('');
    setDbUser(''); setDbPw(''); setConnStr(''); setErr(''); setTestResult(null);
  };

  const testConnection = async () => {
    setTesting(true); setTestResult(null);
    try {
      const r = await platformApi.testConnection({ dbType, dbHost, dbPort: parseInt(dbPort), dbName, dbUsername: dbUser, dbPassword: dbPw, connString: connStr || null });
      setTestResult(r);
    } catch (e) { setTestResult({ ok: false, message: e.message }); }
    finally { setTesting(false); }
  };

  const submit = async () => {
    if (!platformName.trim()) return setErr('Platform name is required.');
    if (!contactName.trim())  return setErr('Contact person name is required.');
    if (!email.includes('@')) return setErr('Valid email is required.');
    if (!designation.trim())  return setErr('Designation is required.');
    if (!dbHost.trim())       return setErr('Database host is required.');
    if (!dbName.trim())       return setErr('Database name is required.');
    if (!dbUser.trim())       return setErr('Database username is required.');
    if (!dbPw.trim())         return setErr('Database password is required.');
    setErr(''); setLoading(true);
    try {
      const created = await platformApi.create({ platformName, contactName, email: email.toLowerCase(), designation, dbType, dbHost, dbPort: parseInt(dbPort), dbName, dbUsername: dbUser, dbPassword: dbPw, connString: connStr || null });
      setNewPlatform(created);
      setView('success');
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE';
    try {
      await platformApi.updateStatus(id, newStatus);
      loadPlatforms();
    } catch (e) { alert(e.message); }
  };

  const copyKey = (key) => {
    navigator.clipboard.writeText(key).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 1600);
  };

  const filtered = platforms.filter(p => {
    const q = search.toLowerCase();
    return !q || [p.platformName, p.contactName, p.email].some(v => v?.toLowerCase().includes(q));
  });

  // ── Success ────────────────────────────────────────────────────────────────
  if (view === 'success' && newPlatform) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, background: C.bg }}>
      <div style={{ background: C.white, border: '1px solid ' + C.border, borderRadius: 4, padding: '52px 48px', maxWidth: 500, width: '100%', textAlign: 'center', boxShadow: '0 4px 32px #1B3A5C14', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg,' + C.green + ',' + C.navyL + ')', borderRadius: '4px 4px 0 0' }} />
        <div style={{ width: 68, height: 68, borderRadius: '50%', background: C.greenL, border: '2px solid ' + C.greenB, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 20px' }}>✓</div>
        <h2 style={{ fontFamily: font.serif, fontSize: 22, color: C.navyD, margin: '0 0 10px' }}>Platform Registered</h2>
        <p style={{ color: C.slateL, fontSize: 14, fontFamily: font.sans, margin: '0 0 28px', lineHeight: 1.7 }}>
          <strong style={{ color: C.navy }}>{newPlatform.platformName}</strong> registered successfully.<br />
          Save your platform key — it will not be shown again.
        </p>
        <div style={{ background: '#F0F2F5', border: '1px solid #1e3550', borderRadius: 4, padding: '16px 20px', marginBottom: 24 }}>
          <div style={{ fontSize: 10.5, color: '#4A5568', fontFamily: font.sans, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Platform Key</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: font.mono, color: '#0066CC', letterSpacing: '0.12em', marginBottom: 12 }}>{newPlatform.platformKey}</div>
          <button onClick={() => copyKey(newPlatform.platformKey)} style={{ padding: '6px 18px', borderRadius: 3, background: copiedKey === newPlatform.platformKey ? C.greenL : '#DDE3EC', color: copiedKey === newPlatform.platformKey ? C.green : '#0066CC', border: '1px solid ' + (copiedKey === newPlatform.platformKey ? C.greenB : '#00A99D'), cursor: 'pointer', fontSize: 12.5, fontFamily: font.sans, fontWeight: 700 }}>
            {copiedKey === newPlatform.platformKey ? '✓ Copied!' : '📋 Copy Key'}
          </button>
        </div>
        <PrimaryBtn onClick={() => { setView('list'); resetForm(); }}>View All Platforms →</PrimaryBtn>
      </div>
    </div>
  );

  // ── Form ───────────────────────────────────────────────────────────────────
  if (view === 'form') return (
    <div style={{ flex: 1, background: C.bg, padding: '28px 32px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.navyD, fontFamily: font.serif }}>Register New Platform</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: C.slateL, fontFamily: font.sans }}>Add a new organisation to Report Engine</p>
        </div>
        <GhostBtn onClick={() => { setView('list'); resetForm(); }} small>← Back</GhostBtn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Platform info */}
        <div style={{ background: C.white, border: '1px solid ' + C.border, borderRadius: 4, padding: '26px 28px', position: 'relative', boxShadow: '0 1px 8px #1B3A5C08' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,' + C.navy + ',' + C.navyL + ')', borderRadius: '4px 4px 0 0' }} />
          <Divider label="Platform Details" />
          <Field label="Platform Name"><TInput value={platformName} onChange={e => setPlatformName(e.target.value)} placeholder="e.g. Worldline Finance Hub" /></Field>
          <Field label="Contact Person"><TInput value={contactName} onChange={e => setContactName(e.target.value)} placeholder="e.g. Jane Smith" /></Field>
          <Field label="Email Address"><TInput value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="jane.smith@company.com" /></Field>
          <Field label="Designation"><TInput value={designation} onChange={e => setDesig(e.target.value)} placeholder="e.g. Chief Financial Officer" /></Field>
        </div>
        {/* DB Connection */}
        <div style={{ background: C.white, border: '1px solid ' + C.border, borderRadius: 4, padding: '26px 28px', position: 'relative', boxShadow: '0 1px 8px #1B3A5C08' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#059669,#2E6DA4)', borderRadius: '4px 4px 0 0' }} />
          <Divider label="Database Connection" />
          <Field label="Database Type">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {DB_TYPES.map(t => <button key={t} onClick={() => { setDbType(t); setDbPort(DEFAULT_PORT[t] || ''); setTestResult(null); }} style={{ padding: '5px 11px', borderRadius: 2, fontSize: 12, fontWeight: 600, fontFamily: font.sans, cursor: 'pointer', transition: 'all 0.15s', background: dbType === t ? C.navy : '#F8FAFC', color: dbType === t ? C.white : C.slate, border: '1.5px solid ' + (dbType === t ? C.navy : C.border) }}>{t}</button>)}
            </div>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 96px', gap: 10 }}>
            <Field label="Host"><TInput value={dbHost} onChange={e => { setDbHost(e.target.value); setTestResult(null); }} placeholder="db.company.com" /></Field>
            <Field label="Port"><TInput value={dbPort} onChange={e => { setDbPort(e.target.value); setTestResult(null); }} placeholder="5432" /></Field>
          </div>
          <Field label="Database Name"><TInput value={dbName} onChange={e => setDbName(e.target.value)} placeholder="finance_db" /></Field>
          <Field label="Username"><TInput value={dbUser} onChange={e => { setDbUser(e.target.value); setTestResult(null); }} placeholder="finreport_user" /></Field>
          <Field label="Password">
            <div style={{ position: 'relative' }}>
              <TInput value={dbPw} onChange={e => { setDbPw(e.target.value); setTestResult(null); }} type={showDbPw ? 'text' : 'password'} placeholder="••••••••••" />
              <button onClick={() => setShowDbPw(!showDbPw)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: C.muted, padding: 0 }}>{showDbPw ? '🙈' : '👁'}</button>
            </div>
            <PasswordStrength pw={dbPw} />
          </Field>
          <Field label="Connection String (optional)" hint="Overrides host/port/db if provided.">
            <TInput value={connStr} onChange={e => setConnStr(e.target.value)} placeholder="jdbc:postgresql://host:5432/dbname" />
          </Field>
          <button onClick={testConnection} disabled={testing || !dbHost || !dbUser || !dbPw} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 3, background: testing || !dbHost ? '#E0ECF8' : '#F0F2F5', color: testing || !dbHost ? '#8A97A8' : '#0066CC', border: '1.5px solid ' + (testing || !dbHost ? '#DDE3EC' : '#00A99D'), cursor: testing || !dbHost || !dbUser || !dbPw ? 'not-allowed' : 'pointer', fontSize: 13, fontFamily: font.sans, fontWeight: 700, marginBottom: 8 }}>
            <span>{testing ? '⏳' : '🔌'}</span>{testing ? 'Connecting…' : 'Test Connection'}
          </button>
          {testResult && (
            <div style={{ padding: '10px 12px', borderRadius: 3, background: testResult.ok ? '#0a1f0a' : '#1f0a0a', border: '1px solid ' + (testResult.ok ? '#B2EFC5' : '#7f1d1d') }}>
              {testResult.ok
                ? <div style={{ display: 'flex', gap: 8 }}><span>✅</span><div><div style={{ fontSize: 13, fontWeight: 700, color: '#00A651', fontFamily: font.sans }}>Connected</div><div style={{ fontSize: 12, color: '#166534', fontFamily: font.mono }}>{testResult.server} · {testResult.ms}ms</div></div></div>
                : <div style={{ display: 'flex', gap: 8 }}><span>❌</span><div><div style={{ fontSize: 13, fontWeight: 700, color: '#D0021B', fontFamily: font.sans }}>Failed</div><div style={{ fontSize: 12.5, color: '#fca5a5', fontFamily: font.mono }}>{testResult.message}</div></div></div>
              }
            </div>
          )}
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <ErrBox msg={err} />
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <PrimaryBtn onClick={submit} loading={loading}>Register Platform →</PrimaryBtn>
            <GhostBtn onClick={() => { setView('list'); resetForm(); }}>Cancel</GhostBtn>
            {testResult?.ok && <span style={{ fontSize: 12.5, color: C.green, fontFamily: font.sans, fontWeight: 700, marginLeft: 8 }}>✓ Connection verified</span>}
          </div>
        </div>
      </div>
    </div>
  );

  // ── List ───────────────────────────────────────────────────────────────────
  const activeCount = platforms.filter(p => p.status === 'ACTIVE').length;
  const deactCount  = platforms.filter(p => p.status === 'DEACTIVATED').length;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg }}>
      <div style={{ padding: '20px 32px', background: C.white, borderBottom: '1px solid ' + C.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.navyD, fontFamily: font.serif }}>Registered Platforms</h1>
          <p style={{ margin: '3px 0 0', fontSize: 13, color: C.slateL, fontFamily: font.sans }}>Manage platform access and database connections</p>
        </div>
        <PrimaryBtn onClick={() => { resetForm(); setView('form'); }} small>+ Register New Platform</PrimaryBtn>
      </div>

      <div style={{ padding: '28px 32px', flex: 1, overflowY: 'auto' }}>
        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
          {[['Total', total, C.navy, '🏢'], ['Active', activeCount, C.green, '✅'], ['Deactivated', deactCount, C.red, '⛔']].map(([label, value, accent, icon]) => (
            <div key={label} style={{ background: C.white, border: '1px solid ' + C.border, borderLeft: '4px solid ' + accent, borderRadius: 4, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 8px #1B3A5C08' }}>
              <span style={{ fontSize: 26 }}>{icon}</span>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', color: C.muted, textTransform: 'uppercase', fontFamily: font.sans }}>{label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: C.navyD, fontFamily: font.serif }}>{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div style={{ background: C.white, border: '1px solid ' + C.border, borderRadius: 4, padding: '12px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 8px #1B3A5C08' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, fontSize: 13 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search platform, contact, email…"
              style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 3, border: '1.5px solid ' + C.border, fontSize: 13, fontFamily: font.sans, outline: 'none', color: C.navyD, boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[['all', ''], ['active', 'ACTIVE'], ['deactivated', 'DEACTIVATED']].map(([label, val]) => (
              <button key={label} onClick={() => { setStatusFilter(val); setPage(0); }} style={{ padding: '7px 14px', borderRadius: 2, fontSize: 12.5, fontWeight: 600, fontFamily: font.sans, cursor: 'pointer', textTransform: 'capitalize', background: statusFilter === val ? C.navy : '#F8FAFC', color: statusFilter === val ? C.white : C.slate, border: '1.5px solid ' + (statusFilter === val ? C.navy : C.border) }}>{label}</button>
            ))}
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: C.muted, fontFamily: font.sans }}>{filtered.length} of {platforms.length}</span>
        </div>

        {/* Table */}
        <div style={{ background: C.white, border: '1px solid ' + C.border, borderRadius: 4, boxShadow: '0 1px 8px #1B3A5C08', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {['#','Platform','Contact','Email','Designation','DB Type','Key','Registered','Status','Action'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', color: C.muted, textTransform: 'uppercase', fontFamily: font.sans, borderBottom: '1px solid ' + C.border, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listLoading ? (
                <tr><td colSpan={10} style={{ padding: 40, textAlign: 'center', color: C.muted, fontFamily: font.sans }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} style={{ padding: 40, textAlign: 'center', color: C.muted, fontFamily: font.sans }}>No platforms found.</td></tr>
              ) : filtered.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: '1px solid ' + C.border, background: p.status === 'DEACTIVATED' ? '#FAFAFA' : i%2===0 ? C.white : '#FAFBFC', opacity: p.status === 'DEACTIVATED' ? 0.75 : 1 }}>
                  <td style={{ padding: '11px 14px', fontSize: 12, color: C.muted, fontFamily: font.mono }}>{page*20+i+1}</td>
                  <td style={{ padding: '11px 14px' }}><div style={{ fontSize: 13.5, fontWeight: 700, color: C.navyD, fontFamily: font.sans }}>{p.platformName}</div></td>
                  <td style={{ padding: '11px 14px', fontSize: 13, color: C.slate, fontFamily: font.sans, whiteSpace: 'nowrap' }}>{p.contactName}</td>
                  <td style={{ padding: '11px 14px', fontSize: 12.5, color: C.slateL, fontFamily: font.sans }}>{p.email}</td>
                  <td style={{ padding: '11px 14px', fontSize: 12.5, color: C.slate, fontFamily: font.sans }}>{p.designation}</td>
                  <td style={{ padding: '11px 14px' }}><span style={{ fontSize: 11.5, background: C.blueL, color: C.blue, border: '1px solid ' + C.blueB, padding: '2px 8px', borderRadius: 2, fontFamily: font.sans, fontWeight: 600 }}>{p.dbConnection?.dbType || '—'}</span></td>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <code style={{ fontSize: 11, fontFamily: font.mono, color: '#0066CC', background: '#F0F2F5', padding: '3px 7px', borderRadius: 2, border: '1px solid #1e3550', whiteSpace: 'nowrap' }}>{p.platformKey}</code>
                      <button onClick={() => copyKey(p.platformKey)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: copiedKey === p.platformKey ? C.green : C.muted, padding: 2 }}>{copiedKey === p.platformKey ? '✓' : '📋'}</button>
                    </div>
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: 12, color: C.muted, fontFamily: font.mono, whiteSpace: 'nowrap' }}>{p.registeredOn ? new Date(p.registeredOn).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—'}</td>
                  <td style={{ padding: '11px 14px' }}><StatusBadge status={p.status} /></td>
                  <td style={{ padding: '11px 14px' }}>
                    <button onClick={() => toggleStatus(p.id, p.status)} style={{ padding: '5px 12px', fontSize: 11.5, borderRadius: 2, cursor: 'pointer', fontFamily: font.sans, fontWeight: 600, whiteSpace: 'nowrap', background: p.status === 'ACTIVE' ? C.redL : C.greenL, color: p.status === 'ACTIVE' ? C.red : C.green, border: '1px solid ' + (p.status === 'ACTIVE' ? C.redB : C.greenB) }}>
                      {p.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
