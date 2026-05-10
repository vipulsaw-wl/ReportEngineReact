import React, { useState, useEffect, useRef } from 'react';
import WLLogo from '../components/WLLogo';
import { C, font } from '../theme';
import { TInput, Field, PrimaryBtn, ErrBox } from '../components/UI';
import { authApi, token } from '../api';
import { APP_NAME, APP_VERSION, COPYRIGHT } from '../wl-brand';

// ── CAPTCHA ───────────────────────────────────────────────────────────────────
function CaptchaBox({ imageBase64, onRefresh, loading }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        flex: 1, height: 56, borderRadius: 3,
        border: '1.5px solid ' + C.border,
        overflow: 'hidden', background: C.fieldBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {imageBase64
          ? <img src={imageBase64} alt="captcha"
              style={{ height: 56, width: '100%', objectFit: 'fill' }} />
          : <span style={{ fontSize: 12, color: C.muted, fontFamily: font.sans }}>Loading…</span>
        }
      </div>
      <button onClick={onRefresh} disabled={loading} title="Refresh"
        style={{
          width: 38, height: 38, borderRadius: 3,
          border: '1.5px solid ' + C.border, background: C.fieldBg,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: 18, color: C.slateL,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>↺</button>
    </div>
  );
}

// ── OTP 6-box input ───────────────────────────────────────────────────────────
function OtpInput({ value, onChange, autoFocus }) {
  const refsHolder = useRef([]);
  const refs = refsHolder.current;
  const digits = value.padEnd(6, ' ').split('').slice(0, 6);

  useEffect(() => { if (autoFocus && refs[0]) refs[0].focus(); }, [autoFocus]);

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      const next = value.slice(0, i === 0 ? 0 : i - (value[i] && value[i] !== ' ' ? 0 : 1));
      onChange(next);
      if ((!value[i] || value[i] === ' ') && i > 0) refs[i - 1]?.focus();
      return;
    }
    if (e.key === 'ArrowLeft'  && i > 0) { refs[i-1]?.focus(); return; }
    if (e.key === 'ArrowRight' && i < 5) { refs[i+1]?.focus(); return; }
    if (/^\d$/.test(e.key)) {
      const arr = digits.slice(); arr[i] = e.key;
      onChange(arr.join('').replace(/ /g, '').slice(0, 6));
      if (i < 5) refs[i+1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (p) { onChange(p); refs[Math.min(p.length, 5)]?.focus(); }
    e.preventDefault();
  };

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
      {digits.map((d, i) => (
        <input key={i} ref={el => { refs[i] = el; }}
          type="text" inputMode="numeric" maxLength={1}
          value={d === ' ' ? '' : d} onChange={() => {}}
          onKeyDown={e => handleKey(i, e)} onPaste={handlePaste}
          style={{
            width: 48, height: 56, textAlign: 'center',
            fontSize: 24, fontWeight: 700, fontFamily: font.mono,
            borderRadius: 4, outline: 'none',
            border: '2px solid ' + (d && d !== ' ' ? C.navy : C.border),
            background: d && d !== ' ' ? C.blueL : C.white,
            color: C.navyD, transition: 'all 0.15s',
          }} />
      ))}
    </div>
  );
}

