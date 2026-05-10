/**
 * WLLayout.js — Worldline ServiceNow-style layout system
 * Replaces the dark navy theme with the Worldline teal/light enterprise theme.
 */
import React, { useState } from 'react';
import WLLogo from './WLLogo';
import { WL, WF } from '../theme-wl';
import { APP_NAME, APP_VERSION, COPYRIGHT } from '../wl-brand';

// ── Top Navigation Bar ────────────────────────────────────────────────────────
export function WLTopBar({ title, user, onLogout }) {
  return (
    <div style={{
      height: 52, background: WL.teal,
      display: 'flex', alignItems: 'center',
      padding: '0 20px', gap: 16,
      boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
      flexShrink: 0, zIndex: 100,
    }}>
      {/* Worldline logo */}
      <WLLogo height={22} onDark={true} />

      {/* Divider */}
      <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />

      {/* App name + version */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ color: '#fff', fontSize: 14, fontWeight: 700,
                       fontFamily: WF.sans, lineHeight: 1.2 }}>{APP_NAME}</span>
        <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10,
                       fontFamily: WF.sans, letterSpacing: '0.08em',
                       textTransform: 'uppercase' }}>{APP_VERSION}</span>
      </div>

      {/* Page title — center */}
      <div style={{ flex: 1, textAlign: 'center',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {title && (
          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13.5,
                         fontFamily: WF.sans, fontWeight: 600 }}>
            {title}
          </span>
        )}
      </div>

      {/* User info + logout */}
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {/* Avatar */}
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            border: '2px solid rgba(255,255,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: WF.sans,
          }}>
            {(user.name || user.email || 'U')[0].toUpperCase()}
          </div>
          {/* Name */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#fff',
                           fontFamily: WF.sans, lineHeight: 1.2,
                           maxWidth: 140, overflow: 'hidden',
                           textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name || user.email}
            </span>
            <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.65)',
                           fontFamily: WF.sans, textTransform: 'uppercase',
                           letterSpacing: '0.06em' }}>
              {user.role || 'User'}
            </span>
          </div>
          {/* Logout button — clearly visible */}
          <button
            onClick={onLogout}
            title="Sign Out"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 3, cursor: 'pointer',
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.35)',
              color: '#fff', fontSize: 12.5, fontFamily: WF.sans, fontWeight: 600,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          >
            <span style={{ fontSize: 14 }}>⏻</span> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

// ── History Sidebar ───────────────────────────────────────────────────────────
export function WLSidebar({ items, onSelect, selected, user, onLogout }) {
  const [search, setSearch] = useState('');
  const filtered = (items || []).filter(item =>
    !search || item.label?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      width: 280, background: WL.sidebarBg, display: 'flex',
      flexDirection: 'column', height: '100%', flexShrink: 0,
      borderRight: '1px solid rgba(255,255,255,0.08)',
    }}>
      {/* Filter bar */}
      <div style={{
        padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.08)', borderRadius: 4,
          padding: '6px 10px', border: '1px solid rgba(255,255,255,0.12)',
        }}>
          <span style={{ color: WL.sidebarText, fontSize: 13 }}>⊟</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Filter" style={{
              background: 'none', border: 'none', outline: 'none',
              color: '#fff', fontSize: 13, fontFamily: WF.sans, flex: 1,
            }} />
          <span style={{ color: WL.sidebarText, fontSize: 13, cursor: 'pointer' }}>+</span>
        </div>
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.map((item, i) => {
          const isSelected = selected === item.key;
          const isDateGroup = item.type === 'date';
          if (isDateGroup) return (
            <div key={i} style={{
              padding: '14px 16px 6px',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: WL.textMuted,
                             fontFamily: WF.sans, letterSpacing: '0.06em' }}>
                {item.label}
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
            </div>
          );
          return (
            <div key={i} onClick={() => onSelect && onSelect(item.key)}
              style={{
                padding: '8px 16px', cursor: 'pointer',
                background: isSelected ? 'rgba(0,169,157,0.15)' : 'transparent',
                borderLeft: isSelected ? '3px solid ' + WL.teal : '3px solid transparent',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = WL.sidebarHov; }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}>
              <div style={{
                display: 'flex', alignItems: 'baseline',
                justifyContent: 'space-between', marginBottom: 2,
              }}>
                <span style={{
                  fontSize: 13, fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? WL.teal : '#fff', fontFamily: WF.sans,
                }}>{item.label}</span>
                {item.time && <span style={{
                  fontSize: 11, color: WL.textMuted, fontFamily: WF.sans,
                }}>{item.time}</span>}
              </div>
              {item.sub && <div style={{
                fontSize: 12, color: WL.sidebarText, fontFamily: WF.sans,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{item.sub}</div>}
            </div>
          );
        })}
      </div>

     

      {/* User footer */}
      {user && (
        <div style={{
          padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: WL.teal,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {(user.name || user.email || 'U')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff',
                          fontFamily: WF.sans, overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name || user.email}
            </div>
            <div style={{ fontSize: 11, color: WL.textMuted, fontFamily: WF.sans }}>
              {user.role || 'User'}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// ── Stage Progress Bar ────────────────────────────────────────────────────────
export function WLStageBar({ stages, current }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', margin: '0 0 20px',
      borderRadius: 0, overflow: 'hidden', height: 36,
    }}>
      {stages.map((stage, i) => {
        const isDone    = i < current;
        const isActive  = i === current;
        const isLast    = i === stages.length - 1;
        return (
          <div key={stage} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 10px 0 18px',
            background: isLast && isActive ? WL.tealD
                      : isActive ? WL.sidebarBg
                      : isDone   ? 'rgba(0,169,157,0.12)'
                      : '#EAECF0',
            color: isLast && isActive ? '#fff'
                 : isActive ? '#fff'
                 : isDone   ? WL.teal
                 : WL.textSec,
            fontSize: 12.5, fontWeight: isActive || isDone ? 600 : 500,
            fontFamily: WF.sans, position: 'relative', cursor: 'default',
            clipPath: isLast ? 'none'
              : 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)',
            borderRight: isLast ? 'none' : 'none',
            gap: 5,
            transition: 'all 0.15s',
          }}>
            {isDone && <span style={{ fontSize: 11 }}>✓</span>}
            <span style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{stage}</span>
            {isDone && <span style={{ fontSize: 11 }}>✓</span>}
          </div>
        );
      })}
    </div>
  );
}

