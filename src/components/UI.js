import React, { useState } from 'react';
import { C, font } from '../theme';

export function TInput({ value, onChange, type, placeholder, disabled, rows }) {
  const [focused, setFocused] = useState(false);
  const style = {
    width: '100%', padding: '10px 14px', borderRadius: 3,
    border: '1.5px solid ' + (focused ? C.navy : C.border),
    background: disabled ? C.bg : C.white,
    color: C.navyD, fontSize: 14, outline: 'none',
    fontFamily: font.sans, boxSizing: 'border-box',
    transition: 'border 0.18s',
    resize: rows ? 'vertical' : undefined,
  };
  if (rows) {
    return React.createElement('textarea', {
      rows, value, onChange, placeholder,
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
      style,
    });
  }
  return React.createElement('input', {
    type: type || 'text', value, onChange, placeholder, disabled,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style,
  });
}

export function Field({ label, hint, children }) {
  return React.createElement('div', { style: { marginBottom: 18 } },
    React.createElement('label', {
      style: {
        display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 700,
        letterSpacing: '0.1em', color: C.slateL, textTransform: 'uppercase', fontFamily: font.sans,
      }
    }, label),
    children,
    hint && React.createElement('div', {
      style: { marginTop: 4, fontSize: 11.5, color: C.muted, fontFamily: font.sans }
    }, hint)
  );
}

export function PrimaryBtn({ children, onClick, disabled, loading, small }) {
  const [hov, setHov] = useState(false);
  return React.createElement('button', {
    onClick, disabled: disabled || loading,
    onMouseEnter: () => setHov(true),
    onMouseLeave: () => setHov(false),
    style: {
      padding: small ? '8px 18px' : '11px 24px', borderRadius: 3,
      background: (disabled || loading) ? C.muted : hov ? C.navyD : C.navy,
      color: C.white, border: 'none',
      cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
      fontSize: small ? 12.5 : 13.5, fontWeight: 700, letterSpacing: '0.07em',
      fontFamily: font.sans, textTransform: 'uppercase',
      transition: 'background 0.18s', whiteSpace: 'nowrap',
    }
  }, loading ? 'Please wait…' : children);
}

export function GhostBtn({ children, onClick, small }) {
  const [hov, setHov] = useState(false);
  return React.createElement('button', {
    onClick,
    onMouseEnter: () => setHov(true),
    onMouseLeave: () => setHov(false),
    style: {
      padding: small ? '7px 16px' : '10px 22px', borderRadius: 3,
      background: hov ? C.bg : 'transparent', color: C.slate,
      border: '1.5px solid ' + C.border, cursor: 'pointer',
      fontSize: small ? 12.5 : 13.5, fontFamily: font.sans,
      letterSpacing: '0.04em', transition: 'all 0.15s', whiteSpace: 'nowrap',
    }
  }, children);
}

export function Pills({ options, value, onChange }) {
  return React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 6 } },
    options.map(o =>
      React.createElement('button', {
        key: o, onClick: () => onChange(o),
        style: {
          padding: '7px 13px', borderRadius: 2, fontSize: 12.5, fontWeight: 600,
          fontFamily: font.sans, cursor: 'pointer', transition: 'all 0.15s',
          background: value === o ? C.navy : '#F8FAFC',
          color: value === o ? C.white : C.slate,
          border: '1.5px solid ' + (value === o ? C.navy : C.border),
        }
      }, o)
    )
  );
}

export function Badge({ children, color }) {
  const map = {
    blue:  { bg: C.blueL,  text: C.blue,  border: C.blueB  },
    green: { bg: C.greenL, text: C.green,  border: C.greenB },
    amber: { bg: C.amberL, text: C.amber,  border: '#FDE68A'},
    red:   { bg: C.redL,   text: C.red,    border: C.redB   },
    navy:  { bg: '#EFF6FF', text: C.navy,  border: '#BFDBFE'},
  };
  const m = map[color || 'blue'];
  return React.createElement('span', {
    style: {
      display: 'inline-block', padding: '2px 9px', borderRadius: 2,
      background: m.bg, color: m.text, border: '1px solid ' + m.border,
      fontSize: 11.5, fontWeight: 700, letterSpacing: '0.07em',
      fontFamily: font.sans, textTransform: 'uppercase',
    }
  }, children);
}

export function ErrBox({ msg }) {
  if (!msg) return null;
  return React.createElement('div', {
    style: {
      marginBottom: 14, padding: '9px 14px', background: C.redL,
      border: '1px solid ' + C.redB, borderRadius: 3, color: C.red,
      fontSize: 13, fontFamily: font.sans,
    }
  }, msg);
}

export function InfoBox({ msg, color }) {
  if (!msg) return null;
  const map = {
    blue:  [C.blueL,  C.blueB,  C.blue ],
    green: [C.greenL, C.greenB, C.green],
  };
  const [bg, border, text] = map[color || 'blue'];
  return React.createElement('div', {
    style: {
      marginBottom: 14, padding: '9px 14px', background: bg,
      border: '1px solid ' + border, borderRadius: 3, color: text,
      fontSize: 13, fontFamily: font.sans,
    }
  }, msg);
}

export function Divider({ label }) {
  return React.createElement('div', {
    style: { display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }
  },
    React.createElement('div', { style: { flex: 1, height: 1, background: C.border } }),
    label && React.createElement('span', {
      style: { fontSize: 11, color: C.muted, fontFamily: font.sans, letterSpacing: '0.1em', textTransform: 'uppercase' }
    }, label),
    React.createElement('div', { style: { flex: 1, height: 1, background: C.border } })
  );
}

export function TopBar({ title, subtitle }) {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  return React.createElement('div', {
    style: {
      padding: '20px 32px', background: C.white,
      borderBottom: '1px solid ' + C.border,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
    }
  },
    React.createElement('div', null,
      React.createElement('h1', {
        style: { margin: 0, fontSize: 20, fontWeight: 700, color: C.navyD, fontFamily: font.serif, letterSpacing: '-0.01em' }
      }, title),
      subtitle && React.createElement('p', {
        style: { margin: '3px 0 0', fontSize: 13, color: C.slateL, fontFamily: font.sans }
      }, subtitle)
    ),
    React.createElement('div', { style: { fontSize: 12, color: C.muted, fontFamily: font.sans } }, today)
  );
}

export function PageWrap({ children }) {
  return React.createElement('div', { style: { padding: 32, flex: 1, overflowY: 'auto' } }, children);
}

export function SelectInput({ value, onChange, children }) {
  return React.createElement('select', {
    value, onChange,
    style: {
      width: '100%', padding: '10px 14px', borderRadius: 3,
      border: '1.5px solid ' + C.border, background: C.white,
      color: value ? C.navyD : C.muted, fontSize: 14,
      outline: 'none', fontFamily: font.sans, boxSizing: 'border-box',
    }
  }, children);
}
