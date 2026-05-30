import { useEffect, useState, useCallback } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import KpiBar from '../../components/ui/KpiBar';
import { P } from '../../styles/page';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import toast from 'react-hot-toast';
import {
  Users, Clock, CheckCircle, XCircle, Plus, Edit2, Trash2,
  LogIn, LogOut, RefreshCw, BarChart2, Fingerprint, Link2,
  Shield, Search, IndianRupee, ChevronDown, ChevronUp,
  Dumbbell, Calendar, Phone, Mail, Star, Award, MessageCircle,
  X, User, TrendingUp, Activity,
} from 'lucide-react';
import {
  getStaff, createStaff, updateStaff, deleteStaff, toggleStaffActive,
  getTodayAttendance, punchIn, punchOut, getAttendanceSummary,
  getPayrollRuns, getPayrollRun, processPayroll, markPayrollPaid,
  getAppointments,
} from '../../api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TrainingPlans from './TrainingPlans';
import Badge from '../../components/ui/Badge';

const GYM_TYPES = ['GYM', 'SPA'];

// ── Formatters ───────────────────────────────────────────────────────────────
const fmtTime = (dt) => dt ? new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
const fmtDate = (dt) => dt ? new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtMoney = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const isToday = (d) => new Date(d).toDateString() === new Date().toDateString();

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ── Gym specialization presets ────────────────────────────────────────────────
const GYM_SPECIALIZATIONS = [
  'Yoga', 'Zumba', 'CrossFit', 'Cardio', 'Pilates', 'Boxing', 'Cycling',
  'Swimming', 'HIIT', 'Strength Training', 'Functional Training', 'Dance',
  'Meditation', 'Aerobics', 'Kickboxing', 'Personal Training',
];

const GYM_ROLES = [
  'Personal Trainer', 'Group Instructor', 'Yoga Instructor', 'Zumba Instructor',
  'CrossFit Coach', 'Nutritionist', 'Head Trainer', 'Senior Trainer', 'Assistant Trainer',
];

// Color palette for specializations
const SPEC_PALETTE = ['#8B5CF6','#3B82F6','#EF4444','#10B981','#F59E0B','#06B6D4','#EC4899','#6366F1','#F97316','#84CC16'];
const specColorCache = {};
const specColor = (name) => {
  if (!name) return '#6B7280';
  if (specColorCache[name]) return specColorCache[name];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  specColorCache[name] = SPEC_PALETTE[Math.abs(h) % SPEC_PALETTE.length];
  return specColorCache[name];
};

// Avatar gradient per name
const GRAD_PAIRS = [
  ['#0F2349','#1FB8D6'], ['#7C3AED','#A78BFA'], ['#065F46','#34D399'],
  ['#92400E','#FBBF24'], ['#1E3A8A','#60A5FA'], ['#881337','#FB7185'],
];
const trainerGradient = (name) => {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  const [a, b] = GRAD_PAIRS[Math.abs(h) % GRAD_PAIRS.length];
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
};

// ── Payroll RunRow ────────────────────────────────────────────────────────────
function RunRow({ run, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [paying, setPaying] = useState(false);

  const toggle = async () => {
    if (!expanded && !detail) {
      setLoadingDetail(true);
      try { const res = await getPayrollRun(run.id); setDetail(res.data.data); }
      catch { toast.error('Failed to load details'); }
      finally { setLoadingDetail(false); }
    }
    setExpanded(x => !x);
  };

  const pay = async () => {
    setPaying(true);
    try { await markPayrollPaid(run.id); toast.success('Payroll marked as paid'); onRefresh(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setPaying(false); }
  };

  return (
    <>
      <tr style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={toggle}>
        <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>{MONTHS[run.month - 1]} {run.year}</td>
        <td style={{ padding: '12px 16px', fontSize: 13 }}>{run._count?.entries || run.entries?.length || 0} employees</td>
        <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: 14 }}>{fmtMoney(run.totalNet)}</td>
        <td style={{ padding: '12px 16px', fontSize: 13, color: '#6B7280' }}>{fmtMoney(run.totalDeductions)}</td>
        <td style={{ padding: '12px 16px' }}><Badge variant={run.status === 'PAID' ? 'success' : run.status === 'PROCESSED' ? 'info' : 'secondary'}>{run.status}</Badge></td>
        <td style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
            {run.status === 'PROCESSED' && (
              <button onClick={pay} disabled={paying} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '4px 12px', borderRadius: 6, border: '1px solid var(--emerald)', color: 'var(--emerald)', background: 'none', cursor: 'pointer', fontWeight: 600 }}>
                <CheckCircle size={12} />{paying ? '…' : 'Mark Paid'}
              </button>
            )}
            {expanded ? <ChevronUp size={14} color="#9CA3AF" /> : <ChevronDown size={14} color="#9CA3AF" />}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr style={{ background: '#F9FAFB' }}>
          <td colSpan={6} style={{ padding: '12px 24px 16px' }}>
            {loadingDetail ? <p style={{ color: '#9CA3AF', fontSize: 13 }}>Loading details…</p>
              : (detail?.entries || run.entries)?.length > 0 ? (
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ color: '#6B7280' }}>
                      {['Employee', 'Days', 'Basic', 'HRA', 'Allowances', 'Gross', 'PF (EE)', 'ESI (EE)', 'PT', 'Net Pay'].map(h => (
                        <th key={h} style={{ textAlign: h === 'Employee' ? 'left' : 'right', paddingBottom: 6, fontWeight: 600, paddingRight: 8 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(detail?.entries || run.entries).map(e => (
                      <tr key={e.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '6px 8px 6px 0', fontWeight: 600 }}>{e.staff?.name || '—'}</td>
                        <td style={{ textAlign: 'right', padding: '6px 8px' }}>{e.presentDays}/{e.workingDays}</td>
                        <td style={{ textAlign: 'right', padding: '6px 8px' }}>{fmtMoney(e.basicSalary)}</td>
                        <td style={{ textAlign: 'right', padding: '6px 8px' }}>{fmtMoney(e.hra)}</td>
                        <td style={{ textAlign: 'right', padding: '6px 8px' }}>{fmtMoney(e.allowances)}</td>
                        <td style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>{fmtMoney(e.grossSalary)}</td>
                        <td style={{ textAlign: 'right', padding: '6px 8px', color: '#6B7280' }}>{fmtMoney(e.pfEmployee)}</td>
                        <td style={{ textAlign: 'right', padding: '6px 8px', color: '#6B7280' }}>{fmtMoney(e.esiEmployee)}</td>
                        <td style={{ textAlign: 'right', padding: '6px 8px', color: '#6B7280' }}>{fmtMoney(e.professionalTax)}</td>
                        <td style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 800, color: 'var(--navy)' }}>{fmtMoney(e.netSalary)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p style={{ color: '#9CA3AF', fontSize: 13 }}>No employee entries</p>}
          </td>
        </tr>
      )}
    </>
  );
}

