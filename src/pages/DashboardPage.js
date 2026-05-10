import React from 'react';
import { C, font } from '../theme';
import { Badge, TopBar, PageWrap, PrimaryBtn, GhostBtn } from '../components/UI';

const STATS = [
  { label: 'Scheduled Reports', value: '14', trend: '+2 this month',       color: C.navy    },
  { label: 'Runs This Month',   value: '47', trend: '↑ 12% vs last month', color: C.green   },
  { label: 'Templates Loaded',  value: '9',  trend: '3 updated recently',  color: C.navyL   },
  { label: 'Delivery Failures', value: '1',  trend: 'Requires attention',  color: '#B91C1C' },
];

const RECENT = [
  { name: 'Monthly P&L – North America', type: 'P&L Statement',    lastRun: '01 Mar 2026', status: 'success', fmt: 'PDF'   },
  { name: 'Q4 Balance Sheet Review',     type: 'Balance Sheet',    lastRun: '28 Feb 2026', status: 'success', fmt: 'Excel' },
  { name: 'AR Aging Weekly',             type: 'AR Aging',         lastRun: '28 Feb 2026', status: 'failed',  fmt: 'PDF'   },
  { name: 'Budget vs Actual – Q1',       type: 'Budget vs Actual', lastRun: '27 Feb 2026', status: 'success', fmt: 'CSV'   },
  { name: 'GL Summary – Feb 2026',       type: 'GL Summary',       lastRun: '01 Mar 2026', status: 'pending', fmt: 'PDF'   },
];

function StatCard({ label, value, trend, color }) {
  return (
    <div style={{ background: C.white, border: '1px solid ' + C.border, borderRadius: 4, padding: '22px 24px', borderTop: '4px solid ' + color, boxShadow: '0 1px 8px #1B3A5C08' }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: C.muted, textTransform: 'uppercase', fontFamily: font.sans, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: C.navyD, fontFamily: font.serif, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12.5, color: C.slateL, fontFamily: font.sans }}>{trend}</div>
    </div>
  );
}

export default function DashboardPage({ setPage }) {
  return (
    <>
      <TopBar title="Dashboard" subtitle="Worldline Report Engine — Overview" />
      <PageWrap>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {STATS.map(s => <StatCard key={s.label} {...s} />)}
        </div>

        <div style={{ background: C.white, border: '1px solid ' + C.border, borderRadius: 4, padding: '20px 24px', marginBottom: 24, boxShadow: '0 1px 8px #1B3A5C08' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.navyD, fontFamily: font.serif, marginBottom: 14 }}>Quick Actions</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <PrimaryBtn onClick={() => setPage('upload')}   small>+ Upload Template</PrimaryBtn>
            <PrimaryBtn onClick={() => setPage('schedule')} small>+ Schedule Report</PrimaryBtn>
            <GhostBtn   onClick={() => setPage('reports')}  small>View All Schedules</GhostBtn>
            <GhostBtn   onClick={() => setPage('history')}  small>Run History</GhostBtn>
          </div>
        </div>

        <div style={{ background: C.white, border: '1px solid ' + C.border, borderRadius: 4, boxShadow: '0 1px 8px #1B3A5C08' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid ' + C.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.navyD, fontFamily: font.serif }}>Recent Report Activity</div>
            <button onClick={() => setPage('history')} style={{ fontSize: 12.5, color: C.navyL, background: 'none', border: 'none', cursor: 'pointer', fontFamily: font.sans }}>View all →</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {['Report Name', 'Category', 'Format', 'Last Run', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: C.muted, textTransform: 'uppercase', fontFamily: font.sans, borderBottom: '1px solid ' + C.border }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECENT.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid ' + C.border }}>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: C.navyD, fontFamily: font.sans }}>{r.name}</td>
                  <td style={{ padding: '12px 16px' }}><Badge color="navy">{r.type}</Badge></td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: C.slate, fontFamily: font.sans }}>{r.fmt}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: C.slateL, fontFamily: font.mono }}>{r.lastRun}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <Badge color={r.status === 'success' ? 'green' : r.status === 'failed' ? 'red' : 'amber'}>{r.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageWrap>
    </>
  );
}