// ── Record Header ─────────────────────────────────────────────────────────────
export function WLRecordHeader({ type, number, view, actions }) {
  return (
    <div style={{
      padding: '10px 20px', background: WL.white,
      borderBottom: '1px solid ' + WL.border,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <button style={{
        width: 28, height: 28, borderRadius: 4,
        border: '1px solid ' + WL.border, background: WL.white,
        cursor: 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: WL.textSec, fontSize: 12,
      }}>‹</button>
      <span style={{ color: WL.textMuted, fontSize: 15, cursor: 'pointer' }}>☰</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11.5, color: WL.textMuted, fontFamily: WF.sans }}>{type}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: WL.textPrimary,
                      fontFamily: WF.sans, display: 'flex', alignItems: 'center', gap: 8 }}>
          {number}
          {view && <span style={{ fontSize: 12, fontWeight: 400, color: WL.textSec }}>
            View: {view}
          </span>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {(actions || []).map(a => (
          <button key={a.label} onClick={a.onClick} style={{
            padding: '6px 14px', borderRadius: 4, fontSize: 13, fontFamily: WF.sans,
            fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s',
            background: a.primary ? WL.teal : WL.white,
            color: a.primary ? '#fff' : WL.textPrimary,
            border: '1px solid ' + (a.primary ? WL.teal : WL.border),
          }}>{a.label}</button>
        ))}
      </div>
    </div>
  );
}

// ── Alert Banner ──────────────────────────────────────────────────────────────
export function WLAlert({ type = 'warning', message, onClose }) {
  const colors = {
    warning: { bg: '#FFFFF0', border: '#E8E080', icon: '⚠', text: '#5C5C00' },
    info:    { bg: '#EFF6FF', border: '#BAD7FF', icon: 'ℹ', text: '#1A4480' },
    error:   { bg: '#FFF0F0', border: '#FFBABA', icon: '✕', text: '#8B0000' },
    success: { bg: '#F0FFF4', border: '#B2EFC5', icon: '✓', text: '#1A5C30' },
  };
  const c = colors[type] || colors.warning;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 16px', marginBottom: 16,
      background: c.bg, border: '1px solid ' + c.border, borderRadius: 4,
      fontSize: 13, fontFamily: WF.sans, color: c.text,
    }}>
      <span style={{ fontSize: 14 }}>{c.icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && <span onClick={onClose} style={{ cursor: 'pointer', opacity: 0.6 }}>✕</span>}
    </div>
  );
}

