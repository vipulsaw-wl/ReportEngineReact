import React, { useState } from 'react';
import { C, font, FMTS } from '../theme';
import { TInput, Field, PrimaryBtn, GhostBtn, Pills, InfoBox, TopBar, PageWrap } from '../components/UI';
import { authApi } from '../api';

// ── Google Authenticator section ──────────────────────────────────────────────
function TotpSection() {
  const [status,    setStatus]    = useState('idle');  // idle | setup | disabling
  const [setupData, setSetupData] = useState(null);
  const [code,      setCode]      = useState('');
  const [err,       setErr]       = useState('');
  const [success,   setSuccess]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [enabled,   setEnabled]   = useState(false);

  const beginSetup = async () => {
    setLoading(true); setErr(''); setSuccess('');
    try {
      const d = await authApi.totpSetup();
      setSetupData(d); setStatus('setup');
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  const confirmEnable = async () => {
    setLoading(true); setErr('');
    try {
      await authApi.totpEnable({ pendingSecret: setupData.secret, code: code.replace(/\s/g, '') });
      setEnabled(true); setStatus('idle'); setCode('');
      setSuccess('Google Authenticator enabled. You will be asked for a code on every login.');
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  const confirmDisable = async () => {
    setLoading(true); setErr('');
    try {
      await authApi.totpDisable({ code: code.replace(/\s/g, '') });
      setEnabled(false); setStatus('idle'); setCode('');
      setSuccess('Google Authenticator disabled.');
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  const inpStyle = {
    width: '100%', padding: '8px 12px', border: '1.5px solid #DDE3EC', borderRadius: 3,
    fontSize: 22, fontFamily: 'monospace', outline: 'none', letterSpacing: '0.3em',
    color: '#1A2332', textAlign: 'center', boxSizing: 'border-box',
  };

  return (
    <div style={{ border: '1px solid #DDE3EC', borderRadius: 4, padding: '20px 24px',
                  marginBottom: 24, background: '#fff', boxShadow: '0 1px 8px #1B3A5C08' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 22 }}>🔑</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1A2332', fontFamily: font.sans }}>
            Google Authenticator (TOTP)
          </div>
          <div style={{ fontSize: 12.5, color: '#6B7A8D', marginTop: 2, fontFamily: font.sans }}>
            {enabled
              ? '✅ Enabled — required at every login'
              : '⚪ Not enabled — add an extra layer of security'}
          </div>
        </div>
      </div>

      {/* Success banner */}
      {success && (
        <div style={{ padding: '10px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0',
                      borderRadius: 3, fontSize: 13, color: '#16A34A', marginBottom: 14,
                      fontFamily: font.sans }}>
          {success}
        </div>
      )}

      {/* Error banner */}
      {err && (
        <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA',
                      borderRadius: 3, fontSize: 13, color: '#DC2626', marginBottom: 14,
                      fontFamily: font.sans }}>
          {err}
        </div>
      )}

      {/* Idle state — enable / disable button */}
      {status === 'idle' && (
        <button onClick={enabled ? () => { setCode(''); setStatus('disabling'); } : beginSetup}
          disabled={loading}
          style={{ padding: '9px 20px', borderRadius: 3, fontSize: 13, fontWeight: 700,
                   cursor: loading ? 'not-allowed' : 'pointer', border: 'none',
                   background: enabled ? '#FEF2F2' : '#00A99D',
                   color: enabled ? '#DC2626' : '#fff', fontFamily: font.sans }}>
          {loading ? '⏳ Loading…' : enabled ? '🔴 Disable Google Authenticator' : '🟢 Enable Google Authenticator'}
        </button>
      )}

      {/* Setup state — show QR code */}
      {status === 'setup' && setupData && (
        <div>
          <p style={{ fontSize: 13, color: '#1A2332', marginBottom: 16, lineHeight: 1.6,
                      fontFamily: font.sans }}>
            <strong>Step 1</strong> — Scan this QR code with the
            <strong> Google Authenticator</strong> app (Android / iOS).<br />
            <strong>Step 2</strong> — Enter the 6-digit code shown in the app to confirm.
          </p>
          {setupData.qrCodeBase64 && (
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <img src={setupData.qrCodeBase64} alt="Google Authenticator QR Code"
                style={{ width: 200, height: 200, border: '1px solid #DDE3EC', borderRadius: 4 }} />
            </div>
          )}
          <div style={{ textAlign: 'center', fontSize: 11.5, color: '#6B7A8D',
                        marginBottom: 6, fontFamily: font.sans }}>
            Or enter this key manually in the app:
          </div>
          <div style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 14,
                        letterSpacing: '0.2em', color: '#00A99D', marginBottom: 20,
                        background: '#F0F9F8', padding: '10px', borderRadius: 3 }}>
            {setupData.secret}
          </div>
          <input value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter 6-digit code" maxLength={6} style={inpStyle} />
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={confirmEnable}
              disabled={loading || code.length < 6}
              style={{ flex: 1, padding: '9px', borderRadius: 3, fontSize: 13, fontWeight: 700,
                       fontFamily: font.sans, border: 'none', cursor: 'pointer',
                       background: code.length < 6 ? '#DDE3EC' : '#2E7D32',
                       color: code.length < 6 ? '#6B7A8D' : '#fff' }}>
              {loading ? 'Verifying…' : '✓ Confirm & Enable'}
            </button>
            <button onClick={() => { setStatus('idle'); setCode(''); setErr(''); }}
              style={{ padding: '9px 16px', borderRadius: 3, fontSize: 13, fontFamily: font.sans,
                       border: '1px solid #DDE3EC', background: '#fff', cursor: 'pointer',
                       color: '#6B7A8D' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Disabling state — confirm with current code */}
      {status === 'disabling' && (
        <div>
          <p style={{ fontSize: 13, color: '#1A2332', marginBottom: 12, fontFamily: font.sans }}>
            Enter your current Google Authenticator code to confirm:
          </p>
          <input value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit code" maxLength={6} style={inpStyle} />
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={confirmDisable}
              disabled={loading || code.length < 6}
              style={{ flex: 1, padding: '9px', borderRadius: 3, fontSize: 13, fontWeight: 700,
                       fontFamily: font.sans, border: 'none', cursor: 'pointer',
                       background: code.length < 6 ? '#DDE3EC' : '#DC2626',
                       color: code.length < 6 ? '#6B7A8D' : '#fff' }}>
              {loading ? 'Disabling…' : '🔴 Disable'}
            </button>
            <button onClick={() => { setStatus('idle'); setCode(''); setErr(''); }}
              style={{ padding: '9px 16px', borderRadius: 3, fontSize: 13, fontFamily: font.sans,
                       border: '1px solid #DDE3EC', background: '#fff', cursor: 'pointer',
                       color: '#6B7A8D' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main SettingsPage ─────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [smtp,    setSmtp]   = useState('smtp.company.com');
  const [port,    setPort]   = useState('587');
  const [sender,  setSender] = useState('reports@company.com');
  const [auth,    setAuth]   = useState('TLS (Recommended)');
  const [tz,      setTz]     = useState('UTC');
  const [retain,  setRetain] = useState('90');
  const [defFmt,  setDefFmt] = useState('PDF');
  const [saved,   setSaved]  = useState(false);
  const [testing, setTest]   = useState(false);
  const [testOk,  setTestOk] = useState(false);

  const save     = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };
  const testSMTP = () => {
    setTest(true);
    setTimeout(() => { setTest(false); setTestOk(true); setTimeout(() => setTestOk(false), 3000); }, 1500);
  };

  return (
    <>
      <TopBar title="Settings" subtitle="System configuration for the Report Engine" />
      <PageWrap>
        {(saved || testOk) && (
          <InfoBox msg={saved ? '✓ Settings saved successfully.' : '✓ SMTP connection test passed.'} color="green" />
        )}

        {/* Google Authenticator — full width at top */}
        <TotpSection />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* SMTP */}
          <div style={{ background: C.white, border: '1px solid ' + C.border, borderRadius: 4,
                        padding: '24px 28px', boxShadow: '0 1px 8px #1B3A5C08' }}>
            <h3 style={{ margin: '0 0 4px', fontFamily: font.serif, fontSize: 16, color: C.navyD }}>
              Email Delivery (SMTP)
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: C.slateL, fontFamily: font.sans }}>
              Configure outbound email for report delivery.
            </p>
            <Field label="SMTP Host">
              <TInput value={smtp} onChange={e => setSmtp(e.target.value)} placeholder="smtp.company.com" />
            </Field>
            <Field label="Port">
              <TInput value={port} onChange={e => setPort(e.target.value)} placeholder="587" />
            </Field>
            <Field label="Sender Address">
              <TInput value={sender} onChange={e => setSender(e.target.value)} type="email" />
            </Field>
            <Field label="Authentication">
              <select value={auth} onChange={e => setAuth(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 3,
                         border: '1.5px solid ' + C.border, fontFamily: font.sans,
                         fontSize: 14, color: C.navyD, outline: 'none', background: C.white }}>
                <option>TLS (Recommended)</option>
                <option>SSL</option>
                <option>None</option>
              </select>
            </Field>
            <GhostBtn onClick={testSMTP}>{testing ? 'Testing…' : 'Test SMTP Connection'}</GhostBtn>
          </div>

          {/* General + System Info */}
          <div>
            <div style={{ background: C.white, border: '1px solid ' + C.border, borderRadius: 4,
                          padding: '24px 28px', boxShadow: '0 1px 8px #1B3A5C08', marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 4px', fontFamily: font.serif, fontSize: 16, color: C.navyD }}>
                General Settings
              </h3>
              <p style={{ margin: '0 0 20px', fontSize: 13, color: C.slateL, fontFamily: font.sans }}>
                Engine-wide preferences.
              </p>
              <Field label="Default Timezone" hint="Applied to all scheduled run times.">
                <select value={tz} onChange={e => setTz(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 3,
                           border: '1.5px solid ' + C.border, fontFamily: font.sans,
                           fontSize: 14, color: C.navyD, outline: 'none', background: C.white }}>
                  {['UTC', 'GMT+5:30 (IST)', 'GMT-5 (EST)', 'GMT-8 (PST)', 'GMT+1 (CET)'].map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Default Output Format">
                <Pills options={FMTS} value={defFmt} onChange={setDefFmt} />
              </Field>
              <Field label="Log Retention (days)" hint="Logs older than this will be archived.">
                <TInput value={retain} onChange={e => setRetain(e.target.value)} />
              </Field>
            </div>

            <div style={{ background: C.white, border: '1px solid ' + C.border, borderRadius: 4,
                          padding: '20px 24px', boxShadow: '0 1px 8px #1B3A5C08' }}>
              <h3 style={{ margin: '0 0 14px', fontFamily: font.serif, fontSize: 15, color: C.navyD }}>
                System Info
              </h3>
              {[
                ['Engine Version',  '4.2.1'],
                ['JasperReports',   '7.0.3'],
                ['Java Runtime',    'OpenJDK 17.0.9'],
                ['Last Config Save','05 Mar 2026 09:14'],
                ['Uptime',          '14d 6h 22m'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between',
                                      marginBottom: 8, fontSize: 13, fontFamily: font.sans }}>
                  <span style={{ color: C.slateL }}>{k}</span>
                  <span style={{ color: C.navyD, fontFamily: font.mono, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <PrimaryBtn onClick={save}>Save Settings</PrimaryBtn>
          <GhostBtn onClick={() => {}}>Reset to Defaults</GhostBtn>
        </div>
      </PageWrap>
    </>
  );
}
