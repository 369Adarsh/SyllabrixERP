import { useState, useEffect, useCallback } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { P } from '../../styles/page';
import {
  getTodayAttendance, punchIn, punchOut,
  getAttendanceSummary, getAttendanceReport,
} from '../../api';
import toast from 'react-hot-toast';
import {
  Clock, CheckCircle, XCircle, LogIn, LogOut,
  Calendar, Users, BarChart2, Download,
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtTime  = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
const fmtHours = (h) => h ? `${h}h` : '—';
const MONTHS   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const today    = () => new Date().toISOString().slice(0, 10);

// ── Status chip ───────────────────────────────────────────────────────────────
function StatusChip({ status, hours }) {
  const map = {
    IN:     { bg: '#ECFDF5', color: '#059669', label: 'In' },
    OUT:    { bg: '#F0FDF4', color: '#16A34A', label: 'Out' },
    ABSENT: { bg: '#F9FAFB', color: '#9CA3AF', label: 'Absent' },
  };
  const c = map[status] || map.ABSENT;
  return (
    <span style={{ background: c.bg, color: c.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
      {c.label}{hours ? ` · ${fmtHours(hours)}` : ''}
    </span>
  );
}

// ── Today tab ─────────────────────────────────────────────────────────────────
function TodayTab() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getTodayAttendance();
      setRecords(r.data.data || []);
    } catch { toast.error('Failed to load today\'s attendance'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const punch = async (staffId, type) => {
    setActing(staffId + type);
    try {
      if (type === 'IN')  await punchIn({ staffId });
      else                await punchOut({ staffId });
      toast.success(`${type === 'IN' ? 'Punched in' : 'Punched out'} successfully`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Punch failed');
    } finally { setActing(null); }
  };

  const present = records.filter(r => r.currentStatus === 'IN' || (r.todayLogs?.length > 0)).length;
  const absent  = records.length - present;
  const currentlyIn = records.filter(r => r.isCurrentlyIn).length;

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Staff',    value: records.length, color: 'var(--navy)', icon: Users },
          { label: 'Currently In',   value: currentlyIn,    color: '#059669',     icon: CheckCircle },
          { label: 'Absent',         value: absent,         color: '#DC2626',     icon: XCircle },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon size={16} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Staff list */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={15} color="var(--cyan)" />
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Loading…</div>
        ) : records.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>No active staff found</div>
        ) : records.map(r => (
          <div key={r.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
            borderBottom: '1px solid #F3F4F6',
            background: r.isCurrentlyIn ? '#FAFFFE' : '#fff',
          }}>
            {/* Avatar */}
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: r.isCurrentlyIn ? '#10B981' : '#F3F4F6', color: r.isCurrentlyIn ? '#fff' : '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
              {r.name?.[0]?.toUpperCase()}
            </div>

            {/* Name + role */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>{r.role || 'Staff'}</div>
            </div>

            {/* Times */}
            <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 80 }}>
              {r.firstIn ? (
                <div style={{ fontSize: 12, color: '#059669', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                  {fmtTime(r.firstIn)}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: '#D1D5DB' }}>—</div>
              )}
              <div style={{ fontSize: 10, color: '#9CA3AF' }}>{r.hoursWorked ? `${r.hoursWorked}h worked` : 'Not punched in'}</div>
            </div>

            {/* Status */}
            <StatusChip status={r.currentStatus} />

            {/* Punch actions */}
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {!r.isCurrentlyIn ? (
                <button
                  onClick={() => punch(r.id, 'IN')}
                  disabled={acting === r.id + 'IN'}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 8, border: '1.5px solid #059669', color: '#059669', background: 'transparent', fontSize: 11, fontWeight: 700, cursor: 'pointer', opacity: acting === r.id + 'IN' ? 0.6 : 1, whiteSpace: 'nowrap' }}>
                  <LogIn size={11} /> Punch In
                </button>
              ) : (
                <button
                  onClick={() => punch(r.id, 'OUT')}
                  disabled={acting === r.id + 'OUT'}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 8, border: '1.5px solid #DC2626', color: '#DC2626', background: 'transparent', fontSize: 11, fontWeight: 700, cursor: 'pointer', opacity: acting === r.id + 'OUT' ? 0.6 : 1, whiteSpace: 'nowrap' }}>
                  <LogOut size={11} /> Punch Out
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Monthly summary tab ───────────────────────────────────────────────────────
function SummaryTab() {
  const now = new Date();
  const [year,    setYear]    = useState(now.getFullYear());
  const [month,   setMonth]   = useState(now.getMonth() + 1);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay   = new Date(year, month, 0).getDate();
      const endDate   = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
      const r = await getAttendanceSummary({ from: startDate, to: endDate });
      setSummary(r.data.data || []);
    } catch { toast.error('Failed to load summary'); }
    finally { setLoading(false); }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const totalDays = new Date(year, month, 0).getDate();

  return (
    <div>
      {/* Month picker */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={month} onChange={e => setMonth(Number(e.target.value))}
          style={{ padding: '8px 14px', border: '1.5px solid var(--border)', borderRadius: 9, fontSize: 13, background: '#fff', cursor: 'pointer' }}>
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={year} onChange={e => setYear(Number(e.target.value))}
          style={{ padding: '8px 14px', border: '1.5px solid var(--border)', borderRadius: 9, fontSize: 13, background: '#fff', cursor: 'pointer' }}>
          {[now.getFullYear() - 1, now.getFullYear()].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Loading summary…</div>
      ) : summary.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>No attendance data for this period</div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 80px', gap: 0, padding: '10px 20px', background: '#F9FAFB', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>Staff</span>
            <span style={{ textAlign: 'center' }}>Present</span>
            <span style={{ textAlign: 'center' }}>Absent</span>
            <span style={{ textAlign: 'center' }}>Hrs</span>
            <span style={{ textAlign: 'center' }}>%</span>
          </div>

          {summary.map(row => {
            const absent  = totalDays - (row.presentDays || 0);
            const pct     = Math.round(((row.presentDays || 0) / totalDays) * 100);
            const pctColor = pct >= 80 ? '#059669' : pct >= 60 ? '#F59E0B' : '#DC2626';
            return (
              <div key={row.staff?.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 80px', gap: 0, padding: '12px 20px', borderBottom: '1px solid #F3F4F6', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>{row.staff?.name}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{row.staff?.role}</div>
                </div>
                <div style={{ textAlign: 'center', fontWeight: 700, color: '#059669', fontSize: 14 }}>{row.presentDays || 0}</div>
                <div style={{ textAlign: 'center', fontWeight: 700, color: absent > 0 ? '#DC2626' : '#9CA3AF', fontSize: 14 }}>{absent}</div>
                <div style={{ textAlign: 'center', fontSize: 13, color: '#374151', fontFamily: 'var(--font-mono)' }}>{fmtHours(row.totalHours)}</div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: pctColor, background: `${pctColor}12`, padding: '2px 8px', borderRadius: 20 }}>{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AttendancePage() {
  const { isMobile } = useBreakpoint();
  const [tab, setTab] = useState('today');

  const TABS = [
    { id: 'today',   label: "Today's Attendance", icon: Clock     },
    { id: 'summary', label: 'Monthly Summary',    icon: BarChart2 },
  ];

  return (
    <div style={{ ...P.wrap(isMobile), maxWidth: 900, margin: '0 auto' }}>
      <div style={P.head}>
        <div>
          <h1 style={P.h1(isMobile)}>Attendance</h1>
          <p style={P.sub}>Track staff punch-in/out and monthly summaries</p>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', borderRadius: 10, padding: 4, marginBottom: 24, width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
            background: tab === t.id ? 'var(--navy)' : 'transparent',
            color:      tab === t.id ? '#fff' : '#6B7280',
            transition: 'all 0.12s',
          }}>
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'today'   && <TodayTab />}
      {tab === 'summary' && <SummaryTab />}
    </div>
  );
}