// ── Form Field ────────────────────────────────────────────────────────────────
export function WLField({ label, value, link, actions, hint, children, col = 1 }) {
  return (
    <div style={{
      display: 'contents',
    }}>
      <div style={{
        padding: '7px 12px 7px 0',
        textAlign: 'right', alignSelf: 'center',
      }}>
        {link
          ? <span style={{ fontSize: 13, color: WL.textLink, fontFamily: WF.sans,
                           cursor: 'pointer', textDecoration: 'none' }}
              onMouseEnter={e => e.target.style.textDecoration = 'underline'}
              onMouseLeave={e => e.target.style.textDecoration = 'none'}>{label}</span>
          : <label style={{ fontSize: 13, color: WL.textSec, fontFamily: WF.sans }}>{label}</label>
        }
      </div>
      <div style={{ padding: '5px 0', alignSelf: 'center', display: 'flex',
                    alignItems: 'center', gap: 6 }}>
        {children || (
          <div style={{
            background: WL.fieldBg, border: '1px solid ' + WL.fieldBorder,
            borderRadius: 3, padding: '5px 10px', fontSize: 13,
            fontFamily: WF.sans, color: WL.fieldText, minHeight: 28,
            minWidth: 180, flex: 1,
          }}>
            {value}
          </div>
        )}
        {actions && actions.map((a, i) => (
          <button key={i} title={a.title} style={{
            width: 26, height: 26, borderRadius: 3,
            border: '1px solid ' + WL.border, background: WL.white,
            cursor: 'pointer', fontSize: 12, color: WL.textSec,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{a.icon}</button>
        ))}
      </div>
    </div>
  );
}

// ── Two-column Form Grid ──────────────────────────────────────────────────────
export function WLFormGrid({ children }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(140px, 180px) 1fr minmax(140px, 180px) 1fr',
      gap: '2px 16px', padding: '8px 0',
      alignItems: 'start',
    }}>
      {children}
    </div>
  );
}

// ── Section Panel ─────────────────────────────────────────────────────────────
export function WLPanel({ title, children, style }) {
  return (
    <div style={{
      background: WL.white,
      border: '1px solid ' + WL.border, borderRadius: 4,
      marginBottom: 16, overflow: 'hidden', ...style,
    }}>
      {title && (
        <div style={{
          padding: '8px 16px', background: WL.contentBg,
          borderBottom: '1px solid ' + WL.border,
          fontSize: 13, fontWeight: 700, color: WL.textPrimary, fontFamily: WF.sans,
        }}>{title}</div>
      )}
      <div style={{ padding: '12px 16px' }}>{children}</div>
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
export function WLBadge({ status }) {
  const map = {
    Closed:   { bg: '#E0F4F4', color: WL.tealD, border: WL.teal },
    Open:     { bg: '#E6F0FF', color: '#0044AA', border: '#99BBFF' },
    Active:   { bg: WL.greenL, color: WL.green,  border: '#80D9A0' },
    Pending:  { bg: WL.amberL, color: '#7A4F00', border: '#F5C842' },
    Failed:   { bg: WL.redL,   color: WL.red,    border: '#FF9999' },
    Paused:   { bg: '#FFF8E6', color: '#7A4F00', border: '#FFD180' },
    New:      { bg: '#F0F2F5', color: WL.textSec, border: WL.border },
  };
  const s = map[status] || map.New;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 9px', borderRadius: 3,
      fontSize: 12, fontWeight: 600, fontFamily: WF.sans,
      background: s.bg, color: s.color, border: '1px solid ' + s.border,
    }}>{status}</span>
  );
}

// ── Footer ───────────────────────────────────────────────────────────────────
export function WLFooter() {
  return (
    <div style={{
      padding: '8px 24px',
      background: WL.white,
      borderTop: '1px solid ' + WL.border,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <WLLogo height={16} />
        <span style={{
          fontSize: 12, color: WL.textMuted, fontFamily: WF.sans,
          borderLeft: '1px solid ' + WL.border, paddingLeft: 12,
        }}>{APP_NAME}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 11.5, color: WL.textMuted, fontFamily: WF.sans }}>
          {COPYRIGHT}
        </span>
        <span style={{
          fontSize: 11, color: '#fff', fontFamily: WF.sans, fontWeight: 700,
          background: WL.teal, padding: '2px 8px', borderRadius: 2,
          letterSpacing: '0.04em',
        }}>{APP_VERSION}</span>
      </div>
    </div>
  );
}
