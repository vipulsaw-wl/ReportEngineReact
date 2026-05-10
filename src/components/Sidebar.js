import React, { useState } from 'react';
import WLLogo from './WLLogo';
import { C, font } from '../theme';

const NAV = [
  { key:'dashboard',    icon:'⊞', label:'Dashboard'        },
  { key:'platforms',    icon:'⊡', label:'Platforms'         },
  { key:'upload',       icon:'↑', label:'Upload Template'   },
  { key:'schedule',     icon:'⊕', label:'Schedule Report'   },
  { key:'reports',      icon:'≡', label:'Scheduled Reports' },
  { key:'history',      icon:'◷', label:'Run History'       },
  { key:'merchantbank', icon:'⊞', label:'Merchants & Banks' },
  { key:'bulkschedule', icon:'⧉', label:'Bulk Schedules'    },
  { key:'queryrun',     icon:'⟩', label:'Query Runner'      },
  { key:'settings',     icon:'⚙', label:'Settings'          },
];

const NAV_GROUPS = [
  { label: 'NAVIGATION',  keys: ['dashboard'] },
  { label: 'MANAGEMENT',  keys: ['platforms','upload'] },
  { label: 'REPORTS',     keys: ['schedule','reports','history','bulkschedule'] },
  { label: 'DATA',        keys: ['merchantbank','queryrun'] },
  { label: 'SYSTEM',      keys: ['settings'] },
];

function NavItem({ item, active, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '7px 16px', border: 'none',
        cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s',
        background: active ? C.teal : hov ? C.navHover : 'transparent',
        borderLeft: active ? '3px solid #FFFFFF' : '3px solid transparent',
      }}>
      <span style={{ fontSize: 13, color: active ? '#FFFFFF' : C.navText, width: 16,
                     textAlign: 'center', flexShrink: 0 }}>
        {item.icon}
      </span>
      <span style={{ fontSize: 13, fontFamily: font.sans, fontWeight: active ? 600 : 400,
                     color: active ? '#FFFFFF' : hov ? '#FFFFFF' : C.navText,
                     whiteSpace: 'nowrap' }}>
        {item.label}
      </span>
    </button>
  );
}

export default function Sidebar({ page, setPage, user, onLogout }) {
  return (
    <div style={{
      width: 220, minHeight: '100vh', background: C.navDark,
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
    }}>
      {/* Brand header — Worldline logo */}
      <div style={{
        background: C.teal, padding: '0 18px',
        height: 48, display: 'flex', alignItems: 'center', gap: 12,
        flexShrink: 0,
      }}>
        <WLLogo height={16} onDark={true} />
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.9)',
                       fontFamily: font.sans, letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
          Report Engine
        </span>
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1, paddingTop: 8, overflowY: 'auto' }}>
        {NAV_GROUPS.map(group => {
          const items = NAV.filter(n => group.keys.includes(n.key));
          return (
            <div key={group.label} style={{ marginBottom: 4 }}>
              <div style={{
                padding: '10px 16px 4px',
                fontSize: 9.5, fontWeight: 700, color: '#5A7080',
                letterSpacing: '0.1em', fontFamily: font.sans,
                textTransform: 'uppercase',
              }}>
                {group.label}
              </div>
              {items.map(item => (
                <NavItem key={item.key} item={item}
                  active={page === item.key}
                  onClick={() => setPage(item.key)} />
              ))}
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      {/* Copyright */}
      <div style={{
        padding: '8px 16px', borderTop: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <WLLogo height={16} onDark={true} />
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)',
                      fontFamily: font.sans, lineHeight: 1.5 }}>
          © 2026 Worldline India Pvt. Ltd.<br />All rights reserved. &nbsp; v1.0
        </div>
      </div>

      {user && (
        <div style={{
          borderTop: '1px solid ' + C.navItem,
          padding: '10px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
            {/* Avatar circle */}
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: C.teal, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 13, color: '#FFFFFF',
              fontWeight: 700, fontFamily: font.head, flexShrink: 0,
            }}>
              {(user.name || user.email || 'U')[0].toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#FFFFFF',
                            fontFamily: font.sans, overflow: 'hidden',
                            textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name || user.email}
              </div>
              <div style={{ fontSize: 10.5, color: '#8A9BA5', fontFamily: font.sans,
                            textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {user.role || 'User'}
              </div>
            </div>
          </div>
          <button onClick={onLogout}
            style={{
              width: '100%', padding: '5px 0', borderRadius: 2,
              background: 'transparent', color: '#8A9BA5',
              border: '1px solid #3D5260', cursor: 'pointer',
              fontSize: 11.5, fontFamily: font.sans, fontWeight: 500,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = C.navHover; e.currentTarget.style.color = '#FFFFFF'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8A9BA5'; }}>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