// ── Process Payroll Modal ─────────────────────────────────────────────────────
function ProcessModal({ onClose, onDone }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await processPayroll(Number(month), Number(year));
      toast.success(`Payroll for ${MONTHS[month - 1]} ${year} processed — ${res.data.data?.entries?.length || 0} employees`);
      onDone();
    } catch (err) { toast.error(err.response?.data?.message || 'Processing failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 400, padding: 28 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)', marginBottom: 20 }}>Process Payroll</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#FEF3C7', borderRadius: 8, padding: 12, fontSize: 13, color: '#92400E' }}>
            Calculates salaries based on attendance, applies PF (12%), ESI (0.75% EE), and PT deductions for all active staff.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Month</label>
              <select value={month} onChange={e => setMonth(e.target.value)} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Year</label>
              <select value={year} onChange={e => setYear(e.target.value)} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
                {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Process Payroll</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Trainer Schedule Modal ────────────────────────────────────────────────────
function TrainerScheduleModal({ trainer, onClose }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAppointments({ staffId: trainer.id, limit: 50 })
      .then(r => {
        const d = r.data.data;
        setSessions(Array.isArray(d) ? d : (d?.appointments || []));
      })
      .catch(() => { toast.error('Failed to load sessions'); })
      .finally(() => setLoading(false));
  }, [trainer.id]);

  const todaySessions = sessions.filter(s => isToday(s.startTime || s.scheduledAt));
  const upcomingSessions = sessions.filter(s => {
    const dt = new Date(s.startTime || s.scheduledAt);
    return dt > new Date() && !isToday(s.startTime || s.scheduledAt);
  });
  const completedSessions = sessions.filter(s => s.status === 'COMPLETED');

  const gradient = trainerGradient(trainer.name);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header with gradient */}
        <div style={{ background: gradient, borderRadius: '20px 20px 0 0', padding: '24px 28px 20px', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#fff' }}>
            <X size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {trainer.name[0]?.toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#fff', margin: 0, marginBottom: 4 }}>{trainer.name}</h2>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{trainer.role || 'Trainer'}</div>
              {trainer.specialization?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {trainer.specialization.map(s => (
                    <span key={s} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20 }}>{s}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 28px' }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
            {[
              { label: "Today's Sessions", value: todaySessions.length, color: 'var(--cyan)' },
              { label: 'Upcoming', value: upcomingSessions.length, color: '#3B82F6' },
              { label: 'Completed', value: completedSessions.length, color: '#16A34A' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: 'center', background: '#F9FAFB', borderRadius: 12, padding: '14px 10px', border: '1px solid #F3F4F6' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color, fontFamily: 'var(--font-display)', lineHeight: 1, marginBottom: 4 }}>{value}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Contact & info */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            {trainer.phone && (
              <a href={`tel:${trainer.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '7px 14px', textDecoration: 'none', color: '#047857', fontSize: 13, fontWeight: 600 }}>
                <Phone size={13} /> {trainer.phone}
              </a>
            )}
            {trainer.email && (
              <a href={`mailto:${trainer.email}`} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '7px 14px', textDecoration: 'none', color: '#1D4ED8', fontSize: 13, fontWeight: 600 }}>
                <Mail size={13} /> {trainer.email}
              </a>
            )}
            {trainer.salary && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '7px 14px', color: '#92400E', fontSize: 13, fontWeight: 600 }}>
                <IndianRupee size={13} /> {fmtMoney(trainer.salary)}/month
              </div>
            )}
          </div>

          {trainer.bio && (
            <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontSize: 13, color: '#374151', lineHeight: 1.6, borderLeft: '3px solid var(--cyan)' }}>
              {trainer.bio}
            </div>
          )}

          {trainer.certifications?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Certifications</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {trainer.certifications.map(c => (
                  <span key={c} style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', fontSize: 12, fontWeight: 600, padding: '3px 12px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Award size={11} /> {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sessions list */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF' }}>Loading schedule…</div>
          ) : sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <Calendar size={28} color="#E5E7EB" style={{ display: 'block', margin: '0 auto 8px' }} />
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>No sessions assigned to this trainer</p>
            </div>
          ) : (
            <div>
              {todaySessions.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--cyan)' }} />
                    Today ({todaySessions.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {todaySessions.map(s => <SessionRow key={s.id} s={s} />)}
                  </div>
                </div>
              )}
              {upcomingSessions.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#3B82F6', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6' }} />
                    Upcoming ({upcomingSessions.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {upcomingSessions.slice(0, 10).map(s => <SessionRow key={s.id} s={s} />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SessionRow({ s }) {
  const dt = new Date(s.startTime || s.scheduledAt);
  const today = isToday(s.startTime || s.scheduledAt);
  const sc = { CONFIRMED: { bg: '#F0FDF4', c: '#16A34A' }, SCHEDULED: { bg: '#EFF6FF', c: '#3B82F6' }, COMPLETED: { bg: '#F3F4F6', c: '#6B7280' }, CANCELLED: { bg: '#FEF2F2', c: '#DC2626' }, NO_SHOW: { bg: '#FFFBEB', c: '#D97706' } };
  const style = sc[s.status] || sc.SCHEDULED;
  const classColor = specColor(s.service?.name || '');

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, background: '#FAFAFA', border: '1px solid #F3F4F6' }}>
      <div style={{ width: 3, height: 28, borderRadius: 2, background: classColor, flexShrink: 0 }} />
      <div style={{ width: 52, flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy)', fontFamily: 'var(--font-mono)' }}>{fmtTime(dt)}</div>
        {!today && <div style={{ fontSize: 10, color: '#9CA3AF' }}>{dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {s.customer?.name || 'Walk-in'}
        </div>
        {s.service?.name && <div style={{ fontSize: 11, color: classColor, fontWeight: 600 }}>{s.service.name}</div>}
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: style.bg, color: style.c, flexShrink: 0 }}>
        {s.status}
      </span>
    </div>
  );
}

// ── Trainer Card ──────────────────────────────────────────────────────────────
function TrainerCard({ trainer, sessions, onEdit, onSchedule }) {
  const todaySessions = (sessions || []).filter(s => isToday(s.startTime || s.scheduledAt));
  const upcomingSessions = (sessions || []).filter(s => new Date(s.startTime || s.scheduledAt) > new Date());
  const specs = trainer.specialization || [];
  const gradient = trainerGradient(trainer.name);

  return (
    <div style={{
      background: '#fff', borderRadius: 18, border: '1px solid #E5E7EB',
      overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      transition: 'box-shadow 0.2s, transform 0.15s',
      opacity: trainer.isActive ? 1 : 0.65,
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* Gradient banner */}
      <div style={{ height: 72, background: gradient, position: 'relative' }}>
        {!trainer.isActive && (
          <div style={{ position: 'absolute', top: 10, right: 12, background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>
            INACTIVE
          </div>
        )}
      </div>

      <div style={{ padding: '0 20px 20px', position: 'relative' }}>
        {/* Avatar overlapping banner */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%', background: gradient,
          border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 800, color: '#fff', marginTop: -32, marginBottom: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}>
          {trainer.name[0]?.toUpperCase()}
        </div>

        {/* Name + role */}
        <div style={{ marginBottom: 10 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--navy)', margin: 0, marginBottom: 2 }}>{trainer.name}</h3>
          <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>{trainer.role || 'Trainer'}</div>
          {trainer.department && <div style={{ fontSize: 12, color: '#9CA3AF' }}>{trainer.department}</div>}
        </div>

        {/* Specializations */}
        {specs.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
            {specs.slice(0, 4).map(s => (
              <span key={s} style={{ background: specColor(s) + '18', color: specColor(s), fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                {s}
              </span>
            ))}
            {specs.length > 4 && (
              <span style={{ background: '#F3F4F6', color: '#9CA3AF', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                +{specs.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Bio */}
        {trainer.bio && (
          <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5, marginBottom: 12, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {trainer.bio}
          </p>
        )}

        {/* Session stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <div style={{ background: '#F0F9FF', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--cyan)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{todaySessions.length}</div>
            <div style={{ fontSize: 11, color: '#0891B2', fontWeight: 600, marginTop: 2 }}>Today</div>
          </div>
          <div style={{ background: '#EFF6FF', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#3B82F6', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{upcomingSessions.length}</div>
            <div style={{ fontSize: 11, color: '#3B82F6', fontWeight: 600, marginTop: 2 }}>Upcoming</div>
          </div>
        </div>

        {/* Today's mini schedule */}
        {todaySessions.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Today's Schedule</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {todaySessions.slice(0, 3).map(s => {
                const cc = specColor(s.service?.name || '');
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderRadius: 7, background: '#FAFAFA' }}>
                    <div style={{ width: 3, height: 18, borderRadius: 2, background: cc, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--font-mono)', minWidth: 55 }}>
                      {fmtTime(s.startTime || s.scheduledAt)}
                    </span>
                    {s.service?.name && <span style={{ fontSize: 11, color: cc, fontWeight: 600 }}>{s.service.name}</span>}
                    <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 'auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.customer?.name || 'Walk-in'}
                    </span>
                  </div>
                );
              })}
              {todaySessions.length > 3 && (
                <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', padding: '3px 0' }}>
                  +{todaySessions.length - 3} more sessions
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact info */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {trainer.phone && (
            <a href={`https://wa.me/91${trainer.phone.replace(/\D/g, '').slice(-10)}`} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#047857', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6, padding: '4px 8px', textDecoration: 'none', fontWeight: 600 }}>
              <MessageCircle size={11} /> {trainer.phone}
            </a>
          )}
          {trainer.email && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, padding: '4px 8px', fontWeight: 600 }}>
              <Mail size={11} /> {trainer.email}
            </span>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onSchedule(trainer)} style={{
            flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', background: 'var(--navy)',
            color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <Calendar size={13} /> Schedule
          </button>
          <button onClick={() => onEdit(trainer)} style={{
            flex: 1, padding: '8px 0', borderRadius: 10, border: '1.5px solid var(--border)',
            background: '#fff', color: 'var(--navy)', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <Edit2 size={13} /> Edit
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Trainer / Staff Form Modal ────────────────────────────────────────────────
function StaffFormModal({ isGym, editStaff, onClose, onSaved }) {
  const EMPTY = { name: '', phone: '', email: '', role: '', department: '', salary: '', joinedAt: '', biometricId: '', bio: '', specialization: [], certifications: [] };
  const [form, setForm] = useState(() => editStaff ? {
    name: editStaff.name, phone: editStaff.phone || '', email: editStaff.email || '',
    role: editStaff.role, department: editStaff.department || '',
    salary: editStaff.salary ?? '', joinedAt: editStaff.joinedAt ? editStaff.joinedAt.slice(0, 10) : '',
    biometricId: editStaff.biometricId || '', bio: editStaff.bio || '',
    specialization: editStaff.specialization || [], certifications: editStaff.certifications || [],
  } : EMPTY);
  const [saving, setSaving] = useState(false);
  const [certInput, setCertInput] = useState('');

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const toggleSpec = (s) => setForm(f => ({
    ...f,
    specialization: f.specialization.includes(s) ? f.specialization.filter(x => x !== s) : [...f.specialization, s],
  }));
  const addCert = () => {
    if (!certInput.trim()) return;
    setForm(f => ({ ...f, certifications: [...f.certifications, certInput.trim()] }));
    setCertInput('');
  };

  const save = async () => {
    if (!form.name.trim() || !form.role.trim()) return toast.error('Name and role are required');
    setSaving(true);
    try {
      const payload = {
        ...form,
        salary: form.salary ? parseFloat(form.salary) : null,
        joinedAt: form.joinedAt || null,
        biometricId: form.biometricId || null,
        department: form.department || null,
        bio: form.bio || null,
      };
      if (editStaff) await updateStaff(editStaff.id, payload);
      else await createStaff(payload);
      toast.success(editStaff ? (isGym ? 'Trainer updated' : 'Staff updated') : (isGym ? 'Trainer added' : 'Staff added'));
      onSaved();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 18, padding: 28, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--navy)', fontFamily: 'var(--font-display)' }}>
            {editStaff ? (isGym ? 'Edit Trainer' : 'Edit Staff') : (isGym ? 'Add Trainer' : 'Add Staff')}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {/* Name */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Name *</label>
            <input value={form.name} onChange={set('name')} placeholder={isGym ? 'e.g. Rahul Sharma' : 'Full name'}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>

          {/* Role */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{isGym ? 'Title / Role *' : 'Role *'}</label>
            {isGym ? (
              <select value={form.role} onChange={set('role')} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff', boxSizing: 'border-box' }}>
                <option value="">Select role</option>
                {GYM_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                <option value="custom">Other (type below)</option>
              </select>
            ) : (
              <input value={form.role} onChange={set('role')} placeholder="e.g. Manager, Cashier"
                style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
            )}
          </div>

          {/* Phone */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Phone</label>
            <input type="tel" value={form.phone} onChange={set('phone')} placeholder="10-digit mobile"
              style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Email</label>
            <input type="email" value={form.email} onChange={set('email')}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>

          {/* Department */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{isGym ? 'Department / Zone' : 'Department'}</label>
            <input value={form.department} onChange={set('department')} placeholder={isGym ? 'e.g. Cardio Zone, Pool' : 'Department'}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>

          {/* Salary */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{isGym ? 'Monthly Salary (₹)' : 'Salary'}</label>
            <input type="number" value={form.salary} onChange={set('salary')} placeholder="e.g. 25000"
              style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>

          {/* Join date */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Joining Date</label>
            <input type="date" value={form.joinedAt} onChange={set('joinedAt')}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>

          {/* Biometric ID */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
              <Fingerprint size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />Biometric ID
            </label>
            <input value={form.biometricId} onChange={set('biometricId')} placeholder="Device enrollment ID"
              style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'var(--font-mono)' }} />
          </div>

          {/* Bio (gym only) */}
          {isGym && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Bio / Description</label>
              <textarea value={form.bio} onChange={set('bio')} placeholder="A short intro about the trainer, their approach and experience..."
                rows={3}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.5 }} />
            </div>
          )}

          {/* Specializations (gym only) */}
          {isGym && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Specializations</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {GYM_SPECIALIZATIONS.map(s => {
                  const selected = form.specialization.includes(s);
                  const cc = specColor(s);
                  return (
                    <button key={s} type="button" onClick={() => toggleSpec(s)} style={{
                      padding: '5px 12px', borderRadius: 20, border: selected ? `1.5px solid ${cc}` : '1.5px solid #E5E7EB',
                      background: selected ? cc + '18' : '#fff', color: selected ? cc : '#6B7280',
                      fontSize: 12, fontWeight: selected ? 700 : 500, cursor: 'pointer', transition: 'all 0.12s',
                    }}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Certifications (gym only) */}
          {isGym && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Certifications</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input value={certInput} onChange={e => setCertInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCert(); } }}
                  placeholder="Type and press Enter (e.g. ACE, NASM, CPT)"
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
                <button type="button" onClick={addCert} style={{ padding: '8px 16px', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  Add
                </button>
              </div>
              {form.certifications.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {form.certifications.map(c => (
                    <span key={c} style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Award size={10} /> {c}
                      <button onClick={() => setForm(f => ({ ...f, certifications: f.certifications.filter(x => x !== c) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400E', padding: 0, marginLeft: 2 }}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={saving}>{editStaff ? 'Save Changes' : (isGym ? 'Add Trainer' : 'Add Staff')}</Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function StaffAttendance() {
  const { isMobile } = useBreakpoint();
  const { tenant } = useAuth();
  const { t } = useTranslation();
  const { branchId } = useBranch();
  const isGym = GYM_TYPES.includes(tenant?.businessType);

  const [tab, setTab] = useState(isGym ? 'trainers' : 'attendance');
  const [staffList, setStaffList] = useState([]);
  const [todayData, setTodayData] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [punching, setPunching] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [showDevice, setShowDevice] = useState(false);
  const [reportFrom, setReportFrom] = useState(new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));
  const [reportTo, setReportTo] = useState(new Date().toISOString().slice(0, 10));
  const [runs, setRuns] = useState([]);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [showProcess, setShowProcess] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [scheduleTrainer, setScheduleTrainer] = useState(null);
  const [trainerSearch, setTrainerSearch] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = branchId ? { branchId } : {};
      const [sl, td] = await Promise.all([getStaff(params), getTodayAttendance(params)]);
      setStaffList(sl.data.data || []);
      setTodayData(td.data.data || []);
    } catch { toast.error('Failed to load staff data'); }
    finally { setLoading(false); }
  }, [branchId]);

  const loadSessions = useCallback(async () => {
    if (!isGym) return;
    try {
      const r = await getAppointments({ limit: 200 });
      const d = r.data.data;
      setSessions(Array.isArray(d) ? d : (d?.appointments || []));
    } catch {}
  }, [isGym]);

  const loadReport = async () => {
    try {
      const r = await getAttendanceSummary({ from: reportFrom, to: reportTo });
      setSummaryData(r.data.data || []);
    } catch { toast.error('Failed to load report'); }
  };

  const loadPayroll = useCallback(async () => {
    setPayrollLoading(true);
    try { const res = await getPayrollRuns(); setRuns(res.data.data || []); }
    catch { toast.error('Failed to load payroll'); }
    finally { setPayrollLoading(false); }
  }, []);

  useEffect(() => { loadAll(); loadSessions(); }, [loadAll, loadSessions]);
  useEffect(() => { if (tab === 'report') loadReport(); }, [tab, reportFrom, reportTo]);
  useEffect(() => { if (tab === 'payroll') loadPayroll(); }, [tab, loadPayroll]);

  const present = todayData.filter(s => s.isCurrentlyIn).length;
  const absent = todayData.filter(s => !s.currentStatus || s.currentStatus === 'ABSENT').length;
  const totalHours = todayData.reduce((s, x) => s + (x.hoursWorked || 0), 0).toFixed(1);
  const totalPaid = runs.filter(r => r.status === 'PAID').reduce((s, r) => s + Number(r.totalNet || 0), 0);
  const totalPending = runs.filter(r => r.status !== 'PAID').reduce((s, r) => s + Number(r.totalNet || 0), 0);
  const totalDeductions = runs.reduce((s, r) => s + Number(r.totalDeductions || 0), 0);

  const handlePunch = async (staffId, type) => {
    setPunching(p => ({ ...p, [staffId]: true }));
    try {
      if (type === 'IN') await punchIn({ staffId });
      else await punchOut({ staffId });
      const td = await getTodayAttendance();
      setTodayData(td.data.data || []);
      toast.success(`Punch ${type} recorded`);
    } catch (err) { toast.error(err.response?.data?.message || `Punch ${type} failed`); }
    finally { setPunching(p => ({ ...p, [staffId]: false })); }
  };

  // Trainer sessions lookup
  const getTrainerSessions = (trainer) => sessions.filter(s => {
    const name = s.staff?.name || s.staffName || '';
    return s.staffId === trainer.id || name.toLowerCase() === trainer.name.toLowerCase();
  });

  const filteredStaff = staffList.filter(s => {
    const q = (isGym ? trainerSearch : search).toLowerCase();
    return s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q) ||
      (s.specialization || []).some(sp => sp.toLowerCase().includes(q));
  });

  const activeTrainers = staffList.filter(s => s.isActive);
  const todayTrainers = staffList.filter(s => {
    const trainerSess = getTrainerSessions(s);
    return trainerSess.some(sess => isToday(sess.startTime || sess.scheduledAt));
  });

  const TABS = isGym
    ? [['trainers', 'Trainers'], ['schedule', 'Schedule'], ['attendance', 'Attendance'], ['payroll', 'Payroll'], ['plans', 'Training Plans']]
    : [['attendance', t('staff.attendanceTab')], ['staff', t('staff.staffTab')], ['report', t('staff.reportTab')], ['payroll', 'Payroll']];

  return (
    <div style={{ ...P.wrap(isMobile), maxWidth: 1300, margin: '0 auto' }}>

      {/* Header */}
      <div style={P.head}>
        <div>
          <h1 style={P.h1(isMobile)}>
            {isGym ? 'Trainers' : 'Staff & Payroll'}
          </h1>
          <p style={P.sub}>
            {isGym
              ? `${activeTrainers.length} active trainers · ${todayTrainers.length} on duty today`
              : 'Manage your team, track attendance and run payroll'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {tab === 'payroll' ? (
            <Button onClick={() => setShowProcess(true)}>
              <IndianRupee size={15} style={{ marginRight: 6 }} />Process Payroll
            </Button>
          ) : tab !== 'report' ? (
            <>
              {!isGym && (
                <button onClick={() => setShowDevice(!showDevice)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', border: '1px solid var(--border)', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#374151' }}>
                  <Fingerprint size={15} /> Connect Device
                </button>
              )}
              <button onClick={() => { loadAll(); loadSessions(); }} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, background: '#fff', cursor: 'pointer', color: '#6B7280' }}>
                <RefreshCw size={15} />
              </button>
              <button onClick={() => { setEditStaff(null); setShowForm(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, background: 'var(--navy)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                <Plus size={15} /> {isGym ? 'Add Trainer' : 'Add Staff'}
              </button>
            </>
          ) : null}
        </div>
      </div>

      {tab !== 'payroll' && (
        isGym ? (
          <KpiBar stats={[
            { icon: Users,      label: 'Total Trainers', value: staffList.length,              color: 'var(--navy)' },
            { icon: Activity,   label: 'Active',         value: activeTrainers.length,         color: '#10B981' },
            { icon: Calendar,   label: 'On Duty Today',  value: todayTrainers.length,           color: 'var(--cyan)' },
            { icon: TrendingUp, label: 'Sessions Today', value: sessions.filter(s => isToday(s.startTime || s.scheduledAt)).length, color: '#8B5CF6' },
          ]} />
        ) : (
          <KpiBar stats={[
            { icon: Users,       label: 'Total Staff',   value: staffList.length,  color: 'var(--navy)' },
            { icon: CheckCircle, label: 'Present Today', value: present,           color: '#10B981' },
            { icon: XCircle,     label: 'Absent Today',  value: absent,            color: '#EF4444' },
            { icon: Clock,       label: 'Hours Today',   value: `${totalHours}h`,  color: 'var(--cyan)' },
          ]} />
        )
      )}

      {tab === 'payroll' && (
        <KpiBar stats={[
          { label: 'Total Paid (All Time)', value: fmtMoney(totalPaid),                  color: 'var(--emerald)' },
          { label: 'Pending Payment',       value: fmtMoney(totalPending),               color: '#F59E0B' },
          { label: 'Total Deductions',      value: fmtMoney(totalDeductions),            color: 'var(--navy)' },
          { label: 'Net Payroll',           value: fmtMoney(totalPaid + totalPending),   color: 'var(--cyan)' },
        ]} />
      )}

      {/* Biometric device panel */}
      {showDevice && !isGym && (
        <div style={{ background: 'linear-gradient(135deg, #0F2349 0%, #1B3A6B 100%)', borderRadius: 14, padding: 24, marginBottom: 24, color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Fingerprint size={20} color="var(--cyan)" />
            <span style={{ fontWeight: 700, fontSize: 16 }}>Connect Biometric Device</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase' }}>Device Webhook URL</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <code style={{ background: 'rgba(255,255,255,0.08)', padding: '8px 12px', borderRadius: 8, fontSize: 12, flex: 1, color: 'var(--cyan)', fontFamily: 'monospace' }}>
                  POST /api/v1/attendance/device-punch
                </code>
                <button onClick={() => { navigator.clipboard.writeText('/api/v1/attendance/device-punch'); toast.success('Copied'); }}
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', color: '#fff' }}>
                  <Link2 size={14} />
                </button>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase' }}>Request Body</div>
              <code style={{ background: 'rgba(255,255,255,0.08)', padding: '10px 14px', borderRadius: 8, fontSize: 12, display: 'block', color: '#86EFAC', fontFamily: 'monospace', lineHeight: 1.8 }}>
                {`{ tenantId, biometricId,\n  punchType: "IN"|"OUT" }`}
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, background: 'var(--surface-1)', borderRadius: 10, padding: 4, marginBottom: 24, width: 'fit-content', flexWrap: 'wrap' }}>
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: tab === key ? '#fff' : 'transparent',
            color: tab === key ? 'var(--navy)' : '#9CA3AF',
            boxShadow: tab === key ? 'var(--shadow-sm)' : 'none',
            transition: 'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {/* ═══ TRAINERS TAB (gym only) ════════════════════════════════════════════ */}
      {tab === 'trainers' && isGym && (
        <div>
          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 360, marginBottom: 20 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input value={trainerSearch} onChange={e => setTrainerSearch(e.target.value)}
              placeholder="Search trainers, specializations..."
              style={{ width: '100%', padding: '9px 12px 9px 32px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ height: 380, background: '#F3F4F6', borderRadius: 18, animation: 'pulse 1.4s ease-in-out infinite' }} />
              ))}
              <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16, border: '1px solid var(--border)' }}>
              <Dumbbell size={36} color="#E5E7EB" style={{ display: 'block', margin: '0 auto 12px' }} />
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--navy)', marginBottom: 8 }}>No trainers yet</h3>
              <p style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 20 }}>Add your first trainer to get started</p>
              <Button onClick={() => { setEditStaff(null); setShowForm(true); }}>
                <Plus size={14} style={{ marginRight: 6 }} /> Add Trainer
              </Button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {filteredStaff.map(trainer => (
                <TrainerCard
                  key={trainer.id}
                  trainer={trainer}
                  sessions={getTrainerSessions(trainer)}
                  onEdit={t => { setEditStaff(t); setShowForm(true); }}
                  onSchedule={setScheduleTrainer}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ SCHEDULE TAB (gym only) ════════════════════════════════════════════ */}
      {tab === 'schedule' && isGym && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {staffList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF' }}>No trainers found</div>
            ) : staffList.filter(s => s.isActive).map(trainer => {
              const trainerSess = getTrainerSessions(trainer).filter(s => {
                const dt = new Date(s.startTime || s.scheduledAt);
                return dt >= new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
              }).sort((a, b) => new Date(a.startTime || a.scheduledAt) - new Date(b.startTime || b.scheduledAt));
              const gradient = trainerGradient(trainer.name);
              const todayCount = trainerSess.filter(s => isToday(s.startTime || s.scheduledAt)).length;

              return (
                <div key={trainer.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
                  {/* Trainer header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', background: '#FAFAFA', borderBottom: '1px solid #F3F4F6' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                      {trainer.name[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>{trainer.name}</div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>{trainer.role}</div>
                    </div>
                    {(trainer.specialization || []).slice(0, 3).map(s => (
                      <span key={s} style={{ background: specColor(s) + '18', color: specColor(s), fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{s}</span>
                    ))}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--cyan)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{todayCount}</div>
                      <div style={{ fontSize: 10, color: '#9CA3AF' }}>today</div>
                    </div>
                  </div>

                  {/* Sessions */}
                  {trainerSess.length === 0 ? (
                    <div style={{ padding: '16px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No upcoming sessions</div>
                  ) : (
                    <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {trainerSess.slice(0, 5).map(s => <SessionRow key={s.id} s={s} />)}
                      {trainerSess.length > 5 && (
                        <button onClick={() => setScheduleTrainer(trainer)}
                          style={{ fontSize: 12, color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 0', textAlign: 'left' }}>
                          +{trainerSess.length - 5} more → View all
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ STAFF TAB (non-gym) ════════════════════════════════════════════════ */}
      {tab === 'staff' && !isGym && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff…"
                style={{ width: '100%', padding: '9px 12px 9px 32px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
            </div>
          </div>
          {loading ? <p style={{ color: '#9CA3AF', textAlign: 'center', padding: 40 }}>Loading...</p> : (
            <div style={P.tableWrap}>
              <table style={P.table}>
                <thead style={P.thead}>
                  <tr>
                    {['Name', 'Role / Dept', 'Phone', 'Salary', 'Status', 'Joined', ''].map(h => (
                      <th key={h} style={P.th()}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((s, i) => (
                    <tr key={s.id} style={P.tr(i, filteredStaff.length)}>
                      <td style={P.td()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>{s.name[0]}</div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                        </div>
                      </td>
                      <td style={P.td()}>
                        <div style={{ fontWeight: 500 }}>{s.role}</div>
                        {s.department && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{s.department}</div>}
                      </td>
                      <td style={{ ...P.td(), color: '#6B7280' }}>{s.phone || '—'}</td>
                      <td style={P.td()}>{s.salary ? `₹${Number(s.salary).toLocaleString('en-IN')}` : '—'}</td>
                      <td style={P.td()}>
                        <span style={{ background: s.isActive ? '#D1FAE5' : '#F3F4F6', color: s.isActive ? '#065F46' : '#6B7280', padding: '3px 10px', borderRadius: 10, fontSize: 12, fontWeight: 600 }}>
                          {s.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ ...P.td(), color: '#9CA3AF' }}>{fmtDate(s.joinedAt)}</td>
                      <td style={P.td()}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => { setEditStaff(s); setShowForm(true); }} style={{ padding: '5px 10px', border: '1px solid var(--border)', borderRadius: 6, background: '#fff', cursor: 'pointer' }}><Edit2 size={13} /></button>
                          <button onClick={async () => { if (!confirm(`Delete ${s.name}?`)) return; try { await deleteStaff(s.id); toast.success('Deleted'); loadAll(); } catch (e) { toast.error(e.response?.data?.message || 'Delete failed'); } }} style={{ padding: '5px 10px', border: '1px solid #FECACA', borderRadius: 6, background: '#fff', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredStaff.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#9CA3AF' }}>No staff members found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ ATTENDANCE TAB ════════════════════════════════════════════════════ */}
      {tab === 'attendance' && (
        <div style={{ display: 'grid', gap: 10 }}>
          {loading ? (
            <p style={{ color: '#9CA3AF', textAlign: 'center', padding: 40 }}>Loading…</p>
          ) : todayData.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center', border: '1px solid var(--border)' }}>
              <Users size={32} color="#D1D5DB" style={{ marginBottom: 12 }} />
              <p style={{ color: '#9CA3AF', margin: 0 }}>No {isGym ? 'trainers' : 'staff'} yet. Add {isGym ? 'trainers' : 'staff'} to start tracking attendance.</p>
            </div>
          ) : todayData.map(s => (
            <div key={s.id} style={{
              background: '#fff', borderRadius: 12, padding: '16px 20px',
              border: `1px solid ${s.isCurrentlyIn ? '#D1FAE5' : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
              boxShadow: s.isCurrentlyIn ? '0 0 0 2px rgba(16,185,129,0.12)' : 'none',
            }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: s.isCurrentlyIn ? '#10B981' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: s.isCurrentlyIn ? '#fff' : '#6B7280', flexShrink: 0 }}>
                {s.name[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>{s.name}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>{s.role}{s.department ? ` · ${s.department}` : ''}</div>
              </div>
              <div style={{ textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>First In</div>
                <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{fmtTime(s.firstIn)}</div>
              </div>
              <div style={{ textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>Hours</div>
                <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>{s.hoursWorked}h</div>
              </div>
              <div style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: s.isCurrentlyIn ? '#D1FAE5' : s.currentStatus === 'OUT' ? '#FEF3C7' : '#F3F4F6', color: s.isCurrentlyIn ? '#065F46' : s.currentStatus === 'OUT' ? '#92400E' : '#6B7280' }}>
                {s.isCurrentlyIn ? '● In' : s.currentStatus === 'OUT' ? 'Checked Out' : 'Absent'}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {!s.isCurrentlyIn ? (
                  <button onClick={() => handlePunch(s.id, 'IN')} disabled={punching[s.id]}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: 'none', background: '#10B981', color: '#fff', cursor: punching[s.id] ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, opacity: punching[s.id] ? 0.6 : 1 }}>
                    <LogIn size={13} /> Punch In
                  </button>
                ) : (
                  <button onClick={() => handlePunch(s.id, 'OUT')} disabled={punching[s.id]}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: 'none', background: '#EF4444', color: '#fff', cursor: punching[s.id] ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, opacity: punching[s.id] ? 0.6 : 1 }}>
                    <LogOut size={13} /> Punch Out
                  </button>
                )}
              </div>
              {s.todayLogs?.length > 0 && (
                <div style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 180 }}>
                  {s.todayLogs.map((l, i) => (
                    <span key={i} style={{ background: l.punchType === 'IN' ? '#D1FAE5' : '#FEE2E2', color: l.punchType === 'IN' ? '#065F46' : '#991B1B', padding: '2px 7px', borderRadius: 10, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                      {l.punchType === 'IN' ? '↓' : '↑'} {fmtTime(l.punchTime)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ═══ REPORT TAB ═════════════════════════════════════════════════════════ */}
      {tab === 'report' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>From</label>
              <input type="date" value={reportFrom} onChange={e => setReportFrom(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>To</label>
              <input type="date" value={reportTo} onChange={e => setReportTo(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
            </div>
            <button onClick={loadReport} style={{ padding: '9px 18px', borderRadius: 8, background: 'var(--navy)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              Generate Report
            </button>
          </div>
          {summaryData.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center', border: '1px solid var(--border)', color: '#9CA3AF' }}>
              <BarChart2 size={32} color="#D1D5DB" style={{ marginBottom: 12 }} />
              <p>Select a date range and click Generate Report</p>
            </div>
          ) : (
            <div style={P.tableWrap}>
              <table style={P.table}>
                <thead style={P.thead}>
                  <tr>
                    {[isGym ? 'Trainer' : 'Staff Member', 'Role', 'Present Days', 'Total Hours', 'Avg Hrs/Day'].map(h => (
                      <th key={h} style={P.th()}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summaryData.map((row, i) => (
                    <tr key={row.staff.id} style={P.tr(i, summaryData.length)}>
                      <td style={P.td()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: trainerGradient(row.staff.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>{row.staff.name[0]}</div>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{row.staff.name}</span>
                        </div>
                      </td>
                      <td style={{ ...P.td(), color: '#6B7280' }}>{row.staff.role}</td>
                      <td style={P.td()}>
                        <span style={{ background: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>{row.presentDays}</span>
                      </td>
                      <td style={{ ...P.td(), fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--font-mono)' }}>{row.totalHours}h</td>
                      <td style={{ ...P.td(), color: '#6B7280', fontFamily: 'var(--font-mono)' }}>
                        {row.presentDays > 0 ? (row.totalHours / row.presentDays).toFixed(1) + 'h' : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ PAYROLL TAB ════════════════════════════════════════════════════════ */}
      {tab === 'payroll' && (
        <div>
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#1E40AF', marginBottom: 20 }}>
            <strong>Statutory Deductions (India):</strong> PF — 12% of basic (capped at ₹15,000 basic wage) · ESI — 0.75% employee + 3.25% employer (if gross ≤ ₹21,000) · PT — ₹200/month (if gross &gt; ₹15,000)
          </div>
          <Card style={{ padding: 0 }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>Payroll History</div>
            {payrollLoading ? (
              <p style={{ color: '#9CA3AF', textAlign: 'center', padding: 48 }}>Loading…</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB' }}>
                      {['Period', 'Employees', 'Net Pay', 'Deductions', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map(r => <RunRow key={r.id} run={r} onRefresh={loadPayroll} />)}
                    {runs.length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: '#9CA3AF' }}>
                        <Users size={36} style={{ opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
                        No payroll runs yet.
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ═══ TRAINING PLANS TAB (gym only) ════════════════════════════════════ */}
      {tab === 'plans' && isGym && (
        <TrainingPlans staffList={staffList} currentUser={user} tenant={tenant} />
      )}

      {/* Modals */}
      {showForm && (
        <StaffFormModal
          isGym={isGym}
          editStaff={editStaff}
          onClose={() => { setShowForm(false); setEditStaff(null); }}
          onSaved={() => { setShowForm(false); setEditStaff(null); loadAll(); loadSessions(); }}
        />
      )}
      {showProcess && <ProcessModal onClose={() => setShowProcess(false)} onDone={() => { setShowProcess(false); loadPayroll(); }} />}
      {scheduleTrainer && <TrainerScheduleModal trainer={scheduleTrainer} onClose={() => setScheduleTrainer(null)} />}
    </div>
  );
}