// ── OTP Modal ─────────────────────────────────────────────────────────────────
function OtpModal({ email, devOtp, onVerify, onResend, onClose, otpTimer, loading, err }) {
  const [otp, setOtp] = useState('');
  useEffect(() => { if (devOtp) setOtp(devOtp); }, [devOtp]);

  return (
    <div onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
      <div onClick={e => e.stopPropagation()}
        onKeyDown={e => { if (e.key === 'Enter' && otp.length === 6) onVerify(otp); }}
        style={{
          background: C.white, borderRadius: 6,
          boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
          width: '100%', maxWidth: 420, overflow: 'hidden',
          animation: 'slideUp 0.22s ease',
        }}>
        <style>{`@keyframes slideUp{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
        <div style={{ height: 4, background: 'linear-gradient(90deg,' + C.navy + ',' + C.navyL + ')' }} />

        <div style={{ padding: '24px 28px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: C.blueL, border: '2px solid ' + C.blueB,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, marginBottom: 14,
            }}>🔐</div>
            <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700,
                          color: C.navyD, fontFamily: font.sans }}>
              Enter One-Time Password
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: C.slateL,
                         fontFamily: font.sans, lineHeight: 1.5 }}>
              A 6-digit code has been sent to<br />
              <strong style={{ color: C.navy }}>{email}</strong>
            </p>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
                     fontSize: 20, color: C.muted, padding: '0 0 0 8px' }}>✕</button>
        </div>

        {devOtp && (
          <div style={{
            margin: '16px 28px 0', padding: '12px 16px',
            background: C.fieldBg, border: '1px solid ' + C.blueB, borderRadius: 4,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.slateL,
                          fontFamily: font.sans, letterSpacing: '0.1em',
                          textTransform: 'uppercase', marginBottom: 6 }}>
              🛠 Dev Mode — OTP auto-filled
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: font.mono,
                          color: C.blue, letterSpacing: '0.3em' }}>{devOtp}</div>
            <div style={{ fontSize: 11.5, color: C.slateL, fontFamily: font.sans, marginTop: 4 }}>
              Set <code style={{ background: C.border, padding: '1px 5px', borderRadius: 2 }}>
                app.otp.show-in-dev=false
              </code> in production
            </div>
          </div>
        )}

        <div style={{ padding: '20px 28px 0' }}>
          <OtpInput value={otp} onChange={setOtp} autoFocus={!devOtp} />
        </div>

        {err && (
          <div style={{
            margin: '12px 28px 0', padding: '10px 14px',
            background: C.redL, border: '1px solid ' + C.redB,
            borderRadius: 3, fontSize: 13, color: C.red, fontFamily: font.sans,
          }}>{err}</div>
        )}

        <div style={{ padding: '12px 28px 0', textAlign: 'center',
                      fontSize: 13, color: C.muted, fontFamily: font.sans }}>
          {otpTimer > 0
            ? <>Resend in <strong style={{ color: C.navy }}>{otpTimer}s</strong></>
            : <button onClick={() => { setOtp(''); onResend(); }}
                style={{ color: C.navyL, background: 'none', border: 'none',
                         cursor: 'pointer', fontFamily: font.sans, fontSize: 13,
                         textDecoration: 'underline', padding: 0 }}>
                Resend OTP
              </button>
          }
        </div>

        <div style={{ padding: '20px 28px 24px', display: 'flex', gap: 10 }}>
          <button onClick={() => onVerify(otp)}
            disabled={loading || otp.replace(/ /g,'').length < 6}
            style={{
              flex: 1, padding: '11px 0', borderRadius: 3,
              fontSize: 14, fontWeight: 700, fontFamily: font.sans,
              cursor: loading || otp.replace(/ /g,'').length < 6 ? 'not-allowed' : 'pointer',
              background: loading || otp.replace(/ /g,'').length < 6 ? C.border : C.navy,
              color: loading || otp.replace(/ /g,'').length < 6 ? C.muted : C.white,
              border: 'none', transition: 'all 0.15s',
            }}>
            {loading ? 'Verifying…' : 'Verify & Sign In'}
          </button>
          <button onClick={onClose}
            style={{ padding: '11px 18px', borderRadius: 3, fontSize: 14,
                     fontFamily: font.sans, cursor: 'pointer',
                     background: C.white, color: C.slate,
                     border: '1.5px solid ' + C.border }}>
            Cancel
          </button>
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0,
                      height: 3, background: C.border }}>
          <div style={{
            height: '100%', background: C.navy, borderRadius: 2,
            width: (otp.replace(/ /g,'').length / 6 * 100) + '%',
            transition: 'width 0.15s',
          }} />
        </div>
      </div>
    </div>
  );
}


// ── Google Authenticator modal ────────────────────────────────────────────────
function TotpModal({ email, onVerify, onClose, loading, err }) {
  const [code, setCode] = useState('');
  return (
    <div onClick={onClose}
      style={{ position:'fixed', inset:0, zIndex:1001, background:'rgba(0,0,0,0.45)',
               backdropFilter:'blur(4px)', display:'flex', alignItems:'center',
               justifyContent:'center', padding:24 }}>
      <div onClick={e => e.stopPropagation()}
        onKeyDown={e => { if (e.key === 'Enter' && code.replace(/ /g,'').length === 6) onVerify(code); }}
        style={{ background:C.white, borderRadius:6, boxShadow:'0 24px 64px rgba(0,0,0,0.2)',
                 width:'100%', maxWidth:420, overflow:'hidden' }}>
        <div style={{ height:4, background:'linear-gradient(90deg,#00897B,#43A047)' }} />
        <div style={{ padding:'24px 28px' }}>
          <div style={{ width:48, height:48, borderRadius:'50%', background:'#E8F5E9',
                        border:'2px solid #A5D6A7', display:'flex', alignItems:'center',
                        justifyContent:'center', fontSize:24, marginBottom:16 }}>🔑</div>
          <h3 style={{ margin:'0 0 6px', fontSize:18, fontWeight:700, color:C.navyD,
                       fontFamily:font.sans }}>Google Authenticator</h3>
          <p style={{ margin:'0 0 20px', fontSize:13, color:C.slateL, fontFamily:font.sans,
                      lineHeight:1.5 }}>
            Open your Google Authenticator app and enter the<br/>
            6-digit code for <strong style={{ color:C.navy }}>{email}</strong>
          </p>
          <OtpInput value={code} onChange={setCode} autoFocus />
          {err && (
            <div style={{ marginTop:12, padding:'10px 14px', background:C.redL,
                          border:'1px solid '+C.redB, borderRadius:3, fontSize:13,
                          color:C.red, fontFamily:font.sans }}>{err}</div>
          )}
          <div style={{ display:'flex', gap:10, marginTop:20 }}>
            <button onClick={() => onVerify(code)}
              disabled={loading || code.replace(/ /g,'').length < 6}
              style={{ flex:1, padding:'11px 0', borderRadius:3, fontSize:14,
                       fontWeight:700, fontFamily:font.sans, border:'none',
                       cursor: loading || code.replace(/ /g,'').length < 6 ? 'not-allowed' : 'pointer',
                       background: loading || code.replace(/ /g,'').length < 6 ? C.border : '#2E7D32',
                       color: loading || code.replace(/ /g,'').length < 6 ? C.muted : '#fff' }}>
              {loading ? 'Verifying…' : '✓ Verify Code'}
            </button>
            <button onClick={onClose}
              style={{ padding:'11px 18px', borderRadius:3, fontSize:14,
                       fontFamily:font.sans, cursor:'pointer',
                       background:C.white, color:C.slate, border:'1.5px solid '+C.border }}>
              Cancel
            </button>
          </div>
          <div style={{ marginTop:14, fontSize:12, color:C.muted, fontFamily:font.sans,
                        textAlign:'center', lineHeight:1.5 }}>
            Codes refresh every 30 seconds. Make sure your device clock is synced.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main LoginPage ────────────────────────────────────────────────────────────
export default function LoginPage({ onLogin, onRegister }) {
  const [email,          setEmail]          = useState('');
  const [pw,             setPw]             = useState('');
  const [captcha,        setCaptcha]        = useState(null);
  const [captchaInput,   setCaptchaInput]   = useState('');
  const [showOtp,        setShowOtp]        = useState(false);
  const [devOtp,         setDevOtp]         = useState(null);
  const [otpTimer,       setOtpTimer]       = useState(0);
  const [err,            setErr]            = useState('');
  const [otpErr,         setOtpErr]         = useState('');
  const [showTotp,       setShowTotp]       = useState(false);
  const [totpErr,        setTotpErr]        = useState('');
  const [totpRequired,   setTotpRequired]   = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => { loadCaptcha(); }, []);

  const loadCaptcha = async () => {
    setCaptchaLoading(true);
    try {
      const data = await authApi.getCaptcha();
      setCaptcha(data); setCaptchaInput(''); setErr('');
    } catch (e) {
      setErr('Failed to load CAPTCHA. Is the server running?');
    } finally { setCaptchaLoading(false); }
  };

  const startTimer = () => {
    setOtpTimer(30);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setOtpTimer(t => { if (t <= 1) { clearInterval(timerRef.current); return 0; } return t - 1; });
    }, 1000);
  };
  useEffect(() => () => clearInterval(timerRef.current), []);

  const handleSignIn = async () => {
    if (!email || !pw)        return setErr('All fields are required.');
    if (!email.includes('@')) return setErr('Enter a valid email address.');
    if (!captchaInput.trim()) return setErr('Enter the CAPTCHA code.');
    setErr(''); setLoading(true);
    try {
      const resp = await authApi.login({
        email: email.toLowerCase(), password: pw,
        captchaInput: captchaInput.toUpperCase(), captchaToken: captcha?.token,
      });
      startTimer();
      setDevOtp(resp?.devOtp || resp?.dev_otp || null);
      setTotpRequired(resp?.totpRequired || false);
      setOtpErr(''); setShowOtp(true);
    } catch (e) { setErr(e.message); loadCaptcha(); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async (otp) => {
    setOtpErr(''); setLoading(true);
    try {
      const data = await authApi.verifyOtp({ email: email.toLowerCase(), otp });
      if (totpRequired) {
        // Email OTP verified — now show Google Authenticator step
        setShowOtp(false);
        setTotpErr(''); setShowTotp(true);
      } else {
        token.set(data.token); setShowOtp(false);
        onLogin({ name: data.fullName, email: data.email, role: data.role });
      }
    } catch (e) { setOtpErr(e.message); }
    finally { setLoading(false); }
  };

  const handleVerifyTotp = async (code) => {
    setTotpErr(''); setLoading(true);
    try {
      const data = await authApi.confirmTotp({ email: email.toLowerCase(), code: code.replace(/ /g,'') });
      token.set(data.token); setShowTotp(false);
      onLogin({ name: data.fullName, email: data.email, role: data.role });
    } catch (e) { setTotpErr(e.message); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    try {
      const resp = await authApi.resendOtp(email);
      setDevOtp(resp?.devOtp || null); startTimer(); setOtpErr('');
    } catch (e) { setOtpErr(e.message); }
  };

  return (
    <>
      {showTotp && (
        <TotpModal
          email={email}
          onVerify={handleVerifyTotp}
          onClose={() => setShowTotp(false)}
          loading={loading} err={totpErr}
        />
      )}

      {showOtp && (
        <OtpModal
          email={email} devOtp={devOtp}
          onVerify={handleVerifyOtp} onResend={handleResend}
          onClose={() => setShowOtp(false)}
          otpTimer={otpTimer} loading={loading} err={otpErr}
        />
      )}

      {/* ── Full-page layout ── */}
      <div
        onKeyDown={e => { if (e.key === 'Enter' && !showOtp) handleSignIn(); }}
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(150deg, #E6F7F6 0%, #F5F7FA 50%, #E6F0FF 100%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '32px 16px',
        }}>

        {/* ── Brand header ── */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          {/* Worldline logo — teal, no inversion */}
          <WLLogo height={32} style={{ margin: '0 auto 16px' }} />
          {/* App name */}
          <div style={{
            fontSize: 22, fontWeight: 700, color: '#1A2332',
            fontFamily: font.sans, letterSpacing: '0.01em', marginBottom: 6,
          }}>
            {APP_NAME}
          </div>
          {/* Subtitle */}
          <div style={{
            fontSize: 13, color: '#6B7A8D', fontFamily: font.sans,
            letterSpacing: '0.04em',
          }}>
            Automated Report Scheduling
          </div>
        </div>

        {/* ── Login card ── */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #DDE3EC',
          borderRadius: 6,
          padding: '36px 40px',
          width: '100%', maxWidth: 420,
          boxShadow: '0 4px 24px rgba(0,169,157,0.10), 0 1px 4px rgba(0,0,0,0.06)',
          position: 'relative',
        }}>
          {/* Teal accent top bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 4,
            background: 'linear-gradient(90deg, #00A99D, #00897B)',
            borderRadius: '6px 6px 0 0',
          }} />

          <h2 style={{
            margin: '0 0 4px', fontSize: 20, fontWeight: 700,
            color: '#1A2332', fontFamily: font.sans,
          }}>
            Sign In
          </h2>
          <p style={{
            margin: '0 0 24px', fontSize: 13,
            color: '#6B7A8D', fontFamily: font.sans,
          }}>
            Restricted to authorised personnel.
          </p>

          <Field label="Corporate Email">
            <TInput value={email} onChange={e => setEmail(e.target.value)}
              type="email" placeholder="admin@finreport.local" />
          </Field>
          <Field label="Password">
            <TInput value={pw} onChange={e => setPw(e.target.value)}
              type="password" placeholder="Admin@1234" />
          </Field>

          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 700,
              letterSpacing: '0.1em', color: '#6B7A8D',
              textTransform: 'uppercase', fontFamily: font.sans,
            }}>Security Verification</label>
            <CaptchaBox imageBase64={captcha?.imageBase64}
              onRefresh={loadCaptcha} loading={captchaLoading} />
            <div style={{ marginTop: 8 }}>
              <TInput value={captchaInput}
                onChange={e => { setCaptchaInput(e.target.value.toUpperCase()); setErr(''); }}
                placeholder="Type characters above" />
            </div>
          </div>

          <ErrBox msg={err} />

          <PrimaryBtn onClick={handleSignIn} loading={loading}
            disabled={!email || !pw || captchaInput.length < 4}>
            Sign In →
          </PrimaryBtn>

          {/* Dev credentials hint */}
          <div style={{
            marginTop: 18, padding: '10px 14px',
            background: '#F0F2F5', border: '1px solid #DDE3EC', borderRadius: 3,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#6B7A8D',
              fontFamily: font.sans, letterSpacing: '0.08em',
              textTransform: 'uppercase', marginBottom: 4,
            }}>🛠 Dev Credentials</div>
            <div style={{ fontSize: 12.5, fontFamily: font.mono, color: C.blue }}>
              admin@finreport.local
            </div>
            <div style={{ fontSize: 12.5, fontFamily: font.mono, color: C.blue }}>
              Admin@1234
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          marginTop: 28, textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        }}>
          <WLLogo height={14} style={{ opacity: 0.5 }} />
          <span style={{ fontSize: 12, color: '#8A97A8', fontFamily: font.sans }}>
            {COPYRIGHT} &nbsp;·&nbsp; {APP_VERSION}
          </span></div>
      </div>
    </>
  );
}
